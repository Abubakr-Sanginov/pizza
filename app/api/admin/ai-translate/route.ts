import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/back/prisma/prisma-client";
import { aiTranslateAll } from "@/back/services/ai-translate";
import { getUserSession } from "@/back/lib/get-user-session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let translated = 0, failed = 0;

  const products = await prisma.product.findMany({
    where: { OR: [{ nameEn: null }, { nameTg: null }] },
    select: { id: true, name: true, nameEn: true, nameTg: true },
  });
  for (const p of products) {
    const r = await aiTranslateAll(p.name, { en: p.nameEn, tg: p.nameTg });
    if (r.en || r.tg) {
      await prisma.product.update({ where: { id: p.id }, data: { ...(r.en ? { nameEn: r.en } : {}), ...(r.tg ? { nameTg: r.tg } : {}) } });
      translated++;
    } else failed++;
  }

  const ingredients = await prisma.ingredient.findMany({
    where: { OR: [{ nameEn: null }, { nameTg: null }] },
    select: { id: true, name: true, nameEn: true, nameTg: true },
  });
  for (const ing of ingredients) {
    const r = await aiTranslateAll(ing.name, { en: ing.nameEn, tg: ing.nameTg });
    if (r.en || r.tg) {
      await prisma.ingredient.update({ where: { id: ing.id }, data: { ...(r.en ? { nameEn: r.en } : {}), ...(r.tg ? { nameTg: r.tg } : {}) } });
      translated++;
    } else failed++;
  }

  const categories = await prisma.category.findMany({
    where: { OR: [{ nameEn: null }, { nameTg: null }] },
    select: { id: true, name: true, nameEn: true, nameTg: true },
  });
  for (const cat of categories) {
    const r = await aiTranslateAll(cat.name, { en: cat.nameEn, tg: cat.nameTg });
    if (r.en || r.tg) {
      await prisma.category.update({ where: { id: cat.id }, data: { ...(r.en ? { nameEn: r.en } : {}), ...(r.tg ? { nameTg: r.tg } : {}) } });
      translated++;
    } else failed++;
  }

  return NextResponse.json({ ok: true, translated, failed });
}