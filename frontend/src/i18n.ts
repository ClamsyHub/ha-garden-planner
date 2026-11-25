import deCatalog from "./locales/de.json" with { type: "json" };
import enCatalog from "./locales/en.json" with { type: "json" };
import { translatedText } from "./locale-catalog";
import { hostText } from "./host-i18n";
import type { Language } from "./types";

const de = deCatalog.ui;
const en = enCatalog.ui;
export type Key = keyof typeof de;
export function t(language: Language, key: string): string {
  const dict = language === "de" ? de : en;
  return (
    translatedText(language, "ui", key) ??
    dict[key as Key] ??
    hostText(language, key) ??
    key
  );
}
export function label(language: Language, value: string): string {
  const aliases: Record<string, string> = {
    soil: "soilTemperature",
    care: "careActivity",
    completed: "completedStatus",
    successful: "successful",
  };
  return t(language, aliases[value] ?? value);
}
export function errorText(language: Language, error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  const known = [
    "invalid_data",
    "not_found",
    "conflict",
    "storage_error",
    "unauthorized",
    "not_loaded",
  ];
  return t(language, known.includes(code) ? code : "unexpected");
}
