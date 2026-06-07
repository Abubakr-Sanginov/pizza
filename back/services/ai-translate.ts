export type TranslateLang = "en" | "tg";

const LANG_NAMES: Record<TranslateLang, string> = {
  en: "English",
  tg: "Tajik (Тоҷикӣ)",
};

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = (key: string) =>
  "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent?key=" + key;

export async function aiTranslate(text: string, toLang: TranslateLang): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.warn("[ai-translate] GEMINI_API_KEY not set"); return null; }

  const prompt =
    "You are a food delivery app translator. Translate the following food product or ingredient name to " +
    LANG_NAMES[toLang] +
    ". Return ONLY the translated text, nothing else. Keep it short and natural.\n\nText: " + text;

  try {
    const res = await fetch(GEMINI_URL(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 100, temperature: 0.3 },
      }),
    });
    if (!res.ok) { console.error("[ai-translate] Gemini error:", await res.text()); return null; }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (e) { console.error("[ai-translate] fetch failed:", e); return null; }
}

export async function aiTranslateAll(
  text: string,
  existing: { en?: string | null; tg?: string | null } = {},
): Promise<{ en: string | null; tg: string | null }> {
  const result = { en: existing.en ?? null, tg: existing.tg ?? null };
  const tasks: Promise<void>[] = [];
  if (!existing.en) tasks.push(aiTranslate(text, "en").then((v) => { result.en = v; }));
  if (!existing.tg) tasks.push(aiTranslate(text, "tg").then((v) => { result.tg = v; }));
  await Promise.all(tasks);
  return result;
}
