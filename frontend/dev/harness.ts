// Development/test adapter only. Never imported by the production panel entry.
import "../../custom_components/garden_planner/www/garden-planner.js";
import type { GardenPlannerPanel } from "../src/panel";
import type { Hass } from "../src/types";
const params = new URLSearchParams(location.search);
const session = params.get("session") || crypto.randomUUID();
const role = params.get("role") === "reader" ? "reader" : "admin";
const endpoint = `/__test_api/${session}`;
async function command<T>(message: Record<string, unknown>): Promise<T> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...message,
      role,
      host: params.has("host"),
      demo: params.has("demo"),
    }),
  });
  const result = await response.json();
  if (!response.ok) throw result;
  return result as T;
}
const hass: Hass = {
  callWS: command,
  connection: { subscribeMessage: async () => async () => undefined },
  user: { id: `test-${role}`, name: "Test user", is_admin: role === "admin" },
  themes: { darkMode: params.has("dark") },
  language: params.get("language") || "de",
  config: { time_zone: "Europe/Berlin" },
  states: {},
};
const panel = document.querySelector<GardenPlannerPanel>(
  "garden-planner-panel",
)!;
if (params.has("dark")) {
  document.body.classList.add("dark");
  panel.setAttribute("dark", "");
}
panel.hass = hass;
// Only the development host exposes this for deliberate network/race testing.
Object.assign(window, { gardenPlannerTestHost: { hass } });
