"use client";

import React from "react";
import { Ingredient, Product, ProductItem } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "@/shared/lib/utils";
import { GroupVariants } from "./group-variants";
import { Title } from "./title";
import { Button } from "../ui";
import { PizzaSize, PizzaType, pizzaTypes } from "@/shared/constants/pizza";
import { usePizzaOptions } from "@/shared/hooks";
import { calcTotalPizzaPrice } from "@/shared/lib/calc-total-pizza-price";
import { useCartStore } from "@/shared/store/cart";
import { X, ShoppingCart, GripVertical } from "lucide-react";

// ─── Single position per ingredient, Fibonacci spiral for even coverage ────────
// Each ingredient gets ONE position. The spiral guarantees no clustering.
function buildPizzaPositions(n: number) {
  const golden = 137.508 * (Math.PI / 180);
  return Array.from({ length: n }, (_, i) => {
    // r goes from 12% (center) to 76% (near crust), skipping the very center
    const t = (i + 0.5) / n;
    const r = 12 + t * 64;
    const angle = i * golden;
    const x = 50 + r * Math.cos(angle);
    const y = 50 + r * Math.sin(angle);
    const rotate = Math.round((i * 97 + 13) % 360) - 180;
    return { top: `${y.toFixed(1)}%`, left: `${x.toFixed(1)}%`, rotate };
  });
}

const PIZZA_POSITIONS = buildPizzaPositions(20);

interface Props {
  pizzas: (Product & { items: ProductItem[]; ingredients: Ingredient[] })[];
  allIngredients: Ingredient[];
  className?: string;
}

interface GhostState {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  imageUrl: string;
  isDrag: boolean;
}

const DRAG_THRESHOLD = 8;

function isPointerOverCircle(el: HTMLElement, x: number, y: number): boolean {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const radius = r.width / 2;
  return Math.hypot(x - cx, y - cy) <= radius;
}

// ─── CSS dough base ────────────────────────────────────────────────────────────
const DoughBase: React.FC<{ diameter: number }> = ({ diameter }) => (
  <div
    className="absolute inset-0 rounded-full"
    style={{
      // Outer crust ring
      background: `
        radial-gradient(circle at 50% 50%,
          #f5deb3 0%,
          #e8c87a 52%,
          #d4a843 58%,
          #c8922a 63%,
          #b8791a 68%,
          #a06010 72%,
          #8b4513 76%,
          #7a3a0e 80%,
          #6b3010 84%,
          transparent 88%
        )
      `,
    }}
  >
    {/* Inner dough surface */}
    <div
      className="absolute rounded-full"
      style={{
        inset: `${diameter * 0.08}px`,
        background: `
          radial-gradient(ellipse at 38% 32%,
            #fef3d0 0%,
            #fde8a0 25%,
            #f5d070 50%,
            #e8b840 70%,
            #d4a030 85%,
            #c08820 100%
          )
        `,
      }}
    />
    {/* Dough texture bumps */}
    <div
      className="absolute rounded-full"
      style={{
        inset: `${diameter * 0.08}px`,
        background: `
          radial-gradient(circle at 30% 25%, rgba(255,255,255,0.25) 0%, transparent 20%),
          radial-gradient(circle at 70% 20%, rgba(255,255,255,0.15) 0%, transparent 15%),
          radial-gradient(circle at 55% 65%, rgba(255,255,255,0.12) 0%, transparent 18%),
          radial-gradient(circle at 20% 60%, rgba(255,255,255,0.10) 0%, transparent 14%),
          radial-gradient(circle at 80% 70%, rgba(255,255,255,0.14) 0%, transparent 16%),
          radial-gradient(circle at 45% 40%, rgba(200,140,30,0.2) 0%, transparent 25%)
        `,
      }}
    />
    {/* Crust texture */}
    <div
      className="absolute rounded-full"
      style={{
        inset: 0,
        background: `
          radial-gradient(circle at 50% 50%,
            transparent 74%,
            rgba(255,200,100,0.3) 76%,
            rgba(180,100,20,0.4) 80%,
            rgba(120,60,10,0.5) 84%,
            transparent 88%
          )
        `,
      }}
    />
    {/* Light reflection on crust */}
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        inset: 0,
        background: `
          radial-gradient(ellipse at 35% 20%,
            rgba(255,240,180,0.4) 0%,
            transparent 40%
          )
        `,
      }}
    />
  </div>
);

