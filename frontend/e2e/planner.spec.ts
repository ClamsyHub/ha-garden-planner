import type { Hass } from "../src/types";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Release each test's temporary SQLite worker rather than retaining the whole matrix.
test.afterEach(async ({ page, request }) => {
  const session = new URL(page.url()).searchParams.get("session");
  if (session) {
    const response = await request.post(`/__test_api/${session}`, {
      data: { operation: "close_test_session" },
    });
    expect(response.ok()).toBe(true);
    expect(await response.json()).toEqual({ closed: true });
  }
});

async function open(
  page: Page,
  flags: Record<string, string> = {},
): Promise<void> {
  await page.clock.setFixedTime(new Date("2026-11-06T10:00:00Z"));
  const params = new URLSearchParams({
    session: `test-${Math.random().toString(36).slice(2)}`,
    ...flags,
  });
  await page.goto(`/?${params}`);
  await expect(
    page.getByRole("heading", { name: "Übersicht", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
}
async function calendarFilter(
  page: Page,
  kind: string,
  values: string[],
): Promise<void> {
  const group = page.getByRole("group", { name: kind, exact: true });
  const details = group.locator("details");
  if (!(await details.evaluate((node) => node.hasAttribute("open"))))
    await group.locator("summary").click();
  await group
    .getByRole("button", {
      name: kind === "Kategorie" ? "Alle Kategorien" : "Alle Tätigkeiten",
    })
    .click();
  for (const value of values)
    await group.getByRole("checkbox", { name: value, exact: true }).check();
  await group.locator("summary").click();
}
async function navigate(page: Page, name: string): Promise<void> {
  await page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
}
async function addPlant(page: Page, name = "Testpflanze"): Promise<void> {
  await navigate(page, "Meine Pflanzen");
  await page
    .getByRole("button", { name: "Pflanze anlegen", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Pflanze anlegen",
    exact: true,
  });
  await dialog.getByLabel("Name *", { exact: true }).fill(name);
  await dialog
    .getByLabel("Notizen", { exact: true })
    .fill("Eigene Beobachtung, über Jahre erhalten.");
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(dialog).not.toBeVisible();
}

test("plant CRUD, winter window, variety and confirmed deletion", async ({
  page,
}) => {
  await open(page);
  await addPlant(page);
  await page.getByRole("button", { name: "Testpflanze", exact: true }).click();
  let detail = page.getByRole("dialog", { name: "Testpflanze", exact: true });
  await detail
    .getByRole("button", { name: "Tätigkeitszeitraum hinzufügen", exact: true })
    .click();
  const window = page.getByRole("dialog", {
    name: "Tätigkeitszeitraum hinzufügen",
    exact: true,
  });
  await window.getByLabel("Startmonat *").selectOption("11");
  await window.getByLabel("Starttag *").fill("15");
  await window.getByLabel("Endmonat *").selectOption("2");
  await window.getByLabel("Endtag *").fill("20");
  await window.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(window).not.toBeVisible();
  await expect(
    detail.getByRole("heading", { name: /Direktsaat.*15/ }),
  ).toBeVisible();
  await detail
    .getByRole("button", { name: "Sorte hinzufügen", exact: true })
    .click();
  const variety = page.getByRole("dialog", { name: "Sorte hinzufügen" });
  await variety.getByLabel("Name *", { exact: true }).fill("Testsorte");
  await variety.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(variety).not.toBeVisible();
  await expect(
    detail.getByRole("heading", { name: "Testsorte" }),
  ).toBeVisible();
  await detail.getByRole("button", { name: "Schließen", exact: true }).click();
  await navigate(page, "Gartenkalender");
  await page.getByRole("button", { name: "Jahr", exact: true }).click();
  await page.getByLabel("Jahr auswählen").fill("2027");
  await page.getByLabel("Jahr auswählen").press("Tab");
  await expect(
    page.getByRole("button", { name: /Testpflanze, Direktsaat, Januar 2027/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Testpflanze, Direktsaat, Juni 2027/ }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: /Testpflanze, Direktsaat, Januar 2027/ })
    .click();
  await page
    .getByRole("dialog", { name: "Direktsaat · Testpflanze", exact: true })
    .getByRole("button", { name: "Alle Pflanzendetails", exact: true })
    .click();
  detail = page.getByRole("dialog", { name: "Testpflanze", exact: true });
  await detail
    .getByRole("button", { name: "Bearbeiten", exact: true })
    .first()
    .click();
  const edit = page.getByRole("dialog", { name: "Bearbeiten", exact: true });
  await edit.getByLabel("Name *", { exact: true }).fill("Umbenannte Pflanze");
  await edit.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(edit).not.toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Umbenannte Pflanze", exact: true }),
  ).toBeVisible();
});

test("multiple years, actual sowing, event timeline and immutable snapshot", async ({
  page,
}) => {
  await open(page, { demo: "1" });
  await page
    .getByRole("button", { name: "Aussaat erfassen", exact: true })
    .click();
  const form = page.getByRole("dialog", {
    name: "Aussaat erfassen",
    exact: true,
  });
  await form
    .getByLabel("Pflanze *", { exact: true })
    .selectOption({ label: "Blattkultur · Beispiel" });
  await form.getByLabel("Datum *", { exact: true }).fill("2028-09-08");
  await form
    .getByLabel("Notizen", { exact: true })
    .fill("Mehrjährige eigene Beobachtung.");
  await form.getByLabel("Gesamtergebnis").selectOption("partial");
  await form.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(form).not.toBeVisible();
  await navigate(page, "Aussaat-Historie");
  const rows = page.getByRole("row").filter({ hasText: "2028" });
  await rows.getByRole("button", { name: "Details ansehen" }).click();
  const detail = page.getByRole("dialog", {
    name: "Blattkultur · Beispiel",
    exact: true,
  });
  await expect(
    detail
      .getByText("Mehrjährige eigene Beobachtung.", { exact: true })
      .first(),
  ).toBeVisible();
  await detail
    .getByRole("button", { name: "Ereignis erfassen", exact: true })
    .click();
  const event = page.getByRole("dialog", {
    name: "Ereignis erfassen",
    exact: true,
  });
  await event.getByLabel("Datum *").fill("2028-09-15");
  await event.getByLabel("Kulturereignis *").selectOption("germinated");
  await event
    .getByLabel("Notizen", { exact: true })
    .fill("Keimung beobachtet.");
  await event.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(event).not.toBeVisible();
  await expect(
    detail.getByText("Keimung beobachtet.", { exact: true }),
  ).toBeVisible();
  await detail.getByText("Angaben bei der Aussaat", { exact: true }).click();
  await expect(
    detail.getByText("Diese Momentaufnahme bleibt erhalten", { exact: false }),
  ).toBeVisible();
  await detail.getByRole("button", { name: "Schließen", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "2025" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "2027" })).toBeVisible();
});

test("locations and tasks work without temperature sensors", async ({
  page,
}) => {
  await open(page);
  await navigate(page, "Beete & Standorte");
  await page
    .getByRole("button", { name: "Standort anlegen", exact: true })
    .first()
    .click();
  const bed = page.getByRole("dialog", { name: "Standort anlegen" });
  await bed.getByLabel("Name *", { exact: true }).fill("Testbeet");
  await bed.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(bed).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Testbeet" })).toBeVisible();
  await navigate(page, "Aktuelle Kulturen");
  await page
    .getByRole("button", { name: "Aufgabe anlegen", exact: true })
    .click();
  const task = page.getByRole("dialog", { name: "Aufgabe anlegen" });
  await task.getByLabel("Titel *").fill("Beet prüfen");
  await task.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(task).not.toBeVisible();
  await page.getByRole("button", { name: "Als erledigt markieren" }).click();
  await page
    .getByRole("dialog", { name: "Gartenarbeit erledigen?", exact: true })
    .getByRole("button", { name: "Ja, als erledigt markieren", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Wieder öffnen" }),
  ).toBeVisible();
  await navigate(page, "Gartenkalender");
  await page.getByRole("button", { name: "Woche", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Beet prüfen ✓" }),
  ).toBeVisible();
});

test("read-only user can browse but never receives editing controls", async ({
  page,
}) => {
  await open(page, { role: "reader", demo: "1" });
  await expect(
    page.getByText("Du kannst diesen gemeinsamen Garten ansehen.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Aussaat erfassen", exact: true }),
  ).toHaveCount(0);
  await navigate(page, "Meine Pflanzen");
  await page
    .getByRole("button", { name: "Blattkultur · Beispiel", exact: true })
    .click();
  const detail = page.getByRole("dialog", {
    name: "Blattkultur · Beispiel",
    exact: true,
  });
  await expect(
    detail.getByRole("button", { name: "Bearbeiten", exact: true }),
  ).toHaveCount(0);
  await detail.getByRole("button", { name: "Schließen", exact: true }).click();
  await navigate(page, "Einstellungen");
  await expect(
    page.getByText(
      "Datensicherung und Import sind Administratoren vorbehalten.",
    ),
  ).toBeVisible();
});

test("language, dark theme, responsiveness and accessibility", async ({
  page,
}, testInfo) => {
  await open(page, { demo: "1", dark: "1" });
  const failures = (
    await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()
  ).violations;
  expect(failures).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("overview-dark.png"),
    fullPage: true,
  });
  await navigate(page, "Einstellungen");
  await page
    .getByLabel("Sprache der Oberfläche", { exact: true })
    .selectOption("en");
  await expect(
    page.getByRole("heading", { name: "Settings", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation")
      .getByRole("button", { name: "My plants", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
});

test("errors preserve unsaved input and do not claim success", async ({
  page,
}) => {
  await open(page);
  await navigate(page, "Meine Pflanzen");
  await page
    .getByRole("button", { name: "Pflanze anlegen", exact: true })
    .first()
    .click();
  const form = page.getByRole("dialog", { name: "Pflanze anlegen" });
  await form.getByLabel("Name *", { exact: true }).fill("Bleibt im Formular");
  await page.route("**/__test_api/**", async (route) => {
    if (route.request().postDataJSON().operation === "create")
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ code: "conflict" }),
      });
    else await route.continue();
  });
  await form.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("inzwischen geändert");
  await expect(form.getByLabel("Name *", { exact: true })).toHaveValue(
    "Bleibt im Formular",
  );
  await form.getByRole("button", { name: "Abbrechen", exact: true }).click();
});

test("backup and confirmed restore, JSON and CSV downloads", async ({
  page,
}) => {
  await open(page, { demo: "1" });
  await navigate(page, "Einstellungen");
  for (const name of ["JSON exportieren", "CSV-Tabellen exportieren"]) {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name, exact: true }).click();
    const file = await downloadPromise;
    expect(file.suggestedFilename()).toMatch(/garden-planner.*\.(json|zip)$/);
  }
  await page
    .getByRole("button", { name: "Sicherung erstellen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Wiederherstellung prüfen", exact: true })
    .click();
  const review = page.getByRole("dialog", { name: "Importvorschau" });
  await expect(
    review.getByRole("button", { name: "Geprüfte Sicherung wiederherstellen" }),
  ).toBeDisabled();
  await review.getByLabel("Ich möchte den Datenbestand ersetzen.").check();
  await review
    .getByRole("button", { name: "Geprüfte Sicherung wiederherstellen" })
    .click();
  await expect(review).not.toBeVisible();
  await expect(
    page.getByText("Sicherung wiederhergestellt.", { exact: true }),
  ).toBeVisible();
});

