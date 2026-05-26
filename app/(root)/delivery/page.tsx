import { prisma } from "@/back/prisma/prisma-client";
import { Container, Title } from "@/shared/components/shared";
import nextDynamic from "next/dynamic";
import type { Metadata } from "next";
import {
  Clock,
  MapPin,
  ShoppingCart,
  CalendarDays,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Next Pizza | Доставка",
};

export const dynamic = "force-dynamic";

const DeliveryMap = nextDynamic(
  () =>
    import("@/shared/components/shared/delivery-map").then(
      (m) => m.DeliveryMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[480px] rounded-3xl bg-muted animate-pulse" />
    ),
  },
);

const STATS = [
  { label: "Среднее время", value: "35 мин", Icon: Clock },
  { label: "Зона доставки", value: "7 км", Icon: MapPin },
  { label: "Минимальный заказ", value: "50 TJS", Icon: ShoppingCart },
  { label: "Работаем", value: "Ежедневно", Icon: CalendarDays },
];

const FAQ = [
  {
    q: "Как рассчитывается стоимость доставки?",
    a: "Зависит от расстояния до ресторана. В радиусе 2 км — бесплатно, до 4 км — 15 TJS, до 7 км — 30 TJS.",
  },
  {
    q: "Можно ли отследить заказ?",
    a: "Да, после оформления заказа вы получите ссылку для отслеживания статуса в реальном времени.",
  },
  {
    q: "Что если я живу за пределами зоны доставки?",
    a: "Вы можете оформить самовывоз из ближайшего ресторана — это бесплатно.",
  },
  {
    q: "Как долго хранится горячей пицца при доставке?",
    a: "Мы используем термосумки. Пицца остаётся горячей до 45 минут после выхода из ресторана.",
  },
];

export default async function DeliveryPage() {
  let stores: any[] = [];
  try {
    stores = await prisma.store.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        lat: true,
        lng: true,
      },
    });
  } catch (e) {
    console.error("[DeliveryPage]", e);
  }

  return (
    <Container className="mt-10 pb-20">
      {/* Header */}
      <div className="mb-8">
        <Title
          text="Доставка и рестораны"
          size="xl"
          className="font-black mb-2"
        />
        <p className="text-muted-foreground text-base max-w-xl">
          Доставляем горячую пиццу по Душанбе. Выбери ресторан на карте и узнай
          время доставки в твой район.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STATS.map(({ label, value, Icon }) => (
          <div
            key={label}
            className="rounded-2xl glass p-4 flex flex-col gap-2"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon size={18} className="text-primary" />
            </div>
            <span className="text-xl font-black">{value}</span>
            <span className="text-xs text-muted-foreground font-medium">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Map */}
      <DeliveryMap stores={stores} />

      {/* FAQ */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-5">
          <HelpCircle size={20} className="text-primary" />
          <h2 className="text-xl font-black">Частые вопросы</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-2xl glass p-5">
              <p className="font-bold text-sm mb-2">{item.q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
