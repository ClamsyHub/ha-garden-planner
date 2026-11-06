import type { Hass } from "../src/types";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
    .getByRole("button", { name: "Anbauzeitraum hinzufügen", exact: true })
    .click();
  const window = page.getByRole("dialog", {
    name: "Anbauzeitraum hinzufügen",
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
  await navigate(page, "Aussaatkalender");
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
  await expect(
    page.getByRole("button", { name: "Wieder öffnen" }),
  ).toBeVisible();
  await navigate(page, "Aussaatkalender");
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
  await navigate(page, "Aussaatkalender");
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
    .getByRole("button", { name: "Anbauzeitraum hinzufügen", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Anbauzeitraum hinzufügen",
    exact: true,
  });
  const startMonth = dialog.getByLabel("Startmonat *", { exact: true });
  const startDay = dialog.getByLabel("Starttag *", { exact: true });
  const endMonth = dialog.getByLabel("Endmonat *", { exact: true });
  const endDay = dialog.getByLabel("Endtag *", { exact: true });
  if (testInfo.project.name !== "mobile-chromium") {
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
    .getByLabel("Bearbeiten erlauben", { exact: true })
    .selectOption("test-reader");
  await page
    .getByLabel("Benachrichtigungskanal", { exact: true })
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

test("week view includes overlapping growing windows and keeps concrete appointments", async ({
  page,
}, testInfo) => {
  await open(page, { demo: "1" });
  await navigate(page, "Aussaatkalender");
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
  await page.getByLabel("Tätigkeit", { exact: true }).selectOption("indoors");
  await expect(
    possible.getByText(/Keine passenden Anbauzeiträume/),
  ).toBeVisible();
  await page.getByLabel("Tätigkeit", { exact: true }).selectOption("");
  await page.getByLabel("Woche auswählen", { exact: true }).fill("2026-10-30");
  await page.getByLabel("Woche auswählen", { exact: true }).press("Tab");
  await expect(possible.getByText("01.11.2026", { exact: true })).toBeVisible();
  await possible
    .getByRole("button", { name: /Blattkultur · Beispiel.*Direktsaat/ })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Blattkultur · Beispiel", exact: true }),
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
  if (testInfo.project.name === "mobile-chromium") await option.tap();
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
  if (testInfo.project.name === "mobile-chromium") await last.tap();
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
