/**
 * Logiscool UAE – Winter Camps 2026/27 (Dubai Customs) · registration backend
 * ---------------------------------------------------------------------------
 * What it does
 *   1. setup()  – run ONCE. Creates a Google Form + the Google Sheet that stores its
 *                 responses, plus a "Camp Roster" tab (one row per child per camp week).
 *   2. doPost() – the landing page POSTs each registration here. It validates the data,
 *                 recomputes the price on the server, stores a Form response, adds roster
 *                 rows, and emails the Logiscool team (and the parent, if enabled).
 *
 * Deploy: see README.md  (Deploy > New deployment > Web app > Execute as: Me,
 *         Who has access: Anyone). Paste the resulting /exec URL into app.js (CONFIG.endpoint).
 */

/* ============================ EDIT THESE ============================ */
const CONFIG = {
  TEAM_EMAILS: ['REPLACE-ME@logiscool.com'],      // who gets a notification for every registration
  SEND_PARENT_CONFIRMATION: true,                  // email the parent a copy of what they booked
  SENDER_NAME: 'Logiscool UAE',
  FORM_TITLE: 'Logiscool Winter Camps 2026 – Dubai Customs registrations',
  TIMEZONE: 'Asia/Dubai',
  REF_PREFIX: 'LC-WC26-',
};

// Dubai Customs employee offer – per child, per camp week. Keep in sync with app.js.
const PRICING = {
  dubai:   { list: 1100, discount: 0.30 },
  sharjah: { list: 680,  discount: 0.20 },
};

const BRANCHES = {
  cityland: { name: 'Cityland Mall',        city: 'dubai'   },
  oasis:    { name: 'Oasis Mall',           city: 'dubai'   },
  mirdif:   { name: 'Mirdif Sport Society', city: 'dubai'   },
  sharjah:  { name: 'Sharjah Central Mall', city: 'sharjah' },
};

// Same ids as app.js. The server looks camp names up here, so a tampered request can't invent a camp.
const CATALOG = {
  dubai: {
    w1: { n: 1, dates: '14–18 Dec 2026', options: { 'w1-a': ['Roblox Game Design', 'Ages 6–9'],      'w1-b': ['Roblox Multiverse', 'Ages 10+'] } },
    w2: { n: 2, dates: '21–25 Dec 2026', options: { 'w2-a': ['Minecraft Design', 'Ages 6–9'],       'w2-b': ['Minecraft Maze Master', 'Ages 10+'] } },
    w3: { n: 3, dates: '28–31 Dec 2026', options: { 'w3-a': ['AI Creator Lab', 'Ages 6–9'],         'w3-b': ['AI Creator Lab', 'Ages 10+'] } },
  },
  sharjah: {
    w1: { n: 1, dates: '13–17 Dec 2026', options: { 'w1-s': ['Roblox Game Design', 'Ages 9–14'] } },
    w2: { n: 2, dates: '20–24 Dec 2026', options: { 'w2-s': ['Minecraft Maze Master', 'Ages 9–14'] } },
    w3: { n: 3, dates: '27–31 Dec 2026', options: { 'w3-s': ['AI Creator Lab', 'Ages 9–14'] } },
  },
};

const MAX_CHILDREN = 8;
const ROSTER_SHEET = 'Camp Roster';
const ROSTER_HEADERS = [
  'Reference', 'Submitted (Dubai time)', 'Branch', 'Parent name', 'Parent email', 'Parent phone',
  'Child name', 'Date of birth', 'Week', 'Dates', 'Camp', 'Group', 'Price before discount (AED)', 'Status', 'Notes',
];

/* ============================ ONE-TIME SETUP ============================ */

