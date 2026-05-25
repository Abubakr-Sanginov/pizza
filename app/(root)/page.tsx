import {
  Container,
  Filters,
  Title,
  TopBar,
  ProductsGroupList,
  Stories,
  TopProducts,
  RecentOrders,
  BackToTop,
  RecentlyViewed,
  PizzaOfTheDayServer,
} from "@/shared/components/shared";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { GetSearchParams, findPizzas } from "@/back/lib/find-pizzas";
import { getUserSession } from "@/back/lib/get-user-session";

export default async function Home({
  searchParams,
}: {
  searchParams: GetSearchParams;
}) {
  const session = await getUserSession();
  if (session?.role === "COURIER") {
    redirect("/courier");
  }
  const categories = await findPizzas(searchParams);

  return (
    <>
      {/* Premium hero */}
      <Container className="mt-10 md:mt-16">
        <div className="flex flex-col items-start gap-4 max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[11px] font-bold tracking-widest uppercase text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Свежее меню
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.95]">
            Любимая пицца{" "}
            <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
              у тебя дома
            </span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
            Готовим из свежих ингредиентов и доставляем горячей. Выбирай, что
            сегодня будет на столе.
          </p>
        </div>
      </Container>

      <TopBar
        categories={categories.filter(
          (category) => category.products.length > 0,
        )}
      />

      <Stories />

      <Container className="my-10">
        <Suspense fallback={null}>
          <PizzaOfTheDayServer />
        </Suspense>
      </Container>

      <Container className="my-10">
        <Suspense fallback={null}>
          <TopProducts />
        </Suspense>
      </Container>

      <Container className="my-10">
        <RecentlyViewed />
      </Container>

      <Container className="mt-10 pb-14">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-[80px]">
          {/* Фильтрация */}
          <div className="w-full lg:w-[250px] hidden lg:block">
            <Suspense>
              <Filters />
            </Suspense>
            <div className="mt-10">
              <RecentOrders />
            </div>
          </div>

          {/* Список товаров */}
          <div className="flex-1">
            <div className="flex flex-col gap-10 md:gap-16">
              {categories.map(
                (category) =>
                  category.products.length > 0 && (
                    <ProductsGroupList
                      key={category.id}
                      title={category.name}
                      categoryId={category.id}
                      items={category.products}
                    />
                  ),
              )}
            </div>
          </div>
        </div>
      </Container>

      <BackToTop />
    </>
  );
}
