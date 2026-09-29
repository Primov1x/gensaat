# Gensaat Etappe 8 (Nachfolgeorden und Liber Honoris) Implementation Plan

> Umsetzung direkt in derselben Session (Nutzer: „bau durch, ich checke später“). Schlanker Plan wie Etappe 2–7.
> Checkpoint: `node test.js` grün, `node test.js tempo` im Ziel, Sichtprüfung Handy und PC.

**Goal:** Lehre Gründungsrecht, Gründung eines Nachfolgeordens (Name, Farben, Linie) mit Gensaat-Zehnt, Vermächtnis
(+1 % Produktion und Lager je Punkt), Ordensrelikte, Linienstufen, Reiter Vermächtnis und Liber Honoris.

## Entscheidungen

- `meta` bleibt über Neustarts: `honors`, `legacy` (je verdient), `legacyFree` (ausgebbar), `relics`, `lines`
  (Stufe je Linie), `foundings`. Ausgeben senkt den Prozent-Bonus nicht.
- Gründung: `found(s, { name, palette, lineage })` gibt einen neuen Spielstand zurück (oder null). Bedingung:
  Gründungsrecht, 100 Kampfbrüder, 20 Gensaat (werden als Zehnt verbraucht). `foundBlock(s)` nennt, was fehlt.
- Vermächtnis bei Gründung = ⌊Kampfbrüder ÷ 10⌋ + ⌊Ruhm ÷ 500⌋ + Vermächtnis der befreiten Systeme (`legacyGain`).
- Der neue Orden spielt nach den Regeln seiner Linie (`s.chapter`), mit eigenem Namen (`s.name`, höchstens 24 Zeichen)
  und eigener Farbpalette (`s.palette`, eine von 8 heraldischen oder null = Farben der Linie).
- Linienstufe +1 für die Linie des neuen Ordens. Der Bonus der Linie (`boost` im Orden) wächst um 25 % je Stufe;
  Makel und Eigenheiten bleiben gleich.
- Ordensrelikte (`relics`): Wirkung (`effects`) sofort und für immer; Startpaket (`start`) ab der nächsten Gründung.
  Ewige Wacht: offline bis 7 Tage (`offline.days`), Astropathen-Chor: Visionen doppelt so oft (`vision.rate`).
- Liber Honoris: Reiter ab 5 Einträgen, nach Orden gruppiert, neueste zuerst. Vermächtnis-Reiter ab Gründungsrecht
  oder nach der ersten Gründung. Space Wolves: der Knopf heißt „Neue Große Kompanie“.

## Zahlen (Startwerte)

- Gründungsrecht 45.000 Wissen + 25 Datentafeln + 10 Archäotech (ab Orbitalbau).
- Relikte: Banner des Gründers 5, Kodex-Abschrift 10, Gensaat-Reserve 15, Karte der Vorfahren 20, Veteranen-Trupp 25,
  Servoschädel des Archivars 30, Ewige Wacht 40, Heiliger Bolter 50, Astropathen-Chor 60,
  Rüstung des Ordensmeisters 80, Stasis-Tresor 100 (Wirkungen wie in der Spec).

## Tests

1. Vermächtnis-Rechnung und Bedingungen der Gründung
2. Gründung: neuer Stand nach Linie, Name, Farben; Zehnt; Meta wächst; Liber Honoris bleibt; Rest beginnt neu
3. Linienstufe verstärkt den Bonus der Linie; Vermächtnis +1 % Produktion und Lager
4. Relikte: kaufen mit freien Punkten, Wirkung sofort, Startpaket bei der Gründung, Ewige Wacht 7 Tage offline
5. Speichern und Laden mit Meta, Name und Farben; Import-Schutz
6. Tempo locker: Nachfolgeorden möglich ≈ 1–2 Wochen

## Aufgaben

1. Daten und Daten-Test · 2. Engine mit Tests 1–5 · 3. Tempo-Bot · 4. Oberfläche: Reiter Vermächtnis (Rechnung,
Bedingungen, Gründen-Dialog, Relikte, Linien), Reiter Liber Honoris, Name und Farben im Kopf · 5. Sichtprüfung, Spec

## Beim Bauen entschieden

- Tempo-Meilenstein ist „Nachfolgeorden möglich“ (Bedingungen erfüllt): 11,2 Tage (Median aus 3 Läufen),
  begrenzt durch die 100 Kampfbrüder.
- Reiter erscheinen jetzt immer an ihrem festen Platz; vorher hing sich ein neuer Reiter hinten an
  (Liber Honoris wäre vor der Schmiede gelandet).
- Datum: nach 999.M42 folgt 000.M43 (sonst stand nach gut 11 Tagen „1000.M42“ da).
- Der Gründen-Knopf ist ein Buntglas-Knopf über die volle Breite; Space Wolves heißen ihn „Neue Große Kompanie“.
