# Al-Gebra

*Smarter learning. Simple algebra.*

Algebra 1 and 2 learning site: short lessons, endless practice, daily goals, parent reports, worksheets and a personalized tutor. Plain HTML, CSS and JavaScript. No build step.

## Run it

    python3 -m http.server 8000      # then open http://localhost:8000

Or double-click `index.html`.

## Put it online (free, GitHub Pages)

1. Push this folder to a GitHub repository (files at the top level).
2. Repository **Settings > Pages > Build and deployment**: Source = "Deploy from a branch", branch `main`, folder `/ (root)`.
3. Your site appears at `https://<your-username>.github.io/<repo-name>/` in about a minute. Put that link in your QR code.

## What is built

| Your requirement | Where |
| --- | --- |
| Signup survey: skills check + how you learn best | `#/onboarding` steps 1 and 2 |
| Goal setting (lessons/day, practice/day, reminders) | `#/onboarding` step 3, `#/settings` |
| Extra practice at midterm and final time | `#/exam` (auto windows, or add your own exam date) |
| Parent progress reports | `#/parent` (email, print) |
| Basic: 1 lesson/day, 2 worksheets/day | enforced in `js/lib.js` (`AP.ent`) |
| 7-day free trial | starts at signup, all features unlocked |
| Premium: printable worksheets with answer key | `#/worksheets` |
| Premium: family plan (up to 4 students) | `#/parent` > Students, plan "Family" |
| Premium: personalized AI | lessons reorder to the student's style; `#/tutor` |

Content: 12 Algebra 1 units, 35 lessons. Every lesson generates fresh problems with a worked solution. Algebra 2 is listed as "coming soon".

## Demo day

Open **Settings > Presenter tools** to switch plan (trial/Basic/Premium/Family), turn on exam season, skip a day, end the trial, or fill in a week of sample activity. "Erase all data" resets the browser.

## What is real and what is a demo

- **Accounts and progress live in the visitor's browser (localStorage).** There is no server: clearing site data deletes everything, and a different device sees nothing. Passwords are hashed in the browser, which is fine for a demo and **not** real security.
- **Plan limits are enforced in the browser**, so a determined user could bypass them. Real enforcement needs a backend.
- **Checkout is a demo.** No card is charged. Production needs Stripe (web) or App Store / Google Play billing (apps).
- **Reminders** show as browser notifications only while the site is open. Real reminders need push notifications or email from a server.
- **Weekly parent email** is a button that opens the parent's email app with the report filled in. Automatic delivery needs an email service.
- **The AI tutor is a built-in demo** that answers from the lesson text in the student's learning style. For a live model, deploy `server/ai-proxy.js` and set `AI_PROXY_URL` in `js/config.js` (untested against the live API; test it before relying on it).
- **No homework photo checking yet.** It needs a vision model plus a math checker, so it is on the roadmap, not in this build.
- **The skills check measures algebra readiness, not intelligence.**

## Files

    index.html        page shell
    css/styles.css    styles (light and dark, print styles for worksheets)
    js/config.js      app name, trial length, AI proxy URL
    js/content.js     units, lessons, problem generators, surveys
    js/lib.js         accounts, plans and limits, progress, goals, exam season, reports, tutor
    js/app.js         pages and interactions
    server/ai-proxy.js  optional live-AI proxy (Cloudflare Worker)

## Next steps after the conference

1. Real backend and accounts (Supabase or Firebase is the quickest), then move plan limits server-side.
2. Stripe checkout.
3. Algebra 2 lessons (the generator pattern in `js/content.js` makes each new lesson about 20 lines).
4. Photo homework checking.
5. Native iOS/Android wrapper or PWA for push reminders.
