# Gensaat Etappe 9 (Feinschliff) Implementation Plan

> Umsetzung direkt in derselben Session (Nutzer: „bau durch, ich checke später“). Schlanker Plan wie Etappe 2–8.
> Checkpoint: `node test.js` grün, `node test.js tempo` im Ziel, Sichtprüfung Handy und PC.

**Goal:** Flair-Zeilen in der Chronik, App-Icon, Homescreen und offline (Manifest, Service Worker), letzte Tempo-Runde.

## Entscheidungen

- Flair-Zeilen (`flair` in `data.js`): alle 600 s eine Zeile (Spec: höchstens eine je 200 s), ab dem ersten Knecht.
  Ohne Zufall (Auswahl über die Log-Nummer), damit Tests mit festem Zufall unberührt bleiben.
  Zeilen mit `{name}` erst, wenn Brüder wach sind.
- Service Worker (`sw.js`): Spiel-Dateien „erst Netz, dann Speicher“ (neue Versionen kommen sofort, offline geht es
  trotzdem), Google-Schriften „erst Speicher“ (nach dem ersten Besuch auch offline). Nur über http(s).
- Icon: SVG (geflügelter Schädel auf Stein) plus PNG 192 für Homescreen und iOS.
- Nicht ohne Nutzer: Schriften als Dateien ins Projekt laden (Download) und Hosting (öffentlich oder nicht).
  Bis dahin laden die Schriften von Google und bleiben dank Service Worker offline im Speicher.

## Tests

1. Flair: nach 600 s eine Zeile, ohne Brüder keine `{name}`-Zeile, vor dem ersten Knecht nichts
2. Tempo: alle Meilensteine im Ziel (aktiv und locker)

## Aufgaben

1. Flair (Daten, Engine, Test) · 2. Manifest, Service Worker, Icons, Einbindung · 3. Sichtprüfung, Spec, Bericht

## Beim Bauen entschieden

- Flair nur beim Zuschauen: beim Nachholen (simulate) keine Flair-Zeilen, sonst 48 Zeilen je Nacht.
- Icon flach gezeichnet (ohne Verläufe): das PNG ist so 12 KB statt über 40 KB.
- Service Worker geprüft: registriert, Manifest mit richtigem MIME-Typ (serve.py kennt jetzt .webmanifest),
  mit gestopptem Server lädt die Seite samt Spielstand und Schriften aus dem Speicher.
- Offen für den Nutzer: Schriften als Dateien ins Projekt (Download) und Hosting.
