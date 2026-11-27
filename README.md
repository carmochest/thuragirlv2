# ThuraGirl v2 (front-end prototype)

ThuraGirl is an AI bookkeeper for Thai SMEs. This repository holds the v2 front end: every screen, flow and piece of copy (English and Thai, day and night), working end to end in the browser.

**This is a front-end prototype, not a production app.** Accounts, books and settings are stored in the tester's browser (`localStorage`). Nothing is sent to a server. Every outside service (DBD, banks, Didit, Beam, LINE, email, file storage) is mocked. See [docs/BACKEND-TODO.md](docs/BACKEND-TODO.md) for what a backend must supply, and [docs/DECISIONS.md](docs/DECISIONS.md) for product decisions made so far.

Last updated 26 November 2026.

Live test build: https://carmochest.github.io/thuragirlv2/ (GitHub Pages, `main` branch, repository root).

## Routes

| Address | What it is |
|---|---|
| `/` | Hub page linking to the five pages below. |
| `/web/` | Public landing page (EN/TH, day/night). |
| `/signup/` | Create an account, sign in, and set up a company: registered (tax ID lookup) or brand new (DBD registration). |
| `/dashboard/` | The owner's app: Home, Money, Morning Brief, Settings, company registration, Review Pack, chat. |
| `/auditorlogin/` | Auditor sign-in. The first account created becomes the lead auditor. Passkey and authenticator-app 2FA. |
| `/auditor/` | Auditor desk: monthly and yearly filings per company, deadlines, document checklist, assignment by the lead. |

## Key flows to try

- **Sign up** at `/signup/` with a made-up email, choose "Yes, it is registered", and use the demo tax ID `0105561023456`. Or pick "Not yet" to go through new-company registration. Statements stay locked until the registration is submitted.
- **Connect apps.** After sign-in a sheet lists banks, accounting apps (FlowAccount and PEAK, the only two at launch; there is no Odoo or custom ERP sync), POS and delivery apps, and LINE. Under Accounting, **"No accounting software? Let ThuraGirl keep your books"** is the alternative to syncing. It and the two accounting apps cancel each other out. The same list is shown in the setup checklist and in Settings → Apps.
- **Get started card.** Until the bank and the books are both connected, a "Get started · n of 3" card sits at the top of Home and inside the empty Finance and Brief pages. From the day after sign-up it is labelled "Reminder" and a once-a-day reminder pops up. It disappears when the bank and the books are both in.
- **Sample data.** "Try it with sample data" (or "Use the sample" in the upload sheet) loads a sample restaurant statement, so every screen fills in.
- **Morning Brief.** A short summary in icon rows, up to three urgent items with details behind a tap, things worth knowing, what was handled, and time saved (with "How I work this out"). The greeting and sign-off rotate daily.
- **Charts.** Finance has a "Sales by channel" donut with a Month/Year toggle. Tap any P&L line (for example Stock and supplies or Wages) to open a breakdown with a donut and the top payees. In chat, ask "Compare GrabFood vs LINE MAN for 3 months" or "sales by channel this year" to get a bar chart, and "Pin to Finance" keeps it on the Finance page (pins are stored in `u.pins`, up to 4).
- **Several banks.** The bank strip under the cash line says how many banks there are and flags any that are out of date. Open it to see each account with its balance, the total for all banks, and "Add another bank". The demo has two (K-Bank and an SCB savings account).
- **Review Pack, full month.** In the October Review Pack, "See the full month" opens every money-in and money-out line with its share, week by week in and out, and the PDF, Share and Print statement for that month.
- **Reminders know the email.** An overdue reminder fills in the customer's email from contacts or an earlier invoice and says where it came from. A new email typed on an invoice or reminder is remembered (`u.cmail`).
- **Actions update in place.** Sending a reminder, paying a bill or uploading keeps you where you were on the page instead of jumping back to the top.
- **Company menu.** It separates "This company" (Company settings) from "You, on every company" (language, theme, My account).
- **Unregistered company.** Until registration is submitted, Home shows one card with one button (Continue registration, or Review and submit when all 5 parts are done). The welcome strip and Needs you don't repeat it.
- **Demo, no sign-up.** "Try the demo" on the landing page opens `/dashboard/#/demo` (or `?demo`): a ready-made restaurant, Bangkok Bites, with sample books, under a "Demo with a sample restaurant" strip with a "Create my account" button. The demo account is `demo@thuragirl.test`.
- **Forgot password.** On sign-in, "Forgot your password?" asks for the email and shows "Check your email". In this test build no email is sent; "Open the reset link" goes straight to the new-password step.
- **Delete my account.** Settings → Security → Delete my account lists what is removed and asks you to type DELETE (ลบ in Thai). It clears the account from this browser and returns to sign-up.
- **Thai everywhere.** The owner app, the landing page (with Thai screenshots) and both auditor pages switch between English and Thai. The auditor pages have an EN/ไทย switch at the bottom left (stored in `tg.aud.lang`).
- **Auditor.** Create the first auditor at `/auditorlogin/` (that account becomes the lead), then open `/auditor/`. Companies signed up in the same browser appear with a "Signed up" badge. You can switch on sample companies. The desk is one list of companies grouped by what to do next (Needs attention, Documents missing, Documents requested, Ready to close, Month not over, Closed), with the same groups as filters at the top. A company opens in a focused view on top of the list (full screen on a phone); Esc or "All companies" goes back to the same place in the list. Visiting `/auditor/` while signed out sends you to `/auditorlogin/`, and signing in brings you back to the desk. To look around without an account, press **Try the demo** on the auditor sign-in: it opens the desk as a demo lead auditor with sample companies, under a "Demo with sample companies" strip. "Leave the demo" removes the demo account and its assignments, so it never becomes the real lead.

