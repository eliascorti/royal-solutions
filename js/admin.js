// Panel de administración (web, desktop-first)
import * as S from './store.js';
import { initSync, setPresenceUser } from './sync.js';
import { initDevtools } from './devtools.js';
import { RUBROS, BARRIOS, MEDIOS, DOC_TIPOS, RIESGO_LABEL, MOTIVOS_OBSERVACION, ENCUESTAS, APP_VERSION } from './data.js';
import {
  icon, esc, money, moneyHtml, avatar, stars, rating, statusBadge, empty, toast, sheet, confirmDialog, run, initTheme, toggleTheme,
  fmtDate, fmtDateY, fmtTime, fmtDateTime, fmtRel, plural, lineChart, barChart, docImage, parseHash, matchRoute, go, qs, qsa, orderProgress, providerProgress,
} from './ui.js';

const L = S.ESTADOS;
const DAY = 86400000;
let admin = null;
const actor = () => ({ id: admin.id, rol: 'admin' });
const db = () => S.getDb();
const uName = (id) => S.fullName(S.user(id));
const provName = (pid) => S.fullName(S.user(S.provider(pid)?.userId));
/** Aviso con el cambio de estado: "Franco Ibarra · Pendiente de revisión → Aprobado". */
function stateToast(kind, before, after, who = '') {
  if (before === after) return;
  toast(`${who ? who + ' · ' : ''}${L[kind][before] || before} → ${L[kind][after] || after}`, 'ok');
}
/** Ejecuta una acción sobre un prestador y avisa el cambio de estado resultante. */
function provAct(b, id, fn) {
  return run(b, async () => {
    const before = S.provider(id).estado;
    await S.net(120, 280);
    fn();
    const p = S.provider(id);
    if (p.estado !== before) stateToast('provider', before, p.estado, S.fullName(S.user(p.userId)));
    else toast('Listo', 'ok');
    refresh();
  });
}

/* ───────────── vistas ───────────── */
const views = {};

