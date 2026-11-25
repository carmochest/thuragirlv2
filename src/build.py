"""Builds the ThuraGirl v2 test site. Run:  python3 src/build.py
Writes signup/, dashboard/, auditor/, assets/ and index.html next to src/."""
import re, os, shutil
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
def read(n): return open(os.path.join(HERE, n), encoding="utf-8").read()
def write(rel, txt):
    p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p), exist_ok=True); open(p, "w", encoding="utf-8").write(txt)
s = read("design-mock.html")
css = s[s.index("<style>") + 7 : s.index("</style>")]
sprite = s[s.index('<svg width="0" height="0"') : s.index('<div class="board">')].strip()
fonts = re.search(r'<link rel="stylesheet" href="([^"]+)">', s).group(1)
def cut(a, b):
    i = s.index(a); j = s.index(b, i); return s[i:j]
app = cut("        <!-- B · Midnight, with a day mode -->", "        <!-- B · Review Pack sheet -->")
review = cut("        <!-- B · Review Pack sheet -->", "        <!-- B · setup that follows signup -->")
setup = cut("        <!-- B · setup that follows signup -->", "        <!-- B · signup: verification handed to a third-party partner -->")
kyc = cut("        <!-- B · signup: verification handed to a third-party partner -->", "        <!-- C · Morning Brief -->")
def rep(txt, old, new, cnt=1):
    assert txt.count(old) == cnt, ("ANCHOR", old[:80], txt.count(old)); return txt.replace(old, new)
def rep1(txt, old, new):
    assert old in txt, ("ANCHOR1", old[:80]); return txt.replace(old, new, 1)

app = rep(app, '<div class="scr dB" data-d="b">', '<div class="scr dB" id="app" hidden>')
app = rep(app, '<div class="co"><b>BB</b><span>Bangkok Bites</span><svg class="i"><use href="#i-chev"/></svg></div>',
          '<button type="button" class="co" id="b-co" aria-label="Settings" title="Settings"><b id="b-co-i">BB</b><span id="b-co-n">Bangkok Bites</span><svg class="i"><use href="#i-chev"/></svg></button>')
i = app.index('            <div class="bkwrap">'); j = app.index('            <div class="circ">', i)
app = app[:i] + '            <div class="bkwrap"><button type="button" class="bkbar" id="b-bkbar" aria-expanded="false" aria-controls="b-bkpanel"></button><div class="bkpanel" id="b-bkpanel" hidden></div></div>\n' + app[j:]
app = rep(app, '<button type="button" class="pri"><i>', '<button type="button" class="pri js-upload"><i>')
app = rep(app, '<button type="button"><i><svg class="i"><use href="#i-doc"/></svg></i>Invoice</button>', '<button type="button" class="js-invoice"><i><svg class="i"><use href="#i-doc"/></svg></i>Invoice</button>')
app = rep(app, '<button type="button"><i><svg class="i"><use href="#i-pay"/></svg></i>Pay</button>', '<button type="button" class="js-pay"><i><svg class="i"><use href="#i-pay"/></svg></i>Pay</button>')
app = rep(app, '<div class="revB tk" id="b-rev">', '<div class="revB tk" id="b-rev" data-k="rev">')
for n in range(4):
    app = rep1(app, '<div class="row tk"><span class="ic">', '<div class="row tk" data-k="t%d"><span class="ic">' % n)
app = rep(app, "<b>You're all caught up</b><span>Nothing else needs you today.</span><button type=\"button\" id=\"b-reset\">Reset the preview</button>",
          '<b id="b-clear-t"></b><span id="b-clear-m"></span><button type="button" id="b-reset">Show the sample tasks again</button>')
