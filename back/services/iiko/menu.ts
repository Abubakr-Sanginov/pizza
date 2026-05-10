import { prisma } from '@/back/prisma/prisma-client';

import { iikoRequest } from './client';
import { IIKO_CONFIG, isIikoEnabled } from './config';

interface IikoNomenclatureProduct {
  id: string;
  name: string;
  type: 'dish' | 'good' | 'modifier' | string;
  parentGroup?: string | null;
  imageLinks?: string[];
  sizePrices?: Array<{ price?: { currentPrice?: number } }>;
}

interface IikoNomenclatureGroup {
  id: string;
  name: string;
  parentGroup?: string | null;
}

interface IikoNomenclatureResponse {
  groups: IikoNomenclatureGroup[];
  products: IikoNomenclatureProduct[];
}

const FALLBACK_INGREDIENT_IMAGE =
  'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A22FA54A81411E9AFA69C1FE796';
const FALLBACK_PRODUCT_IMAGE =
  'https://media.dodostatic.net/image/r:292x292/11EE7D610D2925109AB2E1C9213386BB.webp';

export interface MenuSyncSummary {
  categoriesCreated: number;
  ingredientsUpserted: number;
  productsCreated: number;
  productItemsUpserted: number;
  errors: string[];
}

export async function syncMenu(organizationIdOverride?: string): Promise<MenuSyncSummary> {
  if (!isIikoEnabled()) throw new Error('iiko disabled (no IIKO_API_LOGIN)');
  const organizationId = organizationIdOverride || IIKO_CONFIG.defaultOrganizationId;
  if (!organizationId) throw new Error('IIKO_ORGANIZATION_ID is not defined');

  const data = await iikoRequest<IikoNomenclatureResponse>('/nomenclature', { organizationId });
  if (!data?.groups || !data?.products) throw new Error('iiko returned empty nomenclature');

  const summary: MenuSyncSummary = {
    categoriesCreated: 0,
    ingredientsUpserted: 0,
    productsCreated: 0,
    productItemsUpserted: 0,
    errors: [],
  };

  const existingCategories = await prisma.category.findMany();
  const categoryByName = new Map(existingCategories.map((c) => [c.name.toLowerCase(), c]));
  const categoryIdByIikoGroup = new Map<string, number>();

  for (const group of data.groups) {
    const existing = categoryByName.get(group.name.toLowerCase());
    if (existing) {
      categoryIdByIikoGroup.set(group.id, existing.id);
    } else {
      const created = await prisma.category.create({ data: { name: group.name } });
      summary.categoriesCreated++;
      categoryByName.set(group.name.toLowerCase(), created);
      categoryIdByIikoGroup.set(group.id, created.id);
    }
  }

  const ingredientByIikoId = new Map(
    (await prisma.ingredient.findMany({ where: { iikoId: { not: null } } })).map((i) => [i.iikoId!, i]),
  );
  const ingredientByName = new Map(
    (await prisma.ingredient.findMany()).map((i) => [i.name.toLowerCase(), i]),
  );

  const productItemByIikoId = new Map(
    (await prisma.productItem.findMany({ where: { iikoId: { not: null } } })).map((p) => [p.iikoId!, p]),
  );
  const productByName = new Map(
    (await prisma.product.findMany()).map((p) => [p.name.toLowerCase(), p]),
  );

  for (const prod of data.products) {
    try {
      const price = prod.sizePrices?.[0]?.price?.currentPrice ?? 0;
      const imageUrl = prod.imageLinks?.[0] || '';

      if (prod.type === 'modifier') {
        const existing = ingredientByIikoId.get(prod.id) || ingredientByName.get(prod.name.toLowerCase());
        if (existing) {
          await prisma.ingredient.update({
            where: { id: existing.id },
            data: { iikoId: prod.id, price, ...(imageUrl ? { imageUrl } : {}) },
          });
        } else {
          await prisma.ingredient.create({
            data: { iikoId: prod.id, name: prod.name, price, imageUrl: imageUrl || FALLBACK_INGREDIENT_IMAGE },
          });
        }
        summary.ingredientsUpserted++;
        continue;
      }

      if (prod.type !== 'dish' && prod.type !== 'good') continue;

      const categoryId = (prod.parentGroup && categoryIdByIikoGroup.get(prod.parentGroup)) || existingCategories[0]?.id;
      if (!categoryId) {
        summary.errors.push(`No category for product ${prod.name}`);
        continue;
      }

      const existingItem = productItemByIikoId.get(prod.id);
      if (existingItem) {
        await prisma.productItem.update({ where: { id: existingItem.id }, data: { price } });
        await prisma.product.update({
          where: { id: existingItem.productId },
          data: { name: prod.name, ...(imageUrl ? { imageUrl } : {}) },
        });
        summary.productItemsUpserted++;
        continue;
      }

      const existingProduct = productByName.get(prod.name.toLowerCase());
      if (existingProduct) {
        await prisma.productItem.create({
          data: { iikoId: prod.id, price, productId: existingProduct.id },
        });
        summary.productItemsUpserted++;
        continue;
      }

      const created = await prisma.product.create({
        data: {
          name: prod.name,
          categoryId,
          imageUrl: imageUrl || FALLBACK_PRODUCT_IMAGE,
          items: { create: [{ iikoId: prod.id, price }] },
        },
      });
      productByName.set(created.name.toLowerCase(), created);
      summary.productsCreated++;
      summary.productItemsUpserted++;
    } catch (e: any) {
      summary.errors.push(`${prod.name}: ${e?.message ?? 'unknown'}`);
    }
  }

  return summary;
}

export interface StopListSyncSummary {
  totalStopped: number;
  appliedToProductItems: number;
}

export async function syncStopList(organizationIdOverride?: string): Promise<StopListSyncSummary> {
  if (!isIikoEnabled()) throw new Error('iiko disabled (no IIKO_API_LOGIN)');
  const organizationId = organizationIdOverride || IIKO_CONFIG.defaultOrganizationId;
  if (!organizationId) throw new Error('IIKO_ORGANIZATION_ID is not defined');

  const data = await iikoRequest<{ terminalGroupStopLists?: Array<{ items?: Array<{ productId: string; balance: number }> }> }>(
    '/stop_lists',
    { organizationIds: [organizationId] },
  );

  const stoppedIds = new Set<string>();
  for (const group of data.terminalGroupStopLists || []) {
    for (const item of group.items || []) {
      if (item.balance <= 0) stoppedIds.add(item.productId);
    }
  }

  if (stoppedIds.size === 0) return { totalStopped: 0, appliedToProductItems: 0 };

  const result = await prisma.productItem.updateMany({
    where: { iikoId: { in: Array.from(stoppedIds) } },
    data: { priceOld: null },
  });

  return { totalStopped: stoppedIds.size, appliedToProductItems: result.count };
}
