import test from 'node:test';import assert from 'node:assert/strict';
const m=await import('../scripts/core.mjs');
test('commercial claims require a known approved registry ID, discussed price and visible condition',()=>{
 assert.equal(typeof m.validateClaims,'function');
 const registry=[{id:'PRICE-1',status:'APPROVED'},{id:'PRICE-4',status:'SELLER_ONLY'},{id:'PROD-1',status:'CONDITIONAL'}];
 const base={facts:[{id:'p',owner:'OFFER',claimId:'PRICE-1',source:'meeting:10',status:'APPROVED'}],slides:[{evidence:['p']}]};
 assert.throws(()=>m.validateClaims(base,registry));
 assert.doesNotThrow(()=>m.validateClaims({...base,commercialDiscussed:true},registry));
 assert.throws(()=>m.validateClaims({...base,commercialDiscussed:true,facts:[{...base.facts[0],claimId:'PRICE-4'}]},registry));
 assert.throws(()=>m.validateClaims({...base,commercialDiscussed:true,facts:[{...base.facts[0],claimId:'UNKNOWN'}]},registry));
 assert.throws(()=>m.validateClaims({...base,facts:[{...base.facts[0],claimId:'PROD-1'}]},registry));
});
test('required qualifiers must be visible, not in notes, and expired calendar offers are refused',()=>{
 const registry=[{id:'PRICE-3',status:'APPROVED',requiredVisibleText:['по ТЗ']},{id:'CAL-2',status:'APPROVED',validUntil:'2026-09-10'}];
 const base={commercialDiscussed:true,facts:[{id:'p',owner:'OFFER',claimId:'PRICE-3'}],slides:[{type:'bullets',title:'Условия',bullets:['По согласованию'],notes:'по ТЗ',evidence:['p']}]};
 assert.throws(()=>m.validateClaims(base,registry));
 assert.doesNotThrow(()=>m.validateClaims({...base,slides:[{...base.slides[0],bullets:['Состав и стоимость по ТЗ']}]},registry));
 assert.throws(()=>m.validateClaims({...base,facts:[{id:'p',owner:'OFFER',claimId:'CAL-2'}]},registry));
});
test('qualifier in a non-rendered field does not satisfy claim',()=>{
 const d={commercialDiscussed:true,facts:[{id:'p',owner:'OFFER',claimId:'PRICE-3'}],slides:[{type:'bullets',title:'Условия',bullets:['От $37 000 за год'],body:'по ТЗ',evidence:['p']}]};
 assert.throws(()=>m.validateClaims(d,[{id:'PRICE-3',status:'APPROVED',requiredVisibleText:['по ТЗ']}]));
});
