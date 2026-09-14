#!/usr/bin/env python3
"""Maintainer-only sync from the authorized MyAIOS canonical seller profile."""
from pathlib import Path
import sys,hashlib,json
if len(sys.argv)!=2:raise SystemExit('Usage: python3 scripts/sync-profile.py <My-AI-OS-root>')
root=Path(__file__).resolve().parent.parent
source=Path(sys.argv[1])/'vault/Промпты/client-meeting-summary-deck/references/seller-skill.md'
body=source.read_bytes()
if not body.startswith(b'---\nname: itogi-vstrechi\n'):raise SystemExit('Unexpected canonical profile')
(root/'skill/itogi-vstrechi/SKILL.md').write_bytes(body)
p=root/'skill/itogi-vstrechi/references/version.json';v=json.loads(p.read_text());v['skillSha256']=hashlib.sha256(body).hexdigest();p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
print('Canonical seller profile synchronized; review product catalog before releasing a new version.')