test("confirmed delete removes only an explicitly selected unused plant", async ({
  page,
}) => {
  await open(page);
  await addPlant(page, "Nur zum Löschen");
  await page
    .getByRole("button", { name: "Nur zum Löschen", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Nur zum Löschen" })
    .getByRole("button", { name: "Löschen", exact: true })
    .click();
  const confirm = page.getByRole("dialog", {
    name: "Eintrag wirklich löschen?",
  });
  await confirm.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Nur zum Löschen" }),
  ).toBeVisible();
  await page
    .getByRole("dialog", { name: "Nur zum Löschen" })
    .getByRole("button", { name: "Löschen", exact: true })
    .click();
  await confirm
    .getByRole("button", { name: "Ja, endgültig löschen", exact: true })
    .click();
  await expect(confirm).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Nur zum Löschen", exact: true }),
  ).toHaveCount(0);
});

test("JSON and CSV imports require a preview and restore deleted data", async ({
  page,
}) => {
  await open(page, { demo: "1" });
  await navigate(page, "Einstellungen");
  for (const [exportLabel, extension] of [
    ["JSON exportieren", ".json"],
    ["CSV-Tabellen exportieren", ".zip"],
  ]) {
    const waiting = page.waitForEvent("download");
    await page.getByRole("button", { name: exportLabel!, exact: true }).click();
    const downloaded = await waiting;
    const path = await downloaded.path();
    expect(downloaded.suggestedFilename()).toContain(extension!);
    await page.getByLabel("Importverfahren").selectOption("replace");
    await page.getByLabel("Datei importieren").setInputFiles(path!);
    const dialog = page.getByRole("dialog", { name: "Importvorschau" });
    await expect(
      dialog.getByRole("button", { name: "Geprüften Import übernehmen" }),
    ).toBeDisabled();
    await dialog.getByLabel("Ich möchte den Datenbestand ersetzen.").check();
    await dialog
      .getByRole("button", { name: "Geprüften Import übernehmen" })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByText("Import abgeschlossen.", { exact: true }),
    ).toBeVisible();
  }
});

test("plant search and categories filter real data and text is never HTML", async ({
  page,
}) => {
  await open(page, { demo: "1" });
  await addPlant(page, "<img src=x onerror=alert(1)>");
  await page.getByLabel("Pflanzen suchen", { exact: true }).fill("<img");
  await expect(
    page.getByRole("button", {
      name: "<img src=x onerror=alert(1)>",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.locator("garden-planner-panel").locator("img").count(),
  ).toBe(0);
  await page.getByLabel("Pflanzen suchen", { exact: true }).fill("");
  await page.getByLabel("Kategorie", { exact: true }).selectOption("herbs");
  await expect(
    page.getByRole("button", { name: "Kräuterkultur · Beispiel", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Blattkultur · Beispiel", exact: true }),
  ).toHaveCount(0);
});

test("form keyboard focus, Escape, validation and accessible labels", async ({
  page,
}) => {
  await open(page);
  await navigate(page, "Meine Pflanzen");
  const trigger = page
    .getByRole("button", { name: "Pflanze anlegen", exact: true })
    .first();
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Pflanze anlegen",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("textbox", { name: "Name *", exact: true }),
  ).toBeVisible();
  await dialog.getByLabel("Name *", { exact: true }).fill("Mit Tastatur");
  await dialog
    .getByLabel("Keimtemperatur: Minimum (°C)", { exact: true })
    .fill("30");
  await dialog
    .getByLabel("Keimtemperatur: Maximum (°C)", { exact: true })
    .fill("10");
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Zahlenbereiche");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("light appearance and calendar visual checks", async ({
  page,
}, testInfo) => {
  await open(page, { demo: "1" });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("overview-light.png"),
    fullPage: true,
    scale: "css",
  });
  await navigate(page, "Gartenkalender");
  await page.getByRole("button", { name: "Jahr", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("calendar-year.png"),
    fullPage: true,
    scale: "css",
  });
});

