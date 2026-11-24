# Beetplan / Bed planner — v0.1.13 development

## Deutsch

**Beetplan** steht zwischen Gartenkalender und Meine Pflanzen. Wähle einen vorhandenen Standort und ein Saisonjahr. Ab Oktober wird zunächst das Folgejahr vorgeschlagen; das Jahr ist jederzeit änderbar.

### Form und Maßstab

Unter **Beetform & Maße** Breite und Höhe in Zentimetern eintragen. Rechteck, Kreis/Ellipse, Dreieck und U-Form dienen als Ausgangspunkte. Mit **Umriss zeichnen** Eckpunkte antippen; **Zeichnung übernehmen** schließt die Form. **Freihand zeichnen** nimmt einen gezogenen Umriss auf. Eckpunkte können gezogen oder mit cm-Koordinaten bearbeitet/entfernt werden. **Aussparung zeichnen** hält innenliegende Wege oder Hindernisse frei. Zum Scrollen auf Touchscreens **Ansicht scrollen** aktivieren; erneutes Antippen schaltet zurück zum Bearbeiten. Zoom verändert nur die Ansicht, nicht die Maße.

Speichern erfolgt ausdrücklich. Ungültige, selbstüberschneidende Umrisse oder sich berührende/überlappende Aussparungen werden abgewiesen. Bestehende Pflanzen müssen vor einer Formänderung innerhalb der neuen Fläche liegen. Eine leere gespeicherte Beetform kann gelöscht werden; belegte Formen und ihre Historie werden nicht automatisch entfernt. Grenzen: 20–10000 cm je Achse, 3–256 Umrisspunkte, maximal acht Aussparungen mit zusammen höchstens 256 Punkten.

### Saison, Pflanzen und Nachkulturen

**Belegung hinzufügen**: Pflanze, optional Sorte, Start-/Enddatum, Pflanzenanzahl und Pflanzen je Reihe wählen. Pflanzen- und Reihenabstand werden zunächst aus der Pflanze übernommen, bleiben für diese Belegung anpassbar. Die Position per Antippen, Ziehen oder X/Y-Koordinaten ändern und **Belegung speichern**. Eine Gruppe unterstützt bis zu 200 Pflanzen. Alle Pflanzenmittelpunkte müssen innerhalb der nutzbaren Fläche liegen. Abstandsflächen und farbige Nachbarschaftslinien helfen beim Platzieren.

Jede Belegung besitzt ihren eigenen Zeitraum. Dieselbe Fläche darf nacheinander mehrfach verwendet werden. Die Monatsübersicht filtert die Zeichnung; die Tabelle zeigt das gesamte ausgewählte Saisonjahr mit fixierten Überschriften. Exakte Daten stehen an jeder Belegung; Monatszellen sind ein vereinfachtes Raster. Räumliche Konflikte werden nur bei tatsächlicher Überschneidung der Zeiträume angezeigt; Anfangs- und Enddatum zählen jeweils mit.

Die Planung ist von tatsächlichen Kulturen getrennt. Eine passende vorhandene Kultur kann ausdrücklich verknüpft werden; Pflanze, Sorte und Standort müssen übereinstimmen. Planung legt weder Kulturen noch Aufgaben oder Benachrichtigungen automatisch an. Der Planungsstand „Tatsächlich bepflanzt“ oder „Abgeschlossen“ wird ausdrücklich gepflegt. Gemeinsames Bearbeitungsrecht gilt wie in den anderen Bereichen; Leser können gespeicherte Pläne ansehen.

### Nachbarn, Fruchtfolge und Saatgut

Gute/ungünstige Nachbarn stammen ausschließlich aus den gespeicherten gegenseitigen Pflanzenzuordnungen. Freie Nachbarn ohne Katalog-ID besitzen keine Position und werden deshalb nicht räumlich ausgewertet. Der einstellbare Prüfradius gilt in cm; unbekannte Zuordnungen gelten nicht als gute Nachbarn.

In **Meine Pflanzen → Bearbeiten** lässt sich die **Pflanzenfamilie** ausdrücklich pflegen, beispielsweise als einheitlich verwendeter botanischer Familienname. Es wird keine Familie aus dem Pflanzennamen geraten. Geplante Belegungen verwenden die aktuell gepflegte Familie und aktualisieren ihren Familienstand beim Speichern. Tatsächliche und abgeschlossene Belegungen behalten ihre historische Familie; spätere Stammdatenänderungen ändern sie nicht. Fehlende historische Angaben werden als unbekannt angezeigt. Die Anbaupause von 1–10 Jahren (Vorgabe: 3) gilt für das ganze Beet, nicht nur einzelne Positionen. Frühere tatsächliche/abgeschlossene Belegungen sowie frühere Kulturen mit bekannter Familie im selben Beet werden berücksichtigt; rein geplante alte Einträge belegen keinen tatsächlichen Anbau. Hinweise sind Planungshilfen und keine verbindlichen Anbauempfehlungen.

**Saisonbedarf · alle Beete** summiert geplante Pflanzen nach Pflanze/Sorte. Es vergleicht nur ausdrücklich in Samen gezählte Bestände. Gramm und Packungen bleiben unbekannte Mengen; Keimverluste, Keimfähigkeit und anderweitig verplante Samen werden nicht automatisch verrechnet. Der Einkaufsstatus wird nicht automatisch verändert.

### Speicherung und Update

