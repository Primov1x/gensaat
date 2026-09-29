# Gensaat Etappe 4 (Schmiede) Implementation Plan

> Umsetzung direkt in derselben Session (Nutzer: „bau durch, ich checke später“). Schlanker Plan wie Etappe 2 und 3.
> Checkpoint: `node test.js` grün, `node test.js tempo` im Ziel, Sichtprüfung Handy und PC.

**Goal:** Die Schmiede: Rezepte (Plastahl, Ceramit, Treibstoffzellen, Datentafeln, Servoschädel) mit „+1 / +10 / max“,
Ausbeute je Schmiede, einmalige Verbesserungen, Servitoren stellen das gewählte Rezept her, Promethium mit Raffinerie
und Raffineriearbeitern, Hab-Block und Lagerhalle, Munitorum-Verwaltung (Aufgabe für neue Knechte),
Promethium-Quelle und Makropol-Ruine mit dem Einsatz Makropol-Säuberung.

## Entscheidungen

- Hergestellte Waren haben kein Lager und stehen nur im Reiter Schmiede, nicht in den Beständen.
- Stückwirkungen (`perUnit`): Jede Datentafel +50 Wissen-Lager, jeder Servoschädel −2 % Aufklärungsdauer
  (höchstens −40 %). Datentafeln lösen damit das Wissen-Lager für die späteren Lehren.
- Lehrkosten Etappe 4 (vom Tempo-Bot eingestellt, niedriger als die ×4-Schätzung der Spec): Schmiedekunst 4.000,
  Raffination 4.500, Munitorum-Verwaltung 5.000, Logistik 6.000, Bautechnik 6.500, Datenarchive 7.500.
- Weihrauchbrenner (braucht Glaube) kommt mit Etappe 5, der Hololithische Kartentisch mit Etappe 7.
- Servitoren sammeln Schrott, bis ihnen in der Schmiede ein Rezept zugewiesen wird (0,02 Ausführungen/s je Servitor).
- Neue Effekt-Schlüssel: `craft.bonus`, `loss.reduce`, `recover.bonus`, `scout.speed`.

## Schnittstellen (neu)

- Daten: `recipes` (Id = hergestellte Ressource, `cost`), `upgrades` (`cost`, `effects`), Ressourcen mit `crafted`
  und `perUnit` / `perUnitMax`
- Spielstand: `s.upgrades = { id: true }`, `s.servitorRecipe`, `s.autoJob`, `s.craftAcc`
- `craftCount(s, id) → wie oft bezahlbar`, `craftYield(s)`, `upgradeVisible(s, id)`
- Aktionen: `craft(s, id, n | 'max')`, `buyUpgrade(s, id)`, `setServitorRecipe(s, id | null)`, `setAutoJob(s, id | null)`

## Tests

1. Daten: Rezepte, Verbesserungen, Stückwirkungen verweisen auf bekannte Ids
2. Herstellen: Ausbeute +6 % je Schmiede (Salamanders +25 %), „max“, nicht bezahlbar, ohne Schmiede oder Lehre nichts
3. Servitoren stellen das Rezept her und sammeln dann keinen Schrott mehr
4. Verbesserungen: erst sichtbar mit freigeschalteten Waren, wirken sofort, nur einmal
5. Datentafeln vergrößern das Wissen-Lager, Servoschädel und Auspex verkürzen die Aufklärung (Deckel 40 %)
6. Munitorum-Verwaltung: neue Knechte bekommen die gewählte Aufgabe
7. Raffinerie und Raffineriearbeiter bringen Promethium; Hab-Block und Lagerhalle
8. Verluste −25 % (Aquila-Rüstung) und Gensaat-Bergung +20 % (Narthecium) im Kampf
9. Speichern und Laden mit Verbesserungen, Rezept, Aufgabe, Rest der Servitor-Arbeit
10. Tempo locker: erste Schmiede ≈ 2½ Tage

## Aufgaben

1. Daten und Daten-Test · 2. Engine mit Tests 2–9 · 3. Tempo-Bot · 4. Oberfläche: Reiter Schmiede (Waren mit
+1/+10/max, Servitor-Rezept, Verbesserungen), Aufgabe für neue Knechte im Orden-Reiter, Promethium in den Beständen,
Info-Texte · 5. Sichtprüfung, Spec nachziehen
