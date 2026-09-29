# Gensaat Etappe 1 (Kern) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein spielbares Gensaat mit Ordenswahl, Klicks, fünf Gebäuden, Knechten mit drei Jobs, Hunger und Moral, vier Lehren, imperialem Datum mit Planetenzeiten, Speichern/Export/Import/Offline und dem Look „Kathedrale“ für PC und Handy.

**Architecture:** Bauweise wie Fledermauskolonie: `js/data.js` hält alle Inhalte als Tabellen, `js/engine.js` die Spiellogik ohne DOM (läuft im Browser und in Node), `js/ui.js` Anzeige, Eingaben, Speichern und die 200-ms-Schleife. `test.js` prüft die Engine mit `assert` und enthält den Tempo-Bot.

**Tech Stack:** Vanilla JS (ES2022), HTML, CSS, Node für Tests, Python-`http.server` als lokaler Server. Kein Framework, kein Build.

Spec: `docs/superpowers/specs/2026-09-29-gensaat-design.md` (Abschnitte Ziel, Prämisse, Look und Bedienung, Zeit, Orden, Bevölkerung/Knechte, Ressourcen, Festung, Jobs, Librarium, Technik, Tests und Tempo, Etappe 1).

## Global Constraints

- Ordner `C:\Users\t.fritzen\gensaat`. Fledermauskolonie (`C:\Users\t.fritzen\fledermauskolonie`) bleibt unberührt.
- Vanilla JS ohne Framework und ohne Build. `data.js` nur Inhalte, `engine.js` ohne DOM, beide hängen sich im Browser an `window` und exportieren in Node über `module.exports`.
- Texte deutsch, Anrede „du“. Log-Zeilen höchstens 100 Zeichen, Beschreibungen unter 90.
- Nichts springt: Knöpfe bleiben stehen und werden grau, Neues kommt ans Ende. Berührflächen mindestens 44 px hoch.
- Zahlen deutsch: `1.234` · `12,3 Tsd.` · `1,23 Mio.` · `4,5 Mrd.`
- Look „Kathedrale“, nur dunkel. Farben: Stein `#18130f`→`#0d0a08`, Knochen `#e8dcc4`, Knochen gedämpft `#b3a58a`, Gold `#d9a94e`, Gold hell `#f3d38c`, Linien `#3b322a`, fehlt `#ec8466`, Rate `#b9cb8f`. Ordensfarben als `--c1`, `--c2`, `--c-on`, `--c-glow`.
- Schriften „Grenze Gotisch“ (Überschriften, Knöpfe) und „Alegreya“ (Text) über Google Fonts, Fallback Georgia/serif.
- localStorage-Schlüssel `gensaat`, Sicherungen `gensaat-vorher` und `gensaat-kaputt`. Speichern alle 30 s, bei `visibilitychange` und `pagehide`.
- Offline höchstens 3 Tage (`offlineMax = 3 * 86400`).
- Lokaler Server: `python serve.py 8934`, `launch.json`-Eintrag „gensaat“.
- Kein Git: Der Nutzer hat im Projekt keins angelegt und nicht darum gebeten. Checkpoint nach jeder Aufgabe ist `node test.js` mit „alle … ok“.

## Dateien

| Datei | Verantwortung |
|---|---|
| `serve.py` | Lokaler Server ohne Cache |
| `js/data.js` | Regeln, Ressourcen, Klicks, Gebäude, Jobs, Lehren, Orden |
| `js/engine.js` | Spielstand, Datum, Effekte, Produktion, Hunger, Zuzug, Aktionen, Speichern, Offline |
| `js/ui.js` | Ordenswahl, Zeichnen, Karten, Info, Tooltip, Menü, Abwesenheit, Schleife |
| `index.html` | Gerüst, SVG-Symbole, Dialoge |
| `style.css` | Look „Kathedrale“, Handy eine Spalte, PC drei Spalten |
| `test.js` | Prüfungen und Tempo-Bot |
| `C:\Users\t.fritzen\Downloads\.claude\launch.json` | Eintrag „gensaat“ (Datei existiert schon) |

---

### Task 1: Gerüst, Inhalte, Daten-Prüfung

**Files:**
- Create: `C:\Users\t.fritzen\gensaat\serve.py`
- Create: `C:\Users\t.fritzen\gensaat\js\data.js`
- Create: `C:\Users\t.fritzen\gensaat\test.js`
- Modify: `C:\Users\t.fritzen\Downloads\.claude\launch.json` (Eintrag anhängen)

**Interfaces:**
- Produces: global `DATA` mit `rules`, `resources`, `clicks`, `buildings`, `jobs`, `techs`, `chapters`. Effekt-Schlüssel: `'<res>.rate'`, `'<res>.cap'`, `'<res>.bonus'`, `'job.<jobId>'`, `'serfs.cap'`, `'cap.bonus'`, `'arrival.bonus'`, `'moral.bonus'`, `'flee.slow'`, `'price.building'`. `requires`: `tech` (Id oder Liste), `building` (mind. eins gebaut), `seen` (Merker in `s.seen`). Jobs mit `farm: true` werden von Hunger nicht gebremst.
- Produces: `test.js` mit `test(name, fn)`, `near(a, b, what)`, `byId(list, id)`, `fresh(ch = 'da')`, `run()`.

- [ ] **Step 1: serve.py anlegen**

```python
"""Lokaler Testserver ohne Cache, damit nach jeder Änderung die neue Version lädt: python serve.py 8934"""
import functools
import http.server
import os
import sys


class NoStore(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8934
handler = functools.partial(NoStore, directory=os.path.dirname(os.path.abspath(__file__)))
http.server.ThreadingHTTPServer(('127.0.0.1', port), handler).serve_forever()
```

- [ ] **Step 2: launch.json-Eintrag anhängen**

In `C:\Users\t.fritzen\Downloads\.claude\launch.json` nach dem Eintrag „fledermauskolonie“ einfügen (Komma nicht vergessen):

```json
    {
      "name": "gensaat",
      "runtimeExecutable": "python",
      "runtimeArgs": ["C:/Users/t.fritzen/gensaat/serve.py", "8934"],
      "port": 8934
    }
```

- [ ] **Step 3: Daten-Prüfung schreiben (test.js)**

```js
// node test.js        Prüfungen der Spiellogik
// node test.js tempo  Tempo-Bot: wann fallen die Meilensteine?
const assert = require('assert');
const D = require('./js/data.js');

const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const near = (a, b, what) => assert.ok(Math.abs(a - b) < 1e-6, `${what}: ${a} statt ${b}`);
const byId = (list, id) => list.find(x => x.id === id);

test('Daten: jede verwiesene Id existiert', () => {
  const ids = list => {
    const set = new Set(list.map(x => x.id));
    assert.strictEqual(set.size, list.length, 'doppelte Id');
    return set;
  };
  const res = ids(D.resources), bld = ids(D.buildings), jobs = ids(D.jobs), tech = ids(D.techs);
  ids(D.chapters);
  ids(D.clicks);
  const FREE = new Set(['serfs.cap', 'cap.bonus', 'arrival.bonus', 'moral.bonus', 'flee.slow', 'price.building']);
  const checkEffects = (fx, where) => {
    for (const k in fx) {
      const [a, b] = k.split('.');
      const known = FREE.has(k) || (a === 'job' && jobs.has(b)) || (res.has(a) && ['rate', 'cap', 'bonus'].includes(b));
      assert.ok(known, `${where}: unbekannter Effekt ${k}`);
    }
  };
  for (const x of [...D.buildings, ...D.techs]) for (const r in x.cost) assert.ok(res.has(r), `${x.id}: Kosten ${r}`);
  for (const x of [...D.buildings, ...D.jobs, ...D.techs, ...D.chapters]) checkEffects(x.effects || {}, x.id);
  for (const x of [...D.resources, ...D.buildings, ...D.jobs, ...D.techs]) {
    for (const t of [].concat(x.requires?.tech || [])) assert.ok(tech.has(t), `${x.id}: Lehre ${t}`);
    for (const b of [].concat(x.requires?.building || [])) assert.ok(bld.has(b), `${x.id}: Gebäude ${b}`);
  }
  for (const c of D.clicks) assert.ok(res.has(c.id), `Klick ${c.id}`);
  for (const season of D.rules.seasons) for (const r in season.mult) assert.ok(res.has(r), `${season.name}: ${r}`);
  for (const ch of D.chapters) {
    assert.ok(Object.values(ch.colors).every(c => /^#[0-9a-f]{6}$/.test(c)), `${ch.id}: Farben`);
    assert.ok(ch.names.length >= 6, `${ch.id}: Namen`);
  }
  for (const x of [...D.buildings, ...D.techs]) assert.ok(x.desc.length < 90, `${x.id}: Beschreibung zu lang`);
});

function run() {
  let failed = 0;
  for (const [name, fn] of tests) {
    try { fn(); console.log('ok      ' + name); }
    catch (err) { failed++; console.log('FEHLER  ' + name + '\n        ' + err.message); }
  }
  console.log(failed ? `${failed} von ${tests.length} fehlgeschlagen` : `alle ${tests.length} ok`);
  process.exitCode = failed ? 1 : 0;
}

run();
```

- [ ] **Step 4: Test laufen lassen, er muss scheitern**

Run: `cd C:\Users\t.fritzen\gensaat && node test.js`
Expected: Abbruch mit `Cannot find module './js/data.js'`

- [ ] **Step 5: js/data.js schreiben**

