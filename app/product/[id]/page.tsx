export default async function ProductPage({ params : {id} }: { params: { id: string } }) {
  const product = await prisma.product.findFirst({where: {id: Number(id)}});

  return <p>Product {id}</p>;
}
