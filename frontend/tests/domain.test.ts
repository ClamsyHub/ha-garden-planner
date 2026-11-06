import {
  recommendedRange,
  temperatureReading,
  temperatureSensors,
} from "../src/temperature";
import type { Hass } from "../src/types";
import { describe, expect, it } from "vitest";
import {
  activeInMonth,
  contains,
  cultureStatus,
  monthSegments,
  nextDay,
  sowingDate,
  todayInZone,
  weekDays,
  windowWeekSegments,
} from "../src/dates";
import { fieldsFor, formData, initialData } from "../src/fields";
import { csvZip, readCsvZip } from "../src/files";
import { errorText, t } from "../src/i18n";
import { emptyTables, TABLES, type Data, type Entity } from "../src/types";
const record = (data: Data, id = "test"): Entity => ({
  id,
  revision: 1,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  data,
});
const window = (sm: number, sd: number, em: number, ed: number) =>
  record({ start_month: sm, start_day: sd, end_month: em, end_day: ed });
describe("calendar dates", () => {
  it("uses the HA timezone around midnight", () =>
    expect(todayInZone("Europe/Berlin", new Date("2026-11-05T23:30:00Z"))).toBe(
      "2026-11-06",
    ));
  it("handles winter windows across years", () => {
    expect(contains(window(11, 1, 2, 20), "2027-01-10")).toBe(true);
    expect(contains(window(11, 1, 2, 20), "2027-06-10")).toBe(false);
  });
  it("does not invent February 29 in non-leap years", () => {
    expect(activeInMonth(window(2, 29, 2, 29), 2027, 2)).toBe(false);
    expect(activeInMonth(window(2, 29, 2, 29), 2028, 2)).toBe(true);
    expect(nextDay([window(2, 29, 2, 29)], "2026-01-01")).toBe("2028-02-29");
  });
  it("draws partial months and split winter windows accurately", () => {
    expect(monthSegments(window(11, 15, 2, 20), 2026, 11)).toEqual([
      { offset: (14 / 30) * 100, width: (16 / 30) * 100 },
    ]);
    expect(monthSegments(window(11, 15, 11, 10), 2026, 11)).toHaveLength(2);
  });
  it("keeps a seven-day week across DST", () =>
    expect(weekDays("2026-03-29")).toEqual([
      "2026-03-23",
      "2026-03-24",
      "2026-03-25",
      "2026-03-26",
      "2026-03-27",
      "2026-03-28",
      "2026-03-29",
    ]));
  it("distinguishes planned from actual sowing and orders events by date", () => {
    const culture = record({ initial_status: "planned" }, "culture");
    const events = [
      record(
        { cultivation_id: "culture", status: "germinated", date: "2026-09-15" },
        "later",
      ),
      record(
        { cultivation_id: "culture", status: "sown", date: "2026-09-05" },
        "earlier",
      ),
    ];
    expect(cultureStatus(culture, events)).toBe("germinated");
    expect(sowingDate(culture, [])).toBe("");
    expect(sowingDate(culture, events)).toBe("2026-09-05");
  });
});
describe("form contracts", () => {
  it("never sends snapshot or parent reassignment in a patch", () => {
    const tables = emptyTables();
    const original = record({
      plant_id: "plant",
      date: "2026-09-05",
      method: "direct",
      initial_status: "sown",
      snapshot: { name: "historic" },
    });
    const fields = fieldsFor("cultivations", original.data, tables, "de", true);
    const result = formData(
      "cultivations",
      { ...original.data, notes: "Changed" },
      fields,
      original,
    );
    expect(result).not.toHaveProperty("snapshot");
    expect(result).not.toHaveProperty("plant_id");
    expect(result.notes).toBe("Changed");
  });
  it("rejects impossible windows and reversed temperatures", () => {
    const data = initialData("growing_windows", "Europe/Berlin", {
      plant_id: "plant",
      start_month: 2,
      start_day: 30,
    });
    expect(() =>
      formData(
        "growing_windows",
        data,
        fieldsFor("growing_windows", data, emptyTables(), "de", false),
      ),
    ).toThrow();
    const plant = {
      name: "Test",
      germination_min_c: 20,
      germination_max_c: 10,
    };
    expect(() =>
      formData(
        "plants",
        plant,
        fieldsFor("plants", plant, emptyTables(), "de", false),
      ),
    ).toThrow();
  });
  it("requires a measurement kind with observations", () => {
    const data = initialData("cultivations", "Europe/Berlin", {
      plant_id: "plant",
      temperature_c: 12,
    });
    expect(() =>
      formData(
        "cultivations",
        data,
        fieldsFor("cultivations", data, emptyTables(), "de", false),
      ),
    ).toThrow();
  });
  it("preserves explicit zero and clears optional fields with null", () => {
    const original = record({ name: "Plant", depth_cm: 2 });
    const fields = fieldsFor(
      "plants",
      original.data,
      emptyTables(),
      "de",
      true,
    );
    expect(
      formData("plants", { name: "Plant", depth_cm: 0 }, fields, original)
        .depth_cm,
    ).toBe(0);
    expect(
      formData("plants", { name: "Plant", depth_cm: "" }, fields, original)
        .depth_cm,
    ).toBeNull();
  });
});
describe("files and translations", () => {
  it("roundtrips the exact CSV file set through ZIP", () => {
    const files = Object.fromEntries(
      ["metadata.json", ...TABLES.map((t) => `${t}.csv`)].map((name) => [
        name,
        'Unicode ä\n"quotes"',
      ]),
    );
    expect(readCsvZip(csvZip(files))).toEqual(files);
  });
  it("rejects unknown paths and incomplete CSV archives", () => {
    expect(() => readCsvZip(csvZip({ "../escape.csv": "bad" }))).toThrow();
    expect(() => readCsvZip(new Uint8Array([1, 2, 3]))).toThrow();
  });
  it("uses stable translated errors without exposing arbitrary server strings", () => {
    expect(
      errorText("de", { code: "conflict", message: "secret details" }),
    ).not.toContain("secret");
    expect(t("en", "newSowing")).toBe("Record a sowing");
  });
});

