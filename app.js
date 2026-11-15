/* ==========================================================================
   Logiscool UAE – Winter Camps 2026/27 · Dubai Customs registration
   Plain JS, no build step. Data first, behaviour below.
   ========================================================================== */
(() => {
  'use strict';

  /* ---------------------------------------------------------------------
     CONFIG – the only thing you must edit before going live
     --------------------------------------------------------------------- */
  const CONFIG = {
    // Paste the Google Apps Script "Web app" URL here (see README.md).
    // While empty the page runs in PREVIEW mode: the form works end to end,
    // but nothing is sent anywhere and the success screen says so.
    endpoint: 'https://script.google.com/macros/s/AKfycbzLoaSxp-sR5-lzUsDBmRhnL8woK0oLx_RlzfwyUhwwkqQqjGpZVwnV5mzC4VqONNas5A/exec',
    maxChildren: 6,
    requestTimeoutMs: 25000,
  };

  /* ---------------------------------------------------------------------
     PRICING – Dubai Customs employee offer (per child, per camp week).
     The public flyer discounts (early bird, multi-week, sibling) do NOT apply.
     --------------------------------------------------------------------- */
  const PRICING = {
    dubai:   { label: 'Dubai',   list: 1100, discount: 0.30 },
    sharjah: { label: 'Sharjah', list: 680,  discount: 0.20 },
  };

  const BRANCHES = [
    { id: 'cityland', name: 'Cityland Mall',        city: 'dubai'   },
    { id: 'oasis',    name: 'Oasis Mall',           city: 'dubai'   },
    { id: 'mirdif',   name: 'Mirdif Sport Society', city: 'dubai'   },
    { id: 'sharjah',  name: 'Sharjah Central Mall', city: 'sharjah' },
  ];

  /* ---------------------------------------------------------------------
     CAMPS + SCHEDULE (taken from the two 2026 flyers and the descriptions PDF)
     --------------------------------------------------------------------- */
  const CAMPS = {
    'roblox-design': {
      name: 'Roblox Game Design', track: 'Roblox', img: 'assets/img/camp-roblox-design.jpg', accent: 'sky',
      lead: 'Where players become game creators.',
      text: 'Go beyond playing your favourite platform. Explore Roblox Studio, pick up the basics of game and level design and build anything from kart races to obstacle courses and tricky puzzles. You leave with a collection of games to build on and share.',
      pick: ['you want to design your own Roblox game', 'you want to learn how to use Roblox Studio', 'you want to create custom mobs and maps'],
    },
    'roblox-multiverse': {
      name: 'Roblox Multiverse', track: 'Roblox', img: 'assets/img/camp-roblox-multiverse.jpg', accent: 'sky',
      lead: 'Design your own teleportation game.',
      text: 'Step into game creation with Roblox Studio: design interactive games, add scripting and build teleportation mechanics that carry players between worlds. The result is a first fully working game, ready to share on mobile, Xbox and PC.',
      pick: ['you want to create your own Roblox game', 'you are into game design, scripting and world-building', 'you have limitless imagination to share'],
    },
    'minecraft-design': {
      name: 'Minecraft Design', track: 'Minecraft', img: 'assets/img/camp-minecraft-design.jpg', accent: 'lime',
      lead: 'Create unique skins and fantastic worlds.',
      text: 'Redesign the Minecraft world instead of only building in it. Learn the basics of creative design and planning, put redstone to work and craft characters, skins and snowy, forested or even lava landscapes with a story of your own.',
      pick: ['you love Minecraft', 'you are interested in drawing', 'you like creative challenges'],
    },
    'minecraft-maze': {
      name: 'Minecraft Maze Master', track: 'Minecraft', img: 'assets/img/camp-minecraft-maze.jpg', accent: 'lime',
      lead: 'Build your own escape adventure.',
      text: 'Design and build a complete escape room full of redstone puzzles, hidden traps and secret rooms. Along the way you learn real game design principles, and finish with a playable Minecraft maze to share with friends.',
      pick: ['you want to build your own escape room', 'you want to learn redstone mechanics and puzzle design', 'you enjoy solving challenges'],
    },
    'ai-creator': {
      name: 'AI Creator Lab', track: 'AI', img: 'assets/img/camp-ai-creator.jpg', accent: 'magenta',
      lead: 'From big idea to website launch.',
      text: 'Plan a website, create visuals, design logos and organise content with AI-supported tools. With beginner-friendly Canva and Wix, young creators learn how AI can help their creativity, and how to build and share digital work safely and responsibly.',
      pick: ['you want to create your own website', 'you enjoy design, storytelling, visuals and logos', 'you are curious how AI helps with planning and content'],
    },
  };

  // start = first camp day (used to work out the child's age on the day camp begins)
  const SCHEDULE = {
    dubai: {
      days: 'Monday to Friday',
      weeks: [
        { id: 'w1', n: 1, dates: '14–18 Dec 2026', short: '14–18 Dec', start: '2026-12-14', days: 'Mon–Fri', tint: 'sky', options: [
          { id: 'w1-a', camp: 'roblox-design',    group: 'Ages 6–9', min: 6,  max: 9 },
          { id: 'w1-b', camp: 'roblox-multiverse', group: 'Ages 10+', min: 10, max: null } ] },
        { id: 'w2', n: 2, dates: '21–25 Dec 2026', short: '21–25 Dec', start: '2026-12-21', days: 'Mon–Fri', tint: 'magenta', options: [
          { id: 'w2-a', camp: 'minecraft-design', group: 'Ages 6–9', min: 6,  max: 9 },
          { id: 'w2-b', camp: 'minecraft-maze',   group: 'Ages 10+', min: 10, max: null } ] },
        { id: 'w3', n: 3, dates: '28–31 Dec 2026', short: '28–31 Dec', start: '2026-12-28', days: 'Mon–Thu', tint: 'lime', options: [
          { id: 'w3-a', camp: 'ai-creator', group: 'Ages 6–9', min: 6,  max: 9 },
          { id: 'w3-b', camp: 'ai-creator', group: 'Ages 10+', min: 10, max: null } ] },
      ],
    },
    sharjah: {
      days: 'Sunday to Thursday',
      weeks: [
        { id: 'w1', n: 1, dates: '13–17 Dec 2026', short: '13–17 Dec', start: '2026-12-13', days: 'Sun–Thu', tint: 'sky', options: [
          { id: 'w1-s', camp: 'roblox-design', group: 'Ages 9–14', min: 9, max: 14 } ] },
        { id: 'w2', n: 2, dates: '20–24 Dec 2026', short: '20–24 Dec', start: '2026-12-20', days: 'Sun–Thu', tint: 'magenta', options: [
          { id: 'w2-s', camp: 'minecraft-maze', group: 'Ages 9–14', min: 9, max: 14 } ] },
        { id: 'w3', n: 3, dates: '27–31 Dec 2026', short: '27–31 Dec', start: '2026-12-27', days: 'Sun–Thu', tint: 'lime', options: [
          { id: 'w3-s', camp: 'ai-creator', group: 'Ages 9–14', min: 9, max: 14 } ] },
      ],
    },
  };

  /* ---------------------------------------------------------------------
     Small helpers
     --------------------------------------------------------------------- */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const aed = (n) => 'AED ' + Math.round(n).toLocaleString('en-US');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ICON = {
    pin:   '<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.800 12 21 12 21Z"/><circle cx="12" cy="9.500" r="2.500"/></svg>',
    check: '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="3.500" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.500 4.500 4.500L19 7.500"/></svg>',
    plus:  '<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    cal:   '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.500" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.500 10h17"/></svg>',
  };

  const tintClass = {
    sky:     { bar: 'bg-sky',     soft: 'bg-sky/10',     text: 'text-sky' },
    magenta: { bar: 'bg-magenta', soft: 'bg-magenta/10', text: 'text-magenta' },
    lime:    { bar: 'bg-lime',    soft: 'bg-lime/25',    text: 'text-navy' },
  };

  /* ---- date / age maths (strings only, so time zones can't shift a birthday) ---- */
  function parseISO(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return { y, m: mo, d };
  }
  function ageOn(dob, onISO) {
    const b = parseISO(dob), o = parseISO(onISO);
    if (!b || !o) return null;
    let a = o.y - b.y;
    if (o.m < b.m || (o.m === b.m && o.d < b.d)) a--;
    return a;
  }
  function todayISO() {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }
  const validDob = (dob) => {
    const p = parseISO(dob);
    return !!p && dob <= todayISO() && p.y >= 1995;
  };
  const eligible = (opt, week, dob) => {
    if (!validDob(dob)) return true; // unknown yet – don't block
    const a = ageOn(dob, week.start);
    return a >= opt.min && (opt.max == null || a <= opt.max);
  };
  function ageRange(city) {
    const opts = SCHEDULE[city].weeks.flatMap((w) => w.options);
    const min = Math.min(...opts.map((o) => o.min));
    const max = opts.some((o) => o.max == null) ? null : Math.max(...opts.map((o) => o.max));
    return { min, max, text: max == null ? `${min}+` : `${min}–${max}` };
  }

  /* ---------------------------------------------------------------------
     State
     --------------------------------------------------------------------- */
  const state = { branchId: null, children: [], seq: 0, submitting: false };
  const branch = () => BRANCHES.find((b) => b.id === state.branchId) || null;
  const city = () => (branch() ? branch().city : null);

  function newChild() {
    return { id: ++state.seq, name: '', dob: '', picks: {} };
  }

  function calc() {
    const c = city();
    if (!c) return { count: 0, before: 0, pct: 0, discount: 0, total: 0, lines: [] };
    const { list, discount: pct } = PRICING[c];
    const lines = [];
    state.children.forEach((ch, i) => {
      SCHEDULE[c].weeks.forEach((w) => {
        const opt = w.options.find((o) => o.id === ch.picks[w.id]);
        if (opt) lines.push({ childIdx: i, child: ch, week: w, opt, camp: CAMPS[opt.camp], price: list });
      });
    });
    const before = lines.length * list;
    const discount = Math.round(before * pct);
    return { count: lines.length, before, pct, discount, total: before - discount, lines };
  }

  /* ---------------------------------------------------------------------
     Static sections rendered from data (camps, schedule, offer)
     --------------------------------------------------------------------- */
  function renderCampCards() {
    const host = $('#camp-grid');
    if (!host) return;
    host.innerHTML = Object.entries(CAMPS).map(([id, c], i) => {
      const where = ['dubai', 'sharjah'].map((ct) => {
        const groups = SCHEDULE[ct].weeks.flatMap((w) => w.options).filter((o) => o.camp === id);
        if (!groups.length) return '';
        const g = [...new Set(groups.map((o) => o.group))].join(' / ');
        return `<li class="rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-navy"><span class="text-navy/60">${PRICING[ct].label}</span> · ${esc(g)}</li>`;
      }).join('');
      const acc = { sky: 'bg-sky', lime: 'bg-lime', magenta: 'bg-magenta' }[c.accent];
      return `
      <article class="camp-card reveal group flex flex-col overflow-hidden rounded-3xl border border-navy/10 bg-white" style="--d:${i * 70}ms">
        <div class="relative aspect-[16/10] overflow-hidden">
          <img src="${c.img}" alt="${esc(c.name)} camp artwork" loading="lazy" class="h-full w-full object-cover transition duration-700 group-hover:scale-105">
          <span class="absolute left-4 top-4 rounded-full ${acc} px-3 py-1 text-xs font-bold uppercase tracking-wider ${c.accent === 'lime' ? 'text-navy' : 'text-white'}">${esc(c.track)}</span>
        </div>
        <div class="flex flex-1 flex-col p-6">
          <h3 class="font-display text-2xl font-black leading-tight text-navy">${esc(c.name)}</h3>
          <p class="mt-1 font-semibold text-magenta">${esc(c.lead)}</p>
          <p class="mt-3 text-[15px] leading-relaxed text-navy/75">${esc(c.text)}</p>
          <button type="button" class="mt-4 inline-flex items-center gap-2 self-start text-sm font-bold text-navy underline decoration-lime decoration-4 underline-offset-4 hover:decoration-sky" data-toggle="pick-${id}" aria-expanded="false" aria-controls="pick-${id}">Is this camp for my child?</button>
          <div id="pick-${id}" class="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300">
            <div class="overflow-hidden">
              <ul class="mt-3 space-y-2 border-l-4 border-lime pl-4 text-sm text-navy/80">
                ${c.pick.map((p) => `<li>Choose this camp if ${esc(p)}.</li>`).join('')}
              </ul>
            </div>
          </div>
          <ul class="mt-auto flex flex-wrap gap-2 pt-5">${where}</ul>
        </div>
      </article>`;
    }).join('');

    $$('[data-toggle]', host).forEach((btn) => btn.addEventListener('click', () => {
      const panel = document.getElementById(btn.dataset.toggle);
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.classList.toggle('grid-rows-[0fr]', open);
      panel.classList.toggle('grid-rows-[1fr]', !open);
    }));
  }

  function renderSchedule(ct) {
    const host = $('#schedule-panel');
    if (!host) return;
    const s = SCHEDULE[ct];
    const branches = BRANCHES.filter((b) => b.city === ct);
    host.innerHTML = `
      <div class="space-y-3">
        ${s.weeks.map((w) => {
          const t = tintClass[w.tint];
          return `
          <div class="grid overflow-hidden rounded-2xl border border-navy/10 bg-white sm:grid-cols-[170px_1fr]">
            <div class="${t.soft} relative p-4 sm:p-5">
              <span class="absolute inset-y-0 left-0 w-1.5 ${t.bar}"></span>
              <p class="pl-2 text-xs font-bold uppercase tracking-widest text-navy/60">Week ${String(w.n).padStart(2, '0')}</p>
              <p class="pl-2 font-display text-xl font-black text-navy">${esc(w.short)}</p>
              <p class="pl-2 text-xs font-medium text-navy/60">${esc(w.days)} · 2026</p>
            </div>
            <div class="grid divide-y divide-navy/10 sm:divide-x sm:divide-y-0 ${w.options.length > 1 ? 'sm:grid-cols-2' : ''}">
              ${w.options.map((o) => `
                <div class="p-4 sm:p-5">
                  <p class="text-xs font-bold uppercase tracking-widest text-navy/50">${esc(o.group)}</p>
                  <p class="font-display text-lg font-extrabold text-navy">${esc(CAMPS[o.camp].name)}</p>
                </div>`).join('')}
            </div>
          </div>`;
        }).join('')}
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div class="rounded-2xl bg-navy p-5 text-white">
          <p class="text-xs font-bold uppercase tracking-widest text-lime">Camp day · ${esc(s.days)}</p>
          <div class="mt-4 flex h-12 overflow-hidden rounded-xl text-xs font-semibold sm:text-sm" role="img" aria-label="09:00 to 11:00 camp class, 11:00 to 12:00 break, 12:00 to 13:00 camp class">
            <div class="flex flex-[2] items-center justify-center bg-sky px-2 text-center">Camp class</div>
            <div class="flex flex-1 items-center justify-center bg-white/15 px-2 text-center">Break</div>
            <div class="flex flex-[1] items-center justify-center bg-sky px-2 text-center">Camp class</div>
          </div>
          <div class="mt-2 flex text-xs text-white/70">
            <span class="flex-[2]">09:00</span><span class="flex-1">11:00</span><span class="flex-[1]">12:00</span><span>13:00</span>
          </div>
        </div>
        <div class="rounded-2xl border border-navy/10 bg-white p-5">
          <p class="text-xs font-bold uppercase tracking-widest text-navy/50">${branches.length > 1 ? 'Branches' : 'Branch'}</p>
          <ul class="mt-3 space-y-2">
            ${branches.map((b) => `<li class="flex items-center gap-2 font-semibold text-navy"><span class="text-magenta">${ICON.pin}</span>${esc(b.name)}</li>`).join('')}
          </ul>
        </div>
      </div>`;
  }

  function renderScheduleTabs() {
    const tabs = $$('[data-sched]');
    const activate = (ct) => {
      tabs.forEach((t) => {
        const on = t.dataset.sched === ct;
        t.setAttribute('aria-selected', String(on));
        t.classList.toggle('bg-navy', on);
        t.classList.toggle('text-white', on);
        t.classList.toggle('text-navy', !on);
      });
      renderSchedule(ct);
    };
    tabs.forEach((t) => t.addEventListener('click', () => activate(t.dataset.sched)));
    activate('dubai');
  }

  function renderOfferCards() {
    const host = $('#offer-cards');
    if (!host) return;
    const card = (ct, names, tone) => {
      const p = PRICING[ct];
      const net = Math.round(p.list * (1 - p.discount));
      return `
      <div class="reveal relative overflow-hidden rounded-3xl ${tone.bg} p-7 sm:p-8">
        <p class="text-xs font-bold uppercase tracking-widest ${tone.muted}">${esc(names)}</p>
        <div class="mt-5 flex items-end gap-3">
          <span class="font-display text-6xl font-black leading-none sm:text-7xl">${aed(net).replace('AED ', '')}</span>
          <span class="pb-1 font-display text-xl font-extrabold">AED</span>
        </div>
        <p class="mt-2 text-sm ${tone.muted}">per child, per camp week &nbsp;·&nbsp; <s>${aed(p.list)}</s></p>
        <span class="absolute right-5 top-5 rotate-6 rounded-full ${tone.badge} px-3.5 py-1.5 font-display text-sm font-black">${Math.round(p.discount * 100)}% OFF</span>
      </div>`;
    };
    host.innerHTML =
      card('dubai', 'Cityland Mall · Oasis Mall · Mirdif Sport Society', { bg: 'bg-navy text-white', muted: 'text-white/70', badge: 'bg-lime text-navy' }) +
      card('sharjah', 'Sharjah Central Mall', { bg: 'bg-lime text-navy', muted: 'text-navy/70', badge: 'bg-navy text-white' });
  }

  /* ---------------------------------------------------------------------
     Registration form
     --------------------------------------------------------------------- */
  const els = {};

  function renderBranches() {
    els.branchGrid.innerHTML = BRANCHES.map((b) => {
      const p = PRICING[b.city];
      return `
      <label class="branch-card">
        <input type="radio" name="branch" value="${b.id}" class="peer sr-only" ${state.branchId === b.id ? 'checked' : ''}>
        <span class="branch-face">
          <span class="flex items-start justify-between gap-3">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy/5 text-navy transition bubble">${ICON.pin}</span>
            <span class="tick grid h-6 w-6 place-items-center rounded-full border-2 border-navy/20 text-transparent">${ICON.check}</span>
          </span>
          <span class="mt-4 block font-display text-lg font-extrabold leading-snug">${esc(b.name)}</span>
          <span class="mt-1 block text-sm opacity-70">${esc(p.label)} · ${Math.round(p.discount * 100)}% off</span>
        </span>
      </label>`;
    }).join('');
  }

  function weekRowsHTML(ch) {
    const c = city();
    return SCHEDULE[c].weeks.map((w) => {
      const t = tintClass[w.tint];
      return `
      <fieldset class="rounded-2xl border border-navy/10 bg-mist/60 p-3 sm:p-4">
        <legend class="sr-only">Week ${w.n}, ${esc(w.dates)}</legend>
        <div class="mb-3 flex items-center gap-2 text-sm">
          <span class="h-2.5 w-2.5 rounded-full ${t.bar}"></span>
          <span class="font-bold text-navy">Week ${w.n}</span>
          <span class="text-navy/60">${esc(w.dates)} · ${esc(w.days)}</span>
        </div>
        <div class="grid gap-2 ${w.options.length > 1 ? 'md:grid-cols-2' : ''}">
          ${w.options.map((o) => tileHTML(ch, w, o)).join('')}
        </div>
      </fieldset>`;
    }).join('');
  }

  function tileHTML(ch, w, o) {
    const camp = CAMPS[o.camp];
    const on = ch.picks[w.id] === o.id;
    const ok = eligible(o, w, ch.dob);
    const age = ageOn(ch.dob, w.start);
    return `
    <button type="button" class="tile" data-pick="${w.id}:${o.id}" aria-pressed="${on}" ${ok ? '' : 'disabled'}>
      <img src="${camp.img}" alt="" class="h-14 w-14 shrink-0 rounded-xl object-cover" loading="lazy">
      <span class="min-w-0 flex-1 text-left">
        <span class="block truncate font-display text-[15px] font-extrabold leading-tight">${esc(camp.name)}</span>
        <span class="mt-0.5 block text-xs ${ok ? 'opacity-70' : 'font-semibold text-magenta'}">${ok ? esc(o.group) : `${esc(o.group)} only · age ${age} at camp start`}</span>
      </span>
      <span class="tick grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-navy/20 text-transparent">${ICON.check}</span>
    </button>`;
  }

  function childHTML(ch, i) {
    const range = ageRange(city());
    const prev = state.children[i - 1];
    const canCopy = i > 0 && prev && Object.keys(prev.picks).length > 0;
    return `
    <article class="child-card reveal-in rounded-3xl border border-navy/10 bg-white p-5 shadow-[6px_6px_0_0_rgba(0,66,106,.08)] sm:p-7" data-child="${ch.id}">
      <header class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="grid h-9 w-9 place-items-center rounded-full bg-lime font-display text-base font-black text-navy">${i + 1}</span>
          <h3 class="font-display text-xl font-extrabold text-navy">Child ${i + 1}</h3>
        </div>
        ${state.children.length > 1 ? `<button type="button" data-remove class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-magenta hover:bg-magenta/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-magenta">${ICON.trash} Remove</button>` : ''}
      </header>

      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label" for="cn-${ch.id}">Child's full name</label>
          <input id="cn-${ch.id}" data-field="name" class="field" type="text" autocomplete="off" placeholder="e.g. Omar Al Mansoori" value="${esc(ch.name)}" maxlength="80">
          <p class="err" data-err="name" role="alert"></p>
        </div>
        <div>
          <label class="label" for="cd-${ch.id}">Child's date of birth</label>
          <input id="cd-${ch.id}" data-field="dob" class="field" type="date" min="1995-01-01" max="${todayISO()}" value="${esc(ch.dob)}">
          <p class="err" data-err="dob" role="alert"></p>
        </div>
      </div>

      <div class="mt-6">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="label !mb-0">Choose camp week(s) <span class="font-medium normal-case text-navy/50">· one camp per week</span></p>
          ${canCopy ? `<button type="button" data-copy class="text-sm font-bold text-sky underline decoration-2 underline-offset-4 hover:text-navy">Same camps as Child ${i}</button>` : ''}
        </div>
        <p class="mt-1 text-sm text-navy/60">This branch accepts ages ${range.text}. Camps that don't fit your child's age are greyed out once the date of birth is entered.</p>
        <div class="mt-3 space-y-3" data-camps>${weekRowsHTML(ch)}</div>
        <p class="err" data-err="camps" role="alert"></p>
      </div>
    </article>`;
  }

  function renderChildren(focusId) {
    els.children.innerHTML = state.children.map(childHTML).join('') ;
    els.addChild.hidden = state.children.length >= CONFIG.maxChildren;
    if (focusId) {
      const card = $(`[data-child="${focusId}"]`, els.children);
      if (card) {
        card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        setTimeout(() => $('[data-field="name"]', card)?.focus({ preventScroll: true }), reduceMotion ? 0 : 350);
      }
    }
    renderSummary();
  }

  function refreshCamps(ch) {
    const card = $(`[data-child="${ch.id}"]`, els.children);
    if (card) $('[data-camps]', card).innerHTML = weekRowsHTML(ch);
    renderSummary();
  }

  /* ---- summary ---- */
  let shownTotal = 0;
  function tweenTotal(el, to) {
    if (reduceMotion) { el.textContent = aed(to); shownTotal = to; return; }
    const from = shownTotal, t0 = performance.now(), dur = 380;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = aed(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step); else shownTotal = to;
    };
    requestAnimationFrame(step);
  }

  function renderSummary() {
    const r = calc();
    const b = branch();
    const body = els.summaryBody;

    if (!b) {
      body.innerHTML = '<p class="text-white/70">Pick a branch to start. Your price appears here as you choose camps.</p>';
    } else if (!r.count) {
      body.innerHTML = `<p class="text-sm font-semibold text-lime">${esc(b.name)}</p><p class="mt-2 text-white/70">No camps selected yet. Choose a camp week for each child.</p>`;
    } else {
      const perChild = state.children.map((ch, i) => {
        const lines = r.lines.filter((l) => l.child === ch);
        if (!lines.length) return '';
        return `
        <div class="py-3">
          <p class="font-display font-extrabold">${esc(ch.name.trim() || 'Child ' + (i + 1))}</p>
          <ul class="mt-1.5 space-y-1.5 text-sm">
            ${lines.map((l) => `<li class="flex justify-between gap-3"><span class="text-white/75">Wk ${l.week.n} · ${esc(l.camp.name)}</span><span class="shrink-0 tabular-nums">${aed(l.price)}</span></li>`).join('')}
          </ul>
        </div>`;
      }).join('');
      body.innerHTML = `
        <p class="text-sm font-semibold text-lime">${esc(b.name)}</p>
        <div class="mt-2 divide-y divide-white/10">${perChild}</div>`;
    }

    $('#sum-before').textContent = aed(r.before);
    $('#sum-pct').textContent = Math.round(r.pct * 100) || (city() ? Math.round(PRICING[city()].discount * 100) : 0);
    $('#sum-discount').textContent = r.discount ? '− ' + aed(r.discount) : aed(0);
    tweenTotal($('#sum-total'), r.total);
    $('#mobile-total').textContent = aed(r.total);
    $('#mobile-count').textContent = r.count ? `${r.count} camp${r.count > 1 ? 's' : ''}` : 'No camps yet';
    els.mobileBar.dataset.has = r.count ? '1' : '0';
    updateMobileBar();
  }

  let summaryVisible = false;
  function updateMobileBar() {
    const show = els.mobileBar.dataset.has === '1' && !summaryVisible && !els.success.dataset.shown;
    els.mobileBar.classList.toggle('translate-y-full', !show);
    els.mobileBar.setAttribute('aria-hidden', String(!show));
  }

  /* ---- validation ---- */
  function setErr(scope, key, msg) {
    const p = $(`[data-err="${key}"]`, scope);
    if (!p) return;
    p.textContent = msg || '';
    p.classList.toggle('show', !!msg);
    const input = $(`[data-field="${key}"], [data-pf="${key}"]`, scope);
    if (input) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
  }

  function validateChild(ch, card) {
    let firstBad = null;
    const bad = (key, msg) => { setErr(card, key, msg); firstBad = firstBad || $(`[data-field="${key}"]`, card) || $(`[data-err="${key}"]`, card); };

    setErr(card, 'name'); setErr(card, 'dob'); setErr(card, 'camps');

    const name = ch.name.trim();
    if (name.length < 3 || !/\s/.test(name)) bad('name', 'Please enter your child’s full name (first and last name).');

    if (!ch.dob) bad('dob', 'Please enter your child’s date of birth.');
    else if (!validDob(ch.dob)) bad('dob', 'That date doesn’t look right. Please check it.');
    else {
      const first = SCHEDULE[city()].weeks[0];
      const anyFit = SCHEDULE[city()].weeks.some((w) => w.options.some((o) => eligible(o, w, ch.dob)));
      if (!anyFit) bad('dob', `This branch accepts ages ${ageRange(city()).text} (age on the first day of camp). Another branch may suit better.`);
      void first;
    }

    if (!Object.keys(ch.picks).length) bad('camps', 'Choose at least one camp week for this child.');
    return firstBad;
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function cleanPhone(v) { return v.replace(/[\s\-().]/g, ''); }

  function validateAll() {
    let first = null;
    const note = (el) => { first = first || el; };

    if (!branch()) { setErr(document, 'branch', 'Please choose a branch first.'); note(els.branchGrid); } else setErr(document, 'branch');

    state.children.forEach((ch) => {
      const card = $(`[data-child="${ch.id}"]`, els.children);
      if (card) note(validateChild(ch, card));
    });

    const f = els.form;
    const pn = f.pname.value.trim(), pe = f.pemail.value.trim(), pp = cleanPhone(f.pphone.value);
    setErr(f, 'pname', pn.length < 3 || !/\s/.test(pn) ? 'Please enter your full name.' : '');
    setErr(f, 'pemail', EMAIL_RE.test(pe) ? '' : 'Please enter a valid email address.');
    setErr(f, 'pphone', /^\+?\d{8,15}$/.test(pp) ? '' : 'Please enter a valid phone number, e.g. +971 50 123 4567.');
    setErr(f, 'consent', f.consent.checked ? '' : 'Please confirm to continue.');
    ['pname', 'pemail', 'pphone', 'consent'].forEach((k) => {
      if ($(`[data-err="${k}"]`, f).classList.contains('show')) note($(`[data-pf="${k}"]`, f));
    });
    if (!calc().count && state.children.length && !first) note(els.children);
    return first;
  }

  /* ---- submit ---- */
  function uuid() {
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function buildPayload() {
    const r = calc(), b = branch(), f = els.form;
    return {
      submissionId: state.submissionId || (state.submissionId = uuid()),
      submittedAt: new Date().toISOString(),
      branch: { id: b.id, name: b.name, city: b.city },
      parent: { name: f.pname.value.trim(), email: f.pemail.value.trim(), phone: cleanPhone(f.pphone.value) },
      children: state.children.map((ch) => ({
        name: ch.name.trim(),
        dob: ch.dob,
        camps: r.lines.filter((l) => l.child === ch).map((l) => ({
          weekId: l.week.id, optionId: l.opt.id, week: l.week.n, dates: l.week.dates,
          camp: l.camp.name, group: l.opt.group, price: l.price,
          ageAtStart: ageOn(ch.dob, l.week.start),
        })),
      })),
      totals: { before: r.before, discountPct: Math.round(r.pct * 100), discount: r.discount, total: r.total, currency: 'AED' },
      consent: true,
      hp: f.website.value, // honeypot – real users leave it empty
      source: location.href,
    };
  }

  async function send(payload) {
    if (!CONFIG.endpoint) {
      await new Promise((r) => setTimeout(r, 900));
      console.info('[Preview mode] Registration that would be sent:', payload);
      return { ok: true, reference: 'PREVIEW', preview: true };
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CONFIG.requestTimeoutMs);
    try {
      // text/plain keeps this a "simple" request (no CORS pre-flight) – Apps Script reads the raw body.
      const res = await fetch(CONFIG.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload), signal: ctrl.signal, redirect: 'follow',
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'The server rejected the registration.');
      return data;
    } finally { clearTimeout(timer); }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (state.submitting) return;
    const bad = validateAll();
    if (bad) {
      bad.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      if (typeof bad.focus === 'function' && bad.matches('input,button,select,textarea')) setTimeout(() => bad.focus({ preventScroll: true }), 300);
      return;
    }
    state.submitting = true;
    const btn = $('#submit-btn');
    btn.disabled = true; btn.dataset.loading = '1';
    $('#form-error').classList.add('hidden');
    const payload = buildPayload();
    try {
      const result = await send(payload);
      showSuccess(payload, result);
    } catch (err) {
      console.error(err);
      const box = $('#form-error');
      box.textContent = err.name === 'AbortError'
        ? 'The connection timed out. Please check your internet and press Submit again. Your details are still here.'
        : 'We couldn’t send your registration. Please check your connection and try again. Your details are still here.';
      box.classList.remove('hidden');
    } finally {
      state.submitting = false; btn.disabled = false; delete btn.dataset.loading;
    }
  }

  function showSuccess(p, result) {
    els.form.hidden = true;
    els.success.dataset.shown = '1';
    els.success.hidden = false;
    $('#ok-name').textContent = p.parent.name.split(' ')[0];
    $('#ok-ref').textContent = result.reference || '';
    $('#ok-ref-wrap').hidden = !result.reference || !!result.preview;
    $('#ok-preview').hidden = !result.preview;
    $('#ok-contact').textContent = `${p.parent.email} / ${p.parent.phone}`;
    $('#ok-recap').innerHTML = p.children.map((c) => `
      <li class="py-3">
        <p class="font-display font-extrabold text-navy">${esc(c.name)}</p>
        <ul class="mt-1 space-y-0.5 text-sm text-navy/75">${c.camps.map((k) => `<li>Week ${k.week} · ${esc(k.camp)} · ${esc(k.dates)}</li>`).join('')}</ul>
      </li>`).join('');
    $('#ok-total').textContent = aed(p.totals.total);
    updateMobileBar();
    els.success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function resetAll() {
    state.branchId = null; state.children = []; state.submissionId = null; state.seq = 0;
    els.form.reset();
    els.success.hidden = true; delete els.success.dataset.shown;
    els.form.hidden = false;
    els.steps2.hidden = true;
    renderBranches();
    setErr(document, 'branch');
    renderSummary();
    $('#register').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  /* ---- toast (small, polite) ---- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('opacity-0', 'translate-y-3');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('opacity-0', 'translate-y-3'), 3800);
  }

  /* ---- wire up ---- */
  function chooseBranch(id) {
    const next = BRANCHES.find((b) => b.id === id);
    const prevCity = city();
    const hasPicks = state.children.some((c) => Object.keys(c.picks).length);
    state.branchId = id;
    setErr(document, 'branch');
    if (prevCity && prevCity !== next.city) {
      state.children.forEach((c) => { c.picks = {}; });
      if (hasPicks) toast('Sharjah and Dubai have different dates, so your camp choices were cleared.');
    }
    if (!state.children.length) state.children.push(newChild());
    const firstReveal = els.steps2.hidden;
    els.steps2.hidden = false;
    renderChildren();
    if (firstReveal) setTimeout(() => els.steps2.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }), 60);
  }

  function init() {
    els.form = $('#regForm'); els.branchGrid = $('#branch-grid'); els.children = $('#children');
    els.addChild = $('#add-child'); els.steps2 = $('#steps-2'); els.summaryBody = $('#summary-body');
    els.success = $('#success'); els.mobileBar = $('#mobile-bar');

    renderCampCards(); renderScheduleTabs(); renderOfferCards();
    renderBranches(); renderSummary();

    els.branchGrid.addEventListener('change', (e) => { if (e.target.name === 'branch') chooseBranch(e.target.value); });

    els.addChild.addEventListener('click', () => {
      if (state.children.length >= CONFIG.maxChildren) return;
      const ch = newChild();
      state.children.push(ch);
      renderChildren(ch.id);
    });

    // children – delegated events
    els.children.addEventListener('input', (e) => {
      const card = e.target.closest('[data-child]'); if (!card) return;
      const ch = state.children.find((c) => c.id === +card.dataset.child);
      const f = e.target.dataset.field;
      if (f === 'name') { ch.name = e.target.value; if (e.target.value.trim()) setErr(card, 'name'); renderSummary(); }
    });
    els.children.addEventListener('change', (e) => {
      const card = e.target.closest('[data-child]'); if (!card) return;
      const ch = state.children.find((c) => c.id === +card.dataset.child);
      if (e.target.dataset.field === 'dob') {
        ch.dob = e.target.value;
        setErr(card, 'dob');
        if (ch.dob && !validDob(ch.dob)) { setErr(card, 'dob', 'That date doesn’t look right. Please check it.'); }
        // drop any pick the child is now too young / old for
        let dropped = 0;
        SCHEDULE[city()].weeks.forEach((w) => {
          const o = w.options.find((x) => x.id === ch.picks[w.id]);
          if (o && !eligible(o, w, ch.dob)) { delete ch.picks[w.id]; dropped++; }
        });
        if (dropped) toast(`Some camps were removed because they don’t match ${ch.name.trim().split(' ')[0] || 'your child'}’s age.`);
        refreshCamps(ch);
      }
    });
    els.children.addEventListener('click', (e) => {
      const card = e.target.closest('[data-child]'); if (!card) return;
      const idx = state.children.findIndex((c) => c.id === +card.dataset.child);
      const ch = state.children[idx];

      const pick = e.target.closest('[data-pick]');
      if (pick && !pick.disabled) {
        const [wk, op] = pick.dataset.pick.split(':');
        if (ch.picks[wk] === op) delete ch.picks[wk]; else ch.picks[wk] = op;
        setErr(card, 'camps');
        refreshCamps(ch);
        return;
      }
      if (e.target.closest('[data-remove]')) {
        state.children.splice(idx, 1);
        renderChildren();
        return;
      }
      if (e.target.closest('[data-copy]')) {
        const src = state.children[idx - 1];
        ch.picks = {};
        SCHEDULE[city()].weeks.forEach((w) => {
          const o = w.options.find((x) => x.id === src.picks[w.id]);
          if (o && eligible(o, w, ch.dob)) ch.picks[w.id] = o.id;
        });
        setErr(card, 'camps');
        refreshCamps(ch);
      }
    });

    // parent fields: clear errors as they type
    $$('[data-pf]', els.form).forEach((inp) => inp.addEventListener('input', () => setErr(els.form, inp.dataset.pf)));
    els.form.addEventListener('submit', onSubmit);
    $('#again-btn').addEventListener('click', resetAll);
    $('#mobile-review').addEventListener('click', () => $('#summary').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }));

    // mobile total bar hides when the real summary is on screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { summaryVisible = en.isIntersecting; updateMobileBar(); }, { threshold: 0.2 }).observe($('#summary'));
    }

    // scroll reveal
    document.documentElement.classList.add('js');
    if ('IntersectionObserver' in window && !reduceMotion) {
      const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0.12 });
      $$('.reveal').forEach((el) => io.observe(el));
    } else $$('.reveal').forEach((el) => el.classList.add('in'));

    // header shadow on scroll
    const hdr = $('#site-header');
    const onScroll = () => hdr.classList.toggle('shadow-lg', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
