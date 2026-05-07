import { PizzaSize, PizzaType, mapPizzaType } from '../constants/pizza';
import { CartStateItem } from './get-cart-details';

export const getCartItemDetails = (
  ingredients: CartStateItem['ingredients'],
  pizzaType?: PizzaType,
  pizzaSize?: PizzaSize,
  t?: any,
): string => {
  const details = [];

  if (pizzaSize && pizzaType) {
    const typeName = t ? (pizzaType === 1 ? t('cart.traditional') : t('cart.thin')) : (pizzaType === 1 ? 'традиционное' : 'тонкое');
    const cm = t ? t('cart.cm') : 'см';
    details.push(`${typeName} ${pizzaSize} ${cm}`);
  }

  if (ingredients) {
    details.push(...ingredients.map((ingredient) => ingredient.name));
  }

  return details.join(', ');
};
