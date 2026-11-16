# Benachrichtigungen und Rollen / Notifications and roles

## Deutsch

Unter Einstellungen → Home-Assistant-Einstellungen steht jede aktive Person in einer Zeile. „Sehen“ erlaubt Zugriff auf Garden Planner, „Bearbeiten“ schließt Sehen ein. Administratoren behalten volle Rechte. Die Rechte gelten für das Panel und die Daten-API; native Home-Assistant-Sensoren und -Kalender besitzen ihre eigenen HA-Zugriffsregeln. Neue Installationen und Updates behalten zunächst den bisherigen Lesezugriff. Sobald eine explizite Leseliste gespeichert ist, müssen später hinzugefügte Benutzer freigeschaltet werden. Entfernte/inaktive Konten werden beim Bearbeiten der Tabelle nicht angeboten.

Push und E-Mail separat je Benutzer aktivieren und das **tatsächliche Ziel** auswählen. Der Benutzername bestimmt kein Gerät und keine E-Mail-Adresse automatisch. Beispiel: Benutzer 1, 2 und 3 erhalten jeweils einen eigenen Push-Kanal. Nur Benutzer 1 und 3 erhalten zusätzlich ihre jeweilige E-Mail-Entität oder eine ausdrücklich eingetragene Empfängeradresse.

- `notify.send_message`: vorhandene `notify.*`-Entität wählen, zum Beispiel eine in der SMTP-Integration eingerichtete Empfänger-Entität. Hier keine E-Mail-Adresse eintragen.
- Älterer gerätespezifischer Push-Dienst: z. B. `notify.mobile_app_telefon`; der Dienst selbst bestimmt das Gerät.
- Älterer E-Mail-Dienst: z. B. `notify.email`; in der E-Mail-Zeile eine Empfängeradresse eintragen. Garden Planner übergibt sie als `target`-Liste. Der Dienst muss dieses HA-Benachrichtigungsschema unterstützen.
- Bisheriger gemeinsamer Kanal: bleibt beim Update erhalten. Beim Aktivieren eines Benutzerziels wird er im Formular ausgeschaltet. Nur ausdrücklich wieder zuschalten, wenn zusätzlich an seine Standardempfänger gesendet werden soll.

Erinnerungen bleiben global ausgeschaltet, bis sie ausdrücklich aktiviert werden. Eine Tabellen-Checkbox allein versendet noch nichts. Keine Testnachrichten werden automatisch versendet. Dieselbe Kombination aus Dienst, Entität und Empfänger wird pro Termin nur einmal versucht, auch wenn mehrere Benutzer dasselbe Ziel auswählen. Unklare oder fehlgeschlagene Versuche werden nicht wiederholt; andere Ziele laufen weiter. Neue Ziele können noch nicht versuchte Termine der letzten sieben Tage erhalten. HA-Konfiguration mit sichern: Rollen und Empfänger gehören nicht zum Garten-JSON/CSV-Export.

### Mein Aufgabenplan ab v0.1.7

Der Menüpunkt **Erinnerungen** liegt zwischen **Beete & Standorte** und **Einstellungen**. Jede Person mit Leserecht ändert ausschließlich ihre eigene Pflanzen-/Tätigkeiten-Matrix, auch ohne Bearbeitungsrecht für gemeinsame Gartendaten. Vorhandene Tätigkeiten starten aktiviert; fehlende sind ausgegraut. Neue Tätigkeiten und vollständig ersetzte Zeiträume starten aktiviert. Weitere Zeiträume bei fortbestehendem ursprünglichem Zeitraum behalten eine bestehende Abwahl.

Die Auswahl erzeugt persönliche Einträge unter **Nächste Gartenarbeiten**, in der Wochenansicht und unter **Aktuelle Kulturen → Alle Gartenarbeiten**. Termine entsprechen dem Beginn eines Anbauzeitraums; ungefähr die nächsten zwölf Monate werden vorbereitet. Neue vergangene Termine werden höchstens sieben Tage rückwirkend angelegt. Bestehende überfällige Aufgaben bleiben offen, bis man sie erledigt. Eine eigene Aufgabe darf auch ein Nutzer mit reinem Leserecht erledigen oder wieder öffnen. Der Erledigtstand bleibt erhalten; für das nächste Gartenjahr entsteht ein neuer Eintrag.

