import type { Data, Entity, Hass } from "./types";
import { text } from "./types";
import { contains } from "./dates";
export interface Reading {
  value?: number;
  state: "missing" | "unit" | "information" | "outside" | "within";
}
function object(value: unknown): Data | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Data)
    : undefined;
}
export function recommendedRange(
  culture: Entity,
): { min: number; max: number } | undefined {
  const snapshot = object(culture.data.snapshot);
  if (!snapshot) return undefined;
  let data = { ...object(snapshot.plant), ...object(snapshot.variety) };
  const windows = Array.isArray(snapshot.windows)
    ? snapshot.windows.filter((w) => {
        const d = object(w);
        if (
          !d ||
          (d.activity !== text(culture, "method") &&
            d.method !== text(culture, "method"))
        )
          return false;
        return contains({ ...culture, data: d }, text(culture, "date"));
      })
    : [];
  if (windows.length > 1) return undefined;
  if (windows.length === 1) data = { ...data, ...object(windows[0]) };
  const min = data.germination_optimal_min_c;
  const max = data.germination_optimal_max_c;
  return typeof min === "number" && typeof max === "number"
    ? { min, max }
    : undefined;
}
export function temperatureReading(
  hass: Hass | undefined,
  location: Entity,
  range?: { min: number; max: number },
): Reading {
  const sensor = hass?.states?.[text(location, "sensor_entity_id")];
  if (
    !sensor ||
    !sensor.state.trim() ||
    ["unknown", "unavailable"].includes(sensor.state)
  )
    return { state: "missing" };
  let value = Number(sensor.state);
  if (!Number.isFinite(value)) return { state: "missing" };
  const unit = sensor.attributes.unit_of_measurement;
  if (unit === "°F") value = ((value - 32) * 5) / 9;
  else if (unit === "K") value -= 273.15;
  else if (unit !== "°C") return { state: "unit" };
  if (text(location, "measurement_kind") !== "substrate" || !range)
    return { value, state: "information" };
  return {
    value,
    state: value < range.min || value > range.max ? "outside" : "within",
  };
}