```js
// Gensaat – alle Inhalte als Tabellen.
// Zahlen sind Startwerte aus der Spec; der Tempo-Bot (node test.js tempo) prüft das Tempo.
const DATA = {
  rules: {
    saveVersion: 1,
    yearLength: 1000,       // Sekunden je imperiales Jahr (Datum 0.FFF.JJJ.M42)
    seasonLength: 250,      // Sekunden je Planetenzeit
    startYear: 12,          // 012.M42
    seasons: [
      { name: 'Sonnenzeit', mult: { supplies: 1.5 } },
      { name: 'Sturmzeit', mult: { scrap: 1.25 } },
      { name: 'Aschezeit', mult: { supplies: 0.75 } },
      { name: 'Frostzeit', mult: { supplies: 0.25 }, noArrival: true },
    ],
    serfFood: 0.3,          // Vorräte/s je Knecht
    arrivalEvery: 20,       // Sekunden je Zuzug
    fleeAfter: 30,          // hungrige Sekunden, bis ein Knecht flieht
    hungerPenalty: 0.3,
    crowdFree: 20,
    crowdPenalty: 0.01,     // je Knecht über crowdFree
    moralMin: 0.25,
    offlineMax: 3 * 86400,
    logMax: 100,
    honorsMax: 500,
  },

  resources: [
    { id: 'supplies', name: 'Vorräte', one: 'Vorrat', cap: 200, icon: 'i-supplies' },
    { id: 'scrap', name: 'Schrott', one: 'Schrott', cap: 150, icon: 'i-scrap' },
    { id: 'knowledge', name: 'Wissen', one: 'Wissen', cap: 100, icon: 'i-knowledge', requires: { building: 'scriptorium' } },
  ],

  clicks: [
    { id: 'scrap', name: 'Trümmer durchsuchen' },
    { id: 'supplies', name: 'Vorräte bergen' },
  ],

  // effects: '<res>.rate' = Ertrag/s, '<res>.cap' = Lager, '<res>.bonus' = Anteil obendrauf,
  // 'job.<jobId>' = Anteil obendrauf für einen Job, 'serfs.cap' = Knechte-Plätze.
  // requires: tech (Id oder Liste), building (mindestens eins gebaut), seen (Merker in s.seen).
  buildings: [
    { id: 'hydroFarm', name: 'Hydrokulturfarm', desc: 'Nährtanks im Schutt. In der Sonnenzeit wächst es am besten.',
      cost: { scrap: 10 }, ratio: 1.12, effects: { 'supplies.rate': 0.5 } },
    { id: 'quarters', name: 'Knechtsquartier', desc: 'Ein abgedichteter Raum im Wrack. Platz für zwei Knechte.',
      cost: { scrap: 12 }, ratio: 1.6, effects: { 'serfs.cap': 2 } },
    { id: 'scriptorium', name: 'Skriptorium', desc: 'Pulte, Kerzen, geborgene Datenkristalle. Schreiber sammeln Wissen.',
      cost: { scrap: 25, supplies: 10 }, ratio: 1.3, effects: { 'knowledge.cap': 50, 'knowledge.bonus': 0.05 },
      requires: { seen: 'serfs' } },
    { id: 'storehouse', name: 'Speicher', desc: 'Versiegelte Kammern gegen Asche und Ungeziefer.',
      cost: { scrap: 40 }, ratio: 1.3, effects: { 'supplies.cap': 150, 'scrap.cap': 100 }, requires: { tech: 'storage' } },
    { id: 'salvageYard', name: 'Bergungsplatz', desc: 'Kräne und Schneidbrenner. Schrottsammler arbeiten schneller.',
      cost: { scrap: 50 }, ratio: 1.2, effects: { 'job.scrapper': 0.2, 'scrap.cap': 60 }, requires: { tech: 'salvage' } },
  ],

  // farm: Hunger bremst diesen Job nicht (sonst Teufelskreis).
  jobs: [
    { id: 'scrapper', name: 'Schrottsammler', effects: { 'scrap.rate': 0.3 } },
    { id: 'farmer', name: 'Bauer', farm: true, effects: { 'supplies.rate': 1 }, requires: { tech: 'hydroponics' } },
    { id: 'scribe', name: 'Schreiber', effects: { 'knowledge.rate': 0.2 }, requires: { building: 'scriptorium' } },
  ],

  techs: [
    { id: 'calendar', name: 'Imperialer Kalender', desc: 'Terranisches Datum und die Zeiten von Kharos Tertius.',
      cost: { knowledge: 15 }, unlockText: 'Datum und Planetenzeiten' },
    { id: 'hydroponics', name: 'Hydroponik', desc: 'Nährtanks richtig pflegen. Knechte können als Bauern arbeiten.',
      cost: { knowledge: 30 } },
    { id: 'storage', name: 'Lagerhaltung', desc: 'Vorräte ordnen, zählen und vor Asche schützen.',
      cost: { knowledge: 50 }, requires: { tech: 'calendar' } },
    { id: 'salvage', name: 'Bergung', desc: 'Das Wrack planvoll zerlegen statt es zu durchwühlen.',
      cost: { knowledge: 70 }, requires: { tech: 'hydroponics' } },
  ],

  // effects wirken, sobald ihr System existiert; bonus/quirk/flaw sind die Texte der Ordenswahl.
  chapters: [
    { id: 'um', name: 'Ultramarines', ship: 'Ehre von Macragge',
      colors: { c1: '#1f4494', c2: '#d8b24a', on: '#ffffff', glow: '#79b8ff' },
      bonus: 'Lager +20 %, Knechte kommen 10 % schneller', quirk: 'Kodex: volle Kompanien zählen doppelt',
      flaw: 'keiner, der Einsteiger-Orden', effects: { 'cap.bonus': 0.2, 'arrival.bonus': 0.1 },
      names: ['Cassian', 'Varro', 'Aethon', 'Lucan', 'Severus', 'Tiberon', 'Maxim', 'Cato'] },
    { id: 'ba', name: 'Blood Angels', ship: 'Blutkelch',
      colors: { c1: '#a11d1d', c2: '#d8b24a', on: '#ffffff', glow: '#ff7a6b' },
      bonus: 'Kampfkraft +20 %', quirk: 'Roter Durst und Schwarzer Zorn', flaw: 'der Durst selbst', effects: {},
      names: ['Raphael', 'Lucien', 'Erasmus', 'Lorenzo', 'Leonato', 'Sevrin', 'Amadeo', 'Donatus'] },
    { id: 'sw', name: 'Space Wolves', ship: 'Fenrisklaue',
      colors: { c1: '#6e8298', c2: '#e0b93b', on: '#ffffff', glow: '#b5d6ff' },
      bonus: 'Einsatz-Beute +25 %', quirk: 'Runenpriester statt Scriptoren, Neustart als „Neue Große Kompanie“',
      flaw: 'Wulfen-Fluch: Implantation −10 % Erfolg', effects: {},
      names: ['Torvald', 'Harald', 'Sven', 'Egil', 'Hakon', 'Leif', 'Orm', 'Ragnvald'] },
    { id: 'da', name: 'Dark Angels', ship: 'Unerbittliche Wacht',
      colors: { c1: '#1f4a2c', c2: '#d9ceae', on: '#f3eee0', glow: '#7ee89a' },
      bonus: 'Archäotech aus Einsätzen +50 %', quirk: 'Jagd auf die Gefallenen', flaw: 'Ansehen wächst 25 % langsamer',
      effects: {}, names: ['Zadkiel', 'Anaziel', 'Gideon', 'Tharion', 'Sariel', 'Balthus', 'Caedus', 'Raziel'] },
    { id: 'sal', name: 'Salamanders', ship: 'Feuerschmied',
      colors: { c1: '#2e7a32', c2: '#e8742c', on: '#ffffff', glow: '#a4f07a' },
      bonus: 'Schmiede-Ausbeute +25 %', quirk: 'Beschützer: Moral +15 %, Knechte fliehen halb so schnell',
      flaw: 'Gensaat reift 25 % langsamer', effects: { 'moral.bonus': 0.15, 'flee.slow': 1 },
      names: ["Ra'stan", "Heka'tan", "Ul'tar", "Kor'gan", "Xa'var", "Tor'vek", "Na'kar", "Bar'ek"] },
    { id: 'ws', name: 'White Scars', ship: 'Sturmreiter',
      colors: { c1: '#ebe6da', c2: '#b3261e', on: '#231f1a', glow: '#f4f1ea' },
      bonus: 'Einsätze 30 % kürzer', quirk: 'Einsatzbefehle von Anfang an', flaw: 'Festungsbauten 15 % teurer',
      effects: { 'price.building': 0.15 },
      names: ['Temujin', 'Batu', 'Hasik', 'Jubal', 'Qasar', 'Otgon', 'Arik', 'Tamu'] },
  ],
};

if (typeof module !== 'undefined') module.exports = DATA;
```

- [ ] **Step 6: Test laufen lassen**

Run: `cd C:\Users\t.fritzen\gensaat && node test.js`
Expected: `ok      Daten: jede verwiesene Id existiert` und `alle 1 ok`

---

### Task 2: Engine-Grundlagen – Spielstand, Datum, Effekte, Preise, Aktionen

**Files:**
- Create: `C:\Users\t.fritzen\gensaat\js\engine.js`
- Modify: `C:\Users\t.fritzen\gensaat\test.js` (Engine laden, Tests vor `function run()` einfügen)

**Interfaces:**
- Consumes: `DATA` aus Task 1.
- Produces (global `Engine` bzw. `module.exports`):
  - `create(chapterId, meta = null) → s` (wirft bei unbekanntem Orden). `s = { v, time, savedAt, chapter, res, bld, jobs, tech, seen, serfs, arrival, hungry, isHungry, log, logSeq, meta: { honors } }`
  - `log(s, text)` hängt `{ id, date, text }` an `s.log` (höchstens `logMax`)
  - `honor(s, text)` hängt `{ date, chapter, text }` an `s.meta.honors`
  - `calendar(s) → { year, season (0–3), seasonName, seasonLeft, date: '0.FFF.JJJ.M42' }`
  - `effects(s) → { key: summe }` (Orden, Gebäude, Lehren; zwischengespeichert in `s._eff`)
  - `cap(s, id)`, `serfCap(s)`, `free(s)`, `needs(item) → [techIds]`, `isUnlocked(s, item)`
  - `price(s, 'building' | 'tech', id) → cost`, `canAfford(s, cost)`
  - Aktionen `click(s, id)`, `build(s, id)`, `research(s, id)`, `assign(s, id, ±1)` → `true | false`

- [ ] **Step 1: Tests schreiben**

In `test.js` direkt unter `const D = require('./js/data.js');` einfügen:

```js
const E = require('./js/engine.js');
```

Unter `const byId = …` einfügen:

```js
// Dark Angels haben in Etappe 1 keine wirksamen Ordenswerte: neutraler Stand für die meisten Tests.
const fresh = (ch = 'da') => E.create(ch);
```

Vor `function run()` einfügen:

```js
test('Neuer Stand: Orden, Start-Log, unbekannter Orden', () => {
  const s = fresh('um');
  assert.deepStrictEqual([s.chapter, s.serfs, s.res.scrap, s.bld.quarters], ['um', 0, 0, 0]);
  assert.match(s.log[0].text, /„Ehre von Macragge“ ist über Kharos Tertius zerschellt/);
  assert.match(s.log[1].text, /Sus-an-Koma/);
  assert.strictEqual(s.log[0].date, '0.000.012.M42');
  assert.throws(() => E.create('orks'));
  assert.throws(() => E.create('constructor'));
  const kept = E.create('ba', { honors: [{ date: 'd', chapter: 'c', text: 't' }] });
  assert.strictEqual(kept.meta.honors.length, 1);
});

test('Datum und Planetenzeit aus der Spielzeit', () => {
  const s = fresh();
  let c = E.calendar(s);
  assert.deepStrictEqual([c.date, c.seasonName, c.seasonLeft], ['0.000.012.M42', 'Sonnenzeit', 250]);
  s.time = 118.7;
  assert.strictEqual(E.calendar(s).date, '0.118.012.M42');
  s.time = 250;
  assert.strictEqual(E.calendar(s).seasonName, 'Sturmzeit');
  s.time = 999.5;
  c = E.calendar(s);
  assert.deepStrictEqual([c.date, c.seasonName], ['0.999.012.M42', 'Frostzeit']);
  s.time = 1000;
  c = E.calendar(s);
  assert.deepStrictEqual([c.date, c.seasonName, c.year], ['0.000.013.M42', 'Sonnenzeit', 13]);
});

test('Preise steigen mit dem Faktor, White Scars zahlen 15 % mehr', () => {
  const s = fresh();
  s.res.scrap = 60;
  assert.ok(E.build(s, 'quarters'));
  assert.ok(E.build(s, 'quarters'));
  near(s.res.scrap, 60 - 12 - 19.2, 'bezahlt (12 + 19,2)');
  near(E.price(s, 'building', 'quarters').scrap, 30.72, 'drittes Quartier');
  assert.strictEqual(E.serfCap(s), 4);
  s.res.scrap = 60;
  assert.strictEqual(E.build(s, 'storehouse'), false);   // bezahlbar, aber noch nicht erforscht
  const ws = fresh('ws');
  near(E.price(ws, 'building', 'hydroFarm').scrap, 11.5, 'White Scars: 10 × 1,15');
  near(E.price(ws, 'tech', 'calendar').knowledge, 15, 'Lehren kosten gleich');
});

test('Ultramarines: Lager +20 %', () => {
  near(E.cap(fresh('um'), 'scrap'), 180, 'Schrott-Lager 150 × 1,2');
  near(E.cap(fresh(), 'scrap'), 150, 'ohne Bonus');
});

test('Klicks: +1, nicht über das Lager, nur Klick-Rohstoffe', () => {
  const s = fresh();
  assert.ok(E.click(s, 'scrap'));
  assert.strictEqual(s.res.scrap, 1);
  s.res.supplies = 200;
  assert.strictEqual(E.click(s, 'supplies'), false);
  assert.strictEqual(E.click(s, 'knowledge'), false);
});

test('Lehren kosten Wissen und schalten frei; die erste kommt in den Liber Honoris', () => {
  const s = fresh();
  assert.strictEqual(E.isUnlocked(s, byId(D.techs, 'storage')), false);
  s.res.knowledge = 10;
  assert.strictEqual(E.research(s, 'calendar'), false);   // zu wenig Wissen
  s.res.knowledge = 100;
  assert.strictEqual(E.research(s, 'storage'), false);    // Kalender fehlt
  assert.ok(E.research(s, 'calendar'));
  near(s.res.knowledge, 85, 'Wissen nach Kalender');
  assert.ok(E.research(s, 'storage'));
  assert.strictEqual(E.research(s, 'storage'), false);    // schon erforscht
  assert.ok(E.isUnlocked(s, byId(D.buildings, 'storehouse')));
  assert.strictEqual(E.isUnlocked(s, byId(D.jobs, 'farmer')), false);
  assert.match(s.log.at(-1).text, /Erforscht: Lagerhaltung/);
  assert.deepStrictEqual(s.meta.honors.map(h => h.text), ['Erste Lehre im Librarium: Imperialer Kalender.']);
  assert.strictEqual(s.meta.honors[0].chapter, 'Dark Angels');
});

test('Freischaltung über Merker und Gebäude', () => {
  const s = fresh();
  const scr = byId(D.buildings, 'scriptorium');
  assert.strictEqual(E.isUnlocked(s, scr), false);
  s.seen.serfs = true;
  assert.ok(E.isUnlocked(s, scr));
  assert.strictEqual(E.isUnlocked(s, byId(D.jobs, 'scribe')), false);
  assert.strictEqual(E.isUnlocked(s, byId(D.resources, 'knowledge')), false);
  s.res.scrap = 25; s.res.supplies = 10;
  assert.ok(E.build(s, 'scriptorium'));
  assert.ok(E.isUnlocked(s, byId(D.jobs, 'scribe')));
  assert.ok(E.isUnlocked(s, byId(D.resources, 'knowledge')));
  near(E.cap(s, 'knowledge'), 150, 'Wissen-Lager 100 + 50');
});

test('Jobs verteilen', () => {
  const s = fresh();
  s.serfs = 2;
  assert.strictEqual(E.assign(s, 'farmer', 1), false);        // frei, aber noch nicht erforscht
  assert.ok(E.assign(s, 'scrapper', 1));
  assert.ok(E.assign(s, 'scrapper', 1));
  assert.strictEqual(E.assign(s, 'scrapper', 1), false);      // keine frei
  assert.ok(E.assign(s, 'scrapper', -1));
  assert.strictEqual(E.free(s), 1);
  assert.strictEqual(E.assign(s, 'scrapper', 0), false);      // nur +1 oder -1
  s.tech.hydroponics = true;
  assert.strictEqual(E.assign(s, 'farmer', -1), false);       // niemand zum Abziehen
  assert.ok(E.assign(s, 'farmer', 1));
  assert.strictEqual(E.free(s), 0);
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `cd C:\Users\t.fritzen\gensaat && node test.js`
Expected: Abbruch mit `Cannot find module './js/engine.js'`

- [ ] **Step 3: js/engine.js schreiben**

```js
// Gensaat – Spiellogik ohne DOM. Im Browser global `Engine`, in Node per require().
const Engine = (() => {
  const D = typeof DATA !== 'undefined' ? DATA : require('./data.js');
  const R = D.rules;
  const byId = list => Object.assign(Object.create(null), Object.fromEntries(list.map(x => [x.id, x])));
  const RES = byId(D.resources), BLD = byId(D.buildings), JOB = byId(D.jobs), TECH = byId(D.techs), CH = byId(D.chapters);
  const CLICKS = new Set(D.clicks.map(c => c.id));
  const pad3 = n => String(n).padStart(3, '0');

  // ---------- Spielstand ----------

  // meta überlebt Neustarts (ab Etappe 8 auch Vermächtnis, Relikte, Linien); in Etappe 1 nur der Liber Honoris.
  function create(chapterId, meta = null) {
    const ch = CH[chapterId];
    if (!ch) throw new Error('Unbekannter Orden');
    const s = {
      v: R.saveVersion, time: 0, savedAt: 0, chapter: ch.id,
      res: {}, bld: {}, jobs: {}, tech: {}, seen: {},
      serfs: 0, arrival: 0, hungry: 0, isHungry: false,
      log: [], logSeq: 0,
      meta: { honors: [...(meta?.honors || [])] },
    };
    for (const r of D.resources) s.res[r.id] = 0;
    for (const b of D.buildings) s.bld[b.id] = 0;
    for (const j of D.jobs) s.jobs[j.id] = 0;
    log(s, `Die „${ch.ship}“ ist über Kharos Tertius zerschellt. Du lebst.`);
    log(s, 'Fünf Brüder liegen im Sus-an-Koma. Die Ruinen schweigen.');
    return s;
  }

  function log(s, text) {
    s.log.push({ id: ++s.logSeq, date: calendar(s).date, text });
    if (s.log.length > R.logMax) s.log.splice(0, s.log.length - R.logMax);
  }

  // Meilenstein für den Liber Honoris (Reiter ab Etappe 8); bleibt über Neustarts.
  function honor(s, text) {
    s.meta.honors.push({ date: calendar(s).date, chapter: CH[s.chapter].name, text });
    if (s.meta.honors.length > R.honorsMax) s.meta.honors.splice(0, s.meta.honors.length - R.honorsMax);
  }

  // ---------- Zeit ----------

  // Imperiales Datum 0.FFF.JJJ.M42: FFF ist die Sekunde im Jahr (ein Jahr = 1.000 s), JJJ das Jahr ab 012.
  function calendar(s) {
    const n = Math.floor(s.time / R.yearLength);
    const t = s.time - n * R.yearLength;
    const season = Math.min(R.seasons.length - 1, Math.floor(t / R.seasonLength));
    return {
      year: R.startYear + n,
      season,
      seasonName: R.seasons[season].name,
      seasonLeft: (season + 1) * R.seasonLength - t,
      date: `0.${pad3(Math.floor(t))}.${pad3(R.startYear + n)}.M42`,
    };
  }

  // ---------- Werte ----------

  // Summe aller Effekte (Orden, Gebäude, Lehren); zwischengespeichert bis zur nächsten Änderung.
  // Jobs zählen nicht hierher: ihr Ertrag hängt an Moral und Job-Boni und entsteht in rates().
  function effects(s) {
    if (s._eff) return s._eff;
    const e = {};
    const add = (fx, n) => { for (const k in fx) e[k] = (e[k] || 0) + fx[k] * n; };
    add(CH[s.chapter].effects, 1);
    for (const b of D.buildings) if (s.bld[b.id]) add(b.effects, s.bld[b.id]);
    for (const t of D.techs) if (s.tech[t.id] && t.effects) add(t.effects, 1);
    return (s._eff = e);
  }
  const dirty = s => { s._eff = null; };
  const bonus = (s, key) => effects(s)[key] || 0;

  const cap = (s, id) => (RES[id].cap + bonus(s, id + '.cap')) * (1 + bonus(s, 'cap.bonus'));
  const serfCap = s => bonus(s, 'serfs.cap');
  const free = s => s.serfs - D.jobs.reduce((n, j) => n + s.jobs[j.id], 0);

  // ---------- Aktionen ----------

  const list = v => [].concat(v || []);
  const needs = item => list(item.requires?.tech);
  const isUnlocked = (s, item) => needs(item).every(t => s.tech[t])
    && list(item.requires?.building).every(b => s.bld[b] > 0)
    && list(item.requires?.seen).every(f => s.seen[f]);

  function price(s, kind, id) {
    if (kind === 'tech') return { ...TECH[id].cost };
    const b = BLD[id], mult = 1 + bonus(s, 'price.building'), out = {};
    for (const r in b.cost) out[r] = b.cost[r] * b.ratio ** s.bld[id] * mult;
    return out;
  }
  const canAfford = (s, cost) => Object.keys(cost).every(r => s.res[r] >= cost[r] - 1e-9);
  function pay(s, cost) { for (const r in cost) s.res[r] = Math.max(0, s.res[r] - cost[r]); }

  function click(s, id) {
    if (!CLICKS.has(id) || s.res[id] >= cap(s, id)) return false;
    s.res[id] = Math.min(cap(s, id), s.res[id] + 1);
    s.seen[id] = true;
    return true;
  }

  function build(s, id) {
    const b = BLD[id];
    if (!b || !isUnlocked(s, b)) return false;
    const cost = price(s, 'building', id);
    if (!canAfford(s, cost)) return false;
    pay(s, cost);
    s.bld[id]++;
    dirty(s);
    return true;
  }

  function research(s, id) {
    const t = TECH[id];
    if (!t || s.tech[id] || !isUnlocked(s, t) || !canAfford(s, t.cost)) return false;
    pay(s, t.cost);
    const first = !Object.keys(s.tech).length;
    s.tech[id] = true;
    dirty(s);
    log(s, `Erforscht: ${t.name}.`);
    if (first) honor(s, `Erste Lehre im Librarium: ${t.name}.`);
    return true;
  }

  function assign(s, id, delta) {
    const j = JOB[id];
    if (!j || !isUnlocked(s, j) || (delta !== 1 && delta !== -1)) return false;
    if (delta > 0 ? free(s) < 1 : s.jobs[id] < 1) return false;
    s.jobs[id] += delta;
    return true;
  }

  return {
    create, log, honor, calendar, effects, cap, serfCap, free,
    needs, isUnlocked, price, canAfford, click, build, research, assign,
  };
})();

