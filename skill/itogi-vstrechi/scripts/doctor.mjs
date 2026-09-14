import {existsSync,readFileSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {join} from 'node:path';import {spawnSync} from 'node:child_process';import {sha256} from './core.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));let ok=true;
function report(name,ready){console.log(`${ready?'OK':'MISSING'} ${name}`);if(!ready)ok=false;}
report('Node >=20',Number(process.versions.node.split('.')[0])>=20);
report('PPTX library',existsSync(join(root,'node_modules/pptxgenjs')));
for(const c of JSON.parse(readFileSync(join(root,'references/cases.json'),'utf8')).filter(c=>c.image))report(`case ${c.id}`,existsSync(join(root,c.image))&&sha256(readFileSync(join(root,c.image)))===c.sha256);
for(const tool of ['gcloud','pdftoppm']){
 const r=spawnSync(tool,['--version'],{stdio:'ignore',shell:process.platform==='win32'});
 console.log(`${r.error?'OPTIONAL MISSING':'AVAILABLE'} ${tool}`);
}
console.log('Google: node scripts/cloud.mjs check. Missing optional tools do not permit skipping visual QA.');if(!ok)process.exitCode=1;
