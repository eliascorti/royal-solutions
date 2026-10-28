const assert = require('node:assert/strict');
module.exports = async ({page, context, check, ids}) => {
  const ready = async (app, route) => {
    await page.goto(`http://127.0.0.1:5501/${app}.html#${route}`);
    await page.waitForFunction(() => document.querySelector('#screen .view') && !document.querySelector('#screen .sk'));
  };
  await check('Acceso directo: dos apps funcionales, sin portada ni presentación', async () => {
    const fresh = await context.browser().newContext({viewport:{width:1440,height:1000}});
    const home = await fresh.newPage();
    await home.goto('http://127.0.0.1:5501/');
    for(const name of ['App cliente','App prestador']) {
      const f=home.frameLocator(`iframe[title="${name}"]`);
      await f.locator('#tabbar a').first().waitFor();
      await f.locator('#screen .sk').first().waitFor({state:'hidden'});
      await f.locator('#screen h2').first().waitFor();
      assert.equal(await f.locator('.onb').count(),0);
      assert(await f.locator('.appbar .logo img').evaluate(img=>img.complete && img.naturalWidth>0));
      assert(!/MVP avanzado|Ver alcance/.test(await f.locator('body').innerText()));
    }
    assert.equal(await home.getByRole('link',{name:/Abrir app/}).count(),2);
    assert.equal(await home.getByRole('link',{name:/exposición|alcance|admin/i}).count(),0);
    assert(!/Oficios y changas cerca tuyo, con reputación/.test(await home.locator('body').innerText()));
    await home.screenshot({path:'test-results/apps-inicio.png',fullPage:true,animations:'disabled'});
    await home.setViewportSize({width:390,height:844});
    await home.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth);
    assert(await home.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await home.goto('http://127.0.0.1:5501/presentacion.html');
    await home.waitForURL(/5501\/$/);
    await fresh.close();
  });
  await check('Prestador: edición de rubros independiente, sin riesgo ni comisión ni horarios', async () => {
    await ready('prestador','/perfil');
    assert.equal(await page.locator('[data-act="__theme"],#tabbar a[href="#/billetera"]').count(),0);
    await page.locator('[data-go="/perfil/rubros"]').click();
    await page.locator('#ds').waitFor();
    assert(!/riesgo|comisión|disponibilidad|dónde trabajás|zona y horarios/i.test(await page.locator('#screen').innerText()));
    const desc=await page.locator('#ds').inputValue();
    await page.locator('#ds').fill(desc+' Prueba de edición.');
    await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
    await page.waitForURL(/#\/perfil$/);
    await ready('prestador','/perfil/rubros');
    assert.equal(await page.locator('#ds').inputValue(),desc+' Prueba de edición.');
    await page.locator('#ds').fill(desc);
    await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
    await page.waitForURL(/#\/perfil$/);
  });
  await check('Prestador: detalle limpio, reputación sin órdenes ni cancelaciones tardías', async () => {
    await ready('prestador',`/trabajo/${ids.rid}`);
    assert.equal(await page.locator('#appbar .title').innerText(),'');
    assert(!/SOL-\d+|Comisión Royal|postulados|después de la comisión/i.test(await page.locator('#screen').innerText()));
    await ready('prestador','/reputacion');
    assert(!/ORD-\d+|Cancelaciones tardías/i.test(await page.locator('#screen').innerText()));
    await ready('prestador','/billetera');
    await page.waitForURL(/#\/trabajos$/);
  });
  await check('Agenda diaria: oculta franjas fuera de disponibilidad y conserva reservas', async () => {
    const original = await page.evaluate(async () => {
      const S=await import('./js/store.js'); const p=S.providerByUser(S.getSession('prestador'));
      const copy=structuredClone(p.disponibilidad); S.saveProviderDraft(p.userId,{disponibilidad:{}});return copy;
    });
    await ready('prestador','/agenda');
    assert.equal(await page.getByRole('button',{name:'Semana',exact:true}).count(),0);
    assert(!/Franja bloqueada/.test(await page.locator('#screen').innerText()));
    const expected=await page.evaluate(async()=>{const S=await import('./js/store.js');return S.ordersOfProvider(S.providerByUser(S.getSession('prestador')).id).filter(o=>['confirmada','pendiente_confirmacion'].includes(o.estado)&&(o.asap?S.isoDate(o.creadoEn):o.fecha)===S.isoDate(S.now())).length;});
    assert.equal(await page.locator('#screen .slot .active-order').count(),expected);
    await page.evaluate(async disp=>{const S=await import('./js/store.js');S.saveProviderDraft(S.getSession('prestador'),{disponibilidad:disp});},original);
  });
  await check('Cliente: historial consultable y perfil sin avisos ni recontratación', async () => {
    for(const route of ['/inicio','/mis-changas?tab=historial',`/orden/${ids.oid}`,'/perfil','/perfil/pagos']) {
      await ready('cliente',route);
      assert(!/Volver a contratar|Comisión de 3 a 5%, sin abonos|Los datos de la tarjeta van directo/.test(await page.locator('#screen').innerText()));
      assert.equal(await page.locator('[data-act="__theme"]').count(),0);
    }
  });
  await check('Ambos roles: modo claro y accesos Entrar como + nombre al cerrar sesión', async () => {
    for(const app of ['cliente','prestador']) {
      await page.evaluate(app=>localStorage.setItem(`rs_theme_${app}`,'dark'),app);
      await ready(app,'/perfil');
      assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
      await page.locator('[data-act="__logout"]').click();
      await page.waitForSelector('[data-quick]');
      for(const label of await page.locator('[data-quick]').allTextContents())assert.match(label.trim(),/^Entrar como [\p{L}]+$/u);
      await page.locator('[data-quick]').first().click();
      await page.waitForURL(app==='cliente'?/#\/inicio$/:/#\/trabajos$/);
    }
  });
};
