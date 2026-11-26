# Product decisions so far

Decided by the product owner during v2 design. Build to these unless they are changed.

| Area | Decision |
|---|---|
| Identity checks | Use **Sumsub** for ID verification of directors and shareholders (Thai ID or passport, liveness). |
| Payments | Use **Beam** for subscription billing (card and PromptPay, hosted checkout). Omise and 2C2P were compared; Beam was chosen. |
| Plans | Standard ฿1,999 a month and Pro ฿3,999 a month, 14-day free trial, no charge until the trial ends. |
| Auditor | **ThuraGirl assigns the auditor.** Owners do not pick one, and the new-company registration form has no auditor fields. The lead auditor assigns companies on the auditor desk. |
| Existing companies | **Auto-pull company records from DBD** using the tax ID; the owner checks and confirms each line. |
| New companies | ThuraGirl registers the company with DBD (included in every plan). **No bank statement upload until the company is registered.** |
| No accounting software | Users without accounting software pick **"Let ThuraGirl keep your books"** instead of syncing. Behind the scenes ThuraGirl processes their books on its own FlowAccount account. This is hidden: the UI never mentions FlowAccount for this option. |
| Syncing new users | New users are nudged until they sync, because syncing is what fills the app. A Get started card (bank, books, sales apps) stays on Home, Finance and the Brief until the bank and the books are connected, with a daily reminder from day 2. It is hidden once they have synced. |
| Design | Option B: neutral greys plus one teal accent; red only for overdue text; amber only for stale items; pink only in the logo; thin line icons; no emoji. EN and TH, day and night. |
| Security | Passkey offered as the recommended sign-in; authenticator-app 2FA with backup codes for owners and auditors. Auditor sessions last 12 hours. |
| Versions | v1 lives in the `thuragirl` repository and is not touched. v2 is this repository. |
