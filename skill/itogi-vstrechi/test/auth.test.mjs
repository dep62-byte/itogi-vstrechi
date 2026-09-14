import test from 'node:test';import assert from 'node:assert/strict';
const m=await import('../scripts/auth.mjs');
test('expired MCP credentials fall back to independently authenticated gcloud',async()=>{
 assert.equal(typeof m.resolveToken,'function');
 assert.equal(await m.resolveToken(async()=>{throw Error('expired')},()=> 'gcloud-token'),'gcloud-token');
});
test('wrong-account failure must not be hidden by fallback',async()=>{
 let fallback=false;
 await assert.rejects(m.resolveToken(async()=>{throw Object.assign(Error('wrong account'),{code:'ACCOUNT_MISMATCH'})},()=>{fallback=true;return 'other';}),/wrong account/);
 assert.equal(fallback,false);
});