test("HA theme changes react and clearing the user removes cached private records", async ({
  page,
}) => {
  await open(page, { demo: "1" });
  await page
    .getByRole("button", { name: "Blattkultur · Beispiel", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Blattkultur · Beispiel", exact: true }),
  ).toBeVisible();
  await page.locator("garden-planner-panel").evaluate((element) => {
    const panel = element as HTMLElement & { hass: Hass };
    panel.hass = { ...panel.hass, themes: { darkMode: true } };
  });
  await expect(page.locator("garden-planner-panel")).toHaveAttribute(
    "dark",
    "",
  );
  await page.locator("garden-planner-panel").evaluate((element) => {
    const panel = element as HTMLElement & { hass: Hass };
    panel.hass = { ...panel.hass, user: undefined };
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("Blattkultur · Beispiel", { exact: true }),
  ).toHaveCount(0);
});

test("a late export response is discarded after the active user disappears", async ({
  page,
}) => {
  await open(page, { demo: "1" });
  await navigate(page, "Einstellungen");
  let release!: () => void;
  let requested!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const incoming = new Promise<void>((resolve) => {
    requested = resolve;
  });
  let downloads = 0;
  page.on("download", () => {
    downloads++;
  });
  await page.route("**/__test_api/**", async (route) => {
    if (route.request().postDataJSON().operation === "export") {
      requested();
      await gate;
    }
    await route.continue();
  });
  await page
    .getByRole("button", { name: "JSON exportieren", exact: true })
    .click();
  await incoming;
  await page.locator("garden-planner-panel").evaluate((element) => {
    const panel = element as HTMLElement & { hass: Hass };
    panel.hass = { ...panel.hass, user: undefined };
  });
  const response = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.request().postDataJSON().operation === "export",
  );
  release();
  await (await response).finished();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(downloads).toBe(0);
});

test("growing-window date pairs share rows on wide displays", async ({
  page,
}, testInfo) => {
  await open(page, { demo: "1" });
  await navigate(page, "Meine Pflanzen");
  await page
    .getByRole("button", { name: "Blattkultur · Beispiel", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Blattkultur · Beispiel", exact: true })
    .getByRole("button", { name: "Tätigkeitszeitraum hinzufügen", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Tätigkeitszeitraum hinzufügen",
    exact: true,
  });
  const startMonth = dialog.getByLabel("Startmonat *", { exact: true });
  const startDay = dialog.getByLabel("Starttag *", { exact: true });
  const endMonth = dialog.getByLabel("Endmonat *", { exact: true });
  const endDay = dialog.getByLabel("Endtag *", { exact: true });
  if (!testInfo.project.name.startsWith("mobile-")) {
    const [sm, sd, em, ed] = await Promise.all([
      startMonth.boundingBox(),
      startDay.boundingBox(),
      endMonth.boundingBox(),
      endDay.boundingBox(),
    ]);
    expect(sm!.y).toBe(sd!.y);
    expect(em!.y).toBe(ed!.y);
    expect(sm!.y).toBeLessThan(em!.y);
    expect(sm!.x).toBeLessThan(sd!.x);
    expect(em!.x).toBeLessThan(ed!.x);
  } else {
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: testInfo.outputPath("window-date-pairs.png"),
    scale: "css",
  });
});

test("explicit reminder settings and editor grants are editable without YAML", async ({
  page,
}) => {
  await open(page, { demo: "1", host: "1" });
  await navigate(page, "Einstellungen");
  const enable = page.getByLabel("Erinnerungen ausdrücklich aktivieren", {
    exact: true,
  });
  await expect(enable).not.toBeChecked();
  await page
    .getByLabel("Test reader: Garden Planner bearbeiten", { exact: true })
    .check();
  await page
    .getByLabel("Bisheriger gemeinsamer Kanal (optional)", { exact: true })
    .selectOption("notify.test_local");
  await enable.check();
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(
    page.getByText("Einstellungen gespeichert.", { exact: true }),
  ).toBeVisible();
  await navigate(page, "Übersicht");
  await navigate(page, "Einstellungen");
  await expect(enable).toBeChecked();
  await enable.uncheck();
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(enable).not.toBeChecked();
});

test("week view includes overlapping activity periods and keeps concrete appointments", async ({
  page,
}, testInfo) => {
  await open(page, { demo: "1" });
  await navigate(page, "Gartenkalender");
  await page.getByRole("button", { name: "Woche", exact: true }).click();
  const possible = page.getByRole("region", { name: "Diese Woche möglich" });
  await expect(
    possible.getByRole("button", {
      name: /Blattkultur · Beispiel.*Direktsaat/,
    }),
  ).toBeVisible();
  await expect(
    possible.getByText("02.11.2026 – 08.11.2026", { exact: true }),
  ).toBeVisible();
  await calendarFilter(page, "Tätigkeit", ["Vorziehen"]);
  await expect(
    possible.getByText(/Keine passenden Tätigkeitszeiträume/),
  ).toBeVisible();
  await calendarFilter(page, "Tätigkeit", []);
  await page.getByLabel("Woche auswählen", { exact: true }).fill("2026-10-30");
  await page.getByLabel("Woche auswählen", { exact: true }).press("Tab");
  await expect(possible.getByText("01.11.2026", { exact: true })).toBeVisible();
  await possible
    .getByRole("button", { name: /Blattkultur · Beispiel.*Direktsaat/ })
    .click();
  await expect(
    page.getByRole("dialog", {
      name: "Direktsaat · Blattkultur · Beispiel",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Schließen", exact: true })
    .click();
  await page.screenshot({
    path: testInfo.outputPath("weekly-windows.png"),
    scale: "css",
  });
});

test("sensor suggestions stay anchored in the form and support keyboard and touch", async ({
  page,
}, testInfo) => {
  await open(page);
  await page.evaluate(() => {
    const host = (
      window as unknown as { gardenPlannerTestHost: { hass: Hass } }
    ).gardenPlannerTestHost;
    host.hass.states = {
      "sensor.greenhouse_air": {
        state: "22",
        attributes: {
          friendly_name: "Gewächshaus Luft",
          unit_of_measurement: "°C",
        },
      },
      "sensor.soil_temperature": {
        state: "unavailable",
        attributes: {
          friendly_name: "Boden Temperatur",
          device_class: "temperature",
        },
      },
      "sensor.greenhouse_humidity": {
        state: "60",
        attributes: {
          friendly_name: "Gewächshaus Feuchte",
          unit_of_measurement: "%",
        },
      },
    };
    const panel = document.querySelector(
      "garden-planner-panel",
    ) as HTMLElement & { hass: Hass };
    panel.hass = { ...host.hass };
  });
  await navigate(page, "Beete & Standorte");
  await page
    .locator("header")
    .getByRole("button", { name: "Standort anlegen", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Standort anlegen" });
  await dialog.getByLabel("Name *", { exact: true }).fill("Sensor-Testbeet");
  const input = dialog.getByRole("combobox", {
    name: "Temperatursensor (optional)",
  });
  await input.fill("GEWÄCHS");
  const list = dialog.getByRole("listbox", {
    name: "Temperatursensor (optional)",
  });
  await expect(list.getByRole("option")).toHaveCount(1);
  const [fieldBox, listBox] = await Promise.all([
    input.boundingBox(),
    list.boundingBox(),
  ]);
  expect(Math.abs(fieldBox!.x - listBox!.x)).toBeLessThan(2);
  expect(Math.abs(fieldBox!.width - listBox!.width)).toBeLessThan(2);
  expect(
    listBox!.y >= fieldBox!.y + fieldBox!.height ||
      listBox!.y + listBox!.height <= fieldBox!.y,
  ).toBe(true);
  expect(listBox!.y).toBeGreaterThanOrEqual(0);
  expect(listBox!.y + listBox!.height).toBeLessThanOrEqual(
    (await page.viewportSize())!.height,
  );
  expect(listBox!.x + listBox!.width).toBeLessThanOrEqual(
    (await page.viewportSize())!.width,
  );
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("sensor-options.png"),
    scale: "css",
  });
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(input).toHaveValue("sensor.greenhouse_air");
  await expect(list).toBeHidden();
  await expect(dialog).toBeVisible();
  await input.fill("Boden");
  const option = list.getByRole("option", { name: /Boden Temperatur/ });
  if (testInfo.project.name.startsWith("mobile-")) await option.tap();
  else await option.click();
  await expect(input).toHaveValue("sensor.soil_temperature");
  await page.evaluate(() => {
    const host = (
      window as unknown as { gardenPlannerTestHost: { hass: Hass } }
    ).gardenPlannerTestHost;
    for (let index = 0; index < 40; index++) {
      const suffix = String(index).padStart(2, "0");
      host.hass.states![`sensor.many_${suffix}`] = {
        state: "20",
        attributes: {
          friendly_name: `Many Test ${suffix}`,
          unit_of_measurement: "°C",
        },
      };
    }
    (
      document.querySelector("garden-planner-panel") as HTMLElement & {
        hass: Hass;
      }
    ).hass = { ...host.hass };
  });
  await input.fill("Many");
  await expect(list.getByRole("option")).toHaveCount(40);
  const longList = await list.boundingBox();
  expect(longList!.y).toBeGreaterThanOrEqual(0);
  expect(longList!.y + longList!.height).toBeLessThanOrEqual(
    (await page.viewportSize())!.height,
  );
  await input.press("ArrowUp");
  const last = list.getByRole("option", { name: /Many Test 39/ });
  if (testInfo.project.name.startsWith("mobile-")) await last.tap();
  else await last.click();
  await expect(input).toHaveValue("sensor.many_39");
  await input.fill("sensor.manual_temperature");
  await expect(
    dialog.getByText(/Keine passenden Temperatursensoren/),
  ).toBeVisible();
  await input.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(list).toBeHidden();
  await dialog.getByLabel("Art der Temperaturmessung").selectOption("soil");
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByText("sensor.manual_temperature", { exact: false }),
  ).toBeVisible();
});

test("plant details keep varieties and chronological windows compact", async ({
  page,
}) => {
  await open(page);
  await addPlant(page, "Compact crop");
  await page.getByRole("button", { name: "Compact crop", exact: true }).click();
  const detail = page.getByRole("dialog", {
    name: "Compact crop",
    exact: true,
  });
  await detail
    .getByRole("button", { name: "Sorte hinzufügen", exact: true })
    .click();
  const variety = page.locator("#editor-dialog");
  await variety.getByLabel("Name *", { exact: true }).fill("Compact variety");
  await variety
    .getByLabel("Botanischer Name", { exact: true })
    .fill("Capsicum annuum");
  await variety
    .getByLabel("Notizen", { exact: true })
    .fill("Only in variety editor");
  await variety.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(variety).not.toBeVisible();
  const varietyItem = detail.locator("article").filter({
    has: page.getByRole("heading", {
      name: "Compact variety (Capsicum annuum)",
    }),
  });
  await expect(varietyItem).toBeVisible();
  await expect(varietyItem.getByText("Only in variety editor")).toHaveCount(0);
  await expect(varietyItem.locator("h3 span")).toHaveCSS("font-weight", "400");
  await varietyItem
    .getByRole("button", { name: "Bearbeiten", exact: true })
    .click();
  await expect(variety.getByLabel("Notizen", { exact: true })).toHaveValue(
    "Only in variety editor",
  );
  await variety.getByRole("button", { name: "Abbrechen", exact: true }).click();
  for (const [activity, month] of [
    ["prick_out", "3"],
    ["indoors", "2"],
  ]) {
    await detail
      .getByRole("button", {
        name: "Tätigkeitszeitraum hinzufügen",
        exact: true,
      })
      .click();
    const editor = page.locator("#editor-dialog");
    await editor
      .getByLabel("Tätigkeit *", { exact: true })
      .selectOption(activity!);
    await expect(
      editor.getByLabel("Sorte (optional)", { exact: true }),
    ).toHaveCount(0);
    await editor
      .getByLabel("Startmonat *", { exact: true })
      .selectOption(month!);
    await editor.getByLabel("Starttag *", { exact: true }).fill("1");
    await editor.getByLabel("Endmonat *", { exact: true }).selectOption(month!);
    await editor.getByLabel("Endtag *", { exact: true }).fill("28");
    await editor
      .getByLabel("Notizen", { exact: true })
      .fill("Visible window note");
    await editor
      .getByLabel("Regionale Hinweise", { exact: true })
      .fill("Only in window editor");
    await editor
      .getByRole("button", { name: "Speichern", exact: true })
      .click();
    await expect(editor).not.toBeVisible();
  }
  const windows = detail.locator("article").filter({
    has: page.getByRole("heading", {
      name: /^(Vorziehen|Pikieren) ·/,
    }),
  });
  await expect(windows).toHaveCount(2);
  await expect(windows.nth(0).getByRole("heading")).toContainText("Vorziehen");
  await expect(windows.nth(1).getByRole("heading")).toContainText("Pikieren");
  await expect(windows.nth(0).getByText("Visible window note")).toBeVisible();
  await expect(detail.getByText("Only in window editor")).toHaveCount(0);
});

test("all nine calendar activities have distinct bars and lifecycle order", async ({
  page,
}) => {
  await open(page);
  await addPlant(page, "Calendar colors");
  await page
    .getByRole("button", { name: "Calendar colors", exact: true })
    .click();
  const detail = page.getByRole("dialog", {
    name: "Calendar colors",
    exact: true,
  });
  const sequence = [
    "indoors",
    "direct",
    "prick_out",
    "transplant",
    "care",
    "fertilize",
    "prune",
    "harvest",
    "other",
  ];
  for (const activity of [...sequence].reverse()) {
    await detail
      .getByRole("button", {
        name: "Tätigkeitszeitraum hinzufügen",
        exact: true,
      })
      .click();
    const editor = page.locator("#editor-dialog");
    await editor
      .getByLabel("Tätigkeit *", { exact: true })
      .selectOption(activity);
    await editor.getByLabel("Startmonat *", { exact: true }).selectOption("11");
    await editor.getByLabel("Starttag *", { exact: true }).fill("1");
    await editor.getByLabel("Endmonat *", { exact: true }).selectOption("11");
    await editor.getByLabel("Endtag *", { exact: true }).fill("28");
    await editor
      .getByRole("button", { name: "Speichern", exact: true })
      .click();
    await expect(editor).not.toBeVisible();
  }
  await detail.getByRole("button", { name: "Schließen", exact: true }).click();
  await navigate(page, "Gartenkalender");
  await expect(page.locator(".legend > button")).toHaveCount(9);
  const colors = await page
    .locator(".legend .dot")
    .evaluateAll((nodes) =>
      nodes.map((n) => getComputedStyle(n).backgroundColor),
    );
  expect(new Set(colors).size).toBe(9);
  const labels = [
    "Vorziehen",
    "Direktsaat",
    "Pikieren",
    "Auspflanzen",
    "Pflege",
    "Düngen",
    "Rückschnitt",
    "Ernte",
    "Sonstige",
  ];
  await page.getByRole("button", { name: "Jahr", exact: true }).click();
  await expect(page.locator(".year-grid .row-title small")).toHaveText(
    labels.map((v) => new RegExp(`^${v}`)),
  );
  await expect(page.locator(".year-grid .bar")).toHaveCount(9);
  expect(
    new Set(
      await page
        .locator(".year-grid .bar")
        .evaluateAll((nodes) =>
          nodes.map((n) => getComputedStyle(n).backgroundColor),
        ),
    ).size,
  ).toBe(9);
  await page.getByRole("button", { name: "Monat", exact: true }).click();
  await expect(page.locator(".month-list .badge")).toHaveText(labels);
  await page.getByRole("button", { name: "Woche", exact: true }).click();
  await expect(page.locator(".week-window")).toHaveCount(9);
  expect(
    await page
      .locator(".week-window")
      .evaluateAll((nodes) =>
        nodes.map((n) => n.className.replace("week-window ", "")),
      ),
  ).toEqual(sequence);
  await calendarFilter(page, "Tätigkeit", ["Pikieren"]);
  await expect(page.locator(".week-window")).toHaveCount(1);
});

test("user matrix persists separate push and email selections and viewing grants", async ({
  page,
}) => {
  await open(page, { host: "1" });
  await navigate(page, "Einstellungen");
  await expect(
    page.getByLabel("Test admin: Garden Planner sehen", { exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Test reader: Garden Planner bearbeiten", { exact: true })
    .check();
  for (const [user, service] of [
    ["Test reader", "notify.push_one"],
    ["Test two", "notify.push_two"],
    ["Test three", "notify.push_three"],
  ]) {
    await page.getByLabel(`${user}: Push erhalten`, { exact: true }).check();
    await page
      .getByLabel(`${user}: Push erhalten: Gerät / Versandziel`, {
        exact: true,
      })
      .selectOption(service!);
  }
  await expect(
    page.getByLabel(
      "An bisherigen gemeinsamen Kanal senden (ggf. zusätzliche Empfänger)",
      { exact: true },
    ),
  ).not.toBeChecked();
  await page
    .getByLabel("Test reader: E-Mail erhalten", { exact: true })
    .check();
  await page
    .getByLabel("Test reader: E-Mail erhalten: Gerät / Versandziel", {
      exact: true,
    })
    .selectOption("notify.email");
  await page
    .getByLabel("Test reader: Empfänger-E-Mail-Adresse", { exact: true })
    .fill("reader@example.invalid");
  await page.getByLabel("Test three: E-Mail erhalten", { exact: true }).check();
  await page
    .getByLabel("Test three: E-Mail erhalten: Gerät / Versandziel", {
      exact: true,
    })
    .selectOption("entity:notify.email_three");
  await page
    .getByLabel("Erinnerungen ausdrücklich aktivieren", { exact: true })
    .check();
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(
    page.getByText("Einstellungen gespeichert.", { exact: true }),
  ).toBeVisible();
  await navigate(page, "Übersicht");
  await navigate(page, "Einstellungen");
  await expect(
    page.getByLabel("Test reader: Garden Planner bearbeiten", { exact: true }),
  ).toBeChecked();
  await expect(
    page.getByLabel("Test two: E-Mail erhalten", { exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByLabel("Test reader: Empfänger-E-Mail-Adresse", { exact: true }),
  ).toHaveValue("reader@example.invalid");
  await expect(
    page.getByLabel("Test three: E-Mail erhalten: Gerät / Versandziel", {
      exact: true,
    }),
  ).toHaveValue("entity:notify.email_three");
  await page
    .getByLabel("Test two: Garden Planner sehen", { exact: true })
    .uncheck();
  await expect(
    page.getByLabel("Test two: Push erhalten", { exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByLabel("Test two: Push erhalten", { exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(
    page.getByText("Einstellungen gespeichert.", { exact: true }),
  ).toBeVisible();
  for (const user of ["Test reader", "Test three"]) {
    await page.getByLabel(`${user}: Push erhalten`, { exact: true }).uncheck();
    await page
      .getByLabel(`${user}: E-Mail erhalten`, { exact: true })
      .uncheck();
  }
  await expect(
    page.getByLabel("Erinnerungen ausdrücklich aktivieren", { exact: true }),
  ).not.toBeChecked();
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(
    page.getByText("Einstellungen gespeichert.", { exact: true }),
  ).toBeVisible();
  const accessibility = await new AxeBuilder({ page })
    .include("garden-planner-panel")
    .analyze();
  expect(accessibility.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("activity periods are plant-wide and variety forms have no plant measurements", async ({
  page,
}) => {
  await open(page, { demo: "1" });
  await navigate(page, "Meine Pflanzen");
  await page
    .getByRole("button", { name: "Blattkultur · Beispiel", exact: true })
    .click();
  const detail = page.getByRole("dialog", {
    name: "Blattkultur · Beispiel",
    exact: true,
  });
  await detail
    .getByRole("button", { name: "Sorte hinzufügen", exact: true })
    .click();
  const editor = page.locator("#editor-dialog");
  await expect(
    editor.getByLabel(
      /Keimtemperatur|Keimdauer|Kulturdauer|Saattiefe|Pflanzabstand|Reihenabstand/,
    ),
  ).toHaveCount(0);
  await editor.getByLabel("Name *", { exact: true }).fill("Thai example");
  await editor.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(editor).not.toBeVisible();
  await detail
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: /^Direktsaat/ }) })
    .getByRole("button", { name: "Bearbeiten", exact: true })
    .click();
  await expect(
    editor.getByLabel("Sorte (optional)", { exact: true }),
  ).toHaveCount(0);
  await editor.getByLabel("Notizen", { exact: true }).fill("For every variety");
  await editor.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(editor).not.toBeVisible();
  await expect(
    detail.getByText("For every variety", { exact: true }),
  ).toBeVisible();
});

test("Home Assistant menu is reachable without rotating the phone", async ({
  page,
}, testInfo) => {
  await open(page, { demo: "1" });
  await page.evaluate(() => {
    document.documentElement.dataset.menuCount = "0";
    document.addEventListener("hass-toggle-menu", (event) => {
      document.documentElement.dataset.menuCount = String(
        Number(document.documentElement.dataset.menuCount) + 1,
      );
      document.documentElement.dataset.menuContract = String(
        event.bubbles && event.composed,
      );
    });
  });
  const menu = page.getByRole("button", {
    name: "Home-Assistant-Menü öffnen",
    exact: true,
  });
  await expect(menu).toBeVisible();
  if (testInfo.project.name.startsWith("mobile-")) await menu.tap();
  else await menu.click();
  await expect(page.locator("html")).toHaveAttribute("data-menu-count", "1");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(menu).toBeInViewport();
  if (testInfo.project.name.startsWith("mobile-")) await menu.tap();
  else await menu.click();
  await expect(page.locator("html")).toHaveAttribute("data-menu-count", "2");
  await expect(page.locator("html")).toHaveAttribute(
    "data-menu-contract",
    "true",
  );
});

test("plant form keeps sowing depth separate and both spacing fields together", async ({
  page,
}, testInfo) => {
  await open(page);
  await navigate(page, "Meine Pflanzen");
  await page
    .getByRole("button", { name: "Pflanze anlegen", exact: true })
    .first()
    .click();
  const editor = page.locator("#editor-dialog");
  const depth = editor.getByLabel("Saattiefe (cm)", { exact: true });
  await depth.scrollIntoViewIfNeeded();
  const [d, p, r] = await Promise.all([
    depth.boundingBox(),
    editor.getByLabel("Pflanzabstand (cm)", { exact: true }).boundingBox(),
    editor.getByLabel("Reihenabstand (cm)", { exact: true }).boundingBox(),
  ]);
  expect(d!.y).toBeLessThan(p!.y);
  if (!testInfo.project.name.startsWith("mobile-")) {
    expect(p!.y).toBe(r!.y);
    expect(p!.x).toBe(d!.x);
    expect(p!.x).toBeLessThan(r!.x);
  } else expect(p!.y).toBeLessThan(r!.y);
});

test("plant summary is compact and full information remains available", async ({
  page,
}, testInfo) => {
  await open(page);
  await navigate(page, "Meine Pflanzen");
  await page
    .getByRole("button", { name: "Pflanze anlegen", exact: true })
    .first()
    .click();
  const editor = page.locator("#editor-dialog");
  const note = "Lange eigene Beobachtung. ".repeat(160);
  await editor.getByLabel("Name *", { exact: true }).fill("Chili Übersicht");
  await editor
    .getByLabel("Botanischer Name", { exact: true })
    .fill("Capsicum annuum");
  await editor.getByLabel("Notizen", { exact: true }).fill(note);
  await editor
    .getByLabel("Keimtemperatur: optimal ab (°C)", { exact: true })
    .fill("22");
  await editor
    .getByLabel("Keimtemperatur: optimal bis (°C)", { exact: true })
    .fill("28");
  await editor
    .getByLabel("Keimdauer: mindestens (Tage)", { exact: true })
    .fill("8");
  await editor
    .getByLabel("Keimdauer: höchstens (Tage)", { exact: true })
    .fill("14");
  await editor.getByLabel("Saattiefe (cm)", { exact: true }).fill("0.5");
  await editor.getByLabel("Pflanzabstand (cm)", { exact: true }).fill("40");
  await editor.getByLabel("Reihenabstand (cm)", { exact: true }).fill("60");
  await editor
    .getByLabel("Kulturdauer: mindestens (Tage)", { exact: true })
    .fill("90");
  await editor
    .getByLabel("Kulturdauer: höchstens (Tage)", { exact: true })
    .fill("120");
  await editor.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(editor).not.toBeVisible();
  await page
    .getByRole("button", { name: "Chili Übersicht", exact: true })
    .click();
  const detail = page.locator("#detail-dialog");
  const full = detail.locator(".plant-full-information");
  await expect(full).toHaveJSProperty("open", false);
  await expect(detail.locator(".plant-quick-facts")).toContainText(
    "22 – 28 °C",
  );
  await expect(detail.locator(".plant-quick-facts")).toContainText(
    "40 / 60 cm",
  );
  await expect(detail.getByText(note, { exact: true })).not.toBeVisible();
  await detail
    .getByText("Alle Pflanzeninformationen anzeigen", { exact: true })
    .click();
  await expect(full).toHaveJSProperty("open", true);
  await expect(detail.getByText(note, { exact: true })).toBeVisible();
  await detail
    .getByText("Alle Pflanzeninformationen anzeigen", { exact: true })
    .click();
  await detail
    .getByRole("group", { name: "Pflanzenbereiche", exact: true })
    .getByRole("button", { name: "Beobachtungen", exact: true })
    .click();
  await expect(detail.locator("#plant-observations")).toBeFocused();
  await detail.evaluate((n) => (n.scrollTop = 0));
  await detail.screenshot({
    path: testInfo.outputPath("plant-summary.png"),
    scale: "css",
  });
  const accessibility = await new AxeBuilder({ page })
    .include("garden-planner-panel")
    .analyze();
  expect(accessibility.violations).toEqual([]);
});

test("calendar views share period-first details and show the matching note in tooltips", async ({
  page,
}, testInfo) => {
  await open(page);
  await navigate(page, "Meine Pflanzen");
  await page
    .getByRole("button", { name: "Pflanze anlegen", exact: true })
    .first()
    .click();
  const editor = page.locator("#editor-dialog");
  await editor.getByLabel("Name *", { exact: true }).fill("Kalenderpflanze");
  await editor
    .getByLabel("Botanischer Name", { exact: true })
    .fill("Synthetic calendar crop");
  await editor
    .getByLabel("Keimtemperatur: optimal ab (°C)", { exact: true })
    .fill("22");
  await editor
    .getByLabel("Keimtemperatur: optimal bis (°C)", { exact: true })
    .fill("28");
  await editor.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(editor).not.toBeVisible();
  await expect(page.locator(".toast")).toHaveCSS("pointer-events", "none");
  await page
    .getByRole("button", { name: "Kalenderpflanze", exact: true })
    .click();
  const plant = page.getByRole("dialog", {
    name: "Kalenderpflanze",
    exact: true,
  });
  const note = "Nur dieses Zeitfenster: <b>eigene Notiz</b>.\nZweite Zeile.";
  for (const [activity, notes] of [
    ["direct", note],
    ["care", "Notiz des anderen Zeitfensters."],
  ]) {
    await plant
      .getByRole("button", {
        name: "Tätigkeitszeitraum hinzufügen",
        exact: true,
      })
      .click();
    await editor
      .getByLabel("Tätigkeit *", { exact: true })
      .selectOption(activity!);
    await editor.getByLabel("Startmonat *", { exact: true }).selectOption("11");
    await editor.getByLabel("Starttag *", { exact: true }).fill("1");
    await editor.getByLabel("Endmonat *", { exact: true }).selectOption("11");
    await editor.getByLabel("Endtag *", { exact: true }).fill("30");
    await editor.getByLabel("Notizen", { exact: true }).fill(notes!);
    await editor
      .getByRole("button", { name: "Speichern", exact: true })
      .click();
    await expect(editor).not.toBeVisible();
  }
  await plant.getByRole("button", { name: "Schließen", exact: true }).click();
  await navigate(page, "Gartenkalender");
  await expect(page.locator(".segmented").getByRole("button")).toHaveText([
    "Jahr",
    "Monat",
    "Woche",
  ]);
  for (const mode of ["Jahr", "Monat", "Woche"]) {
    await page.getByRole("button", { name: mode, exact: true }).click();
    const entry =
      mode === "Jahr"
        ? page.getByRole("button", {
            name: /Kalenderpflanze, Direktsaat, November 2026/,
          })
        : mode === "Monat"
          ? page.locator(".month-event.direct")
          : page.locator(".week-window.direct");
    expect(await entry.getAttribute("title")).toContain(note);
    if (mode === "Monat")
      await expect(entry.locator(".badge")).toHaveAttribute("title", note);
    if (mode === "Jahr") {
      await entry.focus();
      await entry.press("Enter");
    } else if (testInfo.project.name.startsWith("mobile-")) await entry.tap();
    else await entry.click();
    const detail = page.getByRole("dialog", {
      name: "Direktsaat · Kalenderpflanze",
      exact: true,
    });
    await expect(detail).toBeVisible();
    await expect(detail.locator(".calendar-window-note")).toHaveText(
      /Nur dieses Zeitfenster/,
    );
    await expect(
      detail.getByText("Notiz des anderen Zeitfensters.", { exact: true }),
    ).toHaveCount(0);
    await expect(detail.locator(".calendar-plant-profile")).toContainText(
      "Kalenderpflanze",
    );
    await expect(detail.locator(".calendar-plant-profile")).toContainText(
      "22 – 28 °C",
    );
    const [windowBox, profileBox] = await Promise.all([
      detail.locator(".calendar-window-card").boundingBox(),
      detail.locator(".calendar-plant-profile").boundingBox(),
    ]);
    expect(windowBox!.y).toBeLessThan(profileBox!.y);
    await expect(detail.locator("b")).toHaveCount(0);
    if (mode === "Jahr") {
      await detail.screenshot({
        path: testInfo.outputPath("calendar-period-detail.png"),
        scale: "css",
      });
      const a11y = await new AxeBuilder({ page })
        .include("garden-planner-panel")
        .analyze();
      expect(a11y.violations).toEqual([]);
    }
    await detail
      .getByRole("button", { name: "Schließen", exact: true })
      .click();
  }
});

test("read-only users can inspect calendar windows and open the full plant profile", async ({
  page,
}) => {
  await open(page, { demo: "1", role: "reader" });
  await navigate(page, "Gartenkalender");
  await page.getByRole("button", { name: "Woche", exact: true }).click();
  const entry = page.locator(".week-window.direct");
  await entry.click();
  const detail = page.getByRole("dialog", {
    name: "Direktsaat · Blattkultur · Beispiel",
    exact: true,
  });
  await expect(detail.locator(".calendar-window-card")).toBeVisible();
  await expect(
    detail.getByRole("button", {
      name: "Tätigkeitszeitraum bearbeiten",
      exact: true,
    }),
  ).toHaveCount(0);
  await detail
    .getByRole("button", { name: "Alle Pflanzendetails", exact: true })
    .click();
  const full = page.getByRole("dialog", {
    name: "Blattkultur · Beispiel",
    exact: true,
  });
  await expect(full).toBeVisible();
  await expect(
    full.getByRole("button", { name: "Bearbeiten", exact: true }),
  ).toHaveCount(0);
  await full.getByRole("button", { name: "Schließen", exact: true }).click();
  await expect(entry).toBeFocused();
});

test("long calendar notes remain complete behind a compact preview and editable", async ({
  page,
}) => {
  await open(page, { demo: "1" });
  await navigate(page, "Gartenkalender");
  await page.getByRole("button", { name: "Woche", exact: true }).click();
  await page.locator(".week-window.direct").click();
  const detail = page.getByRole("dialog", {
    name: "Direktsaat · Blattkultur · Beispiel",
    exact: true,
  });
  await detail
    .getByRole("button", { name: "Tätigkeitszeitraum bearbeiten", exact: true })
    .click();
  const editor = page.locator("#editor-dialog");
  const note = "Lange eigene Kalendernotiz. ".repeat(80);
  await editor.getByLabel("Notizen", { exact: true }).fill(note);
  await editor.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(editor).not.toBeVisible();
  await expect(detail.getByText(note, { exact: true })).not.toBeVisible();
  await detail
    .getByText("Vollständige Notiz anzeigen", { exact: true })
    .click();
  await expect(detail.getByText(note, { exact: true })).toBeVisible();
});

test("calendar combines multiple category and activity filters across all views", async ({
  page,
}) => {
  await open(page, { demo: "1" });
  await navigate(page, "Gartenkalender");
  await calendarFilter(page, "Kategorie", ["Gemüse", "Blumen"]);
  await calendarFilter(page, "Tätigkeit", ["Direktsaat", "Auspflanzen"]);
  await page.getByRole("button", { name: "Jahr", exact: true }).click();
  await expect(page.locator(".year-grid .row-title")).toHaveCount(2);
  await expect(page.locator(".year-grid .row-title")).toContainText([
    "Blattkultur",
    "Blütenkultur",
  ]);
  await page.getByRole("button", { name: "Monat", exact: true }).click();
  await expect(page.locator(".month-event")).toHaveCount(1);
  await page.getByRole("button", { name: "Woche", exact: true }).click();
  await expect(page.locator(".week-window")).toHaveCount(1);
  await expect(page.locator(".week-event")).toHaveCount(0);
  await calendarFilter(page, "Tätigkeit", ["Direktsaat", "Pflege"]);
  await expect(page.locator(".week-window")).toHaveCount(1);
  await expect(
    page.getByText("Beet kontrollieren · Beispiel", { exact: true }),
  ).toBeVisible();
  await calendarFilter(page, "Kategorie", ["Blumen"]);
  await expect(page.locator(".week-window")).toHaveCount(0);
  await calendarFilter(page, "Kategorie", []);
  await expect(page.locator(".week-window")).toHaveCount(1);
  await calendarFilter(page, "Tätigkeit", []);
  await page.getByRole("button", { name: "Jahr", exact: true }).click();
  await expect(page.locator(".year-grid .row-title")).toHaveCount(4);
  const group = page.getByRole("group", { name: "Tätigkeit", exact: true });
  await group.locator("summary").click();
  const a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(a11y.violations).toEqual([]);
});

test("year headings stay visible while scrolling vertically and the corner stays left", async ({
  page,
}, testInfo) => {
  await open(page, { demo: "1" });
  // Repeat synthetic fixtures only in this UI stress case, preserving actual IDs for selection.
  await page.evaluate(() => {
    const panel = document.querySelector(
      "garden-planner-panel",
    ) as HTMLElement & {
      tables: { growing_windows: unknown[] };
      requestUpdate(): void;
    };
    panel.tables = {
      ...panel.tables,
      growing_windows: Array.from(
        { length: 16 },
        () => panel.tables.growing_windows,
      ).flat(),
    };
    panel.requestUpdate();
  });
  await navigate(page, "Gartenkalender");
  await page.getByRole("button", { name: "Jahr", exact: true }).click();
  const scroll = page.locator(".year-scroll");
  await scroll.scrollIntoViewIfNeeded();
  const head = scroll.locator(".month-head").nth(1);
  const corner = scroll.locator(".month-head").first();
  const before = await head.boundingBox();
  const cornerBefore = await corner.boundingBox();
  await scroll.evaluate((node) => {
    node.scrollTop = 500;
    node.scrollLeft = 350;
  });
  await expect
    .poll(() =>
      head.evaluate((node) => Math.round(node.getBoundingClientRect().y)),
    )
    .toBe(Math.round(before!.y));
  await expect
    .poll(() =>
      corner.evaluate((node) => Math.round(node.getBoundingClientRect().x)),
    )
    .toBe(Math.round(cornerBefore!.x));
  const bounds = await scroll.boundingBox();
  const h = await corner.boundingBox();
  expect(h!.y).toBeGreaterThanOrEqual(bounds!.y);
  expect(h!.y + h!.height).toBeLessThan(bounds!.y + bounds!.height);
  await page.screenshot({
    path: testInfo.outputPath("year-sticky-headers.png"),
    scale: "css",
  });
});

test("personal reminder matrix works for readers and defaults newly available activities on", async ({
  page,
}, testInfo) => {
  await open(page, { demo: "1", host: "1", role: "reader" });
  const navigation = page.getByRole("navigation");
  const names = await navigation.getByRole("button").allTextContents();
  expect(names.indexOf("Erinnerungen")).toBe(
    names.indexOf("Beete & Standorte") + 1,
  );
  await navigate(page, "Erinnerungen");
  const matrix = page.getByRole("table");
  const direct = matrix.getByRole("checkbox", {
    name: "Blattkultur · Beispiel: Direktsaat",
    exact: true,
  });
  const care = matrix.getByRole("checkbox", {
    name: "Blattkultur · Beispiel: Pflege",
    exact: true,
  });
  await expect(direct).toBeChecked();
  await expect(care).toBeDisabled();
  await expect(care).not.toBeChecked();
  await expect(matrix.locator("input:checked")).toHaveCount(4);
  await expect(
    page.getByText(/Der Erinnerungsversand ist global ausgeschaltet/),
  ).toBeVisible();
  await direct.uncheck();
  await expect(direct).not.toBeChecked();
  await expect(direct).toBeEnabled();
  await navigate(page, "Übersicht");
  await navigate(page, "Erinnerungen");
  await expect(direct).not.toBeChecked();
  await page.reload();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
  await navigate(page, "Erinnerungen");
  await expect(direct).not.toBeChecked();
  const session = new URL(page.url()).searchParams.get("session");
  async function command(
    operation: string,
    parameters: Record<string, unknown>,
  ) {
    const response = await page.request.post(`/__test_api/${session}`, {
      data: { operation, parameters, role: "admin", host: true },
    });
    expect(response.ok()).toBe(true);
    return response.json();
  }
  const plants = await command("list", { table: "plants" });
  const plant = plants.find(
    (p: { data: { name: string } }) => p.data.name === "Blattkultur · Beispiel",
  );
  const data = {
    plant_id: plant.id,
    activity: "care",
    environment: "outdoors",
    start_month: 11,
    start_day: 1,
    end_month: 11,
    end_day: 30,
  };
  let window = await command("create", { table: "growing_windows", data });
  await page
    .getByRole("button", { name: "Aktualisieren", exact: true })
    .click();
  await expect(care).toBeEnabled();
  await expect(care).toBeChecked();
  await care.uncheck();
  await expect(page.locator(".reminder-save-status")).toHaveText("");
  await expect(care).toBeEnabled();
  await expect(care).not.toBeChecked();
  await command("delete", {
    table: "growing_windows",
    id: window.id,
    revision: window.revision,
    confirm: true,
  });
  await page
    .getByRole("button", { name: "Aktualisieren", exact: true })
    .click();
  await expect(care).toBeDisabled();
  window = await command("create", { table: "growing_windows", data });
  await page
    .getByRole("button", { name: "Aktualisieren", exact: true })
    .click();
  await expect(care).toBeEnabled();
  await expect(care).toBeChecked();
  await expect(direct).not.toBeChecked();
  const owner = await command("get_user_reminders", {});
  expect(owner.cells[plant.id].direct).toBe(true);
  const a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(a11y.violations).toEqual([]);
  await matrix.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("personal-reminders.png"),
    scale: "css",
  });
});

test("failed personal reminder save preserves the previous checkbox state", async ({
  page,
}) => {
  await open(page, { demo: "1", host: "1", role: "reader" });
  await navigate(page, "Erinnerungen");
  const input = page.getByRole("checkbox", {
    name: "Blattkultur · Beispiel: Direktsaat",
    exact: true,
  });
  await expect(input).toBeChecked();
  await page.route("**/__test_api/**", async (route) => {
    const data = route.request().postDataJSON();
    if (data.operation === "set_user_reminders")
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ code: "invalid_data" }),
      });
    else await route.continue();
  });
  await input.click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(input).toBeChecked();
  await expect(input).toBeEnabled();
});

test("selected activity periods become private tasks that readers can complete without regeneration", async ({
  page,
}) => {
  await open(page, { demo: "1", host: "1", role: "reader" });
  const session = new URL(page.url()).searchParams.get("session");
  async function api(
    operation: string,
    parameters: Record<string, unknown>,
    role = "reader",
  ) {
    const response = await page.request.post(`/__test_api/${session}`, {
      data: { operation, parameters, role, host: true },
    });
    expect(response.ok()).toBe(true);
    return response.json();
  }
  const tasks = await api("list", { table: "tasks" });
  const task = tasks.find(
    (r: { data: { personal_generated?: boolean; date: string } }) =>
      r.data.personal_generated && r.data.date === "2026-11-01",
  );
  expect(task).toBeTruthy();
  const card = page.locator(`#task-${task.id}`);
  await expect(card).toBeVisible();
  const manual = page
    .locator(".task-card")
    .filter({ hasText: "Beet kontrollieren · Beispiel" });
  await expect(
    manual.getByRole("button", { name: "Als erledigt markieren" }),
  ).toHaveCount(0);
  await navigate(page, "Gartenkalender");
  await page.getByRole("button", { name: "Woche", exact: true }).click();
  await page.getByLabel("Woche auswählen", { exact: true }).fill("2026-11-01");
  await page.getByLabel("Woche auswählen", { exact: true }).press("Tab");
  await page.locator(".week-event.direct").click();
  await expect(
    page.getByRole("heading", { name: "Aktuelle Kulturen", exact: true }),
  ).toBeVisible();
  await expect(card).toBeFocused();
  await card
    .getByRole("button", { name: "Als erledigt markieren", exact: true })
    .click();
  const confirmTask = page.getByRole("dialog", {
    name: "Gartenarbeit erledigen?",
    exact: true,
  });
  await confirmTask
    .getByRole("button", { name: "Ja, als erledigt markieren", exact: true })
    .click();
  await expect(confirmTask).not.toBeVisible();
  await expect(
    card.getByRole("button", { name: "Wieder öffnen", exact: true }),
  ).toBeVisible();
  await navigate(page, "Übersicht");
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
  await expect(card).toHaveCount(0);
  const current = await api("get", { table: "tasks", id: task.id });
  expect(current.data.completed).toBe(true);
  await navigate(page, "Erinnerungen");
  const selected = page.getByRole("checkbox", {
    name: "Blattkultur · Beispiel: Direktsaat",
    exact: true,
  });
  await selected.uncheck();
  await expect(page.locator(".reminder-save-status")).toHaveText("");
  await expect(selected).toBeEnabled();
  let own = await api("list", { table: "tasks" });
  expect(
    own.filter(
      (r: { data: { source_window_id?: string } }) =>
        r.data.source_window_id === task.data.source_window_id,
    ),
  ).toHaveLength(1);
  await selected.check();
  await expect(page.locator(".reminder-save-status")).toHaveText("");
  await expect(selected).toBeEnabled();
  own = await api("list", { table: "tasks" });
  expect(own.filter((r: { id: string }) => r.id === task.id)).toHaveLength(1);
  expect(own.find((r: { id: string }) => r.id === task.id).data.completed).toBe(
    true,
  );
  const other = await api("list", { table: "tasks" }, "admin");
  const ownIds = new Set(
    own
      .filter(
        (r: { data: { personal_generated?: boolean } }) =>
          r.data.personal_generated,
      )
      .map((r: { id: string }) => r.id),
  );
  expect(
    other.filter(
      (r: { id: string; data: { personal_generated?: boolean } }) =>
        r.data.personal_generated && ownIds.has(r.id),
    ),
  ).toHaveLength(0);
  const foreignTask = other.find(
    (r: { data: { personal_generated?: boolean } }) =>
      r.data.personal_generated,
  );
  const forbidden = await page.request.post(`/__test_api/${session}`, {
    data: {
      operation: "get",
      parameters: { table: "tasks", id: foreignTask.id },
      role: "reader",
      host: true,
    },
  });
  expect(forbidden.ok()).toBe(false);
});

test("reminder checkboxes stay responsive during saving and persist the latest choice", async ({
  page,
}) => {
  await open(page, { demo: "1", host: "1", role: "reader" });
  await navigate(page, "Erinnerungen");
  const direct = page.getByRole("checkbox", {
    name: "Blattkultur · Beispiel: Direktsaat",
    exact: true,
  });
  await expect(direct).toBeChecked();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started!: () => void;
  const received = new Promise<void>((resolve) => {
    started = resolve;
  });
  const batches: unknown[] = [];
  const operations: string[] = [];
  await page.route("**/__test_api/**", async (route) => {
    const data = route.request().postDataJSON();
    operations.push(data.operation);
    if (data.operation === "set_user_reminders") {
      batches.push(data.parameters.changes);
      if (batches.length === 1) {
        started();
        await gate;
      }
    }
    await route.continue();
  });
  await direct.uncheck();
  await received;
  await expect(direct).toBeEnabled();
  await direct.check();
  await expect(direct).toBeChecked();
  await expect(page.locator(".reminder-save-status")).not.toHaveText("");
  release();
  await expect(page.locator(".reminder-save-status")).toHaveText("");
  await expect(direct).toBeChecked();
  expect(batches).toHaveLength(2);
  expect(operations).toEqual(["set_user_reminders", "set_user_reminders"]);
  await page.reload();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
  await navigate(page, "Erinnerungen");
  await expect(direct).toBeChecked();
});

test("calendar filters keep their width and close on outside click and Escape", async ({
  page,
}, testInfo) => {
  await open(page, { demo: "1" });
  await navigate(page, "Gartenkalender");
  const group = page.getByRole("group", { name: "Tätigkeit", exact: true });
  const summary = group.locator("summary");
  const before = await summary.boundingBox();
  await calendarFilter(page, "Tätigkeit", ["Pflege"]);
  const after = await summary.boundingBox();
  expect(Math.abs(before!.width - after!.width)).toBeLessThan(1);
  await summary.click();
  await expect(
    group.getByRole("checkbox", { name: "Vorziehen", exact: true }),
  ).toBeVisible();
  await group.getByRole("checkbox", { name: "Vorziehen", exact: true }).check();
  await page
    .getByRole("heading", { name: "Gartenkalender", exact: true })
    .click();
  await expect(group.locator("details")).not.toHaveAttribute("open");
  await summary.click();
  await expect(
    group.getByRole("checkbox", { name: "Pflege", exact: true }),
  ).toBeChecked();
  await expect(
    group.getByRole("checkbox", { name: "Vorziehen", exact: true }),
  ).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(group.locator("details")).not.toHaveAttribute("open");
  for (const mode of ["Jahr", "Monat", "Woche"]) {
    await page
      .locator(".segmented")
      .getByRole("button", { name: mode, exact: true })
      .click();
    const input = await page
      .locator(".calendar-navigation input")
      .boundingBox();
    const previous = await page
      .getByRole("button", { name: "Zurück", exact: true })
      .boundingBox();
    const next = await page
      .getByRole("button", { name: "Weiter", exact: true })
      .boundingBox();
    expect(input!.x).toBeGreaterThanOrEqual(previous!.x + previous!.width);
    expect(input!.x + input!.width).toBeLessThanOrEqual(next!.x);
    expect(Math.abs(input!.y - next!.y)).toBeLessThan(1);
  }
  if (testInfo.project.name === "desktop-chromium") {
    const boxes = await page
      .locator(".calendar-filters > label input, .calendar-filters summary")
      .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().y));
    expect(Math.max(...boxes) - Math.min(...boxes)).toBeLessThan(1);
  }
  await page.locator(".calendar-navigation").screenshot({
    path: testInfo.outputPath("calendar-date-controls-v018.png"),
    scale: "css",
  });
  await page.screenshot({
    path: testInfo.outputPath("calendar-controls-v018.png"),
    scale: "css",
  });
});

test("mobile reminder matrix leaves room to scroll activities", async ({
  page,
}, testInfo) => {
  await open(page, { demo: "1", host: "1", role: "reader" });
  await navigate(page, "Erinnerungen");
  await expect(page.getByRole("table")).toBeVisible();
  const region = page.locator(".reminders-scroll");
  const corner = page.locator(".reminders-table thead th").first();
  const before = await corner.boundingBox();
  if ((page.viewportSize()?.width ?? 0) < 600) {
    const bounds = await region.boundingBox();
    expect(before!.width).toBeLessThanOrEqual(120);
    expect(bounds!.width - before!.width).toBeGreaterThan(170);
    await region.evaluate((n) => {
      n.scrollLeft = 350;
    });
    const after = await corner.boundingBox();
    expect(Math.abs(before!.x - after!.x)).toBeLessThan(1);
  }
  await page.screenshot({
    path: testInfo.outputPath("reminders-mobile-v018.png"),
    scale: "css",
  });
});

test("a failed reminder batch rolls back only that batch while later choices save", async ({
  page,
}) => {
  await open(page, { demo: "1", host: "1", role: "reader" });
  await navigate(page, "Erinnerungen");
  const inputs = page.locator(".reminders-table input:enabled");
  await expect(inputs).toHaveCount(4);
  let release!: () => void, started!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const received = new Promise<void>((resolve) => {
    started = resolve;
  });
  let calls = 0;
  await page.route("**/__test_api/**", async (route) => {
    if (
      route.request().postDataJSON().operation === "set_user_reminders" &&
      ++calls === 1
    ) {
      started();
      await gate;
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ code: "invalid_data" }),
      });
    } else await route.continue();
  });
  await inputs.nth(0).uncheck();
  await received;
  await inputs.nth(1).uncheck();
  release();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator(".reminder-save-status")).toHaveText("");
  await expect(inputs.nth(0)).toBeChecked();
  await expect(inputs.nth(1)).not.toBeChecked();
  await page.reload();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
  await navigate(page, "Erinnerungen");
  await expect(inputs.nth(0)).toBeChecked();
  await expect(inputs.nth(1)).not.toBeChecked();
});

