/** Shipped offline languages; regional HA preferences resolve to their base language. */
export const languageNames = {
  de: "Deutsch",
  en: "English",
  bg: "Български",
  da: "Dansk",
  et: "Eesti",
  fi: "Suomi",
  fr: "Français",
  el: "Ελληνικά",
  ga: "Gaeilge",
  it: "Italiano",
  hr: "Hrvatski",
  lv: "Latviešu",
  lt: "Lietuvių",
  mt: "Malti",
  nl: "Nederlands",
  pl: "Polski",
  pt: "Português",
  ro: "Română",
  sv: "Svenska",
  sk: "Slovenčina",
  sl: "Slovenščina",
  es: "Español",
  cs: "Čeština",
  hu: "Magyar",
} as const;
export type Language = keyof typeof languageNames;
export const languages = Object.keys(languageNames) as Language[];
export function resolveLanguage(value: string): Language {
  const code = value.trim().toLowerCase().replaceAll("_", "-").split("-")[0]!;
  return Object.hasOwn(languageNames, code) ? (code as Language) : "en";
}
export function dateLocale(language: Language): string {
  return language === "de"
    ? "de-DE"
    : language === "en"
      ? "en-GB"
      : language === "pt"
        ? "pt-PT"
        : language;
}
