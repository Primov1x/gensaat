# Gensaat – Richtiges Warhammer (Makropole, Armeen, Schlachten, Gegner, Helden, Endspiel)

Stand 01.10.2026 · Erweiterung von `2026-09-29-gensaat-design.md` (Etappen 1–9 fertig) · Etappen 10–19

## Ziel

Gensaat wird vom Aufbauspiel mit Würfel-Einsätzen zu einem Warhammer-Spiel mit riesigen Armeen und echten Schlachten:
Zahlen ×100, die Festung als Stadtbild vor einer Makropole, Truppentypen, Fahrzeuge und Hilfstruppen, Schlachten in Runden wie am Spieltisch mit Befehlen je Phase,
ein animierter 3D-Spieltisch in Godot, Gegner mit eigenem Verhalten auf einer Kriegskarte, Helden mit Ausrüstung
und ein Endspiel mit Rittern, Titanen, Raumschlachten und Exterminatus.

Entschieden im Brainstorming (01.10.2026):

- Alles in einer Spec, gebaut in Etappen; nach jeder Etappe spielbar.
- **Architektur A:** JavaScript rechnet alles (auch Schlachten, auch offline). Godot zeigt nur den 3D-Spieltisch und
  nimmt Befehle an. Zahlen werden echt ×100 gerechnet.
- Schlacht: Befehle in Phasen; ohne dich entscheidet der Captain nach Doktrin. Gefechte 2–5 Min., Schlachten 15–30 Min.,
  Feldzüge über Stunden.
- Figuren aus Blender ohne Oberfläche (Python-Skripte), eigene Animationen. Bewegung aus Text (MoMask, AnimationGPT)
  ist eine spätere Ausbaustufe, nicht Teil dieser Spec.
- Dein Spielstand wird mitgenommen. Gegner: spürbar, nie verloren. Fraktionen: Orks, Genestealer-Kult, Tyraniden, Chaos.
- Helden mit Namen, Stufen, Ausrüstung; gefallene Helden sind verwundet oder kämpfen als Ehrwürdiger Cybot weiter.
- Basenbau als Stadtbild mit festen Bauplätzen wie in Browser-Aufbauspielen, gerendert in Blender.
- Grafik überall im Comic-Stil: Licht in harten Stufen, schwarzer Umriss, kräftige Farben. Figuren nah am Original,
  aber eigene Modelle ohne Logos und Ordenssymbole.

Grundsätze aus der Haupt-Spec gelten weiter: Kathedralen-Look, deutsche Texte, Log-Zeilen höchstens 100 Zeichen,
nichts springt, Automatik statt Klicks, Freischaltungen folgen der Logik der Welt.

## 1 Zahlen ×100 (Etappe 10)

`rules.popScale = 100`. Alle Mengen werden ×100: Köpfe, Waren, Lager, Kosten, Erträge, Beute, Kampfkraft und
Bedrohung. Ertrag und Verbrauch je Kopf bleiben gleich (ein Knecht isst weiter 0,3 Vorräte/s), Anteile je Kopf
(Gedränge, Ämter, Prediger) werden ÷100. Das Tempo bleibt gleich.

Nachtrag 01.10.2026: Zuerst waren nur die Köpfe ×100, die Waren blieben. Der Nutzer wollte es durchgehend („dann müsste
alles an Ressourcen auch angepasst werden“, „Das ganze Game entsprechend anpassen und balancen“), jetzt ist alles ×100.

| Bereich | bisher | neu |
|---|---|---|
| Knechte-Plätze | Knechtsquartier +2, Hab-Block +5 | +200, +500 |
| Zuzug | 1 Knecht je 20 s | erster Schub 100 auf einmal, danach laufend 5 Knechte/s, nur so viele, wie der Vorräte-Überschuss satt macht |
| Waren | Vorräte-Lager 200, Hydrokulturfarm 10 Vorräte, Kalender 15 Wissen | 20.000, 1.000, 1.500: alle Kosten, Lager, Erträge, Beute, Geschenke und Tauschpakete ×100 |
| Klick | +1 Schrott oder Vorrat | +100 |
| Essen und Jobs je Kopf | Knecht 0,3/s, Bruder 0,4/s; Bauer 1/s, Schrottsammler 0,3/s … | gleich |
| Gedränge | −0,5 % je Knecht über 20 | −0,005 % je Knecht über 2.000 |
| Flucht bei Hunger | 1 Knecht je 30 s | 100 Knechte je 30 s |
| Überfall | 20 % Chance auf 1 verschleppten Knecht, 10 % der Lager | 20 % Chance auf 100, 10 % der Lager |
| Brüder-Plätze, Koma | Wrack 5, Zellentrakt +5; 5 im Koma | 500, +500; 500 |
| Aspiranten | +0,001/s und Lager 2 je Arena | +0,1/s, Lager 200 |
| Gensaat | Lager 3, Absturzstelle +5; Reifung 0,0005/s je Bruder | 300, +500; Reifung gleich |
| Implantation | 1 Aspirant je Platz | Schub von 100 je Platz; Erfolg, Servitor und Tod je Kopf ausgewürfelt (Binomial) |
| Neophyten | Liste mit Zeit je Neophyt | Schübe `{ n, left }` |
| Schmiede | 1 Stück je Arbeitsgang; Knöpfe +1, +10 | 100 Stück je Arbeitsgang; Knöpfe +100, +1.000; Preis je Stück gleich (50 Schrott → 1 Plastahl) |
| Servitoren | Schrott 0,15/s je Servitor; Zelle: 1 Knecht + 5 Plastahl | gleich; Zelle: 100 Knechte + 500 Plastahl → 100 |
| Kampf | Kampfkraft 10 je Bruder; Bedrohung 20–2.500, +0,01/s, höchstens 500; Bastion +20 | Kampfkraft gleich; Bedrohung 2.000–250.000, +1/s, höchstens 50.000; Bastion +2.000 |
| Ämter | Wirkung je Amtsträger | Waren je Kopf gleich; Anteile ÷100 (Apothecarius −20 % Dauer je 100) |
| Litanei | 30 Glaube + 1 je 10 Knechte | 3.000 + 1 je 10 Knechte |
| Frömmigkeit | Produktion +√F ÷ 10 % | gleich, mit F in alten Einheiten (÷100) |
| Stückwirkung | Datentafel +50 Wissen-Lager, Servoschädel −2 % Aufklärung | +50 je Tafel; −2 % je 100 Schädel |
| Visionen | 1 Navigationsdatum | 100 |
| Kompanie | 100 Kampfbrüder | 10.000 |
| Nachfolgeorden | 100 Brüder, 20 Gensaat; Vermächtnis 1 je 10 Brüder, 1 je 500 Ruhm | 10.000, 2.000; 1 je 1.000 Brüder, 1 je 50.000 Ruhm |
| Relikte | Veteranen-Trupp +5, Gensaat-Reserve +5, Banner 50 Schrott | +500, +500, 5.000 |
| Astra Militarum (Tausch) | 300 Vorräte → 2 Knechte | 30.000 → 200 |

- Gleich bleiben: Zeiten, Prozente, Chancen, Moral, Roter Durst, Ansehen, Vermächtnis-Punkte, Zahl der Gebäude und Schiffe.
- Anzeige: ganze Zahlen mit Tausenderpunkt bis 999.999, darüber „1,2 Mio.“.
- Log fasst Massen zusammen: Zuzug höchstens eine Zeile je Minute („+300 Knechte ziehen ein“), Flucht, Verluste und
  Implantation als Summen. Brüder-Namen erscheinen nur noch bei Helden und in Flair-Zeilen.
- Bedienung: „−“ und „+“ bei Jobs, Ämtern und Trupps bewegen 100; daneben „alle“ (alle freien dorthin) und „0“.
- Umrechnung beim Laden: `saveVersion` 1 → 2: Köpfe ×100, Gensaat ×100, Neophyten- und Implantations-Listen werden
  Schübe zu 100, Einsatz- und Feldzugstrupps ×100. 2 → 3: alle übrigen Waren ×100, dazu Bedrohung und Frömmigkeit.
  Kompanien zählen weiter (1 alte Kompanie = 1 neue).

## 2 Makropole (Etappe 11)

Der Reiter Festung zeigt die Festung als Stadtbild wie in Browser-Aufbauspielen (Travian, Ikariam): ein in Blender
gerendertes Bild im Comic-Stil der Figuren, düster mit Steampunk. Die Festung liegt auf der untersten Terrasse der
Makropole, in der Milliarden leben; dahinter steigt die Makropole in Stufen bis zur Hauptspitze auf. Im Browser kommt Leben dazu: Rauch, Lichter, Verkehr, Wetter. Gewählt aus zwei Entwürfen; das freie Raster im
Stil von Handy-Strategiespielen ist verworfen.

