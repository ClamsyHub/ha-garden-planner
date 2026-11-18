import { LitElement, html, css, type PropertyValues } from "lit";
import type { PlannerApi } from "./api";
import type { Entity, Language } from "./types";
import { text } from "./types";
import { t } from "./i18n";
/** Authenticated lazy photos: never load a multi-year photo archive in list calls. */
export class JournalPhoto extends LitElement {
  static properties = {
    table: { attribute: false },
    api: { attribute: false },
    record: { attribute: false },
    language: { attribute: false },
    image: { state: true },
    failed: { state: true },
    loading: { state: true },
  };
  declare table: "cultivations" | "cultivation_journal" | "cultivation_events";
  declare api?: PlannerApi;
  declare record?: Entity;
  declare language: Language;
  private image = "";
  private failed = false;
  private loading = false;
  private visible = false;
  private generation = 0;
  private observer?: IntersectionObserver;
  static styles = css`
    :host {
      display: block;
      aspect-ratio: var(--gp-photo-ratio, 4/3);
      min-height: var(--gp-photo-min-height, 120px);
      max-width: 360px;
      background: var(--gp-soft, #edf4ec);
      border-radius: 14px;
      overflow: hidden;
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    div {
      padding: 16px;
      font: inherit;
    }
    button {
      font: inherit;
      padding: 10px;
      min-height: 44px;
      cursor: pointer;
      color: inherit;
      background: transparent;
      border: 1px solid currentColor;
      border-radius: 8px;
    }
  `;
  constructor() {
    super();
    this.language = "de";
    this.table = "cultivation_journal";
  }
  connectedCallback(): void {
    super.connectedCallback();
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.visible = true;
          void this.load();
        }
      },
      { rootMargin: "300px" },
    );
    this.observer.observe(this);
  }
  disconnectedCallback(): void {
    this.observer?.disconnect();
    this.generation++;
    this.image = "";
    this.loading = false;
    super.disconnectedCallback();
  }
  protected updated(changed: PropertyValues): void {
    const previous = changed.get("record") as Entity | undefined;
    if (
      changed.has("api") ||
      changed.has("table") ||
      (changed.has("record") &&
        (previous?.id !== this.record?.id ||
          previous?.revision !== this.record?.revision))
    ) {
      this.generation++;
      this.image = "";
      this.failed = false;
      this.loading = false;
      if (this.visible) void this.load();
    }
  }
  private async load(): Promise<void> {
    const api = this.api,
      record = this.record;
    if (!api || !record || this.loading || this.image || !this.isConnected)
      return;
    const token = ++this.generation;
    this.loading = true;
    this.failed = false;
    try {
      const full = await api.command<Entity>("get", {
        table: this.table,
        id: record.id,
      });
      if (token !== this.generation || api !== this.api || !this.isConnected)
        return;
      const image = text(full, "image_data");
      if (!image.startsWith("data:image/png;base64,"))
        throw new Error("missing_image");
      this.image = image;
    } catch {
      if (token === this.generation && this.isConnected) this.failed = true;
    } finally {
      if (token === this.generation) this.loading = false;
    }
  }
  protected render() {
    return this.image
      ? html`<img
          src=${this.image}
          alt=${text(this.record, "title") || t(this.language, "imagePreview")}
        />`
      : html`<div role="status">
          ${t(this.language, this.failed ? "photoLoadError" : "photoLoading")}${this.failed ? html`<button @click=${() => this.load()}>${t(this.language, "retry")}</button>` : html``}
        </div>`;
  }
}
customElements.define("garden-journal-photo", JournalPhoto);
