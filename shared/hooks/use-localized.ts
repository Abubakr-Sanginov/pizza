"use client";
import { useTranslation } from "react-i18next";

interface LocalizableItem { name: string; nameEn?: string|null; nameTg?: string|null; }

export function useLocalized() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return (item: LocalizableItem): string => {
    if (lang === "en" && item.nameEn) return item.nameEn;
    if (lang === "tg" && item.nameTg) return item.nameTg;
    return item.name;
  };
}

export function getLocalizedName(item: LocalizableItem, lang: string): string {
  if (lang === "en" && item.nameEn) return item.nameEn;
  if (lang === "tg" && item.nameTg) return item.nameTg;
  return item.name;
}