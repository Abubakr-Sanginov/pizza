'use client';

import React from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { Loader2, Wallet, CheckCircle2, XCircle } from 'lucide-react';

function MockYooKassaPageInner() {
  const params = useSearchParams();
  const orderId = params.get('order_id') || '';
  const amount = params.get('amount') || '0.00';
  const returnUrl = params.get('return_url') || '/';

  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState<'paid' | 'failed' | null>(null);

  const callMockCallback = async (success: boolean) => {
    setBusy(true);
    try {
      await axios.post('/api/payments/yookassa/callback', {
        event: success ? 'payment.succeeded' : 'payment.canceled',
        object: {
          id: `MOCK_${Date.now()}`,
          status: success ? 'succeeded' : 'canceled',
          amount: { value: amount, currency: 'RUB' },
          metadata: { orderId: Number(orderId) },
        },
      });
      setDone(success ? 'paid' : 'failed');
      setTimeout(() => {
        window.location.href = returnUrl;
      }, 1500);
    } catch (e) {
      alert('Ошибка симуляции: ' + (e as any).message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-zinc-900 dark:to-zinc-800 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-xl p-6 border-2 border-violet-200 dark:border-violet-900">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b">
          <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Wallet className="text-violet-600" />
          </div>
          <div>
            <div className="font-extrabold text-lg">YooKassa (MOCK)</div>
            <div className="text-xs text-violet-700 dark:text-violet-400">
              Тестовый режим — реальные деньги не списываются
            </div>
          </div>
        </div>

        {done === 'paid' && (
          <div className="flex items-center gap-2 text-green-600 font-bold py-8 justify-center">
            <CheckCircle2 /> Оплата прошла. Переадресация...
          </div>
        )}

        {done === 'failed' && (
          <div className="flex items-center gap-2 text-red-600 font-bold py-8 justify-center">
            <XCircle /> Платёж отклонён. Переадресация...
          </div>
        )}

        {!done && (
          <>
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Заказ:</span>
                <span className="font-mono">#{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Сумма:</span>
                <span className="font-extrabold text-lg">{amount} TJS</span>
              </div>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-500 leading-relaxed">
              На реальной странице YooKassa здесь форма оплаты (банковская карта, СБП, ЮMoney).
              В моке симулируем результат.
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => callMockCallback(true)}
                disabled={busy}
                className="h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
                Симулировать успешную оплату
              </button>
              <button
                onClick={() => callMockCallback(false)}
                disabled={busy}
                className="h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle size={18} /> Симулировать отказ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function MockYooKassaPage() {
  return (
    <React.Suspense fallback={null}>
      <MockYooKassaPageInner />
    </React.Suspense>
  );
}
