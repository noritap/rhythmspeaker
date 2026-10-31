"""Audit static routes, base paths and protected-file preservation without network."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[1]
PAGES=['index.html']+[p+'/index.html' for p in ['trial','classes','instructors','about','access','faq','ecosystem','schedule','pricing']]
class Links(HTMLParser):
 def __init__(self):super().__init__();self.urls=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  for key in ['href','src']:
   if a.get(key):self.urls.append(a[key])
errors=[]
for page in PAGES:
 text=(ROOT/page).read_text();parser=Links();parser.feed(text)
 if '<h1' not in text:errors.append(page+': missing prerendered h1')
 if 'rel="canonical"' not in text:errors.append(page+': canonical missing')
 for url in parser.urls:
  u=urlsplit(url)
  if u.scheme or u.netloc or not u.path:continue
  p=(ROOT/unquote(u.path.removeprefix('/rhythmspeaker/'))) if u.path.startswith('/rhythmspeaker/') else ROOT/Path(page).parent/unquote(u.path)
  if p.is_dir():p=p/'index.html'
  if not p.exists():errors.append(f'{page}: broken {url}')
baseline=json.loads((ROOT/'docs/sites-migration/baseline.json').read_text())
for page,digest in baseline['protected'].items():
 if hashlib.sha256((ROOT/page).read_bytes()).hexdigest()!=digest:errors.append('protected file modified: '+page)
for path in ['assets/ux-lab/app.js','assets/ux-lab/class-finder.js']:
 subprocess.run(['node','--check',str(ROOT/path)],check=True)
if errors:raise SystemExit('\n'.join(errors))
print(f'PASS: {len(PAGES)} static pages, local URLs, scripts and {len(baseline["protected"])} protected file hashes.')
