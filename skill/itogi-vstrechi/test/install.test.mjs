import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
const m=await import('../../../scripts/install.mjs').catch(()=>({}));
test('installer copies full self-contained skill and refuses unmanaged directory',()=>{
 assert.equal(typeof m.copySkill,'function');
 const dir=mkdtempSync(join(tmpdir(),'itogi-install-'));const target=join(dir,'itogi-vstrechi');m.copySkill(target);
 assert.ok(readFileSync(join(target,'scripts/cloud.mjs'),'utf8').includes('class Drive'));
 assert.ok(readFileSync(join(target,'references/cases.json'),'utf8').includes('nrop'));
 assert.throws(()=>m.copySkill(target));
 const other=join(dir,'other');mkdirSync(other);writeFileSync(join(other,'SKILL.md'),'user-owned');assert.throws(()=>m.copySkill(other));
});
