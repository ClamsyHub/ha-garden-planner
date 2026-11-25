# Installation und Betrieb – Deutsch

[Projektübersicht](../../README.md) · [English](../en/README.md)

## Stand dieser Dokumentation: v0.1.14

Backend, Oberfläche und native HA-Anbindung sind implementiert. Die Integration
registriert ihr Seitenleisten-Panel automatisch und stellt fünf Zählsensoren
sowie einen Kalender für konkrete Aufgaben und dokumentierte Kulturereignisse
bereit. [Repository](https://github.com/ClamsyHub/ha-garden-planner) und
[aktuelle Veröffentlichung](https://github.com/ClamsyHub/ha-garden-planner/releases/latest)
sind öffentlich. Garden Planner ist im offiziellen
HACS-Community-Katalog aufgenommen. Entwicklung und Tests erfolgen außerhalb produktiver Dateien.

## Installation über HACS oder Marketplace

1. In HACS bzw. Home Assistant Marketplace nach **Garden Planner** suchen.
2. Den Eintrag öffnen und die aktuelle reguläre Version herunterladen/installieren.
3. Home Assistant nach der Installation neu starten.
4. Unter **Einstellungen → Geräte & Dienste → Integration hinzufügen** Garden Planner
   auswählen und bestätigen. Das Panel erscheint automatisch in der Seitenleiste.

Garden Planner ist im offiziellen Community-Katalog verfügbar.
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

Ab v0.1.7 erzeugt **Erinnerungen** einen persönlichen Aufgabenplan. Eigene Aufgaben lassen sich auch mit Leserecht erledigen; vorhandene Push-/E-Mail-Einstellungen erinnern an fällige Aufgaben. Auswahl und Erledigtstände mit der vollständigen HA-Konfiguration sichern. [Updatehinweise](../releases/v0.1.7.md).

Version **0.1.8** verbessert die Reaktionszeit der Erinnerungs-Checkboxen durch sofortige Anzeige und gebündeltes Speichern. Die mobile Matrix lässt mehr Platz für Tätigkeiten; Kalenderfilter und Datumsnavigation sind ausgerichtet. Filter schließen beim Klicken außerhalb oder mit Escape. Beim Verlassen der Seite den Speicherstatus abwarten. [Updatehinweise](../releases/v0.1.8.md).

Im **Gartenkalender** bilden **Tätigkeitszeiträume** auch Arbeiten an Obstbäumen und Sträuchern ab. **Düngen** und **Rückschnitt** besitzen eigene Farben und sind in der persönlichen Erinnerungsmatrix auswählbar. Alle gespeicherten Zeiträume bleiben erhalten. [Updatehinweise v0.1.9](../releases/v0.1.9.md).

Ab **v0.1.10** zeigen persönliche Aufgaben den vollständigen Tätigkeitszeitraum mit Beginn und Ende. Der Start bleibt der Termin für Erinnerungen. [Updatehinweise](../releases/v0.1.10.md).

## Nachbarn und Saatgut & Einkauf (v0.1.11)

Unter **Nachbarn** eine Pflanze auswählen und gute/schlechte Nachbarn aus dem bestehenden Katalog mehrfach zuordnen. Katalog-Verknüpfungen gelten automatisch in beide Richtungen und werden gemeinsam gespeichert. Ein Wechsel von gut zu schlecht ersetzt die bisherige Einordnung auf beiden Seiten. Freie Namen außerhalb des Katalogs sind optional (ein Name pro Zeile). Wird ein eindeutiger Katalogname dort eingegeben, verwendet die Oberfläche dessen vorhandene Pflanze. Bei mehrdeutigen Namen die Katalogauswahl verwenden. Freie Angaben ohne Katalogpflanze bleiben an der ausgewählten Pflanze gespeichert. Die Angaben sind eigene Erfahrungen; es werden keine Empfehlungen vorbesetzt. Vor dem Löschen einer verknüpften Pflanze die Zuordnungen entfernen oder die Pflanze archivieren.

**Saatgut & Einkauf** gehört zum gemeinsamen Garten, nicht zum persönlichen Benutzerprofil. Pro aktiver Pflanze genau einen Zustand wählen: **Vorhanden**, **Kaufen**, **Nicht benötigt** oder **Offen**. Ohne vorherige Angabe ist der Zustand offen. „Nicht benötigt“ passt z. B. zu Bäumen oder einer Saisonpause. Änderungen reagieren sofort und werden automatisch gebündelt gespeichert. Weitere Änderungen bleiben während laufender Anfragen möglich. Beim Wechsel in einen anderen Panel-Bereich wird die Speicherung abgewartet. Vor dem Schließen der App warten, bis der Speicherstatus verschwindet. Bei Fehlern wird kein Erfolg gemeldet; die Auswahl bleibt zur Prüfung erhalten. **Erneut speichern** oder **Auswahl verwerfen** erscheinen nur zur Fehlerbehandlung. Der Statusfilter **Kaufen** zeigt die Einkaufsauswahl. Bei einem konkurrierenden Schreibzugriff bleiben nicht gespeicherte Auswahlen erhalten; mit **Auswahl verwerfen** neu laden und erneut auswählen.

Nachbarn und Saatgut bearbeiten nur Nutzer mit Garten-Bearbeitungsrecht sowie Administratoren. Leser können beide Bereiche ansehen. Die Daten liegen an den Pflanzen in der Garten-SQLite-Datenbank und sind in Garten-JSON/CSV-Exporten und Datenbanksicherungen enthalten. Bestehende CSV-Dateien ohne die zusätzlichen Spalten bleiben importierbar. Seit v0.1.13 wird Datenbankschema 5 verwendet; Austauschformat 1 bleibt bestehen.

Das Erledigen einer gemeinsamen oder persönlichen Aufgabe erfordert nun eine Bestätigung mit Titel und Datum/Zeitraum. **Abbrechen** oder **Escape** ändern nichts. Wiederöffnen erfolgt weiterhin über die Aufgabenliste.

## Übersicht und Kalender-Quickfilter

Die Übersichtskacheln führen zu den passenden Daten: Pflanzen im Garten zur aktiven Pflanzenliste, Geplant zu geplanten Kulturen, Laufende Kulturen zu tatsächlich laufenden Kulturen und Erfolgreich dokumentiert zur nach Erfolg gefilterten Historie. Die Kulturen-/Historienfilter lassen sich dort wieder aufheben. Offene Aufgaben springt in schmalen Ansichten zu Nächste Gartenarbeiten; ist dieser Bereich im breiten Layout bereits sichtbar, bleibt die Scrollposition erhalten.

Beim Scrollen verschwinden Titel und Einleitung; die Übersichtskacheln bleiben unter der Navigation stehen. Auf kleinen Displays sind die Kacheln mit kurzen Beschriftungen in einer kompakten Reihe angeordnet. Der übrige Inhalt scrollt normal weiter.

In der Kalenderlegende eine Tätigkeit anklicken, um ausschließlich diese Tätigkeit anzuzeigen. Eine andere Tätigkeit ersetzt die Auswahl; ein zweiter Klick auf dieselbe Tätigkeit zeigt wieder alle. Kategorie- und Pflanzenfilter bleiben bestehen. Mehrfachauswahl ist weiterhin über das Tätigkeits-Dropdown möglich.


## Pflanzenbilder und neue Ansichten

Alle Hauptbereiche bieten „Zurück zur Übersicht“. Nachbarn werden zusätzlich als filterbare Matrix mit fixierten Zeilen-/Spaltennamen dargestellt; Zellen wechseln gegenseitig zwischen nicht zugeordnet, gut und ungünstig. Freie Nachbarn bleiben über „Nachbarn bearbeiten“ pflegbar.

Im Pflanzen- oder Sortenformular ein JPEG-, PNG- oder WebP-Bild bis 12 MiB wählen. Gespeichert wird nur eine lokale PNG-Vorschau (maximal 512 px und 80 KiB; weitere Verkleinerung je Motiv). Originale und Metadaten werden nicht aufbewahrt; HEIC vorher in JPEG umwandeln. Bilder lassen sich im Formular wieder entfernen und sind in Gartensicherungen und JSON/CSV enthalten. Der gesamte JSON-/CSV-Import ist weiterhin auf 20 MiB begrenzt. Die Detailansicht zeigt vorhandene Kennzahlen, Keimtemperaturen und Tätigkeitszeiträume; fehlende Werte werden nicht ergänzt oder geschätzt.


## Saatgutbestände, Tagebuch und Ernte (v0.1.12)

Unter **Saatgut & Einkauf** auf den Pflanzennamen oder **Bestände öffnen** klicken. Je Packung/Los Menge, Einheit, Kaufjahr, Haltbarkeit, Anbruchdatum, getestete Keimfähigkeit und Lagerort pflegen. Lose mit bekanntem Haltbarkeitsdatum werden zuerst nach Datum sortiert, anschließend nach Kaufjahr. Mengen verschiedener Einheiten werden nicht vermischt. Den verbliebenen Bestand nach einer Entnahme selbst anpassen. Einkaufsstatus und Bestandsmengen sind voneinander unabhängig.

Unter **Aktuelle Kulturen** zwischen **Kulturen & Aufgaben**, **Gartenmodus** und **Ernte & Auswertung** wechseln. In der Kultur die **Pflanzenanzahl für die Ertragsberechnung** eintragen. Beispiel: 20 Pflanzen und insgesamt 20 kg aus mehreren Ernten ergeben 1 kg pro Pflanze. Die frühere Aussaatmenge wird nicht als tatsächliche Pflanzenzahl interpretiert. Fehlt diese Zahl in einer beteiligten Kultur, bleibt der betreffende Durchschnitt offen. Auswertungen berücksichtigen nur Kulturen mit eingetragenen Ernten; keine Ernteaufzeichnung wird nicht als Nullertrag gewertet.

Im Gartenmodus eine Kultur auswählen und Foto, Beobachtung oder Einzelernten erfassen. **Aufgabe erledigen** führt zu den Gartenarbeiten mit der vorhandenen Sicherheitsfrage. Tagebucheinträge sind auch in den Kulturdetails verfügbar. Pro Eintrag ein Bild, mehrere Einträge ergeben den Fotoverlauf. Die Kamera ist geräte-/browserabhängig; alternativ JPEG/PNG/WebP auswählen. Gespeichert werden kleine lokale PNG-Vorschauen, keine Originalfotos. Einträge ändern den Kulturstatus nicht automatisch.

Einzelernten werden nach Erntedatum summiert: g und kg gemeinsam als kg, Stück separat. Pflanze, Sorte und Beet werden beim Erfassen festgehalten. Die aktuell eingetragene Pflanzenzahl wird je beitragender Kultur nur einmal pro Einheit/Gruppe gezählt und kann Auswertungen rückwirkend ändern. Filter und Gruppierungen erlauben Jahres-, Sorten- und Beetvergleiche.

Vor dem Update die gesamte HA-Konfiguration sichern. Die Migration auf Schema 4 erstellt außerdem eine automatische SQLite-Sicherung und ergänzt zwei Tabellen. Bestehende Pflanzen, Kulturen, Aufgaben und private Erinnerungen bleiben erhalten. JSON/CSV-Exporte enthalten nun neun Datentabellen einschließlich Fotos und Ernten; alte Exporte bleiben importierbar. Gesamtimportgrenze weiterhin 20 MiB. Bei Rückkehr zu einer älteren Integration eine vollständige kompatible Sicherung wiederherstellen. Danach HA neu starten und das Panel neu laden.

## Fotos, verschobene Aufgaben und Wetterhinweise

Unter **Aktuelle Kulturen → Bearbeiten** kann ein Kulturfoto hochgeladen werden. Die Karte zeigt das Foto; datierte Verlaufsfotos gehören weiterhin ins Tagebuch. Saatgutbestände öffnen direkt unter der ausgewählten Pflanzenzeile.

Offene Aufgaben lassen sich mit **Verschieben** auf einen neuen Termin setzen. Auch persönliche Pflanzen-Erinnerungen behalten diesen Termin nach einer Aktualisierung; die übrigen Jahrespläne ändern sich nicht. Vorhandene Push-/E-Mail-Einstellungen gelten für die neue Fälligkeit. Bereits versandte Nachrichten werden nicht zurückgenommen.

Gemeinsame Aufgaben können ein Tagesintervall und ein optionales Serienende erhalten. Erst beim bestätigten Erledigen entsteht genau eine Folgeaufgabe, gerechnet ab der bisherigen Fälligkeit. Überfällige Termine werden nicht übersprungen. Erledigt/unerledigt-Wechsel erzeugen keine doppelten Folgeaufgaben. Verschieben über das Serienende beendet die Wiederholung.

Administratoren können in den Einstellungen optional eine bestehende **weather.**-Entität, Vorschauzeit und Frost-Warnschwelle wählen. In der Übersicht und im Gartenmodus erscheinen Hinweise für aktive Kulturen, die beim Bearbeiten ausdrücklich als **im Freien** und **frostempfindlich** markiert wurden. Geplante, abgeschlossene und fehlgeschlagene Kulturen sind ausgenommen. Vorhersagen werden höchstens alle 15 Minuten abgefragt. Fehlende oder veraltete Vorhersagen gelten als unbekannt, niemals als Frostfreiheit. Wetterhinweise versenden keine zusätzlichen automatischen Nachrichten; die Wetterintegration kann selbst einen externen Dienst verwenden.

Fotos können auch direkt unter **Aktuelle Kulturen → Ereignis erfassen** hochgeladen oder über die Kameraauswahl aufgenommen werden. Jedes Ereignis hat sein eigenes optionales Bild im Kulturverlauf. Beim Bearbeiten bleibt es erhalten und kann ersetzt oder entfernt werden; das Kultur-Titelbild und das Tagebuch bleiben eigenständig.


## Beetplan (v0.1.13)

[Bedienung, Datensicherung und Grenzen](../bed-planner.md). Belegungen im Dialog vorbereiten, direkt im Beet platzieren und speichern. Vor dem Update vollständige HA-Sicherung erstellen; Schema 5 ergänzt zwei Tabellen und legt eine lokale Sicherung an.


## Languages / Sprachen

24 lokal mitgelieferte Sprachen; Auswahl in den Einstellungen oder automatisch über Home Assistant. [Sprachen, Auswahl und Übersetzungshinweise](../languages.md).
