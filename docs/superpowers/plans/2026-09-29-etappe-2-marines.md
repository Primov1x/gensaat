# Gensaat Etappe 2 (Marines) Implementation Plan

> Umsetzung direkt in derselben Session (Nutzer: „bau durch, ich checke später“). Schlanker Plan: Ziele, Schnittstellen,
> Tests und Zahlen vollständig; der Code steht nach der Umsetzung in den Dateien. Checkpoint: `node test.js` grün.

**Goal:** Die Space Marines kommen ins Spiel: Brüder erwachen mit dem ersten Apothecarion, Aufklärung entdeckt Orte,
Erz und Mine, Gensaat, Aspiranten aus der Prüfungsarena, Implantation (Erfolg, Servitor, Tod, bei Space Wolves Wulf),
Neophyten mit Ausbildung, Zellentrakt, Übungskäfige, Ämter Apothecarius und Scriptor, Servitoren sammeln Schrott.

**Architecture:** Wie Etappe 1. Neue Tabellen in `data.js` (`places`, `offices`, neue Ressourcen, Gebäude, Lehren, Job),
neuer Teil `marines` im Spielstand, Engine-Schritt `marinesTick`, neuer Reiter „Einsätze“, Orden-Reiter mit Brüdern und Ämtern.

## Global Constraints

Wie Etappe 1 (siehe `2026-09-29-etappe-1-kern.md`). Zusätzlich: Zufall nur über `Engine.rng` (in Tests austauschbar),
Namen der Brüder ohne Zufall (`names[logSeq % n]`), damit Tests den Zufall genau steuern.

## Zahlen (aus der Spec, Startwerte)

- Regeln: Brüder/Neophyten/Wulfen essen 0,6 Vorräte/s, Aspiranten 0,3. 5 Brüder im Sus-an-Koma. Wrack-Quartiere: 5 Plätze.
  Implantation 300 s, Erfolg 75 % (+10 % je Apothecarius, höchstens 95 %, Space Wolves −10 %), Apothecarius −20 % Dauer
  (höchstens −60 %). Fehlschlag: 50 % Servitor, 50 % Tod; Space Wolves erst 50 % Wulf. Ausbildung 900 s (−10 % je
  Übungskäfig, höchstens −50 %). Gensaat reift 0,0005/s je Kampfbruder (Salamanders −25 %). Servitor +0,15 Schrott/s.
- Ressourcen: Erz (Lager 150, ab Ort Erzader), Gensaat (Lager 3, ab Apothecarion), Aspiranten (Bevölkerung, Lager 0, ab Prüfungsarena).
- Gebäude: Apothecarion 80 Schrott + 40 Vorräte ×1,5 (+1 Implantationsplatz, Gensaat-Lager +3; das erste weckt die Brüder),
  Mine 60 Schrott ×1,2 (Bergmann +20 %, Erz-Lager +80), Zellentrakt 60 Schrott + 40 Erz ×1,35 (+5 Brüder-Plätze),
  Prüfungsarena 80 Schrott + 40 Erz ×1,4 (+0,002 Aspiranten/s, Lager +2), Übungskäfige 60 Erz + 40 Schrott ×1,3
  (Ausbildung −10 %, Kampfkraft +2 %). Speicher bekommt Erz-Lager +100.
- Job: Bergmann +0,25 Erz/s (ab Mine).
- Lehren: Sus-an-Studien 150 (Lagerhaltung, Bergung), Gensaat-Kunde 250, Zellenbau 300 (+ Ort Erzader),
  Prüfungsrituale 350 (+ Ort Stammesland), Kodex-Drill 500, Librarius 600.
- Orte: Absturzstelle 60 s (+5 Gensaat, +40 Schrott), Erzader 180 s, Stammesland 300 s (Zuzug +10 %).
  Aufklärung braucht 1 freien Kampfbruder. Dauer × (1 − Einsatz-Tempo) × Sturmzeit 1,25.