EMPTY = '<svg class="tg" width="64" height="67"><use href="#tg"/></svg>'
UPBTN = '<div class="acts"><button type="button" class="pill acc js-upload"><svg class="i"><use href="#i-up"/></svg>Upload a statement</button><button type="button" class="pill soft js-sample">Try it with sample data</button></div>'
app = rep(app, '          <div class="dB-hero">\n            <div class="lab">Cash on hand</div>',
          '          <div class="emptyB">' + EMPTY + "<h1>Let's see your money.</h1><p>Upload a bank statement and I build your dashboard from it: your cash, money in and out, and what needs you.</p>" + UPBTN + '</div>\n          <div class="dB-hero">\n            <div class="lab">Cash on hand</div>')
app = rep(app, '<div class="pg brf" id="b-brief" hidden>\n', '<div class="pg brf" id="b-brief" hidden>\n            <div class="emptyP">' + EMPTY + "<h1>No brief yet.</h1><p>Your morning brief starts the day after I have a bank statement to read.</p>" + UPBTN + '</div>\n')
app = rep(app, '<div class="pg" id="b-money" hidden>\n', '<div class="pg" id="b-money" hidden>\n            <div class="emptyP">' + EMPTY + "<h1>Nothing to show yet.</h1><p>Money fills in once you upload a bank statement.</p>" + UPBTN + '</div>\n')
app = rep(app, 'Good morning, Nok. You have <b class="num">฿1,842,300</b> across KBank and SCB.', 'Good morning, <span id="br-name">Nok</span>. You have <b class="num">฿1,842,300</b> <span id="br-banks">in the bank</span>.')
app = rep(app, '<div class="t">KBank statement is 2 days old</div><div class="m">SCB synced 5 hours ago</div>', '<div class="t" id="br-bank-t"></div><div class="m" id="br-bank-m"></div>')
app = rep(app, '          <div class="dockB">', '          <div class="pg" id="b-settings" hidden></div>\n          <div class="pg" id="b-register" hidden></div>\n\n          <div class="dockB">')
kyc = rep(kyc, '<div class="kyc-f">Handled by a verification partner, not by ThuraGirl</div>',
          '<div class="kyc-f">In the live app a verification partner handles this step. In this test build the file never leaves your browser.</div>\n            <input type="file" id="kyc-cam" accept="image/*" capture="environment" hidden><input type="file" id="kyc-file" accept="image/*,application/pdf" hidden>')
upload = '''        <div class="shB" id="up-sheet" hidden>
          <div class="shB-card" role="dialog" aria-modal="true" aria-labelledby="up-t">
            <div class="shB-h">
              <div><div class="shB-k">Bank statement</div><h3 id="up-t">Upload a statement</h3><div class="shB-sub">CSV, Excel or PDF from your bank, up to 10 MB.</div></div>
              <button type="button" class="cb-btn shB-x" id="up-x" aria-label="Close"><svg class="i"><use href="#i-x"/></svg></button>
            </div>
            <div class="upf" id="up-body"></div>
            <input type="file" id="up-file" accept=".csv,.xlsx,.xls,.pdf,text/csv,application/pdf" hidden>
          </div>
        </div>
'''
HEAD = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<title>%s</title>
<link rel="icon" href="%sassets/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="%s">
'''
def page(name, title):
    return (HEAD % (title, "../", fonts)) + '''<link rel="stylesheet" href="../assets/app.css">
</head>
<body data-page="%s">
%s
<div class="stage">
  <div class="mock" id="mock" data-dir="b" data-mode="day">
        <div class="scr" id="scr-auth" hidden><div class="su" id="su"></div></div>
