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
config=json.loads((ROOT/'data/class-reservation-source.json').read_text())
if config.get('releaseStatus')=='production_manual_inquiry':
 if config.get('mode')!='live' or config.get('path')!='data/class-sessions.public.json':errors.append('Production cannot use sample source')
 for page in PAGES:
  html=(ROOT/page).read_text()
  if 'noindex' in html or 'MIGRATION PREVIEW' in html:errors.append(page+': review metadata left in production')
 public=json.loads((ROOT/'data/class-sessions.public.json').read_text())
 if any(s.get('source')!='live' for s in public['sessions']):errors.append('Sample session in production')
baseline=json.loads((ROOT/'docs/sites-migration/baseline.json').read_text())
# Preserve the immutable original protected SHA-256 baseline. Owner-approved copy-only
# revisions must be explicitly pinned to a content-addressed Git blob SHA-1.
copy_revisions=json.loads((ROOT/'docs/sites-migration/approved-copy-revisions.json').read_text())
approved=copy_revisions.get('blobSha1',{})
if copy_revisions.get('schemaVersion')!=1:errors.append('invalid copy revisions manifest')
for page,git_sha in approved.items():
 if page not in baseline['protected'] or not page.endswith('.html') or len(git_sha)!=40:
  errors.append('unexpected protected-copy override: '+page)
for page,digest in baseline['protected'].items():
 payload=(ROOT/page).read_bytes()
 original_ok=hashlib.sha256(payload).hexdigest()==digest
 git_blob=hashlib.sha1(b'blob '+str(len(payload)).encode()+b'\x00'+payload).hexdigest()
 approved_ok=page in approved and approved[page]==git_blob
 if not original_ok and not approved_ok:errors.append('protected file modified: '+page)
for path in ['assets/ux-lab/app.js','assets/ux-lab/class-finder.js']:
 subprocess.run(['node','--check',str(ROOT/path)],check=True)
if errors:raise SystemExit('\n'.join(errors))
print(f'PASS: {len(PAGES)} static pages, local URLs, scripts and {len(baseline["protected"])} protected file hashes.')