### 2.1 Bauplätze und Stufen

- Jede Gebäude-Art hat **einen festen Bauplatz**: 25 heute, dazu die Fahrzeughalle aus Etappe 12. Freie Platzwahl gibt
  es nicht, jede Art auf jedem Platz bräuchte 26 × 26 × 5 Bilder.
- **Stufe = Anzahl** des Gebäudes. „Ausbauen“ kauft eines mehr zum gewohnten Preis, über dieselbe Funktion wie die
  Liste. Keine neue Regel, der Spielstand bleibt, wie er ist.
- Zustände: **Trümmer** (noch nicht freigeschaltet; ohne Namen, Tippen zeigt „Trümmer – noch unerforscht“),
  **Bauplatz** (freigeschaltet, Anzahl 0; Name und goldene Markierung), **Gebäude** in Bildstufe I–IV.
- Bildstufe I ab 1; II, III und IV, sobald der Preis das 5-, 25- und 125-Fache des Grundpreises erreicht hat:
  Bildstufe k + 1 ab Anzahl ⌈k · ln 5 ÷ ln Faktor⌉ (k = 1, 2, 3). Faktor 1,12 → 15, 29, 43; 1,15 → 12, 24, 35;
  1,6 → 4, 7, 11.
- Jeder Platz trägt ein Schild mit der Stufe, mit goldenem Rand, wenn der nächste Ausbau bezahlbar ist. Namen zeigen
  sich bei Maus darüber, bei Fokus und mit dem Schalter „Namen“.
- Tippen öffnet die Gebäude-Karte wie in der Liste (Preis, Wirkung, „i“): am PC neben dem Bild, am Handy als Leiste
  unten. Beim Ausbauen Staub, Funken und „+1“ über dem Platz; eine neue Bildstufe blendet in 0,6 s über.

### 2.2 Aufbau des Bildes

| Ebene (von vorn nach hinten) | Inhalt |
|---|---|
| Mauer | Ring mit Tor und Türmen = **Bastion**: ohne Bastion eine Schrott-Barrikade (statt Trümmer), Bildstufen I–IV immer schwerer, Geschütze ab III |
| Unten: Arbeit | Hydrokulturfarm, Mine, Bergungsplatz, Raffinerie, Schmiede, Speicher, Lagerhalle, Handelskontor, Landeplattform |
| Mitte: Wohnen und Kaserne | Knechtsquartier, Hab-Block, Servitor-Zelle, Zellentrakt, Prüfungsarena, Übungskäfige, Waffenkammer, Fahrzeughalle |
| Oben: Glaube und Wissen | Skriptorium, Archivum, Apothecarion, Gensaat-Tresor, Schrein, Reclusiam, Astropathenturm; in der Mitte das **Wrack** der „{Schiff}“ (immer da, Schild mit dem Namen) |
| Hintergrund | die **Makropole** selbst: zurückgesetzte Stufen mit Strebepfeilern, Fialen, dichten Fensterreihen, Gesimsen, Schloten und Rohren bis zur Hauptspitze mit Leuchtfeuer; über unserem Tor eine Rosette; fahl-gelber Smoghimmel |
| Himmel | **Orbitalwerft** als Dock im Orbit (vor dem Bau leer, dann Bildstufen I–IV); je Schiffs-Art der Flotte eine Silhouette |

Die Makropole lebt mit: beleuchtete Fenster = √(Knechte ÷ 50.000), höchstens alle. Über dem Bild steht
„Seelen in der Makropole: 1,2 Mrd.“ (Knechte × 50.000); ohne Knechte „Die Makropole schweigt.“

### 2.3 Leben im Bild

Eine Canvas-Ebene über dem Bild; sie läuft nur, solange der Reiter sichtbar ist.

- Rauch aus Schloten (Schmiede, Raffinerie, Bergungsplatz, Mine; erst wenn gebaut), flackernde Fenster, pulsierende
  Lichter, Suchscheinwerfer an der Mauer, Flieger zwischen den Türmen, Leuchten als weichgezeichnete Kopie der hellen
  Stellen.
- Verkehr: Lichtpunkte auf Wegen und Brücken, mehr mit mehr Knechten (höchstens 150).
- Die Planetenzeit färbt das Bild: Sonnenzeit warm und klar, Sturmzeit Regen und Blitze, Aschezeit Ascheflocken und
  Dunst, Frostzeit Schnee und kaltes Blau. Das Wetter ist schon vor dem Imperialen Kalender zu sehen, nur ohne Namen.
- Alarm bei Überfall und Abwehr-Gefecht (ab Etappe 13): rote Lichter, hektische Scheinwerfer, Leuchtspur von der Mauer.
- Banner in Ordensfarben: eigene Masken-Ebene, im Browser eingefärbt (auch für Nachfolgeorden).
- Modus „Leicht“ und `prefers-reduced-motion`: Bild, Schilder und Färbung ohne Bewegung.

### 2.4 Bilder aus Blender

- Skripte in `tools/blender/`: `kit.py` (Szene, Licht, Kamera, Ausgabe), `buildings.py` (Gebäude aus Formen, je
  Bildstufe größer und reicher), `city.py` (Gelände, Terrassen, Wege, Mauer, Wrack, Makropole, Himmel; rendert alles).
  Grundlage sind die Entwurfs-Skripte aus dem Brainstorming.
- Ausgabe in `img/stadt/`: `grund.webp` (alles ohne Gebäude, Bauplätze frei, 2000 × 1250 px), je Platz `<id>-0.webp`
  (Trümmer, solange gesperrt) bis `<id>-4.webp`, auf den Inhalt zugeschnitten, `banner.webp` (Maske) und `stadt.json`
  (je Platz Umriss, Schild-Punkt, Bild-Versatz, Zeichen-Reihenfolge, Rauch- und Lichtpunkte; Wege, Fenster der
  Makropole).
- Renderer EEVEE (das Stufenlicht gibt es nur dort). Je Gebäude-Grafik: Bild mit Gebäude gegen den leeren Grund; was
  sich unterscheidet (Gebäude und sein Schatten), wird die Grafik. Mauer und Terrassen davor sind in beiden Bildern
  gleich und verdecken deshalb richtig. Gezeichnet wird von hinten nach vorn.
- Look: Comic wie die Figuren (`kit.toonify`: Stufenlicht, Umriss), düster wie 40k mit Steampunk: dunkler Stein, stumpfes
  Kupfer und Messing, Rohrleitungen mit Flanschen und Ventilen, Schlote mit Messingbändern, Kessel, Zahnräder, Uhr,
  Luftschiffe, geflügelter Totenkopf über dem Tor, Schädel an den Türmen, Banner in Ordensfarbe. Gegenlicht mit
  schwarzen Schatten, leuchtende Fenster, Smog. Vorbilder: Makropolen-Artworks (Kegel aus gotischen Türmen, Smoggürtel).
- Bau: `blender -b -P tools/blender/city.py` (etwa eine Stunde). Die Bilder liegen im Repo und werden mit ausgeliefert,
  zusammen unter 5 MB; der Service Worker speichert sie beim ersten Laden.
- Am PC füllt das Bild die Breite, am Handy 60 % der Höhe, seitlich zu wischen.

### 2.5 Technik und Tests

- `js/city.js` (neu): Stadtbild, Schilder, Karte am Platz, Leben im Bild. Liest `stadt.json` und den Spielstand.
- `E.cityTier(S, id)` → 0–4 in `engine.js` (0 = noch keins gebaut; ohne DOM, testbar). Ob ein Platz gesperrt ist,
  sagt wie bisher `E.isUnlocked`. Plätze ohne Gebäude in `data.js` (Fahrzeughalle vor Etappe 12) zeigen Trümmer.
- Reiter Festung: Schalter „Stadt | Liste“ (im Spielstand gemerkt, Start: Stadt). Die Klick-Aktionen bleiben über dem
  Bild. Jeder Platz ist ein Knopf (Tastatur; Vorleser hören „Hab-Block, Stufe 23“).
- `node test.js`: Bildstufen-Schwellen; jedes Gebäude aus `data.js` hat einen Platz in `stadt.json`, seine Bilder 0–4
  liegen da (Orbitalwerft 1–4), alle Umrisse liegen im Bild. Sichtprüfung mit Bildschirmfotos am PC und am Handy,
  je Planetenzeit, im Alarm.

## 3 Armee (Etappe 12)

Neuer Reiter **Armee** zwischen Orden und Librarium: Trupps, Fahrzeuge, Hilfstruppen, ab Etappe 15 Helden.

### 3.1 Trupps der Marines

