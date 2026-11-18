import { text, type Entity, type Data } from "./types";
export type HarvestBy = "plant" | "variety" | "location" | "year" | "culture";
export interface HarvestRow {
  key: string;
  label: string;
  kg: number;
  pieces: number;
  harvests: number;
  kgPerPlant: number | null;
  piecesPerPlant: number | null;
  massPlantCount: number | null;
  piecePlantCount: number | null;
}
export interface HarvestFilter {
  year?: string;
  plant?: string;
  variety?: string;
  location?: string;
}
/** Normalize grams/kilograms to integer milligrams; never mix weights and pieces.
 * Denominators include each contributing culture exactly once per unit/group.
 * Any unknown plant count keeps the corresponding per-plant result unknown.
 */
export function harvestRows(
  entries: Entity[],
  cultures: Entity[],
  by: HarvestBy,
  filter: HarvestFilter = {},
): HarvestRow[] {
  const catalog = new Map(cultures.map((c) => [c.id, c]));
  const groups = new Map<
    string,
    {
      label: string;
      mg: number;
      pieces: number;
      harvests: number;
      mass: Set<string>;
      counts: Set<string>;
    }
  >();
  for (const entry of entries) {
    if (entry.data.entry_kind !== "harvest") continue;
    const context = entry.data.harvest_context as Data | undefined;
    if (!context) continue;
    const year = text(entry, "date").slice(0, 4);
    if (
      (filter.year && year !== filter.year) ||
      (filter.plant && context.plant_id !== filter.plant) ||
      (filter.variety && (context.variety_id || "_") !== filter.variety) ||
      (filter.location && (context.location_id || "_") !== filter.location)
    )
      continue;
    const cultureId = text(entry, "cultivation_id"),
      plant = String(context.plant_name || "—"),
      variety = String(context.variety_name || "—"),
      location = String(context.location_name || "—");
    const key =
      by === "year"
        ? year
        : by === "plant"
          ? String(context.plant_id)
          : by === "variety"
            ? JSON.stringify([context.plant_id, context.variety_id])
            : by === "location"
              ? String(context.location_id || "_")
              : cultureId;
    const label =
      by === "year"
        ? year
        : by === "plant"
          ? plant
          : by === "variety"
            ? `${plant} · ${variety}`
            : by === "location"
              ? location
              : `${plant} · ${text(catalog.get(cultureId), "date")}`;
    const group = groups.get(key) ?? {
      label,
      mg: 0,
      pieces: 0,
      harvests: 0,
      mass: new Set<string>(),
      counts: new Set<string>(),
    };
    const amount = Number(entry.data.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    if (entry.data.unit === "pieces") {
      group.pieces += amount;
      group.counts.add(cultureId);
    } else if (entry.data.unit === "g" || entry.data.unit === "kg") {
      group.mg += Math.round(
        amount * (entry.data.unit === "kg" ? 1000000 : 1000),
      );
      group.mass.add(cultureId);
    } else continue;
    group.harvests++;
    groups.set(key, group);
  }
  const count = (ids: Set<string>) => {
    if (!ids.size) return null;
    let n = 0;
    for (const id of ids) {
      const value = catalog.get(id)?.data.plant_count;
      if (typeof value !== "number" || !Number.isInteger(value) || value <= 0)
        return null;
      n += value;
    }
    return n;
  };
  return [...groups]
    .map(([key, g]) => {
      const mass = count(g.mass),
        pieces = count(g.counts);
      return {
        key,
        label: g.label,
        kg: g.mg / 1000000,
        pieces: g.pieces,
        harvests: g.harvests,
        kgPerPlant: mass === null ? null : g.mg / 1000000 / mass,
        piecesPerPlant: pieces === null ? null : g.pieces / pieces,
        massPlantCount: mass,
        piecePlantCount: pieces,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
