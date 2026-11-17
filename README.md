# Garden Planner

![Garden Planner](custom_components/garden_planner/brand/icon.png)

**Deutsch** · [English](docs/en/README.md)

Lokaler Gartenkalender für Aussaat, Pflanzung, Pflege, Düngen, Rückschnitt und Ernte in Home Assistant.

**Öffentliche Entwicklungsversion: [neueste Veröffentlichung](https://github.com/ClamsyHub/ha-garden-planner/releases/latest).**
Automatisches Seitenleisten-Panel, Live-Temperaturen, Sensor-/Kalender-Entitäten,
Bearbeitungsfreigaben und optionale Erinnerungen sind vorhanden. Dies ist eine
frühe Version 0.x, noch keine stabile Version 1.0.

Quellcode: [ClamsyHub/ha-garden-planner](https://github.com/ClamsyHub/ha-garden-planner).
Garden Planner ist im offiziellen HACS-Community-Katalog verfügbar. Live-Verzeichnisse werden nicht zur Entwicklung verwendet.

[![In HACS / Marketplace öffnen](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=ClamsyHub&repository=ha-garden-planner&category=integration)

**Änderungen v0.1.11:** Sicherheitsfrage vor dem Erledigen von Gartenarbeiten,
gegenseitige gute/schlechte Nachbarn mit Matrix und die automatisch speichernde Matrix **Saatgut & Einkauf**.
Pflanzen und Sorten unterstützen lokale Bilder; Pflanzenkarten und Detailprofile zeigen Kennzahlen und Jahresübersichten.
Klickbare Übersichtskacheln bleiben beim Scrollen sichtbar; die Kalenderlegende dient zusätzlich als Quick-Filter.
[Updatehinweise und Datensicherung](docs/releases/v0.1.11.md).

## Oberfläche

![Garden Planner im nativen Home Assistant](docs/screenshots/native-marketplace.png)

Eine zusammenhängende Anwendung mit zehn Bereichen:

1. **Übersicht:** hinterlegte Tätigkeitszeiträume des aktuellen Monats, Aufgaben und Kennzahlen.
2. **Gartenkalender:** Jahr, Monat und Woche mit Tagesgrenzen, Filtern, Notiz-Tooltips und Zeitraum-/Pflanzendetails.
3. **Meine Pflanzen:** Stammdaten, Sorten, mehrere Zeitfenster, Suche, Sortierung, Duplizieren und Archivieren.
4. **Aktuelle Kulturen:** Aussaat erfassen, bearbeiten und datierte Ereignisse dokumentieren; Aufgaben erledigen.
5. **Aussaat-Historie:** tatsächliche Aussaattermine und Ergebnisse über mehrere Jahre vergleichen.
6. **Beete & Standorte:** Standorte verwalten, optional Temperatursensor und Messart zuordnen.
7. **Erinnerungen (ab v0.1.7):** persönlicher Pflanzen-/Tätigkeiten-Aufgabenplan mit dauerhaftem Erledigtstand und Push/E-Mail über die bestehenden Einstellungen; auch mit reinem Leserecht.
8. **Nachbarn:** gute/schlechte Nachbarn aus dem Pflanzenkatalog; Zuordnungen gelten gegenseitig, freie Namen sind zusätzlich möglich.
9. **Saatgut & Einkauf:** gemeinsame Planung mit Vorhanden, Kaufen, Nicht benötigt und Offen; sofort reagieren und automatisch gebündelt speichern.
10. **Einstellungen:** Sprache, Bearbeitungsrechte, optionale Erinnerungen, JSON-/CSV-Export, Importvorschau und Sicherungen.

Deutsch und Englisch, Hell-/Dunkelmodus, Smartphone-/Tablet-/Desktop-Layout,
native zugängliche Dialoge, Tastaturbedienung und übersetzte Fehlerzustände.
Es gibt keine vorinstallierten Pflanzenempfehlungen. Alle Kalenderangaben stammen
aus eigenen Datensätzen; Quellen und regionale Hinweise bleiben bearbeitbar.

[Screenshots und Bedienung](docs/frontend.md) · [Prüfergebnisse](docs/validation.md)

## Lokale Speicherung

Pflanzen, Sorten, Anbauzeitfenster, Beete, Aussaaten, Ereignisse und Aufgaben werden
in SQLite auf einem eigenen Worker gespeichert. Wiederholte Aussaaten und
mehrjährige Historie bleiben erhalten. Historische Momentaufnahmen schützen den
Kontext einer Aussaat vor späteren Stammdatenänderungen. Revisionen verhindern
stilles Überschreiben paralleler Bearbeitungen und alter Formulare nach Restore.

JSON und strukturierte CSV-Tabellen erhalten IDs und Beziehungen. Die Oberfläche
packt CSV-Tabellen als ZIP. Ersetzungsimport und Restore erfordern Vorschau und
Bestätigung; vorher wird eine konsistente Sicherung erstellt. Programmcode und
Nutzerdaten liegen getrennt. Details: [Backend/API](docs/backend.md).

## Voraussetzungen und Installation

Sicherheitsminimum: Home Assistant **ab 2026.7.0**, einschließlich Container und anderer
unterstützter Installationsarten. Keine zusätzlichen Container, Cloud-Dienste oder
HACS-Karten. Das fertige Frontend liegt bereits im Integrationspaket; Nutzer werden
weder Node.js noch einen eigenen Build benötigen.

**Installation:** In HACS bzw. Home Assistant Marketplace nach **Garden Planner**
suchen und installieren. Anschließend HA neu starten und unter
**Einstellungen → Geräte & Dienste → Integration hinzufügen** Garden Planner
auswählen. Ein Custom Repository ist dafür nicht mehr erforderlich; es bleibt
als [Alternative](docs/de/README.md) dokumentiert.

Die Integration registriert das Panel automatisch; YAML und zusätzliche
Frontend-Ressourcen sind nicht erforderlich. Eine vollständige Einrichtung wurde
in einem separaten offiziellen HA-Container getestet. Für eigene Tests nur eine
isolierte Instanz verwenden. Installation und erneuter Download des veröffentlichten Pakets wurden mit HACS
und Marketplace in separaten HA-Containern getestet. Die lokale Vorschau verwendet einen
separaten Testadapter mit ausschließlich temporären Daten.

[Installation](docs/de/README.md) · [Lokale Vorschau](docs/frontend.md)

**Sicherheit:** HA vor 2026.7.0 enthält die kritische XSS-Lücke
[CVE-2026-91130](https://github.com/advisories/GHSA-wx4m-69m9-gx3m).
Die alte HA-2026.6-Testabhängigkeit wurde entfernt. Das höhere Minimum gilt für
den aktuellen Entwicklungsstand; veröffentlichte v0.1.0-Dateien werden nicht
nachträglich verändert. [Details](docs/security/CVE-2026-91130.md).

## Entwicklung und Prüfungen

Python >=3.14.2, Node.js >=22.12 (CI: Node 24), jeweils in einer isolierten Umgebung.

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev,ha-test]'
python scripts/check_repository.py
python -B -W error::ResourceWarning -m unittest discover -s tests -v
python -B -W error::ResourceWarning -m unittest discover -s ha_tests -v
ruff check .
ruff format --check .
mypy
```

Frontend aus `frontend/`:

```sh
npm ci --ignore-scripts
npm run typecheck
npm run format:check
npm test
npm run check:bundle
npx playwright install chromium webkit
npm run test:e2e
```

`check:bundle` baut neu und vergleicht JavaScript sowie Lizenzhinweise bytegenau
mit den vorhandenen Auslieferungsdateien. Änderungen zuerst bewusst mit
`npm run build` übernehmen. Browserprüfungen starten einen lokalen Python-
Testadapter und verwenden echte temporäre SQLite-Datenbanken. Kein Zugriff auf
produktive HA-Konfigurationen oder private Testdaten.

## Noch offen vor einem stabilen Release

Weitere Praxis-/Gerätetests und die Bewertung vor Version 1.0 stehen aus.
GitHub-Veröffentlichung, Custom-Repository-Installation und offizielle
HACS-Katalogaufnahme sind abgeschlossen: [Veröffentlichungsnachweis](docs/publication.md).
Die [Release-Checkliste](docs/releasing.md) bleibt für weitere Versionen verbindlich.
Administratoren bearbeiten und verwalten Freigaben; weitere aktive HA-Nutzer
lesen den gemeinsamen Garten, sofern ihnen Leserecht gewährt ist. Erinnerungen sind standardmäßig ausgeschaltet.
Ihre Aktivierung erfordert einen vorhandenen HA-Benachrichtigungskanal.
Details zu Versandversuchen, Sensoren und Datensicherung: [Betrieb](docs/de/README.md).

## Dokumentation und Lizenz

[Architektur](docs/architecture.md) · [Roadmap](docs/roadmap.md) ·
[Veröffentlichung](docs/releasing.md) · [Abhängigkeiten](docs/dependencies.md) ·
[Mitwirken](CONTRIBUTING.md) · [Sicherheit](SECURITY.md) · [Changelog](CHANGELOG.md)

Projektcode: [MIT](LICENSE). Mitgelieferte Bibliotheken behalten ihre eigenen
Lizenzen; [vollständige Laufzeit-Lizenzhinweise](docs/THIRD_PARTY_NOTICES.txt) werden
zusammen mit dem JavaScript-Paket ausgeliefert.

[Rollen und Benachrichtigungen](docs/notifications.md)

[Neue kompakte Smartphone-Pflanzendetails (synthetisches Beispiel)](docs/screenshots/plant-summary-mobile.png)