Kampfbrüder ohne Amt und nicht unterwegs sind **Taktische** (Standard). Andere Truppentypen entstehen, wenn man
Brüder dorthin verteilt; dafür braucht es Ausrüstung aus der Schmiede (1 Stück je Bruder, Rezepte geben je 100).

| Truppentyp | Ausrüstung je Bruder | Rezept (Schmiede) | ab Lehre |
|---|---|---|---|
| Scouts | – (Neophyten in Ausbildung, Ausbildung läuft weiter) | – | Scout-Ausbildung (5.000) |
| Taktische | – | – | – |
| Sturmtrupps | Sprungmodul | 30 Plastahl, 10 Promethium → 100 | Sturmdoktrin (8.000) |
| Devastatoren | schwere Waffe | 40 Plastahl, 10 Ceramit → 100 | Schwere Waffen (9.000) |
| Terminatoren | Terminatorrüstung | 20 Ceramit, 2 Archäotech → 10 | Terminator-Rüstung (20.000 + 2 Archäotech) |

Neue Lehren: Scout-Ausbildung (braucht Kampfdoktrin), Sturmdoktrin und Schwere Waffen (Kampfdoktrin, Schmiedekunst),
Terminator-Rüstung (Schwere Waffen, Stasis-Technik).
Fallen Brüder, ist ihre Ausrüstung zu 50 % verloren, der Rest kommt ins Lager zurück.

### 3.2 Fahrzeuge

Neues Gebäude **Fahrzeughalle** (20 Plastahl, 10 Ceramit, Faktor 1,3, Platz für 10 Fahrzeuge, ab Lehre Panzerkunde 8.500).
Fahrzeuge kosten wie Schiffe Basis × 1,03^Anzahl und brauchen Besatzung aus den Taktischen.

| Fahrzeug | Kosten | Besatzung | ab |
|---|---|---|---|
| Rhino | 8 Plastahl, 2 Ceramit, 1 Treibstoffzelle | 2 | Panzerkunde |
| Predator | 10 Plastahl, 6 Ceramit, 2 Treibstoffzellen | 3 | Panzerkunde |
| Whirlwind | 10 Plastahl, 4 Ceramit, 2 Treibstoffzellen, 1 Datentafel | 3 | Artillerie (11.000) |
| Land Raider | 30 Ceramit, 15 Plastahl, 3 Archäotech, 4 Treibstoffzellen | 3 | Mechanicus-Ansehen Stufe 3 |
| Cybot | 25 Ceramit, 3 Archäotech, 1 ehrwürdiger Bruder | – | Cybot-Sarkophag (14.000) |

Rhino und Land Raider sind Transporter (Rhino 10, Land Raider 12 Modelle): Ein Trupp mit genug Transportern bekommt
in Runde 1 und 2 Bewegung +1 und ist in Runde 1 vor Beschuss geschützt.

### 3.3 Hilfstruppen

- **Gardisten** (Astra Militarum): Lehre Planetare Verteidigung (6.000): „Knechte ausheben“ macht aus 1.000 Knechten
  und 10 Plastahl 1.000 Gardisten (essen wie Knechte, arbeiten nicht). Astra Militarum ab Stufe 2: „Regiment anfordern“
  600 Vorräte → 1.000 Gardisten.
- **Leman Russ** und **Basilisk**: in der Fahrzeughalle ab Astra-Militarum-Ansehen Stufe 3 (Leman Russ 10 Plastahl,
  6 Ceramit, 2 Treibstoffzellen; Basilisk 8 Plastahl, 4 Ceramit, 2 Treibstoffzellen), Besatzung aus Gardisten (3).
- **Skitarii**: Mechanicus ab Stufe 3, neuer Tausch „2 Archäotech → 300 Skitarii“.

### 3.4 Armeeliste

Vor jeder Schlacht: je Truppentyp, Fahrzeug, Hilfstruppe eine Anzahl (Schritte von 100, „alle“, „keine“), dazu Helden
und Doktrin. „Wie letztes Mal“ und „Automatisch“ (Captain stellt nach Gegner auf). Gebunden sind die Truppen bis zum Ende
der Schlacht. Jede Truppengattung bildet bis zu drei **Formationen** (eine je Abschnitt), der Captain verteilt sie.

## 4 Schlachten (Etappe 13)

### 4.1 Stufen

| Stufe | Dauer | Runden | Phasen-Dauer | gleichzeitig | Größe |
|---|---|---|---|---|---|
| Gefecht | 2–5 Min. | 3 | 12 s | mehrere | hunderte bis wenige tausend |
| Schlacht | 15–30 Min. | 6 | 40 s | eine | tausende bis zehntausende |
| Feldzug | Stunden | 3–5 Schlachten, dazwischen 30–60 Min. Marsch | – | einer | wie Schlacht |

Gefechte ersetzen die Kampfeinsätze (gleiche Namen, „Wiederholen“ bleibt). Schlachten kommen aus Invasionen,
Feldzügen und Ereignissen. Feldzüge ersetzen die alten Feldzüge der Sektorkarte (Kosten Navigationsdaten und
Treibstoffzellen wie bisher).

### 4.2 Der Tisch

- 3 Abschnitte (links, Mitte, rechts) × 5 Tiefen (0 = eigene Aufstellung … 4 = feindliche Aufstellung). Eine Zone ist
  (Abschnitt, Tiefe). Jede Formation steht in genau einer Zone.
- Gelände je Zone: offen, Deckung (Ruinen, Wald, Krater: Rüstungswurf um 1 besser für Infanterie), Hindernis
  (Bewegung −1). Der Kriegsschauplatz legt die Verteilung fest (Abschnitt 6).
- Zielmarker: Die Mitte-Zonen der Tiefe 2 sind Ziele; wer am Ende mehr Ziele hält, bekommt bei Gleichstand den Sieg.

### 4.3 Werte

Jede Einheit hat ein Profil je Modell:
Bew (Zonen je Runde), RW (Reichweite in Tiefen; 4 = ganzer Tisch, indirekt), Schuss A/BF/S/DS/Sch, Nahkampf A/KG/S/DS/Sch,
W (Widerstand), Rü (Rüstungswurf), Ret (Rettungswurf, optional), LP (Lebenspunkte), Mo (Moral).

- Treffen: BF bzw. KG „x+“ auf W6.
- Verwunden: S ≥ 2×W: 2+, S > W: 3+, S = W: 4+, S < W: 5+, S ≤ W÷2: 6+.
- Rüstungswurf: Rü + |DS| (besser durch Deckung um 1); Rettungswurf, wenn besser; über 6+ kein Wurf.
- Schaden: Sch je unverhinderter Verwundung; Formationen sammeln Schaden, je volle LP fällt ein Modell.
- **Masse**: Je Formation und Phase wird statistisch gewürfelt (Binomial, ab 60 Würfeln Normalnäherung, fester Zufall
  je Schlacht). Angezeigt werden die echten Würfel des wichtigsten Angriffs (höchstens 12, Rest als Summe).
- **Explosiv** (Whirlwind, Leman Russ, Basilisk, Orbitalschlag): Schüsse ×2 gegen Formationen ab 100 Modellen,
  ×3 ab 1.000.

### 4.4 Ablauf einer Runde

1. **Bewegung**: beide Seiten gleichzeitig. Doktrin, Befehl oder KI bestimmt Ziel-Zone; Bew zählt Zonen.
2. **Schießen**: erst die Seite mit Feuerlinie oder Halten, sonst beide gleichzeitig. Jede Formation schießt auf das
   nach KI beste Ziel in Reichweite (Befehl „Feuer bündeln“ zwingt ein Ziel).
3. **Angriff**: Formationen in Nachbar-Tiefe desselben Abschnitts dürfen angreifen und rücken in die Zone des Ziels;
   Angreifer bekommen +1 A in dieser Runde. Gebundene Formationen schießen nicht mehr.
4. **Nahkampf**: alle gebundenen Formationen; Angreifer schlagen zuerst.
5. **Moral**: Jede Formation, die in dieser Runde Modelle verlor, testet: Erfolg, wenn 2W6 ≤ Mo (+1 Held im Abschnitt,
   −1 je 25 % Verlust dieser Runde). Misslingt: zusätzlich 10 % der Modelle fliehen; misslingt es zweimal hintereinander,
   ist die Formation **gebrochen** und zieht sich eine Tiefe zurück (Fahrzeuge und Monster testen nicht).

Ende nach der letzten Runde oder wenn eine Seite keine ungebrochenen Formationen mehr hat. Sieg: Gegner gebrochen oder
am Ende mehr verbleibender Wert (Summe Modelle × Kosten) bei mindestens gleich vielen Zielen. Patt bei Wert-Unterschied
unter 10 %.

### 4.5 Doktrin und Befehle

