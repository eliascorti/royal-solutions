// Exporta la misma presentación navegable. No requiere modificar los PDF originales.
const {chromium}=require('playwright');
const {mkdirSync}=require('node:fs');
(async()=>{
  const browser=await chromium.launch({channel:process.env.TEST_BROWSER||'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto('http://127.0.0.1:5501/presentacion.html');
  await page.waitForSelector('#features tr');
  await page.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));
  await page.addStyleTag({content:'@media print{.grid{display:block}.block{margin-bottom:14px}section{break-inside:auto}h2,h3{break-after:avoid}p,li{orphans:3;widows:3}thead{display:table-header-group}td,th{overflow-wrap:anywhere}a{color:inherit;text-decoration:none}.k{color:#555}}'});
  mkdirSync('output/pdf',{recursive:true});mkdirSync('test-results',{recursive:true});
  await page.pdf({path:'output/pdf/Royal_Solutions_Defensa_MVP.pdf',format:'A4',printBackground:true,margin:{top:'16mm',right:'14mm',bottom:'18mm',left:'14mm'},displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font-size:9px;width:100%;padding:0 45px;color:#666">Royal Solutions · Corti / Cavanna / Reinante / Turchi <span style="float:right"><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'});
  await page.screenshot({path:'test-results/presentacion-escritorio.png'});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'test-results/presentacion-movil.png'});
  await browser.close();console.log('PDF y vistas exportados.');
})().catch(e=>{console.error(e);process.exitCode=1;});
