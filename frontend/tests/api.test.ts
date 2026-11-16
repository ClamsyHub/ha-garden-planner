import { describe, expect, it, vi } from "vitest";
import { PlannerApi } from "../src/api";
import type { Hass } from "../src/types";

describe("queued reminder commands", () => {
  it("remain bound to the original authenticated connection when the host changes", async () => {
    const original = vi.fn().mockResolvedValue({ cells: {} });
    const replacement = vi.fn();
    const fallback = vi.fn();
    const hass = {
      connection: { sendMessagePromise: original },
      callWS: fallback,
    } as unknown as Hass;
    const api = new PlannerApi(hass);
    hass.connection = {
      sendMessagePromise: replacement,
    } as unknown as Hass["connection"];
    await api.command("set_user_reminders", { changes: [] });
    expect(original).toHaveBeenCalledOnce();
    expect(replacement).not.toHaveBeenCalled();
    expect(fallback).not.toHaveBeenCalled();
  });
});
