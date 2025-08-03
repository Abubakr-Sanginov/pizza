export default async function ProductPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return <p>Product {id}</p>;
}
