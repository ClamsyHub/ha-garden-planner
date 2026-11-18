import { describe, it, expect } from "vitest";
import { harvestRows } from "../src/harvest";
import type { Entity } from "../src/types";
const entity = (id: string, data: Entity["data"]): Entity => ({
  id,
  revision: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  data,
});
const culture = (id: string, count?: number) =>
  entity(id, { date: "2026-03-01", plant_count: count });
const entry = (
  id: string,
  cultureId: string,
  amount: number,
  unit: string,
  date = "2026-08-01",
  location = "bed-a",
) =>
  entity(id, {
    cultivation_id: cultureId,
    date,
    entry_kind: "harvest",
    amount,
    unit,
    harvest_context: {
      plant_id: "tomato",
      plant_name: "Tomato",
      variety_id: "roma",
      variety_name: "Roma",
      location_id: location,
      location_name: location,
    },
  });
describe("harvest analysis", () => {
  it("sums individual harvests without multiplying plant count", () => {
    const rows = harvestRows(
      [entry("a", "c", 10, "kg"), entry("b", "c", 10000, "g")],
      [culture("c", 20)],
      "plant",
    );
    expect(rows[0]).toMatchObject({
      kg: 20,
      harvests: 2,
      kgPerPlant: 1,
      massPlantCount: 20,
      pieces: 0,
    });
  });
  it("keeps pieces separate and counts only contributing cultures per unit", () => {
    const rows = harvestRows(
      [entry("a", "c", 2, "kg"), entry("b", "d", 8, "pieces")],
      [culture("c", 2), culture("d", 4)],
      "plant",
    );
    expect(rows[0]).toMatchObject({
      kg: 2,
      pieces: 8,
      kgPerPlant: 1,
      piecesPerPlant: 2,
    });
  });
  it("does not use sowing quantity or hide missing counts", () => {
    const rows = harvestRows(
      [entry("a", "c", 10, "kg"), entry("b", "d", 1, "kg")],
      [culture("c", 20), entity("d", { quantity: 100 })],
      "plant",
    );
    expect(rows[0]!.kgPerPlant).toBeNull();
    expect(rows[0]!.kg).toBe(11);
  });
  it("groups and filters by harvest dates and frozen bed/variety context", () => {
    const entries = [
      entry("a", "c", 1, "kg", "2026-08-01"),
      entry("b", "c", 2, "kg", "2027-01-01", "bed-b"),
    ];
    expect(
      harvestRows(entries, [culture("c", 2)], "year").map((r) => r.kg),
    ).toEqual([1, 2]);
    expect(harvestRows(entries, [culture("c", 2)], "location")).toHaveLength(2);
    expect(
      harvestRows(entries, [culture("c", 2)], "variety", {
        year: "2027",
        plant: "tomato",
        variety: "roma",
        location: "bed-b",
      })[0]!.kg,
    ).toBe(2);
  });
  it("handles fractional grams using integer milligrams and recomputes deletions", () => {
    const entries = [entry("a", "c", 0.1, "g"), entry("b", "c", 0.2, "g")];
    expect(harvestRows(entries, [culture("c", 1)], "culture")[0]!.kg).toBe(
      0.0003,
    );
    expect(
      harvestRows(entries.slice(0, 1), [culture("c", 1)], "culture")[0]!.kg,
    ).toBe(0.0001);
  });
});