if (typeof module !== 'undefined') module.exports = Engine;
```

- [ ] **Step 4: Tests laufen lassen**

Run: `cd C:\Users\t.fritzen\gensaat && node test.js`
Expected: `alle 9 ok`

---

### Task 3: Produktion, Moral, Hunger, Zuzug, Zeit bis bezahlbar

**Files:**
- Modify: `C:\Users\t.fritzen\gensaat\js\engine.js` (neuer Abschnitt vor `// ---------- Aktionen ----------`, `eta` nach `pay`, Rückgabe erweitern)
- Modify: `C:\Users\t.fritzen\gensaat\test.js` (Tests vor `function run()`)

**Interfaces:**
- Consumes: alles aus Task 2.
- Produces: `moral(s, withHunger = true)`, `rates(s) → { resId: proSekunde }` (Essen abgezogen), `arrivalBlock(s) → 'full' | 'hungry' | 'frost' | 'food' | null`, `step(s, dt)`, `eta(s, cost) → Sekunden | Infinity`.

- [ ] **Step 1: Tests schreiben**

Vor `function run()` einfügen:

```js
test('Produktion: Gebäude, Jobs, Essen, Planetenzeiten', () => {
  const s = fresh();
  s.bld.hydroFarm = 2; s.serfs = 2; s.jobs.scrapper = 1; s.res.supplies = 50;
  near(E.rates(s).supplies, 0.9, 'Sonnenzeit: 2 × 0,5 × 1,5 − 2 × 0,3');
  near(E.rates(s).scrap, 0.3, 'Schrott');
  E.step(s, 10);
  near(s.res.supplies, 59, 'Vorräte nach 10 s');
  near(s.res.scrap, 3, 'Schrott nach 10 s');
  s.time = 250;
  near(E.rates(s).scrap, 0.375, 'Sturmzeit: Schrott × 1,25');
  near(E.rates(s).supplies, 0.4, 'Sturmzeit: Vorräte × 1');
  s.time = 750;
  near(E.rates(s).supplies, 2 * 0.5 * 0.25 - 0.6, 'Frostzeit: Vorräte × 0,25');
});

test('Lager deckelt, Klick am Limit geht nicht', () => {
  const s = fresh();
  s.res.scrap = 149.5; s.res.supplies = 100; s.serfs = 1; s.jobs.scrapper = 1;
  E.step(s, 10);
  near(s.res.scrap, 150, 'Schrott am Limit');
  near(s.res.supplies, 97, 'ein Knecht isst 0,3/s');
  assert.strictEqual(E.click(s, 'scrap'), false);
  assert.ok(E.click(s, 'supplies'));
  near(s.res.supplies, 98, 'Vorrat geborgen');
});

test('Schreiber mit Skriptorium, Bauer in der Sonnenzeit', () => {
  const s = fresh();
  s.seen.serfs = true; s.tech.hydroponics = true; s.serfs = 2; s.res.scrap = 25; s.res.supplies = 50;
  assert.ok(E.build(s, 'scriptorium'));
  assert.ok(E.assign(s, 'scribe', 1));
  near(E.rates(s).knowledge, 0.2 * 1.05, 'Schreiber +5 % durch das Skriptorium');
  const before = E.rates(s).supplies;
  assert.ok(E.assign(s, 'farmer', 1));
  near(E.rates(s).supplies - before, 1.5, 'Bauer wirkt sofort (× 1,5)');
});

test('Zuzug: der erste kommt immer, weitere nur mit genug Vorräten', () => {
  const s = fresh();
  s.bld.quarters = 2; s.res.supplies = 100;
  E.step(s, 20);
  assert.strictEqual(s.serfs, 1);                            // der erste auch ohne Farm
  assert.match(s.log.at(-1).text, /Überlebender/);
  assert.strictEqual(s.meta.honors.at(-1).text, 'Der erste Knecht schließt sich dem Orden an.');
  E.step(s, 40);
  assert.strictEqual(s.serfs, 1);                            // ohne Überschuss kein zweiter
  assert.strictEqual(E.arrivalBlock(s), 'food');
  s.res.scrap = 30;
  assert.ok(E.build(s, 'hydroFarm'));                        // 0,75/s, einer isst 0,3
  assert.strictEqual(E.arrivalBlock(s), null);
  E.step(s, 20);
  assert.strictEqual(s.serfs, 2);
  assert.match(s.log.at(-1).text, /schließt sich dem Orden an/);
  E.step(s, 60);
  assert.strictEqual(s.serfs, 2);                            // 0,75 − 0,6 reicht nicht für einen dritten
});

test('Zuzug: in der Frostzeit kommt niemand', () => {
  const s = fresh();
  s.bld.quarters = 2; s.bld.hydroFarm = 10; s.res.supplies = 100;
  s.time = 750;
  assert.strictEqual(E.arrivalBlock(s), 'frost');
  E.step(s, 240);
  assert.strictEqual(s.serfs, 0);
  E.step(s, 30);                                             // ab 1.000 wieder Sonnenzeit
  assert.strictEqual(s.serfs, 1);
});

test('Ultramarines: Knechte kommen 10 % schneller', () => {
  const um = fresh('um');
  um.bld.quarters = 2; um.res.supplies = 100;
  E.step(um, 18.2);
  assert.strictEqual(um.serfs, 1);                           // 20 s ÷ 1,1 ≈ 18,18 s
  const da = fresh();
  da.bld.quarters = 2; da.res.supplies = 100;
  E.step(da, 18.2);
  assert.strictEqual(da.serfs, 0);
});

test('Hunger: Moral −30 % (nicht für Bauern), nach 30 s flieht einer', () => {
  const s = fresh();
  s.tech.hydroponics = true; s.bld.quarters = 1; s.serfs = 2; s.jobs.scrapper = 1; s.jobs.farmer = 1;
  s.time = 750;                                              // Frostzeit: Bauer 0,25/s, zwei essen 0,6
  E.step(s, 1);
  assert.strictEqual(s.isHungry, true);
  near(E.moral(s), 0.7, 'Moral hungrig');
  near(E.rates(s).scrap, 0.3 * 0.7, 'Schrottsammler gebremst');
  near(E.rates(s).supplies, 0.25 - 0.6, 'Bauer ungebremst');
  E.step(s, 29);
  assert.strictEqual(s.serfs, 1);
  assert.deepStrictEqual([s.jobs.scrapper, s.jobs.farmer], [0, 1]);   // Bauern zuletzt
  assert.match(s.log.at(-1).text, /flieht/);
});

test('Hunger: eine satte Pause setzt die Frist zurück', () => {
  const s = fresh();
  s.serfs = 2;
  E.step(s, 20);
  s.res.supplies = 20; E.step(s, 10);
  s.res.supplies = 0; E.step(s, 20);
  assert.strictEqual(s.serfs, 2);                            // nie 30 s am Stück hungrig
});

test('Salamanders: Moral +15 %, Knechte fliehen erst nach 60 s', () => {
  const s = fresh('sal');
  s.serfs = 2; s.jobs.scrapper = 2;
  near(E.moral(s), 1.15, 'Beschützer');
  E.step(s, 59);
  assert.strictEqual(s.serfs, 2);
  E.step(s, 1);
  assert.strictEqual(s.serfs, 1);
});

test('Moral: Gedränge über 20 Knechte bremst die Jobs', () => {
  const s = fresh();
  s.serfs = 30; s.jobs.scrapper = 1;
  near(E.moral(s), 0.9, 'Gedränge (30 Knechte)');
  near(E.rates(s).scrap, 0.3 * 0.9, 'Schrott × 0,9');
});

test('Zeit bis bezahlbar', () => {
  const s = fresh();
  s.bld.hydroFarm = 2;                                       // Sonnenzeit: 1,5 Vorräte/s
  assert.strictEqual(E.eta(s, { supplies: 0 }), 0);
  near(E.eta(s, { supplies: 15 }), 10, 'Sekunden bis 15 Vorräte');
  assert.strictEqual(E.eta(s, { supplies: 500 }), Infinity); // Lager zu klein
  assert.strictEqual(E.eta(s, { scrap: 5 }), Infinity);      // kein Ertrag
  const hungry = fresh();
  hungry.serfs = 2;
  assert.strictEqual(E.eta(hungry, { supplies: 10 }), Infinity);
  hungry.res.scrap = 10;
  assert.strictEqual(E.eta(hungry, { scrap: 5 }), 0);
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `cd C:\Users\t.fritzen\gensaat && node test.js`
Expected: `FEHLER  Produktion: …` mit `E.rates is not a function` (und weitere FEHLER-Zeilen), am Ende `11 von 20 fehlgeschlagen`

- [ ] **Step 3: Produktion, Moral, Hunger und Zuzug einbauen**

In `js/engine.js` direkt vor `  // ---------- Aktionen ----------` einfügen:

