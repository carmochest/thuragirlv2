#!/usr/bin/env python3
"""Build the public website for thuragirl.com into site/public/.

The landing page source lives in web/ (also served on the GitHub Pages test site at /web/).
This copies it to site/public/ and adds the files a real domain needs: security headers,
robots.txt, sitemap.xml and a 404 page. site/functions/ holds the early-access API.

Cloudflare Pages settings: root directory `site`, build command empty, output directory `public`.
Run from the repo root:  python3 src/build_site.py
"""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB, OUT = ROOT / "web", ROOT / "site" / "public"
DOMAIN = "https://thuragirl.com"

HEADERS = """/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *

/img/*
  Cache-Control: public, max-age=604800

/og.jpg
  Cache-Control: public, max-age=86400
"""

ROBOTS = f"""User-agent: *
Allow: /

Sitemap: {DOMAIN}/sitemap.xml
"""

SITEMAP = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>{DOMAIN}/</loc></url>
  <url><loc>{DOMAIN}/privacy/</loc></url>
</urlset>
"""

NOT_FOUND = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Page not found · ThuraGirl</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/fonts/fonts.css">
<style>
  :root{--bg:#F4F5F5;--ink:#0F1514;--mute:#5F6967;--accent:#0FBFB6;--pink:#EC4899}
  @media (prefers-color-scheme:dark){:root{--bg:#0B0E0E;--ink:#F1F4F3;--mute:#94A09D;--accent:#2DD4C8;--pink:#F472B6}}
  *{box-sizing:border-box;margin:0}
  body{min-height:100vh;display:grid;place-items:center;text-align:center;padding:24px 16px;background:var(--bg);color:var(--ink);font-family:"Manrope","Noto Sans Thai",system-ui,sans-serif}
  .logo{font-weight:800;font-size:22px;letter-spacing:-.04em} .logo i{font-style:normal;color:var(--pink)}
  h1{font-size:clamp(34px,7vw,52px);font-weight:800;letter-spacing:-.045em;margin-top:28px;line-height:1.1}
  p{color:var(--mute);margin-top:12px;font-size:17px;line-height:1.7}
  a.btn{display:inline-flex;align-items:center;height:52px;padding:0 26px;border-radius:999px;background:var(--accent);color:#04201D;font-weight:700;text-decoration:none;margin-top:28px}
</style>
</head>
<body>
<main>
  <div class="logo">thuragirl<i>.</i></div>
  <h1>This page isn't here.</h1>
  <p>ไม่พบหน้าที่คุณหา</p>
  <a class="btn" href="/">Go to thuragirl.com</a>
</main>
</body>
</html>
"""


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    shutil.copytree(WEB, OUT)
    (OUT / "_headers").write_text(HEADERS)
    (OUT / "robots.txt").write_text(ROBOTS)
    (OUT / "sitemap.xml").write_text(SITEMAP)
    (OUT / "404.html").write_text(NOT_FOUND)
    n = sum(1 for p in OUT.rglob("*") if p.is_file())
    print(f"site/public: {n} files")


if __name__ == "__main__":
    main()
