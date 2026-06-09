"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui";
import { cn } from "@/shared/lib/utils";
import { SUPPORTED_LANGUAGES, LANG_STORAGE_KEY } from "@/shared/lib/i18n";
import type { SupportedLanguage } from "@/shared/lib/i18n";

const LABELS: Record<string, string> = { ru: "RU", en: "EN", tg: "ТҶ" };

export const LanguageToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const current = (mounted ? i18n.language : "ru") as SupportedLanguage;
  const cycle = () => {
    const idx = SUPPORTED_LANGUAGES.indexOf(current as any);
    const next = SUPPORTED_LANGUAGES[(idx + 1) % SUPPORTED_LANGUAGES.length];
    i18n.changeLanguage(next);
    try { localStorage.setItem(LANG_STORAGE_KEY, next); } catch {}
    try { document.cookie = `${LANG_STORAGE_KEY}=${next}; path=/; max-age=31536000`; } catch {}
  };
  return (
    <Button variant="secondary" onClick={cycle}
      aria-label="Change language"
      title="RU / EN / ТҶ"
      className={cn("px-2 md:px-3 h-[42px] rounded-2xl text-xs font-bold tracking-wider", className)}
    >
      {mounted ? (LABELS[current] ?? current.toUpperCase()) : "RU"}
    </Button>
  );
};