test("large reminder matrix batches rapid changes without disabling other plants", async ({
  page,
}, testInfo) => {
  await open(page, { host: "1", role: "reader" });
  const session = new URL(page.url()).searchParams.get("session");
  async function api(
    operation: string,
    parameters: Record<string, unknown> = {},
  ) {
    const response = await page.request.post(`/__test_api/${session}`, {
      data: { operation, parameters, role: "admin", host: true },
    });
    expect(response.ok()).toBe(true);
    return response.json();
  }
  const payload = await api("export");
  const stamp = "2026-11-06T10:00:00+00:00";
  for (let i = 0; i < 200; i++) {
    const id = `matrix-plant-${i}`;
    payload.tables.plants.push({
      id,
      revision: 1,
      created_at: stamp,
      updated_at: stamp,
      data: {
        name: `Pflanze ${String(i).padStart(3, "0")} mit einem sehr langen Pflanzennamen`,
      },
    });
    payload.tables.growing_windows.push({
      id: `matrix-window-${i}`,
      revision: 1,
      created_at: stamp,
      updated_at: stamp,
      data: {
        plant_id: id,
        activity: "direct",
        environment: "outdoors",
        start_month: 11,
        start_day: 6,
        end_month: 11,
        end_day: 30,
      },
    });
  }
  const preview = await api("preview_import", { payload });
  await api("import", { payload, token: preview.token });
  await page.reload();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
  await navigate(page, "Erinnerungen");
  const inputs = page.locator(".reminders-table input:enabled");
  await expect(inputs).toHaveCount(200);
  const batches: { enabled: boolean }[][] = [];
  await page.route("**/__test_api/**", async (route) => {
    const data = route.request().postDataJSON();
    if (data.operation === "set_user_reminders")
      batches.push(data.parameters.changes);
    await route.continue();
  });
  // A single input burst fits inside the debounce window, independent of machine speed.
  await inputs.evaluateAll((nodes) =>
    nodes.slice(0, 20).forEach((node) => {
      (node as HTMLInputElement).checked = false;
      node.dispatchEvent(new Event("change", { bubbles: true }));
    }),
  );
  await expect(inputs.nth(0)).not.toBeChecked();
  await expect(inputs.nth(19)).not.toBeChecked();
  await expect(inputs.nth(199)).toBeEnabled();
  await expect(page.locator(".reminder-save-status")).toHaveText("");
  expect(batches).toHaveLength(1);
  expect(batches[0]).toHaveLength(20);
  const corner = await page
    .locator(".reminders-table thead th")
    .first()
    .boundingBox();
  if ((page.viewportSize()?.width ?? 0) < 600)
    expect(corner!.width).toBeLessThanOrEqual(120);
  await page.locator(".reminders-scroll").screenshot({
    path: testInfo.outputPath("large-matrix-v018.png"),
    scale: "css",
  });
  await page.reload();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
  await navigate(page, "Erinnerungen");
  await expect(inputs.nth(0)).not.toBeChecked();
  await expect(inputs.nth(19)).not.toBeChecked();
  await expect(inputs.nth(20)).toBeChecked();
});

