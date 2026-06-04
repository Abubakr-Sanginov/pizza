'use client';

import React from 'react';

type Format =
  | 'datetime'
  | 'date'
  | 'time'
  | 'datetime-short';

interface Props {

  date: string | number | Date;
  format?: Format;
  locale?: string;
  className?: string;

  placeholder?: React.ReactNode;
}

const FORMATS: Record<Format, Intl.DateTimeFormatOptions> = {
  datetime: { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  date: { day: '2-digit', month: '2-digit', year: 'numeric' },
  time: { hour: '2-digit', minute: '2-digit' },
  'datetime-short': { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' },
};

export const LocalTime: React.FC<Props> = ({
  date,
  format = 'datetime',
  locale = 'ru-RU',
  className,
  placeholder = ' ',
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span className={className} suppressHydrationWarning>{placeholder}</span>;
  }

  let formatted = '';
  try {
    formatted = new Date(date).toLocaleString(locale, FORMATS[format]);
  } catch {
    formatted = '';
  }
  return <span className={className} suppressHydrationWarning>{formatted}</span>;
};
