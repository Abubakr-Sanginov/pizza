"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Star, Trophy, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";
import { Button } from "../ui";

interface PizzaOfTheDayData {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  rating: number | null;
  reviewCount: number;
  orderCount: number;
}

interface Props {
  pizza: PizzaOfTheDayData;
  className?: string;
}

function useCountdown() {
  const [timeLeft, setTimeLeft] = React.useState({ h: 0, m: 0, s: 0 });

  React.useEffect(() => {
    function calc() {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.floor((midnight.getTime() - now.getTime()) / 1000);
      setTimeLeft({
        h: Math.floor(diff / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
      });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

function Digit({ value }: { value: number }) {
  const str = String(value).padStart(2, "0");
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={str}
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="inline-block tabular-nums font-black text-lg leading-none"
      >
        {str}
      </motion.span>
    </AnimatePresence>
  );
}

export const PizzaOfTheDay: React.FC<Props> = ({ pizza, className }) => {
  const { h, m, s } = useCountdown();

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn("relative overflow-hidden rounded-3xl", className)}
    >
      {}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-primary/10 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(22_100%_50%_/_0.15),_transparent_60%)]" />

      <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10 p-6 md:p-8 glass border border-primary/20 rounded-3xl">
        {}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary to-orange-500 text-white shadow-soft">
          <Trophy size={13} strokeWidth={2.5} />
          <span className="text-[11px] font-black tracking-widest uppercase">
            Пицца дня
          </span>
        </div>

        {}
        <div className="relative flex-shrink-0 mt-6 md:mt-0">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl scale-75" />
          <motion.img
            src={pizza.imageUrl}
            alt={pizza.name}
            className="relative w-[180px] h-[180px] md:w-[220px] md:h-[220px] object-contain drop-shadow-2xl"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          {}
          <motion.div
            className="absolute -top-2 -right-2 w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-soft"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Flame size={18} className="text-white" />
          </motion.div>
        </div>

        {}
        <div className="flex-1 flex flex-col items-center md:items-start gap-3 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            {pizza.name}
          </h2>

          {}
          <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
            {pizza.rating != null ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-sm">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="font-bold">{pizza.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({pizza.reviewCount})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-sm text-muted-foreground">
                <Star size={14} />
                <span>Ещё нет оценок</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-sm">
              <Flame size={14} className="text-primary" />
              <span className="font-bold">{pizza.orderCount}</span>
              <span className="text-muted-foreground">заказов за 24ч</span>
            </div>
          </div>

          {}
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-muted-foreground">от</span>
            <span className="text-3xl font-black tracking-tight">
              {pizza.price}
            </span>
            <span className="text-base font-bold text-muted-foreground">
              TJS
            </span>
          </div>

          {}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-1">
            {}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass border border-border/50">
              <Clock
                size={14}
                className="text-muted-foreground flex-shrink-0"
              />
              <span className="text-xs text-muted-foreground">
                Обновится через
              </span>
              <div className="flex items-center gap-0.5 text-foreground">
                <Digit value={h} />
                <span className="font-black text-lg text-muted-foreground mx-0.5">
                  :
                </span>
                <Digit value={m} />
                <span className="font-black text-lg text-muted-foreground mx-0.5">
                  :
                </span>
                <Digit value={s} />
              </div>
            </div>

            <Link href={`/product/${pizza.id}`}>
              <Button className="btn-gradient h-11 px-6 rounded-2xl font-extrabold text-sm border-0 w-full sm:w-auto">
                Заказать сейчас
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
