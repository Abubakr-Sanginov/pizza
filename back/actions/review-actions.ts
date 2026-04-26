'use server';

import { prisma } from '@/back/prisma/prisma-client';
import { getUserSession } from '@/back/lib/get-user-session';
import { revalidatePath } from 'next/cache';

export async function addReview(productId: number, rating: number, comment?: string) {
  try {
    const session = await getUserSession();

    if (!session) {
      throw new Error('You must be logged in to leave a review');
    }

    await prisma.review.create({
      data: {
        userId: Number(session.id),
        productId,
        rating,
        comment,
      },
    });

    revalidatePath('/');
    revalidatePath(`/product/${productId}`); // If there's a separate product page
  } catch (error) {
    console.error('[ADD_REVIEW]', error);
    throw new Error('Failed to add review');
  }
}

export async function getReviews(productId: number) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        productId,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reviews;
  } catch (error) {
    console.error('[GET_REVIEWS]', error);
    return [];
  }
}

export async function deleteReview(id: number) {
  try {
    const session = await getUserSession();

    if (!session || session.role !== 'ADMIN') {
      throw new Error('Only administrators can delete reviews');
    }

    await prisma.review.delete({
      where: {
        id,
      },
    });

    revalidatePath('/dashboard/reviews');
  } catch (error) {
    console.error('[DELETE_REVIEW]', error);
    throw new Error('Failed to delete review');
  }
}
