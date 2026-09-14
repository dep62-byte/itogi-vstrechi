import JSZip from 'jszip';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {dirname,resolve} from 'node:path';import {pathToFileURL} from 'node:url';
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export async function patch(input,changes,out){
 if(!Array.isArray(changes)||!changes.length)throw Error('Нужен массив {from,to}');
 const zip=await JSZip.loadAsync(readFileSync(input));
 for(const c of changes){
  if(typeof c.from!=='string'||!c.from||typeof c.to!=='string')throw Error('Нужны непустой from и строка to');
  let matches=0;const source=`<a:t>${escape(c.from)}</a:t>`;
  for(const name of Object.keys(zip.files).filter(x=>/^ppt\/(slides|notesSlides)\/.*\.xml$/.test(x))){
   const xml=await zip.file(name).async('string');matches+=xml.split(source).length-1;
   zip.file(name,xml.replaceAll(source,`<a:t>${escape(c.to)}</a:t>`));
  }
  if(matches===0)throw Error('Точный текст не найден отдельным текстовым элементом. Используйте редактор PPTX; не пересобирайте из старой версии.');
 }
 mkdirSync(dirname(resolve(out)),{recursive:true});writeFileSync(out,await zip.generateAsync({type:'nodebuffer'}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const [input,changes,out]=process.argv.slice(2);if(!out){console.error('Usage: patch.mjs <cloud.pptx> <changes.json> <output.pptx>');process.exitCode=1;}else patch(input,JSON.parse(readFileSync(changes,'utf8')),out).catch(e=>{console.error(e.message);process.exitCode=1;});}
