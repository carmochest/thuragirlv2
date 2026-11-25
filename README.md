# ThuraGirl v2 (test build)

A second, separate version of the ThuraGirl front end, for testing the new design. The original site lives in the `thuragirl` repository and is not touched by this one.

| Address | What it is |
|---|---|
| `/signup/` | Create an account and set up a company (registered or brand new). Also the sign-in page. |
| `/dashboard/` | The owner's app: home, money, morning brief, settings and company registration. |
| `/auditor/` | Design mock of the auditor desk, with sample companies. |

## Good to know

- This is a front end only. Accounts and data are saved in the tester's browser (`localStorage`, key `tg.v2`). Nothing is sent to a server and it is not connected to the production backend.
- Document steps check the file type and the 10 MB limit, and keep only the file's name and size.
- Dashboard figures after a statement upload are demo data.

## Changing it

Everything in `signup/`, `dashboard/`, `auditor/`, `assets/` and `index.html` is generated. Edit the files in `src/` and run:

```
python3 src/build.py
```

- `src/design-mock.html`: the approved design. Styles, icons and markup come from here.
- `src/app.css`, `src/app1.js`, `src/app2.js`, `src/app3.js`: the working app.
- `src/auditor.html`: the auditor desk.
