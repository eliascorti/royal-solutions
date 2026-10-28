// Herramienta de documentación: una única lámina vectorial del DER completo.
const fs=require('node:fs');
const {instance}=require('../tmp/der-tools/node_modules/@viz-js/viz');
const {chromium}=require('playwright');
(async()=>{
 const viz=await instance();
 const svg=viz.renderString(fs.readFileSync('docs/poc/der/completo.dot','utf8'),{format:'svg',engine:'dot'});
 fs.mkdirSync('output/der',{recursive:true});fs.mkdirSync('tmp/pdfs',{recursive:true});
 fs.writeFileSync('output/der/DER_Completo.svg',svg);
 const clean=svg.slice(svg.indexOf('<svg')).replace(/width="[^"]+" height="[^"]+"/,'width="100%" height="100%"');
 const browser=await chromium.launch({channel:process.env.TEST_BROWSER||'msedge',headless:true});
 const page=await browser.newPage();
 await page.setContent(`<html><head><meta charset="utf-8"><style>@page{size:841mm 594mm;margin:15mm}body{margin:0;font:14px Arial;color:#174765}h1{font-size:30px;margin:0 0 6px}p{margin:0 0 8px;color:#485e70}.diagram{height:521mm;width:811mm}svg{width:100%;height:100%}</style></head><body><h1>16. Diagrama Entidad-Relación (DER) - Royal Solutions</h1><p>Modelo completo · 25 entidades · 40 relaciones · PK: clave primaria · FK: clave foránea · UK: única · Cardinalidades: 1, 0..1, 0..N, 0..2</p><div class="diagram">${clean}</div><p>Cada entidad aparece una sola vez. Los números en cada extremo indican cuántas entidades de ese extremo corresponden a una del extremo opuesto. Modelo lógico; la POC conserva los datos en el navegador.</p></body></html>`);
 await page.pdf({path:'tmp/pdfs/der-completo.pdf',width:'841mm',height:'594mm',printBackground:true,preferCSSPageSize:true});
 await browser.close();console.log('DER completo: una lámina vectorial A1');
})().catch(e=>{console.error(e);process.exitCode=1});