| Doktrin | Wirkung |
|---|---|
| Sturmangriff | Runde 1–2 Bew +1, Nahkampf-Attacken +20 %, Schüsse −20 % |
| Feuerlinie | bleibt in Tiefe 0–1, Schüsse +20 %, schießt zuerst, Nahkampf −20 % |
| Umgehung | ein Drittel der Armee zieht über die schwächste Flanke, dort zählt feindliche Deckung nicht |
| Halten | Deckung in Tiefe 0–1 für alle, Rüstungswurf +1, schießt zuerst, rückt nicht vor |

Je Phase höchstens ein Befehl; er wird während der laufenden Phase für die nächste gewählt (Anzeige „Nächste Phase:
Schießen“). Ohne Befehl wählt der Captain nach Doktrin.

| Befehl | Phase | Wirkung | braucht |
|---|---|---|---|
| Vorrücken / Halten / Umgehen links / rechts | Bewegung | lenkt alle oder eine Formation | – |
| Reserve per Thunderhawk | Bewegung | eine Formation aus der Reserve landet in Tiefe 1–2 | Thunderhawk, Runde ≥ 2 |
| Landungskapseln | Bewegung | Reserve schlägt in beliebiger Zone ein (Runde 1–2) | Endspiel (Abschnitt 8) |
| Feuer bündeln | Schießen | alle Formationen in Reichweite auf ein Ziel | – |
| Orbitalschlag | Schießen | Explosiv 20/3+/10/−3/3 auf eine Zone, einmal je Schlacht | Schlachtbarke |
| Angreifen / Abwarten | Angriff | erzwingt oder verbietet Angriffe | – |
| Heldenfähigkeit | jede | siehe Abschnitt 7 | Held |
| Rückzug | Moral | Schlacht endet sofort als Niederlage, Verluste dieser Runde halbiert, keine weiteren | – |

### 4.6 Captain- und Gegner-KI

Einfache, nachvollziehbare Regeln, je Formation:
- Ziel wählen: höchster erwarteter Schaden ÷ eigener erwarteter Verlust; Panzerabwehr (S ≥ 7) bevorzugt Fahrzeuge
  und Monster, Masse-Waffen bevorzugen große Formationen.
- Bewegen: Nahkämpfer zur nächsten feindlichen Formation, Schützen in die beste Reichweite mit Deckung.
- Fraktions-Verhalten: Orks rücken immer vor und greifen an; Tyraniden ebenso, Synapsen-Wesen bleiben eine Tiefe dahinter;
  Kult stellt im Hinterhalt auf (Tiefe 2–3 statt 4, in Deckung); Chaos beschwört ab Runde 3 Dämonen, wenn die
  Verderbnis im System über 50 % liegt.

### 4.7 Ergebnis, Bericht, Wiederholung

- Beute: wie die alten Einsätze, × (1 + Boni); Ruhm je Schlacht nach besiegtem Wert. Gensaat-Bergung je gefallenem
  Bruder wie bisher (50 % + 10 % je 100 Apothecarii, höchstens 90 %).
- Liber Honoris: jede Schlacht und jeder Feldzug mit Namen („Schlacht um Tyrrhen“, Datum, Ausgang).
- Jede Schlacht speichert ihre Ereignisse (kompakt, Abschnitt 9.3). Die letzten 5 Schlachten bleiben zum
  **Wiederholen** auf dem 3D-Tisch. Schlachtbericht als Text im Reiter Gefechte.
- Weg vom Spiel: Schlachten laufen in `simulate()` weiter, der Captain entscheidet; Ergebnis identisch zur Echtzeit
  (gleicher Zufall, gleiche Reihenfolge).

### 4.8 Einheiten-Profile

Startwerte, der Tempo-Bot stellt sie ein. Kosten = Wert je Modell für KI und Sieg.

**Imperium**

| Einheit | Bew | RW | Schuss A/BF/S/DS/Sch | Nahkampf A/KG/S/DS/Sch | W | Rü | Ret | LP | Mo | Wert |
|---|---|---|---|---|---|---|---|---|---|---|
| Scout | 1 | 2 | 1/3+/4/0/1 | 1/3+/4/0/1 | 4 | 4+ | – | 1 | 7 | 12 |
| Taktischer Marine | 1 | 2 | 2/3+/4/0/1 | 1/3+/4/0/1 | 4 | 3+ | – | 2 | 7 | 18 |
| Sturm-Marine | 2 | 1 | 1/3+/4/0/1 | 3/3+/4/−1/1 | 4 | 3+ | – | 2 | 7 | 20 |
| Devastator | 1 | 3 | 2/3+/7/−2/2 | 1/3+/4/0/1 | 4 | 3+ | – | 2 | 7 | 25 |
| Terminator | 1 | 2 | 2/3+/4/0/1 | 3/4+/8/−2/2 | 5 | 2+ | 4+ | 3 | 8 | 40 |
| Cybot | 1 | 3 | 2/3+/9/−3/3 | 4/3+/12/−2/3 | 7 | 2+ | – | 12 | – | 140 |
| Rhino | 2 | 2 | 3/3+/4/0/1 | – | 7 | 3+ | – | 10 | – | 70 |
| Predator | 1 | 3 | 5/3+/8/−2/2 | – | 7 | 3+ | – | 11 | – | 130 |
| Whirlwind | 1 | 4 | 4/4+/5/−1/1 explosiv | – | 7 | 3+ | – | 11 | – | 110 |
| Land Raider | 1 | 3 | 6/3+/9/−3/3 | – | 8 | 2+ | – | 16 | – | 250 |
| Gardist | 1 | 2 | 1/4+/3/0/1 | 1/4+/3/0/1 | 3 | 5+ | – | 1 | 6 | 5 |
| Leman Russ | 1 | 3 | 4/4+/8/−2/2 explosiv | – | 8 | 2+ | – | 13 | – | 150 |
| Basilisk | 1 | 4 | 3/4+/9/−3/3 explosiv | – | 6 | 4+ | – | 10 | – | 120 |
| Skitarius | 1 | 3 | 2/3+/4/−1/1 | 1/4+/3/0/1 | 3 | 4+ | – | 1 | 7 | 10 |
| Armiger | 2 | 3 | 4/3+/8/−3/3 | 3/3+/8/−2/2 | 8 | 3+ | 5+ | 12 | – | 300 |
| Questoris | 1 | 3 | 8/3+/9/−3/3 | 4/3+/16/−4/6 | 11 | 3+ | 5+ | 24 | – | 600 |
| Warhound (Titan) | 2 | 4 | 10/3+/12/−4/4 | – | 14 | 2+ | 5+ | 60 | – | 2.000 |
| Reaver (Titan) | 1 | 4 | 16/3+/14/−4/5 | 4/3+/20/−4/8 | 15 | 2+ | 5+ | 90 | – | 3.500 |
| Warlord (Titan) | 1 | 4 | 26/3+/16/−5/6 | – | 16 | 2+ | 5+ | 140 | – | 6.000 |

Titanen haben Leerschilde: Die ersten 10 (Warhound), 15 (Reaver), 25 (Warlord) unverhinderten Schaden je Runde
schluckt der Schild.

**Orks**

| Einheit | Bew | RW | Schuss | Nahkampf | W | Rü | Ret | LP | Mo | Wert |
|---|---|---|---|---|---|---|---|---|---|---|
| Boy | 1 | 1 | 1/5+/4/0/1 | 2/3+/4/−1/1 | 5 | 6+ | – | 1 | 6 | 8 |
| Grot | 1 | 1 | 1/5+/3/0/1 | 1/5+/2/0/1 | 2 | – | – | 1 | 4 | 3 |
| Nob | 1 | 1 | 1/5+/4/0/1 | 3/3+/6/−1/2 | 5 | 4+ | – | 2 | 7 | 20 |
| Killa Kan | 1 | 2 | 3/4+/6/−1/1 | 3/4+/7/−2/2 | 6 | 3+ | – | 6 | – | 60 |
| Pikk-Up | 2 | 1 | 3/5+/5/0/1 | – | 6 | 4+ | – | 10 | – | 50 |
| Kampfpanza | 1 | 3 | 4/5+/8/−2/3 | – | 8 | 4+ | – | 16 | – | 140 |
| Waaaghboss (Held) | 1 | 1 | 2/5+/5/−1/1 | 5/2+/8/−2/2 | 6 | 4+ | – | 6 | 8 | 90 |

Mob-Regel: Ork-Infanterie hat Mo +1 je 100 Modelle in der Formation (höchstens 10). Waaaghboss im Abschnitt: +1 A.

**Genestealer-Kult**

