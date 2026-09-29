# Gensaat – Design

Stand 29.09.2026 · Arbeitstitel (Name änderbar) · Ordner `C:\Users\t.fritzen\gensaat`

## Ziel

Aufbauspiel im Stil von Kittens Game (kittensgame.com), aber hübscher und im Warhammer-40k-Stil.
Du führst die Überlebenden eines Space-Marine-Ordens. Für den Nutzer selbst, privat, am PC und am Handy.
Kittens-Tempo: tief und langsam, erster Neustart nach 1–2 Wochen lockerem Spielen, Gesamtspiel über Monate.

Grundsätze:
- Kittens-Prinzip: Text und Knöpfe, keine gemalten Szenen. Aber gestaltet (Look „Kathedrale“, siehe unten).
- 40k-Begriffe im Original bzw. wie in den deutschen GW-Büchern. Grimdark mit trockenem Humor im Log.
- Eigene Ideen statt 1:1-Kopie: zwei Bevölkerungen (Knechte und Marines), Gensaat-Kreislauf,
  Servitoren aus gescheiterten Aspiranten, Orden mit Eigenheiten, Nachfolgeorden als Neustart.
- Freischaltungen folgen der Logik der Welt: erst das Apothecarion, dann erwachen die Brüder.
- Später automatisiert sich das Spiel, statt mehr Klicks zu verlangen.
- Nichts springt: Knöpfe bleiben stehen und werden grau, Neues kommt ans Ende.
- Log-Zeilen höchstens 100 Zeichen, Beschreibungen unter 90. Anrede „du“.

## Prämisse

012.M42, Imperium Nihilus, hinter dem Großen Riss. Die Kreuzzugsflotte deines Ordens zerschellt über
Kharos Tertius, einer toten Welt voller Ruinen. Übrig: du (Captain), fünf Brüder im Sus-an-Koma, das Wrack.
Kein Kontakt zur Heimat.

Ziel: ein neues Festungskloster, der Orden auf Kodex-Stärke (124.000 Brüder, zehn Kompanien), der Sektor befreit.
Dann gründest du einen Nachfolgeorden: Neustart mit Vermächtnis.

## Look und Bedienung

Look „Kathedrale“ (Variante D aus dem Brainstorming, Referenz:
`.superpowers/brainstorm/1455-1790691907/content/look-v2.html`):
- Dunkler Stein, Kerzenlicht-Gold, Buntglas-Band in Ordensfarben unter der Kopfzeile, Rosenfenster hinter dem Titel,
  geflügelter Schädel über dem Titel.
- Reiter und Knöpfe mit Spitzbogen-Oberkante. Klick-Knöpfe als Buntglas in Ordensfarbe.
- Schriften: Überschriften, Titel, Knöpfe „Grenze Gotisch“, Fließtext „Alegreya“. Etappen 1–8 über Google Fonts
  mit Fallback Georgia/serif, Etappe 9 legt sie lokal ab (offline).
- Farben: Stein `#18130f`→`#0d0a08`, Knochen `#e8dcc4`, Knochen gedämpft `#b3a58a`, Gold `#d9a94e`, Gold hell `#f3d38c`,
  Linien `#3b322a`, fehlt `#ec8466`, Rate `#b9cb8f`. Ordensfarben als CSS-Variablen `--c1`, `--c2`, `--c-on`, `--c-glow`.
- Nur dunkel. Kein heller Modus.

Aufbau:
- PC ab 900 px: drei Spalten wie Kittens (Bestände | Reiter | Chronik).
- Handy: eine Spalte. Kopfzeile, Bestände (einklappbar), Reiterleiste (waagrecht scrollbar),
  Knopf-Karten volle Breite (nur Klick-Knöpfe nebeneinander), Chronik (letzte 4 Zeilen, „Mehr“ zeigt alle).
- Kopfzeile: Schädel, Titel, Wappen und Ordensname, imperiales Datum, Planetenzeit, fester Platz für Visionen, Menü.
- Bestände: Name, Wert / Lager, Rate („+0,4/s“). Knechte und Brüder als „n / Plätze“. Hergestellte Waren nur in der Schmiede.
- Knopf-Karte: Kaufen-Fläche (Name mit Anzahl, darunter Kosten, Fehlendes rot) und schmaler Info-Knopf rechts
  (Wirkung, Kosten, „Lager zu klein“, Zeit bis bezahlbar). Am PC zeigt Hover dieselbe Info.
  Nicht bezahlbar: grau, bleibt stehen. Mindestens 44 px hoch.
- Zahlen deutsch: `1.234` · `12,3 Tsd.` · `1,23 Mio.` · `4,5 Mrd.`
- Menü: Export, Import, Neustart (mit Bestätigung), Orden-Info.

Reiter erscheinen bei Freischaltung, immer in dieser Reihenfolge:
Festung · Orden · Librarium · Einsätze · Schmiede · Reclusiam · Beziehungen · Flotte · Vermächtnis · Liber Honoris.

## Zeit

- 1 imperiales Jahr = 1.000 s. Datum `0.FFF.JJJ.M42`: FFF = Sekunde im Jahr (000–999), JJJ = Jahr, Start 012.
  Nach 999.M42 folgt 000.M43 (nach gut 11 Tagen Spielzeit). Ein Nachfolgeorden beginnt wieder bei 012.M42.
- Kharos Tertius hat vier Planetenzeiten zu je 250 s. Sie wirken immer, sichtbar ab Lehre „Imperialer Kalender“.

|                            | Sonnenzeit | Sturmzeit | Aschezeit | Frostzeit |
|----------------------------|------------|-----------|-----------|-----------|
| Vorräte (Farmen, Bauern)   | ×1,25      | ×1        | ×0,75     | ×0,5      |
| Schrott                    | ×1         | ×1,25     | ×1        | ×1        |
| Glaube                     | ×1         | ×1        | ×1        | ×1,25     |
| Einsatzdauer               | ×1         | ×1,25     | ×1        | ×1        |
| Knechte-Zuzug              | ja         | ja        | ja        | nein      |

## Orden

Beim ersten Start (und bei jedem Nachfolgeorden) wählst du die Linie. Jeder Orden bringt Farben, Schiff,
Bonus, Eigenheit, Makel, eigene Ordens-Ereignisse und Namen für seine Brüder. Zahlenwerte (Bonus, Makel, Beschützer,
Wulfen) wirken ab der Etappe, in der ihr System kommt (Lager, Moral, Gebäudepreise ab Etappe 1, Implantation ab 2,
Einsätze ab 3, Schmiede ab 4, Ansehen ab 6). Eigene Systeme (Roter Durst, Jagd auf die Gefallenen, Kodex-Kompanien)
kommen mit Etappe 5. Die Auswahl zeigt alle Werte von Anfang an.

„Knechte fliehen halb so schnell“ heißt: Flucht nach 60 statt 30 hungrigen Sekunden.

| Orden         | Farben `--c1` / `--c2`  | Schiff                 | Bonus                          | Eigenheit                                                                 | Makel                                   |
|---------------|-------------------------|------------------------|--------------------------------|---------------------------------------------------------------------------|-----------------------------------------|
| Ultramarines  | `#1f4494` / `#d8b24a`   | Ehre von Macragge      | Lager +20 %, Zuzug +10 %       | Kodex: volle Kompanien zählen doppelt                                      | –                                       |
| Blood Angels  | `#a11d1d` / `#d8b24a`   | Blutkelch              | Kampfkraft +20 %               | Roter Durst und Schwarzer Zorn (siehe Reclusiam)                           | der Durst selbst                        |
| Space Wolves  | `#6e8298` / `#e0b93b`   | Fenrisklaue            | Einsatz-Beute +25 %            | Runenpriester statt Scriptor; Neustart heißt „Neue Große Kompanie“         | Wulfen-Fluch: Implantation −10 % Erfolg |
| Dark Angels   | `#1f4a2c` / `#d9ceae`   | Unerbittliche Wacht    | Archäotech aus Einsätzen +50 % | Jagd auf die Gefallenen (seltene Einsätze)                                 | Ansehen wächst 25 % langsamer           |
| Salamanders   | `#2e7a32` / `#e8742c`   | Feuerschmied           | Schmiede-Ausbeute +25 %        | Beschützer: Moral +15 %, Knechte fliehen halb so schnell                   | Gensaat reift 25 % langsamer            |
| White Scars   | `#ebe6da` / `#b3261e`   | Sturmreiter            | Einsatzdauer −30 %             | Einsatzbefehle (Wiederholen) ab Start                                      | Festungsbauten 15 % teurer              |

