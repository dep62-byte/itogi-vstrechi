import { readFileSync,writeFileSync,mkdirSync,existsSync,rmSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { accessToken,login } from './auth.mjs';
import { ACCOUNT,FOLDER,SLIDES,PPTX,runKey,sha256,selectExisting,assertTarget,assertRevision } from './core.mjs';
const FIELDS='id,name,mimeType,parents,driveId,owners(emailAddress),appProperties,properties,modifiedTime,trashed,webViewLink';
export class Drive {
 constructor(token,fetcher=fetch){this.token=token;this.fetcher=fetcher;}
 async request(path,options={}){
  const r=await this.fetcher(`https://www.googleapis.com/${path}`,{...options,signal:AbortSignal.timeout(120000),headers:{Authorization:`Bearer ${this.token}`,...options.headers}});
  if(!r.ok)throw Error(`Google Drive: HTTP ${r.status}. Повторите export/check; новый файл автоматически не создаётся.`);
  return r;
 }
 async json(path,options){return (await this.request(path,options)).json();}
 async metadata(id){if(!/^[A-Za-z0-9_-]+$/.test(id))throw Error('Неверный Drive ID');return this.json(`drive/v3/files/${id}?supportsAllDrives=true&fields=${FIELDS}`);}
 async find(key){
  const folder=await this.metadata(FOLDER);let files=[],pageToken;
  do{
   const p=new URLSearchParams({q:`'${FOLDER}' in parents and trashed = false and (properties has { key='itogiRunKey' and value='${key}' } or appProperties has { key='itogiRunKey' and value='${key}' })`,fields:`nextPageToken,incompleteSearch,files(${FIELDS})`,pageSize:'100',supportsAllDrives:'true',includeItemsFromAllDrives:'true'});
   if(folder.driveId){p.set('corpora','drive');p.set('driveId',folder.driveId);}if(pageToken)p.set('pageToken',pageToken);
   const r=await this.json(`drive/v3/files?${p}`);if(r.incompleteSearch)throw Error('Неполный поиск: создание дубля заблокировано.');files.push(...r.files);pageToken=r.nextPageToken;
  }while(pageToken);
  return selectExisting(files);
 }
 async export(id,dir){
  rmSync(join(dir,'baseline.json'),{force:true});
  for(let attempt=0;attempt<3;attempt++){
   try{return await this.exportOnce(id,dir);}catch(e){if(e.code!=='STALE_REVISION'||attempt===2)throw e;await new Promise(r=>setTimeout(r,1000));}
  }
 }
 async exportOnce(id,dir){
  const before=await this.metadata(id);
  assertTarget(before,(before.properties??before.appProperties)?.itogiRunKey);
  mkdirSync(dir,{recursive:true});
  for(const [mime,name] of [['application/pdf','cloud.pdf'],[PPTX,'cloud.pptx']]){
   const r=await this.request(`drive/v3/files/${id}/export?mimeType=${encodeURIComponent(mime)}`);
   writeFileSync(join(dir,name),Buffer.from(await r.arrayBuffer()));
  }
  const after=await this.metadata(id);assertRevision(after,before);
  const receipt={id:after.id,modifiedTime:after.modifiedTime,runKey:(after.properties??after.appProperties).itogiRunKey,pptxSha256:sha256(readFileSync(join(dir,'cloud.pptx'))),pdfSha256:sha256(readFileSync(join(dir,'cloud.pdf')))};
  writeFileSync(join(dir,'baseline.json'),JSON.stringify(receipt,null,2));return receipt;
 }
 async upload(pptxPath,title,identity,baselinePath){
  const key=runKey(identity);const existing=await this.find(key);let baseline;
  if(existing){
   assertTarget(existing,key);
   baseline=baselinePath?JSON.parse(readFileSync(baselinePath,'utf8')):null;
   assertRevision(existing,baseline);
   const source=resolve(baselinePath,'..','cloud.pptx');
   if(!existsSync(source)||sha256(readFileSync(source))!==baseline.pptxSha256)throw Error('Последний облачный PPTX отсутствует или изменён. Экспортируйте повторно.');
   // Recheck immediately before write. Google Drive media conversion has no revision transaction.
   assertRevision(await this.metadata(existing.id),baseline);
  }
  const metadata={name:title,mimeType:SLIDES,properties:{itogiRunKey:key,itogiSkill:'v2'}};
  if(!existing)metadata.parents=[FOLDER];
  const boundary=`itogi_${randomUUID()}`;
  const body=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${PPTX}\r\n\r\n`),readFileSync(pptxPath),Buffer.from(`\r\n--${boundary}--\r\n`)]);
  const result=await this.json(`upload/drive/v3/files${existing?'/'+existing.id:''}?uploadType=multipart&supportsAllDrives=true&fields=${FIELDS}`,{method:existing?'PATCH':'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body});
  assertTarget(result,key);
  const receipt={id:result.id,url:result.webViewLink,operation:existing?'updated':'created',sourceIdentity:identity,runKey:key,modifiedTime:result.modifiedTime,state:'PROVISIONAL_CLOUD_QA'};
  writeFileSync(`${pptxPath}.cloud.json`,JSON.stringify(receipt,null,2));return receipt;
 }
}
async function main(){
 const [cmd,...args]=process.argv.slice(2);
 if(cmd==='login'){login();return;}
 if(!['check','upload','export'].includes(cmd))throw Error('Usage: cloud.mjs check | login | upload <pptx> <title> <meeting-id> [baseline.json] | export <id> <directory>');
 const d=new Drive(await accessToken());
 if(cmd==='check'){const f=await d.metadata(FOLDER);console.log(JSON.stringify({account:ACCOUNT,folder:f.id,ready:true}));}
 if(cmd==='upload'){if(args.length<3)throw Error('Нужны PPTX, title, meeting-id');console.log(JSON.stringify(await d.upload(...args)));}
 if(cmd==='export'){if(args.length!==2)throw Error('Нужны ID и папка');console.log(JSON.stringify(await d.export(...args)));}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
