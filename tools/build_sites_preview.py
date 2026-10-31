"""Assemble a non-deployed preview under a real GitHub Pages project base path."""
import shutil,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/rs-sites-preview')
for p in root.iterdir():
 if p.name.startswith('.') or p.name in ('docs','tools','scripts'):continue
 target=out/'rhythmspeaker'/p.name;target.parent.mkdir(parents=True,exist_ok=True)
 if p.is_dir():shutil.copytree(p,target,dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
 else:shutil.copy2(p,target)
print(out)