test("perennial activity reminders default on and create private tasks per selection", async ({
  page,
}) => {
  await open(page, { host: "1", role: "reader" });
  const session = new URL(page.url()).searchParams.get("session");
  async function api(
    operation: string,
    parameters: Record<string, unknown> = {},
    role = "admin",
  ) {
    const response = await page.request.post(`/__test_api/${session}`, {
      data: { operation, parameters, role, host: true },
    });
    expect(response.ok()).toBe(true);
    return response.json();
  }
  const plant = await api("create", {
    table: "plants",
    data: { name: "Himbeere" },
  });
  for (const activity of ["fertilize", "prune"])
    await api("create", {
      table: "growing_windows",
      data: {
        plant_id: plant.id,
        activity,
        environment: "outdoors",
        start_month: 11,
        start_day: 6,
        end_month: 11,
        end_day: 30,
      },
    });
  await page.reload();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
  await navigate(page, "Erinnerungen");
  const fertilize = page.getByRole("checkbox", {
    name: "Himbeere: Düngen",
    exact: true,
  });
  const prune = page.getByRole("checkbox", {
    name: "Himbeere: Rückschnitt",
    exact: true,
  });
  await expect(fertilize).toBeChecked();
  await expect(prune).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Himbeere: Vorziehen", exact: true }),
  ).toBeDisabled();
  await prune.uncheck();
  await expect(page.locator(".reminder-save-status")).toHaveText("");
  let tasks = await api("list", { table: "tasks" }, "reader");
  expect(
    tasks.every(
      (r: { data: { activity: string } }) => r.data.activity === "fertilize",
    ),
  ).toBe(true);
  expect(tasks.length).toBeGreaterThan(0);
  const other = await api("get_user_reminders");
  expect(other.cells[plant.id].prune).toBe(true);
  await prune.check();
  await expect(page.locator(".reminder-save-status")).toHaveText("");
  tasks = await api("list", { table: "tasks" }, "reader");
  expect(
    new Set(tasks.map((r: { data: { activity: string } }) => r.data.activity)),
  ).toEqual(new Set(["fertilize", "prune"]));
  await page.reload();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
  await navigate(page, "Erinnerungen");
  await expect(prune).toBeChecked();
});

