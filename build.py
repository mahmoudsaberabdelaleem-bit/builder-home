#!/usr/bin/env python3
"""Rebuild SITE_URL-dependent files: run `python3 build.py` after changing site_url in site.config.json."""
import json,os,re,subprocess,datetime
R=os.path.dirname(os.path.abspath(__file__));os.chdir(R)
C=json.load(open("site.config.json",encoding="utf-8"))
new=C["site_url"].rstrip("/")+"/";old=C["built_url"].rstrip("/")+"/"
pages=[]
for dp,dn,fn in os.walk("."):
    if ".git" in dp:continue
    for f in fn:
        p=os.path.join(dp,f)[2:]
        if f.endswith((".html",".xml",".txt",".json",".js")) and p not in("site.config.json",) and not p.startswith("data/"):
            s=open(p,encoding="utf-8",errors="ignore").read()
            if old!=new and old in s:open(p,"w",encoding="utf-8").write(s.replace(old,new))
        if f=="index.html" or f.endswith(".html"):pages.append(p)
def is_stub(p):return 'http-equiv="refresh"' in open(p,encoding="utf-8").read(2000)
PRI={"index.html":"1.0","tools/index.html":"0.9","prices/index.html":"0.9","services/index.html":"0.8","articles/index.html":"0.8"}
urls=[]
for p in sorted(pages):
    if p.startswith("googlea") or is_stub(p):continue
    loc=new+(p[:-len("index.html")] if p.endswith("index.html") else p)
    try:
        d=subprocess.check_output(["git","log","-1","--format=%cs","--",p],text=True).strip()
    except Exception:d=""
    d=d or datetime.date.today().isoformat()
    urls.append(f"  <url><loc>{loc}</loc><lastmod>{d}</lastmod><priority>{PRI.get(p,'0.6')}</priority></url>")
open("sitemap.xml","w",encoding="utf-8").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+"\n".join(urls)+"\n</urlset>\n")
open("robots.txt","w").write(f"User-agent: *\nAllow: /\n\nSitemap: {new}sitemap.xml\n")
C["built_url"]=new;json.dump(C,open("site.config.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
print("pages in sitemap:",len(urls))
