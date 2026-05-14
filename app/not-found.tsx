import { Container, EmptyState } from '@/shared/components/shared';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <Container className="mt-20 mb-20">
      <EmptyState
        icon={Compass}
        iconAccent="sky"
        title="Страница не найдена"
        description="Похоже, такой страницы у нас нет. Возможно, она переехала или вы открыли неверную ссылку."
        actionLabel="На главную"
        actionHref="/"
      />
    </Container>
  );
}
