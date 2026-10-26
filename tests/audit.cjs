const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { mkdirSync, writeFileSync } = require('node:fs');
const results = [];
(async () => {
  const browser = await chromium.launch({ channel: process.env.TEST_BROWSER || 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => { errors.push({url:page.url(),stack:e.stack});console.log('JS ERROR',page.url(),e.stack); });
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5501/cliente.html');
  page.setDefaultTimeout(5000);
  await page.waitForSelector('#screen');
  async function check(name, fn) {
    try { await fn(); results.push({ name, ok: true }); console.log('PASS', name); }
    catch (e) { results.push({ name, ok: false, error: e.message }); console.log('FAIL', name, e.message); }
  }
  await check('Estados de orden respaldados por CU-13/14/15/17/21', async () => {
    const states = await page.evaluate(async () => Object.keys((await import('./js/store.js')).ESTADOS.order));
    assert.deepEqual(states.sort(), ['pendiente_confirmacion','confirmada','rechazada','vencida','cancelada','finalizada','en_revision'].sort());
  });
  await check('CU-17: finalizar desde confirmada, confirmar efectivo, una sola comisión', async () => {
    const out = await page.evaluate(async () => {
      const S = await import('./js/store.js'); S.resetAll();
      const u = S.getDb().users.find(u => u.email === 'lucia@demo.com');
      const p = S.providerByUser(S.getDb().users.find(u => u.email === 'ramiro@demo.com').id);
      const pa = { id: p.userId, rol: 'prestador' }, ca = { id: u.id, rol: 'cliente' };
      const o = S.hireDirect(u.id,p.id,{rubroId:'plomeria',descripcion:'Arreglo de canilla',direccion:u.direcciones[0],fecha:S.isoDate(S.now()+40*86400000),franja:'manana',precio:30000,medio:'efectivo'});
      S.acceptOrder(o.id,pa); S.finishOrder(o.id,30000,pa);
      const before = S.order(o.id).estado; S.confirmCash(o.id,ca);
      let duplicated = false; try { S.confirmCash(o.id,ca); duplicated = true; } catch {}
      return { before, after:S.order(o.id).estado, count:S.getDb().ledger.filter(m=>m.orderId===o.id&&m.tipo==='deuda_efectivo').length, duplicated };
    });
    assert.deepEqual(out, { before:'confirmada',after:'finalizada',count:1,duplicated:false });
  });
  await check('CU-10: filtros documentados incluyen tags', async () => {
    await page.evaluate(async () => { const S=await import('./js/store.js');S.login('lucia@demo.com','demo1234','cliente');localStorage.setItem('rs_onboarding_done_cliente','1'); });
    await page.goto('http://127.0.0.1:5501/cliente.html#/buscar');
    await page.getByRole('button',{name:'Filtros',exact:true}).click();
    await page.waitForSelector('#ft');
    assert(!await page.getByText('Responde más rápido',{exact:true}).count());
    await page.locator('[data-apply]').click();
  });
  const model = await context.newPage();
  await model.goto('http://127.0.0.1:5501/index.html');
  for (const [name, fn] of require('./domain-cases.cjs')) await check(name, async () => {
    await model.evaluate(async source => {
      const S=await import('./js/store.js');S.resetAll();
      const u=S.getDb().users.find(u=>u.email==='lucia@demo.com');
      const p=S.providerByUser(S.getDb().users.find(u=>u.email==='ramiro@demo.com').id);
      const ca={id:u.id,rol:'cliente'},pa={id:p.userId,rol:'prestador'},aa={id:S.getDb().users.find(u=>u.roles.includes('admin')).id,rol:'admin'};
      const requestData={rubroId:'plomeria',descripcion:'Pierde agua la canilla',direccion:u.direcciones[0],cuando:{tipo:'programado',fecha:S.isoDate(S.now()+40*86400000),franja:'manana'},medio:'efectivo',sinAutoPostulaciones:true};
      const mk=(medio='efectivo')=>S.hireDirect(u.id,p.id,{...requestData,fecha:requestData.cuando.fecha,franja:'manana',precio:30000,medio});
      const ok=(v)=>{if(!v)throw new Error('No se cumple la condición esperada');};
      const fail=(f)=>{let thrown=false;try{f();}catch{thrown=true;}ok(thrown);};
      (new Function('f',`return (${source})(f)`))({S,u,p,ca,pa,aa,mk,requestData,ok,fail});
    }, fn.toString());
  });
  await model.close();
  await check('CU-04 · Onboarding después del acceso, omitir y no repetir', async () => {
    await page.goto('http://127.0.0.1:5501/cliente.html#/login');
    await page.evaluate(async()=>{const S=await import('./js/store.js');S.resetAll();});
    await page.reload();
    assert.equal(await page.locator('.onb').count(),0);
    await page.locator('[data-quick="lucia@demo.com"]').click();
    await page.locator('[data-skip]').click();
    await page.reload();await page.waitForSelector('.view');assert.equal(await page.locator('.onb').count(),0);
  });
  let ids;
  await check('Preparar recorrido cliente-prestador-administrador', async()=>{
    ids=await page.evaluate(async()=>{
      const S=await import('./js/store.js');S.resetAll();
      const u=S.getDb().users.find(u=>u.email==='lucia@demo.com');
      const p=S.providerByUser(S.getDb().users.find(u=>u.email==='ramiro@demo.com').id);
      S.setSession('cliente',u.id);S.setSession('prestador',p.userId);S.setSession('admin',S.getDb().users.find(u=>u.roles.includes('admin')).id);
      localStorage.setItem('rs_onboarding_done_cliente','1');localStorage.setItem('rs_onboarding_done_prestador','1');
      const o=S.hireDirect(u.id,p.id,{rubroId:'plomeria',descripcion:'Prueba visual del pago',direccion:u.direcciones[0],fecha:S.isoDate(S.now()+40*86400000),franja:'manana',precio:30000,medio:'efectivo'});
      S.acceptOrder(o.id,{id:p.userId,rol:'prestador'});S.finishOrder(o.id,30000,{id:p.userId,rol:'prestador'});
      return {pid:p.id,uid:u.id,oid:o.id,rid:S.getDb().requests.find(r=>r.rubroId==='plomeria').id};
    });
  });
  await check('Pago: un único selector, sin garantía ni código de inicio inventados',async()=>{
    await page.goto(`http://127.0.0.1:5501/cliente.html#/pago/${ids.oid}`);
    await page.waitForSelector('#mm');assert.equal(await page.locator('#mm').count(),1);
    assert.equal(await page.getByText('Garantía',{exact:true}).count(),0);
    await page.goto(`http://127.0.0.1:5501/cliente.html#/orden/${ids.oid}`);
    await page.waitForSelector('.timeline');assert(!await page.getByText('Tu código de inicio',{exact:true}).count());
  });
  const routes={
    cliente:['/inicio','/buscar','/buscar?vista=mapa','/publicar/1','/publicar/2','/publicar/3','/publicar/resumen',`/changa/${ids.rid}`,`/prestador/${ids.pid}`,`/contratar/${ids.pid}`,'/mis-changas',`/orden/${ids.oid}`,`/pago/${ids.oid}`,`/calificar/${ids.oid}`,'/perfil','/perfil/datos','/perfil/pagos','/perfil/direcciones','/perfil/notificaciones','/favoritos','/mensajes','/notificaciones'],
    prestador:['/trabajos',`/trabajo/${ids.rid}`,`/orden/${ids.oid}`,'/agenda','/historial','/billetera','/reputacion','/perfil','/documentos','/alta','/alta/1','/alta/2','/alta/3','/alta/4','/alta/5','/mensajes','/notificaciones'],
    admin:['/usuarios',`/usuarios/${ids.uid}`,'/verificaciones',`/verificaciones/${ids.pid}`,'/ordenes',`/ordenes/${ids.oid}`,'/disputas','/resenas','/comisiones']
  };
  for(const [app,paths]of Object.entries(routes))await check(`Pantallas ${app}: ${paths.length} rutas sin fallos de render`,async()=>{
    for(const path of paths){
      await page.goto(`http://127.0.0.1:5501/${app}.html#${path}`);
      await page.waitForSelector(app==='admin'?'#content':'#screen .view');
      if(app!=='admin'){
        await page.waitForFunction(()=>document.querySelector('#screen .view')&&!document.querySelector('#screen .sk'));
        assert.equal(await page.locator('.scope-notice').count(),0);
      }
      const text=await page.locator(app==='admin'?'#content':'#screen').innerText();
      assert(!text.includes('No pudimos cargar esta pantalla'),`${app}${path}: ${text}`);
      assert(!/undefined|\bNaN\b/.test(text),`${app}${path}: valor sin resolver`);
      assert.equal(await page.locator('.ic').evaluateAll(nodes=>nodes.filter(n=>n.querySelector('title')?.textContent==='missing').length),0);
    }
  });
  await check('Presentación: cuatro integrantes, matriz completa y filtro',async()=>{
    await page.setViewportSize({width:1440,height:1000});
    await page.goto('http://127.0.0.1:5501/presentacion.html');await page.waitForSelector('#features tr');
    assert.equal(await page.locator('#equipo article').count(),4);
    assert.equal(await page.locator('#features tr').count(),67);
    await page.selectOption('#scope','MVP');assert.equal(await page.locator('#features tr').count(),29);
    await page.selectOption('#scope','');
    mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/presentacion.png',fullPage:true});
  });
  await check('Recorrido real por interfaz: publicar → postular → contratar → cobrar → calificar ambos',async()=>{
    await page.goto('http://127.0.0.1:5501/index.html');
    await require('./ui-flow.cjs')(context);
  });
  await check('Sin errores JavaScript', async () => assert.deepEqual(errors, []));
  await check('CU-07 · PDF conserva el archivo y no lo sustituye por un certificado ficticio',async()=>{
    const result=await page.evaluate(async()=>{const U=await import('./js/ui.js');const r=await U.readImage(new File(['%PDF-1.4 contenido de prueba'],'certificado.pdf',{type:'application/pdf'}));return {preserved:r.dataUrl?.startsWith('data:application/pdf;base64,'),viewer:U.docImage({archivo:r.dataUrl},null,'').startsWith('<object')};});
    assert.deepEqual(result,{preserved:true,viewer:true});
  });
  mkdirSync('test-results',{recursive:true});
  writeFileSync('test-results/audit.json', JSON.stringify(results,null,2));
  await browser.close();
  if(results.some(r=>!r.ok)) process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