```js
  // Wer bei Hunger flieht (oder beim Laden gestrichen wird): erst einer ohne Job, dann andere Jobs,
  // Bauern zuletzt. Liefert die Job-Id oder null, wenn ein Knecht ohne Job gehen kann.
  function leaver(s) {
    if (free(s) >= 1) return null;
    const busy = D.jobs.filter(j => s.jobs[j.id] > 0);
    const others = busy.filter(j => !j.farm);
    return (others.length ? others : busy).reduce((a, j) => (s.jobs[j.id] > s.jobs[a.id] ? j : a)).id;
  }

  // Moral der Knechte. withHunger = false für Bauern: Hunger darf die Nahrung nicht bremsen (Teufelskreis).
  function moral(s, withHunger = true) {
    const m = 1 + bonus(s, 'moral.bonus') - R.crowdPenalty * Math.max(0, s.serfs - R.crowdFree)
      - (withHunger && s.isHungry ? R.hungerPenalty : 0);
    return Math.max(R.moralMin, m);
  }

  // Raten je Sekunde, Essen schon abgezogen.
  function rates(s) {
    const mult = R.seasons[calendar(s).season].mult, out = {};
    for (const r of D.resources) out[r.id] = 0;
    const add = (fx, n) => { for (const k in fx) if (k.endsWith('.rate')) out[k.slice(0, -5)] += fx[k] * n; };
    for (const b of D.buildings) if (s.bld[b.id]) add(b.effects, s.bld[b.id]);
    for (const j of D.jobs) {
      if (s.jobs[j.id]) add(j.effects, s.jobs[j.id] * moral(s, !j.farm) * (1 + bonus(s, 'job.' + j.id)));
    }
    for (const id in out) out[id] *= (1 + bonus(s, id + '.bonus')) * (mult[id] ?? 1);
    out.supplies -= R.serfFood * s.serfs;
    return out;
  }

  // ---------- Ablauf ----------

  // Rückt die Zeit vor: Schritte von höchstens 1 s, geteilt an den Grenzen der Planetenzeiten.
  function step(s, dt) {
    while (dt > 1e-9) {
      const part = Math.min(dt, 1, Math.max(calendar(s).seasonLeft, 1e-6));
      tick(s, part);
      dt -= part;
    }
  }

  function tick(s, dt) {
    const r = rates(s);
    for (const id in r) {
      const v = s.res[id] + r[id] * dt;
      s.res[id] = Math.min(cap(s, id), Math.max(0, v));
      if (s.res[id] > 0) s.seen[id] = true;
      if (id === 'supplies') hunger(s, v < 0 && s.serfs > 0, dt);
    }
    arrivals(s, dt);
    s.time += dt;
  }

  function hunger(s, hungry, dt) {
    if (!hungry) { s.isHungry = false; s.hungry = 0; return; }
    s.isHungry = true;
    s.hungry += dt;
    const limit = R.fleeAfter * (1 + bonus(s, 'flee.slow'));
    if (s.hungry < limit - 1e-9) return;
    s.hungry -= limit;
    const job = leaver(s);
    if (job) s.jobs[job]--;
    s.serfs--;
    log(s, 'Ein Knecht flieht in die Wüste. Die Vorräte reichten nicht.');
  }

  // Warum gerade niemand kommt: 'full', 'hungry', 'frost', 'food' oder null (es kann jemand kommen).
  // Der allererste Knecht kommt immer; danach nur, wenn der Überschuss für einen mehr reicht.
  function arrivalBlock(s) {
    if (s.serfs >= serfCap(s)) return 'full';
    if (s.isHungry) return 'hungry';
    if (R.seasons[calendar(s).season].noArrival) return 'frost';
    if ((s.serfs > 0 || s.seen.serfs) && rates(s).supplies < R.serfFood - 1e-9) return 'food';
    return null;
  }

  function arrivals(s, dt) {
    if (arrivalBlock(s)) { s.arrival = 0; return; }
    s.arrival += dt;
    const every = R.arrivalEvery / (1 + bonus(s, 'arrival.bonus'));
    if (s.arrival < every - 1e-9) return;
    s.arrival -= every;
    s.serfs++;
    if (s.seen.serfs) { log(s, 'Ein Knecht schließt sich dem Orden an.'); return; }
    log(s, 'Ein Überlebender kriecht aus den Ruinen. Er schwört dir Treue.');
    honor(s, 'Der erste Knecht schließt sich dem Orden an.');
    s.seen.serfs = true;
  }

```

Direkt nach `  function pay(s, cost) { … }` einfügen:

```js

  // Sekunden bis bezahlbar bei der jetzigen Rate. Infinity: so nie (kein Ertrag oder Lager zu klein).
  function eta(s, cost) {
    const r = rates(s);
    let worst = 0;
    for (const id in cost) {
      const missing = cost[id] - s.res[id];
      if (missing <= 1e-9) continue;
      if (cost[id] > cap(s, id) + 1e-9 || r[id] <= 0) return Infinity;
      worst = Math.max(worst, missing / r[id]);
    }
    return worst;
  }
```

Die Rückgabe ersetzen durch:

```js
  return {
    create, log, honor, calendar, effects, cap, serfCap, free, moral, rates, arrivalBlock, step,
    needs, isUnlocked, price, canAfford, eta, click, build, research, assign,
  };
```

- [ ] **Step 4: Tests laufen lassen**

Run: `cd C:\Users\t.fritzen\gensaat && node test.js`
Expected: `alle 20 ok`

---

### Task 4: Speichern, Laden, Offline, Tempo-Bot

**Files:**
- Modify: `C:\Users\t.fritzen\gensaat\js\engine.js` (`simulate` nach `arrivals`, Abschnitt Speichern vor `return`, Rückgabe erweitern)
- Modify: `C:\Users\t.fritzen\gensaat\test.js` (Tests, Tempo-Bot, Aufruf am Ende)

**Interfaces:**
- Consumes: alles aus Task 2 und 3.
- Produces: `simulate(s, seconds) → { seconds, serfs, res: { id: diff } }` (höchstens `offlineMax`), `save(s) → string` (ohne `_`-Felder), `load(json) → s` (wirft bei ungültigem Stand oder unbekanntem Orden).

- [ ] **Step 1: Tests und Tempo-Bot schreiben**

Vor `function run()` einfügen:

```js
test('Speichern und Laden', () => {
  const s = fresh('ws');
  s.res.supplies = 12.5; s.bld.hydroFarm = 3; s.serfs = 2; s.jobs.scrapper = 1; s.tech.calendar = true; s.seen.serfs = true;
  s.time = 1234.5; s.savedAt = 1790000000000; s.arrival = 7; s.hungry = 12; s.isHungry = true;
  E.honor(s, 'Test-Ehre');
  assert.strictEqual(E.save(E.load(E.save(s))), E.save(s));   // jedes Feld kommt zurück
  const old = E.load(JSON.stringify({ v: 1, chapter: 'um', res: { supplies: 5 } }));
  assert.deepStrictEqual([old.res.supplies, old.bld.quarters, old.chapter], [5, 0, 'um']);
  assert.throws(() => E.load('{"hallo":1}'));
  assert.throws(() => E.load(JSON.stringify({ v: 1, chapter: 'orks' })));
  assert.throws(() => E.load('kaputt'));
  const odd = E.load(JSON.stringify({ v: 1, chapter: 'da', serfs: 1, jobs: { scrapper: 5 }, res: { supplies: 1e9 } }));
  assert.strictEqual(E.free(odd), 0);
  assert.strictEqual(odd.res.supplies, 200);
  const huge = E.load(JSON.stringify({ v: 1, chapter: 'da', serfs: 1, jobs: { scrapper: 1e300 } }));   // darf nicht hängen
  assert.strictEqual(E.free(huge), 0);
  const long = fresh();
  for (let i = 0; i < 150; i++) E.log(long, 'Zeile ' + i);
  assert.deepStrictEqual([long.log.length, long.log[0].text], [D.rules.logMax, 'Zeile 50']);   // älteste fallen raus
  const wild = E.load(JSON.stringify({ v: 1, chapter: 'da', time: 1e300, arrival: 1e9, hungry: 1e9,
    meta: { honors: [{ date: 1, chapter: 'x', text: 'kaputt' }, { date: 'd', chapter: 'c', text: 't' }] } }));
  assert.ok(wild.time <= 1e10 && wild.arrival <= D.rules.arrivalEvery && wild.hungry <= D.rules.fleeAfter);
  assert.deepStrictEqual(wild.meta.honors, [{ date: 'd', chapter: 'c', text: 't' }]);
});

test('Laden rechnet Lager mit den geladenen Gebäuden', () => {
  const s = E.load(JSON.stringify({ v: 1, chapter: 'da', bld: { storehouse: 1 }, res: { supplies: 340 } }));
  assert.strictEqual(s.res.supplies, 340);                   // 200 + 150 Lager
});

test('Unbekannte Namen tun nichts', () => {
  const s = fresh();
  s.res.supplies = s.res.scrap = s.res.knowledge = 50; s.serfs = 1;
  const before = E.save(s);
  for (const id of ['constructor', 'toString', '__proto__', 'nope']) {
    assert.strictEqual(E.build(s, id) || E.research(s, id) || E.assign(s, id, 1) || E.click(s, id), false, id);
  }
  assert.strictEqual(E.save(s), before);
});

test('Offline: simulate wie viele step(1), höchstens 3 Tage', () => {
  const setup = () => {
    const s = fresh();
    s.bld.hydroFarm = 4; s.bld.quarters = 3; s.res.supplies = 50; s.res.scrap = 5;
    return s;
  };
  const a = setup(), b = setup();
  const sum = E.simulate(a, 3600);
  for (let i = 0; i < 3600; i++) E.step(b, 1);
  assert.strictEqual(E.save(a), E.save(b));
  assert.strictEqual(sum.seconds, 3600);
  assert.strictEqual(sum.serfs, a.serfs);
  const c = setup();
  assert.strictEqual(E.simulate(c, 10 * 86400).seconds, D.rules.offlineMax);
  assert.strictEqual(c.time, D.rules.offlineMax);
  assert.strictEqual(E.simulate(fresh(), NaN).seconds, 0);
});

test('8 Std. offline: eine gut versorgte Festung übersteht jede Frostzeit', () => {
  const s = fresh();
  s.tech.hydroponics = true; s.seen.serfs = true; s.res.supplies = 200;
  s.bld.quarters = 5; s.bld.hydroFarm = 10; s.serfs = 6; s.jobs.farmer = 4; s.jobs.scrapper = 2;
  const lines = s.logSeq;
  E.simulate(s, 8 * 3600);
  assert.deepStrictEqual([s.serfs, s.jobs.farmer, s.jobs.scrapper, s.isHungry], [10, 4, 2, false]);
  assert.ok(s.logSeq - lines <= 5, `${s.logSeq - lines} neue Log-Zeilen`);
});

// ---------- Tempo-Bot ----------

const total = cost => Object.values(cost).reduce((a, b) => a + b, 0);

// Aktives Profil: klickt 2× je Sekunde, entscheidet alle 10 s.
function bot(maxSeconds = 1800) {
  const s = E.create('da'), when = {};
  while (s.time < maxSeconds && !(when.serf && when.research)) {
    for (let i = 0; i < 2; i++) E.click(s, s.res.supplies < s.res.scrap ? 'supplies' : 'scrap');
    if (s.time % 10 === 0) think(s);
    E.step(s, 1);
    if (s.serfs > 0) when.serf ??= s.time;
    if (Object.keys(s.tech).length) when.research ??= s.time;
  }
  return when;
}

function think(s) {
  const open = D.techs.filter(t => E.isUnlocked(s, t) && !s.tech[t.id]);
  for (const t of open.sort((a, b) => total(a.cost) - total(b.cost))) E.research(s, t.id);
  while (E.free(s) > 0) {
    const short = E.rates(s).supplies < 0.5 && E.isUnlocked(s, byId(D.jobs, 'farmer'));
    const scribe = E.isUnlocked(s, byId(D.jobs, 'scribe')) && s.jobs.scribe <= s.jobs.scrapper;
    if (!E.assign(s, short ? 'farmer' : scribe ? 'scribe' : 'scrapper', 1)) break;
  }
  const food = E.rates(s).supplies < 0.5 ? ['hydroFarm'] : [];
  // Erst das Skriptorium: ohne Wissen keine Lehren. Bis es steht, spart der Bot dafür.
  const first = E.isUnlocked(s, byId(D.buildings, 'scriptorium')) && !s.bld.scriptorium ? ['scriptorium'] : null;
  const rest = first || D.buildings.filter(b => E.isUnlocked(s, b)).map(b => b.id)
    .sort((a, b) => total(E.price(s, 'building', a)) - total(E.price(s, 'building', b)));
  for (const id of [...food, ...rest]) if (E.build(s, id)) break;
}

const TEMPO = [
  ['Erster Knecht', 'serf', 120, '≈ 1 Min.'],
  ['Erste Lehre', 'research', 300, '≤ 5 Min.'],
];

test('Tempo: Meilensteine im Ziel', () => {
  const when = bot();
  for (const [name, key, max] of TEMPO) assert.ok(when[key] <= max, `${name} nach ${when[key]} s (höchstens ${max} s)`);
});

function tempo() {
  const when = bot();
  const clock = sec => (sec === undefined ? '–' : `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`);
  console.log('Meilenstein         Zeit    Ziel');
  for (const [name, key, , goal] of TEMPO) console.log(`${name.padEnd(20)}${clock(when[key]).padEnd(8)}${goal}`);
}
```

