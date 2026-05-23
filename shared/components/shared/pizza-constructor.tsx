"use client";

import React from "react";
import { Ingredient, Product, ProductItem } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "@/shared/lib/utils";
import { PizzaImage } from "./pizza-image";
import { GroupVariants } from "./group-variants";
import { IngredientItem } from "./ingredient-item";
import { Title } from "./title";
import { Button } from "../ui";
import {
  PizzaSize,
  PizzaType,
  pizzaSizes,
  pizzaTypes,
} from "@/shared/constants/pizza";
import { usePizzaOptions } from "@/shared/hooks";
import { getPizzaDetails } from "@/shared/lib";
import { useCartStore } from "@/shared/store/cart";
import { useTranslation } from "react-i18next";

interface Props {
  pizzas: (Product & { items: ProductItem[]; ingredients: Ingredient[] })[];
  allIngredients: Ingredient[];
  className?: string;
}

export const PizzaConstructor: React.FC<Props> = ({
  pizzas,
  allIngredients,
  className,
}) => {
  const { t } = useTranslation();
  const [selectedPizzaIndex, setSelectedPizzaIndex] = React.useState(0);
  const [addingToCart, setAddingToCart] = React.useState(false);

  const selectedPizza = pizzas[selectedPizzaIndex];

  const {
    size,
    type,
    selectedIngredients,
    availableSizes,
    currentItemId,
    setSize,
    setType,
    addIngredient,
  } = usePizzaOptions(selectedPizza?.items ?? []);

  const { totalPrice, textDetaills } = getPizzaDetails(
    type,
    size,
    selectedPizza?.items ?? [],
    allIngredients,
    selectedIngredients,
    t,
  );

  const { addCartItem } = useCartStore();

  const handleAdd = async () => {
    if (!currentItemId) return;
    setAddingToCart(true);
    try {
      await addCartItem({
        productItemId: currentItemId,
        ingredients: Array.from(selectedIngredients),
      });
      toast.success("Пицца добавлена в корзину!");
    } catch {
      toast.error("Не удалось добавить в корзину");
    } finally {
      setAddingToCart(false);
    }
  };

  if (!selectedPizza) return null;

  return (
    <div className={cn("flex flex-col xl:flex-row gap-6 xl:gap-10", className)}>
      {/* ─── Left panel ─── */}
      <div className="flex-1 flex flex-col items-center gap-6 rounded-3xl glass p-6 xl:p-8">
        {/* Pizza preview */}
        <PizzaImage
          imageUrl={selectedPizza.imageUrl ?? "/logo.png"}
          size={size}
        />

        {/* Size & type selectors */}
        <div className="w-full max-w-[400px] flex flex-col gap-3">
          <GroupVariants
            items={availableSizes}
            value={String(size)}
            onClick={(value) => setSize(Number(value) as PizzaSize)}
          />
          <GroupVariants
            items={pizzaTypes}
            value={String(type)}
            onClick={(value) => setType(Number(value) as PizzaType)}
          />
        </div>

        {/* Live price */}
        <div className="w-full max-w-[400px] rounded-2xl bg-muted px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
              {selectedPizza.name}
            </p>
            <p className="text-sm text-muted-foreground">{textDetaills}</p>
          </div>
          <span className="text-2xl font-black text-primary">
            {totalPrice} TJS
          </span>
        </div>
      </div>

      {/* ─── Right panel ─── */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Pizza base selector */}
        <div className="rounded-3xl glass p-5">
          <Title text="Основа пиццы" size="sm" className="font-bold mb-4" />
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {pizzas.map((pizza, index) => (
              <motion.button
                key={pizza.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedPizzaIndex(index)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-colors min-w-[110px] cursor-pointer bg-card",
                  index === selectedPizzaIndex
                    ? "border-primary shadow-md"
                    : "border-transparent hover:border-border",
                )}
              >
                <img
                  src={pizza.imageUrl ?? "/logo.png"}
                  alt={pizza.name}
                  className="w-16 h-16 object-contain"
                />
                <span className="text-xs font-semibold text-center leading-tight line-clamp-2">
                  {pizza.name}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Ingredients grid */}
        <div className="rounded-3xl glass p-5 flex-1">
          <Title
            text="Дополнительные ингредиенты"
            size="sm"
            className="font-bold mb-4"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1 scrollbar">
            <AnimatePresence>
              {allIngredients.map((ingredient, i) => (
                <motion.div
                  key={ingredient.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                >
                  <IngredientItem
                    name={ingredient.name}
                    price={ingredient.price}
                    imageUrl={ingredient.imageUrl}
                    active={selectedIngredients.has(ingredient.id)}
                    onClick={() => addIngredient(ingredient.id)}
                    className="w-full"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Add to cart */}
        <Button
          onClick={handleAdd}
          loading={addingToCart}
          disabled={!currentItemId || addingToCart}
          className="btn-gradient h-[55px] text-base rounded-2xl w-full font-bold"
        >
          Добавить в корзину · {totalPrice} TJS
        </Button>
      </div>
    </div>
  );
};
