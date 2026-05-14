'use client';

import React from 'react';
import { Container, EmptyState } from '@/shared/components/shared';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <Container className="mt-20 mb-20">
      <EmptyState
        icon={AlertTriangle}
        iconAccent="rose"
        title="Что-то пошло не так"
        description="Произошла непредвиденная ошибка. Попробуйте обновить страницу — обычно это помогает."
        actionLabel="Попробовать снова"
        onAction={reset}
      />
    </Container>
  );
}
