export const IIKO_CONFIG = {
  apiBase: process.env.IIKO_API_URL || 'https://api-ru.iiko.services/api/1',
  apiLogin: process.env.IIKO_API_LOGIN || '',
  defaultOrganizationId: process.env.IIKO_ORGANIZATION_ID || '',
  defaultTerminalGroupId: process.env.IIKO_TERMINAL_GROUP_ID || '',
  paymentTypeIdCash: process.env.IIKO_PAYMENT_TYPE_ID_CASH || '',
  paymentTypeIdCard: process.env.IIKO_PAYMENT_TYPE_ID_CARD || '',
  webhookSecret: process.env.IIKO_WEBHOOK_SECRET || '',
  requestTimeoutMs: Number(process.env.IIKO_REQUEST_TIMEOUT_MS) || 15000,
  maxRetries: Number(process.env.IIKO_MAX_RETRIES) || 2,
};

export function isIikoEnabled(): boolean {
  return Boolean(IIKO_CONFIG.apiLogin);
}
