"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Star, Timer } from "lucide-react";
import { BlurImage } from "./blur-image";

interface HeroPizza {
  id: number;
  name: string;
  imageUrl: string;
  price?: number;
  rating?: number | null;
}

interface Props {
  pizza?: HeroPizza | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export const Hero: React.FC<Props> = ({ pizza }) => {
  return (
    <section className="grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_460px] items-center gap-10 lg:gap-14">
      {/* Текстовая стопка */}
      <div className="flex flex-col items-start gap-5">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[11px] font-bold tracking-widest uppercase text-primary"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Свежее меню
        </motion.p>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="text-[40px] md:text-[60px] font-black tracking-tight leading-[0.98] text-balance"
        >
          Любимая пицца{" "}
          <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
            у тебя дома
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed"
        >
          Готовим из свежих ингредиентов и доставляем горячей. Выбирай, что
          сегодня будет на столе.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
          className="flex flex-wrap items-center gap-2 mt-1"
        >
          {pizza?.price != null && (
            <Link
              href={`/product/${pizza.id}`}
              className="inline-flex items-center gap-2 px-4 h-11 rounded-2xl btn-gradient border-0 text-sm font-extrabold"
            >
              <Flame size={16} strokeWidth={2.5} />
              {pizza.name} · от {pizza.price} TJS
            </Link>
          )}
          <a
            href="#Пиццы"
            className="inline-flex items-center gap-2 px-4 h-11 rounded-2xl bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-extrabold text-secondary-foreground"
          >
            <Timer size={16} strokeWidth={2.5} />
            Смотреть меню
          </a>
          {pizza?.rating ? (
            <span className="inline-flex items-center gap-1.5 px-3 h-11 rounded-2xl glass text-sm font-bold">
              <Star size={15} className="text-yellow-400 fill-yellow-400" />
              {Number(pizza.rating).toFixed(1)}
            </span>
          ) : null}
        </motion.div>
      </div>

      {/* Устье печи: арка с пиццей */}
      {pizza && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative hidden lg:block justify-self-end"
        >
          {/* жар в устье печи */}
          <div
            aria-hidden
            className="absolute inset-x-6 top-16 bottom-0 rounded-t-full bg-[radial-gradient(ellipse_at_bottom,_hsl(22_100%_50%_/_0.28),_hsl(5_70%_51%_/_0.10)_55%,_transparent_75%)]"
          />
          <div className="relative w-[340px] xl:w-[420px] aspect-[4/5] rounded-t-full glass-strong shadow-soft-lg overflow-hidden flex items-end justify-center">
            <BlurImage
              src={pizza.imageUrl}
              alt={pizza.name}
              className="w-[78%] aspect-square mb-[8%]"
              imageClassName="w-full h-full object-contain drop-shadow-2xl"
            />
            {pizza.price != null && (
              <div className="absolute top-8 right-6 px-4 py-2.5 rounded-2xl glass-strong shadow-soft-lg rotate-3">
                <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground leading-none">
                  Пицца дня
                </p>
                <p className="font-display text-xl leading-tight mt-1">
                  {pizza.price} TJS
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </section>
  );
};
