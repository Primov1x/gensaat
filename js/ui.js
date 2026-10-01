// Gensaat – Anzeige, Eingaben, Speichern und Spielschleife.
(() => {
  const E = Engine, D = DATA;
  const KEY = 'gensaat';
  const byId = list => Object.fromEntries(list.map(x => [x.id, x]));
  const RES = byId(D.resources), JOB = byId(D.jobs), CH = byId(D.chapters), SYS = byId(D.systems);
  const BLD = byId(D.buildings), TECH = byId(D.techs), PLACE = byId(D.places), PAL = byId(D.palettes);
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
  // Kleine Raten je Minute, sonst stünde da „+0/s“ (z. B. Gensaat oder Aspiranten).
  function fmtRate(r) {
    const a = Math.abs(r), sign = r < 0 ? '−' : '+';
    if (a < 0.1) return sign + N2.format(a * 60) + '/Min.';
    return sign + (a >= 100 ? fmt(a) : (a < 1 ? N2 : N1).format(a)) + '/s';
  }
  function fmtTime(sec) {
    if (sec < 60) return Math.ceil(sec) + ' s';
    if (sec < 3600) return Math.round(sec / 60) + ' Min.';
    if (sec < 86400) return N1.format(sec / 3600) + ' Std.';
    const d = N1.format(sec / 86400);
    return d + (d === '1' ? ' Tag' : ' Tage');
  }
  const amount = (id, v, round) => { const n = fmt(v, round); return `${n} ${n === '1' ? RES[id].one : RES[id].name}`; };
  // Köpfe (Etappe 10: in Schüben zu P): ganze Zahl mit Tausenderpunkt, ab einer Million kurz.
  const P = D.rules.popScale;
  const nHeads = n => (Math.abs(n) < 1e6 ? N0.format(Math.floor(n + 1e-9)) : fmt(n, down));
  const sumHeads = list => list.reduce((n, b) => n + b.n, 0);

  const pct = v => `${v < 0 ? '−' : '+'}${Math.round(Math.abs(v) * 100)} %`;
  const EFFECT_TEXT = {
    'serfs.cap': v => `+${fmt(v)} Knechte-Plätze`,
    'marines.cap': v => `+${fmt(v)} Brüder-Plätze`,
    'implant.slots': v => `+${fmt(v)} Implantationsplatz`,
    'training.speed': v => `Ausbildung −${Math.round(v * 100)} %`,
    'power.bonus': v => `Kampfkraft ${pct(v)}`,
    'arrival.bonus': v => `Zuzug ${pct(v)}`,
    'defense.flat': v => `Verteidigung +${fmt(v)}`,
    'craft.bonus': v => `Schmiede-Ausbeute ${pct(v)}`,
    'loss.reduce': v => `Verluste −${Math.round(v * 100)} %`,
    'recover.bonus': v => `Gensaat-Bergung ${pct(v)}`,
    'scout.speed': v => `Aufklärung −${Math.round(v * 100)} % Dauer`,
    'mission.speed': v => `Einsätze −${Math.round(v * 100)} % Dauer`,
    'production.bonus': v => `Produktion ${pct(v)}`,
    'jobs.bonus': v => `Knechte-Jobs ${pct(v)}`,
    'defense.bonus': v => `Verteidigung ${pct(v)}`,
    'litany.bonus': v => `Litaneien ${pct(v)}`,
    'company.bonus': v => `Kompanien ${pct(v)}`,
    'moral.bonus': v => `Moral ${pct(v)}`,
    'loot.bonus': v => `Beute ${pct(v)}`,
    'vision.auto': v => `Visionen von selbst ${pct(v)}`,
    'trade.bonus': v => `Tausch-Ausbeute ${pct(v)}`,
    'servitor.bonus': v => `Servitoren ${pct(v)}`,
    'standing.bonus': v => `Ansehen ${pct(v)}`,
    'threat.slow': v => `Bedrohung wächst −${Math.round(v * 100)} %`,
    'fleet.power': v => `Flottenstärke +${fmt(v)}`,
    'hangar.hawk': v => `Platz für ${fmt(v)} Thunderhawks`,
    'hangar.cruiser': v => `Platz für ${fmt(v)} Angriffskreuzer`,
    'campaign.speed': v => `Feldzüge −${Math.round(v * 100)} % Dauer`,
    'vision.bonus': v => `+${fmt(v)} Navigationsdaten je Vision`,
    'serfs.capPct': v => `Knechte-Plätze ${pct(v)}`,
    'loot.archeotech': v => `Archäotech aus Einsätzen ${pct(v)}`,
    'cap.bonus': v => `Alle Lager ${pct(v)}`,
    'offline.days': v => `Offline +${fmt(v)} Tage`,
    'vision.rate': v => `Visionen ${pct(v)} öfter`,
  };
  function effectText(key, v) {
    if (EFFECT_TEXT[key]) return EFFECT_TEXT[key](v);
    const [a, b] = key.split('.');
    if (a === 'job') return `${JOB[b].name} ${pct(v)}`;
    if (!RES[a]) return key; // ponytail: Rohtext statt Absturz, falls ein Schlüssel keinen Text hat
    if (b === 'rate') return `${RES[a].name} ${fmtRate(v)}`;
    if (b === 'cap') return `Lager ${RES[a].name} +${fmt(v)}`;
    if (b === 'capPct') return `Lager ${RES[a].name} ${pct(v)}`;
    return `${RES[a].name} ${pct(v)}`;
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
    let info = null;
    if (infoFor) {
      info = document.createElement('button');
      info.className = 'info';
      info.type = 'button';
      info.textContent = 'i';
      info.setAttribute('aria-label', 'Info zu ' + infoFor.item.name);
      info.addEventListener('click', () => openInfo(infoFor.kind, infoFor.item));
      el.append(info);
      el.addEventListener('mouseenter', () => { if (!info.disabled) showTip(el, infoFor); });
      el.addEventListener('mouseleave', hideTip);
    }
    return { el, buy, info, name: buy.firstChild, sub: buy.lastChild };
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

  const thirsty = () => !!E.effects(S).thirst;
  // Wirkungen, die in den Regeln statt in effects stehen
  const EXTRA = {
    preacher: () => `Moral +${N1.format(D.rules.preacherMoral * P * 100)} % (höchstens +${Math.round(D.rules.preacherMoralMax * 100)} %)`,
    priest: () => `Moral +${Math.round(D.rules.priestMoral * P * 100)} %`
      + (thirsty() ? `, Roter Durst −${N1.format(D.rules.thirstPriest * P * 60)} %/Min.` : ''),
  };
  const extra = id => (EXTRA[id] ? ' · ' + EXTRA[id]() : '');

  const HINTS = { full: 'Alle Quartiere sind belegt.', frost: 'In der Frostzeit kommt niemand.', food: 'Für Neue fehlen Vorräte.' };

  function orderItems() {
    const items = [{
      key: 'summary',
      make: () => { const el = document.createElement('div'); el.className = 'summary'; return { el }; },
      update: k => html(k.el,
        `<p>Knechte <b>${nHeads(S.serfs)} / ${fmt(E.serfCap(S))}</b> · frei <b>${nHeads(E.free(S))}</b></p>` +
        `<p>Moral <b>${Math.round(E.moral(S) * 100)} %</b>${S.isHungry ? ' · <span class="miss">Hunger</span>' : ''}</p>` +
        `<p class="muted hint">${HINTS[E.arrivalBlock(S)] || ''}</p>`),
    }];
    for (const j of D.jobs) {
      if (!E.isUnlocked(S, j)) continue;
      items.push({
        key: 'job:' + j.id,
        make: () => stepRow(j.name,
          Object.entries(j.effects).map(([key, v]) => effectText(key, v * P)).join(', ') + ` je ${nHeads(P)} Knechte` + extra(j.id),
          d => E.assign(S, j.id, d), () => S.jobs[j.id], () => E.free(S)),
        update: k => { text(k.name, `${j.name}: ${nHeads(S.jobs[j.id])}`); k.update(); },
      });
    }
    if (S.tech.munitorum) {
      items.push({
        key: 'autojob',
        make: () => selectRow('Neue Knechte werden',
          () => [['', 'frei (ohne Aufgabe)'], ...D.jobs.filter(j => E.isUnlocked(S, j)).map(j => [j.id, j.name])],
          () => S.autoJob, v => E.setAutoJob(S, v)),
        update: k => k.update(),
      });
    }
    if (!S.seen.marines) return items;
    items.push({
      key: 'marines',
      make: () => { const el = document.createElement('div'); el.className = 'summary fixed'; return { el }; },
      update: k => html(k.el, marineSummary()),
    });
    for (const o of D.offices) {
      if (!E.isUnlocked(S, o)) continue;
      items.push({
        key: 'office:' + o.id,
        make: () => stepRow(E.officeName(S, o.id),
          (o.effects ? Object.entries(o.effects).map(([key, v]) => effectText(key, v * P)).join(', ') + ` je ${nHeads(P)} Brüder`
            : o.desc) + extra(o.id),
          d => E.setOffice(S, o.id, d), () => S.offices[o.id], () => E.freeBrothers(S)),
        update: k => { text(k.name, `${E.officeName(S, o.id)}: ${nHeads(S.offices[o.id])}`); k.update(); },
      });
    }
    return items;
  }

  // Auswahlfeld mit Beschriftung; options() liefert [[Wert, Text], …], '' steht für „keins“.
  function selectRow(label, options, value, change) {
    const el = document.createElement('label');
    el.className = 'row-select';
    el.innerHTML = `<span>${label}</span><select></select>`;
    const sel = el.querySelector('select');
    sel.addEventListener('change', () => { change(sel.value || null); render(); });
    return {
      el,
      update: () => {
        const opts = options(), sig = opts.map(o => o[0]).join();
        if (sel._sig !== sig) { sel.innerHTML = opts.map(([v, n]) => `<option value="${v}">${n}</option>`).join(''); sel._sig = sig; }
        if (sel.value !== (value() || '')) sel.value = value() || '';
      },
    };
  }

  function forgeItems() {
    const items = [{
      key: 'summary',
      make: () => { const el = document.createElement('div'); el.className = 'summary'; return { el }; },
      update: k => html(k.el, `<p>Ausbeute je Herstellung <b>${pct(E.craftYield(S) - 1)}</b></p>` +
        '<p class="muted hint">Waren haben kein Lager. Fehlendes steht rot.</p>'),
    }];
    if (S.marines.servitors || S.servitorRecipe) {
      items.push({
        key: 'servitors',
        make: () => selectRow('Servitoren arbeiten an',
          () => [['', 'Schrott sammeln'], ...D.recipes.filter(r => E.isUnlocked(S, RES[r.id])).map(r => [r.id, RES[r.id].name])],
          () => S.servitorRecipe, v => E.setServitorRecipe(S, v)),
        update: k => k.update(),
      });
    }
    if (S.bld.servitorCell) {
      items.push({
        key: 'makeServitor',
        make: () => { const k = card(() => E.makeServitor(S)); k.name.textContent = `${nHeads(P)} Servitoren erschaffen`; return k; },
        update: k => {
          html(k.sub, `${nHeads(P)} Knechte · ${costHtml({ plasteel: D.rules.servitorPlasteel })}`);
          setOff(k, S.serfs < P || S.res.plasteel < D.rules.servitorPlasteel - 1e-9);
        },
      });
    }
    for (const r of D.recipes) {
      if (E.isUnlocked(S, RES[r.id])) items.push({ key: 'recipe:' + r.id, make: () => craftRow(r), update: k => updateCraft(k, r) });
    }
    for (const u of D.upgrades) {
      if (!E.upgradeVisible(S, u.id)) continue;
      items.push({
        key: 'upg:' + u.id,
        make: () => { const k = card(() => E.buyUpgrade(S, u.id), { kind: 'upgrade', item: u }); k.name.textContent = u.name; return k; },
        update: k => {
          const done = !!S.upgrades[u.id];
          html(k.sub, done ? 'erworben' : costHtml(u.cost));
          setOff(k, done || !E.canAfford(S, u.cost));
          k.el.classList.toggle('done', done);
        },
      });
    }
    return items;
  }

  const perUnitText = id => Object.entries(RES[id].perUnit || {}).map(([k, v]) => effectText(k, v) + ' je Stück').join(', ');

  function craftRow(r) {
    const el = document.createElement('div');
    el.className = 'craft';
    el.innerHTML = `<svg aria-hidden="true"><use href="#${RES[r.id].icon}"/></svg>` +
      '<div class="job-text"><span class="name"></span><span class="sub"></span></div>' +
      ['1', '10', 'max'].map(n => `<button class="step c-btn" type="button" data-n="${n}">${n === 'max' ? 'max' : '+' + n}</button>`).join('');
    const btns = [...el.querySelectorAll('.c-btn')];
    for (const b of btns) {
      b.addEventListener('click', () => { if (E.craft(S, r.id, b.dataset.n === 'max' ? 'max' : Number(b.dataset.n))) render(); });
    }
    return { el, btns, name: el.querySelector('.name'), sub: el.querySelector('.sub') };
  }

  function updateCraft(k, r) {
    text(k.name, `${RES[r.id].name}: ${fmt(S.res[r.id], down)}`);
    html(k.sub, costHtml(r.cost) + (RES[r.id].perUnit ? ' · ' + perUnitText(r.id) : ''));
    const none = E.craftCount(S, r.id) < 1;
    for (const b of k.btns) b.disabled = none;
  }

  // Zeile mit Name, Beschreibung und 0 / − / + / alle (Jobs, Ämter): − und + bewegen P Köpfe.
  // have(): wie viele hier sind, spare(): wie viele frei sind.
  function stepRow(label, sub, change, have, spare) {
    const el = document.createElement('div');
    el.className = 'job';
    el.innerHTML = '<div class="job-text"><span class="name"></span><span class="sub"></span></div>' +
      `<button class="step c-btn" type="button" aria-label="${label}: keine">0</button>` +
      `<button class="step" type="button" aria-label="${label}: ${nHeads(P)} weniger">−</button>` +
      `<button class="step" type="button" aria-label="${label}: ${nHeads(P)} mehr">+</button>` +
      `<button class="step c-btn" type="button" aria-label="${label}: alle freien">alle</button>`;
    const [zero, minus, plus, all] = el.querySelectorAll('.step');
    const go = d => { if (d && change(d)) render(); };
    zero.addEventListener('click', () => go(-have()));
    minus.addEventListener('click', () => go(-Math.min(P, have())));
    plus.addEventListener('click', () => go(Math.min(P, spare())));
    all.addEventListener('click', () => go(spare()));
    el.querySelector('.sub').textContent = sub;
    const update = () => {
      zero.disabled = minus.disabled = have() < 1;
      plus.disabled = all.disabled = spare() < 1;
    };
    return { el, update, name: el.querySelector('.name') };
  }

  const IMPLANT_HINTS = {
    aspirant: 'Implantation wartet auf einen Aspiranten.', geneseed: 'Implantation wartet auf Gensaat.',
    slot: 'Alle Implantationsplätze sind belegt.', cells: 'Für neue Brüder fehlen Zellen.',
    food: 'Implantation wartet: Im Frost reichen die Vorräte nicht für weitere Brüder.',
  };

  // Vier feste Zeilen, damit darunter nichts springt.
  function marineSummary() {
    const m = S.marines, block = E.implantBlock(S);
    const next = list => (list.length ? Math.min(...list.map(b => b.left)) : 0);
    const implant = m.implants.length ? `Implantation läuft (${nHeads(sumHeads(m.implants))} Aspiranten) · fertig in `
      + fmtTime(next(m.implants) / implantSpeed()) : block && block !== 'lore' ? IMPLANT_HINTS[block] : '';
    const train = m.neophytes.length ? `Ausbildung · nächste Kampfbrüder in ${fmtTime(next(m.neophytes) / trainSpeed())}` : '';
    const c = E.companies(S), each = D.rules.companyBonus + (E.effects(S)['company.bonus'] || 0);
    const thirst = thirsty() ? `<p>Roter Durst <b>${Math.floor(S.thirst)} %</b>` +
      (S.deathCompany ? ' · <span class="miss">Die Todeskompanie wartet auf den nächsten Kampf</span>' : '') + '</p>' : '';
    return `<p>Kampfbrüder <b>${nHeads(m.brothers)}</b> · Neophyten <b>${nHeads(sumHeads(m.neophytes))}</b>` +
      ` · frei <b>${nHeads(E.freeBrothers(S))}</b></p>` +
      `<p>Brüder-Plätze <b>${nHeads(E.marinesUsed(S))} / ${fmt(E.marineCap(S))}</b></p>` +
      `<p class="muted">${implant}</p><p class="muted">${train}</p>` +
      `<p>Kompanien <b>${c}</b> · nächste bei <b>${nHeads(m.brothers)} / ${nHeads((c + 1) * D.rules.companySize)}</b> Kampfbrüdern` +
      ` · je Kompanie Produktion ${pct(each)}</p>` + thirst;
  }
  // Nur für die Anzeige der Restzeit; die Engine rechnet genauso.
  const implantSpeed = () => 1 / (1 - Math.min(D.rules.apothecarySpeedMax, D.rules.apothecarySpeed * S.offices.apothecary));
  const trainSpeed = () => 1 / (1 - Math.min(D.rules.trainingSpeedMax, E.effects(S)['training.speed'] || 0));

  function missionItems() {
    const items = [{
      key: 'summary',
      make: () => { const el = document.createElement('div'); el.className = 'summary'; return { el }; },
      update: k => html(k.el, `<p>Freie Kampfbrüder <b>${nHeads(E.freeBrothers(S))}</b></p>` +
        `<p class="muted hint">Aufklärung: ein Trupp aus ${nHeads(P)} Brüdern erkundet einen Ort.</p>`),
    }];
    for (const p of D.places) {
      items.push({
        key: 'place:' + p.id,
        make: () => card(() => E.scout(S, p.id), { kind: 'place', item: p }),
        update: k => {
          const st = E.placeState(S, p.id), away = S.scouts.find(x => x.place === p.id);
          text(k.name, st === 'hidden' ? '???' : p.name);
          text(k.sub, st === 'done' ? 'entdeckt' : st === 'away' ? `unterwegs · noch ${fmtTime(away.left)}`
            : st === 'hidden' ? 'noch unbekannt' : `${nHeads(P)} Brüder · ${fmtTime(E.missionTime(S, p.time, true))}`);
          setOff(k, st !== 'open' || E.freeBrothers(S) < P);
          k.el.classList.toggle('done', st === 'done');
          k.info.disabled = st === 'hidden';
        },
      });
    }
    if (!S.tech.doctrine) return items;
    items.push({
      key: 'combat',
      make: () => { const el = document.createElement('div'); el.className = 'summary fixed'; return { el }; },
      update: k => html(k.el, combatSummary()),
    });
    for (const m of D.missions) {
      if (E.isUnlocked(S, m)) items.push({ key: 'mission:' + m.id, make: () => missionBlock(m), update: k => updateMission(k, m) });
    }
    return items;
  }

  const raidDue = () => S.places.ashwaste && S.threat > E.defense(S);

  function combatSummary() {
    const threat = `Bedrohung <b>${fmt(S.threat, down)}</b> · Verteidigung <b>${fmt(E.defense(S), down)}</b>`;
    const next = !S.places.ashwaste ? 'Die Aschewüste ist noch unerforscht. Noch droht nichts.'
      : `Nächste Prüfung in ${fmtTime(D.rules.raidEvery - S.raidTimer)} · ` +
        (raidDue() ? '<span class="miss">Überfall droht</span>' : 'die Mauern halten');
    return `<p>${threat}</p><p class="muted">${next}</p>` +
      `<p>Freie Kämpfer <b>${nHeads(E.freeBrothers(S) + E.freeWulfen(S))}</b>`
      + `${S.marines.wulfen ? ` · davon Wulfen <b>${nHeads(E.freeWulfen(S))}</b>` : ''}` +
      `${S.deathCompany ? ' · <span class="miss">Todeskompanie zieht mit (doppelte Kampfkraft)</span>' : ''}</p>`;
  }

  // Gewählte Truppgröße je Einsatz (nur Anzeige; ein Einsatzbefehl merkt sich seine eigene).
  const sizes = {};
  function missionBlock(m) {
    const el = document.createElement('div');
    el.className = 'mission';
    el.innerHTML = `<div class="m-head"><span class="name">${m.name}</span></div><p class="m-stats"></p>` +
      '<div class="m-ctrl"><button class="step" type="button" aria-label="Kleinerer Trupp">−</button>' +
      '<span class="m-size"></span><button class="step" type="button" aria-label="Größerer Trupp">+</button>' +
      '<span class="m-chance"></span><button class="btn m-go" type="button">Entsenden</button></div>' +
      '<label class="m-repeat"><input type="checkbox"> Wiederholen</label>';
    const [minus, plus] = el.querySelectorAll('.step'), go = el.querySelector('.m-go'), rep = el.querySelector('input');
    // Vorschlag ohne eigene Wahl: so viele freie Kämpfer wie erlaubt
    const size = () => sizes[m.id] ?? S.orders[m.id]
      ?? Math.min(m.squad[1], Math.max(m.squad[0], E.freeBrothers(S) + E.freeWulfen(S)));
    const resize = d => {
      sizes[m.id] = Math.min(m.squad[1], Math.max(m.squad[0], size() + d));
      if (S.orders[m.id]) E.setOrder(S, m.id, sizes[m.id]);
      render();
    };
    minus.addEventListener('click', () => resize(-P));
    plus.addEventListener('click', () => resize(P));
    go.addEventListener('click', () => { if (E.sendMission(S, m.id, size())) render(); });
    rep.addEventListener('change', () => { E.setOrder(S, m.id, rep.checked ? size() : 0); render(); });
    el.addEventListener('mouseenter', () => showTip(el, { kind: 'mission', item: m }));
    el.addEventListener('mouseleave', hideTip);
    return { el, minus, plus, go, rep, size, stats: el.querySelector('.m-stats'), sizeEl: el.querySelector('.m-size'),
      chanceEl: el.querySelector('.m-chance'), repLabel: el.querySelector('.m-repeat') };
  }

  function updateMission(k, m) {
    const run = S.missions.find(x => x.id === m.id), n = run ? run.brothers + run.wulfen : k.size();
    const c = E.chance(S, m.id, n);
    const loot = Object.entries(m.loot).map(([id, v]) => amount(id, v)).join(', ');
    text(k.stats, run ? `Unterwegs · zurück in ${fmtTime(run.left)}`
      : `Bedrohung ${m.threat} · ${fmtTime(E.missionTime(S, m.time))} · ${loot}`);
    text(k.sizeEl, `${nHeads(n)} Kämpfer`);
    text(k.chanceEl, `Chance ${Math.round(c * 100)} %`);
    k.chanceEl.classList.toggle('miss', c < 0.5);
    k.minus.disabled = !!run || n <= m.squad[0];
    k.plus.disabled = !!run || n >= m.squad[1];
    k.go.disabled = !!run || E.freeBrothers(S) + E.freeWulfen(S) < n;
    k.repLabel.hidden = !E.canOrder(S);
    k.rep.checked = !!S.orders[m.id];
    k.el.classList.toggle('away', !!run);
  }

  const MASS = { name: 'Große Messe', desc: 'Der ganze Orden betet. Aller Glaube wird geopfert; die Frömmigkeit bleibt für immer.' };
  const pietyBonus = piety => Math.sqrt(piety) / 1000; // wie in der Engine: √Frömmigkeit ÷ 10 %

  // Feste Zeilen, damit darunter nichts springt.
  function reclusiamSummary() {
    if (!S.bld.reclusiam) {
      return '<p>Prediger im Schrein und Ordenspriester bringen Glauben.</p>' +
        '<p class="muted">Riten, Litaneien und die Große Messe brauchen ein Reclusiam (Festung).</p><p></p>';
    }
    const cost = E.litanyCost(S), short = S.res.faith < cost - 1e-9;
    const lit = S.litany ? `Litanei erneuert sich in ${fmtTime(S.litanyLeft)} für ` +
      `<span${short ? ' class="miss"' : ''}>${cost} Glauben</span>` : `Keine Litanei. Eine neue kostet ${cost} Glauben.`;
    const boons = S.boons.map(b => `${effectText(b.key, b.value)} (noch ${fmtTime(b.left)})`).join(', ');
    return `<p>Frömmigkeit <b>${fmt(S.piety, down)}</b> · Produktion <b>${pct(pietyBonus(S.piety))}</b></p>` +
      `<p class="muted">${lit}</p><p class="muted">${boons ? 'Segen: ' + boons : ''}</p>`;
  }

  function reclusiamItems() {
    const items = [{
      key: 'summary',
      make: () => { const el = document.createElement('div'); el.className = 'summary fixed'; return { el }; },
      update: k => html(k.el, reclusiamSummary()),
    }];
    if (!S.bld.reclusiam) return items;
    items.push({
      key: 'litany',
      make: () => selectRow('Litanei', () => [['', 'keine'], ...D.litanies.filter(l => E.litanyOpen(S, l.id))
        .map(l => [l.id, `${l.name} (${effectList(l.effects).join(', ')})`])], () => S.litany, v => E.chooseLitany(S, v)),
      update: k => k.update(),
    }, {
      key: 'mass',
      make: () => { const k = card(() => E.grandMass(S), { kind: 'mass', item: MASS }); k.name.textContent = MASS.name; return k; },
      update: k => {
        html(k.sub, S.res.faith >= 1 - 1e-9 ? `opfert ${amount('faith', S.res.faith, down)}` : 'kein Glaube zum Opfern');
        setOff(k, S.res.faith < 1 - 1e-9);
      },
    });
    for (const r of D.rites) {
      items.push({
        key: 'rite:' + r.id,
        make: () => { const k = card(() => E.buyRite(S, r.id), { kind: 'rite', item: r }); k.name.textContent = r.name; return k; },
        update: k => {
          const done = !!S.rites[r.id], cost = { faith: r.cost };
          html(k.sub, done ? 'vollzogen' : costHtml(cost));
          setOff(k, done || !E.canAfford(S, cost));
          k.el.classList.toggle('done', done);
        },
      });
    }
    return items;
  }

  // Feste Zeilen, damit darunter nichts springt.
  function relationSummary() {
    const auto = Math.min(1, E.effects(S)['vision.auto'] || 0);
    const state = S.storm > 0 ? `<span class="miss">Warpsturm: Die Astropathen schweigen noch ${fmtTime(S.storm)}.</span> Glaube +50 %`
      : `Visionen fangen die Astropathentürme zu ${Math.round(auto * 100)} % selbst, den Rest fängst du oben im Kopf.`;
    return `<p>Navigationsdaten <b>${fmt(S.res.navdata, down)}</b></p><p class="muted">${state}</p>` +
      `<p class="muted">${S.seen.cult ? '<span class="miss">Genestealer-Kult: Zuzug −50 %, bis der Kult zerschlagen ist.</span>' : ''}</p>`;
  }

  function relationItems() {
    const items = [{
      key: 'summary',
      make: () => { const el = document.createElement('div'); el.className = 'summary fixed'; return { el }; },
      update: k => html(k.el, relationSummary()),
    }];
    for (const p of D.partners) {
      if (E.isUnlocked(S, p)) items.push({ key: 'partner:' + p.id, make: () => partnerBlock(p), update: k => updatePartner(k, p) });
    }
    return items;
  }

  function partnerBlock(p) {
    const el = document.createElement('div');
    el.className = 'mission partner';
    el.innerHTML = `<div class="m-head"><span class="name">${p.name}</span><span class="p-level"></span></div>` +
      '<p class="m-stats p-deal"></p><p class="m-stats p-help"></p>' +
      '<div class="m-ctrl"><span class="m-chance p-note"></span><button class="btn m-go" type="button">Tauschen</button></div>' +
      '<label class="m-repeat"><input type="checkbox"> Dauerauftrag</label>';
    const go = el.querySelector('.m-go'), order = el.querySelector('input');
    go.addEventListener('click', () => { if (E.trade(S, p.id)) render(); });
    order.addEventListener('change', () => { E.setStandingOrder(S, p.id, order.checked); render(); });
    el.addEventListener('mouseenter', () => showTip(el, { kind: 'partner', item: p }));
    el.addEventListener('mouseleave', hideTip);
    return { el, go, order, level: el.querySelector('.p-level'), deal: el.querySelector('.p-deal'),
      help: el.querySelector('.p-help'), note: el.querySelector('.p-note'), orderLabel: el.querySelector('.m-repeat') };
  }

  const packet = (get, more) => Object.entries(get)
    .map(([id, v]) => (id === 'serfs' ? `${nHeads(v * more)} Knechte` : amount(id, v * more))).join(', ');

  function updatePartner(k, p) {
    const lvl = E.standingLevel(S, p.id), next = D.rules.standingLevels[lvl], low = lvl < D.rules.orderLevel;
    text(k.level, `Stufe ${lvl}` + (next ? ` · Ansehen ${fmt(S.standing[p.id] || 0, down)} / ${next}` : ' · höchste'));
    html(k.deal, `${costHtml(p.give)} → ${packet(p.get, E.tradeYield(S, p.id))}`);
    text(k.help, `Hilfe je Stufe: ${effectList(p.help).join(', ')}` + (p.helpText ? ` · ${p.helpText}` : ''));
    text(k.note, p.id === 'valkar' && S.docked ? 'Liegt im Hafen: +50 %' : low ? `Dauerauftrag ab Stufe ${D.rules.orderLevel}` : '');
    k.go.disabled = !E.canAfford(S, p.give);
    k.order.checked = !!S.standingOrders[p.id];
    k.order.disabled = low;
    k.orderLabel.classList.toggle('off', low);
  }

  const hangar = x => (x.once ? 1 : E.effects(S)['hangar.' + x.hangar] || 0);

  // Feste Zeilen, damit darunter nichts springt.
  function fleetSummary() {
    const c = S.campaign, free = D.systems.filter(x => S.systems[x.id]).length;
    const run = !c ? (S.tech.warpnav ? 'Die Flotte liegt im Orbit.' : 'Warpnavigation öffnet die Sektorkarte.')
      : S.storm > 0 ? `Feldzug nach ${SYS[c.id].name} · <span class="miss">Warpsturm: der Feldzug ruht</span>`
        : `Feldzug nach ${SYS[c.id].name} · zurück in ${fmtTime(c.left)}`;
    return `<p>Flottenstärke <b>${fmt(E.fleetPower(S))}</b> · Treibstoffzellen <b>${fmt(S.res.fuelcell, down)}</b></p>` +
      `<p class="muted">${run}</p><p class="muted">${S.tech.warpnav ? `Befreit: ${free} von ${D.systems.length - 1} Systemen` : ''}</p>`;
  }

  function sectorMap() {
    const el = document.createElement('div');
    el.className = 'sector';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', 'Sektorkarte: Gold ist befreit, leuchtend ist erreichbar');
    return { el };
  }

  // Neu gezeichnet nur, wenn sich ein System ändert.
  function updateSector(k) {
    const state = x => (x.home || S.systems[x.id] ? 'free' : S.campaign?.id === x.id ? 'war' : E.reachable(S, x.id) ? 'open' : 'far');
    const sig = D.systems.map(state).join();
    if (k.sig === sig) return;
    k.sig = sig;
    const pos = x => [8 + x.x * 3.2, 14 + x.y * 1.9];
    const lines = D.systems.flatMap(a => a.next.filter(n => a.id < n).map(n => {
      const [x1, y1] = pos(a), [x2, y2] = pos(SYS[n]), on = state(a) === 'free' && state(SYS[n]) === 'free';
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${on ? ' class="on"' : ''}/>`;
    }));
    const nodes = D.systems.map(x => {
      const [cx, cy] = pos(x);
      return `<g class="sys ${state(x)}"><circle cx="${cx}" cy="${cy}" r="${x.home ? 8 : 6.5}"/>` +
        `<text x="${cx}" y="${cy + 19}">${x.short}</text></g>`;
    });
    k.el.innerHTML = `<svg viewBox="0 0 336 212">${lines.join('')}${nodes.join('')}</svg>`;
  }

  const campSizes = {};
  function campaignBlock(x) {
    const el = document.createElement('div');
    el.className = 'mission';
    el.innerHTML = `<div class="m-head"><span class="name">${x.name}</span></div><p class="m-stats"></p><p class="m-stats c-gain"></p>` +
      '<div class="m-ctrl"><button class="step" type="button" aria-label="Kleinerer Trupp">−</button>' +
      '<span class="m-size"></span><button class="step" type="button" aria-label="Größerer Trupp">+</button>' +
      '<span class="m-chance"></span><button class="btn m-go" type="button">Feldzug</button></div>';
    const [minus, plus] = el.querySelectorAll('.step'), go = el.querySelector('.m-go'), [min, max] = D.rules.campaignSquad;
    const size = () => campSizes[x.id] ?? Math.min(max, Math.max(min, E.freeBrothers(S) + E.freeWulfen(S)));
    const resize = d => { campSizes[x.id] = Math.min(max, Math.max(min, size() + d)); render(); };
    minus.addEventListener('click', () => resize(-P));
    plus.addEventListener('click', () => resize(P));
    go.addEventListener('click', () => { if (E.startCampaign(S, x.id, size())) render(); });
    return { el, minus, plus, go, size, stats: el.querySelector('.m-stats'), gain: el.querySelector('.c-gain'),
      sizeEl: el.querySelector('.m-size'), chanceEl: el.querySelector('.m-chance') };
  }

  function updateCampaign(k, x) {
    const run = S.campaign?.id === x.id, n = run ? S.campaign.brothers + S.campaign.wulfen : k.size();
    const c = E.campaignChance(S, x.id, n), [min, max] = D.rules.campaignSquad, cost = E.campaignCost(x.id);
    html(k.stats, run ? `Unterwegs · zurück in ${fmtTime(S.campaign.left)}`
      : `${x.kind} · Bedrohung ${fmt(x.threat)} · ${fmtTime(E.campaignTime(S, x.id))} · ${costHtml(cost)}`);
    const gain = [...effectList(x.effects), ...Object.entries(x.reward || {}).map(([id, v]) => '+' + amount(id, v)),
      ...(x.legacy ? [`Vermächtnis +${x.legacy}`] : [])];
    text(k.gain, 'Befreit: ' + (gain.join(', ') || 'Ruhm und Ehre'));
    text(k.sizeEl, `${nHeads(n)} Kämpfer`);
    text(k.chanceEl, `Chance ${Math.round(c * 100)} %`);
    k.chanceEl.classList.toggle('miss', c < 0.5);
    k.minus.disabled = run || n <= min;
    k.plus.disabled = run || n >= max;
    k.go.disabled = !!S.campaign || E.freeBrothers(S) + E.freeWulfen(S) < n || !E.canAfford(S, cost);
    k.el.classList.toggle('away', run);
  }

  function fleetItems() {
    const items = [{
      key: 'summary',
      make: () => { const el = document.createElement('div'); el.className = 'summary fixed'; return { el }; },
      update: k => html(k.el, fleetSummary()),
    }];
    for (const x of D.ships) {
      if (!E.isUnlocked(S, x) || !hangar(x)) continue;
      items.push({
        key: 'ship:' + x.id,
        make: () => card(() => E.buildShip(S, x.id), { kind: 'ship', item: x }),
        update: k => {
          const cost = E.shipPrice(S, x.id), full = S.ships[x.id] >= hangar(x);
          html(k.name, `${x.name}<em>${S.ships[x.id]}</em>`);
          html(k.sub, full ? (x.once ? 'im Orbit' : 'kein Platz mehr') : costHtml(cost));
          setOff(k, full || !E.canAfford(S, cost));
        },
      });
    }
    if (!S.tech.warpnav) return items;
    items.push({ key: 'sector', make: sectorMap, update: updateSector });
    for (const x of D.systems) {
      if (E.reachable(S, x.id) || S.campaign?.id === x.id) {
        items.push({ key: 'system:' + x.id, make: () => campaignBlock(x), update: k => updateCampaign(k, x) });
      }
    }
    return items;
  }

  const FOUND_HINTS = {
    lore: 'Braucht die Lehre Gründungsrecht.',
    brothers: () => `Braucht ${D.rules.foundBrothers} Kampfbrüder, jetzt ${S.marines.brothers}.`,
    geneseed: () => `Braucht ${D.rules.foundGeneseed} Gensaat als Zehnt, jetzt ${fmt(S.res.geneseed, down)}.`,
  };
  const foundLabel = () => (S.chapter === 'sw' ? 'Neue Große Kompanie' : 'Nachfolgeorden gründen');
  const lineText = (id, lvl) => `${CH[id].name} Stufe ${lvl}: ` +
    CH[id].boost.map(k => effectText(k, CH[id].effects[k] * (1 + D.rules.lineBoost * lvl))).join(', ');
  const startText = st => [
    ...Object.entries(st.res || {}).map(([id, v]) => '+' + amount(id, v)),
    ...Object.entries(st.bld || {}).map(([id, v]) => `${v}× ${BLD[id].name}`),
    ...(st.tech || []).map(id => TECH[id].name), ...(st.places || []).map(id => PLACE[id].name),
    ...(st.coma ? [`${nHeads(st.coma)} Brüder mehr im Koma`] : []),
  ].join(', ');

  function legacySummary() {
    const m = S.meta, g = E.legacyGain(S), block = E.foundBlock(S), hint = FOUND_HINTS[block];
    const lines = Object.entries(m.lines).filter(([, n]) => n > 0).map(([id, n]) => lineText(id, n));
    return `<p>Vermächtnis <b>${m.legacy}</b> (Produktion und Lager +${m.legacy} %) · frei <b>${m.legacyFree}</b></p>` +
      `<p class="muted">Bei Gründung jetzt +${g.total}: ${g.brothers} aus Brüdern, ${g.renown} aus Ruhm, ${g.systems} aus Systemen</p>` +
      `<p class="muted">${block ? (typeof hint === 'function' ? hint() : hint) : 'Bereit zur Gründung.'}</p>` +
      `<p class="muted">${lines.length ? 'Linien: ' + lines.join(' · ') : ''}</p>`;
  }

  function legacyItems() {
    const items = [{
      key: 'summary',
      make: () => { const el = document.createElement('div'); el.className = 'summary fixed'; return { el }; },
      update: k => html(k.el, legacySummary()),
    }, {
      key: 'found',
      make: () => { const k = card(() => { openFound(); return false; }); k.el.classList.add('click', 'wide'); return k; },
      update: k => {
        text(k.name, foundLabel());
        text(k.sub, E.foundBlock(S) ? 'noch nicht bereit' : `+${E.legacyGain(S).total} Vermächtnis`);
        setOff(k, !!E.foundBlock(S));
      },
    }];
    for (const r of D.relics) {
      items.push({
        key: 'relic:' + r.id,
        make: () => { const k = card(() => E.buyRelic(S, r.id), { kind: 'relic', item: r }); k.name.textContent = r.name; return k; },
        update: k => {
          const done = !!S.meta.relics[r.id];
          html(k.sub, done ? 'geweiht' : `<span${S.meta.legacyFree < r.cost ? ' class="miss"' : ''}>${r.cost} Vermächtnis</span>`);
          setOff(k, done || S.meta.legacyFree < r.cost);
          k.el.classList.toggle('done', done);
        },
      });
    }
    return items;
  }

  // Liber Honoris: je Orden ein Block, neueste Einträge zuerst.
  function honorItems() {
    const groups = [];
    for (const h of S.meta.honors) {
      let g = groups.find(x => x.chapter === h.chapter);
      if (!g) groups.push(g = { chapter: h.chapter, list: [] });
      g.list.push(h);
    }
    return groups.reverse().map(g => ({
      key: 'honors:' + g.chapter,
      make: () => { const el = document.createElement('section'); el.className = 'honors'; return { el }; },
      update: k => {
        if (k.n === g.list.length) return;
        k.n = g.list.length;
        const esc = t => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
        k.el.innerHTML = `<h3>${esc(g.chapter)}</h3>` +
          g.list.slice().reverse().map(h => `<p><time>${esc(h.date)}</time>${esc(h.text)}</p>`).join('');
      },
    }));
  }

  function openFound() {
    if (E.foundBlock(S)) return;
    const line = $('found-line');
    if (!line.options.length) line.innerHTML = D.chapters.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    line.value = S.chapter;
    $('found-name').value = '';
    const pal = $('found-colors');
    pal.innerHTML = [{ id: '', name: 'Farben der Linie' }, ...D.palettes].map(p => {
      const c = p.id ? p : CH[line.value].colors;
      return `<label class="swatch" style="--sw1:${c.c1};--sw2:${c.c2}"><input type="radio" name="palette" value="${p.id}"${p.id ? '' : ' checked'}>` +
        `<i aria-hidden="true"></i>${p.name}</label>`;
    }).join('');
    const g = E.legacyGain(S);
    $('found-gain').textContent = `Vermächtnis +${g.total}, die Linie steigt um eine Stufe.`;
    $('found-go').textContent = S.chapter === 'sw' ? 'Neue Große Kompanie' : 'Gründen';
    $('found-msg').textContent = '';
    updateFoundLine();
    $('found').showModal();
  }

  function updateFoundLine() {
    const id = $('found-line').value, lvl = (S.meta.lines[id] || 0) + 1, ch = CH[id];
    $('found-line-info').textContent = `${lineText(id, lvl)} · Eigenheit: ${ch.quirk} · Makel: ${ch.flaw}`;
    const own = $('found-colors').querySelector('input[value=""]')?.parentElement;
    if (own) { own.style.setProperty('--sw1', ch.colors.c1); own.style.setProperty('--sw2', ch.colors.c2); }
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
    { id: 'missions', name: 'Einsätze', show: () => S.seen.marines, items: missionItems,
      badge: () => raidDue() || (E.freeBrothers(S) > 0 && D.places.some(p => E.placeState(S, p.id) === 'open')) },
    { id: 'forge', name: 'Schmiede', show: () => S.bld.forge > 0, items: forgeItems,
      badge: () => D.upgrades.some(u => E.upgradeVisible(S, u.id) && !S.upgrades[u.id] && E.canAfford(S, u.cost)) },
    { id: 'reclusiam', name: 'Reclusiam', show: () => !!S.tech.liturgy, items: reclusiamItems,
      badge: () => S.bld.reclusiam > 0 && D.rites.some(r => !S.rites[r.id] && S.res.faith >= r.cost - 1e-9) },
    { id: 'relations', name: 'Beziehungen', show: () => !!S.tech.astropathy, items: relationItems, badge: () => S.docked },
    { id: 'fleet', name: 'Flotte', show: () => !!S.tech.flight, items: fleetItems,
      badge: () => !S.campaign && !!S.tech.warpnav && D.systems.some(x => E.reachable(S, x.id) && E.canAfford(S, E.campaignCost(x.id))) },
    { id: 'legacy', name: 'Vermächtnis', show: () => !!S.tech.founding || S.meta.legacy > 0, items: legacyItems,
      badge: () => !E.foundBlock(S) },
    { id: 'honors', name: 'Liber Honoris', show: () => S.meta.honors.length >= 5, items: honorItems },
  ];

  // ---------- Zeichnen ----------

  let S = null, tab = 'fortress', rendered = new Map(), logShown = -1, logOpen = false, info = null, tip = null;
  let saveWarned = false, awaySum = null, brokenSave = false;

  function render() {
    if (!S) return;
    renderClock();
    renderVision();
    renderRes();
    renderTabs();
    renderPanel();
    renderLog();
    renderInfo();
    renderTip();
  }

  function renderVision() {
    $('vision-slot').hidden = !S.tech.astropathy;
    const on = S.vision > 0;
    $('vision').hidden = !on;
    if (on) text($('vision'), `Vision fangen · ${Math.ceil(S.vision)} s`); // Kopf ist am Handy schmal: kurz halten
  }

  function renderClock() {
    const c = E.calendar(S);
    html($('clock'), (S.tech.calendar ? `${c.date} · ${c.seasonName}` : 'Kharos Tertius') +
      (S.isHungry ? ' · <span class="miss">Hunger</span>' : '') + (raidDue() ? ' · <span class="miss">Orks!</span>' : ''));
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
      // freigeschaltet = sichtbar, auch bei 0; Bevölkerung und Schmiede-Waren stehen woanders
      if (res.pop || res.crafted || !E.isUnlocked(S, res)) continue;
      const row = resRow($('res-list'), res.id, res.icon, res.name), c = E.cap(S, res.id), rate = r[res.id];
      text(row.children[2], c === Infinity ? fmt(S.res[res.id], down) : `${fmt(S.res[res.id], down)} / ${fmt(c)}`);
      text(row.children[3], Math.abs(rate) > 1e-9 ? fmtRate(rate) : '');
      row.classList.toggle('full', S.res[res.id] >= c - 1e-9);
      row.children[3].classList.toggle('miss', rate < -1e-9);
    }
    // Bevölkerung: Zeilen erscheinen, sobald es sie gibt, und bleiben dann stehen.
    const m = S.marines, pop = (show, key, icon, name, value) => {
      if (show || $('pop-list').querySelector(`[data-k="${key}"]`)) text(resRow($('pop-list'), key, icon, name).children[2], value);
    };
    pop(S.seen.serfs, 'serfs', 'i-serfs', 'Knechte', `${nHeads(S.serfs)} / ${fmt(E.serfCap(S))}`);
    pop(S.seen.marines, 'brothers', 'i-brother', 'Kampfbrüder', nHeads(m.brothers));
    pop(E.isUnlocked(S, RES.aspirants), 'aspirants', 'i-aspirant', 'Aspiranten',
      `${nHeads(S.res.aspirants)} / ${fmt(E.cap(S, 'aspirants'))}`);
    pop(m.neophytes.length > 0, 'neophytes', 'i-neophyte', 'Neophyten', nHeads(sumHeads(m.neophytes)));
    pop(m.servitors > 0, 'servitors', 'i-servitor', 'Servitoren', nHeads(m.servitors));
    pop(m.wulfen > 0, 'wulfen', 'i-wulf', 'Wulfen', nHeads(m.wulfen));
  }

  function renderTabs() {
    const nav = $('tabs');
    let added = false;
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
        added = true;
      }
      b.setAttribute('aria-selected', String(t.id === tab));
      if (t.badge) text(b.lastChild, t.badge() ? '•' : '');
    }
    // Neue Reiter an ihren festen Platz (Reihenfolge wie in TABS)
    if (added) for (const t of TABS) { const b = nav.querySelector(`[data-tab="${t.id}"]`); if (b) nav.append(b); }
  }

  function switchTab(id) {
    tab = id;
    rendered = new Map();
    hideTip();
    $('panel').replaceChildren();
    render();
    // Am Handy scrollt die Reiterleiste: den gewählten Reiter ganz ins Bild holen
    $('tabs').querySelector(`[data-tab="${id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function renderPanel() {
    const items = TABS.find(t => t.id === tab).items(), keys = new Set(items.map(i => i.key));
    for (const [key, k] of rendered) if (!keys.has(key)) { k.el.remove(); rendered.delete(key); }
    for (const item of items) {
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

  const effectList = fx => Object.entries(fx || {}).map(([k, v]) => effectText(k, v));
  // Was ein Ort bei der Entdeckung freischaltet (alles, was ihn in requires.place nennt).
  const opensByPlace = id => [...D.resources, ...D.buildings, ...D.jobs, ...D.techs]
    .filter(x => [].concat(x.requires?.place || []).includes(id)).map(x => x.name);

  function details(kind, item) {
    if (kind === 'mission') {
      const lucky = Object.entries(item.lucky || {}).map(([id, [p, n]]) => `${Math.round(p * 100)} %: ${amount(id, n)}`);
      return `<p class="muted">Beute bei Sieg: ${Object.entries(item.loot).map(([id, v]) => amount(id, v)).join(', ')}` +
        `${lucky.length ? ' · selten ' + lucky.join(', ') : ''}</p>` +
        `<p class="muted">Truppgröße ${item.squad[0]}–${item.squad[1]} · Bedrohung ${item.threat}` +
        `${item.calm ? ` · senkt die Bedrohung um ${item.calm}` : ''}</p>` +
        '<p class="muted">Verluste sind möglich; Apothecarii bergen die Gensaat der Gefallenen.</p>';
    }
    if (kind === 'place') {
      const gets = [...Object.entries(item.reward || {}).map(([id, v]) => '+' + amount(id, v)), ...effectList(item.effects),
        ...opensByPlace(item.id)];
      return `<p class="muted">Bringt: ${gets.join(', ') || 'Überblick'}</p>` +
        `<p class="muted">Dauer: ${fmtTime(E.missionTime(S, item.time, true))} mit ${nHeads(P)} Brüdern</p>`;
    }
    if (kind === 'relic') {
      const parts = [...effectList(item.effects), ...(item.start ? ['Start: ' + startText(item.start)] : [])];
      return `<p class="muted">Wirkung: ${parts.join(', ')}</p>` + (S.meta.relics[item.id] ? '<p>Geweiht</p>'
        : `<p${S.meta.legacyFree < item.cost ? ' class="miss"' : ''}>Kosten: ${item.cost} Vermächtnis (frei ${S.meta.legacyFree})</p>`);
    }
    if (kind === 'ship') {
      const room = item.once ? 'Nur eine je Orden.' : `Platz: ${hangar(item)} (${item.hangar === 'hawk' ? '3 je Landeplattform' : '2 je Orbitalwerft'})`;
      return `<p class="muted">Wirkung: ${effectList(item.effects).join(', ')}</p><p class="muted">${room}</p>` +
        costDetail(E.shipPrice(S, item.id));
    }
    if (kind === 'partner') {
      const levels = D.rules.standingLevels.join(' / ');
      return `<p class="muted">Jeder Tausch: +${N2.format(1 + (E.effects(S)['standing.bonus'] || 0))} Ansehen. Stufen bei ${levels}; ` +
        'jede Stufe bringt +10 % Ausbeute und die Hilfe einmal mehr.</p>' +
        `<p class="muted">Dauerauftrag ab Stufe ${D.rules.orderLevel}: tauscht alle ${D.rules.orderEvery} s, wenn die Ware ` +
        `zu ${Math.round(D.rules.orderFill * 100)} % im Lager liegt (ohne Lager: ${D.rules.orderPackages} Pakete).</p>`;
    }
    if (kind === 'rite') {
      const opens = D.litanies.filter(l => [].concat(l.requires?.rite || []).includes(item.id)).map(l => 'Litanei ' + l.name);
      return `<p class="muted">Wirkung: ${[...effectList(item.effects), ...opens].join(', ')}</p>` +
        (S.rites[item.id] ? '<p>Vollzogen</p>' : costDetail({ faith: item.cost }));
    }
    if (kind === 'mass') {
      const after = S.piety + S.res.faith;
      return `<p class="muted">Jetzt: Frömmigkeit ${fmt(S.piety, down)}, Produktion ${pct(pietyBonus(S.piety))}</p>` +
        `<p class="muted">Danach: Frömmigkeit ${fmt(after, down)}, Produktion ${pct(pietyBonus(after))}</p>`;
    }
    if (kind === 'upgrade') {
      return `<p class="muted">Wirkung: ${effectList(item.effects).join(', ')}</p>` +
        (S.upgrades[item.id] ? '<p>Erworben</p>' : costDetail(item.cost));
    }
    let what;
    if (kind === 'building') {
      what = 'Wirkung: ' + effectList(item.effects).join(', ');
      const coma = S.marines.coma;
      if (item.id === 'apothecarion' && coma) {
        what += ` · Weckt ${nHeads(coma)} Brüder, sie essen zusammen ${N1.format(coma * D.rules.marineFood)} Vorräte/s`;
      }
    }
    else {
      const opens = [...D.resources, ...D.buildings, ...D.jobs, ...D.techs, ...D.offices]
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
      // Reicht es, steht der Preis zweimal da: abgerundeter Bestand neben aufgerundetem Preis sähe nach „fehlt“ aus.
      return `<p${miss ? ' class="miss"' : ''}>${RES[id].name}: ${miss ? fmt(S.res[id], down) : fmt(v, up)} / ${fmt(v, up)}` +
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
      sum = { seconds: awaySum.seconds + sum.seconds, serfs: awaySum.serfs + sum.serfs,
        brothers: awaySum.brothers + sum.brothers, res };
    }
    awaySum = sum;
    const lines = [];
    const count = (v, one, many) => { if (v) lines.push(`${v > 0 ? '+' : '−'}${nHeads(Math.abs(v))} ${Math.abs(v) === 1 ? one : many}`); };
    count(sum.serfs, 'Knecht', 'Knechte');
    count(sum.brothers, 'Kampfbruder', 'Kampfbrüder');
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
    const c = PAL[S.palette] || CH[S.chapter].colors, st = document.documentElement.style;
    st.setProperty('--c1', c.c1);
    st.setProperty('--c2', c.c2);
    st.setProperty('--c-on', c.on);
    st.setProperty('--c-glow', c.glow);
    $('chapter-name').textContent = S.name;
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
      $('chapter-info').innerHTML = (S.name !== ch.name ? `<p><b>${S.name.replace(/</g, '&lt;')}</b> · Linie ${ch.name}` +
        ` (Stufe ${S.meta.lines[S.chapter] || 0})</p>` : `<p><b>${ch.name}</b> · Schiff „${ch.ship}“</p>`) + `<p>Bonus: ${ch.bonus}</p>` +
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
    $('vision').addEventListener('click', () => { if (S && E.catchVision(S)) render(); });
    $('found-line').addEventListener('change', updateFoundLine);
    $('found-suggest').addEventListener('click', () => {
      const list = CH[$('found-line').value].successors;
      $('found-name').value = list[Math.floor(Math.random() * list.length)];
    });
    $('found-cancel').addEventListener('click', () => $('found').close());
    $('found-form').addEventListener('submit', e => {
      e.preventDefault();
      const palette = $('found-colors').querySelector('input:checked')?.value || null;
      const n = S && E.found(S, { name: $('found-name').value, lineage: $('found-line').value, palette });
      if (!n) { $('found-msg').textContent = 'Bitte einen Namen mit höchstens 24 Zeichen eingeben.'; return; }
      backup();
      S = n;
      applyChapter();
      saveNow();
      rebuild();
      $('found').close();
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
  const snapshot = () => ({ at: Date.now(), serfs: S?.serfs || 0, brothers: S?.marines.brothers || 0, res: S ? { ...S.res } : {} });
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
      showAway({ seconds, serfs: S.serfs - away.serfs, brothers: S.marines.brothers - away.brothers, res });
    }
    render();
  });
  addEventListener('pagehide', saveNow);
  // Homescreen und offline: nur über http(s), nicht als geöffnete Datei
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
