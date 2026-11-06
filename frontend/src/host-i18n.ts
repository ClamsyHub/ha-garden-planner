import type { Language } from "./types";
const de = {
  integrationSettings: "Home-Assistant-Einstellungen",
  writers: "Bearbeiten erlauben",
  settingsSaved: "Einstellungen gespeichert.",
  reminders_enabled: "Erinnerungen ausdrücklich aktivieren",
  lead_days: "Vorlaufzeit (Tage)",
  reminder_hour: "Versand ab Stunde (HA-Zeitzone)",
  notify_service: "Benachrichtigungskanal",
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
    "Für notify.send_message eine vorhandene notify-Entität wählen. Andere notify-Dienste benötigen gewöhnlich keine zusätzliche Entität.",
};
const en: Record<keyof typeof de, string> = {
  integrationSettings: "Home Assistant settings",
  writers: "Allow editing",
  settingsSaved: "Settings saved.",
  reminders_enabled: "Explicitly enable reminders",
  lead_days: "Lead time (days)",
  reminder_hour: "Send from hour (HA timezone)",
  notify_service: "Notification channel",
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
    "For notify.send_message choose an existing notify entity. Other notify services usually do not need an extra entity.",
};
export function hostText(language: Language, key: string): string | undefined {
  return (language === "de" ? de : en)[key as keyof typeof de];
}
