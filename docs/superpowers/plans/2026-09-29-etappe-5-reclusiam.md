# Gensaat Etappe 5 (Reclusiam und Orden) Implementation Plan

> Umsetzung direkt in derselben Session (Nutzer: „bau durch, ich checke später“). Schlanker Plan wie Etappe 2–4.
> Checkpoint: `node test.js` grün, `node test.js tempo` im Ziel, Sichtprüfung Handy und PC.

**Goal:** Glaube und Reclusiam (Schrein, Prediger, Ordenspriester, Riten, Litaneien, Große Messe, Reliquiar,
Weihrauchbrenner), die Alte Kathedrale, Kompanien als Meilensteine mit Dauerbonus, die Ordens-Systeme Roter Durst mit
Schwarzem Zorn und Todeskompanie (Blood Angels) und Jagd auf die Gefallenen (Dark Angels), dazu 6 Ordens-Ereignisse je Orden.

## Entscheidungen

- Neue Effekt-Schlüssel: `production.bonus` (gesamte Produktion außer Bevölkerung), `jobs.bonus` (alle Knechte-Jobs),
  `defense.bonus`, `litany.bonus`. Glaube bekommt in der Frostzeit ×1,25.
- Ordens-Ereignisse wirken genau einmal: Geschenk (`gift`), Bonus für ein Jahr (`boon`) oder Roter Durst (`thirst`).
  Laufende Boni liegen in `s.boons` und zählen in den Effekten.
- Die Jagd auf die Gefallenen ist ein Kampfeinsatz, der nur nach dem Dark-Angels-Ereignis „Spur eines Gefallenen“
  offensteht (Merker `seen.fallenSign`); nach dem Sieg ist die Spur kalt.
- Todeskompanie: Beim Schwarzen Zorn verlässt ein freier Bruder den Dienst und wartet auf den nächsten Kampfeinsatz.
  Dieser Trupp kämpft mit doppelter Kraft, der Bruder fällt sicher, seine Gensaat wird immer geborgen.
- Verbesserungen sind erst sichtbar, wenn alle Ressourcen in ihren Kosten freigeschaltet sind (für den Weihrauchbrenner).

## Zahlen (Startwerte)

- Glaube: Lager 100, Prediger +0,05/s und Moral +0,5 % (höchstens +10 %), Ordenspriester +0,2/s und Moral +2 %,
  Schrein (150 Schrott + 50 Erz ×1,2: Glaube-Lager +50, Glaube +5 %), Reclusiam (10 Ceramit + 100 Glaube ×1,3:
  Glaube +10 %, Glaube-Lager +100, Litaneien +5 %).
- Riten: Segnung der Waffen 100, Hymne der Arbeit 150, Litanei der Wachsamkeit 200, Andacht der Gefallenen 300,
  Ritus der Reinheit 450, Hymnus des Lichts 650, Fest des Primarchen 900, Ewige Andacht 1.500.
- Litaneien: 30 Glaube + 1 je 10 Knechte, 1 Jahr (1.000 s), erneuern sich; Zorn (Kampfkraft +30 %), Fleiß (Jobs +20 %),
  Weisheit (Wissen +30 %), ab Fest Standhaftigkeit (Verteidigung +50 %) und Reinheit (Moral +15 %).
- Große Messe: Frömmigkeit += geopferter Glaube, Produktion + √Frömmigkeit ÷ 10 %.
- Reliquiar: 2 Archäotech + 5 Ceramit + 100 Glaube, Litaneien +10 % je Stück (höchstens +50 %).
- Kompanien: je 100 Kampfbrüder +5 % Produktion (Ultramarines +10 %).
- Roter Durst +5 je Kampfeinsatz, −0,01/s je Sanguinischem Priester; ab 100 Schwarzer Zorn, dann 50.
- Ordens-Ereignisse ab Liturgie, im Schnitt alle 2 Jahre (2.000 s).
- Lehre Liturgie 5.000 (Ort Alte Kathedrale, 1.800 s, ab Schmiedekunst aufklärbar). Tempo-Bot: 9.000 ergab 5,4 Tage.

## Tests

1. Glaube: Prediger, Ordenspriester, Schrein-Bonus, Frostzeit ×1,25, Moral durch Prediger
2. Riten: kaufen, wirken, nur einmal; Fest des Primarchen schaltet zwei Litaneien frei
3. Litaneien: Kosten mit Knechten, Dauer, automatische Erneuerung, Bonus durch Reclusiam und Reliquiare
4. Große Messe: Frömmigkeit und Produktionsbonus
5. Kompanien: Bonus je 100 Brüder, Ultramarines doppelt, Liber Honoris
6. Roter Durst, Schwarzer Zorn und Todeskompanie (Blood Angels)
7. Ordens-Ereignisse (fester Zufall): Geschenk, Bonus für ein Jahr, Spur eines Gefallenen öffnet die Jagd
8. Speichern und Laden mit Glaube-Zustand, Boni, Durst, Todeskompanie
9. Tempo locker: Reclusiam ≈ 3–4 Tage (gemessen 3,6)

## Aufgaben

1. Daten und Daten-Test · 2. Engine mit Tests 1–8 · 3. Tempo-Bot · 4. Oberfläche: Reiter Reclusiam (Glaube, Große Messe,
Litanei-Wahl, Riten), Kompanien und Durst im Orden-Reiter, Ereignisse in der Chronik · 5. Sichtprüfung, Spec nachziehen

## Beim Bauen entschieden

- Servitoren verarbeiten nur Überschuss: Zutaten mit Lager erst ab 90 % Füllstand (Regel `servitorFill`).
  Vorher fraßen sie jeden Schrott für Plastahl, Schrott klebte bei ~20 und nichts wurde mehr gebaut.
- Tempo-Bot: neue Jobs (Raffinerie, Prediger) bekommen gezielt Schrottsammler; Bauern bleiben fest.
- 1. Kompanie (Spec ≈ 10 Tage) ist mit der heutigen Nahrung nicht erreichbar: 100 Brüder brauchen in der Frostzeit
  60 Vorräte/s. Ziel wandert zu Etappe 6 (Vorräte aus dem Handel). Der Bot zeigt den Wert nur an.
