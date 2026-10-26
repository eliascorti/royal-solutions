module.exports = [
  ['CU-01 · Registro, duplicados y datos inválidos', ({ S, ok, fail }) => {
    const data={nombre:'Ana',apellido:'Prueba',telefono:'3425551234',email:'ana.prueba@example.test',pass:'prueba1234',barrio:'centro'};
    const u=S.register(data);ok(u.roles.includes('cliente'));fail(()=>S.register(data));fail(()=>S.register({...data,email:'invalido'}));
  }],
  ['CU-02 · Login, bloqueo persistente y cuenta suspendida', ({ S, u, ok, fail }) => {
    for(let i=0;i<5;i++)fail(()=>S.login(u.email,'incorrecta','cliente'));
    S.load();fail(()=>S.login(u.email,'demo1234','cliente'));ok(S.user(u.id).bloqueoHasta>S.now());
    S.user(u.id).bloqueoHasta=0;S.user(u.id).estado='suspendido';fail(()=>S.login(u.email,'demo1234','cliente'));
  }],
  ['CU-03 · Recupero genérico, enlace de un solo uso e invalidación de sesiones', ({ S, u, ok, fail }) => {
    S.login(u.email,'demo1234','cliente');ok(S.requestPasswordReset('no-existe@example.test')===true);
    S.requestPasswordReset(u.email);const t=S.getDb().resets.at(-1).token;
    S.resetPassword(t,'nueva1234');ok(!S.getSession('cliente'));fail(()=>S.resetPassword(t,'otra1234'));
    ok(S.login(u.email,'nueva1234','cliente').id===u.id);
  }],
  ['CU-05 · Perfil y protección de cambios sensibles', ({ S, u, ok, fail }) => {
    S.updateProfile(u.id,{telefono:'3425554567'});ok(S.user(u.id).telefono==='3425554567');
    fail(()=>S.updateProfile(u.id,{email:'nuevo@example.test'},'incorrecta'));
    S.updateProfile(u.id,{email:'nuevo@example.test'},'demo1234');ok(S.user(u.id).email==='nuevo@example.test');
  }],
  ['CU-06 · Alta incompleta, documentación, revisión y activación', ({ S, ok, fail }) => {
    const u=S.register({nombre:'Prueba',apellido:'Alta',telefono:'3425554321',email:'alta@example.test',pass:'demo1234'});
    S.setIdentity(u.id,{nombre:'Prueba',apellido:'Alta',telefono:'3425554321',dni:'48000111'});
    const p=S.saveProviderDraft(u.id,{rubros:['electricidad'],tags:['Tableros'],descripcion:'Electricista de prueba',barrios:['centro'],disponibilidad:{lun:['manana']}});
    fail(()=>S.submitProvider(p.id));
    for(const d of S.requiredDocs(p)) S.uploadDoc(p.id,{...d,simulado:true,numero:'DEMO-123',entidad:'Entidad de ejemplo',vence:S.now()+365*86400000});
    S.submitProvider(p.id);ok(S.provider(p.id).estado==='pendiente_revision');
    S.adminProvider(p.id,'aprobar',{}, {rol:'admin',id:S.getDb().users.find(u=>u.roles.includes('admin')).id});
    ok(S.canApply(S.provider(p.id)).ok);
  }],
  ['CU-07 · Certificados: formato, tamaño, datos y rechazo', ({ S, p, aa, ok, fail }) => {
    fail(()=>S.uploadDoc(p.id,{tipo:'matricula',rubroId:'gas',mime:'text/plain'}));
    fail(()=>S.uploadDoc(p.id,{tipo:'matricula',rubroId:'gas',mime:'image/png',kb:6000}));
    fail(()=>S.uploadDoc(p.id,{tipo:'matricula',rubroId:'gas',mime:'image/png',numero:'123',entidad:'',vence:null}));
    const d=S.uploadDoc(p.id,{tipo:'matricula',rubroId:'gas',mime:'image/png',archivo:'data:image/png;base64,DEMO',numero:'DEMO-123',entidad:'Ejemplo',vence:S.now()+365*86400000});
    S.adminDoc(d.id,'rechazar','Ilegible',aa);ok(S.docFor(p.id,'matricula','gas').estado==='rechazado');
  }],
  ['CU-08 · Publicar, campos obligatorios y límite de abiertas', ({ S, u, ok, fail, requestData }) => {
    fail(()=>S.createRequest(u.id,{...requestData,descripcion:''}));
    S.getDb().requests=S.getDb().requests.filter(r=>r.clienteId!==u.id);
    for(let i=0;i<S.getDb().config.maxSolicitudesAbiertas;i++)ok(S.createRequest(u.id,requestData).req.estado==='abierta');
    fail(()=>S.createRequest(u.id,requestData));
  }],
  ['CU-09/10 · Catálogo, categoría, cercanía, valoración, tag y vacío', ({ S, u, ok }) => {
    const all=S.searchProviders({from:u.direcciones[0]});ok(all.length>0);
    ok(all.every((x,i)=>!i||all[i-1].km<=x.km));
    const tagged=S.searchProviders({rubroId:'plomeria',tag:'Griferías',from:u.direcciones[0],minRating:4,maxKm:8});
    ok(tagged.every(x=>x.p.tags.includes('Griferías')&&x.km<=8&&x.st.rating.avg>=4));
    ok(S.searchProviders({q:'zzzinexistentezzz'}).length===0);
  }],
  ['CU-11 · Postular, editar sin duplicar y solicitud cerrada', ({ S, p, u, ok, fail, requestData }) => {
    const r=S.createRequest(u.id,requestData).req;const data={precio:30000,mensaje:'Puedo realizarlo',fecha:S.isoDate(S.now()+40*86400000),franja:'manana'};
    fail(()=>S.applyToJob(p.id,r.id,{...data,mensaje:''}));
    const a=S.applyToJob(p.id,r.id,data);S.applyToJob(p.id,r.id,{...data,precio:32000});
    ok(S.applicationsOf(r.id).length===1&&S.application(a.id).precio===32000);
    S.hireApplication(u.id,a.id,'efectivo');fail(()=>S.applyToJob(p.id,r.id,data));
  }],
  ['CU-12 · Perfil nuevo sin calificación inventada', ({ S, ok }) => {
    const p=S.getDb().providers.find(p=>S.providerStats(p).nuevo);ok(!!p);ok(S.providerStats(p).rating.count===0);
  }],
  ['CU-13/14 · Contratar, fecha, confirmación y conflicto de agenda', ({ S, mk, pa, ok, fail }) => {
    const a=mk();const b=mk();ok(a.estado==='pendiente_confirmacion');S.acceptOrder(a.id,pa);
    fail(()=>S.acceptOrder(b.id,pa));ok(S.order(a.id).estado==='confirmada');
  }],
  ['CU-14 · Rechazo con motivo y reapertura de solicitud', ({ S, u, p, pa, requestData, ok }) => {
    const r=S.createRequest(u.id,requestData).req;
    const a=S.applyToJob(p.id,r.id,{precio:30000,mensaje:'Propuesta',fecha:S.isoDate(S.now()+40*86400000),franja:'manana'});
    const o=S.hireApplication(u.id,a.id,'efectivo');S.rejectOrder(o.id,pa,'No tengo disponibilidad');
    ok(S.order(o.id).estado==='rechazada'&&S.request(r.id).estado==='abierta');
  }],
  ['CU-15 · Cancelar por ambos roles; impedir cancelar luego de ejecución', ({ S, mk, ca, pa, ok, fail }) => {
    const a=mk();S.cancelOrder(a.id,ca,'Cambio de fecha');ok(S.order(a.id).estado==='cancelada');
    const b=mk();S.acceptOrder(b.id,pa);S.cancelOrder(b.id,pa,'No llego');ok(S.order(b.id).estado==='cancelada');
    const c=mk();S.acceptOrder(c.id,pa);S.finishOrder(c.id,30000,pa);fail(()=>S.cancelOrder(c.id,ca,'Ya ejecutada'));
  }],
  ['CU-16 · Notificaciones locales con destinatario y enlace', ({ S, u, p, mk, ok }) => {
    const o=mk();ok(S.notificationsOf(p.userId,'prestador').some(n=>n.link===`/orden/${o.id}`));
    S.markNotificationsRead(p.userId,'prestador');ok(S.unreadCount(p.userId,'prestador')===0);
  }],
  ['CU-17 · Monto rechazado queda en revisión; resolver no inventa acreditación', ({ S, mk, pa, ca, aa, ok }) => {
    const o=mk();S.acceptOrder(o.id,pa);S.finishOrder(o.id,40000,pa);S.rejectAmount(o.id,ca,'No coincide');
    ok(S.order(o.id).estado==='en_revision');const d=S.dispute(S.order(o.id).disputaId);
    S.resolveDispute(d.id,{favor:'cliente',montoAjustado:30000,nota:'Revisado'},aa);
    ok(S.paymentOf(o.id).estado==='pendiente'&&S.order(o.id).estado==='confirmada');
    ok(!S.getDb().ledger.some(m=>m.orderId===o.id));
  }],
  ['CU-18 · Transferencia, comprobante, monto distinto y acreditación única', ({ S, mk, pa, ca, aa, ok, fail }) => {
    const o=mk('transferencia');S.acceptOrder(o.id,pa);S.finishOrder(o.id,30000,pa);
    S.uploadTransferProof(o.id,'data:application/pdf;base64,DEMO',ca);const pay=S.paymentOf(o.id);ok(pay.estado==='pendiente_acreditacion');
    S.acreditarTransfer(pay.id,aa,20000);ok(S.paymentOf(o.id).estado==='en_revision');
    S.acreditarTransfer(pay.id,aa,30000);ok(S.order(o.id).estado==='finalizada');
    fail(()=>S.acreditarTransfer(pay.id,aa,30000));ok(S.getDb().ledger.filter(m=>m.orderId===o.id&&m.tipo==='comision_deducida').length===1);
  }],
  ['CU-19 · Agregar y eliminar referencia de tarjeta; no guardar número completo', ({ S, u, ok, fail }) => {
    const c=S.addCard(u.id,'4111111111111111','12/29');ok(c.last4==='1111'&&!!c.token);
    ok(!JSON.stringify(S.user(u.id).tarjetas).includes('4111111111111111'));
    S.removeCard(u.id,c.id);ok(!S.user(u.id).tarjetas.some(t=>t.id===c.id));fail(()=>S.addCard(u.id,'4111111111110000','12/29'));
  }],
  ['CU-20 · Reseñas bidireccionales, autor ajeno y duplicado', ({ S, mk, pa, ca, ok, fail }) => {
    const o=mk();S.acceptOrder(o.id,pa);fail(()=>S.submitReview(o.id,ca.id,{estrellas:5}));
    S.finishOrder(o.id,30000,pa);S.confirmCash(o.id,ca);
    fail(()=>S.submitReview(o.id,S.getDb().users.find(u=>u.roles.includes('admin')).id,{estrellas:5}));
    S.submitReview(o.id,ca.id,{estrellas:5});S.submitReview(o.id,pa.id,{estrellas:4});
    fail(()=>S.submitReview(o.id,ca.id,{estrellas:1}));ok(S.order(o.id).estado==='finalizada');
    ok(S.getDb().reviews.filter(r=>r.orderId===o.id).length===2);
  }],
  ['CU-21 · Historial de cada participante', ({ S, mk, u, p, ok }) => {
    const o=mk();ok(S.ordersOfClient(u.id).some(x=>x.id===o.id));ok(S.ordersOfProvider(p.id).some(x=>x.id===o.id));
    ok(S.ordersOfClient(u.id).every(x=>x.clienteId===u.id));
  }],
  ['CU-22 · Reportar y moderar reseña; recalcular reputación', ({ S, aa, ok }) => {
    const r=S.getDb().reviews.find(r=>r.dir==='c2p'&&r.estado==='publicada');
    const count=S.ratingOf(r.destId).count;S.reportReview(r.id,r.destId,'No refleja el servicio');
    S.moderateReview(r.id,'baja','Observación de prueba',aa);ok(S.ratingOf(r.destId).count===count-1);
  }],
  ['CU-23 · Usuarios con rol, estado, rubro y ficha', ({ S, ok }) => {
    const users=S.getDb().users;ok(users.length>0&&users.every(u=>u.nombre&&u.roles.length&&u.estado));
    ok(S.getDb().providers.every(p=>!!S.user(p.userId)&&p.rubros.length>0));
  }],
];