Weitere Farbwerte: `--c-on` (Text auf `--c1`) UM/BA/SW/SAL `#ffffff`, DA `#f3eee0`, WS `#231f1a`.
`--c-glow` (hell auf Dunkel) UM `#79b8ff`, BA `#ff7a6b`, SW `#b5d6ff`, DA `#7ee89a`, SAL `#a4f07a`, WS `#f4f1ea`.

Wulfen (Space Wolves): Scheitert eine Implantation, wird der Aspirant zu 50 % ein Wulf statt Servitor oder Tod.
Wulfen haben Kampfkraft 20, übernehmen kein Amt und lassen keine Gensaat reifen.

Namen für Log-Zeilen (Auswahl, volle Listen in `data.js`):
UM Cassian, Varro, Aethon, Lucan, Severus, Tiberon · BA Raphael, Lucien, Erasmus, Lorenzo, Leonato, Sevrin ·
SW Torvald, Harald, Sven, Egil, Hakon, Leif · DA Zadkiel, Anaziel, Gideon, Tharion, Sariel, Balthus ·
SAL Ra'stan, Heka'tan, Ul'tar, Kor'gan, Xa'var, Tor'vek · WS Temujin, Batu, Hasik, Jubal, Qasar, Otgon.

Start-Log: „Die ‚{Schiff}‘ ist über Kharos Tertius zerschellt. Du lebst.“ und „Fünf Brüder liegen im Sus-an-Koma.“

## Bevölkerung

### Ordensknechte

- Plätze aus Knechtsquartieren (+2) und Hab-Blöcken (+5). Start: 0 Knechte.
- Zuzug: 1 Knecht je 20 s, wenn ein Platz frei ist, niemand hungert, keine Frostzeit herrscht und der Vorräte-Ertrag
  nach dem Essen für einen weiteren reicht (≥ 0,3/s). Der allererste kommt immer. Fehlt nur das Essen, steht im
  Reiter Orden „Für Neue fehlen Vorräte.“
- Neue Knechte sind frei (ohne Job). Ab Lehre Munitorum-Verwaltung gibt es „Neue Knechte werden …“.
- Essen: 0,3 Vorräte/s je Knecht.
- Hunger: Vorräte leer und Verbrauch größer als Ertrag ergibt „hungrig“: Moral −30 % (nicht für Bauern, sonst
  Teufelskreis), kein Zuzug. Nach 30 hungrigen Sekunden flieht ein Knecht in die Wüste, dann zählt es neu:
  zuerst einer ohne Job, dann andere Jobs, Bauern zuletzt.
- Moral M = 100 % + 10 % je Luxusgut-Sorte mit Bestand ≥ 1 + Boni − 0,5 % je Knecht über 20 − 30 % bei Hunger,
  mindestens 25 %. Wirkt auf alle Knechte-Jobs.
- Luxusgüter (Grox-Fleisch, Amasec, Weihrauch) werden langsam verbraucht: 0,001 je Knecht, Sekunde und Sorte.

### Space Marines

- Die fünf Brüder im Sus-an-Koma zählen nicht und essen nicht. Sie erwachen, sobald das erste Apothecarion steht.
- Brüder-Plätze: 5 (Wrack-Quartiere) + 5 je Zellentrakt. Neophyten und Kampfbrüder teilen die Plätze.
- Essen: Kampfbrüder, Neophyten und Wulfen 0,4 Vorräte/s, Aspiranten 0,3.
- Aspiranten kommen aus Prüfungsarenen: +0,001/s je Arena, Lager 2 je Arena.
- Implantation (automatisch): startet, wenn ein Aspirant, 1 Gensaat, ein freier Implantationsplatz (1 je Apothecarion)
  und ein freier Brüder-Platz da sind. Dauer 5.600 s (−20 % je Apothecarius, höchstens −60 %).
  Erfolg 75 % (+10 % je Apothecarius, höchstens 95 %; Space Wolves −10 %). Erfolg: Neophyt.
  Fehlschlag: 50 % Servitor, 50 % Tod. Die Gensaat ist in beiden Fällen verbraucht.
- Implantation wartet außerdem, solange die Vorräte auch in der Frostzeit keinen weiteren Bruder ernähren
  (sonst verhungern die Knechte im nächsten Winter und die Festung steht still).
- Neophyt wird nach 900 s Ausbildung Kampfbruder (−10 % je Übungskäfig, höchstens −50 %).
- Gensaat reift in Kampfbrüdern: 0,0005/s je Bruder (Salamanders −25 %). Lager 3 + 3 je Apothecarion.
- Ämter (Reiter Orden, je −/+): Amtsträger gehen nicht auf Einsätze, zählen aber für Gensaat und Kompanien.

| Amt              | Wirkung                                                                     | ab                                   |
|------------------|-----------------------------------------------------------------------------|--------------------------------------|
| Apothecarius     | Implantation schneller und sicherer, Gensaat-Bergung +10 %                   | Gensaat-Kunde                        |
| Scriptor         | +0,5 Wissen/s (Space Wolves: Runenpriester, gleiche Wirkung)                 | Librarius                            |
| Ordenspriester   | +0,2 Glaube/s, Moral +2 %; Blood Angels: Sanguinischer Priester, senkt Durst | Liturgie                             |
| Techmarine       | Schmiede-Ausbeute +10 %                                                     | Mechanicus-Ansehen Stufe 2           |

- Kompanien: je 100 Kampfbrüder eine Kompanie, jede +5 % gesamte Produktion (Ultramarines +10 %).
  Jede Kompanie ist ein Meilenstein im Liber Honoris.

### Servitoren

- Entstehen aus gescheiterten Implantationen, später auch in der Servitor-Zelle der Schmiede.
- Essen nichts, zählen nicht als Knechte.
- Vor der Schmiede: +0,15 Schrott/s je Servitor. Ab der Schmiede: stellen das gewählte Rezept her,
  0,02 Ausführungen/s je Servitor. Sie verarbeiten nur Überschuss: Zutaten mit Lager erst, wenn es zu 90 % voll ist;
  Waren ohne Lager (Plastahl, Ceramit …) immer.

## Ressourcen

| Ressource         | Quelle                                     | Basis-Lager       | Nutzen                              |
|-------------------|--------------------------------------------|-------------------|-------------------------------------|
| Vorräte           | Klick, Hydrokulturfarm, Bauer, Agrarwelt   | 200               | Nahrung, Bauen                      |
| Schrott           | Klick, Schrottsammler, Servitoren          | 3.200               | Bauen, Plastahl                     |
| Wissen            | Schreiber, Scriptor                        | 100               | Librarium                           |
| Erz               | Bergmann                                   | 150               | Bauen, Ceramit                      |
| Promethium        | Raffineriearbeiter                         | 60                | Ceramit, Treibstoffzellen           |
| Glaube            | Prediger, Ordenspriester                   | 100               | Reclusiam                           |
| Gensaat           | Reifung, Bergung                           | 3 (+3 je Apoth.)  | Implantation, Gründung              |
| Ruhm              | Einsätze, Feldzüge                         | kein Limit        | Beziehungen, Vermächtnis            |
| Archäotech        | Einsätze, Mechanicus                       | kein Limit        | späte Lehren, Verbesserungen, Schiffe |
| Navigationsdaten  | Visionen, Navigatorenhaus                  | kein Limit        | Feldzüge                            |
| Grox-Fleisch*     | Einsatz Grox-Jagd                          | 30                | Luxus                               |
| Amasec*           | Freihändler                                | 30                | Luxus                               |
| Weihrauch*        | Ekklesiarchie                              | 30                | Luxus, Glaube                       |

