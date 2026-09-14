#!/usr/bin/env python3
"""Deterministic release ZIP: only explicitly allowed code/docs/assets, never work or credentials."""
from pathlib import Path
import zipfile, hashlib, json
root=Path(__file__).resolve().parent.parent
version=json.loads((root/'skill/itogi-vstrechi/package.json').read_text())['version']
out=root/'dist';out.mkdir(exist_ok=True)
files=[]
for rel in ['README.md','AGENTS.md','scripts/install.mjs']:
 files.append(root/rel)
for folder in ['skill/itogi-vstrechi','docs']:
 for p in (root/folder).rglob('*'):
  rel=p.relative_to(root)
  if p.is_file() and not p.is_symlink() and not any(x in {'node_modules'} for x in rel.parts):files.append(p)
path=out/f'itogi-vstrechi-v{version}.zip'
with zipfile.ZipFile(path,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(files):
  info=zipfile.ZipInfo(str(p.relative_to(root)),(2026,9,14,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16;z.writestr(info,p.read_bytes())
(out/'SHA256SUMS').write_text(hashlib.sha256(path.read_bytes()).hexdigest()+'  '+path.name+'\n')
print(path)
