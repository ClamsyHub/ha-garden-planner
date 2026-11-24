import { describe, it, expect } from "vitest";
import { occupancySuggestions } from "../src/bed-periods";
import type { Entity } from "../src/types";
const w = (
  id: string,
  activity: string,
  start: number[],
  end: number[],
): Entity => ({
  id,
  revision: 1,
  created_at: "",
  updated_at: "",
  data: {
    plant_id: "p",
    activity,
    start_month: start[0]!,
    start_day: start[1]!,
    end_month: end[0]!,
    end_day: end[1]!,
  },
});
describe("plant-derived occupancy proposals", () => {
  it("starts at transplanting instead of indoor propagation and ends at harvest end", () => {
    const values = occupancySuggestions("p", 2027, [
      w("inside", "indoors", [2, 1], [3, 31]),
      w("out", "transplant", [5, 15], [6, 15]),
      w("crop", "harvest", [7, 1], [10, 31]),
    ]);
    expect(values).toEqual([
      {
        start: "2027-05-15",
        end: "2027-10-31",
        activities: ["transplant"],
        sources: ["out", "crop"],
      },
    ]);
  });
  it("keeps winter harvest periods across year boundaries", () => {
    expect(
      occupancySuggestions("p", 2027, [
        w("sow", "direct", [8, 15], [10, 15]),
        w("crop", "harvest", [11, 1], [2, 28]),
      ])[0],
    ).toMatchObject({ start: "2027-08-15", end: "2028-02-28" });
  });
  it("offers multiple seasonal combinations explicitly and deduplicates identical dates", () => {
    const windows = [
      w("spring", "direct", [3, 1], [4, 30]),
      w("autumn", "direct", [8, 15], [9, 30]),
      w("crop1", "harvest", [5, 1], [6, 30]),
      w("crop2", "harvest", [10, 1], [12, 31]),
    ];
    expect(occupancySuggestions("p", 2027, windows).length).toBeGreaterThan(1);
    expect(
      occupancySuggestions("p", 2027, [
        w("sow", "direct", [5, 15], [6, 15]),
        w("out", "transplant", [5, 15], [6, 15]),
        w("crop", "harvest", [7, 1], [10, 31]),
      ]),
    ).toHaveLength(1);
  });
  it("does not invent an end date, use unrelated plants, or normalize invalid leap dates", () => {
    expect(
      occupancySuggestions("p", 2027, [w("sow", "direct", [3, 1], [4, 30])]),
    ).toEqual([]);
    expect(
      occupancySuggestions("other", 2027, [
        w("sow", "direct", [3, 1], [4, 30]),
        w("crop", "harvest", [5, 1], [6, 30]),
      ]),
    ).toEqual([]);
    expect(
      occupancySuggestions("p", 2027, [
        w("leap", "direct", [2, 29], [3, 30]),
        w("crop", "harvest", [5, 1], [6, 30]),
      ]),
    ).toEqual([]);
  });
});