Abwahl und entfernte/archivierte Quellen blenden zugehörige offene Aufgaben aus; erledigte Historie bleibt erhalten. Erneutes Aktivieren erzeugt keine Duplikate. Datumsänderungen ersetzen offene Termine. Die Planung funktioniert auch bei global ausgeschaltetem Benachrichtigungsversand.

Die **Aufgaben** werden mit den bestehenden Push-/E-Mail-Einstellungen erinnert: globale Aktivierung, persönliches Versandziel, Vorlauf und Versandstunde bleiben erforderlich. Alle 15 Minuten wird geprüft. Die Matrix sendet keine eigenständige Nachricht. Erledigte Aufgaben werden nicht benachrichtigt; bestehende Versandreservierungen verhindern Wiederholungen auch nach Neustarts. Bereits gestartete Sendungen können nicht zurückgerufen werden. Erneute Aktivierung kann noch nicht versuchte Aufgaben im Sieben-Tage-Nachholfenster einschließen.

Manuelle gemeinsame Aufgaben gehen weiterhin an die konfigurierten gemeinsamen bzw. persönlichen Kanäle. Generierte persönliche Aufgaben gehen ausschließlich an die persönlichen Ziele des jeweiligen Nutzers. Ein gemeinsamer Kanal erhält keine personenbezogenen Aufgaben. Wer ein Gerät/eine Adresse mit anderen teilt, kann dort weiterhin deren gewählte Aufgabenbenachrichtigungen sehen; identische Ziele werden pro Anbautermin erst nach der Nutzerzuordnung dedupliziert.

Auswahl und persönliche Aufgaben einschließlich Erledigtständen gehören zur vollständigen HA-Konfigurationssicherung. Ein Garten-JSON/CSV-Export oder eine reine Garten-Datenbanksicherung enthält sie nicht. Persönliche Aufgaben erscheinen nur nutzerbezogen im Garden-Planner-Panel, nicht in gemeinsamen HA-Kalender-/Zählsensoren.

## English

The settings table lists active HA users. Editing includes viewing; administrators retain full access. Permissions cover the Garden Planner panel and data API; native HA entities retain HA permissions. Existing viewing access is preserved until explicitly changed; new users need approval once an explicit reader list is saved.

Enable push and email independently per user, then map each to an actual device/service or notify entity. HA does not infer destinations from user names. Modern `notify.send_message` uses an existing notify entity; legacy email routes require an explicit address, passed as a `target` list. The preserved shared channel is switched off in the form when enabling an individual destination; explicitly re-enable it only to include additional shared recipients.

Global reminder activation remains opt-in. No test messages are sent. Identical destinations are deduplicated across users, and durable per-destination reservations prevent automatic retries after failures or restarts. One failed route does not block others. Newly configured destinations may receive unattempted dates from the seven-day catch-up window. Back up HA configuration to preserve permissions and recipient settings.

## Official references

- https://www.home-assistant.io/integrations/notify/
- https://www.home-assistant.io/integrations/smtp/

### My task plan from v0.1.7

Every authorized viewer can choose their own plant/activity matrix and complete their generated tasks. Missing windows disable cells; available activities start enabled. The matrix generates private tasks for roughly the next twelve months, using each window's start date. New overdue work is caught up for at most seven days; existing unfinished work remains visible. Completion persists across restarts and years; new annual occurrences receive separate IDs. Deselecting or removing a source cancels open work but preserves completed history.

Existing global opt-in, personal routes, lead time, dispatch hour and 15-minute checks notify due tasks. The matrix itself never sends directly. Already-started sends cannot be recalled. Shared manual work still uses the existing channels; personal work goes only to the owning user's personal routes. Shared physical destinations may receive another user's selected work. Personal selections and task histories require a full HA configuration backup, not just a garden export/database backup. Shared HA calendar/count entities do not expose private task data.
