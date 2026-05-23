"use client";

import { cn } from "@/shared/lib/utils";
import { useCategoryStore } from "@/shared/store/category";
import { Category } from "@prisma/client";
import React from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  items: Category[];
  className?: string;
}

export const Categories: React.FC<Props> = ({ items, className }) => {
  const categoryActiveId = useCategoryStore((state) => state.activeId);
  const { t, i18n } = useTranslation();

  const categoryMapping: Record<string, string> = {
    Пиццы: "menu.pizzas",
    Завтрак: "menu.breakfast",
    Закуски: "menu.snacks",
    Коктейли: "menu.cocktails",
    Напитки: "menu.drinks",
  };

  return (
    <div
      className={cn(
        "inline-flex gap-1 glass p-1 rounded-2xl overflow-x-auto scrollbar-hide",
        className,
      )}
    >
      {items.map((cat, index) => {
        const isActive = categoryActiveId === cat.id;
        const currentLang = i18n.language;

        let translatedName = cat.name;

        if (currentLang === "en" && cat.nameEn) {
          translatedName = cat.nameEn;
        } else if (currentLang === "tg" && cat.nameTg) {
          translatedName = cat.nameTg;
        } else {
          const translationKey = categoryMapping[cat.name] || cat.name;
          translatedName = translationKey.includes(".")
            ? t(translationKey)
            : cat.name;
        }

        return (
          <a
            className={cn(
              "flex items-center font-bold h-10 rounded-xl px-5 relative whitespace-nowrap transition-colors duration-200",
              isActive
                ? "text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
            href={`/#${cat.name}`}
            key={index}
          >
            <AnimatePresence initial={false}>
              {isActive && (
                <motion.span
                  key={`active-bg-${cat.id}`}
                  className="absolute inset-0 rounded-xl btn-gradient"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>
            <span className="relative z-10 text-sm tracking-tight">
              {translatedName}
            </span>
          </a>
        );
      })}
    </div>
  );
};
