import { calcTotalPizzaPrice } from './calc-total-pizza-price';
import { Ingredient, ProductItem } from '@prisma/client';
import { PizzaSize, PizzaType, mapPizzaType } from '../constants/pizza';

export const getPizzaDetails = (
  type: PizzaType,
  size: PizzaSize,
  items: ProductItem[],
  ingredients: Ingredient[],
  selectedIngredients: Set<number>,
  t?: any,
) => {
  const totalPrice = calcTotalPizzaPrice(type, size, items, ingredients, selectedIngredients);

  const typeName = t ? (type === 1 ? t('cart.traditional') : t('cart.thin')) : (type === 1 ? 'традиционная' : 'тонкая');
  const cm = t ? t('cart.cm') : 'см';
  const pizzaLabel = t ? t('cart.pizza') : 'пицца';

  const textDetaills = `${size} ${cm}, ${typeName} ${pizzaLabel}`;

  return { totalPrice, textDetaills };
};
