# Installation und Betrieb – Deutsch

[Projektübersicht](../../README.md) · [English](../en/README.md)

## Stand dieser Dokumentation: v0.1.6

Backend, Oberfläche und native HA-Anbindung sind implementiert. Die Integration
registriert ihr Seitenleisten-Panel automatisch und stellt fünf Zählsensoren
sowie einen Kalender für konkrete Aufgaben und dokumentierte Kulturereignisse
bereit. [Repository](https://github.com/ClamsyHub/ha-garden-planner) und
[aktuelle Veröffentlichung](https://github.com/ClamsyHub/ha-garden-planner/releases/latest)
sind öffentlich. Seit dem 9. November 2026 ist Garden Planner im offiziellen
HACS-Community-Katalog aufgenommen. Entwicklung und Tests erfolgen außerhalb produktiver Dateien.

## Installation über HACS oder Marketplace

1. In HACS bzw. Home Assistant Marketplace nach **Garden Planner** suchen.
2. Den Eintrag öffnen und die aktuelle reguläre Version herunterladen/installieren.
3. Home Assistant nach der Installation neu starten.
4. Unter **Einstellungen → Geräte & Dienste → Integration hinzufügen** Garden Planner
   auswählen und bestätigen. Das Panel erscheint automatisch in der Seitenleiste.

Garden Planner ist seit dem 9. November 2026 im offiziellen Community-Katalog.
[Akzeptierter Aufnahme-PR #13526](https://github.com/hacs/default/pull/13526).
Bei einer verzögerten Katalogaktualisierung zunächst die Store-Liste aktualisieren.
Eine vorhandene Custom-Repository-Installation muss nicht neu eingerichtet werden;
Gartendaten und Einstellungen bleiben bei einem normalen Update erhalten.
Vor Updates die HA-Konfiguration sichern, anschließend HA neu starten und die Panel-Seite neu laden.

### Alternative: benutzerdefiniertes Repository

Falls der Eintrag noch nicht in der lokalen Suche erscheint: Unter **Benutzerdefiniertes
Repository / Custom Repository** `https://github.com/ClamsyHub/ha-garden-planner`
als Typ **Integration** hinzufügen (im Marketplace gegebenenfalls zuerst GitHub verbinden).
Die aktuelle reguläre Version installieren; Vorabversionen müssen nicht aktiviert werden.
Danach wie oben neu starten und die Integration hinzufügen.

### Isolierte Testinstallation

Sicherheitsminimum: HA >=2026.7.0. Für manuelle Tests das vollständige Verzeichnis
`custom_components/garden_planner/` mit `www/` in eine **separate Testinstanz** kopieren.
HA neu starten und Garden Planner unter Geräte & Dienste hinzufügen. Kein YAML,
keine zusätzliche Karte und kein Node.js erforderlich. Es wird ein gemeinsamer Garten unterstützt.
Tatsächlich geprüfte Umgebungen: [Validierung](../validation.md).

## Bedienung und Berechtigungen

Die [Bedienungsanleitung mit Screenshots](../frontend.md) beschreibt Pflanzen,
Sorten, Anbauzeitfenster, tatsächliche Aussaaten und mehrjährige Historie.
Historische Momentaufnahmen bleiben bei späteren Stammdatenänderungen erhalten.
Erfolg wird ausdrücklich dokumentiert und nicht aus einem Abschluss abgeleitet.

Standardmäßig können alle aktiven angemeldeten HA-Nutzer den gemeinsamen Garten lesen.
Administratoren können Leserechte pro Nutzer einschränken. Entzug blendet den
Garden-Planner-Link über die native HA-Seitenleisten-Einstellung aus und sperrt
Datenzugriffe. Erneute Freigabe stellt nur von Garden Planner ausgeblendete Links
wieder her; vorher manuell versteckte Links bleiben versteckt. Administratoren
behalten immer Zugriff, auch bei leerer Nutzerfreigabe. Andere Menüpunkte und
Reihenfolgen werden erhalten. Ältere geöffnete Clients gegebenenfalls neu laden.
Administratoren bearbeiten und können unter **Einstellungen → Home Assistant**
weitere aktive Nutzer als Bearbeiter freigeben. Das geht auch über den nativen
HA-Konfigurationsdialog der Integration. Import/Export, Sicherungen, Restore,
Versandprotokoll und globale Einstellungen bleiben Administratoren vorbehalten.
Es gibt keine getrennten privaten Gärten pro Benutzer.

## Temperatursensoren

Bei einem Standort optional einen vorhandenen Temperatursensor auswählen und die
Messart **Luft**, **Boden** oder **Keimsubstrat** angeben. Die Anzeige verarbeitet
°C, °F und Kelvin. Nicht verfügbare Werte oder unbekannte Einheiten werden kenntlich
gemacht. Die Integration funktioniert vollständig ohne Sensoren.

Nur Keimsubstrat-Messungen werden mit einem ausdrücklich gepflegten optimalen
Keimtemperaturbereich verglichen. Luft- und Bodenwerte bleiben Information.
Bei Kulturen stammt der Vergleichsbereich aus ihrer historischen Momentaufnahme;
mehrere widersprüchlich anwendbare Zeitfenster ergeben keine eindeutige Empfehlung.
Es erfolgt keine automatische Rekonstruktion historischer Messwerte.

## Optionale Erinnerungen

Erinnerungen sind standardmäßig **aus**. Administratoren wählen einen vorhandenen
HA-`notify.*`-Kanal, Vorlauf (0–30 Tage), Startstunde (0–23, HA-Zeitzone) und Sprache.
Für `notify.send_message` zusätzlich eine vorhandene `notify.*`-Entität angeben.
Erst das ausdrückliche Speichern der Aktivierung erlaubt Benachrichtigungen.

Alle 15 Minuten ab der Startstunde werden gepflegte Anbauzeitfenster und offene
Aufgaben geprüft. Ein Fenster erinnert an seinen Anfang, nicht jeden Tag innerhalb
des Zeitraums. Die Prüfung berücksichtigt bis zu sieben verpasste Tage. Pikieren,
Pflege und Auspflanzen werden nur anhand selbst erfasster Aufgaben/Zeiträume
angekündigt; die Integration erfindet keine pflanzenspezifischen Termine.

Pro Aufgabe/Fenster, Datum und Versandziel wird höchstens **ein Versandversuch** ausgeführt.
Die Reservierung wird vor dem Aufruf des Kanals dauerhaft gespeichert. Nach einem
Fehler oder Timeout bleibt der Zustand unklar; es gibt keinen automatischen
Wiederholungsversuch. Das verhindert doppelte Nachrichten, kann aber eine nicht
zugestellte Erinnerung bedeuten. „Gesendet“ bedeutet erfolgreicher HA-Kanalaufruf,
keine Bestätigung des Endgeräts. Die Oberfläche zeigt die letzten 200 Versuche;
ältere Reservierungen bleiben zur Vermeidung von Duplikaten erhalten.

## Docker und Speicherung

Das HA-Verzeichnis dauerhaft als `/config` einbinden. Austauschbarer Code liegt
unter `/config/custom_components/garden_planner/`, Daten unter
`/config/garden_planner/`. Es ist kein zusätzlicher Container erforderlich.
Unser Docker-Test verwendet einen eigenen offiziellen HA-Container, temporäre
Konfiguration und ausschließlich einen lokalen Loopback-Port.

## Sicherung und Wiederherstellung

Die Oberfläche erstellt konsistente SQLite-Sicherungen inklusive bestätigter
WAL-Daten. Eine einzelne Datei einer laufenden WAL-Datenbank zu kopieren ist keine
sichere Sicherung. Vor Ersetzungsimport, Restore und Migration entsteht eine
zusätzliche Sicherung. Restore benötigt eine aktuelle Vorschau und Bestätigung;
Fehler rollen die Transaktion zurück. Ältere unterstützte Sicherungen werden in
einer temporären Kopie migriert.

JSON/CSV und der verwaltete Restore stellen die Gartendatensätze wieder her.
Bestehende Versandreservierungen werden dabei absichtlich nicht zurückgesetzt.
HA-Bearbeitungsrechte und Benachrichtigungsoptionen liegen im ConfigEntry und
gehören zusätzlich in eine vollständige HA-Konfigurationssicherung. Ein Gartenimport
aktiviert keine Erinnerungen. Backups sind unverschlüsselt und werden nicht
automatisch gelöscht; zusätzlich außerhalb der Instanz sichern und Speicher prüfen.
Updates und Entfernen der Integration löschen keine Gartendaten.

## Grenzen und Fehlerbehebung

Bei neueren oder fremden Datenbankschemata wird die Verarbeitung abgelehnt;
Dateien nicht manuell überschreiben. Nach Programmupdates HA neu starten und die
Panel-Seite neu laden. Fehlende Sensordaten oder Benachrichtigungskanäle in HA
prüfen. Native Zählsensoren/Kalender aktualisieren nach Änderungen, zusätzlich
alle 15 Minuten. Allgemeine saisonale Fenster erscheinen im Garden-Planner-Panel;
der HA-Kalender enthält konkrete Aufgaben und Kulturereignisse.

Die Installation des veröffentlichten Pakets und erneuter Download/Neustart
sind in beiden Stores geprüft. Öffentliche Versionswechsel sind ebenfalls geprüft. Die Katalogaufnahme ist
abgeschlossen; weitere physische Gerätetests stehen aus. [Prüfergebnisse und offene Punkte](../validation.md).

[Rollen und Benachrichtigungen / Users and notifications](../notifications.md)

Ab v0.1.4 liegen Anbau-Messwerte nur an der Pflanze, Zeiträume gelten für alle Sorten. Die Datenmigration entfernt alte Sortenwerte und erstellt vorher eine Datenbanksicherung. Historische Momentaufnahmen bleiben erhalten. [Migration und Rollback](../releases/v0.1.4.md).

Ab v0.1.5 stehen die Kalenderansichten in der Reihenfolge Jahr / Monat / Woche. Tooltips zeigen Zeitraum-Notizen; Antippen oder Anklicken öffnet kompakte Zeitraumdetails mit Pflanzensteckbrief darunter. [Updatehinweise](../releases/v0.1.5.md).

Ab v0.1.6 ermöglichen die Kalenderfilter eine Mehrfachauswahl. Die Monatszeile und Eckzelle der Jahresliste sind fixiert. [Updatehinweise](../releases/v0.1.6.md).
