'use client';

import React from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Sparkles, Gift, TrendingUp, ChevronRight, Crown } from 'lucide-react';

const LEVEL_INFO: Record<string, { name: string; color: string; next?: number }> = {
  BRONZE: { name: 'Бронза', color: 'from-orange-400 to-amber-600', next: 500 },
  SILVER: { name: 'Серебро', color: 'from-zinc-300 to-zinc-500', next: 2000 },
  GOLD: { name: 'Золото', color: 'from-yellow-400 to-amber-500', next: 5000 },
  PLATINUM: { name: 'Платина', color: 'from-cyan-400 to-blue-600' },
};

export const BonusCard: React.FC = () => {
  const [data, setData] = React.useState<{
    balance: number;
    lifetimeEarn: number;
    lifetimeSpent: number;
    level: string;
  } | null>(null);

  React.useEffect(() => {
    axios
      .get('/api/bonus/me')
      .then(({ data }) => setData(data))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const lvl = LEVEL_INFO[data.level] ?? LEVEL_INFO.BRONZE;
  const progressPercent = lvl.next ? Math.min(100, (data.lifetimeEarn / lvl.next) * 100) : 100;

  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br ${lvl.color} text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 font-bold opacity-90">
          <Crown size={18} /> {lvl.name}
        </div>
        <Link
          href="/profile/referral"
          className="text-xs font-bold bg-white/20 hover:bg-white/30 transition px-3 py-1.5 rounded-full flex items-center gap-1"
        >
          Пригласить друга <ChevronRight size={12} />
        </Link>
      </div>

      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-xs opacity-80">Баланс бонусов</div>
          <div className="text-4xl font-extrabold flex items-center gap-2">
            <Sparkles size={26} />
            {data.balance}
          </div>
        </div>
        <div className="text-right text-xs opacity-80">
          <div>1 бонус = 1 TJS</div>
          <div>До 50% оплаты</div>
        </div>
      </div>

      {lvl.next && (
        <div>
          <div className="flex justify-between text-[11px] opacity-80 mb-1">
            <span>{data.lifetimeEarn} / {lvl.next}</span>
            <span className="flex items-center gap-1">
              <TrendingUp size={11} />
              {lvl.next - data.lifetimeEarn} до след. уровня
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-white" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-3 pt-3 border-t border-white/20 text-xs">
        <div>
          <Gift size={12} className="inline mr-1" /> Заработано: {data.lifetimeEarn}
        </div>
        <div>Потрачено: {data.lifetimeSpent}</div>
      </div>
    </div>
  );
};
