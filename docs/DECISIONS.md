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
| Design | Option B: neutral greys plus one teal accent; red only for overdue text; amber only for stale items; pink only in the logo; thin line icons; no emoji. EN and TH, day and night. |
| Security | Passkey offered as the recommended sign-in; authenticator-app 2FA with backup codes for owners and auditors. Auditor sessions last 12 hours. |
| Versions | v1 lives in the `thuragirl` repository and is not touched. v2 is this repository. |
