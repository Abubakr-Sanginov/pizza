'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';

export const ReferralCapture: React.FC = () => {
  const params = useSearchParams();

  React.useEffect(() => {
    const ref = params.get('ref');
    if (!ref) return;
    document.cookie = `referralCode=${encodeURIComponent(ref)}; path=/; max-age=${60 * 60 * 24 * 30}`;
  }, [params]);

  return null;
};
