import { createHash } from 'node:crypto';
export const ACCOUNT='dep6.2@bbooster.io';
export const FOLDER='1kXTT8-O2vb8UpqdZEENyujUD3N2PP7R7';
export const SLIDES='application/vnd.google-apps.presentation';
export const PPTX='application/vnd.openxmlformats-officedocument.presentationml.presentation';
export const sha256=x=>createHash('sha256').update(x).digest('hex');
export function runKey(identity){
 if(typeof identity!=='string'||!identity.trim())throw Error('Укажите постоянный ID встречи: источник + точная дата/время.');
 return sha256(`${FOLDER}:${identity}`).slice(0,32);
}
export function selectExisting(files){
 if(files.length>1)throw Error('Найдено несколько презентаций этой встречи. Остановлено без создания дубля.');
 return files[0]??null;
}
export function assertWriter(email){if(email!==ACCOUNT)throw Object.assign(Error(`Нужен рабочий аккаунт ${ACCOUNT}. Другой аккаунт не используется.`),{code:'ACCOUNT_MISMATCH'});}
export function assertTarget(f,key){
 if(f.trashed||f.mimeType!==SLIDES||!f.parents?.includes(FOLDER)||(f.properties??f.appProperties)?.itogiRunKey!==key||(f.properties??f.appProperties)?.itogiSkill!=='v2')throw Error('Защита: файл не является презентацией этой встречи в рабочей папке.');
 if(!f.driveId&&!f.owners?.some(x=>x.emailAddress===ACCOUNT))throw Error('Неверный владелец презентации.');
}
export function assertRevision(current,baseline){
 if(!baseline||baseline.id!==current.id||baseline.modifiedTime!==current.modifiedTime)throw Object.assign(Error('Облачная версия изменилась или не экспортирована. Сначала export, сохраните ручные правки, затем повторите сборку.'),{code:'STALE_REVISION'});
}
function text(v,max,label){if(typeof v!=='string'||!v.trim()||v.length>max)throw Error(`${label}: нужен текст до ${max} символов. Сократите мысль или разделите слайд.`);}
export function validateDeck(d,cases){
 runKey(d.sourceIdentity);text(d.title,160,'Название');
 if(!Array.isArray(d.facts)||!Array.isArray(d.slides)||!d.slides.length||d.slides.length>30)throw Error('Нужны facts и от 1 до 30 slides.');
 const facts=new Map();
 for(const f of d.facts){text(f.id,100,'Fact ID');text(f.source,500,'Источник факта');if(facts.has(f.id))throw Error('Повтор Fact ID');facts.set(f.id,f);}
 for(const [i,s] of d.slides.entries()){
  text(s.title,100,`Заголовок ${i+1}`);
  if(!['title','bullets','case','table','steps'].includes(s.type))throw Error('Неизвестный макет');
  if(!s.evidence?.length)throw Error(`Слайд ${i+1}: нет evidence.`);
  for(const id of s.evidence){const f=facts.get(id);if(!f||!['VERIFIED','APPROVED','CONDITIONAL','EVIDENCE','DERIVED'].includes(f.status))throw Error(`Недопустимый факт ${id}`);if(f.status==='CONDITIONAL'&&!f.condition)throw Error('Условный факт без условия');}
  if(s.type==='title')text(s.body,300,'Текст обложки');
  if(['bullets','steps'].includes(s.type)){if(!Array.isArray(s.bullets)||s.bullets.length<1||s.bullets.length>3)throw Error('На слайде от 1 до 3 мыслей');s.bullets.forEach(x=>text(x,220,'Мысль'));}
  if(s.type==='case'){
   const c=cases.find(x=>x.id===s.caseId);if(!c)throw Error(`Неизвестный кейс ${s.caseId}`);
   text(s.application,190,'Связь с задачей клиента');
   if(s.result)throw Error('Числовой результат берётся только из каталога кейсов; произвольный result запрещён.');
  }
  if(s.type==='table'){
   if(!Array.isArray(s.rows)||!s.rows.length||s.rows.length>5||!Array.isArray(s.headers)||s.headers.length<2||s.headers.length>3)throw Error('Таблица: 2–3 колонки, 1–5 строк');
   s.headers.forEach(x=>text(x,60,'Заголовок таблицы'));for(const row of s.rows){if(row.length!==s.headers.length)throw Error('Размер строки');row.forEach(x=>text(x,100,'Ячейка'));}
  }
 }
 return d;
}
export function validateClaims(d,registry){
 const used=new Set(d.slides.flatMap(x=>x.evidence??[]));
 for(const f of d.facts.filter(x=>used.has(x.id))){
  if(f.owner==='OFFER'&&!f.claimId)throw Error('У продуктового факта должен быть claimId из реестра.');
  if(!f.claimId)continue;
  const c=registry.find(x=>x.id===f.claimId);
  if(!c||!['APPROVED','CONDITIONAL','EVIDENCE'].includes(c.status))throw Error(`Claim ${f.claimId} не разрешён в клиентском материале.`);
  if(c.validUntil && new Date().toISOString().slice(0,10)>c.validUntil)throw Error('Истёк срок календарного предложения. Новую дату не придумывать.');
  const visible=s=>[s.title,...(s.type==='title'?[s.body]:[]),...(['bullets','steps'].includes(s.type)?(s.bullets??[]):[]),...(s.type==='case'?[s.application]:[]),...(s.type==='table'?[...(s.headers??[]),...(s.rows??[]).flat()]:[])].filter(Boolean).join(' ').toLowerCase();
  for(const required of c.requiredVisibleText??[])if(!d.slides.filter(s=>s.evidence.includes(f.id)).every(s=>visible(s).includes(required.toLowerCase())))throw Error(`Claim ${c.id}: обязательная оговорка должна быть видима на слайде.`);
  if(c.id.startsWith('PRICE-')&&!d.commercialDiscussed)throw Error('Цена не обсуждалась на встрече.');
  if(c.status==='CONDITIONAL'){
   if(!f.condition||!d.slides.filter(x=>x.evidence.includes(f.id)).every(s=>visible(s).includes(f.condition.toLowerCase())))throw Error('Условие claim должно присутствовать в тексте слайда.');
  }
 }
}
