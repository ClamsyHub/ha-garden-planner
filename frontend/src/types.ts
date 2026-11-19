export type Json =
  string | number | boolean | null | Json[] | { [key: string]: Json };
export type Data = Record<string, Json | undefined>;
export interface Entity {
  image_present?: boolean;
  id: string;
  revision: number;
  created_at: string;
  updated_at: string;
  data: Data;
}
export const TABLES = [
  "plants",
  "varieties",
  "growing_windows",
  "locations",
  "cultivations",
  "cultivation_events",
  "tasks",
  "seed_lots",
  "cultivation_journal",
  "bed_layouts",
  "bed_plantings",
] as const;
export type Table = (typeof TABLES)[number];
export type Tables = Record<Table, Entity[]>;
export type Page =
  | "overview"
  | "calendar"
  | "bedplan"
  | "plants"
  | "cultures"
  | "history"
  | "locations"
  | "reminders"
  | "neighbors"
  | "seeds"
  | "settings";
export type Language = "de" | "en";
export interface Hass {
  fetchWithAuth?(path: string, init?: RequestInit): Promise<Response>;
  callWS<T>(message: Record<string, unknown>): Promise<T>;
  connection: {
    sendMessagePromise?<T>(message: Record<string, unknown>): Promise<T>;
    subscribeMessage<T>(
      callback: (message: T) => void,
      message: Record<string, unknown>,
    ): Promise<() => Promise<void>>;
    addEventListener?(event: string, callback: () => void): void;
    removeEventListener?(event: string, callback: () => void): void;
  };
  user?: { id: string; name?: string; is_admin: boolean };
  themes?: { darkMode: boolean };
  language?: string;
  locale?: { language?: string };
  config: { time_zone: string; unit_system?: { temperature?: string } };
  states?: Record<
    string,
    { state: string; attributes: Record<string, unknown> }
  >;
}
export interface ImportPlan {
  token: string;
  mode: "merge" | "replace";
  inserted: number;
  skipped: number;
  updated: number;
  deleted: number;
  conflicts: { table: Table; id: string }[];
  counts: Record<Table, number>;
}
export interface Field {
  label?: string;
  wide?: boolean;
  rowStart?: boolean;
  key: string;
  type?: "text" | "textarea" | "number" | "date" | "select" | "checkbox";
  required?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: string;
  disabled?: boolean;
}
export const text = (record: Entity | undefined, field: string): string => {
  const value = record?.data[field];
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
};
export const numberValue = (
  record: Entity | undefined,
  field: string,
): number | undefined => {
  const value = record?.data[field];
  return typeof value === "number" ? value : undefined;
};
export const emptyTables = (): Tables => ({
  plants: [],
  varieties: [],
  growing_windows: [],
  locations: [],
  cultivations: [],
  cultivation_events: [],
  tasks: [],
  seed_lots: [],
  cultivation_journal: [],
  bed_layouts: [],
  bed_plantings: [],
});

export interface Capabilities {
  weather?: boolean;
  can_edit: boolean;
  can_manage: boolean;
  http_transfer?: boolean;
  reminders?: boolean;
}
export interface NotificationRoute {
  user_id: string;
  kind: "push" | "email";
  enabled: boolean;
  service: string;
  entity: string;
  target: string;
}
export interface HostSettings {
  weather_entity?: string;
  weather_hours?: number;
  frost_warning_c?: number;
  readers: string[] | null;
  notification_routes: NotificationRoute[];
  shared_channel_enabled: boolean;
  writers: string[];
  reminders_enabled: boolean;
  lead_days: number;
  reminder_hour: number;
  notify_service: string;
  notify_entity: string;
  language: Language;
}
export interface SettingsResponse {
  settings: HostSettings;
  users: { id: string; name: string; is_admin?: boolean }[];
  notify_entities?: { id: string; name: string }[];
  channels: string[];
}

export interface PersonalReminders {
  cells: Record<string, Record<string, boolean>>;
  global_enabled: boolean;
  personal_destinations: number;
  shared_channel_enabled: boolean;
}

export interface WeatherResponse {
  status: "disabled" | "unavailable" | "ready";
  entity?: string;
  name?: string;
  hours?: number;
  minimum_c?: number;
  datetime?: string;
  forecast_type?: string;
  checked_at?: string;
  alerts: { id: string; name: string }[];
}