// ─── Topping layer: single piece per ingredient at spiral position ─────────────
const ToppingLayer: React.FC<{
  ingredient: Ingredient;
  slotIndex: number;
  onRemove: () => void;
}> = ({ ingredient, slotIndex, onRemove }) => {
  const pos = PIZZA_POSITIONS[slotIndex % PIZZA_POSITIONS.length];
  const IMG = 64;
  return (
    <motion.div
      key={ingredient.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 group/topping"
      style={{ pointerEvents: "none" }}
    >
      <motion.div
        initial={{ scale: 0, rotate: pos.rotate - 40, opacity: 0 }}
        animate={{ scale: 1, rotate: pos.rotate, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        style={{
          position: "absolute",
          top: pos.top,
          left: pos.left,
          marginTop: -IMG / 2,
          marginLeft: -IMG / 2,
          width: IMG,
          height: IMG,
          zIndex: 10 + slotIndex,
          filter: `drop-shadow(0 3px 8px rgba(0,0,0,0.65))
                   drop-shadow(0 1px 3px rgba(160,60,0,0.5))
                   saturate(1.35) brightness(0.9) contrast(1.12)`,
        }}
      >
        <img
          src={ingredient.imageUrl}
          alt={ingredient.name}
          draggable={false}
          style={{
            width: IMG,
            height: IMG,
            objectFit: "contain",
            display: "block",
          }}
        />
      </motion.div>

      {/* Remove button */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/topping:opacity-100 transition-opacity shadow-lg z-[200]"
        style={{ pointerEvents: "auto" }}
      >
        <X size={12} strokeWidth={3} />
      </button>
    </motion.div>
  );
};

// ─── Pizza canvas ──────────────────────────────────────────────────────────────
interface PizzaCanvasProps {
  isBlankDough: boolean;
  baseImageUrl: string;
  diameter: number;
  isDragOver: boolean;
  droppedIngredients: number[];
  allIngredients: Ingredient[];
  onRemove: (id: number) => void;
  pizzaRef: React.RefObject<HTMLDivElement>;
}

const PizzaCanvas: React.FC<PizzaCanvasProps> = ({
  isBlankDough,
  baseImageUrl,
  diameter,
  isDragOver,
  droppedIngredients,
  allIngredients,
  onRemove,
  pizzaRef,
}) => (
  <div
    className="relative flex items-center justify-center flex-shrink-0"
    style={{ width: diameter + 64, height: diameter + 64 }}
  >
    {/* Guide rings */}
    <div
      className="absolute rounded-full border-dashed border-2 border-border/25 pointer-events-none"
      style={{ width: diameter + 52, height: diameter + 52 }}
    />
    <div
      className="absolute rounded-full border-dotted border-2 border-border/15 pointer-events-none"
      style={{ width: diameter + 20, height: diameter + 20 }}
    />

    {/* Drop highlight */}
    <AnimatePresence>
      {isDragOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.93 }}
          className="absolute rounded-full border-4 border-dashed border-primary/80 z-30 pointer-events-none"
          style={{
            width: diameter + 8,
            height: diameter + 8,
            boxShadow: "0 0 30px rgba(var(--primary), 0.3)",
          }}
        />
      )}
    </AnimatePresence>

    {/* Plate shadow */}
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: diameter + 20,
        height: diameter + 20,
        background:
          "radial-gradient(ellipse at 42% 38%, rgba(0,0,0,0.4) 0%, transparent 65%)",
        filter: "blur(20px)",
        transform: "translateY(14px)",
        zIndex: 0,
      }}
    />

    {/* Pizza circle */}
    <motion.div
      ref={pizzaRef}
      animate={{ scale: isDragOver ? 1.025 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative rounded-full overflow-hidden"
      style={{
        width: diameter,
        height: diameter,
        zIndex: 1,
        boxShadow:
          "0 10px 50px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 -6px 16px rgba(0,0,0,0.25)",
      }}
    >
      {isBlankDough ? (
        <DoughBase diameter={diameter} />
      ) : (
        <img
          src={baseImageUrl}
          alt="pizza base"
          className="absolute inset-0 w-full h-full object-cover select-none"
          draggable={false}
        />
      )}

      {/* Vignette depth */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.22) 100%)",
          zIndex: 2,
        }}
      />
      {/* Light reflection */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 35% 25%, rgba(255,230,160,0.2) 0%, transparent 50%)",
          zIndex: 3,
        }}
      />

      {/* Toppings */}
      <AnimatePresence>
        {droppedIngredients.map((id, idx) => {
          const ing = allIngredients.find((i) => i.id === id);
          if (!ing) return null;
          return (
            <ToppingLayer
              key={id}
              ingredient={ing}
              slotIndex={idx}
              onRemove={() => onRemove(id)}
            />
          );
        })}
      </AnimatePresence>
    </motion.div>

    {/* Drop hint */}
    <AnimatePresence>
      {droppedIngredients.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-xs text-muted-foreground text-center whitespace-nowrap pointer-events-none"
        >
          Нажми или перетащи ингредиент на пиццу
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

// ─── Main ──────────────────────────────────────────────────────────────────────
export const PizzaConstructor: React.FC<Props> = ({
  pizzas,
  allIngredients,
  className,
}) => {
  const [selectedPizzaIndex, setSelectedPizzaIndex] = React.useState(0);
  const [addingToCart, setAddingToCart] = React.useState(false);
  const [droppedIngredients, setDroppedIngredients] = React.useState<number[]>(
    [],
  );
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [ghost, setGhost] = React.useState<GhostState | null>(null);
  const pizzaRef = React.useRef<HTMLDivElement>(null);
  // Track ghost in a ref so event listeners always see latest value
  const ghostRef = React.useRef<GhostState | null>(null);
  const droppedRef = React.useRef<number[]>([]);

  React.useEffect(() => {
    ghostRef.current = ghost;
  }, [ghost]);
  React.useEffect(() => {
    droppedRef.current = droppedIngredients;
  }, [droppedIngredients]);

  // Synthetic items for blank dough — all 3 sizes × 2 types enabled
  // Price is taken from the cheapest matching item across all pizzas, or 0
  const blankDoughItems = React.useMemo(() => {
    const allItems = pizzas.flatMap((p) => p.items);
    const getPrice = (size: number, type: number) =>
      allItems.find((it) => it.size === size && it.pizzaType === type)?.price ??
      0;
    return [
      { id: -20, size: 20, pizzaType: 1, price: getPrice(20, 1) },
      { id: -21, size: 20, pizzaType: 2, price: getPrice(20, 2) },
      { id: -30, size: 30, pizzaType: 1, price: getPrice(30, 1) },
      { id: -31, size: 30, pizzaType: 2, price: getPrice(30, 2) },
      { id: -40, size: 40, pizzaType: 1, price: getPrice(40, 1) },
      { id: -41, size: 40, pizzaType: 2, price: getPrice(40, 2) },
    ] as any[];
  }, [pizzas]);

  // index 0 = blank dough, 1+ = real pizzas
  const allBases = [
    {
      id: -1,
      name: "Пустое тесто",
      imageUrl: "",
      items: blankDoughItems,
      isBlank: true,
    },
    ...pizzas.map((p) => ({ ...p, isBlank: false })),
  ];
  const selectedBase = allBases[selectedPizzaIndex];
  const itemsForOptions =
    selectedPizzaIndex === 0 ? blankDoughItems : (selectedBase as any).items;

  const {
    size,
    type,
    selectedIngredients,
    availableSizes,
    currentItemId,
    setSize,
    setType,
    addIngredient,
  } = usePizzaOptions(itemsForOptions);

  const totalPrice = calcTotalPizzaPrice(
    type,
    size,
    itemsForOptions,
    allIngredients,
    selectedIngredients,
  );
  const { addCartItem } = useCartStore();

  // ── Document-level pointer handlers (avoids event bubbling issues) ──────────
  const onPointerDown = React.useCallback(
    (e: React.PointerEvent, ing: Ingredient) => {
      e.stopPropagation();
      const g: GhostState = {
        id: ing.id,
        x: e.clientX,
        y: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
        imageUrl: ing.imageUrl,
        isDrag: false,
      };
      ghostRef.current = g;
      setGhost(g);
    },
    [],
  );

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const g = ghostRef.current;
      if (!g) return;
      const moved =
        Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > DRAG_THRESHOLD;
      const updated = {
        ...g,
        x: e.clientX,
        y: e.clientY,
        isDrag: g.isDrag || moved,
      };
      ghostRef.current = updated;
      setGhost(updated);
      if (pizzaRef.current)
        setIsDragOver(
          isPointerOverCircle(pizzaRef.current, e.clientX, e.clientY),
        );
    };

    const onUp = (e: PointerEvent) => {
      const g = ghostRef.current;
      if (!g) return;
      ghostRef.current = null;
      setGhost(null);
      setIsDragOver(false);

      if (g.isDrag) {
        // Drop on pizza
        if (
          pizzaRef.current &&
          isPointerOverCircle(pizzaRef.current, e.clientX, e.clientY)
        ) {
          if (!droppedRef.current.includes(g.id)) {
            setDroppedIngredients((p) => [...p, g.id]);
            // addIngredient is called via the effect below
            addIngredientRef.current(g.id);
          }
        }
      } else {
        // Tap — toggle
        if (droppedRef.current.includes(g.id)) {
          removeIngredientRef.current(g.id);
        } else {
          setDroppedIngredients((p) => [...p, g.id]);
          addIngredientRef.current(g.id);
        }
      }
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", () => {
      ghostRef.current = null;
      setGhost(null);
      setIsDragOver(false);
    });
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const removeIngredient = React.useCallback(
    (id: number) => {
      setDroppedIngredients((p) => p.filter((i) => i !== id));
      if (selectedIngredients.has(id)) addIngredient(id);
    },
    [selectedIngredients, addIngredient],
  );

  // Stable refs so document listeners can call latest versions
  const addIngredientRef = React.useRef(addIngredient);
  const removeIngredientRef = React.useRef(removeIngredient);
  React.useEffect(() => {
    addIngredientRef.current = addIngredient;
  }, [addIngredient]);
  React.useEffect(() => {
    removeIngredientRef.current = removeIngredient;
  }, [removeIngredient]);

  const handleAdd = async () => {
    if (!currentItemId) return;
    setAddingToCart(true);
    try {
      await addCartItem({
        productItemId: currentItemId,
        ingredients: Array.from(selectedIngredients),
      });
      toast.success("Пицца добавлена в корзину!");
      const toRemove = [...droppedIngredients];
      setDroppedIngredients([]);
      toRemove.forEach((id) => {
        if (selectedIngredients.has(id)) addIngredient(id);
      });
    } catch {
      toast.error("Не удалось добавить в корзину");
    } finally {
      setAddingToCart(false);
    }
  };

  const sizeMap: Record<PizzaSize, number> = { 20: 260, 30: 320, 40: 380 };
  const pizzaDiameter = sizeMap[size];

  return (
    <>
      {/* Ghost — only shown during actual drag */}
      <AnimatePresence>
        {ghost?.isDrag && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.9 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="fixed z-[999] pointer-events-none"
            style={{ left: ghost.x - 36, top: ghost.y - 36 }}
          >
            <img
              src={ghost.imageUrl}
              alt=""
              className="w-[72px] h-[72px] object-contain"
              style={{
                filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.7)) saturate(1.3)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn("flex flex-col xl:flex-row gap-8", className)}>
        {/* ══ LEFT ══ */}
        <div className="flex-1 flex flex-col items-center gap-5 rounded-3xl glass p-6 xl:p-8">
          <div className="w-full max-w-[400px] flex flex-col gap-3">
            <GroupVariants
              items={availableSizes}
              value={String(size)}
              onClick={(v) => setSize(Number(v) as PizzaSize)}
            />
            <GroupVariants
              items={pizzaTypes}
              value={String(type)}
              onClick={(v) => setType(Number(v) as PizzaType)}
            />
          </div>

          <PizzaCanvas
            isBlankDough={selectedBase.isBlank}
            baseImageUrl={(selectedBase as any).imageUrl ?? ""}
            diameter={pizzaDiameter}
            isDragOver={isDragOver}
            droppedIngredients={droppedIngredients}
            allIngredients={allIngredients}
            onRemove={removeIngredient}
            pizzaRef={pizzaRef}
          />

          {/* Base selector */}
          <div className="w-full max-w-[400px]">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
              Основа
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {allBases.map((base, index) => (
                <motion.button
                  key={base.id}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    setSelectedPizzaIndex(index);
                    setDroppedIngredients([]);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-colors min-w-[80px] flex-shrink-0 bg-card",
                    index === selectedPizzaIndex
                      ? "border-primary shadow-md"
                      : "border-transparent hover:border-border",
                  )}
                >
                  {base.isBlank ? (
                    // CSS dough thumbnail
                    <div
                      className="w-12 h-12 rounded-full flex-shrink-0"
                      style={{
                        background:
                          "radial-gradient(circle at 50% 50%, #fef3d0 0%, #f5d070 50%, #c08820 75%, #8b4513 88%, transparent 92%)",
                        boxShadow: "inset 0 -2px 6px rgba(0,0,0,0.2)",
                      }}
                    />
                  ) : (
                    <img
                      src={(base as any).imageUrl}
                      alt={base.name}
                      className="w-12 h-12 object-contain rounded-full"
                    />
                  )}
                  <span className="text-[10px] font-semibold text-center leading-tight line-clamp-2 max-w-[72px]">
                    {base.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Price + CTA */}
          <div className="w-full max-w-[400px] flex flex-col gap-3">
            <div className="rounded-2xl bg-muted px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">
                  {droppedIngredients.length > 0
                    ? `${droppedIngredients.length} ингр.`
                    : "Без ингредиентов"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {size} см · {type === 1 ? "традиционная" : "тонкая"}
                </p>
              </div>
              <span className="text-2xl font-black text-primary">
                {totalPrice} TJS
              </span>
            </div>
            <Button
              onClick={handleAdd}
              loading={addingToCart}
              disabled={!currentItemId || addingToCart}
              className="btn-gradient h-[52px] text-base rounded-2xl w-full font-bold gap-2"
            >
              <ShoppingCart size={18} />В корзину · {totalPrice} TJS
            </Button>
          </div>
        </div>

        {/* ══ RIGHT ══ */}
        <div className="xl:w-[340px] flex flex-col gap-4 rounded-3xl glass p-5">
          <Title text="Ингредиенты" size="sm" className="font-bold" />
          <p className="text-xs text-muted-foreground -mt-2">
            Перетащи на пиццу или нажми чтобы добавить
          </p>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-[640px] pr-1 scrollbar">
            {allIngredients.map((ing) => {
              const isAdded = droppedIngredients.includes(ing.id);
              const isDragging = ghost?.id === ing.id;
              return (
                <motion.div
                  key={ing.id}
                  animate={{ opacity: isDragging ? 0.35 : 1 }}
                  whileHover={!isDragging ? { x: 3 } : {}}
                  onPointerDown={(e) => onPointerDown(e, ing)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl cursor-grab active:cursor-grabbing transition-colors select-none touch-none",
                    isAdded
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-card hover:bg-muted border border-transparent",
                  )}
                >
                  <GripVertical
                    size={14}
                    className="text-muted-foreground flex-shrink-0"
                  />
                  <img
                    src={ing.imageUrl}
                    alt={ing.name}
                    className="w-12 h-12 object-contain flex-shrink-0"
                    style={{
                      filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.35))",
                    }}
                    draggable={false}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight truncate">
                      {ing.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      +{ing.price} TJS
                    </p>
                  </div>
                  <AnimatePresence>
                    {isAdded && (
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeIngredient(ing.id);
                        }}
                        className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
                      >
                        <X size={12} strokeWidth={3} className="text-white" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
