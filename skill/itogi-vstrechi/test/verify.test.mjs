import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,writeFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import JSZip from 'jszip';import {PDFDocument} from 'pdf-lib';import {verify} from '../scripts/verify.mjs';
test('structural QA checks PDF and native text but never declares visual acceptance',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'itogi-verify-'));const doc=await PDFDocument.create();doc.addPage();writeFileSync(join(dir,'cloud.pdf'),await doc.save());const zip=new JSZip();zip.file('ppt/slides/slide1.xml','<a:t>Editable title</a:t>');writeFileSync(join(dir,'cloud.pptx'),await zip.generateAsync({type:'nodebuffer'}));
 const r=await verify(dir,1);assert.equal(r.visualQA,'pending');assert.equal(r.structuralQA,'passed');await assert.rejects(verify(dir,2),/Число страниц/);
 zip.file('ppt/slides/slide1.xml','<p:pic>Full slide raster</p:pic>');writeFileSync(join(dir,'cloud.pptx'),await zip.generateAsync({type:'nodebuffer'}));await assert.rejects(verify(dir,1),/редактируемого текста/);
});