| Einheit | Bew | RW | Schuss | Nahkampf | W | Rü | Ret | LP | Mo | Wert |
|---|---|---|---|---|---|---|---|---|---|---|
| Neophyt-Hybrid | 1 | 2 | 1/4+/3/0/1 | 1/4+/3/0/1 | 3 | 5+ | – | 1 | 7 | 6 |
| Akolyth-Hybrid | 1 | 1 | 1/4+/3/0/1 | 3/3+/4/−1/1 | 3 | 5+ | – | 1 | 7 | 9 |
| Aberrant | 1 | 0 | – | 3/4+/6/−2/2 | 5 | 5+ | 5+ | 3 | 8 | 30 |
| Goliath-Laster | 2 | 2 | 3/4+/5/0/1 | – | 6 | 4+ | – | 10 | – | 50 |
| Patriarch (Held) | 2 | 0 | – | 6/2+/6/−3/2 | 5 | 4+ | 5+ | 7 | 9 | 120 |

**Tyraniden**

| Einheit | Bew | RW | Schuss | Nahkampf | W | Rü | Ret | LP | Mo | Wert |
|---|---|---|---|---|---|---|---|---|---|---|
| Termagant | 1 | 2 | 1/4+/5/0/1 | 1/4+/3/0/1 | 3 | 5+ | – | 1 | 5 | 5 |
| Hormagant | 2 | 0 | – | 2/4+/3/0/1 | 3 | 5+ | – | 1 | 5 | 6 |
| Tyranidenkrieger | 1 | 2 | 2/4+/5/−1/1 | 3/3+/5/−1/2 | 5 | 4+ | – | 3 | 9 | 35 |
| Genestealer | 2 | 0 | – | 4/3+/4/−2/1 | 4 | 5+ | 5+ | 1 | 9 | 15 |
| Carnifex | 1 | 1 | 2/4+/7/−1/2 | 4/4+/9/−3/3 | 7 | 3+ | – | 8 | 8 | 110 |
| Schwarmtyrant (Held) | 2 | 2 | 4/3+/7/−1/2 | 6/2+/7/−3/3 | 8 | 3+ | 4+ | 12 | 10 | 220 |

Synapse: Krieger und Schwarmtyrant sind Synapsen-Wesen. Hat eine Seite keine mehr auf dem Tisch, testen alle
Termaganten und Hormaganten jede Runde Moral mit Mo 5; sonst bestehen sie Moral immer.

**Chaos**

| Einheit | Bew | RW | Schuss | Nahkampf | W | Rü | Ret | LP | Mo | Wert |
|---|---|---|---|---|---|---|---|---|---|---|
| Kultist | 1 | 1 | 1/4+/3/0/1 | 1/4+/3/0/1 | 3 | 6+ | – | 1 | 5 | 4 |
| Chaos Space Marine | 1 | 2 | 2/3+/4/0/1 | 2/3+/4/0/1 | 4 | 3+ | – | 2 | 7 | 20 |
| Besessener | 1 | 0 | – | 3/3+/5/−2/2 | 5 | 3+ | 5+ | 2 | 8 | 28 |
| Bluthund (Dämon) | 2 | 0 | – | 2/3+/5/−1/1 | 4 | 6+ | 5+ | 1 | 7 | 12 |
| Chaos-Predator | 1 | 3 | 5/3+/8/−2/2 | – | 7 | 3+ | – | 11 | – | 130 |
| Höllenschmiede | 1 | 3 | 4/3+/8/−2/2 | 4/3+/12/−2/3 | 7 | 3+ | 5+ | 14 | – | 170 |
| Chaos Lord (Held) | 1 | 1 | 2/2+/4/−1/1 | 5/2+/8/−2/2 | 4 | 2+ | 4+ | 6 | 9 | 100 |
| Dämonenprinz (Held, Endspiel) | 2 | 2 | 4/2+/8/−3/3 | 7/2+/10/−3/3 | 8 | 2+ | 4+ | 14 | 10 | 300 |

**Tiere**: Grox (für die Grox-Jagd): Bew 1, RW 0, Nahkampf 2/4+/5/0/1, W5, Rü 6+, LP 3, Mo 4, Wert 10.

### 4.9 Gefechte (ersetzen die Kampfeinsätze)

| Gefecht | Gegner | Beute (wie bisher) | ab |
|---|---|---|---|
| Ork-Plünderer vertreiben | 800 Boyz, 300 Grotz | 60 Schrott, 5 Ruhm; Bedrohung −10 | Aschewüste |
| Grox-Jagd | 200 Grox | 10 Grox-Fleisch | Kampfdoktrin |
| Wrackfelder plündern | 500 Boyz, 2 Kampfpanza | 200 Schrott, 30 Erz; 10 % 1 Archäotech | Aschewüste |
| Ork-Lager zerschlagen | 2.000 Boyz, 500 Grotz, 100 Nobz, 3 Kampfpanza, Waaaghboss | 400 Schrott, 40 Ruhm; Bedrohung −40 | Waffenkunde |
| Makropol-Säuberung | 1.500 Neophyt-Hybriden, 600 Akolythen, 50 Aberranten | 2 Archäotech, 60 Ruhm | Makropol-Ruine |
| Kult zerschlagen | 2.000 Neophyten, 800 Akolythen, 100 Aberranten, Patriarch | 40 Ruhm, beendet den Kult | Ereignis Kult |
| Jagd auf einen Gefallenen | 300 Chaos Marines, Chaos Lord | 200 Ruhm, 3 Archäotech | Dark Angels |

Überfälle (Bedrohung über Verteidigung) werden zu automatischen Abwehr-Gefechten in Kharos: Orks nach Bedrohung,
deine Brüder daheim und Bastionen (je Bastion eine Deckungs-Zone mehr). Verloren: wie der alte Überfall.

## 5 Gegner und Kriegskarte (Etappe 16)

Neuer Reiter **Krieg** nach Flotte: die Kriegskarte (die alte Sektorkarte), Feldzüge, Invasionen, Fraktionszähler.

### 5.1 Systeme

Jedes System hat Besitzer (Imperium, Orks, Kult, Tyraniden, Chaos, verschlungen, tot), Kontrolle 0–100 %, eine
feindliche Armee (aus Fraktion und Bedrohung erzeugt) und für Imperiums-Welten die Verderbnis 0–100 %.

| System | Start-Besitzer | Armee-Grundstock |
|---|---|---|
| Varos Agraria | Orks | Plünderer-Banden |
| Tyrrhen | Kult | Makropol-Kult |
| Sankt Oriel | Chaos | Kultisten-Mob |
| Metallum Sekundus | Orks | Mek-Werkstätten (viele Panza) |
| Ossuar | Chaos | Verräter-Garnison |
| Vhal Glacialis | Tyraniden | Splitterflotte |
| Gorkfang | Orks | Waaagh!-Heimat |
| Leuchtfeuer | Chaos | Kultisten und Marines |
| Sündenbrecher | Tyraniden | Genestealer-Nester |
| Kathar Nihil | Chaos | Schwarze Legion |
| Aeternum-Riss | Chaos | Dämonen und Verräter |

Armee-Größe: Bedrohung des Systems × 30 Wert, verteilt nach Fraktions-Mustern in `data.js` (z. B. Orks 60 % Boyz,
20 % Grotz, 10 % Nobz, 10 % Fahrzeuge). Sie wächst um 2 % je Stunde bis höchstens ×2.

### 5.2 Feldzug

Ziel: ein Nachbarsystem eines eigenen Systems. 3–5 Schlachten (nach Bedrohung), zwischen ihnen 30–60 Min. Marsch.
Kontrolle: Sieg +35 %, Patt +10 %, Niederlage −15 %. Bei 100 %: befreit (Bonus wie bisher), bei 0 %: Feldzug gescheitert.
Zwischen den Schlachten erholt sich der Gegner um 10 % seiner Verluste.

### 5.3 Fraktionen

- **Orks: Waaagh!-Zähler** 0–100 %: +1 %/h je Ork-System (Gorkfang +3 %/h), −15 % je verlorener Ork-Schlacht.
  Bei 100 %: Invasion eines benachbarten Imperiums-Systems (Kharos über die Aschewüste), Warnung 2 h vorher; danach 30 %.
- **Kult: Durchdringung** je Kult-System +2 %/h; bei 100 %: Aufstand in einem Nachbar-System oder in der Makropol-Ruine
  von Kharos (Abwehr-Schlacht mit Hinterhalt). Hält der Kult 3 Tage lang mindestens zwei Systeme, steigt die Hive-Flotte
  eine Stufe.
- **Tyraniden: Hive-Flotte** Stufen 0 fern → 1 „Schatten im Warp“ (24 h Warnung, keine Visionen) → 2 Vorhut greift ein
  Randsystem an (Warnung 6 h) → 3 Große Hive-Flotte (Endspiel). Stufe 1 kommt nach 4 Spieltagen oder durch den Kult.
  Ein System, das 24 h tyranidisch ist, wird **verschlungen**: kein Bonus, Feldzug „Neubesiedlung“ (5.000 Knechte,
  20.000 Vorräte, Schlacht gegen Reste) bringt es zurück.
