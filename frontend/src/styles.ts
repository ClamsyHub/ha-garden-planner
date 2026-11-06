import { css } from "lit";
export const styles = css`
  :host {
    display: block;
    color: var(--primary-text-color, #263b30);
    background: var(--primary-background-color, #f5f7f3);
    font: 15px/1.55
      var(
        --paper-font-body1_-_font-family,
        system-ui,
        -apple-system,
        sans-serif
      );
    --gp-green: #31684a;
    --gp-pale: #edf4ec;
    --gp-border: var(--divider-color, #dce4da);
    --gp-muted: var(--secondary-text-color, #5b6b5f);
    --gp-card: var(--card-background-color, #fff);
    --gp-bg: var(--primary-background-color, #f5f7f3);
    --gp-soft: color-mix(in srgb, var(--gp-green) 9%, var(--gp-card));
    min-height: 100vh;
  }
  * {
    box-sizing: border-box;
  }
  button,
  input,
  select,
  textarea {
    font: inherit;
  }
  button,
  a,
  input,
  select,
  textarea {
    -webkit-tap-highlight-color: transparent;
  }
  button {
    cursor: pointer;
    min-height: 44px;
    border: 1px solid var(--gp-border);
    border-radius: 10px;
    background: var(--gp-card);
    color: inherit;
    padding: 9px 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 600;
  }
  button:hover:not(:disabled) {
    border-color: var(--gp-green);
    background: var(--gp-soft);
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  button:focus-visible,
  a:focus-visible {
    outline: 3px solid #c28b28;
    outline-offset: 3px;
  }
  button.primary {
    background: var(--gp-green);
    color: #fff;
    border-color: var(--gp-green);
  }
  button.primary:hover:not(:disabled) {
    background: #24583b;
    color: white;
  }
  button.danger {
    color: var(--error-color, #a52f32);
  }
  button.link {
    border: 0;
    background: transparent;
    justify-content: flex-start;
    padding: 4px 0;
    color: var(--gp-green);
    text-align: left;
  }
  button.icon {
    width: 44px;
    padding: 8px;
    flex-shrink: 0;
  }
  svg {
    width: 21px;
    height: 21px;
    flex-shrink: 0;
  }
  .app {
    display: grid;
    grid-template-columns: 236px minmax(0, 1fr);
    min-height: 100vh;
  }
  aside {
    background: var(--gp-card);
    border-right: 1px solid var(--gp-border);
    padding: 30px 18px;
    position: sticky;
    top: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .brand {
    display: flex;
    gap: 11px;
    align-items: center;
    padding: 0 10px;
  }
  .brand-icon {
    display: grid;
    place-items: center;
    color: var(--gp-green);
    background: var(--gp-soft);
    width: 42px;
    height: 42px;
    border-radius: 14px;
  }
  .brand strong {
    font-size: 18px;
    letter-spacing: -0.5px;
  }
  .brand small {
    display: block;
    font-size: 10px;
    letter-spacing: 2.8px;
    text-transform: uppercase;
    color: var(--gp-muted);
  }
  nav {
    display: grid;
    gap: 7px;
  }
  nav button {
    background: transparent;
    border-color: transparent;
    justify-content: flex-start;
    font-size: 14px;
    padding: 12px;
    color: var(--gp-muted);
    font-weight: 500;
  }
  nav button[aria-current="page"] {
    color: var(--gp-green);
    background: var(--gp-soft);
    font-weight: 700;
  }
  .aside-footer {
    margin-top: auto;
    padding: 15px 10px;
    border-top: 1px solid var(--gp-border);
    font-size: 12px;
    color: var(--gp-muted);
  }
  main {
    min-width: 0;
    padding: 36px clamp(20px, 4vw, 60px) 60px;
    max-width: 1600px;
    width: 100%;
    margin: 0 auto;
    align-self: start;
  }
  .topbar,
  .section-head,
  .toolbar,
  .actions,
  .row {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .topbar {
    margin-bottom: 30px;
  }
  .eyebrow {
    text-transform: uppercase;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.6px;
    color: var(--gp-muted);
  }
  h1 {
    font-size: clamp(25px, 3vw, 35px);
    font-weight: 650;
    letter-spacing: -1.2px;
    line-height: 1.25;
    margin: 7px 0;
  }
  h2 {
    font-size: 18px;
    letter-spacing: -0.3px;
    margin: 0;
  }
  h3 {
    font-size: 16px;
    margin: 0 0 7px;
  }
  p {
    margin: 8px 0;
  }
  .muted,
  small {
    color: var(--gp-muted);
  }
  .topbar p {
    font-size: 14px;
  }
  .hero {
    border-radius: 20px;
    background: #183f2d;
    color: #fff;
    padding: 30px 34px;
    margin-bottom: 24px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 20px;
    align-items: center;
    overflow: hidden;
  }
  .hero .eyebrow,
  .hero .muted {
    color: #c5dccb;
  }
  .hero h2 {
    font-size: clamp(25px, 3vw, 36px);
    letter-spacing: -1px;
  }
  .hero p {
    max-width: 620px;
    color: #dce9df;
    font-size: 14px;
  }
  .hero .art svg {
    width: 100%;
    height: 100%;
  }
  .hero .art {
    color: #a8cca4;
    width: 100px;
    height: 130px;
    transform: rotate(-10deg);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    margin: 24px 0;
  }
  .stat {
    background: var(--gp-card);
    border: 1px solid var(--gp-border);
    border-radius: 14px;
    padding: 17px 18px;
  }
  .stat strong {
    display: block;
    font-size: 27px;
    font-weight: 650;
    line-height: 1.4;
  }
  .stat span {
    display: block;
    font-size: 12px;
    color: var(--gp-muted);
  }
  .columns {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(260px, 1fr);
    gap: 22px;
  }
  .panel {
    background: var(--gp-card);
    border: 1px solid var(--gp-border);
    border-radius: 16px;
    padding: 23px;
    min-width: 0;
    margin-bottom: 22px;
  }
  .section-head {
    margin-bottom: 18px;
  }
  .section-head p {
    font-size: 12px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  .plant {
    background: var(--gp-card);
    border: 1px solid var(--gp-border);
    border-radius: 15px;
    padding: 21px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .plant .plant-title {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .plant-symbol {
    background: var(--gp-soft);
    border-radius: 12px;
    height: 46px;
    width: 46px;
    display: grid;
    place-items: center;
    color: var(--gp-green);
    flex-shrink: 0;
  }
  .plant p {
    font-size: 13px;
    overflow-wrap: anywhere;
  }
  .plant .actions {
    margin-top: auto;
    justify-content: flex-start;
  }
  .badge {
    display: inline-block;
    border-radius: 6px;
    background: var(--gp-soft);
    color: var(--gp-green);
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 650;
  }
  .badge.failed {
    color: #a33435;
    background: #fbeeee;
  }
  .badge.partial {
    color: #825219;
    background: #faf2dc;
  }
  .badge.unknown {
    color: var(--gp-muted);
    background: var(--gp-bg);
  }
  .item {
    display: flex;
    gap: 13px;
    align-items: flex-start;
    padding: 15px 0;
    border-bottom: 1px solid var(--gp-border);
  }
  .item:last-child {
    border-bottom: 0;
  }
  .item-content {
    flex: 1;
    min-width: 0;
  }
  .item p {
    font-size: 13px;
  }
  .item .link {
    font-size: 14px;
  }
  .date-tile {
    text-align: center;
    background: var(--gp-bg);
    border: 1px solid var(--gp-border);
    border-radius: 9px;
    padding: 6px;
    min-width: 49px;
    line-height: 1.2;
  }
  .date-tile strong {
    display: block;
    font-size: 19px;
  }
  .date-tile small {
    font-size: 10px;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 12px;
    margin: 0 0 22px;
  }
  .filters label {
    min-width: 140px;
    flex: 1;
    max-width: 300px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
  }
  input,
  select,
  textarea {
    background: var(--gp-card);
    color: inherit;
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--gp-border);
    border-radius: 9px;
    padding: 9px 11px;
    font-size: 14px;
  }
  input:focus,
  select:focus,
  textarea:focus {
    outline: 2px solid var(--gp-green);
    outline-offset: 1px;
  }
  textarea {
    min-height: 100px;
    resize: vertical;
  }
  input[type="checkbox"] {
    width: 20px;
    min-height: 20px;
    accent-color: var(--gp-green);
    flex-shrink: 0;
  }
  .check {
    flex-direction: row;
    align-items: center;
    min-height: 44px;
    font-size: 13px;
  }
  .empty {
    padding: 45px 20px;
    text-align: center;
    color: var(--gp-muted);
  }
  .empty svg {
    width: 50px;
    height: 50px;
    color: var(--gp-green);
    margin-bottom: 14px;
  }
  .empty h2 {
    color: var(--primary-text-color, #263b30);
    margin: 8px;
  }
  .empty p {
    max-width: 480px;
    margin: 8px auto 20px;
    font-size: 14px;
  }
  .notice {
    border-radius: 10px;
    background: var(--gp-soft);
    padding: 12px 15px;
    font-size: 13px;
    margin: 12px 0;
  }
  .error {
    background: color-mix(
      in srgb,
      var(--error-color, #b43436) 10%,
      var(--gp-card)
    );
    color: var(--error-color, #a1282b);
    border: 1px solid currentColor;
  }
  .toast {
    position: fixed;
    bottom: 22px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    padding: 12px 22px;
    border-radius: 12px;
    background: #193e2c;
    color: #fff;
    box-shadow: 0 4px 24px #0003;
    max-width: calc(100vw - 32px);
  }
  .segmented {
    display: flex;
    gap: 4px;
    background: var(--gp-soft);
    padding: 4px;
    border-radius: 11px;
  }
  .segmented button {
    border: 0;
    min-height: 38px;
    background: transparent;
    font-size: 13px;
    padding: 7px 13px;
  }
  .segmented button[aria-pressed="true"] {
    background: var(--gp-card);
    box-shadow: 0 1px 4px #0001;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    font-size: 12px;
    margin: 16px 0;
  }
  .dot {
    width: 9px;
    height: 9px;
    display: inline-block;
    border-radius: 3px;
    margin-right: 6px;
    background: var(--bar-color, #659377);
  }
  .indoors {
    --bar-color: #ad8952;
  }
  .direct {
    --bar-color: #397456;
  }
  .transplant {
    --bar-color: #5986a0;
  }
  .harvest {
    --bar-color: #b97856;
  }
  .year-scroll {
    overflow: auto;
    max-width: 100%;
    border: 1px solid var(--gp-border);
    border-radius: 12px;
  }
  .year-grid {
    min-width: 790px;
    display: grid;
    grid-template-columns: 190px repeat(12, minmax(42px, 1fr));
    background: var(--gp-card);
  }
  .year-grid > div,
  .year-grid > button {
    border: 0;
    border-bottom: 1px solid var(--gp-border);
    border-right: 1px solid var(--gp-border);
    border-radius: 0;
    min-height: 48px;
    padding: 7px;
  }
  .year-grid .month-head {
    text-align: center;
    background: var(--gp-soft);
    font-size: 11px;
    font-weight: 600;
    padding-top: 16px;
  }
  .year-grid .row-title {
    justify-content: flex-start;
    text-align: left;
    font-size: 12px;
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--gp-card);
    display: block;
  }
  .row-title small {
    display: block;
    font-size: 10px;
  }
  .year-cell {
    position: relative;
    display: flex;
    align-items: center;
    padding: 14px 0 !important;
    background: transparent;
  }
  .year-cell .bar {
    position: absolute;
    top: 15px;
    background: var(--bar-color);
    min-height: 17px;
    width: 100%;
    border-radius: 4px;
    opacity: 0.85;
  }
  .year-cell:hover .bar {
    opacity: 1;
  }
  .month-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 12px;
  }
  .week-windows {
    display: grid;
    gap: 10px;
    margin-top: 16px;
  }
  .week-window {
    width: 100%;
    text-align: left;
    justify-content: space-between;
    flex-wrap: wrap;
    border-left: 4px solid var(--bar-color, var(--gp-green));
    padding: 14px;
  }
  .week-window > span {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }
  .week-window strong {
    overflow-wrap: anywhere;
  }
  .week-window span span,
  .week-window small {
    font-size: 12px;
    font-weight: 400;
  }
  .week-heading {
    margin: 20px 0 12px;
    font-size: 17px;
  }
  .week-empty {
    font-size: 12px;
    margin-top: 10px;
  }
  .sensor-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .sensor-picker {
    position: relative;
    min-width: 0;
  }
  .sensor-options {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 5;
    max-height: var(--sensor-max-height, 240px);
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--gp-card);
    border: 1px solid var(--gp-border);
    border-radius: 9px;
    box-shadow: 0 8px 22px #0002;
    padding: 4px;
  }
  .sensor-options.above {
    top: auto;
    bottom: calc(100% + 4px);
  }
  .sensor-options[hidden] {
    display: none;
  }
  .sensor-options button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    width: 100%;
    text-align: left;
    border: 0;
    padding: 10px;
    min-height: 48px;
  }
  .sensor-options button[aria-selected="true"] {
    background: var(--gp-soft);
  }
  .sensor-options strong,
  .sensor-options small {
    overflow-wrap: anywhere;
  }
  .sensor-options strong {
    font-size: 13px;
  }
  .sensor-options small {
    font-size: 11px;
    font-weight: 400;
  }
  .sensor-empty {
    font-size: 12px;
    padding: 10px;
  }
  .week-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(120px, 1fr));
    gap: 10px;
    min-width: 900px;
  }
  .week-day {
    background: var(--gp-card);
    border: 1px solid var(--gp-border);
    border-radius: 12px;
    padding: 12px;
  }
  .week-day.today {
    border: 2px solid var(--gp-green);
  }
  .week-day h3 {
    font-size: 12px;
  }
  .week-event {
    width: 100%;
    justify-content: flex-start;
    font-size: 12px;
    text-align: left;
    margin: 6px 0;
    padding: 10px;
    border-left: 3px solid var(--bar-color, var(--gp-green));
  }
  .scroll {
    overflow-x: auto;
  }
  .table-wrap {
    overflow: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    text-align: left;
  }
  th,
  td {
    padding: 13px 10px;
    border-bottom: 1px solid var(--gp-border);
    vertical-align: top;
  }
  th {
    font-size: 11px;
    color: var(--gp-muted);
    font-weight: 600;
  }
  td {
    overflow-wrap: anywhere;
  }
  .timeline {
    margin: 20px 0;
    padding-left: 20px;
    border-left: 2px solid var(--gp-border);
  }
  .timeline article {
    position: relative;
    padding: 0 0 23px 16px;
  }
  .timeline article:before {
    content: "";
    position: absolute;
    left: -27px;
    top: 7px;
    width: 10px;
    height: 10px;
    border: 2px solid var(--gp-card);
    background: var(--gp-green);
    border-radius: 50%;
  }
  .timeline article p {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-size: 13px;
  }
  dl {
    display: grid;
    grid-template-columns: minmax(110px, 1fr) 2fr;
    gap: 8px 15px;
    font-size: 13px;
  }
  dt {
    color: var(--gp-muted);
  }
  dd {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  dialog {
    background: var(--gp-card);
    color: inherit;
    width: min(760px, calc(100vw - 32px));
    max-height: 90vh;
    border: 1px solid var(--gp-border);
    border-radius: 18px;
    padding: 0;
    box-shadow: 0 15px 70px #0004;
  }
  dialog::backdrop {
    background: #10291f88;
    backdrop-filter: blur(3px);
  }
  .dialog-head {
    position: sticky;
    top: 0;
    background: var(--gp-card);
    border-bottom: 1px solid var(--gp-border);
    padding: 18px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    z-index: 3;
  }
  .dialog-body {
    padding: 24px;
  }
  .dialog-foot {
    position: sticky;
    bottom: 0;
    background: var(--gp-card);
    border-top: 1px solid var(--gp-border);
    padding: 15px 24px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 17px;
  }
  .form-grid .wide {
    grid-column: 1/-1;
  }
  .dialog-body h3 {
    margin-top: 20px;
  }
  .dialog-body .section-head {
    margin-top: 24px;
  }
  details {
    margin: 18px 0;
  }
  summary {
    cursor: pointer;
    font-weight: 600;
    min-height: 44px;
    padding: 10px 0;
  }
  .file-input {
    max-width: 100%;
  }
  .settings-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    max-width: 850px;
  }
  .break {
    overflow-wrap: anywhere;
  }
  :host([dark]) {
    --gp-green: #87c39a;
  }
  :host([dark]) button.primary {
    background: #397452;
    color: white;
  }
  :host([dark]) .hero {
    background: #123624;
  }
  @media (max-width: 1100px) {
    .app {
      grid-template-columns: 200px minmax(0, 1fr);
    }
    aside {
      padding: 25px 12px;
    }
    .brand strong {
      font-size: 16px;
    }
    .columns {
      grid-template-columns: 1fr;
      gap: 0;
    }
    .stats {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 760px) {
    .app {
      display: block;
    }
    aside {
      position: sticky;
      top: 0;
      height: auto;
      z-index: 5;
      padding: 10px 12px 0;
      border-right: 0;
      border-bottom: 1px solid var(--gp-border);
      gap: 8px;
    }
    .brand {
      padding: 0 4px;
    }
    .brand-icon {
      width: 31px;
      height: 31px;
      border-radius: 9px;
    }
    .brand strong {
      font-size: 15px;
    }
    .brand small,
    .aside-footer {
      display: none;
    }
    nav {
      display: flex;
      overflow: auto;
      gap: 3px;
      padding-bottom: 8px;
    }
    nav button {
      white-space: nowrap;
      min-height: 43px;
      padding: 8px 12px;
      font-size: 12px;
      flex-shrink: 0;
    }
    nav svg {
      width: 17px;
      height: 17px;
    }
    main {
      padding: 23px 16px 50px;
    }
    .topbar {
      margin-bottom: 20px;
      gap: 14px;
    }
    .topbar .actions {
      width: 100%;
    }
    .topbar .actions .primary {
      flex: 1;
    }
    .hero {
      padding: 23px;
      border-radius: 15px;
      grid-template-columns: 1fr;
    }
    .hero .art {
      display: none;
    }
    .stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 9px;
    }
    .stat:last-child {
      grid-column: 1/-1;
    }
    .stat {
      padding: 13px;
    }
    .stat strong {
      font-size: 24px;
    }
    .panel {
      padding: 17px;
    }
    .grid {
      grid-template-columns: 1fr;
    }
    .filters label {
      min-width: calc(50% - 12px);
      max-width: none;
    }
    .filters label:first-child {
      flex-basis: 100%;
    }
    .item {
      flex-wrap: wrap;
    }
    .item-content {
      min-width: 180px;
    }
    .form-grid {
      grid-template-columns: 1fr;
    }
    dialog {
      width: calc(100vw - 16px);
      max-height: 94dvh;
      border-radius: 14px;
    }
    .dialog-body {
      padding: 18px;
    }
    .dialog-head,
    .dialog-foot {
      padding: 13px 18px;
    }
    .toolbar {
      align-items: stretch;
    }
    .toolbar > input {
      max-width: 100%;
    }
    dl {
      grid-template-columns: 1fr;
      gap: 2px;
    }
    dd {
      margin-bottom: 10px;
    }
  }
`;
