# Backend TODO: what is mocked, and what the real app needs

Everything in this repository runs in the browser. This list covers each piece that is faked or kept in `localStorage`, where it lives in the code, and a suggested API to replace it. The endpoint names are suggestions to agree with the backend team (Surf); they are not built anywhere yet.

General rules for the real build:
- All money is THB and stored as integer satang. Dates are ISO `YYYY-MM-DD` in Asia/Bangkok.
- Every company-scoped call carries `companyId`; one user can own several companies (`u.cos` in the prototype).
- PDPA: personal data (ID numbers, addresses, bank lines) must stay in a Thai or approved region, encrypted at rest, with an audit log of who read what.
- Replace each `localStorage` read/write with an API call. The front end already keeps all state on one user object (`me()` in `src/app1.js`), so a first pass can be `GET /me` on load and targeted `PATCH`/`POST` calls where `save()` is called today.

## 1. Owner accounts and sign-in
**Today:** `tg.v2` in `localStorage` holds `{ users: { email: user }, session: email }`. Passwords are hashed in the browser with SHA-256 plus a random salt (`digest`, `salt` in `src/app1.js`). Any tester can open DevTools and read it.
**Needs:**
- `POST /auth/signup` `{ name, email, password }`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/password/reset`, `POST /auth/password/change`.
- Server-side hashing (argon2id or bcrypt), rate limiting, email verification, HTTP-only session cookies or short-lived tokens with refresh.
- `GET /me` returns the user profile (name, nickname, email, phone, language, theme, notification settings) and their companies.
- `PATCH /me` for profile and preferences (`u.name u.nick u.phone u.lang u.theme u.notif`).

## 2. Passkeys (owner and auditor)
**Today:** real WebAuthn ceremonies run in the browser (`src/app6.js` `pkCreate`/`pkSignIn`; auditor side in `src/auditor.html`), but the challenge is random client-side and the result is only stored locally. Nothing verifies the signature.
**Needs:** server-issued challenges and verification (e.g. SimpleWebAuthn or a library in your stack).
- `POST /auth/passkey/register/options`, `POST /auth/passkey/register/verify`
- `POST /auth/passkey/login/options`, `POST /auth/passkey/login/verify`
- `GET /me/passkeys`, `DELETE /me/passkeys/:id`
- RP ID must be the production domain.

## 3. Two-step sign-in (TOTP)
**Today:** the TOTP secret is generated and checked in the browser (`totp`, `totpOk` in `src/app8.js`; same logic in `src/auditor.html`). Backup codes are kept locally.
**Needs:** secret generated and stored server-side (encrypted), code checked on the server.
- `POST /auth/2fa/setup` returns `otpauth://` URI, `POST /auth/2fa/enable` `{ code }`, `POST /auth/2fa/verify` (during login), `POST /auth/2fa/disable`, `POST /auth/2fa/backup-codes` (regenerate, shown once).

## 4. Database: companies, books and tasks
**Today:** all on the user object in `tg.v2`:
- Company: `u.company` (name, tax ID, address, type, VAT, SSO), `u.records` (directors, shareholders, capital, signing rule), `u.setup` (setup checklist), `u.cos` (other companies), `u.team` (staff and salaries), `u.invites`.
- Books: `u.banks` (accounts), `u.tx` (bank lines with category), `u.invoices`, `u.bills`, `u.rcpt` (receipt matched to a line), `u.matched`, `u.done` (tasks ticked), `u.requests`, `u.docs`.
- Registration of a new company: `u.reg` (names, objectives, capital, people, office, owner, applicant).
**Needs:** a relational schema roughly: `users`, `companies`, `company_members (role)`, `bank_accounts`, `transactions`, `categories`, `invoices`, `bills`, `receipts (file + transaction link)`, `employees`, `payroll_runs`, `tasks`, `filings`, `registrations`, `documents`.
- CRUD endpoints per resource under `/companies/:companyId/...`.
- Figures shown on Home, Money and the Brief (cash, in/out, kept, month trend, top categories, overdue bills) are computed in the browser from `u.tx` (`src/app4.js`). In production compute them server-side from the ledger, or keep the same functions and feed them API data.
- Categorising rules today are regexes in `src/app4.js` (`INC`, `EXP`). The real app needs the AI categoriser plus owner corrections stored per company.