- **Chaos: Verderbnis** Chaos-Systeme erhöhen die Verderbnis ihrer Imperiums-Nachbarn um 3 %/h. Ab 50 %: Produktion
  dort −10 %, ab 80 %: −25 %. Bei 100 %: Kultisten-Aufstand (Schlacht). Ordenspriester und die Litanei Reinheit senken
  die Verderbnis um 5 %/h je eigenem System. Gesamt-Verderbnis über 400 % (Summe) löst den Schwarzen Kreuzzug aus
  (Endspiel).

### 5.4 Härte: spürbar, nie verloren

- Invasion: Abwehr-Schlacht bei Ankunft, Doktrin standardmäßig Halten. Verloren: Das System fällt (Bonus weg, Kontrolle 0).
- Kharos Tertius fällt nie: Eine verlorene Abwehr dort kostet 20 % Vorräte, Schrott, Erz und 5 % der Knechte.
- Weg vom Spiel: Ein Angriff wartet höchstens 6 h auf dich, dann verteidigt der Captain. Je Abwesenheit fällt höchstens
  ein System; weitere fällige Invasionen warten, bis du zurück bist. Verluste je Abwesenheit höchstens 30 % jeder Truppe.

## 6 Kriegsschauplätze

Jedes System hat einen eigenen Tisch (Godot) mit Geländeverteilung für die Simulation:

| System | Tisch | Deckung | Besonderes |
|---|---|---|---|
| Kharos Tertius | Aschewüste mit Wrackteilen | mittel | Bastionen der Festung in Tiefe 0 |
| Varos Agraria | Felder, Silos, Bewässerung | wenig | lange Sichtlinien: RW +1 für alle |
| Tyrrhen | Makropol-Ruinen | viel | Hinterhalt-Zonen |
| Metallum Sekundus | Fabrikhallen, Schlote | viel | Hindernisse |
| Sankt Oriel | Kathedralen, Statuen | mittel | Moral +1 für das Imperium |
| Ossuar | Gräberfelder, Mausoleen | mittel | Moral −1 für alle |
| Vhal Glacialis | Eis, Spalten | wenig | Bew −1 in Runde 1 |
| Gorkfang | Ork-Schrottburgen | mittel | Orks Mo +1 |
| Sündenbrecher | Space Hulk, enge Gänge | viel | nur Mitte-Abschnitt, RW höchstens 1 |
| Kathar Nihil | Chaos-Altäre | mittel | Dämonen ab Runde 2 |
| Aeternum-Riss | Warp-Verzerrung | wenig | jede Runde zufällige Zone gefährlich (W6 Verluste) |
| Orbit | Weltraum (Raumschlacht) | – | siehe Abschnitt 8 |

## 7 Helden und Ausrüstung (Etappe 15)

### 7.1 Helden

| Held | ab | Fähigkeit (Befehl) | Aura im Abschnitt |
|---|---|---|---|
| Captain | Start | „Für den Imperator!“: alle Formationen bestehen diese Runde die Moral | Mo +1 |
| Ordenspriester | Liturgie | Litanei des Hasses: Nahkampf-Treffer +20 % | Nahkampf +10 % |
| Bibliothekar (SW: Runenpriester) | Librarius | Blitzsturm (Explosiv 10/3+/7/−2/2 auf eine Zone) oder Schild der Gedanken (Ret 4+ für eine Formation); 1/12 Gefahr, selbst 3 LP zu verlieren | – |
| Techmarine | Mechanicus Stufe 2 | Reparatur: ein Fahrzeug +3 LP | Fahrzeuge Rü +1 |
| Apothecarius | Gensaat-Kunde | Notfallhilfe: Verluste einer Formation diese Runde −30 % | Verluste −10 %, Bergung +10 % |

- Profil wie ein Held: Bew 1, RW 2, Schuss 3/2+/4/−1/2, Nahkampf 5/2+/6/−2/2, W4, Rü 2+, Ret 4+, LP 6, Mo 9
  (Werte steigen mit Stufe und Ausrüstung). Ein Held schließt sich einer Formation an und kämpft in ihrer Zone.
- Namen aus der Namensliste des Ordens, frei änderbar (24 Zeichen).
- **Erfahrung**: Schlacht +10, Sieg +25, getöteter feindlicher Held +15. Stufen bei 50, 150, 300, 500, 800, 1.200,
  1.700, 2.300, 3.000 (Stufe 1–10). Jede Stufe: Fähigkeit und Aura +10 %, LP +1; Stufe 3, 6, 9: eine zweite Fähigkeit
  aus einer Liste je Held (z. B. Captain „Orbitalschlag anfordern“ ohne Schlachtbarken-Abklingzeit, Ordenspriester
  „Märtyrer“, Bibliothekar „Warp-Sprung“, Techmarine „Bastion errichten“, Apothecarius „Gensaat sichern“).
- **Gefallen**: schwer verwundet, 4 h nicht einsetzbar (−20 % je Apothecarion, höchstens −60 %). Oder auf Wunsch
  **Ehrwürdiger Cybot**: braucht einen Cybot-Sarkophag (25 Ceramit, 3 Archäotech); der Held wird Cybot mit Namen, Stufe
  und Relikt, sein Heldenplatz wird frei (der Nachfolger beginnt bei Stufe 1).
- **Ehrentitel** (einmal je Held, je +5 % auf seine Aura): Bezwinger des Waaagh! (3 Ork-Schlachten gewonnen), Schlächter
  der Schwärme (10.000 Tyraniden getötet), Hammer der Ketzer (Chaos-Held getötet), Befreier (System befreit),
  Unbeugsam (Abwehr gegen dreifache Übermacht gewonnen). Eintrag im Liber Honoris.

### 7.2 Ausrüstung

Drei Plätze je Held: Waffe, Rüstung, Relikt.

| Gegenstand | Platz | Wirkung | Herkunft |
|---|---|---|---|
| Meistergefertigter Bolter | Waffe | Schuss A +2 | Schmiede: 5 Plastahl, 1 Datentafel |
| Energiefaust | Waffe | Nahkampf S ×2, DS −3, Sch 2 | Schmiede: 4 Ceramit, 1 Archäotech |
| Energieschwert | Waffe | Nahkampf A +1, DS −3 | Schmiede: 3 Ceramit, 1 Archäotech |
| Crozius Arcanum | Waffe (Priester) | Nahkampf S +2, Aura +10 % | Schmiede: 3 Ceramit, 50 Glaube |
| Psi-Kraftstab | Waffe (Bibliothekar) | Blitzsturm +50 % | Schmiede: 2 Archäotech, 2 Datentafeln |
| Artificer-Rüstung | Rüstung | Rü 2+, LP +2 | Schmiede: 10 Ceramit, 2 Archäotech |
| Terminatorrüstung | Rüstung | Rü 2+, Ret 4+, LP +3, Bew −0 | Terminatorrüstung aus dem Lager |
| Sturmschild | Rüstung | Ret 3+ | Schmiede: 6 Ceramit, 1 Archäotech |
| Servoharnisch | Rüstung (Techmarine) | Reparatur +3 LP | Schmiede: 4 Plastahl, 2 Ceramit |
| Eiserner Heiligenschein | Relikt (Captain) | Ret 3+ | Beute |
| Relikt-Klinge (Namensliste) | Relikt | Nahkampf A +2, Sch +1 | Beute |
| Ordensbanner | Relikt | Mo +2 in der ganzen Armee | Beute |

Beute: 3 % je gewonnener Schlacht, 15 % je Feldzug-Sieg, 100 % beim ersten Sieg gegen einen feindlichen Helden;
Relikt-Namen aus einer Liste in `data.js` („Klinge des Hüters“, „Zorn von Kharos“ …).

## 8 Endspiel (Etappe 18)

- **Imperiale Ritter**: Partner **Haus Draxus** (erfunden), Kontakt ab Mechanicus Stufe 4. Tausch: Armiger
  (8 Archäotech, 400 Ruhm), Questoris ab Stufe 2 (15 Archäotech, 900 Ruhm). Ritter sind eigene Einheiten in der Armee.
- **Titanen**: Partner **Legio Igneus** (erfunden), Kontakt ab befreitem Metallum und Mechanicus Stufe 5.
  „Titan anfordern“ für die nächste Schlacht (nur Stufe Schlacht): Warhound (2.000 Ruhm, 20 Archäotech), ab Stufe 2 Reaver
  (4.000, 40), ab Stufe 4 Warlord (8.000, 80). Abklingzeit 24 h. Ein Titan je Schlacht.