Schema 5 ergänzt `bed_layouts` und `bed_plantings`; vorhandene Datensätze bleiben unverändert. Vor der Migration wird automatisch eine SQLite-Sicherung erstellt. Vor dem Update zusätzlich die komplette Home-Assistant-Konfiguration sichern. JSON/CSV/SQLite-Sicherungen enthalten Form, Belegungen, Beziehungen und Familienhistorie. Alte JSON-/CSV-Exporte aus Schema 1–4 werden weiterhin angenommen. Das Austauschformat bleibt 1. Ein Downgrade auf eine ältere Version benötigt eine passende vollständige Sicherung.

## English

**Bed planner** appears between Garden calendar and My plants. Select an existing location and season year. From October the following year is initially suggested. Dimensions and coordinates use centimeters; zoom changes the view only.

Start from a rectangle, circle/ellipse, triangle or U shape, or tap polygon corners / draw freehand. Apply closes the outline. Drag corners or edit their metric coordinates. Cut-outs reserve paths or obstacles; they must lie strictly inside the bed. Use **Scroll view** on touchscreens to pan without moving plants. Shapes are saved explicitly and invalid/self-crossing boundaries are rejected. Existing plant centers must remain inside the usable area when changing a shape. Empty layouts can be deleted; occupied layouts retain their history. Bounds: 20–10000 cm per axis, 3–256 outline vertices, up to eight cut-outs with 256 total vertices.

Add an occupancy with plant, optional variety, inclusive start/end dates, plant count and plants per row. Default spacing comes from the plant and is editable for this occupancy. Tap, drag or enter X/Y coordinates, then save. Each group supports up to 200 plants. A month filter controls the drawing; the timeline keeps the full season and pinned headings. Exact dates remain visible; month cells are a simplified grid. Succession on the same space is allowed; conflicts require temporal overlap.

Plans do not automatically create actual cultivations, tasks or notifications. Matching existing cultivations may be explicitly linked. Cultivation, plant, variety and bed must agree. Actual/completed planning states are user-managed. Existing garden edit permissions apply; readers can inspect saved plans. Stale revisions are rejected instead of overwriting another editor's changes.

Neighbor hints use only the stored reciprocal catalog relationships and the configured metric radius. Unmapped free names have no spatial location. Unknown neighbors are not treated as good. Explicit plant families support whole-bed rotation hints using historical family snapshots, previous actual/completed occupancies and past cultivations with known family in that bed. Families are never guessed from plant names. Planned occupancies use the current explicit family and refresh their snapshot on save; actual/completed history remains frozen. Missing historical families remain unknown. The resting interval is configurable from 1–10 years, default 3; these are planning hints, not agronomic guarantees.

Season requirements across beds sum planned plants by plant/variety. Only seed-count stock is compared numerically; grams/packets, germination losses and other reservations are not converted or automatically deducted. Shopping status is not changed automatically.

Schema 5 adds two tables without modifying existing records, with an automatic pre-migration backup. Back up the full HA configuration before updating. JSON/CSV/SQLite backups include geometry, occupancies and frozen families. Schema 1–4 JSON/CSV imports remain supported; exchange format stays 1. Downgrading requires a compatible full backup. No new runtime dependencies or external services are required.


Der aktive Zeichenmodus zeigt direkt über der Fläche eine Anleitung sowie **Zeichnung übernehmen**, **Letzten Punkt entfernen** und **Zeichnen abbrechen**. Nach der Übernahme ist **Beetform speichern** erforderlich; Abbrechen oder Escape lässt die bisherige Form bestehen. Drawing mode shows explicit apply/undo/cancel actions above the canvas; applying exits drawing and saving persists the shape.


## Überarbeitete Belegungsbedienung

„Belegung hinzufügen“ steht oben am Beet. Pflanze, Sorte, Menge, Pflanzen je Reihe und Zeitraum werden in einem Dialog gewählt. Die aufklappbare Pflanzenkarte enthält die gespeicherten Eigenschaften und Tätigkeitszeiträume als Jahresübersicht. Ein eindeutiger Zeitraum wird von Direktsaat/Auspflanzen bis zum Ernteende vorgeschlagen. Bei mehreren möglichen Fensterkombinationen ist eine ausdrückliche Auswahl erforderlich. Fehlende Fenster werden nicht durch geschätzte Termine ersetzt; manuelle und gespeicherte Termine bleiben erhalten. Vorschläge sind auf eine jährliche Belegung bis zu 366 Tagen begrenzt; längere Belegungen bleiben manuell möglich.

Mit „Im Beet platzieren“ schließt der Dialog. Das Beet behält seine Größe; eine Leiste direkt am Beet bietet „Angaben ändern“, „Belegung speichern“ und Abbrechen. Antippen oder Ziehen positioniert die Gruppe. Gute und ungünstige Nachbarn werden im überlappenden Belegungszeitraum unmittelbar mit grün/roten Markierungen, Symbolen und Namen angezeigt – auch während des Verschiebens. Unbekannte Beziehungen bleiben ausdrücklich unbekannt.

## Revised occupancy workflow

The add action is above the canvas. Choose plant, variety, count, row layout and dates in one dialog, with an expandable plant profile and annual activity chart. Unique direct-sowing/transplant-to-harvest combinations are suggested; ambiguous combinations require an explicit choice. Missing periods are not invented and saved/manual dates are preserved. Annual proposals cover up to 366 days; longer occupancies can still be entered manually.

Continue with “Position in bed”, place by tapping/dragging, and save from the bar directly on the unchanged canvas. Edit/cancel actions remain there. Live green/red markers, symbols and named feedback use stored relationships and overlapping occupancy dates. Unknown relationships remain unknown.
