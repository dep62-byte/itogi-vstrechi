import test from 'node:test';import assert from 'node:assert/strict';import JSZip from 'jszip';import {mkdtempSync,writeFileSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
const m=await import('../scripts/patch.mjs').catch(()=>({}));
test('patch preserves unrelated manual text and escapes replacement XML',async()=>{
 assert.equal(typeof m.patch,'function');const dir=mkdtempSync(join(tmpdir(),'itogi-patch-'));const z=new JSZip();z.file('ppt/slides/slide1.xml','<a:t>Manual seller edit</a:t><a:t>Old title</a:t>');const src=join(dir,'cloud.pptx'),out=join(dir,'next.pptx');writeFileSync(src,await z.generateAsync({type:'nodebuffer'}));
 await m.patch(src,[{from:'Old title',to:'New & checked'}],out);const q=await JSZip.loadAsync(readFileSync(out));const xml=await q.file('ppt/slides/slide1.xml').async('string');assert.ok(xml.includes('Manual seller edit'));assert.ok(xml.includes('New &amp; checked'));
 await assert.rejects(m.patch(src,[{from:'not present',to:'replacement'}],out));
});
