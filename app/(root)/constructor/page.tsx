import { prisma } from "@/back/prisma/prisma-client";
import { Container, PizzaConstructor, Title } from "@/shared/components/shared";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next Pizza | Конструктор пиццы",
};

export default async function ConstructorPage() {
  try {
    const [pizzas, allIngredients] = await Promise.all([
      prisma.product.findMany({
        where: { categoryId: 1 },
        include: { items: true, ingredients: true },
        orderBy: { id: "asc" },
      }),
      prisma.ingredient.findMany(),
    ]);

    return (
      <Container className="mt-10 pb-20">
        <Title text="Собери свою пиццу" size="xl" className="font-black mb-2" />
        <p className="text-muted-foreground mb-8 text-base">
          Выбери основу, размер, тип теста и добавь любимые ингредиенты
        </p>
        <PizzaConstructor pizzas={pizzas} allIngredients={allIngredients} />
      </Container>
    );
  } catch (error) {
    console.error("[ConstructorPage]", error);
    return (
      <Container className="mt-10 pb-20">
        <p className="text-muted-foreground">
          Не удалось загрузить конструктор. Попробуйте позже.
        </p>
      </Container>
    );
  }
}
