import {
  Container,
  Filters,
  TopBar,
  ProductsGroupList,
  Stories,
  TopProducts,
  RecentOrders,
  BackToTop,
  RecentlyViewed,
  PizzaOfTheDayServer,
  CombosSection,
  Hero,
  HeroBanner,
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
  const heroPizza = categories
    .flatMap((category) => category.products)
    .find((product) => product.items.length > 0);

  return (
    <>
      {}
      <HeroBanner className="mt-0" />

      <Container className="mt-8 md:mt-14">
        <Hero
          pizza={
            heroPizza && {
              id: heroPizza.id,
              name: heroPizza.name,
              imageUrl: heroPizza.imageUrl,
              price: heroPizza.items[0]?.price,
              rating:
                heroPizza.reviews.length > 0
                  ? heroPizza.reviews.reduce(
                      (acc, review) => acc + review.rating,
                      0,
                    ) / heroPizza.reviews.length
                  : null,
            }
          }
        />
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
        <Suspense fallback={null}>
          <CombosSection />
        </Suspense>
      </Container>

      <Container className="my-10">
        <RecentlyViewed />
      </Container>

      <Container className="mt-10 pb-14">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-[80px]">
          {}
          <div className="w-full lg:w-[250px] hidden lg:block">
            <Suspense>
              <Filters />
            </Suspense>
            <div className="mt-10">
              <RecentOrders />
            </div>
          </div>

          {}
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