test("calendar native date fields remain inside their column at narrow widths", async ({
  page,
}, testInfo) => {
  await open(page, { demo: "1" });
  await navigate(page, "Gartenkalender");
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 900 });
    for (const mode of ["Monat", "Woche"]) {
      await page
        .locator(".segmented")
        .getByRole("button", { name: mode, exact: true })
        .click();
      const nav = page.locator(".calendar-navigation");
      const label = nav.locator("label");
      const input = nav.locator("input");
      const next = nav.getByRole("button", { name: "Weiter", exact: true });
      const field = await input.boundingBox(),
        container = await label.boundingBox(),
        arrow = await next.boundingBox();
      expect(field!.x + field!.width).toBeLessThanOrEqual(
        container!.x + container!.width + 0.5,
      );
      expect(container!.x + container!.width).toBeLessThan(arrow!.x);
      await expect(label).toHaveCSS("overflow", "hidden");
      await expect(label).toHaveCSS("contain", "inline-size");
      await expect(input).toHaveCSS("appearance", "none");
      await input.fill(mode === "Monat" ? "2026-09" : "2026-11-16");
      await input.press("Tab");
      const old = await input.inputValue();
      await next.click();
      await expect(input).not.toHaveValue(old);
      await nav.getByRole("button", { name: "Zurück", exact: true }).click();
      await expect(input).toHaveValue(old);
      if (width === 390)
        await nav.screenshot({
          path: testInfo.outputPath(`native-date-${mode}-v019.png`),
          scale: "css",
        });
    }
  }
});

