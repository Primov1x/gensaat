// Gensaat – Spiellogik ohne DOM. Im Browser global `Engine`, in Node per require().
const Engine = (() => {
  const D = typeof DATA !== 'undefined' ? DATA : require('./data.js');
  const R = D.rules;
  const byId = list => Object.assign(Object.create(null), Object.fromEntries(list.map(x => [x.id, x])));
  const RES = byId(D.resources), BLD = byId(D.buildings), JOB = byId(D.jobs), TECH = byId(D.techs), CH = byId(D.chapters);
  const OFF = byId(D.offices), PLACE = byId(D.places), MISSION = byId(D.missions);
  const RECIPE = byId(D.recipes), UPG = byId(D.upgrades), PER_UNIT = D.resources.filter(r => r.perUnit);
  const RITE = byId(D.rites), LITANY = byId(D.litanies), PARTNER = byId(D.partners), WORLD = byId(D.worldEvents);
  const SHIP = byId(D.ships), SYSTEM = byId(D.systems), RELIC = byId(D.relics), PALETTE = byId(D.palettes);
  // Effekt-Schlüssel, die Ordens-Ereignisse als Bonus vergeben (Import-Schutz für s.boons)
  const BOON_KEYS = new Set(Object.values(D.chapterEvents).flat().flatMap(ev => Object.keys(ev.boon || {})));
  const THIRST_MAX = 100; // Roter Durst in Prozent
  const num = v => (Math.round(v * 10) / 10).toLocaleString('de-DE'); // Zahlen im Log
  const P = R.popScale; // Etappe 10: alle Mengen ×P; Köpfe kommen in Schüben zu P, die Schmiede arbeitet in P Stück
  const CLICKS = new Set(D.clicks.map(c => c.id));
  const pad3 = n => String(n).padStart(3, '0');

  // ---------- Spielstand ----------

  // meta überlebt Neustarts: Liber Honoris, Vermächtnis, Relikte, Linienstufen, Zahl der Gründungen.
  // opts (Nachfolgeorden): name, palette (null = Farben der Linie).
  function create(chapterId, meta = null, opts = {}) {
    const ch = CH[chapterId];
    if (!ch) throw new Error('Unbekannter Orden');
    const s = {
      v: R.saveVersion, time: 0, savedAt: 0, chapter: ch.id, name: opts.name || ch.name,
      palette: PALETTE[opts.palette] ? opts.palette : null,
      res: {}, bld: {}, jobs: {}, tech: {}, seen: {},
      serfs: 0, arrival: 0, hungry: 0, isHungry: false,
      // neophytes/implants: Schübe { n: Köpfe, left: Restsekunden }
      marines: { coma: R.comaBrothers, brothers: 0, neophytes: [], implants: [], servitors: 0, wulfen: 0 },
      offices: {}, places: {}, scouts: [],
      missions: [], orders: {}, threat: 0, raidTimer: 0,
      upgrades: {}, servitorRecipe: null, autoJob: null, craftAcc: 0, autoHousing: true,
      rites: {}, litany: null, litanyLeft: 0, piety: 0, boons: [], companies: 0,
      thirst: 0, deathCompany: 0, eventIn: R.eventEvery, flairIn: R.flairEvery,
      standing: {}, standingOrders: {}, orderTimer: 0, visionIn: R.visionEvery, vision: 0,
      worldIn: Object.fromEntries(D.worldEvents.map(w => [w.id, w.every])), storm: 0, docked: false,
      ships: Object.fromEntries(D.ships.map(x => [x.id, 0])), systems: {}, campaign: null,
      log: [], logSeq: 0,
      meta: {
        honors: [...(meta?.honors || [])], legacy: meta?.legacy || 0, legacyFree: meta?.legacyFree || 0,
        relics: { ...meta?.relics }, lines: { ...meta?.lines }, foundings: meta?.foundings || 0,
      },
    };
    for (const r of D.resources) s.res[r.id] = 0;
    for (const b of D.buildings) s.bld[b.id] = 0;
    for (const j of D.jobs) s.jobs[j.id] = 0;
    for (const o of D.offices) s.offices[o.id] = 0;
    // Startpakete der Relikte (nur bei einem neuen Lauf, nicht beim Laden)
    for (const r of D.relics) {
      const st = s.meta.relics[r.id] && r.start;
      if (!st) continue;
      for (const id in st.res || {}) s.res[id] += st.res[id];
      for (const id in st.bld || {}) s.bld[id] += st.bld[id];
      for (const id of st.tech || []) s.tech[id] = true;
      for (const id of st.places || []) s.places[id] = true;
      s.marines.coma += st.coma || 0;
    }
    if (s.meta.foundings) {
      log(s, `Der Nachfolgeorden ${s.name} ist gegründet. Linie: ${ch.name}.`);
      log(s, `${num(s.marines.coma)} Brüder der Gründung liegen im Sus-an-Koma. Kharos Tertius wartet.`);
    } else {
      log(s, `Die „${ch.ship}“ ist über Kharos Tertius zerschellt. Du lebst.`);
      log(s, `${num(s.marines.coma)} Brüder liegen im Sus-an-Koma. Die Ruinen schweigen.`);
    }
    return s;
  }

  function log(s, text) {
    s.log.push({ id: ++s.logSeq, date: calendar(s).date, text });
    if (s.log.length > R.logMax) s.log.splice(0, s.log.length - R.logMax);
  }

  // Meilenstein für den Liber Honoris (Reiter ab Etappe 8); bleibt über Neustarts.
  function honor(s, text) {
    s.meta.honors.push({ date: calendar(s).date, chapter: s.name, text });
    if (s.meta.honors.length > R.honorsMax) s.meta.honors.splice(0, s.meta.honors.length - R.honorsMax);
  }

  // ---------- Zeit ----------

  // Imperiales Datum 0.FFF.JJJ.M42: FFF ist die Sekunde im Jahr (ein Jahr = 1.000 s), JJJ das Jahr ab 012;
  // nach 999.M42 kommt 000.M43.
  function calendar(s) {
    const n = Math.floor(s.time / R.yearLength);
    const t = s.time - n * R.yearLength;
    const season = Math.min(R.seasons.length - 1, Math.floor(t / R.seasonLength));
    return {
      year: R.startYear + n,
      season,
      seasonName: R.seasons[season].name,
      seasonLeft: (season + 1) * R.seasonLength - t,
      date: `0.${pad3(Math.floor(t))}.${pad3((R.startYear + n) % 1000)}.M${42 + Math.floor((R.startYear + n) / 1000)}`,
    };
  }

  // ---------- Werte ----------

  // Summe aller Effekte (Orden, Gebäude, Lehren); zwischengespeichert bis zur nächsten Änderung.
  // Jobs zählen nicht hierher: ihr Ertrag hängt an Moral und Job-Boni und entsteht in rates().
  function effects(s) {
    if (s._eff) return s._eff;
    const e = {};
    const add = (fx, n) => { for (const k in fx) e[k] = (e[k] || 0) + fx[k] * n; };
    const ch = CH[s.chapter], line = s.meta.lines[s.chapter] || 0;
    add(ch.effects, 1);
    for (const k of ch.boost) e[k] += ch.effects[k] * R.lineBoost * line; // Linienstufe verstärkt den Bonus der Linie
    for (const r of D.relics) if (s.meta.relics[r.id] && r.effects) add(r.effects, 1);
    for (const b of D.buildings) if (s.bld[b.id]) add(b.effects, s.bld[b.id]);
    for (const t of D.techs) if (s.tech[t.id] && t.effects) add(t.effects, 1);
    for (const p of D.places) if (s.places[p.id] && p.effects) add(p.effects, 1);
    for (const u of D.upgrades) if (s.upgrades[u.id]) add(u.effects, 1);
    for (const r of D.rites) if (s.rites[r.id]) add(r.effects, 1);
    for (const b of s.boons) add({ [b.key]: b.value }, 1);
    for (const o of D.offices) if (s.offices[o.id] && o.effects) add(o.effects, s.offices[o.id]);
    for (const p of D.partners) add(p.help, standingLevel(s, p.id)); // Hilfe je Ansehen-Stufe
    for (const x of D.ships) if (s.ships[x.id]) add(x.effects, s.ships[x.id]);
    for (const x of D.systems) if (s.systems[x.id] && x.effects) add(x.effects, 1);
    if (s.storm > 0) add(WORLD.storm.effects, 1);
    if (s.seen.cult) add(WORLD.cult.effects, 1);
    return (s._eff = e);
  }
  const dirty = s => { s._eff = null; };
  const standingLevel = (s, id) => R.standingLevels.filter(t => (s.standing[id] || 0) >= t - 1e-9).length;
  // Summe aus den Effekten plus Stückwirkungen (z. B. je Datentafel +50 Wissen-Lager; hängt am Bestand, daher nicht zwischengespeichert).
  function bonus(s, key) {
    let v = effects(s)[key] || 0;
    for (const r of PER_UNIT) {
      const per = r.perUnit[key];
      if (per) v += Math.min(r.perUnitMax?.[key] ?? Infinity, per * Math.floor(s.res[r.id] + 1e-9));
    }
    // Die laufende Litanei wirkt verstärkt durch Reclusiam, Fest des Primarchen und Reliquiare.
    const lit = s.litany && LITANY[s.litany];
    if (lit && lit.effects[key]) v += lit.effects[key] * (1 + bonus(s, 'litany.bonus'));
    return v;
  }

  // Lager-Boni gelten nicht für Bevölkerung (pop), etwa Aspiranten.
  const legacyPct = s => s.meta.legacy * R.legacyPct;
  const cap = (s, id) => (RES[id].cap + bonus(s, id + '.cap'))
    * (RES[id].pop ? 1 : 1 + bonus(s, 'cap.bonus') + bonus(s, id + '.capPct') + legacyPct(s));
  const serfCap = s => Math.floor(bonus(s, 'serfs.cap') * (1 + bonus(s, 'serfs.capPct')) + 1e-9);
  const free = s => s.serfs - D.jobs.reduce((n, j) => n + s.jobs[j.id], 0);

  // Brüder-Plätze teilen sich Kampfbrüder, Wulfen, Neophyten und laufende Implantationen.
  const marineCap = s => R.marineBase + bonus(s, 'marines.cap');
  const heads = list => list.reduce((n, b) => n + b.n, 0); // Köpfe in Schüben
  const marinesUsed = s => {
    const m = s.marines;
    return m.brothers + m.wulfen + heads(m.neophytes) + heads(m.implants);
  };
  const officeCount = s => D.offices.reduce((n, o) => n + s.offices[o.id], 0);
  const away = (s, kind) => s.missions.reduce((n, x) => n + x[kind], 0) + (s.campaign ? s.campaign[kind] : 0);
  // Ein Aufklärer-Trupp bindet P Brüder.
  const freeBrothers = s => s.marines.brothers - officeCount(s) - s.scouts.length * P - away(s, 'brothers');
  const freeWulfen = s => s.marines.wulfen - away(s, 'wulfen');
  const power = (s, brothers, wulfen) =>
    (brothers * R.powerBrother + wulfen * R.powerWulf) * (1 + bonus(s, 'power.bonus'));
  // Daheim verteidigen freie Brüder und Wulfen voll, Amtsträger halb; Bastionen zählen fest.
  const defense = s => power(s, freeBrothers(s) + officeCount(s) / 2, freeWulfen(s)) * (1 + bonus(s, 'defense.bonus'))
    + bonus(s, 'defense.flat');
  const companies = s => Math.floor(s.marines.brothers / R.companySize);
  // Frömmigkeit aus der Großen Messe: √F ÷ 10 % (F in alten Einheiten, also ÷P).
  const pietyBonus = piety => Math.sqrt(piety / P) / 1000;
  // Bonus auf die gesamte Produktion: Effekte, volle Kompanien, Frömmigkeit.
  const productionBonus = s => bonus(s, 'production.bonus') + legacyPct(s)
    + companies(s) * (R.companyBonus + bonus(s, 'company.bonus')) + pietyBonus(s.piety);
  const officeName = (s, id) => OFF[id].names?.[s.chapter] || OFF[id].name;
  const brotherName = s => { const n = CH[s.chapter].names; return n[s.logSeq % n.length]; };

  // Nimmt n Knechte aus Jobs: immer vom größten Job, Bauern zuletzt.
  function takeJobs(s, n) {
    while (n > 0) {
      const busy = D.jobs.filter(j => s.jobs[j.id] > 0);
      if (!busy.length) return;
      const others = busy.filter(j => !j.farm);
      const j = (others.length ? others : busy).reduce((a, b) => (s.jobs[b.id] > s.jobs[a.id] ? b : a));
      const k = Math.min(n, s.jobs[j.id]);
      s.jobs[j.id] -= k;
      n -= k;
    }
  }
  // n Knechte gehen (Flucht, Überfall, Servitor): erst die ohne Job, dann aus Jobs.
  function dismiss(s, n) {
    n = Math.min(n, s.serfs);
    takeJobs(s, n - Math.min(n, Math.max(0, free(s))));
    s.serfs -= n;
    return n;
  }

  const LUXURY = D.resources.filter(r => r.luxury);
  // Moral der Knechte. withHunger = false für Bauern: Hunger darf die Nahrung nicht bremsen (Teufelskreis).
  function moral(s, withHunger = true) {
    const luxury = LUXURY.filter(r => s.res[r.id] >= 1 - 1e-9).length * R.luxuryMoral;
    const faith = Math.min(R.preacherMoralMax, R.preacherMoral * (s.jobs.preacher || 0)) + R.priestMoral * (s.offices.priest || 0);
    const m = 1 + luxury + faith + bonus(s, 'moral.bonus') - R.crowdPenalty * Math.max(0, s.serfs - R.crowdFree)
      - (withHunger && s.isHungry ? R.hungerPenalty : 0);
    return Math.max(R.moralMin, m);
  }

  // Raten je Sekunde, Essen schon abgezogen. season: Planetenzeit (Standard: die jetzige).
  function rates(s, season = calendar(s).season) {
    const mult = R.seasons[season].mult, out = {};
    for (const r of D.resources) out[r.id] = 0;
    const add = (fx, n) => { for (const k in fx) if (k.endsWith('.rate')) out[k.slice(0, -5)] += fx[k] * n; };
    for (const b of D.buildings) if (s.bld[b.id]) add(b.effects, s.bld[b.id]);
    const jobs = bonus(s, 'jobs.bonus');
    for (const j of D.jobs) {
      if (s.jobs[j.id]) add(j.effects, s.jobs[j.id] * moral(s, !j.farm) * (1 + jobs + bonus(s, 'job.' + j.id)));
    }
    for (const o of D.offices) if (s.offices[o.id] && o.effects) add(o.effects, s.offices[o.id]);
    const m = s.marines;
    if (!servitorsCrafting(s)) out.scrap += m.servitors * R.servitorScrap * (1 + bonus(s, 'servitor.bonus'));
    out.geneseed += m.brothers * R.geneseedRate;
    const prod = 1 + productionBonus(s);
    for (const id in out) out[id] *= (1 + bonus(s, id + '.bonus')) * (mult[id] ?? 1) * (RES[id].pop ? 1 : prod);
    out.supplies -= R.serfFood * s.serfs + R.aspirantFood * s.res.aspirants
      + R.marineFood * (m.brothers + m.wulfen + heads(m.neophytes));
    for (const r of LUXURY) if (s.res[r.id] > 0) out[r.id] -= R.luxuryUse * s.serfs;
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
    flairTick(s, dt); // zuerst: echte Meldungen desselben Augenblicks stehen danach oben
    const r = rates(s);
    for (const id in r) {
      const v = s.res[id] + r[id] * dt;
      s.res[id] = Math.min(cap(s, id), Math.max(0, v));
      if (s.res[id] > 0) s.seen[id] = true;
      if (id === 'supplies') hunger(s, v < 0 && s.serfs > 0, dt);
    }
    arrivals(s, dt);
    marinesTick(s, dt);
    threatTick(s, dt);
    craftTick(s, dt);
    orderTick(s, dt);
    fleetTick(s, dt);
    s.time += dt;
  }

  // Flair ohne Zufall (Auswahl über die Log-Nummer), damit Tests mit festem Zufall unberührt bleiben.
  // Nicht beim Nachholen (s._raids gesetzt): sonst verdrängt eine Nacht voller Flair die echten Meldungen.
  function flairTick(s, dt) {
    if (!s.seen.serfs || s._raids !== undefined || (s.flairIn -= dt) > 1e-9) return;
    s.flairIn = R.flairEvery;
    const pool = D.flair.filter(t => !t.includes('{name}') || s.marines.brothers > 0);
    log(s, pool[s.logSeq % pool.length].replace('{name}', brotherName(s)));
  }

  function hunger(s, hungry, dt) {
    if (!hungry) { s.isHungry = false; s.hungry = 0; return; }
    s.isHungry = true;
    s.hungry += dt;
    const limit = R.fleeAfter * (1 + bonus(s, 'flee.slow'));
    if (s.hungry < limit - 1e-9) return;
    s.hungry -= limit;
    const n = dismiss(s, P);
    log(s, `${num(n)} Knechte fliehen in die Wüste. Die Vorräte reichten nicht.`);
  }

  // Warum gerade niemand kommt: 'full', 'hungry', 'frost', 'food' oder null (es kann jemand kommen).
  // Der allererste Schub kommt immer; danach nur, solange der Überschuss für einen weiteren Knecht reicht.
  function arrivalBlock(s) {
    if (s.serfs >= serfCap(s)) return 'full';
    if (s.isHungry) return 'hungry';
    if (R.seasons[calendar(s).season].noArrival) return 'frost';
    if ((s.serfs > 0 || s.seen.serfs) && rates(s).supplies < R.serfFood - 1e-9) return 'food';
    return null;
  }

  // Zuzug läuft stetig (ein Knecht je arrivalEvery, also P je alter Zuzugs-Zeit); der erste Schub kommt auf einmal.
  // Das Log fasst zusammen: höchstens eine Zeile je arrivalLogEvery (s._arrived zählt bis dahin mit).
  function arrivals(s, dt) {
    if (arrivalBlock(s)) { s.arrival = 0; flushArrivals(s); return; }
    s.arrival += dt;
    const every = R.arrivalEvery / (1 + bonus(s, 'arrival.bonus'));
    if (!s.seen.serfs) {
      if (s.arrival < every * P - 1e-9) return;
      s.arrival = 0;
      addSerfs(s, Math.min(P, serfCap(s)));
      log(s, 'Überlebende kriechen aus den Ruinen. Sie schwören dir Treue.');
      honor(s, 'Die ersten Knechte schließen sich dem Orden an.');
      s.seen.serfs = true;
      s._arrivedAt = s.time;
      return;
    }
    // so viele, wie Zeit, Platz und Überschuss hergeben (keiner kommt, der danach hungert)
    const n = Math.min(Math.floor(s.arrival / every + 1e-9), serfCap(s) - s.serfs,
      Math.floor(rates(s).supplies / R.serfFood + 1e-9));
    if (n < 1) return;
    s.arrival = Math.min(s.arrival - n * every, every); // was Platz oder Vorräte nicht hergaben, staut sich nicht auf
    addSerfs(s, n);
    s._arrived = (s._arrived || 0) + n;
    if (s.time - (s._arrivedAt ?? -Infinity) >= R.arrivalLogEvery - 1e-9) flushArrivals(s);
  }
  function addSerfs(s, n) {
    s.serfs += n;
    const job = JOB[s.autoJob];
    if (job && isUnlocked(s, job)) s.jobs[job.id] += n;
  }
  function flushArrivals(s) {
    if (s._arrived > 0) log(s, `+${num(s._arrived)} Knechte ziehen ein.`);
    s._arrived = 0;
    s._arrivedAt = s.time;
  }

  // ---------- Marines ----------

  function wake(s) {
    const n = s.marines.coma;
    s.marines.brothers += n;
    s.marines.coma = 0;
    s.seen.marines = true;
    log(s, `Das Apothecarion summt. ${n} Brüder öffnen die Augen.`);
    honor(s, 'Die Brüder erwachen aus dem Sus-an-Koma.');
  }

  // Vorräte-Überschuss in der schlechtesten Planetenzeit (Frostzeit).
  const leanFood = s => Math.min(...R.seasons.map((_, i) => rates(s, i).supplies));

  // Warum gerade keine Implantation startet: 'lore', 'aspirant', 'geneseed', 'slot', 'cells', 'food' oder null.
  // Ein Schub braucht P Aspiranten, P Gensaat, P Implantationsplätze und Platz für P Brüder.
  // 'food': Auch in der Frostzeit müssen P weitere Brüder satt werden – sonst verhungern die Knechte
  // im nächsten Winter und alles steht still. Laufende Schübe zählen schon mit.
  function implantBlock(s) {
    const m = s.marines;
    if (!s.tech.geneseedlore) return 'lore';
    if (s.res.aspirants < P - 1e-9) return 'aspirant';
    if (s.res.geneseed < P - 1e-9) return 'geneseed';
    if (heads(m.implants) + P > bonus(s, 'implant.slots') + 1e-9) return 'slot';
    if (marinesUsed(s) + P > marineCap(s) + 1e-9) return 'cells';
    if (s.isHungry || leanFood(s) < R.marineFood * P * (1 + m.implants.length) - 1e-9) return 'food';
    return null;
  }

  // Binomial-Zufall: je Kopf ein Wurf (Erfolg, wenn Zufall < p).
  // ponytail: ab 4.096 Köpfen Normalnäherung (gerundet, auf 0…n begrenzt); die Schlachten (Etappe 13) rechnen eigene Massen.
  function binom(n, p) {
    if (n <= 0 || p <= 0) return 0;
    if (p >= 1) return n;
    if (n <= 4096) {
      let k = 0;
      for (let i = 0; i < n; i++) if (api.rng() < p) k++;
      return k;
    }
    const z = Math.sqrt(-2 * Math.log(Math.max(api.rng(), 1e-12))) * Math.cos(2 * Math.PI * api.rng());
    return Math.min(n, Math.max(0, Math.round(n * p + z * Math.sqrt(n * p * (1 - p)))));
  }

  // Ergebnis je Kopf: Erfolg, sonst Wulf (Space Wolves), sonst halb Servitor, halb tot.
  function implantDone(s, n) {
    const m = s.marines;
    const chance = Math.min(R.implantChanceMax,
      R.implantChance + R.apothecaryChance * s.offices.apothecary + bonus(s, 'implant.bonus'));
    const ok = binom(n, chance), wulfen = binom(n - ok, bonus(s, 'implant.wulfen'));
    const servitors = binom(n - ok - wulfen, 0.5), dead = n - ok - wulfen - servitors;
    if (ok) m.neophytes.push({ n: ok, left: R.trainingTime });
    m.wulfen += wulfen;
    m.servitors += servitors;
    const parts = [`${num(ok)} Neophyten`, wulfen && `${num(wulfen)} Wulfen`, servitors && `${num(servitors)} Servitoren`,
      dead && `${num(dead)} tot`].filter(Boolean);
    log(s, `Implantation: ${parts.join(', ')}.`);
    if (ok && !s.seen.neophyte) { s.seen.neophyte = true; honor(s, 'Die ersten eigenen Neophyten.'); }
  }

  // Implantationen, Ausbildung und Aufklärung laufen weiter; neue Implantationen starten von selbst.
  function marinesTick(s, dt) {
    const m = s.marines;
    const implantSpeed = 1 / (1 - Math.min(R.apothecarySpeedMax, R.apothecarySpeed * s.offices.apothecary));
    for (let i = m.implants.length - 1; i >= 0; i--) {
      m.implants[i].left -= dt * implantSpeed;
      if (m.implants[i].left <= 1e-9) implantDone(s, m.implants.splice(i, 1)[0].n);
    }
    const trainSpeed = 1 / (1 - Math.min(R.trainingSpeedMax, bonus(s, 'training.speed')));
    for (let i = m.neophytes.length - 1; i >= 0; i--) {
      const b = m.neophytes[i];
      b.left -= dt * trainSpeed;
      if (b.left > 1e-9) continue;
      m.neophytes.splice(i, 1);
      m.brothers += b.n;
      log(s, `${num(b.n)} Neophyten legen die Servorüstung an. Neue Kampfbrüder.`);
    }
    while (!implantBlock(s)) {
      s.res.aspirants -= P;
      s.res.geneseed -= P;
      m.implants.push({ n: P, left: R.implantTime });
    }
    for (let i = s.scouts.length - 1; i >= 0; i--) {
      s.scouts[i].left -= dt;
      if (s.scouts[i].left <= 1e-9) discover(s, s.scouts.splice(i, 1)[0].place);
    }
    for (let i = s.missions.length - 1; i >= 0; i--) {
      s.missions[i].left -= dt;
      if (s.missions[i].left <= 1e-9) missionDone(s, s.missions.splice(i, 1)[0]);
    }
    if (canOrder(s)) for (const id in s.orders) sendMission(s, id, s.orders[id], true);
  }

  // ---------- Kampf ----------

  // Chance aus dem Kräfteverhältnis r: 50 % bei Gleichstand, 90 % bei doppelter Stärke, begrenzt auf 5–95 %.
  const odds = r => Math.min(0.95, Math.max(0.05, 0.5 + 0.4 * Math.log2(r)));
  // Wulfen gehen zuerst, der Rest sind Kampfbrüder.
  const squadOf = (s, size) => { const w = Math.min(freeWulfen(s), size); return { brothers: size - w, wulfen: w }; };
  // Die Todeskompanie verdoppelt die Kampfkraft ihres Trupps.
  function chance(s, id, size) {
    const q = squadOf(s, size);
    return odds(power(s, q.brothers, q.wulfen) * (s.deathCompany ? 2 : 1) / MISSION[id].threat);
  }
  const canOrder = s => !!(s.tech.planning || bonus(s, 'mission.repeat'));

  function missionDone(s, run) {
    const m = MISSION[run.id], ch = CH[s.chapter], r = power(s, run.brothers, run.wulfen) * (run.dc ? 2 : 1) / m.threat;
    const won = api.rng() < odds(r), got = [];
    if (won) {
      const more = id => 1 + bonus(s, 'loot.bonus') + (id === 'archeotech' ? bonus(s, 'loot.archeotech') : 0)
        + (id === 'renown' ? bonus(s, 'renown.bonus') : 0);
      const gain = (id, v) => {
        s.res[id] = Math.min(cap(s, id), s.res[id] + v);
        s.seen[id] = true;
        got.push(`+${num(v)} ${RES[id].name}`);
      };
      for (const id in m.loot) gain(id, m.loot[id] * more(id));
      for (const id in m.lucky || {}) {
        const [p, n] = m.lucky[id];
        if (api.rng() < p) gain(id, n * more(id));
      }
      if (m.calm) s.threat = Math.max(0, s.threat - m.calm);
      if (m.clears) delete s.seen[m.clears];
      if (m.sets) s.seen[m.sets] = true;
      if (m.clears || m.sets) dirty(s);
    }
    log(s, won ? `Sieg: ${m.name}. ${got.join(', ')}.` : `Rückzug: ${m.name}. Keine Beute.`);
    if (!s.seen.mission) { s.seen.mission = true; honor(s, `Erster Kampfeinsatz: ${m.name}.`); }
    casualties(s, run, r, won);
    // Der Bruder der Todeskompanie fällt immer; seine Gensaat wird immer geborgen.
    if (run.dc) {
      s.res.geneseed = Math.min(cap(s, 'geneseed'), s.res.geneseed + run.dc);
      log(s, 'Die Todeskompanie fällt bis zum letzten Mann. Ihre Gensaat ist geborgen.');
    }
    if (bonus(s, 'thirst')) s.thirst = Math.min(THIRST_MAX, s.thirst + R.thirstPerMission);
  }

  // Verluste nach Einsatz oder Feldzug: je Mitglied eine Verlust-Chance (als Binomial-Zufall), die Gensaat Gefallener
  // wird teils geborgen. Das Log nennt Summen, keine Namen.
  function casualties(s, run, r, won) {
    const loss = Math.min(R.lossMax, (won ? R.lossWin : R.lossFail) / r) * (1 - bonus(s, 'loss.reduce'));
    const keep = Math.min(R.recoverMax,
      R.recoverChance + R.recoverApothecary * s.offices.apothecary + bonus(s, 'recover.bonus'));
    const brothers = binom(run.brothers, loss), wulfen = binom(run.wulfen, loss), seed = binom(brothers, keep);
    s.marines.brothers -= brothers;
    s.marines.wulfen -= wulfen;
    if (seed) s.res.geneseed = Math.min(cap(s, 'geneseed'), s.res.geneseed + seed);
    if (!brothers && !wulfen) return;
    const fallen = [brothers && `${num(brothers)} Brüder`, wulfen && `${num(wulfen)} Wulfen`].filter(Boolean);
    log(s, `Gefallen: ${fallen.join(', ')}.` + (seed ? ` Gensaat geborgen: ${num(seed)}.` : ''));
    if (!s.seen.fallen && brothers) { s.seen.fallen = true; honor(s, 'Die ersten Brüder fallen im Kampf.'); }
  }

  // Ab der Aschewüste wächst die Bedrohung; alle raidEvery Sekunden kommt ein Überfall, wenn sie die Verteidigung übersteigt.
  // s._raids: Rest-Budget an Überfällen während simulate() (offline höchstens raidsOffline).
  function threatTick(s, dt) {
    if (!s.places.ashwaste) return;
    s.threat = Math.min(R.threatMax, s.threat + R.threatRate * (1 - bonus(s, 'threat.slow')) * dt);
    s.raidTimer += dt;
    if (s.raidTimer < R.raidEvery - 1e-9) return;
    s.raidTimer -= R.raidEvery;
    if (s.threat <= defense(s) || s._raids === 0) return;
    if (s._raids > 0) s._raids--;
    for (const id of ['supplies', 'scrap', 'ore']) s.res[id] *= 1 - R.raidLoss;
    let text = 'Ork-Überfall! Ein Zehntel der Lager ist geplündert.';
    if (s.serfs > 0 && api.rng() < R.raidTake) text += ` ${num(dismiss(s, P))} Knechte werden verschleppt.`;
    log(s, text);
  }

  // Einsatzdauer: Orden (z. B. White Scars) und Planetenzeit (Sturmzeit) zählen beim Aufbruch;
  // bei der Aufklärung (scouting) auch Servoschädel und Auspex.
  const missionTime = (s, base, scouting = false) => base * (1 - bonus(s, 'mission.speed'))
    * (R.seasons[calendar(s).season].missionTime || 1) * (scouting ? 1 - Math.min(R.scoutSpeedMax, bonus(s, 'scout.speed')) : 1);

  // 'done' entdeckt, 'away' Aufklärer unterwegs, 'open' aufklärbar, 'hidden' noch „???“.
  // Sichtbar sind entdeckte Orte und die nächsten zwei.
  function placeState(s, id) {
    if (s.places[id]) return 'done';
    if (s.scouts.some(x => x.place === id)) return 'away';
    let open = 0;
    for (const p of D.places) {
      if (s.places[p.id] || !isUnlocked(s, p)) continue;
      if (p.id === id) return open < 2 ? 'open' : 'hidden';
      open++;
    }
    return 'hidden';
  }

  function discover(s, id) {
    const p = PLACE[id];
    s.places[id] = true;
    for (const r in p.reward || {}) s.res[r] = Math.min(cap(s, r), s.res[r] + p.reward[r]);
    dirty(s);
    log(s, `Aufklärung abgeschlossen: ${p.name} entdeckt.`);
    honor(s, `Ort entdeckt: ${p.name}.`);
  }

  // ---------- Schmiede ----------

  const craftYield = s => 1 + bonus(s, 'craft.bonus');
  const recipeOpen = (s, id) => !!(RECIPE[id] && s.bld.forge && isUnlocked(s, RES[id]));
  // Wie oft das Rezept gerade bezahlbar ist.
  const craftCount = (s, id) => Math.min(...Object.entries(RECIPE[id].cost).map(([r, v]) => Math.floor(s.res[r] / v + 1e-9)));
  // Servitoren mit Rezept arbeiten in der Schmiede statt Schrott zu sammeln, je Arbeitsgang P Stück.
  // Sie verarbeiten nur Überschuss: Zutaten mit Lager erst ab servitorFill; Waren ohne Lager immer.
  const surplus = (s, id) => Object.keys(RECIPE[id].cost)
    .every(r => cap(s, r) === Infinity || s.res[r] >= R.servitorFill * cap(s, r) - 1e-9);
  const servitorsCrafting = s => !!(s.servitorRecipe && s.bld.forge);

  function craftTick(s, dt) {
    if (!servitorsCrafting(s) || !s.marines.servitors) return;
    s.craftAcc += s.marines.servitors * R.craftRate * (1 + bonus(s, 'servitor.bonus')) * dt;
    while (s.craftAcc >= 1 - 1e-9 && craftCount(s, s.servitorRecipe) >= P && surplus(s, s.servitorRecipe)) {
      craft(s, s.servitorRecipe, P);
      s.craftAcc -= 1;
    }
    s.craftAcc = Math.min(Math.max(0, s.craftAcc), 1); // fehlen Zutaten, staut sich nichts auf
  }

  // Sichtbar, sobald eine Schmiede steht und alle Ressourcen in den Kosten freigeschaltet sind.
  const upgradeVisible = (s, id) => !!(UPG[id] && s.bld.forge && isUnlocked(s, UPG[id])
    && Object.keys(UPG[id].cost).every(r => isUnlocked(s, RES[r])));

  // ---------- Reclusiam und Orden ----------

  const litanyCost = s => R.litanyCost + Math.floor(s.serfs / R.litanyPerSerfs);
  const litanyOpen = (s, id) => !!(LITANY[id] && s.bld.reclusiam
    && list(LITANY[id].requires?.rite).every(r => s.rites[r]));

  function buyRite(s, id) {
    const r = RITE[id], cost = { faith: r?.cost };
    if (!r || !s.bld.reclusiam || s.rites[id] || !canAfford(s, cost)) return false;
    pay(s, cost);
    s.rites[id] = true;
    dirty(s);
    log(s, `Ritus vollzogen: ${r.name}.`);
    return true;
  }

  // Die gewählte Litanei gilt ein Jahr und erneuert sich dann von selbst; null lässt sie verstummen.
  function chooseLitany(s, id) {
    if (id === null) { s.litany = null; s.litanyLeft = 0; return true; }
    const cost = { faith: litanyCost(s) };
    if (!litanyOpen(s, id) || s.litany === id || !canAfford(s, cost)) return false;
    pay(s, cost);
    s.litany = id;
    s.litanyLeft = R.litanyTime;
    log(s, `Die Brüder stimmen eine Litanei an: ${LITANY[id].name}.`);
    return true;
  }

  // Große Messe: opfert allen Glauben; die Frömmigkeit bleibt für immer.
  function grandMass(s) {
    const f = s.res.faith;
    if (!s.bld.reclusiam || f < 1 - 1e-9) return false;
    s.piety += f;
    s.res.faith = 0;
    log(s, `Große Messe: ${num(f)} Glaube geopfert. Die Frömmigkeit wächst.`);
    if (!s.seen.mass) { s.seen.mass = true; honor(s, 'Die erste Große Messe.'); }
    return true;
  }

  // Ordens-Ereignis: genau eine Wirkung (Geschenk, Bonus für ein Jahr, Durst, Merker oder weniger Bedrohung).
  function chapterEvent(s) {
    const evs = D.chapterEvents[s.chapter], ev = evs[Math.floor(api.rng() * evs.length)], got = [];
    for (const id in ev.gift || {}) {
      s.res[id] = Math.min(cap(s, id), s.res[id] + ev.gift[id]);
      s.seen[id] = true;
      got.push(` +${num(ev.gift[id])} ${RES[id].name}.`);
    }
    for (const key in ev.boon || {}) s.boons.push({ key, value: ev.boon[key], left: R.yearLength });
    if (ev.boon) dirty(s);
    if (ev.thirst) s.thirst = Math.min(THIRST_MAX, Math.max(0, s.thirst + ev.thirst));
    if (ev.sign) s.seen[ev.sign] = true;
    if (ev.calm) s.threat = Math.max(0, s.threat - ev.calm);
    log(s, ev.text.replace('{name}', brotherName(s)) + got.join(''));
  }

  // Schwarzer Zorn: P freie Brüder gehen in die Todeskompanie und warten auf den nächsten Kampfeinsatz.
  function blackRage(s) {
    s.thirst = R.thirstAfterRage;
    s.marines.brothers -= P;
    s.deathCompany = P;
    log(s, `Schwarzer Zorn! ${num(P)} Brüder verlieren sich in der Vision und warten in der Todeskompanie.`);
  }

  function orderTick(s, dt) {
    if (s.litany && (s.litanyLeft -= dt) <= 1e-9) {
      const cost = { faith: litanyCost(s) };
      if (canAfford(s, cost)) { pay(s, cost); s.litanyLeft += R.litanyTime; }
      else {
        log(s, `Die Litanei „${LITANY[s.litany].name}“ verklingt. Der Glaube reicht nicht.`);
        s.litany = null;
        s.litanyLeft = 0;
      }
    }
    if (s.boons.length) {
      for (const b of s.boons) b.left -= dt;
      if (s.boons.some(b => b.left <= 1e-9)) { s.boons = s.boons.filter(b => b.left > 1e-9); dirty(s); }
    }
    for (const n = companies(s); s.companies < n;) {
      s.companies++;
      log(s, `Die ${s.companies}. Kompanie ist vollständig. Die ganze Festung arbeitet härter.`);
      honor(s, `Die ${s.companies}. Kompanie ist vollständig.`);
    }
    // Erst der Zorn, dann lindern die Priester: sonst hielten sie den Durst ewig knapp unter 100.
    if (bonus(s, 'thirst')) {
      if (s.thirst >= THIRST_MAX && !s.deathCompany && freeBrothers(s) >= P) blackRage(s);
      s.thirst = Math.max(0, s.thirst - R.thirstPriest * s.offices.priest * dt);
    }
    if (s.tech.liturgy && (s.eventIn -= dt) <= 1e-9) {
      chapterEvent(s);
      s.eventIn = R.eventEvery * (0.5 + api.rng());
    }
    relationsTick(s, dt);
  }

  // ---------- Nachfolgeorden ----------

  function legacyGain(s) {
    const brothers = Math.floor(s.marines.brothers / R.legacyBrothers), renown = Math.floor(s.res.renown / R.legacyRenown);
    const systems = D.systems.reduce((n, x) => n + (s.systems[x.id] ? x.legacy || 0 : 0), 0);
    return { brothers, renown, systems, total: brothers + renown + systems };
  }

  // Was der Gründung fehlt: 'lore', 'brothers', 'geneseed' oder null.
  const foundBlock = s => (!s.tech.founding ? 'lore' : s.marines.brothers < R.foundBrothers ? 'brothers'
    : s.res.geneseed < R.foundGeneseed - 1e-9 ? 'geneseed' : null);

  // Gibt den Spielstand des neuen Ordens zurück (oder null). Der Zehnt an Gensaat geht an den neuen Orden.
  function found(s, { name, palette = null, lineage } = {}) {
    const title = typeof name === 'string' ? name.trim() : '';
    if (foundBlock(s) || !CH[lineage] || !title || title.length > R.nameMax || (palette !== null && !PALETTE[palette])) return null;
    const gain = legacyGain(s).total, m = s.meta;
    s.res.geneseed -= R.foundGeneseed;
    honor(s, `Nachfolgeorden gegründet: ${title} (Linie ${CH[lineage].name}).`);
    return create(lineage, {
      ...m, legacy: m.legacy + gain, legacyFree: m.legacyFree + gain,
      lines: { ...m.lines, [lineage]: (m.lines[lineage] || 0) + 1 }, foundings: m.foundings + 1,
    }, { name: title, palette });
  }

  function buyRelic(s, id) {
    const r = RELIC[id];
    if (!r || s.meta.relics[id] || s.meta.legacyFree < r.cost - 1e-9) return false;
    s.meta.legacyFree -= r.cost;
    s.meta.relics[id] = true;
    dirty(s);
    log(s, `Ordensrelikt geweiht: ${r.name}.`);
    return true;
  }

  // ---------- Flotte und Sektor ----------

  const shipPrice = (s, id) => {
    const x = SHIP[id], out = {};
    for (const r in x.cost) out[r] = x.cost[r] * x.ratio ** s.ships[id];
    return out;
  };
  // Thunderhawks und Kreuzer brauchen Hangar-Plätze (Landeplattform, Werft); die Schlachtbarke gibt es einmal.
  const shipRoom = (s, id) => (SHIP[id].once ? s.ships[id] < 1 : s.ships[id] < bonus(s, 'hangar.' + SHIP[id].hangar) - 1e-9);
  const fleetPower = s => bonus(s, 'fleet.power');

  function buildShip(s, id) {
    const x = SHIP[id];
    if (!x || !isUnlocked(s, x) || !shipRoom(s, id)) return false;
    const cost = shipPrice(s, id);
    if (!canAfford(s, cost)) return false;
    pay(s, cost);
    s.ships[id]++;
    dirty(s);
    log(s, `Ein neues Schiff für die Flotte: ${x.name}.`);
    if (!s.seen.fleet) { s.seen.fleet = true; honor(s, `Das erste Schiff der Flotte: ${x.name}.`); }
    return true;
  }

  // Ein Feldzug geht zu einem Nachbarn der Heimat oder eines befreiten Systems.
  const reachable = (s, id) => {
    const x = SYSTEM[id];
    return !!(x && !x.home && !s.systems[id] && x.next.some(n => SYSTEM[n].home || s.systems[n]));
  };
  const campaignTime = (s, id) => SYSTEM[id].time * (1 - Math.min(R.campaignSpeedMax, bonus(s, 'campaign.speed')));
  const campaignCost = id => ({ navdata: SYSTEM[id].nav, fuelcell: SYSTEM[id].nav * R.fuelPerNav });
  // Stärke = Flotte + Trupp (Wulfen zuerst)
  const campaignPower = (s, brothers, wulfen) => fleetPower(s) + power(s, brothers, wulfen);
  function campaignChance(s, id, size) {
    const q = squadOf(s, size);
    return odds(campaignPower(s, q.brothers, q.wulfen) / SYSTEM[id].threat);
  }

  function startCampaign(s, id, size) {
    const [min, max] = R.campaignSquad;
    if (!s.tech.warpnav || s.campaign || !reachable(s, id) || !Number.isInteger(size) || size < min || size > max) return false;
    const q = squadOf(s, size), cost = campaignCost(id);
    if (q.brothers > freeBrothers(s) || !canAfford(s, cost)) return false;
    pay(s, cost);
    s.campaign = { id, brothers: q.brothers, wulfen: q.wulfen, left: campaignTime(s, id) };
    log(s, `Die Flotte bricht auf: Feldzug nach ${SYSTEM[id].name} mit ${num(size)} Kämpfern.`);
    return true;
  }

  // Im Warpsturm ruht der Feldzug.
  function fleetTick(s, dt) {
    const c = s.campaign;
    if (!c || s.storm > 0 || (c.left -= dt) > 1e-9) return;
    s.campaign = null;
    const x = SYSTEM[c.id], r = campaignPower(s, c.brothers, c.wulfen) / x.threat;
    const won = api.rng() < odds(r), got = [];
    if (won) {
      s.systems[x.id] = true;
      for (const id in x.reward || {}) {
        s.res[id] = Math.min(cap(s, id), s.res[id] + x.reward[id]);
        s.seen[id] = true;
        got.push(`+${num(x.reward[id])} ${RES[id].name}`);
      }
      dirty(s);
      honor(s, `System befreit: ${x.name}.`);
    }
    log(s, won ? `System befreit: ${x.name}.` + (got.length ? ` ${got.join(', ')}.` : '')
      : `Feldzug gescheitert: ${x.name}. Die Flotte kehrt heim.`);
    casualties(s, c, r, won);
  }

  // ---------- Beziehungen ----------

  // Tausch-Ausbeute: Kontore und Hilfe, 10 % je Ansehen-Stufe; +50 %, wenn Haus Valkar im Hafen liegt.
  const tradeYield = (s, id) => 1 + bonus(s, 'trade.bonus') + R.tradeLevelBonus * standingLevel(s, id)
    + (id === 'valkar' && s.docked ? R.dockedBonus : 0);

  // quiet: Daueraufträge tauschen ohne Log-Zeile.
  function trade(s, id, quiet = false) {
    const p = PARTNER[id];
    if (!p || !isUnlocked(s, p) || !canAfford(s, p.give)) return false;
    pay(s, p.give);
    const more = tradeYield(s, id), got = [];
    for (const r in p.get) {
      if (r === 'serfs') { // Knechte nur, so weit Platz ist
        const n = Math.min(Math.floor(p.get.serfs * more + 1e-9), Math.max(0, serfCap(s) - s.serfs));
        s.serfs += n;
        const job = JOB[s.autoJob];
        if (job && isUnlocked(s, job)) s.jobs[job.id] += n;
        if (n) got.push(`+${num(n)} ${n === 1 ? 'Knecht' : 'Knechte'}`);
        continue;
      }
      const v = p.get[r] * more;
      s.res[r] = Math.min(cap(s, r), s.res[r] + v);
      s.seen[r] = true;
      got.push(`+${num(v)} ${RES[r].name}`);
    }
    if (id === 'valkar') s.docked = false;
    const before = standingLevel(s, id);
    s.standing[id] = (s.standing[id] || 0) + 1 + bonus(s, 'standing.bonus');
    const after = standingLevel(s, id);
    if (!quiet) log(s, `Tausch mit ${p.name}: ${got.join(', ') || 'kein Platz für die Ware'}.`);
    if (after > before) {
      dirty(s);
      log(s, `${p.name}: Ansehen-Stufe ${after}.`);
      if (after === R.standingLevels.length) honor(s, `${p.name}: höchste Ansehen-Stufe.`);
    }
    return true;
  }

  // Dauerauftrag ab Stufe orderLevel; on = false hebt ihn auf.
  function setStandingOrder(s, id, on) {
    const p = PARTNER[id];
    if (!p || !isUnlocked(s, p) || (on && standingLevel(s, id) < R.orderLevel)) return false;
    if (on) s.standingOrders[id] = true;
    else delete s.standingOrders[id];
    return true;
  }

  // Getauscht wird nur Überschuss: Lager ab orderFill voll, Waren ohne Lager ab orderPackages Paketen.
  const surplusFor = (s, give) => Object.entries(give).every(([r, v]) =>
    s.res[r] >= (cap(s, r) === Infinity ? v * R.orderPackages : Math.max(v, R.orderFill * cap(s, r))) - 1e-9);

  function catchVision(s) {
    if (!(s.vision > 0)) return false;
    s.vision = 0;
    gainVision(s);
    return true;
  }
  function gainVision(s) {
    s.res.navdata += R.visionNav + bonus(s, 'vision.bonus');
    s.seen.navdata = true;
  }

  // Servitor-Zelle: aus P Knechten und etwas Plastahl werden P Servitoren.
  function makeServitor(s) {
    if (!s.bld.servitorCell || s.serfs < P || s.res.plasteel < R.servitorPlasteel - 1e-9) return false;
    dismiss(s, P);
    s.res.plasteel -= R.servitorPlasteel;
    s.marines.servitors += P;
    log(s, `${num(P)} Knechte liegen auf den Tischen des Mechanicus. ${num(P)} Servitoren stehen auf.`);
    return true;
  }

  // ---------- Wohnraum von selbst ----------

  // Sind alle Plätze belegt, bauen die Knechte selbst: einen Hab-Block, sonst ein Knechtsquartier. Bezahlt wird nur aus
  // vollen Lagern (Waren ohne Lager ab orderPackages Paketen), damit nichts fehlt, worauf du gerade sparst.
  const HOUSING = ['hab', 'quarters'];
  const fullFor = (s, cost) => Object.entries(cost).every(([r, v]) =>
    s.res[r] >= (cap(s, r) === Infinity ? v * R.orderPackages : Math.max(v, cap(s, r))) - 1e-9);
  // Was die Knechte als Nächstes bauen ({ id }) oder warum nicht ({ block: 'off', 'room', 'cost' oder 'food' }).
  // 'food': Die Brüder gehen vor. Auch mit den Neuen muss der Frost noch einen weiteren Schub Brüder satt machen,
  // wie bei der Implantation.
  function housingPlan(s) {
    if (!s.autoHousing) return { block: 'off' };
    if (s.serfs < serfCap(s)) return { block: 'room' };
    const id = HOUSING.find(x => isUnlocked(s, BLD[x]) && fullFor(s, price(s, 'building', x)));
    if (!id) return { block: 'cost' };
    const eat = R.serfFood * BLD[id].effects['serfs.cap'] * (1 + bonus(s, 'serfs.capPct'));
    return leanFood(s) - eat >= R.marineFood * P * (1 + s.marines.implants.length) - 1e-9 ? { id } : { block: 'food' };
  }
  function autoHousing(s) {
    const { id } = housingPlan(s);
    if (id && build(s, id)) log(s, `Die Knechte bauen selbst: ${BLD[id].name} Nr. ${s.bld[id]}.`);
  }
  function setAutoHousing(s, on) { s.autoHousing = !!on; return true; }

  function worldEvent(s, w) {
    if (w.id === 'trader') {
      if (s.seen.valkar) s.docked = true;
      else s.seen.valkar = true;
      log(s, s.docked ? w.text : w.first);
      return;
    }
    if (w.id === 'cult' && s.seen.cult) return; // ein Kult zur Zeit
    if (w.id === 'cult') s.seen.cult = true;
    if (w.id === 'storm') { s.storm = R.yearLength; s.vision = 0; }
    if (w.threat) s.threat = Math.min(R.threatMax, s.threat + w.threat);
    dirty(s);
    log(s, w.text.replace('{threat}', num(w.threat || 0)));
  }

  // Aufträge, Wohnungsbau, Visionen, Warpsturm und Welt-Ereignisse.
  function relationsTick(s, dt) {
    if ((s.orderTimer += dt) >= R.orderEvery - 1e-9) {
      s.orderTimer -= R.orderEvery;
      for (const id in s.standingOrders) if (surplusFor(s, PARTNER[id].give)) trade(s, id, true);
      autoHousing(s);
    }
    if (s.storm > 0 && (s.storm -= dt) <= 1e-9) {
      s.storm = 0;
      dirty(s);
      log(s, WORLD.storm.end);
    }
    // Visionen: Auto-Fang der Türme, sonst bleibt die Vision visionShow Sekunden zum Antippen
    if (s.tech.astropathy && !s.storm) {
      if (s.vision > 0 && (s.vision -= dt) <= 1e-9) s.vision = 0;
      if ((s.visionIn -= dt) <= 1e-9) {
        if (api.rng() < Math.min(1, bonus(s, 'vision.auto'))) gainVision(s);
        else s.vision = R.visionShow;
        s.visionIn = R.visionEvery / (1 + bonus(s, 'vision.rate')) * (0.5 + api.rng());
        if (!s.seen.vision) { s.seen.vision = true; log(s, 'Die Astropathen empfangen eine Vision. Fang sie oben im Kopf der Seite.'); }
      }
    }
    for (const w of D.worldEvents) {
      if (!isUnlocked(s, w) || (s.worldIn[w.id] -= dt) > 1e-9) continue;
      worldEvent(s, w);
      s.worldIn[w.id] = w.every * (0.5 + api.rng());
    }
  }

  const offlineMax = s => R.offlineMax + bonus(s, 'offline.days') * 86400;
  // Holt verpasste Zeit nach (höchstens offlineMax) und fasst zusammen, was sich geändert hat.
  function simulate(s, seconds) {
    const secs = Math.min(Math.max(0, seconds) || 0, offlineMax(s));
    const serfs = s.serfs, brothers = s.marines.brothers, res = { ...s.res };
    s._raids = R.raidsOffline;
    step(s, secs);
    delete s._raids;
    const diff = {};
    for (const id in s.res) diff[id] = s.res[id] - res[id];
    return { seconds: secs, serfs: s.serfs - serfs, brothers: s.marines.brothers - brothers, res: diff };
  }

  // ---------- Aktionen ----------

  const list = v => [].concat(v || []);
  const needs = item => list(item.requires?.tech);
  const isUnlocked = (s, item) => needs(item).every(t => s.tech[t])
    && list(item.requires?.building).every(b => s.bld[b] > 0)
    && list(item.requires?.seen).every(f => s.seen[f])
    && list(item.requires?.place).every(p => s.places[p])
    && Object.entries(item.requires?.standing || {}).every(([p, n]) => standingLevel(s, p) >= n);

  function price(s, kind, id) {
    if (kind === 'tech') return { ...TECH[id].cost };
    const b = BLD[id], mult = 1 + bonus(s, 'price.building'), out = {};
    for (const r in b.cost) out[r] = b.cost[r] * b.ratio ** s.bld[id] * mult;
    return out;
  }
  const canAfford = (s, cost) => Object.keys(cost).every(r => s.res[r] >= cost[r] - 1e-9);
  function pay(s, cost) { for (const r in cost) s.res[r] = Math.max(0, s.res[r] - cost[r]); }

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

  function click(s, id) {
    if (!CLICKS.has(id) || s.res[id] >= cap(s, id)) return false;
    s.res[id] = Math.min(cap(s, id), s.res[id] + R.clickGain);
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
    if (id === 'apothecarion' && s.marines.coma) wake(s);
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

  // delta: ganze Zahl ≠ 0 (die Oberfläche schiebt P, „alle“ oder „0“).
  function assign(s, id, delta) {
    const j = JOB[id];
    if (!j || !isUnlocked(s, j) || !Number.isInteger(delta) || delta === 0) return false;
    if (delta > 0 ? free(s) < delta : s.jobs[id] < -delta) return false;
    s.jobs[id] += delta;
    return true;
  }

  function setOffice(s, id, delta) {
    const o = OFF[id];
    if (!o || !isUnlocked(s, o) || !Number.isInteger(delta) || delta === 0) return false;
    if (delta > 0 ? freeBrothers(s) < delta : s.offices[id] < -delta) return false;
    s.offices[id] += delta;
    dirty(s);
    return true;
  }

  // n: Anzahl oder 'max'. Die Ausbeute wächst mit Schmieden und Orden.
  function craft(s, id, n) {
    if (!recipeOpen(s, id) || (n !== 'max' && !(Number.isInteger(n) && n > 0))) return false;
    const count = Math.min(craftCount(s, id), n === 'max' ? Infinity : n);
    if (count < 1) return false;
    for (const r in RECIPE[id].cost) s.res[r] = Math.max(0, s.res[r] - RECIPE[id].cost[r] * count);
    s.res[id] += count * craftYield(s);
    s.seen[id] = true;
    return true;
  }

  function buyUpgrade(s, id) {
    const u = UPG[id];
    if (!upgradeVisible(s, id) || s.upgrades[id] || !canAfford(s, u.cost)) return false;
    pay(s, u.cost);
    s.upgrades[id] = true;
    dirty(s);
    log(s, `Verbesserung: ${u.name}.`);
    return true;
  }

  function setServitorRecipe(s, id) {
    if (id !== null && !recipeOpen(s, id)) return false;
    s.servitorRecipe = id;
    return true;
  }

  function setAutoJob(s, id) {
    if (!s.tech.munitorum || (id !== null && !(JOB[id] && isUnlocked(s, JOB[id])))) return false;
    s.autoJob = id;
    return true;
  }

  // quiet: Einsatzbefehle schicken Trupps ohne Log-Zeile los (sonst füllt sich die Chronik).
  function sendMission(s, id, size, quiet = false) {
    const m = MISSION[id];
    if (!m || !isUnlocked(s, m) || s.missions.some(x => x.id === id)) return false;
    if (!Number.isInteger(size) || size < m.squad[0] || size > m.squad[1]) return false;
    const q = squadOf(s, size);
    if (q.brothers > freeBrothers(s)) return false;
    const run = { id, brothers: q.brothers, wulfen: q.wulfen, left: missionTime(s, m.time) };
    if (s.deathCompany) { run.dc = s.deathCompany; s.deathCompany = 0; }
    s.missions.push(run);
    if (!quiet) log(s, `Ein Trupp aus ${num(size)} Kämpfern bricht auf: ${m.name}.` + (run.dc ? ' Die Todeskompanie zieht mit.' : ''));
    return true;
  }

  // Einsatzbefehl: size > 0 setzt, 0 hebt auf.
  function setOrder(s, id, size) {
    const m = MISSION[id];
    if (!m || !isUnlocked(s, m) || !canOrder(s) || !Number.isInteger(size)) return false;
    if (size === 0) { delete s.orders[id]; return true; }
    if (size < m.squad[0] || size > m.squad[1]) return false;
    s.orders[id] = size;
    return true;
  }

  function scout(s, id) {
    const p = PLACE[id];
    if (!p || placeState(s, id) !== 'open' || freeBrothers(s) < P) return false;
    s.scouts.push({ place: id, left: missionTime(s, p.time, true) });
    log(s, `${num(P)} Aufklärer brechen auf: ${p.name}.`);
    return true;
  }

  // ---------- Speichern ----------

  const save = s => JSON.stringify(s, (k, v) => (k[0] === '_' ? undefined : v));

  // v1 → v2 (Etappe 10): Köpfe ×P, Neophyten und Implantationen als Schübe zu P (gleiche Restzeit).
  // v2 → v3 (Etappe 10, alles ×P): auch Waren, Bedrohung und Frömmigkeit ×P (Gensaat und Aspiranten zählten schon
  // als Köpfe). Kompanien zählen weiter (1 alte Kompanie = 1 neue).
  function migrate(raw) {
    if (raw.v >= 3) return raw;
    const x = v => (Number.isFinite(v) && v >= 0 ? v * P : v);
    const res = raw.res && typeof raw.res === 'object' ? raw.res : {};
    if (raw.v < 2) {
      raw.serfs = x(raw.serfs);
      raw.arrival = 0;
      for (const key of ['jobs', 'offices', 'orders']) for (const id in raw[key] || {}) raw[key][id] = x(raw[key][id]);
      for (const id of ['aspirants', 'geneseed']) res[id] = x(res[id]);
      const m = raw.marines;
      if (m && typeof m === 'object') {
        for (const k of ['coma', 'brothers', 'servitors', 'wulfen']) m[k] = x(m[k]);
        const batches = list => (Array.isArray(list) ? list.filter(t => Number.isFinite(t) && t >= 0).map(left => ({ n: P, left })) : []);
        m.neophytes = batches(m.neophytes);
        m.implants = batches(m.implants);
      }
      for (const run of [...(Array.isArray(raw.missions) ? raw.missions : []), raw.campaign]) {
        if (!run || typeof run !== 'object') continue;
        run.brothers = x(run.brothers);
        run.wulfen = x(run.wulfen);
        if (run.dc) run.dc = x(run.dc);
      }
      raw.deathCompany = x(raw.deathCompany);
    }
    for (const id in res) if (id !== 'aspirants' && id !== 'geneseed') res[id] = x(res[id]);
    raw.threat = x(raw.threat);
    raw.piety = x(raw.piety);
    raw.v = 3;
    return raw;
  }

  // Lädt einen Spielstand, auch aus Import-Text: nur bekannte, gültige Werte; was fehlt, bleibt 0.
  function load(json) {
    const raw = JSON.parse(json);
    if (!raw || typeof raw !== 'object' || !Number.isFinite(raw.v) || !CH[raw.chapter]) throw new Error('Kein Spielstand');
    migrate(raw);
    const s = create(raw.chapter);
    s.log = [];
    if (typeof raw.name === 'string' && raw.name.trim() && raw.name.length <= R.nameMax) s.name = raw.name;
    if (PALETTE[raw.palette]) s.palette = raw.palette;
    const ok = v => Number.isFinite(v) && v >= 0;
    const count = v => Math.min(Math.floor(v), 1e9); // Import-Schutz: absurde Anzahlen deckeln
    const str = v => (typeof v === 'string' ? v.slice(0, 200) : '');
    for (const k of ['time', 'savedAt', 'arrival', 'hungry', 'logSeq']) if (ok(raw[k])) s[k] = raw[k];
    s.time = Math.min(s.time, 1e10); // gut 300 Jahre Spielzeit; darüber bliebe die Uhr stehen
    s.arrival = Math.min(s.arrival, R.arrivalEvery * P);
    s.hungry = Math.min(s.hungry, R.fleeAfter * (1 + bonus(s, 'flee.slow')));
    if (ok(raw.serfs)) s.serfs = count(raw.serfs);
    s.isHungry = raw.isHungry === true;
    for (const id in s.res) if (ok(raw.res?.[id])) s.res[id] = raw.res[id];
    for (const id in s.bld) if (ok(raw.bld?.[id])) s.bld[id] = count(raw.bld[id]);
    for (const id in s.jobs) if (ok(raw.jobs?.[id])) s.jobs[id] = count(raw.jobs[id]);
    // Merker-Listen in der Reihenfolge des Spielstands übernehmen (dann ergibt Speichern wieder genau denselben Text)
    const flags = (from, known, to) => { for (const id in from || {}) if (known[id] && from[id] === true) to[id] = true; };
    flags(raw.tech, TECH, s.tech);
    for (const k in raw.seen || {}) if (raw.seen[k] === true) s.seen[k] = true;
    flags(raw.places, PLACE, s.places);
    const m = raw.marines && typeof raw.marines === 'object' ? raw.marines : {};
    for (const k of ['coma', 'brothers', 'servitors', 'wulfen']) if (ok(m[k])) s.marines[k] = count(m[k]);
    const batches = (v, max) => (Array.isArray(v) ? v.filter(b => b && ok(b.n) && b.n >= 1 && ok(b.left)).slice(0, 1e4)
      .map(b => ({ n: count(b.n), left: Math.min(b.left, max) })) : []);
    s.marines.neophytes = batches(m.neophytes, R.trainingTime);
    s.marines.implants = batches(m.implants, R.implantTime);
    for (const x of Array.isArray(raw.scouts) ? raw.scouts : []) {
      const p = x && PLACE[x.place];
      if (!p || !ok(x.left) || s.places[p.id] || s.scouts.some(y => y.place === p.id)) continue;
      s.scouts.push({ place: p.id, left: Math.min(x.left, p.time * 1.25) });
    }
    for (const id in s.offices) if (ok(raw.offices?.[id])) s.offices[id] = count(raw.offices[id]);
    // Aufklärer, Trupps und Ämter brauchen Brüder (Trupps auch Wulfen): Überzählige streichen
    s.scouts = s.scouts.slice(0, Math.floor(s.marines.brothers / P));
    let room = s.marines.brothers - s.scouts.length * P, wulfen = s.marines.wulfen;
    for (const x of Array.isArray(raw.missions) ? raw.missions : []) {
      const m = x && MISSION[x.id];
      if (!m || !ok(x.brothers) || !ok(x.wulfen) || !ok(x.left) || s.missions.some(y => y.id === m.id)) continue;
      const b = count(x.brothers), w = count(x.wulfen);
      if (b > room || w > wulfen) continue;
      room -= b;
      wulfen -= w;
      const run = { id: m.id, brothers: b, wulfen: w, left: Math.min(x.left, m.time * 1.25) };
      if (ok(x.dc) && x.dc >= 1) run.dc = Math.min(count(x.dc), P);
      s.missions.push(run);
    }
    const c = raw.campaign;
    if (c && SYSTEM[c.id] && !SYSTEM[c.id].home && ok(c.brothers) && ok(c.wulfen) && ok(c.left)
      && count(c.brothers) <= room && count(c.wulfen) <= wulfen) {
      s.campaign = { id: c.id, brothers: count(c.brothers), wulfen: count(c.wulfen), left: Math.min(c.left, SYSTEM[c.id].time) };
      room -= s.campaign.brothers;
      wulfen -= s.campaign.wulfen;
    }
    for (const o of D.offices) { s.offices[o.id] = Math.min(s.offices[o.id], room); room -= s.offices[o.id]; }
    for (const id in MISSION) {
      const n = raw.orders?.[id], [min, max] = MISSION[id].squad;
      if (Number.isInteger(n) && n >= min && n <= max) s.orders[id] = n;
    }
    if (ok(raw.threat)) s.threat = Math.min(raw.threat, R.threatMax);
    if (ok(raw.raidTimer)) s.raidTimer = Math.min(raw.raidTimer, R.raidEvery);
    flags(raw.upgrades, UPG, s.upgrades);
    if (RECIPE[raw.servitorRecipe]) s.servitorRecipe = raw.servitorRecipe;
    if (JOB[raw.autoJob]) s.autoJob = raw.autoJob;
    s.autoHousing = raw.autoHousing !== false; // ältere Stände: an
    if (ok(raw.craftAcc)) s.craftAcc = Math.min(raw.craftAcc, 1);
    flags(raw.rites, RITE, s.rites);
    if (LITANY[raw.litany]) {
      s.litany = raw.litany;
      if (ok(raw.litanyLeft)) s.litanyLeft = Math.min(raw.litanyLeft, R.litanyTime);
    }
    if (ok(raw.piety)) s.piety = raw.piety;
    for (const b of Array.isArray(raw.boons) ? raw.boons.slice(0, 100) : []) {
      if (b && BOON_KEYS.has(b.key) && Number.isFinite(b.value) && Math.abs(b.value) <= 1 && ok(b.left))
        s.boons.push({ key: b.key, value: b.value, left: Math.min(b.left, R.yearLength) });
    }
    if (ok(raw.companies)) s.companies = count(raw.companies);
    if (ok(raw.thirst)) s.thirst = Math.min(raw.thirst, THIRST_MAX);
    if (ok(raw.deathCompany)) s.deathCompany = Math.min(count(raw.deathCompany), P);
    if (ok(raw.eventIn)) s.eventIn = Math.min(raw.eventIn, R.eventEvery * 1.5);
    if (ok(raw.flairIn)) s.flairIn = Math.min(raw.flairIn, R.flairEvery);
    for (const id in raw.standing || {}) if (PARTNER[id] && ok(raw.standing[id])) s.standing[id] = Math.min(raw.standing[id], 1e6);
    flags(raw.standingOrders, PARTNER, s.standingOrders);
    if (ok(raw.orderTimer)) s.orderTimer = Math.min(raw.orderTimer, R.orderEvery);
    if (ok(raw.visionIn)) s.visionIn = Math.min(raw.visionIn, R.visionEvery * 1.5);
    if (ok(raw.vision)) s.vision = Math.min(raw.vision, R.visionShow);
    for (const w of D.worldEvents) if (ok(raw.worldIn?.[w.id])) s.worldIn[w.id] = Math.min(raw.worldIn[w.id], w.every * 1.5);
    if (ok(raw.storm)) s.storm = Math.min(raw.storm, R.yearLength);
    s.docked = raw.docked === true;
    for (const x of D.ships) if (ok(raw.ships?.[x.id])) s.ships[x.id] = Math.min(count(raw.ships[x.id]), x.once ? 1 : 1e6);
    for (const id in raw.systems || {}) if (SYSTEM[id] && !SYSTEM[id].home && raw.systems[id] === true) s.systems[id] = true;
    if (Array.isArray(raw.log)) {
      s.log = raw.log.filter(l => l && typeof l.text === 'string' && Number.isFinite(l.id))
        .slice(-R.logMax).map(l => ({ id: l.id, date: str(l.date), text: l.text }));
    }
    const mt = raw.meta && typeof raw.meta === 'object' ? raw.meta : {};
    if (ok(mt.legacy)) s.meta.legacy = count(mt.legacy);
    if (ok(mt.legacyFree)) s.meta.legacyFree = Math.min(count(mt.legacyFree), s.meta.legacy);
    flags(mt.relics, RELIC, s.meta.relics);
    for (const id in mt.lines || {}) if (CH[id] && ok(mt.lines[id])) s.meta.lines[id] = count(mt.lines[id]);
    if (ok(mt.foundings)) s.meta.foundings = count(mt.foundings);
    if (Array.isArray(raw.meta?.honors)) {
      s.meta.honors = raw.meta.honors.filter(h => h && ['date', 'chapter', 'text'].every(k => typeof h[k] === 'string'))
        .slice(-R.honorsMax).map(h => ({ date: h.date, chapter: h.chapter, text: h.text }));
    }
    dirty(s); // Gebäude und Lehren sind neu: Lager erst jetzt rechnen
    if (free(s) < 0) takeJobs(s, -free(s));
    for (const id in s.res) s.res[id] = Math.min(s.res[id], cap(s, id));
    return s;
  }

  const api = {
    create, log, honor, calendar, effects, cap, serfCap, free, moral, rates, arrivalBlock, step, simulate,
    marineCap, marinesUsed, freeBrothers, freeWulfen, officeName, implantBlock, missionTime, placeState,
    power, chance, defense, canOrder, leanFood, craftYield, craftCount, upgradeVisible,
    needs, isUnlocked, price, canAfford, eta, click, build, research, assign, setOffice, scout,
    sendMission, setOrder, craft, buyUpgrade, setServitorRecipe, setAutoJob, save, load,
    companies, productionBonus, pietyBonus, litanyCost, litanyOpen, buyRite, chooseLitany, grandMass,
    standingLevel, tradeYield, trade, setStandingOrder, catchVision, makeServitor, housingPlan, setAutoHousing,
    shipPrice, fleetPower, buildShip, reachable, campaignTime, campaignCost, campaignChance, startCampaign,
    legacyGain, foundBlock, found, buyRelic, offlineMax, binom, migrate,
    rng: Math.random, // Zufall; Tests setzen hier eine feste Folge ein
  };
  return api;
})();

if (typeof module !== 'undefined') module.exports = Engine;
