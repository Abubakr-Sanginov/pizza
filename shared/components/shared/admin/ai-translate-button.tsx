"use client";
import React from "react";
import { Button } from "@/shared/components/ui";
import { Languages, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export const AiTranslateButton: React.FC = () => {
  const [state, setState] = React.useState<"idle"|"loading"|"done">("idle");
  const run = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/admin/ai-translate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      toast.success("Переведено: " + data.translated + " позиций" + (data.failed ? " (ошибок: " + data.failed + ")" : ""));
      setState("done");
      setTimeout(() => setState("idle"), 4000);
    } catch (e: any) {
      toast.error(e.message || "Ошибка перевода");
      setState("idle");
    }
  };
  return (
    <Button variant="outline" onClick={run} disabled={state === "loading"} className="flex items-center gap-2">
      {state === "loading" && <Loader2 size={16} className="animate-spin" />}
      {state === "done" && <CheckCircle2 size={16} className="text-green-500" />}
      {state === "idle" && <Languages size={16} />}
      {state === "loading" ? "Переводим..." : "AI-перевод"}
    </Button>
  );
};