\* Luxusgut. Hergestellte Waren aus der Schmiede haben kein Limit.

## Festung (Klicks und Gebäude)

Klicks, jederzeit: „Trümmer durchsuchen“ (+1 Schrott), „Vorräte bergen“ (+1 Vorräte).

Preis des n-ten Gebäudes = Basis × Faktor^n (White Scars × 1,15).

| Gebäude          | Basis-Kosten                           | Faktor | Wirkung                                                               | ab                                   | Etappe |
|------------------|----------------------------------------|--------|-----------------------------------------------------------------------|--------------------------------------|--------|
| Hydrokulturfarm  | 10 Vorräte                             | 1,12   | +0,5 Vorräte/s (Planetenzeit)                                         | Start                                | 1      |
| Knechtsquartier  | 12 Schrott                             | 1,6    | +2 Knechte-Plätze                                                     | Start                                | 1      |
| Skriptorium      | 25 Schrott, 10 Vorräte                 | 1,15   | Job Schreiber; Wissen-Lager +100, Wissen +5 %                          | erster Knecht                        | 1      |
| Speicher         | 40 Schrott                             | 1,3    | Lager: Vorräte +150, Schrott +100, Erz +100                           | Lagerhaltung                         | 1      |
| Bergungsplatz    | 50 Schrott                             | 1,2    | Schrottsammler +20 %, Schrott-Lager +60                               | Bergung                              | 1      |
| Apothecarion     | 150 Schrott, 80 Vorräte                | 1,5    | +1 Implantationsplatz, Gensaat-Lager +3; das erste weckt die Brüder   | Sus-an-Studien                       | 2      |
| Mine             | 60 Schrott                             | 1,2    | Job Bergmann; Bergmann +20 %, Erz-Lager +80                           | Ort Erzader                          | 2      |
| Zellentrakt      | 60 Schrott, 40 Erz                     | 1,25   | +5 Brüder-Plätze                                                      | Zellenbau                            | 2      |
| Prüfungsarena    | 80 Schrott, 40 Erz                     | 1,4    | +0,001 Aspiranten/s, Aspiranten-Lager +2                              | Prüfungsrituale                      | 2      |
| Übungskäfige     | 60 Erz, 40 Schrott                     | 1,3    | Ausbildung −10 % (höchstens −50 %), Kampfkraft +2 %                   | Kodex-Drill                          | 2      |
| Archivum         | 150 Schrott, 80 Erz                    | 1,25   | Wissen-Lager +20 % (prozentual)                                       | Gensaat-Kunde                        | 3      |
| Bastion          | 120 Erz, 60 Schrott                    | 1,25   | Verteidigung +20                                                      | Befestigung                          | 3      |
| Waffenkammer     | 150 Erz, 80 Schrott                    | 1,3    | Kampfkraft +5 %                                                       | Waffenkunde                          | 3      |
| Schmiede         | 100 Erz, 100 Schrott                   | 1,15   | Handwerk; Ausbeute +6 % je Schmiede                                   | Schmiedekunst                        | 4      |
| Raffinerie       | 80 Erz, 60 Schrott                     | 1,2    | Job Raffineriearbeiter; Promethium-Lager +60                          | Raffination                          | 4      |
| Hab-Block        | 5 Plastahl, 60 Erz                     | 1,25   | +5 Knechte-Plätze                                                     | Bautechnik                           | 4      |
| Lagerhalle       | 5 Plastahl, 3 Ceramit                  | 1,2    | Lager: Vorräte +300, Schrott +200, Erz +200, Promethium +60, Luxus je +20 | Logistik                         | 4      |
| Servitor-Zelle   | 8 Plastahl, 2 Archäotech               | 1,4    | Knopf: 1 Knecht + 5 Plastahl → 1 Servitor; Servitoren +10 % je Zelle  | Mechanicus-Ansehen Stufe 1           | 6      |
| Schrein          | 150 Schrott, 50 Erz                    | 1,2    | Job Prediger; Glaube-Lager +50, Glaube +5 %                           | Liturgie                             | 5      |
| Reclusiam        | 10 Ceramit, 100 Glaube                 | 1,3    | Glaube-Lager +100, Glaube +10 %, Litaneien +5 %; Riten, Litaneien, Messe | Liturgie                             | 5      |
| Astropathenturm  | 8 Plastahl, 4 Ceramit                  | 1,3    | Visionen; Auto-Fang +10 % je Turm                                     | Astropathie                          | 6      |
| Handelskontor    | 10 Plastahl                            | 1,2    | Tausch-Ausbeute +5 %                                                  | Handelsrecht                         | 6      |
| Landeplattform   | 10 Ceramit, 10 Plastahl                | 1,3    | Platz für 3 Thunderhawks; Reiter Flotte                               | Flugtechnik                          | 7      |
| Orbitalwerft     | 30 Ceramit, 20 Plastahl, 5 Archäotech  | 1,4    | Platz für 2 Angriffskreuzer; Schlachtbarke                            | Orbitalbau                           | 7      |
| Gensaat-Tresor   | 10 Ceramit, 2 Archäotech               | 1,3    | Gensaat-Lager +10                                                     | Stasis-Technik                       | 7      |

## Jobs (Knechte)

| Job                 | Wirkung                                    | ab                   | Etappe |
|---------------------|--------------------------------------------|----------------------|--------|
| Schrottsammler      | +0,3 Schrott/s                             | erster Knecht        | 1      |
| Bauer               | +1 Vorräte/s (Planetenzeit)                | Hydroponik           | 1      |
| Schreiber           | +0,15 Wissen/s                             | Skriptorium          | 1      |
| Bergmann            | +0,25 Erz/s                                | Mine                 | 2      |
| Raffineriearbeiter  | +0,08 Promethium/s                         | Raffinerie           | 4      |
| Prediger            | +0,05 Glaube/s, Moral +0,5 % (höchstens +10 %) | Schrein          | 5      |

Reiter Orden: je Job „−“ und „+“, Anzahl, Wirkung; oben „frei: n“.

## Librarium (kostet Wissen)