## Build and run

Requirements: Python 3 (build only) and any static file server. No npm, no bundler, no framework.

```
python3 src/build.py          # regenerates every built page from src/
python3 -m http.server 8765   # then open http://localhost:8765/
```

Passkeys need a secure context: `localhost` or HTTPS.

To deploy the test build: commit the built output and push to `main`; GitHub Pages serves the repository root.

## Folder structure

```
src/                 Source. Edit only here.
  build.py           Build script. Concatenates and writes the pages below.
  design-mock.html   The approved design (Option B): tokens, icons (SVG sprite), markup shells.
  app.css            App styles, appended after the design-mock styles.
  app1.js … app9.js  Owner app, concatenated in string order into one IIFE:
                       app1  storage, auth, sign-up flow, shared UI helpers
                       app2  bank statement upload and parsing (CSV/XLSX)
                       app3  company registration flow, Review Pack
                       app4  categorising, figures, sample restaurant data
                       app5  Home, Money, files, chat answers
                       app6  passkeys, connected apps, setup, notifications, files tab
                       app7  Morning Brief
                       app8  Settings: company records (DBD), 2FA (TOTP), plan and billing
                       app84 Thai dictionary (EN to TH)
                       app85 Thai pattern rules for generated sentences
                       app86 PDF export (Review Pack, P&L)
                       app87 "Get started" sync card (bank, books, sales apps) and daily reminder
                       app88 Sales by channel donut (Finance), chat charts with "Pin to Finance", P&L drill-down
                       app89 Forgot password, delete my account, demo mode (#/demo)
                       app9  boot
  auditor.html       Auditor desk and auditor sign-in (one standalone page).
  aud-th.js          Thai for the auditor pages (dictionary plus rules, EN/ไทย switch). build.py appends it to auditor.html.
  vendor/            qrcode.js (2FA QR), SheetJS xlsx (statement upload).
  sample-kbank-statement.csv  Example statement for testing upload.
web/                 Landing page and its images (hand-written, not built). img/*-th-* are the Thai screenshots, swapped in by setLang.
signup/ dashboard/ auditor/ auditorlogin/ assets/ index.html   Built output. Do not hand-edit.
docs/                Handover notes: BACKEND-TODO.md, DECISIONS.md.
```

## Conventions worth knowing

- Language: `L(en, th)` picks the string for the current language. Static strings go through the dictionary in `app84.js`; sentences built from numbers go through the rules in `app85.js`. Elements marked `data-noi18n` are skipped.
- Theme: day tokens live on `.mock[data-dir="b"][data-mode="day"]`; night is `html.night`. Colour tokens: `--m-bg --m-surface --m-soft --m-line --m-ink --m-mute --m-accent --m-hint`.
- Design rules (Option B): neutral greys plus one teal accent; red only for overdue text; amber only for stale items; pink only in the logo; thin line icons; no emoji.
- Structure: every card has a 1px ring plus a soft shadow, rows inside a card are split by hairlines, and Brief section headers start with a short teal bar. This is the "v5 structure" block near the end of `src/app.css`.
- Plans: Standard ฿1,999 a month, Pro ฿3,999 a month, 14-day free trial.
- Thai tax deadlines (paper / e-filing): ภ.พ.30 15th / 23rd; ภ.ง.ด.1, 3, 53, 2, 54 and ภ.พ.36 7th / 15th; SSO 15th; ภ.ง.ด.51 half-year + 2 months; ภ.ง.ด.50 year-end + 150 days; ภ.ง.ด.1ก end of February; AGM within 4 months of year-end; บอจ.5 AGM + 14 days; DBD financial statements within 1 month of the AGM. Weekend dates roll to the next business day. The logic is in `src/auditor.html` (`dueOf`, `fyEnd`).
