import { existsSync,readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execFileSync,spawnSync } from 'node:child_process';
import { ACCOUNT,assertWriter } from './core.mjs';
export async function resolveToken(primary,fallback){try{const t=await primary();if(t)return t;}catch(e){if(e.code==='ACCOUNT_MISMATCH')throw e;}return fallback();}
export async function accessToken(){
 const token=await resolveToken(async()=>{
  const path=join(homedir(),'.google_workspace_mcp','credentials',`${ACCOUNT}.json`);
  if(!existsSync(path))return null;
  const c=JSON.parse(readFileSync(path,'utf8'));
  if(!['https://oauth2.googleapis.com/token','https://accounts.google.com/o/oauth2/token'].includes(c.token_uri))return null;
  const r=await fetch(c.token_uri,{method:'POST',signal:AbortSignal.timeout(30000),headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:c.client_id,client_secret:c.client_secret,refresh_token:c.refresh_token,grant_type:'refresh_token'})});
  if(!r.ok)return null;return checkedToken((await r.json()).access_token);
 },async()=>{
  let candidate;try{candidate=execFileSync('gcloud',['auth','print-access-token',`--account=${ACCOUNT}`],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000,shell:process.platform==='win32'}).trim();}
  catch{throw Error('Нет Google-авторизации. Запустите node scripts/cloud.mjs login.');}
  return checkedToken(candidate);
 });
 return token;
}
async function checkedToken(token){
 if(!token)throw Error('Google не выдал токен.');
 const r=await fetch('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)',{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error(`Google Drive недоступен (${r.status}); нужна авторизация с Drive-доступом.`);
 assertWriter((await r.json()).user?.emailAddress);return token;
}

export function login(){
 const r=spawnSync('gcloud',['auth','login',ACCOUNT,'--enable-gdrive-access','--no-activate'],{stdio:'inherit',shell:process.platform==='win32'});
 if(r.error?.code==='ENOENT')throw Error('Установите Google Cloud CLI: https://cloud.google.com/sdk/docs/install — затем повторите login.');
 if(r.status!==0)throw Error('Авторизация Google не завершена.');
}
