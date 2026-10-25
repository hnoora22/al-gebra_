/* Views and interaction. Hash router: #/ #/login #/signup #/onboarding #/app #/lessons #/lesson/ID
   #/practice #/exam #/worksheets #/tutor #/parent #/plans #/settings */
(function () {
  const AP = window.AP, U = AP.util, NAME = () => AP.config.APP_NAME;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = { cycle: 'monthly', run: null, pl: null, st: null, ws: null, chat: [], tryP: null, co: null, err: '' };
  const go = (h) => { if (location.hash === h) render(); else location.hash = h; };
  const money = (n) => (n === 0 ? 'Free' : '$' + n.toFixed(2).replace('.00', ''));
  const pct = (x) => (x == null ? 'n/a' : Math.round(x * 100) + '%');
  const wd = (d) => new Date(d + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' });
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const ring = (a, b) => { const p = b ? Math.min(100, Math.round((a / b) * 100)) : 0; return `<div class="ring ${p >= 100 ? 'ok' : ''}" style="--p:${p}"><span>${a}/${b}</span></div>`; };
  const brandHTML = () => `<img class="bm" src="img/emblem-white.png" alt=""><img class="wm" src="img/wordmark-white.png" alt="${esc(NAME())}">`;
  const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3800); };
  window.addEventListener('ap:toast', (e) => toast(e.detail));

  // =============== shared pieces ===============
  function navHTML(a, route) {
    if (!a) return `<div class="wrap"><a class="brand" href="#/">${brandHTML()}</a><div class="right"><a class="btn ghost sm" href="#/login">Sign in</a><a class="btn sm" href="#/signup">Start free trial</a></div></div>`;
    const links = [['app', 'Home'], ['lessons', 'Lessons'], ['practice', 'Practice'], ['worksheets', 'Worksheets'], ['exam', 'Exam review'], ['tutor', 'AI tutor'], ['parent', 'Parent']];
    const ent = AP.ent(), kids = a.children;
    return `<div class="wrap"><a class="brand" href="#/app">${brandHTML()}</a>
      <nav class="nav" aria-label="Main">${links.map(([r, t]) => `<a href="#/${r}" class="${route === r || (r === 'lessons' && route === 'lesson') ? 'on' : ''}">${t}</a>`).join('')}</nav>
      <div class="right">${kids.length > 1 ? `<select data-change="child" aria-label="Switch student">${kids.map((c) => `<option value="${c.id}" ${c.id === a.activeChild ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>` : `<span class="small mute">${esc(AP.child().name)}</span>`}
      <a href="#/plans" class="chip ${ent.tier === 'basic' ? 'gray' : 'ok'}" style="text-decoration:none">${esc(ent.label)}${ent.tier === 'trial' ? ' · ' + AP.trialDaysLeft() + 'd left' : ''}</a>
      <a href="#/settings" class="btn ghost sm">Settings</a></div></div>`;
  }
  function lockCard(title, body) {
    return `<div class="card center narrow"><div style="font-size:2.2rem">🔒</div><h2>${esc(title)}</h2><p class="mute">${body}</p><a class="btn" href="#/plans">See plans</a></div>`;
  }
  function probInput(p, fb) {
    if (p.type === 'mc') return `<div class="opts">${p.options.map((o, i) => { let cls = ''; if (fb) { if (o === p.answer) cls = 'right'; else if (o === fb.val) cls = 'wrong'; } return `<button type="button" class="opt ${cls}" data-act="pick" data-i="${i}" ${fb ? 'disabled' : ''}>${esc(o)}</button>`; }).join('')}</div>`;
    return `<form data-form="answer" class="ansrow"><input type="text" name="a" inputmode="text" autocomplete="off" autocapitalize="off" aria-label="Your answer" placeholder="Type your answer" ${fb ? 'disabled value="' + esc(fb.val) + '"' : 'autofocus'}><button class="btn" ${fb ? 'disabled' : ''}>Check</button></form>`;
  }

  // =============== quiz runner (lessons, practice, exam) ===============
  function startRun(kind, title, probs, extra) { S.run = Object.assign({ kind, title, probs, i: 0, score: 0, res: [], fb: null, done: false }, extra || {}); }
  function submitAnswer(val) {
    const r = S.run, p = r.probs[r.i]; if (!r || r.fb) return;
    const ok = AP.check(p, val); AP.recordAnswer(p.lessonId, ok); r.res[r.i] = ok; if (ok) r.score++; r.fb = { ok, val }; render();
  }
  function nextProblem() {
    const r = S.run; r.i++; r.fb = null;
    if (r.i >= r.probs.length) {
      r.done = true;
      if (r.kind === 'lesson') AP.completeLesson(r.lessonId, r.score, r.probs.length);
      if (r.kind === 'exam') { AP.dayRec().exam++; AP.save(); }
      const g = AP.goalProgress(); if (g.met && !r.metShown) { r.metShown = true; toast('🎉 Daily goals complete!'); }
    }
    render();
  }
  function runHTML() {
    const r = S.run, n = r.probs.length;
    if (r.done) {
      const pass = r.kind !== 'lesson' || r.score / n >= 0.6, nl = AP.nextLesson();
      return `<div class="card center"><div class="score">${r.score}/${n}</div><h2>${r.kind === 'lesson' ? (pass ? 'Lesson complete!' : 'Almost there') : r.score / n >= 0.8 ? 'Great work!' : 'Nice effort!'}</h2>
        <p class="mute">${r.kind === 'lesson' ? (pass ? 'You scored ' + pct(r.score / n) + '. Practice problems you got wrong will show up more often in daily practice.' : 'You need 3 out of 5 to complete a lesson. Review the lesson and try again.') : 'Questions you missed will show up again in future practice.'}</p>
        <div class="row" style="justify-content:center">${r.kind === 'lesson' ? `<button class="btn sec" data-act="retry">Try new problems</button>${pass && nl ? `<a class="btn" href="#/lesson/${nl.id}">Next: ${esc(nl.title)}</a>` : ''}` : `<button class="btn" data-act="again">Another set</button>`}<a class="btn ghost" href="#/app">Home</a></div></div>`;
    }
    const p = r.probs[r.i];
    return `<div class="card"><div class="row between"><h3 style="margin:0">${esc(r.title)}</h3><span class="chip">${r.i + 1} of ${n}</span></div>
      <div class="prog" aria-hidden="true">${r.probs.map((_, k) => `<i class="${k < r.i || (k === r.i && r.fb) ? (r.res[k] ? 'ok' : 'no') : k === r.i ? 'd' : ''}"></i>`).join('')}</div>
      ${r.kind !== 'lesson' ? `<p class="small mute" style="margin:0">Topic: ${esc(p.lessonTitle)}</p>` : ''}
      <div class="q">${esc(p.q)}</div>${probInput(p, r.fb)}
      ${r.fb ? `<div class="fb ${r.fb.ok ? 'ok' : 'bad'}" role="status"><b>${r.fb.ok ? 'Correct!' : 'Not quite.'}</b><p>${r.fb.ok ? '' : 'The answer is <b>' + esc(p.type === 'mc' ? p.answer : U.n2s(p.answer)) + '</b>. '}${esc(p.why)}</p></div><button class="btn" data-act="next" autofocus>${r.i + 1 === n ? 'See results' : 'Next'}</button>` : ''}</div>`;
  }

  // =============== views ===============
  const V = {};

  V[''] = function () {
    const plans = AP.PLANS, yr = S.cycle === 'yearly', a = AP.acct();
    const price = (k) => (yr ? `${money(plans[k].yearly)}<small>/year</small>` : `${money(plans[k].monthly)}<small>/month</small>`);
    return `<div class="wrap">
    <section class="hero"><div class="herologo"><img class="hl" src="img/logo-white.png" alt="${esc(NAME())}"></div>
      <h1>Smarter learning.<br>Simple solving.</h1><p class="sub">Algebra 1 &amp; 2, one small step a day</p>
      <p class="lead">Short lessons, endless practice and a tutor that teaches the way <i>you</i> learn. Parents get a simple weekly progress report.</p>
      <div class="cta">${a ? '<a class="btn lg" href="#/app">Go to my dashboard</a>' : '<a class="btn lg" href="#/signup">Start your 7-day free trial</a><a class="btn sec lg" href="#/login">Sign in</a>'}</div>
      <p class="small mute" style="margin-top:12px">No credit card needed to start. Free Basic plan after the trial.</p></section>

    <section class="block"><h2 class="center">How it works</h2><div class="grid g4">
      ${[['1', 'Quick check-in', 'A short placement quiz and learning-preference survey so you start at the right spot.'], ['2', 'Set your goals', 'Pick lessons and practice problems per day. Get reminders if you want them.'], ['3', 'Learn and practice', 'Bite-size lessons, then fresh problems with a worked solution for every answer.'], ['4', 'Parents stay in the loop', 'Weekly reports show progress, accuracy and what needs more practice.']].map(([n, t, d]) => `<div class="card flat"><span class="chip">${n}</span><h3 style="margin-top:8px">${t}</h3><p class="mute small" style="margin:0">${d}</p></div>`).join('')}</div></section>

    <section class="block"><h2 class="center">Everything in one place</h2><div class="grid g3">
      ${[['📚', 'Full Algebra 1 path', `${AP.UNITS.length} units and ${AP.LESSONS.length} lessons, from variables to quadratics and statistics. Algebra 2 is on the way.`], ['♾️', 'Endless practice', 'Every lesson makes new problems on demand, with step-by-step solutions.'], ['🎯', 'Daily goals', 'One lesson and five problems a day by default. Adjust it and turn on reminders.'], ['📅', 'Midterm and finals mode', 'Extra review sets unlock automatically during exam season, or before your own exam date.'], ['📊', 'Parent progress reports', 'Streaks, accuracy, weak spots and wins. Email or print the report.'], ['🧠', 'Personalized tutor', 'Premium lessons and the AI tutor adapt to how each student learns best.']].map(([i, t, d]) => `<div class="card feat"><div class="ic">${i}</div><div><h3>${t}</h3><p class="mute small" style="margin:0">${d}</p></div></div>`).join('')}</div></section>

    <section class="block" id="pricing"><h2 class="center">Simple pricing</h2><p class="center mute">Start with a 7-day free trial of every feature. Then keep Basic free forever, or upgrade.</p>
      <div class="center" style="margin-bottom:18px"><div class="toggle" role="group" aria-label="Billing period"><button data-act="cycle" data-v="monthly" class="${!yr ? 'on' : ''}">Monthly</button><button data-act="cycle" data-v="yearly" class="${yr ? 'on' : ''}">Yearly (save ~40%)</button></div></div>
      ${planCards(false)}
      <div class="card" style="margin-top:22px;overflow:auto"><table class="cmp"><thead><tr><th>Feature</th><th>Basic</th><th>Premium</th><th>Family</th></tr></thead><tbody>
      ${[['Lessons per day', '1', 'Unlimited', 'Unlimited'], ['Worksheets per day', '2', 'Unlimited', 'Unlimited'], ['Daily practice and goals', '✓', '✓', '✓'], ['Midterm and finals extra practice', '✓', '✓', '✓'], ['Parent progress reports', '✓', '✓', '✓'], ['Printable worksheets + answer keys', '–', '✓', '✓'], ['Personalized AI tutor and lessons', '–', '✓', '✓'], ['Student profiles', '1', '1', 'Up to 4']].map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>

    <section class="block narrow"><h2 class="center">Questions</h2>
      <details><summary>How does the free trial work?</summary><p class="mute">You get 7 days of every Premium and Family feature. When it ends you move to the free Basic plan automatically unless you choose a paid plan.</p></details>
      <details><summary>What does Basic include?</summary><p class="mute">One lesson a day, two worksheets a day, unlimited daily practice, exam-season review and weekly parent reports.</p></details>
      <details><summary>Does the quiz measure intelligence?</summary><p class="mute">No. It checks which algebra topics your student already knows so they start at the right place, and asks how they like to learn. It is not an IQ test.</p></details>
      <details><summary>Why the name Al-Gebra?</summary><p class="mute">The word algebra comes from the Arabic <i>al-jabr</i> (الجبر), from the title of a 9th-century book by the mathematician al-Khwarizmi. The name is a nod to where algebra began.</p></details>
      <details><summary>Can siblings share one account?</summary><p class="mute">Yes. The Family plan has separate profiles, goals and reports for up to four students.</p></details>
    </section></div>${foot()}`;
  };
  const foot = () => `<footer class="foot"><div class="wrap">© ${new Date().getFullYear()} ${esc(NAME())}. Smarter learning. Simple solving. Demo build: accounts and progress are stored in this browser.</div></footer>`;

  function planCards(inApp) {
    const plans = AP.PLANS, yr = S.cycle === 'yearly', cur = inApp ? AP.tier() : null, a = AP.acct();
    const price = (k) => (yr ? `${money(plans[k].yearly)}<small>/year</small>` : `${money(plans[k].monthly)}<small>/month</small>`);
    const btn = (k) => {
      if (!inApp) return `<a class="btn ${k === 'premium' ? '' : 'sec'}" href="#/signup">Start free trial</a>`;
      if (a.plan === k) return `<button class="btn ghost" disabled>Current plan</button>`;
      if (k === 'basic') return `<button class="btn ghost" data-act="downgrade">Switch to Basic</button>`;
      return `<button class="btn ${k === 'premium' ? '' : 'sec'}" data-act="checkout" data-plan="${k}">Choose ${plans[k].name}</button>`;
    };
    return `<div class="grid g3">
      <div class="card price"><h3>Basic</h3><div class="amt">Free</div><ul><li>1 lesson a day</li><li>2 worksheets a day</li><li>Daily practice and goals</li><li>Midterm and finals extra practice</li><li>Weekly parent progress reports</li><li class="no">Printable worksheets</li><li class="no">Personalized AI tutor</li></ul>${btn('basic')}</div>
      <div class="card price hot"><span class="chip">Most popular</span><h3 style="margin-top:6px">Premium</h3><div class="amt">${price('premium')}</div><ul><li>Everything in Basic</li><li>Unlimited lessons and worksheets</li><li>Printable worksheets with answer keys</li><li>Personalized AI tutor</li><li>Lessons shaped to your learning style</li><li class="no">One student profile</li></ul>${btn('premium')}</div>
      <div class="card price"><h3>Family</h3><div class="amt">${price('family')}</div><ul><li>Everything in Premium</li><li>Up to 4 student profiles</li><li>Separate goals and reports for each child</li><li>One parent dashboard</li></ul>${btn('family')}</div></div>`;
  }

  // ---------- auth ----------
  V.signup = function () {
    return `<div class="wrap"><div class="narrow card"><h2>Start your 7-day free trial</h2><p class="mute">Full access to every feature. No credit card needed.</p>
      ${S.err ? `<div class="fb bad" role="alert">${esc(S.err)}</div>` : ''}
      <form data-form="signup"><div class="field"><label for="pn">Your name (parent or guardian)</label><input id="pn" name="parentName" type="text" required autocomplete="name"></div>
      <div class="field"><label for="em">Email</label><input id="em" name="email" type="email" required autocomplete="email"></div>
      <div class="field"><label for="pw">Password (6+ characters)</label><input id="pw" name="password" type="password" minlength="6" required autocomplete="new-password"></div>
      <div class="row" style="align-items:flex-end;flex-wrap:nowrap"><div class="field" style="flex:2"><label for="cn">Student's first name</label><input id="cn" name="childName" type="text" required></div>
      <div class="field" style="flex:1"><label for="gr">Grade</label><select id="gr" name="grade" style="width:100%">${['6', '7', '8', '9', '10', '11', '12'].map((g) => `<option ${g === '8' ? 'selected' : ''}>${g}</option>`).join('')}</select></div></div>
      <button class="btn lg" style="width:100%">Create account</button></form>
      <p class="small mute center" style="margin-top:14px">Already have an account? <a href="#/login">Sign in</a></p></div></div>`;
  };
  V.login = function () {
    return `<div class="wrap"><div class="narrow card"><h2>Welcome back</h2>${S.err ? `<div class="fb bad" role="alert">${esc(S.err)}</div>` : ''}
      <form data-form="login"><div class="field"><label for="le">Email</label><input id="le" name="email" type="email" required autocomplete="email"></div>
      <div class="field"><label for="lp">Password</label><input id="lp" name="password" type="password" required autocomplete="current-password"></div>
      <button class="btn lg" style="width:100%">Sign in</button></form>
      <p class="small mute center" style="margin-top:14px">New here? <a href="#/signup">Start a free trial</a></p></div></div>`;
  };

  // ---------- onboarding: placement -> learning preferences -> goals ----------
  V.onboarding = function () {
    const c = AP.child();
    if (!c.placement) {
      if (!S.pl) S.pl = { i: 0, probs: AP.PLACEMENT.map((id) => Object.assign({ lessonId: id }, AP.lessonById(id).gen())), res: [] };
      const pl = S.pl, p = pl.probs[pl.i];
      return `<div class="wrap"><div class="narrow"><p class="small mute">Step 1 of 3 · Quick skills check for ${esc(c.name)}</p>
        <div class="card"><div class="row between"><h3 style="margin:0">Question ${pl.i + 1} of ${pl.probs.length}</h3><span class="chip gray">No grades, just finding your starting point</span></div>
        <div class="prog" aria-hidden="true">${pl.probs.map((_, k) => `<i class="${k < pl.i ? 'd' : k === pl.i ? 'd' : ''}" style="${k > pl.i ? '' : ''}"></i>`).join('')}</div>
        <div class="q">${esc(p.q)}</div>${probInput(p, null)}
        <p style="margin-top:16px"><button class="btn ghost sm" data-act="plskip">I haven't learned this yet</button></p></div></div></div>`;
    }
    if (!c.style) {
      if (!S.st) S.st = { i: 0, counts: { visual: 0, verbal: 0, hands: 0, logic: 0 } };
      const q = AP.STYLE_QS[S.st.i];
      return `<div class="wrap"><div class="narrow"><p class="small mute">Step 2 of 3 · How do you like to learn?</p>
        <div class="card"><div class="row between"><h3 style="margin:0">${esc(q.q)}</h3><span class="chip">${S.st.i + 1} of ${AP.STYLE_QS.length}</span></div><br>
        <div class="opts" style="grid-template-columns:1fr">${q.o.map(([k, t]) => `<button class="opt" data-act="style" data-k="${k}">${esc(t)}</button>`).join('')}</div></div></div></div>`;
    }
    if (!c.onboarded) {
      const g = c.goals, tier = AP.tier();
      return `<div class="wrap"><div class="narrow"><p class="small mute">Step 3 of 3 · Set daily goals</p><div class="card"><h2>Pick goals ${esc(c.name)} can hit</h2>
        <form data-form="goals">${goalFields(g)}
        ${tier === 'trial' ? `<p class="small mute">During your free trial you can do as many lessons as you like. On the Basic plan the limit is 1 lesson a day.</p>` : ''}
        <button class="btn lg" style="width:100%">Save goals and finish</button></form></div></div></div>`;
    }
    const si = AP.STYLE_INFO[c.style.primary], u = AP.unitById(c.placement.startUnit), nl = AP.nextLesson(c);
    return `<div class="wrap"><div class="narrow"><div class="card center"><div style="font-size:2.5rem">🎉</div><h2>You're all set, ${esc(c.name)}!</h2>
      <div class="grid g2" style="text-align:left;margin:18px 0"><div class="card flat"><p class="sec-h">Skills check</p><b>${c.placement.score} of ${c.placement.total} correct</b><p class="small mute" style="margin:6px 0 0">Level: ${esc(c.placement.level)}. Start in Unit ${u.id}: ${esc(u.title)}.</p></div>
      <div class="card flat"><p class="sec-h">Learning preference</p><b>${si.emoji} ${si.name}</b><p class="small mute" style="margin:6px 0 0">${si.how}</p></div></div>
      ${AP.tier() === 'trial' ? `<div class="banner trial"><div><b>Your 7-day free trial has started</b>Everything is unlocked, including printable worksheets, the AI tutor and family profiles.</div></div>` : ''}
      <a class="btn lg" href="#/lesson/${nl ? nl.id : '1.1'}">Start your first lesson</a> <a class="btn ghost lg" href="#/app">Go to dashboard</a></div></div></div>`;
  };
  function goalFields(g) {
    return `<div class="field"><label for="gl">Lessons per day</label><select id="gl" name="lessons" style="width:100%">${[1, 2, 3].map((n) => `<option value="${n}" ${g.lessons === n ? 'selected' : ''}>${n}${n === 1 ? ' (recommended)' : ''}</option>`).join('')}</select></div>
      <div class="field"><label for="gp">Practice problems per day</label><select id="gp" name="practice" style="width:100%">${[5, 10, 15, 20].map((n) => `<option value="${n}" ${g.practice === n ? 'selected' : ''}>${n}${n === 5 ? ' (recommended)' : ''}</option>`).join('')}</select></div>
      <div class="field"><label class="radio"><input type="checkbox" name="remind" ${g.remind ? 'checked' : ''}> Remind me to study</label><input type="time" name="time" value="${esc(g.time)}" aria-label="Reminder time" style="max-width:160px"><p class="small mute" style="margin:6px 0 0">Reminders appear as a browser notification while the site is open. Allow notifications when asked.</p></div>`;
  }

  function courseProgress(c, nl) {
    const done = Object.keys(c.done).length, total = AP.LESSONS.length, pc = Math.round((done / total) * 100);
    return `<div class="card courseprog"><div class="row between"><b>Algebra 1 course progress</b><span><b class="pcbig">${pc}%</b> <span class="small mute">${done} of ${total} lessons complete</span></span></div>
      <div class="bar big" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pc}" aria-label="Algebra 1 course progress"><i style="width:${pc}%"></i></div>
      <p class="small mute" style="margin:8px 0 0">${nl ? 'Next up: ' + nl.id + ' ' + esc(nl.title) + ' (Unit ' + nl.unit + ': ' + esc(AP.unitById(nl.unit).title) + ')' : 'You finished every lesson. Amazing!'}</p></div>`;
  }
  // ---------- dashboard ----------
  V.app = function () {
    const a = AP.acct(), c = AP.child(), ent = AP.ent(), g = AP.goalProgress(c), ex = AP.examSeason(), nl = AP.nextLesson(c), st = AP.streak(c), r = AP.report(c);
    const can = nl ? AP.canStartLesson(nl.id) : { ok: false };
    const max = Math.max(5, ...r.days.map((d) => d.answered));
    return `<div class="wrap">
      <div class="row between" style="margin-bottom:12px"><div><h1 style="font-size:1.7rem;margin:0">Hi ${esc(c.name)} 👋</h1><p class="mute" style="margin:0">${g.met ? 'Daily goals complete. Great job!' : 'Here is what is on for today.'}</p></div>
        <div class="row"><span class="chip warn">🔥 ${plural(st, 'day')} streak</span></div></div>
      ${courseProgress(c, nl)}
      ${!c.placement || !c.style || !c.onboarded ? `<div class="banner warn"><div><b>Finish setting up ${esc(c.name)}'s profile</b>The skills check and goals help us pick the right lessons.</div><a class="btn" href="#/onboarding">Continue setup</a></div>` : ''}
      ${ent.tier === 'trial' ? `<div class="banner trial"><div><b>Free trial: ${plural(AP.trialDaysLeft(), 'day')} left</b>Every feature is unlocked. After the trial you move to the free Basic plan.</div><a class="btn" href="#/plans">Choose a plan</a></div>` : ent.tier === 'basic' ? `<div class="banner warn"><div><b>You are on Basic</b>1 lesson and 2 worksheets a day. Upgrade for unlimited lessons, printable worksheets and the AI tutor.</div><a class="btn" href="#/plans">Upgrade</a></div>` : ''}
      ${ex.active ? `<div class="banner ok"><div><b>📅 ${esc(ex.label)}: extra practice is open</b>Mixed review sets from every topic you have studied. Unlimited sets until exams are over.</div><a class="btn" href="#/exam">Start exam review</a></div>` : ''}
      <div class="grid g2">
        <div class="card"><h3>Today's goals</h3><div class="row" style="gap:28px">
          <div class="ringbox">${ring(g.lessonsDone, g.lessonGoal)}<div><b>Lessons</b><div class="small mute">goal: ${g.lessonGoal}</div></div></div>
          <div class="ringbox">${ring(Math.min(g.practice, g.practiceGoal), g.practiceGoal)}<div><b>Practice</b><div class="small mute">goal: ${g.practiceGoal} problems</div></div></div></div>
          <p class="small mute" style="margin:12px 0 0">${g.practice} problems answered today. <a href="#/settings">Change goals</a></p></div>
        <div class="card"><h3>Up next</h3>${nl ? `<p class="mute" style="margin:0">Unit ${nl.unit}: ${esc(AP.unitById(nl.unit).title)}</p><p style="font-size:1.25rem;font-weight:800;margin:4px 0 12px">${nl.id} ${esc(nl.title)}</p>
          ${can.ok ? `<a class="btn" href="#/lesson/${nl.id}">Start lesson</a>` : `<p class="small mute">You've used today's ${plural(can.limit, 'lesson')} on Basic. Come back tomorrow, or <a href="#/plans">upgrade</a>. You can still practice below.</p>`}
          <a class="btn sec" href="#/practice">Daily practice</a>` : `<p>You finished every lesson. Amazing! Keep sharp with practice and worksheets.</p><a class="btn" href="#/practice">Practice</a>`}</div></div>
      <div class="card"><div class="row between"><h3 style="margin:0">Practice this week</h3><a href="#/parent" class="small">Full report →</a></div><br>
        <div class="bars" aria-label="Practice problems answered per day">${r.days.map((d) => `<div title="${d.answered} problems"><i style="height:${Math.round((d.answered / max) * 100)}%"></i><span>${wd(d.date)}</span></div>`).join('')}</div></div>
      ${ent.tier === 'basic' ? `<div class="card"><h3>Unlock more with Premium</h3><div class="grid g3 small"><div>🖨️ <b>Printable worksheets</b><br><span class="mute">With answer keys.</span></div><div>🧠 <b>Personalized AI tutor</b><br><span class="mute">Lessons shaped to how you learn.</span></div><div>👪 <b>Family plan</b><br><span class="mute">Up to four students.</span></div></div></div>` : ''}
    </div>`;
  };

  // ---------- lessons ----------
  V.lessons = function () {
    const c = AP.child(), d = AP.dayRec(), ent = AP.ent(), start = c.placement ? c.placement.startUnit : 1;
    return `<div class="wrap"><div class="row between"><h1 style="font-size:1.7rem">Algebra 1</h1>${ent.lessonsPerDay !== Infinity ? `<span class="chip ${d.started.length >= ent.lessonsPerDay ? 'warn' : ''}">Today: ${d.started.length}/${ent.lessonsPerDay} lesson used (Basic)</span>` : '<span class="chip ok">Unlimited lessons</span>'}</div>
      ${AP.UNITS.map((u) => `<div class="card unit"><h3><span style="font-size:1.4rem">${u.icon}</span> Unit ${u.id}: ${esc(u.title)} ${u.id === start ? '<span class="chip ok">Your start</span>' : ''}</h3><p class="small mute" style="margin-top:-4px">${esc(u.blurb)}</p>
        ${AP.lessonsInUnit(u.id).map((l) => { const dn = c.done[l.id]; return `<a class="lrow" href="#/lesson/${l.id}"><span class="id">${l.id}</span><span class="t">${esc(l.title)}</span>${dn ? `<span class="chip ok">✓ ${pct(dn.best)}</span>` : d.started.includes(l.id) ? '<span class="chip warn">In progress</span>' : '<span class="chip gray">Start</span>'}</a>`; }).join('')}</div>`).join('')}
      <div class="card"><h3>🔜 Algebra 2 (coming soon)</h3><p class="small mute">Logarithms, trigonometry and more are on the way:</p><div class="row" style="gap:6px">${AP.ALG2.map((t) => `<span class="chip gray">${esc(t)}</span>`).join('')}</div></div></div>`;
  };

  const secs = {
    idea: (l, rule) => `<div class="lessonsec"><p class="sec-h">${rule ? 'The rule' : 'The idea'}</p><p style="margin:0">${esc(l.idea)}</p></div>`,
    example: (l, num) => `<div class="lessonsec"><p class="sec-h">Worked example</p>${num ? '<ol>' : '<ul>'}${l.example.map((s) => `<li>${esc(s)}</li>`).join('')}${num ? '</ol>' : '</ul>'}</div>`,
    visual: (l) => `<div class="lessonsec"><p class="sec-h">Picture it</p><p style="margin:0">${esc(l.visual)}</p></div>`,
    tip: (l) => `<div class="lessonsec"><p class="sec-h">Watch out</p><p style="margin:0">${esc(l.tip)}</p></div>`,
    tryit: (l) => { if (!S.tryP || S.tryP.id !== l.id) S.tryP = { id: l.id, p: l.gen(), show: false }; const t = S.tryP; return `<div class="try"><p class="sec-h">Try it first</p><div class="q" style="font-size:1.1rem;margin:4px 0 10px">${esc(t.p.q)}</div>${t.p.type === 'mc' ? `<p class="small">Options: ${t.p.options.map(esc).join(' · ')}</p>` : ''}${t.show ? `<p style="margin:0"><b>Answer: ${esc(t.p.type === 'mc' ? t.p.answer : U.n2s(t.p.answer))}.</b> ${esc(t.p.why)}</p>` : `<button class="btn sec sm" data-act="showtry">Show the answer</button>`}</div>`; },
  };
  V.lesson = function (id) {
    const l = AP.lessonById(id), c = AP.child(), ent = AP.ent();
    if (!l) return `<div class="wrap"><div class="card">Lesson not found. <a href="#/lessons">Back to lessons</a></div></div>`;
    const can = AP.canStartLesson(id);
    if (!can.ok) return `<div class="wrap"><div class="card center narrow"><div style="font-size:2.2rem">⏳</div><h2>You've used today's lesson</h2><p class="mute">The Basic plan includes ${plural(can.limit, 'lesson')} a day. Come back tomorrow for the next one, or unlock unlimited lessons with Premium.</p><div class="row" style="justify-content:center"><a class="btn" href="#/plans">See plans</a><a class="btn sec" href="#/practice">Practice instead</a><a class="btn ghost" href="#/worksheets">Worksheets</a></div></div></div>`;
    if (!(S.run && S.run.kind === 'lesson' && S.run.lessonId === id)) AP.startLesson(id);
    const u = AP.unitById(l.unit), style = ent.ai && c.style ? c.style.primary : null;
    const order = { visual: ['visual', 'example', 'idea', 'tip'], verbal: ['idea', 'tip', 'example', 'visual'], hands: ['tryit', 'idea', 'example', 'tip'], logic: ['idea', 'example', 'tip', 'visual'] }[style || 'std'] || ['idea', 'example', 'visual', 'tip'];
    const body = order.map((k) => (k === 'idea' ? secs.idea(l, style === 'logic') : k === 'example' ? secs.example(l, style === 'logic') : secs[k](l))).join('');
    const running = S.run && S.run.kind === 'lesson' && S.run.lessonId === id;
    return `<div class="wrap"><div class="narrow"><p class="small"><a href="#/lessons">← All lessons</a> · Unit ${u.id}: ${esc(u.title)}</p>
      <h1 style="font-size:1.8rem">${l.id} ${esc(l.title)}</h1>
      ${style ? `<p><span class="chip">${AP.STYLE_INFO[style].emoji} Personalized for a ${AP.STYLE_INFO[style].name.toLowerCase()}</span></p>` : `<p class="small mute">🔒 <a href="#/plans">Premium</a> shapes each lesson to your learning style.</p>`}
      ${running ? runHTML() : `<div class="card">${body}</div><div class="row"><button class="btn lg" data-act="startlesson" data-id="${l.id}">Practice: 5 problems</button>${ent.ai ? '<a class="btn ghost" href="#/tutor">Ask the AI tutor</a>' : ''}</div>`}</div></div>`;
  };

  // ---------- practice + exam ----------
  V.practice = function () {
    const c = AP.child(), g = AP.goalProgress(c), r = AP.report(c);
    if (S.run && S.run.kind === 'practice') return `<div class="wrap"><div class="narrow">${runHTML()}</div></div>`;
    return `<div class="wrap"><div class="narrow"><h1 style="font-size:1.7rem">Daily practice</h1>
      <div class="card"><div class="ringbox">${ring(Math.min(g.practice, g.practiceGoal), g.practiceGoal)}<div><b>${g.practice >= g.practiceGoal ? 'Goal reached!' : g.practiceGoal - g.practice + ' to go'}</b><div class="small mute">Today's goal: ${g.practiceGoal} problems</div></div></div></div>
      <div class="card"><h3>Start a mixed set</h3><p class="mute small">Problems come from lessons you have started, with extra weight on topics you find harder.</p>
        <div class="row">${[5, 10, 15].map((n) => `<button class="btn ${n === g.practiceGoal ? '' : 'sec'}" data-act="startpractice" data-n="${n}">${n} problems</button>`).join('')}</div></div>
      ${r.weak.length ? `<div class="card"><h3>Needs more practice</h3>${r.weak.map((w) => `<div class="row between" style="padding:4px 0"><span>${w.lesson.id} ${esc(w.lesson.title)}</span><span class="chip warn">${pct(w.acc)}</span></div>`).join('')}</div>` : ''}</div></div>`;
  };
  V.exam = function () {
    const ex = AP.examSeason(), c = AP.child();
    if (S.run && S.run.kind === 'exam') return `<div class="wrap"><div class="narrow">${runHTML()}</div></div>`;
    const exams = AP.acct().exams || [];
    return `<div class="wrap"><div class="narrow"><h1 style="font-size:1.7rem">📅 Midterm and finals review</h1>
      ${ex.active ? `<div class="banner ok"><div><b>${esc(ex.label)}: extra practice is open</b>Take as many mixed review sets as you like. Everything counts toward your daily practice goal.</div></div>
        <div class="card"><h3>15-problem review set</h3><p class="mute small">Mixed questions from every topic ${esc(c.name)} has studied, weighted toward weak spots. You have taken ${AP.dayRec().exam} set${AP.dayRec().exam === 1 ? '' : 's'} today.</p><button class="btn lg" data-act="startexam">Start review set</button></div>
        <div class="card"><h3>Study plan for exam season</h3><ul class="small"><li>Aim for <b>10 practice problems</b> a day instead of 5.</li><li>Redo lessons where your accuracy is under 70%.</li><li>Print a worksheet for each unit on the test (Premium).</li></ul></div>`
      : `<div class="card center"><div style="font-size:2.2rem">🔒</div><h2>Opens during exam season</h2><p class="mute">Extra review sets unlock automatically around midterms and finals. Next window: <b>${esc(AP.nextExamWindow())}</b>. You can also add your own exam date and we will open review sets 14 days before.</p></div>`}
      <div class="card"><h3>Your exam dates</h3>${exams.length ? exams.map((e, i) => `<div class="row between" style="padding:4px 0"><span>${esc(e.name)} · ${esc(e.date)}</span><button class="btn ghost sm" data-act="rmexam" data-i="${i}">Remove</button></div>`).join('') : '<p class="small mute">No exams added yet.</p>'}
        <form data-form="exam" class="row" style="margin-top:10px"><input type="text" name="name" placeholder="e.g. Algebra midterm" required style="flex:2;min-width:150px"><input type="date" name="date" required style="flex:1;min-width:140px"><button class="btn sm">Add</button></form></div></div></div>`;
  };

  // ---------- worksheets ----------
  V.worksheets = function () {
    const c = AP.child(), ent = AP.ent(), left = AP.worksheetsLeft(), ws = S.ws;
    const head = `<div class="row between"><h1 style="font-size:1.7rem">Worksheets</h1><span class="chip ${left === 0 ? 'warn' : ''}">${left === Infinity ? 'Unlimited today' : left + ' of ' + ent.worksheetsPerDay + ' left today'}</span></div>`;
    if (!ws) return `<div class="wrap"><div class="narrow">${head}<div class="card"><h3>Create a worksheet</h3><p class="mute small">10 fresh problems. Solve them on screen and get instant feedback${ent.print ? ', or print them with an answer key' : ''}.</p>
      <form data-form="mkws" class="row"><select name="unit" aria-label="Unit" style="min-width:220px"><option value="all">Mixed review</option>${AP.UNITS.map((u) => `<option value="${u.id}">Unit ${u.id}: ${esc(u.title)}</option>`).join('')}</select><button class="btn" ${left === 0 ? 'disabled' : ''}>Create worksheet</button></form>
      ${left === 0 ? `<p class="small mute" style="margin-top:10px">You've used today's ${ent.worksheetsPerDay} worksheets on Basic. <a href="#/plans">Upgrade</a> for unlimited worksheets and printing.</p>` : ''}</div>
      ${ent.print ? '' : `<div class="card flat"><b>🖨️ Printable worksheets are a Premium feature.</b><p class="small mute" style="margin:6px 0 0">Print any worksheet with space for work and a separate answer key. <a href="#/plans">See plans</a></p></div>`}</div></div>`;
    return `<div class="wrap"><div class="narrow">${head}<div class="card"><div class="row between"><h3 style="margin:0">${esc(ws.title)}</h3><div class="row">${ent.print ? '<button class="btn sec sm" data-act="printws">🖨️ Print</button><button class="btn sec sm" data-act="printkey">Print with answer key</button>' : '<button class="btn sec sm lock" data-act="lockedprint">🔒 Print (Premium)</button>'}<button class="btn ghost sm" data-act="newws">Close</button></div></div>
      <form data-form="gradews">${ws.probs.map((p, i) => { const g = ws.graded ? ws.res[i] : null; return `<div class="ws-item ${g === true ? 'ok' : g === false ? 'no' : ''}"><div class="n">${i + 1}.</div><div class="body"><div class="qq">${esc(p.q)}</div>
        ${p.type === 'mc' ? p.options.map((o, k) => `<label class="radio"><input type="radio" name="q${i}" value="${esc(o)}" ${ws.graded ? 'disabled' : ''} ${ws.ans[i] === o ? 'checked' : ''}> ${esc(o)}</label>`).join('') : `<input type="text" name="q${i}" autocomplete="off" aria-label="Answer ${i + 1}" value="${esc(ws.ans[i] || '')}" ${ws.graded ? 'disabled' : ''}>`}
        ${ws.graded ? `<p class="small" style="margin:8px 0 0"><b>${g ? 'Correct' : 'Answer: ' + esc(p.type === 'mc' ? p.answer : U.n2s(p.answer))}.</b> ${esc(p.why)}</p>` : ''}</div></div>`; }).join('')}
      ${ws.graded ? `<div class="center"><div class="score">${ws.res.filter(Boolean).length}/${ws.probs.length}</div><button type="button" class="btn" data-act="newws">Done</button></div>` : '<button class="btn lg" style="margin-top:14px">Check my answers</button>'}</form></div></div></div>`;
  };
  function printSheet(withKey) {
    const ws = S.ws, c = AP.child(), L = 'ABCD';
    const item = (p, i) => `<div class="pi"><b>${i + 1}.</b>${esc(p.q).replace(/\n/g, '<br>')}${p.type === 'mc' ? '<div style="margin:6px 0 0 26px">' + p.options.map((o, k) => `${L[k]}. ${esc(o)}`).join('&nbsp;&nbsp;&nbsp; ') + '</div>' : ''}<div class="lines"></div><div class="lines"></div></div>`;
    const key = (p, i) => `<div style="margin:6px 0"><b>${i + 1}.</b> ${p.type === 'mc' ? L[p.options.indexOf(p.answer)] + '. ' + esc(p.answer) : esc(U.n2s(p.answer))}<div style="font-size:12px;color:#444;margin-left:26px">${esc(p.why)}</div></div>`;
    $('#print-root').innerHTML = `<div class="pw"><div class="meta"><div><h1 style="margin:0">${esc(ws.title)}</h1>${esc(NAME())}</div><div>Name: ${esc(c.name)} ____________________<br>Date: ____________</div></div>${ws.probs.map(item).join('')}${withKey ? `<div class="brk"><h1>Answer key: ${esc(ws.title)}</h1>${ws.probs.map(key).join('')}</div>` : ''}</div>`;
    document.body.classList.add('print-sheet'); setTimeout(() => window.print(), 50);
  }
  window.addEventListener('afterprint', () => document.body.classList.remove('print-sheet'));

  // ---------- AI tutor ----------
  V.tutor = function () {
    const ent = AP.ent(), c = AP.child();
    if (!ent.ai) return `<div class="wrap">${lockCard('The personalized AI tutor is a Premium feature', 'Ask questions in your own words and get explanations shaped to how you learn best, with worked examples and hints. Included in your free trial and in Premium and Family.')}</div>`;
    const st = c.style ? AP.STYLE_INFO[c.style.primary] : null;
    if (!S.chat.length) S.chat.push({ me: false, t: `Hi ${c.name}! I'm your algebra tutor${st ? ' and I know you are a ' + st.name.toLowerCase() : ''}. Ask me about any topic, ask for a hint, or tell me what you're stuck on.` });
    return `<div class="wrap"><div class="narrow"><h1 style="font-size:1.7rem">🧠 AI tutor</h1>
      <div class="card"><div class="chat" id="chat" role="log" aria-live="polite">${S.chat.map((m) => `<div class="msg ${m.me ? 'me' : 'ai'}">${esc(m.t)}</div>`).join('')}</div>
      <div class="row" style="margin:10px 0">${['How do I solve two-step equations?', 'Explain slope', 'I need a hint on factoring', 'What is a function?'].map((t) => `<button class="chip" style="border:0;cursor:pointer" data-act="ask" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      <form data-form="chat" class="ansrow" style="max-width:none"><input type="text" name="m" autocomplete="off" placeholder="Ask about any algebra topic" aria-label="Message the tutor" required><button class="btn">Send</button></form>
      <p class="small mute" style="margin:10px 0 0">${AP.config.AI_PROXY_URL ? 'Connected to the live AI model.' : 'Demo tutor: answers come from the built-in lessons and adapt to your learning style. A live AI model connects through config.js.'}</p></div></div></div>`;
  };

  // ---------- parent ----------
  V.parent = function () {
    const a = AP.acct(), ent = AP.ent(), c = AP.child(), r = AP.report(c), max = Math.max(5, ...r.days.map((d) => d.answered)), g = AP.goalProgress(c), nl = AP.nextLesson(c);
    const rec = r.weak.length ? `Try a worksheet on <b>${esc(r.weak[0].lesson.title)}</b> and re-read lesson ${r.weak[0].lesson.id}.` : nl ? `Keep going with <b>${nl.id} ${esc(nl.title)}</b>.` : 'Great progress. Move on to exam-style review.';
    return `<div class="wrap">
      <div class="row between noprint"><h1 style="font-size:1.7rem;margin:0">Parent dashboard</h1><div class="row"><a class="btn sec sm" href="mailto:${esc(a.email)}?subject=${encodeURIComponent(NAME() + ' weekly report for ' + c.name)}&body=${encodeURIComponent(AP.reportText(c))}">✉️ Email this report</a><button class="btn sec sm" data-act="printreport">🖨️ Print</button></div></div><br>
      ${a.children.length > 1 ? `<div class="row noprint" style="margin-bottom:12px">${a.children.map((k) => `<button class="btn ${k.id === c.id ? '' : 'ghost'} sm" data-act="child" data-id="${k.id}">${esc(k.name)}</button>`).join('')}</div>` : ''}
      <div class="card"><div class="row between"><div><h2 style="margin:0">${esc(c.name)}'s week</h2><span class="small mute">${wd(r.days[0].date)} ${r.days[0].date.slice(5)} to ${r.days[6].date.slice(5)} · Grade ${esc(c.grade)}${c.style ? ' · ' + AP.STYLE_INFO[c.style.primary].name : ''}</span></div>
        <span class="chip ${g.met ? 'ok' : 'warn'}">${g.met ? 'Today\'s goals met' : 'Today: ' + g.lessonsDone + '/' + g.lessonGoal + ' lessons, ' + g.practice + '/' + g.practiceGoal + ' practice'}</span></div><br>
        <div class="grid g4"><div class="stat">${r.tot.lessons}<small>lessons completed</small></div><div class="stat">${r.tot.answered}<small>practice problems</small></div><div class="stat">${pct(r.accuracy)}<small>accuracy</small></div><div class="stat">${r.activeDays}/7<small>active days · ${plural(r.streak, 'day')} streak</small></div></div></div>
      <div class="grid g2"><div class="card"><h3>Practice by day</h3><div class="bars">${r.days.map((d) => `<div title="${d.answered} problems"><i style="height:${Math.round((d.answered / max) * 100)}%"></i><span>${wd(d.date)}</span></div>`).join('')}</div></div>
        <div class="card"><h3>Suggested next step</h3><p>${rec}</p><p class="small mute">${r.weak.length ? '<b>Needs practice:</b> ' + r.weak.map((w) => esc(w.lesson.title) + ' (' + pct(w.acc) + ')').join(', ') : 'No weak spots flagged yet. We flag topics under 70% after 3+ attempts.'}</p><p class="small mute" style="margin:0">${r.strong.length ? '<b>Doing well:</b> ' + r.strong.map((w) => esc(w.lesson.title)).join(', ') : ''}</p></div></div>
      <div class="card"><h3>Unit progress</h3>${r.byUnit.map((u) => `<div class="row" style="flex-wrap:nowrap;padding:5px 0"><span style="width:210px;flex:none" class="small">${u.unit.id}. ${esc(u.unit.title)}</span><div class="bar ${u.acc == null ? '' : u.acc >= 0.8 ? 'ok' : u.acc >= 0.6 ? 'warn' : 'bad'}" style="flex:1"><i style="width:${u.total ? Math.round((u.done / u.total) * 100) : 0}%"></i></div><span class="small mute" style="width:130px;text-align:right;flex:none">${u.done}/${u.total} done${u.acc != null ? ' · ' + pct(u.acc) : ''}</span></div>`).join('')}</div>
      <div class="card noprint"><h3>Weekly email</h3><label class="radio"><input type="checkbox" data-change="weekly" ${a.weeklyEmail ? 'checked' : ''}> Send me this report every week at ${esc(a.email)}</label><p class="small mute" style="margin:6px 0 0">Automatic delivery needs the email service from the README. Until then use "Email this report" above.</p></div>
      <div class="card noprint"><div class="row between"><h3 style="margin:0">Students on this account</h3><span class="chip ${ent.maxChildren > 1 ? 'ok' : 'gray'}">${a.children.length} of ${ent.maxChildren} profiles</span></div>
        ${a.children.map((k) => `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--line)"><span><b>${esc(k.name)}</b> <span class="small mute">Grade ${esc(k.grade)}</span></span>${a.children.length > 1 ? `<button class="btn ghost sm" data-act="rmchild" data-id="${k.id}">Remove</button>` : ''}</div>`).join('')}
        ${a.children.length < ent.maxChildren ? `<form data-form="addchild" class="row" style="margin-top:12px"><input type="text" name="name" placeholder="Student's first name" required style="flex:2;min-width:150px"><select name="grade" aria-label="Grade">${['6', '7', '8', '9', '10', '11', '12'].map((x) => `<option>${x}</option>`).join('')}</select><button class="btn sm">Add student</button></form>` : `<p class="small mute" style="margin:12px 0 0">${ent.tier === 'family' || ent.tier === 'trial' ? 'You have reached the 4 student limit.' : 'Your plan includes one student. <a href="#/plans">Upgrade to Family</a> to add up to 4 students with separate goals and reports.'}</p>`}</div></div>`;
  };

  // ---------- plans ----------
  V.plans = function () {
    const a = AP.acct(), ent = AP.ent(), yr = S.cycle === 'yearly';
    return `<div class="wrap"><h1 style="font-size:1.7rem">Plans</h1>
      <div class="banner ${ent.tier === 'trial' ? 'trial' : ''}"><div><b>Current plan: ${esc(ent.label)}</b>${ent.tier === 'trial' ? plural(AP.trialDaysLeft(), 'day') + ' left in your free trial. Then you move to Basic unless you upgrade.' : ent.tier === 'basic' ? 'Your free trial has ended or you chose Basic.' : 'Thank you for supporting ' + esc(NAME()) + '.'}</div></div>
      <div class="center" style="margin-bottom:18px"><div class="toggle"><button data-act="cycle" data-v="monthly" class="${!yr ? 'on' : ''}">Monthly</button><button data-act="cycle" data-v="yearly" class="${yr ? 'on' : ''}">Yearly (save ~40%)</button></div></div>
      ${planCards(true)}${S.co ? checkoutModal() : ''}</div>`;
  };
  function checkoutModal() {
    const { plan, cycle } = S.co, p = AP.PLANS[plan], amt = cycle === 'yearly' ? p.yearly : p.monthly;
    return `<div class="overlay" role="dialog" aria-modal="true" aria-label="Checkout"><div class="modal"><h2>Upgrade to ${p.name}</h2><p class="mute">${money(amt)} per ${cycle === 'yearly' ? 'year' : 'month'}. Cancel any time.</p>
      <div class="banner warn"><div><b>Demo checkout</b>No card is charged in this demo. In production this step connects to Stripe, the App Store or Google Play.</div></div>
      <div class="row"><button class="btn" data-act="confirmco">Confirm upgrade</button><button class="btn ghost" data-act="cancelco">Cancel</button></div></div></div>`;
  }

  // ---------- settings (+ presenter tools) ----------
  V.settings = function () {
    const a = AP.acct(), c = AP.child(), sim = AP.sim(), ent = AP.ent();
    return `<div class="wrap"><div class="narrow"><h1 style="font-size:1.7rem">Settings</h1>
      <div class="card"><h3>Daily goals for ${esc(c.name)}</h3><form data-form="goals">${goalFields(c.goals)}${ent.tier === 'basic' ? '<p class="small mute">Basic includes 1 lesson a day, so lesson goals above 1 apply on Premium.</p>' : ''}<button class="btn">Save goals</button></form></div>
      <div class="card"><h3>Account</h3><p class="small mute">${esc(a.parentName)} · ${esc(a.email)}</p><button class="btn ghost" data-act="logout">Sign out</button></div>
      <div class="tools"><h3>🎤 Presenter tools (for demos)</h3><p class="small mute">Use these to show every feature live without waiting days.</p>
        <div class="row"><b>Plan:</b>${[['trial', 'Free trial'], ['basic', 'Basic'], ['premium', 'Premium'], ['family', 'Family']].map(([k, t]) => `<button class="btn ${a.plan === k ? '' : 'sec'} sm" data-act="setplan" data-k="${k}">${t}</button>`).join('')}</div>
        <div class="row"><button class="btn sec sm" data-act="simexam">${sim.forceExam ? 'Turn off' : 'Turn on'} exam season</button><button class="btn sec sm" data-act="simday">Skip ahead 1 day</button><button class="btn sec sm" data-act="simtrial">End the free trial now</button></div>
        <div class="row"><button class="btn sec sm" data-act="seed">Fill in a week of sample activity</button><button class="btn danger sm" data-act="resetall">Erase all data</button></div>
        <p class="small mute" style="margin:6px 0 0">Simulated day offset: ${sim.dayOffset} · Today is ${AP.today()}</p></div></div></div>`;
  };

  // =============== router ===============
  let lastRoute = null;
  function render() {
    const [, route = '', arg] = (location.hash || '#/').split('/');
    const a = AP.acct(), pub = ['', 'login', 'signup'];
    if (!a && !pub.includes(route)) { location.hash = '#/login'; return; }
    if (a && (route === 'login' || route === 'signup')) { location.hash = '#/app'; return; }
    if (a && !V[route]) { location.hash = '#/app'; return; }
    if (route !== lastRoute) { S.err = ''; if (route !== 'lesson' && route !== 'practice' && route !== 'exam') S.run = (S.run && S.run.kind === 'lesson' && route === 'lesson') ? S.run : null; }
    if (route === 'lesson' && S.run && S.run.kind !== 'lesson') S.run = null;
    if (route === 'practice' && S.run && S.run.kind !== 'practice') S.run = null;
    if (route === 'exam' && S.run && S.run.kind !== 'exam') S.run = null;
    if (route !== lastRoute && route === 'lesson') S.tryP = null;
    let html;
    try { html = V[route] ? V[route](arg) : V['']() ; } catch (err) { console.error(err); html = `<div class="wrap"><div class="card"><h2>Something went wrong</h2><p class="mute">${esc(err.message)}</p><a class="btn" href="#/app">Home</a></div></div>`; }
    $('#topbar').innerHTML = navHTML(a, route);
    $('#app').innerHTML = html;
    if (route !== lastRoute) { window.scrollTo(0, 0); lastRoute = route; }
    const chat = $('#chat'); if (chat) chat.scrollTop = chat.scrollHeight;
    const af = $('#app [autofocus]'); if (af && !af.disabled) af.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', render);

  // =============== events ===============
  const A = {
    cycle: (t) => { S.cycle = t.dataset.v; render(); },
    pick: (t) => { const p = S.run ? S.run.probs[S.run.i] : S.pl.probs[S.pl.i]; if (S.run) submitAnswer(p.options[+t.dataset.i]); else plAnswer(p.options[+t.dataset.i]); },
    next: () => nextProblem(),
    retry: () => { const l = AP.lessonById(S.run.lessonId); startRun('lesson', l.title, AP.makeProblems(Array(5).fill(l)), { lessonId: l.id }); render(); },
    again: () => { const k = S.run.kind, n = S.run.probs.length; if (k === 'exam') A.startexam(); else { startRun('practice', 'Daily practice', AP.makeProblems(AP.pickLessons(AP.child(), n)), {}); render(); } },
    startlesson: (t) => { const l = AP.lessonById(t.dataset.id); startRun('lesson', l.title, AP.makeProblems(Array(5).fill(l)), { lessonId: l.id }); render(); },
    startpractice: (t) => { startRun('practice', 'Daily practice', AP.makeProblems(AP.pickLessons(AP.child(), +t.dataset.n)), {}); render(); },
    startexam: () => { startRun('exam', 'Exam review', AP.makeProblems(AP.pickLessons(AP.child(), 15, 'all')), {}); render(); },
    showtry: () => { S.tryP.show = true; render(); },
    plskip: () => plAnswer(null),
    style: (t) => { const s = S.st; s.counts[t.dataset.k]++; s.i++; if (s.i >= AP.STYLE_QS.length) { const sorted = Object.entries(s.counts).sort((x, y) => y[1] - x[1]); AP.child().style = { primary: sorted[0][0], secondary: sorted[1][0], scores: s.counts }; AP.save(); S.st = null; } render(); },
    logout: () => { AP.logout(); S.run = S.ws = S.pl = S.st = null; S.chat = []; go('#/'); },
    checkout: (t) => { S.co = { plan: t.dataset.plan, cycle: S.cycle }; render(); },
    cancelco: () => { S.co = null; render(); },
    confirmco: () => { AP.upgrade(S.co.plan, S.co.cycle); S.co = null; toast('Plan updated (demo checkout)'); render(); },
    downgrade: () => { if (confirm('Switch to Basic? Extra student profiles will be removed.')) { AP.downgrade(); render(); } },
    child: (t) => { AP.setActiveChild(t.dataset.id); render(); },
    rmchild: (t) => { if (confirm('Remove this student and their progress?')) { AP.removeChild(t.dataset.id); render(); } },
    printreport: () => window.print(),
    printws: () => printSheet(false), printkey: () => printSheet(true),
    lockedprint: () => toast('Printable worksheets are included in Premium and Family. Tap Plans to upgrade.'),
    newws: () => { S.ws = null; render(); },
    rmexam: (t) => { AP.acct().exams.splice(+t.dataset.i, 1); AP.save(); render(); },
    ask: (t) => sendChat(t.dataset.t),
    setplan: (t) => { const a = AP.acct(), k = t.dataset.k; a.plan = k; if (k === 'trial') a.trialStart = AP.nowMs(); if (k === 'basic' && a.children.length > 1) { /* keep profiles visible for demo; limit enforced on add */ } AP.save(); render(); },
    simexam: () => { AP.sim().forceExam = !AP.sim().forceExam; AP.save(); render(); },
    simday: () => { AP.sim().dayOffset++; AP.save(); render(); toast('Skipped ahead 1 day'); },
    simtrial: () => { AP.sim().dayOffset += AP.trialDaysLeft() || 0; if (AP.acct().plan === 'trial') AP.sim().dayOffset += 0; AP.save(); render(); toast('Free trial ended. Now on Basic.'); },
    seed: () => { AP.seedDemo(AP.child()); toast('Sample activity added'); render(); },
    resetall: () => { if (confirm('Erase all accounts and progress in this browser?')) { AP.resetAll(); S.run = S.ws = S.pl = S.st = null; go('#/'); } },
  };
  function plAnswer(val) {
    const pl = S.pl, p = pl.probs[pl.i]; pl.res.push(val != null && AP.check(p, val)); pl.i++;
    if (pl.i >= pl.probs.length) {
      const score = pl.res.filter(Boolean).length, misses = pl.probs.filter((_, i) => !pl.res[i]).map((p) => p.lessonId), firstMiss = pl.probs.find((_, i) => !pl.res[i]);
      const startUnit = firstMiss ? AP.lessonById(firstMiss.lessonId).unit : 10;
      const level = score <= 2 ? 'Foundations' : score <= 4 ? 'Equations and inequalities' : score <= 6 ? 'Linear functions and systems' : 'Polynomials and quadratics';
      const c = AP.child(); c.placement = { score, total: pl.probs.length, startUnit, level, misses };
      pl.probs.forEach((p, i) => { const t = c.topics[p.lessonId] || (c.topics[p.lessonId] = { c: 0, t: 0 }); t.t++; if (pl.res[i]) t.c++; });
      AP.save(); S.pl = null;
    }
    render();
  }
  async function sendChat(text) {
    text = text.trim(); if (!text) return;
    S.chat.push({ me: true, t: text }); S.chat.push({ me: false, t: '…' }); render();
    const hist = S.chat.filter((m) => m.t !== '…').map((m) => ({ role: m.me ? 'user' : 'assistant', content: m.t }));
    const reply = await AP.tutorReply(text, { history: hist.slice(-10) });
    S.chat[S.chat.length - 1] = { me: false, t: reply }; if (location.hash === '#/tutor') render();
  }

  document.addEventListener('click', (e) => { const t = e.target.closest('[data-act]'); if (!t) return; const f = A[t.dataset.act]; if (f) { e.preventDefault(); f(t); } });
  document.addEventListener('change', (e) => {
    const t = e.target.closest('[data-change]'); if (!t) return;
    if (t.dataset.change === 'child') { AP.setActiveChild(t.value); S.run = S.ws = null; render(); }
    if (t.dataset.change === 'weekly') { AP.acct().weeklyEmail = t.checked; AP.save(); }
  });
  const F = {
    async signup(f) {
      const d = Object.fromEntries(new FormData(f)); try { await AP.signup(d); S.err = ''; go('#/onboarding'); } catch (err) { S.err = err.message; render(); }
    },
    async login(f) { const d = Object.fromEntries(new FormData(f)); try { await AP.login(d.email, d.password); S.err = ''; go('#/app'); } catch (err) { S.err = err.message; render(); } },
    answer(f) { const v = new FormData(f).get('a'); if (S.run) submitAnswer(v); else if (S.pl) plAnswer(v); },
    goals(f) {
      const d = new FormData(f), c = AP.child(); c.goals = { lessons: +d.get('lessons'), practice: +d.get('practice'), remind: d.get('remind') === 'on', time: d.get('time') || '16:00' };
      const wasOnboarding = !c.onboarded; c.onboarded = true; AP.save();
      if (c.goals.remind && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
      toast('Goals saved'); wasOnboarding ? render() : go('#/app');
    },
    exam(f) { const d = new FormData(f); AP.acct().exams.push({ name: d.get('name'), date: d.get('date') }); AP.save(); render(); },
    mkws(f) {
      const u = new FormData(f).get('unit'), c = AP.child(); if (AP.worksheetsLeft() === 0) return;
      const lessons = u === 'all' ? AP.pickLessons(c, 10, 'all') : Array.from({ length: 10 }, (_, i) => AP.lessonsInUnit(+u)[i % AP.lessonsInUnit(+u).length]);
      S.ws = { title: u === 'all' ? 'Mixed review worksheet' : 'Unit ' + u + ': ' + AP.unitById(+u).title, probs: AP.makeProblems(lessons), ans: [], res: [], graded: false }; AP.countWorksheet(); render();
    },
    gradews(f) {
      const ws = S.ws; if (ws.graded) return; const d = new FormData(f);
      ws.probs.forEach((p, i) => { const v = d.get('q' + i); ws.ans[i] = v; ws.res[i] = v != null && AP.check(p, v); AP.recordAnswer(p.lessonId, ws.res[i]); }); ws.graded = true; render();
    },
    chat(f) { const v = new FormData(f).get('m'); f.reset(); sendChat(v); },
    addchild(f) {
      const d = new FormData(f); try { AP.addChild(d.get('name'), d.get('grade')); toast('Student added. Quick setup next.'); go('#/onboarding'); } catch (err) { toast('Your plan is at its student limit.'); }
    },
  };
  document.addEventListener('submit', (e) => { const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault(); if (F[f.dataset.form]) F[f.dataset.form](f); });

  AP.startReminders();
  render();
})();
