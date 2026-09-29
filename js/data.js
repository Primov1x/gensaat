// Gensaat – alle Inhalte als Tabellen.
// Zahlen sind Startwerte aus der Spec; der Tempo-Bot (node test.js tempo) prüft das Tempo.
const DATA = {
  rules: {
    saveVersion: 1,
    yearLength: 1000,       // Sekunden je imperiales Jahr (Datum 0.FFF.JJJ.M42)
    seasonLength: 250,      // Sekunden je Planetenzeit
    startYear: 12,          // 012.M42
    seasons: [
      { name: 'Sonnenzeit', mult: { supplies: 1.25 } },
      { name: 'Sturmzeit', mult: { scrap: 1.25 }, missionTime: 1.25 },
      { name: 'Aschezeit', mult: { supplies: 0.75 } },
      { name: 'Frostzeit', mult: { supplies: 0.5, faith: 1.25 }, noArrival: true },
    ],
    serfFood: 0.3,          // Vorräte/s je Knecht
    arrivalEvery: 20,       // Sekunden je Zuzug
    fleeAfter: 30,          // hungrige Sekunden, bis ein Knecht flieht
    hungerPenalty: 0.3,
    crowdFree: 20,
    crowdPenalty: 0.005,    // je Knecht über crowdFree
    moralMin: 0.25,
    offlineMax: 3 * 86400,
    logMax: 100,
    honorsMax: 500,
    marineFood: 0.4,        // Vorräte/s je Kampfbruder, Neophyt und Wulf
    aspirantFood: 0.3,      // Vorräte/s je Aspirant
    comaBrothers: 5,        // Brüder im Sus-an-Koma zu Beginn
    marineBase: 5,          // Brüder-Plätze in den Wrack-Quartieren
    implantTime: 300,
    implantChance: 0.75,
    implantChanceMax: 0.95,
    apothecaryChance: 0.1,  // je Apothecarius
    apothecarySpeed: 0.2,   // je Apothecarius weniger Dauer …
    apothecarySpeedMax: 0.6, // … höchstens so viel
    trainingTime: 900,
    trainingSpeedMax: 0.5,
    geneseedRate: 0.0005,   // Gensaat/s je Kampfbruder
    servitorScrap: 0.15,    // Schrott/s je Servitor (bis zur Schmiede)
    powerBrother: 10,       // Kampfkraft je Kampfbruder
    powerWulf: 20,          // Kampfkraft je Wulf
    lossWin: 0.02,          // Verlust-Chance je Mitglied bei Erfolg (÷ r)
    lossFail: 0.25,         // … bei Fehlschlag (÷ r)
    lossMax: 0.5,
    recoverChance: 0.5,     // Gensaat-Bergung je gefallenem Bruder
    recoverApothecary: 0.1, // … +10 % je Apothecarius
    recoverMax: 0.9,
    threatRate: 0.01,       // Bedrohung/s ab der Aschewüste
    threatMax: 500,
    raidEvery: 300,         // Sekunden zwischen möglichen Überfällen
    raidLoss: 0.1,          // Anteil Vorräte, Schrott und Erz, den ein Überfall kostet
    raidTake: 0.2,          // Chance, dass ein Knecht verschleppt wird
    raidsOffline: 3,        // höchstens so viele Überfälle je Abwesenheit
    luxuryMoral: 0.1,       // Moral je Luxusgut-Sorte mit Bestand
    luxuryUse: 0.001,       // Verbrauch je Knecht, Sekunde und Sorte
    craftRate: 0.02,        // Ausführungen/s je Servitor in der Schmiede
    servitorFill: 0.9,      // Servitoren nehmen nur aus Lagern, die so voll sind (Überschuss)
    preacherMoral: 0.005,   // Moral je Prediger …
    preacherMoralMax: 0.1,  // … höchstens so viel
    priestMoral: 0.02,      // Moral je Ordenspriester
    litanyTime: 1000,       // Dauer einer Litanei (1 Jahr)
    litanyCost: 30,         // Glaube je Litanei …
    litanyPerSerfs: 10,     // … plus 1 je so viele Knechte
    companySize: 100,       // Kampfbrüder je Kompanie
    companyBonus: 0.05,     // Produktion je voller Kompanie
    thirstPerMission: 5,    // Roter Durst je Kampfeinsatz (Blood Angels)
    thirstPriest: 0.01,     // Durst −/s je Sanguinischem Priester
    thirstAfterRage: 50,
    eventEvery: 2000,       // Ordens-Ereignisse im Schnitt alle 2 Jahre
    visionEvery: 400,       // Visionen im Schnitt alle 400 s …
    visionShow: 15,         // … und so lange im Kopf zum Antippen
    standingLevels: [5, 15, 35, 70, 120], // Ansehen-Schwellen der Stufen 1–5
    tradeLevelBonus: 0.1,   // Tausch-Ausbeute je Ansehen-Stufe
    dockedBonus: 0.5,       // Haus Valkar im Hafen: nächster Tausch mit ihm
    orderLevel: 2,          // Daueraufträge ab dieser Stufe …
    orderEvery: 10,         // … höchstens alle 10 s …
    orderFill: 0.8,         // … aus Lagern, die so voll sind …
    orderPackages: 5,       // … oder von Waren ohne Lager so viele Pakete
    servitorPlasteel: 5,    // Servitor erschaffen: 1 Knecht + so viel Plastahl
    scoutSpeedMax: 0.8,     // Aufklärung höchstens so viel kürzer
    campaignSpeedMax: 0.8,  // Feldzüge höchstens so viel kürzer
    campaignSquad: [5, 50], // Kämpfer je Feldzug
    fuelPerNav: 2,          // Treibstoffzellen je Navigationsdaten eines Feldzugs
    foundBrothers: 100,     // Nachfolgeorden: so viele Kampfbrüder …
    foundGeneseed: 20,      // … und so viel Gensaat als Zehnt
    legacyBrothers: 10,     // Vermächtnis: 1 Punkt je 10 Kampfbrüder …
    legacyRenown: 500,      // … und je 500 Ruhm
    legacyPct: 0.01,        // je verdientem Punkt Produktion und Lager +1 %
    lineBoost: 0.25,        // Bonus der Linie je Linienstufe
    nameMax: 24,            // Zeichen im Namen eines Nachfolgeordens
    flairEvery: 600,        // alle 600 s eine Flair-Zeile in der Chronik
  },

  // Flair-Zeilen für die Chronik (ohne Wirkung). {name} = ein Bruder; solche Zeilen erst mit wachen Brüdern.
  flair: [
    'Ein Servitor fegt denselben Gang zum dritten Mal. Niemand hält ihn auf.',
    'Aschewind zerrt an den Bannern. Die Knechte beten, dass sie halten.',
    'Die Nährtanks blubbern. Es riecht nach Algen und Hoffnung.',
    'Irgendwo im Wrack spielt ein Vox-Gerät Choräle. Seit Jahren.',
    'Die Knechte streiten, ob der Imperator Algen mag.',
    'Staubsturm im Süden. Die Auspex-Schirme zeigen nur Grau.',
    'Ein Knecht findet eine alte Medaille im Schutt und trägt sie jetzt stolz.',
    'Nachts leuchtet der Himmel grün. Die Knechte sagen: Warp. Niemand widerspricht.',
    'Ein Servitor bleibt stehen, dreht sich um und arbeitet weiter. Niemand fragt.',
    'Die Mauern knarren in der Kälte. Die Knechte rücken enger zusammen.',
    'Ein Knecht malt einen Aquila an die Wand. Er ist schief. Er bleibt.',
    'Ein Knecht behauptet, er habe einen Grox lachen hören. Er muss den Hof fegen.',
    'Bruder {name} poliert seinen Bolter und summt dabei eine Litanei.',
    'Bruder {name} steht die ganze Nacht Wache. Freiwillig.',
    'Bruder {name} lehrt einen Knecht das Lesen. Das erste Wort ist „Pflicht“.',
    'Bruder {name} betet vor dem Altar. Er betet lange.',
    'Ein Aspirant fragt Bruder {name}, wann das Training endet. Die Antwort ist „nie“.',
    'Bruder {name} trägt zwei Knechte aus dem Schlamm, ohne das Gespräch zu unterbrechen.',
  ],

  resources: [
    { id: 'supplies', name: 'Vorräte', one: 'Vorrat', cap: 200, icon: 'i-supplies' },
    { id: 'scrap', name: 'Schrott', one: 'Schrott', cap: 150, icon: 'i-scrap' },
    { id: 'knowledge', name: 'Wissen', one: 'Wissen', cap: 100, icon: 'i-knowledge', requires: { building: 'scriptorium' } },
    { id: 'ore', name: 'Erz', one: 'Erz', cap: 150, icon: 'i-ore', requires: { place: 'orevein' } },
    { id: 'geneseed', name: 'Gensaat', one: 'Gensaat', cap: 3, icon: 'i-geneseed', requires: { building: 'apothecarion' } },
    // pop: gehört zur Bevölkerung (eigene Liste, ganze Zahlen, kein Lager-Bonus)
    { id: 'aspirants', name: 'Aspiranten', one: 'Aspirant', cap: 0, icon: 'i-aspirant', pop: true, requires: { building: 'arena' } },
    { id: 'renown', name: 'Ruhm', one: 'Ruhm', cap: Infinity, icon: 'i-renown', requires: { seen: 'renown' } },
    { id: 'archeotech', name: 'Archäotech', one: 'Archäotech', cap: Infinity, icon: 'i-archeotech', requires: { seen: 'archeotech' } },
    { id: 'navdata', name: 'Navigationsdaten', one: 'Navigationsdaten', cap: Infinity, icon: 'i-navdata', requires: { tech: 'astropathy' } },
    // luxury: hebt die Moral, solange ≥ 1 da ist, und wird langsam verbraucht
    { id: 'grox', name: 'Grox-Fleisch', one: 'Grox-Fleisch', cap: 30, icon: 'i-grox', luxury: true, requires: { seen: 'grox' } },
    { id: 'amasec', name: 'Amasec', one: 'Amasec', cap: 30, icon: 'i-amasec', luxury: true, requires: { seen: 'amasec' } },
    { id: 'incense', name: 'Weihrauch', one: 'Weihrauch', cap: 30, icon: 'i-incense', luxury: true, requires: { seen: 'incense' } },
    { id: 'promethium', name: 'Promethium', one: 'Promethium', cap: 60, icon: 'i-promethium', requires: { building: 'refinery' } },
    { id: 'faith', name: 'Glaube', one: 'Glaube', cap: 100, icon: 'i-faith', requires: { building: 'shrine' } },
    // crafted: aus der Schmiede, kein Lager, steht nur im Reiter Schmiede.
    // perUnit: Wirkung je ganzem Stück im Bestand (perUnitMax deckelt sie).
    { id: 'plasteel', name: 'Plastahl', one: 'Plastahl', cap: Infinity, icon: 'i-plasteel', crafted: true,
      requires: { tech: 'smithing' } },
    { id: 'servoskull', name: 'Servoschädel', one: 'Servoschädel', cap: Infinity, icon: 'i-servoskull', crafted: true,
      perUnit: { 'scout.speed': 0.02 }, perUnitMax: { 'scout.speed': 0.4 }, requires: { tech: 'smithing' } },
    { id: 'ceramite', name: 'Ceramit', one: 'Ceramit', cap: Infinity, icon: 'i-ceramite', crafted: true,
      requires: { tech: 'refining' } },
    { id: 'fuelcell', name: 'Treibstoffzellen', one: 'Treibstoffzelle', cap: Infinity, icon: 'i-fuelcell', crafted: true,
      requires: { tech: 'refining' } },
    { id: 'datatablet', name: 'Datentafeln', one: 'Datentafel', cap: Infinity, icon: 'i-datatablet', crafted: true,
      perUnit: { 'knowledge.cap': 50 }, requires: { tech: 'archives' } },
    { id: 'reliquary', name: 'Reliquiare', one: 'Reliquiar', cap: Infinity, icon: 'i-reliquary', crafted: true,
      perUnit: { 'litany.bonus': 0.1 }, perUnitMax: { 'litany.bonus': 0.5 }, requires: { tech: 'liturgy' } },
  ],

  // Rezepte der Schmiede: Id = hergestellte Ressource.
  recipes: [
    { id: 'plasteel', cost: { scrap: 50 } },
    { id: 'servoskull', cost: { archeotech: 1, plasteel: 3 } },
    { id: 'ceramite', cost: { ore: 40, promethium: 10 } },
    { id: 'fuelcell', cost: { promethium: 60, plasteel: 1 } },
    { id: 'datatablet', cost: { knowledge: 150, plasteel: 1 } },
    { id: 'reliquary', cost: { archeotech: 2, ceramite: 5, faith: 100 } },
  ],

  // Einmalige Verbesserungen: sichtbar, sobald alle Waren in den Kosten freigeschaltet sind.
  upgrades: [
    { id: 'spades', name: 'Verstärkte Spaten', desc: 'Werkzeug aus Plastahl für die Nährtanks.',
      cost: { plasteel: 10, knowledge: 300 }, effects: { 'job.farmer': 0.25 } },
    { id: 'cranes', name: 'Magnetkräne', desc: 'Schrott fliegt von selbst auf den Haufen.',
      cost: { plasteel: 10, knowledge: 300 }, effects: { 'job.scrapper': 0.25 } },
    { id: 'drills', name: 'Bohrservitoren', desc: 'Sie bohren, bis jemand sie abschaltet.',
      cost: { plasteel: 15, knowledge: 500 }, effects: { 'job.miner': 0.25 } },
    { id: 'lumen', name: 'Lumen-Leuchter', desc: 'Licht für die Pulte der Schreiber.',
      cost: { plasteel: 15, knowledge: 600 }, effects: { 'job.scribe': 0.25 } },
    { id: 'godwyn', name: 'Godwyn-Bolter', desc: 'Das bewährte Muster. Laut, schwer, tödlich.',
      cost: { plasteel: 20, ceramite: 10 }, effects: { 'power.bonus': 0.25 } },
    { id: 'aquila', name: 'Aquila-Rüstung Mk VII', desc: 'Frisch geschmiedete Servorüstung mit dem Adler.',
      cost: { ceramite: 30, knowledge: 800 }, effects: { 'power.bonus': 0.15, 'loss.reduce': 0.25 } },
    { id: 'narthecium', name: 'Narthecium', desc: 'Das Werkzeug der Apothecarii, um Gensaat zu retten.',
      cost: { ceramite: 10, archeotech: 2 }, effects: { 'recover.bonus': 0.2 } },
    { id: 'stasis', name: 'Stasiskapseln', desc: 'Die Gensaat schläft kalt und sicher.',
      cost: { ceramite: 10, knowledge: 1000 }, effects: { 'geneseed.capPct': 0.5 } },
    { id: 'halls', name: 'Verstärkte Lagerhallen', desc: 'Plastahl-Regale bis unter die Decke.',
      cost: { plasteel: 25, knowledge: 1200 }, effects: { 'cap.bonus': 0.25 } },
    { id: 'auspex', name: 'Auspex-Scanner', desc: 'Die Aufklärer sehen durch Staub und Fels.',
      cost: { servoskull: 5, knowledge: 1500 }, effects: { 'scout.speed': 0.25 } },
    { id: 'plasmaforge', name: 'Plasmaschmiede', desc: 'Heißer als jede Esse. Und gefährlicher.',
      cost: { ceramite: 20, archeotech: 3 }, effects: { 'craft.bonus': 0.1 } },
    { id: 'skullswarm', name: 'Servoschädel-Schwarm', desc: 'Summende Schädel lesen alte Akten vor.',
      cost: { servoskull: 10, knowledge: 2500 }, effects: { 'knowledge.bonus': 0.15 } },
    { id: 'cracker', name: 'Promethium-Crackanlage', desc: 'Mehr Promethium aus jedem Fass Rohöl.',
      cost: { ceramite: 20, knowledge: 2000 }, effects: { 'job.refiner': 0.25 } },
    { id: 'censers', name: 'Weihrauchbrenner', desc: 'Schwerer Rauch in jedem Gang. Die Knechte beten öfter.',
      cost: { plasteel: 10, faith: 500 }, effects: { 'faith.bonus': 0.2 } },
    { id: 'holotable', name: 'Hololithischer Kartentisch', desc: 'Grünes Licht zeigt Sterne, Routen und Feinde.',
      cost: { datatablet: 5, archeotech: 5 }, effects: { 'campaign.speed': 0.2 }, requires: { tech: 'warpnav' } },
  ],

  // Riten (einmalig, kosten Glaube); Fest des Primarchen öffnet zwei Litaneien.
  rites: [
    { id: 'arms', name: 'Segnung der Waffen', desc: 'Weihwasser auf Bolter und Klinge. Die Brüder schlagen härter zu.',
      cost: 100, effects: { 'power.bonus': 0.1 } },
    { id: 'labor', name: 'Hymne der Arbeit', desc: 'Die Knechte singen bei der Arbeit. Schief, aber schneller.',
      cost: 150, effects: { 'jobs.bonus': 0.1 } },
    { id: 'vigil', name: 'Litanei der Wachsamkeit', desc: 'Nachtwachen mit Gebet. Die Mauern schlafen nie.',
      cost: 200, effects: { 'defense.bonus': 0.2 } },
    { id: 'fallen', name: 'Andacht der Gefallenen', desc: 'Die Namen der Toten werden verlesen. Die Apothecarii arbeiten sorgfältiger.',
      cost: 300, effects: { 'recover.bonus': 0.2 } },
    { id: 'purity', name: 'Ritus der Reinheit', desc: 'Weihrauch in allen Gängen. Die Knechte fühlen sich beschützt.',
      cost: 450, effects: { 'moral.bonus': 0.1 } },
    { id: 'light', name: 'Hymnus des Lichts', desc: 'Kerzen im Librarium, Tag und Nacht. Die Schreiber sehen klarer.',
      cost: 650, effects: { 'knowledge.bonus': 0.1 } },
    { id: 'feast', name: 'Fest des Primarchen', desc: 'Ein Festtag für den Primarchen. Die Priester lehren zwei neue Litaneien.',
      cost: 900, effects: { 'litany.bonus': 0.25 } },
    { id: 'eternal', name: 'Ewige Andacht', desc: 'Ein Gebet, das nie endet. Die ganze Festung arbeitet im Takt.',
      cost: 1500, effects: { 'production.bonus': 0.1 } },
  ],

  // Litaneien: eine gilt 1 Jahr und erneuert sich, solange Glaube da ist.
  litanies: [
    { id: 'wrath', name: 'Zorn des Imperators', effects: { 'power.bonus': 0.3 } },
    { id: 'toil', name: 'Fleiß', effects: { 'jobs.bonus': 0.2 } },
    { id: 'wisdom', name: 'Weisheit', effects: { 'knowledge.bonus': 0.3 } },
    { id: 'steadfast', name: 'Standhaftigkeit', effects: { 'defense.bonus': 0.5 }, requires: { rite: 'feast' } },
    { id: 'cleansing', name: 'Reinheit', effects: { 'moral.bonus': 0.15 }, requires: { rite: 'feast' } },
  ],

  // Ordens-Ereignisse (ab Liturgie): je Eintrag genau eine Wirkung –
  // gift (Ressourcen), boon (Effekte für 1 Jahr), thirst (Roter Durst ±), sign (Merker setzen), calm (Bedrohung −).
  // {name} wird durch einen Bruder-Namen ersetzt.
  chapterEvents: {
    um: [
      { text: 'Ein Bruder zitiert den Kodex. Zum dritten Mal heute. Die Knechte arbeiten schneller.', boon: { 'jobs.bonus': 0.1 } },
      { text: 'Ein Schiff aus Ultramar funkt kurz. Dann nur Rauschen. Die Hoffnung bleibt.', boon: { 'moral.bonus': 0.1 } },
      { text: 'Die Brüder ordnen das Arsenal nach Kodex-Nummern. Es findet sich viel Brauchbares.', gift: { scrap: 200 } },
      { text: 'Ein Scriptor findet eine Abschrift der Taktika. Das Librarium jubelt leise.', gift: { knowledge: 500 } },
      { text: 'Parade auf dem Hof. Die Knechte sehen zu und stehen etwas gerader.', boon: { 'production.bonus': 0.05 } },
      { text: 'Bruder {name} erzählt von Macragge. Die Neophyten hören die ganze Nacht zu.', boon: { 'training.speed': 0.2 } },
    ],
    ba: [
      { text: 'Bruder {name} träumt von Sanguinius\' Fall. Er wacht schreiend auf.', thirst: 10 },
      { text: 'Die Brüder bemalen die Festung rot und golden. Sie wirkt fast schön.', boon: { 'moral.bonus': 0.1 } },
      { text: 'Ein Sanguinischer Priester singt die ganze Nacht. Der Durst wird leiser.', thirst: -15 },
      { text: 'Die Brüder fasten. Es bleibt mehr für die Knechte.', gift: { supplies: 300 } },
      { text: 'Bruder {name} trainiert allein, bis der Boden bebt. Alle kämpfen härter.', boon: { 'power.bonus': 0.15 } },
      { text: 'Blut auf dem Altar, niemand weiß von wem. Die Priester schweigen.', thirst: 5 },
    ],
    sw: [
      { text: 'Die Brüder feiern mit Mjod. Niemand weiß, woher er kommt.', gift: { grox: 10 } },
      { text: 'Ein Runenpriester wirft Knochen. Er grinst. Das ist nie ein gutes Zeichen.', boon: { 'loot.bonus': 0.2 } },
      { text: 'Zwei Brüder ringen um die letzte Grox-Keule. Beide gewinnen.', boon: { 'power.bonus': 0.1 } },
      { text: 'Wölfe heulen in der Aschewüste. Die Orks halten Abstand.', boon: { 'defense.bonus': 0.3 } },
      { text: 'Bruder {name} erzählt die Saga der Großen Kompanie. Sie dauert drei Tage.', boon: { 'moral.bonus': 0.1 } },
      { text: 'Die Brüder kehren von einer wilden Jagd zurück. Mit Beute.', gift: { scrap: 250 } },
    ],
    da: [
      { text: 'Ein Scriptor findet einen Namen in alten Akten. Er schweigt.', gift: { archeotech: 1 } },
      { text: 'Spur eines Gefallenen! Der Innere Kreis ruft zur Jagd.', sign: 'fallenSign' },
      { text: 'Die Ravenwing kehrt mit Karten der Umgebung zurück.', boon: { 'scout.speed': 0.2 } },
      { text: 'Ein Bruder der Deathwing kniet vor dem Altar. Die Knechte beten mit.', gift: { faith: 150 } },
      { text: 'Ein Ordenspriester verhört einen Knecht. Danach arbeiten alle fleißiger.', boon: { 'jobs.bonus': 0.1 } },
      { text: 'Geheime Kammern unter dem Reclusiam. Was dort liegt, bleibt dort.', gift: { knowledge: 400 } },
    ],
    sal: [
      { text: 'Die Brüder schmieden bis in die Nacht.', boon: { 'craft.bonus': 0.2 } },
      { text: 'Bruder {name} trägt verletzte Knechte aus einem eingestürzten Stollen.', boon: { 'moral.bonus': 0.1 } },
      { text: 'Feuer ist Reinheit. Die Brüder segnen die Essen.', gift: { plasteel: 10 } },
      { text: 'Die Knechte backen den Brüdern Brot. Es ist furchtbar. Alle essen es.', gift: { supplies: 200 } },
      { text: 'Ein Bruder bringt den Bergleuten bei, wie man den Fels liest.', boon: { 'job.miner': 0.2 } },
      { text: 'Die Brüder beten am Feuer für Vulkan. Es brennt heller als sonst.', gift: { faith: 150 } },
    ],
    ws: [
      { text: 'Bruder {name} reitet allein in den Sturm und kehrt mit Beute zurück.', gift: { scrap: 200 } },
      { text: 'Die Brüder üben auf den Bikes. Knechte springen zur Seite.', boon: { 'mission.speed': 0.1 } },
      { text: 'Ein Sturmseher liest die Wolken. Die Jagd wird gut.', boon: { 'loot.bonus': 0.2 } },
      { text: 'Die Brüder erzählen von Chogoris. Die Knechte träumen von weiten Ebenen.', boon: { 'moral.bonus': 0.1 } },
      { text: 'Eine Jagdgruppe bringt einen ganzen Grox zurück.', gift: { grox: 15 } },
      { text: 'Die Khan-Wache übt Überfälle. Die Orks verlieren die Lust.', calm: 40 },
    ],
  },

  clicks: [
    { id: 'scrap', name: 'Trümmer durchsuchen' },
    { id: 'supplies', name: 'Vorräte bergen' },
  ],

  // effects: '<res>.rate' = Ertrag/s, '<res>.cap' = Lager, '<res>.bonus' = Anteil obendrauf,
  // 'job.<jobId>' = Anteil obendrauf für einen Job, 'serfs.cap' = Knechte-Plätze.
  // requires: tech (Id oder Liste), building (mindestens eins gebaut), seen (Merker in s.seen).
  buildings: [
    { id: 'hydroFarm', name: 'Hydrokulturfarm', desc: 'Nährtanks im Schutt. In der Sonnenzeit wächst es am besten.',
      cost: { supplies: 10 }, ratio: 1.12, effects: { 'supplies.rate': 0.5 } },
    { id: 'quarters', name: 'Knechtsquartier', desc: 'Ein abgedichteter Raum im Wrack. Platz für zwei Knechte.',
      cost: { scrap: 12 }, ratio: 1.6, effects: { 'serfs.cap': 2 } },
    { id: 'scriptorium', name: 'Skriptorium', desc: 'Pulte, Kerzen, geborgene Datenkristalle. Schreiber sammeln Wissen.',
      cost: { scrap: 25, supplies: 10 }, ratio: 1.15, effects: { 'knowledge.cap': 100, 'knowledge.bonus': 0.05 },
      requires: { seen: 'serfs' } },
    { id: 'storehouse', name: 'Speicher', desc: 'Versiegelte Kammern gegen Asche und Ungeziefer.',
      cost: { scrap: 40 }, ratio: 1.3, effects: { 'supplies.cap': 150, 'scrap.cap': 100, 'ore.cap': 100 },
      requires: { tech: 'storage' } },
    { id: 'salvageYard', name: 'Bergungsplatz', desc: 'Kräne und Schneidbrenner. Schrottsammler arbeiten schneller.',
      cost: { scrap: 50 }, ratio: 1.2, effects: { 'job.scrapper': 0.2, 'scrap.cap': 60 }, requires: { tech: 'salvage' } },
    { id: 'apothecarion', name: 'Apothecarion', desc: 'Stasiskammern und Implantat-Tische. Das erste weckt die Brüder.',
      cost: { scrap: 150, supplies: 80 }, ratio: 1.5, effects: { 'implant.slots': 1, 'geneseed.cap': 3 },
      requires: { tech: 'susan' } },
    { id: 'mine', name: 'Mine', desc: 'Ein Stollen in die Erzader. Knechte können als Bergleute arbeiten.',
      cost: { scrap: 60 }, ratio: 1.2, effects: { 'job.miner': 0.2, 'ore.cap': 80 }, requires: { place: 'orevein' } },
    { id: 'cells', name: 'Zellentrakt', desc: 'Kahle Zellen für Brüder und Neophyten. Platz für fünf.',
      cost: { scrap: 60, ore: 40 }, ratio: 1.25, effects: { 'marines.cap': 5 }, requires: { tech: 'cellcraft' } },
    { id: 'arena', name: 'Prüfungsarena', desc: 'Die Stämme schicken ihre Stärksten. Wenige bestehen.',
      cost: { scrap: 80, ore: 40 }, ratio: 1.4, effects: { 'aspirants.rate': 0.001, 'aspirants.cap': 2 },
      requires: { tech: 'trials' } },
    { id: 'cages', name: 'Übungskäfige', desc: 'Servitoren mit Klingen. Neophyten lernen schneller.',
      cost: { ore: 60, scrap: 40 }, ratio: 1.3, effects: { 'training.speed': 0.1, 'power.bonus': 0.02 },
      requires: { tech: 'drill' } },
    { id: 'archivum', name: 'Archivum', desc: 'Stasis-Regale für Datenkristalle. Das Wissen-Lager wächst.',
      cost: { scrap: 150, ore: 80 }, ratio: 1.25, effects: { 'knowledge.capPct': 0.2 }, requires: { tech: 'geneseedlore' } },
    { id: 'bastion', name: 'Bastion', desc: 'Schrott, Erz und Sandsäcke. Die Orks sollen sich die Zähne ausbeißen.',
      cost: { ore: 120, scrap: 60 }, ratio: 1.25, effects: { 'defense.flat': 20 }, requires: { tech: 'fortify' } },
    { id: 'armory', name: 'Waffenkammer', desc: 'Bolter, Kettenschwerter, gesegnete Munition.',
      cost: { ore: 150, scrap: 80 }, ratio: 1.3, effects: { 'power.bonus': 0.05 }, requires: { tech: 'weaponlore' } },
    { id: 'forge', name: 'Schmiede', desc: 'Essen, Ambosse, Litaneien. Aus Schrott wird Plastahl.',
      cost: { ore: 100, scrap: 100 }, ratio: 1.15, effects: { 'craft.bonus': 0.06 }, requires: { tech: 'smithing' } },
    { id: 'refinery', name: 'Raffinerie', desc: 'Rohre, Ventile, ständiges Zischen. Knechte raffinieren Promethium.',
      cost: { ore: 80, scrap: 60 }, ratio: 1.2, effects: { 'promethium.cap': 60 }, requires: { tech: 'refining' } },
    { id: 'hab', name: 'Hab-Block', desc: 'Plastahl-Wände, Stockbetten, Luftfilter. Platz für fünf Knechte.',
      cost: { plasteel: 5, ore: 60 }, ratio: 1.25, effects: { 'serfs.cap': 5 }, requires: { tech: 'construction' } },
    { id: 'warehouse', name: 'Lagerhalle', desc: 'Stahlträger und Ceramit-Böden. Viel Platz für alles.',
      cost: { plasteel: 5, ceramite: 3 }, ratio: 1.2,
      effects: { 'supplies.cap': 300, 'scrap.cap': 200, 'ore.cap': 200, 'promethium.cap': 60, 'grox.cap': 20, 'amasec.cap': 20,
        'incense.cap': 20 },
      requires: { tech: 'logistics' } },
    { id: 'shrine', name: 'Schrein', desc: 'Kerzen, ein Aquila aus Schrott. Knechte können als Prediger dienen.',
      cost: { scrap: 150, ore: 50 }, ratio: 1.2, effects: { 'faith.cap': 50, 'faith.bonus': 0.05 }, requires: { tech: 'liturgy' } },
    { id: 'reclusiam', name: 'Reclusiam', desc: 'Die Kapelle des Ordens. Hier werden Riten und Litaneien gehalten.',
      cost: { ceramite: 10, faith: 100 }, ratio: 1.3, effects: { 'faith.cap': 100, 'faith.bonus': 0.1, 'litany.bonus': 0.05 },
      requires: { tech: 'liturgy' } },
    { id: 'astropathTower', name: 'Astropathenturm', desc: 'Kabel, Antennen und ein blinder Psioniker auf einem Thron.',
      cost: { plasteel: 8, ceramite: 4 }, ratio: 1.3, effects: { 'vision.auto': 0.1 }, requires: { tech: 'astropathy' } },
    { id: 'tradeHouse', name: 'Handelskontor', desc: 'Schreibpulte, Siegel und ein Servitor für Beschwerden.',
      cost: { plasteel: 10 }, ratio: 1.2, effects: { 'trade.bonus': 0.05 }, requires: { tech: 'trade' } },
    { id: 'servitorCell', name: 'Servitor-Zelle', desc: 'Ein Operationstisch des Mechanicus. Aus Knechten werden Servitoren.',
      cost: { plasteel: 8, archeotech: 2 }, ratio: 1.4, effects: { 'servitor.bonus': 0.1 }, requires: { standing: { mechanicus: 1 } } },
    { id: 'landingPad', name: 'Landeplattform', desc: 'Ceramit-Platten, Kräne, Treibstoffschläuche. Platz für drei Thunderhawks.',
      cost: { ceramite: 10, plasteel: 10 }, ratio: 1.3, effects: { 'hangar.hawk': 3 }, requires: { tech: 'flight' } },
    { id: 'orbitalYard', name: 'Orbitalwerft', desc: 'Ein Dock im Orbit. Hier entstehen Kriegsschiffe.',
      cost: { ceramite: 30, plasteel: 20, archeotech: 5 }, ratio: 1.4, effects: { 'hangar.cruiser': 2 },
      requires: { tech: 'orbital' } },
    { id: 'geneVault', name: 'Gensaat-Tresor', desc: 'Stasisfelder halten die Gensaat frisch. Für Jahrhunderte.',
      cost: { ceramite: 10, archeotech: 2 }, ratio: 1.3, effects: { 'geneseed.cap': 10 }, requires: { tech: 'stasis' } },
  ],

  // farm: Hunger bremst diesen Job nicht (sonst Teufelskreis).
  jobs: [
    { id: 'scrapper', name: 'Schrottsammler', effects: { 'scrap.rate': 0.3 } },
    { id: 'farmer', name: 'Bauer', farm: true, effects: { 'supplies.rate': 1 }, requires: { tech: 'hydroponics' } },
    { id: 'scribe', name: 'Schreiber', effects: { 'knowledge.rate': 0.15 }, requires: { building: 'scriptorium' } },
    { id: 'miner', name: 'Bergmann', effects: { 'ore.rate': 0.25 }, requires: { building: 'mine' } },
    { id: 'refiner', name: 'Raffineriearbeiter', effects: { 'promethium.rate': 0.08 }, requires: { building: 'refinery' } },
    { id: 'preacher', name: 'Prediger', effects: { 'faith.rate': 0.05 }, requires: { building: 'shrine' } },
  ],

  // Ämter für Kampfbrüder: wirken ohne Moral; names: anderer Titel je Orden.
  offices: [
    { id: 'apothecary', name: 'Apothecarius', desc: 'Implantation schneller und sicherer',
      requires: { tech: 'geneseedlore' } },
    { id: 'scriptor', name: 'Scriptor', names: { sw: 'Runenpriester' }, desc: 'Liest die alten Datenkristalle',
      effects: { 'knowledge.rate': 0.5 }, requires: { tech: 'librarius' } },
    { id: 'priest', name: 'Ordenspriester', names: { ba: 'Sanguinischer Priester' }, desc: 'Hält Glauben und Moral hoch',
      effects: { 'faith.rate': 0.2 }, requires: { tech: 'liturgy' } },
    { id: 'techmarine', name: 'Techmarine', desc: 'Spricht mit dem Maschinengeist der Schmiede',
      effects: { 'craft.bonus': 0.1 }, requires: { standing: { mechanicus: 2 } } },
  ],

  // Orte für die Aufklärung: time in Sekunden, reward einmalig, effects dauerhaft.
  places: [
    { id: 'crashsite', name: 'Absturzstelle', desc: 'Das Wrack. Irgendwo darin liegt die Gensaat-Kammer.', time: 60,
      reward: { geneseed: 5, scrap: 40 } },
    { id: 'orevein', name: 'Erzader', desc: 'Dunkle Adern im Fels hinter den Ruinen.', time: 180 },
    { id: 'tribes', name: 'Stammesland', desc: 'Menschen in Fellen, mit Speeren und Stolz.', time: 300,
      effects: { 'arrival.bonus': 0.1 } },
    { id: 'ashwaste', name: 'Aschewüste', desc: 'Grüne Haut im grauen Staub. Die Orks sammeln sich.', time: 600,
      threat: true, requires: { tech: 'doctrine' } },
    { id: 'promwell', name: 'Promethium-Quelle', desc: 'Schwarzes Öl sickert aus einem Riss im Fels.', time: 900,
      requires: { tech: 'smithing' } },
    { id: 'hive', name: 'Makropol-Ruine', desc: 'Eine tote Stadt aus Stahl, hundert Stockwerke hoch.', time: 1200,
      requires: { tech: 'smithing' } },
    { id: 'cathedral', name: 'Alte Kathedrale', desc: 'Ein eingestürzter Dom. Die Heiligenbilder sehen noch zu.', time: 1800,
      requires: { tech: 'smithing' } },
    { id: 'astrostation', name: 'Astropathen-Station', desc: 'Eine tote Relaisstation. Der Chor ist fort, die Technik nicht.',
      time: 2400, requires: { tech: 'archives' } },
    { id: 'spaceport', name: 'Raumhafen-Ruine', desc: 'Rostige Landefelder und ein halber Kontrollturm.', time: 3600,
      requires: { tech: 'astropathy' } },
  ],

  // Kampfeinsätze: threat = Bedrohung des Gegners, squad = [min, max] Kämpfer, loot bei Erfolg,
  // lucky = seltene Beute { Ressource: [Chance, Menge] }, calm = Bedrohung sinkt um so viel.
  missions: [
    { id: 'raiders', name: 'Ork-Plünderer vertreiben', desc: 'Ein Trupp Boyz plündert die Außenposten.',
      threat: 30, time: 240, squad: [3, 5], loot: { scrap: 60, renown: 5 }, calm: 10,
      requires: { tech: 'doctrine', place: 'ashwaste' } },
    { id: 'groxhunt', name: 'Grox-Jagd', desc: 'Grox sind dumm, zäh und schmecken nach Sieg.',
      threat: 20, time: 300, squad: [2, 3], loot: { grox: 10 }, requires: { tech: 'doctrine' } },
    { id: 'wreckfields', name: 'Wrackfelder plündern', desc: 'Alte Schlachtfelder voller Metall und Geheimnisse.',
      threat: 40, time: 600, squad: [3, 5], loot: { scrap: 200, ore: 30 }, lucky: { archeotech: [0.1, 1] },
      requires: { tech: 'doctrine', place: 'ashwaste' } },
    { id: 'orkcamp', name: 'Ork-Lager zerschlagen', desc: 'Das Lager des Warbosses. Laut, dreckig, gefährlich.',
      threat: 120, time: 1200, squad: [5, 10], loot: { scrap: 400, renown: 40 }, calm: 40,
      requires: { tech: 'weaponlore', place: 'ashwaste' } },
    { id: 'hivepurge', name: 'Makropol-Säuberung', desc: 'Mutanten und Schlimmeres in den unteren Ebenen.',
      threat: 250, time: 1800, squad: [8, 15], loot: { archeotech: 2, renown: 60 },
      requires: { tech: 'doctrine', place: 'hive' } },
    // clears: nach dem Sieg ist die Spur kalt (Merker weg, Einsatz verschwindet)
    { id: 'fallenhunt', name: 'Jagd auf einen Gefallenen', desc: 'Ein Verräter aus alter Zeit. Niemand darf davon erfahren.',
      threat: 300, time: 2400, squad: [10, 10], loot: { renown: 200, archeotech: 3 }, clears: 'fallenSign',
      requires: { tech: 'doctrine', seen: 'fallenSign' } },
    // sets: nach dem Sieg gesetzter Merker (hier: Kontakt zur Inquisition)
    { id: 'cultpurge', name: 'Kult zerschlagen', desc: 'Hybriden in den Kellern der Makropole. Sie lächeln zu viel.',
      threat: 150, time: 900, squad: [5, 10], loot: { renown: 40 }, clears: 'cult', sets: 'cultCrushed',
      requires: { tech: 'doctrine', seen: 'cult' } },
  ],

  techs: [
    { id: 'calendar', name: 'Imperialer Kalender', desc: 'Terranisches Datum und die Zeiten von Kharos Tertius.',
      cost: { knowledge: 15 }, unlockText: 'Datum und Planetenzeiten' },
    { id: 'hydroponics', name: 'Hydroponik', desc: 'Nährtanks richtig pflegen. Knechte können als Bauern arbeiten.',
      cost: { knowledge: 30 } },
    { id: 'storage', name: 'Lagerhaltung', desc: 'Vorräte ordnen, zählen und vor Asche schützen.',
      cost: { knowledge: 60 }, requires: { tech: 'calendar' } },
    { id: 'salvage', name: 'Bergung', desc: 'Das Wrack planvoll zerlegen statt es zu durchwühlen.',
      cost: { knowledge: 90 }, requires: { tech: 'hydroponics' } },
    { id: 'susan', name: 'Sus-an-Studien', desc: 'Die Membran, die Brüder im Koma hält. Und wie man sie weckt.',
      cost: { knowledge: 800 }, requires: { tech: ['storage', 'salvage'] }, unlockText: 'Einsätze (Aufklärung)' },
    { id: 'geneseedlore', name: 'Gensaat-Kunde', desc: 'Progenoide ernten, lagern und einpflanzen.',
      cost: { knowledge: 1200 }, requires: { tech: 'susan' }, unlockText: 'Implantation' },
    { id: 'cellcraft', name: 'Zellenbau', desc: 'Aus Erz und Schrott werden Zellen für neue Brüder.',
      cost: { knowledge: 1400 }, requires: { tech: 'susan', place: 'orevein' } },
    { id: 'trials', name: 'Prüfungsrituale', desc: 'Die alten Prüfungen des Ordens, für die Stämme von Kharos.',
      cost: { knowledge: 1600 }, requires: { tech: 'geneseedlore', place: 'tribes' } },
    { id: 'drill', name: 'Kodex-Drill', desc: 'Kampfübungen nach dem Kodex Astartes.',
      cost: { knowledge: 2400 }, requires: { tech: 'trials' } },
    { id: 'librarius', name: 'Librarius', desc: 'Psioniker unter den Brüdern finden und schulen.',
      cost: { knowledge: 3000 }, requires: { tech: 'geneseedlore' } },
    { id: 'doctrine', name: 'Kampfdoktrin', desc: 'Der Kodex Astartes über Trupps, Deckung und Feuer.',
      cost: { knowledge: 2800 }, requires: { tech: 'drill' }, unlockText: 'Kampfeinsätze, Aschewüste' },
    { id: 'fortify', name: 'Befestigung', desc: 'Mauern, Schussfelder, Todeszonen.',
      cost: { knowledge: 3200 }, requires: { tech: 'doctrine', place: 'ashwaste' } },
    { id: 'weaponlore', name: 'Waffenkunde', desc: 'Bolter pflegen, segnen und reparieren.',
      cost: { knowledge: 4000 }, requires: { tech: 'doctrine' } },
    { id: 'planning', name: 'Einsatzplanung', desc: 'Ein Trupp kennt seinen Befehl, bevor er zurück ist.',
      cost: { knowledge: 6000 }, requires: { tech: 'doctrine' }, unlockText: 'Einsatzbefehle (Wiederholen)' },
    { id: 'smithing', name: 'Schmiedekunst', desc: 'Esse, Hammer und die rechten Gebete an den Maschinengeist.',
      cost: { knowledge: 4000 }, requires: { tech: 'weaponlore' }, unlockText: 'Plastahl, Servoschädel, neue Orte' },
    { id: 'refining', name: 'Raffination', desc: 'Aus Rohöl wird Promethium, aus Promethium Ceramit.',
      cost: { knowledge: 4500 }, requires: { tech: 'smithing', place: 'promwell' }, unlockText: 'Ceramit, Treibstoffzellen' },
    { id: 'munitorum', name: 'Munitorum-Verwaltung', desc: 'Listen, Stempel, Zuständigkeiten.',
      cost: { knowledge: 5000 }, requires: { tech: 'smithing' }, unlockText: 'Aufgabe für neue Knechte' },
    { id: 'logistics', name: 'Logistik', desc: 'Wer lagert was, wo und wie viel davon.',
      cost: { knowledge: 6000 }, requires: { tech: 'munitorum' } },
    { id: 'construction', name: 'Bautechnik', desc: 'Die alten Hab-Blöcke der Makropole verstehen und nachbauen.',
      cost: { knowledge: 6500 }, requires: { tech: 'smithing', place: 'hive' } },
    { id: 'archives', name: 'Datenarchive', desc: 'Wissen auf Datentafeln bannen, bevor es verloren geht.',
      cost: { knowledge: 7500 }, requires: { tech: 'smithing' }, unlockText: 'Datentafeln' },
    { id: 'liturgy', name: 'Liturgie', desc: 'Die Gebete des Ordens, geborgen aus der Alten Kathedrale.',
      cost: { knowledge: 5000 }, requires: { tech: 'smithing', place: 'cathedral' },
      unlockText: 'Glaube, Riten, Litaneien, Große Messe, Ordens-Ereignisse' },
    { id: 'astropathy', name: 'Astropathie', desc: 'Ein Chor aus Psionikern ruft durch den Warp nach Verbündeten.',
      cost: { knowledge: 12000, datatablet: 5 }, requires: { place: 'astrostation' },
      unlockText: 'Beziehungen, Visionen, Navigationsdaten' },
    { id: 'trade', name: 'Handelsrecht', desc: 'Verträge nach imperialem Recht. Mit Siegel und Drohung.',
      cost: { knowledge: 15000 }, requires: { tech: 'astropathy' } },
    { id: 'stasis', name: 'Stasis-Technik', desc: 'Zeit anhalten, zumindest für ein paar Organe.',
      cost: { knowledge: 20000, archeotech: 2 }, requires: { tech: ['geneseedlore', 'archives'] } },
    { id: 'flight', name: 'Flugtechnik', desc: 'Die Maschinengeister der Thunderhawks wecken und besänftigen.',
      cost: { knowledge: 18000, datatablet: 10 }, requires: { place: 'spaceport' }, unlockText: 'Reiter Flotte' },
    { id: 'warpnav', name: 'Warpnavigation', desc: 'Routen durch den Warp. Mit Navigator, ohne Wahnsinn.',
      cost: { knowledge: 25000, navdata: 5 }, requires: { tech: 'flight' }, unlockText: 'Sektorkarte, Feldzüge' },
    { id: 'orbital', name: 'Orbitalbau', desc: 'Docks, Kräne und Gebete in der Schwerelosigkeit.',
      cost: { knowledge: 32000, archeotech: 3 }, requires: { tech: 'warpnav' }, unlockText: 'Angriffskreuzer, Schlachtbarke' },
    { id: 'founding', name: 'Gründungsrecht', desc: 'Das Recht, aus eigener Gensaat einen neuen Orden zu gründen.',
      cost: { knowledge: 45000, datatablet: 25, archeotech: 10 }, requires: { tech: 'orbital' },
      unlockText: 'Nachfolgeorden, Reiter Vermächtnis' },
  ],

  // Partner (Reiter Beziehungen): give = Paket, das der Orden abgibt, get = Paket, das er bekommt (serfs: Knechte),
  // help = Effekte je Ansehen-Stufe, requires = Kontakt.
  partners: [
    { id: 'mechanicus', name: 'Adeptus Mechanicus', desc: 'Ein Forge-Schiff im Orbit. Sie wollen Archäotech, sonst nichts.',
      give: { archeotech: 2 }, get: { ceramite: 15, plasteel: 5 }, help: { 'craft.bonus': 0.03 },
      helpText: 'Stufe 1: Servitor-Zelle, Stufe 2: Techmarine', requires: { tech: 'astropathy' } },
    { id: 'varos', name: 'Agrarwelt Varos', desc: 'Endlose Felder und zu wenig Werkzeug. Sie zahlen in Getreide.',
      give: { plasteel: 4 }, get: { supplies: 500 }, help: { 'supplies.bonus': 0.03 }, requires: { tech: 'astropathy' } },
    { id: 'guard', name: 'Astra Militarum', desc: 'Die Reste eines Regiments. Hungrig, müde, treu.',
      give: { supplies: 300 }, get: { serfs: 2 }, help: { 'defense.bonus': 0.05 },
      requires: { tech: 'astropathy', place: 'ashwaste' } },
    { id: 'ecclesiarchy', name: 'Ekklesiarchie', desc: 'Die Priester der Kathedrale segnen gegen Spenden.',
      give: { renown: 20 }, get: { incense: 10, faith: 40 }, help: { 'faith.bonus': 0.03 },
      requires: { tech: 'astropathy', place: 'cathedral' } },
    { id: 'valkar', name: 'Haus Valkar', desc: 'Freihändler mit Kaperbrief. Alles hat seinen Preis.',
      give: { promethium: 60 }, get: { amasec: 8 }, help: { 'trade.bonus': 0.03 }, requires: { tech: 'astropathy', seen: 'valkar' } },
    { id: 'navis', name: 'Navigatorenhaus Castellan', desc: 'Ein Navigator mit drittem Auge. Er sieht den Weg durch den Warp.',
      give: { promethium: 120 }, get: { navdata: 2 }, help: { 'campaign.speed': 0.03 }, requires: { tech: 'warpnav' } },
    { id: 'inquisition', name: 'Inquisition', desc: 'Ordo Hereticus. Sie fragen nicht, sie wissen.',
      give: { renown: 60 }, get: { archeotech: 1 }, help: { 'threat.slow': 0.05 },
      requires: { tech: 'astropathy', seen: 'cultCrushed' } },
  ],

  // Schiffe (Reiter Flotte): Preis wie Gebäude; hangar = Platz aus Gebäuden (hangar.<Art>), once = nur eins.
  ships: [
    { id: 'thunderhawk', name: 'Thunderhawk', desc: 'Kanonenboot und Landungsschiff. Laut, schnell, unverzichtbar.',
      cost: { ceramite: 15, plasteel: 10, fuelcell: 2 }, ratio: 1.25, hangar: 'hawk',
      effects: { 'fleet.power': 10, 'scout.speed': 0.1 } },
    { id: 'cruiser', name: 'Angriffskreuzer', desc: 'Ein Schiff, um eine Welt zu erobern. Oder zu verbrennen.',
      cost: { ceramite: 60, plasteel: 40, archeotech: 5, fuelcell: 10 }, ratio: 1.5, hangar: 'cruiser',
      effects: { 'fleet.power': 50 } },
    { id: 'barge', name: 'Schlachtbarke', desc: 'Eine fliegende Festung. Jeder Orden hat nur eine.',
      cost: { ceramite: 300, plasteel: 200, archeotech: 25, fuelcell: 40 }, ratio: 1, once: true,
      effects: { 'fleet.power': 300, 'renown.bonus': 0.1 }, requires: { building: 'orbitalYard' } },
  ],

  // Sektorkarte: next = Nachbarn (in beide Richtungen), x/y = Platz auf der Karte (0–100), short = Name auf der Karte,
  // effects = Dauerbonus nach der Befreiung, reward = einmalige Beute, legacy = Vermächtnis (ab Etappe 8).
  systems: [
    { id: 'kharos', name: 'Kharos Tertius', short: 'Kharos', kind: 'Heimat', home: true, x: 8, y: 50, next: ['varos', 'tyrrhen'] },
    { id: 'varos', name: 'Varos Agraria', short: 'Varos', kind: 'Agrarwelt', threat: 150, nav: 2, time: 3600, x: 28, y: 28,
      next: ['kharos', 'oriel', 'metallum'], effects: { 'supplies.bonus': 0.15 } },
    { id: 'tyrrhen', name: 'Tyrrhen', short: 'Tyrrhen', kind: 'Makropolwelt', threat: 300, nav: 3, time: 5400, x: 28, y: 72,
      next: ['kharos', 'ossuar', 'vhal'], effects: { 'serfs.capPct': 0.1, 'arrival.bonus': 0.2 } },
    { id: 'oriel', name: 'Sankt Oriel', short: 'St. Oriel', kind: 'Kathedralwelt', threat: 350, nav: 4, time: 7200, x: 50, y: 10,
      next: ['varos', 'gorkfang'], effects: { 'faith.bonus': 0.2 } },
    { id: 'metallum', name: 'Metallum Sekundus', short: 'Metallum', kind: 'Schmiedewelt', threat: 400, nav: 4, time: 7200, x: 50, y: 37,
      next: ['varos', 'beacon'], effects: { 'craft.bonus': 0.15 } },
    { id: 'ossuar', name: 'Ossuar', short: 'Ossuar', kind: 'Totenwelt', threat: 500, nav: 5, time: 9000, x: 50, y: 63,
      next: ['tyrrhen', 'hulk'], effects: { 'loot.archeotech': 0.25 } },
    { id: 'vhal', name: 'Vhal Glacialis', short: 'Vhal', kind: 'Eiswelt', threat: 450, nav: 5, time: 9000, x: 50, y: 90,
      next: ['tyrrhen', 'kathar'], effects: { 'promethium.bonus': 0.2 } },
    { id: 'gorkfang', name: 'Gorkfang', short: 'Gorkfang', kind: 'Orkwelt', threat: 1000, nav: 6, time: 14400, x: 72, y: 10,
      next: ['oriel', 'rift'], effects: { 'threat.slow': 0.5 }, reward: { renown: 300 } },
    { id: 'beacon', name: 'Leuchtfeuer', short: 'Leuchtfeuer', kind: 'Navigatorenposten', threat: 600, nav: 6, time: 10800, x: 72, y: 37,
      next: ['metallum', 'rift'], effects: { 'vision.bonus': 1 } },
    { id: 'hulk', name: 'Sündenbrecher', short: 'Sündenbrecher', kind: 'Space Hulk', threat: 1200, nav: 8, time: 14400, x: 72, y: 63,
      next: ['ossuar', 'rift'], reward: { archeotech: 10 } },
    { id: 'kathar', name: 'Kathar Nihil', short: 'Kathar', kind: 'Chaoswelt', threat: 1500, nav: 8, time: 18000, x: 72, y: 90,
      next: ['vhal', 'rift'], effects: { 'power.bonus': 0.1 }, legacy: 5 },
    { id: 'rift', name: 'Aeternum-Riss', short: 'Aeternum', kind: 'Riss-Rand', threat: 2500, nav: 10, time: 21600, x: 92, y: 50,
      next: ['beacon', 'gorkfang', 'hulk', 'kathar'], legacy: 10 },
  ],

  // Ordensrelikte (Reiter Vermächtnis): cost in freien Vermächtnis-Punkten; effects wirken sofort und für immer,
  // start = Startpaket ab der nächsten Gründung (res, bld, tech, places, coma = Brüder im Sus-an-Koma).
  relics: [
    { id: 'banner', name: 'Banner des Gründers', desc: 'Zerfetzt, verbrannt, heilig. Unter ihm fängt man leichter an.', cost: 5,
      start: { res: { scrap: 50, supplies: 50 }, bld: { hydroFarm: 1, quarters: 1 } } },
    { id: 'codex', name: 'Kodex-Abschrift', desc: 'Eine Handschrift der ersten Lehren. Man muss sie nicht neu finden.', cost: 10,
      start: { tech: ['calendar', 'hydroponics', 'storage', 'salvage'] } },
    { id: 'reserve', name: 'Gensaat-Reserve', desc: 'Versiegelte Progenoide aus der Gründung.', cost: 15,
      effects: { 'geneseed.cap': 5 }, start: { res: { geneseed: 5 } } },
    { id: 'map', name: 'Karte der Vorfahren', desc: 'Wege, Adern und Stämme, von den Vätern verzeichnet.', cost: 20,
      start: { places: ['crashsite', 'orevein', 'tribes'] } },
    { id: 'veterans', name: 'Veteranen-Trupp', desc: 'Fünf alte Brüder schlafen mit, bereit für den neuen Orden.', cost: 25,
      effects: { 'marines.cap': 5 }, start: { coma: 5 } },
    { id: 'skulls', name: 'Servoschädel des Archivars', desc: 'Er erinnert sich an alles. Leider auch an alles Unwichtige.',
      cost: 30, effects: { 'knowledge.bonus': 0.15 } },
    { id: 'vigil', name: 'Ewige Wacht', desc: 'Die Festung arbeitet weiter, auch wenn du eine Woche fort bist.', cost: 40,
      effects: { 'offline.days': 4 } },
    { id: 'bolter', name: 'Heiliger Bolter', desc: 'Die Waffe des ersten Ordensmeisters. Sie verfehlt nie.', cost: 50,
      effects: { 'power.bonus': 0.15 } },
    { id: 'choir', name: 'Astropathen-Chor', desc: 'Zwölf Stimmen, ein Ruf. Die Visionen kommen doppelt so oft.', cost: 60,
      effects: { 'vision.rate': 1, 'vision.auto': 0.25 } },
    { id: 'armor', name: 'Rüstung des Ordensmeisters', desc: 'Terminator-Rüstung aus der Gründung. Wer sie trägt, fällt selten.',
      cost: 80, effects: { 'loss.reduce': 0.25 } },
    { id: 'vault', name: 'Stasis-Tresor', desc: 'Kalte Kammern, in denen die Gensaat schneller reift.', cost: 100,
      effects: { 'geneseed.bonus': 0.25 } },
  ],

  // Heraldische Paletten für Nachfolgeorden (sonst die Farben der Linie).
  palettes: [
    { id: 'blackgold', name: 'Schwarz und Gold', c1: '#1c1a17', c2: '#d4a93c', on: '#f3eee0', glow: '#e8c170' },
    { id: 'purple', name: 'Purpur und Silber', c1: '#5a2a6e', c2: '#c9ccd3', on: '#ffffff', glow: '#c79bff' },
    { id: 'greenbone', name: 'Grün und Knochen', c1: '#2f5b2f', c2: '#e3d8b8', on: '#ffffff', glow: '#a6e39a' },
    { id: 'bluewhite', name: 'Blau und Weiß', c1: '#2a5caa', c2: '#f0f0f0', on: '#ffffff', glow: '#9cc6ff' },
    { id: 'redblack', name: 'Rot und Schwarz', c1: '#8e1616', c2: '#1a1a1a', on: '#ffffff', glow: '#ff8a7a' },
    { id: 'greyred', name: 'Grau und Rot', c1: '#5d6268', c2: '#b3261e', on: '#ffffff', glow: '#d9e1ea' },
    { id: 'orange', name: 'Orange und Schwarz', c1: '#c2571a', c2: '#1c1c1c', on: '#ffffff', glow: '#ffb27a' },
    { id: 'teal', name: 'Türkis und Bronze', c1: '#1d6f73', c2: '#c08a47', on: '#ffffff', glow: '#8fe9e4' },
  ],

  // Welt-Ereignisse: every = Sekunden im Schnitt; effects wirken, solange das Ereignis anhält.
  worldEvents: [
    { id: 'trader', every: 3000, requires: { tech: 'astropathy' },
      first: 'Ein Freihändler legt an. Haus Valkar bietet Handel an.',
      text: 'Haus Valkar liegt wieder im Hafen. Der nächste Tausch mit ihm bringt 50 % mehr.' },
    { id: 'storm', every: 8000, requires: { tech: 'astropathy' }, effects: { 'faith.bonus': 0.5 },
      text: 'Warpsturm! Die Astropathen schweigen ein Jahr lang. Die Knechte beten mehr.',
      end: 'Der Warpsturm legt sich. Die Astropathen hören wieder.' },
    { id: 'waaagh', every: 6000, requires: { place: 'ashwaste' }, threat: 100,
      text: 'WAAAGH! Die Orks der Aschewüste sammeln sich. Die Bedrohung steigt um 100.' },
    { id: 'cult', every: 10000, requires: { place: 'hive' }, effects: { 'arrival.bonus': -0.5 },
      text: 'Ein Genestealer-Kult nistet in der Makropol-Ruine. Neue Knechte kommen nur halb so oft.' },
  ],

  // effects wirken, sobald ihr System existiert; bonus/quirk/flaw sind die Texte der Ordenswahl.
  chapters: [
    { id: 'um', name: 'Ultramarines', ship: 'Ehre von Macragge',
      colors: { c1: '#1f4494', c2: '#d8b24a', on: '#ffffff', glow: '#79b8ff' },
      bonus: 'Lager +20 %, Knechte kommen 10 % schneller', quirk: 'Kodex: volle Kompanien zählen doppelt',
      flaw: 'keiner, der Einsteiger-Orden', effects: { 'cap.bonus': 0.2, 'arrival.bonus': 0.1, 'company.bonus': 0.05 },
      boost: ['cap.bonus', 'arrival.bonus'],
      successors: ['Novamarines', 'Genesis Chapter', 'Aurora Chapter', 'Mortifactors', 'Libators'],
      names: ['Cassian', 'Varro', 'Aethon', 'Lucan', 'Severus', 'Tiberon', 'Maxim', 'Cato'] },
    { id: 'ba', name: 'Blood Angels', ship: 'Blutkelch',
      colors: { c1: '#a11d1d', c2: '#d8b24a', on: '#ffffff', glow: '#ff7a6b' },
      bonus: 'Kampfkraft +20 %', quirk: 'Roter Durst und Schwarzer Zorn', flaw: 'der Durst selbst',
      effects: { 'power.bonus': 0.2, 'thirst': 1 }, boost: ['power.bonus'],
      successors: ['Flesh Tearers', 'Angels Vermilion', 'Blood Drinkers', 'Angels Encarmine', 'Knights of Blood'],
      names: ['Raphael', 'Lucien', 'Erasmus', 'Lorenzo', 'Leonato', 'Sevrin', 'Amadeo', 'Donatus'] },
    { id: 'sw', name: 'Space Wolves', ship: 'Fenrisklaue',
      colors: { c1: '#6e8298', c2: '#e0b93b', on: '#ffffff', glow: '#b5d6ff' },
      bonus: 'Einsatz-Beute +25 %', quirk: 'Runenpriester statt Scriptoren, Neustart als „Neue Große Kompanie“',
      flaw: 'Wulfen-Fluch: Implantation −10 % Erfolg',
      effects: { 'implant.bonus': -0.1, 'implant.wulfen': 0.5, 'loot.bonus': 0.25 }, boost: ['loot.bonus'],
      successors: ['Eiszähne', 'Sturmklauen', 'Frostwölfe', 'Aschefelle', 'Nachtheuler'],
      names: ['Torvald', 'Harald', 'Sven', 'Egil', 'Hakon', 'Leif', 'Orm', 'Ragnvald'] },
    { id: 'da', name: 'Dark Angels', ship: 'Unerbittliche Wacht',
      colors: { c1: '#1f4a2c', c2: '#d9ceae', on: '#f3eee0', glow: '#7ee89a' },
      bonus: 'Archäotech aus Einsätzen +50 %', quirk: 'Jagd auf die Gefallenen', flaw: 'Ansehen wächst 25 % langsamer',
      effects: { 'loot.archeotech': 0.5, 'standing.bonus': -0.25 }, boost: ['loot.archeotech'],
      successors: ['Angels of Absolution', 'Angels of Redemption', 'Angels of Vengeance', 'Consecrators', 'Disciples of Caliban'],
      names: ['Zadkiel', 'Anaziel', 'Gideon', 'Tharion', 'Sariel', 'Balthus', 'Caedus', 'Raziel'] },
    { id: 'sal', name: 'Salamanders', ship: 'Feuerschmied',
      colors: { c1: '#2e7a32', c2: '#e8742c', on: '#ffffff', glow: '#a4f07a' },
      bonus: 'Schmiede-Ausbeute +25 %', quirk: 'Beschützer: Moral +15 %, Knechte fliehen halb so schnell',
      flaw: 'Gensaat reift 25 % langsamer', effects: { 'moral.bonus': 0.15, 'flee.slow': 1, 'geneseed.bonus': -0.25, 'craft.bonus': 0.25 },
      boost: ['craft.bonus'], successors: ['Feuerdrachen', 'Aschewächter', 'Glutschmiede', 'Vulkansöhne', 'Schlackenbrüder'],
      names: ["Ra'stan", "Heka'tan", "Ul'tar", "Kor'gan", "Xa'var", "Tor'vek", "Na'kar", "Bar'ek"] },
    { id: 'ws', name: 'White Scars', ship: 'Sturmreiter',
      colors: { c1: '#ebe6da', c2: '#b3261e', on: '#231f1a', glow: '#f4f1ea' },
      bonus: 'Einsätze 30 % kürzer', quirk: 'Einsatzbefehle von Anfang an', flaw: 'Festungsbauten 15 % teurer',
      effects: { 'price.building': 0.15, 'mission.speed': 0.3, 'mission.repeat': 1 }, boost: ['mission.speed'],
      successors: ['Storm Lords', 'Steppenreiter', 'Khans Klingen', 'Donnerreiter', 'Windjäger'],
      names: ['Temujin', 'Batu', 'Hasik', 'Jubal', 'Qasar', 'Otgon', 'Arik', 'Tamu'] },
  ],
};

if (typeof module !== 'undefined') module.exports = DATA;