| Lehre                 | Kosten (Wissen)                         | braucht                               | schaltet frei                                           | Etappe |
|-----------------------|-----------------------------------------|---------------------------------------|---------------------------------------------------------|--------|
| Imperialer Kalender   | 15                                      | –                                     | Datum- und Planetenzeit-Anzeige                         | 1      |
| Hydroponik            | 30                                      | –                                     | Bauer                                                   | 1      |
| Lagerhaltung          | 60                                      | Imperialer Kalender                   | Speicher                                                | 1      |
| Bergung               | 90                                      | Hydroponik                            | Bergungsplatz                                           | 1      |
| Sus-an-Studien        | 800                                     | Lagerhaltung, Bergung                 | Apothecarion, Reiter Einsätze (Aufklärung)              | 2      |
| Gensaat-Kunde         | 1.200                                   | Sus-an-Studien                        | Implantation, Amt Apothecarius, Archivum                | 2      |
| Zellenbau             | 1.400                                   | Sus-an-Studien, Ort Erzader           | Zellentrakt                                             | 2      |
| Prüfungsrituale       | 1.600                                   | Gensaat-Kunde, Ort Stammesland        | Prüfungsarena                                           | 2      |
| Kodex-Drill           | 2.400                                   | Prüfungsrituale                       | Übungskäfige                                            | 2      |
| Librarius             | 3.000                                   | Gensaat-Kunde                         | Amt Scriptor                                            | 2      |
| Kampfdoktrin          | 2.800                                   | Kodex-Drill                           | Kampfeinsätze, Aschewüste                               | 3      |
| Befestigung           | 3.200                                   | Kampfdoktrin, Ort Aschewüste          | Bastion, Verteidigung                                   | 3      |
| Waffenkunde           | 4.000                                   | Kampfdoktrin                          | Waffenkammer                                            | 3      |
| Einsatzplanung        | 6.000                                   | Kampfdoktrin                          | Einsatzbefehle (Wiederholen)                            | 3      |
| Schmiedekunst         | 4.000                                   | Waffenkunde                           | Schmiede, Plastahl, Servoschädel, Reiter Schmiede       | 4      |
| Raffination           | 4.500                                   | Schmiedekunst, Ort Promethium-Quelle  | Raffinerie, Ceramit, Treibstoffzelle                    | 4      |
| Munitorum-Verwaltung  | 5.000                                   | Schmiedekunst                         | Job für neue Knechte                                    | 4      |
| Logistik              | 6.000                                   | Munitorum-Verwaltung                  | Lagerhalle                                              | 4      |
| Bautechnik            | 6.500                                   | Schmiedekunst, Ort Makropol-Ruine     | Hab-Block                                               | 4      |
| Datenarchive          | 7.500                                   | Schmiedekunst                         | Datentafel                                              | 4      |
| Liturgie              | 5.000                                   | Ort Alte Kathedrale                   | Schrein, Reclusiam, Amt Ordenspriester, Reiter Reclusiam| 5      |
| Astropathie           | 12.000 + 5 Datentafeln                  | Ort Astropathen-Station               | Astropathenturm, Visionen, Reiter Beziehungen           | 6      |
| Handelsrecht          | 15.000                                  | Astropathie                           | Handelskontor                                           | 6      |
| Stasis-Technik        | 20.000 + 2 Archäotech                   | Gensaat-Kunde, Datenarchive           | Gensaat-Tresor                                          | 7      |
| Flugtechnik           | 18.000 + 10 Datentafeln                 | Ort Raumhafen-Ruine                   | Landeplattform, Thunderhawk                             | 7      |
| Warpnavigation        | 25.000 + 5 Navigationsdaten             | Flugtechnik                           | Sektorkarte, Feldzüge                                   | 7      |
| Orbitalbau            | 32.000 + 3 Archäotech                   | Warpnavigation                        | Orbitalwerft, Angriffskreuzer, Schlachtbarke            | 7      |
| Gründungsrecht        | 45.000 + 25 Datentafeln + 10 Archäotech | Orbitalbau                            | Nachfolgeorden, Reiter Vermächtnis                      | 8      |

Sichtbar ist eine Lehre, sobald ihre Voraussetzungen erfüllt sind.

## Einsätze

Reiter Einsätze. Trupps bestehen aus freien Kampfbrüdern und Wulfen (nicht im Amt, nicht unterwegs; Wulfen zuerst).
Neophyten kämpfen nicht, sie trainieren.

### Aufklärung (ersetzt Kittens' Erkundung)

- Einen Ort wählen, 1 freien Kampfbruder schicken, Dauer abwarten. Aufklärung gelingt immer, ohne Verluste.
  Dauer × (1 − Einsatz-Tempo, z. B. White Scars 30 %) × Planetenzeit (Sturmzeit 1,25).
- Sichtbar sind entdeckte Orte und die nächsten zwei; weitere stehen als „???“ da.

| Ort                  | Dauer   | bringt                                                        | Etappe |
|----------------------|---------|---------------------------------------------------------------|--------|
| Absturzstelle        | 60 s    | Gensaat-Kammer des Wracks: +5 Gensaat, +40 Schrott            | 2      |
| Erzader              | 180 s   | Mine, Zellenbau                                               | 2      |
| Stammesland          | 300 s   | Prüfungsrituale, Zuzug +10 %                                  | 2      |
| Aschewüste           | 600 s   | Ork-Plünderer (Bedrohung beginnt), Kampfeinsätze; aufklärbar ab Kampfdoktrin | 3 |
| Promethium-Quelle    | 900 s   | Raffination                                                   | 4      |
| Makropol-Ruine       | 1.200 s | Bautechnik, Einsatz Makropol-Säuberung, Genestealer-Kult      | 4      |
| Alte Kathedrale      | 1.800 s | Liturgie, Partner Ekklesiarchie                               | 5      |
| Astropathen-Station  | 2.400 s | Astropathie; aufklärbar ab Datenarchive                       | 6      |
| Raumhafen-Ruine      | 3.600 s | Flugtechnik; aufklärbar ab Astropathie                        | 7      |

### Kampfeinsätze (ersetzen Kittens' Jagd)

- Alle Kampfeinsätze brauchen die Lehre Kampfdoktrin.
- Einsatz wählen, Truppgröße einstellen, entsenden. Nach der Dauer: Erfolg oder Fehlschlag, Beute, Verluste.
- Kampfkraft je Mitglied: Kampfbruder 10, Wulf 20, × (1 + Boni).
- r = Stärke des Trupps ÷ Bedrohung. Chance = 50 % + 40 % × log₂ r, begrenzt auf 5–95 %.
- Verlust-Chance je Mitglied: bei Erfolg 2 % ÷ r, bei Fehlschlag 25 % ÷ r, höchstens 50 %.
  Je Gefallenem wird Gensaat geborgen: 50 % + 10 % je Apothecarius, höchstens 90 %.
- Beute nur bei Erfolg, × (1 + Boni). Space Wolves +25 %, Dark Angels Archäotech +50 %.

| Einsatz                  | Bedrohung | Dauer   | Trupp  | Beute                                             | ab                            | Etappe |
|--------------------------|-----------|---------|--------|---------------------------------------------------|-------------------------------|--------|
| Ork-Plünderer vertreiben | 30        | 240 s   | 3–5    | 60 Schrott, 5 Ruhm; Bedrohung −10                 | Aschewüste                    | 3      |
| Grox-Jagd                | 20        | 300 s   | 2–3    | 10 Grox-Fleisch                                   | Kampfdoktrin                  | 3      |
| Wrackfelder plündern     | 40        | 600 s   | 3–5    | 200 Schrott, 30 Erz; 10 % Chance auf 1 Archäotech | Aschewüste                    | 3      |
| Ork-Lager zerschlagen    | 120       | 1.200 s | 5–10   | 400 Schrott, 40 Ruhm; Bedrohung −40               | Aschewüste, Waffenkunde       | 3      |
| Makropol-Säuberung       | 250       | 1.800 s | 8–15   | 2 Archäotech, 60 Ruhm                             | Makropol-Ruine                | 4      |
| Kult zerschlagen         | 150       | 900 s   | 5–10   | 40 Ruhm, beendet Genestealer-Kult                 | Ereignis Genestealer-Kult     | 6      |
| Jagd auf einen Gefallenen| 300       | 2.400 s | 10     | 200 Ruhm, 3 Archäotech                            | nur Dark Angels, selten       | 5      |

Einsatzbefehle (ab Einsatzplanung, White Scars ab Start): Schalter „Wiederholen“ je Einsatz; der Trupp zieht
wieder los, sobald genug freie Mitglieder da sind.

### Bedrohung und Überfälle

- Ab Entdeckung der Aschewüste wächst die Bedrohung: +0,01/s, höchstens 500. Kampfeinsätze senken sie.
- Verteidigung = 10 × Kampfbrüder daheim (Amtsträger zählen halb) × Kampfkraft-Boni + 20 je Bastion.
- Alle 300 s: Ist die Bedrohung größer als die Verteidigung, kommt ein Überfall:
  −10 % Vorräte, Schrott und Erz; 20 % Chance, dass ein Knecht verschleppt wird. Gebäude bleiben heil.
- Offline zählen höchstens 3 Überfälle.

## Schmiede

Herstellen mit „+1“, „+10“, „max“. Ausbeute × (1 + 6 % je Schmiede + Boni).

