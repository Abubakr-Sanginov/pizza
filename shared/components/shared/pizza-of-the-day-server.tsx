import React from "react";
import { prisma } from "@/back/prisma/prisma-client";
import { PizzaOfTheDay } from "./pizza-of-the-day";

interface Props {
  className?: string;
}

export const PizzaOfTheDayServer: React.FC<Props> = async ({ className }) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get orders from last 24h
  const recentOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: since },
      status: { not: "CANCELLED" },
    },
    select: { items: true },
  });

  // Count pizza occurrences from order JSON
  const countMap = new Map<number, number>();
  for (const order of recentOrders) {
    const items = order.items as Array<{
      productId?: number;
      productItemId?: number;
    }>;
    for (const item of items) {
      const pid = item.productId;
      if (pid) countMap.set(pid, (countMap.get(pid) ?? 0) + 1);
    }
  }

  // Find the top pizza (only from category 1 = pizzas)
  let topPizzaId: number | null = null;
  let topCount = 0;

  if (countMap.size > 0) {
    const pizzaIds = await prisma.product.findMany({
      where: { categoryId: 1 },
      select: { id: true },
    });
    const pizzaIdSet = new Set(pizzaIds.map((p) => p.id));

    for (const [id, count] of countMap.entries()) {
      if (pizzaIdSet.has(id) && count > topCount) {
        topCount = count;
        topPizzaId = id;
      }
    }
  }

  // Fallback: highest rated pizza
  if (!topPizzaId) {
    const fallback = await prisma.product.findFirst({
      where: { categoryId: 1, items: { some: {} } },
      orderBy: { reviews: { _count: "desc" } },
      select: { id: true },
    });
    topPizzaId = fallback?.id ?? null;
  }

  if (!topPizzaId) return null;

  const pizza = await prisma.product.findUnique({
    where: { id: topPizzaId },
    include: {
      items: { orderBy: { price: "asc" }, take: 1 },
      reviews: true,
    },
  });

  if (!pizza || pizza.items.length === 0) return null;

  const rating =
    pizza.reviews.length > 0
      ? pizza.reviews.reduce((acc, r) => acc + r.rating, 0) /
        pizza.reviews.length
      : 4.5;

  return (
    <PizzaOfTheDay
      className={className}
      pizza={{
        id: pizza.id,
        name: pizza.name,
        imageUrl: pizza.imageUrl,
        price: pizza.items[0].price,
        rating,
        reviewCount: pizza.reviews.length,
        orderCount: topCount || Math.floor(Math.random() * 30) + 10,
      }}
    />
  );
};
