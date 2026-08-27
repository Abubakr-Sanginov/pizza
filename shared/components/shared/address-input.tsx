'use client';

import React from 'react';
import { AddressSuggestions } from 'react-dadata';
import 'react-dadata/dist/react-dadata.css';

interface Props {
  value?: string;
  onChange?: (value?: string) => void;
}

export const AdressInput: React.FC<Props> = ({ value, onChange }) => {
  return (
    <AddressSuggestions
      token={process.env.NEXT_PUBLIC_DADATA_TOKEN || ''}
      value={value ? { value } as any : undefined}
      onChange={(data) => onChange?.(data?.value)}
      inputProps={{
        placeholder: 'Введите адрес (г. Душанбе, ул. ...)',
        className: 'h-12 text-base w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      }}
      filterLocations={[
        { city: 'Душанбе' },
        { country: 'Таджикистан' }
      ]}
    />
  );
};
