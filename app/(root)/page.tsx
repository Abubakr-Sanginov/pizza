import {
  Container,
  Filters,
  Title,
  TopBar,
  ProductsGroupList,
  Stories,
  TopProducts,
  RecentOrders,
} from '@/shared/components/shared';
import { Suspense } from 'react';
import { GetSearchParams, findPizzas } from '@/back/lib/find-pizzas';

export default async function Home({ searchParams }: { searchParams: GetSearchParams }) {
  const categories = await findPizzas(searchParams);

  return (
    <>
      <Container className="mt-10">
        <Title text="Все пиццы" size="lg" className="font-extrabold" />
      </Container>

      <TopBar categories={categories.filter((category) => category.products.length > 0)} />

      <Stories />

      <Container className="my-10">
        <TopProducts />
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
    </>
  );
}

