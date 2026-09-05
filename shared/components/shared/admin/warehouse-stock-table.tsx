'use client';

import React from 'react';
import Image from 'next/image';
import { PackageX, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, Input, Skeleton } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { useTranslation } from 'react-i18next';
import { updateStock } from '@/back/actions/warehouse-actions';

interface ProductItemRow {
  id: number;
  size: number | null;
  price: number;
  stock: number | null;
}

interface ProductRow {
  id: number;
  name: string;
  imageUrl: string;
  categoryName: string;
  items: ProductItemRow[];
}

interface Props {
  products: ProductRow[];
  className?: string;
}

export const WarehouseStockTable: React.FC<Props> = ({ products, className }) => {
  const { t } = useTranslation();
  const [draft, setDraft] = React.useState<Record<number, string>>(() =>
    Object.fromEntries(products.flatMap((p) => p.items.map((it) => [it.id, it.stock === null ? '' : String(it.stock)]))),
  );
  const [savingId, setSavingId] = React.useState<number | null>(null);

  const itemsById = React.useMemo(
    () => Object.fromEntries(products.flatMap((p) => p.items.map((it) => [it.id, it]))) as Record<number, ProductItemRow>,
    [products],
  );

  const totalStock = React.useMemo(
    () => products.reduce((sum, p) => sum + p.items.reduce((s, it) => s + (it.stock ?? 0), 0), 0),
    [products],
  );
  const outOfStockCount = React.useMemo(
    () => products.filter((p) => p.items.length > 0 && p.items.every((it) => it.stock !== null && it.stock <= 0)).length,
    [products],
  );

  const handleSave = async (productId: number, itemId: number) => {
    const raw = draft[itemId];
    const parsed = raw === '' ? null : Number(raw);
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
      toast.error(t('admin.warehouses.invalidValue'));
      return;
    }
    setSavingId(itemId);
    try {
      await updateStock(productId, parsed);
      toast.success(t('admin.warehouses.updated'));
      setDraft((prev) => ({ ...prev, [itemId]: parsed === null ? '' : String(parsed) }));
    } catch {
      toast.error(t('admin.warehouses.updateError'));
    } finally {
      setSavingId(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="bg-card text-card-foreground rounded-2xl border border-border p-10 text-center text-muted-foreground">
        {t('admin.warehouses.empty')}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
        <span>
          {t('admin.warehouses.totalStock')}: <b className="text-foreground">{totalStock}</b>
        </span>
        <span>·</span>
        <span className={cn(outOfStockCount > 0 && 'text-destructive')}>
          {t('admin.warehouses.outOfStockCount')}: <b>{outOfStockCount}</b>
        </span>
      </div>

      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="px-6 py-4 font-bold text-muted-foreground">{t('admin.common.id')}</th>
              <th className="px-6 py-4 font-bold text-muted-foreground">{t('admin.common.photo')}</th>
              <th className="px-6 py-4 font-bold text-muted-foreground">{t('admin.common.name')}</th>
              <th className="px-6 py-4 font-bold text-muted-foreground">{t('admin.products.category')}</th>
              <th className="px-6 py-4 font-bold text-muted-foreground">{t('admin.warehouses.stock')}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const isOut = product.items.length > 0 && product.items.every((it) => it.stock !== null && it.stock <= 0);
              return (
                <tr
                  key={product.id}
                  className={cn(
                    'border-b border-border last:border-b-0 hover:bg-muted transition-colors',
                    isOut && 'opacity-60',
                  )}>
                  <td className="px-6 py-4 text-muted-foreground">#{product.id}</td>
                  <td className="px-6 py-4">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={48}
                      height={48}
                      unoptimized
                      className={cn('w-12 h-12 object-cover rounded-lg', isOut && 'grayscale')}
                    />
                  </td>
                  <td className="px-6 py-4 font-bold">
                    <span className="flex items-center gap-2">
                      {product.name}
                      {isOut && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-xs font-semibold">
                          <PackageX size={12} />
                          {t('admin.warehouses.outOfStock')}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{product.categoryName}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {product.items.length === 0 && (
                        <span className="text-muted-foreground text-sm">{t('admin.warehouses.noItems')}</span>
                      )}
                      {product.items.map((it) => (
                        <div key={it.id} className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            {it.size ? `Ø ${it.size}` : `#${it.id}`}
                          </span>
                          <Input
                            type="number"
                            min={0}
                            placeholder="∞"
                            className="w-20 h-9"
                            value={draft[it.id]}
                            onChange={(e) => setDraft((prev) => ({ ...prev, [it.id]: e.target.value }))}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            title={t('admin.common.save')}
                            disabled={savingId === it.id || (draft[it.id] ?? '') === String(it.stock ?? '')}
                            onClick={() => handleSave(product.id, it.id)}>
                            {savingId === it.id ? (
                              <Skeleton className="w-4 h-4 rounded-full" />
                            ) : (
                              <Save size={16} />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