| Ware            | Zutaten                               | Nutzen                                       | Etappe |
|-----------------|---------------------------------------|----------------------------------------------|--------|
| Plastahl        | 50 Schrott                            | Bauen, Verbesserungen                        | 4      |
| Ceramit         | 40 Erz, 10 Promethium                 | Bauen, Rüstung, Schiffe                      | 4      |
| Treibstoffzelle | 60 Promethium, 1 Plastahl             | Schiffe, Feldzüge                            | 4      |
| Datentafel      | 150 Wissen, 1 Plastahl                | späte Lehren; Wissen-Lager +50 je Tafel      | 4      |
| Servoschädel    | 1 Archäotech, 3 Plastahl              | Aufklärung −2 % Dauer je Schädel (höchstens −40 %) | 4 |
| Reliquiar       | 2 Archäotech, 5 Ceramit, 100 Glaube   | Litaneien +10 % je Reliquiar (höchstens 5)   | 5      |

Verbesserungen (einmalig), sichtbar, sobald alle Waren in ihren Kosten freigeschaltet sind:

| Verbesserung               | Kosten                                  | Wirkung                                  |
|----------------------------|-----------------------------------------|------------------------------------------|
| Verstärkte Spaten          | 10 Plastahl, 300 Wissen                 | Bauer +25 %                              |
| Magnetkräne                | 10 Plastahl, 300 Wissen                 | Schrottsammler +25 %                     |
| Bohrservitoren             | 15 Plastahl, 500 Wissen                 | Bergmann +25 %                           |
| Lumen-Leuchter             | 15 Plastahl, 600 Wissen                 | Schreiber +25 %                          |
| Godwyn-Bolter              | 20 Plastahl, 10 Ceramit                 | Kampfkraft +25 %                         |
| Aquila-Rüstung Mk VII      | 30 Ceramit, 800 Wissen                  | Kampfkraft +15 %, Verluste −25 %         |
| Narthecium                 | 10 Ceramit, 2 Archäotech                | Gensaat-Bergung +20 %                    |
| Stasiskapseln              | 10 Ceramit, 1.000 Wissen                | Gensaat-Lager +50 %                      |
| Verstärkte Lagerhallen     | 25 Plastahl, 1.200 Wissen               | Speicher und Lagerhallen +50 %           |
| Auspex-Scanner             | 5 Servoschädel, 1.500 Wissen            | Aufklärung −25 % Dauer                   |
| Plasmaschmiede             | 20 Ceramit, 3 Archäotech                | Schmiede-Ausbeute +10 %                  |
| Weihrauchbrenner           | 10 Plastahl, 500 Glaube                 | Glaube +20 %                             |
| Servoschädel-Schwarm       | 10 Servoschädel, 2.500 Wissen           | Wissen +15 %                             |
| Promethium-Crackanlage     | 20 Ceramit, 2.000 Wissen                | Raffineriearbeiter +25 %                 |
| Hololithischer Kartentisch | 5 Datentafeln, 5 Archäotech             | Feldzüge −20 % Dauer                     |

Servitoren: im Reiter Schmiede ein Rezept wählen, alle Servitoren stellen es her (0,02 Ausführungen/s je Servitor);
ohne Rezept sammeln sie weiter Schrott. Hergestellte Waren stehen nur im Reiter Schmiede.
Weihrauchbrenner kommt mit Etappe 5 (braucht Glaube), der Hololithische Kartentisch mit Etappe 7.
Promethium-Quelle und Makropol-Ruine sind ab Schmiedekunst aufklärbar.

## Reclusiam

- Glaube aus Predigern, Ordenspriestern, Schrein (+5 %) und Reclusiam (+10 %); Frostzeit ×1,25.
- Riten, Litaneien und Große Messe brauchen ein Reclusiam. Litaneien lassen sich auch verstummen (spart Glaube).
- Riten (einmalig):

| Ritus                     | Glaube | Wirkung                                          |
|---------------------------|--------|--------------------------------------------------|
| Segnung der Waffen        | 100    | Kampfkraft +10 %                                 |
| Hymne der Arbeit          | 150    | Knechte-Jobs +10 %                               |
| Litanei der Wachsamkeit   | 200    | Verteidigung +20 %                               |
| Andacht der Gefallenen    | 300    | Gensaat-Bergung +20 %                            |
| Ritus der Reinheit        | 450    | Moral +10 %                                      |
| Hymnus des Lichts         | 650    | Wissen +10 %                                     |
| Fest des Primarchen       | 900    | Litaneien +25 %, Litaneien Standhaftigkeit und Reinheit |
| Ewige Andacht             | 1.500  | gesamte Produktion +10 %                         |

- Litaneien: eine wählen, gilt 1 Jahr (1.000 s), kostet 30 Glaube + 1 je 10 Knechte. Die zuletzt gewählte
  erneuert sich automatisch, wenn genug Glaube da ist.
  Zorn des Imperators (Kampfkraft +30 %), Fleiß (Knechte-Jobs +20 %), Weisheit (Wissen +30 %),
  ab Fest des Primarchen Standhaftigkeit (Verteidigung +50 %) und Reinheit (Moral +15 %).
- Große Messe: opfert allen Glauben. Frömmigkeit += geopferter Glaube. Dauerbonus: Produktion + √Frömmigkeit ÷ 10 %.
- Roter Durst (Blood Angels): 0–100 %. +5 % je Kampfeinsatz, −0,01 %/s je Sanguinischem Priester.
  Bei 100 %: Schwarzer Zorn. Ein freier Bruder geht in die Todeskompanie: Der nächste Kampfeinsatz bekommt
  doppelte Kampfkraft, der Bruder fällt sicher (Gensaat wird geborgen). Danach Durst 50 %.
  Es wartet höchstens ein Bruder in der Todeskompanie; ohne freien Bruder wartet der Zorn.
- Jagd auf die Gefallenen (Dark Angels): Das Ereignis „Spur eines Gefallenen“ öffnet den Einsatz (Bedrohung 300,
  2.400 s, genau 10 Brüder, 200 Ruhm + 3 Archäotech); nach dem Sieg ist die Spur kalt.
- Kompanien zählen als Höchststand: Jede neue volle Kompanie kommt einmal in den Liber Honoris.
- Ordens-Ereignisse starten mit dieser Etappe (siehe Ereignisse).

## Beziehungen (ersetzt Kittens' Handel)

- Partner werden über Orte, Lehren und Ereignisse kontaktiert. Tauschen ab Astropathie.
  Das Navigatorenhaus kommt erst mit Etappe 7 (Warpnavigation), die Inquisition mit dem Kult-Einsatz.
- „Tauschen“: festes Paket. Ausbeute × (1 + Handelskontore + 10 % je Ansehen-Stufe).
- Ansehen: +1 je Tausch (Dark Angels +0,75). Stufen bei 5 / 15 / 35 / 70 / 120. Jede Stufe bringt die Hilfe einmal mehr.
- Ab Stufe 2: Dauerauftrag. Tauscht automatisch, solange die abgegebene Ware über 80 % ihres Lagers liegt,
  höchstens alle 10 s. Waren ohne Lager (z. B. Ruhm) brauchen einen Mindestbestand von 5 Paketen.
- Haus Valkar im Hafen (Ereignis Freihändler nach dem ersten Kontakt): der nächste Tausch mit ihm bringt +50 %.
- Astra Militarum gibt Knechte nur, so weit Platz ist. „Kult zerschlagen“ öffnet den Kontakt zur Inquisition.
- Hilfe je Stufe wirkt als Effekt (z. B. Mechanicus Stufe 3: Schmiede +9 %). Mechanicus-Stufe 1 schaltet die
  Servitor-Zelle frei, Stufe 2 das Amt Techmarine.