Die letzte Zeile `run();` ersetzen durch:

```js
if (process.argv[2] === 'tempo') tempo();
else run();
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `cd C:\Users\t.fritzen\gensaat && node test.js`
Expected: FEHLER-Zeilen mit `E.save is not a function` bzw. `E.load is not a function` bzw. `E.simulate is not a function`

- [ ] **Step 3: simulate, save und load einbauen**

In `js/engine.js` direkt nach der Funktion `arrivals` einfügen:

```js

  // Holt verpasste Zeit nach (höchstens offlineMax) und fasst zusammen, was sich geändert hat.
  function simulate(s, seconds) {
    const secs = Math.min(Math.max(0, seconds) || 0, R.offlineMax);
    const serfs = s.serfs, res = { ...s.res };
    step(s, secs);
    const diff = {};
    for (const id in s.res) diff[id] = s.res[id] - res[id];
    return { seconds: secs, serfs: s.serfs - serfs, res: diff };
  }
```

Direkt vor `  return {` einfügen:

```js
  // ---------- Speichern ----------

  const save = s => JSON.stringify(s, (k, v) => (k[0] === '_' ? undefined : v));

  // Lädt einen Spielstand, auch aus Import-Text: nur bekannte, gültige Werte; was fehlt, bleibt 0.
  // ponytail: noch kein migrate() – das Mischen in einen frischen Stand deckt neue Inhalte ab;
  // migrate() kommt mit dem ersten echten Formatwechsel.
  function load(json) {
    const raw = JSON.parse(json);
    if (!raw || typeof raw !== 'object' || !Number.isFinite(raw.v) || !CH[raw.chapter]) throw new Error('Kein Spielstand');
    const s = create(raw.chapter);
    s.log = [];
    const ok = v => Number.isFinite(v) && v >= 0;
    const count = v => Math.min(Math.floor(v), 1e6); // Import-Schutz: absurde Anzahlen deckeln
    const str = v => (typeof v === 'string' ? v.slice(0, 200) : '');
    for (const k of ['time', 'savedAt', 'arrival', 'hungry', 'logSeq']) if (ok(raw[k])) s[k] = raw[k];
    s.time = Math.min(s.time, 1e10); // gut 300 Jahre Spielzeit; darüber bliebe die Uhr stehen
    s.arrival = Math.min(s.arrival, R.arrivalEvery);
    s.hungry = Math.min(s.hungry, R.fleeAfter * (1 + bonus(s, 'flee.slow')));
    if (ok(raw.serfs)) s.serfs = count(raw.serfs);
    s.isHungry = raw.isHungry === true;
    for (const id in s.res) if (ok(raw.res?.[id])) s.res[id] = raw.res[id];
    for (const id in s.bld) if (ok(raw.bld?.[id])) s.bld[id] = count(raw.bld[id]);
    for (const id in s.jobs) if (ok(raw.jobs?.[id])) s.jobs[id] = count(raw.jobs[id]);
    for (const id in TECH) if (raw.tech?.[id] === true) s.tech[id] = true;
    for (const k in raw.seen || {}) if (raw.seen[k] === true) s.seen[k] = true;
    if (Array.isArray(raw.log)) {
      s.log = raw.log.filter(l => l && typeof l.text === 'string' && Number.isFinite(l.id))
        .slice(-R.logMax).map(l => ({ id: l.id, date: str(l.date), text: l.text }));
    }
    if (Array.isArray(raw.meta?.honors)) {
      s.meta.honors = raw.meta.honors.filter(h => h && ['date', 'chapter', 'text'].every(k => typeof h[k] === 'string'))
        .slice(-R.honorsMax).map(h => ({ date: h.date, chapter: h.chapter, text: h.text }));
    }
    dirty(s); // Gebäude und Lehren sind neu: Lager erst jetzt rechnen
    while (free(s) < 0) s.jobs[leaver(s)]--;
    for (const id in s.res) s.res[id] = Math.min(s.res[id], cap(s, id));
    return s;
  }

```

Die Rückgabe ersetzen durch:

```js
  return {
    create, log, honor, calendar, effects, cap, serfCap, free, moral, rates, arrivalBlock, step, simulate,
    needs, isUnlocked, price, canAfford, eta, click, build, research, assign, save, load,
  };
```

- [ ] **Step 4: Tests und Tempo laufen lassen**

Run: `cd C:\Users\t.fritzen\gensaat && node test.js && node test.js tempo`
Expected: `alle 26 ok`, danach die Tempo-Tabelle mit „Erster Knecht“ unter 2:00 und „Erste Lehre“ unter 5:00

---

### Task 5: Oberfläche – Look „Kathedrale“, Ordenswahl, Spielschleife

**Files:**
- Create: `C:\Users\t.fritzen\gensaat\index.html`
- Create: `C:\Users\t.fritzen\gensaat\style.css`
- Create: `C:\Users\t.fritzen\gensaat\js\ui.js`

**Interfaces:**
- Consumes: `DATA`, `Engine` (alle Funktionen aus Task 2–4).
- Produces: laufendes Spiel unter `http://localhost:8934/`. Testhilfe: `?vorspulen=<Sekunden>` spult beim Laden eines Spielstands vor.

- [ ] **Step 1: index.html schreiben**

```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#0d0a08">
  <title>Gensaat</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,700;1,400&family=Grenze+Gotisch:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="style.css">
  <link rel="icon" href="data:,">
</head>
<body>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <defs>
      <symbol id="i-skullw" viewBox="0 0 80 28"><g fill="currentColor"><path d="M30 10.5C24 6 14 4.5 3 6.5 8 7.8 11 9 13 10.6 8.5 10.6 5.5 11.6 3.5 13.4 8.2 13.2 12 13.6 15 14.8 11.5 15.4 9 16.6 7.6 18.6 12 17.6 16.5 17.6 20 18.4 18 19.4 16.8 20.6 16.2 22.2 21 20.4 26 19.4 30.5 19.2Z"/><path d="M30 10.5C24 6 14 4.5 3 6.5 8 7.8 11 9 13 10.6 8.5 10.6 5.5 11.6 3.5 13.4 8.2 13.2 12 13.6 15 14.8 11.5 15.4 9 16.6 7.6 18.6 12 17.6 16.5 17.6 20 18.4 18 19.4 16.8 20.6 16.2 22.2 21 20.4 26 19.4 30.5 19.2Z" transform="matrix(-1 0 0 1 80 0)"/><path fill-rule="evenodd" d="M40 4C34 4 31 8 31 12.5c0 2.8 1.3 4.7 3 5.8v4.2c0 .8.7 1.5 1.5 1.5h9c.8 0 1.5-.7 1.5-1.5v-4.2c1.7-1.1 3-3 3-5.8C49 8 46 4 40 4ZM33.7 12.8a2.6 2.6 0 1 0 5.2 0 2.6 2.6 0 1 0-5.2 0ZM41.1 12.8a2.6 2.6 0 1 0 5.2 0 2.6 2.6 0 1 0-5.2 0ZM40 15.4l-1.3 2.9h2.6ZM37.6 20.4h.7v3.6h-.7ZM39.65 20.4h.7v3.6h-.7ZM41.7 20.4h.7v3.6h-.7Z"/></g></symbol>
      <symbol id="i-wappen" viewBox="0 0 24 24"><path d="M12 2.2 20.2 5.3v6.1c0 5.3-3.5 9-8.2 10.9-4.7-1.9-8.2-5.6-8.2-10.9V5.3z" style="fill:var(--c1);stroke:var(--c2);stroke-width:1.6"/><path d="M7.5 8.5 12 13l4.5-4.5" style="fill:none;stroke:var(--c2);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round"/></symbol>
      <symbol id="i-supplies" viewBox="0 0 24 24"><path d="M3.5 7.5 12 3.8l8.5 3.7v9L12 20.2l-8.5-3.7zM3.5 7.5 12 11.2l8.5-3.7M12 11.2v9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
      <symbol id="i-scrap" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3.2" stroke-dasharray="3.14 3.14"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/></symbol>
      <symbol id="i-knowledge" viewBox="0 0 24 24"><path d="M12 6.5C10 5 7 4.6 4 5v13c3-.4 6 0 8 1.5 2-1.5 5-1.9 8-1.5V5c-3-.4-6 0-8 1.5zM12 6.5v13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>
      <symbol id="i-serfs" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5 20.5c.8-4 3.6-6.3 7-6.3s6.2 2.3 7 6.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
    </defs>
  </svg>

  <div class="app">
    <header class="top">
      <svg class="emblem" aria-hidden="true"><use href="#i-skullw"/></svg>
      <h1>Gensaat</h1>
      <div class="chapter"><svg class="sigil" aria-hidden="true"><use href="#i-wappen"/></svg><span id="chapter-name"></span></div>
      <div id="clock" class="clock"></div>
      <button id="menu-btn" class="menu-btn" type="button">Menü</button>
    </header>
    <div class="glass" aria-hidden="true"></div>

    <section class="res" aria-label="Bestände">
      <button id="res-toggle" class="col-head" type="button" aria-expanded="true" aria-controls="res-body">Bestände</button>
      <div id="res-body">
        <div id="res-list" class="res-list"></div>
        <div id="pop-list" class="res-list pop-list"></div>
      </div>
    </section>

    <main class="main">
      <nav id="tabs" class="tabs" role="tablist" aria-label="Bereiche"></nav>
      <div id="panel" class="panel" role="tabpanel"></div>
    </main>

    <aside class="log" aria-label="Chronik">
      <h2 class="col-head">Chronik</h2>
      <div id="log-list" class="log-list" aria-live="polite"></div>
      <button id="log-more" class="link" type="button">Mehr</button>
    </aside>
  </div>

  <div id="tip" class="tip" hidden></div>

  <dialog id="info" aria-labelledby="info-title">
    <div class="sheet-body">
      <h2 id="info-title"></h2>
      <p id="info-desc"></p>
      <div id="info-body"></div>
      <form method="dialog"><button class="btn">Schließen</button></form>
    </div>
  </dialog>

  <dialog id="away" aria-labelledby="away-title">
    <div class="sheet-body">
      <h2 id="away-title">Während du weg warst</h2>
      <p id="away-time" class="muted"></p>
      <ul id="away-list"></ul>
      <form method="dialog"><button class="btn">Weiter</button></form>
    </div>
  </dialog>

  <dialog id="menu" aria-labelledby="menu-title">
    <div class="sheet-body">
      <h2 id="menu-title">Menü</h2>
      <h3>Orden</h3>
      <div id="chapter-info" class="chapter-info"></div>
      <h3>Spielstand</h3>
      <textarea id="save-text" rows="4" spellcheck="false" aria-label="Spielstand als Text"
        placeholder="Spielstand hier einfügen"></textarea>
      <p id="save-msg" class="muted" aria-live="polite"></p>
      <div class="row-btns">
        <button id="export" class="btn" type="button">Exportieren</button>
        <button id="import" class="btn" type="button">Importieren</button>
      </div>
      <button id="reset" class="btn danger" type="button">Neu beginnen</button>
      <form method="dialog"><button class="btn">Schließen</button></form>
    </div>
  </dialog>

  <dialog id="choose" class="wide" aria-labelledby="choose-title">
    <div class="sheet-body">
      <h2 id="choose-title">Wähle deinen Orden</h2>
      <p class="muted">Die Kreuzzugsflotte ist verloren. Wessen Söhne haben überlebt?</p>
      <div id="choose-list" class="choose-list"></div>
    </div>
  </dialog>

  <script src="js/data.js"></script>
  <script src="js/engine.js"></script>
  <script src="js/ui.js"></script>
</body>
</html>
```

- [ ] **Step 2: style.css schreiben**

```css
/* Gensaat – Look „Kathedrale“: dunkler Stein, Kerzenlicht-Gold, Buntglas in Ordensfarben. Nur dunkel. */
:root {
  color-scheme: dark;
  --stone: #18130f; --stone2: #0d0a08;
  --bone: #e8dcc4; --bone2: #b3a58a; --gold: #d9a94e; --gold2: #f3d38c;
  --line: #3b322a; --miss: #ec8466; --plus: #b9cb8f;
  --card: #28211b; --card2: #191410; --edge: #6b5530;
  /* Ordensfarben: setzt ui.js nach dem gewählten Orden */
  --c1: #1f4494; --c2: #d8b24a; --c-on: #ffffff; --c-glow: #79b8ff;
  --gable: 11px;
  --gothic: 'Grenze Gotisch', Georgia, serif;
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }
html { -webkit-text-size-adjust: 100%; background: var(--stone2); }
body {
  margin: 0;
  min-height: 100vh;
  color: var(--bone);
  font: 16px/1.4 Alegreya, Georgia, serif;
  background:
    radial-gradient(70% 45% at 50% 0%, rgb(217 169 78 / .12), transparent 70%),
    repeating-linear-gradient(90deg, rgb(255 255 255 / .018) 0 1px, transparent 1px 88px),
    linear-gradient(var(--stone), var(--stone2));
  background-attachment: fixed;
}
button, textarea { font: inherit; color: inherit; }
button { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
button:focus-visible, textarea:focus-visible { outline: 2px solid var(--gold2); outline-offset: 2px; }
b { font-weight: 700; }
p { margin: 0; }
.muted { color: var(--bone2); }
.miss { color: var(--miss); }

/* Aufbau: Handy eine Spalte, PC drei Spalten wie Kittens */
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 6px 16px calc(24px + env(safe-area-inset-bottom));
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: "top" "glass" "res" "main" "log";
}
.top { grid-area: top; }
.glass { grid-area: glass; }
.res { grid-area: res; }
.main { grid-area: main; min-width: 0; }
.log { grid-area: log; }
@media (min-width: 900px) {
  .app {
    column-gap: 22px;
    grid-template-columns: 250px minmax(0, 1fr) 270px;
    grid-template-areas: "top top top" "glass glass glass" "res main log";
    align-items: start;
  }
}

/* Kopfzeile mit Rosenfenster und Buntglas-Band */
.top {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 2px;
  padding: 6px 60px 2px;
  text-align: center;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%23d9a94e' stroke-width='.8' opacity='.22'%3E%3Ccircle cx='50' cy='50' r='48'/%3E%3Ccircle cx='50' cy='50' r='43'/%3E%3Ccircle cx='50' cy='50' r='11'/%3E%3Cpath id='p' d='M50 39C45 31 45 19 50 8C55 19 55 31 50 39Z'/%3E%3Cuse href='%23p' transform='rotate(45 50 50)'/%3E%3Cuse href='%23p' transform='rotate(90 50 50)'/%3E%3Cuse href='%23p' transform='rotate(135 50 50)'/%3E%3Cuse href='%23p' transform='rotate(180 50 50)'/%3E%3Cuse href='%23p' transform='rotate(225 50 50)'/%3E%3Cuse href='%23p' transform='rotate(270 50 50)'/%3E%3Cuse href='%23p' transform='rotate(315 50 50)'/%3E%3C/g%3E%3C/svg%3E") center 58% / 150px no-repeat;
}
.emblem { width: 72px; height: 26px; color: var(--gold); filter: drop-shadow(0 0 6px rgb(217 169 78 / .4)); }
h1 {
  margin: 0;
  font: 600 36px/1 var(--gothic);
  letter-spacing: .03em;
  text-shadow: 0 0 18px rgb(217 169 78 / .35), 0 2px 0 #000;
}
.chapter { display: flex; align-items: center; gap: 7px; font-variant: small-caps; letter-spacing: .14em; color: var(--gold2); }
.sigil { width: 17px; height: 17px; flex: none; }
.clock { min-height: 1.4em; font-size: 14px; font-style: italic; color: var(--bone2); white-space: nowrap; }
.menu-btn {
  position: absolute; top: 2px; right: 0;
  min-height: 44px; padding: 0 4px 0 12px;
  background: none; border: 0;
  color: var(--gold); font: 500 19px var(--gothic); cursor: pointer;
}
.glass {
  height: 8px;
  background:
    linear-gradient(180deg, rgb(255 255 255 / .3), transparent 60%),
    repeating-linear-gradient(90deg, #0b0807 0 2px, transparent 2px 26px),
    linear-gradient(90deg, var(--c1), #7e1b1b 14%, #c99a3c 28%, #1f3b6e 42%, var(--c1) 56%, #7e1b1b 70%, #c99a3c 84%, var(--c1));
  box-shadow: 0 0 14px color-mix(in srgb, var(--c-glow) 45%, transparent);
}

/* Spaltenköpfe: Text zwischen zwei goldenen Linien */
.col-head {
  display: flex; align-items: center; gap: 10px;
  width: 100%; min-height: 44px; margin: 0; padding: 0;
  background: none; border: 0;
  color: var(--gold); font: 500 20px var(--gothic);
}
.col-head::before, .col-head::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--gold)); }
.col-head::after { background: linear-gradient(90deg, var(--gold), transparent); }
button.col-head { cursor: pointer; }

/* Bestände */
.res-list {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto auto;
  gap: 3px 8px;
  align-items: center;
  font-variant-numeric: tabular-nums lining-nums;
}
.pop-list:not(:empty) { margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--line); }
.res-row { display: contents; }
.res-row svg { width: 17px; height: 17px; color: var(--gold); }
.res-row > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.res-row .rv { text-align: right; }
.res-row .rr { min-width: 4.8em; text-align: right; font-size: 14px; font-style: italic; color: var(--plus); }
.res-row .rr.miss { color: var(--miss); }
.res-row.full .rv { color: var(--gold2); }

/* Reiter mit Spitzbogen */
.tabs { display: flex; gap: 6px; overflow-x: auto; border-bottom: 1px solid var(--line); scrollbar-width: none; }
.tabs::-webkit-scrollbar { display: none; }
.tabs button {
  flex: none;
  min-height: 44px; padding: 12px 14px 5px;
  border: 0;
  color: var(--bone2);
  background: linear-gradient(#2b241e, #1c1714);
  clip-path: polygon(0 9px, 50% 0, 100% 9px, 100% 100%, 0 100%);
  font: 500 18px var(--gothic);
  white-space: nowrap;
  cursor: pointer;
}
.tabs button[aria-selected="true"] {
  color: var(--c-on);
  background:
    linear-gradient(180deg, rgb(255 255 255 / .3), transparent 50%),
    linear-gradient(color-mix(in srgb, var(--c1) 85%, #fff), color-mix(in srgb, var(--c1) 55%, #000));
}
.tabs .dot { display: inline-block; width: .8em; text-align: center; color: var(--gold2); }

/* Karten: Spitzbogen mit Goldrand; am Handy volle Breite (Klick-Knöpfe nebeneinander), ab 600 px zwei Spalten */
.panel { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding-top: 14px; }
.card {
  grid-column: 1 / -1;
  position: relative;
  z-index: 0;
  display: flex;
  min-height: 58px;
  padding-top: var(--gable);
  background: linear-gradient(#8a6a2c, #4a3a1e);
  clip-path: polygon(0 var(--gable), 50% 0, 100% var(--gable), 100% 100%, 0 100%);
}
.card::before {
  content: '';
  position: absolute; inset: 1px; z-index: -1;
  background:
    radial-gradient(80% 70% at 50% 0%, rgb(217 169 78 / .16), transparent 70%),
    linear-gradient(var(--card), var(--card2));
  clip-path: polygon(0 calc(var(--gable) - .5px), 50% 0, 100% calc(var(--gable) - .5px), 100% 100%, 0 100%);
}
.card.click { grid-column: auto; background: linear-gradient(var(--gold2), #8a6a2c); }
.card.click::before {
  background:
    linear-gradient(180deg, rgb(255 255 255 / .25), transparent 55%),
    linear-gradient(color-mix(in srgb, var(--c1) 85%, #fff), color-mix(in srgb, var(--c1) 50%, #000));
}
.card.off { background: linear-gradient(#4a3f30, #2b241c); }
.card.off::before { filter: saturate(.45) brightness(.8); }
@media (min-width: 600px) { .card { grid-column: auto; } }
.card .buy {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  padding: 3px 10px 9px;
  background: none; border: 0;
  color: var(--bone); text-align: center;
  cursor: pointer; user-select: none;
}
.card.click .buy { color: var(--c-on); }
.card.off .buy { color: var(--bone2); cursor: default; }
.card .name { font: 500 18px/1.15 var(--gothic); }
.card .name em { font-style: normal; color: var(--gold2); margin-left: 6px; }
.card .sub { font-size: 14px; font-style: italic; color: var(--bone2); }
.card.click .sub { color: var(--c-on); opacity: .8; }
.card.done .sub { color: var(--plus); }
.card .name, .card .sub { max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card .info {
  flex: none; width: 42px; margin: 4px 0 6px;
  background: none; border: 0; border-left: 1px solid var(--line);
  color: var(--gold); font: italic 18px Alegreya, Georgia, serif; cursor: pointer;
}
.card button:focus-visible { outline-offset: -3px; }
.card .buy:active:not(:disabled) { filter: brightness(1.2); }

/* Orden-Reiter */
.summary, .job { grid-column: 1 / -1; }
.summary { display: grid; gap: 2px; padding-bottom: 4px; }
.summary .hint { min-height: 1.4em; } /* Platz bleibt reserviert, damit die Jobs nicht springen */
.job { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--line); }
.job-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.job-text .name { font: 500 18px var(--gothic); }
.job-text .sub { font-size: 14px; font-style: italic; color: var(--bone2); }
.job-text .name, .job-text .sub { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.step {
  flex: none; width: 44px; height: 44px;
  background: linear-gradient(#2b241e, #1c1714);
  border: 1px solid var(--edge); border-radius: 4px;
  color: var(--gold2); font-size: 22px; cursor: pointer;
}
.step:disabled { color: #6f6553; border-color: var(--line); cursor: default; }

/* Chronik */
.log-list { min-height: calc(4 * 2.7em); }
.log-list p { position: relative; margin: 0 0 9px; padding-left: 16px; font-size: 15px; }
.log-list p::before { content: '\2020'; position: absolute; left: 1px; top: 0; color: var(--gold); }
.log-list p:nth-child(n+3) { color: var(--bone2); }
.log-list time { display: block; font-size: 12px; font-style: italic; color: #8b7e66; }
.link { min-height: 44px; padding: 0; background: none; border: 0; color: var(--gold); cursor: pointer; }

/* Tooltip am PC */
.tip {
  position: absolute; z-index: 10;
  width: 300px; padding: 10px 12px;
  color: var(--bone);
  background: linear-gradient(#211b16, #140f0c);
  border: 1px solid var(--edge); border-radius: 4px;
  box-shadow: 0 10px 30px rgb(0 0 0 / .6);
  font-size: 15px;
  pointer-events: none;
}
.tip h3 { margin: 0 0 4px; font: 500 20px var(--gothic); color: var(--gold2); }
.tip p { margin: 0 0 3px; }

/* Fenster */
dialog {
  width: min(92vw, 440px);
  padding: 0;
  color: var(--bone);
  background: linear-gradient(#211b16, #140f0c);
  border: 1px solid var(--edge); border-radius: 6px;
  box-shadow: 0 0 0 1px #000, 0 20px 50px rgb(0 0 0 / .6);
}
dialog.wide { width: min(96vw, 980px); }
dialog::backdrop { background: rgb(0 0 0 / .65); }
.sheet-body { display: grid; gap: 10px; padding: 18px; }
dialog h2 { margin: 0; font: 600 26px var(--gothic); color: var(--gold2); }
dialog h3 { margin: 6px 0 0; font: 500 20px var(--gothic); color: var(--gold); }
dialog ul { margin: 0; padding-left: 1.2em; }
.chapter-info { display: grid; gap: 2px; }
.btn {
  min-height: 44px; padding: 0 14px;
  color: var(--bone);
  background: linear-gradient(#2b241e, #1c1714);
  border: 1px solid var(--edge); border-radius: 4px;
  font: 500 18px var(--gothic); cursor: pointer;
}
.btn.danger { color: var(--miss); }
.sheet-body form .btn { width: 100%; }
.row-btns { display: flex; gap: 8px; }
.row-btns .btn { flex: 1; }
/* Eingabefelder mit 16 px: sonst zoomt iOS beim Antippen hinein */
textarea {
  width: 100%; padding: 8px;
  color: var(--bone); background: #0f0c0a;
  border: 1px solid var(--line); border-radius: 4px;
  font: 16px/1.4 ui-monospace, Consolas, monospace;
}

/* Ordenswahl */
.choose-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.choice {
  display: grid; gap: 4px; align-content: start;
  padding: 12px 14px 14px;
  text-align: left;
  color: var(--bone);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--c1) 38%, transparent), transparent 55%),
    linear-gradient(var(--card), var(--card2));
  border: 1px solid var(--edge); border-top: 4px solid var(--c1); border-radius: 4px;
  cursor: pointer;
}
.choice:hover, .choice:focus-visible { border-color: var(--gold); outline: none; }
.choice .ch-name { display: flex; align-items: center; gap: 8px; font: 600 24px var(--gothic); color: var(--gold2); }
.choice svg { width: 22px; height: 22px; flex: none; }
.choice > span:not(.ch-name) { display: block; font-size: 15px; }
.choice b { color: var(--gold); }
```

- [ ] **Step 3: js/ui.js schreiben**

```js
// Gensaat – Anzeige, Eingaben, Speichern und Spielschleife.
(() => {
  const E = Engine, D = DATA;
  const KEY = 'gensaat';
  const byId = list => Object.fromEntries(list.map(x => [x.id, x]));
  const RES = byId(D.resources), JOB = byId(D.jobs), CH = byId(D.chapters);
  const $ = id => document.getElementById(id);
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const wide = matchMedia('(min-width: 900px)');

  // ---------- Zahlen und Texte ----------

  const nf = digits => new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits });
  const N0 = nf(0), N1 = nf(1), N2 = nf(2), NF = [N0, N1, N2];
  const up = x => Math.ceil(x - 1e-9), down = x => Math.floor(x + 1e-9);

  // Deutsche Kurzform. round: Math.round, up (Preise) oder down (Bestand), damit ein Bestand
  // nie genauso aussieht wie ein Preis, für den doch noch etwas fehlt.
  function fmt(n, round = Math.round) {
    const a = Math.abs(n);
    const [div, unit, digits] = a >= 1e9 ? [1e9, ' Mrd.', 2] : a >= 1e6 ? [1e6, ' Mio.', 2]
      : a >= 1e4 ? [1e3, ' Tsd.', 1] : a >= 100 ? [1, '', 0] : [1, '', 1];
    const f = 10 ** digits;
    return NF[digits].format(round(n / div * f) / f) + unit;
  }
  function fmtRate(r) {
    const a = Math.abs(r);
    return (r < 0 ? '−' : '+') + (a >= 100 ? fmt(a) : (a < 1 ? N2 : N1).format(a)) + '/s';
  }
  function fmtTime(sec) {
    if (sec < 60) return Math.ceil(sec) + ' s';
    if (sec < 3600) return Math.round(sec / 60) + ' Min.';
    if (sec < 86400) return N1.format(sec / 3600) + ' Std.';
    const d = N1.format(sec / 86400);
    return d + (d === '1' ? ' Tag' : ' Tage');
  }
  const amount = (id, v, round) => { const n = fmt(v, round); return `${n} ${n === '1' ? RES[id].one : RES[id].name}`; };

  function effectText(key, v) {
    const [a, b] = key.split('.');
    if (key === 'serfs.cap') return `+${fmt(v)} Knechte-Plätze`;
    if (a === 'job') return `${JOB[b].name} +${Math.round(v * 100)} %`;
    if (b === 'rate') return `+${N2.format(v)} ${RES[a].name}/s`;
    if (b === 'cap') return `Lager ${RES[a].name} +${fmt(v)}`;
    return `${RES[a].name} +${Math.round(v * 100)} %`;
  }
  const costHtml = cost => Object.entries(cost)
    .map(([id, v]) => `<span${S.res[id] < v - 1e-9 ? ' class="miss"' : ''}>${amount(id, v, up)}</span>`)
    .join(' · ');

  // Nur schreiben, wenn sich etwas ändert: schont Fokus, Auswahl und Akku.
  function text(el, t) { if (el._t !== t) { el.textContent = t; el._t = t; } }
  function html(el, h) { if (el._h !== h) { el.innerHTML = h; el._h = h; } }

  // ---------- Karten und Reiter ----------

  function card(onBuy, infoFor) {
    const el = document.createElement('div');
    el.className = 'card';
    const buy = document.createElement('button');
    buy.className = 'buy';
    buy.type = 'button';
    buy.innerHTML = '<span class="name"></span><span class="sub"></span>';
    buy.addEventListener('click', () => { if (onBuy()) render(); });
    el.append(buy);
    if (infoFor) {
      const b = document.createElement('button');
      b.className = 'info';
      b.type = 'button';
      b.textContent = 'i';
      b.setAttribute('aria-label', 'Info zu ' + infoFor.item.name);
      b.addEventListener('click', () => openInfo(infoFor.kind, infoFor.item));
      el.append(b);
      el.addEventListener('mouseenter', () => showTip(el, infoFor));
      el.addEventListener('mouseleave', hideTip);
    }
    return { el, buy, name: buy.firstChild, sub: buy.lastChild };
  }
  const setOff = (k, off) => { k.buy.disabled = off; k.el.classList.toggle('off', off); };

  function fortressItems() {
    const items = D.clicks.map(c => ({
      key: 'click:' + c.id,
      make: () => {
        const k = card(() => E.click(S, c.id));
        k.el.classList.add('click');
        k.name.textContent = c.name;
        k.sub.textContent = '+1 ' + RES[c.id].one;
        return k;
      },
      update: k => setOff(k, S.res[c.id] >= E.cap(S, c.id)),
    }));
    for (const b of D.buildings) {
      if (!E.isUnlocked(S, b)) continue;
      items.push({
        key: 'bld:' + b.id,
        make: () => card(() => E.build(S, b.id), { kind: 'building', item: b }),
        update: k => {
          const cost = E.price(S, 'building', b.id);
          html(k.name, `${b.name}<em>${S.bld[b.id]}</em>`);
          html(k.sub, costHtml(cost));
          setOff(k, !E.canAfford(S, cost));
        },
      });
    }
    return items;
  }

  const HINTS = { full: 'Alle Quartiere sind belegt.', frost: 'In der Frostzeit kommt niemand.', food: 'Für Neue fehlen Vorräte.' };

  function orderItems() {
    const items = [{
      key: 'summary',
      make: () => { const el = document.createElement('div'); el.className = 'summary'; return { el }; },
      update: k => html(k.el,
        `<p>Knechte <b>${S.serfs} / ${fmt(E.serfCap(S))}</b> · frei <b>${E.free(S)}</b></p>` +
        `<p>Moral <b>${Math.round(E.moral(S) * 100)} %</b>${S.isHungry ? ' · <span class="miss">Hunger</span>' : ''}</p>` +
        `<p class="muted hint">${HINTS[E.arrivalBlock(S)] || ''}</p>`),
    }];
    for (const j of D.jobs) {
      if (!E.isUnlocked(S, j)) continue;
      items.push({
        key: 'job:' + j.id,
        make: () => {
          const el = document.createElement('div');
          el.className = 'job';
          el.innerHTML = '<div class="job-text"><span class="name"></span><span class="sub"></span></div>' +
            `<button class="step" type="button" aria-label="${j.name} weniger">−</button>` +
            `<button class="step" type="button" aria-label="${j.name} mehr">+</button>`;
          const [minus, plus] = el.querySelectorAll('.step');
          minus.addEventListener('click', () => { if (E.assign(S, j.id, -1)) render(); });
          plus.addEventListener('click', () => { if (E.assign(S, j.id, 1)) render(); });
          el.querySelector('.sub').textContent =
            Object.entries(j.effects).map(([key, v]) => effectText(key, v)).join(', ') + ' je Knecht';
          return { el, minus, plus, name: el.querySelector('.name') };
        },
        update: k => {
          text(k.name, `${j.name}: ${S.jobs[j.id]}`);
          k.minus.disabled = S.jobs[j.id] < 1;
          k.plus.disabled = E.free(S) < 1;
        },
      });
    }
    return items;
  }

  function libraryItems() {
    return D.techs.filter(t => E.isUnlocked(S, t)).map(t => ({
      key: 'tech:' + t.id,
      make: () => {
        const k = card(() => E.research(S, t.id), { kind: 'tech', item: t });
        k.name.textContent = t.name;
        return k;
      },
      update: k => {
        const done = !!S.tech[t.id];
        html(k.sub, done ? 'erforscht' : costHtml(t.cost));
        setOff(k, done || !E.canAfford(S, t.cost));
        k.el.classList.toggle('done', done);
      },
    }));
  }

  const TABS = [
    { id: 'fortress', name: 'Festung', show: () => true, items: fortressItems },
    { id: 'order', name: 'Orden', show: () => S.seen.serfs, items: orderItems, badge: () => E.free(S) > 0 },
    { id: 'library', name: 'Librarium', show: () => E.isUnlocked(S, RES.knowledge), items: libraryItems,
      badge: () => D.techs.some(t => E.isUnlocked(S, t) && !S.tech[t.id] && E.canAfford(S, t.cost)) },
  ];

  // ---------- Zeichnen ----------

  let S = null, tab = 'fortress', rendered = new Map(), logShown = -1, logOpen = false, info = null, tip = null;
  let saveWarned = false, awaySum = null, brokenSave = false;

  function render() {
    if (!S) return;
    renderClock();
    renderRes();
    renderTabs();
    renderPanel();
    renderLog();
    renderInfo();
    renderTip();
  }

  function renderClock() {
    const c = E.calendar(S);
    html($('clock'), (S.tech.calendar ? `${c.date} · ${c.seasonName}` : 'Kharos Tertius') +
      (S.isHungry ? ' · <span class="miss">Hunger</span>' : ''));
  }

  function resRow(list, key, icon, name) {
    let row = list.querySelector(`[data-k="${key}"]`);
    if (!row) {
      row = document.createElement('div');
      row.className = 'res-row';
      row.dataset.k = key;
      row.innerHTML = `<svg aria-hidden="true"><use href="#${icon}"/></svg><span>${name}</span>` +
        '<span class="rv"></span><span class="rr"></span>';
      list.append(row);
    }
    return row;
  }

  function renderRes() {
    const r = E.rates(S);
    for (const res of D.resources) {
      if (!E.isUnlocked(S, res)) continue; // freigeschaltet = sichtbar, auch bei 0
      const row = resRow($('res-list'), res.id, res.icon, res.name), c = E.cap(S, res.id), rate = r[res.id];
      text(row.children[2], `${fmt(S.res[res.id], down)} / ${fmt(c)}`);
      text(row.children[3], Math.abs(rate) > 1e-9 ? fmtRate(rate) : '');
      row.classList.toggle('full', S.res[res.id] >= c - 1e-9);
      row.children[3].classList.toggle('miss', rate < -1e-9);
    }
    if (S.seen.serfs) text(resRow($('pop-list'), 'serfs', 'i-serfs', 'Knechte').children[2], `${S.serfs} / ${fmt(E.serfCap(S))}`);
  }

  function renderTabs() {
    const nav = $('tabs');
    for (const t of TABS) {
      if (!t.show()) continue;
      let b = nav.querySelector(`[data-tab="${t.id}"]`);
      if (!b) {
        b = document.createElement('button');
        b.type = 'button';
        b.dataset.tab = t.id;
        b.setAttribute('role', 'tab');
        b.innerHTML = t.name + (t.badge ? '<span class="dot" aria-hidden="true"></span>' : '');
        b.addEventListener('click', () => switchTab(t.id));
        nav.append(b);
      }
      b.setAttribute('aria-selected', String(t.id === tab));
      if (t.badge) text(b.lastChild, t.badge() ? '•' : '');
    }
  }

  function switchTab(id) {
    tab = id;
    rendered = new Map();
    hideTip();
    $('panel').replaceChildren();
    render();
  }

  function renderPanel() {
    for (const item of TABS.find(t => t.id === tab).items()) {
      let k = rendered.get(item.key);
      if (!k) {
        k = item.make();
        rendered.set(item.key, k);
        $('panel').append(k.el); // Neues kommt immer ans Ende, damit nichts verrutscht
      }
      item.update(k);
    }
  }

  function renderLog() {
    if (S.logSeq === logShown) return;
    logShown = S.logSeq;
    const lines = S.log.slice(logOpen ? 0 : wide.matches ? -12 : -4).reverse();
    $('log-list').replaceChildren(...lines.map(l => {
      const p = document.createElement('p'), t = document.createElement('time');
      t.textContent = l.date;
      p.append(t, l.text);
      return p;
    }));
  }

  // ---------- Info und Tooltip ----------

  function details(kind, item) {
    let what;
    if (kind === 'building') what = 'Wirkung: ' + Object.entries(item.effects).map(([k, v]) => effectText(k, v)).join(', ');
    else {
      const opens = [...D.resources, ...D.buildings, ...D.jobs, ...D.techs]
        .filter(x => E.needs(x).includes(item.id)).map(x => x.name);
      what = 'Schaltet frei: ' + [item.unlockText, ...opens].filter(Boolean).join(', ');
    }
    const done = kind === 'tech' && S.tech[item.id];
    return `<p class="muted">${what}</p>` +
      (done ? '<p>Erforscht</p>' : costDetail(kind === 'tech' ? item.cost : E.price(S, 'building', item.id)));
  }

  function costDetail(cost) {
    const rows = Object.entries(cost).map(([id, v]) => {
      const miss = S.res[id] < v - 1e-9, small = v > E.cap(S, id) + 1e-9;
      return `<p${miss ? ' class="miss"' : ''}>${RES[id].name}: ${fmt(Math.min(S.res[id], v), down)} / ${fmt(v, up)}` +
        `${small ? ' · Lager zu klein' : ''}</p>`;
    });
    const t = E.eta(S, cost);
    const when = E.canAfford(S, cost) ? 'Bezahlbar'
      : t === Infinity ? 'So noch nicht bezahlbar' : `Bezahlbar in ca. ${fmtTime(t)}`;
    return rows.join('') + `<p class="muted">${when}</p>`;
  }

  function openInfo(kind, item) {
    hideTip();
    info = { kind, item };
    $('info-title').textContent = item.name;
    $('info-desc').textContent = item.desc;
    $('info').showModal();
    renderInfo();
  }

  function renderInfo() {
    if (info && $('info').open) html($('info-body'), details(info.kind, info.item));
  }

  function showTip(el, infoFor) {
    if (!hover.matches) return;
    tip = { el, ...infoFor };
    renderTip();
  }

  function hideTip() {
    tip = null;
    $('tip').hidden = true;
  }

  function renderTip() {
    if (!tip) return;
    if (!tip.el.isConnected) { hideTip(); return; }
    const t = $('tip');
    html(t, `<h3>${tip.item.name}</h3><p>${tip.item.desc}</p>${details(tip.kind, tip.item)}`);
    t.hidden = false;
    const r = tip.el.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
    const below = r.bottom + 8 + h <= innerHeight;
    t.style.left = `${Math.min(Math.max(8, r.left), innerWidth - w - 8) + scrollX}px`;
    t.style.top = `${(below ? r.bottom + 8 : Math.max(8, r.top - h - 8)) + scrollY}px`;
  }

  // ---------- Abwesenheit ----------

  function showAway(sum) {
    if (awaySum && $('away').open) { // Fenster ist schon offen: zusammenzählen statt ersetzen
      const res = { ...awaySum.res };
      for (const id in sum.res) res[id] = (res[id] || 0) + sum.res[id];
      sum = { seconds: awaySum.seconds + sum.seconds, serfs: awaySum.serfs + sum.serfs, res };
    }
    awaySum = sum;
    const lines = [];
    if (sum.serfs) {
      const n = Math.abs(sum.serfs);
      lines.push(`${sum.serfs > 0 ? '+' : '−'}${n} ${n === 1 ? 'Knecht' : 'Knechte'}`);
    }
    for (const r of D.resources) {
      const v = sum.res[r.id];
      if (Math.abs(v) >= 0.5) lines.push(`${v > 0 ? '+' : '−'}${amount(r.id, Math.abs(v))}`);
    }
    $('away-time').textContent = fmtTime(sum.seconds);
    $('away-list').replaceChildren(...(lines.length ? lines : ['Alles blieb ruhig.']).map(t => {
      const li = document.createElement('li');
      li.textContent = t;
      return li;
    }));
    if (!$('away').open) $('away').showModal();
  }

  // ---------- Speichern ----------

  function saveNow() {
    if (!S) return;
    S.savedAt = Date.now();
    try {
      localStorage.setItem(KEY, E.save(S));
    } catch {
      if (!saveWarned) {
        saveWarned = true;
        E.log(S, 'Speichern klappt hier nicht. Nutze im Menü „Exportieren“.');
      }
    }
  }

  const toB64 = str => {
    let bin = '';
    for (const byte of new TextEncoder().encode(str)) bin += String.fromCharCode(byte);
    return btoa(bin);
  };
  const fromB64 = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.trim()), ch => ch.charCodeAt(0)));
  // Vor Import oder Neustart den alten Stand beiseitelegen.
  const backup = () => { try { if (S) localStorage.setItem(KEY + '-vorher', E.save(S)); } catch { /* nur ein Extra */ } };

  function boot() {
    const extra = Number(new URLSearchParams(location.search).get('vorspulen')) || 0; // Testhilfe: Sekunden vorspulen
    let raw = null, s = null;
    try { raw = localStorage.getItem(KEY); } catch { /* kein Speicher: frisches Spiel */ }
    if (raw) {
      try {
        s = E.load(raw);
      } catch {
        try { localStorage.setItem(KEY + '-kaputt', raw); } catch { /* Hinweis kommt trotzdem */ }
        brokenSave = true;
      }
    }
    if (!s) return { s: null, sum: null };
    const away = (s.savedAt ? (Date.now() - s.savedAt) / 1000 : 0) + extra;
    return { s, sum: away > 5 ? E.simulate(s, away) : null };
  }

  // ---------- Orden ----------

  function applyChapter() {
    const ch = CH[S.chapter], st = document.documentElement.style;
    st.setProperty('--c1', ch.colors.c1);
    st.setProperty('--c2', ch.colors.c2);
    st.setProperty('--c-on', ch.colors.on);
    st.setProperty('--c-glow', ch.colors.glow);
    $('chapter-name').textContent = ch.name;
  }

  function openChoose() {
    const list = $('choose-list');
    if (!list.children.length) {
      for (const ch of D.chapters) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'choice';
        b.style.setProperty('--c1', ch.colors.c1);
        b.style.setProperty('--c2', ch.colors.c2);
        b.innerHTML = `<span class="ch-name"><svg aria-hidden="true"><use href="#i-wappen"/></svg>${ch.name}</span>` +
          `<span><b>Bonus:</b> ${ch.bonus}</span><span><b>Eigenheit:</b> ${ch.quirk}</span><span><b>Makel:</b> ${ch.flaw}</span>`;
        b.addEventListener('click', () => begin(ch.id));
        list.append(b);
      }
    }
    if (!$('choose').open) $('choose').showModal();
  }

  function begin(chapterId) {
    S = E.create(chapterId);
    if (brokenSave) {
      E.log(S, 'Der alte Spielstand war kaputt und liegt jetzt beiseite.');
      brokenSave = false;
    }
    $('choose').close();
    applyChapter();
    saveNow();
    rebuild();
  }

  // ---------- Menü ----------

  const msg = t => { $('save-msg').textContent = t; };

  function rebuild() {
    for (const id of ['res-list', 'pop-list', 'tabs', 'panel', 'log-list']) $(id).replaceChildren();
    tab = 'fortress';
    rendered = new Map();
    logShown = -1;
    hideTip();
    render();
  }

  function wire() {
    $('menu-btn').addEventListener('click', () => {
      if (!S) return;
      const ch = CH[S.chapter];
      $('chapter-info').innerHTML = `<p><b>${ch.name}</b> · Schiff „${ch.ship}“</p><p>Bonus: ${ch.bonus}</p>` +
        `<p>Eigenheit: ${ch.quirk}</p><p>Makel: ${ch.flaw}</p>`;
      msg('');
      $('menu').showModal();
    });
    $('export').addEventListener('click', () => {
      const t = $('save-text');
      t.value = toB64(E.save(S));
      t.select();
      if (navigator.clipboard) navigator.clipboard.writeText(t.value).then(() => msg('Kopiert.'), () => msg('Markiert, bitte kopieren.'));
      else msg('Markiert, bitte kopieren.');
    });
    $('import').addEventListener('click', () => {
      let s;
      try { s = E.load(fromB64($('save-text').value)); } catch { msg('Das ist kein gültiger Spielstand.'); return; }
      backup();
      S = s;
      applyChapter();
      saveNow();
      rebuild();
      $('menu').close();
    });
    $('reset').addEventListener('click', () => {
      if (!confirm('Wirklich alles löschen, auch den Liber Honoris, und neu beginnen?')) return;
      backup();
      S = null;
      try { localStorage.removeItem(KEY); } catch { /* dann eben nicht */ }
      $('menu').close();
      rebuild();
      openChoose();
    });

    $('res-toggle').addEventListener('click', () => {
      const open = $('res-toggle').getAttribute('aria-expanded') !== 'true';
      $('res-toggle').setAttribute('aria-expanded', String(open));
      $('res-body').hidden = !open;
    });
    $('log-more').addEventListener('click', () => {
      logOpen = !logOpen;
      $('log-more').textContent = logOpen ? 'Weniger' : 'Mehr';
      logShown = -1;
      render();
    });
    wide.addEventListener('change', () => { logShown = -1; render(); });

    for (const d of document.querySelectorAll('dialog:not(#choose)')) {
      let fromBackdrop = false; // nur schließen, wenn Druck und Loslassen beide außerhalb liegen
      d.addEventListener('pointerdown', e => { fromBackdrop = e.target === d; });
      d.addEventListener('click', e => { if (fromBackdrop && e.target === d) d.close(); });
    }
    $('choose').addEventListener('cancel', e => e.preventDefault()); // ohne Orden geht es nicht weiter
    $('choose').addEventListener('close', () => { if (!S) setTimeout(openChoose); });
    $('info').addEventListener('close', () => { info = null; });
    $('away').addEventListener('close', () => { awaySum = null; });
  }

  // ---------- Start ----------

  const booted = boot();
  S = booted.s;
  wire();
  if (S) {
    applyChapter();
    render();
    if (booted.sum && booted.sum.seconds >= 60) showAway(booted.sum);
  } else {
    openChoose();
  }

  // Zeit nachholen; große Lücken (Standby, gedrosselter Hintergrund-Tab) laufen über simulate().
  const snapshot = () => ({ at: Date.now(), serfs: S ? S.serfs : 0, res: S ? { ...S.res } : {} });
  let last = Date.now(), hiddenAt = document.hidden ? snapshot() : null; // der Tab kann schon versteckt laden
  function advance() {
    const now = Date.now(), dt = Math.max(0, (now - last) / 1000);
    last = now;
    if (!S) return null;
    if (dt <= 5) { E.step(S, dt); return null; }
    return E.simulate(S, dt);
  }
  setInterval(() => {
    const sum = advance();
    if (sum && sum.seconds >= 60 && !hiddenAt) showAway(sum); // z. B. Laptop im Standby ohne Tab-Wechsel
    render();
  }, 200);
  setInterval(saveNow, 30000);
  // Versteckt: Stand merken. Wieder sichtbar: alles seitdem als eine Zusammenfassung.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      saveNow();
      hiddenAt = snapshot();
      return;
    }
    advance();
    const away = hiddenAt;
    hiddenAt = null;
    const seconds = away && S ? Math.min((Date.now() - away.at) / 1000, D.rules.offlineMax) : 0;
    if (seconds >= 60) {
      const res = {};
      for (const id in S.res) res[id] = S.res[id] - (away.res[id] || 0);
      showAway({ seconds, serfs: S.serfs - away.serfs, res });
    }
    render();
  });
  addEventListener('pagehide', saveNow);
})();
```

- [ ] **Step 4: Starten und Grundfunktion prüfen**

Start: `preview_start` mit Name `gensaat` (oder `python serve.py 8934`), dann `http://localhost:8934/` öffnen.
Prüfen (read_page / javascript_tool):
- Die Ordenswahl zeigt 6 Karten. Klick auf „Ultramarines“ schließt sie, Kopfzeile zeigt „Ultramarines“, Buntglas-Band blau.
- Festung: „Trümmer durchsuchen“ und „Vorräte bergen“ nebeneinander, darunter Hydrokulturfarm und Knechtsquartier.
- 12× „Trümmer durchsuchen“, dann „Knechtsquartier“: Schrott sinkt um 12, nach ~18 s erscheinen Reiter „Orden“, Zeile „Knechte 1 / 2“ und ein Chronik-Eintrag mit Datum.
- `read_console_messages` zeigt keine Fehler.

- [ ] **Step 5: Tests laufen lassen**

Run: `cd C:\Users\t.fritzen\gensaat && node test.js`
Expected: `alle 26 ok`

---

### Task 6: Sichtprüfung PC und Handy, Abschluss

**Files:**
- Modify nach Befund: `C:\Users\t.fritzen\gensaat\style.css`, `C:\Users\t.fritzen\gensaat\js\ui.js`

**Interfaces:**
- Consumes: laufendes Spiel aus Task 5.
- Produces: geprüfte Etappe 1 mit Screenshots (PC-Breite und 375 × 812).

- [ ] **Step 1: Spielstand mit allen Etappe-1-Inhalten herstellen**

Im Browser (`javascript_tool`) einen Stand setzen und neu laden:

```js
const s = Engine.create('um');
Object.assign(s.res, { supplies: 150, scrap: 90, knowledge: 60 });
Object.assign(s.bld, { hydroFarm: 4, quarters: 3, scriptorium: 1 });
Object.assign(s.jobs, { scrapper: 2, farmer: 1, scribe: 2 });
s.serfs = 6; s.seen.serfs = true; s.tech.calendar = true; s.tech.hydroponics = true; s.time = 1375;
localStorage.setItem('gensaat', Engine.save(s));
location.reload();
```

- [ ] **Step 2: PC-Breite prüfen**

`resize_window` 1280 × 800, Screenshot. Erwartung: drei Spalten (Bestände | Reiter | Chronik), Kopfzeile mit Schädel, Rosenfenster, „0.375.013.M42 · Sturmzeit“, Buntglas-Band in Ordensfarbe, Karten mit Spitzbogen und Goldrand, graue Karten für Unbezahlbares, Hover über eine Gebäudekarte zeigt den Tooltip. Alle drei Reiter anklicken und je einen Screenshot machen.

- [ ] **Step 3: Handy prüfen**

`resize_window` Preset `mobile`, neu laden, Screenshot oben und nach Scrollen. Erwartung: eine Spalte, Klick-Knöpfe nebeneinander, Gebäude volle Breite, Reiterleiste waagrecht scrollbar, nichts läuft rechts über (`document.documentElement.scrollWidth <= innerWidth`), Info-Knopf öffnet das Info-Fenster.

- [ ] **Step 4: Orden-Farben prüfen**

Im Menü „Neu beginnen“ bestätigen, „White Scars“ wählen: Band, Wappen und aktiver Reiter elfenbein/rot, Text auf dem aktiven Reiter dunkel und lesbar. Danach wieder Ansicht `desktop`.

- [ ] **Step 5: Befunde beheben, Tests laufen lassen**

Gefundene Darstellungsfehler in `style.css`/`ui.js` beheben, Schritte 2–4 wiederholen, bis alles passt.
Run: `cd C:\Users\t.fritzen\gensaat && node test.js && node test.js tempo`
Expected: `alle 26 ok` und die Tempo-Tabelle im Ziel.