- Ämter: Apothecarius (ab Gensaat-Kunde), Scriptor +0,5 Wissen/s (ab Librarius; Space Wolves „Runenpriester“).

Abweichung von der Spec: Aufklärung schickt in Etappe 2 nur Kampfbrüder (keine Neophyten); Neophyten kommen mit den
Kampfeinsätzen in Etappe 3 dazu. Die Spec wird entsprechend angepasst.

## Schnittstellen (neu)

- `s.marines = { coma, brothers, neophytes: [Rest-s], implants: [Rest-s], servitors, wulfen }`, `s.offices = { id: n }`,
  `s.places = { id: true }`, `s.scouts = [{ place, left }]`
- `marineCap(s)`, `marinesUsed(s)`, `freeBrothers(s)`, `placeState(s, id) → 'done' | 'away' | 'open' | 'hidden'`,
  `implantBlock(s) → null | 'lore' | 'aspirant' | 'geneseed' | 'slot' | 'cells'`, `missionTime(s, base)`
- Aktionen: `scout(s, placeId)`, `setOffice(s, officeId, ±1)` → `true | false`
- `simulate` liefert zusätzlich `brothers` (Differenz Kampfbrüder)
- `Engine.rng` (Standard `Math.random`)

## Tests (neu in test.js)

Daten-Test erweitert (Orte, Ämter, neue Effekt-Schlüssel, `requires.place`). Neu:
1. Brüder erwachen mit dem ersten Apothecarion (5 Brüder, Log, Liber Honoris), essen 0,6/s
2. Aufklärung: Absturzstelle bringt Gensaat (Lager gedeckelt) und Schrott, der Bruder kommt zurück, zweimal geht nicht,
   ohne freien Bruder geht nichts; White Scars 30 % schneller, Sturmzeit 25 % länger
3. Sichtbarkeit der Orte: entdeckte und die nächsten zwei, der Rest `hidden`
4. Freischaltung über Orte: Mine und Erz nach der Erzader, Zuzug +10 % nach dem Stammesland
5. Aspiranten aus der Arena (Rate, Lager), sie essen 0,3/s
6. Implantation Erfolg (fester Zufall): Neophyt, erster Neophyt im Liber Honoris, nach 900 s Kampfbruder
7. Implantation Fehlschlag: Servitor bzw. Tod; Space Wolves: Wulf
8. Implantation braucht Lehre, Aspirant, Gensaat, Implantationsplatz und Brüder-Platz (`implantBlock`)
9. Apothecarius: schneller und sicherer; Übungskäfige: Ausbildung schneller, höchstens −50 %
10. Gensaat reift in Kampfbrüdern, Salamanders 25 % langsamer
11. Servitoren sammeln Schrott
12. Ämter: nur mit freien Brüdern, Scriptor bringt Wissen, Runenpriester-Name bei Space Wolves
13. Speichern und Laden mit Marines, Import-Schutz (kaputte Listen, zu viele Ämter)
14. Tempo: „Brüder erwachen“ und „Erster eigener Neophyt“ im Ziel (aktiv ≈ 30–45 Min. bzw. ≈ 2 Std.)

## Aufgaben

1. Daten: neue Tabellen und Zahlen, Daten-Test erweitern → `node test.js` grün
2. Engine: Zustand, Freischaltung über Orte, Brüder erwachen, Aufklärung, Ämter (Tests 1–4, 12)
3. Engine: Aspiranten, Implantation, Ausbildung, Gensaat, Servitoren, Speichern/Laden (Tests 5–11, 13)
4. Tempo-Bot erweitern, Zahlen auf die Ziele einstellen (Test 14)
5. Oberfläche: Bestände (Erz, Gensaat, Bevölkerung), Orden-Reiter mit Brüdern und Ämtern, Reiter Einsätze, Info für Orte,
   Abwesenheit mit Brüdern, neue Symbole
6. Sichtprüfung PC und Handy mit einem Etappe-2-Stand, `node test.js` und `node test.js tempo`
