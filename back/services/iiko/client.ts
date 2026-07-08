import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import { IIKO_CONFIG } from './config';

export class IikoError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly correlationId?: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'IikoError';
  }
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;
let pendingTokenPromise: Promise<string> | null = null;

const TOKEN_TTL_MS = 50 * 60 * 1000;
const TOKEN_SAFETY_BUFFER_MS = 60 * 1000;

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildHttp(): AxiosInstance {
  return axios.create({
    baseURL: IIKO_CONFIG.apiBase,
    timeout: IIKO_CONFIG.requestTimeoutMs,
    headers: { 'Content-Type': 'application/json' },
  });
}

const http = buildHttp();

async function fetchAccessToken(): Promise<string> {
  const useNewApi = IIKO_CONFIG.appId && IIKO_CONFIG.appSecret;

  if (!useNewApi && !IIKO_CONFIG.apiLogin) {
    throw new IikoError('IIKO_API_LOGIN or IIKO_APP_ID + IIKO_APP_SECRET is not set');
  }

  try {
    let data: any;

    if (useNewApi) {
      const res = await http.post('/access_token', {
        appId: IIKO_CONFIG.appId,
        appSecret: IIKO_CONFIG.appSecret,
      });
      data = res.data;
    } else {
      const res = await http.post('/access_token', { apiLogin: IIKO_CONFIG.apiLogin });
      data = res.data;
    }

    if (!data?.token || typeof data.token !== 'string') {
      throw new IikoError('iiko returned empty access token', 200, data?.correlationId);
    }
    return data.token;
  } catch (e: any) {
    const status = e?.response?.status;
    const correlationId = e?.response?.data?.correlationId;
    const detail = e?.response?.data?.errorDescription || e?.message || 'unknown';
    throw new IikoError(`iiko auth failed: ${detail}`, status, correlationId, e);
  }
}

export async function getAccessToken(force = false): Promise<string> {
  const now = Date.now();
  if (!force && cachedToken && cachedToken.expiresAt - TOKEN_SAFETY_BUFFER_MS > now) {
    return cachedToken.value;
  }
  if (pendingTokenPromise) return pendingTokenPromise;

  pendingTokenPromise = fetchAccessToken()
    .then((token) => {
      cachedToken = { value: token, expiresAt: Date.now() + TOKEN_TTL_MS };
      return token;
    })
    .finally(() => {
      pendingTokenPromise = null;
    });

  return pendingTokenPromise;
}

export function invalidateAccessToken() {
  cachedToken = null;
}

export interface IikoRequestOptions {
  retries?: number;
  initialBackoffMs?: number;
}

export async function iikoRequest<T = any>(
  path: string,
  body: Record<string, unknown> = {},
  options: IikoRequestOptions = {},
): Promise<T> {
  const retries = options.retries ?? IIKO_CONFIG.maxRetries;
  const initialBackoff = options.initialBackoffMs ?? 400;

  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const token = await getAccessToken(attempt > 0 && lastErr instanceof IikoError && lastErr.status === 401);
      const config: AxiosRequestConfig = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const response: AxiosResponse<T> = await http.post(path, body, config);
      return response.data;
    } catch (e: any) {
      lastErr = e;
      const status = e?.response?.status;
      const correlationId = e?.response?.data?.correlationId;
      const detail = e?.response?.data?.errorDescription || e?.response?.data?.message || e?.message;

      if (status === 401) {
        invalidateAccessToken();
        if (attempt < retries) continue;
      }

      const isNetworkErr = !status;
      const retryable = isNetworkErr || (status !== undefined && RETRYABLE_STATUS.has(status));
      if (retryable && attempt < retries) {
        const delay = initialBackoff * 2 ** attempt + Math.floor(Math.random() * 100);
        await sleep(delay);
        continue;
      }

      throw new IikoError(
        `iiko ${path} failed: ${detail || 'unknown error'}`,
        status,
        correlationId,
        e,
      );
    }
  }

  throw lastErr instanceof Error ? lastErr : new IikoError('iiko request failed: exhausted retries');
}
