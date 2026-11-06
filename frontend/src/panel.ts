import {
  recommendedRange,
  temperatureReading,
  temperatureSensors,
} from "./temperature";
import type { Capabilities, HostSettings, SettingsResponse } from "./types";
import {
  LitElement,
  html,
  svg,
  nothing,
  type PropertyValues,
  type TemplateResult,
} from "lit";
import { repeat } from "lit/directives/repeat.js";
import { PlannerApi } from "./api";
import {
  activeInMonth,
  addDays,
  cultureEvents,
  cultureStatus,
  formatDate,
  monthLabel,
  monthSegments,
  nextDay,
  sowingDate,
  todayInZone,
  weekDays,
  windowLabel,
  windowWeekSegments,
} from "./dates";
import { fieldsFor, formData, initialData } from "./fields";
import { csvZip, download, MAX_BYTES, readCsvZip } from "./files";
import { errorText, label, t } from "./i18n";
import { styles } from "./styles";
import {
  emptyTables,
  text,
  type Data,
  type Entity,
  type Field,
  type Hass,
  type ImportPlan,
  type Json,
  type Language,
  type Page,
  type Table,
  type Tables,
} from "./types";

type Editor = { table: Table; record?: Entity; draft: Data };
type Selection = { kind: "plant" | "culture"; id: string };
type Reviewed = {
  plan: ImportPlan;
  payload?: unknown;
  format?: "json" | "csv";
  backup?: string;
};
const pages: Page[] = [
  "overview",
  "calendar",
  "plants",
  "cultures",
  "history",
  "locations",
  "settings",
];
const activities = ["indoors", "direct", "transplant", "harvest"];
const paths: Record<string, string> = {
  overview: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
  calendar: "M4 5h16v16H4zM8 2v6m8-6v6M4 10h16",
  plants: "M12 21V10M12 15C3 15 3 6 3 6s9-1 9 9zm0-5c0-8 9-8 9-8s1 9-9 8z",
  cultures:
    "M5 20h14l2-10H3zM12 10V4m0 4C6 8 6 3 6 3s6 0 6 5zm0-2c0-5 6-5 6-5s0 5-6 5z",
  history: "M3 11a9 9 0 1 1 2 7M3 4v7h7m2-4v6l4 2",
  locations: "M3 3l6 3 6-3 6 3v15l-6-3-6 3-6-3zm6 3v15m6-18v15",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0-6v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M6 18 18 6",
  arrow: "M9 5l7 7-7 7",
  refresh: "M20 7a9 9 0 1 0 1 8M20 2v5h-5",
  check: "M4 12l5 5L20 6",
};
function icon(name: string): TemplateResult {
  return svg`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${paths[name] ?? paths.plants!}></path></svg>`;
}
function preference(): string {
  try {
    return localStorage.getItem("garden-planner-language") ?? "";
  } catch {
    return "";
  }
}

