import { prisma } from '@/back/prisma/prisma-client';
import { StoreForm } from '@/shared/components/shared/admin/store-form';
import { Container } from '@/shared/components/shared';
import { notFound } from 'next/navigation';

export default async function EditStorePage({ params }: { params: { id: string } }) {
  const store = await prisma.store.findFirst({
    where: {
      id: Number(params.id),
    },
  });

  if (!store) {
    return notFound();
  }

  return (
    <Container>
      <StoreForm initialData={store} />
    </Container>
  );
}