| Partner                       | Kontakt                         | will             | gibt                           | Hilfe je Stufe                               |
|-------------------------------|---------------------------------|------------------|--------------------------------|----------------------------------------------|
| Adeptus Mechanicus            | Astropathie                     | 2 Archäotech     | 15 Ceramit, 5 Plastahl         | Schmiede +3 %; Stufe 1 Servitor-Zelle, Stufe 2 Techmarine |
| Agrarwelt Varos               | Astropathie                     | 4 Plastahl       | 500 Vorräte                    | Vorräte +3 %                                 |
| Astra Militarum (Restregiment)| Astropathie, Aschewüste         | 300 Vorräte      | 2 Knechte (wenn Platz frei)    | Verteidigung +5 %                            |
| Ekklesiarchie                 | Alte Kathedrale                 | 20 Ruhm          | 10 Weihrauch, 40 Glaube        | Glaube +3 %                                  |
| Freihändler Haus Valkar       | Ereignis Freihändler            | 60 Promethium    | 8 Amasec                       | Tausch-Ausbeute +3 %                         |
| Navigatorenhaus Castellan     | Warpnavigation                  | 120 Promethium   | 2 Navigationsdaten             | Feldzüge −3 % Dauer                          |
| Inquisition (Ordo Hereticus)  | Kult zerschlagen                | 60 Ruhm          | 1 Archäotech                   | Bedrohungs-Wachstum −5 %                     |

## Flotte und Sektor (ersetzt Kittens' Weltraum)

Schiffe (Reiter Flotte), Preis = Basis × Faktor^n:

| Schiff            | Kosten                                                         | Faktor    | Wirkung                                   |
|-------------------|----------------------------------------------------------------|-----------|-------------------------------------------|
| Thunderhawk       | 15 Ceramit, 10 Plastahl, 2 Treibstoffzellen                    | 1,25      | Flottenstärke 10, Aufklärung −10 % Dauer  |
| Angriffskreuzer   | 60 Ceramit, 40 Plastahl, 5 Archäotech, 10 Treibstoffzellen     | 1,5       | Flottenstärke 50                          |
| Schlachtbarke     | 300 Ceramit, 200 Plastahl, 25 Archäotech, 40 Treibstoffzellen  | einmalig  | Flottenstärke 300, Ruhm +10 %             |

Sektorkarte (ab Warpnavigation): 12 Systeme als Knoten. Ein Feldzug geht nur zu einem Nachbarn eines befreiten Systems,
einer zur Zeit, mit 5–50 freien Kämpfern (Wulfen zuerst). Aufklärung wird höchstens 80 % kürzer, Feldzüge ebenso.
Kosten: Navigationsdaten und Treibstoffzellen (je 2 × Navigationsdaten). Stärke = Flottenstärke + Kampfkraft des Trupps.
Chance, Verluste und Gensaat-Bergung wie bei Kampfeinsätzen. Dauer 1–6 Stunden. Erfolg: befreit, Dauerbonus bis zum Neustart.

| System            | Art              | Bedrohung | Navigationsdaten | Dauer  | Nachbarn                           | Bonus                                        |
|-------------------|------------------|-----------|------------------|--------|------------------------------------|----------------------------------------------|
| Kharos Tertius    | Heimat           | –         | –                | –      | Varos, Tyrrhen                      | –                                            |
| Varos Agraria     | Agrarwelt        | 150       | 2                | 1 h    | Kharos, Sankt Oriel, Metallum       | Vorräte +15 %                                |
| Tyrrhen           | Makropolwelt     | 300       | 3                | 1,5 h  | Kharos, Ossuar, Vhal                | Knechte-Plätze +10 %, Zuzug +20 %            |
| Metallum Sekundus | Schmiedewelt     | 400       | 4                | 2 h    | Varos, Leuchtfeuer                  | Schmiede-Ausbeute +15 %                      |
| Sankt Oriel       | Kathedralwelt    | 350       | 4                | 2 h    | Varos, Gorkfang                     | Glaube +20 %                                 |
| Ossuar            | Totenwelt        | 500       | 5                | 2,5 h  | Tyrrhen, Sündenbrecher              | Archäotech aus Einsätzen +25 %               |
| Vhal Glacialis    | Eiswelt          | 450       | 5                | 2,5 h  | Tyrrhen, Kathar Nihil               | Promethium +20 %                             |
| Leuchtfeuer       | Navigatorenposten| 600       | 6                | 3 h    | Metallum, Aeternum                  | +1 Navigationsdaten je Vision                |
| Gorkfang          | Orkwelt          | 1.000     | 6                | 4 h    | Sankt Oriel, Aeternum               | Bedrohungs-Wachstum −50 %, 300 Ruhm          |
| Sündenbrecher     | Space Hulk       | 1.200     | 8                | 4 h    | Ossuar, Aeternum                    | einmalig 10 Archäotech                       |
| Kathar Nihil      | Chaoswelt        | 1.500     | 8                | 5 h    | Vhal, Aeternum                      | Kampfkraft +10 %, Vermächtnis +5             |
| Aeternum-Riss     | Riss-Rand        | 2.500     | 10               | 6 h    | Leuchtfeuer, Gorkfang, Sündenbrecher, Kathar | Vermächtnis +10, Eintrag im Liber Honoris |

Warpsturm (Ereignis): Feldzüge pausieren, ihre Restzeit läuft erst danach weiter.

## Ereignisse

| Ereignis                 | ab                   | Häufigkeit                   | Wirkung                                                                 |
|--------------------------|----------------------|------------------------------|-------------------------------------------------------------------------|
| Astropathische Vision    | Astropathie          | im Schnitt alle 400 s        | 15 s im festen Platz der Kopfzeile, Antippen +1 Navigationsdaten; Auto-Fang 10 % je Astropathenturm (höchstens 100 %). Offline zählt nur der Auto-Fang. |
| Freihändler legt an      | Astropathie          | im Schnitt alle 3 Jahre      | beim ersten Mal Kontakt Haus Valkar, danach 1 Tausch mit +50 %           |
| Warpsturm                | Astropathie          | im Schnitt alle 8 Jahre      | 1 Jahr: keine Visionen, Feldzüge pausieren, Glaube +50 %                 |
| Ork-WAAAGH!              | Aschewüste           | im Schnitt alle 6 Jahre      | Bedrohung +100                                                          |
| Genestealer-Kult         | Makropol-Ruine       | im Schnitt alle 10 Jahre     | Zuzug −50 %, bis „Kult zerschlagen“ gelingt                              |
| Ordens-Ereignisse        | Liturgie             | im Schnitt alle 2 Jahre      | 6 je Orden, kleine Wirkung plus Flair                                   |

Ordens-Ereignisse: je Orden 6 Stück in `data.js`, jedes eine Log-Zeile plus genau eine Wirkung aus
{Ressourcen-Geschenk, Bonus für 1 Jahr, Roter Durst ±}. Beispiele:
UM „Ein Bruder zitiert den Kodex. Zum dritten Mal heute. Die Knechte arbeiten schneller.“ (Knechte-Jobs +10 %, 1 Jahr) ·
BA „Bruder {Name} träumt von Sanguinius' Fall.“ (Durst +10 %) ·
SW „Die Brüder feiern mit Mjod. Niemand weiß, woher er kommt.“ (+10 Grox-Fleisch) ·
DA „Ein Scriptor findet einen Namen in alten Akten. Er schweigt.“ (+1 Archäotech) ·
SAL „Die Brüder schmieden bis in die Nacht.“ (Schmiede-Ausbeute +20 %, 1 Jahr) ·
WS „Ein Bruder reitet allein in den Sturm und kehrt mit Beute zurück.“ (+100 Schrott).

Dazu reine Flair-Zeilen im Log (Servitoren, Wetter, Brüder): alle 600 s eine, nur solange jemand zuschaut
(nicht beim Nachholen, sonst verdrängt eine Nacht voller Flair die echten Meldungen).

## Nachfolgeorden (Neustart)

- Bedingung: Lehre Gründungsrecht, 100 Kampfbrüder, Gensaat-Zehnt 20 Gensaat.
- Ablauf im Reiter Vermächtnis: „Nachfolgeorden gründen“, Bestätigung, Name (höchstens 24 Zeichen, Vorschlag aus
  einer Liste je Linie in `data.js`), Farben (8 heraldische Paletten oder die der Linie), Linie (einer der 6 Orden).
