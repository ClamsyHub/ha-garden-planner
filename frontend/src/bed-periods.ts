import type { Entity } from "./types";
export interface OccupancySuggestion {
  start: string;
  end: string;
  activities: string[];
  sources: string[];
}
function day(year: number, month: number, value: number): string | undefined {
  if (!Number.isInteger(year) || year < 1900 || year > 9998) return undefined;
  const date = new Date(Date.UTC(year, month - 1, value));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === value
    ? date.toISOString().slice(0, 10)
    : undefined;
}
function annual(
  window: Entity,
  year: number,
): { start: string; end: string } | undefined {
  const sm = Number(window.data.start_month),
    sd = Number(window.data.start_day),
    em = Number(window.data.end_month),
    ed = Number(window.data.end_day);
  const start = day(year, sm, sd),
    end = day(year + (em < sm || (em === sm && ed < sd) ? 1 : 0), em, ed);
  return start && end ? { start, end } : undefined;
}
/** Suggestions are explicit combinations, never an inferred cultivation duration. */
export function occupancySuggestions(
  plantId: string,
  year: number,
  windows: Entity[],
): OccupancySuggestion[] {
  const own = windows.filter((e) => e.data.plant_id === plantId);
  const starts = own.filter(
    (e) => e.data.activity === "direct" || e.data.activity === "transplant",
  );
  const harvests = own.filter((e) => e.data.activity === "harvest");
  const result = new Map<string, OccupancySuggestion>();
  for (const s of starts) {
    const start = annual(s, year);
    if (!start) continue;
    for (const h of harvests)
      for (const hy of [year - 1, year, year + 1]) {
        const harvest = annual(h, hy);
        if (!harvest || harvest.end < start.end) continue;
        const days =
          (Date.parse(harvest.end + "T12:00:00Z") -
            Date.parse(start.start + "T12:00:00Z")) /
          86400000;
        if (days < 0 || days > 366) continue;
        const key = start.start + ":" + harvest.end;
        const value = result.get(key) ?? {
          start: start.start,
          end: harvest.end,
          activities: [],
          sources: [],
        };
        value.activities = [
          ...new Set([...value.activities, String(s.data.activity)]),
        ];
        value.sources = [...new Set([...value.sources, s.id, h.id])];
        result.set(key, value);
      }
  }
  return [...result.values()].sort(
    (a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end),
  );
}
