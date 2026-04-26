import { Ingredient, Product, ProductItem, Review, User } from '@prisma/client';

export type ReviewWithUser = Review & { user: User };

export type ProductWithRelations = Product & {
  items: ProductItem[];
  ingredients: Ingredient[];
  reviews: ReviewWithUser[];
};
