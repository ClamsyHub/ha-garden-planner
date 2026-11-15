# Benachrichtigungen und Rollen / Notifications and roles

## Deutsch

Unter Einstellungen → Home-Assistant-Einstellungen steht jede aktive Person in einer Zeile. „Sehen“ erlaubt Zugriff auf Garden Planner, „Bearbeiten“ schließt Sehen ein. Administratoren behalten volle Rechte. Die Rechte gelten für das Panel und die Daten-API; native Home-Assistant-Sensoren und -Kalender besitzen ihre eigenen HA-Zugriffsregeln. Neue Installationen und Updates behalten zunächst den bisherigen Lesezugriff. Sobald eine explizite Leseliste gespeichert ist, müssen später hinzugefügte Benutzer freigeschaltet werden. Entfernte/inaktive Konten werden beim Bearbeiten der Tabelle nicht angeboten.

Push und E-Mail separat je Benutzer aktivieren und das **tatsächliche Ziel** auswählen. Der Benutzername bestimmt kein Gerät und keine E-Mail-Adresse automatisch. Beispiel: Benutzer 1, 2 und 3 erhalten jeweils einen eigenen Push-Kanal. Nur Benutzer 1 und 3 erhalten zusätzlich ihre jeweilige E-Mail-Entität oder eine ausdrücklich eingetragene Empfängeradresse.

- `notify.send_message`: vorhandene `notify.*`-Entität wählen, zum Beispiel eine in der SMTP-Integration eingerichtete Empfänger-Entität. Hier keine E-Mail-Adresse eintragen.
- Älterer gerätespezifischer Push-Dienst: z. B. `notify.mobile_app_telefon`; der Dienst selbst bestimmt das Gerät.
- Älterer E-Mail-Dienst: z. B. `notify.email`; in der E-Mail-Zeile eine Empfängeradresse eintragen. Garden Planner übergibt sie als `target`-Liste. Der Dienst muss dieses HA-Benachrichtigungsschema unterstützen.
- Bisheriger gemeinsamer Kanal: bleibt beim Update erhalten. Beim Aktivieren eines Benutzerziels wird er im Formular ausgeschaltet. Nur ausdrücklich wieder zuschalten, wenn zusätzlich an seine Standardempfänger gesendet werden soll.

Erinnerungen bleiben global ausgeschaltet, bis sie ausdrücklich aktiviert werden. Eine Tabellen-Checkbox allein versendet noch nichts. Keine Testnachrichten werden automatisch versendet. Dieselbe Kombination aus Dienst, Entität und Empfänger wird pro Termin nur einmal versucht, auch wenn mehrere Benutzer dasselbe Ziel auswählen. Unklare oder fehlgeschlagene Versuche werden nicht wiederholt; andere Ziele laufen weiter. Neue Ziele können noch nicht versuchte Termine der letzten sieben Tage erhalten. HA-Konfiguration mit sichern: Rollen und Empfänger gehören nicht zum Garten-JSON/CSV-Export.

### Meine Erinnerungen ab v0.1.7

Der eigenständige Menüpunkt **Erinnerungen** liegt zwischen **Beete & Standorte** und **Einstellungen**. Jede Person mit Leserecht kann hier ausschließlich ihre eigene Matrix ändern; Garten-Bearbeitungsrechte sind dafür nicht nötig. Pro Pflanze/Tätigkeit gilt die Auswahl für sämtliche zugehörigen Anbauzeiträume. Vorhandene Tätigkeiten starten aktiviert; fehlende sind ausgegraut. Neu hinzukommende Tätigkeiten sind zunächst aktiviert. Bestehende Abwahlen bleiben bei weiteren Zeiträumen derselben Tätigkeit erhalten, solange mindestens ein bisheriger Zeitraum bestehen bleibt. Sind alle bisherigen Zeiträume verschwunden und wird später neu angelegt, startet die Tätigkeit wieder aktiviert.

Die globale Erinnerungsfreigabe und ein vom Administrator eingerichtetes persönliches Versandziel bleiben erforderlich. Die Seite zeigt fehlende Voraussetzungen an. Manuelle Aufgaben werden weiterhin erinnert. Der gemeinsame Kanal ist nicht personenbezogen und bleibt unabhängig von der persönlichen Auswahl; für ausschließlich persönliche Zustellung ausgeschaltet lassen. Wer dieselbe Adresse/dasselbe Gerät mit anderen teilt, kann dort weiterhin deren gewünschte Erinnerungen sehen. Identische Ziele werden erst nach der persönlichen Auswahl pro Termin dedupliziert.

Die Auswahl liegt im nativen HA-Benutzerprofil und gehört zur HA-Konfigurationssicherung, nicht zum Gartenexport. Sie gilt bei der nächsten Versandprüfung; bereits laufende Sendungen können nicht zurückgerufen werden. Eine erneute Aktivierung kann noch nicht versuchte Termine im bestehenden Sieben-Tage-Nachholfenster einschließen.

## English

The settings table lists active HA users. Editing includes viewing; administrators retain full access. Permissions cover the Garden Planner panel and data API; native HA entities retain HA permissions. Existing viewing access is preserved until explicitly changed; new users need approval once an explicit reader list is saved.

Enable push and email independently per user, then map each to an actual device/service or notify entity. HA does not infer destinations from user names. Modern `notify.send_message` uses an existing notify entity; legacy email routes require an explicit address, passed as a `target` list. The preserved shared channel is switched off in the form when enabling an individual destination; explicitly re-enable it only to include additional shared recipients.

Global reminder activation remains opt-in. No test messages are sent. Identical destinations are deduplicated across users, and durable per-destination reservations prevent automatic retries after failures or restarts. One failed route does not block others. Newly configured destinations may receive unattempted dates from the seven-day catch-up window. Back up HA configuration to preserve permissions and recipient settings.

## Official references

- https://www.home-assistant.io/integrations/notify/
- https://www.home-assistant.io/integrations/smtp/

### My reminders from v0.1.7

Every authorized viewer can change only their own plant/activity matrix. Missing windows disable cells, while new activities default on. Choices persist in native HA user profiles and require HA configuration backups; garden exports do not include them. Personal notification routes and global delivery opt-in remain administrator-managed. Manual tasks and an explicitly enabled shared channel remain independent. Shared physical destinations can still receive another user's opted-in events; deduplication runs after personal filtering. Already-started sends cannot be recalled.
