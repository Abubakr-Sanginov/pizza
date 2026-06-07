'use client';

import React from 'react';
import axios from 'axios';
import { Flame } from 'lucide-react';
import { ComboCard, ComboData } from './combo-card';
import { Title } from './title';

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
      <div className="flex items-center gap-3 mb-5">
        <Flame className="text-red-500 shrink-0" size={22} />
        <Title text="Выгодные комбо" size="md" className="font-extrabold" />
        <span className="text-sm text-muted-foreground hidden sm:inline">— бери набор, плати меньше</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {combos.map((combo) => <ComboCard key={combo.id} combo={combo} />)}
      </div>
    </section>
  );
};
