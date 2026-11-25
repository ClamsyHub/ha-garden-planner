import { describe, it, expect } from "vitest";
import { catalogs } from "../src/locale-catalog";
import { languages, resolveLanguage, dateLocale } from "../src/languages";
import { t, label } from "../src/i18n";
import { formatDate, monthLabel } from "../src/dates";

describe("bundled language catalogs", () => {
  it("ships every key and a nonempty value for every supported language", () => {
    expect(languages).toHaveLength(24);
    for (const lang of languages) {
      for (const section of ["ui", "host", "bed"] as const) {
        const entries = catalogs[lang][section];
        expect(Object.keys(entries).sort()).toEqual(
          Object.keys(catalogs.en[section]).sort(),
        );
        for (const value of Object.values(entries)) {
          expect(value.trim()).not.toBe("");
          expect(value).not.toMatch(/ZXQ|GPTERM/);
        }
      }
      expect(t(lang, "calendar")).toBe(catalogs[lang].ui.calendar);
      expect(t(lang, "reminderLanguage")).toBe(
        catalogs[lang].host.reminderLanguage,
      );
      expect(label(lang, "prune")).toBe(catalogs[lang].ui.prune);
    }
  });
  it("resolves regional preferences and falls back safely for unknown clients", () => {
    expect(resolveLanguage("pt-BR")).toBe("pt");
    expect(resolveLanguage("FR_fr")).toBe("fr");
    expect(resolveLanguage("ga-IE")).toBe("ga");
    expect(resolveLanguage("unknown")).toBe("en");
    expect(resolveLanguage("constructor")).toBe("en");
    expect(t("fr", "unknown-key")).toBe("unknown-key");
  });
  it("uses each language's calendar month and date formatting", () => {
    for (const lang of languages) {
      expect(formatDate("2027-09-12", lang)).toBe(
        new Intl.DateTimeFormat(dateLocale(lang), {
          timeZone: "UTC",
          dateStyle: "medium",
        }).format(new Date("2027-09-12T12:00:00Z")),
      );
      expect(monthLabel(2027, 9, lang)).toBe(
        new Intl.DateTimeFormat(dateLocale(lang), {
          timeZone: "UTC",
          month: "long",
          year: "numeric",
        }).format(new Date("2027-09-15T00:00:00Z")),
      );
    }
  });
});
