# Languages

Garden Planner bundles all UI translations locally. No runtime network request, translation service, API key or additional package is needed.

| Code | Language | Native name |
| --- | --- | --- |
| de | German | Deutsch |
| en | English | English |
| bg | Bulgarian | Български |
| da | Danish | Dansk |
| et | Estonian | Eesti |
| fi | Finnish | Suomi |
| fr | French | Français |
| el | Greek | Ελληνικά |
| ga | Irish | Gaeilge |
| it | Italian | Italiano |
| hr | Croatian | Hrvatski |
| lv | Latvian | Latviešu |
| lt | Lithuanian | Lietuvių |
| mt | Maltese | Malti |
| nl | Dutch | Nederlands |
| pl | Polish | Polski |
| pt | Portuguese | Português |
| ro | Romanian | Română |
| sv | Swedish | Svenska |
| sk | Slovak | Slovenčina |
| sl | Slovenian | Slovenščina |
| es | Spanish | Español |
| cs | Czech | Čeština |
| hu | Hungarian | Magyar |

## Auswahl / Selection

Unter **Einstellungen → Sprache der Oberfläche** die Sprache wählen oder automatisch der Home-Assistant-Sprache folgen. Die Auswahl gilt für diesen Browser/diese App. Regionale Codes wie `fr-FR`, `pt-BR` und `en-US` werden der unterstützten Grundsprache zugeordnet. Unbekannte Sprachen fallen auf Englisch zurück. Die Sprache für erzeugte Aufgaben, native Kalenderereignisse und Erinnerungen wird getrennt in den Home-Assistant-Einstellungen des Garden Planners gewählt. Bestehende manuelle Texte bleiben unverändert.

Choose the UI language in **Settings → Interface language**, or follow Home Assistant automatically. The preference is local to the browser/app. Region-specific codes resolve to a supported base language; unknown languages fall back to English. Generated task/calendar/reminder captions use the separate garden-wide reminder-language setting. User-entered text is preserved.

## Translation quality and contributions

The 22 additional catalogs were initially machine-assisted, with a gardening terminology pass for key activities and navigation. Full native-speaker review has not been completed. Corrections from speakers of each language are welcome, particularly long explanations and specialist terminology.

Frontend sources: `frontend/src/locales/<code>.json`, with `ui`, `host` and `bed` sections. HA forms and entity labels: `custom_components/garden_planner/translations/<code>.json`. Generated task/calendar captions: `custom_components/garden_planner/language_data.py`. Keep supported language codes and all keys synchronized. Preserve technical identifiers, units and service names. Run frontend language tests and Python language tests, then rebuild the frontend. The tests check key parity, nonempty values, language selection, regional fallback and runtime caption coverage; they do not replace linguistic review.