test("generated work displays its full period in overview and task list", async ({
  page,
}) => {
  await open(page, { host: "1", role: "reader" });
  const session = new URL(page.url()).searchParams.get("session");
  async function api(operation: string, parameters: Record<string, unknown>) {
    const response = await page.request.post(`/__test_api/${session}`, {
      data: { operation, parameters, role: "admin", host: true },
    });
    expect(response.ok()).toBe(true);
    return response.json();
  }
  const plant = await api("create", {
    table: "plants",
    data: { name: "Kiwi" },
  });
  await api("create", {
    table: "growing_windows",
    data: {
      plant_id: plant.id,
      activity: "prune",
      environment: "outdoors",
      start_month: 1,
      start_day: 15,
      end_month: 2,
      end_day: 28,
      notes: "Notiz zum Rückschnitt",
    },
  });
  await page.reload();
  const card = page
    .locator(".task-card")
    .filter({ hasText: "Kiwi: Rückschnitt" })
    .first();
  await expect(card).toContainText("Rückschnitt · 15.01.2027 bis 28.02.2027");
  await expect(card).toContainText("Notiz zum Rückschnitt");
  await navigate(page, "Aktuelle Kulturen");
  await expect(card).toContainText("15.01.2027 bis 28.02.2027");
  await card
    .getByRole("button", { name: "Als erledigt markieren", exact: true })
    .click();
  const confirmTask = page.getByRole("dialog", {
    name: "Gartenarbeit erledigen?",
    exact: true,
  });
  await confirmTask
    .getByRole("button", { name: "Ja, als erledigt markieren", exact: true })
    .click();
  await expect(confirmTask).not.toBeVisible();
  await page.reload();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
  await navigate(page, "Aktuelle Kulturen");
  await expect(card).toContainText("15.01.2027 bis 28.02.2027");
});

test("task completion requires an explicit confirmation and cancel preserves the task", async ({
  page,
}) => {
  await open(page, { demo: "1", host: "1", role: "reader" });
  const card = page
    .locator(".task-card")
    .filter({ hasText: "Blattkultur · Beispiel: Direktsaat" })
    .first();
  await expect(card).toBeVisible();
  let writes = 0;
  await page.route("**/__test_api/**", async (route) => {
    if (
      route.request().postDataJSON().operation === "set_personal_task_completed"
    )
      writes++;
    await route.continue();
  });
  const button = card.getByRole("button", {
    name: "Als erledigt markieren",
    exact: true,
  });
  await button.click();
  const dialog = page.getByRole("dialog", {
    name: "Gartenarbeit erledigen?",
    exact: true,
  });
  await expect(dialog).toContainText("Blattkultur · Beispiel: Direktsaat");
  expect(writes).toBe(0);
  await dialog.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(button).toBeFocused();
  await expect(card).toBeVisible();
  await button.click();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  expect(writes).toBe(0);
  await button.click();
  await dialog
    .getByRole("button", { name: "Ja, als erledigt markieren", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  expect(writes).toBe(1);
});

test("neighbors link catalog plants reciprocally and retain optional free names", async ({
  page,
}, testInfo) => {
  await open(page, { demo: "1" });
  await addPlant(page, "Buschbohne");
  await addPlant(page, "Erdbeere");
  await navigate(page, "Nachbarn");
  const selector = page.getByLabel("Pflanze auswählen", { exact: true });
  await selector.selectOption({ label: "Buschbohne" });
  await page
    .getByRole("button", { name: "Nachbarn bearbeiten", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Nachbarn bearbeiten · Buschbohne",
    exact: true,
  });
  await dialog
    .getByRole("checkbox", { name: "Erdbeere: Gute Nachbarn", exact: true })
    .check();
  await expect(
    dialog.getByRole("checkbox", {
      name: "Buschbohne: Gute Nachbarn",
      exact: true,
    }),
  ).toHaveCount(0);
  await dialog
    .getByLabel("Weitere schlechte Nachbarn (ein Name pro Zeile)", {
      exact: true,
    })
    .fill("Fenchel\n<b>Ungepflegter Name</b>");
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".neighbor-group").first()).toContainText(
    "Erdbeere",
  );
  await expect(page.locator(".neighbor-group").last()).toContainText("Fenchel");
  await expect(page.locator(".neighbor-group b")).toHaveCount(0);
  await selector.selectOption({ label: "Erdbeere" });
  await expect(page.locator(".neighbor-group").first()).toContainText(
    "Buschbohne",
  );
  await page
    .getByRole("button", { name: "Nachbarn bearbeiten", exact: true })
    .click();
  const reverse = page.getByRole("dialog", {
    name: "Nachbarn bearbeiten · Erdbeere",
    exact: true,
  });
  await reverse
    .getByRole("checkbox", {
      name: "Buschbohne: Schlechte Nachbarn",
      exact: true,
    })
    .check();
  await expect(
    reverse.getByRole("checkbox", {
      name: "Buschbohne: Gute Nachbarn",
      exact: true,
    }),
  ).not.toBeChecked();
  await reverse.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(reverse).not.toBeVisible();
  await selector.selectOption({ label: "Buschbohne" });
  await expect(page.locator(".neighbor-group").last()).toContainText(
    "Erdbeere",
  );
  await page.reload();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
  await navigate(page, "Nachbarn");
  await page
    .getByLabel("Pflanze auswählen", { exact: true })
    .selectOption({ label: "Buschbohne" });
  await expect(page.locator(".neighbor-group").last()).toContainText("Fenchel");
  await page.screenshot({
    path: testInfo.outputPath("neighbors-v0111.png"),
    scale: "css",
  });
});