export class GardenPlannerPanel extends LitElement {
  static styles = styles;
  static properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    capabilities: { state: true },
    hostSettings: { state: true },
    hostDraft: { state: true },
    deliveries: { state: true },
    page: { state: true },
    tables: { state: true },
    loaded: { state: true },
    busy: { state: true },
    error: { state: true },
    toast: { state: true },
    languagePreference: { state: true },
    query: { state: true },
    category: { state: true },
    method: { state: true },
    sort: { state: true },
    showArchived: { state: true },
    calendarMode: { state: true },
    anchor: { state: true },
    activity: { state: true },
    selected: { state: true },
    editor: { state: true },
    sensorOpen: { state: true },
    sensorIndex: { state: true },
    sensorAbove: { state: true },
    sensorMaxHeight: { state: true },
    deleting: { state: true },
    reviewed: { state: true },
    importMode: { state: true },
    replaceConfirmed: { state: true },
    backups: { state: true },
    historyYear: { state: true },
    historyPlant: { state: true },
  };
  declare hass?: Hass;
  declare narrow: boolean;
  private capabilities: Capabilities | null = null;
  private hostSettings: SettingsResponse | null = null;
  private hostDraft: HostSettings | null = null;
  private deliveries: { state: string; description: string; at: string }[] = [];
  private page: Page = "overview";
  private tables: Tables = emptyTables();
  private loaded = false;
  private busy = false;
  private error = "";
  private toast = "";
  private languagePreference = preference();
  private query = "";
  private category = "";
  private method = "";
  private sort = "name";
  private showArchived = false;
  private calendarMode: "month" | "year" | "week" = "month";
  private anchor = "";
  private activity = "";
  private selected: Selection | null = null;
  private editor: Editor | null = null;
  private sensorOpen = false;
  private sensorIndex = -1;
  private sensorAbove = false;
  private sensorMaxHeight = 240;
  private deleting: { table: Table; record: Entity } | null = null;
  private reviewed: Reviewed | null = null;
  private importMode: "merge" | "replace" = "merge";
  private replaceConfirmed = false;
  private backups: string[] = [];
  private historyYear = "";
  private historyPlant = "";
  private api?: PlannerApi;
  private unsubscribe?: () => Promise<void>;
  private boundConnection?: Hass["connection"];
  private boundUser = "";
  private connectionGeneration = 0;
  private loadGeneration = 0;
  private toastTimer?: ReturnType<typeof setTimeout>;
  private reconnect = () => {
    void this.refresh();
  };

  private get language(): Language {
    return (
      this.languagePreference ||
      this.hass?.locale?.language ||
      this.hass?.language ||
      "de"
    ).startsWith("de")
      ? "de"
      : "en";
  }
  private tr(key: string): string {
    return t(this.language, key);
  }
  private lab(value: string): string {
    return label(this.language, value);
  }
  private get timeZone(): string {
    return (
      this.hass?.config.time_zone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone
    );
  }
  private get today(): string {
    return todayInZone(this.timeZone);
  }
  private get editable(): boolean {
    return this.capabilities?.can_edit ?? this.hass?.user?.is_admin === true;
  }
  private get admin(): boolean {
    return this.hass?.user?.is_admin === true;
  }
  private get plantList(): Entity[] {
    return this.tables.plants.filter((p) => !p.data.archived);
  }
  private get year(): number {
    return Number((this.anchor || this.today).slice(0, 4));
  }
  private get month(): number {
    return Number((this.anchor || this.today).slice(5, 7));
  }
  private get categories(): string[] {
    return [
      ...new Set(
        this.tables.plants.map((p) => text(p, "category")).filter(Boolean),
      ),
    ].sort();
  }

  private lastTrigger?: HTMLElement;
  private readonly dialogTriggers = new Map<string, HTMLElement>();
  private readonly rememberTrigger = (event: Event): void => {
    const trigger = event
      .composedPath()
      .find(
        (node): node is HTMLElement =>
          node instanceof HTMLElement &&
          node.matches("button, input, select, a[href]"),
      );
    if (trigger) this.lastTrigger = trigger;
  };
  private readonly restoreDialogFocus = (event: Event): void => {
    if (!(event.target instanceof HTMLDialogElement)) return;
    const trigger = this.dialogTriggers.get(event.target.id);
    this.dialogTriggers.delete(event.target.id);
    queueMicrotask(() => {
      const activeDialogs = [
        ...this.renderRoot.querySelectorAll<HTMLDialogElement>("dialog[open]"),
      ];
      if (
        trigger?.isConnected &&
        (!activeDialogs.length || activeDialogs.at(-1)!.contains(trigger))
      ) {
        trigger.focus({ preventScroll: true });
      }
    });
  };

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("click", this.rememberTrigger, true);
    this.renderRoot.addEventListener("close", this.restoreDialogFocus, true);
    this.renderRoot.addEventListener(
      "scroll",
      this.positionSensorOptions,
      true,
    );
    window.addEventListener("resize", this.positionSensorOptions);
    window.visualViewport?.addEventListener(
      "resize",
      this.positionSensorOptions,
    );
    window.visualViewport?.addEventListener(
      "scroll",
      this.positionSensorOptions,
    );
    if (this.hass) void this.bind();
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("click", this.rememberTrigger, true);
    this.renderRoot.removeEventListener(
      "scroll",
      this.positionSensorOptions,
      true,
    );
    window.removeEventListener("resize", this.positionSensorOptions);
    window.visualViewport?.removeEventListener(
      "resize",
      this.positionSensorOptions,
    );
    window.visualViewport?.removeEventListener(
      "scroll",
      this.positionSensorOptions,
    );
    this.renderRoot.removeEventListener("close", this.restoreDialogFocus, true);
    this.connectionGeneration++;
    this.loadGeneration++;
    this.boundConnection?.removeEventListener?.("ready", this.reconnect);
    void this.unsubscribe?.().catch(() => undefined);
    this.unsubscribe = undefined;
    this.boundConnection = undefined;
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }
  protected willUpdate(changed: PropertyValues): void {
    if (
      changed.has("hass") &&
      this.isConnected &&
      (this.hass?.connection !== this.boundConnection ||
        this.hass?.user?.id !== this.boundUser)
    )
      void this.bind();
  }
  protected updated(): void {
    this.setAttribute("lang", this.language);
    if (this.hass?.themes)
      this.toggleAttribute("dark", this.hass.themes.darkMode);
    this.syncDialog("detail-dialog", this.selected !== null);
    this.syncDialog("editor-dialog", this.editor !== null);
    this.syncDialog("delete-dialog", this.deleting !== null);
    this.syncDialog("review-dialog", this.reviewed !== null);
  }
  private syncDialog(id: string, open: boolean): void {
    const dialog = this.renderRoot.querySelector<HTMLDialogElement>(`#${id}`);
    if (open && dialog && !dialog.open) {
      const trigger =
        this.lastTrigger ??
        this.shadowRoot?.activeElement ??
        this.ownerDocument.activeElement;
      if (trigger instanceof HTMLElement) this.dialogTriggers.set(id, trigger);
      dialog.showModal();
    }
    if (!open && dialog?.open) dialog.close();
  }
  private async bind(): Promise<void> {
    const generation = ++this.connectionGeneration;
    this.loadGeneration++;
    this.boundConnection?.removeEventListener?.("ready", this.reconnect);
    void this.unsubscribe?.().catch(() => undefined);
    this.unsubscribe = undefined;
    this.boundConnection = this.hass?.connection;
    this.boundUser = this.hass?.user?.id ?? "";
    this.api = this.hass?.user ? new PlannerApi(this.hass) : undefined;
    this.tables = emptyTables();
    this.capabilities = null;
    this.hostSettings = null;
    this.hostDraft = null;
    this.deliveries = [];
    this.loaded = false;
    this.selected = null;
    this.editor = null;
    this.deleting = null;
    this.reviewed = null;
    this.backups = [];
    this.lastTrigger = undefined;
    this.dialogTriggers.clear();
    this.error = "";
    this.toast = "";
    this.busy = false;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (!this.api || !this.boundConnection) return;
    if (!this.anchor) this.anchor = this.today;
    this.boundConnection.addEventListener?.("ready", this.reconnect);
    try {
      const unsubscribe = await this.api.subscribe(() => {
        void this.refresh();
      });
      if (generation !== this.connectionGeneration || !this.isConnected) {
        await unsubscribe();
        return;
      }
      this.unsubscribe = unsubscribe;
    } catch {
      if (generation === this.connectionGeneration)
        this.error = this.tr("disconnected");
    }
    if (generation === this.connectionGeneration) await this.refresh();
  }
  private async refresh(): Promise<void> {
    if (!this.api) return;
    const generation = ++this.loadGeneration;
    try {
      const [tables, capabilities] = await Promise.all([
        this.api.load(),
        this.api.command<Capabilities>("capabilities"),
      ]);
      if (generation !== this.loadGeneration || !this.isConnected) return;
      this.tables = tables;
      this.capabilities = capabilities;
      this.loaded = true;
      this.error = "";
    } catch (error) {
      if (generation === this.loadGeneration)
        this.error = errorText(this.language, error);
    }
  }
  private announce(key: string): void {
    this.toast = this.tr(key);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast = "";
    }, 4500);
  }
  private async action<T>(
    operation: string,
    parameters: Record<string, unknown>,
    success = "saved",
  ): Promise<T | undefined> {
    if (!this.api || this.busy) return;
    this.busy = true;
    this.error = "";
    const generation = this.connectionGeneration;
    try {
      const value = await this.api.command<T>(operation, parameters);
      if (generation !== this.connectionGeneration) return undefined;
      await this.refresh();
      if (generation !== this.connectionGeneration) return undefined;
      if (success) this.announce(success);
      return value;
    } catch (error) {
      if (generation === this.connectionGeneration)
        this.error = errorText(this.language, error);
      return undefined;
    } finally {
      if (generation === this.connectionGeneration) this.busy = false;
    }
  }
  private navigate(page: Page): void {
    this.page = page;
    this.error = "";
    if (page === "settings" && this.admin) {
      void this.loadBackups();
      void this.loadHostSettings();
    }
  }
  private plantName(culture: Entity): string {
    const snapshot = culture.data.snapshot;
    if (snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)) {
      const plant = snapshot.plant;
      if (
        plant &&
        typeof plant === "object" &&
        !Array.isArray(plant) &&
        typeof plant.name === "string"
      )
        return plant.name;
    }
    return (
      text(
        this.tables.plants.find((p) => p.id === text(culture, "plant_id")),
        "name",
      ) || this.tr("untitled")
    );
  }
  private nameFor(id: string, table: Table): string {
    return (
      text(
        this.tables[table].find((r) => r.id === id),
        "name",
      ) || "—"
    );
  }
  private plantWindows(id: string): Entity[] {
    return this.tables.growing_windows.filter(
      (w) => text(w, "plant_id") === id,
    );
  }
  private status(culture: Entity): string {
    return cultureStatus(culture, this.tables.cultivation_events);
  }
  private startEditor(table: Table, record?: Entity, seed: Data = {}): void {
    this.sensorOpen = false;
    this.sensorIndex = -1;
    this.error = "";
    this.editor = {
      table,
      record,
      draft: record
        ? structuredClone(record.data)
        : initialData(table, this.timeZone, seed),
    };
  }
  private fieldList(editor: Editor): Field[] {
    return fieldsFor(
      editor.table,
      editor.draft,
      this.tables,
      this.language,
      !!editor.record,
    );
  }
  private changeField(key: string, value: Json): void {
    if (!this.editor) return;
    let draft = { ...this.editor.draft, [key]: value };
    if (key === "plant_id" && !this.editor.record)
      draft = { ...draft, variety_id: "" };
    if (key === "cultivation_id" && this.editor.table === "tasks") {
      const culture = this.tables.cultivations.find((c) => c.id === value);
      if (culture)
        draft = {
          ...draft,
          plant_id: text(culture, "plant_id"),
          location_id: text(culture, "location_id"),
        };
    }
    this.editor = { ...this.editor, draft };
  }
  private async saveEditor(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (!this.editor || this.busy) return;
    const form = event.currentTarget as HTMLFormElement;
    if (!form.reportValidity()) return;
    const editor = this.editor;
    let data: Data;
    try {
      data = formData(
        editor.table,
        editor.draft,
        this.fieldList(editor),
        editor.record,
      );
    } catch {
      this.error = this.tr("numberRange");
      return;
    }
    const result = await this.action<Entity>(
      editor.record ? "update" : "create",
      {
        table: editor.table,
        ...(editor.record
          ? { id: editor.record.id, revision: editor.record.revision }
          : {}),
        data,
      },
    );
    if (result) this.editor = null;
  }
  private async removeRecord(): Promise<void> {
    if (!this.deleting) return;
    const { table, record } = this.deleting;
    await this.action(
      "delete",
      { table, id: record.id, revision: record.revision, confirm: true },
      "deleted",
    );
    if (!this.error) {
      this.deleting = null;
      if (this.selected?.id === record.id) this.selected = null;
    }
  }
  private async archive(record: Entity, table: Table): Promise<void> {
    await this.action("update", {
      table,
      id: record.id,
      revision: record.revision,
      data: { archived: !record.data.archived },
    });
  }
  private async duplicate(record: Entity): Promise<void> {
    const result = await this.action<Entity>(
      "duplicate_plant",
      { id: record.id, name: `${text(record, "name")} · ${this.tr("new")}` },
      "copied",
    );
    if (result) {
      this.selected = { kind: "plant", id: result.id };
      this.startEditor("plants", result);
    }
  }
  private readonly positionSensorOptions = (): void => {
    if (!this.sensorOpen) return;
    const input = this.renderRoot.querySelector<HTMLInputElement>(
      "#field-sensor_entity_id",
    );
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const dialog = input.closest("dialog")?.getBoundingClientRect();
    const viewport = window.visualViewport;
    const top = Math.max(
      (viewport?.offsetTop ?? 0) + 8,
      (dialog?.top ?? 0) + 8,
    );
    const bottom = Math.min(
      (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 8,
      (dialog?.bottom ?? window.innerHeight) - 8,
    );
    if (rect.bottom < top || rect.top > bottom) {
      this.sensorOpen = false;
      return;
    }
    const above = Math.max(0, rect.top - top - 4);
    const below = Math.max(0, bottom - rect.bottom - 4);
    this.sensorAbove = below < 240 && above > below;
    this.sensorMaxHeight = Math.floor(
      Math.min(240, this.sensorAbove ? above : below),
    );
  };
  private openSensorOptions(): void {
    this.sensorOpen = true;
    this.positionSensorOptions();
  }
  private chooseSensor(id: string): void {
    this.changeField("sensor_entity_id", id);
    this.renderRoot
      .querySelector<HTMLInputElement>("#field-sensor_entity_id")
      ?.focus();
    this.sensorOpen = false;
    this.sensorIndex = -1;
  }
  private renderSensorField(field: Field): TemplateResult {
    const value = String(this.editor?.draft.sensor_entity_id ?? "");
    const options = temperatureSensors(this.hass, value);
    const active =
      this.sensorOpen &&
      this.sensorIndex >= 0 &&
      this.sensorIndex < options.length;
    return html`<div class="sensor-field">
      <label id="field-sensor_entity_id-label" for="field-sensor_entity_id"
        >${this.tr(field.key)}</label
      >
      <div
        class="sensor-picker"
        @focusout=${(event: FocusEvent) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !(event.currentTarget as HTMLElement).contains(event.relatedTarget)
          ) {
            this.sensorOpen = false;
            this.sensorIndex = -1;
          }
        }}
      >
        <input
          id="field-sensor_entity_id"
          name="sensor_entity_id"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-labelledby="field-sensor_entity_id-label"
          aria-controls="temperature-sensor-options"
          aria-expanded=${String(this.sensorOpen)}
          aria-activedescendant=${active ? `temperature-sensor-option-${this.sensorIndex}` : nothing}
          autocomplete="off"
          .value=${value}
          ?disabled=${this.busy || field.disabled}
          @focus=${() => this.openSensorOptions()}
          @click=${() => this.openSensorOptions()}
          @input=${(event: Event) => {
            this.changeField(
              field.key,
              (event.target as HTMLInputElement).value,
            );
            this.openSensorOptions();
            this.sensorIndex = -1;
          }}
          @keydown=${(event: KeyboardEvent) => {
            if (event.key === "Escape" && this.sensorOpen) {
              event.preventDefault();
              event.stopPropagation();
              this.sensorOpen = false;
              this.sensorIndex = -1;
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              this.openSensorOptions();
              if (options.length) {
                this.sensorIndex =
                  event.key === "ArrowDown"
                    ? Math.min(this.sensorIndex + 1, options.length - 1)
                    : this.sensorIndex < 0
                      ? options.length - 1
                      : Math.max(
                          0,
                          Math.min(this.sensorIndex - 1, options.length - 1),
                        );
                void this.updateComplete.then(() =>
                  this.renderRoot
                    .querySelector(
                      `#temperature-sensor-option-${this.sensorIndex}`,
                    )
                    ?.scrollIntoView({ block: "nearest" }),
                );
              }
            } else if (event.key === "Enter" && active) {
              event.preventDefault();
              this.chooseSensor(options[this.sensorIndex]!.id);
            }
          }}
        />
        <div
          id="temperature-sensor-options"
          role="listbox"
          aria-labelledby="field-sensor_entity_id-label"
          class=${`sensor-options ${this.sensorAbove ? "above" : ""}`}
          style=${`--sensor-max-height:${this.sensorMaxHeight}px`}
          ?hidden=${!this.sensorOpen}
        >
          ${options.map(
            (option, index) =>
              html`<button
                type="button"
                role="option"
                tabindex="-1"
                id=${`temperature-sensor-option-${index}`}
                aria-selected=${String(index === this.sensorIndex)}
                @mousedown=${(event: MouseEvent) => event.preventDefault()}
                @click=${() => this.chooseSensor(option.id)}
              >
                <strong>${option.name}</strong><small>${option.id}</small>
              </button>`,
          )}
          ${!options.length ? html`<div class="sensor-empty" role="option" aria-disabled="true">${this.tr("noSensors")}</div>` : nothing}
        </div>
      </div>
    </div>`;
  }
  private renderField(field: Field): TemplateResult {
    if (field.key === "sensor_entity_id") return this.renderSensorField(field);
    const editor = this.editor!;
    const value = editor.draft[field.key];
    const input = (event: Event) =>
      this.changeField(field.key, (event.target as HTMLInputElement).value);
    const id = `field-${field.key}`;
    return html`<label
      class=${field.type === "textarea" || field.wide ? "wide" : ""}
      for=${id}
    >
      <span id=${`${id}-label`}
        >${this.tr(field.key)}${field.required ? " *" : ""}</span
      >
      ${
        field.type === "select"
          ? html`<select
              id=${id}
              aria-labelledby=${`${id}-label`}
              name=${field.key}
              ?required=${field.required}
              ?disabled=${field.disabled || this.busy}
              @change=${input}
            >
              <option
                value=""
                ?disabled=${field.required}
                .selected=${value === "" || value === undefined || value === null}
              >
                ${this.tr("optional")}
              </option>
              ${field.options?.map((option) => html`<option value=${option.value} .selected=${String(value ?? "") === option.value}>${option.label}</option>`)}
            </select>`
          : field.type === "textarea"
            ? html`<textarea
                id=${id}
                aria-labelledby=${`${id}-label`}
                name=${field.key}
                .value=${String(value ?? "")}
                ?disabled=${this.busy}
                maxlength="20000"
                @input=${input}
              ></textarea>`
            : html`<input
                id=${id}
                aria-labelledby=${`${id}-label`}
                name=${field.key}
                type=${field.type ?? "text"}
                .value=${String(value ?? "")}
                ?required=${field.required}
                ?disabled=${field.disabled || this.busy}
                min=${field.min ?? nothing}
                max=${field.max ?? nothing}
                step=${field.step ?? "any"}
                maxlength="20000"
                @input=${input}
              />`
      }
    </label>`;
  }
  private renderEditor(): TemplateResult {
    const editor = this.editor;
    const titles: Partial<Record<Table, string>> = {
      plants: "newPlant",
      cultivations: "newSowing",
      locations: "newLocation",
      growing_windows: "newWindow",
      varieties: "newVariety",
      cultivation_events: "newEvent",
      tasks: "newTask",
    };
    return html`<dialog
      id="editor-dialog"
      aria-labelledby="editor-title"
      @cancel=${(event: Event) => {
        if (this.busy) event.preventDefault();
      }}
      @close=${() => {
        this.editor = null;
      }}
    >
      ${
        editor
          ? html`<form @submit=${this.saveEditor}>
              <div class="dialog-head">
                <h2 id="editor-title">
                  ${this.tr(editor.record ? "edit" : (titles[editor.table] ?? "new"))}
                </h2>
                <button
                  type="button"
                  class="icon"
                  aria-label=${this.tr("close")}
                  ?disabled=${this.busy}
                  @click=${() => {
                    this.editor = null;
                  }}
                >
                  ${icon("close")}
                </button>
              </div>
              <div class="dialog-body">
                ${this.error ? html`<p class="notice error" role="alert">${this.error}</p>` : nothing}
                ${["plants", "varieties", "growing_windows", "cultivations", "locations"].includes(editor.table) ? html`<p class="notice">${this.tr("temperatureHint")}</p>` : nothing}
                ${editor.draft.origin === "initial" ? html`<p class="notice">${this.tr("initialEventHint")}</p>` : nothing}
                <div class="form-grid">
                  ${this.fieldList(editor).map((field) => this.renderField(field))}
                </div>
              </div>
              <div class="dialog-foot">
                <button
                  type="button"
                  ?disabled=${this.busy}
                  @click=${() => {
                    this.editor = null;
                  }}
                >
                  ${this.tr("cancel")}</button
                ><button class="primary" type="submit" ?disabled=${this.busy}>
                  ${this.tr(this.busy ? "busy" : "save")}
                </button>
              </div>
            </form>`
          : nothing
      }
    </dialog>`;
  }
  private renderFilters(calendar = false): TemplateResult {
    return html`<div class="filters">
      <label
        >${this.tr("search")}<input
          type="search"
          .value=${this.query}
          @input=${(e: Event) => {
            this.query = (e.target as HTMLInputElement).value;
          }}
      /></label>
      <label
        >${this.tr("category")}<select
          aria-label=${this.tr("category")}
          @change=${(e: Event) => {
            this.category = (e.target as HTMLSelectElement).value;
          }}
        >
          <option value="">${this.tr("allCategories")}</option>
          ${this.categories.map((c) => html`<option value=${c} .selected=${this.category === c}>${this.lab(c)}</option>`)}
        </select></label
      >
      <label
        >${this.tr(calendar ? "activity" : "method")}<select
          aria-label=${this.tr(calendar ? "activity" : "method")}
          @change=${(e: Event) => {
            if (calendar) this.activity = (e.target as HTMLSelectElement).value;
            else this.method = (e.target as HTMLSelectElement).value;
          }}
        >
          <option value="">
            ${this.tr(calendar ? "allActivities" : "allMethods")}
          </option>
          ${(calendar ? activities : ["direct", "indoors", "transplant"]).map((value) => html`<option value=${value} .selected=${(calendar ? this.activity : this.method) === value}>${this.lab(value)}</option>`)}
        </select></label
      >
      ${
        !calendar
          ? html`<label
                >${this.tr("sort")}<select
                  @change=${(e: Event) => {
                    this.sort = (e.target as HTMLSelectElement).value;
                  }}
                >
                  <option value="name">${this.tr("alphabetical")}</option>
                  <option value="next" .selected=${this.sort === "next"}>
                    ${this.tr("nextSowing")}
                  </option>
                </select></label
              ><label class="check"
                ><input
                  type="checkbox"
                  .checked=${this.showArchived}
                  @change=${(e: Event) => {
                    this.showArchived = (e.target as HTMLInputElement).checked;
                  }}
                />${this.tr("showArchived")}</label
              >`
          : nothing
      }
    </div>`;
  }
  private filteredPlants(calendar = false): Entity[] {
    const next = new Map<string, string>();
    if (this.sort === "next" && !calendar)
      for (const plant of this.tables.plants)
        next.set(
          plant.id,
          nextDay(
            this.plantWindows(plant.id).filter(
              (w) =>
                !this.method ||
                text(w, "method") === this.method ||
                text(w, "activity") === this.method,
            ),
            this.today,
          ) ?? "9999",
        );
    return this.tables.plants
      .filter(
        (p) =>
          ((this.showArchived && !calendar) || !p.data.archived) &&
          (!this.category || text(p, "category") === this.category) &&
          (!this.query ||
            `${text(p, "name")} ${text(p, "botanical_name")}`
              .toLocaleLowerCase(this.language)
              .includes(this.query.toLocaleLowerCase(this.language))) &&
          (calendar ||
            !this.method ||
            this.plantWindows(p.id).some(
              (w) =>
                text(w, "method") === this.method ||
                text(w, "activity") === this.method,
            )),
      )
      .sort((a, b) =>
        this.sort === "next" && !calendar
          ? (next.get(a.id) ?? "").localeCompare(next.get(b.id) ?? "") ||
            text(a, "name").localeCompare(text(b, "name"), this.language)
          : text(a, "name").localeCompare(text(b, "name"), this.language),
      );
  }
  private empty(
    title: string,
    body = "",
    action?: string,
    callback?: () => void,
  ): TemplateResult {
    return html`<div class="empty">
      ${icon("plants")}
      <h2>${this.tr(title)}</h2>
      ${body ? html`<p>${this.tr(body)}</p>` : nothing}${action && this.editable ? html`<button class="primary" @click=${callback}>${icon("plus")}${this.tr(action)}</button>` : nothing}
    </div>`;
  }
  private renderPlantCard(plant: Entity): TemplateResult {
    const windows = this.plantWindows(plant.id);
    const next = windows.length ? nextDay(windows, this.today) : undefined;
    return html`<article class="plant">
      <div class="plant-title">
        <div class="plant-symbol">${icon("plants")}</div>
        <div>
          <h3>
            <button
              class="link"
              @click=${() => {
                this.selected = { kind: "plant", id: plant.id };
              }}
            >
              ${text(plant, "name")}
            </button>
          </h3>
          <small
            >${text(plant, "botanical_name") || this.lab(text(plant, "category"))}</small
          >
        </div>
      </div>
      <div>
        <span class="badge"
          >${this.lab(text(plant, "category")) || this.tr("other")}</span
        >${plant.data.archived ? html` <span class="badge unknown">${this.tr("archived")}</span>` : nothing}
      </div>
      <p class="muted">
        ${next ? `${this.tr("nextSowing")} · ${formatDate(next, this.language)}` : this.tr("noAllWindows")}
      </p>
      <div class="actions">
        <button
          @click=${() => {
            this.selected = { kind: "plant", id: plant.id };
          }}
        >
          ${this.tr("details")}${icon("arrow")}</button
        >${this.editable && !plant.data.archived ? html`<button class="icon" aria-label=${`${this.tr("newSowing")}: ${text(plant, "name")}`} @click=${() => this.startEditor("cultivations", undefined, { plant_id: plant.id })}>${icon("plus")}</button>` : nothing}
      </div>
    </article>`;
  }
  private renderOverview(): TemplateResult {
    const windows = this.tables.growing_windows.filter(
      (w) =>
        this.plantList.some((p) => p.id === text(w, "plant_id")) &&
        activeInMonth(
          w,
          Number(this.today.slice(0, 4)),
          Number(this.today.slice(5, 7)),
        ),
    );
    const cultures = this.tables.cultivations;
    const stats: [string, number][] = [
      ["managedPlants", this.plantList.length],
      ["planned", cultures.filter((c) => this.status(c) === "planned").length],
      [
        "active",
        cultures.filter(
          (c) => !["planned", "completed", "failed"].includes(this.status(c)),
        ).length,
      ],
      [
        "successful",
        cultures.filter((c) => text(c, "result") === "successful").length,
      ],
      [
        "openTasks",
        this.tables.tasks.filter((task) => !task.data.completed).length,
      ],
    ];
    return html`<section class="hero">
        <div>
          <div class="eyebrow">${this.tr("garden")}</div>
          <h2>${this.tr("welcome")}</h2>
          <p>${this.tr("tagline")}</p>
          <p>
            ${monthLabel(Number(this.today.slice(0, 4)), Number(this.today.slice(5, 7)), this.language)}
          </p>
        </div>
        <div class="art">
          ${svg`<svg viewBox="0 0 100 120" width="100" height="120" fill="none" aria-hidden="true"><path d="M49 115V35M49 79C10 81 10 41 10 41s40 1 39 38ZM49 53C48 16 89 10 89 10s4 42-40 43Z" stroke="currentColor" stroke-width="2"/><path d="M49 103c25 0 34-21 34-21s-29-2-34 21Z" fill="currentColor" opacity=".25"/></svg>`}
        </div>
      </section>
      <div class="stats">
        ${stats.map(([key, count]) => html`<div class="stat"><strong>${count}</strong><span>${this.tr(key)}</span></div>`)}
      </div>
      ${!this.tables.plants.length ? html`<section class="panel">${this.empty("emptyPlants", "emptyPlantsBody", "newPlant", () => this.startEditor("plants"))}</section>` : nothing}
      <div class="columns">
        <section class="panel">
          <div class="section-head">
            <h2>${this.tr("thisMonth")}</h2>
            <button class="link" @click=${() => this.navigate("calendar")}>
              ${this.tr("calendar")}${icon("arrow")}
            </button>
          </div>
          <p class="muted">${this.tr("recommendation")}</p>
          ${
            windows.length
              ? windows.map(
                  (w) =>
                    html`<div class="item">
                      <span class="plant-symbol">${icon("plants")}</span>
                      <div class="item-content">
                        <button
                          class="link"
                          @click=${() => {
                            this.selected = {
                              kind: "plant",
                              id: text(w, "plant_id"),
                            };
                          }}
                        >
                          ${this.nameFor(text(w, "plant_id"), "plants")}
                        </button>
                        <p>
                          <span class="badge"
                            >${this.lab(text(w, "activity"))}</span
                          >
                          · ${this.lab(text(w, "environment"))}
                        </p>
                        <small>${windowLabel(w, this.language)}</small>
                      </div>
                    </div>`,
                )
              : html`<p class="empty">${this.tr("noWindows")}</p>`
          }
        </section>
        <section class="panel">
          <div class="section-head">
            <h2>${this.tr("upcoming")}</h2>
            ${this.editable ? html`<button class="icon" aria-label=${this.tr("newTask")} @click=${() => this.startEditor("tasks")}>${icon("plus")}</button>` : nothing}
          </div>
          ${this.renderTasks(false)}
        </section>
      </div>`;
  }
  private renderTasks(all = true): TemplateResult {
    const tasks = this.tables.tasks
      .filter((task) => all || !task.data.completed)
      .sort((a, b) => text(a, "date").localeCompare(text(b, "date")));
    return html`${
      tasks.length
        ? (all ? tasks : tasks.slice(0, 6)).map(
            (task) =>
              html`<article class="item">
                <div class="date-tile">
                  <strong>${text(task, "date").slice(8)}</strong
                  ><small
                    >${monthLabel(Number(text(task, "date").slice(0, 4)), Number(text(task, "date").slice(5, 7)), this.language, true)}</small
                  >
                </div>
                <div class="item-content">
                  <h3>${text(task, "title")}</h3>
                  <small
                    >${this.lab(text(task, "activity"))} ·
                    ${formatDate(text(task, "date"), this.language)}</small
                  >${text(task, "notes") ? html`<p>${text(task, "notes")}</p>` : nothing}${task.data.completed ? html`<span class="badge">${this.tr("completed")}</span>` : nothing}
                </div>
                ${this.editable ? html`<button class="icon" aria-label=${this.tr(task.data.completed ? "undoTask" : "taskDone")} ?disabled=${this.busy} @click=${() => this.action("update", { table: "tasks", id: task.id, revision: task.revision, data: { completed: !task.data.completed } })}>${icon("check")}</button><button @click=${() => this.startEditor("tasks", task)}>${this.tr("edit")}</button>` : nothing}
              </article>`,
          )
        : html`<p class="empty">${this.tr("noTasks")}</p>`
    }`;
  }
  private calendarWindows(): Entity[] {
    const ids = new Set(this.filteredPlants(true).map((p) => p.id));
    return this.tables.growing_windows
      .filter(
        (w) =>
          ids.has(text(w, "plant_id")) &&
          (!this.activity || this.activity === text(w, "activity")),
      )
      .sort((a, b) =>
        this.nameFor(text(a, "plant_id"), "plants").localeCompare(
          this.nameFor(text(b, "plant_id"), "plants"),
          this.language,
        ),
      );
  }
  private shiftCalendar(direction: number): void {
    if (this.calendarMode === "week")
      this.anchor = addDays(this.anchor || this.today, direction * 7);
    else if (this.calendarMode === "year")
      this.anchor = `${Math.min(9998, Math.max(1, this.year + direction))}-01-01`;
    else {
      const day = new Date(
        Date.UTC(this.year, this.month - 1 + direction, 1, 12),
      );
      this.anchor = day.toISOString().slice(0, 10);
    }
  }
  private renderCalendar(): TemplateResult {
    const windows = this.calendarWindows();
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return html`${this.renderFilters(true)}
      <div class="toolbar">
        <div class="segmented" aria-label=${this.tr("calendar")}>
          ${(["month", "year", "week"] as const).map(
            (mode) =>
              html`<button
                aria-pressed=${this.calendarMode === mode}
                @click=${() => {
                  this.calendarMode = mode;
                }}
              >
                ${this.tr(mode)}
              </button>`,
          )}
        </div>
        <div class="actions">
          <button
            class="icon"
            aria-label=${this.tr("previous")}
            @click=${() => this.shiftCalendar(-1)}
          >
            ‹</button
          >${
            this.calendarMode === "year"
              ? html`<label
                  >${this.tr("selectedYear")}<input
                    type="number"
                    min="1"
                    max="9998"
                    .value=${String(this.year)}
                    @change=${(e: Event) => {
                      const value = Number(
                        (e.target as HTMLInputElement).value,
                      );
                      if (value >= 1 && value <= 9998)
                        this.anchor = `${String(value).padStart(4, "0")}-01-01`;
                    }}
                /></label>`
              : html`<label
                  >${this.tr(this.calendarMode === "month" ? "selectedMonth" : "selectedWeek")}<input
                    type=${this.calendarMode === "month" ? "month" : "date"}
                    .value=${this.calendarMode === "month" ? (this.anchor || this.today).slice(0, 7) : this.anchor || this.today}
                    @change=${(e: Event) => {
                      const value = (e.target as HTMLInputElement).value;
                      if (value)
                        this.anchor =
                          this.calendarMode === "month" ? `${value}-01` : value;
                    }}
                /></label>`
          }<button
            class="icon"
            aria-label=${this.tr("next")}
            @click=${() => this.shiftCalendar(1)}
          >
            ›</button
          ><button
            @click=${() => {
              this.anchor = this.today;
            }}
          >
            ${this.tr("today")}
          </button>
        </div>
      </div>
      <div class="legend">
        ${activities.map((activity) => html`<span class=${activity}><span class="dot"></span>${this.lab(activity)}</span>`)}
      </div>
      ${
        this.calendarMode === "year"
          ? html`<p class="muted">${this.tr("yearlyHint")}</p>
              <div
                class="year-scroll"
                tabindex="0"
                aria-label=${`${this.tr("year")} ${this.year}`}
              >
                <div class="year-grid">
                  <div class="month-head">
                    ${this.tr("plants")} · ${this.year}
                  </div>
                  ${months.map((month) => html`<div class="month-head">${monthLabel(this.year, month, this.language, true)}</div>`)}
                  ${windows.map(
                    (window) =>
                      html`<button
                          class="row-title"
                          @click=${() => {
                            this.selected = {
                              kind: "plant",
                              id: text(window, "plant_id"),
                            };
                          }}
                        >
                          ${this.nameFor(text(window, "plant_id"), "plants")}<small
                            >${this.lab(text(window, "activity"))} ·
                            ${this.lab(text(window, "environment"))}</small
                          ></button
                        >${months.map((month) =>
                          activeInMonth(window, this.year, month)
                            ? html`<button
                                class=${`year-cell ${text(window, "activity")}`}
                                aria-label=${`${this.nameFor(text(window, "plant_id"), "plants")}, ${this.lab(text(window, "activity"))}, ${monthLabel(this.year, month, this.language)}`}
                                title=${windowLabel(window, this.language)}
                                @click=${() => {
                                  this.selected = {
                                    kind: "plant",
                                    id: text(window, "plant_id"),
                                  };
                                }}
                              >
                                <span aria-hidden="true"
                                  >${monthSegments(window, this.year, month).map((segment) => html`<span class="bar" style=${`left:${segment.offset}%;width:${segment.width}%`}></span>`)}</span
                                >
                              </button>`
                            : html`<div class="year-cell"></div>`,
                        )}`,
                  )}
                </div>
              </div>
              ${!windows.length ? this.empty("noAllWindows") : nothing}`
          : this.calendarMode === "month"
            ? html`<section class="panel">
                <div class="section-head">
                  <h2>${monthLabel(this.year, this.month, this.language)}</h2>
                </div>
                <p class="muted">${this.tr("recommendation")}</p>
                <div class="month-list">
                  ${windows
                    .filter((window) =>
                      activeInMonth(window, this.year, this.month),
                    )
                    .map(
                      (window) =>
                        html`<article class="plant">
                          <h3>
                            <button
                              class="link"
                              @click=${() => {
                                this.selected = {
                                  kind: "plant",
                                  id: text(window, "plant_id"),
                                };
                              }}
                            >
                              ${this.nameFor(text(window, "plant_id"), "plants")}
                            </button>
                          </h3>
                          <span class="badge"
                            >${this.lab(text(window, "activity"))}</span
                          ><small
                            >${windowLabel(window, this.language)} ·
                            ${this.lab(text(window, "environment"))}</small
                          >${text(window, "regional_notes") ? html`<p>${text(window, "regional_notes")}</p>` : nothing}
                        </article>`,
                    )}
                </div>
                ${!windows.some((w) => activeInMonth(w, this.year, this.month)) ? this.empty("noWindows") : nothing}
              </section>`
            : this.renderWeek()
      }`;
  }
  private eventActivity(event: Entity, culture: Entity): string {
    const status = text(event, "status");
    if (["planned", "sown"].includes(status)) return text(culture, "method");
    if (status === "planted_out") return "transplant";
    if (["harvesting", "completed"].includes(status)) return "harvest";
    if (status === "pricked_out") return "prick_out";
    return "care";
  }
  private renderWeek(): TemplateResult {
    const days = weekDays(this.anchor || this.today);
    const visible = new Set(this.filteredPlants(true).map((p) => p.id));
    const windows = this.calendarWindows()
      .map((window) => ({
        window,
        segments: windowWeekSegments(window, this.anchor || this.today),
      }))
      .filter(({ segments }) => segments.length);
    return html`<section class="panel" aria-labelledby="week-windows-title">
        <h2 id="week-windows-title">${this.tr("possibleThisWeek")}</h2>
        <p class="muted">${this.tr("recommendation")}</p>
        <div class="week-windows">
          ${windows.map(
            ({ window, segments }) =>
              html`<button
                class=${`week-window ${text(window, "activity")}`}
                @click=${() => {
                  this.selected = {
                    kind: "plant",
                    id: text(window, "plant_id"),
                  };
                }}
              >
                <span
                  ><strong
                    >${this.nameFor(text(window, "plant_id"), "plants")}</strong
                  >
                  <span
                    >${this.lab(text(window, "activity"))} ·
                    ${this.lab(text(window, "environment"))}${text(window, "variety_id") ? ` · ${this.nameFor(text(window, "variety_id"), "varieties")}` : ""}</span
                  ></span
                >
                <small
                  >${segments.map((segment) => (segment.start === segment.end ? formatDate(segment.start, this.language) : `${formatDate(segment.start, this.language)} – ${formatDate(segment.end, this.language)}`)).join(" · ")}</small
                >
              </button>`,
          )}
        </div>
        ${!windows.length ? html`<p class="muted">${this.tr("noWeekWindows")}</p>` : nothing}
      </section>
      <h2 class="week-heading">${this.tr("actualWork")}</h2>
      <div class="scroll" tabindex="0" aria-label=${this.tr("week")}>
        <div class="week-grid">
          ${days.map((day) => {
            const tasks = this.tables.tasks.filter(
              (task) =>
                text(task, "date") === day &&
                (!this.activity || text(task, "activity") === this.activity) &&
                (!text(task, "plant_id") ||
                  visible.has(text(task, "plant_id"))),
            );
            const events = this.tables.cultivation_events.filter(
              (event) =>
                text(event, "date") === day &&
                this.tables.cultivations.some(
                  (c) =>
                    c.id === text(event, "cultivation_id") &&
                    visible.has(text(c, "plant_id")) &&
                    (!this.activity ||
                      this.eventActivity(event, c) === this.activity),
                ),
            );
            return html`<section
              class=${`week-day ${day === this.today ? "today" : ""}`}
            >
              <h3>
                ${new Intl.DateTimeFormat(this.language === "de" ? "de-DE" : "en-GB", { weekday: "short", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`))}<br />${formatDate(day, this.language)}
              </h3>
              ${!tasks.length && !events.length ? html`<p class="muted week-empty">${this.tr("noAppointments")}</p>` : nothing}
              ${tasks.map((task) => html`<button class=${`week-event ${text(task, "activity")}`} ?disabled=${!this.editable} @click=${() => this.startEditor("tasks", task)}>${text(task, "title")}${task.data.completed ? " ✓" : ""}</button>`)}${events.map(
                (event) => {
                  const culture = this.tables.cultivations.find(
                    (c) => c.id === text(event, "cultivation_id"),
                  )!;
                  return html`<button
                    class="week-event"
                    @click=${() => {
                      this.selected = { kind: "culture", id: culture.id };
                    }}
                  >
                    ${this.plantName(culture)} ·
                    ${this.lab(text(event, "status"))}
                  </button>`;
                },
              )}
            </section>`;
          })}
        </div>
      </div>`;
  }
  private renderCultures(): TemplateResult {
    const cultures = this.tables.cultivations.filter(
      (c) => !["completed", "failed"].includes(this.status(c)),
    );
    return html`${
        cultures.length
          ? html`<div class="grid">
              ${cultures.map(
                (culture) =>
                  html`<article class="plant">
                    <div class="plant-title">
                      <span class="plant-symbol">${icon("cultures")}</span>
                      <h3>${this.plantName(culture)}</h3>
                    </div>
                    <div>
                      <span class="badge"
                        >${this.lab(this.status(culture))}</span
                      >
                    </div>
                    <p>
                      ${formatDate(sowingDate(culture, this.tables.cultivation_events) || text(culture, "date"), this.language)}
                      · ${this.lab(text(culture, "method"))}<br /><span
                        class="muted"
                        >${this.nameFor(text(culture, "location_id"), "locations")}</span
                      >
                    </p>
                    <div class="actions">
                      <button
                        @click=${() => {
                          this.selected = { kind: "culture", id: culture.id };
                        }}
                      >
                        ${this.tr("details")}${icon("arrow")}</button
                      >${this.editable ? html`<button class="icon" aria-label=${`${this.tr("newEvent")}: ${this.plantName(culture)}`} @click=${() => this.startEditor("cultivation_events", undefined, { cultivation_id: culture.id })}>${icon("plus")}</button>` : nothing}
                    </div>
                  </article>`,
              )}
            </div>`
          : this.empty("emptyCultures")
      }
      <section class="panel" style="margin-top:24px">
        <div class="section-head">
          <h2>${this.tr("allTasks")}</h2>
          ${this.editable ? html`<button @click=${() => this.startEditor("tasks")}>${icon("plus")}${this.tr("newTask")}</button>` : nothing}
        </div>
        ${this.renderTasks()}
      </section>`;
  }
  private renderHistory(
    records = this.tables.cultivations,
    compact = false,
  ): TemplateResult {
    const years = [
      ...new Set(
        records.map((c) =>
          (
            sowingDate(c, this.tables.cultivation_events) || text(c, "date")
          ).slice(0, 4),
        ),
      ),
    ]
      .sort()
      .reverse();
    const visible = records
      .filter(
        (c) =>
          (compact ||
            !this.historyPlant ||
            text(c, "plant_id") === this.historyPlant) &&
          (compact ||
            !this.historyYear ||
            (
              sowingDate(c, this.tables.cultivation_events) || text(c, "date")
            ).startsWith(this.historyYear)),
      )
      .sort((a, b) =>
        (
          sowingDate(b, this.tables.cultivation_events) || text(b, "date")
        ).localeCompare(
          sowingDate(a, this.tables.cultivation_events) || text(a, "date"),
        ),
      );
    return html`${
      !compact
        ? html`<p class="notice">${this.tr("observationHint")}</p>
            <div class="filters">
              <label
                >${this.tr("plant_id")}<select
                  @change=${(e: Event) => {
                    this.historyPlant = (e.target as HTMLSelectElement).value;
                  }}
                >
                  <option value="">${this.tr("allPlants")}</option>
                  ${this.tables.plants.map((p) => html`<option value=${p.id} .selected=${this.historyPlant === p.id}>${text(p, "name")}</option>`)}
                </select></label
              ><label
                >${this.tr("year")}<select
                  @change=${(e: Event) => {
                    this.historyYear = (e.target as HTMLSelectElement).value;
                  }}
                >
                  <option value="">${this.tr("history")}</option>
                  ${years.map((year) => html`<option value=${year} .selected=${this.historyYear === year}>${year}</option>`)}
                </select></label
              >
            </div>`
        : nothing
    }
    ${
      visible.length
        ? html`<div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>${this.tr("plant_id")}</th>
                  <th>${this.tr("sowingDate")}</th>
                  <th>${this.tr("method")}</th>
                  <th>${this.tr("location_id")}</th>
                  <th>${this.tr("result")}</th>
                  <th>${this.tr("details")}</th>
                </tr>
              </thead>
              <tbody>
                ${visible.map(
                  (c) =>
                    html`<tr>
                      <td>${this.plantName(c)}</td>
                      <td>
                        ${formatDate(sowingDate(c, this.tables.cultivation_events), this.language)}${!sowingDate(c, this.tables.cultivation_events) ? html`<small> ${this.tr("planned")}</small>` : nothing}
                      </td>
                      <td>${this.lab(text(c, "method"))}</td>
                      <td>
                        ${this.nameFor(text(c, "location_id"), "locations")}
                      </td>
                      <td>
                        <span class=${`badge ${text(c, "result") || "unknown"}`}
                          >${this.lab(text(c, "result") || "unknown")}</span
                        >
                      </td>
                      <td>
                        <button
                          @click=${() => {
                            this.selected = { kind: "culture", id: c.id };
                          }}
                        >
                          ${this.tr("details")}
                        </button>
                      </td>
                    </tr>`,
                )}
              </tbody>
            </table>
          </div>`
        : this.empty("emptyHistory")
    }`;
  }
  private renderLocations(): TemplateResult {
    return html`${
      this.tables.locations.length
        ? html`<div class="grid">
            ${this.tables.locations.map(
              (location) =>
                html`<article class="plant">
                  <div class="plant-title">
                    <span class="plant-symbol">${icon("locations")}</span>
                    <h3>${text(location, "name")}</h3>
                  </div>
                  <p class="muted">
                    ${text(location, "location_type")} ·
                    ${text(location, "light")}
                  </p>
                  <p>
                    ${text(location, "description") || text(location, "soil") || this.tr("noNotes")}
                  </p>
                  ${
                    text(location, "sensor_entity_id")
                      ? html`<p class="break">
                          <small
                            >${this.lab(text(location, "measurement_kind"))}<br />${text(location, "sensor_entity_id")}</small
                          >
                        </p>`
                      : nothing
                  }${text(location, "sensor_entity_id") ? this.renderTemperature(location) : nothing}
                  ${location.data.archived ? html`<span class="badge unknown">${this.tr("archived")}</span>` : nothing}${
                    this.editable
                      ? html`<div class="actions">
                          <button
                            @click=${() => this.startEditor("locations", location)}
                          >
                            ${this.tr("edit")}</button
                          ><button
                            @click=${() => this.archive(location, "locations")}
                          >
                            ${this.tr(location.data.archived ? "unarchive" : "archive")}</button
                          ><button
                            class="danger"
                            @click=${() => {
                              this.deleting = {
                                table: "locations",
                                record: location,
                              };
                            }}
                          >
                            ${this.tr("delete")}
                          </button>
                        </div>`
                      : nothing
                  }
                </article>`,
            )}
          </div>`
        : this.empty("emptyLocations", "", "newLocation", () =>
            this.startEditor("locations"),
          )
    }`;
  }
  private renderData(data: Data, omit: string[] = []): TemplateResult {
    return html`<dl>
      ${Object.entries(data)
        .filter(
          ([key, value]) =>
            !omit.includes(key) &&
            value !== undefined &&
            value !== null &&
            value !== "" &&
            !key.endsWith("_id") &&
            typeof value !== "object",
        )
        .map(
          ([key, value]) =>
            html`<dt>${this.tr(key)}</dt>
              <dd>
                ${["category", "method", "environment", "initial_status", "result", "germination_result", "harvest_result", "measurement_kind"].includes(key) ? this.lab(String(value)) : typeof value === "boolean" ? (value ? "✓" : "—") : String(value)}
              </dd>`,
        )}
    </dl>`;
  }
  private renderDetail(): TemplateResult {
    const selected = this.selected;
    const record = selected
      ? this.tables[selected.kind === "plant" ? "plants" : "cultivations"].find(
          (r) => r.id === selected.id,
        )
      : undefined;
    return html`<dialog
      id="detail-dialog"
      aria-labelledby="detail-title"
      @close=${() => {
        this.selected = null;
      }}
    >
      ${
        selected && record
          ? html`<div class="dialog-head">
                <div>
                  <small
                    >${this.tr(selected.kind === "plant" ? "plantDetail" : "cultivationDetail")}</small
                  >
                  <h2 id="detail-title">
                    ${selected.kind === "plant" ? text(record, "name") : this.plantName(record)}
                  </h2>
                </div>
                <button
                  class="icon"
                  aria-label=${this.tr("close")}
                  @click=${() => {
                    this.selected = null;
                  }}
                >
                  ${icon("close")}
                </button>
              </div>
              <div class="dialog-body">
                ${this.error ? html`<p class="notice error" role="alert">${this.error}</p>` : nothing}
                ${
                  this.editable
                    ? html`<div class="actions">
                        <button
                          @click=${() => this.startEditor(selected.kind === "plant" ? "plants" : "cultivations", record)}
                        >
                          ${this.tr("edit")}</button
                        >${selected.kind === "plant" ? html`<button @click=${() => this.duplicate(record)} ?disabled=${this.busy}>${this.tr("duplicate")}</button><button @click=${() => this.archive(record, "plants")} ?disabled=${this.busy}>${this.tr(record.data.archived ? "unarchive" : "archive")}</button>` : html`<button class="primary" @click=${() => this.startEditor("cultivation_events", undefined, { cultivation_id: record.id })}>${icon("plus")}${this.tr("newEvent")}</button>`}<button
                          class="danger"
                          @click=${() => {
                            this.deleting = {
                              table:
                                selected.kind === "plant"
                                  ? "plants"
                                  : "cultivations",
                              record,
                            };
                          }}
                        >
                          ${this.tr("delete")}
                        </button>
                      </div>`
                    : nothing
                }
                ${selected.kind === "plant" ? this.renderPlantDetail(record) : this.renderCultureDetail(record)}
              </div>`
          : selected
            ? html`<div class="dialog-body">
                <p role="alert">${this.tr("not_found")}</p>
                <button
                  @click=${() => {
                    this.selected = null;
                  }}
                >
                  ${this.tr("close")}
                </button>
              </div>`
            : nothing
      }
    </dialog>`;
  }
  private renderPlantDetail(plant: Entity): TemplateResult {
    const varieties = this.tables.varieties.filter(
      (v) => text(v, "plant_id") === plant.id,
    );
    return html`<p class="notice">${this.tr("temperatureHint")}</p>
      ${this.renderData(plant.data)}
      <div class="section-head">
        <h3>${this.tr("varieties")}</h3>
        ${this.editable ? html`<button @click=${() => this.startEditor("varieties", undefined, { plant_id: plant.id })}>${icon("plus")}${this.tr("newVariety")}</button>` : nothing}
      </div>
      ${
        varieties.length
          ? varieties.map(
              (v) =>
                html`<article class="item">
                  <div class="item-content">
                    <h3>${text(v, "name")}</h3>
                    ${this.renderData(v.data, ["name"])}
                  </div>
                  ${
                    this.editable
                      ? html`<button
                            @click=${() => this.startEditor("varieties", v)}
                          >
                            ${this.tr("edit")}</button
                          ><button
                            class="danger"
                            @click=${() => {
                              this.deleting = { table: "varieties", record: v };
                            }}
                          >
                            ${this.tr("delete")}
                          </button>`
                      : nothing
                  }
                </article>`,
            )
          : html`<p class="muted">${this.tr("noVarieties")}</p>`
      }
      <div class="section-head">
        <h3>${this.tr("windows")}</h3>
        ${this.editable ? html`<button @click=${() => this.startEditor("growing_windows", undefined, { plant_id: plant.id })}>${icon("plus")}${this.tr("newWindow")}</button>` : nothing}
      </div>
      ${
        this.plantWindows(plant.id).length
          ? this.plantWindows(plant.id).map(
              (w) =>
                html`<article class="item">
                  <div class="item-content">
                    <h3>
                      ${this.lab(text(w, "activity"))} ·
                      ${windowLabel(w, this.language)}
                    </h3>
                    <small
                      >${this.lab(text(w, "environment"))}${text(w, "variety_id") ? ` · ${this.nameFor(text(w, "variety_id"), "varieties")}` : ""}</small
                    >${this.renderData(w.data, ["start_month", "start_day", "end_month", "end_day", "activity", "environment"])}
                  </div>
                  ${
                    this.editable
                      ? html`<button
                            @click=${() => this.startEditor("growing_windows", w)}
                          >
                            ${this.tr("edit")}</button
                          ><button
                            class="danger"
                            @click=${() => {
                              this.deleting = {
                                table: "growing_windows",
                                record: w,
                              };
                            }}
                          >
                            ${this.tr("delete")}
                          </button>`
                      : nothing
                  }
                </article>`,
            )
          : html`<p class="muted">${this.tr("noAllWindows")}</p>`
      }
      <div class="section-head">
        <h3>${this.tr("observations")}</h3>
        ${this.editable && !plant.data.archived ? html`<button class="primary" @click=${() => this.startEditor("cultivations", undefined, { plant_id: plant.id })}>${icon("plus")}${this.tr("newSowing")}</button>` : nothing}
      </div>
      ${this.renderHistory(
        this.tables.cultivations.filter(
          (c) => text(c, "plant_id") === plant.id,
        ),
        true,
      )}`;
  }
  private renderCultureDetail(culture: Entity): TemplateResult {
    const snapshot = culture.data.snapshot;
    const snapshotData =
      snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
        ? snapshot
        : undefined;
    return html`<p>
        <span class="badge">${this.lab(this.status(culture))}</span>
      </p>
      <dl>
        <dt>${this.tr("sowingDate")}</dt>
        <dd>
          ${formatDate(sowingDate(culture, this.tables.cultivation_events), this.language)}
        </dd>
        <dt>${this.tr("location_id")}</dt>
        <dd>${this.nameFor(text(culture, "location_id"), "locations")}</dd>
        <dt>${this.tr("variety")}</dt>
        <dd>${this.nameFor(text(culture, "variety_id"), "varieties")}</dd>
      </dl>
      ${this.renderData(culture.data, ["snapshot", "date"])}
      ${
        this.tables.locations.find((l) => l.id === text(culture, "location_id"))
          ? this.renderTemperature(
              this.tables.locations.find(
                (l) => l.id === text(culture, "location_id"),
              )!,
              culture,
            )
          : nothing
      }
      <h3>${this.tr("timeline")}</h3>
      <div class="timeline">
        ${cultureEvents(culture, this.tables.cultivation_events).map(
          (event) =>
            html`<article>
              <div class="row">
                <div>
                  <strong>${this.lab(text(event, "status"))}</strong
                  ><br /><small
                    >${formatDate(text(event, "date"), this.language)}</small
                  >
                </div>
                ${
                  this.editable
                    ? html`<div class="actions">
                        <button
                          @click=${() => this.startEditor("cultivation_events", event)}
                        >
                          ${this.tr("edit")}</button
                        >${
                          event.data.origin !== "initial"
                            ? html`<button
                                class="danger"
                                @click=${() => {
                                  this.deleting = {
                                    table: "cultivation_events",
                                    record: event,
                                  };
                                }}
                              >
                                ${this.tr("delete")}
                              </button>`
                            : nothing
                        }
                      </div>`
                    : nothing
                }
              </div>
              <p>${text(event, "notes") || this.tr("noNotes")}</p>
            </article>`,
        )}
      </div>
      <details>
        <summary>${this.tr("snapshot")}</summary>
        <p class="notice">${this.tr("snapshotHint")}</p>
        ${(["plant", "variety", "location"] as const).map((key) => {
          const data = snapshotData?.[key];
          return data && typeof data === "object" && !Array.isArray(data)
            ? html`<h3>
                  ${this.tr(key === "plant" ? "plant_id" : key === "variety" ? "variety" : "location_id")}
                </h3>
                ${this.renderData(data)}`
            : nothing;
        })}${
          Array.isArray(snapshotData?.windows)
            ? html`<h3>${this.tr("windows")}</h3>
                ${snapshotData.windows.map((data) => (data && typeof data === "object" && !Array.isArray(data) ? this.renderData(data) : nothing))}`
            : nothing
        }
      </details>`;
  }
  private async loadBackups(): Promise<void> {
    const api = this.api;
    const generation = this.connectionGeneration;
    if (!api) return;
    try {
      const backups = await api.command<string[]>("backups");
      if (generation === this.connectionGeneration) this.backups = backups;
    } catch (error) {
      if (generation === this.connectionGeneration)
        this.error = errorText(this.language, error);
    }
  }
  private async exportFile(format: "json" | "csv"): Promise<void> {
    if (!this.api || this.busy) return;
    this.busy = true;
    this.error = "";
    const api = this.api;
    const generation = this.connectionGeneration;
    try {
      if (format === "json") {
        const data = await api.command<Json>("export", { format });
        if (generation !== this.connectionGeneration) return;
        download(
          JSON.stringify(data, null, 2),
          `garden-planner-${this.today}.json`,
          "application/json",
        );
      } else {
        const data = await api.command<Record<string, string>>("export", {
          format,
        });
        if (generation !== this.connectionGeneration) return;
        const zipped = csvZip(data);
        download(
          zipped.slice().buffer,
          `garden-planner-csv-${this.today}.zip`,
          "application/zip",
        );
      }
    } catch (error) {
      if (generation === this.connectionGeneration)
        this.error = errorText(this.language, error);
    } finally {
      if (generation === this.connectionGeneration) this.busy = false;
    }
  }
  private async selectImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.api || this.busy) return;
    this.busy = true;
    this.error = "";
    const api = this.api;
    const generation = this.connectionGeneration;
    try {
      if (file.size > MAX_BYTES) throw new Error("invalid_file");
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (generation !== this.connectionGeneration) return;
      const format = bytes[0] === 0x50 && bytes[1] === 0x4b ? "csv" : "json";
      const payload: unknown =
        format === "csv"
          ? readCsvZip(bytes)
          : JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
      const plan = await api.command<ImportPlan>("preview_import", {
        payload,
        format,
        mode: this.importMode,
      });
      if (generation !== this.connectionGeneration) return;
      this.replaceConfirmed = false;
      this.reviewed = { plan, payload, format };
    } catch (error) {
      if (generation !== this.connectionGeneration) return;
      this.error =
        error instanceof SyntaxError ||
        (error instanceof Error && error.message === "invalid_file")
          ? this.tr("invalidFile")
          : errorText(this.language, error);
    } finally {
      input.value = "";
      if (generation === this.connectionGeneration) this.busy = false;
    }
  }
  private async previewRestore(name: string): Promise<void> {
    if (!this.api || this.busy) return;
    this.busy = true;
    this.error = "";
    const api = this.api;
    const generation = this.connectionGeneration;
    try {
      const plan = await api.command<ImportPlan>("preview_restore", {
        name,
      });
      if (generation !== this.connectionGeneration) return;
      this.replaceConfirmed = false;
      this.reviewed = { plan, backup: name };
    } catch (error) {
      if (generation === this.connectionGeneration)
        this.error = errorText(this.language, error);
    } finally {
      if (generation === this.connectionGeneration) this.busy = false;
    }
  }
  private async applyReviewed(): Promise<void> {
    const review = this.reviewed;
    if (!review || (review.plan.mode === "replace" && !this.replaceConfirmed))
      return;
    const result = await this.action<ImportPlan>(
      review.backup ? "restore" : "import",
      review.backup
        ? { name: review.backup, token: review.plan.token, confirm: true }
        : {
            payload: review.payload,
            token: review.plan.token,
            format: review.format,
            mode: review.plan.mode,
            confirm: review.plan.mode === "replace",
          },
      review.backup ? "restored" : "importDone",
    );
    if (result) {
      this.reviewed = null;
      await this.loadBackups();
    }
  }
  private renderReview(): TemplateResult {
    const review = this.reviewed;
    return html`<dialog
      id="review-dialog"
      aria-labelledby="review-title"
      @cancel=${(e: Event) => {
        if (this.busy) e.preventDefault();
      }}
      @close=${() => {
        this.reviewed = null;
      }}
    >
      ${
        review
          ? html`<div class="dialog-head">
                <h2 id="review-title">${this.tr("importPreview")}</h2>
                <button
                  class="icon"
                  ?disabled=${this.busy}
                  aria-label=${this.tr("close")}
                  @click=${() => {
                    this.reviewed = null;
                  }}
                >
                  ${icon("close")}
                </button>
              </div>
              <div class="dialog-body">
                ${this.error ? html`<p class="notice error" role="alert">${this.error}</p>` : nothing}
                <dl>
                  ${(
                    ["inserted", "updated", "skipped", "deleted"] as const
                  ).map(
                    (key) =>
                      html`<dt>
                          ${this.tr(key === "deleted" ? "removed" : key)}
                        </dt>
                        <dd>${review.plan[key]}</dd>`,
                  )}
                  <dt>${this.tr("conflicts")}</dt>
                  <dd>${review.plan.conflicts.length}</dd>
                </dl>
                ${
                  review.plan.mode === "replace"
                    ? html`<p class="notice error">
                          ${this.tr("replaceWarning")}
                        </p>
                        <label class="check"
                          ><input
                            type="checkbox"
                            .checked=${this.replaceConfirmed}
                            @change=${(e: Event) => {
                              this.replaceConfirmed = (
                                e.target as HTMLInputElement
                              ).checked;
                            }}
                          />${this.tr("confirmReplace")}</label
                        >`
                    : nothing
                }
              </div>
              <div class="dialog-foot">
                <button
                  ?disabled=${this.busy}
                  @click=${() => {
                    this.reviewed = null;
                  }}
                >
                  ${this.tr("cancel")}</button
                ><button
                  class="primary"
                  ?disabled=${this.busy || review.plan.conflicts.length > 0 || (review.plan.mode === "replace" && !this.replaceConfirmed)}
                  @click=${this.applyReviewed}
                >
                  ${this.tr(review.backup ? "restore" : "applyImport")}
                </button>
              </div>`
          : nothing
      }
    </dialog>`;
  }
  private async loadHostSettings(): Promise<void> {
    const api = this.api;
    const generation = this.connectionGeneration;
    if (!api || !this.admin || !this.capabilities?.reminders) return;
    try {
      const [settings, log] = await Promise.all([
        api.command<SettingsResponse>("get_settings"),
        api.command<{ state: string; description: string; at: string }[]>(
          "reminder_log",
        ),
      ]);
      if (generation !== this.connectionGeneration) return;
      this.hostSettings = settings;
      this.hostDraft = structuredClone(settings.settings);
      this.deliveries = log;
    } catch (error) {
      if (generation === this.connectionGeneration)
        this.error = errorText(this.language, error);
    }
  }
  private renderTemperature(
    location: Entity,
    culture?: Entity,
  ): TemplateResult | typeof nothing {
    if (!text(location, "sensor_entity_id")) return nothing;
    const reading = temperatureReading(
      this.hass,
      location,
      culture ? recommendedRange(culture) : undefined,
    );
    return html`<div
      class="notice ${reading.state === "outside" ? "error" : ""}"
    >
      <strong
        >${this.tr("liveTemperature")} ·
        ${this.lab(text(location, "measurement_kind"))}</strong
      >
      <p>
        ${reading.value === undefined ? this.tr(reading.state === "unit" ? "badTemperatureUnit" : "noSensor") : `${reading.value.toLocaleString(this.language, { maximumFractionDigits: 1 })} °C`}
      </p>
      ${reading.state === "outside" ? html`<p>${this.tr("outsideRange")}</p>` : reading.state === "information" && text(location, "measurement_kind") !== "substrate" ? html`<small>${this.tr("notComparable")}</small>` : nothing}
    </div>`;
  }
  private renderHostSettings(): TemplateResult | typeof nothing {
    if (!this.capabilities?.reminders || !this.admin) return nothing;
    const response = this.hostSettings;
    const draft = this.hostDraft;
    if (!response || !draft)
      return html`<section class="panel">
        <button @click=${this.loadHostSettings}>
          ${this.tr("integrationSettings")}
        </button>
      </section>`;
    const set = (
      key: keyof HostSettings,
      value: string | number | boolean | string[],
    ) => {
      this.hostDraft = { ...draft, [key]: value };
    };
    return html`<section class="panel">
      <h2>${this.tr("integrationSettings")}</h2>
      <form
        @submit=${async (event: SubmitEvent) => {
          event.preventDefault();
          const value = await this.action<HostSettings>(
            "set_settings",
            { settings: this.hostDraft, confirm: true },
            "settingsSaved",
          );
          if (value) await this.loadHostSettings();
        }}
      >
        <div class="form-grid" style="margin-top:18px">
          <label class="wide"
            >${this.tr("writers")}<select
              multiple
              aria-label=${this.tr("writers")}
              @change=${(e: Event) =>
                set(
                  "writers",
                  [...(e.target as HTMLSelectElement).selectedOptions].map(
                    (o) => o.value,
                  ),
                )}
            >
              ${response.users.map((u) => html`<option value=${u.id} .selected=${draft.writers.includes(u.id)}>${u.name}</option>`)}
            </select></label
          >
          <label class="check wide"
            ><input
              type="checkbox"
              .checked=${draft.reminders_enabled}
              @change=${(e: Event) => set("reminders_enabled", (e.target as HTMLInputElement).checked)}
            />${this.tr("reminders_enabled")}</label
          >
          <label
            >${this.tr("lead_days")}<input
              type="number"
              min="0"
              max="30"
              required
              .value=${String(draft.lead_days)}
              @input=${(e: Event) => set("lead_days", Number((e.target as HTMLInputElement).value))}
          /></label>
          <label
            >${this.tr("reminder_hour")}<input
              type="number"
              min="0"
              max="23"
              required
              .value=${String(draft.reminder_hour)}
              @input=${(e: Event) => set("reminder_hour", Number((e.target as HTMLInputElement).value))}
          /></label>
          <label
            >${this.tr("notify_service")}<select
              aria-label=${this.tr("notify_service")}
              ?required=${draft.reminders_enabled}
              @change=${(e: Event) => set("notify_service", (e.target as HTMLSelectElement).value)}
            >
              <option value="" .selected=${!draft.notify_service}>
                ${this.tr("noChannel")}
              </option>
              ${[...new Set([...response.channels, ...(draft.notify_service ? [draft.notify_service] : [])])].map((c) => html`<option value=${c} .selected=${draft.notify_service === c}>${c}</option>`)}
            </select></label
          >
          <label
            >${this.tr("notify_entity")}<input
              .value=${draft.notify_entity}
              ?required=${draft.notify_service === "notify.send_message"}
              @input=${(e: Event) => set("notify_entity", (e.target as HTMLInputElement).value)}
          /></label>
          <label
            >${this.tr("reminderLanguage")}<select
              aria-label=${this.tr("reminderLanguage")}
              @change=${(e: Event) => set("language", (e.target as HTMLSelectElement).value)}
            >
              <option value="de" .selected=${draft.language === "de"}>
                Deutsch
              </option>
              <option value="en" .selected=${draft.language === "en"}>
                English
              </option>
            </select></label
          >
        </div>
        <p class="notice">
          ${this.tr("reminderInfo")} ${this.tr("reminderCatchup")}
        </p>
        <p class="muted">${this.tr("notifyEntityHint")}</p>
        <button class="primary" type="submit" ?disabled=${this.busy}>
          ${this.tr("save")}
        </button>
      </form>
      <details>
        <summary>${this.tr("deliveryLog")}</summary>
        ${this.deliveries.length ? this.deliveries.map((d) => html`<p><span class="badge">${this.tr(d.state)}</span> ${d.description}</p>`) : html`<p>${this.tr("noDeliveries")}</p>`}
      </details>
    </section>`;
  }
  private renderSettings(): TemplateResult {
    return html`<div class="settings-grid">
      <section class="panel">
        <h2>${this.tr("language")}</h2>
        <p class="muted">${this.tr("languageHint")}</p>
        <label
          >${this.tr("language")}<select
            aria-label=${this.tr("language")}
            @change=${(e: Event) => {
              this.languagePreference = (e.target as HTMLSelectElement).value;
              try {
                localStorage.setItem(
                  "garden-planner-language",
                  this.languagePreference,
                );
              } catch {
                /* browser may disable storage */
              }
            }}
          >
            <option value="" .selected=${this.languagePreference === ""}>
              ${this.tr("automatic")}
            </option>
            <option value="de" .selected=${this.languagePreference === "de"}>
              Deutsch
            </option>
            <option value="en" .selected=${this.languagePreference === "en"}>
              English
            </option>
          </select></label
        >
        <dl>
          <dt>${this.tr("timezone")}</dt>
          <dd>${this.timeZone}</dd>
        </dl>
      </section>
      <section class="panel">
        <h2>${this.tr("dataSafety")}</h2>
        <p class="muted">${this.tr("dataSafetyBody")}</p>
        ${
          this.admin
            ? html`<div class="actions" style="justify-content:flex-start">
                  <button
                    ?disabled=${this.busy}
                    @click=${() => this.exportFile("json")}
                  >
                    ${this.tr("exportJson")}</button
                  ><button
                    ?disabled=${this.busy}
                    @click=${() => this.exportFile("csv")}
                  >
                    ${this.tr("exportCsv")}</button
                  ><button
                    ?disabled=${this.busy}
                    @click=${async () => {
                      const name = await this.action<string>(
                        "backup",
                        {},
                        "backupSaved",
                      );
                      if (name) await this.loadBackups();
                    }}
                  >
                    ${this.tr("backup")}
                  </button>
                </div>
                <div class="filters" style="margin-top:20px">
                  <label
                    >${this.tr("importMode")}<select
                      @change=${(e: Event) => {
                        this.importMode = (e.target as HTMLSelectElement)
                          .value as "merge" | "replace";
                      }}
                    >
                      <option value="merge">${this.tr("merge")}</option>
                      <option value="replace">${this.tr("replace")}</option>
                    </select></label
                  ><label
                    >${this.tr("importData")}<input
                      class="file-input"
                      type="file"
                      accept=".json,.zip"
                      ?disabled=${this.busy}
                      @change=${this.selectImport}
                  /></label>
                </div>
                <p class="muted">${this.tr("limitedTransport")}</p>
                <h3>${this.tr("backups")}</h3>
                ${this.backups.map((name) => html`<div class="item"><small class="item-content break">${name}</small><button ?disabled=${this.busy} @click=${() => this.previewRestore(name)}>${this.tr("restorePreview")}</button></div>`)}`
            : html`<p class="notice">${this.tr("adminOnly")}</p>`
        }
      </section>
      ${this.renderHostSettings()}
      <section class="panel" ?hidden=${this.capabilities?.reminders === true}>
        <h2>${this.tr("notifications")}</h2>
        <p class="muted">${this.tr("notificationsHint")}</p>
      </section>
    </div>`;
  }
  protected render(): TemplateResult {
    const newAction: [string, Table] =
      this.page === "plants"
        ? ["newPlant", "plants"]
        : this.page === "locations"
          ? ["newLocation", "locations"]
          : ["newSowing", "cultivations"];
    return html`<div class="app">
        <aside>
          <div class="brand">
            <span class="brand-icon">${icon("plants")}</span>
            <div>
              <strong>Garden Planner</strong
              ><small
                >${this.language === "de" ? "WACHSEN & ERINNERN" : "GROW & REMEMBER"}</small
              >
            </div>
          </div>
          <nav aria-label="Garden Planner">
            ${pages.map((page) => html`<button aria-current=${this.page === page ? "page" : nothing} @click=${() => this.navigate(page)}>${icon(page)}${this.tr(page)}</button>`)}
          </nav>
          <div class="aside-footer">${this.tr("tagline")}</div>
        </aside>
        <main>
          <header class="topbar">
            <div>
              <div class="eyebrow">Garden Planner</div>
              <h1>${this.tr(this.page)}</h1>
              <p class="muted">${this.tr("overviewIntro")}</p>
            </div>
            <div class="actions">
              <button
                class="icon"
                aria-label=${this.tr("refresh")}
                ?disabled=${this.busy}
                @click=${() => this.refresh()}
              >
                ${icon("refresh")}</button
              >${this.editable && this.page !== "settings" ? html`<button class="primary" ?disabled=${this.busy || !this.loaded || (newAction[1] === "cultivations" && !this.plantList.length)} @click=${() => this.startEditor(newAction[1])}>${icon("plus")}${this.tr(newAction[0])}</button>` : nothing}
            </div>
          </header>
          ${this.error ? html`<p class="notice error" role="alert">${this.error}<button class="link" @click=${() => this.refresh()}>${this.tr("retry")}</button></p>` : nothing}
          ${this.loaded && !this.editable ? html`<p class="notice">${this.tr("readOnly")}</p>` : nothing}
          ${
            !this.loaded
              ? html`<p role="status">${this.tr("loading")}</p>`
              : this.page === "overview"
                ? this.renderOverview()
                : this.page === "calendar"
                  ? this.renderCalendar()
                  : this.page === "plants"
                    ? html`${this.renderFilters()}${
                        !this.tables.plants.length
                          ? this.empty(
                              "emptyPlants",
                              "emptyPlantsBody",
                              "newPlant",
                              () => this.startEditor("plants"),
                            )
                          : this.filteredPlants().length
                            ? html`<div class="grid">
                                ${repeat(
                                  this.filteredPlants(),
                                  (p) => p.id,
                                  (p) => this.renderPlantCard(p),
                                )}
                              </div>`
                            : this.empty("noResults")
                      }`
                    : this.page === "cultures"
                      ? this.renderCultures()
                      : this.page === "history"
                        ? html`<section class="panel">
                            ${this.renderHistory()}
                          </section>`
                        : this.page === "locations"
                          ? this.renderLocations()
                          : this.renderSettings()
          }
        </main>
      </div>
      ${this.renderDetail()}${this.renderEditor()}${this.renderReview()}
      <dialog
        id="delete-dialog"
        aria-labelledby="delete-title"
        @cancel=${(e: Event) => {
          if (this.busy) e.preventDefault();
        }}
        @close=${() => {
          this.deleting = null;
        }}
      >
        <div class="dialog-head">
          <h2 id="delete-title">${this.tr("deleteTitle")}</h2>
        </div>
        <div class="dialog-body">
          <p>${this.tr("deleteBody")}</p>
          ${this.error ? html`<p class="notice error" role="alert">${this.error}</p>` : nothing}
        </div>
        <div class="dialog-foot">
          <button
            ?disabled=${this.busy}
            @click=${() => {
              this.deleting = null;
            }}
          >
            ${this.tr("cancel")}</button
          ><button
            class="danger"
            ?disabled=${this.busy}
            @click=${this.removeRecord}
          >
            ${this.tr("confirmDelete")}
          </button>
        </div>
      </dialog>
      <div role="status" aria-live="polite">
        ${this.toast ? html`<div class="toast">${this.toast}</div>` : nothing}
      </div>`;
  }
}
if (!customElements.get("garden-planner-panel"))
  customElements.define("garden-planner-panel", GardenPlannerPanel);
