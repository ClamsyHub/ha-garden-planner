import { describe, it, expect } from "vitest";
import { emptyTables, type Entity } from "../src/types";
import {
  preset,
  usable,
  warnings,
  toData,
  seedNeeds,
  type Layout,
  type Planting,
} from "../src/bed-geometry";
const entity = (id: string, data: Entity["data"]): Entity => ({
  id,
  data,
  revision: 1,
  created_at: "",
  updated_at: "",
});
const layout: Layout = {
  location_id: "bed",
  width_cm: 300,
  height_cm: 200,
  outline: preset("rectangle", 300, 200),
  holes: [],
  rotation_years: 3,
  neighbor_distance_cm: 100,
};
const planting = (plant = "a", patch: Partial<Planting> = {}): Planting => ({
  layout_id: "l",
  plant_id: plant,
  start_date: "2027-03-01",
  end_date: "2027-05-31",
  x_cm: 30,
  y_cm: 30,
  plant_count: 1,
  columns: 1,
  spacing_cm: 40,
  row_spacing_cm: 50,
  state: "planned",
  family_snapshot: "Fabaceae",
  ...patch,
});
describe("metric bed planning", () => {
  it("represents concave U shapes, circles, triangles and cut-outs", () => {
    expect(
      usable([150, 150], { ...layout, outline: preset("u", 300, 200) }),
    ).toBe(false);
    expect(
      usable([30, 150], { ...layout, outline: preset("u", 300, 200) }),
    ).toBe(true);
    expect(
      usable([0, 0], { ...layout, outline: preset("circle", 300, 200) }),
    ).toBe(false);
    expect(
      usable([150, 100], { ...layout, outline: preset("triangle", 300, 200) }),
    ).toBe(true);
    expect(
      usable([150, 100], {
        ...layout,
        holes: [
          [
            [100, 50],
            [200, 50],
            [200, 150],
            [100, 150],
          ],
        ],
      }),
    ).toBe(false);
  });
  it("shows conflicts only for simultaneous occupancy, honoring exact dates", () => {
    const t = emptyTables();
    t.plants = [
      entity("a", { name: "A", family: "Fabaceae", neighbor_bad_ids: ["b"] }),
      entity("b", { name: "B", family: "Fabaceae" }),
    ];
    let entries = [
      entity("1", toData(planting())),
      entity("2", toData(planting("b", { x_cm: 40 }))),
    ];
    expect(warnings(layout, entries, t).map((w) => w.kind)).toEqual(
      expect.arrayContaining(["spacing", "overlap", "bad"]),
    );
    entries = [
      entries[0]!,
      entity(
        "2",
        toData(
          planting("b", {
            x_cm: 40,
            start_date: "2027-06-01",
            end_date: "2027-08-31",
          }),
        ),
      ),
    ];
    expect(warnings(layout, entries, t)).toEqual([]);
  });
  it("uses frozen explicit family, previous actual occupancy and a multi-year resting interval", () => {
    const t = emptyTables();
    t.plants = [
      entity("a", { name: "A", family: "Fabaceae" }),
      entity("old", { name: "Old", family: "Changed" }),
    ];
    const previous = entity(
      "1",
      toData(
        planting("old", {
          state: "completed",
          start_date: "2025-03-01",
          end_date: "2025-06-30",
        }),
      ),
    );
    const next = entity("2", toData(planting()));
    expect(
      warnings(layout, [previous, next], t).some((w) => w.kind === "rotation"),
    ).toBe(true);
    expect(
      warnings(
        layout,
        [
          {
            ...previous,
            data: toData(
              planting("a", {
                state: "planned",
                start_date: "2025-03-01",
                end_date: "2025-06-30",
              }),
            ),
          },
          next,
        ],
        t,
      ).some((w) => w.kind === "rotation"),
    ).toBe(false);
    expect(
      warnings({ ...layout, rotation_years: 1 }, [previous, next], t).some(
        (w) => w.kind === "rotation",
      ),
    ).toBe(false);
  });
  it("treats unknown families and seed weights as unknown instead of inventing conversions", () => {
    const t = emptyTables();
    t.plants = [entity("a", { name: "A" })];
    t.seed_lots = [entity("lot", { plant_id: "a", quantity: 10, unit: "g" })];
    const e = entity("1", toData(planting("a", { family_snapshot: "" })));
    expect(
      warnings(layout, [e], t).some((w) => w.kind === "unknownFamily"),
    ).toBe(true);
    expect(seedNeeds([e], t)[0]?.seeds).toBeNull();
    t.seed_lots.push(
      entity("count", { plant_id: "a", quantity: 0, unit: "seeds" }),
    );
    expect(seedNeeds([e], t)[0]?.buy).toBe(true);
  });
});
