'use server';

import { prisma } from '@/back/prisma/prisma-client';
import { revalidatePath } from 'next/cache';

export interface CreateStoryValues {
  previewImageUrl: string;
  items: {
    sourceUrl: string;
  }[];
}

export async function createStory(data: CreateStoryValues) {
  try {
    const story = await prisma.story.create({
      data: {
        previewImageUrl: data.previewImageUrl,
        items: {
          create: data.items.map((item) => ({
            sourceUrl: item.sourceUrl,
          })),
        },
      },
    });

    revalidatePath('/dashboard/stories');
    revalidatePath('/');

    return story;
  } catch (error) {
    console.error('Error [CREATE_STORY]', error);
    throw error;
  }
}

export async function deleteStory(id: number) {
  try {

    await prisma.storyItem.deleteMany({
      where: { storyId: id },
    });

    await prisma.story.delete({
      where: { id },
    });

    revalidatePath('/dashboard/stories');
    revalidatePath('/');
  } catch (error) {
    console.error('Error [DELETE_STORY]', error);
    throw error;
  }
}

