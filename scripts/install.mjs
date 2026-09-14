import {cpSync,mkdirSync,existsSync,writeFileSync,readFileSync,renameSync,rmSync} from 'node:fs';
import {homedir} from 'node:os';import {resolve,dirname,join} from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {spawnSync} from 'node:child_process';
const SOURCE=fileURLToPath(new URL('../skill/itogi-vstrechi',import.meta.url));
export function copySkill(target){
 if(existsSync(target))throw Error('Целевая папка уже существует. Ручной скилл не перезаписан.');
 mkdirSync(dirname(target),{recursive:true});
 cpSync(SOURCE,target,{recursive:true,filter:src=>!src.split(/[\\/]/).some(x=>['node_modules','test'].includes(x))});
 writeFileSync(join(target,'.itogi-managed'),'itogi-vstrechi-v2\n');
}
function main(){
 const [engine='codex',custom]=process.argv.slice(2);
 if(!['codex','claude','directory'].includes(engine))throw Error('Usage: node scripts/install.mjs codex|claude|directory [path]');
 if(Number(process.versions.node.split('.')[0])<20)throw Error('Нужен Node.js 20 или новее.');
 if(engine==='directory'&&!custom)throw Error('Укажите путь установки.');
 const target=engine==='directory'?resolve(custom):join(homedir(),`.${engine}`,'skills','itogi-vstrechi');
 const staging=target+`.install-${Date.now()}`;
 if(existsSync(target)&&(!existsSync(join(target,'.itogi-managed'))||readFileSync(join(target,'.itogi-managed'),'utf8').trim()!=='itogi-vstrechi-v2'))throw Error('В этой папке ручная версия скилла. Она не перезаписана.');
 copySkill(staging);
 const result=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['ci','--ignore-scripts','--no-audit','--no-fund'],{cwd:staging,stdio:'inherit',shell:process.platform==='win32'});
 if(result.status!==0){rmSync(staging,{recursive:true});throw Error('Не удалось установить зависимости. Предыдущая версия сохранена.');}
 if(existsSync(target)){
  const backup=join(homedir(),'.local','share','itogi-vstrechi','backups',String(Date.now()));mkdirSync(dirname(backup),{recursive:true});renameSync(target,backup);
 }
 renameSync(staging,target);
 console.log(`Установлено: ${target}\nОткройте новую задачу в ${engine==='directory'?'Codex или Claude':engine}. Скилл: itogi-vstrechi.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)try{main()}catch(e){console.error(e.message);process.exitCode=1;}
