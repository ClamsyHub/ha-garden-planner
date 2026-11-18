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
    min-height: calc(100dvh - 56px);
  }
  aside {
    background: var(--gp-card);
    border-right: 1px solid var(--gp-border);
    padding: 30px 18px;
    position: sticky;
    top: 56px;
    height: calc(100dvh - 56px);
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
    pointer-events: none;
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
  .prick_out {
    --bar-color: #9167ad;
  }
  .care {
    --bar-color: #287f89;
  }
  .other {
    --bar-color: #767676;
  }
  .activity {
    border-left: 4px solid var(--bar-color);
  }
  .roles-scroll {
    overflow-x: auto;
    max-width: 100%;
    margin: 12px 0;
  }
  .roles-table {
    border-collapse: collapse;
    width: 100%;
    min-width: 640px;
  }
  .roles-table th,
  .roles-table td {
    padding: 12px;
    text-align: left;
    vertical-align: top;
    border-bottom: 1px solid var(--gp-border);
  }
  .roles-table td label {
    display: block;
    margin-bottom: 8px;
  }
  .roles-table small {
    display: block;
    font-weight: normal;
  }
  .roles-table input[type="checkbox"] {
    width: 22px;
    height: 22px;
    min-height: 22px;
    accent-color: var(--gp-accent);
  }
  .roles-table select,
  .roles-table input[type="email"] {
    min-width: 150px;
  }
  .transplant {
    --bar-color: #5986a0;
  }
  .fertilize {
    --bar-color: #a16c28;
  }
  .prune {
    --bar-color: #ac527f;
  }
  .harvest {
    --bar-color: #b97856;
  }
  .filters.calendar-filters {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: end;
  }
  .filters.calendar-filters > label {
    min-width: 0;
    max-width: none;
  }
  .calendar-toolbar {
    align-items: end;
  }
  .calendar-navigation {
    display: grid;
    grid-template-columns: 44px minmax(0, 220px) 44px auto;
    align-items: end;
    gap: 10px;
    max-width: 100%;
  }
  .calendar-navigation label {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    contain: inline-size;
  }
  .calendar-navigation input {
    display: block;
    appearance: none;
    -webkit-appearance: none;
    inline-size: 100%;
    min-inline-size: 0;
    max-inline-size: 100%;
    max-width: 100%;
    width: 100%;
    min-width: 0;
    height: 44px;
    box-sizing: border-box;
  }
  .calendar-navigation input:focus {
    outline-offset: -3px;
  }
  .calendar-navigation input::-webkit-date-and-time-value {
    min-width: 0;
    overflow: hidden;
    text-align: left;
  }
  .calendar-navigation button {
    min-width: 0;
    min-height: 44px;
  }
  .calendar-navigation > .icon:first-child {
    grid-column: 1;
    grid-row: 1;
  }
  .calendar-navigation > label {
    grid-column: 2;
    grid-row: 1;
  }
  .calendar-navigation > .icon {
    grid-column: 3;
    grid-row: 1;
  }
  .filter-label {
    font-size: 12px;
    font-weight: 600;
  }
  .multi-filter {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    min-width: 0;
    padding: 0;
    margin: 0;
    border: 0;
  }
  .multi-filter legend {
    font-weight: 600;
    margin-bottom: 8px;
    font-size: 13px;
  }
  .multi-filter details {
    position: relative;
    margin: 0;
  }
  .multi-filter summary {
    width: 100%;
    height: 44px;
    box-sizing: border-box;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border: 1px solid var(--gp-border);
    border-radius: 10px;
    background: var(--gp-card);
    padding: 12px;
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  .multi-filter-options {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 6;
    max-height: min(320px, 45dvh);
    overflow: auto;
    padding: 12px;
    background: var(--gp-card);
    border: 1px solid var(--gp-border);
    border-radius: 10px;
    box-shadow: 0 8px 24px #0002;
  }
  .multi-filter-options .check {
    min-height: 44px;
    max-width: none;
    min-width: 0;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .multi-filter-options p {
    margin-top: 0;
    font-size: 12px;
  }
  .task-card {
    scroll-margin-top: 130px;
  }
  .reminder-save-status {
    min-height: 20px;
    margin: 8px 0;
    font-size: 12px;
    color: var(--gp-muted);
  }
  .matrix-scroll-hint {
    display: none;
  }
  .reminders-scroll {
    overflow: auto;
    touch-action: pan-x pan-y;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
    max-height: 65dvh;
    margin-top: 20px;
    border: 1px solid var(--gp-border);
    border-radius: 10px;
  }
  .reminders-table {
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    min-width: 1050px;
    width: 100%;
  }
  .reminders-table th,
  .reminders-table td {
    padding: 10px;
    border-bottom: 1px solid var(--gp-border);
    border-right: 1px solid var(--gp-border);
  }
  .reminders-table th {
    background: var(--gp-card);
  }
  .reminders-table thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--gp-soft);
  }
  .reminders-table th:first-child {
    position: sticky;
    left: 0;
    width: 180px;
    white-space: normal;
    overflow-wrap: anywhere;
    text-align: left;
    z-index: 1;
  }
  .reminders-table thead th:first-child {
    z-index: 3;
  }
  .reminders-table td {
    text-align: center;
  }
  .reminders-table input {
    width: 24px;
    height: 24px;
    min-height: 24px;
    accent-color: var(--gp-accent);
    cursor: pointer;
  }
  .reminders-table .reminder-unavailable {
    background: var(--gp-soft);
  }
  .reminders-table input:disabled {
    cursor: default;
    opacity: 0.4;
  }
  .year-scroll {
    overflow: auto;
    max-height: min(65dvh, 720px);
    overscroll-behavior: contain;
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
    position: sticky;
    top: 0;
    z-index: 3;
    text-align: center;
    background: var(--gp-soft);
    font-size: 11px;
    font-weight: 600;
    padding-top: 16px;
  }
  .year-grid .month-head:first-child {
    left: 0;
    z-index: 4;
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
  .month-event {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    font-weight: normal;
    gap: 8px;
  }
  .month-event-title {
    font-size: 16px;
  }
  .month-region-note {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .calendar-detail-body {
    display: grid;
    gap: 20px;
  }
  .calendar-window-card {
    padding: 18px;
    border: 1px solid var(--gp-border);
    border-left: 5px solid var(--bar-color);
    border-radius: 12px;
    background: color-mix(in srgb, var(--bar-color) 5%, var(--gp-card));
  }
  .calendar-window-card .calendar-window-dates {
    font-size: 21px;
    margin: 5px 0 10px;
  }
  .calendar-window-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .calendar-window-note {
    margin: 16px 0;
  }
  .calendar-window-note h3 {
    font-size: 13px;
    color: var(--gp-muted);
  }
  .calendar-window-note p {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .calendar-plant-profile {
    padding-top: 2px;
    min-width: 0;
  }
  .calendar-plant-profile .section-head {
    flex-wrap: wrap;
    gap: 8px;
  }
  .calendar-plant-profile .plant-quick-facts {
    margin-bottom: 0;
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
  #editor-dialog {
    scroll-padding-top: 90px;
    scroll-padding-bottom: 80px;
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
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 17px;
  }
  .form-grid .row-start {
    grid-column-start: 1;
  }
  .ha-navigation {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 4px 12px;
    background: var(--gp-card);
    border-bottom: 1px solid var(--gp-border);
  }
  .ha-navigation span {
    font-weight: 600;
  }
  .plant-detail-actions {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
  }
  .detail-jumps button {
    font-size: 13px;
    padding: 8px 10px;
  }
  .plant-title h2 {
    font-size: 16px;
    letter-spacing: normal;
    margin: 0 0 7px;
  }
  .plant-summary-heading {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }
  .plant-summary-heading p {
    margin: 0;
  }
  .plant-quick-facts {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: 14px 0;
  }
  .plant-quick-facts > div {
    padding: 10px 12px;
    border: 1px solid var(--gp-border);
    border-radius: 10px;
    min-width: 0;
  }
  .plant-quick-facts dt {
    font-size: 12px;
    color: var(--gp-muted);
  }
  .plant-quick-facts dd {
    margin: 3px 0 0;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .detail-jumps {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0;
  }
  .plant-full-information {
    margin: 12px 0;
  }
  .form-grid .wide {
    min-width: 0;
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
      top: 56px;
      height: auto;
      z-index: 1;
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
    .plant-detail-actions button {
      font-size: 12px;
      padding: 7px 4px;
      min-width: 0;
    }
    .plant-quick-facts {
      grid-template-columns: 1fr;
      gap: 0;
      border: 1px solid var(--gp-border);
      border-radius: 10px;
      overflow: hidden;
    }
    .plant-quick-facts > div {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
      border: 0;
      border-bottom: 1px solid var(--gp-border);
      border-radius: 0;
      padding: 7px 10px;
    }
    .plant-quick-facts > div:last-child {
      border-bottom: 0;
    }
    .plant-quick-facts dt {
      max-width: 62%;
    }
    .plant-quick-facts dd {
      margin: 0;
      text-align: right;
      font-size: 13px;
    }

    .form-grid {
      grid-template-columns: minmax(0, 1fr);
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
  @media (max-width: 900px) {
    .filters.calendar-filters {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .filters.calendar-filters > label:first-child {
      grid-column: 1 / -1;
    }
  }
  @media (max-width: 600px) {
    .filters.calendar-filters {
      grid-template-columns: minmax(0, 1fr);
    }
    .calendar-navigation {
      width: 100%;
      grid-template-columns: 44px minmax(0, 1fr) 44px;
    }
    .calendar-navigation input {
      font-size: 16px;
    }
    .calendar-today {
      grid-row: 2;
      grid-column: 1 / -1;
      justify-self: end;
    }
    .reminders-table {
      min-width: 950px;
    }
    .reminders-table th:first-child {
      width: 100px;
      padding: 8px;
    }
    .reminders-table thead th {
      overflow-wrap: anywhere;
    }
    .matrix-scroll-hint {
      display: block;
      font-size: 12px;
    }
  }
  .neighbor-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    margin-top: 18px;
  }
  .neighbor-grid > section {
    min-width: 0;
  }
  .neighbor-group li {
    margin: 10px 0;
    overflow-wrap: anywhere;
  }
  .neighbor-options {
    max-height: 280px;
    overflow: auto;
    margin-bottom: 14px;
    border: 1px solid var(--gp-border);
    padding: 8px;
    border-radius: 9px;
  }
  .neighbor-options .check {
    min-height: 44px;
    overflow-wrap: anywhere;
  }
  .seed-save {
    margin: 14px 0;
  }
  .seed-scroll {
    overflow: auto;
    max-height: 65dvh;
    border: 1px solid var(--gp-border);
    border-radius: 10px;
    touch-action: pan-x pan-y;
  }
  .seed-table {
    width: 100%;
    min-width: 580px;
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
  }
  .seed-table th,
  .seed-table td {
    padding: 8px;
    border-right: 1px solid var(--gp-border);
    border-bottom: 1px solid var(--gp-border);
    text-align: center;
  }
  .seed-table thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--gp-soft);
  }
  .seed-table th:first-child {
    position: sticky;
    left: 0;
    width: 180px;
    background: var(--gp-card);
    text-align: left;
    overflow-wrap: anywhere;
    z-index: 1;
  }
  .seed-table thead th:first-child {
    background: var(--gp-soft);
    z-index: 3;
  }
  .seed-choice {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    cursor: pointer;
  }
  .seed-choice input {
    width: 24px;
    height: 24px;
    min-height: 24px;
    accent-color: var(--gp-green);
  }
  @media (max-width: 600px) {
    .neighbor-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .seed-table {
      min-width: 500px;
    }
    .seed-table th:first-child {
      width: 100px;
    }
    .seed-save > .actions {
      width: 100%;
    }
    .seed-save button {
      flex: 1;
    }
  }
  .neighbor-toolbar {
    align-items: end;
  }
  .neighbor-toolbar > label {
    width: min(100%, 320px);
    min-width: 0;
  }
  .seed-table thead th {
    white-space: normal;
    overflow-wrap: anywhere;
  }
  @media (max-width: 600px) {
    .neighbor-toolbar > label,
    .neighbor-toolbar > button {
      width: 100%;
    }
  }
  .ha-navigation {
    z-index: 3;
  }
  aside {
    top: var(--gp-header-height, 56px);
  }
  .stats {
    position: sticky;
    top: var(--gp-sticky-top, 56px);
    z-index: 1;
    padding: 10px 0;
    background: var(--gp-bg);
  }
  button.stat {
    min-width: 0;
    text-align: left;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 0;
  }
  .stat .stat-label-short {
    display: none;
  }
  .upcoming-panel {
    scroll-margin-top: calc(
      var(--gp-sticky-top, 56px) + var(--gp-summary-height, 0px) + 12px
    );
  }
  .upcoming-panel:focus-visible {
    outline: 3px solid var(--gp-green);
    outline-offset: 3px;
  }
  .legend {
    gap: 6px;
  }
  .legend button {
    min-height: 40px;
    font-size: 12px;
    padding: 6px 9px;
    background: transparent;
    border-color: transparent;
  }
  .legend button[aria-pressed="true"] {
    background: var(--gp-soft);
    border-color: var(--bar-color);
    box-shadow: inset 0 0 0 1px var(--bar-color);
  }
  .seed-save-status {
    min-height: 24px;
    font-size: 12px;
    color: var(--gp-muted);
  }
  .history-success-filter {
    margin-bottom: 16px;
  }
  @media (max-width: 760px) {
    aside {
      z-index: 2;
    }
    .overview-page {
      padding-top: 16px;
    }
    .overview-page .topbar {
      display: flex;
      flex-wrap: nowrap;
      margin-bottom: 12px;
      gap: 8px;
    }
    .overview-page .topbar > div {
      min-width: 0;
    }
    .overview-page .topbar .eyebrow,
    .overview-page .topbar p,
    .overview-page .topbar-action-label {
      display: none;
    }
    .overview-page .topbar h1 {
      font-size: 25px;
    }
    .overview-page .topbar .actions {
      width: auto;
      flex-wrap: nowrap;
      flex-shrink: 0;
      gap: 8px;
    }
    .overview-page .topbar .actions .primary {
      width: 44px;
      padding: 8px;
      flex: none;
    }
    .overview-page .hero {
      padding: 14px 16px;
      margin-bottom: 12px;
    }
    .overview-page .hero .eyebrow {
      display: none;
    }
    .overview-page .hero h2 {
      font-size: 20px;
      margin: 0;
    }
    .overview-page .hero p {
      font-size: 12px;
      line-height: 1.4;
      margin: 4px 0;
    }
    .overview-page .stats {
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 5px;
      margin: 12px 0;
      padding: 8px 0;
    }
    .overview-page .stat:last-child {
      grid-column: auto;
    }
    .overview-page button.stat {
      padding: 6px 4px;
      border-radius: 9px;
      align-items: center;
      text-align: center;
      min-height: 64px;
      justify-content: center;
    }
    .overview-page .stat strong {
      font-size: 19px;
      line-height: 1.2;
    }
    .overview-page .stat span {
      font-size: 10px;
      line-height: 1.2;
      overflow-wrap: anywhere;
    }
    .overview-page .stat .stat-label-full {
      display: none;
    }
    .overview-page .stat .stat-label-short {
      display: block;
    }
    .legend button {
      min-height: 44px;
    }
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
  .back-overview-bar {
    position: sticky;
    top: var(--gp-sticky-top, 56px);
    z-index: 1;
    background: var(--gp-bg);
    padding: 8px 0;
    margin-bottom: 16px;
  }
  .plant-photo,
  .profile-photo,
  .variety-photo {
    object-fit: cover;
    border-radius: 18px;
    background: var(--gp-soft);
    flex-shrink: 0;
  }
  .plant-photo {
    width: 86px;
    height: 86px;
  }
  .profile-photo {
    width: 180px;
    height: 220px;
  }
  .variety-photo {
    width: 54px;
    height: 54px;
    border-radius: 10px;
  }
  .photo-placeholder {
    display: grid;
    place-items: center;
    color: var(--gp-green);
  }
  .photo-placeholder svg {
    width: 45%;
    height: 45%;
  }
  .catalog-card {
    gap: 18px;
  }
  .catalog-card-heading {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
  }
  .catalog-card-heading > div {
    min-width: 0;
  }
  .catalog-card-heading h2 {
    margin: 0;
    font-size: 23px;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
  .catalog-card-heading i {
    display: block;
    font-size: 12px;
    color: var(--gp-muted);
    margin: 5px 0;
    overflow-wrap: anywhere;
  }
  .catalog-facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 12px;
    margin: 4px 0;
  }
  .catalog-facts dd {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 13px;
    overflow-wrap: anywhere;
  }
  .catalog-facts svg {
    color: var(--gp-green);
    width: 18px;
    height: 18px;
  }
  .catalog-neighbors {
    display: flex;
    gap: 12px;
    align-items: center;
    border-top: 1px solid var(--gp-border);
    padding-top: 15px;
    font-size: 13px;
  }
  .catalog-neighbors > span:first-child {
    margin-right: auto;
    color: var(--gp-muted);
  }
  .catalog-details {
    flex: 1;
  }
  .catalog-card .actions {
    flex-wrap: nowrap;
  }
  .neighbor-good {
    color: var(--success-color, #286644);
  }
  .neighbor-bad {
    color: var(--error-color, #a52f32);
  }
  :host([dark]) .neighbor-good {
    color: var(--success-color, #78c99a);
  }
  :host([dark]) .neighbor-bad {
    color: var(--error-color, #ff9494);
  }
  .image-editor {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    margin-bottom: 20px;
    border: 1px solid var(--gp-border);
    border-radius: 14px;
  }
  .image-editor > div {
    min-width: 0;
    flex: 1;
  }
  .image-editor input {
    max-width: 100%;
    width: 100%;
    padding: 8px 0;
    border: 0;
  }
  .image-editor small {
    display: block;
    margin: 8px 0;
  }
  .matrix-search {
    max-width: 440px;
    margin-bottom: 10px;
  }
  .neighbor-matrix-scroll {
    overflow: auto;
    max-height: 60dvh;
    border: 1px solid var(--gp-border);
    border-radius: 14px;
    isolation: isolate;
  }
  .neighbor-matrix {
    border-collapse: separate;
    border-spacing: 0;
    width: max-content;
    min-width: 100%;
    table-layout: fixed;
  }
  .neighbor-matrix th,
  .neighbor-matrix td {
    padding: 5px;
    border-bottom: 1px solid var(--gp-border);
    width: 100px;
    min-width: 100px;
    max-width: 100px;
    text-align: center;
    vertical-align: middle;
    overflow-wrap: anywhere;
  }
  .neighbor-matrix thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--gp-card);
    height: 70px;
    font-size: 12px;
  }
  .neighbor-matrix tr > :first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--gp-card);
    width: 150px;
    min-width: 150px;
    max-width: 150px;
    text-align: left;
    font-size: 13px;
  }
  .neighbor-matrix thead th:first-child {
    z-index: 3;
  }
  .neighbor-matrix .matrix-highlight {
    background: var(--gp-soft);
  }
  .matrix-cell {
    width: 100%;
    min-height: 46px;
    padding: 5px;
    font-size: 22px;
    border-color: transparent;
    border-radius: 10px;
  }
  .matrix-cell.neighbor-good {
    background: color-mix(
      in srgb,
      var(--success-color, #397456) 13%,
      var(--gp-card)
    );
  }
  .matrix-cell.neighbor-bad {
    background: color-mix(
      in srgb,
      var(--error-color, #a52f32) 13%,
      var(--gp-card)
    );
  }
  .matrix-cell:disabled {
    opacity: 1;
  }
  .matrix-legend {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 13px;
  }
  .plant-profile {
    padding-top: 14px;
  }
  .profile-heading {
    display: flex;
    align-items: flex-start;
    gap: 22px;
  }
  .profile-heading > div {
    min-width: 0;
  }
  .profile-heading h3 {
    font-size: 32px;
    line-height: 1.15;
    margin: 12px 0;
  }
  .profile-heading i {
    color: var(--gp-muted);
  }
  .profile-condition {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    font-size: 13px;
    margin: 10px 0;
  }
  .profile-condition strong {
    color: var(--gp-muted);
    font-weight: 500;
  }
  .profile-description {
    color: var(--gp-muted);
    white-space: pre-wrap;
  }
  .profile-facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin: 16px 0 26px;
  }
  .profile-facts > div {
    background: var(--gp-soft);
    padding: 18px;
    border-radius: 16px;
    min-width: 0;
  }
  .profile-facts dt {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--gp-muted);
  }
  .profile-facts dt svg {
    color: var(--gp-green);
  }
  .profile-facts dd {
    margin: 10px 0 0;
  }
  .profile-facts strong {
    display: block;
    font-size: 24px;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
  .profile-facts small {
    display: block;
    font-size: 11px;
    color: var(--gp-muted);
    margin-top: 12px;
  }
  .plant-profile > section {
    padding: 18px 0;
    border-top: 1px solid var(--gp-border);
  }
  .temperature-scale {
    height: 24px;
    border-radius: 16px;
    background: #ad8952;
    position: relative;
    overflow: hidden;
    margin: 22px 0 10px;
  }
  .temperature-scale > span {
    display: block;
    position: absolute;
    height: 100%;
    background: #397456;
  }
  .temperature-labels {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
    flex-wrap: wrap;
  }
  .temperature-profile p {
    font-size: 12px;
  }
  .profile-year-scroll {
    max-width: 100%;
    overflow: auto;
  }
  .profile-year-grid {
    display: grid;
    grid-template-columns: 90px repeat(12, minmax(27px, 1fr));
    min-width: 460px;
    gap: 3px;
    align-items: center;
  }
  .mini-month {
    text-align: center;
    font-size: 10px;
    color: var(--gp-muted);
  }
  .mini-title {
    font-size: 11px;
    min-height: 35px;
    border: 0;
    padding: 5px 0;
    justify-content: flex-start;
    background: transparent;
  }
  .mini-cell > span {
    display: block;
    position: relative;
    height: 13px;
    background: var(--gp-soft);
    border-radius: 3px;
    overflow: hidden;
  }
  .mini-cell .bar {
    display: block;
    position: absolute;
    height: 100%;
    background: var(--bar-color);
  }
  .neighbor-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .profile-text {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  @media (max-width: 600px) {
    .catalog-card-heading {
      gap: 12px;
    }
    .plant-photo {
      width: 72px;
      height: 72px;
    }
    .profile-photo {
      width: 100px;
      height: 130px;
    }
    .profile-heading {
      gap: 14px;
    }
    .profile-heading h3 {
      font-size: 25px;
    }
    .profile-facts > div {
      padding: 12px;
    }
    .profile-facts strong {
      font-size: 19px;
    }
    .image-editor {
      flex-wrap: wrap;
    }
    .image-editor > div {
      flex-basis: 100%;
    }
    .neighbor-matrix th,
    .neighbor-matrix td {
      width: 78px;
      min-width: 78px;
      max-width: 78px;
    }
    .neighbor-matrix tr > :first-child {
      width: 108px;
      min-width: 108px;
      max-width: 108px;
    }
  }

  .culture-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
  }
  .stock-panel {
    margin-top: 24px;
    scroll-margin-top: calc(var(--gp-sticky-top, 56px) + 80px);
  }
  .stock-total {
    font-weight: 600;
  }
  .stock-lot {
    border-top: 1px solid var(--gp-border);
    padding: 18px 0;
  }
  .stock-lot dl {
    display: grid;
    grid-template-columns: minmax(100px, 1fr) minmax(0, 1.4fr);
    gap: 6px 16px;
    font-size: 13px;
  }
  .stock-lot dd {
    margin: 0;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
  .culture-journal {
    margin: 24px 0;
  }
  .journal-entry {
    border: 1px solid var(--gp-border);
    border-radius: 16px;
    padding: 16px;
    margin: 12px 0;
  }
  .journal-entry time {
    display: block;
    font-size: 12px;
    color: var(--gp-muted);
    margin-top: 8px;
  }
  .journal-entry h4 {
    margin: 8px 0;
  }
  .journal-photo {
    aspect-ratio: 4 / 3;
    min-height: 120px;
    display: block;
    max-width: 100%;
    width: min(100%, 360px);
    max-height: 360px;
    border-radius: 14px;
    object-fit: contain;
    background: var(--gp-soft);
    margin: 14px 0;
  }
  .single-harvest {
    display: block;
    font-size: 22px;
    margin: 10px 0;
  }
  .harvest-total {
    background: var(--gp-soft);
    border-radius: 16px;
    padding: 18px;
    margin: 18px 0;
  }
  .harvest-total h3 {
    margin-top: 0;
  }
  .harvest-total-values {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px 24px;
  }
  .harvest-total-values strong {
    font-size: 24px;
  }
  .garden-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin: 20px 0;
  }
  .garden-actions button {
    min-height: 88px;
    flex-direction: column;
    font-size: 16px;
    padding: 16px 10px;
  }
  .garden-actions svg {
    width: 28px;
    height: 28px;
  }
  .garden-mode select {
    width: 100%;
    max-width: 100%;
  }
  .camera-input {
    margin-top: 12px;
  }
  .harvest-table-scroll {
    overflow: auto;
    max-height: 65dvh;
    border: 1px solid var(--gp-border);
    border-radius: 12px;
  }
  .harvest-table {
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    min-width: 720px;
    font-size: 13px;
  }
  .harvest-table th,
  .harvest-table td {
    padding: 12px;
    text-align: right;
    border-bottom: 1px solid var(--gp-border);
    white-space: nowrap;
  }
  .harvest-table thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--gp-card);
    white-space: normal;
  }
  .harvest-table tr > :first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--gp-card);
    text-align: left;
    min-width: 110px;
    max-width: 200px;
    white-space: normal;
  }
  .harvest-table thead th:first-child {
    z-index: 3;
  }
  @media (max-width: 600px) {
    .culture-tools {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 5px;
    }
    .culture-tools button {
      min-width: 0;
      padding: 8px 4px;
      font-size: 11px;
    }
    .stock-lot .section-head,
    .journal-entry .section-head {
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .garden-mode {
      padding: 16px;
    }
    .garden-actions button {
      min-height: 96px;
      font-size: 14px;
    }
    .harvest-table tr > :first-child {
      max-width: 130px;
    }
  }
  @media (max-width: 760px) {
    .garden-page .topbar .eyebrow,
    .garden-page .topbar p,
    .garden-page .topbar-action-label {
      display: none;
    }
    .garden-page .topbar h1 {
      font-size: 24px;
    }
    .garden-page .topbar {
      margin-bottom: 12px;
    }
    .garden-page .topbar .primary {
      width: 44px;
      padding: 8px;
    }
    .garden-page .garden-mode h3 {
      margin: 10px 0;
      font-size: 18px;
    }
    .garden-page .garden-actions {
      margin: 12px 0;
    }
    .garden-page .garden-actions button {
      min-height: 82px;
    }
  }
  .harvest-help,
  .harvest-extra {
    margin: 12px 0;
  }
  .harvest-help summary,
  .harvest-extra summary {
    cursor: pointer;
    min-height: 36px;
    font-size: 13px;
    color: var(--gp-muted);
  }
  .harvest-extra {
    grid-column: 1/-1;
  }

  garden-journal-photo.plant-photo,
  garden-journal-photo.profile-photo {
    --gp-photo-min-height: 0px;
    --gp-photo-ratio: 1;
  }
  .culture-card .catalog-facts dt {
    font-size: 11px;
    color: var(--gp-muted);
    margin-bottom: 4px;
  }
  .culture-card .catalog-facts dd {
    font-size: 13px;
  }
  .culture-profile-heading {
    display: flex;
    gap: 20px;
    align-items: center;
    margin: 16px 0;
  }
  .culture-profile-heading h3 {
    font-size: 25px;
  }
  .seed-table .stock-expanded > td {
    position: static;
    min-width: 0;
    max-width: none;
    width: auto;
    padding: 0;
  }
  .stock-expanded-body {
    position: sticky;
    left: 0;
    width: 100%;
    max-width: calc(100vw - 34px);
    white-space: normal;
  }
  .stock-expanded-body .stock-panel {
    margin: 0;
    border-radius: 0;
    border-left: 3px solid var(--gp-green);
  }
  .weather-settings {
    margin: 20px 0;
  }
  .weather-warning {
    border-left: 4px solid #ad8952;
  }
  .weather-hints h2 {
    margin-top: 0;
  }
`;