- **Orbitalschlag** (Abschnitt 4.5) wird ab hier durch Werft-Ausbauten stärker: „Lanzenbatterien“ (Upgrade: Schaden +50 %),
  „Zielauspex“ (zweimal je Schlacht).
- **Landungskapseln**: Lehre Orbitale Landung (60.000, braucht Orbitalbau); Ware Landungskapsel (6 Ceramit, 2 Plastahl,
  1 Treibstoffzelle → 1 Kapsel für 10 Modelle). Befehl in Runde 1–2: Reserve in eine beliebige Zone.
- **Raumschlacht**: vor Invasionen der Endstufen und vor Feldzügen gegen Systeme mit feindlicher Flotte. Gleiches
  Phasen-System auf dem Tisch „Orbit“: Bewegung, Schießen, Entern (statt Angriff und Nahkampf), Moral.
  Eigene Schiffe: Thunderhawk, Angriffskreuzer, Schlachtbarke, neu die Fregatte „Schwert-Klasse“ (20 Ceramit, 15 Plastahl,
  4 Treibstoffzellen, Faktor 1,3). Gegner: Ork-Kroozer, Tyraniden-Schwarmschiffe und Klauenschiffe, Chaos-Kreuzer und
  Schlachtschiffe (Profile in `data.js`). Wer den Orbit hält, bekommt in der Bodenschlacht Orbitalschläge und Reserven;
  der Verlierer nicht.
- **Exterminatus**: Aktion im Reiter Krieg gegen ein feindliches oder verschlungenes System. Braucht Inquisitions-Ansehen
  Stufe 3, 50 Archäotech, 5.000 Ruhm und Bestätigung. Das System ist tot (für diesen Orden), die Fraktion verliert dort
  alles, Waaagh!/Durchdringung/Verderbnis um 50 % gesenkt. Eintrag im Liber Honoris.
- **Schwarzer Kreuzzug**: ausgelöst durch die Verderbnis (Abschnitt 5.3). Eine Chaos-Flotte erscheint am Aeternum-Riss,
  Raumschlacht, dann Invasionen entlang der Verbindungen bis Kharos; Abwehr-Feldzug über mehrere Systeme.
  Sieg: Vermächtnis +20, Ehrentitel „Ketzerbrecher“ für den Captain.
- **Große Hive-Flotte**: Stufe 3 der Tyraniden, frühestens 10 Spieltage nach Stufe 2. Schwarmschiffe, Raumschlacht,
  gleichzeitig Invasionen in zwei Systemen. Sieg: Vermächtnis +20, Ehrentitel „Schwarmbrecher“.
- Nachfolgeorden bleibt (Werte aus Abschnitt 1); Helden, Ausrüstung und Ritter beginnen neu, Relikte mit Namen dürfen
  als Ordensrelikt mitgenommen werden (eines je Gründung).

## 9 Godot-Spieltisch und Figuren (Etappen 14 und 17)

### 9.1 Aufbau im Repo

```
battle-src/          Godot-Projekt (GDScript, Szenen, importierte Modelle)
battle/              Web-Export (index.html, .js, .wasm, .pck), wird mit ausgeliefert
tools/blender/       Python-Skripte für Blender ohne Oberfläche: je Figur ein Skript, dazu rig.py, anim.py, paint.py
tools/blender/build_all.py   baut alle Figuren nach battle-src/assets/models/*.glb
tools/blender/city.py        rendert das Stadtbild nach img/stadt/ (Etappe 11)
img/stadt/                   Stadtbild: Grund, Gebäude je Bildstufe, Banner-Maske, stadt.json
```

- Godot 4 (aktuelle stabile Version beim Download, Version in `battle-src/README.md` festgehalten), Renderer
  „Compatibility“ (WebGL 2), Web-Export einfädig (ohne Sonder-Header, läuft auf GitHub Pages). Ziel: unter 10 MB komprimiert.
- Gebaut wird per Kommandozeile: `blender -b -P tools/blender/build_all.py`, dann
  `godot --headless --path battle-src --export-release "Web" ../battle/index.html`.
- Der Service Worker speichert `battle/` erst, wenn die Schlachtansicht das erste Mal geöffnet wird.

### 9.2 Einbettung in Gensaat

- Knopf „Zuschauen“ an jeder laufenden Schlacht und „Wiederholen“ an den letzten fünf. Öffnet eine Vollbild-Ebene mit
  `<iframe src="battle/index.html">`; schließen kehrt zum Reiter zurück. Die Schlacht läuft unabhängig davon weiter.
- Ohne WebGL 2 oder im Modus „Leicht“ (Einstellung im Menü) zeigt Gensaat statt Godot die Text-Ansicht: Phase,
  Formationen mit Stärke und Zone als Raster, Ereignisse, Würfel, Befehlsknöpfe.

### 9.3 Nachrichten (postMessage, JSON)

Gensaat → Godot:

- `{ type: 'battle', id, theater, round, phase, sides: { own: { palette, chapter }, foe: { faction } }, formations: [...],
  zones: [...], heroes: [...], orders: [...] }` beim Öffnen (voller Stand).
- `{ type: 'phase', id, round, phase, duration, events: [...] }` zu Beginn jeder Phase.
- `{ type: 'result', id, outcome, loot, losses }` am Ende; `{ type: 'replay', id, log }` für Wiederholungen.

Formation: `{ id, side, unit, count, zone: [lane, depth], hero?, broken? }`.
Ereignis: `{ at, kind, ... }` mit `at` in Sekunden innerhalb der Phase, `kind` ∈ `move` (from, to), `shoot` (from, to,
weapon, shots), `dice` (rolls, need, hits), `hit` (to, wounds), `die` (formation, n), `charge` (from, to), `fight`
(a, b), `flee` (formation, n), `break` (formation), `orbital` (zone), `reserve` (formation, zone), `ability` (hero, name).

Godot → Gensaat: `{ type: 'ready' }`, `{ type: 'order', battle, phase, order, target }`, `{ type: 'close' }`.
Gensaat prüft jeden Befehl in der Engine; Godot zeigt nur an.

### 9.4 Darstellung

- Tisch je Kriegsschauplatz aus Bausteinen (Ruinen, Hallen, Kathedralen, Eis, Schrott, Gräber, Hulk-Gänge, Altäre),
  angeordnet nach den Zonen; Deckungs-Zonen bekommen Gelände, offene bleiben frei.
- Je Formation k = clamp(round(4 + 3 × log10(Anzahl)), 1, 20) Figuren, Fahrzeuge und Monster einzeln bis 8;
  Massen gezeichnet mit MultiMesh. Über jeder Formation ein Schild mit echter Stärke („Boyz 4.000“).
- Figuren laufen in die Ziel-Zone, schießen (Mündungsfeuer, Leuchtspur, Strahlen), fallen (Animation), fliehen.
  Explosionen mit Partikeln, Rauch, Licht-Blitz. Orbitalschlag als Lanze vom Himmel.
- Würfel: echte Physik-Würfel am Tischrand für den angezeigten Wurf, Ergebnis aus dem Ereignis (die Physik rollt aus,
  die Augenzahl steht vorher fest).
- Kamera: drehen, zoomen, verschieben (Maus und Finger), Knopf „Folgen“ (fährt zum Geschehen), Pause der Animation
  (die Schlacht selbst läuft weiter).
- Oberfläche in Godot: Phase und Runde oben, Ereignis-Zeile unten, Befehle als Knöpfe (nur erlaubte), Würfel-Ergebnis.
  Schriften und Farben wie Gensaat (Gold, Knochen, Stein, Ordensfarben).
- Comic-Look wie in Blender: Licht in harten Stufen (eigener Shader) und schwarzer Umriss (umgedrehte Hülle).
- Handy: höchstens 400 Figuren, kleinere Schatten, weniger Partikel; PC höchstens 1.500.

### 9.5 Figuren aus Blender

- Jede Figur: Python-Skript mit Formen (Kästen, Zylinder, Kugeln, Bevel, Spiegelung), starres Skelett (jedes Teil
  hängt fest an einem Knochen), Materialien mit festen Namen (`primary`, `secondary`, `trim`, `metal`, `skin`, `eyes`,
  `glow`), damit Godot Ordens- und Fraktionsfarben setzt.
- Animationen per Skript (Schlüsselbilder): Mensch- und Ork-Form: idle, walk, run, shoot, melee, hit, die, jump (Sprungmodul);
  Tyraniden: idle, skitter, leap, claw, die; Fahrzeuge: drive (Ketten), turret, fire, wreck; Titanen und Ritter:
  stomp, fire, die.
