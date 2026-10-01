# Blender-Skripte (Entwürfe aus dem Brainstorming)

Blender ohne Oberfläche (getestet mit 5.2.2):

```
blender -b --factory-startup -P units.py -- <ausgabe-ordner> blatt_marine,blatt_terminator,blatt_ork,aufstellung,nah,tisch
GENSAAT_STIL=dunkel blender -b --factory-startup -P city.py -- <bild.png> <daten.json> 1600 1400
```

- `kit.py`: Szene, Materialien, Formen, Licht, Kamera, Rendern, Comic-Umstellung (`toonify`).
- `buildings.py`: Gebäude der Festung je Stufe, Paletten (`grim`, `bright`, `comic`, `dunkel`).
- `city.py`: Stadtbild; mit `GENSAAT_STIL=dunkel` düster mit Steampunk, die Festung auf der untersten Terrasse der Makropole.
- `units.py`: Taktischer Marine, Terminator, Ork-Boy im Comic-Look (Modellblätter, Aufstellung, Nahaufnahme, Spieltisch).

Ergebnisse der Entwürfe: `docs/superpowers/mockups/`. Ausbau zur Pipeline in Etappe 11 (Stadt) und 14 (Figuren).
