'use client';

import React from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Container, Title } from '@/shared/components';
import { Button } from '@/shared/components/ui';
import { Copy, Gift, Send, Share2, Sparkles, Users } from 'lucide-react';

export default function ReferralPage() {
  const [code, setCode] = React.useState<string | null>(null);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    axios
      .get('/api/bonus/referral')
      .then(({ data }) => {
        setCode(data.code);
        setCount(data.referralsCount);
      })
      .catch(() => toast.error('Не удалось загрузить реферальную ссылку'));
  }, []);

  const link =
    code && typeof window !== 'undefined' ? `${window.location.origin}/?ref=${code}` : '';

  const copy = () => {
    navigator.clipboard.writeText(link);
    toast.success('Ссылка скопирована');
  };

  const shareText = `Закажи пиццу в Next Pizza по моей ссылке — получишь 100 бонусов на первый заказ! ${link}`;
  const tgShare = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Закажи пиццу в Next Pizza — 100 бонусов на первый заказ!')}`;
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <Container className="my-10 max-w-2xl">
      <Title text="Пригласи друга" className="font-extrabold text-[28px] mb-2" />
      <p className="text-muted-foreground mb-6">
        Поделись своей ссылкой — получи <b>50 бонусов</b>, когда друг сделает первый заказ.
        Другу — <b>100 бонусов</b> на старт.
      </p>

      <div className="rounded-2xl p-6 bg-gradient-to-br from-amber-400 to-orange-500 text-white mb-6 shadow-lg">
        <div className="flex items-center gap-2 mb-3 font-bold opacity-90">
          <Gift size={18} /> Ваша реферальная ссылка
        </div>
        <div className="bg-white/20 rounded-lg p-3 mb-3 font-mono text-sm break-all">
          {link || 'Загружаем...'}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={copy}
            className="h-11 rounded-lg bg-white text-orange-600 font-bold flex items-center justify-center gap-1.5 hover:bg-amber-50 transition"
          >
            <Copy size={16} /> Копировать
          </button>
          <a
            href={tgShare}
            target="_blank"
            rel="noreferrer"
            className="h-11 rounded-lg bg-white/20 hover:bg-white/30 font-bold flex items-center justify-center gap-1.5 transition"
          >
            <Send size={16} /> Telegram
          </a>
          <a
            href={whatsappShare}
            target="_blank"
            rel="noreferrer"
            className="h-11 rounded-lg bg-white/20 hover:bg-white/30 font-bold flex items-center justify-center gap-1.5 transition"
          >
            <Share2 size={16} /> WhatsApp
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Users size={14} /> Приглашено друзей
          </div>
          <div className="text-3xl font-extrabold">{count}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Sparkles size={14} /> Заработано бонусов
          </div>
          <div className="text-3xl font-extrabold">{count * 50}</div>
        </div>
      </div>

      <div className="rounded-xl border p-4 text-sm">
        <div className="font-bold mb-2">Как это работает:</div>
        <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
          <li>Друг переходит по вашей ссылке и регистрируется</li>
          <li>Ему сразу начисляется <b className="text-foreground">100 бонусов</b> на первый заказ</li>
          <li>После его первого оплаченного заказа вы получаете <b className="text-foreground">50 бонусов</b></li>
          <li>1 бонус = 1 TJS, списать можно до 50% от стоимости заказа</li>
        </ol>
      </div>
    </Container>
  );
}