%s
%s
%s
%s
%s  </div>
</div>
<script src="../assets/app.js"></script>
</body>
</html>
''' % (name, sprite, app, review, setup, kyc, upload)
write("assets/app.css", css + "\n" + read("app.css") + "\n  .dockB[hidden],.toast[hidden],.alt[hidden]{display:none}\n")
write("assets/app.js", "".join(read(n) for n in sorted(os.listdir(HERE)) if re.match(r"app\d+\.js$", n)))
os.makedirs(os.path.join(ROOT, "assets", "vendor"), exist_ok=True)
for n in os.listdir(os.path.join(HERE, "vendor")): shutil.copy(os.path.join(HERE, "vendor", n), os.path.join(ROOT, "assets", "vendor", n))
shutil.copy(os.path.join(HERE, "favicon.svg"), os.path.join(ROOT, "assets", "favicon.svg"))
shutil.copy(os.path.join(HERE, "sample-kbank-statement.csv"), os.path.join(ROOT, "assets", "sample-kbank-statement.csv"))
write("signup/index.html", page("signup", "Sign up · ThuraGirl"))
write("dashboard/index.html", page("dashboard", "Dashboard · ThuraGirl"))
aud = read("auditor.html")
aud_title = re.search(r"<title>(.*?)</title>", aud).group(1)
aud = re.sub(r"<title>.*?</title>\s*<meta name=\"claude:viewport-fit-sides\"[^>]*>\s*<link rel=\"stylesheet\" href=\"([^\"]+)\">", "", aud, count=1, flags=re.S)
aud_fonts = re.search(r'family=DM\+Sans[^"]+', read("auditor.html")).group(0)
i = aud.index("<style>"); j = aud.index("</style>") + 8
write("auditor/index.html", (HEAD % ("Auditor · ThuraGirl", "../", "https://fonts.googleapis.com/css2?" + aud_fonts)) + aud[i:j] + "\n</head>\n<body>\n" + aud[j:].strip() + "\n</body>\n</html>\n")
hub = (HEAD % ("ThuraGirl v2 · test build", "", fonts)) + '''<style>
  :root{--bg:#F4F5F5;--surface:#fff;--ink:#0F1514;--mute:#667270;--line:#E2E6E5;--accent:#0FBFB6}
  @media (prefers-color-scheme:dark){:root{--bg:#0B0E0E;--surface:#151919;--ink:#F1F4F3;--mute:#98A4A1;--line:#293030;--accent:#2DD4C8}}
  *{box-sizing:border-box;margin:0}
  body{background:var(--bg);color:var(--ink);font-family:"Manrope",system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;min-height:100vh;display:grid;place-items:center;padding:24px 16px}
  main{width:min(100%,560px);display:grid;gap:22px}
  .b{font-weight:800;font-size:20px;letter-spacing:-.035em} .b i{font-style:normal;color:#EC4899}
  h1{font-size:clamp(30px,7vw,44px);font-weight:700;letter-spacing:-.04em;line-height:1.05}
  p{font-size:15.5px;line-height:1.55;color:var(--mute)}
  nav{display:grid;gap:10px}
  a{display:flex;align-items:center;justify-content:space-between;gap:14px;background:var(--surface);border-radius:22px;padding:18px 20px;color:inherit;text-decoration:none}
  a:hover{box-shadow:inset 0 0 0 1.5px var(--ink)} a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  a b{display:block;font-size:16.5px;font-weight:800;letter-spacing:-.02em} a span{display:block;font-size:13.5px;color:var(--mute);margin-top:3px}
  a em{font-style:normal;font:600 13px "DM Sans",sans-serif;color:var(--mute);white-space:nowrap}
</style>
</head>
<body>
<main>
  <div class="b">thuragirl<i>.</i></div>
  <div><h1>Version 2, test build</h1><p style="margin-top:10px">Three pages to try. Accounts and data are saved in your browser only, so use a made-up password.</p></div>
  <nav>
    <a href="signup/"><div><b>Sign up</b><span>Create an account and set up a company</span></div><em>/signup</em></a>
    <a href="dashboard/"><div><b>Dashboard</b><span>The owner's app: home, money, brief, settings</span></div><em>/dashboard</em></a>
    <a href="auditor/"><div><b>Auditor desk</b><span>Design mock with sample companies</span></div><em>/auditor</em></a>
  </nav>
</main>
</body>
</html>
'''
write("index.html", hub)
print("built into", ROOT)