test("seed choices save automatically and navigation drains pending saves", async ({
  page,
}, testInfo) => {
  await open(page, { demo: "1" });
  await navigate(page, "Saatgut & Einkauf");
  const buy = page.getByRole("radio", {
    name: "Blattkultur · Beispiel: Kaufen",
    exact: true,
  });
  let batches = 0;
  await page.route("**/__test_api/**", async (route) => {
    if (route.request().postDataJSON().operation === "set_seed_inventory")
      batches++;
    await route.continue();
  });
  await buy.check();
  await expect.poll(() => batches).toBe(1);
  await expect(page.locator(".seed-save-status")).toHaveText("");
  await expect(
    page.getByRole("button", { name: "Änderungen speichern", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("radio", {
      name: "Blattkultur · Beispiel: Vorhanden",
      exact: true,
    })
    .check();
  await navigate(page, "Übersicht");
  await expect(
    page.getByRole("heading", { name: "Übersicht", exact: true }),
  ).toBeVisible();
  expect(batches).toBe(2);
  await navigate(page, "Saatgut & Einkauf");
  await expect(
    page.getByRole("radio", {
      name: "Blattkultur · Beispiel: Vorhanden",
      exact: true,
    }),
  ).toBeChecked();
  await page.getByLabel("Status filtern", { exact: true }).selectOption("buy");
  await expect(buy).toHaveCount(0);
  await page
    .getByLabel("Status filtern", { exact: true })
    .selectOption("available");
  await expect(buy).toBeVisible();
  await page.locator(".seed-scroll").screenshot({
    path: testInfo.outputPath("seed-auto-v0111.png"),
    scale: "css",
  });
});

test("read-only users can browse shared neighbors and seed planning without editing", async ({
  page,
}) => {
  await open(page, { demo: "1", role: "reader" });
  await navigate(page, "Nachbarn");
  await expect(
    page.getByRole("button", { name: "Nachbarn bearbeiten", exact: true }),
  ).toHaveCount(0);
  await navigate(page, "Saatgut & Einkauf");
  await expect(page.locator(".seed-table input:enabled")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Änderungen speichern", exact: true }),
  ).toHaveCount(0);
  const a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(a11y.violations).toEqual([]);
});

test("clearing the authenticated user closes a neighbor draft", async ({
  page,
}) => {
  await open(page, { demo: "1" });
  await navigate(page, "Nachbarn");
  await page
    .getByRole("button", { name: "Nachbarn bearbeiten", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.locator("garden-planner-panel").evaluate((element) => {
    const panel = element as HTMLElement & { hass: Hass };
    panel.hass = { ...panel.hass, user: undefined };
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("Blattkultur · Beispiel", { exact: true }),
  ).toHaveCount(0);
});

test("a failed seed autosave preserves choices without retrying or claiming success", async ({
  page,
}) => {
  await open(page, { demo: "1" });
  await navigate(page, "Saatgut & Einkauf");
  let release!: () => void, started!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const received = new Promise<void>((resolve) => {
    started = resolve;
  });
  let writes = 0;
  await page.route("**/__test_api/**", async (route) => {
    if (route.request().postDataJSON().operation === "set_seed_inventory") {
      writes++;
      started();
      await gate;
    }
    await route.continue();
  });
  const choice = page.getByRole("radio", {
    name: "Blattkultur · Beispiel: Kaufen",
    exact: true,
  });
  await choice.check();
  await received;
  const session = new URL(page.url()).searchParams.get("session");
  const list = await page.request.post(`/__test_api/${session}`, {
    data: { operation: "list", parameters: { table: "plants" }, role: "admin" },
  });
  const plant = (await list.json()).find(
    (p: { data: { name: string } }) => p.data.name === "Blattkultur · Beispiel",
  );
  const edit = await page.request.post(`/__test_api/${session}`, {
    data: {
      operation: "update",
      parameters: {
        table: "plants",
        id: plant.id,
        revision: plant.revision,
        data: { notes: "Concurrent edit" },
      },
      role: "admin",
    },
  });
  expect(edit.ok()).toBe(true);
  release();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(choice).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Erneut speichern", exact: true }),
  ).toBeVisible();
  await navigate(page, "Übersicht");
  await expect(
    page.getByRole("heading", { name: "Saatgut & Einkauf", exact: true }),
  ).toBeVisible();
  expect(writes).toBe(1);
  await page
    .getByRole("button", { name: "Auswahl verwerfen", exact: true })
    .click();
  await expect(
    page.getByRole("radio", {
      name: "Blattkultur · Beispiel: Offen",
      exact: true,
    }),
  ).toBeChecked();
});

test("losing edit rights during seed autosave clears pending state and permits navigation", async ({
  page,
}) => {
  await open(page, { demo: "1", role: "reader", host: "1" });
  const session = new URL(page.url()).searchParams.get("session");
  async function writers(value: string[]) {
    const response = await page.request.post(`/__test_api/${session}`, {
      data: {
        operation: "set_settings",
        parameters: { settings: { writers: value }, confirm: true },
        role: "admin",
        host: true,
      },
    });
    expect(response.ok()).toBe(true);
  }
  await writers(["test-reader"]);
  await page
    .getByRole("button", { name: "Aktualisieren", exact: true })
    .click();
  await navigate(page, "Saatgut & Einkauf");
  let release!: () => void, started!: () => void;
  const gate = new Promise<void>((r) => {
      release = r;
    }),
    received = new Promise<void>((r) => {
      started = r;
    });
  await page.route("**/__test_api/**", async (route) => {
    if (route.request().postDataJSON().operation === "set_seed_inventory") {
      started();
      await gate;
    }
    await route.continue();
  });
  const input = page.getByRole("radio", {
    name: "Blattkultur · Beispiel: Kaufen",
    exact: true,
  });
  await expect(input).toBeEnabled();
  await input.check();
  await received;
  await writers([]);
  await page
    .getByRole("button", { name: "Aktualisieren", exact: true })
    .click();
  await expect(input).toBeDisabled();
  release();
  await navigate(page, "Übersicht");
  await expect(
    page.getByRole("heading", { name: "Übersicht", exact: true }),
  ).toBeVisible();
  await navigate(page, "Saatgut & Einkauf");
  await expect(
    page.getByRole("radio", {
      name: "Blattkultur · Beispiel: Offen",
      exact: true,
    }),
  ).toBeChecked();
});

test("seed radios stay responsive and latest choice wins while saving", async ({
  page,
}) => {
  await open(page, { demo: "1" });
  await navigate(page, "Saatgut & Einkauf");
  let release!: () => void, started!: () => void;
  const gate = new Promise<void>((r) => {
      release = r;
    }),
    received = new Promise<void>((r) => {
      started = r;
    });
  const batches: { state: string; revision: number }[][] = [];
  await page.route("**/__test_api/**", async (route) => {
    const d = route.request().postDataJSON();
    if (d.operation === "set_seed_inventory") {
      batches.push(d.parameters.changes);
      if (batches.length === 1) {
        started();
        await gate;
      }
    }
    await route.continue();
  });
  await page
    .getByRole("radio", {
      name: "Blattkultur · Beispiel: Vorhanden",
      exact: true,
    })
    .check();
  await received;
  const buy = page.getByRole("radio", {
    name: "Blattkultur · Beispiel: Kaufen",
    exact: true,
  });
  const latest = page.getByRole("radio", {
    name: "Blattkultur · Beispiel: Nicht benötigt",
    exact: true,
  });
  await expect(buy).toBeEnabled();
  await buy.check();
  await latest.check();
  await expect(latest).toBeChecked();
  release();
  await expect(page.locator(".seed-save-status")).toHaveText("");
  expect(batches).toHaveLength(2);
  expect(batches[0]![0]!.state).toBe("available");
  expect(batches[1]![0]!.state).toBe("unneeded");
  expect(batches[1]![0]!.revision).toBeGreaterThan(batches[0]![0]!.revision);
  await page.reload();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
  await navigate(page, "Saatgut & Einkauf");
  await expect(latest).toBeChecked();
});

test("calendar legend quick filters are exclusive, toggle off and preserve categories", async ({
  page,
}) => {
  await open(page);
  const session = new URL(page.url()).searchParams.get("session");
  async function api(operation: string, parameters: Record<string, unknown>) {
    const r = await page.request.post(`/__test_api/${session}`, {
      data: { operation, parameters, role: "admin" },
    });
    expect(r.ok()).toBe(true);
    return r.json();
  }
  const plant = await api("create", {
    table: "plants",
    data: { name: "Quickfilterpflanze", category: "fruit" },
  });
  for (const activity of ["prune", "indoors", "care"])
    await api("create", {
      table: "growing_windows",
      data: {
        plant_id: plant.id,
        activity,
        environment: "outdoors",
        start_month: 11,
        start_day: 1,
        end_month: 11,
        end_day: 30,
      },
    });
  await page.reload();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
  await navigate(page, "Gartenkalender");
  await calendarFilter(page, "Kategorie", ["Obst"]);
  const group = page.getByRole("group", {
    name: "Tätigkeit schnell filtern",
    exact: true,
  });
  for (const [mode, selector] of [
    ["Jahr", ".year-grid .bar"],
    ["Monat", ".month-event"],
    ["Woche", ".week-window"],
  ]) {
    await page
      .locator(".segmented")
      .getByRole("button", { name: mode!, exact: true })
      .click();
    await group
      .getByRole("button", { name: "Rückschnitt", exact: true })
      .click();
    await expect(page.locator(selector!)).toHaveCount(1);
    await expect(
      group.getByRole("button", { name: "Rückschnitt", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await group.getByRole("button", { name: "Vorziehen", exact: true }).click();
    await expect(page.locator(selector!)).toHaveCount(1);
    await expect(
      group.getByRole("button", { name: "Rückschnitt", exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await group.getByRole("button", { name: "Vorziehen", exact: true }).click();
    await expect(page.locator(selector!)).toHaveCount(3);
    await expect(
      page
        .getByRole("group", { name: "Kategorie", exact: true })
        .locator("summary"),
    ).toHaveText("Obst");
  }
});

test("overview summary buttons open precisely matching plant, culture and success views", async ({
  page,
}) => {
  await open(page);
  const session = new URL(page.url()).searchParams.get("session");
  async function api(operation: string, parameters: Record<string, unknown>) {
    const r = await page.request.post(`/__test_api/${session}`, {
      data: { operation, parameters, role: "admin" },
    });
    expect(r.ok()).toBe(true);
    return r.json();
  }
  for (const [name, initial, result] of [
    ["Geplante Pflanze", "planned", "unknown"],
    ["Wachsende Pflanze", "sown", "unknown"],
    ["Erfolgreiche Pflanze", "sown", "successful"],
  ]) {
    const p = await api("create", { table: "plants", data: { name } });
    const c = await api("create", {
      table: "cultivations",
      data: {
        plant_id: p.id,
        date: "2026-11-06",
        method: "direct",
        initial_status: initial,
        result,
      },
    });
    if (result === "successful")
      await api("create", {
        table: "cultivation_events",
        data: { cultivation_id: c.id, date: "2026-11-06", status: "completed" },
      });
  }
  await page.reload();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
  await page
    .locator(".stats")
    .getByRole("button", { name: /3 Pflanzen im Garten/ })
    .click();
  await expect(page.locator("main .grid .plant")).toHaveCount(3);
  await navigate(page, "Übersicht");
  await page
    .locator(".stats")
    .getByRole("button", { name: /1 Geplant/ })
    .click();
  await expect(
    page.getByLabel("Kulturen anzeigen", { exact: true }),
  ).toHaveValue("planned");
  await expect(page.locator("main .grid .plant")).toHaveCount(1);
  await expect(page.locator("main .grid .plant")).toContainText(
    "Geplante Pflanze",
  );
  await navigate(page, "Übersicht");
  await page
    .locator(".stats")
    .getByRole("button", { name: /1 Laufende Kulturen/i })
    .click();
  await expect(
    page.getByLabel("Kulturen anzeigen", { exact: true }),
  ).toHaveValue("active");
  await expect(page.locator("main .grid .plant")).toHaveCount(1);
  await expect(page.locator("main .grid .plant")).toContainText(
    "Wachsende Pflanze",
  );
  await navigate(page, "Übersicht");
  await page
    .locator(".stats")
    .getByRole("button", { name: /1 Erfolgreich dokumentiert/i })
    .click();
  await expect(
    page.getByRole("checkbox", {
      name: "Nur erfolgreich dokumentiert",
      exact: true,
    }),
  ).toBeChecked();
  await expect(page.locator("main tbody tr")).toHaveCount(1);
  await expect(page.locator("main tbody tr")).toContainText(
    "Erfolgreiche Pflanze",
  );
});

test("overview summary stays below navigation and jumps to upcoming work", async ({
  page,
}, testInfo) => {
  await open(page, { demo: "1" });
  const session = new URL(page.url()).searchParams.get("session");
  const rows = await page.request.post(`/__test_api/${session}`, {
    data: { operation: "list", parameters: { table: "plants" }, role: "admin" },
  });
  const plant = (await rows.json())[0];
  for (let i = 0; i < 24; i++) {
    const r = await page.request.post(`/__test_api/${session}`, {
      data: {
        operation: "create",
        parameters: {
          table: "growing_windows",
          data: {
            plant_id: plant.id,
            activity: "care",
            environment: "outdoors",
            start_month: 11,
            start_day: 1,
            end_month: 11,
            end_day: 30,
          },
        },
        role: "admin",
      },
    });
    expect(r.ok()).toBe(true);
  }
  await page.reload();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
  const stats = page.locator(".stats");
  await expect(stats.getByRole("button")).toHaveCount(5);
  const original = await stats.boundingBox();
  if ((page.viewportSize()?.width ?? 1000) < 760)
    expect(original!.height).toBeLessThan(105);
  await page.evaluate(() => window.scrollTo(0, 900));
  await expect
    .poll(async () => {
      const box = await stats.boundingBox();
      return Math.abs(
        box!.y -
          Number.parseFloat(
            await page
              .locator("garden-planner-panel")
              .evaluate((e) =>
                (e as HTMLElement).style.getPropertyValue("--gp-sticky-top"),
              ),
          ),
      );
    })
    .toBeLessThan(2);
  const before = await stats.boundingBox();
  await page.evaluate(() => window.scrollBy(0, 300));
  const after = await stats.boundingBox();
  expect(Math.abs(before!.y - after!.y)).toBeLessThan(2);
  await stats.getByRole("button", { name: /Offene Aufgaben/i }).click();
  const upcoming = page.getByRole("region", {
    name: "Nächste Gartenarbeiten",
    exact: true,
  });
  await expect(upcoming).toBeFocused();
  const position = await upcoming.boundingBox(),
    summary = await stats.boundingBox();
  expect(position!.y).toBeGreaterThanOrEqual(summary!.y + summary!.height - 1);
  expect(position!.y).toBeLessThan(page.viewportSize()!.height);
  await page.screenshot({
    path: testInfo.outputPath("overview-sticky-v0111.png"),
    scale: "css",
  });
});

test("a transient seed autosave error retries only after explicit recovery", async ({
  page,
}) => {
  await open(page, { demo: "1" });
  await navigate(page, "Saatgut & Einkauf");
  let count = 0;
  await page.route("**/__test_api/**", async (route) => {
    if (
      route.request().postDataJSON().operation === "set_seed_inventory" &&
      ++count === 1
    )
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ code: "storage_error" }),
      });
    else await route.continue();
  });
  const input = page.getByRole("radio", {
    name: "Blattkultur · Beispiel: Kaufen",
    exact: true,
  });
  await input.check();
  await expect(
    page.getByRole("button", { name: "Erneut speichern", exact: true }),
  ).toBeVisible();
  expect(count).toBe(1);
  await expect(input).toBeChecked();
  await page
    .getByRole("button", { name: "Erneut speichern", exact: true })
    .click();
  await expect(page.locator(".seed-save-status")).toHaveText("");
  expect(count).toBe(2);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Dein Garten wird geladen …")).toHaveCount(0);
  await navigate(page, "Saatgut & Einkauf");
  await expect(input).toBeChecked();
});
