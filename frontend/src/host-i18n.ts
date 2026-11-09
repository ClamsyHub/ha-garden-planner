import type { Language } from "./types";
const de = {
  multiFilterHint: "Mehrere Werte möglich. Ohne Auswahl werden alle angezeigt.",
  windowDetail: "Anbauzeitraum",
  recurringWindow: "Jährlich wiederkehrender Zeitraum",
  plantProfile: "Pflanzensteckbrief",
  openPlant: "Alle Pflanzendetails",
  editWindow: "Anbauzeitraum bearbeiten",
  windowExtra: "Regionale Hinweise und Quelle",
  fullWindowNote: "Vollständige Notiz anzeigen",

  jumpWindows: "Zeiträume",
  jumpObservations: "Beobachtungen",
  haMenu: "Home-Assistant-Menü öffnen",
  plantSections: "Pflanzenbereiche",
  allPlantInformation: "Alle Pflanzeninformationen anzeigen",
  optimalGermination: "Keimtemperatur (optimal)",
  germinationLimits: "Keimtemperatur (Grenzen)",
  germinationDuration: "Keimdauer",
  cultivationDuration: "Kulturdauer",
  plantRowSpacing: "Pflanz- / Reihenabstand",

  sharedChannelEnabled:
    "An bisherigen gemeinsamen Kanal senden (ggf. zusätzliche Empfänger)",
  userRoles: "Benutzer und Benachrichtigungen",
  haUser: "Home-Assistant-Benutzer",
  canView: "Garden Planner sehen",
  canEdit: "Garden Planner bearbeiten",
  administrator: "Administrator · volle Rechte",
  push: "Push erhalten",
  email: "E-Mail erhalten",
  routeDestination: "Gerät / Versandziel",
  missingDestination: "nicht verfügbar",
  emailRecipient: "Empfänger-E-Mail-Adresse",
  sidebarHint:
    "Entzogenes Leserecht blendet den Menüpunkt in der nativen HA-Seitenleiste aus. Andere Menüeinträge bleiben unverändert. Administratoren behalten Zugriff. Bereits geöffnete Ansichten verlieren ihre Datenberechtigung; bei älteren Clients kann Neuladen nötig sein.",
  rolesHint:
    "Administratoren haben immer volle Rechte. Bearbeiten schließt Sehen ein. Diese Rechte schützen die Garden-Planner-Oberfläche und ihre Datenzugriffe; native HA-Entitäten unterliegen zusätzlich den Home-Assistant-Rechten.",
  routeHint:
    "Push und E-Mail lassen sich je Benutzer getrennt aktivieren. Wähle das tatsächliche Gerät oder die E-Mail-Entität; Home Assistant ordnet diese Ziele nicht automatisch einem Benutzer zu. Es werden keine Testnachrichten gesendet. Identische Versandziele werden pro Termin nur einmal angesprochen.",

  integrationSettings: "Home-Assistant-Einstellungen",
  writers: "Bearbeiten erlauben",
  settingsSaved: "Einstellungen gespeichert.",
  reminders_enabled: "Erinnerungen ausdrücklich aktivieren",
  lead_days: "Vorlaufzeit (Tage)",
  reminder_hour: "Versand ab Stunde (HA-Zeitzone)",
  notify_service: "Bisheriger gemeinsamer Kanal (optional)",
  notify_entity: "Benachrichtigungs-Entität",
  reminderLanguage: "Sprache der Erinnerungen",
  reminderInfo:
    "Nur gespeicherte Zeitfenster und Aufgaben werden berücksichtigt. Es werden keine Pflegezeitpunkte geschätzt. Pro Termin erfolgt höchstens ein Versandversuch; ein unklar fehlgeschlagener Versuch wird nicht automatisch wiederholt.",
  reminderCatchup:
    "Nach einer Unterbrechung werden Termine bis zu sieben Tage rückwirkend berücksichtigt. Die Aktivierung kann solche noch nicht versuchten Termine einschließen.",
  noChannel: "Kein Kanal gewählt",
  noSensor: "Sensor nicht verfügbar",
  badTemperatureUnit: "Keine vergleichbare Temperatureinheit",
  liveTemperature: "Aktuelle Messung",
  outsideRange:
    "Die Keimsubstrattemperatur liegt außerhalb des hinterlegten optimalen Keimbereichs.",
  notComparable:
    "Diese Messart ist keine direkte Messung des Keimsubstrats. Es erfolgt kein automatischer Keimtemperatur-Vergleich.",
  deliveryLog: "Versandprotokoll",
  sent: "Versendet",
  reserved: "Reserviert / Ergebnis offen",
  uncertain: "Ergebnis unklar, keine automatische Wiederholung",
  noDeliveries: "Noch keine Versandversuche.",
  grantedEditor: "Du hast eine Bearbeitungsfreigabe für diesen Garten.",
  notifyEntityHint:
    "Eine Benachrichtigungs-Entität ist eine vorhandene HA-Kennung wie notify.mail_martin, keine E-Mail-Adresse. Bei notify.send_message hier eine solche Entität wählen; SMTP-Empfänger werden in Home Assistant eingerichtet. Bei einem älteren Dienst wie notify.email bleibt dieses Entitätsfeld leer. Für getrennte Empfänger verwende die Benutzertabelle mit eigener E-Mail-Adresse je Benutzer. Bei Aktivierung eines Benutzerziels wird der bisherige gemeinsame Kanal ausgeschaltet. Nur wenn ausdrücklich wieder zugeschaltet, sendet er zusätzlich an seine konfigurierten Standardempfänger.",
};
const en: Record<keyof typeof de, string> = {
  multiFilterHint: "Select multiple values. An empty selection shows all.",
  windowDetail: "Growing window",
  recurringWindow: "Annually recurring window",
  plantProfile: "Plant profile",
  openPlant: "All plant details",
  editWindow: "Edit growing window",
  windowExtra: "Regional notes and source",
  fullWindowNote: "Show complete note",

  jumpWindows: "Windows",
  jumpObservations: "Observations",
  haMenu: "Open Home Assistant menu",
  plantSections: "Plant sections",
  allPlantInformation: "Show all plant information",
  optimalGermination: "Germination temperature (optimal)",
  germinationLimits: "Germination temperature (limits)",
  germinationDuration: "Germination days",
  cultivationDuration: "Cultivation days",
  plantRowSpacing: "Plant / row spacing",

  sharedChannelEnabled:
    "Send to existing shared channel (may include additional recipients)",
  userRoles: "Users and notifications",
  haUser: "Home Assistant user",
  canView: "View Garden Planner",
  canEdit: "Edit Garden Planner",
  administrator: "Administrator · full access",
  push: "Receive push",
  email: "Receive email",
  routeDestination: "Device / destination",
  missingDestination: "unavailable",
  emailRecipient: "Recipient email address",
  sidebarHint:
    "Revoking viewing hides the native HA sidebar link and keeps other entries unchanged. Administrators retain access. Already-open views lose data access; older clients may need a reload.",
  rolesHint:
    "Administrators always have full access. Editing includes viewing. These permissions protect the Garden Planner panel and its data API; native HA entities also follow Home Assistant permissions.",
  routeHint:
    "Enable push and email independently for each user. Select the actual device or email entity; Home Assistant does not automatically assign destinations to users. No test messages are sent. Identical destinations receive at most one attempt per date.",

  integrationSettings: "Home Assistant settings",
  writers: "Allow editing",
  settingsSaved: "Settings saved.",
  reminders_enabled: "Explicitly enable reminders",
  lead_days: "Lead time (days)",
  reminder_hour: "Send from hour (HA timezone)",
  notify_service: "Existing shared channel (optional)",
  notify_entity: "Notification entity",
  reminderLanguage: "Reminder language",
  reminderInfo:
    "Only stored windows and tasks are considered. No care dates are guessed. At most one delivery attempt is made per date; an uncertain failed attempt is not automatically repeated.",
  reminderCatchup:
    "After downtime, dates up to seven days in the past are considered. Enabling reminders may include such dates that have not been attempted yet.",
  noChannel: "No channel selected",
  noSensor: "Sensor unavailable",
  badTemperatureUnit: "No comparable temperature unit",
  liveTemperature: "Current measurement",
  outsideRange:
    "The germination substrate temperature is outside the recorded optimal germination range.",
  notComparable:
    "This measurement is not a direct germination-substrate reading. No automatic germination comparison is made.",
  deliveryLog: "Delivery log",
  sent: "Sent",
  reserved: "Reserved / result pending",
  uncertain: "Result uncertain, no automatic retry",
  noDeliveries: "No delivery attempts yet.",
  grantedEditor: "You have permission to edit this shared garden.",
  notifyEntityHint:
    "A notification entity is an existing HA identifier such as notify.mail_martin, not an email address. Select it for notify.send_message; configure SMTP recipient entities in Home Assistant. Leave this field empty for legacy services such as notify.email. Use the user table with an explicit recipient address for separate legacy email recipients. Enabling a user destination switches off the existing shared channel. It sends additionally to its configured defaults only if explicitly switched back on.",
};
export function hostText(language: Language, key: string): string | undefined {
  return (language === "de" ? de : en)[key as keyof typeof de];
}