describe("optional HA temperature integration", () => {
  const location = record({
    sensor_entity_id: "sensor.fixture",
    measurement_kind: "air",
  });
  const host = {
    states: {
      "sensor.fixture": {
        state: "68",
        attributes: { unit_of_measurement: "°F" },
      },
    },
  } as unknown as Hass;
  it("converts units but never compares air against substrate ranges", () => {
    expect(temperatureReading(host, location, { min: 10, max: 15 })).toEqual({
      state: "information",
      value: 20,
    });
    expect(
      temperatureReading(
        host,
        {
          ...location,
          data: { ...location.data, measurement_kind: "substrate" },
        },
        { min: 10, max: 15 },
      ),
    ).toEqual({ state: "outside", value: 20 });
  });
  it("works with no sensor or unsupported measurement units", () => {
    expect(temperatureReading(undefined, location).state).toBe("missing");
    expect(
      temperatureReading(
        {
          states: {
            "sensor.fixture": {
              state: "50",
              attributes: { unit_of_measurement: "%" },
            },
          },
        } as unknown as Hass,
        location,
      ).state,
    ).toBe("unit");
  });
  it("uses the recorded window range rather than current plant edits", () => {
    const culture = record({
      method: "direct",
      date: "2026-09-05",
      snapshot: {
        plant: {
          name: "Crop",
          germination_optimal_min_c: 10,
          germination_optimal_max_c: 20,
        },
        variety: null,
        location: null,
        windows: [
          {
            activity: "direct",
            start_month: 9,
            start_day: 1,
            end_month: 10,
            end_day: 1,
            germination_optimal_min_c: 12,
            germination_optimal_max_c: 15,
          },
        ],
      },
    });
    expect(recommendedRange(culture)).toEqual({ min: 12, max: 15 });
  });
});

it("clips seasonal windows to the chosen week, including winter and gaps", () => {
  expect(windowWeekSegments(window(11, 1, 2, 20), "2026-10-30")).toEqual([
    { start: "2026-11-01", end: "2026-11-01" },
  ]);
  expect(windowWeekSegments(window(12, 31, 1, 3), "2026-12-31")).toEqual([
    { start: "2026-12-31", end: "2027-01-03" },
  ]);
  expect(windowWeekSegments(window(1, 2, 12, 31), "2026-03-02")).toEqual([
    { start: "2026-03-02", end: "2026-03-08" },
  ]);
  expect(windowWeekSegments(window(3, 1, 3, 2), "2026-02-26")).toEqual([
    { start: "2026-03-01", end: "2026-03-01" },
  ]);
  expect(windowWeekSegments(window(1, 5, 1, 2), "2027-01-01")).toEqual([
    { start: "2026-12-28", end: "2027-01-02" },
  ]);
  expect(windowWeekSegments(window(11, 1, 2, 20), "2026-04-06")).toEqual([]);
});

it("sensor search matches friendly names or IDs and excludes non-temperature sensors", () => {
  const hass = {
    states: {
      "sensor.air": {
        state: "20",
        attributes: { friendly_name: "Gewächshaus", unit_of_measurement: "°C" },
      },
      "sensor.soil": {
        state: "unavailable",
        attributes: { friendly_name: "Boden", device_class: "temperature" },
      },
      "sensor.humidity": {
        state: "60",
        attributes: { unit_of_measurement: "%" },
      },
      "climate.air": { state: "20", attributes: { unit_of_measurement: "°C" } },
    },
  } as unknown as Hass;
  expect(temperatureSensors(hass, "GEWÄCHS").map((x) => x.id)).toEqual([
    "sensor.air",
  ]);
  expect(temperatureSensors(hass, "sensor.soil").map((x) => x.id)).toEqual([
    "sensor.soil",
  ]);
  expect(temperatureSensors(hass, "")).toHaveLength(2);
  expect(temperatureSensors(undefined, "air")).toEqual([]);
});
