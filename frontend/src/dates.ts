import { numberValue, text, type Entity, type Language } from "./types";

export function todayInZone(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((key) => parts.find((p) => p.type === key)?.value)
    .join("-");
}
export function dateObject(iso: string): Date {
  // All gardening calculations use calendar dates at UTC noon: DST cannot add/remove days.
  return new Date(`${iso}T12:00:00Z`);
}
export function isoDate(day: Date): string {
  return day.toISOString().slice(0, 10);
}
export function addDays(iso: string, count: number): string {
  const day = dateObject(iso);
  day.setUTCDate(day.getUTCDate() + count);
  return isoDate(day);
}
export function monthDays(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
export function validDay(year: number, month: number, day: number): boolean {
  return month >= 1 && month <= 12 && day >= 1 && day <= monthDays(year, month);
}
export function contains(window: Entity, iso: string): boolean {
  const current = Number(iso.slice(5, 7)) * 100 + Number(iso.slice(8, 10));
  const start =
    (numberValue(window, "start_month") ?? 0) * 100 +
    (numberValue(window, "start_day") ?? 0);
  const end =
    (numberValue(window, "end_month") ?? 0) * 100 +
    (numberValue(window, "end_day") ?? 0);
  return start <= end
    ? current >= start && current <= end
    : current >= start || current <= end;
}
export function monthSegments(
  window: Entity,
  year: number,
  month: number,
): { offset: number; width: number }[] {
  const count = monthDays(year, month);
  const segments: { offset: number; width: number }[] = [];
  let start: number | undefined;
  for (let index = 0; index <= count; index++) {
    const active =
      index < count &&
      contains(
        window,
        `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`,
      );
    if (active && start === undefined) start = index;
    if (!active && start !== undefined) {
      segments.push({
        offset: (start / count) * 100,
        width: ((index - start) / count) * 100,
      });
      start = undefined;
    }
  }
  return segments;
}
export function activeInMonth(
  window: Entity,
  year: number,
  month: number,
): boolean {
  return Array.from(
    { length: monthDays(year, month) },
    (_, i) =>
      `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
  ).some((day) => contains(window, day));
}
export function nextDay(windows: Entity[], from: string): string | undefined {
  for (let offset = 0; offset < 366 * 8; offset++) {
    const day = addDays(from, offset);
    if (windows.some((window) => contains(window, day))) return day;
  }
  return undefined;
}
export function weekDays(anchor: string): string[] {
  const weekday = (dateObject(anchor).getUTCDay() + 6) % 7;
  const monday = addDays(anchor, -weekday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
export function formatDate(iso: string, language: Language): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-GB", {
    timeZone: "UTC",
    dateStyle: "medium",
  }).format(dateObject(iso));
}
export function monthLabel(
  year: number,
  month: number,
  language: Language,
  short = false,
): string {
  return new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-GB", {
    timeZone: "UTC",
    month: short ? "short" : "long",
    ...(short ? {} : { year: "numeric" }),
  }).format(new Date(Date.UTC(year, month - 1, 15)));
}
export function windowLabel(window: Entity, language: Language): string {
  const part = (prefix: string) => {
    const month = numberValue(window, `${prefix}_month`) ?? 1;
    const day = numberValue(window, `${prefix}_day`) ?? 1;
    return `${day}. ${monthLabel(2000, month, language, true)}`;
  };
  return `${part("start")} – ${part("end")}`;
}
export function cultureEvents(culture: Entity, events: Entity[]): Entity[] {
  return events
    .filter((e) => text(e, "cultivation_id") === culture.id)
    .sort(
      (a, b) =>
        text(a, "date").localeCompare(text(b, "date")) ||
        a.created_at.localeCompare(b.created_at) ||
        a.id.localeCompare(b.id),
    );
}
export function cultureStatus(culture: Entity, events: Entity[]): string {
  return (
    text(cultureEvents(culture, events).at(-1), "status") ||
    text(culture, "initial_status") ||
    "sown"
  );
}
export function sowingDate(culture: Entity, events: Entity[]): string {
  return text(
    cultureEvents(culture, events).find((e) => text(e, "status") === "sown"),
    "date",
  );
}
