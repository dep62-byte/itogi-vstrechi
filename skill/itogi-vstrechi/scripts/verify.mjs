import JSZip from 'jszip';import {PDFDocument} from 'pdf-lib';
import {readFileSync,writeFileSync} from 'node:fs';import {join,resolve} from 'node:path';import {pathToFileURL} from 'node:url';import {sha256} from './core.mjs';
export async function verify(dir,expected){
 expected=Number(expected);if(!Number.isInteger(expected)||expected<1)throw Error('Нужно ожидаемое число страниц.');
 const pdfBytes=readFileSync(join(dir,'cloud.pdf')),pptxBytes=readFileSync(join(dir,'cloud.pptx'));
 const pdf=await PDFDocument.load(pdfBytes);if(pdf.getPageCount()!==expected)throw Error('Число страниц PDF не совпадает с планом.');
 const zip=await JSZip.loadAsync(pptxBytes);
 const slides=Object.keys(zip.files).filter(p=>/^ppt\/slides\/slide\d+\.xml$/.test(p));if(slides.length!==expected)throw Error('Число слайдов PPTX не совпадает с планом.');
 for(const name of slides){const xml=await zip.file(name).async('string');if(!/<a:t>[^<]+<\/a:t>/.test(xml))throw Error('Обнаружен слайд без редактируемого текста.');}
 const r={pages:expected,pdfSha256:sha256(pdfBytes),pptxSha256:sha256(pptxBytes),structuralQA:'passed',visualQA:'pending',state:'PROVISIONAL_CLOUD_QA'};
 writeFileSync(join(dir,'qa-structure.json'),JSON.stringify(r,null,2));return r;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)verify(...process.argv.slice(2)).then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(e.message);process.exitCode=1;});
