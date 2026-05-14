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
    className: 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30',
  },
  VEGETARIAN: {
    label: { ru: 'Вегетар.', en: 'Veggie', tg: 'Вегетарианӣ' },
    emoji: '🥗',
    className: 'bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-500/30',
  },
  SPICY: {
    label: { ru: 'Острое', en: 'Spicy', tg: 'Тунд' },
    emoji: '🌶️',
    className: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
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
    className: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
  },
};

export const ALL_PRODUCT_TAGS = Object.keys(PRODUCT_TAGS) as ProductTag[];

export function isProductTag(value: string): value is ProductTag {
  return value in PRODUCT_TAGS;
}
