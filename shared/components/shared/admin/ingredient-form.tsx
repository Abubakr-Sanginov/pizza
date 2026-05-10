'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ingredient } from '@prisma/client';
import { Input, Button } from '@/shared/components/ui';
import { Title } from '@/shared/components/shared';
import { createIngredient, updateIngredient } from '@/back/actions/ingredient-actions';
import { UploadButton } from './upload-button';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const ingredientSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  price: z.coerce.number().min(1, 'Минимум 1 TJS'),
  imageUrl: z.string().min(1, 'Загрузите изображение'),
});

type IngredientFormValues = z.infer<typeof ingredientSchema>;

interface Props {
  initialData?: Ingredient;
}

export const IngredientForm: React.FC<Props> = ({ initialData }) => {
  const router = useRouter();
  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: initialData?.name || '',
      price: initialData?.price || 0,
      imageUrl: initialData?.imageUrl || '',
    },
  });

  const onSubmit = async (values: IngredientFormValues) => {
    try {
      if (initialData) {
        await updateIngredient(initialData.id, values);
        toast.success('Ингредиент обновлен');
      } else {
        await createIngredient(values);
        toast.success('Ингредиент создан');
      }

      router.push('/dashboard/ingredients');
    } catch (error) {
      toast.error('Ошибка при сохранении');
    }
  };

  return (
    <div className="max-w-xl bg-card text-card-foreground p-10 rounded-2xl border border-border shadow-sm">
      <Title text={initialData ? 'Редактирование ингредиента' : 'Новый ингредиент'} size="md" className="font-bold mb-10" />

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <label className="block text-sm font-medium mb-1">Название</label>
            <Input {...form.register('name')} placeholder="Сырный бортик..." />
            {form.formState.errors.name && <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Цена (TJS)</label>
            <Input {...form.register('price')} type="number" />
            {form.formState.errors.price && <p className="text-destructive text-xs mt-1">{form.formState.errors.price.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Изображение</label>
            <UploadButton
              value={form.watch('imageUrl')}
              onChange={(url) => form.setValue('imageUrl', url)}
            />
            {form.formState.errors.imageUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.imageUrl.message}</p>}
          </div>

          <div className="flex justify-end pt-5">
            <Button size="lg" loading={form.formState.isSubmitting} type="submit" className="px-10">
              {initialData ? 'Сохранить изменения' : 'Создать ингредиент'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
