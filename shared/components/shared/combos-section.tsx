'use client';

import React from 'react';
import axios from 'axios';
import { ComboCard, ComboData } from './combo-card';
import { SectionHeader } from './section-header';

export const CombosSection: React.FC = () => {
  const [combos, setCombos] = React.useState<ComboData[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    axios.get('/api/combos').then((r) => setCombos(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);
  if (!loading && combos.length === 0) return null;
  if (loading) return null;
  return (
    <section id="combo" className="scroll-mt-24">
      <SectionHeader title="Выгодные комбо" className="mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {combos.map((combo) => <ComboCard key={combo.id} combo={combo} />)}
      </div>
    </section>
  );
};
