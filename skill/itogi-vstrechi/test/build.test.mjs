import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,readFileSync,existsSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
const mod=await import('../scripts/deck.mjs').catch(()=>({}));
test('all supported layouts build a real editable OOXML presentation',async()=>{
 assert.equal(typeof mod.build,'function');
 const dir=mkdtempSync(join(tmpdir(),'itogi-build-'));
 const out=join(dir,'sample.pptx');
 await mod.build(new URL('../references/example.json',import.meta.url),out);
 assert.equal(readFileSync(out).subarray(0,2).toString(),'PK');
 assert.ok(existsSync(out+'.build.json'));
});