/** Run this once from the Apps Script editor (Run > setup). Check the Execution log for the links. */
function setup() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('FORM_ID')) {
    Logger.log('Already set up.\nForm: %s\nSheet: %s',
      FormApp.openById(props.getProperty('FORM_ID')).getEditUrl(),
      SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getUrl());
    return;
  }

  const form = FormApp.create(CONFIG.FORM_TITLE);
  form.setDescription('Registrations are submitted automatically from the Logiscool Winter Camps landing page. ' +
    'Please do not fill this form in by hand.');
  form.setConfirmationMessage('Registration received.');
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);

  ['Reference', 'Branch', 'Parent full name', 'Parent email', 'Parent phone', 'Number of children']
    .forEach(function (t) { form.addTextItem().setTitle(t); });
  form.addParagraphTextItem().setTitle('Children and camps');
  ['Total before discount (AED)', 'Discount', 'Total payable (AED)']
    .forEach(function (t) { form.addTextItem().setTitle(t); });

  const ss = SpreadsheetApp.create(CONFIG.FORM_TITLE + ' (responses)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  const roster = ss.insertSheet(ROSTER_SHEET);
  roster.appendRow(ROSTER_HEADERS);
  roster.setFrozenRows(1);
  roster.getRange(1, 1, 1, ROSTER_HEADERS.length)
    .setFontWeight('bold').setBackground('#00426A').setFontColor('#FFFFFF');
  roster.setColumnWidths(1, ROSTER_HEADERS.length, 150);
  roster.getRange('H:H').setNumberFormat('@'); // keep DOB as plain text

  props.setProperties({ FORM_ID: form.getId(), SHEET_ID: ss.getId(), REF_COUNTER: '0' });

  Logger.log('Setup complete.\nForm (edit): %s\nSheet: %s\nNext: Deploy > New deployment > Web app.', form.getEditUrl(), ss.getUrl());
}

/* ============================ WEB APP ============================ */

/** Health check: open the /exec URL in a browser – you should see {"ok":true,...}. */
function doGet() {
  return json_({ ok: true, service: 'Logiscool Winter Camps registration', configured: !!PropertiesService.getScriptProperties().getProperty('FORM_ID') });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);

    const raw = e && e.postData && e.postData.contents;
    if (!raw) throw new Error('Empty request.');
    const data = JSON.parse(raw);

    if (data.hp) return json_({ ok: true, reference: 'OK' });          // honeypot hit: pretend success, store nothing

    const reg = validate_(data);                                        // throws a friendly Error if invalid
    const props = PropertiesService.getScriptProperties();
    if (!props.getProperty('FORM_ID')) throw new Error('Backend not set up. Run setup() first.');

    // Idempotency: if the browser retried the same submission, return the same reference.
    const cache = CacheService.getScriptCache();
    const seen = cache.get('sub:' + reg.submissionId);
    if (seen) return json_({ ok: true, reference: seen, duplicate: true });

    const counter = Number(props.getProperty('REF_COUNTER') || 0) + 1;
    props.setProperty('REF_COUNTER', String(counter));
    const ref = CONFIG.REF_PREFIX + ('0000' + counter).slice(-4);
    const stamp = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

    storeFormResponse_(props, reg, ref);
    storeRoster_(props, reg, ref, stamp);
    cache.put('sub:' + reg.submissionId, ref, 6 * 60 * 60);

    // Emails are best-effort: a mail failure must never lose or reject a saved registration.
    try { notifyTeam_(reg, ref, stamp); } catch (err) { console.error('Team email failed: ' + err); }
    if (CONFIG.SEND_PARENT_CONFIRMATION) {
      try { confirmParent_(reg, ref); } catch (err) { console.error('Parent email failed: ' + err); }
    }

    return json_({ ok: true, reference: ref });
  } catch (err) {
    console.error(err && err.stack || err);
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) { /* not held */ }
  }
}

/* ============================ VALIDATION ============================ */

