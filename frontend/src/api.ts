import { TABLES, type Hass, type Tables, type Entity } from "./types";

export class PlannerApi {
  constructor(readonly hass: Hass) {}
  command<T>(
    operation: string,
    parameters: Record<string, unknown> = {},
  ): Promise<T> {
    if (
      this.hass.fetchWithAuth &&
      ["export", "preview_import", "import", "list", "history"].includes(
        operation,
      )
    ) {
      return this.hass
        .fetchWithAuth("/api/garden_planner/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operation, parameters }),
        })
        .then(async (response) => {
          const value: unknown = await response.json();
          if (!response.ok) throw value;
          return value as T;
        });
    }
    return this.hass.callWS<T>({
      type: "garden_planner/command",
      operation,
      parameters,
    });
  }
  async load(): Promise<Tables> {
    const records = await Promise.all(
      TABLES.map((table) => this.command<Entity[]>("list", { table })),
    );
    return Object.fromEntries(
      TABLES.map((table, i) => [table, records[i]]),
    ) as Tables;
  }
  subscribe(callback: () => void): Promise<() => Promise<void>> {
    return this.hass.connection.subscribeMessage(callback, {
      type: "garden_planner/subscribe",
    });
  }
}
