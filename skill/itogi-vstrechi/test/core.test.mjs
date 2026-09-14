import test from 'node:test';
import assert from 'node:assert/strict';
const core = await import('../scripts/core.mjs').catch(()=>({}));
test('source identity is required and stable across title changes',()=>{
 assert.equal(typeof core.runKey,'function');
 assert.throws(()=>core.runKey(''));
 assert.equal(core.runKey('meeting:2026-09-14T10:00Z'),core.runKey('meeting:2026-09-14T10:00Z'));
});
test('never choose ambiguously matching presentations',()=>{
 assert.equal(typeof core.selectExisting,'function');
 assert.equal(core.selectExisting([]),null);
 assert.throws(()=>core.selectExisting([{id:'a'},{id:'b'}]));
});
test('cloud revision protection rejects update without current export or after a manual edit',()=>{
 assert.equal(typeof core.assertRevision,'function');
 assert.throws(()=>core.assertRevision({id:'x',modifiedTime:'new'},null));
 assert.throws(()=>core.assertRevision({id:'x',modifiedTime:'new'},{id:'x',modifiedTime:'old'}));
 assert.doesNotThrow(()=>core.assertRevision({id:'x',modifiedTime:'new'},{id:'x',modifiedTime:'new'}));
});
test('wrong writer/folder/protected template rejected',()=>{
 assert.equal(typeof core.assertWriter,'function');
 assert.throws(()=>core.assertWriter('someone@example.org'));
 assert.doesNotThrow(()=>core.assertWriter('dep6.2@bbooster.io'));
 assert.throws(()=>core.assertTarget({id:'other',parents:['elsewhere'],mimeType:'application/vnd.google-apps.presentation',appProperties:{itogiRunKey:'run'}},'run'));
});
test('deck input requires evidence; missing/oversized text and unknown case rejected',()=>{
 assert.equal(typeof core.validateDeck,'function');
 const sample={sourceIdentity:'synthetic:1',title:'Пример',facts:[{id:'f1',source:'demo:1',status:'VERIFIED'}],slides:[{type:'title',title:'Пример',body:'Демонстрация',evidence:['f1']}]};
 assert.doesNotThrow(()=>core.validateDeck(sample,[]));
 assert.throws(()=>core.validateDeck({...sample,slides:[{type:'bullets',title:'Задачи',bullets:['x']} ]},[]));
 assert.throws(()=>core.validateDeck({...sample,slides:[{type:'case',title:'Кейс',caseId:'missing',evidence:['f1']}]},[]));
 assert.throws(()=>core.validateDeck({...sample,slides:[{...sample.slides[0],title:'x'.repeat(160)}]},[]));
});
