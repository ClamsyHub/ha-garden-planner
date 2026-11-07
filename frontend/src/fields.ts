import { label, t } from "./i18n";
import { monthLabel, todayInZone, validDay } from "./dates";
import {
  text,
  type Data,
  type Entity,
  type Field,
  type Language,
  type Table,
  type Tables,
} from "./types";

const names = [
  "name",
  "botanical_name",
  "category",
  "description",
  "notes",
  "site",
  "light",
  "water",
  "frost",
  "care",
  "source",
  "source_url",
];
const measures = [
  "germination_min_c",
  "germination_optimal_min_c",
  "germination_optimal_max_c",
  "germination_max_c",
  "germination_days_min",
  "germination_days_max",
  "depth_cm",
  "spacing_cm",
  "row_spacing_cm",
  "duration_days_min",
  "duration_days_max",
];
const options = (values: string[], language: Language) =>
  values.map((value) => ({ value, label: label(language, value) }));
const entityOptions = (values: Entity[], language: Language) =>
  values.map((record) => ({
    value: record.id,
    label:
      text(record, "name") || text(record, "title") || t(language, "untitled"),
  }));
function scalarField(key: string): Field {
  if (
    measures.includes(key) ||
    ["quantity", "temperature_c", "start_day", "end_day"].includes(key)
  )
    return {
      key,
      type: "number",
      min: key.endsWith("_c") ? undefined : 0,
      step: key.includes("days") || key.endsWith("_day") ? "1" : "any",
    };
  return {
    key,
    type: ["description", "notes", "care", "regional_notes"].includes(key)
      ? "textarea"
      : "text",
    required: key === "name" || key === "title",
  };
}
export function fieldsFor(
  table: Table,
  data: Data,
  tables: Tables,
  language: Language,
  editing: boolean,
): Field[] {
  const select = (key: string, values: string[], required = false): Field => ({
    key,
    type: "select",
    options: options(values, language),
    required,
  });
  const relation = (
    key: string,
    records: Entity[],
    required = false,
    disabled = false,
  ): Field => ({
    key,
    type: "select",
    options: entityOptions(records, language),
    required,
    disabled,
  });
  const active = (records: Entity[], current?: string) =>
    records.filter((r) => !r.data.archived || r.id === current);
  const plantId = String(data.plant_id ?? "");
  const plantField = relation(
    "plant_id",
    active(tables.plants, plantId),
    true,
    editing && ["varieties", "growing_windows", "cultivations"].includes(table),
  );
  const varietyField = relation(
    "variety_id",
    active(
      tables.varieties.filter((r) => text(r, "plant_id") === plantId),
      String(data.variety_id ?? ""),
    ),
    false,
    editing && ["growing_windows", "cultivations"].includes(table),
  );
  const bedField = relation(
    "location_id",
    active(tables.locations, String(data.location_id ?? "")),
  );
  const temperatureFields = [
    scalarField("temperature_c"),
    select("measurement_kind", ["substrate", "soil", "air"]),
  ];
  if (table === "plants" || table === "varieties")
    return [
      ...(table === "varieties" ? [plantField] : []),
      ...names.map((key) =>
        key === "category"
          ? {
              key,
              type: "select" as const,
              options: options(
                [
                  ...new Set([
                    "vegetables",
                    "herbs",
                    "flowers",
                    "fruit",
                    "other",
                    ...tables.plants
                      .map((p) => text(p, "category"))
                      .filter(Boolean),
                  ]),
                ],
                language,
              ),
            }
          : scalarField(key),
      ),
      ...measures.map(scalarField),
    ];
  if (table === "growing_windows")
    return [
      plantField,
      varietyField,
      select(
        "activity",
        [
          "indoors",
          "direct",
          "transplant",
          "harvest",
          "prick_out",
          "care",
          "other",
        ],
        true,
      ),
      select(
        "environment",
        ["outdoors", "greenhouse", "cold_frame", "indoors"],
        true,
      ),
      { ...select("method", ["direct", "indoors", "transplant"]), wide: true },
      ...["start", "end"].flatMap((prefix) => [
        {
          key: `${prefix}_month`,
          type: "select" as const,
          required: true,
          options: Array.from({ length: 12 }, (_, i) => ({
            value: String(i + 1),
            label: monthLabel(2000, i + 1, language).replace(/\s*2000/, ""),
          })),
        },
        {
          key: `${prefix}_day`,
          type: "number" as const,
          min: 1,
          max: 31,
          step: "1",
          required: true,
        },
      ]),
      ...["notes", "regional_notes", "source", "source_url"].map(scalarField),
    ];
  if (table === "locations")
    return [
      ...[
        "name",
        "location_type",
        "light",
        "soil",
        "description",
        "notes",
        "sensor_entity_id",
      ].map(scalarField),
      select("measurement_kind", ["air", "soil", "substrate"]),
    ];
  if (table === "cultivations")
    return [
      plantField,
      varietyField,
      { key: "date", type: "date", required: true },
      select("method", ["direct", "indoors", "transplant"], true),
      bedField,
      scalarField("quantity"),
      ...temperatureFields,
      select("initial_status", ["sown", "planned"], true),
      scalarField("notes"),
      ...["result", "germination_result", "harvest_result"].map((key) =>
        select(key, ["unknown", "successful", "partial", "failed"]),
      ),
    ];
  if (table === "cultivation_events") {
    if (data.origin === "initial") return [scalarField("notes")];
    return [
      { key: "date", type: "date", required: true },
      select(
        "status",
        [
          "planned",
          "sown",
          "germinated",
          "pricked_out",
          "planted_out",
          "growing",
          "harvesting",
          "completed",
          "failed",
        ],
        true,
      ),
      scalarField("notes"),
    ];
  }
  return [
    scalarField("title"),
    { key: "date", type: "date", required: true },
    select(
      "activity",
      [
        "indoors",
        "direct",
        "transplant",
        "harvest",
        "prick_out",
        "care",
        "other",
      ],
      true,
    ),
    relation("plant_id", tables.plants),
    relation(
      "cultivation_id",
      tables.cultivations.map((c) => ({
        ...c,
        data: {
          name: `${text(
            tables.plants.find((p) => p.id === text(c, "plant_id")),
            "name",
          )} · ${text(c, "date")}`,
        },
      })),
    ),
    bedField,
    scalarField("notes"),
  ];
}
export function initialData(
  table: Table,
  timeZone: string,
  seed: Data = {},
): Data {
  const defaults: Partial<Record<Table, Data>> = {
    plants: { category: "vegetables" },
    growing_windows: {
      activity: "direct",
      environment: "outdoors",
      start_month: 1,
      start_day: 1,
      end_month: 1,
      end_day: 31,
    },
    cultivations: {
      date: todayInZone(timeZone),
      method: "direct",
      initial_status: "sown",
      result: "unknown",
    },
    cultivation_events: { date: todayInZone(timeZone), status: "germinated" },
    tasks: { date: todayInZone(timeZone), activity: "care" },
  };
  return { ...defaults[table], ...seed };
}
export function formData(
  table: Table,
  draft: Data,
  fields: Field[],
  original?: Entity,
): Data {
  const result: Data = {};
  for (const field of fields) {
    if (field.disabled) continue;
    const value = draft[field.key];
    if (value === "" || value === undefined || value === null) {
      if (field.required) throw new Error("invalid_data");
      if (original && original.data[field.key] !== undefined)
        result[field.key] = null;
      continue;
    }
    result[field.key] =
      field.type === "number" || field.key.endsWith("_month")
        ? Number(value)
        : value;
  }
  if (table === "cultivation_events" && !original)
    result.cultivation_id = draft.cultivation_id;
  const merged = { ...original?.data, ...result };
  const temperatures = [
    "germination_min_c",
    "germination_optimal_min_c",
    "germination_optimal_max_c",
    "germination_max_c",
  ]
    .map((k) => merged[k])
    .filter((n): n is number => typeof n === "number");
  if (
    temperatures.some(
      (n, i) => !Number.isFinite(n) || (i > 0 && n < temperatures[i - 1]!),
    )
  )
    throw new Error("invalid_data");
  for (const [low, high] of [
    ["germination_days_min", "germination_days_max"],
    ["duration_days_min", "duration_days_max"],
  ]) {
    if (
      typeof merged[low!] === "number" &&
      typeof merged[high!] === "number" &&
      Number(merged[low!]) > Number(merged[high!])
    )
      throw new Error("invalid_data");
  }
  if (table === "growing_windows")
    for (const prefix of ["start", "end"]) {
      if (
        !validDay(
          2000,
          Number(merged[`${prefix}_month`]),
          Number(merged[`${prefix}_day`]),
        )
      )
        throw new Error("invalid_data");
    }
  if (
    merged.temperature_c !== undefined &&
    merged.temperature_c !== null &&
    !merged.measurement_kind
  )
    throw new Error("invalid_data");
  if (merged.sensor_entity_id && !merged.measurement_kind)
    throw new Error("invalid_data");
  return result;
}
