'use client';

import React from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Button, Container, Title } from '@/shared/components';
import { AlertTriangle, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';

const STARS_FEE_PERCENT = Number(process.env.NEXT_PUBLIC_STARS_FEE_PERCENT || '43');

export default function PaymentPendingPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const methodParam = params.get('method');
  const method: 'STARS' | 'TRANSFER' | 'ALIF' =
    methodParam === 'STARS' ? 'STARS' : methodParam === 'ALIF' ? 'ALIF' : 'TRANSFER';

  const [deepLink, setDeepLink] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string>('PENDING');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (method === 'ALIF') {
      axios
        .post('/api/payments/alif/init', { orderId: Number(id) })
        .then(({ data }) => {
          if (!data.url) {
            setError('Не удалось получить ссылку Алиф');
            return;
          }
          window.location.href = data.url;
        })
        .catch((e) => setError(e?.response?.data?.error ?? 'Не удалось создать платёж Алиф'));
      return;
    }

    axios
      .post('/api/payments/telegram/init', { orderId: Number(id), method })
      .then(({ data }) => {
        if (!data.deepLink || !data.botUsername) {
          setError('Платёжный бот не настроен. Обратитесь в поддержку.');
          return;
        }
        setDeepLink(data.deepLink);
      })
      .catch((e) => setError(e?.response?.data?.error ?? 'Не удалось создать платёж'));
  }, [id, method]);

  React.useEffect(() => {
    const t = setInterval(async () => {
      try {
        const { data } = await axios.get(`/api/orders/${id}/payment-status`);
        setStatus(data.paymentStatus);
        if (data.paymentStatus === 'PAID') {
          clearInterval(t);
          router.replace(`/order-success/${id}`);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(t);
  }, [id, router]);

  return (
    <Container className="mt-10 max-w-2xl">
      <Title text={`Оплата заказа #${id}`} className="font-extrabold mb-6 text-[28px]" />

      {method === 'STARS' && (
        <div className="flex gap-2 p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed space-y-1">
            <p>
              Telegram удерживает <b>30%</b> комиссии с каждой оплаты звёздами. К сумме заказа
              добавлено <b>+{STARS_FEE_PERCENT}%</b>, чтобы после удержания нам пришла полная стоимость.
            </p>
            <p>Формула: сумма ÷ (1 − 0,30) ≈ сумма × 1,43.</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border p-6 flex flex-col gap-4">
        {error ? (
          <div className="text-destructive">{error}</div>
        ) : status === 'PAID' ? (
          <div className="flex items-center gap-3 text-green-600 font-bold">
            <CheckCircle2 /> Оплата получена! Переадресация...
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="animate-spin" />
              {status === 'AWAITING_CONFIRMATION'
                ? 'Чек получен. Ожидаем подтверждения администратора...'
                : 'Откройте Telegram и завершите оплату'}
            </div>

            {deepLink && (
              <Button asChild className="h-12 rounded-xl font-bold">
                <a href={deepLink} target="_blank" rel="noreferrer">
                  Открыть Telegram <ExternalLink className="w-4 ml-2" />
                </a>
              </Button>
            )}

            <p className="text-xs text-muted-foreground">
              После оплаты эта страница автоматически обновится.
            </p>
          </>
        )}
      </div>
    </Container>
  );
}
