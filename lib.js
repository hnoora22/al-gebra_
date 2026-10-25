/* Data layer: accounts, plans/limits, progress, goals, exam season, reports, reminders, tutor.
   Everything is stored in localStorage so the site works with no server.
   See README.md for how to swap this for a real backend. */
(function () {
  const AP = window.AP;
  const KEY = 'algebrapath.v1';
  const DAY = 864e5;
  AP.config = Object.assign({ APP_NAME: 'Al-Gebra', TRIAL_DAYS: 7, AI_PROXY_URL: '' }, window.AP_CONFIG || {});

  // ---------- storage ----------
  const fresh = () => ({ accounts: {}, session: null, sim: { dayOffset: 0, forceExam: false } });
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { db = fresh(); }
  if (!db.sim) db.sim = { dayOffset: 0, forceExam: false };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* private mode */ } };
  AP.save = save;
  AP.db = () => db;
  AP.resetAll = () => { db = fresh(); save(); };

  // ---------- time (supports presenter "simulate" controls) ----------
  AP.nowMs = () => Date.now() + db.sim.dayOffset * DAY;
  const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  AP.today = () => ymd(new Date(AP.nowMs()));
  AP.dateAgo = (n) => ymd(new Date(AP.nowMs() - n * DAY));
  AP.sim = () => db.sim;

  // ---------- accounts ----------
  async function hash(s) {
    try { if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ap:' + s)); return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join(''); } } catch (e) { /* fall through */ }
    let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return 'x' + h;
  }
  const uid = () => Math.random().toString(36).slice(2, 9);

  AP.newChild = function (name, grade) {
    return { id: uid(), name, grade, createdAt: AP.nowMs(), placement: null, style: null, goals: { lessons: 1, practice: 5, remind: false, time: '16:00' }, days: {}, done: {}, topics: {} };
  };

  AP.signup = async function ({ parentName, email, password, childName, grade }) {
    email = email.trim().toLowerCase();
    if (db.accounts[email]) throw new Error('An account with that email already exists. Try signing in.');
    const child = AP.newChild(childName.trim(), grade);
    db.accounts[email] = { email, parentName: parentName.trim(), pw: await hash(password), createdAt: AP.nowMs(), trialStart: AP.nowMs(), plan: 'trial', billing: null, children: [child], activeChild: child.id, exams: [], weeklyEmail: true };
    db.session = email; save();
    return child;
  };
  AP.login = async function (email, password) {
    email = email.trim().toLowerCase();
    const a = db.accounts[email];
    if (!a || a.pw !== (await hash(password))) throw new Error('Email or password is not right.');
    db.session = email; save();
  };
  AP.logout = () => { db.session = null; save(); };
  AP.acct = () => (db.session ? db.accounts[db.session] : null);
  AP.child = () => { const a = AP.acct(); return a ? a.children.find((c) => c.id === a.activeChild) || a.children[0] : null; };
  AP.setActiveChild = (id) => { AP.acct().activeChild = id; save(); };

  // ---------- plans and entitlements ----------
  AP.PLANS = {
    basic: { name: 'Basic', monthly: 0, yearly: 0 },
    premium: { name: 'Premium', monthly: 12.99, yearly: 89.99 },
    family: { name: 'Family', monthly: 15.99, yearly: 114.99 },
  };
  AP.tier = function (a) {
    a = a || AP.acct();
    if (a.plan === 'premium' || a.plan === 'family') return a.plan;
    if (a.plan === 'trial' && AP.nowMs() < a.trialStart + AP.config.TRIAL_DAYS * DAY) return 'trial';
    return 'basic';
  };
  AP.trialDaysLeft = (a) => { a = a || AP.acct(); return Math.max(0, Math.ceil((a.trialStart + AP.config.TRIAL_DAYS * DAY - AP.nowMs()) / DAY)); };
  AP.ent = function (a) {
    const t = AP.tier(a), basic = t === 'basic';
    return { tier: t, label: t === 'trial' ? 'Free trial' : AP.PLANS[t].name, lessonsPerDay: basic ? 1 : Infinity, worksheetsPerDay: basic ? 2 : Infinity, print: !basic, ai: !basic, maxChildren: t === 'family' || t === 'trial' ? 4 : 1 };
  };
  AP.upgrade = function (plan, cycle) { const a = AP.acct(); a.plan = plan; a.billing = { plan, cycle, since: AP.nowMs(), demo: true }; save(); };
  AP.downgrade = function () { const a = AP.acct(); a.plan = 'basic'; a.billing = null; if (a.children.length > 1) a.children = a.children.slice(0, 1), a.activeChild = a.children[0].id; save(); };

  AP.addChild = function (name, grade) {
    const a = AP.acct();
    if (a.children.length >= AP.ent(a).maxChildren) throw new Error('limit');
    const c = AP.newChild(name.trim(), grade); a.children.push(c); a.activeChild = c.id; save(); return c;
  };
  AP.removeChild = function (id) { const a = AP.acct(); if (a.children.length < 2) return; a.children = a.children.filter((c) => c.id !== id); a.activeChild = a.children[0].id; save(); };

  // ---------- daily records ----------
  AP.dayRec = function (child, date) {
    child = child || AP.child(); date = date || AP.today();
    if (!child.days[date]) child.days[date] = { started: [], done: [], answered: 0, correct: 0, worksheets: 0, exam: 0 };
    return child.days[date];
  };
  AP.canStartLesson = function (id) {
    const d = AP.dayRec(), lim = AP.ent().lessonsPerDay;
    if (d.started.includes(id)) return { ok: true };
    if (d.started.length < lim) return { ok: true };
    return { ok: false, used: d.started.length, limit: lim };
  };
  AP.startLesson = function (id) { const d = AP.dayRec(); if (!d.started.includes(id)) d.started.push(id); save(); };
  AP.recordAnswer = function (lessonId, ok) {
    const d = AP.dayRec(), c = AP.child();
    d.answered++; if (ok) d.correct++;
    const t = c.topics[lessonId] || (c.topics[lessonId] = { c: 0, t: 0 }); t.t++; if (ok) t.c++;
    save();
  };
  AP.completeLesson = function (id, score, total) {
    const c = AP.child(), d = AP.dayRec();
    if (score / total >= 0.6) { const prev = c.done[id]; c.done[id] = { best: Math.max(score / total, prev ? prev.best : 0), last: AP.today() }; if (!d.done.includes(id)) d.done.push(id); }
    save();
  };
  AP.worksheetsLeft = function () { const lim = AP.ent().worksheetsPerDay; return lim === Infinity ? Infinity : Math.max(0, lim - AP.dayRec().worksheets); };
  AP.countWorksheet = function () { AP.dayRec().worksheets++; save(); };

  // ---------- goals and streaks ----------
  AP.goalProgress = function (child) {
    child = child || AP.child(); const d = AP.dayRec(child), g = child.goals, lim = AP.ent().lessonsPerDay;
    const lessonGoal = Math.min(g.lessons, lim === Infinity ? 99 : lim);
    return { lessonGoal, lessonsDone: d.done.length, practiceGoal: g.practice, practice: d.answered, met: d.done.length >= lessonGoal && d.answered >= g.practice };
  };
  AP.streak = function (child) {
    child = child || AP.child(); let n = 0, i = 0;
    const active = (k) => { const r = child.days[AP.dateAgo(k)]; return r && (r.answered > 0 || r.done.length > 0); };
    if (!active(0)) i = 1;
    while (active(i)) { n++; i++; }
    return n;
  };
  AP.nextLesson = function (child) {
    child = child || AP.child(); const start = (child.placement && child.placement.startUnit) || 1;
    return AP.LESSONS.find((l) => l.unit >= start && !child.done[l.id]) || AP.LESSONS.find((l) => !child.done[l.id]) || null;
  };

  // ---------- exam season (extra practice) ----------
  const WINDOWS = [['Fall midterms', '10-15', '11-08'], ['Fall finals', '12-01', '12-22'], ['Spring midterms', '03-01', '03-24'], ['Spring finals', '05-10', '06-12']];
  AP.examSeason = function () {
    const a = AP.acct(), t = AP.today(), md = t.slice(5);
    if (db.sim.forceExam) return { active: true, label: 'Midterm season', note: 'Demo mode' };
    const w = WINDOWS.find(([, s, e]) => md >= s && md <= e);
    if (w) return { active: true, label: w[0] };
    for (const ex of (a && a.exams) || []) { const left = Math.round((new Date(ex.date + 'T12:00:00') - new Date(t + 'T12:00:00')) / DAY); if (left >= 0 && left <= 14) return { active: true, label: ex.name + (left === 0 ? ' is today' : ' in ' + left + ' day' + (left === 1 ? '' : 's')) }; }
    return { active: false, label: '' };
  };
  AP.nextExamWindow = function () {
    const t = AP.today(), md = t.slice(5), y = +t.slice(0, 4);
    for (const [n, s] of WINDOWS) if (md < s) return n + ' (starts ' + s.replace('-', '/') + ')';
    return WINDOWS[0][0] + ' (starts ' + WINDOWS[0][1].replace('-', '/') + ' ' + (y + 1) + ')';
  };

  // ---------- problem picking ----------
  const weakness = (child, id) => { const t = child.topics[id]; return t && t.t >= 2 ? 1 - t.c / t.t : 0.4; };
  AP.pickLessons = function (child, n, scope) {
    const start = (child.placement && child.placement.startUnit) || 1, nl = AP.nextLesson(child);
    let pool = AP.LESSONS.filter((l) => child.done[l.id] || (nl && l.id === nl.id));
    if (scope === 'all') pool = AP.LESSONS.filter((l) => l.unit <= Math.max(start + 3, nl ? nl.unit : 12));
    if (pool.length < 3) pool = AP.LESSONS.filter((l) => l.unit >= start).slice(0, 5);
    const out = [];
    for (let i = 0; i < n; i++) {
      const w = pool.map((l) => 1 + 3 * weakness(child, l.id)), tot = w.reduce((a, b) => a + b, 0); let r = Math.random() * tot, k = 0;
      while (r > w[k] && k < pool.length - 1) { r -= w[k]; k++; }
      out.push(pool[k]);
    }
    return out;
  };
  AP.makeProblems = (lessons) => lessons.map((l) => Object.assign({ lessonId: l.id, lessonTitle: l.title }, l.gen()));

  // ---------- reports ----------
  AP.report = function (child, n) {
    n = n || 7; const days = [];
    for (let i = n - 1; i >= 0; i--) { const date = AP.dateAgo(i), r = child.days[date] || { answered: 0, correct: 0, done: [], worksheets: 0 }; days.push({ date, answered: r.answered, correct: r.correct, lessons: r.done.length, worksheets: r.worksheets, exam: r.exam || 0 }); }
    const tot = days.reduce((a, d) => ({ answered: a.answered + d.answered, correct: a.correct + d.correct, lessons: a.lessons + d.lessons, worksheets: a.worksheets + d.worksheets }), { answered: 0, correct: 0, lessons: 0, worksheets: 0 });
    const byUnit = AP.UNITS.map((u) => {
      const ls = AP.lessonsInUnit(u.id); let c = 0, t = 0; ls.forEach((l) => { const s = child.topics[l.id]; if (s) { c += s.c; t += s.t; } });
      return { unit: u, acc: t ? c / t : null, attempts: t, done: ls.filter((l) => child.done[l.id]).length, total: ls.length };
    });
    const weak = AP.LESSONS.map((l) => ({ lesson: l, s: child.topics[l.id] })).filter((x) => x.s && x.s.t >= 3 && x.s.c / x.s.t < 0.7).map((x) => ({ lesson: x.lesson, acc: x.s.c / x.s.t, attempts: x.s.t })).sort((a, b) => a.acc - b.acc).slice(0, 4);
    const strong = AP.LESSONS.map((l) => ({ lesson: l, s: child.topics[l.id] })).filter((x) => x.s && x.s.t >= 3 && x.s.c / x.s.t >= 0.85).map((x) => ({ lesson: x.lesson, acc: x.s.c / x.s.t })).slice(0, 4);
    return { days, tot, accuracy: tot.answered ? tot.correct / tot.answered : null, activeDays: days.filter((d) => d.answered || d.lessons).length, streak: AP.streak(child), byUnit, weak, strong, doneTotal: Object.keys(child.done).length };
  };
  AP.reportText = function (child) {
    const r = AP.report(child), p = (x) => (x == null ? 'n/a' : Math.round(x * 100) + '%');
    return [`${AP.config.APP_NAME} weekly report for ${child.name}`, '', `Active days: ${r.activeDays} of 7`, `Lessons completed: ${r.tot.lessons} (${r.doneTotal} overall)`, `Practice problems: ${r.tot.answered}`, `Accuracy: ${p(r.accuracy)}`, `Current streak: ${r.streak} day${r.streak === 1 ? '' : 's'}`, `Worksheets: ${r.tot.worksheets}`, '', r.weak.length ? 'Needs practice: ' + r.weak.map((w) => w.lesson.title + ' (' + p(w.acc) + ')').join('; ') : 'No weak spots flagged yet.', r.strong.length ? 'Doing well: ' + r.strong.map((w) => w.lesson.title).join('; ') : ''].join('\n');
  };

  AP.seedDemo = function (child) {
    const U = AP.util;
    child.placement = child.placement || { score: 5, total: 8, startUnit: 3, level: 'Equations and inequalities', misses: ['2.2'] };
    child.style = child.style || { primary: 'visual', secondary: 'hands', scores: { visual: 3, verbal: 1, hands: 2, logic: 0 } };
    for (let i = 9; i >= 1; i--) {
      if (U.R(0, 5) === 0) continue; const date = AP.dateAgo(i), r = AP.dayRec(child, date), nl = AP.LESSONS.filter((l) => l.unit <= 5);
      const n = U.R(5, 16); r.answered = n; r.correct = Math.round(n * (0.6 + Math.random() * 0.35));
      if (U.R(0, 2)) { const l = nl[Math.min(nl.length - 1, 9 - i + U.R(0, 1))]; r.done = [l.id]; r.started = [l.id]; child.done[l.id] = { best: 0.8, last: date }; }
      if (U.R(0, 2) === 0) r.worksheets = U.R(1, 2);
    }
    AP.LESSONS.filter((l) => l.unit <= 5).forEach((l) => { const t = U.R(4, 10); child.topics[l.id] = { t, c: Math.round(t * (l.id === '2.2' || l.id === '3.1' ? 0.5 : 0.8 + Math.random() * 0.15)) }; });
    save();
  };

  // ---------- reminders ----------
  let lastFired = '';
  AP.startReminders = function () {
    if (AP._rem) return;
    AP._rem = setInterval(() => {
      const a = AP.acct(); if (!a) return;
      a.children.forEach((c) => {
        const g = c.goals; if (!g.remind) return;
        const now = new Date(AP.nowMs()), hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'), key = c.id + AP.today() + hhmm;
        if (hhmm !== g.time || lastFired === key || AP.goalProgress(c).met) return; lastFired = key;
        const msg = `Time for ${c.name}'s daily goals: ${g.lessons} lesson${g.lessons > 1 ? 's' : ''} and ${g.practice} practice problems.`;
        if ('Notification' in window && Notification.permission === 'granted') new Notification(AP.config.APP_NAME, { body: msg });
        window.dispatchEvent(new CustomEvent('ap:toast', { detail: msg }));
      });
    }, 20000);
  };

  // ---------- personalised tutor ----------
  const STYLE_LEAD = {
    visual: (l) => `Picture it: ${l.visual}`,
    verbal: (l) => `In plain words: ${l.idea}`,
    hands: (l) => `Try this as you read: ${l.example[0]}. Work the first step yourself before reading on.`,
    logic: (l) => `Rule: ${l.idea}`,
  };
  AP.findLesson = function (text) {
    const t = text.toLowerCase(); let best = null, score = 0;
    AP.LESSONS.forEach((l) => { const words = (l.title + ' ' + l.idea).toLowerCase().match(/[a-z]{4,}/g) || []; let s = 0; new Set(words).forEach((w) => { if (t.includes(w)) s += l.title.toLowerCase().includes(w) ? 3 : 1; }); if (s > score) { score = s; best = l; } });
    return score >= 2 ? best : null;
  };
  AP.tutorReply = async function (msg, ctx) {
    const child = AP.child(), style = (child.style && child.style.primary) || 'logic';
    if (AP.config.AI_PROXY_URL) {
      try {
        const r = await fetch(AP.config.AI_PROXY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: ctx.history, profile: { name: child.name, grade: child.grade, style, level: child.placement && child.placement.level }, lesson: ctx.lessonId || null }) });
        if (r.ok) { const j = await r.json(); if (j.reply) return j.reply; }
      } catch (e) { /* fall back to built-in tutor */ }
    }
    const l = AP.findLesson(msg) || (ctx.lessonId && AP.lessonById(ctx.lessonId)) || AP.nextLesson(child);
    if (/^(hi|hello|hey)\b/i.test(msg.trim())) return `Hi ${child.name}! Ask me about any algebra topic, like "how do I solve two-step equations?" or "I don't get slope". I explain things the way ${(AP.STYLE_INFO[style] || {}).name ? 'a ' + AP.STYLE_INFO[style].name.toLowerCase() : 'you'} learns best.`;
    if (!l) return 'Tell me which topic is tricky (for example "slope", "factoring" or "inequalities") and I will walk you through it.';
    if (/hint|stuck|help me solve/i.test(msg)) return `Here is a hint for "${l.title}": ${l.tip} Try the first step and tell me what you get.`;
    const steps = l.example.map((s, i) => (style === 'logic' ? `${i + 1}. ` : '• ') + s).join('\n');
    return `${STYLE_LEAD[style](l)}\n\nWorked example:\n${steps}\n\nTip: ${l.tip}\n\nWant to try some practice on "${l.title}"? Open Lessons and pick lesson ${l.id}.`;
  };
})();
