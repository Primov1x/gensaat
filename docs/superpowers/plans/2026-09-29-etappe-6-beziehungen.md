# Gensaat Etappe 6 (Beziehungen) Implementation Plan

> Umsetzung direkt in derselben Session (Nutzer: „bau durch, ich checke später“). Schlanker Plan wie Etappe 2–5.
> Checkpoint: `node test.js` grün, `node test.js tempo` im Ziel, Sichtprüfung Handy und PC.

**Goal:** Astropathie mit Astropathen-Station, Astropathenturm und Visionen (Navigationsdaten), sechs Partner mit Tausch,
Ansehen-Stufen, Hilfe je Stufe und Daueraufträgen, Handelskontor, Servitor-Zelle und Techmarine (Mechanicus-Stufen),
dazu die Welt-Ereignisse Freihändler, Warpsturm, Ork-WAAAGH! und Genestealer-Kult mit dem Einsatz „Kult zerschlagen“.

## Entscheidungen

- Partner stehen in `partners`: `give` (Paket, das der Orden abgibt), `get` (Paket, das er bekommt), `help` (Effekte
  je Ansehen-Stufe), `requires` (Kontakt). Alle brauchen Astropathie. `get.serfs` = Knechte, nur so viele wie Platz ist.
- Ansehen: Zahl je Partner, +1 je Tausch × (1 + `standing.bonus`; Dark Angels −25 %). Stufe = erreichte Schwellen
  (5 / 15 / 35 / 70 / 120). Neue Stufe: Log; Stufe 5: Liber Honoris. `requires.standing: { partner: Stufe }` schaltet frei.
- Ausbeute = Paket × (1 + `trade.bonus` + 10 % je Stufe), +50 %, wenn Haus Valkar im Hafen liegt (nur bei ihm).
- Daueraufträge ab Stufe 2: alle 10 s tauscht jeder Auftrag einmal, wenn jede abgegebene Ware mit Lager zu 80 % voll ist
  und von Waren ohne Lager 5 Pakete da sind. Solche Tausche schreiben nichts ins Log.
- Visionen ab Astropathie, im Schnitt alle 400 s (400 × (0,5 + Zufall)). Auto-Fang mit Chance `vision.auto`
  (10 % je Astropathenturm, höchstens 100 %), sonst steht die Vision 15 s im Kopf; Antippen: +1 Navigationsdaten.
  Offline fängt nur der Auto-Fang (die 15 s laufen ungesehen ab).
- Welt-Ereignisse (`worldEvents`): eigene Uhr je Ereignis, läuft nur mit erfüllter Voraussetzung, nächster Termin
  every × (0,5 + Zufall). Freihändler: erst Kontakt Haus Valkar (Merker `valkar`), danach „im Hafen“ (+50 % beim
  nächsten Tausch mit ihm). Warpsturm: 1 Jahr keine Visionen, Glaube +50 %. WAAAGH!: Bedrohung +100.
  Genestealer-Kult: Merker `cult`, Zuzug −50 %, bis „Kult zerschlagen“ siegt (Merker `cultCrushed`: Kontakt Inquisition).
- Einsätze können mit `sets` einen Merker setzen (wie `clears` einen löscht).
- Servitor-Zelle (Mechanicus-Stufe 1): Knopf „Servitor erschaffen“ in der Schmiede (1 Knecht + 5 Plastahl);
  jede Zelle: Servitoren arbeiten 10 % schneller (`servitor.bonus`). Techmarine (Stufe 2): Amt, Schmiede-Ausbeute +10 %.
  Ämter-Effekte zählen dafür jetzt auch in `effects()`.
- Das Navigatorenhaus kommt mit Etappe 7 (braucht Warpnavigation).

## Zahlen (Startwerte)

- Astropathen-Station 2.400 s, aufklärbar ab Datenarchive. Astropathie 12.000 Wissen + 5 Datentafeln; Handelsrecht 15.000.
- Astropathenturm 8 Plastahl + 4 Ceramit ×1,3 (Auto-Fang +10 %), Handelskontor 10 Plastahl ×1,2 (Tausch +5 %),
  Servitor-Zelle 8 Plastahl + 2 Archäotech ×1,4.
- Partner: Mechanicus 2 Archäotech → 15 Ceramit + 5 Plastahl (Schmiede +3 %), Varos 4 Plastahl → 500 Vorräte
  (Vorräte +3 %), Astra Militarum 300 Vorräte → 2 Knechte (Verteidigung +5 %, ab Aschewüste), Ekklesiarchie 20 Ruhm →
  10 Weihrauch + 40 Glaube (Glaube +3 %, ab Alter Kathedrale), Haus Valkar 60 Promethium → 8 Amasec (Tausch +3 %),
  Inquisition 60 Ruhm → 1 Archäotech (Bedrohung wächst 5 % langsamer).
- Kult zerschlagen: Bedrohung 150, 900 s, 5–10 Kämpfer, 40 Ruhm. Amasec und Weihrauch: Luxus, Lager 30 (+20 je Lagerhalle).
- Freihändler alle 3 Jahre, Warpsturm alle 8, WAAAGH! alle 6 (ab Aschewüste), Kult alle 10 (ab Makropol-Ruine).

## Tests

1. Visionen: Auto-Fang, Antippen, verfallen nach 15 s, Warpsturm (keine Visionen, Glaube +50 %)
2. Tausch: Paket, Ausbeute mit Kontor und Stufe, Ansehen und Stufen, Hilfe je Stufe, Dark Angels langsamer,
   Knechte nur mit Platz, Haus Valkar im Hafen
3. Daueraufträge: erst ab Stufe 2, nur aus vollen Lagern, höchstens alle 10 s, Waren ohne Lager ab 5 Paketen
4. Mechanicus: Servitor-Zelle ab Stufe 1, Servitor erschaffen, Techmarine ab Stufe 2
5. Welt-Ereignisse (fester Zufall): Freihändler, WAAAGH!, Genestealer-Kult und Kult zerschlagen
6. Speichern und Laden mit Ansehen, Aufträgen, Visionen, Ereignis-Uhren, Warpsturm
7. Tempo locker: erster Tausch und 1. Kompanie (Ziel ≈ 10 Tage mit Vorräten aus Varos)

## Aufgaben

1. Daten und Daten-Test · 2. Engine mit Tests 1–6 · 3. Tempo-Bot · 4. Oberfläche: Reiter Beziehungen (Partner mit
Stufe, Tausch, Dauerauftrag, Hilfe), Vision im Kopf, Servitor-Knopf in der Schmiede, Icons · 5. Sichtprüfung, Spec nachziehen

## Beim Bauen entschieden

- Tempo-Bot mit festem Zufall (mulberry32) und drei Samen: vorher streuten die Zeiten um mehrere Tage.
- Bot-Fehler behoben: Er machte bei vollem Lager allen Schrott zu Plastahl und alles Erz zu Ceramit (jetzt 30 %);
  bei vollen Quartieren baut er zuerst Wohnraum. Beides hatte das Wissen-Lager und die Knechte tagelang eingefroren.
- Balance für 100 Brüder: Gedränge 0,5 % statt 1 % je Knecht über 20 (bei 109 Knechten arbeiteten Bauern mit 30 %),
  Brüder essen 0,4 statt 0,6, Zellentrakt ×1,25 statt ×1,35 (die 20. Zelle kostete 18.000 Schrott),
  Verlust bei Sieg 2 % ÷ r statt 5 % (Einsatzbefehle kosteten ~25 Brüder am Tag).
- Ergebnis (Median aus 3 Läufen): erster Tausch 5,2 Tage, 1. Kompanie 10,2 Tage.
