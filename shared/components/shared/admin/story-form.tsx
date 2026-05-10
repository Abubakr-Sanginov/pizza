'use client';

import React from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Story, StoryItem } from '@prisma/client';
import { Input, Button } from '@/shared/components/ui';
import { Title } from '@/shared/components/shared';
import { createStory } from '@/back/actions/story-actions';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { UploadButton } from './upload-button';

const storySchema = z.object({
  previewImageUrl: z.string().min(1, 'Загрузите изображение превью'),
  items: z.array(z.object({
    sourceUrl: z.string().min(1, 'Загрузите изображение слайда'),
  })).min(1, 'Добавьте хотя бы один слайд'),
});

type StoryFormValues = z.infer<typeof storySchema>;

interface Props {
  initialData?: Story & {
    items: StoryItem[];
  };
}

export const StoryForm: React.FC<Props> = ({ initialData }) => {
  const router = useRouter();
  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      previewImageUrl: initialData?.previewImageUrl || '',
      items: initialData?.items.map(item => ({
        sourceUrl: item.sourceUrl,
      })) || [{ sourceUrl: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const onSubmit = async (values: StoryFormValues) => {
    try {
      if (initialData) {
        // Edit functionality can be added later if needed
        toast.error('Редактирование пока не поддерживается');
        return;
      } else {
        await createStory(values);
        toast.success('История создана');
      }

      router.push('/dashboard/stories');
    } catch (error) {
      toast.error('Ошибка при сохранении');
    }
  };

  return (
    <div className="max-w-4xl bg-card text-card-foreground p-10 rounded-2xl border border-border shadow-sm">
      <Title text={initialData ? 'Редактирование' : 'Новая история'} size="md" className="font-bold mb-10" />

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-3">Превью-изображение (обложка)</label>
              <div className="flex flex-col gap-3">
                <UploadButton
                  value={form.watch('previewImageUrl')}
                  onChange={(url) => form.setValue('previewImageUrl', url)}
                />
                {form.formState.errors.previewImageUrl && (
                  <p className="text-destructive text-xs">{form.formState.errors.previewImageUrl.message}</p>
                )}
                <div className="pt-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Или укажите прямую ссылку:</label>
                  <Input {...form.register('previewImageUrl')} placeholder="https://..." />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-10">
            <div className="flex items-center justify-between mb-5">
              <Title text="Слайды (Story Items)" size="xs" className="font-bold" />
              <Button type="button" variant="outline" size="sm" onClick={() => append({ sourceUrl: '' })}>
                <Plus size={16} className="mr-2" /> Добавить слайд
              </Button>
            </div>

            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col gap-4 p-6 border border-border rounded-xl bg-muted relative group">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-muted-foreground">Слайд #{index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => remove(index)}>
                      <Trash2 size={20} />
                    </Button>
                  </div>
                  
                  <div className="flex gap-6">
                    <UploadButton
                      value={form.watch(`items.${index}.sourceUrl`)}
                      onChange={(url) => form.setValue(`items.${index}.sourceUrl`, url)}
                    />
                    <div className="flex-1 space-y-2">
                       <label className="block text-xs font-medium text-gray-400">Прямая ссылка на слайд:</label>
                       <Input {...form.register(`items.${index}.sourceUrl`)} placeholder="https://..." />
                       {form.formState.errors.items?.[index]?.sourceUrl && (
                        <p className="text-destructive text-xs">{form.formState.errors.items[index]?.sourceUrl?.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-5">
            <Button size="lg" loading={form.formState.isSubmitting} type="submit" className="px-10">
              {initialData ? 'Сохранить изменения' : 'Создать историю'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