## 5. DBD lookup (existing companies)
**Today:** `DBDDEMO` in `src/app8.js` returns records only for the demo tax ID `0105561023456`. Sign-up step "company tax ID" fills name and address from a fixed sample (`src/app1.js`).
**Needs:**
- `GET /dbd/company/:taxId` returns registered name (TH/EN), address, registration date, status, capital, par value, directors, shareholders, signing rule.
- Owner confirms each line, then `POST /companies/:id/records/confirm`. Edits are kept as owner overrides with the DBD original kept for audit.
- Source: DBD DataWarehouse / Open API, or a licensed data provider. Cache results; re-pull on demand ("Pull from DBD again").

## 6. Company registration (new companies)
**Today:** the full registration form (names, objectives, capital, people, office, documents) saves to `u.reg`. "Submit" only marks it submitted (`src/app3.js`).
**Needs:** `POST /companies/:id/registration` (draft save), `POST /companies/:id/registration/submit`, status updates back to the owner (name reserved, documents signed, registered). This feeds an internal ops queue: ThuraGirl staff file with DBD (e-Registration) on the owner's behalf. Until registration completes, bank statement upload stays locked (already enforced in the UI, `src/app6.js`).

## 7. Bank feeds and statement upload
**Today:** the owner uploads a CSV/XLSX statement; it is parsed in the browser with SheetJS (`src/app2.js`; `readTable` in `src/app4.js`). "Try it with sample data" generates a fake restaurant (`sampleCsv`, `sampleBooks` in `src/app4.js`). "Connect" on banks only routes to upload.
**Needs:**
- `POST /companies/:id/statements` (file upload) with server-side parsing for K-Bank, SCB, Bangkok Bank, Krungsri, Krungthai, ttb formats (CSV, XLSX and PDF), de-duplication across overlapping uploads.
- Later: direct bank feeds (bank APIs or an aggregator) with `POST /companies/:id/bank-connections` and webhooks for new lines.
- Accounting connectors listed in Settings > Apps (FlowAccount, PEAK, Xero) and delivery platforms (GrabFood, LINE MAN, Shopee etc.) are UI only.
- **"No accounting software? Let ThuraGirl keep your books"** sits under Accounting wherever apps are listed (the connect sheet after sign-in, the setup checklist, Settings > Apps). Today it sets `u.setup.conn.tgbooks` and clears FlowAccount, PEAK and Xero (they are mutually exclusive). In production, choosing it means ThuraGirl processes the company's books on **ThuraGirl's own FlowAccount account**, as a hidden backend: create the company there, push categorised transactions, invoices and bills, and read back reports. Store `bookkeepingMode: "thuragirl" | "flowaccount" | "peak" | "xero"` per company (`PUT /companies/:id/bookkeeping-mode`). Never show FlowAccount to the user for this option.

## 8. Identity check: Sumsub
**Today:** not wired. Company verification is a certificate upload that keeps only the file name and size (`verifyBlock` in `src/app2.js`, shown in Settings by `src/app8.js`). Registration collects ID or passport numbers as text.
**Needs:** Sumsub WebSDK for directors and shareholders (Thai ID card or passport, liveness).
- `POST /kyc/token` returns a Sumsub access token for the SDK.
- `POST /webhooks/sumsub` receives review results; store status per person, show it in Settings and the registration flow.

