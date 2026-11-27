# Product decisions so far

Decided by the product owner during v2 design. Build to these unless they are changed.

| Area | Decision |
|---|---|
| Identity checks | Use **Didit** (replaced Sumsub on 27 Nov 2026) for ID verification of directors and shareholders (Thai ID or passport, liveness). |
| Payments | Use **Beam** for subscription billing (card and PromptPay, hosted checkout). Omise and 2C2P were compared; Beam was chosen. |
| Plans | Standard ฿1,999 a month and Pro ฿3,999 a month, 14-day free trial, no charge until the trial ends. |
| Auditor | **ThuraGirl assigns the auditor.** Owners do not pick one, and the new-company registration form has no auditor fields. The lead auditor assigns companies on the auditor desk. |
| Existing companies | **Auto-pull company records from DBD** using the tax ID; the owner checks and confirms each line. |
| New companies | ThuraGirl registers the company with DBD (included in every plan). **No bank statement upload until the company is registered.** |
| Books basis | Accrual, not cash. Sales count when invoiced, stock when used (month-end count), VAT/WHT/SSO are liabilities. Cash is shown separately and labelled as cash. Comparisons show both numbers, never a bare multiple. |
| Taxes | Each filing has a status: estimated, confirmed, filed, paid ("paid" only when the payment is in the bank). |
| Bills | Each bill is For resale (stock), Business expense or Equipment, editable while the month is open. A paid bill links to one bank line and is never counted twice. Service companies are not asked. |
| Auditor | ThuraGirl assigns it; the owner sees name, firm, CPA licence, email and phone and cannot choose. |
| Plans | Standard ฿1,999 (200 docs, 500 lines, 300 chats, 3 sign-ins, 10 payroll) and Pro ฿3,999 (1,000, 3,000, 1,500, 10, 50). Before VAT. 14-day trial, annual = 2 months free. |
| Sales by channel | The Finance donut and channel charts in chat show money received in the bank, VAT included, and say so. Revenue in the P&L is accrual and before VAT, so the two totals differ on purpose. |
| Company income tax | Taxes shows PND.50 as the full-year estimate; the balance sheet holds the part built up so far. |
| Accounting sync | Sync only to accounting software, **FlowAccount and PEAK** at launch. **No Odoo** and **no custom ERP sync**, because of the complexity. |
| No accounting software | Users without accounting software pick **"Let ThuraGirl keep your books"** instead of syncing. Behind the scenes ThuraGirl processes their books on its own FlowAccount account. This is hidden: the UI never mentions FlowAccount for this option. |
| Syncing new users | New users are nudged until they sync, because syncing is what fills the app. A Get started card (bank, books, sales apps) stays on Home, Finance and the Brief until the bank and the books are connected, with a daily reminder from day 2. It is hidden once they have synced. |
| Charts | Keep Finance clean: one "Sales by channel" donut (Month/Year). P&L detail is tap-to-drill (a donut plus top payees per line), not more charts on the page. Anything custom goes through chat, which answers with a chart that can be pinned to Finance. |
| Accounts | Owners can reset a forgotten password by email (30-minute link) and delete their own account from Settings → Security (PDPA). Filed tax records are kept for 5 years, then deleted. |
| Demo | The landing page offers "Try the demo": a sample restaurant with full books, no sign-up, with a "Create my account" strip on top. |
| Auditor demo | `/auditor/` stays behind the auditor sign-in. The sign-in page offers "Try the demo", which opens the desk with sample companies only. |
| Morning Brief | Stays a separate mode, not the landing page. It should feel like being briefed, then it's gone: fresh each morning (unread dot), tucks into a slim "Today's brief" strip on Home once read, becomes "Today so far" from noon and a "Day wrap" from 5 pm, and resets overnight with yesterday under "Past briefs", browsable by date. One brief per day. One closing action ("Got it"); no other tuck controls. When everything on the list is done, the Home strip confirms once and disappears. |
| Settings | Two pages, never mixed: Company settings (this company: records, team, apps, files, plan) and Your account (the person: profile, notifications, security, language, theme). The company menu must fit one phone screen without scrolling. |
| Auditor desk | One list of companies, grouped and filtered by the next action (needs attention, documents missing, documents requested, ready to close). A company opens in a focused view, because auditors work on one company at a time. |
| Updates in place | Actions refresh the page without jumping to the top or replaying the entrance animation. |
| Design | Option B: neutral greys plus one teal accent; red only for overdue text; amber only for stale items; pink only in the logo; thin line icons; no emoji. EN and TH, day and night, including the auditor pages and the landing screenshots. |
| Security | Passkey offered as the recommended sign-in; authenticator-app 2FA with backup codes for owners and auditors. Auditor sessions last 12 hours. |
| Versions | v1 lives in the `thuragirl` repository and is not touched. v2 is this repository. |