- Figurenliste: Marines (Taktisch, Sturm, Devastator, Scout, Terminator, Helden, Cybot), Rhino, Predator, Whirlwind,
  Land Raider, Thunderhawk, Gardist, Leman Russ, Basilisk, Skitarius, Armiger, Questoris, Warhound, Reaver, Warlord;
  Boy, Grot, Nob, Waaaghboss, Killa Kan, Pikk-Up, Kampfpanza; Neophyt, Akolyth, Aberrant, Patriarch, Goliath;
  Termagant, Hormagant, Krieger, Genestealer, Carnifex, Schwarmtyrant; Kultist, Chaos Marine, Besessener, Bluthund,
  Chaos-Predator, Höllenschmiede, Chaos Lord, Dämonenprinz; Schiffe für den Orbit; Grox.
- Stil (gewählt 01.10.2026): Comic, Formen nah am Original. Marines in Mk-VII-Form (Kuppelhelm mit Atemgitter und
  schrägen Augen, Schulterpanzer mit Goldrand, Brustadler, Bolter mit Sichelmagazin), Terminatoren mit tief sitzendem
  Helm, Sturmbolter und Energiefaust, Orks mit Unterbiss, Hauern und Spalta. Ordensfarben wie bemalte Figuren.
  Eigene Modelle, keine Logos und keine Ordenssymbole von Games Workshop.

### 9.6 Werkzeuge (Downloads nur mit Zustimmung, vor Etappe 14)

Blender liegt schon bereit (5.2.2 portable, außerhalb des Repos). Zu laden: Godot-Editor (etwa 60 MB) und
Godot-Export-Vorlagen (etwa 1 GB). Bewegung aus Text (PyTorch und Modelle, mehrere GB) ist nicht Teil dieser Spec.

## 10 Bedienung

Reiter-Reihenfolge: Festung · Orden · **Armee** · Librarium · **Gefechte** (bisher Einsätze: Aufklärung, Gefechte,
laufende und letzte Schlachten) · Schmiede · Reclusiam · Beziehungen · Flotte · **Krieg** · Vermächtnis · Liber Honoris.

- Festung: Stadtbild (Abschnitt 2) mit Schalter „Stadt | Liste“; die Liste bleibt wie bisher.
- Armee: Trupps mit Anzahl, Ausrüstung und „−100 / +100 / alle“; Fahrzeuge wie Gebäude-Karten; Hilfstruppen; Helden
  (Name, Stufe, Erfahrung, drei Plätze, Fähigkeiten).
- Gefechte: Karte je Gefecht mit Gegner-Stärke, „Aufstellen“ (Armeeliste), „Wiederholen“-Schalter; darunter laufende
  Schlachten mit Runde, Phase, Stärke-Balken, „Zuschauen“; letzte Schlachten mit Bericht und „Wiederholen“.
- Krieg: Kriegskarte (wie die Sektorkarte, mit Besitzer-Farben, Kontrolle, Verderbnis, Warnungen), Fraktionszähler,
  Feldzug starten, Invasions-Warnungen mit Countdown, Endspiel-Aktionen.
- Armeeliste als Fenster: je Truppentyp Anzahl, Doktrin-Wahl, Helden, „Wie letztes Mal“, „Automatisch“, „Los“.
- Warnungen (Invasion naht, Schatten im Warp) stehen im festen Platz der Kopfzeile wie die Visionen.

## 11 Technik

- `js/battle.js` (neu, ohne DOM): Schlacht-Simulation (Zonen, Werte, Würfel, Phasen, Moral, KI, Befehle, Ereignisse).
  Schnittstelle: `Battle.create(spec, seed)`, `Battle.phase(b)` (rechnet die nächste Phase, gibt Ereignisse),
  `Battle.order(b, order)`, `Battle.result(b)`. Fester Zufall je Schlacht (mulberry32 mit Samen im Spielstand).
- `js/city.js` (neu): Stadtbild (Abschnitt 2.5); `E.cityTier(S, id)` in `engine.js`.
- `js/war.js` (neu, ohne DOM): Kriegskarte, Fraktionszähler, Invasionen, Feldzüge.
- `js/engine.js` bleibt Taktgeber: ruft Schlachten und Krieg in `step()` auf, speichert sie im Spielstand,
  `simulate()` rechnet sie offline mit.
- `js/ui.js`: neue Reiter, Armeeliste, Text-Ansicht, Godot-Ebene mit `postMessage`.
- `js/data.js`: Einheiten, Fraktions-Muster, Gefechte, Kriegsschauplätze, Helden, Ausrüstung, Ritter, Titanen, Schiffe.
- Spielstand: `saveVersion` 2 (Etappe 10). Neue Felder werden beim Laden ergänzt (fehlt etwas, gilt der Startwert);
  Schlacht-Ereignisse der letzten 5 Schlachten gekürzt gespeichert (höchstens 2.000 Ereignisse je Schlacht).

## 12 Tests und Tempo

- `node test.js`: ×100-Umrechnung eines alten Stands; Truppen und Ausrüstung; Würfel-Regeln (Verwundungs-Tabelle,
  Rüstung, Deckung, Rettungswurf); feste Schlacht mit festem Samen ergibt immer dasselbe; Moral und Brechen; Synapse,
  Mob-Regel, Hinterhalt; Doktrinen und jeder Befehl; Schlacht offline gleich wie in Echtzeit; Feldzug-Kontrolle;
  Fraktionszähler und Invasionen; Härte-Regeln (ein System je Abwesenheit, Kharos fällt nie); Helden-Erfahrung, Tod,
  Cybot; Ausrüstung; Ritter, Titanen, Orbitalschlag, Landungskapseln, Raumschlacht, Exterminatus; Bildstufen und
  `stadt.json` (Abschnitt 2.5).
- Tempo-Bot kämpft mit: stellt automatisch auf, wählt Doktrin nach Gegner, gibt keine Befehle (Captain entscheidet).
- Godot: Sichtprüfung im Browser (Bildschirmfotos am Handy-Maß und am PC), dazu ein Prüf-Modus `?test`, der eine feste
  Schlacht abspielt.

| Meilenstein (locker) | Ziel |
|---|---|
| Erstes Gefecht | ≈ 2 Tage (wie der erste Kampfeinsatz heute) |
| Erste Schlacht (Invasion oder Feldzug) | ≈ 4 Tage |
| Erster Held Stufe 5 | ≈ 6 Tage |
| Erstes befreites System | ≈ 6½ Tage |
| Erster Ritter | ≈ 2 Wochen |
| Erster Titan | ≈ 3 Wochen |
| Nachfolgeorden möglich | ≈ 3 Wochen |

## 13 Etappen

10. **Zahlen ×100**: Werte, Schübe, Log-Zusammenfassung, Bedienung in Hunderten, Umrechnung `saveVersion` 2.
11. **Makropole**: Stadtbild im Reiter Festung (Blender-Skripte und Bilder, Bauplätze mit Stufen, Leben im Bild,
    Planetenzeit, Alarm-Anschluss), Schalter Stadt | Liste.
12. **Armee**: Reiter Armee, Truppentypen mit Ausrüstung, Fahrzeughalle und Fahrzeuge, Hilfstruppen, Armeeliste.
13. **Schlacht-Engine**: `battle.js`, Gefechte statt Einsätze, Abwehr-Gefechte statt Überfälle, Text-Ansicht, Bericht,
    Wiederholung als Text, Tempo-Bot kämpft.
14. **Werkzeuge und Godot-Tisch**: Downloads (mit OK), Blender-Pipeline für Figuren, erste Figuren (Marines, Rhino, Predator, Orks,
    Kampfpanza), Godot-Projekt mit Tisch Kharos, Nachrichten, Kamera, Effekte, Würfel, Export, Einbettung.
15. **Helden und Ausrüstung**.
16. **Kriegskarte**: Reiter Krieg, Fraktionen, Invasionen, Feldzüge in Schlachten, Härte-Regeln, Verschlingen, Neubesiedlung.
17. **Alle Figuren und Tische**: Kult, Tyraniden, Chaos, Hilfstruppen, Helden-Figuren, 11 Tische.
18. **Endspiel**: Ritter, Titanen, Orbitalschlag-Ausbau, Landungskapseln, Raumschlacht (mit Orbit-Tisch und Schiffen),
    Exterminatus, Schwarzer Kreuzzug, Große Hive-Flotte.
19. **Feinschliff**: Tempo mit dem Bot, Handy-Leistung, Texte, Sichtprüfung aller Tische.

## 14 Bewusst nicht drin

Bewegung aus Text (MoMask, AnimationGPT) und Mixamo · Necrons, Aeldari, T'au · Mehrspieler · echte Figuren oder
Logos von Games Workshop · Käufe · freies Bau-Raster (Entwurf 2 der Makropole).
