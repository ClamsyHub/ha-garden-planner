import deCatalog from "./locales/de.json" with { type: "json" };
import enCatalog from "./locales/en.json" with { type: "json" };
import { translatedText } from "./locale-catalog";
import {
  LitElement,
  html,
  svg,
  css,
  nothing,
  type PropertyValues,
  type TemplateResult,
} from "lit";
import { live } from "lit/directives/live.js";
import type { PlannerApi } from "./api";
import {
  emptyTables,
  text,
  type Entity,
  type Tables,
  type Language,
} from "./types";
import { errorText, label } from "./i18n";
import { formatDate, activeInMonth, windowLabel } from "./dates";
import { occupancySuggestions } from "./bed-periods";
import {
  layoutData,
  plantingData,
  toData,
  preset,
  centers,
  overlaps,
  usable,
  path,
  area,
  warnings,
  seedNeeds,
  type Layout,
  type Planting,
  type Point,
  type PlanWarning,
} from "./bed-geometry";

const de = deCatalog.bed;
const en = enCatalog.bed;
type Tool = "select" | "outline" | "freehand" | "hole" | "place" | "pan";
export class BedPlanner extends LitElement {
  static properties = {
    api: { attribute: false },
    tables: { attribute: false },
    editable: { type: Boolean },
    language: { attribute: false },
    today: { attribute: false },
    bed: { state: true },
    year: { state: true },
    month: { state: true },
    layoutDraft: { state: true },
    draft: { state: true },
    selected: { state: true },
    tool: { state: true },
    drawing: { state: true },
    corner: { state: true },
    busy: { state: true },
    message: { state: true },
    error: { state: true },
    zoom: { state: true },
    showSpacing: { state: true },
    layoutDirty: { state: true },
    draftDirty: { state: true },
    dialogOpen: { state: true },
    periodChoice: { state: true },
  };
  declare api?: PlannerApi;
  declare tables: Tables;
  declare editable: boolean;
  declare language: Language;
  declare today: string;
  private bed = "";
  private year = 0;
  private month = 0;
  private layoutDraft?: Layout;
  private draft?: Planting;
  private selected = "";
  private dialogOpen = false;
  private periodChoice = 0;
  private periodTouched = false;
  private dialogReturn?: Planting;
  private layoutBase?: Entity;
  private editingRecord?: Entity;
  private tool: Tool = "select";
  private drawing: Point[] = [];
  private corner = -1;
  private busy = false;
  private message = "";
  private error = "";
  private zoom = 1;
  private showSpacing = true;
  private layoutDirty = false;
  private draftDirty = false;
  private generation = 0;
  private warningMemo?: {
    tables: Tables;
    layout: Layout;
    draft?: Planting;
    selected: string;
    dialog: boolean;
    result: PlanWarning[];
  };
  private get placementActive(): boolean {
    return !!this.draft && !this.dialogOpen;
  }
  private get suggestions() {
    return this.draft
      ? occupancySuggestions(
          this.draft.plant_id,
          this.year,
          this.tables.growing_windows,
        )
      : [];
  }
  private openEditor(): void {
    this.dialogReturn = this.draft ? structuredClone(this.draft) : undefined;
    this.dialogOpen = true;
  }
  private cancelEditor(): void {
    if (this.busy) return;
    this.dialogOpen = false;
    if (this.dialogReturn) {
      this.draft = this.dialogReturn;
      this.dialogReturn = undefined;
      this.tool = "place";
    } else this.cancelPlacement();
    this.error = "";
  }
  private cancelPlacement(): void {
    this.dialogOpen = false;
    this.draft = undefined;
    this.selected = "";
    this.editingRecord = undefined;
    this.draftDirty = false;
    this.dialogReturn = undefined;
    this.tool = "select";
    this.error = "";
  }
  private beginPlacement(): void {
    const p = this.draft;
    if (!p) return;
    if (
      !p.plant_id ||
      !/^\d{4}-\d{2}-\d{2}$/.test(p.start_date) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(p.end_date) ||
      p.end_date < p.start_date ||
      !Number.isInteger(p.plant_count) ||
      p.plant_count < 1 ||
      p.plant_count > 200 ||
      !Number.isInteger(p.columns) ||
      p.columns < 1 ||
      p.columns > p.plant_count
    ) {
      this.error = this.t("invalidPeriod");
      return;
    }
    this.dialogOpen = false;
    this.dialogReturn = undefined;
    this.tool = "place";
    this.month = 0;
    this.year = Number(p.start_date.slice(0, 4));
    this.error = "";
    void this.updateComplete.then(() =>
      this.renderRoot
        .querySelector<HTMLElement>(".viewport")
        ?.scrollIntoView({ block: "center" }),
    );
  }
  private applyPeriod(index = this.periodChoice): void {
    const value = this.suggestions[index];
    if (!this.draft || !value) return;
    this.draft = {
      ...this.draft,
      start_date: value.start,
      end_date: value.end,
    };
    this.draftDirty = true;
    this.periodTouched = true;
  }
  protected updated(): void {
    const dialog = this.renderRoot.querySelector<HTMLDialogElement>(
      "#bed-planting-dialog",
    );
    if (this.dialogOpen && this.draft && !dialog?.open) dialog?.showModal();
    else if ((!this.dialogOpen || !this.draft) && dialog?.open) dialog.close();
  }
  private planningWarnings(): PlanWarning[] {
    const layout = this.layout;
    const memo = this.warningMemo;
    if (
      memo &&
      memo.tables === this.tables &&
      memo.layout === layout &&
      memo.draft === this.draft &&
      memo.selected === this.selected &&
      memo.dialog === this.dialogOpen
    )
      return memo.result;
    let entries = this.entries;
    if (this.placementActive && this.draft)
      entries = [
        ...entries.filter((e) => e.id !== this.selected),
        {
          id: this.selected || "draft",
          revision: 1,
          created_at: "",
          updated_at: "",
          data: toData(this.draft),
        },
      ];
    const result = warnings(layout, entries, this.tables);
    this.warningMemo = {
      tables: this.tables,
      layout,
      draft: this.draft,
      selected: this.selected,
      dialog: this.dialogOpen,
      result,
    };
    return result;
  }
  private drag?: {
    kind: "corner" | "plant" | "freehand";
    index: number;
    start: Point;
    origin: Point;
  };
  constructor() {
    super();
    this.tables = emptyTables();
    this.editable = false;
    this.language = "de";
    this.today = "";
  }
  private t(k: keyof typeof de): string {
    return (
      translatedText(this.language, "bed", k) ??
      (this.language === "de" ? de : en)[k]
    );
  }
  get hasUnsavedChanges(): boolean {
    return (
      this.layoutDirty ||
      this.draftDirty ||
      this.drawing.length > 0 ||
      this.busy
    );
  }
  private get record(): Entity | undefined {
    return this.tables.bed_layouts.find((e) => e.data.location_id === this.bed);
  }
  private get layout(): Layout {
    return (
      this.layoutDraft ??
      (this.record
        ? layoutData(this.record)
        : {
            location_id: this.bed,
            width_cm: 300,
            height_cm: 150,
            outline: preset("rectangle", 300, 150),
            holes: [],
            rotation_years: 3,
            neighbor_distance_cm: 100,
          })
    );
  }
  private get entries(): Entity[] {
    return this.tables.bed_plantings.filter(
      (e) => e.data.layout_id === this.record?.id,
    );
  }
  private inYear(e: Entity): boolean {
    const p = plantingData(e);
    return (
      p.start_date <= `${this.year}-12-31` && p.end_date >= `${this.year}-01-01`
    );
  }
  private get season(): Entity[] {
    return this.entries
      .filter((e) => this.inYear(e))
      .sort((a, b) =>
        String(a.data.start_date).localeCompare(String(b.data.start_date)),
      );
  }
  private get displayed(): Entity[] {
    if (this.placementActive && this.draft)
      return this.entries.filter((e) => overlaps(plantingData(e), this.draft!));
    return this.season.filter(
      (e) => !this.month || this.inMonth(plantingData(e), this.month),
    );
  }
  private inMonth(p: Planting, m: number): boolean {
    const start = `${this.year}-${String(m).padStart(2, "0")}-01`;
    const end = new Date(Date.UTC(this.year, m, 0)).toISOString().slice(0, 10);
    return p.start_date <= end && p.end_date >= start;
  }
  protected willUpdate(changed: PropertyValues): void {
    if (changed.has("api") || (!this.editable && changed.has("editable"))) {
      this.generation++;
      this.draft = undefined;
      this.dialogOpen = false;
      this.layoutDraft = undefined;
      this.draftDirty = this.layoutDirty = false;
      this.drawing = [];
      this.busy = false;
      this.tool = "select";
    }
    if (!this.year && this.today)
      this.year =
        Number(this.today.slice(0, 4)) +
        (Number(this.today.slice(5, 7)) >= 10 ? 1 : 0);
    if (!this.bed)
      this.bed = this.tables.locations.find((e) => !e.data.archived)?.id ?? "";
  }
  private beforeUnload = (event: BeforeUnloadEvent): void => {
    if (this.hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = "";
    }
  };
  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("beforeunload", this.beforeUnload);
    this.addEventListener("keydown", this.escapeDrawing);
  }
  disconnectedCallback(): void {
    window.removeEventListener("beforeunload", this.beforeUnload);
    this.removeEventListener("keydown", this.escapeDrawing);
    super.disconnectedCallback();
    this.generation++;
  }
  private reset(): boolean {
    if (this.hasUnsavedChanges && !window.confirm(this.t("dirty")))
      return false;
    this.layoutDraft = undefined;
    this.dialogOpen = false;
    this.draft = undefined;
    this.selected = "";
    this.layoutDirty = this.draftDirty = false;
    this.drawing = [];
    this.tool = "select";
    this.corner = -1;
    this.message = this.error = "";
    return true;
  }
  private date(value: string): string {
    return formatDate(value, this.language);
  }
  private name(
    id: string,
    table: "plants" | "locations" | "varieties" = "plants",
  ): string {
    return text(
      this.tables[table].find((e) => e.id === id),
      "name",
    );
  }
  private markLayout(draft: Layout): void {
    if (!this.layoutDirty)
      this.layoutBase = this.record ? structuredClone(this.record) : undefined;
    this.layoutDraft = draft;
    this.layoutDirty = true;
  }
  private shapeChange(key: keyof Layout, value: number): void {
    const l = structuredClone(this.layout);
    if (key === "width_cm" || key === "height_cm") {
      const ratio = value / Number(l[key]);
      l.outline = l.outline.map((p) =>
        key === "width_cm" ? [p[0] * ratio, p[1]] : [p[0], p[1] * ratio],
      );
      l.holes = l.holes.map((h) =>
        h.map((p) =>
          key === "width_cm" ? [p[0] * ratio, p[1]] : [p[0], p[1] * ratio],
        ),
      );
      l[key] = value;
    } else if (key === "rotation_years" || key === "neighbor_distance_cm")
      l[key] = value;
    this.markLayout(l);
  }
  private usePreset(kind: string): void {
    this.markLayout({
      ...structuredClone(this.layout),
      outline: preset(kind, this.layout.width_cm, this.layout.height_cm),
      holes: [],
    });
    this.corner = -1;
  }
  private get isDrawing(): boolean {
    return ["outline", "freehand", "hole"].includes(this.tool);
  }
  private cancelDrawing(): void {
    this.drawing = [];
    this.drag = undefined;
    this.tool = "select";
    this.corner = -1;
    this.message = "";
  }
  private escapeDrawing = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && this.isDrawing && !event.defaultPrevented) {
      event.preventDefault();
      event.stopPropagation();
      this.cancelDrawing();
    }
  };
  private drawingGuidance(): TemplateResult | typeof nothing {
    if (!this.editable || !this.isDrawing) return nothing;
    const label =
      this.tool === "freehand"
        ? "freehand"
        : this.tool === "hole"
          ? "hole"
          : "draw";
    const step =
      this.tool === "freehand"
        ? "freehandStep"
        : this.tool === "hole"
          ? "holeStep"
          : "outlineStep";
    return html`<section
      class="drawing-guidance"
      role="region"
      tabindex="-1"
      aria-label=${this.t("drawingActive")}
    >
      <h3 role="status">${this.t("drawingActive")}: ${this.t(label)}</h3>
      <ol>
        <li>${this.t(step)}</li>
        <li><strong>${this.t("applyStep")}</strong></li>
        <li>${this.t("saveDrawingStep")}</li>
      </ol>
      <div class="buttons">
        <button
          class="primary"
          @click=${this.finishDraw}
          ?disabled=${this.drawing.length < 3 || this.busy}
        >
          ${this.t("finish")}</button
        ><button
          @click=${() => {
            this.drawing = this.drawing.slice(0, -1);
          }}
          ?disabled=${!this.drawing.length || this.busy}
        >
          ${this.t("undo")}</button
        ><button @click=${this.cancelDrawing} ?disabled=${this.busy}>
          ${this.t("cancelDrawing")}
        </button>
      </div>
      <p class="muted">${this.t("cancelDrawingHint")}</p>
    </section>`;
  }
  private startDraw(tool: Tool): void {
    if (this.tool === tool) {
      this.cancelDrawing();
      return;
    }
    this.tool = tool;
    this.message = "";
    this.drawing = [];
    this.corner = -1;
    void this.updateComplete.then(() => {
      if (this.tool !== tool || !this.isDrawing) return;
      const guide =
        this.renderRoot.querySelector<HTMLElement>(".drawing-guidance");
      guide?.scrollIntoView({ block: "center" });
      guide?.focus({ preventScroll: true });
    });
  }
  private finishDraw(): void {
    if (
      this.drawing.length > 3 &&
      this.drawing[0]![0] === this.drawing.at(-1)![0] &&
      this.drawing[0]![1] === this.drawing.at(-1)![1]
    )
      this.drawing = this.drawing.slice(0, -1);
    if (this.drawing.length < 3) return;
    const l = structuredClone(this.layout);
    if (this.tool === "hole") l.holes.push(this.drawing);
    else l.outline = this.drawing;
    this.markLayout(l);
    this.tool = "select";
    this.drawing = [];
    this.message = this.t("drawingApplied");
    void this.updateComplete.then(() => {
      if (this.isDrawing || !this.layoutDirty) return;
      const controls =
        this.renderRoot.querySelector<HTMLElement>(".shape-save");
      controls?.scrollIntoView({ block: "center" });
      controls
        ?.querySelector<HTMLButtonElement>("button")
        ?.focus({ preventScroll: true });
    });
  }
  private point(e: PointerEvent): Point {
    const s = this.renderRoot.querySelector<SVGSVGElement>(".map")!;
    const p = s.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const c = p.matrixTransform(s.getScreenCTM()!.inverse());
    return [
      Math.round(Math.max(0, Math.min(this.layout.width_cm, c.x))),
      Math.round(Math.max(0, Math.min(this.layout.height_cm, c.y))),
    ];
  }
  private select(e: Entity, showDialog = true): void {
    if (this.busy || (this.draftDirty && e.id === this.selected)) return;
    if (
      this.draftDirty &&
      e.id !== this.selected &&
      !window.confirm(this.t("dirty"))
    )
      return;
    this.selected = e.id;
    this.editingRecord = structuredClone(e);
    this.draft = structuredClone(plantingData(e));
    this.draftDirty = false;
    this.periodTouched = true;
    this.periodChoice = 0;
    this.dialogReturn = undefined;
    this.dialogOpen = showDialog;
    this.tool = showDialog ? "select" : "place";
  }
  private pointerDown(e: PointerEvent): void {
    if (this.busy) return;
    const p = this.point(e);
    const target = e.target as Element;
    if (this.isDrawing) {
      e.preventDefault();
      this.renderRoot
        .querySelector<HTMLElement>(".drawing-guidance")
        ?.focus({ preventScroll: true });
    }
    const id = target.closest("[data-entry]")?.getAttribute("data-entry");
    if (
      this.placementActive &&
      this.editable &&
      this.tool !== "pan" &&
      this.draft
    ) {
      if (id === (this.selected || "draft")) {
        this.drag = {
          kind: "plant",
          index: 0,
          start: p,
          origin: [this.draft.x_cm, this.draft.y_cm],
        };
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } else {
        this.draft = { ...this.draft, x_cm: p[0], y_cm: p[1] };
        this.draftDirty = true;
      }
      return;
    }
    if (this.tool === "select" && id) {
      const record = this.entries.find((r) => r.id === id);
      if (record) this.select(record, !this.editable);
      if (this.editable && this.draft) {
        this.drag = {
          kind: "plant",
          index: 0,
          start: p,
          origin: [this.draft.x_cm, this.draft.y_cm],
        };
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      }
      return;
    }
    if (!this.editable) return;
    if (this.tool === "place" && this.draft) {
      this.draft = { ...this.draft, x_cm: p[0], y_cm: p[1] };
      this.draftDirty = true;
      this.tool = "select";
      return;
    }
    if (this.tool === "outline" || this.tool === "hole") {
      this.drawing = [...this.drawing, p];
      return;
    }
    if (this.tool === "freehand") {
      this.drawing = [p];
      this.drag = { kind: "freehand", index: 0, start: p, origin: p };
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      return;
    }
    const v = target.closest("[data-vertex]")?.getAttribute("data-vertex");
    if (v !== null && v !== undefined) {
      this.corner = Number(v);
      this.drag = { kind: "corner", index: this.corner, start: p, origin: p };
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    }
  }
  private pointerMove(e: PointerEvent): void {
    if (!this.drag || !this.editable) return;
    const p = this.point(e);
    if (this.drag.kind === "plant" && this.draft) {
      this.draft = {
        ...this.draft,
        x_cm: Math.max(0, this.drag.origin[0] + p[0] - this.drag.start[0]),
        y_cm: Math.max(0, this.drag.origin[1] + p[1] - this.drag.start[1]),
      };
      this.draftDirty = true;
    } else if (this.drag.kind === "corner") {
      const l = structuredClone(this.layout);
      l.outline[this.drag.index] = p;
      this.markLayout(l);
    } else if (this.drawing.length < 256) {
      const last = this.drawing.at(-1)!;
      if (
        Math.hypot(last[0] - p[0], last[1] - p[1]) >=
        Math.max(this.layout.width_cm, this.layout.height_cm) / 60
      )
        this.drawing = [...this.drawing, p];
    }
  }
  private pointerUp(): void {
    this.drag = undefined;
    this.requestUpdate();
  }
  private newPlanting(): void {
    if (!this.record) {
      this.error = this.t("saveBedFirst");
      return;
    }
    if (this.draftDirty && !window.confirm(this.t("dirty"))) return;
    const p = this.tables.plants.find((e) => !e.data.archived);
    if (!p) {
      this.error = this.t("choosePlant");
      return;
    }
    this.selected = "";
    this.editingRecord = undefined;
    this.draft = {
      layout_id: this.record.id,
      plant_id: p.id,
      start_date: "",
      end_date: "",
      x_cm: Math.round(this.layout.width_cm / 2),
      y_cm: Math.round(this.layout.height_cm / 2),
      plant_count: 1,
      columns: 1,
      spacing_cm: Number(p.data.spacing_cm) || 30,
      row_spacing_cm: Number(p.data.row_spacing_cm) || 40,
      state: "planned",
      notes: "",
    };
    this.periodChoice = 0;
    this.periodTouched = false;
    this.dialogReturn = undefined;
    this.dialogOpen = true;
    if (this.suggestions.length === 1) {
      const value = this.suggestions[0]!;
      this.draft = {
        ...this.draft,
        start_date: value.start,
        end_date: value.end,
      };
    }
    this.draftDirty = true;
  }
  private field(key: keyof Planting, value: string | number): void {
    if (!this.draft) return;
    this.draft = {
      ...this.draft,
      [key]: value === "" && key.endsWith("_id") ? null : value,
    };
    if (key === "start_date" || key === "end_date") this.periodTouched = true;
    if (key === "plant_id") {
      const plant = this.tables.plants.find((e) => e.id === value);
      this.draft.variety_id = null;
      this.draft.cultivation_id = null;
      delete this.draft.family_snapshot;
      this.draft.spacing_cm = Number(plant?.data.spacing_cm) || 30;
      this.draft.row_spacing_cm = Number(plant?.data.row_spacing_cm) || 40;
      this.periodChoice = 0;
      if (!this.periodTouched) {
        const options = this.suggestions;
        this.draft = {
          ...this.draft,
          start_date: options.length === 1 ? options[0]!.start : "",
          end_date: options.length === 1 ? options[0]!.end : "",
        };
      }
    }
    if (key === "variety_id") this.draft.cultivation_id = null;
    if (key === "plant_count")
      this.draft.columns = Math.min(this.draft.columns, this.draft.plant_count);
    this.draftDirty = true;
  }
  private async save(
    table: "bed_layouts" | "bed_plantings",
    data: Layout | Planting,
    record?: Entity,
  ): Promise<void> {
    if (!this.api || !this.editable || this.busy) return;
    const api = this.api,
      generation = this.generation;
    this.busy = true;
    this.error = this.message = "";
    try {
      const value = toData(data);
      delete value.family_snapshot;
      const result = await api.command<Entity>(
        record ? "update" : "create",
        record
          ? { table, id: record.id, revision: record.revision, data: value }
          : { table, data: value },
      );
      if (generation !== this.generation || !this.editable) return;
      this.tables = {
        ...this.tables,
        [table]: [
          ...this.tables[table].filter((e) => e.id !== result.id),
          result,
        ],
      };
      if (table === "bed_layouts") {
        this.layoutDraft = undefined;
        this.layoutDirty = false;
      } else {
        this.draft = undefined;
        this.dialogOpen = false;
        this.selected = "";
        this.draftDirty = false;
      }
      this.message = this.t("saved");
      this.dispatchEvent(
        new CustomEvent("planner-changed", { bubbles: true, composed: true }),
      );
    } catch (error) {
      if (generation === this.generation)
        this.error = this.t("error") + " " + errorText(this.language, error);
    } finally {
      if (generation === this.generation) this.busy = false;
    }
  }
  private savePlanting(): void {
    if (!this.draft) return;
    if (!centers(this.draft).every((p) => usable(p, this.layout))) {
      this.error = this.t("outside");
      return;
    }
    void this.save("bed_plantings", this.draft, this.editingRecord);
  }
  private async removePlanting(): Promise<void> {
    const record = this.editingRecord;
    if (
      !record ||
      !this.api ||
      this.busy ||
      !this.editable ||
      !window.confirm(this.t("confirmRemove"))
    )
      return;
    const api = this.api,
      generation = this.generation;
    this.busy = true;
    try {
      await api.command("delete", {
        table: "bed_plantings",
        id: record.id,
        revision: record.revision,
      });
      if (generation !== this.generation) return;
      this.tables = {
        ...this.tables,
        bed_plantings: this.tables.bed_plantings.filter(
          (e) => e.id !== record.id,
        ),
      };
      this.draft = undefined;
      this.dialogOpen = false;
      this.selected = "";
      this.draftDirty = false;
      this.dispatchEvent(
        new CustomEvent("planner-changed", { bubbles: true, composed: true }),
      );
    } catch (e) {
      if (generation === this.generation)
        this.error = errorText(this.language, e);
    } finally {
      if (generation === this.generation) this.busy = false;
    }
  }
  private async deleteLayout(): Promise<void> {
    const record = this.record;
    if (
      !record ||
      this.entries.length ||
      !this.api ||
      !this.editable ||
      this.busy ||
      !window.confirm(this.t("confirmLayout"))
    )
      return;
    const api = this.api,
      generation = this.generation;
    this.busy = true;
    try {
      await api.command("delete", {
        table: "bed_layouts",
        id: record.id,
        revision: record.revision,
      });
      if (generation !== this.generation) return;
      this.tables = {
        ...this.tables,
        bed_layouts: this.tables.bed_layouts.filter((e) => e.id !== record.id),
      };
      this.layoutDraft = undefined;
      this.layoutDirty = false;
      this.dispatchEvent(
        new CustomEvent("planner-changed", { bubbles: true, composed: true }),
      );
    } catch (error) {
      if (generation === this.generation)
        this.error = errorText(this.language, error);
    } finally {
      if (generation === this.generation) this.busy = false;
    }
  }
  private drawEntries(): Entity[] {
    const entries = this.displayed.filter(
      (e) => e.id !== this.selected || !this.placementActive,
    );
    if (
      this.placementActive &&
      this.draft &&
      (!this.month || this.inMonth(this.draft, this.month))
    )
      entries.push({
        id: this.selected || "draft",
        revision: 1,
        created_at: "",
        updated_at: "",
        data: toData(this.draft),
      });
    return entries;
  }
  private map(): TemplateResult {
    const l = this.layout;
    const entries = this.drawEntries();
    const shown = new Set(entries.map((e) => e.id));
    const relations = this.planningWarnings().filter(
      (w) =>
        (w.kind === "good" || w.kind === "bad") &&
        w.ids.every((id) => shown.has(id)) &&
        (!this.placementActive || w.ids.includes(this.selected || "draft")),
    );
    const pad = Math.max(l.width_cm, l.height_cm) * 0.055;
    const radius = Math.max(l.width_cm, l.height_cm) / 65;
    const ticks = Array.from({ length: 7 }, (_, i) => i / 6);
    return html`<div class="viewport">
      <svg
        class="map ${this.editable && this.tool !== "pan" ? "drawing" : ""}"
        style=${`width:${this.zoom * 100}%;min-width:${320 * this.zoom}px`}
        viewBox=${`${-pad} ${-pad} ${l.width_cm + 2 * pad} ${l.height_cm + 2 * pad}`}
        aria-label=${this.t("scale")}
        @pointerdown=${this.pointerDown}
        @pointermove=${this.pointerMove}
        @pointerup=${this.pointerUp}
        @pointercancel=${this.pointerUp}
      >
        <defs>
          <pattern
            id="bed-grid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M10 0H0V10"
              fill="none"
              stroke="var(--divider-color,#d0d9cc)"
              stroke-width=".4"
            />
          </pattern>
        </defs>
        <rect
          x="0"
          y="0"
          width=${l.width_cm}
          height=${l.height_cm}
          fill="url(#bed-grid)"
        />
        <path
          d=${path(l)}
          fill="var(--gp-accent,#3e8254)"
          fill-opacity=".14"
          fill-rule="evenodd"
          stroke="var(--gp-accent,#3e8254)"
          stroke-width="2"
          vector-effect="non-scaling-stroke"
        />
        ${ticks.map((v) => svg`<text x=${v * l.width_cm} y=${-pad / 3} text-anchor="middle" font-size=${pad * 0.3}>${Math.round(v * l.width_cm)}</text><text x=${-pad / 3} y=${v * l.height_cm} text-anchor="end" font-size=${pad * 0.3}>${Math.round(v * l.height_cm)}</text>`)}
        ${relations.map((w) => {
          const a = plantingData(entries.find((e) => e.id === w.ids[0])!),
            b = plantingData(entries.find((e) => e.id === w.ids[1])!);
          return svg`<line x1=${a.x_cm} y1=${a.y_cm} x2=${b.x_cm} y2=${b.y_cm} stroke=${w.kind === "good" ? "#32834b" : "#c04437"} stroke-width="2" stroke-dasharray="5 3" vector-effect="non-scaling-stroke" pointer-events="none"><title>${this.t(w.kind === "good" ? "good" : "bad")}: ${w.detail}</title></line>`;
        })}
        ${entries.map((e) => {
          const p = plantingData(e),
            color = `hsl(${(this.tables.plants.findIndex((x) => x.id === p.plant_id) * 47) % 360} 45% 42%)`;
          const related = relations.filter((w) => w.ids.includes(e.id));
          const status = related.some((w) => w.kind === "bad")
            ? "bad"
            : related.some((w) => w.kind === "good")
              ? "good"
              : "unknown";
          const neighborColor =
            status === "bad"
              ? "#c04437"
              : status === "good"
                ? "#32834b"
                : color;
          return svg`<g data-neighbor-status=${status} data-entry=${e.id} tabindex="0" role="button" aria-label=${`${this.name(p.plant_id)} · ${p.plant_count} · ${this.date(p.start_date)} – ${this.date(p.end_date)}`} @keydown=${(
            ev: KeyboardEvent,
          ) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              const original = this.entries.find((x) => x.id === e.id);
              if (original) this.select(original);
            }
          }} style="cursor:grab"><title>${this.name(p.plant_id)} · ${this.date(p.start_date)} – ${this.date(p.end_date)} · ${p.notes ?? ""}</title><rect x=${p.x_cm - radius * 3} y=${p.y_cm - radius * 3} width=${(Math.min(p.columns, p.plant_count) - 1) * p.spacing_cm + radius * 6} height=${(Math.ceil(p.plant_count / p.columns) - 1) * p.row_spacing_cm + radius * 6} fill="transparent"/>${centers(p).map(([x, y]) => svg`${this.showSpacing ? svg`<ellipse cx=${x} cy=${y} rx=${p.spacing_cm / 2} ry=${p.row_spacing_cm / 2} fill=${color} fill-opacity=".12" stroke=${neighborColor} stroke-opacity=${status === "unknown" ? ".45" : "1"} stroke-dasharray=${p.state === "planned" ? "3 3" : "none"} stroke-width="1" vector-effect="non-scaling-stroke"/>` : nothing}<circle cx=${x} cy=${y} r=${radius * 0.65} fill=${neighborColor} stroke=${neighborColor} stroke-width="2" vector-effect="non-scaling-stroke"/>`)}<text x=${p.x_cm} y=${p.y_cm - radius * 1.5} font-size=${radius * 1.2} fill="var(--primary-text-color,#222)">${this.name(p.plant_id)} (${p.plant_count})${status === "bad" ? " ✕" : status === "good" ? " ✓" : ""}</text></g>`;
        })}
        ${this.editable && this.tool === "select" && !this.placementActive ? l.outline.map(([x, y], i) => svg`<circle data-vertex=${i} cx=${x} cy=${y} r=${radius * 0.65} fill=${i === this.corner ? "#efaa30" : "white"} stroke="#3e8254" stroke-width="2" vector-effect="non-scaling-stroke"><title>${this.t("selectedCorner")} ${i + 1}</title></circle>`) : nothing}
        ${this.drawing.length ? svg`<polyline points=${this.drawing.map((p) => p.join(",")).join(" ")} fill="none" stroke="#cf792b" stroke-width="3" vector-effect="non-scaling-stroke"/>${this.drawing.map(([x, y]) => svg`<circle cx=${x} cy=${y} r=${radius / 2} fill="#cf792b"/>`)}` : nothing}
      </svg>
    </div>`;
  }
  private number(
    label: keyof typeof de,
    value: number,
    change: (n: number) => void,
    min = 0,
    max = 10000,
  ): TemplateResult {
    return html`<label
      >${this.t(label)}<input
        type="number"
        min=${min}
        max=${max}
        step="1"
        .value=${String(value)}
        ?disabled=${!this.editable || this.busy || this.isDrawing}
        @change=${(e: Event) => {
          const input = e.target as HTMLInputElement;
          const n = Number(input.value);
          if (input.value !== "" && Number.isFinite(n) && n >= min && n <= max)
            change(n);
          else input.reportValidity();
        }}
    /></label>`;
  }
  private plantReference(): TemplateResult | typeof nothing {
    const p = this.draft;
    if (!p) return nothing;
    const plant = this.tables.plants.find((e) => e.id === p.plant_id);
    if (!plant) return nothing;
    const windows = this.tables.growing_windows.filter(
      (e) => e.data.plant_id === p.plant_id,
    );
    const months = Array.from({ length: 12 }, (_, i) =>
      new Intl.DateTimeFormat(this.language, {
        month: "short",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(this.year, i, 1))),
    );
    return html`<details class="plant-reference">
      <summary>${this.t("plantReference")}</summary>
      ${text(plant, "image_data") ? html`<img src=${text(plant, "image_data")} alt=${text(plant, "name")} />` : nothing}
      <h4>${text(plant, "name")}</h4>
      <p class="muted">
        ${text(plant, "botanical_name")} ·
        ${text(plant, "family") || this.t("unknown")}
      </p>
      <p>
        ${this.t("spacing")}: ${plant.data.spacing_cm ?? "—"} ·
        ${this.t("rows")}: ${plant.data.row_spacing_cm ?? "—"}
      </p>
      ${text(plant, "description") ? html`<p>${text(plant, "description")}</p>` : nothing}
      <dl class="plant-facts">
        ${[
          "germination_optimal_min_c",
          "germination_optimal_max_c",
          "germination_days_min",
          "germination_days_max",
          "depth_cm",
          "duration_days_min",
          "duration_days_max",
          "light",
          "water",
          "frost",
          "care",
        ]
          .filter((key) => text(plant, key))
          .map(
            (key) =>
              html`<div>
                <dt>${label(this.language, key)}</dt>
                <dd>${text(plant, key)}</dd>
              </div>`,
          )}
      </dl>
      <div class="mini-year">${months.map((m) => html`<span>${m}</span>`)}</div>
      ${
        windows.length
          ? windows.map(
              (w) =>
                html`<div class="plant-period">
                  <strong>${label(this.language, text(w, "activity"))}</strong>
                  · ${windowLabel(w, this.language)}
                  <div class="mini-year">
                    ${months.map((m, i) => html`<span class=${activeInMonth(w, this.year, i + 1) ? "active" : ""} title=${`${m} · ${windowLabel(w, this.language)}`}></span>`)}
                  </div>
                  ${text(w, "notes") ? html`<small>${text(w, "notes")}</small>` : nothing}
                </div>`,
            )
          : html`<p>${this.t("noPlantPeriods")}</p>`
      }
    </details>`;
  }
  private periodSuggestions(): TemplateResult {
    const choices = this.suggestions;
    return html`<section class="period-suggestions">
      <strong>${this.t("periodProposal")}</strong>
      <p>
        ${this.t(choices.length === 0 ? "periodMissing" : choices.length > 1 ? "periodAmbiguous" : "periodHint")}
      </p>
      ${
        choices.length
          ? html`<label
                >${this.t("periodChoice")}<select
                  aria-label=${this.t("periodChoice")}
                  .value=${String(this.periodChoice)}
                  ?disabled=${!this.editable || this.busy}
                  @change=${(e: Event) => {
                    this.periodChoice = Number(
                      (e.target as HTMLSelectElement).value,
                    );
                  }}
                >
                  ${choices.map((c, i) => html`<option value=${i}>${c.activities.map((a) => label(this.language, a)).join(" / ")} · ${this.date(c.start)} – ${this.date(c.end)}</option>`)}
                </select></label
              ><button
                type="button"
                @click=${() => this.applyPeriod()}
                ?disabled=${!this.editable || this.busy}
              >
                ${this.t("usePeriod")}
              </button>`
          : nothing
      }
    </section>`;
  }
  private editor(): TemplateResult {
    const p = this.draft;
    return html`<dialog
      id="bed-planting-dialog"
      aria-labelledby="bed-planting-title"
      @cancel=${(e: Event) => {
        e.preventDefault();
        this.cancelEditor();
      }}
    >
      ${
        this.dialogOpen && p
          ? html`<section class="editor">
              <header class="editor-header">
                <h3 id="bed-planting-title">${this.t("configure")}</h3>
                <button
                  aria-label=${this.t("closeDialog")}
                  @click=${this.cancelEditor}
                  ?disabled=${this.busy}
                >
                  ×
                </button>
              </header>
              <div class="editor-body">
                ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : nothing}
                <div class="fields">
                  <label
                    >${this.t("plant")}<select
                      aria-label=${this.t("plant")}
                      .value=${live(p.plant_id)}
                      ?disabled=${!this.editable || this.busy}
                      @change=${(e: Event) => this.field("plant_id", (e.target as HTMLSelectElement).value)}
                    >
                      ${this.tables.plants.filter((e) => !e.data.archived || e.id === p.plant_id).map((e) => html`<option value=${e.id}>${text(e, "name")}</option>`)}
                    </select></label
                  >
                  <label
                    >${this.t("variety")}<select
                      aria-label=${this.t("variety")}
                      .value=${live(p.variety_id ?? "")}
                      ?disabled=${!this.editable || this.busy}
                      @change=${(e: Event) => this.field("variety_id", (e.target as HTMLSelectElement).value)}
                    >
                      <option value="">${this.t("none")}</option>
                      ${this.tables.varieties.filter((e) => e.data.plant_id === p.plant_id).map((e) => html`<option value=${e.id}>${text(e, "name")}</option>`)}
                    </select></label
                  >
                  ${this.number("count", p.plant_count, (n) => this.field("plant_count", n), 1, 200)}${this.number("columns", p.columns, (n) => this.field("columns", n), 1, p.plant_count)}
                </div>
                ${this.periodSuggestions()}
                <div class="fields">
                  ${(
                    [
                      ["start", "start_date"],
                      ["end", "end_date"],
                    ] as const
                  ).map(
                    ([name, key]) =>
                      html`<label
                        >${this.t(name)}<input
                          type="date"
                          required
                          .value=${live(p[key])}
                          ?disabled=${!this.editable || this.busy}
                          @change=${(e: Event) => this.field(key, (e.target as HTMLInputElement).value)}
                      /></label>`,
                  )}
                </div>
                ${this.plantReference()}
                <details class="advanced-fields">
                  <summary>${this.t("advanced")}</summary>
                  <div class="fields">
                    ${this.number("spacing", p.spacing_cm, (n) => this.field("spacing_cm", n), 1, 1000)}${this.number("rows", p.row_spacing_cm, (n) => this.field("row_spacing_cm", n), 1, 1000)}${this.number("x", p.x_cm, (n) => this.field("x_cm", n))}${this.number("y", p.y_cm, (n) => this.field("y_cm", n))}
                    <label
                      >${this.t("state")}<select
                        aria-label=${this.t("state")}
                        .value=${live(p.state)}
                        ?disabled=${!this.editable || this.busy}
                        @change=${(e: Event) => this.field("state", (e.target as HTMLSelectElement).value)}
                      >
                        ${(["planned", "planted", "completed"] as const).map((v) => html`<option value=${v}>${this.t(v)}</option>`)}
                      </select></label
                    >
                    <label
                      >${this.t("cultivation")}<select
                        aria-label=${this.t("cultivation")}
                        .value=${live(p.cultivation_id ?? "")}
                        ?disabled=${!this.editable || this.busy}
                        @change=${(e: Event) => this.field("cultivation_id", (e.target as HTMLSelectElement).value)}
                      >
                        <option value="">${this.t("none")}</option>
                        ${this.tables.cultivations.filter((e) => e.data.plant_id === p.plant_id && (e.data.variety_id ?? "") === (p.variety_id ?? "") && e.data.location_id === this.bed).map((e) => html`<option value=${e.id}>${text(e, "date")} · ${this.name(p.plant_id)}</option>`)}
                      </select></label
                    >
                  </div>
                </details>
                <label
                  >${this.t("notes")}<textarea
                    maxlength="20000"
                    .value=${p.notes ?? ""}
                    ?disabled=${!this.editable || this.busy}
                    @input=${(e: Event) => this.field("notes", (e.target as HTMLTextAreaElement).value)}
                  ></textarea>
                </label>
              </div>
              <footer class="editor-footer">
                ${this.selected && this.editable ? html`<button class="danger" @click=${this.removePlanting} ?disabled=${this.busy}>${this.t("remove")}</button>` : nothing}<button
                  @click=${this.cancelEditor}
                  ?disabled=${this.busy}
                >
                  ${this.t("cancel")}</button
                >${this.editable ? html`<button class="primary" @click=${this.beginPlacement} ?disabled=${this.busy}>${this.t("placeContinue")} →</button>` : nothing}
              </footer>
            </section>`
          : nothing
      }
    </dialog>`;
  }
  private neighborFeedback(): TemplateResult {
    const shown = new Set(this.drawEntries().map((e) => e.id));
    const id = this.selected || "draft";
    const relevant = this.planningWarnings().filter(
      (w) =>
        (w.kind === "good" || w.kind === "bad") &&
        w.ids.every((v) => shown.has(v)) &&
        (!this.placementActive || w.ids.includes(id)),
    );
    const good = relevant.filter((w) => w.kind === "good"),
      bad = relevant.filter((w) => w.kind === "bad");
    return html`<div
      class=${`neighbor-feedback ${bad.length ? "has-bad" : good.length ? "has-good" : ""}`}
      role="status"
      aria-label=${this.t("neighborsNow")}
    >
      ${bad.length ? html`<p class="warning"><strong>✕ ${this.t("knownBad")}:</strong> ${bad.map((w) => w.detail).join("; ")}</p>` : nothing}
      ${good.length ? html`<p class="good"><strong>✓ ${this.t("knownGood")}:</strong> ${good.map((w) => w.detail).join("; ")}</p>` : nothing}
      ${!bad.length && !good.length ? html`<p class="muted">${this.t("unknownNeighbors")}</p>` : nothing}
    </div>`;
  }
  private placementControls(): TemplateResult | typeof nothing {
    const p = this.draft;
    if (!this.placementActive || !p) return nothing;
    return html`<section
      class="placement-controls"
      aria-label=${this.t("placeStep")}
    >
      <strong
        >${this.name(p.plant_id)} · ${p.plant_count} ·
        ${this.date(p.start_date)} – ${this.date(p.end_date)}</strong
      ><small>${this.t("placeHelp")}</small
      >${this.neighborFeedback()}${!centers(p).every((point) => usable(point, this.layout)) ? html`<p class="warning">${this.t("outside")}</p>` : nothing}
      <div class="buttons">
        <button
          aria-label=${this.t("changeDetails")}
          title=${this.t("changeDetails")}
          @click=${this.openEditor}
          ?disabled=${this.busy}
        >
          ✎</button
        ><button
          class="primary"
          @click=${this.savePlanting}
          ?disabled=${this.busy || this.layoutDirty}
        >
          ${this.t("save")}</button
        ><button
          aria-label=${this.t("cancel")}
          title=${this.t("cancel")}
          @click=${this.cancelPlacement}
          ?disabled=${this.busy}
        >
          ×
        </button>
      </div>
    </section>`;
  }

  private warningList(): TemplateResult {
    let entries = this.entries;
    if (this.draft)
      entries = [
        ...entries.filter((e) => e.id !== this.selected),
        {
          id: this.selected || "draft",
          revision: 1,
          created_at: "",
          updated_at: "",
          data: toData(this.draft),
        },
      ];
    const list = this.drag
      ? []
      : this.planningWarnings().filter((w) =>
          w.ids.some((id) =>
            entries.some((e) => e.id === id && this.inYear(e)),
          ),
        );
    const keys: Record<PlanWarning["kind"], keyof typeof de> = {
      outside: "outside",
      spacing: "spacingWarning",
      overlap: "overlapWarning",
      good: "good",
      bad: "bad",
      rotation: "rotation",
      unknownFamily: "unknownFamily",
    };
    return html`<section class="box">
      <h3>${this.t("hints")}</h3>
      <p class="muted">${this.t("hintHelp")}</p>
      ${
        list.length
          ? html`<ul class="warnings">
              ${list.slice(0, 100).map((w) => html`<li class=${w.kind === "good" ? "good" : w.kind === "unknownFamily" ? "muted" : "warning"}><strong>${this.t(keys[w.kind])}</strong>: ${w.detail.replace(/\d{4}-\d{2}-\d{2}/g, (value) => this.date(value))}</li>`)}
            </ul>`
          : html`<p>${this.t("noWarnings")}</p>`
      }${this.historyWarnings()}
    </section>`;
  }
  private historyWarnings(): TemplateResult {
    const knownLinks = new Set(
      this.entries
        .filter((e) => e.data.state !== "planned")
        .map((e) => e.data.cultivation_id),
    );
    const history = this.tables.cultivations.filter(
      (e) =>
        e.data.location_id === this.bed &&
        e.data.initial_status !== "planned" &&
        !knownLinks.has(e.id),
    );
    const hints: string[] = [];
    let unknown = false;
    for (const c of history) {
      const snapshot = c.data.snapshot as
        { plant?: { family?: string } } | undefined;
      const fam = String(snapshot?.plant?.family ?? "")
        .trim()
        .toLowerCase();
      if (!fam) {
        unknown = true;
        continue;
      }
      const events = this.tables.cultivation_events
        .filter((e) => e.data.cultivation_id === c.id)
        .sort((a, b) => text(a, "date").localeCompare(text(b, "date")));
      const end = events
        .filter((e) => ["completed", "failed"].includes(text(e, "status")))
        .at(-1);
      const endDate = end ? text(end, "date") : this.today;
      const until = new Date(endDate + "T12:00:00Z");
      until.setUTCFullYear(until.getUTCFullYear() + this.layout.rotation_years);
      for (const e of this.season) {
        const p = plantingData(e);
        const family = String(
          p.state === "planned"
            ? (this.tables.plants.find((e) => e.id === p.plant_id)?.data
                .family ?? "")
            : (p.family_snapshot ?? ""),
        )
          .trim()
          .toLowerCase();
        if (
          family === fam &&
          p.start_date >= endDate &&
          p.start_date < until.toISOString().slice(0, 10)
        )
          hints.push(
            `${this.name(p.plant_id)} · ${fam} · ${text(c, "date")} – ${endDate}`,
          );
      }
    }
    return html`${
      hints.length
        ? html`<h4>${this.t("rotationHistory")}</h4>
            <ul>
              ${hints.slice(0, 40).map((s) => html`<li class="warning">${this.t("rotation")}: ${s}</li>`)}
            </ul>`
        : nothing
    }${unknown ? html`<p class="muted">${this.t("historyUnknown")}</p>` : nothing}`;
  }
  protected render(): TemplateResult {
    if (!this.tables.locations.length)
      return html`<p class="box">${this.t("newBed")}</p>`;
    const l = this.layout;
    const months = Array.from({ length: 12 }, (_, i) =>
      new Intl.DateTimeFormat(this.language, {
        month: "short",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(this.year, i, 1))),
    );
    const allSeason = this.tables.bed_plantings.filter((e) => this.inYear(e));
    const needs = seedNeeds(allSeason, this.tables);
    return html`<div class="controls">
        <label
          >${this.t("bed")}<select
            aria-label=${this.t("bed")}
            .value=${live(this.bed)}
            ?disabled=${this.busy}
            @change=${(e: Event) => {
              const next = (e.target as HTMLSelectElement).value;
              if (this.reset()) this.bed = next;
              else this.requestUpdate();
            }}
          >
            ${this.tables.locations.filter((e) => !e.data.archived || e.id === this.bed).map((e) => html`<option value=${e.id}>${text(e, "name")}</option>`)}
          </select></label
        ><label
          >${this.t("year")}<input
            type="number"
            min="1900"
            max="9998"
            .value=${live(String(this.year))}
            ?disabled=${this.busy}
            @change=${(e: Event) => {
              const n = Number((e.target as HTMLInputElement).value);
              if (n >= 1900 && n <= 9998 && this.reset()) this.year = n;
            }} /></label
        ><label
          >${this.t("month")}<select
            aria-label=${this.t("month")}
            .value=${String(this.month)}
            @change=${(e: Event) => {
              this.month = Number((e.target as HTMLSelectElement).value);
            }}
          >
            <option value="0">${this.t("allYear")}</option>
            ${months.map((m, i) => html`<option value=${i + 1}>${m}</option>`)}
          </select></label
        >
      </div>
      <p class="muted">${this.t("shortHelp")}</p>
      ${!this.editable ? html`<p class="box">${this.t("readOnly")}</p>` : nothing}${this.error && !this.dialogOpen ? html`<p class="error" role="alert">${this.error}</p>` : nothing}${this.message || this.busy ? html`<p role="status">${this.busy ? this.t("saving") : this.message}</p>` : nothing}
      <div class="workspace">
        <section class="box canvas">
          <div class="toolbar">
            ${this.editable && !this.placementActive ? html`<button class="primary" @click=${this.newPlanting} ?disabled=${!this.record || this.busy || this.layoutDirty || this.isDrawing}>＋ ${this.t("add")}</button>` : nothing}
            <strong>${this.name(this.bed, "locations")}</strong
            ><span
              >${this.t("area")}:
              ${((area(l.outline) - l.holes.reduce((s, h) => s + area(h), 0)) / 10000).toLocaleString(this.language, { maximumFractionDigits: 2 })}
              m²</span
            ><label
              >${this.t("zoom")}<input
                aria-label=${this.t("zoom")}
                type="range"
                min="0.5"
                max="3"
                step="0.25"
                .value=${String(this.zoom)}
                @input=${(e: Event) => {
                  this.zoom = Number((e.target as HTMLInputElement).value);
                }}
            /></label>
          </div>
          ${
            this.editable
              ? html`<button
                  @click=${() => {
                    this.tool = this.tool === "pan" ? "select" : "pan";
                  }}
                  aria-pressed=${this.tool === "pan"}
                  ?disabled=${this.isDrawing || this.busy}
                >
                  ${this.t("pan")}
                </button>`
              : nothing
          }${this.drawingGuidance()}
          ${this.editable && !this.isDrawing ? html`<div class="shape-save"><button class="primary" @click=${() => this.save("bed_layouts", l, this.layoutDraft ? this.layoutBase : this.record)} ?disabled=${this.busy || this.draftDirty || (!this.layoutDirty && !!this.record)}>${this.t("saveShape")}</button>${this.layoutDirty ? html`<span role="status">${this.t("unsavedShape")}</span>` : nothing}</div>` : nothing}
          ${this.map()} ${this.placementControls()}
          <p class="neighbor-legend">${this.t("neighborLegend")}</p>
          ${!this.placementActive ? this.neighborFeedback() : nothing}
          <p class="muted">
            ${this.t(this.tool === "select" ? "moveHint" : "drawHint")}
          </p>
          <label class="check"
            ><input
              type="checkbox"
              .checked=${this.showSpacing}
              @change=${(e: Event) => {
                this.showSpacing = (e.target as HTMLInputElement).checked;
              }}
            />${this.t("showSpacing")}</label
          >
          ${
            this.editable
              ? html`<details>
                  <summary>${this.t("shape")}</summary>
                  <div class="fields">
                    ${this.number("width", l.width_cm, (n) => this.shapeChange("width_cm", n), 20)}${this.number("height", l.height_cm, (n) => this.shapeChange("height_cm", n), 20)}${this.number("years", l.rotation_years, (n) => this.shapeChange("rotation_years", n), 1, 10)}${this.number("distance", l.neighbor_distance_cm, (n) => this.shapeChange("neighbor_distance_cm", n), 10, 1000)}
                  </div>
                  <div class="buttons">
                    ${(["rectangle", "circle", "triangle", "u"] as const).map((kind) => html`<button @click=${() => this.usePreset(kind)} ?disabled=${this.busy || this.isDrawing}>${this.t(kind)}</button>`)}<button
                      @click=${() => this.startDraw("outline")}
                      aria-pressed=${this.tool === "outline"}
                      ?disabled=${this.busy}
                    >
                      ${this.t("draw")}</button
                    ><button
                      @click=${() => this.startDraw("freehand")}
                      aria-pressed=${this.tool === "freehand"}
                      ?disabled=${this.busy}
                    >
                      ${this.t("freehand")}</button
                    ><button
                      @click=${() => this.startDraw("hole")}
                      aria-pressed=${this.tool === "hole"}
                      ?disabled=${this.busy}
                    >
                      ${this.t("hole")}</button
                    ><button
                      @click=${() => {
                        this.markLayout({ ...structuredClone(l), holes: [] });
                      }}
                      ?disabled=${!l.holes.length || this.busy}
                    >
                      ${this.t("clearHoles")}
                    </button>
                  </div>
                  ${
                    this.corner >= 0 && l.outline[this.corner]
                      ? html`<div class="fields">
                            ${this.number(
                              "cornerX",
                              l.outline[this.corner]![0],
                              (n) => {
                                const d = structuredClone(l);
                                d.outline[this.corner]![0] = n;
                                this.markLayout(d);
                              },
                            )}${this.number(
                              "cornerY",
                              l.outline[this.corner]![1],
                              (n) => {
                                const d = structuredClone(l);
                                d.outline[this.corner]![1] = n;
                                this.markLayout(d);
                              },
                            )}
                          </div>
                          <button
                            ?disabled=${l.outline.length <= 3 || this.busy}
                            @click=${() => {
                              const d = structuredClone(l);
                              d.outline.splice(this.corner, 1);
                              this.markLayout(d);
                              this.corner = -1;
                            }}
                          >
                            ${this.t("deleteCorner")}
                          </button>`
                      : nothing
                  }
                  ${this.record && !this.entries.length ? html`<button class="danger" @click=${this.deleteLayout} ?disabled=${this.busy}>${this.t("deleteLayout")}</button>` : nothing}
                </details> `
              : nothing
          }${!this.record ? html`<p class="muted">${this.t("newPlan")}</p>` : nothing}
        </section>
      </div>
      <section class="box">
        <h3>${this.t("timeline")} · ${this.year}</h3>
        ${
          this.season.length
            ? html`<div class="timeline-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>${this.t("plant")}</th>
                      ${months.map(
                        (m, i) =>
                          html`<th>
                            <button
                              @click=${() => {
                                this.month = this.month === i + 1 ? 0 : i + 1;
                              }}
                              aria-pressed=${this.month === i + 1}
                            >
                              ${m}
                            </button>
                          </th>`,
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    ${this.season.map((e) => {
                      const p = plantingData(e);
                      return html`<tr>
                        <th>
                          <button @click=${() => this.select(e)}>
                            ${this.name(p.plant_id)} (${p.plant_count})</button
                          ><small
                            >${this.date(p.start_date)} –
                            ${this.date(p.end_date)}<br />${this.t(p.state)}</small
                          >
                        </th>
                        ${months.map((_, i) => html`<td><button aria-label=${`${this.name(p.plant_id)} · ${months[i]}`} class=${this.inMonth(p, i + 1) ? "bar" : "blank"} @click=${() => this.select(e)} title=${p.notes ?? ""}>${this.inMonth(p, i + 1) ? "●" : "·"}</button></td>`)}
                      </tr>`;
                    })}
                  </tbody>
                </table>
              </div>`
            : html`<p>${this.t("empty")}</p>`
        }
      </section>
      ${this.warningList()}
      <section class="box">
        <h3>${this.t("seedTitle")}</h3>
        <p class="muted">${this.t("seedHelp")}</p>
        <div class="timeline-scroll">
          <table>
            <thead>
              <tr>
                <th>${this.t("plant")}</th>
                <th>${this.t("variety")}</th>
                <th>${this.t("need")}</th>
                <th>${this.t("stock")}</th>
                <th>${this.t("state")}</th>
              </tr>
            </thead>
            <tbody>
              ${needs.map(
                (n) =>
                  html`<tr>
                    <th>${this.name(n.plant_id)}</th>
                    <td>${this.name(n.variety_id, "varieties") || "—"}</td>
                    <td>${n.count}</td>
                    <td>${n.seeds ?? this.t("unknown")}</td>
                    <td class=${n.buy ? "warning" : ""}>
                      ${this.t(n.buy ? "buy" : "enough")}
                    </td>
                  </tr>`,
              )}
            </tbody>
          </table>
        </div>
      </section>
      ${this.editor()}`;
  }
  static styles = css`
    :host {
      display: block;
      color: var(--primary-text-color, #263c2c);
      font: inherit;
      --bed-line: var(--divider-color, #dce3d9);
    }
    * {
      box-sizing: border-box;
    }
    button,
    input,
    select,
    textarea {
      font: inherit;
      color: inherit;
      max-width: 100%;
      border: 1px solid var(--bed-line);
      background: var(--card-background-color, #fff);
      border-radius: 10px;
    }
    button {
      min-height: 42px;
      padding: 8px 12px;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .primary {
      background: var(--gp-accent, #326c49);
      color: white;
    }
    .danger,
    .error {
      color: var(--error-color, #bd4141);
    }
    input,
    select,
    textarea {
      width: 100%;
      padding: 10px;
      min-height: 44px;
      min-width: 0;
    }
    select {
      appearance: none;
      height: 44px;
      padding-right: 32px;
      background-image:
        linear-gradient(45deg, transparent 50%, currentColor 50%),
        linear-gradient(135deg, currentColor 50%, transparent 50%);
      background-position:
        calc(100% - 17px) 50%,
        calc(100% - 12px) 50%;
      background-size: 5px 5px;
      background-repeat: no-repeat;
    }
    input[type="date"] {
      appearance: none;
      min-width: 0;
      text-align: left;
    }
    label {
      display: grid;
      gap: 7px;
      font-weight: 600;
      min-width: 0;
    }
    small,
    .muted {
      font-weight: 400;
      color: var(--secondary-text-color, #69766b);
      line-height: 1.5;
    }
    small {
      display: block;
    }
    .controls {
      display: grid;
      grid-template-columns: minmax(180px, 2fr) minmax(100px, 1fr) minmax(
          140px,
          1fr
        );
      gap: 12px;
    }
    dialog {
      width: min(720px, calc(100vw - 24px));
      max-width: calc(100vw - 24px);
      max-height: calc(100dvh - 24px);
      padding: 0;
      border: 1px solid var(--bed-line);
      border-radius: 20px;
      background: var(--card-background-color, #fff);
      color: inherit;
    }
    dialog::backdrop {
      background: rgb(0 0 0 / 0.45);
    }
    .editor {
      display: flex;
      flex-direction: column;
      max-height: calc(100dvh - 30px);
      margin: 0;
      padding: 0;
      border: 0;
    }
    .editor-header,
    .editor-footer {
      flex: 0 0 auto;
      padding: 14px 18px;
      background: var(--card-background-color, #fff);
    }
    .editor-header {
      border-bottom: 1px solid var(--bed-line);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .editor-header h3 {
      margin: 0;
    }
    .editor-body {
      overflow: auto;
      overflow-wrap: anywhere;
      padding: 0 18px 14px;
      min-height: 0;
    }
    .editor-footer {
      border-top: 1px solid var(--bed-line);
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      flex-wrap: wrap;
    }
    .plant-facts {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      font-size: 13px;
    }
    .plant-facts dt {
      color: var(--secondary-text-color, #68776a);
    }
    .plant-facts dd {
      margin: 2px 0;
    }
    .plant-reference {
      border: 1px solid var(--bed-line);
      padding: 10px;
      border-radius: 12px;
    }
    .plant-reference img {
      width: 64px;
      height: 64px;
      object-fit: cover;
      border-radius: 12px;
      float: left;
      margin-right: 12px;
    }
    .mini-year {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 2px;
      margin: 6px 0;
    }
    .mini-year span {
      text-align: center;
      font-size: 11px;
      min-height: 16px;
    }
    .mini-year .active {
      background: var(--gp-accent, #326c49);
      border-radius: 3px;
    }
    .period-suggestions {
      background: var(
        --secondary-background-color,
        var(--card-background-color, #f5f8f2)
      );
      border-radius: 12px;
      padding: 12px;
      margin-top: 12px;
    }
    .period-suggestions p {
      margin: 6px 0;
      font-size: 13px;
    }
    .canvas:has(.placement-controls) .viewport {
      max-height: 48dvh;
    }
    .placement-controls {
      position: sticky;
      bottom: 8px;
      z-index: 8;
      border: 2px solid var(--gp-accent, #326c49);
      background: var(--card-background-color, #fff);
      border-radius: 14px;
      padding: 10px;
      margin: 12px 0;
      box-shadow: 0 4px 18px rgb(0 0 0 / 0.12);
    }
    .placement-controls .buttons {
      flex-wrap: nowrap;
      margin: 8px 0 0;
    }
    .placement-controls .primary {
      flex: 1;
    }
    .placement-controls small {
      line-height: 1.3;
    }
    .neighbor-feedback {
      border-left: 4px solid var(--bed-line);
      padding: 8px 12px;
      margin: 8px 0;
    }
    .neighbor-feedback p {
      margin: 4px 0;
    }
    .neighbor-feedback.has-bad {
      border-color: #c04437;
      background: rgb(192 68 55 / 0.08);
    }
    .neighbor-feedback.has-good {
      border-color: #32834b;
    }
    .neighbor-legend {
      font-size: 13px;
      color: var(--secondary-text-color, #68776a);
    }
    .workspace {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
    }
    .box {
      border: 1px solid var(--bed-line);
      background: var(--card-background-color, #fff);
      padding: 18px;
      border-radius: 20px;
      margin: 0 0 18px;
      min-width: 0;
    }
    h3 {
      margin: 0 0 14px;
    }
    h4 {
      margin-bottom: 8px;
    }
    .drawing-guidance {
      border: 2px solid var(--gp-accent, #326c49);
      border-radius: 14px;
      padding: 14px;
      margin: 12px 0;
      background: var(
        --secondary-background-color,
        var(--card-background-color, #f1f7ee)
      );
    }
    .drawing-guidance ol {
      padding-left: 22px;
      line-height: 1.6;
      margin: 8px 0;
    }
    .drawing-guidance h3 {
      margin-bottom: 8px;
    }
    .drawing-guidance p {
      margin-bottom: 0;
    }
    .shape-save {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
      margin: 12px 0;
    }
    button[aria-pressed="true"] {
      box-shadow: inset 0 0 0 2px var(--gp-accent, #326c49);
    }
    .toolbar,
    .buttons {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .toolbar {
      justify-content: space-between;
    }
    .toolbar label {
      grid-template-columns: auto minmax(80px, 120px);
      align-items: center;
    }
    .toolbar input {
      padding: 0;
    }
    .viewport {
      overflow: auto;
      max-height: 65vh;
      border-radius: 12px;
      background: var(--secondary-background-color, #f4f7f1);
      margin-top: 14px;
      overscroll-behavior: contain;
    }
    .map {
      display: block;
      max-width: none;
      touch-action: pan-x pan-y;
      min-height: 180px;
    }
    .map.drawing {
      touch-action: none;
    }
    .map:has([data-vertex]:active),
    .map:has([data-entry]:active) {
      touch-action: none;
    }
    .map text {
      user-select: none;
      pointer-events: none;
    }
    .fields {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin: 14px 0;
    }
    .wide {
      grid-column: 1/-1;
    }
    .check {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 400;
    }
    .check input {
      width: 20px;
      min-height: 20px;
    }
    .buttons {
      margin: 12px 0;
    }
    details {
      margin: 18px 0;
    }
    summary {
      cursor: pointer;
      font-weight: 700;
      padding: 12px 0;
    }
    .timeline-scroll {
      overflow: auto;
      max-height: 500px;
    }
    table {
      border-collapse: separate;
      border-spacing: 0;
      min-width: 600px;
      width: 100%;
    }
    th,
    td {
      text-align: left;
      padding: 8px;
      border-bottom: 1px solid var(--bed-line);
    }
    thead th {
      position: sticky;
      top: 0;
      z-index: 2;
      background: var(--card-background-color, #fff);
    }
    tr > th:first-child {
      position: sticky;
      left: 0;
      z-index: 1;
      min-width: 145px;
      max-width: 230px;
      background: var(--card-background-color, #fff);
    }
    thead th:first-child {
      z-index: 3;
    }
    .bar {
      background: var(--gp-accent, #3e8254);
      color: white;
      width: 100%;
      padding: 6px;
    }
    .blank {
      opacity: 0.35;
      width: 100%;
      padding: 6px;
    }
    .warning {
      color: var(--error-color, #aa4b30);
    }
    .good {
      color: var(--success-color, #30834e);
    }
    .warnings {
      padding-left: 20px;
      line-height: 1.7;
    }
    input:focus-visible,
    button:focus-visible,
    select:focus-visible,
    [tabindex]:focus-visible {
      outline: 3px solid var(--primary-color, #39845a);
      outline-offset: 2px;
    }

    @media (max-width: 550px) {
      .controls {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .controls > label:first-child {
        grid-column: 1/-1;
      }
      .box {
        padding: 12px;
      }
      .toolbar {
        align-items: flex-start;
      }
      .fields {
        gap: 9px;
      }
      button {
        min-height: 44px;
      }
      .map {
        min-height: 160px;
      }
      tr > th:first-child {
        min-width: 125px;
        max-width: 150px;
      }
    }
  `;
}
customElements.define("garden-bed-planner", BedPlanner);
