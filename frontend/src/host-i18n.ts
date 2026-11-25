import deCatalog from "./locales/de.json" with { type: "json" };
import enCatalog from "./locales/en.json" with { type: "json" };
import { translatedText } from "./locale-catalog";
import type { Language } from "./types";
const de = deCatalog.host;
const en = enCatalog.host;
export function hostText(language: Language, key: string): string | undefined {
  return (
    translatedText(language, "host", key) ??
    (language === "de" ? de : en)[key as keyof typeof de]
  );
}