- Der Reiter Vermächtnis erscheint mit der Lehre Gründungsrecht (oder sobald Vermächtnis da ist). Relikte wirken sofort;
  ihr Startpaket gilt ab der nächsten Gründung. Der Zehnt (20 Gensaat) wird bei der Gründung verbraucht.
- Der Linienbonus (Feld `boost` je Orden) wächst um 25 % je Stufe; Eigenheiten und Makel bleiben gleich.
- Vermächtnis = ⌊Kampfbrüder ÷ 10⌋ + ⌊Ruhm ÷ 500⌋ + Vermächtnis-Boni befreiter Systeme.
- Jeder jemals verdiente Punkt: +1 % Produktion und Lager, dauerhaft. Freie Punkte kaufen Ordensrelikte;
  Ausgeben senkt den Prozent-Bonus nicht.
- Linienstufe: +1 für die Linie des gegründeten Ordens. Linienbonus × (1 + 25 % je Stufe).
- Space Wolves: Der Knopf heißt „Neue Große Kompanie“, sonst gleich.
- Bleibt: Vermächtnis, Ordensrelikte, Linienstufen, Liber Honoris, Einstellungen. Alles andere beginnt neu.

| Ordensrelikt               | Vermächtnis | Wirkung                                                              |
|----------------------------|-------------|----------------------------------------------------------------------|
| Banner des Gründers        | 5           | Start mit 50 Schrott, 50 Vorräten, 1 Hydrokulturfarm, 1 Knechtsquartier |
| Kodex-Abschrift            | 10          | Imperialer Kalender, Hydroponik, Lagerhaltung, Bergung schon erforscht |
| Gensaat-Reserve            | 15          | Start mit 5 Gensaat, Gensaat-Lager +5                                |
| Karte der Vorfahren        | 20          | Absturzstelle, Erzader, Stammesland schon entdeckt                   |
| Veteranen-Trupp            | 25          | 5 weitere Brüder im Sus-an-Koma, Wrack-Quartiere +5                  |
| Servoschädel des Archivars | 30          | Wissen +15 %                                                         |
| Ewige Wacht                | 40          | Offline zählt bis 7 Tage                                             |
| Heiliger Bolter            | 50          | Kampfkraft +15 %                                                     |
| Astropathen-Chor           | 60          | Visionen ×2, Auto-Fang +25 %                                         |
| Rüstung des Ordensmeisters | 80          | Verluste −25 %                                                       |
| Stasis-Tresor              | 100         | Gensaat reift +25 %                                                  |

## Liber Honoris

- Meilensteine schreiben eine Zeile mit imperialem Datum, z. B. „0.412.013.M42 · Ultramarines: Erster Neophyt ernannt.“
- Gruppiert je Orden, bleibt über Neustarts.
- Die Meilensteine werden ab Etappe 1 in `meta.honors` notiert; der Reiter kommt mit Etappe 8 und erscheint ab
  5 Einträgen (je Orden ein Block, neueste zuerst).
- Meilensteine: erster Knecht, erste Lehre, Brüder erwachen, erster Neophyt, erster Kampfeinsatz, erster Gefallener,
  jeder Ort, jede Kompanie, jedes befreite System, jede Ansehen-Stufe 5, erste Große Messe, jeder Nachfolgeorden.

## Automatik im Überblick

Apothecarion (Implantation startet selbst) · Munitorum-Verwaltung (Job für neue Knechte) · Servitoren (Herstellen) ·
Einsatzbefehle (Wiederholen) · Daueraufträge (Tausch) · Litaneien (erneuern sich) · Astropathentürme (Visionen) ·
Ordensrelikt Ewige Wacht (7 Tage offline).

## Formeln

- Produktion je Ressource = (Σ Gebäude-Basis × Anzahl + Σ Job-Basis × Anzahl × M + Ämter + Servitoren)
  × (1 + Σ Boni) × Planetenzeit × Litanei × (1 + Kompanien-Bonus) × (1 + 1 % × Vermächtnis gesamt).
- M = Moral (siehe Knechte). Hunger-Abzug gilt nicht für Bauern.
- Verbrauch Vorräte = 0,3 × Knechte + 0,3 × Aspiranten + 0,4 × (Neophyten + Kampfbrüder + Wulfen).
- Lager = (Basis + Σ Gebäude-Lager) × (1 + Lager-Boni + 1 % × Vermächtnis gesamt).
- Preis = Basis × Faktor^Anzahl (White Scars: Gebäude × 1,15).
- „Zuzug +x %“ heißt: Zuzugs-Intervall = 20 s ÷ (1 + x). „Dauer −x %“ heißt: Dauer × (1 − x).
  „Reift x % langsamer“ heißt: Rate × (1 − x). Alle „+x %“-Boni derselben Größe werden addiert.
- Einsatz: r = Stärke ÷ Bedrohung; Chance = min(95 %, max(5 %, 50 % + 40 % × log₂ r)).

## Technik

```
gensaat/
  index.html
  style.css
  serve.py          lokaler Server ohne Cache: python serve.py 8934
  js/data.js        alle Inhalte als Tabellen, sonst nichts
  js/engine.js      Spiellogik ohne DOM (Browser und Node)
  js/ui.js          Anzeige, Eingaben, Speichern, Schleife
  test.js           node test.js: Prüfungen; node test.js tempo: Tempo-Bot
  docs/superpowers/specs/, docs/superpowers/plans/
  icons/            icon.svg, icon-192.png (Homescreen, iOS)
  manifest.webmanifest, sw.js   Homescreen und offline (Service Worker)
```

Vanilla JS ohne Framework und ohne Build, Bauweise wie Fledermauskolonie. `data.js` und `engine.js` hängen sich
im Browser an `window` und exportieren in Node über `module.exports`. Allgemeine Teile (Zahlenformat, Speichern,
Export, Offline, Tempo-Bot) werden aus Fledermauskolonie übernommen und angepasst; Fledermauskolonie bleibt unberührt.

Engine:
- `Engine.create(chapterId, meta)` gibt einen neuen Spielstand (meta = Vermächtnis, Relikte, Linienstufen, Liber Honoris).
- `Engine.step(s, dt)` rückt die Zeit vor (dt ≤ 1 s): Produktion, Verbrauch, Hunger, Zuzug, Implantation,
  Einsätze, Ereignisse, Automatik.
- `Engine.rates(s)` liefert die aktuellen Raten je Ressource für die Anzeige.
- Aktionen geben `true` oder `false` zurück (ging es?): `click`, `build`, `research`, `assign`, `setAutoJob`,
  `setOffice`, `scout`, `sendMission`, `setRepeat`, `craft`, `setServitorRecipe`, `buyUpgrade`, `rite`,
  `chooseLitany`, `grandMass`, `trade`, `setStandingOrder`, `buildShip`, `campaign`, `catchVision`,
  `buyRelic`, `found(name, palette, lineage)`.
- `Engine.simulate(s, seconds)` holt Zeit in 1-s-Schritten nach und liefert eine Zusammenfassung.
- Log-Ereignisse landen in `s.log` (höchstens 100), die UI zeigt sie an.
- Zufall über `Engine.rng`, in Tests austauschbar.
- Effekte werden aus `data.js` summiert und nur nach Änderungen an Gebäuden, Jobs, Lehren usw. neu berechnet.

UI: Schleife alle 200 ms mit dt aus `Date.now()`. Liegt dt über 5 s (Seite war pausiert), läuft `simulate()`.
Reiter-Inhalte werden beim Wechsel einmal gebaut, danach ändern sich nur Zahlen, Rot und Grau.
Neue Freischaltungen hängen sich hinten an. Beim ersten Start zeigt die UI die Ordenswahl (6 Karten mit Farben,
Bonus, Eigenheit, Makel), danach das Spiel.

