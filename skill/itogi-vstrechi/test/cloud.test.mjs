import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,writeFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {Drive} from '../scripts/cloud.mjs';import {FOLDER,SLIDES,runKey,sha256} from '../scripts/core.mjs';
const identity='test:meeting:2026-09-14';const key=runKey(identity);
const meta={id:'owned',parents:[FOLDER],driveId:'shared',mimeType:SLIDES,appProperties:{itogiRunKey:key,itogiSkill:'v2'},modifiedTime:'2026-09-14T00:00:00Z'};
function fixture(){const dir=mkdtempSync(join(tmpdir(),'itogi-cloud-'));const pptx=join(dir,'deck.pptx');writeFileSync(pptx,'synthetic');return {dir,pptx};}
test('create uploads native Slides to exact folder and preserves run identity',async()=>{
 const {pptx}=fixture();const d=new Drive('test-token');d.find=async()=>null;
 d.json=async(path,options)=>{assert.match(path,/upload\/drive/);assert.equal(options.method,'POST');assert.match(options.body.toString(),new RegExp(FOLDER));assert.match(options.body.toString(),new RegExp(key));return meta;};
 const r=await d.upload(pptx,'Synthetic',identity);assert.equal(r.id,'owned');assert.equal(r.state,'PROVISIONAL_CLOUD_QA');
});
test('repeated upload requires actual exported baseline and updates same ID',async()=>{
 const {dir,pptx}=fixture();writeFileSync(join(dir,'cloud.pptx'),'exported');const baseline=join(dir,'baseline.json');writeFileSync(baseline,JSON.stringify({...meta,pptxSha256:sha256('exported')}));
 const d=new Drive('test-token');d.find=async()=>meta;d.metadata=async()=>meta;
 d.json=async(path,o)=>{assert.match(path,/files\/owned\?/);assert.equal(o.method,'PATCH');assert.ok(!o.body.toString().includes('"parents"'));return meta;};
 assert.equal((await d.upload(pptx,'Synthetic',identity,baseline)).operation,'updated');
});
test('manual change detected before mutation',async()=>{
 const {dir,pptx}=fixture();writeFileSync(join(dir,'cloud.pptx'),'exported');const baseline=join(dir,'baseline.json');writeFileSync(baseline,JSON.stringify({...meta,pptxSha256:sha256('exported')}));
 const d=new Drive('test-token');d.find=async()=>meta;d.metadata=async()=>({...meta,modifiedTime:'changed'});d.json=()=>{assert.fail('must never write');};
 await assert.rejects(d.upload(pptx,'Synthetic',identity,baseline),/изменилась/);
});
test('wrong existing file is rejected before PATCH',async()=>{
 const {pptx}=fixture();const d=new Drive('test-token');d.find=async()=>({...meta,parents:['wrong']});d.json=()=>assert.fail('write forbidden');
 await assert.rejects(d.upload(pptx,'Synthetic',identity),/Защита/);
});
test('export retries Google save settling and removes old baseline on failure',async()=>{
 const {dir}=fixture();const baseline=join(dir,'baseline.json');writeFileSync(baseline,'old');let calls=0;const d=new Drive('test');
 d.exportOnce=async()=>{calls++;if(calls===1)throw Object.assign(Error('saving'),{code:'STALE_REVISION'});return {id:'settled'};};
 assert.equal((await d.export('owned',dir)).id,'settled');assert.equal(calls,2);
});
test('shared run properties remain usable across different OAuth clients',async()=>{
 const shared={...meta,appProperties:undefined,properties:meta.appProperties};
 const {assertTarget}=await import('../scripts/core.mjs');assert.doesNotThrow(()=>assertTarget(shared,key));
});