/* Verificaciones */
function verifQueue() {
  const rank = { alto: 3, medio: 2, bajo: 1 };
  return db().providers.filter((p) => ['pendiente_revision', 'en_revision', 'observado'].includes(p.estado) || S.docsOf(p.id).some((d) => d.estado === 'en_revision') || p.video?.estado === 'enviado')
    .map((p) => ({ p, u: S.user(p.userId), riesgo: S.maxRiesgo(p), since: (p.historial.at(-1) || {}).t || p.creadoEn }))
    .sort((a, b) => (a.p.estado === 'observado') - (b.p.estado === 'observado') || rank[b.riesgo] - rank[a.riesgo] || a.since - b.since);
}
views['/verificaciones'] = {
  title: 'Verificaciones',
  render() {
    const q = verifQueue();
    return `<p class="small muted" style="margin-bottom:12px">Certificados y altas: CU-06/07. Identidad, antecedentes y niveles de riesgo: ampliaciones simuladas del alcance completo. Los parámetros por rubro son ejemplos para la demo.</p>
      ${q.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Prestador</th><th>Rubros</th><th>Riesgo</th><th>Estado</th><th>Documentos</th><th>Esperando</th></tr></thead><tbody>
      ${q.map(({ p, u, riesgo, since }) => { const docs = S.docsOf(p.id); return `<tr class="click" data-go="/verificaciones/${p.id}"><td><div class="row">${avatar(u, 'sm')}<div><div class="strong">${esc(S.fullName(u))}</div><div class="xs faint mono">${p.id} · DNI ${esc(u.dni)}</div></div></div></td><td>${p.rubros.map((r) => esc(S.rubro(r).nombre)).join(', ')}</td><td><span class="badge ${riesgo === 'alto' ? 'danger' : riesgo === 'medio' ? 'warn' : 'info'}">${RIESGO_LABEL[riesgo]}</span></td><td>${statusBadge('provider', p.estado, L)}${p.video?.estado === 'enviado' ? ' <span class="badge info">Video</span>' : ''}</td><td class="mono">${docs.filter((d) => d.estado === 'aprobado').length}/${S.requiredDocs(p).length}${docs.some((d) => d.estado === 'en_revision') ? ' <span class="badge warn">a revisar</span>' : ''}</td><td class="mono">${fmtRel(since, S.now())}</td></tr>`; }).join('')}
      </tbody></table></div>` : empty('shield', 'Cola vacía', 'No hay altas ni documentos esperando revisión.')}`;
  },
};

let docSel = null;
views['/verificaciones/:id'] = {
  title: (p) => `Verificación · ${provName(p.id)}`,
  back: '/verificaciones',
  render({ id }) {
    const p = S.provider(id);
    if (!p) return empty('user', 'No encontrado', '');
    const u = S.user(p.userId);
    const docs = S.requiredDocs(p).map((r) => ({ ...r, d: S.docFor(p.id, r.tipo, r.rubroId) }));
    if (!docSel || !docs.some((x) => x.d?.id === docSel)) docSel = docs.find((x) => x.d)?.d?.id;
    const cur = docs.find((x) => x.d?.id === docSel)?.d;
    const ck = p.checklist || {};
    const CK = [['foto', 'La foto de la selfie coincide con el DNI'], ['legible', 'Datos legibles y sin alteraciones'], ['matricula', 'Matrícula vigente y a su nombre'], ['antecedentes', 'Antecedentes sin registros']];
    const act = [];
    if (p.estado === 'pendiente_revision') act.push('<button class="btn sm" data-act="prov" data-a="tomar">Tomar para revisión</button>');
    if (['pendiente_revision', 'en_revision'].includes(p.estado)) act.push('<button class="btn sm ok" data-act="prov" data-a="aprobar">Aprobar</button>', '<button class="btn sm" data-act="observe">Observar</button>', '<button class="btn sm danger" data-act="reject">Rechazar</button>');
    if (p.estado === 'aprobado') act.push('<button class="btn sm danger" data-act="suspend">Suspender</button>');
    if (p.estado === 'suspendido') act.push('<button class="btn sm" data-act="prov" data-a="reactivar">Reactivar</button>');
    act.push('<button class="btn sm ghost" data-act="prov" data-a="video">' + icon('video', 'sm') + 'Solicitar video</button>');
    return `<div class="split">
      <div class="docview">
        <div class="tabs">${docs.map((x) => `<button class="chip ${x.d?.id === docSel ? 'on' : ''}" ${x.d ? `data-act="doc" data-id="${x.d.id}"` : 'disabled style="opacity:.5"'}>${esc(DOC_TIPOS[x.tipo])}${x.rubroId ? ' · ' + esc(S.rubro(x.rubroId).nombre) : ''}</button>`).join('')}</div>
        ${cur ? `<div class="stage" data-act="zoom" title="Click para ampliar">${docImage(cur, u, cur.rubroId ? S.rubro(cur.rubroId).nombre : '')}</div>
          <div class="row between"><div class="small"><b>${esc(DOC_TIPOS[cur.tipo])}</b> ${statusBadge('document', cur.estado, L)}<div class="xs muted mono">${cur.numero ? esc(cur.numero) + ' · ' : ''}${cur.entidad ? esc(cur.entidad) + ' · ' : ''}${cur.vence ? 'vence ' + fmtDateY(cur.vence) + ' · ' : ''}${cur.kb} KB · ${cur.simulado ? 'captura simulada' : 'archivo subido'}</div>${cur.motivo ? `<div class="xs" style="color:var(--danger)">${esc(cur.motivo)}</div>` : ''}</div>
          ${['cargado', 'en_revision'].includes(cur.estado) ? `<div class="row"><button class="btn sm ok" data-act="docok">Aprobar doc.</button><button class="btn sm danger" data-act="docno">Rechazar doc.</button></div>` : ''}</div>` : '<div class="stage">Sin documentos cargados</div>'}
        ${p.video ? `<div class="banner ${p.video.estado === 'enviado' ? 'info' : 'warn'}">${icon('video')}<div>Video de validación: <b>${p.video.estado === 'enviado' ? 'recibido' : 'solicitado'}</b> ${fmtRel(p.video.t, S.now())}${p.video.estado === 'enviado' ? ' · 5 s, rostro visible y coincide con la selfie (simulado)' : ''}</div></div>` : ''}
      </div>
      <div class="stack">
        <div class="panel"><div class="ph"><div class="row">${avatar(u)}<div><h2>${esc(S.fullName(u))}</h2><div class="xs muted mono">${p.id} · DNI ${esc(u.dni)}</div></div></div>${statusBadge('provider', p.estado, L)}</div>
          <div class="pb">${providerProgress(p, L)}</div><div class="pb" style="border-top:1px solid var(--border)"><dl class="kv"><dt>Email</dt><dd>${esc(u.email)}</dd><dt>Teléfono</dt><dd class="mono">${esc(u.telefono)}</dd><dt>Rubros</dt><dd>${p.rubros.map((r) => `${esc(S.rubro(r).nombre)} <span class="xs faint">(${S.rubro(r).riesgo})</span>`).join(', ')}</dd><dt>Cobertura</dt><dd>${p.barrios.map((b) => esc(S.barrio(b).nombre)).join(', ')}</dd><dt>Nivel actual</dt><dd>${S.NIVEL_LABEL[S.verification(p).nivel]}</dd><dt>Alta</dt><dd>${fmtDateY(p.creadoEn)}</dd></dl>
          ${p.observacion ? `<div class="banner warn" style="margin-top:12px">${icon('alert')}<div><b>${esc(p.observacion.motivo)}</b>${p.observacion.comentario ? `<div class="small">${esc(p.observacion.comentario)}</div>` : ''}</div></div>` : ''}</div></div>
        <div class="panel"><div class="ph"><h2>Checklist</h2></div><div class="pb checklist">${CK.filter(([k]) => (k !== 'matricula' || S.maxRiesgo(p) === 'alto') && (k !== 'antecedentes' || S.maxRiesgo(p) !== 'bajo')).map(([k, l]) => `<label class="check"><input type="checkbox" data-ck="${k}" ${ck[k] ? 'checked' : ''}> <span>${l}</span></label>`).join('')}</div></div>
        <div class="row wrap">${act.join('')}</div>
        <div class="panel"><div class="ph"><h2>Historial</h2></div><div class="pb"><ul class="timeline">${p.historial.slice().reverse().map((h, i) => `<li class="${i ? '' : 'now'}"><div>${esc(h.texto || L.provider[h.estado])}</div><div class="t">${fmtDateTime(h.t)} · ${esc(h.actor)}</div></li>`).join('')}</ul></div></div>
      </div></div>`;
  },
  mount(el, { id }) { el.addEventListener('change', (e) => { const k = e.target.dataset.ck; if (k) S.setChecklist(id, k, e.target.checked); }); },
  actions: {
    doc: (b) => { docSel = b.dataset.id; refresh(); },
    zoom: (b) => b.classList.toggle('zoom'),
    prov: (b, { id }) => provAct(b, id, () => S.adminProvider(id, b.dataset.a, {}, actor())),
    docok: (b) => run(b, async () => { const before = db().documents.find((d) => d.id === docSel).estado; await S.net(120, 280); S.adminDoc(docSel, 'aprobar', '', actor()); stateToast('document', before, 'aprobado', DOC_TIPOS[db().documents.find((d) => d.id === docSel).tipo]); refresh(); }),
    docno: (b) => reasonModal('Rechazar documento', MOTIVOS_OBSERVACION, (m) => { const d = db().documents.find((x) => x.id === docSel); const before = d.estado; S.adminDoc(docSel, 'rechazar', m, actor()); stateToast('document', before, 'rechazado', DOC_TIPOS[d.tipo]); refresh(); }),
    observe: (b, { id }) => {
      const p = S.provider(id);
      const docs = S.docsOf(id);
      const s = sheet({ modal: true, title: 'Observar alta', body: `<div class="stack"><div class="field"><label for="om">Motivo</label><select class="select" id="om">${MOTIVOS_OBSERVACION.map((m) => `<option>${esc(m)}</option>`).join('')}</select></div>
        <div class="field"><label for="od">Documento a corregir</label><select class="select" id="od"><option value="">—</option>${docs.filter((d) => d.estado !== 'rechazado').map((d) => `<option value="${d.id}" ${d.id === docSel ? 'selected' : ''}>${esc(DOC_TIPOS[d.tipo])}${d.rubroId ? ' · ' + esc(S.rubro(d.rubroId).nombre) : ''}</option>`).join('')}</select></div>
        <div class="field"><label for="oc">Comentario para ${esc(S.user(p.userId).nombre)}</label><textarea class="textarea" id="oc" placeholder="Qué tiene que corregir"></textarea></div></div>`, footer: '<button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Enviar observación</button>' });
      s.el.querySelector('[data-x]').onclick = s.close;
      const ok = s.el.querySelector('[data-ok]');
      ok.onclick = () => { const vals = { motivo: s.el.querySelector('#om').value, comentario: s.el.querySelector('#oc').value.trim(), docId: s.el.querySelector('#od').value || null }; provAct(ok, id, () => { S.adminProvider(id, 'observar', vals, actor()); s.close(); }); };
    },
    reject: (b, { id }) => reasonModal('Rechazar alta', ['El certificado registra antecedentes', 'Identidad no verificable', 'Documentación adulterada', 'DNI bloqueado'], (m) => { const before = S.provider(id).estado; S.adminProvider(id, 'rechazar', { motivo: m }, actor()); stateToast('provider', before, 'rechazado', provName(id)); refresh(); }),
    suspend: (b, { id }) => reasonModal('Suspender prestador', ['Cancelaciones tardías reiteradas', 'Disputas perdidas', 'Denuncia de un cliente', 'Documentación vencida'], (m) => { S.adminProvider(id, 'suspender', { motivo: m }, actor()); stateToast('provider', 'aprobado', 'suspendido', provName(id)); refresh(); }),
  },
};

function reasonModal(title, reasons, apply) {
  const s = sheet({ modal: true, title, body: `<div class="field"><label for="rm">Motivo</label><select class="select" id="rm">${reasons.map((r) => `<option>${esc(r)}</option>`).join('')}</select></div>`, footer: '<button class="btn" data-x>Cancelar</button><button class="btn danger solid" data-ok>Confirmar</button>' });
  s.el.querySelector('[data-x]').onclick = s.close;
  const ok = s.el.querySelector('[data-ok]');
  ok.onclick = () => run(ok, async () => { await S.net(120, 280); apply(s.el.querySelector('#rm').value); s.close(); });
}

/* Órdenes */
const ordF = { q: '', estado: '', rubro: '', barrio: '', medio: '', pago: '' };
views['/ordenes'] = {
  title: 'Órdenes', keepInputs: true,
  render(p, query) {
    if (query.pago) ordF.pago = query.pago;
    const sel = (k, opts, label) => `<select class="select" data-f="${k}" aria-label="${label}"><option value="">${label}</option>${opts.map(([v, l]) => `<option value="${v}" ${ordF[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    return `<div class="toolbar"><input class="input" id="oq" placeholder="Buscar ID, cliente o prestador" value="${esc(ordF.q)}">
      ${sel('estado', Object.entries(L.order), 'Estado')}${sel('rubro', RUBROS.map((r) => [r.id, r.nombre]), 'Rubro')}${sel('barrio', BARRIOS.map((b) => [b.id, b.nombre]), 'Barrio')}${sel('medio', Object.entries(MEDIOS).map(([k, v]) => [k, v.label]), 'Medio de pago')}${sel('pago', Object.entries(L.payment), 'Estado del pago')}
      <button class="btn sm ghost" data-act="clear">Limpiar</button></div><div id="otbl">${ordersTable()}</div>`;
  },
  mount(el) {
    el.querySelector('#oq').addEventListener('input', (e) => { ordF.q = e.target.value; el.querySelector('#otbl').innerHTML = ordersTable(); });
    el.querySelectorAll('[data-f]').forEach((s) => s.addEventListener('change', () => { ordF[s.dataset.f] = s.value; el.querySelector('#otbl').innerHTML = ordersTable(); }));
  },
  actions: { clear: () => { Object.keys(ordF).forEach((k) => { ordF[k] = ''; }); go('/ordenes'); refresh(); } },
};
function ordersTable() {
  const q = ordF.q.trim().toLowerCase();
  let list = [...db().orders].sort((a, b) => b.creadoEn - a.creadoEn);
  if (ordF.estado) list = list.filter((o) => o.estado === ordF.estado);
  if (ordF.rubro) list = list.filter((o) => o.rubroId === ordF.rubro);
  if (ordF.barrio) list = list.filter((o) => o.direccion.barrio === ordF.barrio);
  if (ordF.medio) list = list.filter((o) => o.medio === ordF.medio);
  if (ordF.pago) list = list.filter((o) => S.paymentOf(o.id)?.estado === ordF.pago);
  if (q) list = list.filter((o) => o.id.toLowerCase().includes(q) || uName(o.clienteId).toLowerCase().includes(q) || provName(o.providerId).toLowerCase().includes(q));
  if (!list.length) return empty('clipboard', 'Sin órdenes con esos filtros', 'Probá quitar algún filtro.');
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Prestador</th><th>Rubro</th><th>Barrio</th><th class="num">Monto</th><th>Medio</th><th>Pago</th><th>Estado</th></tr></thead><tbody>
    ${list.slice(0, 150).map((o) => { const pay = S.paymentOf(o.id); return `<tr class="click" data-go="/ordenes/${o.id}"><td class="mono">${o.id}</td><td class="mono">${fmtDate(o.creadoEn)}</td><td>${esc(uName(o.clienteId))}</td><td>${esc(provName(o.providerId))}</td><td>${esc(S.rubro(o.rubroId).nombre)}</td><td>${esc(S.barrio(o.direccion.barrio)?.nombre || '')}</td><td class="num">${money(o.montoFinal || o.precioAcordado)}</td><td>${MEDIOS[o.medio].label}${o.garantia ? ' ' + icon('shield', 'sm') : ''}</td><td>${pay ? statusBadge('payment', pay.estado, L) : '<span class="faint">—</span>'}</td><td>${statusBadge('order', o.estado, L)}</td></tr>`; }).join('')}
  </tbody></table></div><p class="xs faint" style="margin-top:8px">${plural(list.length, 'orden', 'órdenes')}${list.length > 150 ? ' · mostrando 150' : ''}</p>`;
}

function chatReadonly(orderId) {
  const msgs = S.messagesOf(orderId);
  if (!msgs.length) return '<p class="small muted">Sin mensajes.</p>';
  return `<div class="chat" style="padding:0;max-height:320px;overflow-y:auto">${msgs.map((m) => `<div class="msg ${m.from === S.order(orderId).clienteId ? '' : 'me'}"><div class="xs" style="opacity:.7">${esc(S.shortName(S.user(m.from)))}${m.auto ? ' · auto' : ''}</div>${esc(m.text).replace(/\[dato oculto\]/g, '<span class="masked">dato oculto</span>')}<div class="meta">${fmtDateTime(m.t)}${m.masked ? ' · enmascarado' : ''}</div></div>`).join('')}</div>`;
}

views['/ordenes/:id'] = {
  title: (p) => `Orden ${p.id}`, back: '/ordenes',
  render({ id }) {
    const o = S.order(id);
    if (!o) return empty('clipboard', 'Orden no encontrada', '');
    const pay = S.paymentOf(id);
    const d = o.disputaId && S.dispute(o.disputaId);
    return `<div class="grid2e">
      <div class="stack">
        <div class="panel"><div class="ph"><h2>${esc(S.rubro(o.rubroId).nombre)} · ${esc(o.descripcion)}</h2>${statusBadge('order', o.estado, L)}</div><div class="pb">${orderProgress(o, L)}</div><div class="pb" style="border-top:1px solid var(--border)"><dl class="kv">
          <dt>Cliente</dt><dd><a href="#/usuarios/${o.clienteId}">${esc(uName(o.clienteId))}</a></dd><dt>Prestador</dt><dd><a href="#/usuarios/${S.provider(o.providerId).userId}">${esc(provName(o.providerId))}</a></dd>
          <dt>Origen</dt><dd>${o.origen === 'directa' ? 'Contratación directa' : `Postulación · <span class="mono">${o.requestId}</span>`}</dd><dt>Dirección</dt><dd>${esc(o.direccion.calle)} · ${esc(S.barrio(o.direccion.barrio)?.nombre || '')}</dd>
          <dt>Precio acordado</dt><dd>${moneyHtml(o.precioAcordado)}</dd><dt>Monto final</dt><dd>${moneyHtml(o.montoFinal)}</dd><dt>Comisión</dt><dd>${o.comisionPct}% · ${moneyHtml(Math.round((o.montoFinal || o.precioAcordado) * o.comisionPct / 100))}</dd>
          ${o.cancelacion ? `<dt>Cancelación</dt><dd>${esc(o.cancelacion.actor)} · ${esc(o.cancelacion.motivo)}${o.cancelacion.tardia ? ' · <span class="badge warn">tardía</span>' : ''}</dd>` : ''}
        </dl></div></div>
        <div class="panel"><div class="ph"><h2>Pago</h2>${pay ? statusBadge('payment', pay.estado, L) : ''}</div><div class="pb">${pay ? `<dl class="kv"><dt>Medio</dt><dd>${MEDIOS[pay.medio].label}</dd><dt>Monto</dt><dd>${moneyHtml(pay.monto)}</dd><dt>Comisión</dt><dd>${moneyHtml(pay.comision)} ${pay.medio === 'efectivo' ? '(diferida)' : '(deducida)'}</dd>${pay.ref ? `<dt>Referencia</dt><dd class="mono">${pay.ref}</dd>` : ''}</dl>
          ${pay.comprobante ? `<div style="max-width:300px;margin-top:12px">${docImage({archivo:pay.comprobante}, null, "")}</div>` : pay.estado === 'pendiente_acreditacion' ? '<p class="xs muted" style="margin-top:8px">Comprobante simulado adjunto.</p>' : ''}
          ${['pendiente_acreditacion', 'en_revision'].includes(pay.estado) ? `<div class="row" style="margin-top:12px"><button class="btn sm ok" data-act="acreditar">Acreditar ${money(pay.monto)}</button>${pay.estado === 'pendiente_acreditacion' ? '<button class="btn sm" data-act="mismatch">Monto no coincide</button>' : ''}</div>` : ''}
          <ul class="timeline" style="margin-top:12px">${pay.historial.map((h) => `<li><div>${esc(h.texto || L.payment[h.estado])}</div><div class="t">${fmtDateTime(h.t)}</div></li>`).join('')}</ul>` : '<p class="small muted">Todavía no se generó el pago.</p>'}</div></div>
        ${d ? `<a class="banner warn" href="#/disputas/${d.id}">${icon('scale')}<div>Disputa <b class="mono">${d.id}</b> · ${esc(L.dispute[d.estado])} · ${esc(d.motivo)}</div></a>` : ''}
      </div>
      <div class="stack">
        <div class="panel"><div class="ph"><h2>Timeline</h2></div><div class="pb"><ul class="timeline">${o.timeline.slice().reverse().map((h, i) => `<li class="${i ? '' : 'now'}"><div>${esc(h.texto)}</div><div class="t">${fmtDateTime(h.t)} · ${esc(h.actor)}</div></li>`).join('')}</ul></div></div>
        <div class="panel"><div class="ph"><h2>Chat</h2><span class="xs faint">solo lectura</span></div><div class="pb">${chatReadonly(id)}</div></div>
      </div></div>`;
  },
  actions: {
    acreditar: (b, { id }) => run(b, async () => { const before = S.paymentOf(id).estado; await S.net(120, 280); S.acreditarTransfer(S.paymentOf(id).id, actor()); stateToast('payment', before, 'acreditado', id); refresh(); }),
    mismatch: (b, { id }) => {
      const pay = S.paymentOf(id);
      const s = sheet({ modal: true, title: 'Monto recibido', body: `<div class="field"><label for="mr">Monto que ingresó a la cuenta</label><div class="input-group"><span class="prefix">$</span><input class="input" id="mr" inputmode="numeric" value="${pay.monto - 5000}"></div></div>`, footer: '<button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Pasar a revisión</button>' });
      s.el.querySelector('[data-x]').onclick = s.close;
      const ok = s.el.querySelector('[data-ok]');
      ok.onclick = () => run(ok, async () => { await S.net(120, 280); S.acreditarTransfer(pay.id, actor(), Number(s.el.querySelector('#mr').value.replace(/\D/g, ''))); s.close(); toast('Pago en revisión', 'ok'); });
    },
  },
};

/* Disputas */
views['/disputas'] = {
  title: 'Disputas',
  render() {
    const list = [...db().disputes].sort((a, b) => (a.estado === 'resuelta') - (b.estado === 'resuelta') || b.creadaEn - a.creadaEn);
    if (!list.length) return empty('scale', 'Sin disputas', 'Cuando un cliente o prestador reporte un problema, aparece acá.');
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ID</th><th>Orden</th><th>Motivo</th><th>Abierta por</th><th class="num">Monto</th><th>Antigüedad</th><th>Estado</th></tr></thead><tbody>
      ${list.map((d) => { const o = S.order(d.orderId); return `<tr class="click" data-go="/disputas/${d.id}"><td class="mono">${d.id}</td><td class="mono">${o.id}</td><td>${esc(d.motivo)}</td><td>${esc(uName(d.abiertaPor))} <span class="xs faint">(${d.abiertaPor === o.clienteId ? 'cliente' : 'prestador'})</span></td><td class="num">${money(o.montoFinal || o.precioAcordado)}</td><td class="mono">${fmtRel(d.creadaEn, S.now())}</td><td>${statusBadge('dispute', d.estado, L)}</td></tr>`; }).join('')}
    </tbody></table></div>`;
  },
};
views['/disputas/:id'] = {
  title: (p) => `Disputa ${p.id}`, back: '/disputas', live: false,
  render({ id }) {
    const d = S.dispute(id);
    if (!d) return empty('scale', 'No encontrada', '');
    const o = S.order(d.orderId);
    const pu = S.provider(o.providerId).userId;
    const side = (uid) => (uid === o.clienteId ? 'Cliente' : 'Prestador');
    return `<div class="split">
      <div class="stack">
        <div class="panel"><div class="ph"><h2>${esc(d.motivo)}</h2>${statusBadge('dispute', d.estado, L)}</div><div class="pb"><dl class="kv"><dt>Orden</dt><dd><a class="mono" href="#/ordenes/${o.id}">${o.id}</a> · ${esc(S.rubro(o.rubroId).nombre)}</dd><dt>Cliente</dt><dd>${esc(uName(o.clienteId))}</dd><dt>Prestador</dt><dd>${esc(uName(pu))}</dd><dt>Precio acordado</dt><dd>${moneyHtml(o.precioAcordado)}</dd><dt>Monto informado</dt><dd>${moneyHtml(o.montoFinal)}</dd><dt>Medio</dt><dd>${MEDIOS[o.medio].label}</dd><dt>Abierta</dt><dd>${fmtDateTime(d.creadaEn)}</dd></dl></div></div>
        <div class="panel"><div class="ph"><h2>Evidencias</h2></div><div class="list" style="border:0">${d.evidencias.map((ev) => `<div class="li" style="align-items:flex-start">${avatar(S.user(ev.autor), 'sm')}<div class="grow"><div class="small strong">${esc(uName(ev.autor))} <span class="badge outline">${side(ev.autor)}</span></div><p class="small">${esc(ev.texto)}</p>${ev.foto ? `<img src="${ev.foto}" alt="Evidencia" style="max-width:200px;margin-top:6px;border:1px solid var(--border)">` : ''}<div class="xs faint mono">${fmtDateTime(ev.t)}</div></div></div>`).join('')}${d.evidencias.some((e) => e.autor === pu) ? '' : '<div class="li"><span class="small muted">El prestador todavía no presentó su versión.</span></div>'}</div></div>
        <div class="panel"><div class="ph"><h2>Chat de la orden</h2><span class="xs faint">solo lectura</span></div><div class="pb">${chatReadonly(o.id)}</div></div>
      </div>
      <div class="stack">
        ${d.estado === 'resuelta' ? `<div class="banner ok">${icon('check')}<div><b>Resuelta a favor de ${esc(d.resolucion.favor)}</b>${d.resolucion.montoAjustado != null ? ` · monto ${money(d.resolucion.montoAjustado)}` : ''}${d.resolucion.penalizar ? ' · con penalización' : ''}<div class="small">${esc(d.resolucion.nota || '')}</div></div></div>` : `
        ${d.estado === 'abierta' ? '<button class="btn block" data-act="analisis">Pasar a análisis</button>' : ''}
        <div class="panel"><div class="ph"><h2>Resolver</h2></div><div class="pb stack">
          <div class="field"><span class="label">A favor de</span><div class="seg" id="fv"><button type="button" data-v="cliente">Cliente</button><button type="button" data-v="prestador">Prestador</button><button type="button" data-v="parcial" class="on">Parcial</button></div></div>
          <div class="field"><label for="ma">Monto final ajustado</label><div class="input-group"><span class="prefix">$</span><input class="input" id="ma" inputmode="numeric" value="${(o.montoFinal || o.precioAcordado).toLocaleString('es-AR')}"></div><span class="hint">Acordado ${money(o.precioAcordado)} · informado ${money(o.montoFinal)}</span></div>

          <div class="field"><label for="nt">Resolución (se notifica a ambas partes)</label><textarea class="textarea" id="nt" placeholder="Ej.: se valida el repuesto extra con el ticket; se ajusta el monto."></textarea></div>
          <button class="btn primary" data-act="resolve">Cerrar disputa</button>
        </div></div>`}
      </div></div>`;
  },
  mount(el) {
    const fv = el.querySelector('#fv');
    if (fv) fv.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; fv.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); };
    const ma = el.querySelector('#ma');
    ma?.addEventListener('input', () => { const n = Number(ma.value.replace(/\D/g, '')); ma.value = n ? n.toLocaleString('es-AR') : ''; });
  },
  actions: {
    analisis: (b, { id }) => run(b, async () => { await S.net(120, 280); S.disputeAnalysis(id, actor()); stateToast('dispute', 'abierta', 'en_analisis', id); refresh(); }),
    resolve: async (b, { id }) => {
      const favor = qs('#fv .on').dataset.v;
      if (!(await confirmDialog(`Se cierra la disputa a favor de ${favor} y se notifica a ambas partes.`, { title: 'Cerrar disputa', ok: 'Cerrar disputa' }))) return;
      run(b, async () => { await S.net(120, 280); const before = S.dispute(id).estado; S.resolveDispute(id, { favor, montoAjustado: Number(qs('#ma').value.replace(/\D/g, '')) || null, penalizar: false, nota: qs('#nt').value.trim() }, actor()); stateToast('dispute', before, 'resuelta', id); refresh(); });
    },
  },
};

/* Usuarios */
const usrF = { q: '', rol: '', estado: '', rubro: '' };
views['/usuarios'] = {
  title: 'Usuarios', keepInputs: true,
  render() {
    const sel = (k, opts, label) => `<select class="select" data-f="${k}" aria-label="${label}"><option value="">${label}</option>${opts.map(([v, l]) => `<option value="${v}" ${usrF[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    return `<div class="toolbar"><input class="input" id="uq" placeholder="Buscar nombre, email o DNI" value="${esc(usrF.q)}">${sel('rol', [['cliente', 'Cliente'], ['prestador', 'Prestador'], ['admin', 'Admin']], 'Rol')}${sel('estado', [['activo', 'Activo'], ['suspendido', 'Suspendido'], ['bloqueado', 'Bloqueado']], 'Estado')}${sel('rubro', RUBROS.map((r) => [r.id, r.nombre]), 'Rubro')}</div><div id="utbl">${usersTable()}</div>`;
  },
  mount(el) {
    el.querySelector('#uq').addEventListener('input', (e) => { usrF.q = e.target.value; el.querySelector('#utbl').innerHTML = usersTable(); });
    el.querySelectorAll('[data-f]').forEach((s) => s.addEventListener('change', () => { usrF[s.dataset.f] = s.value; el.querySelector('#utbl').innerHTML = usersTable(); }));
  },
};
function usersTable() {
  const q = usrF.q.trim().toLowerCase();
  let list = [...db().users].sort((a, b) => b.creadoEn - a.creadoEn);
  if (usrF.rol) list = list.filter((u) => u.roles.includes(usrF.rol));
  if (usrF.estado) list = list.filter((u) => u.estado === usrF.estado);
  if (usrF.rubro) list = list.filter((u) => S.providerByUser(u.id)?.rubros.includes(usrF.rubro));
  if (q) list = list.filter((u) => S.fullName(u).toLowerCase().includes(q) || u.email.includes(q) || (u.dni || '').includes(q));
  if (!list.length) return empty('users', 'Sin resultados', 'No hay usuarios con esos filtros.');
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Usuario</th><th>Perfil</th><th>Estado</th><th>Prestador</th><th>Alta</th><th>Valoración</th></tr></thead><tbody>
    ${list.map((u) => { const p = S.providerByUser(u.id); const r = p ? S.ratingOf(u.id) : S.ratingOf(u.id, 'p2c'); return `<tr class="click" data-go="/usuarios/${u.id}"><td><div class="row">${avatar(u, 'sm')}<div><div class="strong">${esc(S.fullName(u))}</div><div class="xs faint">${esc(u.email)}</div></div></div></td><td>${u.roles.map((x) => `<span class="badge outline">${x}</span>`).join(' ')}</td><td><span class="badge ${u.estado === 'activo' ? 'ok' : 'danger'}">${u.estado}</span></td><td>${p ? statusBadge('provider', p.estado, L) : '<span class="faint">—</span>'}</td><td class="mono">${fmtDate(u.creadoEn)}</td><td>${r.count ? `<span class="mono">${r.avg.toFixed(1)}</span> <span class="faint">(${r.count})</span>` : '<span class="faint">—</span>'}</td></tr>`; }).join('')}
  </tbody></table></div><p class="xs faint" style="margin-top:8px">${plural(list.length, 'usuario')}</p>`;
}
views['/usuarios/:id'] = {
  title: (p) => uName(p.id), back: '/usuarios',
  render({ id }) {
    const u = S.user(id);
    if (!u) return empty('user', 'No encontrado', '');
    const p = S.providerByUser(id);
    const os = db().orders.filter((o) => o.clienteId === id || o.providerId === p?.id).sort((a, b) => b.creadoEn - a.creadoEn);
    const revs = db().reviews.filter((r) => r.destId === id).sort((a, b) => b.t - a.t).slice(0, 10);
    const st = p && S.providerStats(p);
    return `<div class="grid2e">
      <div class="stack">
        <div class="panel"><div class="ph"><div class="row">${avatar(u)}<div><h2>${esc(S.fullName(u))}</h2><div class="xs muted mono">${u.id}</div></div></div><span class="badge ${u.estado === 'activo' ? 'ok' : 'danger'}">${u.estado}</span></div>
          <div class="pb"><dl class="kv"><dt>Email</dt><dd>${esc(u.email)}</dd><dt>DNI</dt><dd class="mono">${esc(u.dni)}${db().dniBloqueados.includes(u.dni) ? ' <span class="badge danger">bloqueado</span>' : ''}</dd><dt>Teléfono</dt><dd class="mono">${esc(u.telefono)}</dd><dt>Roles</dt><dd>${u.roles.join(', ')}</dd><dt>Alta</dt><dd>${fmtDateY(u.creadoEn)}</dd><dt>Dirección</dt><dd>${esc(u.direcciones[0]?.calle || '')}</dd><dt>Cancelaciones tardías</dt><dd class="mono">${u.cancelacionesTardias || 0}</dd>
          ${p ? `<dt>Prestador</dt><dd><a href="#/verificaciones/${p.id}">${statusBadge('provider', p.estado, L)}</a></dd><dt>Rubros</dt><dd>${p.rubros.map((r) => esc(S.rubro(r).nombre)).join(', ')}</dd><dt>Calificación</dt><dd>${rating(st.rating.avg, st.rating.count)}</dd><dt>Deuda comisión</dt><dd>${moneyHtml(st.deuda)}</dd>` : ''}</dl></div></div>
        <div class="row wrap">${u.roles.includes('admin') ? '' : u.estado === 'activo' ? '<button class="btn sm danger" data-act="ua" data-a="suspender">Suspender cuenta</button>' : '<button class="btn sm" data-act="ua" data-a="reactivar">Reactivar</button>'}${u.roles.includes('admin') || db().dniBloqueados.includes(u.dni) ? '' : '<button class="btn sm danger solid" data-act="ua" data-a="bloquear_dni">Bloquear por DNI</button>'}</div>
      </div>
      <div class="stack">
        <div class="panel"><div class="ph"><h2>Historial de órdenes</h2><span class="mono faint">${os.length}</span></div>${os.length ? `<div class="list" style="border:0">${os.slice(0, 15).map((o) => `<a class="li" href="#/ordenes/${o.id}"><span class="mono small">${o.id}</span><span class="grow small ellipsis">${esc(o.descripcion)}</span><span class="xs faint">${o.clienteId === id ? 'como cliente' : 'como prestador'}</span>${statusBadge('order', o.estado, L)}</a>`).join('')}</div>` : '<div class="pb small muted">Sin órdenes.</div>'}</div>
        <div class="panel"><div class="ph"><h2>Reseñas recibidas</h2></div>${revs.length ? `<div class="list" style="border:0">${revs.map((r) => `<div class="li" style="align-items:flex-start;flex-direction:column;gap:2px">${stars(r.estrellas)}<span class="small">${esc(r.comentario || '—')}</span><span class="xs faint">${esc(uName(r.autorId))} · ${fmtDate(r.t)} · ${r.estado}</span></div>`).join('')}</div>` : '<div class="pb small muted">Sin reseñas.</div>'}</div>
      </div></div>`;
  },
  actions: {
    ua: async (b, { id }) => {
      const a = b.dataset.a;
      const msg = { suspender: 'La cuenta no va a poder iniciar sesión. Si es prestador, deja de aparecer en búsquedas.', reactivar: 'La cuenta vuelve a estar activa.', bloquear_dni: 'Se bloquean todas las cuentas con este DNI y no se podrán crear nuevas.' }[a];
      if (!(await confirmDialog(msg, { title: { suspender: 'Suspender cuenta', reactivar: 'Reactivar cuenta', bloquear_dni: 'Bloquear por DNI' }[a], ok: 'Confirmar', danger: a !== 'reactivar' }))) return;
      run(b, async () => { await S.net(120, 280); S.adminUser(id, a, '', actor()); toast('Listo', 'ok'); });
    },
  },
};

/* Reseñas */
let revTab = 'reportadas';
views['/resenas'] = {
  title: 'Reseñas',
  render() {
    const rep = db().reviews.filter((r) => r.estado === 'reportada');
    const list = revTab === 'reportadas' ? rep : [...db().reviews].sort((a, b) => b.t - a.t).slice(0, 60);
    return `<div class="seg" style="max-width:360px;margin-bottom:16px"><button class="${revTab === 'reportadas' ? 'on' : ''}" data-act="tab" data-v="reportadas">Reportadas · ${rep.length}</button><button class="${revTab === 'todas' ? 'on' : ''}" data-act="tab" data-v="todas">Últimas 60</button></div>
      ${!list.length ? empty('flag', 'Nada para moderar', 'Las reseñas reportadas por los usuarios aparecen acá.') : `<div class="stack">${list.map((r) => {
        const avg = S.ratingOf(r.destId, r.dir);
        const sin = S.getDb().reviews.filter((x) => x.destId === r.destId && x.dir === r.dir && x.estado !== 'baja' && x.id !== r.id);
        const avgSin = sin.length ? sin.reduce((a, x) => a + x.estrellas, 0) / sin.length : 0;
        return `<div class="panel"><div class="ph"><div class="row">${stars(r.estrellas)}<span class="small">${esc(uName(r.autorId))} → <b>${esc(uName(r.destId))}</b></span></div><div class="row"><a class="mono small" href="#/ordenes/${r.orderId}">${r.orderId}</a><span class="badge ${r.estado === 'reportada' ? 'warn' : r.estado === 'baja' ? '' : 'ok'}">${r.estado}</span></div></div>
          <div class="pb stack"><p>${esc(r.comentario || 'Sin comentario')}</p>${r.reporte ? `<div class="banner warn">${icon('flag')}<div><b>Reporte:</b> ${esc(r.reporte.motivo)} <span class="xs faint">· ${fmtRel(r.reporte.t, S.now())}</span></div></div>` : ''}
          ${r.estado === 'reportada' ? `<div class="row between wrap"><span class="xs muted">Promedio actual <b class="mono">${avg.avg.toFixed(2)}</b> · sin esta reseña <b class="mono">${avgSin.toFixed(2)}</b></span><div class="row"><button class="btn sm" data-act="mod" data-id="${r.id}" data-d="aprobar">Mantener</button><button class="btn sm danger" data-act="mod" data-id="${r.id}" data-d="baja">Dar de baja</button></div></div>` : ''}</div></div>`;
      }).join('')}</div>`}`;
  },
  actions: {
    tab: (b) => { revTab = b.dataset.v; refresh(); },
    mod: (b) => {
      const s = sheet({ modal: true, title: b.dataset.d === 'baja' ? 'Dar de baja reseña' : 'Mantener reseña', body: '<div class="field"><label for="mn">Observación (se notifica)</label><textarea class="textarea" id="mn"></textarea></div>', footer: '<button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Confirmar</button>' });
      s.el.querySelector('[data-x]').onclick = s.close;
      const ok = s.el.querySelector('[data-ok]');
      ok.onclick = () => run(ok, async () => { await S.net(120, 280); S.moderateReview(b.dataset.id, b.dataset.d, s.el.querySelector('#mn').value.trim(), actor()); s.close(); toast(b.dataset.d === 'baja' ? 'Reseña dada de baja. Promedio recalculado.' : 'Reseña mantenida', 'ok'); });
    },
  },
};

/* Comisiones */
views['/comisiones'] = {
  title: 'Comisiones',
  render() {
    const lim = db().config.limiteDeuda;
    const rows = db().providers.map((p) => {
      const deuda = S.debtOf(p.id);
      const movs = db().ledger.filter((m) => m.providerId === p.id);
      const lastPay = movs.filter((m) => m.tipo === 'pago_deuda').sort((a, b) => b.t - a.t)[0];
      const oldest = movs.filter((m) => m.tipo === 'deuda_efectivo' && (!lastPay || m.t > lastPay.t)).sort((a, b) => a.t - b.t)[0];
      return { p, deuda, dias: oldest ? Math.floor((S.now() - oldest.t) / DAY) : 0, lastPay };
    }).filter((x) => x.deuda > 0).sort((a, b) => b.deuda - a.deuda);
    const total = rows.reduce((a, x) => a + x.deuda, 0);
    const bloq = rows.filter((x) => x.deuda >= lim).length;
    const cobrado = db().ledger.filter((m) => m.tipo === 'pago_deuda' && m.t > S.now() - 30 * DAY).reduce((a, m) => a + m.monto, 0);
    return `<div class="stack-lg"><div class="kpis" style="grid-template-columns:repeat(3,1fr)"><div class="kpi"><div class="l">Deuda total por efectivo</div><div class="v">${money(total)}</div></div><div class="kpi"><div class="l">Bloqueados por límite (${money(lim)})</div><div class="v">${bloq}</div></div><div class="kpi"><div class="l">Deuda cobrada · 30 días</div><div class="v">${money(cobrado)}</div></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Prestador</th><th class="num">Deuda</th><th>Uso del límite</th><th class="num">Antigüedad</th><th>Último pago</th><th>Estado</th><th></th></tr></thead><tbody>
      ${rows.map(({ p, deuda, dias, lastPay }) => `<tr><td><a href="#/usuarios/${p.userId}">${esc(provName(p.id))}</a></td><td class="num">${money(deuda)}</td><td style="min-width:140px"><div class="bar ${deuda >= lim ? 'danger' : deuda > lim * 0.7 ? 'warn' : 'ok'}"><i style="width:${Math.min(100, (deuda / lim) * 100)}%"></i></div></td><td class="num">${dias} d</td><td class="mono">${lastPay ? fmtDate(lastPay.t) : '—'}</td><td>${deuda >= lim ? '<span class="badge danger">Bloqueado</span>' : '<span class="badge ok">Activo</span>'}</td><td><button class="btn sm" data-act="pay" data-id="${p.id}">Registrar pago</button></td></tr>`).join('')}
      </tbody></table></div></div>`;
  },
  actions: {
    pay: (b) => {
      const deuda = S.debtOf(b.dataset.id);
      const s = sheet({ modal: true, title: `Registrar pago · ${provName(b.dataset.id)}`, body: `<div class="stack"><div class="field"><label for="pm">Monto</label><div class="input-group"><span class="prefix">$</span><input class="input" id="pm" inputmode="numeric" value="${deuda.toLocaleString('es-AR')}"></div></div><div class="field"><label for="pmd">Medio</label><select class="select" id="pmd"><option value="transferencia">Transferencia</option><option value="mercadopago">Mercado Pago</option></select></div></div>`, footer: '<button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Registrar</button>' });
      s.el.querySelector('[data-x]').onclick = s.close;
      const ok = s.el.querySelector('[data-ok]');
      ok.onclick = () => run(ok, async () => { await S.net(120, 280); S.payDebt(b.dataset.id, Number(s.el.querySelector('#pm').value.replace(/\D/g, '')), actor(), s.el.querySelector('#pmd').value); s.close(); toast('Pago registrado', 'ok'); });
    },
  },
};

/* ───────────── shell del panel ───────────── */
const NAV = [
  ['/usuarios', 'Usuarios', 'users'],
  ['/verificaciones', 'Certificaciones y altas', 'shield'],
  ['/ordenes', 'Órdenes y pagos', 'clipboard'],
  ['/resenas', 'Moderación de reseñas', 'star'],
  ['/disputas', 'Reportes de usuarios', 'flag'],
  ['/comisiones', 'Comisiones', 'percent'],
];
// Sin analítica comercial, cohortes ni configuración de políticas no especificadas.
['/dashboard','/traccion','/configuracion','/auditoria'].forEach(p=>delete views[p]);
let current = null;

function loginHtml() {
  return `<div class="login-wrap"><form class="login-box card pad stack" id="lf" novalidate>
    <span class="logo" data-logo style="font-weight:600;display:inline-flex;gap:8px;align-items:center"><span class="mark" style="width:22px;height:22px;background:var(--accent);color:var(--accent-text);border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px">R</span>Royal · Panel de operaciones</span>
    <div class="field"><label for="em">Email</label><input class="input" id="em" type="email" autocomplete="email"></div>
    <div class="field"><label for="pw">Contraseña</label><input class="input" id="pw" type="password" autocomplete="current-password"></div>
    <button class="btn primary" type="submit">Entrar</button>
    <button class="btn" type="button" id="quick">${icon('user', 'sm')}Entrar como Mesa de Operaciones (demo)</button>
  </form></div>`;
}

function logoMark() {
  return '<span style="width:22px;height:22px;background:var(--accent);color:var(--accent-text);border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:600">R</span>';
}

/* El marco del panel (sidebar + topbar) se dibuja una sola vez; al navegar o al llegar
   eventos en vivo solo se reemplaza el contenido. */
let shellReady = false;
function renderShell() {
  document.body.innerHTML = `<div class="shell">
    <aside class="side" id="side"><div class="brand"><span class="logo" data-logo style="font-weight:600;display:inline-flex;gap:8px;align-items:center">${logoMark()}Royal Ops</span><span class="xs faint mono" data-version>${APP_VERSION}</span></div>
      <nav id="nav"></nav>
      <div class="foot"><div class="row">${avatar(admin, 'sm')}<div class="grow"><div class="small strong">${esc(S.fullName(admin))}</div><div class="xs faint">Santa Fe capital</div></div></div></div></aside>
    <div class="main"><header class="topbar"><button class="btn ghost icon menu-btn" id="menu" aria-label="Menú">${icon('menu')}</button><span id="backSlot"></span><h1 id="ttl"></h1>
      <button class="btn ghost icon" id="bell" aria-label="Notificaciones" style="position:relative"></button>
      <button class="btn ghost icon" id="theme" aria-label="Cambiar tema"></button>
      <button class="btn ghost sm" id="logout">${icon('logout', 'sm')}Salir</button></header>
      <main class="content" id="content"></main></div></div>`;
  qs('#menu').onclick = () => qs('#side').classList.toggle('open');
  qs('#theme').onclick = () => { toggleTheme('admin'); updateChrome(); };
  qs('#logout').onclick = () => { S.logout('admin'); shellReady = false; render(); };
  qs('#bell').onclick = openNotifications;
  shellReady = true;
}

function render(navigated = true, force = false) {
  const uid = S.getSession('admin');
  admin = uid ? S.user(uid) : null;
  setPresenceUser(admin?.id || null);
  if (!admin) {
    shellReady = false;
    document.body.innerHTML = loginHtml();
    const f = qs('#lf');
    const doLogin = (email, pass, btn) => run(btn, async () => { await S.net(150, 300); S.login(email, pass, 'admin'); if (!location.hash || location.hash === '#/') location.hash = '#/usuarios'; render(); });
    f.onsubmit = (e) => { e.preventDefault(); doLogin(qs('#em').value, qs('#pw').value, f.querySelector('[type=submit]')); };
    qs('#quick').onclick = (e) => doLogin('admin@royal.com', 'demo1234', e.currentTarget);
    current = null;
    return;
  }
  if (!shellReady) { renderShell(); navigated = true; }
  const { path, query } = parseHash();
  const m = matchRoute(views, path);
  if (!m) { location.replace('#/usuarios'); return; }
  const view = m.view;
  if (!navigated && !force && current?.path === path) {
    // refresco en vivo: no pisar lo que se está escribiendo ni un modal abierto
    const a = document.activeElement;
    if ((a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && qs('#content').contains(a)) || document.querySelector('.modal') || view.live === false) { updateChrome(); return; }
  }
  const keepScroll = !navigated && current?.path === path ? window.scrollY : 0;
  current = { path, view, params: m.params };
  qs('#ttl').textContent = typeof view.title === 'function' ? view.title(m.params) : view.title;
  qs('#backSlot').innerHTML = view.back ? `<a class="btn ghost icon sm" href="#${view.back}" aria-label="Volver">${icon('left')}</a>` : '';
  const c = qs('#content');
  c.className = 'content' + (navigated ? ' enter' : '');
  c.innerHTML = view.render(m.params, query);
  view.mount?.(c, m.params);
  updateChrome();
  if (navigated) window.scrollTo(0, 0); else window.scrollTo(0, keepScroll);
  lastSig = signature();
}

function updateChrome() {
  const nav = qs('#nav');
  if (!nav || !current) return;
  nav.innerHTML = NAV.map(([p, l, ic, cnt]) => { const n = cnt ? cnt() : 0; return `<a href="#${p}" class="${current.path === p || current.path.startsWith(p + '/') ? 'on' : ''}" ${current.path === p ? 'aria-current="page"' : ''}>${icon(ic, 'sm')}${l}${n ? `<span class="count">${n}</span>` : ''}</a>`; }).join('');
  const unread = S.unreadCount(null, 'admin');
  qs('#bell').innerHTML = `${icon('bell')}${unread ? `<span class="count" style="position:absolute;top:4px;right:2px">${unread > 9 ? '9+' : unread}</span>` : ''}`;
  qs('#theme').innerHTML = icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon');
}

function openNotifications() {
  const list = S.notificationsOf(null, 'admin').slice(0, 30);
  const s = sheet({ modal: true, title: 'Notificaciones', body: list.length ? `<div class="list" style="border:0;margin:-16px">${list.map((n) => `<a class="li" href="#${esc(n.link)}"><span class="dot ${n.leida ? '' : 'accent'}"></span><div class="grow"><div class="small ${n.leida ? '' : 'strong'}">${esc(n.titulo)}</div><div class="xs muted">${esc(n.cuerpo)}</div></div><span class="xs faint mono">${fmtRel(n.t, S.now())}</span></a>`).join('')}</div>` : '<p class="muted">Sin notificaciones.</p>' });
  s.el.addEventListener('click', (e) => { if (e.target.closest('a')) s.close(); });
  S.markNotificationsRead(null, 'admin');
}

/** Refresco pedido por una acción del propio admin: siempre redibuja la pantalla actual. */
function refresh() { render(false, true); }

/* Solo refrescamos cuando cambió algo que el panel muestra (toda acción relevante deja un registro en
   auditoría o una notificación). Así el movimiento del mapa o el "escribiendo…" no redibujan el panel. */
let lastSig = '';
function signature() {
  const d = db();
  return `${d.audit[0]?.id}|${d.notifications[0]?.id}|${d.notifications.filter((n) => n.app === 'admin' && !n.leida).length}|${d.reviews.length}`;
}

/* ───────────── arranque ───────────── */
if (new URLSearchParams(location.search).get('reset') === '1') { S.resetAll(); location.replace(location.pathname + location.hash); }
document.body.classList.add('a');
initTheme('admin', 'light');
S.load();
document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-go]');
  if (g) { go(g.dataset.go); return; }
  const a = e.target.closest('[data-act]');
  if (!a || !current) return;
  const fn = current.view.actions?.[a.dataset.act];
  if (fn) { e.preventDefault(); fn(a, current.params); }
});
window.addEventListener('hashchange', () => { qs('#side')?.classList.remove('open'); render(true); });
let liveTimer = null;
const onChange = () => {
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => { if (admin && signature() !== lastSig) render(false); }, 250);
};
S.subscribe(onChange);
initSync('admin', () => { if (S.syncFromStorage()) onChange(); });
setInterval(() => S.tick(), 1500);
render(true);
initDevtools('admin');
