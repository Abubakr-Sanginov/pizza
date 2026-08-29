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
import { ALL_PRODUCT_TAGS, PRODUCT_TAGS } from '@/shared/constants';

const productSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  imageUrl: z.string().min(1, 'Загрузите изображение'),
  gifUrl: z.string().optional().nullable(),
  categoryId: z.string(),
  ingredients: z.array(z.number()),
  tags: z.array(z.string()).default([]),
  calories: z.coerce.number().min(0).optional(),
  proteins: z.coerce.number().min(0).optional(),
  fats: z.coerce.number().min(0).optional(),
  carbs: z.coerce.number().min(0).optional(),
  items: z.array(z.object({
    id: z.number().optional(),
    price: z.coerce.number().min(1, 'Минимум 1 TJS'),
    discount: z.coerce.number().min(0).max(99).optional(),
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
      gifUrl: (initialData as any)?.gifUrl || '',
      categoryId: String(initialData?.categoryId || categories[0]?.id || ''),
      ingredients: initialData?.ingredients.map((i) => i.id) || [],
      tags: ((initialData as any)?.tags as string[] | undefined) ?? [],
      calories: (initialData as any)?.calories ?? undefined,
      proteins: (initialData as any)?.proteins ?? undefined,
      fats: (initialData as any)?.fats ?? undefined,
      carbs: (initialData as any)?.carbs ?? undefined,
      items: initialData?.items.map(item => ({
        id: item.id,
        price: item.priceOld && item.priceOld > item.price ? item.priceOld : item.price,
        discount: item.priceOld && item.priceOld > item.price ? Math.round((1 - item.price / item.priceOld) * 100) : undefined,
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
      console.log('[PRODUCT_FORM onSubmit] gifUrl=', values.gifUrl);

      const productData = {
        name: values.name,
        imageUrl: values.imageUrl,
        gifUrl: values.gifUrl || null,
        categoryId: Number(values.categoryId),
        ingredientIds: values.ingredients,
        tags: values.tags,
        items: values.items.map((item) => {
          const discount = item.discount || 0;
          const originalPrice = item.price;
          const finalPrice = discount > 0 ? Math.round(originalPrice * (1 - discount / 100)) : originalPrice;
          return {
            price: finalPrice,
            priceOld: discount > 0 ? originalPrice : undefined,
            size: item.size || undefined,
            pizzaType: item.pizzaType || undefined,
          };
        }),
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
      console.error('[PRODUCT_FORM] save error:', error);
      toast.error('Ошибка при сохранении');
    }
  };

  return (
    <div className="max-w-4xl bg-card text-card-foreground p-10 rounded-2xl border border-border shadow-sm">
      <Title text={initialData ? 'Редактирование' : 'Новый продукт'} size="md" className="font-bold mb-10" />

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.error('[PRODUCT_FORM] validation errors:', JSON.stringify(errors));
          toast.error('Заполните все обязательные поля');
        })} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Название</label>
                <Input {...form.register('name')} placeholder="Пепперони..." />
                {form.formState.errors.name && <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Изображение</label>
                <div className="flex flex-col gap-3">
                  <UploadButton
                    value={form.watch('imageUrl')}
                    onChange={(url) => form.setValue('imageUrl', url)}
                  />
                  {form.formState.errors.imageUrl && (
                    <p className="text-destructive text-xs">{form.formState.errors.imageUrl.message}</p>
                  )}
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Или укажите прямую ссылку:</label>
                    <Input {...form.register('imageUrl')} placeholder="https://..." />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">GIF (опционально)</label>
                <div className="flex flex-col gap-3">
                  <UploadButton
                    value={form.watch('gifUrl') || ''}
                    onChange={(url) => form.setValue('gifUrl', url)}
                  />
                  <div className="pt-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Или укажите прямую ссылку на GIF:</label>
                    <Input {...form.register('gifUrl')} placeholder="https://...gif" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    GIF показывается при наведении на карточку товара вместо статичного изображения
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Категория</label>
                <select
                  {...form.register('categoryId')}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
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
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-4 border border-border rounded-md">
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
                      className="w-4 h-4 text-primary focus:ring-primary border-border rounded"
                    />
                    <label htmlFor={`ing-${ingredient.id}`} className="text-sm cursor-pointer select-none">
                      {ingredient.name}
                    </label>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Метки (диета / аллергены)</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PRODUCT_TAGS.map((tag) => {
                    const meta = PRODUCT_TAGS[tag];
                    const selected = form.watch('tags').includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => {
                          const current = form.getValues('tags');
                          if (selected) {
                            form.setValue('tags', current.filter((t) => t !== tag));
                          } else {
                            form.setValue('tags', [...current, tag]);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          selected
                            ? `${meta.className} ring-2 ring-offset-1 ring-offset-card ring-primary/40`
                            : 'border-border text-muted-foreground hover:bg-muted'
                        }`}>
                        <span>{meta.emoji}</span>
                        <span>{meta.label.ru}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

              <div>
                <label className="block text-sm font-medium mb-2">КБЖУ (на 100 г)</label>
                <div className="grid grid-cols-4 gap-2">
                  <div><label className="block text-xs text-muted-foreground mb-1">Ккал</label>
                    <Input {...form.register('calories')} type="number" step="0.1" placeholder="250" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">Белки (г)</label>
                    <Input {...form.register('proteins')} type="number" step="0.1" placeholder="12" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">Жиры (г)</label>
                    <Input {...form.register('fats')} type="number" step="0.1" placeholder="10" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">Углев. (г)</label>
                    <Input {...form.register('carbs')} type="number" step="0.1" placeholder="30" /></div>
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
                <div key={field.id} className="flex items-end gap-5 p-5 border border-border rounded-xl bg-muted">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Цена (TJS)</label>
                    <Input {...form.register(`items.${index}.price`)} type="number" placeholder="390" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Скидка (%)</label>
                    <Input {...form.register(`items.${index}.discount`)} type="number" placeholder="0" min="0" max="99" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Размер</label>
                    <select
                      {...form.register(`items.${index}.size`)}
                      className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm">
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
                      className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                      <option value="">— нет —</option>
                      <option value="1">Тонкое</option>
                      <option value="2">Традиционное</option>
                    </select>
                  </div>
                  <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
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
