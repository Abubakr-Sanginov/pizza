'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Category } from '@prisma/client';
import { Input, Button } from '@/shared/components/ui';
import { Title } from '@/shared/components/shared';
import { createCategory, updateCategory } from '@/back/actions/category-actions';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const categorySchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Props {
  initialData?: Category;
}

export const CategoryForm: React.FC<Props> = ({ initialData }) => {
  const router = useRouter();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name || '',
    },
  });

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      if (initialData) {
        await updateCategory(initialData.id, values);
        toast.success('Категория обновлена');
      } else {
        await createCategory(values);
        toast.success('Категория создана');
      }

      router.push('/dashboard/categories');
    } catch (error) {
      toast.error('Ошибка при сохранении');
    }
  };

  return (
    <div className="max-w-xl bg-white p-10 rounded-2xl border shadow-sm">
      <Title text={initialData ? 'Редактирование категории' : 'Новая категория'} size="md" className="font-bold mb-10" />

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <label className="block text-sm font-medium mb-1">Название</label>
            <Input {...form.register('name')} placeholder="Пиццы..." />
            {form.formState.errors.name && <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>}
          </div>

          <div className="flex justify-end pt-5">
            <Button size="lg" loading={form.formState.isSubmitting} type="submit" className="px-10">
              {initialData ? 'Сохранить изменения' : 'Создать категорию'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