function validate_(d) {
  const clean = function (s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max || 200); };
  // Spreadsheet formula-injection guard: a leading = + - @ would be executed as a formula.
  const safe = function (s) { return /^[=+\-@]/.test(s) ? "'" + s : s; };

  const b = BRANCHES[d.branch && d.branch.id];
  if (!b) throw new Error('Unknown branch.');
  const price = PRICING[b.city];
  const weeks = CATALOG[b.city];

  const parent = {
    name: clean(d.parent && d.parent.name, 80),
    email: clean(d.parent && d.parent.email, 120),
    phone: clean(d.parent && d.parent.phone, 24),
  };
  if (parent.name.length < 3) throw new Error('Parent name is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(parent.email)) throw new Error('A valid parent email is required.');
  if (!/^\+?\d{8,15}$/.test(parent.phone.replace(/[\s\-().]/g, ''))) throw new Error('A valid parent phone number is required.');
  if (d.consent !== true) throw new Error('Consent is required.');

  if (!Array.isArray(d.children) || d.children.length < 1 || d.children.length > MAX_CHILDREN) throw new Error('Please register between 1 and ' + MAX_CHILDREN + ' children.');

  const children = d.children.map(function (c) {
    const name = clean(c.name, 80);
    const dob = clean(c.dob, 10);
    if (name.length < 3) throw new Error('Child name is required.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || isNaN(new Date(dob).getTime())) throw new Error('A valid date of birth is required for ' + name + '.');
    if (!Array.isArray(c.camps) || !c.camps.length) throw new Error('Choose at least one camp for ' + name + '.');

    const usedWeeks = {};
    const camps = c.camps.map(function (k) {
      const wk = weeks[k.weekId];
      const opt = wk && wk.options[k.optionId];
      if (!opt) throw new Error('Unknown camp selection.');
      if (usedWeeks[k.weekId]) throw new Error(name + ' has two camps in the same week.');
      usedWeeks[k.weekId] = true;
      return { weekNo: wk.n, dates: wk.dates, camp: opt[0], group: opt[1], price: price.list };
    });
    return { name: safe(name), dob: dob, camps: camps };
  });

  const count = children.reduce(function (n, c) { return n + c.camps.length; }, 0);
  const before = count * price.list;
  const discount = Math.round(before * price.discount);   // recomputed here – the browser's numbers are ignored

  return {
    submissionId: clean(d.submissionId, 80) || Utilities.getUuid(),
    branchName: b.name, city: b.city,
    parent: { name: safe(parent.name), email: parent.email, phone: parent.phone },
    children: children,
    totals: { count: count, before: before, pct: Math.round(price.discount * 100), discount: discount, total: before - discount },
  };
}

/* ============================ STORAGE ============================ */

function storeFormResponse_(props, reg, ref) {
  const form = FormApp.openById(props.getProperty('FORM_ID'));
  const items = form.getItems();
  const summary = reg.children.map(function (c, i) {
    return (i + 1) + '. ' + c.name + ' (DOB ' + c.dob + ')\n' +
      c.camps.map(function (k) { return '   • Week ' + k.weekNo + ' · ' + k.camp + ' · ' + k.group + ' · ' + k.dates; }).join('\n');
  }).join('\n');

  const values = [
    ref, reg.branchName, reg.parent.name, reg.parent.email, reg.parent.phone, String(reg.children.length),
    summary, 'AED ' + reg.totals.before, '-AED ' + reg.totals.discount + ' (' + reg.totals.pct + '%)', 'AED ' + reg.totals.total,
  ];
  const response = form.createResponse();
  items.forEach(function (item, i) {
    const text = String(values[i]);
    if (item.getType() === FormApp.ItemType.PARAGRAPH_TEXT) response.withItemResponse(item.asParagraphTextItem().createResponse(text));
    else response.withItemResponse(item.asTextItem().createResponse(text));
  });
  response.submit();
}

function storeRoster_(props, reg, ref, stamp) {
  const sheet = SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getSheetByName(ROSTER_SHEET);
  const rows = [];
  reg.children.forEach(function (c) {
    c.camps.forEach(function (k) {
      rows.push([ref, stamp, reg.branchName, reg.parent.name, reg.parent.email, reg.parent.phone,
        c.name, c.dob, 'Week ' + k.weekNo, k.dates, k.camp, k.group, k.price, 'New', '']);
    });
  });
  const start = sheet.getLastRow() + 1;
  sheet.getRange(start, 8, rows.length, 1).setNumberFormat('@');
  sheet.getRange(start, 1, rows.length, ROSTER_HEADERS.length).setValues(rows);
}

/* ============================ EMAIL ============================ */

function esc_(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

function summaryHtml_(reg) {
  const rows = reg.children.map(function (c) {
    return '<tr><td colspan="2" style="padding:10px 0 2px;font-weight:700;color:#00426A">' + esc_(c.name) +
      ' <span style="font-weight:400;color:#667">(born ' + esc_(c.dob) + ')</span></td></tr>' +
      c.camps.map(function (k) {
        return '<tr><td style="padding:2px 0;color:#334">Week ' + k.weekNo + ' · ' + esc_(k.camp) + ' · ' + esc_(k.group) + ' · ' + esc_(k.dates) + '</td>' +
          '<td style="padding:2px 0;text-align:right">AED ' + k.price + '</td></tr>';
      }).join('');
  }).join('');
  return '<table style="width:100%;border-collapse:collapse;font-size:14px">' + rows +
    '<tr><td style="padding-top:12px;border-top:1px solid #dde">Total before discount</td><td style="padding-top:12px;border-top:1px solid #dde;text-align:right">AED ' + reg.totals.before + '</td></tr>' +
    '<tr><td style="color:#7a8a00">Dubai Customs discount (' + reg.totals.pct + '%)</td><td style="text-align:right;color:#7a8a00">− AED ' + reg.totals.discount + '</td></tr>' +
    '<tr><td style="padding-top:6px;font-weight:700">Total</td><td style="padding-top:6px;text-align:right;font-weight:700">AED ' + reg.totals.total + '</td></tr></table>';
}

function frame_(title, inner) {
  return '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #dde;border-radius:12px;overflow:hidden">' +
    '<div style="background:#00426A;color:#fff;padding:18px 22px;font-size:18px;font-weight:700">' + esc_(title) + '</div>' +
    '<div style="padding:20px 22px;color:#223">' + inner + '</div></div>';
}

function notifyTeam_(reg, ref, stamp) {
  const html = frame_('New winter camp registration · ' + ref,
    '<p style="margin:0 0 12px"><b>Branch:</b> ' + esc_(reg.branchName) + '<br><b>Parent:</b> ' + esc_(reg.parent.name) +
    '<br><b>Email:</b> ' + esc_(reg.parent.email) + '<br><b>Phone:</b> ' + esc_(reg.parent.phone) + '<br><b>Received:</b> ' + stamp + '</p>' + summaryHtml_(reg));
  MailApp.sendEmail({
    to: CONFIG.TEAM_EMAILS.join(','), replyTo: reg.parent.email, name: CONFIG.SENDER_NAME,
    subject: '[Winter Camps] ' + ref + ' · ' + reg.parent.name + ' · ' + reg.branchName + ' · AED ' + reg.totals.total,
    htmlBody: html,
  });
}

function confirmParent_(reg, ref) {
  const html = frame_('We received your registration',
    '<p>Dear ' + esc_(reg.parent.name) + ',</p><p>Thank you for registering for the Logiscool Winter Camps 2026/27 at <b>' + esc_(reg.branchName) +
    '</b>. Our team will contact you shortly to confirm your child’s place.</p><p>Your reference: <b>' + ref + '</b></p>' + summaryHtml_(reg) +
    '<p style="margin-top:18px;color:#667;font-size:12px">Logiscool · Create. Code. Enjoy.</p>');
  MailApp.sendEmail({
    to: reg.parent.email, replyTo: CONFIG.TEAM_EMAILS[0], name: CONFIG.SENDER_NAME,
    subject: 'Logiscool Winter Camps – registration received (' + ref + ')', htmlBody: html,
  });
}

/* ============================ UTIL / TEST ============================ */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Optional: run from the editor to push a fake registration through the whole pipeline. */
function testSubmission() {
  const fake = {
    submissionId: Utilities.getUuid(),
    branch: { id: 'cityland' },
    parent: { name: 'Test Parent', email: CONFIG.TEAM_EMAILS[0], phone: '+971501234567' },
    children: [
      { name: 'Test Child One', dob: '2016-05-04', camps: [{ weekId: 'w1', optionId: 'w1-a' }, { weekId: 'w2', optionId: 'w2-a' }] },
      { name: 'Test Child Two', dob: '2013-02-11', camps: [{ weekId: 'w1', optionId: 'w1-b' }] },
    ],
    consent: true, hp: '',
  };
  const out = doPost({ postData: { contents: JSON.stringify(fake) } });
  Logger.log(out.getContent());
}
