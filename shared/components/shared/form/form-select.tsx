'use client';

import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { ErrorText } from '../error-text';
import { RequiredSymbol } from '../required-symbol';

interface Props {
  name: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  items: { value: string; label: string }[];
}

export const FormSelect: React.FC<Props> = ({
  name,
  label,
  required,
  placeholder,
  className,
  items,
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const errorText = errors[name]?.message as string;

  return (
    <div className={className}>
      {label && (
        <p className="font-medium mb-2">
          {label} {required && <RequiredSymbol />}
        </p>
      )}

      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      {errorText && <ErrorText text={errorText} className="mt-2" />}
    </div>
  );
};
