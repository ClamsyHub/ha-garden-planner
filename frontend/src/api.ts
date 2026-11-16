import { TABLES, type Hass, type Tables, type Entity } from "./types";

export class PlannerApi {
  private readonly connection: Hass["connection"];
  constructor(readonly hass: Hass) {
    this.connection = hass.connection;
  }
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
    const message = {
      type: "garden_planner/command",
      operation,
      parameters,
    };
    return this.connection.sendMessagePromise
      ? this.connection.sendMessagePromise<T>(message)
      : this.hass.callWS<T>(message);
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
