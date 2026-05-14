'use client';

import React from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Ticket, Trash2 } from 'lucide-react';

import { Button, Input } from '@/shared/components/ui';

interface PromoRow {
  id: number;
  code: string;
  description: string | null;
  type: 'PERCENT' | 'FIXED';
  discount: number;
  minAmount: number;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

interface Props {
  initial: PromoRow[];
}

export const PromoAdmin: React.FC<Props> = ({ initial }) => {
  const [list, setList] = React.useState<PromoRow[]>(initial);
  const [code, setCode] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [type, setType] = React.useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discount, setDiscount] = React.useState(10);
  const [minAmount, setMinAmount] = React.useState(0);
  const [usageLimit, setUsageLimit] = React.useState('');
  const [expiresAt, setExpiresAt] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  const onCreate = async () => {
    if (!code.trim()) return toast.error('Введите код');
    setCreating(true);
    try {
      const body: any = {
        code: code.trim(),
        description: description.trim() || undefined,
        type,
        discount: Number(discount),
        minAmount: Number(minAmount) || 0,
        active: true,
      };
      if (usageLimit) body.usageLimit = Number(usageLimit);
      if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();

      const { data } = await axios.post<PromoRow>('/api/promo', body);
      setList((prev) => [data, ...prev]);
      setCode('');
      setDescription('');
      setDiscount(10);
      setMinAmount(0);
      setUsageLimit('');
      setExpiresAt('');
      toast.success('Промокод создан');
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Ошибка');
    } finally {
      setCreating(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm('Удалить промокод?')) return;
    try {
      await axios.delete(`/api/promo/${id}`);
      setList((prev) => prev.filter((p) => p.id !== id));
      toast.success('Удалено');
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const toggleActive = async (p: PromoRow) => {
    try {
      const { data } = await axios.patch<PromoRow>(`/api/promo/${p.id}`, { active: !p.active });
      setList((prev) => prev.map((x) => (x.id === p.id ? data : x)));
    } catch {
      toast.error('Ошибка');
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Create form */}
      <div className="bg-card text-card-foreground p-8 rounded-3xl border border-border shadow-sm">
        <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
          <Ticket size={20} className="text-primary" />
          Создать промокод
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Код</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="PIZZA20"
              className="uppercase tracking-wider font-bold"
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Описание (опционально)</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="20% на пиццы..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Тип скидки</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'PERCENT' | 'FIXED')}
              className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="PERCENT">Процент (%)</option>
              <option value="FIXED">Фиксированная сумма (TJS)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Размер скидки {type === 'PERCENT' ? '(%)' : '(TJS)'}
            </label>
            <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Мин. сумма заказа (TJS)</label>
            <Input type="number" value={minAmount} onChange={(e) => setMinAmount(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Лимит использований (опционально)</label>
            <Input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Срок действия (опционально)</label>
            <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <Button onClick={onCreate} loading={creating} size="lg" className="px-10">
            Создать
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold text-muted-foreground">Код</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">Скидка</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">Мин. сумма</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">Использовано</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">Действует до</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">Статус</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                  Промокодов пока нет
                </td>
              </tr>
            )}
            {list.map((p) => (
              <tr key={p.id} className="border-b border-border hover:bg-muted/50">
                <td className="px-6 py-4 font-bold tracking-wider">{p.code}</td>
                <td className="px-6 py-4">
                  {p.type === 'PERCENT' ? `${p.discount}%` : `${p.discount} TJS`}
                </td>
                <td className="px-6 py-4 text-muted-foreground">{p.minAmount > 0 ? `${p.minAmount} TJS` : '—'}</td>
                <td className="px-6 py-4 text-muted-foreground">
                  {p.usedCount}
                  {p.usageLimit != null ? ` / ${p.usageLimit}` : ''}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {p.expiresAt ? new Date(p.expiresAt).toLocaleString('ru-RU') : '—'}
                </td>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => toggleActive(p)}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      p.active
                        ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                    {p.active ? 'Активен' : 'Выключен'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(p.id)}
                    className="text-destructive hover:bg-destructive/10">
                    <Trash2 size={18} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
