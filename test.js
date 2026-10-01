// node test.js        Prüfungen der Spiellogik
// node test.js tempo  Tempo-Bot: wann fallen die Meilensteine?
const assert = require('assert');
const D = require('./js/data.js');
const E = require('./js/engine.js');

const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const near = (a, b, what) => assert.ok(Math.abs(a - b) < 1e-6, `${what}: ${a} statt ${b}`);
const byId = (list, id) => list.find(x => x.id === id);
// Dark Angels haben in Etappe 1 keine wirksamen Ordenswerte: neutraler Stand für die meisten Tests.
const fresh = (ch = 'da') => E.create(ch);
// Etappe 10: alle Mengen ×P (rules.popScale), Köpfe in Schüben zu P. Tests rechnen mit P statt mit festen Zahlen:
// „60 * P“ Schrott sind 60 alte Einheiten.
const P = D.rules.popScale;
const V = D.rules.saveVersion;                       // Spielstände ohne Umrechnung
const de = n => n.toLocaleString('de-DE');          // Zahl wie im Log
const fill = (n, v) => Array(n).fill(v);             // Würfelfolgen je Kopf
const heads = list => list.reduce((n, b) => n + b.n, 0);

test('Daten: jede verwiesene Id existiert', () => {
  const ids = list => {
    const set = new Set(list.map(x => x.id));
    assert.strictEqual(set.size, list.length, 'doppelte Id');
    return set;
  };
  const res = ids(D.resources), bld = ids(D.buildings), jobs = ids(D.jobs), tech = ids(D.techs), places = ids(D.places);
  ids(D.chapters);
  ids(D.clicks);
  ids(D.offices);
  const FREE = new Set(['serfs.cap', 'cap.bonus', 'arrival.bonus', 'moral.bonus', 'flee.slow', 'price.building',
    'implant.slots', 'marines.cap', 'training.speed', 'power.bonus', 'implant.bonus', 'implant.wulfen', 'mission.speed',
    'defense.flat', 'loot.bonus', 'loot.archeotech', 'mission.repeat', 'craft.bonus', 'loss.reduce', 'recover.bonus',
    'scout.speed', 'production.bonus', 'jobs.bonus', 'defense.bonus', 'litany.bonus', 'company.bonus', 'thirst',
    'vision.auto', 'trade.bonus', 'servitor.bonus', 'standing.bonus', 'threat.slow',
    'fleet.power', 'hangar.hawk', 'hangar.cruiser', 'campaign.speed', 'vision.bonus', 'serfs.capPct',
    'offline.days', 'vision.rate']);
  const checkEffects = (fx, where) => {
    for (const k in fx) {
      const [a, b] = k.split('.');
      const known = FREE.has(k) || (a === 'job' && jobs.has(b)) || (res.has(a) && ['rate', 'cap', 'capPct', 'bonus'].includes(b));
      assert.ok(known, `${where}: unbekannter Effekt ${k}`);
    }
  };
  for (const x of [...D.buildings, ...D.techs]) for (const r in x.cost) assert.ok(res.has(r), `${x.id}: Kosten ${r}`);
  for (const x of [...D.buildings, ...D.jobs, ...D.techs, ...D.chapters, ...D.offices, ...D.places]) {
    checkEffects(x.effects || {}, x.id);
  }
  for (const p of D.places) for (const r in p.reward || {}) assert.ok(res.has(r), `${p.id}: Beute ${r}`);
  ids(D.recipes);
  ids(D.upgrades);
  for (const r of D.recipes) {
    assert.ok(res.has(r.id) && byId(D.resources, r.id).crafted, `Rezept ${r.id}: keine hergestellte Ressource`);
    for (const c in r.cost) assert.ok(res.has(c), `Rezept ${r.id}: Kosten ${c}`);
  }
  for (const u of D.upgrades) {
    for (const c in u.cost) assert.ok(res.has(c), `${u.id}: Kosten ${c}`);
    checkEffects(u.effects, u.id);
    assert.ok(u.desc.length < 90, `${u.id}: Beschreibung zu lang`);
  }
  for (const r of D.resources) checkEffects({ ...r.perUnit, ...r.perUnitMax }, r.id);
  const rites = ids(D.rites);
  ids(D.litanies);
  for (const x of [...D.rites, ...D.litanies]) checkEffects(x.effects, x.id);
  for (const l of D.litanies) if (l.requires) assert.ok(rites.has(l.requires.rite), `${l.id}: Ritus`);
  for (const ch of D.chapters) {
    const events = D.chapterEvents[ch.id];
    assert.strictEqual(events?.length, 6, `${ch.id}: 6 Ordens-Ereignisse`);
    for (const ev of events) {
      assert.ok(ev.text.length <= 100, `${ch.id}: Ereignis zu lang: ${ev.text}`);
      assert.strictEqual(['gift', 'boon', 'thirst', 'sign', 'calm'].filter(k => k in ev).length, 1, `${ch.id}: genau eine Wirkung`);
      for (const r in ev.gift || {}) assert.ok(res.has(r), `${ch.id}: Geschenk ${r}`);
      checkEffects(ev.boon || {}, ch.id);
    }
  }
  ids(D.missions);
  for (const m of D.missions) {
    for (const r in { ...m.loot, ...m.lucky }) assert.ok(res.has(r), `${m.id}: Beute ${r}`);
    assert.ok(m.squad[0] >= 1 && m.squad[0] <= m.squad[1] && m.threat > 0 && m.time > 0, `${m.id}: Zahlen`);
  }
  const partners = ids(D.partners);
  for (const p of D.partners) {
    for (const r in p.give) assert.ok(res.has(r), `${p.id}: will ${r}`);
    for (const r in p.get) assert.ok(res.has(r) || r === 'serfs', `${p.id}: gibt ${r}`);
    checkEffects(p.help, p.id);
    assert.ok(p.desc.length < 90, `${p.id}: Beschreibung zu lang`);
  }
  ids(D.worldEvents);
  for (const w of D.worldEvents) checkEffects(w.effects || {}, w.id);
  ids(D.relics);
  for (const r of D.relics) {
    assert.ok(r.cost > 0 && r.desc.length < 90, `${r.id}: Kosten, Beschreibung`);
    checkEffects(r.effects || {}, r.id);
    const st = r.start || {};
    for (const k in st.res || {}) assert.ok(res.has(k), `${r.id}: Start ${k}`);
    for (const k in st.bld || {}) assert.ok(bld.has(k), `${r.id}: Start ${k}`);
    for (const k of st.tech || []) assert.ok(tech.has(k), `${r.id}: Start ${k}`);
    for (const k of st.places || []) assert.ok(places.has(k), `${r.id}: Start ${k}`);
  }
  ids(D.palettes);
  for (const p of D.palettes) assert.ok(['c1', 'c2', 'on', 'glow'].every(k => /^#[0-9a-f]{6}$/.test(p[k])), `${p.id}: Farben`);
  for (const ch of D.chapters) {
    assert.ok(ch.boost.length && ch.boost.every(k => k in ch.effects), `${ch.id}: boost`);
    assert.ok(ch.successors.length >= 3 && ch.successors.every(n => n.length <= D.rules.nameMax), `${ch.id}: Nachfolger`);
  }
  assert.ok(D.flair.length >= 10 && D.flair.every(t => t.length <= 100), 'Flair-Zeilen');
  ids(D.ships);
  for (const sh of D.ships) {
    for (const r in sh.cost) assert.ok(res.has(r), `${sh.id}: Kosten ${r}`);
    checkEffects(sh.effects, sh.id);
  }
  const systems = ids(D.systems);
  for (const sy of D.systems) {
    for (const n of sy.next) {
      assert.ok(systems.has(n), `${sy.id}: Nachbar ${n}`);
      assert.ok(D.systems.find(x => x.id === n).next.includes(sy.id), `${sy.id} ↔ ${n}`);
    }
    checkEffects(sy.effects || {}, sy.id);
    for (const r in sy.reward || {}) assert.ok(res.has(r), `${sy.id}: Beute ${r}`);
    assert.ok(sy.home || (sy.threat > 0 && sy.nav > 0 && sy.time > 0), `${sy.id}: Zahlen`);
  }
  for (const x of [...D.resources, ...D.buildings, ...D.jobs, ...D.techs, ...D.offices, ...D.places, ...D.missions,
    ...D.partners, ...D.worldEvents, ...D.ships, ...D.upgrades]) {
    for (const t of [].concat(x.requires?.tech || [])) assert.ok(tech.has(t), `${x.id}: Lehre ${t}`);
    for (const b of [].concat(x.requires?.building || [])) assert.ok(bld.has(b), `${x.id}: Gebäude ${b}`);
    for (const p of [].concat(x.requires?.place || [])) assert.ok(places.has(p), `${x.id}: Ort ${p}`);
    for (const p in x.requires?.standing || {}) assert.ok(partners.has(p), `${x.id}: Partner ${p}`);
  }
  for (const c of D.clicks) assert.ok(res.has(c.id), `Klick ${c.id}`);
  for (const season of D.rules.seasons) for (const r in season.mult) assert.ok(res.has(r), `${season.name}: ${r}`);
  for (const ch of D.chapters) {
    assert.ok(Object.values(ch.colors).every(c => /^#[0-9a-f]{6}$/.test(c)), `${ch.id}: Farben`);
    assert.ok(ch.names.length >= 6, `${ch.id}: Namen`);
  }
  for (const x of [...D.buildings, ...D.techs, ...D.places]) assert.ok(x.desc.length < 90, `${x.id}: Beschreibung zu lang`);
});

test('Neuer Stand: Orden, Start-Log, unbekannter Orden', () => {
  const s = fresh('um');
  assert.deepStrictEqual([s.chapter, s.serfs, s.res.scrap, s.bld.quarters], ['um', 0, 0, 0]);
  assert.match(s.log[0].text, /„Ehre von Macragge“ ist über Kharos Tertius zerschellt/);
  assert.strictEqual(s.log[1].text, `${de(5 * P)} Brüder liegen im Sus-an-Koma. Die Ruinen schweigen.`);
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
  s.time = 988 * 1000 + 5;
  assert.strictEqual(E.calendar(s).date, '0.005.000.M43');   // nach 999.M42 kommt 000.M43
  s.time = 1000;
  c = E.calendar(s);
  assert.deepStrictEqual([c.date, c.seasonName, c.year], ['0.000.013.M42', 'Sonnenzeit', 13]);
});

test('Preise steigen mit dem Faktor, White Scars zahlen 15 % mehr', () => {
  const s = fresh();
  s.res.scrap = 60 * P;
  assert.ok(E.build(s, 'quarters'));
  assert.ok(E.build(s, 'quarters'));
  near(s.res.scrap, (60 - 12 - 19.2) * P, 'bezahlt (12 + 19,2) × P');
  near(E.price(s, 'building', 'quarters').scrap, 30.72 * P, 'drittes Quartier');
  assert.strictEqual(E.serfCap(s), 4 * P);
  s.res.scrap = 60 * P;
  assert.strictEqual(E.build(s, 'storehouse'), false);   // bezahlbar, aber noch nicht erforscht
  const ws = fresh('ws');
  near(E.price(ws, 'building', 'hydroFarm').supplies, 11.5 * P, 'White Scars: 10 P × 1,15');
  near(E.price(ws, 'tech', 'calendar').knowledge, 15 * P, 'Lehren kosten gleich');
});

test('Ultramarines: Lager +20 %', () => {
  near(E.cap(fresh('um'), 'scrap'), 180 * P, 'Schrott-Lager 150 P × 1,2');
  near(E.cap(fresh(), 'scrap'), 150 * P, 'ohne Bonus');
});

test('Klicks: +P, nicht über das Lager, nur Klick-Rohstoffe', () => {
  const s = fresh();
  assert.ok(E.click(s, 'scrap'));
  assert.strictEqual(s.res.scrap, P);
  s.res.supplies = 200 * P;
  assert.strictEqual(E.click(s, 'supplies'), false);
  assert.strictEqual(E.click(s, 'knowledge'), false);
});

test('Lehren kosten Wissen und schalten frei; die erste kommt in den Liber Honoris', () => {
  const s = fresh();
  assert.strictEqual(E.isUnlocked(s, byId(D.techs, 'storage')), false);
  s.res.knowledge = 10 * P;
  assert.strictEqual(E.research(s, 'calendar'), false);   // zu wenig Wissen
  s.res.knowledge = 100 * P;
  assert.strictEqual(E.research(s, 'storage'), false);    // Kalender fehlt
  assert.ok(E.research(s, 'calendar'));
  near(s.res.knowledge, 85 * P, 'Wissen nach Kalender');
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
  s.res.scrap = 25 * P; s.res.supplies = 10 * P;
  assert.ok(E.build(s, 'scriptorium'));
  assert.ok(E.isUnlocked(s, byId(D.jobs, 'scribe')));
  assert.ok(E.isUnlocked(s, byId(D.resources, 'knowledge')));
  near(E.cap(s, 'knowledge'), 200 * P, 'Wissen-Lager (100 + 100) × P');
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
  assert.strictEqual(E.assign(s, 'scrapper', 0), false);      // 0 bewegt nichts
  assert.strictEqual(E.assign(s, 'scrapper', 0.5), false);    // nur ganze Köpfe
  s.tech.hydroponics = true;
  assert.strictEqual(E.assign(s, 'farmer', -1), false);       // niemand zum Abziehen
  assert.ok(E.assign(s, 'farmer', 1));
  assert.strictEqual(E.free(s), 0);
});

test('Produktion: Gebäude, Jobs, Essen, Planetenzeiten', () => {
  const s = fresh();
  s.bld.hydroFarm = 2; s.serfs = 2 * P; s.jobs.scrapper = P; s.res.supplies = 50 * P;
  near(E.rates(s).supplies, 0.65 * P, 'Sonnenzeit: (2 × 0,5 × 1,25 − 2 × 0,3) × P');
  near(E.rates(s).scrap, 0.3 * P, 'Schrott');
  E.step(s, 10);
  near(s.res.supplies, 56.5 * P, 'Vorräte nach 10 s');
  near(s.res.scrap, 3 * P, 'Schrott nach 10 s');
  s.time = 250;
  near(E.rates(s).scrap, 0.375 * P, 'Sturmzeit: Schrott × 1,25');
  near(E.rates(s).supplies, 0.4 * P, 'Sturmzeit: Vorräte × 1');
  s.time = 750;
  near(E.rates(s).supplies, (2 * 0.5 * 0.5 - 0.6) * P, 'Frostzeit: Vorräte × 0,5');
});

test('Lager deckelt, Klick am Limit geht nicht', () => {
  const s = fresh();
  s.res.scrap = 149.5 * P; s.res.supplies = 100 * P; s.serfs = P; s.jobs.scrapper = P;
  E.step(s, 10);
  near(s.res.scrap, 150 * P, 'Schrott am Limit');
  near(s.res.supplies, 97 * P, 'P Knechte essen je 0,3/s');
  assert.strictEqual(E.click(s, 'scrap'), false);
  assert.ok(E.click(s, 'supplies'));
  near(s.res.supplies, 98 * P, 'P Vorräte geborgen');
});

test('Schreiber mit Skriptorium, Bauer in der Sonnenzeit', () => {
  const s = fresh();
  s.seen.serfs = true; s.tech.hydroponics = true; s.serfs = 2 * P; s.res.scrap = 25 * P; s.res.supplies = 50 * P;
  assert.ok(E.build(s, 'scriptorium'));
  assert.ok(E.assign(s, 'scribe', P));
  near(E.rates(s).knowledge, 0.15 * 1.05 * P, 'Schreiber +5 % durch das Skriptorium');
  const before = E.rates(s).supplies;
  assert.ok(E.assign(s, 'farmer', P));
  near(E.rates(s).supplies - before, 1.25 * P, 'Bauern wirken sofort (× 1,25)');
});

test('Zuzug: der erste Schub kommt immer, danach stetig, solange die Vorräte reichen', () => {
  const s = fresh();
  s.bld.quarters = 2; s.res.supplies = 100 * P;
  E.step(s, 20);
  assert.strictEqual(s.serfs, P);                            // der erste Schub auf einmal, auch ohne Farm
  assert.match(s.log.at(-1).text, /Überlebende/);
  assert.strictEqual(s.meta.honors.at(-1).text, 'Die ersten Knechte schließen sich dem Orden an.');
  E.step(s, 40);
  assert.strictEqual(s.serfs, P);                            // ohne Überschuss keine weiteren
  assert.strictEqual(E.arrivalBlock(s), 'food');
  s.res.scrap = 30 * P;
  assert.ok(E.build(s, 'hydroFarm'));                        // Sonnenzeit 0,625 P/s, P essen 0,3 P
  assert.strictEqual(E.arrivalBlock(s), null);
  E.step(s, 20);
  assert.strictEqual(s.serfs, 2 * P);                        // P je 20 s (5/s bei P = 100)
  assert.match(s.log.at(-1).text, /Überlebende/);            // das Log fasst zusammen, noch keine Zeile
  E.step(s, 60);
  const full = Math.floor(0.625 * P / D.rules.serfFood + 1e-9);   // nur so viele, wie satt werden
  assert.strictEqual(s.serfs, full);
  assert.strictEqual(E.arrivalBlock(s), 'food');
  assert.strictEqual(s.isHungry, false);
  assert.strictEqual(s.log.at(-1).text, `+${de(full - P)} Knechte ziehen ein.`);   // eine Zeile, wenn der Zuzug stockt
});

test('Zuzug: in der Frostzeit kommt niemand', () => {
  const s = fresh();
  s.bld.quarters = 2; s.bld.hydroFarm = 10; s.res.supplies = 100 * P;
  s.time = 750;
  assert.strictEqual(E.arrivalBlock(s), 'frost');
  E.step(s, 240);
  assert.strictEqual(s.serfs, 0);
  E.step(s, 30);                                             // ab 1.000 wieder Sonnenzeit
  assert.strictEqual(s.serfs, P);                            // der erste Schub nach 20 s
});

test('Ultramarines: Knechte kommen 10 % schneller', () => {
  const um = fresh('um');
  um.bld.quarters = 2; um.res.supplies = 100 * P;
  E.step(um, 18.2);
  assert.strictEqual(um.serfs, P);                           // 20 s ÷ 1,1 ≈ 18,18 s
  const da = fresh();
  da.bld.quarters = 2; da.res.supplies = 100 * P;
  E.step(da, 18.2);
  assert.strictEqual(da.serfs, 0);
});

test('Hunger: Moral −30 % (nicht für Bauern), nach 30 s flieht einer', () => {
  const s = fresh();
  s.tech.hydroponics = true; s.bld.quarters = 1; s.serfs = 2 * P; s.jobs.scrapper = P; s.jobs.farmer = P;
  s.time = 750;                                              // Frostzeit: Bauern 0,5/s, 2 P essen 0,6
  E.step(s, 1);
  assert.strictEqual(s.isHungry, true);
  near(E.moral(s), 0.7, 'Moral hungrig');
  near(E.rates(s).scrap, 0.3 * 0.7 * P, 'Schrottsammler gebremst');
  near(E.rates(s).supplies, (0.5 - 0.6) * P, 'Bauer ungebremst');
  E.step(s, 29);
  assert.strictEqual(s.serfs, P);                            // P Knechte fliehen auf einmal
  assert.deepStrictEqual([s.jobs.scrapper, s.jobs.farmer], [0, P]);   // Bauern zuletzt
  assert.strictEqual(s.log.at(-1).text, `${de(P)} Knechte fliehen in die Wüste. Die Vorräte reichten nicht.`);
});

test('Hunger: eine satte Pause setzt die Frist zurück', () => {
  const s = fresh();
  s.serfs = 2 * P;
  E.step(s, 20);
  s.res.supplies = 20 * P; E.step(s, 10);
  s.res.supplies = 0; E.step(s, 20);
  assert.strictEqual(s.serfs, 2 * P);                        // nie 30 s am Stück hungrig
});

test('Salamanders: Moral +15 %, Knechte fliehen erst nach 60 s', () => {
  const s = fresh('sal');
  s.serfs = 2 * P; s.jobs.scrapper = 2 * P;
  near(E.moral(s), 1.15, 'Beschützer');
  E.step(s, 59);
  assert.strictEqual(s.serfs, 2 * P);
  E.step(s, 1);
  assert.strictEqual(s.serfs, P);
});

test('Moral: Gedränge über 20 × P Knechte bremst die Jobs', () => {
  const s = fresh();
  s.serfs = 30 * P; s.jobs.scrapper = P;
  near(E.moral(s), 0.95, 'Gedränge (30 P Knechte): je P über 20 P −0,5 %');
  near(E.rates(s).scrap, 0.3 * 0.95 * P, 'Schrott × 0,95');
});

test('Zeit bis bezahlbar', () => {
  const s = fresh();
  s.bld.hydroFarm = 2;                                       // Sonnenzeit: 1,25 Vorräte/s
  assert.strictEqual(E.eta(s, { supplies: 0 }), 0);
  near(E.eta(s, { supplies: 15 * P }), 12, 'Sekunden bis 15 P Vorräte');
  assert.strictEqual(E.eta(s, { supplies: 500 * P }), Infinity); // Lager zu klein
  assert.strictEqual(E.eta(s, { scrap: 5 * P }), Infinity);      // kein Ertrag
  const hungry = fresh();
  hungry.serfs = 2 * P;
  assert.strictEqual(E.eta(hungry, { supplies: 10 * P }), Infinity);
  hungry.res.scrap = 10 * P;
  assert.strictEqual(E.eta(hungry, { scrap: 5 * P }), 0);
});

test('Speichern und Laden', () => {
  const s = fresh('ws');
  s.res.supplies = 12.5 * P; s.bld.hydroFarm = 3; s.serfs = 2 * P; s.jobs.scrapper = P; s.tech.calendar = true; s.seen.serfs = true;
  s.time = 1234.5; s.savedAt = 1790000000000; s.arrival = 7; s.hungry = 12; s.isHungry = true;
  E.honor(s, 'Test-Ehre');
  assert.strictEqual(E.save(E.load(E.save(s))), E.save(s));   // jedes Feld kommt zurück
  const old = E.load(JSON.stringify({ v: V, chapter: 'um', res: { supplies: 5 * P } }));
  assert.deepStrictEqual([old.res.supplies, old.bld.quarters, old.chapter], [5 * P, 0, 'um']);
  assert.throws(() => E.load('{"hallo":1}'));
  assert.throws(() => E.load(JSON.stringify({ v: 1, chapter: 'orks' })));
  assert.throws(() => E.load('kaputt'));
  const odd = E.load(JSON.stringify({ v: V, chapter: 'da', serfs: 1, jobs: { scrapper: 5 }, res: { supplies: 1e9 } }));
  assert.strictEqual(E.free(odd), 0);
  assert.strictEqual(odd.res.supplies, 200 * P);
  const huge = E.load(JSON.stringify({ v: V, chapter: 'da', serfs: 1, jobs: { scrapper: 1e300 } }));   // darf nicht hängen
  assert.strictEqual(E.free(huge), 0);
  const long = fresh();
  for (let i = 0; i < 150; i++) E.log(long, 'Zeile ' + i);
  assert.deepStrictEqual([long.log.length, long.log[0].text], [D.rules.logMax, 'Zeile 50']);   // älteste fallen raus
  const wild = E.load(JSON.stringify({ v: V, chapter: 'da', time: 1e300, arrival: 1e9, hungry: 1e9,
    meta: { honors: [{ date: 1, chapter: 'x', text: 'kaputt' }, { date: 'd', chapter: 'c', text: 't' }] } }));
  assert.ok(wild.time <= 1e10 && wild.arrival <= D.rules.arrivalEvery * P && wild.hungry <= D.rules.fleeAfter);
  assert.deepStrictEqual(wild.meta.honors, [{ date: 'd', chapter: 'c', text: 't' }]);
});

test('Laden rechnet Lager mit den geladenen Gebäuden', () => {
  const s = E.load(JSON.stringify({ v: V, chapter: 'da', bld: { storehouse: 1 }, res: { supplies: 340 * P } }));
  assert.strictEqual(s.res.supplies, 340 * P);               // (200 + 150) × P Lager
});

test('Unbekannte Namen tun nichts', () => {
  const s = fresh();
  s.res.supplies = s.res.scrap = s.res.knowledge = 50 * P; s.serfs = P;
  const before = E.save(s);
  for (const id of ['constructor', 'toString', '__proto__', 'nope']) {
    assert.strictEqual(E.build(s, id) || E.research(s, id) || E.assign(s, id, 1) || E.click(s, id)
      || E.scout(s, id) || E.setOffice(s, id, 1), false, id);
  }
  assert.strictEqual(E.save(s), before);
});

test('Offline: simulate wie viele step(1), höchstens 3 Tage', () => {
  const setup = () => {
    const s = fresh();
    s.bld.hydroFarm = 4; s.bld.quarters = 3; s.res.supplies = 50 * P; s.res.scrap = 5 * P;
    return s;
  };
  const a = setup(), b = setup();
  const sum = E.simulate(a, 3600);
  for (let i = 0; i < 3600; i++) E.step(b, 1);
  // Flair-Zeilen gibt es nur beim Zuschauen, nicht beim Nachholen: ohne sie muss alles gleich sein
  const same = x => {
    const o = JSON.parse(E.save(x));
    o.log = o.log.map(l => l.text).filter(t => !D.flair.includes(t));
    delete o.logSeq; delete o.flairIn;
    return JSON.stringify(o);
  };
  assert.strictEqual(same(a), same(b));
  assert.strictEqual(sum.seconds, 3600);
  assert.strictEqual(sum.serfs, a.serfs);
  const c = setup();
  assert.strictEqual(E.simulate(c, 10 * 86400).seconds, D.rules.offlineMax);
  assert.strictEqual(c.time, D.rules.offlineMax);
  assert.strictEqual(E.simulate(fresh(), NaN).seconds, 0);
});

test('8 Std. offline: eine gut versorgte Festung übersteht jede Frostzeit', () => {
  const s = fresh();
  s.tech.hydroponics = true; s.seen.serfs = true; s.res.supplies = 200 * P;
  s.bld.quarters = 5; s.bld.hydroFarm = 10; s.serfs = 6 * P; s.jobs.farmer = 4 * P; s.jobs.scrapper = 2 * P;
  const lines = s.logSeq;
  E.simulate(s, 8 * 3600);
  assert.deepStrictEqual([s.serfs, s.jobs.farmer, s.jobs.scrapper, s.isHungry], [10 * P, 4 * P, 2 * P, false]);
  assert.ok(s.logSeq - lines <= 5, `${s.logSeq - lines} neue Log-Zeilen`);
});

// ---------- Etappe 2: Marines ----------

// Stand mit geweckten Brüdern: Sus-an-Studien erforscht, ein Apothecarion gebaut.
function awake(ch = 'da') {
  const s = fresh(ch);
  Object.assign(s.tech, { storage: true, salvage: true, susan: true });
  s.res.scrap = 200 * P; s.res.supplies = 200 * P;          // White Scars zahlen 172,5 P Schrott
  assert.ok(E.build(s, 'apothecarion'));
  return s;
}

// Bereit zur Implantation: Zellentrakt und Arena stehen, P Aspiranten und P Gensaat liegen bereit (ein Schub).
// Die fünf Brüder sind weggerechnet, damit keine Gensaat nachreift und der Zufall genau steuerbar bleibt.
function ready(ch = 'da') {
  const s = awake(ch);
  Object.assign(s.tech, { geneseedlore: true, cellcraft: true, trials: true });
  Object.assign(s.places, { orevein: true, tribes: true });
  s.res.scrap = 300 * P; s.res.ore = 200 * P; s.res.supplies = 200 * P;
  s.bld.hydroFarm = 20;                                     // auch im Frost genug für neue Brüder (Effekte rechnet build neu)
  assert.ok(E.build(s, 'cells') && E.build(s, 'arena'));
  s.marines.brothers = 0;
  s.res.aspirants = P; s.res.geneseed = P;
  return s;
}

// Zufall aus einer festen Liste, danach 0,5; hinterher wieder der alte Zufall.
function withRng(values, fn) {
  const old = E.rng;
  let i = 0;
  E.rng = () => (i < values.length ? values[i++] : 0.5);
  try { fn(); } finally { E.rng = old; }
}

test('Brüder erwachen mit dem ersten Apothecarion', () => {
  const s = fresh();
  Object.assign(s.tech, { storage: true, salvage: true, susan: true });
  s.res.scrap = 400 * P; s.res.supplies = 250 * P;
  assert.deepStrictEqual([s.marines.coma, s.marines.brothers], [5 * P, 0]);
  near(E.rates(s).supplies, 0, 'im Koma essen sie nichts');
  assert.ok(E.build(s, 'apothecarion'));
  assert.deepStrictEqual([s.marines.coma, s.marines.brothers], [0, 5 * P]);
  assert.ok(s.log.at(-1).text.includes(`${de(5 * P)} Brüder öffnen die Augen`));
  assert.strictEqual(s.meta.honors.at(-1).text, 'Die Brüder erwachen aus dem Sus-an-Koma.');
  near(E.rates(s).supplies, -5 * 0.4 * P, '5 P Brüder essen je 0,4/s');
  assert.ok(E.build(s, 'apothecarion'));
  assert.strictEqual(s.marines.brothers, 5 * P);             // nur das erste weckt
  assert.deepStrictEqual([E.marineCap(s), E.marinesUsed(s), E.freeBrothers(s)], [5 * P, 5 * P, 5 * P]);
});

test('Aufklärung: Absturzstelle bringt Gensaat und Schrott, der Trupp kommt zurück', () => {
  const s = awake();
  s.res.scrap = 0; s.res.geneseed = 3 * P;
  assert.strictEqual(E.placeState(s, 'crashsite'), 'open');
  assert.ok(E.scout(s, 'crashsite'));
  assert.strictEqual(E.scout(s, 'crashsite'), false);        // schon unterwegs
  assert.deepStrictEqual([E.placeState(s, 'crashsite'), E.freeBrothers(s)], ['away', 4 * P]);   // ein Trupp aus P
  E.step(s, 59);
  assert.strictEqual(E.placeState(s, 'crashsite'), 'away');
  E.step(s, 1);
  assert.deepStrictEqual([E.placeState(s, 'crashsite'), E.freeBrothers(s)], ['done', 5 * P]);
  near(s.res.geneseed, 6 * P, 'Gensaat aus der Kammer, Lager 3 P + 3 P gedeckelt');
  near(s.res.scrap, 40 * P, 'Schrott aus dem Wrack');
  assert.strictEqual(E.scout(s, 'crashsite'), false);        // schon entdeckt
  assert.match(s.log.at(-1).text, /Absturzstelle entdeckt/);
  assert.strictEqual(s.meta.honors.at(-1).text, 'Ort entdeckt: Absturzstelle.');
});

test('Aufklärung braucht einen freien Bruder; White Scars schneller, Sturmzeit langsamer', () => {
  const none = fresh();
  none.tech.susan = true;
  assert.strictEqual(E.scout(none, 'crashsite'), false);     // alle im Koma
  const ws = awake('ws');
  assert.ok(E.scout(ws, 'crashsite'));
  near(ws.scouts[0].left, 60 * 0.7, 'White Scars −30 %');
  const storm = awake();
  storm.time = 250;
  assert.ok(E.scout(storm, 'orevein'));
  near(storm.scouts[0].left, 180 * 1.25, 'Sturmzeit +25 %');
});

test('Orte: entdeckte und die nächsten zwei sind sichtbar, der Rest nicht', () => {
  const s = awake();
  const states = () => ['crashsite', 'orevein', 'tribes', 'ashwaste'].map(id => E.placeState(s, id));
  assert.deepStrictEqual(states(), ['open', 'open', 'hidden', 'hidden']);
  assert.strictEqual(E.scout(s, 'tribes'), false);           // noch verborgen
  s.places.crashsite = true;
  assert.deepStrictEqual(states(), ['done', 'open', 'open', 'hidden']);   // Aschewüste braucht Kampfdoktrin
  s.places.orevein = true; s.tech.doctrine = true;
  assert.deepStrictEqual(states(), ['done', 'done', 'open', 'open']);
});

test('Orte schalten frei: Mine und Erz nach der Erzader, Zuzug +10 % nach dem Stammesland', () => {
  const s = awake();
  assert.strictEqual(E.isUnlocked(s, byId(D.buildings, 'mine')), false);
  assert.strictEqual(E.isUnlocked(s, byId(D.resources, 'ore')), false);
  assert.ok(E.scout(s, 'orevein'));
  E.step(s, 180);
  assert.ok(E.isUnlocked(s, byId(D.buildings, 'mine')));
  assert.ok(E.isUnlocked(s, byId(D.resources, 'ore')));
  assert.ok(E.isUnlocked(s, byId(D.techs, 'cellcraft')));
  const t = awake();
  t.places.crashsite = true;                                 // damit das Stammesland sichtbar ist
  assert.ok(E.scout(t, 'tribes'));
  E.step(t, 300);
  near(E.effects(t)['arrival.bonus'] || 0, 0.1, 'Zuzug +10 %');
});

test('Prüfungsarena: Aspiranten kommen langsam, Lager 2 je Arena, sie essen 0,3/s', () => {
  const s = awake();
  s.tech.trials = true; s.res.scrap = 200 * P; s.res.ore = 100 * P; s.res.supplies = 200 * P;
  assert.ok(E.build(s, 'arena'));
  near(E.rates(s).aspirants, 0.001 * P, 'Aspiranten je Sekunde');
  near(E.cap(s, 'aspirants'), 2 * P, 'Lager 2 P');
  s.res.aspirants = P;
  near(E.rates(s).supplies, (-5 * 0.4 - 0.3) * P, 'Brüder und P Aspiranten essen');
  const um = awake('um');
  um.tech.trials = true; um.res.scrap = 200 * P; um.res.ore = 100 * P;
  assert.ok(E.build(um, 'arena'));
  near(E.cap(um, 'aspirants'), 2 * P, 'Ultramarines: kein Lagerbonus auf Aspiranten');
});

test('Implantation: ein Schub aus P, Erfolg ergibt Neophyten, nach 900 s Kampfbrüder', () => {
  const s = ready();
  withRng(fill(P, 0.1), () => {
    E.step(s, 1);
    assert.deepStrictEqual([s.marines.implants, s.res.aspirants < 1, s.res.geneseed < 1], [[{ n: P, left: 300 }], true, true]);
    E.step(s, 300);
  });
  assert.deepStrictEqual([s.marines.implants.length, s.marines.neophytes], [0, [{ n: P, left: 899 }]]);   // ein Tick läuft schon
  assert.strictEqual(s.log.at(-1).text, `Implantation: ${de(P)} Neophyten.`);
  assert.ok(s.meta.honors.some(h => h.text === 'Die ersten eigenen Neophyten.'));
  E.step(s, 900);
  assert.deepStrictEqual([s.marines.neophytes.length, s.marines.brothers], [0, P]);
  assert.strictEqual(s.log.at(-1).text, `${de(P)} Neophyten legen die Servorüstung an. Neue Kampfbrüder.`);
});

test('Implantation: Fehlschlag ergibt Servitor oder Tod, bei Space Wolves auch Wulfen', () => {
  const outcome = (ch, rolls) => {
    const s = ready(ch);
    withRng(rolls, () => E.step(s, 301));
    return [heads(s.marines.neophytes), s.marines.servitors, s.marines.wulfen, s.log.at(-1).text];
  };
  const servitor = outcome('da', [...fill(P, 0.9), ...fill(P, 0.2)]);   // alle scheitern, dann Servitoren
  assert.deepStrictEqual(servitor, [0, P, 0, `Implantation: 0 Neophyten, ${de(P)} Servitoren.`]);
  const dead = outcome('da', [...fill(P, 0.9), ...fill(P, 0.7)]);       // alle scheitern, dann Tod
  assert.deepStrictEqual(dead, [0, 0, 0, `Implantation: 0 Neophyten, ${de(P)} tot.`]);
  const wulf = outcome('sw', [...fill(P, 0.7), ...fill(P, 0.3)]);       // Space Wolves: 0,7 ≥ 65 %, dann Wulfen
  assert.deepStrictEqual(wulf, [0, 0, P, `Implantation: 0 Neophyten, ${de(P)} Wulfen.`]);
  const mixed = outcome('da', [...fill(P / 2, 0.7), ...fill(P / 2, 0.9), ...fill(P / 4, 0.2), ...fill(P / 4, 0.7)]);
  assert.deepStrictEqual(mixed.slice(0, 3), [P / 2, P / 4, 0]);         // je Kopf gewürfelt, Summe = P
});

test('Implantation braucht Lehre, Aspirant, Gensaat, Implantationsplatz und Brüder-Platz', () => {
  const s = ready();
  s.tech.geneseedlore = false;
  assert.strictEqual(E.implantBlock(s), 'lore');
  s.tech.geneseedlore = true;
  assert.strictEqual(E.implantBlock(s), null);
  s.res.aspirants = P - 1;
  assert.strictEqual(E.implantBlock(s), 'aspirant');         // ein Schub braucht P
  s.res.aspirants = P; s.res.geneseed = P / 2;
  assert.strictEqual(E.implantBlock(s), 'geneseed');
  s.res.geneseed = 2 * P; s.marines.implants = [{ n: P, left: 100 }];
  assert.strictEqual(E.implantBlock(s), 'slot');             // ein Apothecarion = ein Platz
  s.marines.implants = []; s.marines.brothers = 9 * P + 1;   // Wrack 5 P + Zellentrakt 5 P: kein Platz mehr für P
  assert.strictEqual(E.implantBlock(s), 'cells');
  s.marines.brothers = 9 * P;
  assert.strictEqual(E.implantBlock(s), null);
});

test('Implantation wartet, solange die Vorräte auch im Frost keinen weiteren Bruder ernähren', () => {
  const s = ready();
  s.marines.brothers = 3 * P; s.bld.hydroFarm = 0; s._eff = null; // essen 1,2 P/s, keine Farm
  assert.strictEqual(E.implantBlock(s), 'food');
  s.bld.hydroFarm = 7; s._eff = null;                        // Frost: (7 × 0,5 × 0,5 = 1,75 − 1,2 − 0,3) P = 0,25 P < 0,4 P
  assert.strictEqual(E.implantBlock(s), 'food');
  near(E.leanFood(s), 0.25 * P, 'Überschuss im Frost');
  s.bld.hydroFarm = 8; s._eff = null;                        // (2 − 1,5) P = 0,5 P ≥ 0,4 P (P Brüder)
  assert.strictEqual(E.implantBlock(s), null);
});

test('Apothecarius macht Implantationen schneller und sicherer, Übungskäfige die Ausbildung', () => {
  const s = ready();
  s.marines.brothers = 2 * P;
  assert.ok(E.setOffice(s, 'apothecary', P));
  withRng(fill(P, 0.8), () => E.step(s, 1 + 240));          // 300 s × 0,8 = 240 s; 0,8 < 85 %: alle Erfolg
  assert.deepStrictEqual([s.marines.implants.length, heads(s.marines.neophytes)], [0, P]);
  s.tech.drill = true; s.res.ore = 1000 * P; s.res.scrap = 1000 * P;
  for (let i = 0; i < 6; i++) assert.ok(E.build(s, 'cages'), `Käfig ${i + 1}`);
  E.step(s, 450);                                            // höchstens −50 %: 900 s × 0,5
  assert.deepStrictEqual([s.marines.neophytes.length, s.marines.brothers], [0, 3 * P]);
});

test('Gensaat reift in Kampfbrüdern, bei Salamanders langsamer', () => {
  near(E.rates(awake()).geneseed, 5 * P * 0.0005, '5 P Brüder');
  near(E.rates(awake('sal')).geneseed, 5 * P * 0.0005 * 0.75, 'Salamanders −25 %');
});

test('Servitoren sammeln Schrott und essen nichts', () => {
  const s = fresh();
  s.marines.servitors = 2 * P;
  near(E.rates(s).scrap, 2 * 0.15 * P, 'Schrott');
  near(E.rates(s).supplies, 0, 'essen nichts');
});

test('Ämter: nur mit freien Brüdern; Scriptor bringt Wissen; Runenpriester bei Space Wolves', () => {
  const s = awake();
  assert.strictEqual(E.setOffice(s, 'scriptor', 1), false);  // Librarius fehlt
  s.tech.librarius = true;
  for (let i = 0; i < 5; i++) assert.ok(E.setOffice(s, 'scriptor', P));
  assert.strictEqual(E.setOffice(s, 'scriptor', 1), false);  // keiner mehr frei
  assert.strictEqual(E.freeBrothers(s), 0);
  assert.strictEqual(E.scout(s, 'crashsite'), false);
  near(E.rates(s).knowledge, 5 * 0.5 * P, '5 P Scriptoren');
  assert.ok(E.setOffice(s, 'scriptor', -P));
  assert.strictEqual(E.setOffice(s, 'scriptor', 0), false);
  assert.strictEqual(E.officeName(awake('sw'), 'scriptor'), 'Runenpriester');
  assert.strictEqual(E.officeName(s, 'scriptor'), 'Scriptor');
});

test('Speichern und Laden mit Marines, Import-Schutz', () => {
  const s = ready();
  Object.assign(s.marines, { neophytes: [{ n: P, left: 400.5 }], implants: [{ n: P, left: 12 }], servitors: 2 * P, wulfen: P,
    brothers: 4 * P });
  s.offices.apothecary = P; s.scouts = [{ place: 'crashsite', left: 30 }];
  s.res.scrap = 100 * P;                                     // unter dem Lager, sonst deckelt das Laden
  assert.strictEqual(E.save(E.load(E.save(s))), E.save(s));
  const bad = E.load(JSON.stringify({ v: V, chapter: 'da',
    marines: { coma: 2 * P, brothers: 3 * P, neophytes: [{ n: P, left: 5 }, 'x', { n: -1, left: 5 }, { n: P, left: 1e9 }, { n: 0, left: 1 }],
      implants: 'kaputt', servitors: -4 },
    offices: { apothecary: 9 * P, scriptor: P },
    scouts: [{ place: 'nope', left: 5 }, { place: 'orevein', left: 1e12 }, { place: 'orevein', left: 3 }],
    places: { crashsite: true, nope: true } }));
  assert.deepStrictEqual(bad.marines, { coma: 2 * P, brothers: 3 * P, neophytes: [{ n: P, left: 5 }, { n: P, left: 900 }],
    implants: [], servitors: 0, wulfen: 0 });
  assert.deepStrictEqual(bad.scouts, [{ place: 'orevein', left: 225 }]);
  assert.deepStrictEqual(bad.offices, { apothecary: 2 * P, scriptor: 0, priest: 0, techmarine: 0 });   // 3 P − P unterwegs
  assert.deepStrictEqual(bad.places, { crashsite: true });
});

// ---------- Etappe 3: Kampf ----------

// Kampfbereit: Kampfdoktrin und Waffenkunde, Aschewüste entdeckt, 10 P freie Brüder.
function armed(ch = 'da') {
  const s = awake(ch);
  Object.assign(s.tech, { geneseedlore: true, drill: true, doctrine: true, weaponlore: true });
  Object.assign(s.places, { crashsite: true, orevein: true, tribes: true, ashwaste: true });
  s._eff = null;                                             // Orte geändert: Effekte neu rechnen
  s.marines.brothers = 10 * P;
  s.res.supplies = 200 * P;
  return s;
}

test('Kampf: Chance aus Stärke und Bedrohung, Kampfkraft mit Boni', () => {
  const s = armed();
  near(E.power(s, 3 * P, 0), 30 * P, '3 P Brüder');
  near(E.power(s, P, P), 30 * P, 'P Brüder und P Wulfen');
  near(E.chance(s, 'raiders', 3 * P), 0.5, 'r = 1');
  near(E.chance(s, 'raiders', 6 * P), 0.9, 'r = 2');
  near(E.chance(s, 'groxhunt', P), 0.1, 'r = 0,5');
  near(E.chance(s, 'groxhunt', 10 * P), 0.95, 'höchstens 95 %');
  near(E.chance(s, 'orkcamp', P), 0.05, 'mindestens 5 %');
  near(E.power(armed('ba'), 3 * P, 0), 36 * P, 'Blood Angels +20 %');
});

test('Entsenden: Lehre und Ort nötig, Truppgröße im Rahmen, Wulfen zuerst, je Einsatz ein Trupp', () => {
  const s = armed();
  assert.strictEqual(E.sendMission(s, 'raiders', 3 * P - 1), false);   // zu klein
  assert.strictEqual(E.sendMission(s, 'raiders', 5 * P + 1), false);   // zu groß
  assert.strictEqual(E.sendMission(s, 'nope', 3 * P), false);
  s.marines.wulfen = P;
  assert.ok(E.sendMission(s, 'raiders', 3 * P));
  assert.deepStrictEqual(s.missions[0], { id: 'raiders', brothers: 2 * P, wulfen: P, left: 240 });
  assert.strictEqual(E.sendMission(s, 'raiders', 3 * P), false);   // schon unterwegs
  assert.deepStrictEqual([E.freeBrothers(s), E.freeWulfen(s)], [8 * P, 0]);
  assert.ok(E.sendMission(s, 'groxhunt', 3 * P));
  assert.strictEqual(E.freeBrothers(s), 5 * P);
  const locked = awake();
  locked.marines.brothers = 10 * P;
  assert.strictEqual(E.sendMission(locked, 'groxhunt', 2 * P), false);   // Kampfdoktrin fehlt
  const few = armed();
  few.marines.brothers = 2 * P;
  assert.strictEqual(E.sendMission(few, 'raiders', 3 * P), false);         // zu wenig freie Kämpfer
});

test('Einsatz gewonnen: Beute, Ruhm, weniger Bedrohung, alle kommen zurück', () => {
  const s = armed();
  s.threat = 50 * P;
  assert.ok(E.sendMission(s, 'raiders', 5 * P));                      // r = 50/30: Chance ≈ 79 %
  withRng([0.1, ...fill(5 * P, 0.9)], () => E.step(s, 240));          // Sieg, niemand fällt
  assert.deepStrictEqual([s.missions.length, E.freeBrothers(s), s.marines.brothers], [0, 10 * P, 10 * P]);
  near(s.res.scrap, (50 + 60) * P, 'Schrott');
  near(s.res.renown, 5 * P, 'Ruhm');
  near(s.threat, (50 + 240 * 0.01 - 10) * P, 'Bedrohung sinkt');
  assert.strictEqual(s.log.at(-1).text, `Sieg: Ork-Plünderer vertreiben. +${de(60 * P)} Schrott, +${de(5 * P)} Ruhm.`);
  assert.ok(s.meta.honors.some(h => h.text === 'Erster Kampfeinsatz: Ork-Plünderer vertreiben.'));
});

test('Verluste: Gensaat-Bergung mit Apothecarius; Fehlschlag ohne Beute', () => {
  const s = armed();
  assert.ok(E.setOffice(s, 'apothecary', P));
  const scrap = s.res.scrap;
  assert.ok(E.sendMission(s, 'orkcamp', 5 * P));                      // r = 50/120: Chance 5 %
  // Niederlage (Verlust 50 %): P fallen, 4 P überleben; Bergung 60 %: die Hälfte der Gefallenen
  withRng([0.5, ...fill(P, 0.1), ...fill(4 * P, 0.9), ...fill(P / 2, 0.3), ...fill(P / 2, 0.7)], () => E.step(s, 1200));
  assert.strictEqual(s.marines.brothers, 9 * P);
  near(s.res.scrap, scrap, 'keine Beute');
  const lines = s.log.slice(-2).map(l => l.text);
  assert.match(lines[0], /^Rückzug: Ork-Lager zerschlagen/);
  assert.strictEqual(lines[1], `Gefallen: ${de(P)} Brüder. Gensaat geborgen: ${de(P / 2)}.`);
  assert.ok(s.meta.honors.some(h => h.text === 'Die ersten Brüder fallen im Kampf.'));
});

test('Beute: Space Wolves +25 %, Dark Angels Archäotech +50 %', () => {
  const sw = armed('sw');
  assert.ok(E.sendMission(sw, 'groxhunt', 3 * P));
  withRng([0.1, ...fill(3 * P, 0.9)], () => E.step(sw, 300));
  near(sw.res.grox, 12.5 * P, 'Grox × 1,25');
  const da = armed('da');
  assert.ok(E.sendMission(da, 'wreckfields', 5 * P));
  withRng([0.1, 0.05, ...fill(5 * P, 0.9)], () => E.step(da, 600));   // Sieg, Glücksfund, niemand fällt
  near(da.res.archeotech, 1.5 * P, 'Archäotech × 1,5');
  assert.ok(E.isUnlocked(da, byId(D.resources, 'archeotech')));
});

test('Einsatzbefehl: der Trupp zieht nach der Rückkehr wieder los; ohne Einsatzplanung nur White Scars', () => {
  const s = armed();
  assert.strictEqual(E.setOrder(s, 'groxhunt', 2 * P), false);        // Einsatzplanung fehlt
  s.tech.planning = true;
  assert.strictEqual(E.setOrder(s, 'groxhunt', 9 * P), false);        // Truppgröße außerhalb des Rahmens
  assert.ok(E.setOrder(s, 'groxhunt', 2 * P));
  E.step(s, 1);                                                       // der Befehl schickt den Trupp gleich los
  assert.strictEqual(s.missions.length, 1);
  withRng([0.1, ...fill(2 * P, 0.9)], () => E.step(s, 300));
  assert.strictEqual(s.missions.length, 1);                           // nach der Rückkehr wieder unterwegs
  assert.ok(E.setOrder(s, 'groxhunt', 0));                            // Befehl aufheben
  assert.deepStrictEqual(s.orders, {});
  assert.ok(E.setOrder(armed('ws'), 'groxhunt', 2 * P));              // White Scars ab Start
});

test('Bedrohung wächst ab der Aschewüste; Überfall alle 300 s, wenn sie die Verteidigung übersteigt', () => {
  const s = armed();
  s.marines.brothers = 0;
  s.res.supplies = 100 * P; s.res.scrap = 100 * P; s.res.ore = 50 * P;
  near(E.defense(s), 0, 'niemand daheim');
  E.step(s, 299);
  near(s.threat, 2.99 * P, 'Bedrohung +0,01 P/s');
  assert.strictEqual(s.res.scrap, 100 * P);
  E.step(s, 1);
  near(s.res.scrap, 90 * P, 'Schrott −10 %');
  near(s.res.ore, 45 * P, 'Erz −10 %');
  near(s.res.supplies, 90 * P, 'Vorräte −10 %');
  assert.match(s.log.at(-1).text, /^Ork-Überfall!/);
  const t = armed();
  t.marines.brothers = 0; t.serfs = 2 * P; t.bld.hydroFarm = 20; t._eff = null; t.threat = 100 * P;
  withRng([0.1], () => E.step(t, 300));
  assert.strictEqual(t.serfs, P);                                     // P Knechte verschleppt
  assert.match(t.log.at(-1).text, /verschleppt/);
  const d = armed();
  near(E.defense(d), 100 * P, '10 P Brüder daheim');
  d.tech.fortify = true; d.res.ore = 500 * P; d.res.scrap = 500 * P;
  assert.ok(E.build(d, 'bastion'));
  near(E.defense(d), 120 * P, 'Bastion +20 P');
  d.tech.librarius = true;
  assert.ok(E.setOffice(d, 'scriptor', P));
  near(E.defense(d), 115 * P, 'Amtsträger zählen halb');
  const o = armed();
  o.marines.brothers = 0; o.threat = 400 * P; o.res.scrap = 100 * P;
  E.simulate(o, 3600);                                                // 12 Prüfungen, offline höchstens 3 Überfälle
  near(o.res.scrap, 100 * P * 0.9 ** 3, 'drei Überfälle');
});

test('Grox-Fleisch hebt die Moral und wird gegessen; Archivum vergrößert das Wissen-Lager prozentual', () => {
  const s = fresh();
  s.serfs = 10 * P; s.bld.hydroFarm = 10; s.res.grox = P; s.res.supplies = 200 * P;
  near(E.moral(s), 1.1, 'Luxus +10 %');
  near(E.rates(s).grox, -0.01 * P, '10 P Knechte essen je 0,001/s');
  E.step(s, 100);
  near(s.res.grox, 0, 'aufgegessen');
  near(E.moral(s), 1, 'ohne Grox');
  near(E.rates(s).grox, 0, 'nichts mehr zu essen');
  const a = fresh();
  a.bld.scriptorium = 2; a.bld.archivum = 2;
  near(E.cap(a, 'knowledge'), (100 + 200) * 1.4 * P, 'zwei Archive +40 %');
});

test('Speichern und Laden mit Einsätzen, Befehlen und Bedrohung', () => {
  const s = armed();
  s.tech.planning = true;
  assert.ok(E.sendMission(s, 'raiders', 4 * P));
  assert.ok(E.setOrder(s, 'groxhunt', 2 * P));
  s.threat = 123.4 * P; s.raidTimer = 77;
  assert.strictEqual(E.save(E.load(E.save(s))), E.save(s));
  const bad = E.load(JSON.stringify({ v: V, chapter: 'da', marines: { brothers: 3 * P },
    missions: [{ id: 'raiders', brothers: 5 * P, wulfen: 0, left: 10 }, { id: 'nope', brothers: P, wulfen: 0, left: 5 },
      { id: 'groxhunt', brothers: 2 * P, wulfen: 3 * P, left: 1e9 }, { id: 'groxhunt', brothers: 2 * P, wulfen: 0, left: 1e9 }],
    orders: { raiders: 4 * P, nope: 2 * P, groxhunt: 99 * P }, threat: 1e9, raidTimer: -5 }));
  assert.deepStrictEqual(bad.missions, [{ id: 'groxhunt', brothers: 2 * P, wulfen: 0, left: 375 }]);
  assert.deepStrictEqual(bad.orders, { raiders: 4 * P });
  assert.deepStrictEqual([bad.threat, bad.raidTimer], [500 * P, 0]);
});

// ---------- Etappe 4: Schmiede ----------

// Mit Schmiede: Schmiedekunst, Raffination und Datenarchive erforscht, eine Schmiede steht.
function forged(ch = 'da') {
  const s = armed(ch);
  Object.assign(s.tech, { smithing: true, refining: true, archives: true });
  s.res.ore = 200 * P; s.res.scrap = 200 * P;
  assert.ok(E.build(s, 'forge'));
  return s;
}

test('Schmiede: Ausbeute +6 % je Schmiede, „max“, nichts ohne Schmiede oder Lehre', () => {
  const s = forged();
  s.res.scrap = 120 * P;
  assert.ok(E.craft(s, 'plasteel', P));
  near(s.res.plasteel, 1.06 * P, 'eine Schmiede: +6 %');
  near(s.res.scrap, 70 * P, 'Schrott bezahlt');
  assert.ok(E.craft(s, 'plasteel', 'max'));                 // 70 P Schrott reichen für 1,4 P Stück
  near(s.res.plasteel, 2.4 * 1.06 * P, 'so viel wie möglich');
  near(s.res.scrap, 0, 'alles verarbeitet');
  assert.strictEqual(E.craft(s, 'plasteel', 1), false);     // zu wenig Schrott
  assert.strictEqual(E.craftCount(s, 'plasteel'), 0);
  s.res.scrap = 500 * P;
  assert.ok(E.craft(s, 'plasteel', 10 * P));
  near(s.res.scrap, 0, '10 P Stück');
  assert.strictEqual(E.craft(s, 'plasteel', 0), false);
  assert.strictEqual(E.craft(s, 'datatablet', 1), false);   // kein Wissen
  const none = armed();
  none.tech.smithing = true; none.res.scrap = 100 * P;
  assert.strictEqual(E.craft(none, 'plasteel', 1), false);  // keine Schmiede
  const sal = forged('sal');
  sal.res.scrap = 50 * P;
  assert.ok(E.craft(sal, 'plasteel', P));
  near(sal.res.plasteel, 1.31 * P, 'Salamanders +25 % und eine Schmiede +6 %');
});

test('Servitoren stellen das gewählte Rezept aus Überschuss her und sammeln dann keinen Schrott mehr', () => {
  const s = forged();
  s.marines.servitors = 5 * P; s.res.scrap = 150 * P;
  near(E.rates(s).scrap, 0.75 * P, 'ohne Rezept: 5 P × 0,15 Schrott');
  assert.ok(E.setServitorRecipe(s, 'plasteel'));
  near(E.rates(s).scrap, 0, 'mit Rezept kein Schrott');
  E.step(s, 10);                                            // 5 P × 0,02 ÷ P × 10 s = 1 Arbeitsgang zu P Stück
  near(s.res.plasteel, 1.06 * P, 'P Plastahl');
  near(s.res.scrap, 100 * P, '50 P Schrott verbraucht');
  E.step(s, 10);                                            // Lager unter 90 %: nichts mehr
  near(s.res.plasteel, 1.06 * P, 'nur Überschuss');
  assert.strictEqual(E.setServitorRecipe(s, 'nope'), false);
  assert.ok(E.setServitorRecipe(s, null));
  near(E.rates(s).scrap, 0.75 * P, 'wieder Schrott');
});

test('Verbesserungen: sichtbar mit freigeschalteten Waren, wirken sofort, nur einmal', () => {
  const early = forged();
  early.tech.refining = false;                              // ohne Raffination kein Ceramit
  early.bld.scriptorium = 1;                                // Wissen freigeschaltet
  assert.strictEqual(E.upgradeVisible(early, 'godwyn'), false);
  assert.ok(E.upgradeVisible(early, 'spades'));
  const s = forged();
  s.bld.scriptorium = 1; s.tech.hydroponics = true; s.serfs = P; s.jobs.farmer = P;
  const before = E.rates(s).supplies;
  s.res.plasteel = 10 * P; s.res.knowledge = 300 * P;
  assert.ok(E.buyUpgrade(s, 'spades'));
  near(E.rates(s).supplies - before, 1.25 * 0.25 * P, 'Bauer +25 %');
  assert.strictEqual(E.buyUpgrade(s, 'spades'), false);     // nur einmal
  assert.match(s.log.at(-1).text, /Verstärkte Spaten/);
  assert.strictEqual(E.buyUpgrade(s, 'nope'), false);
});

test('Datentafeln vergrößern das Wissen-Lager, Servoschädel und Auspex verkürzen die Aufklärung', () => {
  const s = forged();
  const base = E.cap(s, 'knowledge');
  s.res.datatablet = 3 * P + 0.5;                           // ganze Stücke zählen
  near(E.cap(s, 'knowledge'), base + 150 * P, '3 P Tafeln');
  s.res.servoskull = 5 * P;
  near(E.missionTime(s, 100, true), 90, '5 P Schädel −10 %');
  s.res.servoskull = 50 * P;
  near(E.missionTime(s, 100, true), 60, 'höchstens −40 %');
  s.upgrades.auspex = true; s._eff = null;
  near(E.missionTime(s, 100, true), 35, 'Auspex −25 % dazu');
  near(E.missionTime(s, 100), 100, 'Kampfeinsätze unverändert');
});

test('Munitorum-Verwaltung: neue Knechte bekommen die gewählte Aufgabe', () => {
  const s = fresh();
  s.bld.quarters = 3; s.bld.hydroFarm = 10; s.res.supplies = 100 * P; s.tech.hydroponics = true;
  assert.strictEqual(E.setAutoJob(s, 'farmer'), false);     // Munitorum-Verwaltung fehlt
  s.tech.munitorum = true;
  assert.strictEqual(E.setAutoJob(s, 'nope'), false);
  assert.ok(E.setAutoJob(s, 'farmer'));
  E.step(s, 20);
  assert.deepStrictEqual([s.serfs, s.jobs.farmer], [P, P]);
  assert.ok(E.setAutoJob(s, null));
});

test('Raffinerie bringt Promethium über Raffineriearbeiter; Hab-Block und Lagerhalle', () => {
  const s = forged();
  s.places.promwell = true; s.res.ore = 200 * P; s.res.scrap = 200 * P;
  assert.ok(E.build(s, 'refinery'));
  near(E.cap(s, 'promethium'), 120 * P, 'Lager (60 + 60) × P');
  s.serfs = 2 * P;
  assert.ok(E.assign(s, 'refiner', P));
  near(E.rates(s).promethium, 0.08 * P, 'P Raffineriearbeiter');
  s.tech.construction = true; s.res.plasteel = 10 * P; s.res.ore = 100 * P;
  assert.ok(E.build(s, 'hab'));
  assert.strictEqual(E.serfCap(s), 5 * P);
  s.tech.logistics = true; s.res.plasteel = 10 * P; s.res.ceramite = 5 * P;
  assert.ok(E.build(s, 'warehouse'));
  near(E.cap(s, 'supplies'), 500 * P, 'Vorräte (200 + 300) × P');
});

test('Aquila-Rüstung senkt Verluste, Narthecium hilft der Gensaat-Bergung', () => {
  const s = armed();
  s.upgrades.aquila = true; s.upgrades.narthecium = true; s._eff = null;
  assert.ok(E.sendMission(s, 'orkcamp', 5 * P));
  // Kraft 50 P × 1,15 gegen 120 P → r ≈ 0,48; Verlust min(50 %, 0,25 ÷ r) × 0,75 = 37,5 %; Bergung 50 % + 20 % = 70 %
  withRng([0.9, ...fill(P, 0.3), ...fill(4 * P, 0.4), ...fill(P, 0.65)], () => E.step(s, 1200));
  assert.strictEqual(s.marines.brothers, 9 * P);            // 0,4 überlebt nur dank der Rüstung
  assert.match(s.log.at(-1).text, new RegExp(`Gensaat geborgen: ${de(P)}\\.`)); // 0,65 klappt nur dank Narthecium
});

test('Speichern und Laden mit Verbesserungen, Rezept, Aufgabe und Servitor-Arbeit', () => {
  const s = forged();
  s.tech.munitorum = true;
  s.upgrades.spades = true; s.servitorRecipe = 'plasteel'; s.autoJob = 'scrapper'; s.craftAcc = 0.4;
  s.res.plasteel = 3.18 * P;
  assert.strictEqual(E.save(E.load(E.save(s))), E.save(s));
  const bad = E.load(JSON.stringify({ v: V, chapter: 'da', upgrades: { spades: true, nope: true, cranes: 'ja' },
    servitorRecipe: 'nope', autoJob: 'nope', craftAcc: 7 }));
  assert.deepStrictEqual([bad.upgrades, bad.servitorRecipe, bad.autoJob, bad.craftAcc], [{ spades: true }, null, null, 1]);
});

// ---------- Etappe 5: Reclusiam ----------

// Mit Reclusiam: Liturgie erforscht, Schrein und Reclusiam stehen, 20 P freie Knechte, genug Farmen.
// Ordens-Ereignisse sind weit weg geschoben, damit der Zufall steuerbar bleibt.
function devout(ch = 'da') {
  const s = forged(ch);
  s.tech.liturgy = true; s.places.cathedral = true; s.eventIn = 1e9;
  s.res.scrap = 300 * P; s.res.ore = 200 * P; s.res.ceramite = 20 * P; s.res.faith = 100 * P;
  assert.ok(E.build(s, 'shrine'));
  assert.ok(E.build(s, 'reclusiam'));
  s.serfs = 20 * P; s.bld.hydroFarm = 60; s._eff = null; s.res.supplies = 200 * P;
  return s;
}

test('Glaube: Prediger, Ordenspriester, Schrein und Reclusiam, Frostzeit ×1,25', () => {
  const s = devout();
  assert.ok(E.assign(s, 'preacher', P) && E.assign(s, 'preacher', P));
  assert.ok(E.setOffice(s, 'priest', P));
  near(E.rates(s).faith, (2 * 0.05 * 1.03 + 0.2) * 1.15 * P, 'Glaube mit Schrein +5 % und Reclusiam +10 %, Prediger mit Moral');
  near(E.moral(s), 1 + 2 * 0.005 + 0.02, 'Prediger und Priester heben die Moral');
  s.time = 750;
  near(E.rates(s).faith, (0.103 + 0.2) * 1.15 * 1.25 * P, 'Frostzeit ×1,25');
  near(E.cap(s, 'faith'), (100 + 50 + 100) * P, 'Lager: Schrein +50 P, Reclusiam +100 P');
});

test('Riten: kaufen, wirken, nur einmal; das Fest des Primarchen öffnet zwei Litaneien', () => {
  const s = devout();
  s.res.faith = 250 * P;
  assert.ok(E.buyRite(s, 'arms'));
  near(s.res.faith, 150 * P, 'Glaube bezahlt');
  near(E.power(s, P, 0), 11 * P, 'Kampfkraft +10 %');
  assert.strictEqual(E.buyRite(s, 'arms'), false);          // nur einmal
  assert.strictEqual(E.buyRite(s, 'eternal'), false);       // zu teuer
  assert.strictEqual(E.litanyOpen(s, 'steadfast'), false);
  s.res.faith = 900 * P;
  assert.ok(E.buyRite(s, 'feast'));
  assert.ok(E.litanyOpen(s, 'steadfast'));
  assert.match(s.log.at(-1).text, /Fest des Primarchen/);
});

test('Litaneien: kosten Glaube je nach Knechten, halten ein Jahr, erneuern sich', () => {
  const s = devout();                                       // 20 P Knechte: (30 + 2) × P Glaube
  s.res.faith = 100 * P;
  assert.strictEqual(E.litanyCost(s), 32 * P);
  assert.ok(E.chooseLitany(s, 'wrath'));
  near(s.res.faith, 68 * P, 'bezahlt');
  near(E.power(s, P, 0), 10 * (1 + 0.3 * 1.05) * P, 'Zorn des Imperators, Reclusiam +5 %');
  s.res.reliquary = 2 * P;
  near(E.power(s, P, 0), 10 * (1 + 0.3 * 1.25) * P, 'mit 2 P Reliquiaren +20 %');
  s.res.reliquary = 0;
  E.step(s, 999);
  assert.strictEqual(s.litany, 'wrath');
  s.res.faith = 50 * P;
  E.step(s, 1);                                             // Jahr um: erneuert sich
  assert.deepStrictEqual([s.litany, Math.round(s.res.faith)], ['wrath', 18 * P]);
  s.res.faith = 0;
  E.step(s, 1000);                                          // kein Glaube: verklingt
  assert.strictEqual(s.litany, null);
  assert.match(s.log.at(-1).text, /verklingt/);
  assert.strictEqual(E.chooseLitany(s, 'steadfast'), false); // braucht das Fest
});

test('Große Messe: Frömmigkeit aus dem ganzen Glauben, Produktion + √Frömmigkeit ÷ 10 %', () => {
  const s = devout();
  s.res.faith = 0;
  assert.strictEqual(E.grandMass(s), false);                // nichts zu opfern
  s.res.faith = 250 * P; s.piety = 9750 * P;
  assert.ok(E.grandMass(s));
  assert.deepStrictEqual([s.res.faith, s.piety], [0, 10000 * P]);
  near(E.productionBonus(s), 0.1, '√10.000 ÷ 10 % = 10 % (Frömmigkeit in P)');
  s.jobs.scrapper = P;
  near(E.rates(s).scrap, 0.3 * 1.1 * P, 'Schrott × 1,1');
});

test('Kompanien: je 100 P Kampfbrüder +5 % Produktion, Ultramarines doppelt, Liber Honoris', () => {
  const s = armed();
  s.marines.brothers = 250 * P;
  near(E.productionBonus(s), 0.1, 'zwei volle Kompanien');
  E.step(s, 1);
  assert.ok(s.meta.honors.some(h => h.text === 'Die 2. Kompanie ist vollständig.'));
  const um = armed('um');
  um.marines.brothers = 100 * P;
  near(E.productionBonus(um), 0.1, 'Ultramarines: 10 % je Kompanie');
});

test('Blood Angels: Roter Durst, Schwarzer Zorn und Todeskompanie', () => {
  const s = armed('ba');
  s.thirst = 97;
  assert.ok(E.sendMission(s, 'groxhunt', 2 * P));
  withRng([0.1, ...fill(2 * P, 0.9)], () => E.step(s, 300));   // Sieg, Durst +5: Schwarzer Zorn
  assert.deepStrictEqual([s.deathCompany, s.thirst, s.marines.brothers], [P, 50, 9 * P]);
  assert.match(s.log.at(-1).text, /Schwarzer Zorn/);
  assert.ok(E.sendMission(s, 'groxhunt', 2 * P));
  assert.strictEqual(s.missions[0].dc, P);
  withRng([0.1, ...fill(2 * P, 0.9)], () => E.step(s, s.missions[0].left)); // Sturmzeit: dauert länger
  assert.deepStrictEqual([s.deathCompany, s.marines.brothers], [0, 9 * P]);
  assert.match(s.log.at(-1).text, /Todeskompanie fällt/);
  const p = armed('ba');
  p.tech.liturgy = true; p.eventIn = 1e9; p.thirst = 10;
  assert.ok(E.setOffice(p, 'priest', P));
  E.step(p, 100);
  near(p.thirst, 9, '−0,01/s je P Sanguinische Priester');
  assert.strictEqual(E.officeName(p, 'priest'), 'Sanguinischer Priester');
  const da = armed();
  da.thirst = 99;
  assert.ok(E.sendMission(da, 'groxhunt', 2 * P));
  withRng([0.1, ...fill(2 * P, 0.9)], () => E.step(da, 300));
  assert.strictEqual(da.thirst, 99);                        // andere Orden dürsten nicht
});

test('Ordens-Ereignisse: Geschenk, Bonus für ein Jahr, Spur eines Gefallenen öffnet die Jagd', () => {
  const s = armed();                                        // Dark Angels
  s.tech.liturgy = true; s.eventIn = 1;
  const hunt = byId(D.missions, 'fallenhunt');
  assert.strictEqual(E.isUnlocked(s, hunt), false);
  withRng([1 / 6 + 0.01, 0.5], () => E.step(s, 1));         // Ereignis 2; nächstes in 2.000 × (0,5 + 0,5) s
  assert.ok(E.isUnlocked(s, hunt));
  assert.match(s.log.at(-1).text, /Spur eines Gefallenen/);
  near(s.eventIn, 2000, 'nächstes Ereignis');
  s.eventIn = 1e9; s.marines.brothers = 12 * P;
  assert.ok(E.sendMission(s, 'fallenhunt', 10 * P));
  withRng([0.01, ...fill(10 * P, 0.99)], () => E.step(s, 2400));   // Sieg mit 5 % Chance, niemand fällt
  near(s.res.archeotech, 3 * 1.5 * P, 'Dark Angels: Archäotech +50 %');
  assert.strictEqual(E.isUnlocked(s, hunt), false);         // die Spur ist kalt
  const u = armed('um');
  u.tech.liturgy = true; u.eventIn = 1;
  withRng([0.01, 0.5], () => E.step(u, 1));                 // Ereignis 1: Knechte-Jobs +10 % für ein Jahr
  near(E.effects(u)['jobs.bonus'] || 0, 0.1, 'Bonus aktiv');
  u.eventIn = 1e9;
  E.step(u, 1000);
  near(E.effects(u)['jobs.bonus'] || 0, 0, 'nach einem Jahr vorbei');
  const g = armed('sw');
  g.tech.liturgy = true; g.eventIn = 1;
  withRng([0.01, 0.5], () => E.step(g, 1));                 // Ereignis 1: Mjod, 10 P Grox-Fleisch
  near(g.res.grox, 10 * P, 'Geschenk');
  assert.ok(g.log.at(-1).text.endsWith(` +${de(10 * P)} Grox-Fleisch.`));
});

test('Speichern und Laden mit Glaube, Litanei, Riten, Boni, Durst und Todeskompanie', () => {
  const s = devout('ba');
  Object.assign(s, { litany: 'wrath', litanyLeft: 400, piety: 1234 * P, thirst: 42, deathCompany: P, companies: 1, eventIn: 777 });
  s.rites.arms = true;
  s.boons = [{ key: 'moral.bonus', value: 0.1, left: 300 }];
  s.missions.push({ id: 'groxhunt', brothers: 2 * P, wulfen: 0, left: 10, dc: P });
  assert.strictEqual(E.save(E.load(E.save(s))), E.save(s));
  const bad = E.load(JSON.stringify({ v: V, chapter: 'da', rites: { arms: true, nope: true }, litany: 'nope', litanyLeft: 1e9,
    piety: -5, thirst: 400, deathCompany: 7 * P, companies: 3.7, eventIn: -1,
    boons: [{ key: 'x', value: 0.1, left: 3 }, { key: 'power.bonus', value: 0.2, left: 1e9 }] }));
  assert.deepStrictEqual([bad.rites, bad.litany, bad.litanyLeft, bad.piety, bad.thirst, bad.deathCompany, bad.companies, bad.eventIn],
    [{ arms: true }, null, 0, 0, 100, P, 3, D.rules.eventEvery]);
  assert.deepStrictEqual(bad.boons, [{ key: 'power.bonus', value: 0.2, left: 1000 }]);
});

// ---------- Etappe 6: Beziehungen ----------

// Mit Astropathie: Visionen, Ordens- und Welt-Ereignisse sind weit weg geschoben, damit der Zufall steuerbar bleibt.
function linked(ch = 'da') {
  const s = forged(ch);
  s.tech.astropathy = true; s.places.astrostation = true;
  s.visionIn = 1e9; s.eventIn = 1e9; s.orderTimer = 0;
  for (const w of D.worldEvents) s.worldIn[w.id] = 1e9;
  s._eff = null;
  return s;
}

test('Visionen: Auto-Fang je Astropathenturm, sonst 15 s zum Antippen; Warpsturm', () => {
  const s = linked();
  s.res.plasteel = 100 * P; s.res.ceramite = 100 * P;
  assert.ok(E.build(s, 'astropathTower'));
  s.visionIn = 1;
  withRng([0.05, 0.5], () => E.step(s, 1));                // 5 % < 10 %: Auto-Fang; nächste in 400 × (0,5 + 0,5) s
  assert.deepStrictEqual([s.res.navdata, s.vision], [P, 0]);
  near(s.visionIn, 400, 'nächste Vision');
  s.visionIn = 1;
  withRng([0.5, 0.5], () => E.step(s, 1));                 // nicht gefangen: 15 s im Kopf
  near(s.vision, 15, 'Vision sichtbar');
  E.step(s, 5);
  assert.ok(E.catchVision(s));
  assert.deepStrictEqual([s.res.navdata, s.vision], [2 * P, 0]);
  assert.strictEqual(E.catchVision(s), false);             // schon gefangen
  s.visionIn = 1;
  withRng([0.5, 0.5], () => E.step(s, 1));
  E.step(s, 15);                                           // verfallen
  assert.strictEqual(E.catchVision(s), false);
  assert.strictEqual(s.res.navdata, 2 * P);
  s.storm = 1000; s._eff = null; s.visionIn = 1;
  E.step(s, 5);                                            // im Warpsturm keine Visionen
  assert.deepStrictEqual([s.vision, s.res.navdata], [0, 2 * P]);
  near(E.effects(s)['faith.bonus'] || 0, 0.5, 'Warpsturm: Glaube +50 %');
});

test('Tausch: Paket gegen Paket, Ausbeute mit Kontor und Stufe, Ansehen und Hilfe je Stufe', () => {
  const s = linked('um');
  s.bld.warehouse = 3; s._eff = null;
  s.res.plasteel = 100 * P; s.res.supplies = 0;
  assert.ok(E.trade(s, 'varos'));
  assert.deepStrictEqual([s.res.plasteel, s.res.supplies, s.standing.varos], [96 * P, 500 * P, 1]);
  assert.match(s.log.at(-1).text, /Tausch mit Agrarwelt Varos/);
  s.standing.varos = 4;
  assert.ok(E.trade(s, 'varos'));                           // Ansehen 5: Stufe 1
  assert.strictEqual(E.standingLevel(s, 'varos'), 1);
  assert.match(s.log.at(-1).text, /Stufe 1/);
  near(E.effects(s)['supplies.bonus'] || 0, 0.03, 'Hilfe: Vorräte +3 %');
  s.tech.trade = true;
  assert.ok(E.build(s, 'tradeHouse'));
  s.res.supplies = 0;
  assert.ok(E.trade(s, 'varos'));
  near(s.res.supplies, 500 * (1 + 0.05 + 0.1) * P, 'Kontor +5 %, Stufe 1 +10 %');
  s.res.plasteel = 0;
  assert.strictEqual(E.trade(s, 'varos'), false);           // nichts zu geben
  assert.strictEqual(E.trade(s, 'valkar'), false);          // noch kein Kontakt
  assert.strictEqual(E.trade(s, 'nope'), false);
  s.bld.quarters = 2; s._eff = null; s.serfs = 3 * P; s.res.supplies = 400 * P;
  assert.ok(E.trade(s, 'guard'));                           // 2 P Knechte, aber nur P Plätze frei
  assert.strictEqual(s.serfs, 4 * P);
  assert.ok(s.log.at(-1).text.includes(`+${de(P)} Knechte`));
  s.seen.valkar = true; s.docked = true; s.res.promethium = 60 * P;
  assert.ok(E.trade(s, 'valkar'));
  near(s.res.amasec, 8 * (1 + 0.05 + 0.5) * P, 'Kontor +5 %, im Hafen +50 %');
  assert.strictEqual(s.docked, false);
  const d = linked();
  d.res.plasteel = 10 * P;
  assert.ok(E.trade(d, 'varos'));
  near(d.standing.varos, 0.75, 'Dark Angels: Ansehen 25 % langsamer');
});

test('Daueraufträge: ab Stufe 2, nur aus vollen Lagern, höchstens alle 10 s', () => {
  const s = linked('um');
  assert.strictEqual(E.setStandingOrder(s, 'mechanicus', true), false);   // Stufe 0
  s.standing.mechanicus = 15; s._eff = null;                               // Stufe 2
  assert.ok(E.setStandingOrder(s, 'mechanicus', true));
  s.res.archeotech = 9 * P;
  E.step(s, 10);                                            // Ware ohne Lager: erst ab 5 Paketen (10 P)
  assert.strictEqual(s.res.ceramite, 0);
  s.res.archeotech = 100 * P;
  E.step(s, 10);
  near(s.res.ceramite, 15 * 1.2 * P, 'ein Tausch, Stufe 2 +20 %');
  E.step(s, 20);
  near(s.res.ceramite, 3 * 18 * P, 'einer je 10 s');
  assert.ok(E.setStandingOrder(s, 'mechanicus', false));
  E.step(s, 10);
  near(s.res.ceramite, 3 * 18 * P, 'aufgehoben');
  const g = linked('um');
  g.standing.guard = 15; g.bld.warehouse = 2; g._eff = null;     // Lager größer als das Paket
  assert.ok(E.setStandingOrder(g, 'guard', true));
  g.res.supplies = E.cap(g, 'supplies') * 0.5;
  E.step(g, 10);
  assert.strictEqual(g.standing.guard, 15);                 // Lager nicht voll: kein Tausch
  g.res.supplies = E.cap(g, 'supplies');
  E.step(g, 10);
  assert.strictEqual(g.standing.guard, 16);
});

test('Mechanicus: Servitor-Zelle ab Stufe 1, Servitor erschaffen, Techmarine ab Stufe 2', () => {
  const s = linked();
  const cell = byId(D.buildings, 'servitorCell'), tm = byId(D.offices, 'techmarine');
  assert.strictEqual(E.isUnlocked(s, cell), false);
  s.standing.mechanicus = 5; s._eff = null;
  assert.ok(E.isUnlocked(s, cell));
  assert.strictEqual(E.isUnlocked(s, tm), false);
  s.res.plasteel = 20 * P; s.res.archeotech = 2 * P;
  assert.ok(E.build(s, 'servitorCell'));
  s.serfs = 2 * P; s.jobs.scrapper = 2 * P;
  assert.ok(E.makeServitor(s));
  assert.deepStrictEqual([s.serfs, s.jobs.scrapper, s.marines.servitors, s.res.plasteel], [P, P, P, 7 * P]);
  s.res.plasteel = 4 * P;
  assert.strictEqual(E.makeServitor(s), false);             // zu wenig Plastahl
  s.marines.servitors = 10 * P; s.craftAcc = 0;
  assert.ok(E.setServitorRecipe(s, 'servoskull'));
  E.step(s, 1);
  near(s.craftAcc, 10 * 0.02 * 1.1, 'eine Zelle: Servitoren 10 % schneller');
  s.standing.mechanicus = 15; s._eff = null;
  assert.ok(E.setOffice(s, 'techmarine', P));
  near(E.craftYield(s), 1 + 0.06 + 2 * 0.03 + 0.1, 'Schmiede, Hilfe Stufe 2, Techmarine');
});

test('Welt-Ereignisse: Freihändler, Warpsturm, WAAAGH! und Genestealer-Kult', () => {
  const s = linked('um');
  s.worldIn.trader = 1;
  withRng([0.5], () => E.step(s, 1));
  assert.ok(s.seen.valkar);
  assert.match(s.log.at(-1).text, /Haus Valkar bietet Handel an/);
  near(s.worldIn.trader, 3000, 'nächster Freihändler');
  s.worldIn.trader = 1;
  E.step(s, 1);
  assert.strictEqual(s.docked, true);
  s.worldIn.trader = 1e9;
  s.worldIn.waaagh = 1; s.threat = 10 * P;
  E.step(s, 1);
  near(s.threat, (10 + 0.01 + 100) * P, 'WAAAGH! +100 P');
  assert.ok(s.log.at(-1).text.endsWith(`Die Bedrohung steigt um ${de(100 * P)}.`));
  s.worldIn.waaagh = 1e9;
  s.worldIn.storm = 1;
  E.step(s, 1);
  assert.match(s.log.at(-1).text, /Warpsturm/);
  s.worldIn.storm = 1e9;
  E.step(s, 1000);
  assert.strictEqual(s.storm, 0);
  assert.match(s.log.at(-1).text, /legt sich/);
  s.places.hive = true; s.worldIn.cult = 1;
  E.step(s, 1);
  s.worldIn.cult = 1e9;
  assert.ok(s.seen.cult);
  near(E.effects(s)['arrival.bonus'], 0.1 + 0.1 - 0.5, 'Kult: Zuzug −50 %');
  const purge = byId(D.missions, 'cultpurge');
  assert.ok(E.isUnlocked(s, purge));
  delete s.places.ashwaste; s.marines.brothers = 10 * P;   // ohne Aschewüste keine Überfälle während des Einsatzes
  assert.ok(E.sendMission(s, 'cultpurge', 10 * P));
  withRng([0.01, ...fill(10 * P, 0.99)], () => E.step(s, s.missions[0].left));
  assert.deepStrictEqual([!!s.seen.cult, !!s.seen.cultCrushed], [false, true]);
  assert.ok(E.isUnlocked(s, byId(D.partners, 'inquisition')));
  near(E.effects(s)['arrival.bonus'], 0.2, 'Kult zerschlagen');
});

test('Speichern und Laden mit Ansehen, Aufträgen, Visionen, Ereignis-Uhren und Warpsturm', () => {
  const s = linked();
  Object.assign(s, { standing: { varos: 16.5, mechanicus: 3 }, standingOrders: { varos: true }, orderTimer: 4,
    visionIn: 123, vision: 7, storm: 300, docked: true, eventIn: 777 });
  for (const w of D.worldEvents) s.worldIn[w.id] = 55;
  assert.strictEqual(E.save(E.load(E.save(s))), E.save(s));
  const bad = E.load(JSON.stringify({ v: V, chapter: 'da', standing: { varos: -3, nope: 5, mechanicus: 1e12 },
    standingOrders: { varos: true, nope: true, guard: 'ja' }, orderTimer: 99, visionIn: -1, vision: 99,
    worldIn: { trader: 1e12, nope: 5 }, storm: 1e9, docked: 'ja' }));
  assert.deepStrictEqual([bad.standing, bad.standingOrders, bad.orderTimer, bad.visionIn, bad.vision, bad.worldIn.trader,
    bad.storm, bad.docked], [{ mechanicus: 1e6 }, { varos: true }, 10, 400, 15, 4500, 1000, false]);
});

// ---------- Etappe 7: Flotte und Sektor ----------

function fleeted(ch = 'da') {
  const s = linked(ch);
  Object.assign(s.tech, { flight: true, warpnav: true, orbital: true, stasis: true });
  s.places.spaceport = true;
  Object.assign(s.res, { ceramite: 1000 * P, plasteel: 1000 * P, archeotech: 100 * P, fuelcell: 100 * P, navdata: 50 * P });
  s.seen.archeotech = true; s._eff = null;
  return s;
}

test('Schiffe: Platz je Landeplattform und Werft, Preis mit Faktor, Schlachtbarke einmal, Flottenstärke', () => {
  const s = fleeted();
  assert.strictEqual(E.buildShip(s, 'thunderhawk'), false);   // keine Landeplattform
  assert.ok(E.build(s, 'landingPad'));
  for (let i = 0; i < 3; i++) assert.ok(E.buildShip(s, 'thunderhawk'));
  assert.strictEqual(E.buildShip(s, 'thunderhawk'), false);   // Plattform voll (3 Plätze)
  near(E.shipPrice(s, 'thunderhawk').ceramite, 15 * 1.25 ** 3 * P, 'Preis steigt');
  near(E.fleetPower(s), 30 * P, 'drei Thunderhawks');
  near(E.missionTime(s, 1000, true), 1000 * (1 - 0.3), 'Aufklärung −10 % je Thunderhawk');
  assert.strictEqual(E.buildShip(s, 'cruiser'), false);       // keine Werft
  assert.ok(E.build(s, 'orbitalYard'));
  assert.ok(E.buildShip(s, 'cruiser') && E.buildShip(s, 'cruiser'));
  assert.strictEqual(E.buildShip(s, 'cruiser'), false);       // Werft voll (2 Plätze)
  s.res.ceramite = 1000 * P; s.res.plasteel = 1000 * P;
  assert.ok(E.buildShip(s, 'barge'));
  assert.strictEqual(E.buildShip(s, 'barge'), false);         // nur eine
  near(E.fleetPower(s), (30 + 100 + 300) * P, 'Flottenstärke');
  assert.strictEqual(E.buildShip(s, 'nope'), false);
  s.res.servoskull = 30 * P; s.upgrades.auspex = true; s._eff = null;
  near(E.missionTime(s, 1000, true), 1000 * (1 - 0.8), 'Aufklärung höchstens −80 %');
});

test('Feldzug: nur zu Nachbarn, kostet Navigationsdaten und Treibstoff, Flotte und Trupp kämpfen', () => {
  const s = fleeted('um');
  s.marines.brothers = 20 * P;
  assert.strictEqual(E.startCampaign(s, 'metallum', 10 * P), false);   // kein Nachbar von Kharos
  assert.strictEqual(E.startCampaign(s, 'varos', 5 * P - 1), false);   // Trupp zu klein
  near(E.campaignChance(s, 'varos', 10 * P), 0.5 + 0.4 * Math.log2(100 / 150), 'ohne Flotte');
  assert.ok(E.build(s, 'landingPad'));
  for (let i = 0; i < 3; i++) assert.ok(E.buildShip(s, 'thunderhawk'));
  const nav = s.res.navdata, fuel = s.res.fuelcell;
  assert.ok(E.startCampaign(s, 'varos', 10 * P));                  // Stärke 30 + 100 gegen 150
  assert.deepStrictEqual([nav - s.res.navdata, fuel - s.res.fuelcell], [2 * P, 4 * P]);
  assert.match(s.log.at(-1).text, new RegExp(`mit ${de(10 * P)} Kämpfern\\.$`));
  assert.strictEqual(E.freeBrothers(s), 10 * P);
  assert.strictEqual(E.startCampaign(s, 'tyrrhen', 5 * P), false); // einer zur Zeit
  withRng([0.1, ...fill(10 * P, 0.99)], () => E.step(s, 3600));    // Sieg, niemand fällt
  assert.deepStrictEqual([!!s.systems.varos, s.campaign, s.marines.brothers], [true, null, 20 * P]);
  near(E.effects(s)['supplies.bonus'] || 0, 0.15, 'Varos: Vorräte +15 %');
  assert.ok(s.meta.honors.some(h => h.text === 'System befreit: Varos Agraria.'));
  assert.ok(E.reachable(s, 'metallum'));                           // jetzt Nachbar
  assert.ok(E.startCampaign(s, 'oriel', 10 * P));                  // Stärke 130 gegen 350: Chance 5 %
  withRng([0.9, ...fill(P, 0.1), ...fill(9 * P, 0.9), ...fill(P, 0.9)], () => E.step(s, 7200));
  assert.deepStrictEqual([!!s.systems.oriel, s.marines.brothers], [false, 19 * P]);
  const lines = s.log.slice(-2).map(l => l.text);
  assert.match(lines[0], /^Feldzug gescheitert: Sankt Oriel/);
  assert.strictEqual(lines[1], `Gefallen: ${de(P)} Brüder.`);
});

test('Feldzug-Dauer: Kartentisch und Navigatorenhaus kürzen, im Warpsturm ruht der Feldzug', () => {
  const s = fleeted();
  s.marines.brothers = 10 * P;
  near(E.campaignTime(s, 'varos'), 3600, 'Grunddauer');
  assert.ok(E.upgradeVisible(s, 'holotable'));
  s.res.datatablet = 5 * P;
  assert.ok(E.buyUpgrade(s, 'holotable'));
  s.standing.navis = 5; s._eff = null;                             // Navigatorenhaus Stufe 1
  near(E.campaignTime(s, 'varos'), 3600 * (1 - 0.2 - 0.03), 'Kartentisch −20 %, Navigatorenhaus −3 %');
  assert.ok(E.startCampaign(s, 'varos', 5 * P));
  const left = s.campaign.left;
  s.storm = 500; s._eff = null;
  E.step(s, 100);
  near(s.campaign.left, left, 'Warpsturm: Feldzug ruht');
  s.storm = 0; s._eff = null;
  E.step(s, 100);
  near(s.campaign.left, left - 100, 'läuft weiter');
  const t = fleeted();
  t.tech.warpnav = false;
  assert.strictEqual(E.upgradeVisible(t, 'holotable'), false);     // Kartentisch erst ab Warpnavigation
});

test('Systemboni: Knechte-Plätze +10 %, Navigationsdaten je Vision, Ruhm aus Beute', () => {
  const s = fleeted('um');
  s.bld.quarters = 5; s._eff = null;
  assert.strictEqual(E.serfCap(s), 10 * P);
  s.systems.tyrrhen = true; s._eff = null;
  assert.strictEqual(E.serfCap(s), 11 * P);
  s.systems.beacon = true; s._eff = null;
  s.vision = 5;
  const nav = s.res.navdata;
  assert.ok(E.catchVision(s));
  near(s.res.navdata, nav + 2 * P, 'Leuchtfeuer: +P je Vision');
  s.ships.barge = 1; s._eff = null;
  s.threat = 50 * P; s.marines.brothers = 10 * P;
  assert.ok(E.sendMission(s, 'raiders', 5 * P));
  assert.strictEqual(s.log.at(-1).text, `Ein Trupp aus ${de(5 * P)} Kämpfern bricht auf: Ork-Plünderer vertreiben.`);
  withRng([0.1, ...fill(5 * P, 0.9)], () => E.step(s, 240));
  near(s.res.renown, 5 * 1.1 * P, 'Schlachtbarke: Ruhm +10 %');
});

test('Speichern und Laden mit Schiffen, Systemen und laufendem Feldzug', () => {
  const s = fleeted();
  s.marines.brothers = 12 * P;
  s.ships.thunderhawk = 2; s.systems.varos = true; s.bld.landingPad = 1; s._eff = null;
  s.eventIn = 777; s.visionIn = 100; for (const w of D.worldEvents) s.worldIn[w.id] = 55; // gültige Uhren
  assert.ok(E.startCampaign(s, 'metallum', 8 * P));
  assert.strictEqual(E.save(E.load(E.save(s))), E.save(s));
  const bad = E.load(JSON.stringify({ v: V, chapter: 'da', marines: { brothers: 6 * P }, ships: { thunderhawk: 2.7, nope: 3, barge: 4 },
    systems: { varos: true, nope: true, kharos: true, rift: 'ja' }, campaign: { id: 'rift', brothers: 9 * P, wulfen: 0, left: 1e9 } }));
  assert.deepStrictEqual([bad.ships, bad.systems, bad.campaign], [{ thunderhawk: 2, cruiser: 0, barge: 1 }, { varos: true }, null]);
  const ok = E.load(JSON.stringify({ v: V, chapter: 'da', marines: { brothers: 6 * P }, campaign: { id: 'rift', brothers: 5 * P, wulfen: 0, left: 1e9 } }));
  assert.deepStrictEqual(ok.campaign, { id: 'rift', brothers: 5 * P, wulfen: 0, left: 21600 });
});

// ---------- Etappe 8: Nachfolgeorden ----------

// Bereit zur Gründung: Gründungsrecht, 120 P Brüder, 25 P Gensaat, 1.200 P Ruhm, zwei Systeme mit Vermächtnis (5 + 10).
function ripe(ch = 'da') {
  const s = fleeted(ch);
  s.tech.founding = true;
  s.marines.brothers = 120 * P; s.bld.geneVault = 3;
  s.res.geneseed = 25 * P; s.res.renown = 1200 * P;
  s.systems.kathar = true; s.systems.rift = true; s._eff = null;
  return s;
}

test('Vermächtnis: Brüder ÷ 10 P, Ruhm ÷ 500 P, Systeme; Gründung braucht Lehre, 100 P Brüder, 20 P Gensaat', () => {
  const s = ripe();
  assert.deepStrictEqual(E.legacyGain(s), { brothers: 12, renown: 2, systems: 15, total: 29 });
  assert.strictEqual(E.foundBlock(s), null);
  s.res.geneseed = 20 * P - 1;
  assert.strictEqual(E.foundBlock(s), 'geneseed');
  s.marines.brothers = 100 * P - 1;
  assert.strictEqual(E.foundBlock(s), 'brothers');
  s.tech.founding = false;
  assert.strictEqual(E.foundBlock(s), 'lore');
  assert.strictEqual(E.found(s, { name: 'X', lineage: 'um' }), null);
});

test('Gründung: neuer Orden nach Linie mit Name und Farben, Vermächtnis wächst, Liber Honoris bleibt', () => {
  const s = ripe();
  const honors = s.meta.honors.length;
  const n = E.found(s, { name: 'Wächter der Asche', palette: 'teal', lineage: 'sal' });
  assert.ok(n);
  assert.deepStrictEqual([n.chapter, n.name, n.palette], ['sal', 'Wächter der Asche', 'teal']);
  assert.deepStrictEqual([n.meta.legacy, n.meta.legacyFree, n.meta.lines, n.meta.foundings], [29, 29, { sal: 1 }, 1]);
  assert.strictEqual(n.meta.honors.length, honors + 1);
  assert.match(n.meta.honors.at(-1).text, /Nachfolgeorden gegründet: Wächter der Asche \(Linie Salamanders\)/);
  assert.deepStrictEqual([n.serfs, n.marines.brothers, n.marines.coma, Object.keys(n.tech).length, n.res.renown], [0, 0, 5 * P, 0, 0]);
  assert.match(n.log[0].text, /Wächter der Asche/);
  assert.strictEqual(E.found(ripe(), { name: '  ', lineage: 'sal' }), null);            // Name fehlt
  assert.strictEqual(E.found(ripe(), { name: 'X'.repeat(25), lineage: 'sal' }), null);   // zu lang
  assert.strictEqual(E.found(ripe(), { name: 'X', lineage: 'nope' }), null);
  assert.strictEqual(E.found(ripe(), { name: 'X', lineage: 'sal', palette: 'nope' }), null);
  const w = E.found(ripe('sw'), { name: 'Eiszähne', lineage: 'sw' });
  assert.deepStrictEqual([w.palette, w.meta.lines], [null, { sw: 1 }]);                  // Farben der Linie
  assert.strictEqual(E.found(n, { name: 'X', lineage: 'um' }), null);                    // der Neue kann noch nicht
});

test('Linienstufe verstärkt den Linien-Bonus; Vermächtnis gibt +1 % Produktion und Lager je Punkt', () => {
  const s = E.create('um', { legacy: 20, lines: { um: 2 } });
  near(E.effects(s)['cap.bonus'], 0.2 * 1.5, 'Lager +20 % × (1 + 2 × 25 %)');
  near(E.effects(s)['arrival.bonus'], 0.1 * 1.5, 'Zuzug');
  near(E.effects(s)['company.bonus'], 0.05, 'Eigenheit bleibt');
  near(E.cap(s, 'scrap'), 150 * (1 + 0.3 + 0.2) * P, 'Lager: Linie und Vermächtnis');
  s.serfs = P; s.jobs.scrapper = P;
  near(E.rates(s).scrap, 0.3 * 1.2 * P, 'Produktion +20 %');
  const b = E.create('ba', { lines: { ba: 1 } });
  near(E.power(b, P, 0), 10 * (1 + 0.2 * 1.25) * P, 'Blood Angels Stufe 1');
});

test('Relikte: kaufen mit freien Punkten, Wirkung sofort, Startpaket bei der Gründung, Ewige Wacht', () => {
  const s = ripe('um');
  s.meta.legacy = 60; s.meta.legacyFree = 45;
  assert.ok(E.buyRelic(s, 'skulls'));                          // 30
  assert.strictEqual(E.buyRelic(s, 'skulls'), false);          // nur einmal
  assert.strictEqual(E.buyRelic(s, 'vault'), false);           // 100 > 15 frei
  assert.ok(E.buyRelic(s, 'banner') && E.buyRelic(s, 'codex')); // 5 + 10
  assert.strictEqual(s.meta.legacyFree, 0);
  near(E.effects(s)['knowledge.bonus'] || 0, 0.15, 'Servoschädel: Wissen +15 %');
  assert.match(s.log.at(-1).text, /Kodex-Abschrift/);
  const n = E.found(s, { name: 'Ultima Vigil', lineage: 'um' });
  assert.deepStrictEqual([n.res.scrap, n.bld.hydroFarm, n.bld.quarters, !!n.tech.salvage, n.meta.legacy], [50 * P, 1, 1, true, 89]);
  const v = E.create('da', { relics: { vigil: true, veterans: true } });
  assert.deepStrictEqual([E.offlineMax(v), v.marines.coma, E.marineCap(v)], [7 * 86400, 10 * P, 10 * P]);
  assert.strictEqual(E.offlineMax(E.create('da')), 3 * 86400);
});

test('Speichern und Laden mit Vermächtnis, Relikten, Linien, Name und Farben', () => {
  const s = E.create('sal', { legacy: 40, legacyFree: 12, relics: { skulls: true }, lines: { sal: 2, um: 1 }, foundings: 3 },
    { name: 'Aschewächter', palette: 'teal' });
  assert.strictEqual(E.save(E.load(E.save(s))), E.save(s));
  const bad = E.load(JSON.stringify({ v: V, chapter: 'da', name: 'X'.repeat(40), palette: 'nope',
    meta: { legacy: -5, legacyFree: 1e12, relics: { skulls: true, nope: true }, lines: { da: 2.5, nope: 3, um: -1 }, foundings: 'viele' } }));
  assert.deepStrictEqual([bad.name, bad.palette, bad.meta.legacy, bad.meta.legacyFree, bad.meta.relics, bad.meta.lines, bad.meta.foundings],
    ['Dark Angels', null, 0, 0, { skulls: true }, { da: 2 }, 0]);
});

// ---------- Etappe 9: Feinschliff ----------

test('Flair: alle 600 s eine Zeile ab dem ersten Knecht, Namen erst mit wachen Brüdern', () => {
  const s = fresh();
  s.flairIn = 1;
  E.step(s, 1);
  assert.strictEqual(s.log.length, 2);                        // noch kein Knecht: nichts
  s.seen.serfs = true;
  E.step(s, 1);
  assert.ok(D.flair.includes(s.log.at(-1).text), 'eine Zeile ohne Namen');
  near(s.flairIn, 600, 'nächste in 600 s');
  const b = awake();
  b.seen.serfs = true; b.flairIn = 1;
  const before = b.logSeq;
  E.step(b, 1);
  assert.strictEqual(b.logSeq, before + 1);
  b.flairIn = 1;
  E.simulate(b, 3600);                                        // offline keine Flair-Zeilen
  assert.ok(b.log.every(l => l.id <= before + 1 || !D.flair.includes(l.text)));
});

// ---------- Etappe 10: Zahlen ×100 ----------

test('scalePop: alle Mengen ×P, Ertrag je Kopf bleibt, Anteile je Kopf ÷P (Stichproben aus jeder Tabelle)', () => {
  const R = D.rules;
  assert.strictEqual(R.saveVersion, 3);
  near(R.serfFood, 0.3, 'Essen je Knecht bleibt');
  near(R.servitorScrap, 0.15, 'Schrott je Servitor bleibt');
  near(R.arrivalEvery, 20 / P, 'Zuzug: Abstand je Kopf');
  near(R.crowdPenalty, 0.005 / P, 'Gedränge je Kopf');
  near(R.craftRate, 0.02 / P, 'Arbeitsgänge je Servitor (ein Gang = P Stück)');
  assert.deepStrictEqual([R.crowdFree, R.comaBrothers, R.marineBase, R.companySize, R.foundBrothers, R.foundGeneseed],
    [20 * P, 5 * P, 5 * P, 100 * P, 100 * P, 20 * P]);
  assert.deepStrictEqual([R.clickGain, R.visionNav, R.litanyCost, R.servitorPlasteel, R.legacyRenown, R.threatMax],
    [P, P, 30 * P, 5 * P, 500 * P, 500 * P]);
  assert.strictEqual(R.litanyPerSerfs, 10);                  // 1 Glaube je 10 Knechte: beide Seiten ×P
  assert.deepStrictEqual(R.campaignSquad, [5 * P, 50 * P]);
  near(R.powerBrother, 10, 'Kampfkraft je Bruder bleibt, die Bedrohung wächst mit');
  near(R.threatRate, 0.01 * P, 'Bedrohung je Sekunde');
  assert.deepStrictEqual([byId(D.resources, 'geneseed').cap, byId(D.resources, 'supplies').cap, byId(D.resources, 'plasteel').cap],
    [3 * P, 200 * P, Infinity]);
  near(byId(D.resources, 'datatablet').perUnit['knowledge.cap'], 50, 'Wissen-Lager je Tafel bleibt');
  near(byId(D.resources, 'servoskull').perUnit['scout.speed'], 0.02 / P, 'Anteil je Schädel');
  assert.strictEqual(byId(D.buildings, 'quarters').effects['serfs.cap'], 2 * P);
  assert.strictEqual(byId(D.buildings, 'cells').effects['marines.cap'], 5 * P);
  near(byId(D.buildings, 'arena').effects['aspirants.rate'], 0.001 * P, 'Arena');
  near(byId(D.buildings, 'hydroFarm').effects['supplies.rate'], 0.5 * P, 'Farm');
  assert.deepStrictEqual([byId(D.buildings, 'storehouse').effects['supplies.cap'], byId(D.buildings, 'bastion').effects['defense.flat']],
    [150 * P, 20 * P]);
  assert.deepStrictEqual(byId(D.buildings, 'scriptorium').cost, { scrap: 25 * P, supplies: 10 * P });
  near(byId(D.buildings, 'scriptorium').effects['knowledge.bonus'], 0.05, 'Anteile bleiben');
  near(byId(D.jobs, 'scrapper').effects['scrap.rate'], 0.3, 'Schrottsammler je Kopf');
  near(byId(D.offices, 'scriptor').effects['knowledge.rate'], 0.5, 'Scriptor je Kopf');
  near(byId(D.offices, 'techmarine').effects['craft.bonus'], 0.1 / P, 'Techmarine-Anteil je Kopf');
  assert.deepStrictEqual(byId(D.places, 'crashsite').reward, { geneseed: 5 * P, scrap: 40 * P });
  const raiders = byId(D.missions, 'raiders');
  assert.deepStrictEqual([raiders.squad, raiders.threat, raiders.calm, raiders.loot],
    [[3 * P, 5 * P], 30 * P, 10 * P, { scrap: 60 * P, renown: 5 * P }]);
  assert.deepStrictEqual(byId(D.missions, 'wreckfields').lucky.archeotech, [0.1, P]);
  assert.deepStrictEqual(byId(D.techs, 'astropathy').cost, { knowledge: 12000 * P, datatablet: 5 * P });
  assert.deepStrictEqual([byId(D.partners, 'guard').give, byId(D.partners, 'guard').get], [{ supplies: 300 * P }, { serfs: 2 * P }]);
  assert.strictEqual(byId(D.rites, 'arms').cost, 100 * P);
  assert.deepStrictEqual(byId(D.upgrades, 'spades').cost, { plasteel: 10 * P, knowledge: 300 * P });
  assert.deepStrictEqual(byId(D.recipes, 'plasteel').cost, { scrap: 50 });   // je Stück: beide Seiten ×P
  assert.deepStrictEqual([byId(D.ships, 'thunderhawk').cost.ceramite, byId(D.ships, 'thunderhawk').effects['fleet.power']],
    [15 * P, 10 * P]);
  const varos = byId(D.systems, 'varos');
  assert.deepStrictEqual([varos.threat, varos.nav, byId(D.systems, 'hulk').reward.archeotech], [150 * P, 2 * P, 10 * P]);
  assert.deepStrictEqual([byId(D.relics, 'veterans').start.coma, byId(D.relics, 'reserve').effects['geneseed.cap'],
    byId(D.relics, 'banner').start.res], [5 * P, 5 * P, { scrap: 50 * P, supplies: 50 * P }]);
  assert.deepStrictEqual([D.chapterEvents.um[2].gift, D.chapterEvents.ws[5].calm], [{ scrap: 200 * P }, 40 * P]);
  assert.strictEqual(byId(D.worldEvents, 'waaagh').threat, 100 * P);
});

test('Zuzug: stetig P je 20 s, das Log fasst höchstens einmal je Minute zusammen', () => {
  const s = fresh();
  s.bld.quarters = 50; s.bld.hydroFarm = 40; s.res.supplies = 200 * P; s.seen.serfs = true; s.serfs = P;
  const before = s.logSeq;
  E.step(s, 200);
  assert.strictEqual(s.serfs, P + 10 * P);                   // 200 s: 10 P mehr
  const lines = s.log.filter(l => l.id > before).map(l => l.text);
  assert.ok(lines.length <= 4 && lines.every(t => /^\+[\d.]+ Knechte ziehen ein\.$/.test(t)), lines.join(' | '));
  const sum = lines.reduce((n, t) => n + Number(t.match(/[\d.]+/)[0].replace(/\./g, '')), 0);
  assert.strictEqual(sum + s._arrived, 10 * P);              // der Rest kommt in die nächste Zeile
});

test('Jobs und Ämter: Schritte beliebiger Größe, nie mehr als frei oder vergeben', () => {
  const s = awake();
  s.serfs = 3 * P;
  assert.ok(E.assign(s, 'scrapper', 3 * P));                 // „alle“
  assert.strictEqual(E.assign(s, 'scrapper', 1), false);
  assert.strictEqual(E.assign(s, 'scrapper', -(3 * P + 1)), false);
  assert.ok(E.assign(s, 'scrapper', -3 * P));                // „0“
  s.tech.librarius = true;
  assert.strictEqual(E.setOffice(s, 'scriptor', 5 * P + 1), false);
  assert.ok(E.setOffice(s, 'scriptor', 5 * P));
  assert.strictEqual(E.setOffice(s, 'scriptor', -(5 * P + 1)), false);
  assert.ok(E.setOffice(s, 'scriptor', -5 * P));
});

test('Binomial-Zufall: bleibt in 0…n, trifft den Erwartungswert, große Zahlen per Näherung', () => {
  withSeed(7, () => {
    let sum = 0;
    for (let i = 0; i < 200; i++) {
      const k = E.binom(P, 0.3);
      assert.ok(Number.isInteger(k) && k >= 0 && k <= P);
      sum += k;
    }
    near(Math.round(sum / 200 / P * 100) / 100, 0.3, 'Mittel');
    const big = E.binom(100000, 0.25);
    assert.ok(Math.abs(big - 25000) < 1000, `Näherung ${big}`);
  });
  assert.deepStrictEqual([E.binom(0, 0.5), E.binom(10, 0), E.binom(10, 1)], [0, 0, 10]);
});

test('Migration v1 → v3: alles ×P, Schübe statt Listen, Ertrag je Sekunde ×P', () => {
  const v1 = {
    v: 1, chapter: 'ws', serfs: 7, jobs: { scrapper: 3, farmer: 2 }, offices: { apothecary: 1 },
    tech: { hydroponics: true, geneseedlore: true }, bld: { hydroFarm: 4, quarters: 4, apothecarion: 1, cells: 2, arena: 1 },
    res: { supplies: 120, aspirants: 1.5, geneseed: 4, scrap: 10 },
    marines: { coma: 0, brothers: 6, neophytes: [300, 50], implants: [120], servitors: 2, wulfen: 0 },
    missions: [{ id: 'groxhunt', brothers: 2, wulfen: 0, left: 100 }], orders: { groxhunt: 2 },
    places: { orevein: true, tribes: true }, arrival: 13, deathCompany: 1, companies: 0, seen: { serfs: true, marines: true },
  };
  const s = E.load(JSON.stringify(v1));
  assert.strictEqual(s.v, 3);
  assert.deepStrictEqual([s.serfs, s.jobs.scrapper, s.jobs.farmer, s.offices.apothecary], [7 * P, 3 * P, 2 * P, P]);
  assert.deepStrictEqual(s.marines, { coma: 0, brothers: 6 * P, neophytes: [{ n: P, left: 300 }, { n: P, left: 50 }],
    implants: [{ n: P, left: 120 }], servitors: 2 * P, wulfen: 0 });
  assert.deepStrictEqual([s.res.aspirants, s.res.geneseed, s.res.supplies, s.res.scrap], [1.5 * P, 4 * P, 120 * P, 10 * P]);
  assert.deepStrictEqual([s.missions[0].brothers, s.orders.groxhunt, s.deathCompany, s.arrival], [2 * P, 2 * P, P, 0]);
  // Ertrag wie mit dem alten Stand, ×P: 3 Schrottsammler 0,9/s, 2 Servitoren 0,3/s; Essen 7 × 0,3 + 6 × 0,4 + 1,5 × 0,3 + Neophyten
  near(E.rates(s).scrap, (0.9 + 0.3) * P, 'Schrott je Sekunde');
  const food = 4 * 0.5 * 1.25 + 2 * 1.25 - 7 * 0.3 - 1.5 * 0.3 - (6 + 2) * 0.4;
  near(E.rates(s).supplies, food * P, 'Vorräte je Sekunde');
  assert.strictEqual(E.save(E.load(E.save(s))), E.save(s));  // danach normal speicherbar
});

test('Migration v2 → v3: Waren, Bedrohung und Frömmigkeit ×P, Köpfe bleiben', () => {
  const v2 = {
    v: 2, chapter: 'um', serfs: 22 * P, jobs: { scrapper: 10 * P }, tech: { liturgy: true },
    bld: { quarters: 11, scriptorium: 1, apothecarion: 1, arena: 1 },
    res: { supplies: 150, scrap: 100, knowledge: 180, geneseed: 5 * P, aspirants: 1.5 * P, plasteel: 3.5, navdata: 2, renown: 40 },
    marines: { brothers: 6 * P, neophytes: [{ n: P, left: 100 }] }, threat: 120, piety: 400,
    seen: { serfs: true, marines: true },
  };
  const s = E.load(JSON.stringify(v2));
  assert.strictEqual(s.v, 3);
  assert.deepStrictEqual([s.serfs, s.jobs.scrapper, s.marines.brothers, heads(s.marines.neophytes)], [22 * P, 10 * P, 6 * P, P]);
  assert.deepStrictEqual([s.res.geneseed, s.res.aspirants], [5 * P, 1.5 * P]);   // zählten schon als Köpfe
  assert.deepStrictEqual(['supplies', 'scrap', 'knowledge', 'plasteel', 'navdata', 'renown'].map(id => s.res[id]),
    [150 * P, 100 * P, 180 * P, 3.5 * P, 2 * P, 40 * P]);
  assert.deepStrictEqual([s.threat, s.piety], [120 * P, 400 * P]);
  near(E.pietyBonus(s.piety), 0.02, 'Frömmigkeit wirkt wie vorher: √400 ÷ 10 %');
  // je Kopf wie vorher: 10 P Schrottsammler × 0,3, Gedränge 22 P über 20 P −1 %, Frömmigkeit +2 %
  near(E.rates(s).scrap, 10 * 0.3 * 0.99 * 1.02 * P, 'Schrott je Sekunde');
  assert.strictEqual(E.save(E.load(E.save(s))), E.save(s));  // v3 wird nicht noch einmal umgerechnet
});

// ---------- Tempo-Bot ----------

const total = cost => Object.values(cost).reduce((a, b) => a + b, 0);

// Aktives Profil: klickt die ersten 10 Minuten 2× je Sekunde (danach wie ein Mensch nicht mehr), entscheidet alle 10 s.
const MILESTONES = {
  serf: s => s.serfs > 0,
  research: s => Object.keys(s.tech).length > 0,
  wake: s => s.marines.brothers > 0,
  neophyte: s => !!s.seen.neophyte,
  mission: s => !!s.seen.mission,
  forge: s => s.bld.forge > 0,
  reclusiam: s => s.bld.reclusiam > 0,
  trade: s => Object.keys(s.standing).length > 0,
  company: s => s.companies > 0,
  system: s => Object.keys(s.systems).length > 0,
  founding: s => E.foundBlock(s) === null,
};
const track = (s, when) => { for (const k in MILESTONES) if (MILESTONES[k](s)) when[k] ??= s.time; };
// Fester Zufall (mulberry32): gleicher Samen, gleicher Lauf. Sonst streuen die Zeiten um Tage.
function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function withSeed(seed, fn) {
  const old = E.rng;
  E.rng = seeded(seed);
  try { return fn(); } finally { E.rng = old; }
}

function bot(maxSeconds = 3 * 3600, until = ['serf', 'research', 'wake', 'neophyte'], seed = 1) {
  return withSeed(seed, () => botRun(maxSeconds, until));
}
function botRun(maxSeconds, until) {
  const s = E.create('da'), when = {};
  while (s.time < maxSeconds && !until.every(k => k in when)) {
    if (s.time < 600) for (let i = 0; i < 2; i++) E.click(s, s.res.supplies < s.res.scrap ? 'supplies' : 'scrap');
    if (s.time % 10 === 0) think(s);
    E.step(s, 1);
    track(s, when);
  }
  return when;
}

// Lockeres Profil: 4× am Tag (8, 12, 18, 22 Uhr) je 5 Minuten, am ersten Tag wird dabei geklickt.
// Dazwischen läuft simulate() wie bei echter Abwesenheit (offline höchstens 3 Überfälle).
function casualBot(maxDays = 14, until = Object.keys(MILESTONES), seed = 1) {
  return withSeed(seed, () => casualRun(maxDays, until));
}
function casualRun(maxDays, until) {
  const s = E.create('da'), when = {};
  const WINDOWS = [8, 12, 18, 22].map(h => h * 3600);
  while (s.time < maxDays * 86400 && !until.every(k => k in when)) {
    const day = Math.floor(s.time / 86400) * 86400, t = s.time - day;
    const next = WINDOWS.find(w => w + 300 > t);
    const start = next === undefined ? day + 86400 + WINDOWS[0] : day + next;
    if (start > s.time) { E.simulate(s, start - s.time); track(s, when); continue; }
    for (let i = 0; i < 300 && s.time < start + 300; i++) {
      if (s.time < 86400) for (let c = 0; c < 2; c++) E.click(s, s.res.supplies < s.res.scrap ? 'supplies' : 'scrap');
      if (i % 10 === 0) think(s);
      E.step(s, 1);
      track(s, when);
    }
  }
  return when;
}

// Erst die Gebäude, die etwas Neues freischalten; bis sie stehen, spart der Bot dafür.
const KEY_BUILDINGS = ['scriptorium', 'apothecarion', 'mine', 'cells', 'arena', 'forge', 'refinery', 'shrine', 'reclusiam',
  'landingPad', 'orbitalYard'];
const unlocked = (s, list, id) => E.isUnlocked(s, byId(list, id));

function think(s) {
  const open = D.techs.filter(t => E.isUnlocked(s, t) && !s.tech[t.id]).sort((a, b) => total(a.cost) - total(b.cost));
  for (const t of open) E.research(s, t.id);
  for (const p of D.places) if (E.placeState(s, p.id) === 'open') E.scout(s, p.id);
  for (const id of ['apothecary', 'priest', 'techmarine']) {
    const k = Math.min(P - s.offices[id], E.freeBrothers(s));
    if (unlocked(s, D.offices, id) && k > 0) E.setOffice(s, id, k);
  }
  // Flotte: Visionen fangen, Schiffe bauen, Feldzüge mit guter Chance
  if (s.vision > 0) E.catchVision(s);
  for (const x of D.ships) while (E.buildShip(s, x.id));
  if (!s.campaign && s.tech.warpnav) {
    const size = Math.min(D.rules.campaignSquad[1], E.freeBrothers(s) + E.freeWulfen(s));
    const target = D.systems.filter(x => E.reachable(s, x.id)).sort((a, b) => a.threat - b.threat)
      .find(x => size >= D.rules.campaignSquad[0] && E.campaignChance(s, x.id, size) >= 0.7);
    if (target) E.startCampaign(s, target.id, size);
  }
  // Beziehungen: Überschuss tauschen (volle Lager, von Waren ohne Lager 5 Pakete), ab Stufe 2 als Dauerauftrag
  const spare = p => Object.entries(p.give).every(([r, v]) => s.res[r] >= (E.cap(s, r) === Infinity ? 5 * v : Math.max(v, 0.8 * E.cap(s, r))));
  for (const p of D.partners) {
    if (!E.isUnlocked(s, p)) continue;
    if (E.standingLevel(s, p.id) >= 2) E.setStandingOrder(s, p.id, true);
    else if (spare(p)) E.trade(s, p.id);
  }
  // Reclusiam: Fleiß singen lassen, Riten kaufen, sobald der Glaube reicht
  if (s.bld.reclusiam) {
    if (!s.litany) E.chooseLitany(s, 'toil');
    for (const r of D.rites) E.buyRite(s, r.id);
  }
  // Schmiede: Servitoren machen Plastahl, volle Lager werden zu Waren, Verbesserungen sofort kaufen
  if (s.bld.forge) {
    if (!s.servitorRecipe) E.setServitorRecipe(s, 'plasteel');
    const full = id => s.res[id] >= 0.8 * E.cap(s, id);
    // nur ein Teil des vollen Lagers wird zu Waren, der Rest bleibt fürs Bauen; in Paketen zu P Stück
    const part = (id, per) => P * Math.max(1, Math.floor(0.3 * s.res[id] / per / P));
    if (full('scrap')) E.craft(s, 'plasteel', part('scrap', 50));
    // Treibstoff zuerst (Schiffe und Feldzüge), dann Ceramit
    if (s.tech.flight && s.res.fuelcell < 40 * P && s.res.promethium >= 0.5 * E.cap(s, 'promethium')) E.craft(s, 'fuelcell', part('promethium', 60));
    if (full('ore') && full('promethium')) E.craft(s, 'ceramite', part('ore', 40));
    const tablets = open.some(t => (t.cost.datatablet || 0) > s.res.datatablet);
    const allTablets = P * Math.floor(E.craftCount(s, 'datatablet') / P);
    if (full('knowledge') && allTablets && (tablets || (open.length && open[0].cost.knowledge > E.cap(s, 'knowledge')))) {
      E.craft(s, 'datatablet', allTablets);
    }
    for (const u of D.upgrades) E.buyUpgrade(s, u.id);
  }
  // Einsätze mit guter Chance; mit Einsatzplanung als Befehl (Wiederholen)
  for (const m of D.missions) {
    if (!E.isUnlocked(s, m)) continue;
    const size = Math.min(m.squad[1], E.freeBrothers(s) + E.freeWulfen(s));
    if (size < m.squad[0] || E.chance(s, m.id, size) < 0.7) continue;
    if (E.canOrder(s)) E.setOrder(s, m.id, size);
    else E.sendMission(s, m.id, size);
  }
  const lean = () => (s.seen.marines ? E.leanFood(s) : E.rates(s).supplies) / P; // in alten Einheiten; mit Brüdern für den Frost planen
  // Neue Aufgaben bekommen Leute von den Schrottsammlern: 1 Raffineriearbeiter je 2 Bergleute, 1 Prediger je 6 Knechte
  for (const [job, want] of [['refiner', Math.floor(s.jobs.miner / 2)], ['preacher', Math.floor(s.serfs / 6)]]) {
    const k = Math.min(want - s.jobs[job], s.jobs.scrapper - 1);
    if (unlocked(s, D.jobs, job) && k > 0) { E.assign(s, 'scrapper', -k); E.assign(s, job, k); }
  }
  // in Paketen bis P (wie früher je Knecht)
  while (E.free(s) > 0) {
    const job = lean() < 1 && unlocked(s, D.jobs, 'farmer') ? 'farmer'
      : unlocked(s, D.jobs, 'preacher') && s.jobs.preacher * 6 < s.serfs ? 'preacher'
      : unlocked(s, D.jobs, 'refiner') && s.jobs.refiner * 2 < s.jobs.miner ? 'refiner'
      : unlocked(s, D.jobs, 'miner') && s.jobs.miner * 2 < s.jobs.scrapper ? 'miner'
      : unlocked(s, D.jobs, 'scribe') && s.jobs.scribe <= s.jobs.scrapper ? 'scribe' : 'scrapper';
    if (!E.assign(s, job, Math.min(E.free(s), P))) break;
  }
  const food = lean() < 1 ? ['hydroFarm'] : [];
  // Lager zu klein für die nächste Lehre: Archivum oder Skriptorium, je nachdem was billiger ist.
  const needKnow = open.length && open[0].cost.knowledge > E.cap(s, 'knowledge')
    ? ['archivum', 'scriptorium'].filter(id => unlocked(s, D.buildings, id))
      .sort((a, b) => total(E.price(s, 'building', a)) - total(E.price(s, 'building', b))) : [];
  const key = KEY_BUILDINGS.find(id => unlocked(s, D.buildings, id) && !s.bld[id]);
  const rest = key ? [key] : needKnow.length ? needKnow : D.buildings.filter(b => E.isUnlocked(s, b)).map(b => b.id)
    .sort((a, b) => total(E.price(s, 'building', a)) - total(E.price(s, 'building', b)));
  const cheapest = ids => ids.filter(id => unlocked(s, D.buildings, id))
    .sort((a, b) => total(E.price(s, 'building', a)) - total(E.price(s, 'building', b)));
  const house = s.serfs >= E.serfCap(s) ? cheapest(['quarters', 'hab']).slice(0, 1) : [];
  for (const id of [...food, ...house, ...rest]) if (E.build(s, id)) break;
}

const TEMPO = [
  ['Erster Knecht', 'serf', 120, '≈ 1 Min.'],
  ['Erste Lehre', 'research', 300, '≤ 5 Min.'],
  ['Brüder erwachen', 'wake', 1800, '≈ 20 Min. (Mensch ≈ 40)'],
  ['Erster eigener Neophyt', 'neophyte', 5400, '≈ 1 Std. (Mensch ≈ 2)'],
];
const TEMPO_CASUAL = [
  ['Brüder erwachen', 'wake', '≤ ½ Tag'],
  ['Erster eigener Neophyt', 'neophyte', '≈ 1½ Tage'],
  ['Erster Kampfeinsatz', 'mission', '≈ 1½–2 Tage'],
  ['Erste Schmiede', 'forge', '≈ 2½ Tage'],
  ['Reclusiam', 'reclusiam', '≈ 3½ Tage'],
  ['Erster Tausch', 'trade', '≈ 5 Tage'],
  ['1. Kompanie', 'company', '≈ 10–11 Tage'],
  ['Erstes befreites System', 'system', '≈ 6½ Tage'],
  ['Nachfolgeorden möglich', 'founding', '≈ 1–2 Wochen'],
];

test('Tempo: Meilensteine im Ziel (aktiv)', () => {
  const when = bot();
  for (const [name, key, max] of TEMPO) assert.ok(when[key] <= max, `${name} nach ${when[key]} s (höchstens ${max} s)`);
});

function tempo() {
  const when = bot(3 * 3600, Object.keys(MILESTONES)), runs = [1, 2, 3].map(seed => casualBot(14, Object.keys(MILESTONES), seed));
  const clock = sec => (sec === undefined ? '–' : sec < 3600 ? `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')} Min.` : sec >= 86400 ? `${(sec / 86400).toFixed(1)} Tage`
    : `${Math.floor(sec / 3600)}:${String(Math.floor(sec % 3600 / 60)).padStart(2, '0')} Std.`);
  console.log('Aktiv                     Zeit       Ziel');
  for (const [name, key, , goal] of TEMPO) console.log(`${name.padEnd(26)}${clock(when[key]).padEnd(11)}${goal}`);
  console.log('\nLocker (4× am Tag 5 Min., ab dem ersten Blick um 8 Uhr), Median aus 3 Läufen (Spanne)');
  // Der lockere Spieler fängt um 8 Uhr an: ab da wird gezählt
  for (const [name, key, goal] of TEMPO_CASUAL) {
    const t = runs.map(r => (r[key] === undefined ? Infinity : r[key] - 8 * 3600)).sort((a, b) => a - b);
    const c = x => (x === Infinity ? '–' : clock(x));
    console.log(`${name.padEnd(26)}${c(t[1]).padEnd(11)}${goal.padEnd(16)}(${c(t[0])} bis ${c(t[2])})`);
  }
}

function run() {
  let failed = 0;
  for (const [name, fn] of tests) {
    try { fn(); console.log('ok      ' + name); }
    catch (err) { failed++; console.log('FEHLER  ' + name + '\n        ' + err.message); }
  }
  console.log(failed ? `${failed} von ${tests.length} fehlgeschlagen` : `alle ${tests.length} ok`);
  process.exitCode = failed ? 1 : 0;
}

if (process.argv[2] === 'tempo') tempo();
else run();
