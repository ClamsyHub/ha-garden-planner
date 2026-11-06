# Installation und Betrieb – Deutsch

[Projektübersicht](../../README.md) · [English](../en/README.md)

## Stand: Phase 5

Backend, Oberfläche und native HA-Anbindung sind implementiert. Die Integration
registriert ihr Seitenleisten-Panel automatisch und stellt fünf Zählsensoren
sowie einen Kalender für konkrete Aufgaben und dokumentierte Kulturereignisse
bereit. Kein öffentliches Repository, kein veröffentlichter Release und keine
Katalogaufnahme. Entwicklung und Tests erfolgen außerhalb produktiver Dateien.

## Isolierte Testinstallation

HA >=2026.6.0. Das vollständige Verzeichnis `custom_components/garden_planner/`
mit `www/` in das gleichnamige Verzeichnis der **separaten Testinstanz** kopieren.
HA neu starten. Unter **Einstellungen → Geräte & Dienste → Integration hinzufügen**
Garden Planner wählen und bestätigen. Das Panel **Garden Planner** erscheint in
der Seitenleiste. Kein YAML, keine zusätzliche Karte und kein Node.js erforderlich.
Es wird genau ein gemeinsamer Garten unterstützt. Mit allen unterstützten
Installationsarten soll dieselbe Integration funktionieren; tatsächlich geprüft
wurden die in [Validierung](../validation.md) angegebenen Umgebungen.

Nach freigegebener Veröffentlichung: das Repository als Typ **Integration** in
HACS/Marketplace hinzufügen, den geprüften Release installieren, HA neu starten
und die Integration hinzufügen. Die direkte Katalogsuche wird erst nach akzeptiertem
Aufnahme-PR verfügbar. GitHub-Veröffentlichung, Custom Repository und offizieller
Katalog sind drei getrennte Schritte.

## Bedienung und Berechtigungen

Die [Bedienungsanleitung mit Screenshots](../frontend.md) beschreibt Pflanzen,
Sorten, Anbauzeitfenster, tatsächliche Aussaaten und mehrjährige Historie.
Historische Momentaufnahmen bleiben bei späteren Stammdatenänderungen erhalten.
Erfolg wird ausdrücklich dokumentiert und nicht aus einem Abschluss abgeleitet.

Alle aktiven angemeldeten HA-Nutzer können den gemeinsamen Garten lesen.
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

Pro Aufgabe/Fenster und Datum wird höchstens **ein Versandversuch** ausgeführt.
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

HACS-/Marketplace-Installation aus veröffentlichten Releases, Katalogaufnahme
und physische Geräte sind noch nicht abschließend geprüft. Der Release-Check
bleibt gesperrt. [Prüfergebnisse und offene Punkte](../validation.md).
