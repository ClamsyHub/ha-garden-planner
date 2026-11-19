import type { Data, Entity, Tables } from "./types";
export type Point = [number, number];
export type Layout = {
  location_id: string;
  width_cm: number;
  height_cm: number;
  outline: Point[];
  holes: Point[][];
  rotation_years: number;
  neighbor_distance_cm: number;
  notes?: string;
};
export type Planting = {
  layout_id: string;
  plant_id: string;
  variety_id?: string | null;
  cultivation_id?: string | null;
  start_date: string;
  end_date: string;
  x_cm: number;
  y_cm: number;
  plant_count: number;
  columns: number;
  spacing_cm: number;
  row_spacing_cm: number;
  state: "planned" | "planted" | "completed";
  notes?: string;
  family_snapshot?: string;
};
export const layoutData = (e: Entity): Layout => e.data as unknown as Layout;
export const plantingData = (e: Entity): Planting =>
  e.data as unknown as Planting;
export const toData = (value: Layout | Planting): Data =>
  structuredClone(value) as unknown as Data;
export function inside([x, y]: Point, polygon: Point[]): boolean {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!,
      b = polygon[j]!;
    const cross = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
    if (
      Math.abs(cross) < 1e-7 &&
      x >= Math.min(a[0], b[0]) - 1e-7 &&
      x <= Math.max(a[0], b[0]) + 1e-7 &&
      y >= Math.min(a[1], b[1]) - 1e-7 &&
      y <= Math.max(a[1], b[1]) + 1e-7
    )
      return true;
    if (
      a[1] > y !== b[1] > y &&
      x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]
    )
      result = !result;
  }
  return result;
}
export const usable = (p: Point, l: Layout): boolean =>
  inside(p, l.outline) && !l.holes.some((h) => inside(p, h));
export const centers = (p: Planting): Point[] =>
  Array.from({ length: p.plant_count }, (_, i) => [
    p.x_cm + (i % p.columns) * p.spacing_cm,
    p.y_cm + Math.floor(i / p.columns) * p.row_spacing_cm,
  ]);
export const overlaps = (a: Planting, b: Planting): boolean =>
  a.start_date <= b.end_date && b.start_date <= a.end_date;
