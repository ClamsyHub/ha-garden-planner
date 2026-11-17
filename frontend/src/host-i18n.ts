import type { Language } from "./types";
const de = {
  neighbors: "Nachbarn",
  seeds: "Saatgut & Einkauf",
  goodNeighbors: "Gute Nachbarn",
  badNeighbors: "Schlechte Nachbarn",
  editNeighbors: "Nachbarn bearbeiten",
  neighborIntro:
    "Pflege deine eigenen Mischkultur-Erfahrungen. Katalog-Zuordnungen gelten automatisch für beide Pflanzen.",
  chooseNeighborPlant: "Pflanze auswählen",
  neighborSearch: "Nachbarn suchen",
  extraGoodNeighbors: "Weitere gute Nachbarn (ein Name pro Zeile)",
  extraBadNeighbors: "Weitere schlechte Nachbarn (ein Name pro Zeile)",
  freeNeighbor: "Freie Angabe",
  noNeighbors: "Noch keine Nachbarn zugeordnet.",
  neighborConflict:
    "Bitte ordne jeden Nachbarn nur einer Gruppe zu und wähle nicht die Pflanze selbst. Bei gleichen Pflanzennamen nutze die Katalogauswahl.",
  seedIntro:
    "Gemeinsame Saatgutplanung für deinen Pflanzenkatalog. Wähle je Pflanze einen Status; mehrere Änderungen lassen sich gesammelt speichern. Beim Wechsel in einen anderen Bereich werden sie ebenfalls gespeichert.",
  seed_available: "Vorhanden",
  seed_buy: "Kaufen",
  seed_unneeded: "Nicht benötigt",
  seed_unplanned: "Offen",
  seedPending: "Ungespeicherte Änderungen",
  saveSeed: "Änderungen speichern",
  discardSeed: "Auswahl verwerfen",
  seedFilter: "Status filtern",
  seedAll: "Alle Zustände",
  seedHint:
    "„Nicht benötigt“ passt zu Bäumen, Sträuchern oder einer Pause. „Offen“ bedeutet: noch nicht entschieden. Bei einem Änderungskonflikt Auswahl verwerfen und neu auswählen.",
  completeTaskTitle: "Gartenarbeit erledigen?",
  completeTaskBody:
    "Möchtest du diese Aufgabe wirklich als erledigt markieren? Sie wird anschließend aus „Nächste Gartenarbeiten“ ausgeblendet.",
  confirmTask: "Ja, als erledigt markieren",

  savingReminders: "Änderungen werden gespeichert …",
  matrixScrollHint: "Für weitere Tätigkeiten seitlich wischen.",
  reminders: "Erinnerungen",
  personalTask: "Meine geplante Gartenarbeit",
  personalSubtitle: "Wähle, woran du erinnert werden möchtest.",
  personalUnavailable:
    "Persönliche Erinnerungen sind nur in der Home-Assistant-Integration verfügbar.",
  personalIntro:
    "Dein persönlicher Aufgabenplan. Markierte Tätigkeitszeiträume erzeugen Gartenarbeiten unter „Nächste Gartenarbeiten“. Deine Auswahl wird automatisch gespeichert.",
  personalGlobalOn: "Der Erinnerungsversand ist global aktiviert.",
  personalGlobalOff:
    "Der Erinnerungsversand ist global ausgeschaltet. Deine Gartenarbeiten werden trotzdem angelegt; ein Administrator muss den Versand aktivieren.",
  personalChannelOn: "Persönliche Versandziele sind eingerichtet.",
  personalChannelOff:
    "Für dich ist noch kein persönliches Versandziel aktiviert. Bitte einen Administrator um die Einrichtung von Push oder E-Mail.",
  personalNoWindow: "Kein Tätigkeitszeitraum für diese Tätigkeit vorhanden.",
  personalHint:
    "Vorhandene Tätigkeiten sind zunächst aktiviert. Ohne Tätigkeitszeitraum bleibt die Checkbox ausgegraut. Kommt eine Tätigkeit neu hinzu, ist sie zunächst aktiviert. Deine Abwahl entfernt zugehörige offene Aufgaben. Erledigte Einträge bleiben erhalten. Aufgaben entstehen für die nächsten zwölf Monate und lassen sich als erledigt markieren. Push und E-Mail folgen den vorhandenen Einstellungen. Beim Speichern wird keine Testnachricht gesendet.",
  personalSharedHint:
    "Zusätzlich ist ein gemeinsamer Kanal aktiviert. Er erinnert weiterhin an manuelle gemeinsame Aufgaben. Persönlich erzeugte Gartenarbeiten gehen ausschließlich an deine persönlichen Versandziele.",
  multiFilterHint: "Mehrere Werte möglich. Ohne Auswahl werden alle angezeigt.",
  windowDetail: "Tätigkeitszeitraum",
  recurringWindow: "Jährlich wiederkehrender Zeitraum",
  plantProfile: "Pflanzensteckbrief",
  openPlant: "Alle Pflanzendetails",
  editWindow: "Tätigkeitszeitraum bearbeiten",
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
  neighbors: "Neighbors",
  seeds: "Seeds & shopping",
  goodNeighbors: "Good neighbors",
  badNeighbors: "Bad neighbors",
  editNeighbors: "Edit neighbors",
  neighborIntro:
    "Record your own companion-planting observations. Catalog links automatically apply to both plants.",
  chooseNeighborPlant: "Select plant",
  neighborSearch: "Search neighbors",
  extraGoodNeighbors: "Other good neighbors (one name per line)",
  extraBadNeighbors: "Other bad neighbors (one name per line)",
  freeNeighbor: "Free entry",
  noNeighbors: "No neighbors assigned yet.",
  neighborConflict:
    "Assign each neighbor to only one group and do not select the plant itself. For duplicate plant names, use catalog selection.",
  seedIntro:
    "Shared seed planning for your plant catalog. Select one state per plant and save changes together. Leaving this section also saves your choices.",
  seed_available: "Available",
  seed_buy: "Buy",
  seed_unneeded: "Not needed",
  seed_unplanned: "Undecided",
  seedPending: "Unsaved changes",
  saveSeed: "Save changes",
  discardSeed: "Discard choices",
  seedFilter: "Filter by state",
  seedAll: "All states",
  seedHint:
    "Use \u201cNot needed\u201d for trees, shrubs or a seasonal break. \u201cUndecided\u201d means no choice yet. If another edit conflicts, discard choices and select again.",
  completeTaskTitle: "Complete garden task?",
  completeTaskBody:
    "Mark this task as complete? It will be removed from Upcoming garden work.",
  confirmTask: "Yes, mark as complete",

  savingReminders: "Saving changes …",
  matrixScrollHint: "Swipe sideways for more activities.",
  reminders: "Reminders",
  personalTask: "My planned garden task",
  personalSubtitle: "Choose what you want to be reminded about.",
  personalUnavailable:
    "Personal reminders are available in the Home Assistant integration.",
  personalIntro:
    "Your personal task plan. Selected activity periods create tasks under Upcoming garden work. Your choices save automatically.",
  personalGlobalOn: "Reminder delivery is globally enabled.",
  personalGlobalOff:
    "Reminder delivery is globally disabled. Tasks are still generated; an administrator must enable notification delivery.",
  personalChannelOn: "Personal delivery destinations are configured.",
  personalChannelOff:
    "No personal delivery destination is enabled for you. Ask an administrator to configure push or email.",
  personalNoWindow: "No activity period exists for this activity.",
  personalHint:
    "Available activities start enabled. Missing windows disable the checkbox. Newly available activities start enabled. Opting out removes related open tasks; completed history is preserved. Tasks cover the next twelve months and can be completed. Push/email use the existing settings. Saving sends no test message.",
  personalSharedHint:
    "A shared channel is also enabled. It continues to notify shared manual tasks. Personal generated tasks go only to your personal delivery destinations.",
  multiFilterHint: "Select multiple values. An empty selection shows all.",
  windowDetail: "Activity period",
  recurringWindow: "Annually recurring window",
  plantProfile: "Plant profile",
  openPlant: "All plant details",
  editWindow: "Edit activity period",
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
