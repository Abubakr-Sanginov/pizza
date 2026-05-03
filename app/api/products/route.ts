import { NextResponse } from 'next/server';
import { findPizzas } from '@/back/lib/find-pizzas';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Преобразуем searchParams в объект, который ожидает findPizzas
    const params = Object.fromEntries(searchParams.entries());
    
    const categories = await findPizzas(params as any);
    
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('[PRODUCTS_GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
