# Gensaat Etappe 7 (Flotte und Sektor) Implementation Plan

> Umsetzung direkt in derselben Session (Nutzer: „bau durch, ich checke später“). Schlanker Plan wie Etappe 2–6.
> Checkpoint: `node test.js` grün, `node test.js tempo` im Ziel, Sichtprüfung Handy und PC.

**Goal:** Raumhafen-Ruine, Lehren Stasis-Technik, Flugtechnik, Warpnavigation und Orbitalbau, Landeplattform,
Orbitalwerft und Gensaat-Tresor, drei Schiffe, die Sektorkarte mit 12 Systemen und Feldzügen, Systemboni,
das Navigatorenhaus als Partner und der Hololithische Kartentisch.

## Entscheidungen

- Schiffe stehen in `ships` und zählen in `s.ships`. Preis wie Gebäude (Basis × Faktor^Anzahl); die Schlachtbarke
  gibt es einmal. Platz: jede Landeplattform hält 3 Thunderhawks, jede Orbitalwerft 2 Angriffskreuzer
  (Effekte `hangar.hawk`, `hangar.cruiser`). Flottenstärke = Summe `fleet.power`.
- Systeme stehen in `systems` mit Nachbarn (`next`, in beide Richtungen) und Kartenplatz (x, y). Kharos ist Heimat.
  Ein Feldzug geht zu einem Nachbarn eines befreiten Systems, einer zur Zeit. Kosten: Navigationsdaten und
  Treibstoffzellen (2 × Navigationsdaten). Trupp 5–50 freie Kämpfer (Wulfen zuerst), Stärke = Flotte + Trupp.
  Chance, Verluste und Gensaat-Bergung wie bei Kampfeinsätzen (gemeinsamer Code). Erfolg: befreit, Dauerbonus
  (`effects`), einmalige Beute (`reward`), Liber Honoris. Fehlschlag: Kosten weg, System bleibt.
- Dauer × (1 − `campaign.speed`, höchstens 80 %): Kartentisch −20 %, Navigatorenhaus −3 % je Stufe.
  Im Warpsturm ruht die Restzeit.
- Neue Effekt-Schlüssel: `fleet.power`, `hangar.hawk`, `hangar.cruiser`, `campaign.speed`, `vision.bonus`
  (Navigationsdaten je Vision), `serfs.capPct`, `renown.bonus` (Ruhm aus Beute). Aufklärung höchstens −80 % Dauer.
- Vermächtnis-Punkte der Systeme (`legacy`) stehen schon in den Daten; gezählt wird ab Etappe 8.
- Verbesserungen dürfen `requires` haben (Kartentisch ab Warpnavigation).

## Zahlen (Startwerte)

- Raumhafen-Ruine 3.600 s, aufklärbar ab Astropathie. Stasis-Technik 20.000 + 2 Archäotech, Flugtechnik 18.000 +
  10 Datentafeln, Warpnavigation 25.000 + 5 Navigationsdaten, Orbitalbau 32.000 + 3 Archäotech.
- Landeplattform 10 Ceramit + 10 Plastahl ×1,3; Orbitalwerft 30 Ceramit + 20 Plastahl + 5 Archäotech ×1,4;
  Gensaat-Tresor 10 Ceramit + 2 Archäotech ×1,3 (Gensaat-Lager +10).
- Thunderhawk 15 Ceramit, 10 Plastahl, 2 Treibstoffzellen ×1,25 (Flotte 10, Aufklärung −10 %); Angriffskreuzer
  60 Ceramit, 40 Plastahl, 5 Archäotech, 10 Treibstoffzellen ×1,5 (Flotte 50); Schlachtbarke 300 Ceramit,
  200 Plastahl, 25 Archäotech, 40 Treibstoffzellen, einmal (Flotte 300, Ruhm +10 %).
- Systeme wie in der Spec (Bedrohung 150–2.500, 2–10 Navigationsdaten, 1–6 Stunden).
- Navigatorenhaus: 120 Promethium → 2 Navigationsdaten, Feldzüge −3 % Dauer je Stufe.
- Hololithischer Kartentisch: 5 Datentafeln + 5 Archäotech, Feldzüge −20 % Dauer.

## Tests

1. Schiffe: Preis mit Faktor, Platz je Landeplattform und Werft, Schlachtbarke einmal, Flottenstärke, Aufklärung schneller
2. Feldzug: nur zu Nachbarn, Kosten, Trupp und Flotte, Sieg befreit mit Bonus und Beute, Fehlschlag mit Verlusten
3. Dauer: Kartentisch und Navigatorenhaus kürzen, Warpsturm pausiert
4. Systemboni: Knechte-Plätze +10 %, Navigationsdaten je Vision, Ruhm aus Beute
5. Speichern und Laden mit Schiffen, Systemen und laufendem Feldzug
6. Tempo locker: erstes befreites System

## Aufgaben

1. Daten und Daten-Test · 2. Engine mit Tests 1–5 · 3. Tempo-Bot · 4. Oberfläche: Reiter Flotte (Schiffe,
Sektorkarte als SVG, Feldzüge wie Einsätze) · 5. Sichtprüfung, Spec nachziehen

## Beim Bauen entschieden

- Bot: Treibstoffzellen vor Ceramit herstellen (sonst fraß Ceramit das Promethium und es gab nie Treibstoff),
  Visionen fangen, Schiffe bauen, Feldzüge ab 70 % Chance zum schwächsten erreichbaren System.
- Metallum gibt „Schmiede-Ausbeute +15 %“ statt „Ceramit +15 %, Schmiede +10 %“ (Ceramit ist eine Ware ohne Rate).
- Oberfläche: Einträge, die aus einem Reiter wegfallen (befreite Systeme, kalte Spur der Gefallenen), verschwinden jetzt;
  vorher blieben sie als tote Karte stehen. Fehlende Effekt-Texte (`loot.archeotech`, `cap.bonus`) ergänzt,
  unbekannte Schlüssel zeigen den Rohtext statt abzustürzen.
- Ergebnis (Median aus 3 Läufen): erstes befreites System 6,4 Tage, 1. Kompanie 11,0 Tage (Bot baut jetzt auch Flotte).
