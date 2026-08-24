export type ProductTag =
  | 'VEGAN'
  | 'VEGETARIAN'
  | 'SPICY'
  | 'GLUTEN_FREE'
  | 'LACTOSE_FREE'
  | 'NEW'
  | 'HIT';

interface TagMeta {
  label: { ru: string; en: string; tg: string };
  emoji: string;
  className: string;
}

export const PRODUCT_TAGS: Record<ProductTag, TagMeta> = {
  VEGAN: {
    label: { ru: 'Веган', en: 'Vegan', tg: 'Веган' },
    emoji: '🌱',
    className: 'bg-[hsl(var(--basil)/0.12)] text-[hsl(var(--basil))] border-[hsl(var(--basil)/0.35)]',
  },
  VEGETARIAN: {
    label: { ru: 'Вегетар.', en: 'Veggie', tg: 'Вегетарианӣ' },
    emoji: '🥗',
    className: 'bg-[hsl(var(--basil)/0.12)] text-[hsl(var(--basil))] border-[hsl(var(--basil)/0.35)]',
  },
  SPICY: {
    label: { ru: 'Острое', en: 'Spicy', tg: 'Тунд' },
    emoji: '🌶️',
    className: 'bg-[hsl(var(--tomato)/0.12)] text-[hsl(var(--tomato))] border-[hsl(var(--tomato)/0.35)]',
  },
  GLUTEN_FREE: {
    label: { ru: 'Без глютена', en: 'Gluten-free', tg: 'Бе глютен' },
    emoji: '🌾',
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  LACTOSE_FREE: {
    label: { ru: 'Без лактозы', en: 'Lactose-free', tg: 'Бе лактоза' },
    emoji: '🥛',
    className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  },
  NEW: {
    label: { ru: 'Новинка', en: 'New', tg: 'Нав' },
    emoji: '✨',
    className: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  },
  HIT: {
    label: { ru: 'Хит', en: 'Hit', tg: 'Хит' },
    emoji: '🔥',
    className: 'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.35)]',
  },
};

export const ALL_PRODUCT_TAGS = Object.keys(PRODUCT_TAGS) as ProductTag[];

export function isProductTag(value: string): value is ProductTag {
  return value in PRODUCT_TAGS;
}