Spielstand:
- JSON mit `v` (Version), `time`, Beständen, Anzahlen, Jobs, Lehren, Orten, Brüdern, Einsätzen, Ansehen,
  Reclusiam, Sektor, Orden und Meta. Fehlt ein neuer Inhalt in einem alten Stand, gilt 0. `migrate()` hebt alte Versionen an.
- localStorage-Schlüssel `gensaat`. Speichern alle 30 s, bei `visibilitychange` (versteckt) und bei `pagehide`.
- Export und Import im Menü als Text (Base64 des JSON, UTF-8-sicher). Import prüft und migriert, legt vorher eine
  Sicherung unter `gensaat-vorher` ab; bei Fehler gibt es einen Hinweis statt Absturz.
- Neustart (alles löschen, auch Meta) nur nach Bestätigung.

Offline: Beim Öffnen läuft `simulate()` für die verstrichene Zeit (höchstens 3 Tage, mit Ewiger Wacht 7).
Ab 60 s Abwesenheit kommt die Zusammenfassung „Während du weg warst (5 Std.): +3 Knechte, +1.200 Vorräte …“.

Lokal: `python serve.py 8934` als `launch.json`-Eintrag „gensaat“ (Nocturna 8931/8932, Fledermauskolonie 8933).

Offline: Der Service Worker hält die Spiel-Dateien („erst Netz, dann Speicher“) und die Google-Schriften
(„erst Speicher“) vor; nach dem ersten Besuch mit Netz läuft alles offline. Schriften als eigene Dateien im Projekt
brauchen einen Download und warten auf das OK des Nutzers.

Hosting fürs Handy: Entscheidung beim Nutzer (Etappe 9 hat nichts veröffentlicht). Möglichkeiten: GitHub Pages (öffentlich, aber unverlinkt; 40k ist
GW-Marke, deshalb nicht bewerben), privates Claude-Artefakt, oder nur im Heimnetz. Spielstände bleiben lokal je Gerät,
Wechsel per Export/Import.

## Tests und Tempo

`node test.js`, ohne Framework (assert):
- Daten: jede verwiesene Id existiert (Kosten, Voraussetzungen, Orte, Partner, Nachbarn)
- Datum und Planetenzeit aus der Spielzeit
- Produktion, Verbrauch, Planetenzeit-Faktoren, Lager deckelt, Preise steigen mit dem Faktor, Ordensboni
- Hunger: Moral −30 % (nicht für Bauern), Flucht nach 30 s in der richtigen Reihenfolge, kein Zuzug in der Frostzeit
- Brüder erwachen mit dem ersten Apothecarion; Implantation mit festem Zufall (Erfolg, Servitor, Tod); Ausbildung
- Einsätze: Chance-Formel, Verluste, Gensaat-Bergung, Bedrohung und Überfälle
- Schmiede, Servitoren-Automatik, Reclusiam, Tausch mit Ansehen und Dauerauftrag, Feldzüge
- Speichern und Laden, Export und Import, Migration eines älteren Stands
- `simulate(s, 3600)` ergibt dasselbe wie 3600 × `step(s, 1)`

Tempo-Bot (`node test.js tempo`): spielt gierig in zwei Profilen, aktiv (handelt alle 10 s) und locker
(schaut 4× am Tag für je 5 Minuten rein), und gibt die Zeiten der Meilensteine aus.

| Meilenstein                    | Profil | Ziel             |
|--------------------------------|--------|------------------|
| Erster Knecht                  | aktiv  | ≈ 1 Minute       |
| Erste Lehre                    | aktiv  | ≤ 5 Minuten      |
| Brüder erwachen                | aktiv  | ≈ 20 Minuten     |
| Erster eigener Neophyt         | aktiv  | ≈ 1 Stunde       |
| Brüder erwachen                | locker | ≈ ½ Tag          |
| Erster eigener Neophyt         | locker | ≈ 1½ Tage        |
| Erster Kampfeinsatz            | locker | ≈ 1½–2 Tage      |
| Reclusiam                      | locker | ≈ 3½ Tage        |
| Erster Tausch                  | locker | ≈ 5 Tage         |
| Erstes befreites System        | locker | ≈ 6½ Tage        |
| 1. Kompanie (100 Kampfbrüder)  | locker | ≈ 10–11 Tage     |
| Nachfolgeorden möglich         | locker | ≈ 1–2 Wochen     |

Der Bot spielt im Profil „aktiv“ perfekt und klickt nur die ersten 10 Minuten; ein Mensch braucht etwa doppelt so lange.
Das Profil „locker“ schaut um 8, 12, 18 und 22 Uhr je 5 Minuten rein (am ersten Tag mit Klicks), dazwischen läuft
`simulate()` wie bei echter Abwesenheit; gezählt wird ab dem ersten Blick um 8 Uhr.
Alle Zahlen in diesem Dokument sind Startwerte; der Tempo-Bot stellt sie je Etappe auf diese Ziele ein.
Der Bot spielt mit festem Zufall; das Profil „locker“ läuft mit drei Samen und meldet Median und Spanne.

Sichtprüfung nach jeder sichtbaren Änderung: Handygröße (375 × 812) und PC-Breite, mit Screenshots.

## Etappen

Nach jeder Etappe ist das Spiel spielbar. Jede Etappe bekommt einen eigenen Umsetzungsplan und endet mit
`node test.js` und Sichtprüfung.

1. Kern: Ordenswahl (6 Orden, Farben, Werte als Daten), Klicks, Hydrokulturfarm, Knechtsquartier, Skriptorium,
   Speicher, Bergungsplatz, Knechte mit Jobs (Schrottsammler, Bauer, Schreiber), Hunger und Moral, Librarium
   (Kalender, Hydroponik, Lagerhaltung, Bergung), Datum und Planetenzeiten, Speichern, Export, Import, Offline,
   Chronik, Menü, Look „Kathedrale“ für PC und Handy
2. Marines: Sus-an-Studien, Apothecarion (Brüder erwachen), Aufklärung (Absturzstelle, Erzader, Stammesland),
   Erz, Mine, Bergmann, Gensaat, Prüfungsarena, Implantation, Neophyten, Zellentrakt, Übungskäfige,
   Ämter Apothecarius und Scriptor, Servitoren (Schrott)
3. Kampf: Kampfdoktrin, Kampfeinsätze, Kampfkraft, Verluste, Gensaat-Bergung, Beute, Ruhm, Grox-Fleisch,
   Archäotech, Aschewüste, Bedrohung, Überfälle, Bastion, Waffenkammer, Einsatzbefehle
4. Schmiede: Promethium, Raffinerie, Rezepte, Verbesserungen, Servitoren in der Schmiede, Munitorum-Verwaltung,
   Lagerhalle, Hab-Block, Makropol-Ruine, Luxus und Moral
5. Reclusiam und Orden: Glaube, Schrein, Prediger, Ordenspriester, Riten, Litaneien, Große Messe, Reliquiar,
   Ordens-Systeme (Roter Durst, Jagd auf die Gefallenen), Kompanien mit Kodex-Doppelung, Ordens-Ereignisse
6. Beziehungen: Astropathie, Astropathenturm, Visionen, Partner, Tausch, Ansehen, Daueraufträge, Servitor-Zelle,
   Techmarine, Ereignisse (Freihändler, Warpsturm, Ork-WAAAGH!, Genestealer-Kult)
7. Flotte und Sektor: Landeplattform, Orbitalwerft, Schiffe, Navigationsdaten, Sektorkarte, Feldzüge,
   Systemboni, Stasis-Technik, Gensaat-Tresor
8. Nachfolgeorden und Liber Honoris: Gründung, Vermächtnis, Ordensrelikte, Linienstufen, Chronik über Neustarts
9. Feinschliff: Tempo-Bot stellt die Zahlen ein, Schriften lokal, Icon, Homescreen und offline, Hosting

## Bewusst nicht drin

Gemalte Szenen, Sound, Cloud-Sync (Export/Import reicht), taktische Kämpfe, Zeitreise und Leere wie in Kittens,
heller Modus, Käufe, Mehrspieler.
