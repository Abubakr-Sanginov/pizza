import React from "react";
import { SectionHeader } from "./section-header";
import { ProductCard } from "./product-card";
import { prisma } from "@/back/prisma/prisma-client";

interface Props {
  className?: string;
}

export const TopProducts: React.FC<Props> = async ({ className }) => {
  try {
    let products: any[] = [];
    let topQueries: any[] = [];

    try {

      if (prisma.searchQuery) {
        topQueries = await prisma.searchQuery.findMany({
          take: 10,
          orderBy: { count: "desc" },
        });
      }
    } catch (error) {
      console.error("Prisma searchQuery error:", error);
    }

    if (topQueries.length > 0) {
      const queryNames = topQueries.map((q: any) => q.query);
      products = await prisma.product.findMany({
        where: {
          name: { in: queryNames, not: "Своя пицца" },
          items: { some: {} },
        },
        include: {
          items: true,
          ingredients: true,
          reviews: { include: { user: true } },
        },
        take: 4,
      });
    }

    if (products.length < 4) {
      const reviewedProducts = await prisma.product.findMany({
        where: {
          id: { notIn: products.map((p: any) => p.id) },
          name: { not: "Своя пицца" },
        },
        include: {
          items: true,
          ingredients: true,
          reviews: { include: { user: true } },
        },
        take: 4 - products.length,
        orderBy: { reviews: { _count: "desc" } },
      });
      products = [...products, ...reviewedProducts];
    }

    if (products.length < 4) {
      const additionalProducts = await prisma.product.findMany({
        where: {
          id: { notIn: products.map((p: any) => p.id) },
          name: { not: "Своя пицца" },
        },
        include: {
          items: true,
          ingredients: true,
          reviews: { include: { user: true } },
        },
        take: 4 - products.length,
      });
      products = [...products, ...additionalProducts];
    }

    if (products.length === 0) return null;

    return (
      <div className={className}>
        <SectionHeader title="Популярное сейчас" className="mb-5" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-[40px]">
          {products.map((product: any) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              imageUrl={product.imageUrl}
              gifUrl={product.gifUrl}
              price={product.items[0]?.price || 0}
              ingredients={product.ingredients}
              reviews={product.reviews}
            />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error("[TopProducts]", error);
    return null;
  }
};