## 9. Billing: Beam
**Today:** Settings > Plan shows Standard ฿1,999 and Pro ฿3,999, 14-day trial. "Continue to payment" only sets `u.plan` and `u.planPending` (`src/app8.js`).
**Needs:**
- `POST /billing/checkout` `{ plan }` returns a Beam hosted checkout URL (card and PromptPay). Card details never touch our pages.
- `POST /webhooks/beam` activates the plan, records invoices, handles failed renewals.
- `GET /billing` (plan, trial end, next charge, invoices), `POST /billing/cancel`, `POST /billing/switch`.
- Tax invoices for the subscription (VAT 7%).

## 10. File storage
**Today:** uploaded documents (statements, receipts, certificates, registration papers) keep only name and size. Invoices are drawn from local data.
**Needs:** object storage (S3-compatible, Thai or approved region) with signed upload and download URLs.
- `POST /files/upload-url` → `{ url, fileId }`, `GET /files/:id` → signed download URL, `DELETE /files/:id`.
- Virus scan, 10 MB limit (matches the UI), retention per Thai accounting law (5 years minimum).

## 11. Notifications: LINE and email
**Today:** Settings > Notifications stores choices in `u.notif` (tax, pay, late, week; channel LINE / Email / Both / None). Nothing is sent. "Share to LINE" uses the browser share sheet.
**Needs:**
- LINE Official Account + Messaging API; LINE Login to link a user (`POST /me/line/link`).
- Transactional email (e.g. SES, Postmark) for sign-up, password reset, deadlines, weekly summary, Review Pack.
- A scheduler that sends deadline reminders from the filings calendar, and the daily Morning Brief summary.
- Chat ("Ask ThuraGirl") answers today come from canned logic in `src/app5.js`. The real app needs the AI service behind `POST /companies/:id/chat`.

## 12. Auditor accounts and assignment
**Today:** `src/auditor.html` keeps everything locally:
- `tg.aud.users` (auditor accounts, salted hashes, CPA number, role lead/auditor, passkeys, TOTP), `tg.aud.session` (12-hour session).
- `tg.aud.assign` (company → auditor), written back into `tg.v2` as `u.auditor`.
- `tg.aud2` overrides: per company and period, document ticks (`ST`), filed forms (`FILED`), after-filing notes (`AFT`), closed months (`CLOSED`), triggers (`TRIG`). Key format `companyId|period|formId|itemId`, periods `YYYY-MM` or `FY<year>`.
- `tg.aud.samples` toggles demo companies.
**Needs:**
- Separate auditor auth (same passkey and TOTP endpoints with an `auditor` realm). Lead invites auditors: `POST /auditors/invite`, `POST /auditors/accept`.
- `GET /auditor/companies?scope=mine|unassigned|all`, `POST /auditor/companies/:id/assign { auditorId }` (lead only). ThuraGirl assigns the auditor; owners never pick one.
- `GET /auditor/companies/:id/filings?period=`, `PATCH .../filings/:formId { filed, filedAt, receiptFileId }`, `PATCH .../checklist/:itemId { done }`, `POST .../periods/:period/close`.
- Deadline calculation (`dueOf`, `fyEnd` in `src/auditor.html`) should move server-side so reminders and the auditor desk agree. Add Thai public holidays (today only weekends roll forward).
- Audit trail of every auditor action.

## 13. Real PDF data
**Today:** the Review Pack and P&L PDFs are drawn in the browser (`src/app86.js`) from the local figures, so their numbers are demo numbers whenever the sample is used.
**Needs:** generate PDFs from the ledger (server-side, or keep the client renderer and feed real data), and store each issued pack in file storage so the owner and auditor see the same document. Filing receipts from the Revenue Department e-Filing should be stored against each filing.

## 14. Things that are fine as they are
- All UI, copy, translations (EN/TH), day/night themes, layout and accessibility work.
- Statement parsing and categorising logic can be reused as a reference or kept client-side for preview.
- Deadline rules and the auditor checklist structure match the brief from the auditor review.
