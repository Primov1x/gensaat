# Gensaat „Richtiges Warhammer“ – Gesamtplan (Etappen 10–19)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Jede Etappe bekommt zu Beginn einen eigenen schlanken Plan `2026-..-etappe-NN-*.md` wie Etappe 2–9
> (Entscheidungen, Zahlen, Tests, Aufgaben). Dieser Gesamtplan legt Reihenfolge, Umfang und Abnahme fest.

**Goal:** Gensaat wird vom Aufbauspiel mit Würfel-Einsätzen zu einem Warhammer-Spiel mit riesigen Armeen, echten
Schlachten auf einem animierten 3D-Spieltisch, Gegnern mit eigenem Verhalten, Helden und einem Endspiel – dazu die
Festung als Stadtbild in der Makropole.

**Architecture:** Architektur A aus der Spec: JavaScript rechnet alles (auch Schlachten, auch offline) in
`engine.js`, `battle.js`, `war.js`; `ui.js` und `city.js` zeigen an; Godot (Web-Export in `battle/`) zeigt nur den
3D-Tisch und schickt Befehle per `postMessage`. Figuren und Stadtbild entstehen per Python-Skript in Blender ohne
Oberfläche (`tools/blender/`).

**Tech Stack:** Vanilla JS, Node für Tests, Blender 5.2 (ohne Oberfläche), Godot 4 (Compatibility/WebGL 2, einfädig),
GitHub Pages.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-10-01-gensaat-warhammer-design.md` (vom Nutzer abgenommen: „Plan passt“).
- **Schwerpunkt des Nutzers: Figuren, Gefechte und dass es Spaß macht.** Bei Zeitkonflikten gehen Etappe 13 (Schlacht),
  14 und 17 (Figuren, Tische) vor Komfort und Statistik.
- Look: Comic (Licht in harten Stufen, schwarzer Umriss) überall; Einheiten so nah am Original wie möglich
  (Mk-VII-Rüstung mit Adler und Totenkopf, Ordenssymbole, Crux, Ork-Boys mit Spalta); Makropole düster mit Steampunk,
  unsere Festung auf ihrer untersten Terrasse. Entwürfe: `docs/superpowers/mockups/`, Skripte: `tools/blender/`.
- Zahlen in Köpfen über `rules.popScale` (100); nichts darf an festen Kopfzahlen hängen.
- Spielstände werden immer mitgenommen (`saveVersion` hochzählen, `migrate()` in `load()`).
- Kathedralen-Oberfläche, deutsche Texte, Log-Zeilen höchstens 100 Zeichen, nichts springt, Automatik statt Klicks,
  Freischaltungen folgen der Logik der Welt.
- Jede Etappe endet spielbar: `node test.js` grün, `node test.js tempo` im Ziel, Sichtprüfung PC und Handy.
- Push auf GitHub (öffentliche Seite) nur, wenn der Nutzer darum bittet. Downloads (Godot, Export-Vorlagen) nur mit
  seinem OK (Dateiname, Quelle, Größe nennen).

## Was „es bockt“ konkret heißt (Abnahme für Etappen 13–19)

- Das erste Gefecht kommt nach ≈ 2 Tagen locker und dauert 2–5 Minuten; es passiert sichtbar etwas in jeder Phase.
- Befehle machen spürbare Unterschiede (Testfall: dieselbe Schlacht mit klugem Befehl gewinnt öfter als ohne).
- Würfel, Treffer, Verluste und Fliehen sind im Bericht und auf dem Tisch nachvollziehbar.
- Belohnungen sind sichtbar (Beute, Erfahrung der Helden, Kontrolle auf der Kriegskarte).
- Keine toten Phasen: es gibt immer ein nächstes Ziel (Gefecht, Ausbau, Held, Feldzug).

## Etappen

### 10 · Zahlen ×100 (jetzt)

Plan: `2026-10-01-etappe-10-zahlen-x100.md`. Abnahme: alte Stände laden, gleiches Tempo, große Zahlen überall,
Bedienung in Hunderten, Log fasst Massen zusammen. Danach Push (vom Nutzer gewünscht).

### 11 · Makropole (Stadtbild)

- Blender: `tools/blender/city.py` (Stil `GENSAAT_STIL=dunkel`) zur Pipeline ausbauen: feste Bauplätze für alle
  26 Gebäude-Arten, je Platz Trümmer und Bildstufen I–IV, Grund ohne Gebäude, Banner-Maske, `stadt.json`;
  Grafiken über „Bild mit Gebäude gegen leeren Grund“ (Abschnitt 2.4 der Spec). Makropolen-Stufen bekommen
  Türme und Fialen wie auf den Artworks.
- `js/city.js`: Stadtbild, Schilder mit Stufe (Gold-Rand, wenn bezahlbar), Karte am Platz, Leben im Bild (Rauch,
  Fenster, Verkehr, Luftschiffe, Scheinwerfer), Planetenzeit-Wetter, Alarm, Ordensfarben der Banner.
- `E.cityTier(S, id)` → 0–4. Schalter „Stadt | Liste“.
- Tests: Bildstufen-Schwellen, `stadt.json` vollständig, Bilder vorhanden, Umrisse im Bild.

### 12 · Armee

- Reiter Armee: Trupps (Scouts, Taktische, Sturm, Devastatoren, Terminatoren) mit Ausrüstungs-Rezepten,
  Fahrzeughalle mit Rhino, Predator, Whirlwind, Land Raider, Cybot; Hilfstruppen (Gardisten, Leman Russ, Basilisk,
  Skitarii); Armeeliste („Wie letztes Mal“, „Automatisch“).
- Tests: Rezepte, Kosten, Halle als Platz, Armeeliste mit festen Ergebnissen.

### 13 · Schlacht-Engine (Herzstück)

- `js/battle.js` ohne DOM: Zonen (3 Bahnen × 5 Tiefen), Werte, Würfel (Treffer, Verwundungs-Tabelle, Rüstung,
  Deckung, Rettung), Massen per Binomial/Normalnäherung, Phasen, Moral und Brechen, Doktrinen, Befehle je Phase,
  Captain- und Gegner-KI, Ereignis-Liste für Bericht und Tisch, fester Zufall je Schlacht.
- Gefechte ersetzen die Einsätze, Abwehr-Gefechte die Überfälle; Text-Ansicht mit Befehlsknöpfen; Bericht und
  Wiederholung als Text; Tempo-Bot kämpft.
- Spaß-Tests: kluger Befehl > kein Befehl; jede Phase erzeugt Ereignisse; Gefecht 2–5 Min.; offline = online.

### 14 · Werkzeuge und Godot-Tisch

- Downloads mit OK (Godot-Editor, Export-Vorlagen). Figuren-Pipeline aus `tools/blender/units.py`: Teile als
  starre Knochen, Materialnamen (`primary`, `secondary`, `trim`, `metal`, `skin`, `eyes`, `glow`), Export `.glb`.
- Erste Figuren: Taktischer Marine, Sturm-Marine, Terminator, Rhino, Predator, Ork-Boy, Kampfpanza;
  Animationen idle, walk, shoot, melee, hit, die.
- Godot: Tisch Kharos, Comic-Shader (Stufenlicht) und Umriss, Kamera, Mündungsfeuer, Leuchtspur, Explosionen,
  Würfel am Rand, `postMessage`-Protokoll aus Spec 9.3, Export nach `battle/`, Einbettung als Vollbild-Ebene.

### 15 · Helden und Ausrüstung

- Helden mit Namen, Stufen, Erfahrung, drei Plätzen, Fähigkeiten; Tod → verwundet oder Ehrwürdiger Cybot.
- Ausrüstung aus der Schmiede, Relikte mit Namen.

### 16 · Kriegskarte

- Reiter Krieg, Fraktionen (Orks, Kult, Tyraniden, Chaos) mit Zählern, Invasionen mit Countdown, Feldzüge als
  Schlachten, Härte-Regeln „spürbar, nie verloren“, Verschlingen und Neubesiedlung.

### 17 · Alle Figuren und Tische

- Kult, Tyraniden, Chaos, Hilfstruppen, Helden-Figuren; 11 Tische nach den Kriegsschauplätzen; alles im
  Comic-Look, Einheiten nah am Original.

### 18 · Endspiel

- Ritter, Titanen, Orbitalschlag-Ausbau, Landungskapseln, Raumschlacht (Orbit-Tisch, Schiffe), Exterminatus,
  Schwarzer Kreuzzug, Große Hive-Flotte.

### 19 · Feinschliff

- Tempo mit dem Bot, Handy-Leistung (höchstens 400 Figuren), Texte, Sichtprüfung aller Tische, Spielspaß-Runde
  mit dem Nutzer.

## Reihenfolge und Abhängigkeiten

10 → 11 (unabhängig von Schlachten) → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19. Etappe 11 kann nach hinten rücken,
wenn der Nutzer zuerst Gefechte will; 13 setzt 12 voraus, 14 setzt 13 voraus.
