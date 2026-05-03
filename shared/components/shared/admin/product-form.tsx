'use client';

import React from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, Category, Ingredient, ProductItem } from '@prisma/client';
import { Input, Button } from '@/shared/components/ui';
import { Title } from '@/shared/components/shared';
import { createProduct, updateProduct } from '@/back/actions/product-actions';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { UploadButton } from './upload-button';

const productSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  imageUrl: z.string().min(1, 'Загрузите изображение'),
  categoryId: z.string(),
  ingredients: z.array(z.number()),
  items: z.array(z.object({
    id: z.number().optional(),
    price: z.coerce.number().min(1, 'Минимум 1 TJS'),
    priceOld: z.coerce.number().optional(),
    size: z.coerce.number().optional(),
    pizzaType: z.coerce.number().optional(),
  })).min(1, 'Добавьте хотя бы одну вариацию'),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Props {
  initialData?: Product & {
    items: ProductItem[];
    ingredients: Ingredient[];
  };
  categories: Category[];
  ingredients: Ingredient[];
}

export const ProductForm: React.FC<Props> = ({ initialData, categories, ingredients }) => {
  const router = useRouter();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      imageUrl: initialData?.imageUrl || '',
      categoryId: String(initialData?.categoryId || categories[0]?.id || ''),
      ingredients: initialData?.ingredients.map((i) => i.id) || [],
      items: initialData?.items.map(item => ({
        id: item.id,
        price: item.price,
        priceOld: item.priceOld || undefined,
        size: item.size || undefined,
        pizzaType: item.pizzaType || undefined,
      })) || [{ price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const onSubmit = async (values: ProductFormValues) => {
    try {
      const productData = {
        name: values.name,
        imageUrl: values.imageUrl,
        categoryId: Number(values.categoryId),
        ingredientIds: values.ingredients,
        items: values.items.map((item) => ({
          price: item.price,
          priceOld: item.priceOld || undefined,
          size: item.size || undefined,
          pizzaType: item.pizzaType || undefined,
        })),
      };

      if (initialData) {
        await updateProduct(initialData.id, productData);
        toast.success('Продукт обновлен');
      } else {
        await createProduct(productData);
        toast.success('Продукт создан');
      }

      router.push('/dashboard/products');
    } catch (error) {
      toast.error('Ошибка при сохранении');
    }
  };

  return (
    <div className="max-w-4xl bg-white p-10 rounded-2xl border shadow-sm">
      <Title text={initialData ? 'Редактирование' : 'Новый продукт'} size="md" className="font-bold mb-10" />

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Название</label>
                <Input {...form.register('name')} placeholder="Пепперони..." />
                {form.formState.errors.name && <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Изображение</label>
                <div className="flex flex-col gap-3">
                  <UploadButton
                    value={form.watch('imageUrl')}
                    onChange={(url) => form.setValue('imageUrl', url)}
                  />
                  {form.formState.errors.imageUrl && (
                    <p className="text-red-500 text-xs">{form.formState.errors.imageUrl.message}</p>
                  )}
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Или укажите прямую ссылку:</label>
                    <Input {...form.register('imageUrl')} placeholder="https://..." />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Категория</label>
                <select
                  {...form.register('categoryId')}
                  className="w-full h-10 px-3 rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-5">
              <label className="block text-sm font-medium mb-3">Ингредиенты</label>
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-4 border rounded-md">
                {ingredients.map((ingredient) => (
                  <div key={ingredient.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`ing-${ingredient.id}`}
                      checked={form.watch('ingredients').includes(ingredient.id)}
                      onChange={(e) => {
                        const current = form.getValues('ingredients');
                        if (e.target.checked) {
                          form.setValue('ingredients', [...current, ingredient.id]);
                        } else {
                          form.setValue('ingredients', current.filter(id => id !== ingredient.id));
                        }
                      }}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`ing-${ingredient.id}`} className="text-sm cursor-pointer select-none">
                      {ingredient.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t pt-10">
            <div className="flex items-center justify-between mb-5">
              <Title text="Вариации (Product Items)" size="xs" className="font-bold" />
              <Button type="button" variant="outline" size="sm" onClick={() => append({ price: 0 })}>
                <Plus size={16} className="mr-2" /> Добавить
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-5 p-5 border rounded-xl bg-gray-50">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Цена (TJS)</label>
                    <Input {...form.register(`items.${index}.price`)} type="number" placeholder="390" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Старая цена</label>
                    <Input {...form.register(`items.${index}.priceOld`)} type="number" placeholder="450" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Размер</label>
                    <select
                      {...form.register(`items.${index}.size`)}
                      className="w-full h-10 px-3 rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                      <option value="">— нет —</option>
                      <option value="20">20 см</option>
                      <option value="30">30 см</option>
                      <option value="40">40 см</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Тип теста</label>
                    <select
                      {...form.register(`items.${index}.pizzaType`)}
                      className="w-full h-10 px-3 rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm">
                      <option value="">— нет —</option>
                      <option value="1">Тонкое</option>
                      <option value="2">Традиционное</option>
                    </select>
                  </div>
                  <Button type="button" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => remove(index)}>
                    <Trash2 size={20} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-5">
            <Button size="lg" loading={form.formState.isSubmitting} type="submit" className="px-10">
              {initialData ? 'Сохранить изменения' : 'Создать продукт'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
