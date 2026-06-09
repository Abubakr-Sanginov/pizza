"use client";
import React from "react";
import { Button } from "@/shared/components/ui";
import { Languages, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export const AiTranslateButton: React.FC = () => {
  const { t } = useTranslation();
  const [state, setState] = React.useState<"idle"|"loading"|"done">("idle");
  const run = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/admin/ai-translate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("admin.aiTranslate.error"));
      toast.success(t("admin.aiTranslate.translated") + data.translated + t("admin.aiTranslate.positions") + (data.failed ? t("admin.aiTranslate.errorsPrefix") + data.failed + t("admin.aiTranslate.errorsSuffix") : ""));
      setState("done");
      setTimeout(() => setState("idle"), 4000);
    } catch (e: any) {
      toast.error(e.message || t("admin.aiTranslate.translateError"));
      setState("idle");
    }
  };
  return (
    <Button variant="outline" onClick={run} disabled={state === "loading"} className="flex items-center gap-2">
      {state === "loading" && <Loader2 size={16} className="animate-spin" />}
      {state === "done" && <CheckCircle2 size={16} className="text-green-500" />}
      {state === "idle" && <Languages size={16} />}
      {state === "loading" ? t("admin.aiTranslate.loading") : t("admin.aiTranslate.idle")}
    </Button>
  );
};