export function preset(kind: string, w: number, h: number): Point[] {
  if (kind === "circle")
    return Array.from({ length: 48 }, (_, i) => [
      Math.round((w / 2 + (w / 2) * Math.cos((i * Math.PI) / 24)) * 10) / 10,
      Math.round((h / 2 + (h / 2) * Math.sin((i * Math.PI) / 24)) * 10) / 10,
    ]);
  if (kind === "triangle")
    return [
      [w / 2, 0],
      [w, h],
      [0, h],
    ];
  if (kind === "u")
    return [
      [0, 0],
      [w, 0],
      [w, h],
      [(w * 2) / 3, h],
      [(w * 2) / 3, h / 3],
      [w / 3, h / 3],
      [w / 3, h],
      [0, h],
    ];
  return [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
}
export function area(p: Point[]): number {
  return (
    Math.abs(
      p.reduce((s, a, i) => {
        const b = p[(i + 1) % p.length]!;
        return s + a[0] * b[1] - b[0] * a[1];
      }, 0),
    ) / 2
  );
}
export const path = (l: Layout): string =>
  [l.outline, ...l.holes]
    .filter((p) => p.length)
    .map((p) => "M" + p.map((v) => v.join(",")).join(" L") + " Z")
    .join(" ");
export type PlanWarning = {
  kind:
    | "outside"
    | "spacing"
    | "overlap"
    | "good"
    | "bad"
    | "rotation"
    | "unknownFamily";
  ids: string[];
  detail: string;
};
function name(t: Tables, id: string): string {
  return String(t.plants.find((p) => p.id === id)?.data.name ?? id);
}
function family(p: Planting, t: Tables): string {
  const current = t.plants.find((e) => e.id === p.plant_id)?.data.family;
  return String(
    p.state === "planned" ? (current ?? "") : (p.family_snapshot ?? ""),
  )
    .trim()
    .toLowerCase();
}

export function warnings(
  layout: Layout,
  entries: Entity[],
  t: Tables,
): PlanWarning[] {
  const result: PlanWarning[] = [];
  const records = entries.map((e) => ({ id: e.id, p: plantingData(e) }));
  for (const { id, p } of records) {
    if (centers(p).some((c) => !usable(c, layout)))
      result.push({ kind: "outside", ids: [id], detail: name(t, p.plant_id) });
    if (!family(p, t))
      result.push({
        kind: "unknownFamily",
        ids: [id],
        detail: name(t, p.plant_id),
      });
  }
  for (let i = 0; i < records.length; i++)
    for (let j = i + 1; j < records.length; j++) {
      const a = records[i]!,
        b = records[j]!,
        label = `${name(t, a.p.plant_id)} / ${name(t, b.p.plant_id)}`;
      if (overlaps(a.p, b.p)) {
        const ac = centers(a.p),
          bc = centers(b.p);
        let distance = Infinity;
        for (const x of ac)
          for (const y of bc)
            distance = Math.min(distance, Math.hypot(x[0] - y[0], x[1] - y[1]));
        if (distance < Math.max(a.p.spacing_cm, b.p.spacing_cm))
          result.push({
            kind: "spacing",
            ids: [a.id, b.id],
            detail: label + ` (${Math.round(distance)} cm)`,
          });
        const rectanglesOverlap = ac.some((x) =>
          bc.some(
            (y) =>
              Math.abs(x[0] - y[0]) < (a.p.spacing_cm + b.p.spacing_cm) / 2 &&
              Math.abs(x[1] - y[1]) <
                (a.p.row_spacing_cm + b.p.row_spacing_cm) / 2,
          ),
        );
        if (rectanglesOverlap)
          result.push({ kind: "overlap", ids: [a.id, b.id], detail: label });
        if (distance <= layout.neighbor_distance_cm) {
          const plant = t.plants.find((e) => e.id === a.p.plant_id)?.data;
          for (const [field, kind] of [
            ["neighbor_good_ids", "good"],
            ["neighbor_bad_ids", "bad"],
          ] as const)
            if (
              Array.isArray(plant?.[field]) &&
              plant[field].includes(b.p.plant_id)
            )
              result.push({ kind, ids: [a.id, b.id], detail: label });
        }
      }
      const earlier =
        a.p.end_date < b.p.start_date
          ? a
          : b.p.end_date < a.p.start_date
            ? b
            : null;
      const later = earlier === a ? b : a;
      if (
        earlier &&
        earlier.p.state !== "planned" &&
        family(earlier.p, t) &&
        family(earlier.p, t) === family(later.p, t)
      ) {
        const until = new Date(earlier.p.end_date + "T12:00:00Z");
        until.setUTCFullYear(until.getUTCFullYear() + layout.rotation_years);
        if (later.p.start_date < until.toISOString().slice(0, 10))
          result.push({
            kind: "rotation",
            ids: [a.id, b.id],
            detail: label + ` · ${family(a.p, t)} · ${earlier.p.end_date}`,
          });
      }
    }
  return result;
}
export function seedNeeds(
  entries: Entity[],
  tables: Tables,
): {
  plant_id: string;
  variety_id: string;
  count: number;
  seeds: number | null;
  buy: boolean;
}[] {
  const groups = new Map<string, ReturnType<typeof seedNeeds>[number]>();
  for (const e of entries) {
    const p = plantingData(e);
    if (p.state !== "planned") continue;
    const key = p.plant_id + ":" + (p.variety_id ?? "");
    const g = groups.get(key) ?? {
      plant_id: p.plant_id,
      variety_id: p.variety_id ?? "",
      count: 0,
      seeds: null,
      buy: false,
    };
    g.count += p.plant_count;
    groups.set(key, g);
  }
  for (const g of groups.values()) {
    const lots = tables.seed_lots.filter(
      (e) =>
        e.data.plant_id === g.plant_id &&
        (!g.variety_id || e.data.variety_id === g.variety_id),
    );
    const counted = lots.filter((e) => e.data.unit === "seeds");
    if (counted.length)
      g.seeds = counted.reduce((s, e) => s + Number(e.data.quantity), 0);
    const state = tables.plants.find((e) => e.id === g.plant_id)?.data
      .seed_state;
    g.buy =
      state === "buy" ||
      (g.seeds !== null && g.seeds < g.count) ||
      (!lots.length && state !== "available" && state !== "unneeded");
  }
  return [...groups.values()];
}
