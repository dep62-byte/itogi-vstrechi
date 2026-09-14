import pptxgen from 'pptxgenjs';
import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { resolve,dirname,join } from 'node:path';
import { validateDeck,validateClaims,sha256 } from './core.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const C={bg:'FAF9F6',ink:'1A1A1A',muted:'6E6E6E',yellow:'FFD335',soft:'FFF3C4'};
export async function build(input,out){
 const d=JSON.parse(readFileSync(input,'utf8'));
 const cases=JSON.parse(readFileSync(join(ROOT,'references/cases.json'),'utf8'));
 validateDeck(d,cases);
 validateClaims(d,JSON.parse(readFileSync(join(ROOT,'references/claims.json'),'utf8')));
 const pptx=new pptxgen();pptx.layout='LAYOUT_WIDE';pptx.author='Business Booster';pptx.subject='Итоги встречи';pptx.title=d.title;pptx.company='Business Booster';pptx.lang='ru-RU';
 pptx.theme={headFontFace:'Arial',bodyFontFace:'Arial',lang:'ru-RU'};
 function text(s,value,x,y,w,h,size=22,extra={}){s.addText(value,{x,y,w,h,fontFace:'Arial',fontSize:size,color:C.ink,margin:0,breakLine:false,paraSpaceAfterPt:10,vertAnchor:'top',...extra});}
 for(const [i,item] of d.slides.entries()){
  const s=pptx.addSlide();s.background={color:C.bg};
  s.addShape(pptx.ShapeType.rect,{x:.7,y:.55,w:.65,h:.08,line:{color:C.yellow},fill:{color:C.yellow}});
  text(s,item.title,.7,.88,11.9,1.25,item.type==='title'?44:36,{bold:true});
  if(item.type==='title'){
   text(s,item.body,.75,2.8,10.8,2.1,28);
   s.addShape(pptx.ShapeType.rect,{x:.75,y:5.55,w:11.8,h:.55,line:{color:C.yellow},fill:{color:C.yellow}});
   text(s,'Business Booster',.95,5.65,10,.3,18,{bold:true});
  }
  if(['bullets','steps'].includes(item.type))item.bullets.forEach((b,j)=>{
   const y=2.4+j*1.32;
   text(s,String(j+1).padStart(2,'0'),.75,y,.85,.7,32,{bold:true,color:C.muted});
   text(s,b,1.95,y,10.55,1.1,24);
  });
  if(item.type==='case'){
   const c=cases.find(x=>x.id===item.caseId);
   if(c.image){
    const p=join(ROOT,c.image);if(sha256(readFileSync(p))!==c.sha256)throw Error(`Изображение кейса ${c.id} изменено без обновления каталога.`);
    const ratio=Math.min(8.05/c.width,3.95/c.height);
    const w=c.width*ratio,h=c.height*ratio;
    s.addImage({path:p,x:.7+(8.05-w)/2,y:2.1+(3.95-h)/2,w,h});
    text(s,'Что делает',9.15,2.25,3.45,.45,22,{bold:true});
    text(s,c.function,9.15,2.85,3.45,1.65,21);
    text(s,c.boundary,9.15,4.8,3.45,1.25,16,{color:C.muted});
   }else{
    text(s,c.function,.8,2.4,11.6,1.55,28);
    text(s,'Пример участника программы. Оригинал изображения не включён в библиотеку.',.8,4.2,11.6,.8,20,{color:C.muted});
   }
   text(s,item.application,.75,6.25,11.8,.7,20);
  }
  if(item.type==='table'){
   s.addTable([item.headers.map(x=>({text:x,options:{bold:true,fill:C.yellow}})),...item.rows],{x:.75,y:2.4,w:11.8,colW:Array(item.headers.length).fill(11.8/item.headers.length),rowH:.7,fontFace:'Arial',fontSize:20,color:C.ink,border:{pt:1,color:'DDDDDD'},margin:.14,autoPage:false});
  }
  text(s,`${i+1} / ${d.slides.length}`,11.85,7.1,.75,.2,11,{color:C.muted,align:'right'});
  s.addNotes(`Источники: ${item.evidence.join(', ')}. ${item.notes??''}`);
 }
 mkdirSync(dirname(resolve(out)),{recursive:true});await pptx.writeFile({fileName:out});
 const r={slideCount:d.slides.length,sourceIdentity:d.sourceIdentity,pptxSha256:sha256(readFileSync(out)),state:'LOCAL_BUILD',visualQA:'pending'};
 writeFileSync(out+'.build.json',JSON.stringify(r,null,2));return r;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [cmd,input,out]=process.argv.slice(2);
 if(cmd!=='build'||!input||!out){console.error('Usage: deck.mjs build <deck.json> <output.pptx>');process.exitCode=1;}else build(input,out).then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(e.message);process.exitCode=1;});
}
