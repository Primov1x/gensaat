# Gensaat Etappe 3 (Kampf) Implementation Plan

> Umsetzung direkt in derselben Session (Nutzer: „bau durch, ich checke später“). Schlanker Plan wie Etappe 2.
> Checkpoint: `node test.js` grün, `node test.js tempo` im Ziel, Sichtprüfung Handy und PC.

**Goal:** Kampfeinsätze mit Trupps, Kampfkraft, Chance, Verlusten und Gensaat-Bergung; Beute (Schrott, Erz, Ruhm,
Grox-Fleisch, Archäotech); die Aschewüste bringt Bedrohung und Ork-Überfälle; Bastion, Waffenkammer, Archivum;
Einsatzbefehle (Wiederholen); Grox-Fleisch als erstes Luxusgut für die Moral; lockeres Tempo-Profil im Bot.

## Entscheidungen (weichen von der Spec ab, Spec wird angepasst)

- Neophyten kämpfen nicht, sie trainieren. Trupps bestehen aus freien Kampfbrüdern und Wulfen (Wulfen zuerst).
- Neues Gebäude **Archivum** (ab Librarius): Wissen-Lager +20 % je Archivum. Ohne prozentuales Lager wären die
  Lehrkosten ab Etappe 3 nicht erreichbar. Neuer Effekt-Schlüssel `<res>.capPct`.
- Die Aschewüste ist erst mit Kampfdoktrin aufklärbar (sonst Bedrohung ohne Gegenmittel).
- Ruhm und Archäotech haben kein Lager (`cap: Infinity`), die Anzeige zeigt nur den Bestand.

## Zahlen (Startwerte)

- Kampfkraft: Kampfbruder 10, Wulf 20, × (1 + Kampfkraft-Boni). r = Stärke ÷ Bedrohung,
  Chance = 50 % + 40 % × log₂ r, begrenzt 5–95 %. Verlust je Mitglied: Erfolg 5 % ÷ r, Fehlschlag 25 % ÷ r, höchstens 50 %.
  Gensaat-Bergung je gefallenem Bruder 50 % + 10 % je Apothecarius (höchstens 90 %); Wulfen hinterlassen keine.
- Einsätze: Ork-Plünderer vertreiben (30, 240 s, 3–5, 60 Schrott + 5 Ruhm, Bedrohung −10), Grox-Jagd (20, 300 s, 2–3,
  10 Grox-Fleisch), Wrackfelder plündern (40, 600 s, 3–5, 200 Schrott + 30 Erz, 10 % Chance auf 1 Archäotech),
  Ork-Lager zerschlagen (120, 1.200 s, 5–10, 400 Schrott + 40 Ruhm, Bedrohung −40, ab Waffenkunde).
- Bedrohung: ab Aschewüste +0,01/s, höchstens 500. Verteidigung = (10 × Kampfbrüder daheim, Amtsträger halb,
  + 20 × Wulfen daheim) × (1 + Kampfkraft-Boni) + 20 je Bastion. Alle 300 s: Bedrohung > Verteidigung → Überfall:
  −10 % Vorräte, Schrott, Erz; 20 % Chance, dass ein Knecht verschleppt wird. Offline höchstens 3 Überfälle.
- Lehren: Kampfdoktrin 2.800 (Kodex-Drill), Befestigung 3.200 (Kampfdoktrin, Aschewüste), Waffenkunde 4.000
  (Kampfdoktrin), Einsatzplanung 6.000 (Kampfdoktrin).
- Gebäude: Bastion 120 Erz + 60 Schrott ×1,25 (Verteidigung +20), Waffenkammer 150 Erz + 80 Schrott ×1,3
  (Kampfkraft +5 %), Archivum 200 Schrott + 120 Erz ×1,25 (Wissen-Lager +20 %).
- Grox-Fleisch: Lager 30, Luxusgut: Moral +10 % solange ≥ 1 da ist, Verbrauch 0,001/s je Knecht.
- Orden: Space Wolves Beute +25 %, Dark Angels Archäotech aus Einsätzen +50 %, White Scars Einsatzbefehle ab Start.

## Schnittstellen (neu)

- Spielstand: `s.missions = [{ id, brothers, wulfen, left }]`, `s.orders = { missionId: Truppgröße }` (Einsatzbefehle),
  `s.threat`, `s.raidTimer`
- `power(s, brothers, wulfen)`, `chance(s, missionId, size)`, `defense(s)`, `freeWulfen(s)`, `missionState(s, id)`
- Aktionen: `sendMission(s, id, size)`, `setOrder(s, id, size | 0)` → `true | false`
- `freeBrothers` zieht Brüder im Einsatz ab; `simulate` begrenzt Überfälle auf 3

## Tests

1. Chance-Formel (r = 1 → 50 %, r = 2 → 90 %, r = 0,5 → 10 %, Grenzen 5 % und 95 %), Kampfkraft mit Boni (Blood Angels)
2. Entsenden: Lehre und Ort nötig, Truppgröße im Rahmen, genug freie Kämpfer, Wulfen zuerst, je Einsatz nur ein Trupp
3. Erfolg (fester Zufall): Beute, Ruhm, Bedrohung sinkt, Überlebende kommen zurück, Liber Honoris
4. Verluste und Gensaat-Bergung mit Apothecarius; Fehlschlag ohne Beute
5. Space Wolves Beute +25 %, Dark Angels Archäotech +50 %
6. Einsatzbefehl: Trupp zieht nach der Rückkehr wieder los; ohne Einsatzplanung nur bei White Scars
7. Bedrohung wächst ab der Aschewüste, Überfall alle 300 s wenn größer als die Verteidigung, Knecht verschleppt,
   Bastion und Brüder daheim verteidigen; offline höchstens 3 Überfälle
8. Grox-Fleisch hebt die Moral und wird gegessen; Archivum vergrößert das Wissen-Lager prozentual
9. Speichern und Laden mit Einsätzen, Befehlen, Bedrohung; Import-Schutz
10. Tempo: lockeres Profil (4× am Tag 5 Minuten) – erster Kampfeinsatz ≈ 1 Tag

## Aufgaben

1. Daten und Daten-Test
2. Engine: Kampf (Tests 1–6), dann Bedrohung und Überfälle (7), Luxus und Archivum (8), Speichern (9)
3. Tempo-Bot: Einsätze im Bot, lockeres Profil, Zahlen einstellen (10)
4. Oberfläche: Kampfeinsätze im Reiter Einsätze (Trupp −/+, Entsenden, Wiederholen, Chance), Bedrohung und
   Verteidigung, neue Bestände (Ruhm, Archäotech, Grox-Fleisch), Warnung in der Kopfzeile, Info-Texte
5. Sichtprüfung, Tests, Spec nachziehen
