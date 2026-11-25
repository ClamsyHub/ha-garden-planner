import de from "./locales/de.json" with { type: "json" };
import en from "./locales/en.json" with { type: "json" };
import type { Language } from "./languages";
import bg from "./locales/bg.json" with { type: "json" };
import da from "./locales/da.json" with { type: "json" };
import et from "./locales/et.json" with { type: "json" };
import fi from "./locales/fi.json" with { type: "json" };
import fr from "./locales/fr.json" with { type: "json" };
import el from "./locales/el.json" with { type: "json" };
import ga from "./locales/ga.json" with { type: "json" };
import it from "./locales/it.json" with { type: "json" };
import hr from "./locales/hr.json" with { type: "json" };
import lv from "./locales/lv.json" with { type: "json" };
import lt from "./locales/lt.json" with { type: "json" };
import mt from "./locales/mt.json" with { type: "json" };
import nl from "./locales/nl.json" with { type: "json" };
import pl from "./locales/pl.json" with { type: "json" };
import pt from "./locales/pt.json" with { type: "json" };
import ro from "./locales/ro.json" with { type: "json" };
import sv from "./locales/sv.json" with { type: "json" };
import sk from "./locales/sk.json" with { type: "json" };
import sl from "./locales/sl.json" with { type: "json" };
import es from "./locales/es.json" with { type: "json" };
import cs from "./locales/cs.json" with { type: "json" };
import hu from "./locales/hu.json" with { type: "json" };
export type Catalog = {
  ui: Record<string, string>;
  host: Record<string, string>;
  bed: Record<string, string>;
};
export const catalogs: Record<Language, Catalog> = {
  de,
  en,
  bg,
  da,
  et,
  fi,
  fr,
  el,
  ga,
  it,
  hr,
  lv,
  lt,
  mt,
  nl,
  pl,
  pt,
  ro,
  sv,
  sk,
  sl,
  es,
  cs,
  hu,
};
export function translatedText(
  language: Language,
  section: keyof Catalog,
  key: string,
): string | undefined {
  return catalogs[language]?.[section][key];
}
