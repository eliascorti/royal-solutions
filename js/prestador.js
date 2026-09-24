// App del prestador
import * as S from './store.js';
import { RUBROS, BARRIOS, FRANJAS, DIAS, DIAS_LABEL, DOC_TIPOS, RIESGO_LABEL, MEDIOS, REVIEW_TAGS_PRESTADOR, MOTIVOS_RECHAZO, MOTIVOS_CANCELACION_PREST, MOTIVOS_DISPUTA } from './data.js';
import { startMobileApp, threadsOf, threadListHtml, profileFooter } from './shell.js';
import {
  icon, esc, money, moneyHtml, avatar, rating, stars, rubroIcon, statusBadge, empty, toast, sheet, confirmDialog, run,
  fmtDate, fmtDateY, fmtRel, fmtDay, fmtTime, plural, mapSvg, readImage, docImage, go, qs, qsa, orderProgress, providerProgress,
} from './ui.js';

const L = S.ESTADOS;
const me = (ctx) => ({ id: ctx.user.id, rol: 'prestador' });

/* ───────────── piezas ───────────── */
function applyBlockBanner(ctx) {
  const p = ctx.provider;
  const chk = S.canApply(p);
  if (chk.ok) return '';
  if (chk.debt) return `<div class="banner danger">${icon('lock')}<div class="grow"><b>Postulaciones pausadas.</b> ${esc(chk.reason)}</div><button class="btn sm" data-go="/billetera">Regularizar</button></div>`;
  if (p.estado === 'observado') return `<div class="banner warn">${icon('alert')}<div class="grow"><b>Tu alta tiene observaciones.</b> ${esc(p.observacion?.motivo || '')}</div><button class="btn sm" data-go="/alta/4">Corregir</button></div>`;
  if (['pendiente_revision', 'en_revision'].includes(p.estado)) return `<div class="banner info">${icon('hourglass')}<div><b>Estamos revisando tu documentación.</b> Podés ver trabajos, pero para postularte necesitamos validar tu identidad y matrícula. Suele tardar menos de 24 h.</div></div>`;
  if (p.estado === 'borrador') return `<div class="banner warn">${icon('alert')}<div class="grow"><b>Completá tu alta</b> para empezar a postularte.</div><button class="btn sm primary" data-go="/alta/1">Seguir</button></div>`;
  return `<div class="banner danger">${icon('ban')}<div>${esc(chk.reason)}</div></div>`;
}

function availBar(ctx) {
  const p = ctx.provider;
  const can = p.estado === 'aprobado';
  return `<div class="avail"><div><div class="strong small">${p.disponible ? 'Disponible ahora' : 'No disponible'}</div><div class="xs muted">${p.disponible ? 'Te mostramos a clientes cerca y recibís changas urgentes.' : 'No aparecés como disponible en las búsquedas.'}</div></div>
    <label class="switch"><input type="checkbox" id="avail" ${p.disponible ? 'checked' : ''} ${can ? '' : 'disabled'} aria-label="Disponible ahora"><span></span></label></div>`;
}
function bindAvail(el, ctx) {
  el.querySelector('#avail')?.addEventListener('change', (e) => { S.setAvailable(ctx.provider.id, e.target.checked); toast(e.target.checked ? 'Estás disponible' : 'Quedaste no disponible', 'ok'); });
}

function jobRow(ctx, { r, km, mine }) {
  const rb = S.rubro(r.rubroId);
  const n = S.applicationsOf(r.id).length;
  const workable = S.canWorkRubro(ctx.provider, r.rubroId);
  return `<button class="pcard" data-go="/trabajo/${r.id}">
    <span class="av" style="background:var(--surface-2);color:var(--text)">${icon(rb.icono)}</span>
    <div class="grow"><div class="row between"><span class="strong small ellipsis">${esc(r.descripcion)}</span></div>
    <div class="meta"><span class="mono">${km} km</span><span>${esc(S.barrio(r.direccion.barrio).nombre)}</span><span>${fmtRel(r.creadoEn, S.now())}</span>${r.presupuestoRef ? `<span class="mono">Ref. ${money(r.presupuestoRef)}</span>` : ''}</div>
    <div class="row wrap gap-1" style="margin-top:4px">${r.urgente ? `<span class="badge accent">${icon('zap')}Urgente</span>` : ''}${r.cuando.tipo === 'asap' ? '<span class="badge">Lo antes posible</span>' : `<span class="badge">${fmtDay(r.cuando.fecha)} · ${FRANJAS[r.cuando.franja].split(' ')[0]}</span>`}<span class="badge outline">${plural(n, 'postulado', 'postulados')}</span>${mine ? '<span class="badge ok">Te postulaste</span>' : ''}${!workable ? '<span class="badge danger">Matrícula no vigente</span>' : ''}</div></div></button>`;
}

function orderCard(o) {
  const cu = S.user(o.clienteId);
  return `<button class="active-order" data-go="/orden/${o.id}" ${o.estado === 'pendiente_confirmacion' ? '' : 'style="border-left-color:var(--info)"'}>
    <div class="row between"><span class="upper"><span class="mono">${o.id}</span> · ${esc(S.rubro(o.rubroId).nombre)}</span>${statusBadge('order', o.estado, L)}</div>
    <div class="row" style="margin-top:6px">${avatar(cu, 'sm')}<div class="grow"><div class="strong small">${esc(cu.nombre)} ${esc(cu.apellido[0])}. · ${moneyHtml(o.montoFinal || o.precioAcordado)}</div><div class="xs muted ellipsis">${esc(o.descripcion)}</div></div>
    ${o.estado === 'pendiente_confirmacion' ? `<span class="badge warn mono" data-countdown="${o.confirmarAntesDe}">--:--</span>` : icon('right', 'sm')}</div></button>`;
}

/* ───────────── Trabajos (feed) ───────────── */
const feedState = { rubro: null, urgentes: false, radio: null, vista: 'lista' };
const trabajos = {
  tab: '/trabajos', title: 'Trabajos', cls: 'flush',
  render(ctx) {
    const p = ctx.provider;
    let jobs = S.openJobsFor(p);
    if (feedState.rubro) jobs = jobs.filter((j) => j.r.rubroId === feedState.rubro);
    if (feedState.urgentes) jobs = jobs.filter((j) => j.r.urgente);
    if (feedState.radio) jobs = jobs.filter((j) => j.km <= feedState.radio);
    const orders = S.ordersOfProvider(p.id).filter((o) => S.ACTIVE.includes(o.estado));
    const pend = orders.filter((o) => o.estado === 'pendiente_confirmacion');
    const act = orders.filter((o) => o.estado !== 'pendiente_confirmacion');
    return `${availBar(ctx)}<div style="padding:16px" class="stack">
      ${applyBlockBanner(ctx)}
      ${pend.length ? `<div class="upper">Para confirmar</div>${pend.map(orderCard).join('')}` : ''}
      ${act.length ? `<div class="upper">En curso</div>${act.map(orderCard).join('')}` : ''}
      <div class="row between"><h2>Changas cerca</h2><div class="seg" style="width:140px"><button class="${feedState.vista === 'lista' ? 'on' : ''}" data-act="vista" data-v="lista" aria-label="Lista">${icon('list', 'sm')}</button><button class="${feedState.vista === 'mapa' ? 'on' : ''}" data-act="vista" data-v="mapa" aria-label="Mapa">${icon('map', 'sm')}</button></div></div>
      <div class="chips">
        <button class="chip ${!feedState.rubro ? 'on' : ''}" data-act="rubro" data-v="">Mis rubros</button>
        ${p.rubros.map((r) => `<button class="chip ${feedState.rubro === r ? 'on' : ''}" data-act="rubro" data-v="${r}">${esc(S.rubro(r).nombre)}</button>`).join('')}
        <button class="chip ${feedState.urgentes ? 'on' : ''}" data-act="urg">${icon('zap', 'sm')}Urgentes</button>
        ${[3, 6].map((k) => `<button class="chip ${feedState.radio === k ? 'on' : ''}" data-act="radio" data-v="${k}">≤ ${k} km</button>`).join('')}
      </div>
      ${!jobs.length ? empty('briefcase', 'No hay changas con estos filtros', 'Te avisamos apenas un vecino publique algo de tus rubros cerca.', '<button class="btn sm" data-act="clear">Ver todas</button>')
        : feedState.vista === 'mapa' ? `${mapSvg({ me: p, jobs: jobs.map((j) => ({ x: j.r.direccion.x, y: j.r.direccion.y, id: j.r.id })), highlight: p.barrios, pinAction: 'job' })}<p class="xs faint">Rombos: changas abiertas · punto azul: tu base · sombreado: tu zona</p>`
        : `<div class="card list">${jobs.map((j) => jobRow(ctx, j)).join('')}</div>`}
    </div>`;
  },
  mount: bindAvail,
  actions: {
    vista: (b, e, ctx) => { feedState.vista = b.dataset.v; ctx.refresh(); },
    rubro: (b, e, ctx) => { feedState.rubro = b.dataset.v || null; ctx.refresh(); },
    urg: (b, e, ctx) => { feedState.urgentes = !feedState.urgentes; ctx.refresh(); },
    radio: (b, e, ctx) => { const v = Number(b.dataset.v); feedState.radio = feedState.radio === v ? null : v; ctx.refresh(); },
    clear: (b, e, ctx) => { Object.assign(feedState, { rubro: null, urgentes: false, radio: null }); ctx.refresh(); },
    job: (b) => go(`/trabajo/${b.dataset.id}`),
  },
};

/* ───────────── Detalle de trabajo + postulación ───────────── */
const PLANTILLAS = [
  'Hola, puedo pasar hoy. Llevo los materiales básicos y te confirmo el precio final al ver el trabajo.',
  'Buenas, tengo experiencia con este tipo de arreglo. Lo resuelvo en el día, con garantía de 30 días.',
  'Estoy cerca de tu zona. Si te sirve paso en la franja que elegiste.',
];
const trabajo = {
  back: true, title: (ctx) => ctx.params.id, skeleton: 'detail', live: false,
  render(ctx) {
    const r = S.request(ctx.params.id);
    if (!r) return empty('alert', 'Changa no encontrada', '');
    const p = ctx.provider;
    const cu = S.user(r.clienteId);
    const rc = S.ratingOf(cu.id, 'p2c');
    const km = S.distKm(p, r.direccion);
    const mine = S.getDb().applications.find((a) => a.requestId === r.id && a.providerId === p.id && a.estado === 'activa');
    const open = ['abierta', 'con_postulaciones'].includes(r.estado);
    const chk = S.canApply(p);
    const workable = S.canWorkRubro(p, r.rubroId);
    const rb = S.rubro(r.rubroId);
    const sug = mine?.precio || Math.round(((r.presupuestoRef || (rb.precio[0] + rb.precio[1]) / 2 * 0.8) * (r.urgente ? 1.2 : 1)) / 500) * 500;
    const fecha = mine?.fecha || r.cuando.fecha || S.isoDate(S.now());
    const franja = mine?.franja || r.cuando.franja || S.currentFranja();
    return `<div class="stack">
      <div class="row wrap gap-1">${statusBadge('request', r.estado, L)}${r.urgente ? `<span class="badge accent">${icon('zap')}Urgente · +${S.getDb().config.recargoUrgentePct}% sugerido</span>` : ''}</div>
      <div class="row top">${icon(rb.icono, 'lg')}<div class="grow"><h1 style="font-size:19px">${esc(r.descripcion)}</h1><div class="small muted">${esc(rb.nombre)} · ${esc(S.barrio(r.direccion.barrio).nombre)} · <span class="mono">${km} km</span></div></div></div>
      ${r.fotos?.length ? `<div class="photos">${r.fotos.map((f) => `<div class="ph"><img src="${f}" alt="Foto del cliente"></div>`).join('')}</div>` : ''}
      <dl class="kv card pad"><dt>Cuándo</dt><dd>${r.cuando.tipo === 'asap' ? 'Lo antes posible' : `${fmtDay(r.cuando.fecha)} · ${FRANJAS[r.cuando.franja]}`}</dd><dt>Presupuesto de referencia</dt><dd>${r.presupuestoRef ? moneyHtml(r.presupuestoRef) : 'Sin referencia'}</dd><dt>Pago previsto</dt><dd>${MEDIOS[r.medioPrevisto].label}</dd><dt>Publicada</dt><dd class="mono">${fmtRel(r.creadoEn, S.now())}</dd><dt>Postulados</dt><dd class="mono">${S.applicationsOf(r.id).length}</dd><dt>Comisión Royal</dt><dd class="mono">${rb.comision}%</dd></dl>
      <div class="card list"><div class="li">${avatar(cu)}<div class="grow"><div class="small strong">${esc(cu.nombre)} ${esc(cu.apellido[0])}.</div><div class="xs muted">Cliente desde ${fmtDateY(cu.creadoEn)} · ${rc.count ? `${rc.avg.toFixed(1)} ★ como cliente (${rc.count})` : 'Sin calificaciones como cliente'}</div></div></div></div>
      <p class="xs faint">La dirección exacta se comparte cuando el cliente te contrata.</p>
      ${!open ? '<div class="banner">Esta changa ya no recibe postulaciones.</div>' : !chk.ok ? applyBlockBanner(ctx) : !workable ? `<div class="banner danger">${icon('badge')}<div>Tu matrícula de ${esc(rb.nombre.toLowerCase())} no está vigente. <a href="#/documentos">Renovala</a> para postularte.</div></div>` : `
      <div class="section-title"><h2>${mine ? 'Tu postulación' : 'Postularme'}</h2>${mine ? `<span class="xs faint mono">enviada ${fmtRel(mine.creadoEn, S.now())}</span>` : ''}</div>
      <form id="af" class="stack" novalidate>
        <div class="field"><label for="pr">Tu precio</label><div class="input-group"><span class="prefix">$</span><input class="input" id="pr" inputmode="numeric" value="${sug.toLocaleString('es-AR')}"></div><span class="hint">Recibís <span class="mono" id="net">${money(sug * (1 - rb.comision / 100))}</span> después de la comisión de ${rb.comision}%.</span></div>
        <div class="field"><label for="ms">Mensaje</label><textarea class="textarea" id="ms">${esc(mine?.mensaje || '')}</textarea><div class="chips" id="tpl">${PLANTILLAS.map((t, i) => `<button type="button" class="chip" data-i="${i}">Plantilla ${i + 1}</button>`).join('')}</div></div>
        <div class="row gap-3"><div class="field grow"><label for="fe">Fecha</label><input class="input mono" type="date" id="fe" value="${fecha}" min="${S.isoDate(S.now())}"></div><div class="field grow"><label for="fr">Franja</label><select class="select" id="fr">${Object.entries(FRANJAS).map(([k, v]) => `<option value="${k}" ${k === franja ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>
      </form>`}
    </div>`;
  },
  cta(ctx) {
    const r = S.request(ctx.params.id);
    if (!r || !['abierta', 'con_postulaciones'].includes(r.estado) || !S.canApply(ctx.provider).ok || !S.canWorkRubro(ctx.provider, r.rubroId)) return '';
    const mine = S.getDb().applications.find((a) => a.requestId === r.id && a.providerId === ctx.provider.id && a.estado === 'activa');
    return mine ? '<button class="btn" data-act="withdraw">Retirar</button><button class="btn primary" data-act="apply">Guardar cambios</button>' : '<button class="btn primary" data-act="apply">Enviar postulación</button>';
  },
  mount(el, ctx) {
    const r = S.request(ctx.params.id);
    const pr = el.querySelector('#pr');
    if (!pr) return;
    const pct = S.rubro(r.rubroId).comision;
    pr.addEventListener('input', () => { const n = Number(pr.value.replace(/\D/g, '')); pr.value = n ? n.toLocaleString('es-AR') : ''; el.querySelector('#net').textContent = money(n * (1 - pct / 100)); });
    el.querySelector('#tpl').onclick = (e) => { const b = e.target.closest('[data-i]'); if (b) el.querySelector('#ms').value = PLANTILLAS[b.dataset.i]; };
  },
  actions: {
    apply(b, e, ctx) {
      const precio = Number(qs('#pr').value.replace(/\D/g, ''));
      const mensaje = qs('#ms').value.trim();
      if (!(precio > 0)) { toast('Ingresá tu precio', 'err'); return; }
      if (mensaje.length < 10) { toast('Escribí un mensaje corto para el cliente (o usá una plantilla)', 'err'); return; }
      run(b, async () => {
        await S.net();
        const existed = S.getDb().applications.some((a) => a.requestId === ctx.params.id && a.providerId === ctx.provider.id && a.estado === 'activa');
        S.applyToJob(ctx.provider.id, ctx.params.id, { precio, mensaje, fecha: qs('#fe').value, franja: qs('#fr').value });
        toast(existed ? 'Postulación actualizada' : 'Te postulaste', 'ok');
        ctx.refresh();
      });
    },
    async withdraw(b, e, ctx) {
      const a = S.getDb().applications.find((x) => x.requestId === ctx.params.id && x.providerId === ctx.provider.id && x.estado === 'activa');
      if (a && await confirmDialog('El cliente deja de ver tu postulación.', { title: 'Retirar postulación', ok: 'Retirar', danger: true })) run(null, async () => { await S.net(); S.withdrawApplication(a.id); toast('Postulación retirada', 'ok'); ctx.refresh(); });
    },
  },
};

/* ───────────── Orden (flujo de ejecución) ───────────── */
function reasonSheet(title, reasons, warn = '') {
  return new Promise((resolve) => {
    let done = false;
    const s = sheet({
      title,
      body: `<div class="stack">${warn ? `<div class="banner warn">${icon('alert')}<div>${esc(warn)}</div></div>` : ''}<div class="stack" id="rs" style="gap:8px">${reasons.map((r, i) => `<button type="button" class="opt ${i === 0 ? 'on' : ''}" data-v="${esc(r)}">${esc(r)}</button>`).join('')}</div></div>`,
      footer: '<button class="btn" data-no>Volver</button><button class="btn danger solid grow" data-ok>Confirmar</button>',
      onClose: () => { if (!done) resolve(null); },
    });
    s.el.querySelector('#rs').onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; s.el.querySelectorAll('#rs .opt').forEach((x) => x.classList.toggle('on', x === b)); };
    s.el.querySelector('[data-no]').onclick = () => { done = true; resolve(null); s.close(); };
    s.el.querySelector('[data-ok]').onclick = () => { done = true; resolve(s.el.querySelector('#rs .on').dataset.v); s.close(); };
  });
}

const orden = {
  back: true, title: (ctx) => ctx.params.id, skeleton: 'detail',
  render(ctx) {
    const o = S.order(ctx.params.id);
    if (!o || o.providerId !== ctx.provider.id) return empty('alert', 'Orden no encontrada', '');
    const cu = S.user(o.clienteId);
    const rc = S.ratingOf(cu.id, 'p2c');
    const pay = S.paymentOf(o.id);
    const showAddr = !['pendiente_confirmacion', 'rechazada', 'vencida'].includes(o.estado);
    const d = o.disputaId && S.dispute(o.disputaId);
    const head = {
      pendiente_confirmacion: ['Nueva orden para confirmar', `Tenés <b class="mono" data-countdown="${o.confirmarAntesDe}">--:--</b> para aceptar. Si vence, se cancela sola.`],
      confirmada: ['Orden confirmada', o.asap ? 'El cliente te espera lo antes posible.' : `${fmtDay(o.fecha)} · ${FRANJAS[o.franja]}`],
      en_camino: [o.tracking?.arrived ? 'Llegaste' : `En camino · ${o.tracking?.eta ?? '—'} min`, 'Pedile al cliente su código de 4 dígitos para iniciar.'],
      en_curso: ['Trabajo en curso', 'Cuando termines, informá el monto cobrado.'],
      finalizada_pend_cliente: ['Esperando confirmación del cliente', `Informaste ${money(o.montoFinal)} · ${MEDIOS[o.medio].label}.`],
      finalizada: ['Orden finalizada', o.calificoPrestador ? 'Ya calificaste al cliente.' : 'Calificá al cliente.'],
      calificada: ['Orden finalizada y calificada', ''],
      en_disputa: ['En revisión por Royal', 'Sumá tu versión y evidencia. Te avisamos la resolución.'],
      resuelta: ['Reporte resuelto', d?.resolucion?.nota || ''],
      cancelada: ['Orden cancelada', `${o.cancelacion?.actor === 'prestador' ? 'La cancelaste' : 'La canceló el cliente'}: ${o.cancelacion?.motivo || ''}${o.cancelacion?.tardia ? ' · tardía' : ''}`],
      rechazada: ['Rechazaste la orden', ''], vencida: ['Venció sin confirmar', 'No respondiste dentro del plazo.'],
    }[o.estado] || [L.order[o.estado], ''];
    return `<div class="stack">
      <div class="card pad stack" style="gap:6px;border-left:3px solid var(--accent)"><div class="row between">${statusBadge('order', o.estado, L)}${o.garantia ? `<span class="badge ok">${icon('shield')}Garantía Royal</span>` : ''}</div><h1 style="font-size:20px">${esc(head[0])}</h1><p class="small muted">${head[1]}</p><div style="margin-top:6px">${orderProgress(o, L)}</div></div>
      ${o.estado === 'en_camino' && o.tracking ? mapSvg({ me: o.direccion, mover: { x: o.tracking.x, y: o.tracking.y, label: ctx.user.nombre[0] + ctx.user.apellido[0] }, dest: o.direccion }) : ''}
      ${o.estado === 'en_camino' ? `<div class="card pad stack"><label class="label" for="code">Código del cliente</label><input class="input code-input" id="code" inputmode="numeric" maxlength="4" autocomplete="one-time-code" placeholder="····"><p class="xs muted">${o.intentosCodigo ? `Intentos restantes: ${3 - o.intentosCodigo}. ` : ''}El código confirma que llegaste al domicilio correcto.</p></div>` : ''}
      ${d ? `<div class="banner ${d.estado === 'resuelta' ? 'ok' : 'warn'}">${icon('scale')}<div><b>${esc(d.id)} · ${esc(L.dispute[d.estado])}</b><div class="small">${esc(d.motivo)}</div>${d.resolucion ? `<div class="small">A favor de ${esc(d.resolucion.favor)}. ${esc(d.resolucion.nota || '')}</div>` : ''}</div></div>${d.estado !== 'resuelta' && !d.evidencias.some((ev) => ev.autor === ctx.user.id) ? '<button class="btn block" data-act="evidence">Sumar mi versión</button>' : ''}` : ''}
      <div class="card list"><div class="li">${avatar(cu)}<div class="grow"><div class="small strong">${esc(cu.nombre)} ${esc(cu.apellido)}</div><div class="xs muted">${rc.count ? `${rc.avg.toFixed(1)} ★ como cliente` : 'Cliente nuevo'}</div></div></div>
        <button class="li" data-go="/chat/${o.id}">${icon('message')}<span class="grow small">Mensajes</span>${(() => { const n = S.messagesOf(o.id).filter((m) => m.from !== ctx.user.id && !m.leido).length; return n ? `<span class="count">${n}</span>` : ''; })()}${icon('right', 'sm chev')}</button></div>
      <dl class="kv card pad">
        <dt>Trabajo</dt><dd>${esc(S.rubro(o.rubroId).nombre)}</dd><dt>Descripción</dt><dd>${esc(o.descripcion)}</dd>
        <dt>Dirección</dt><dd>${showAddr ? esc(o.direccion.calle) : `${esc(S.barrio(o.direccion.barrio).nombre)} <span class="xs faint">(completa al confirmar)</span>`}</dd>
        <dt>Cuándo</dt><dd>${o.asap ? 'Lo antes posible' : `${fmtDay(o.fecha)} · ${FRANJAS[o.franja]}`}</dd>
        <dt>Precio acordado</dt><dd>${moneyHtml(o.precioAcordado)}</dd>${o.montoFinal ? `<dt>Monto informado</dt><dd>${moneyHtml(o.montoFinal)}</dd>` : ''}
        <dt>Medio de pago</dt><dd>${MEDIOS[o.medio].label}</dd><dt>Comisión (${o.comisionPct}%)</dt><dd>${moneyHtml(Math.round((o.montoFinal || o.precioAcordado) * o.comisionPct / 100))}${o.medio === 'efectivo' ? ' <span class="xs muted">diferida</span>' : ''}</dd>
        ${pay ? `<dt>Pago</dt><dd>${statusBadge('payment', pay.estado, L)}</dd>` : ''}
      </dl>
      ${o.medio === 'efectivo' && S.ACTIVE.includes(o.estado) ? `<div class="banner info">${icon('cash')}<div>Cobrás en mano. La comisión de ${o.comisionPct}% se suma a tu deuda y la saldás desde Billetera.</div></div>` : ''}
      <div class="section-title"><h2>Timeline</h2></div>
      <ul class="timeline">${[...o.timeline].reverse().map((h, i) => `<li class="${i === 0 ? 'now' : ''}"><div>${esc(h.texto)}</div><div class="t">${fmtDate(h.t)} ${fmtTime(h.t)} · ${esc(h.actor)}</div></li>`).join('')}</ul>
      ${['en_curso', 'finalizada_pend_cliente', 'finalizada'].includes(o.estado) ? `<button class="btn ghost block" data-act="report">${icon('flag')}Reportar un problema</button>` : ''}
      ${['en_camino', 'en_curso'].includes(o.estado) ? `<button class="btn ghost block" data-act="help">${icon('lifebuoy')}Ayuda / emergencia</button>` : ''}
      ${['confirmada', 'en_camino'].includes(o.estado) ? '<button class="btn danger block" data-act="cancel">Cancelar orden</button>' : ''}
    </div>`;
  },
  cta(ctx) {
    const o = S.order(ctx.params.id);
    if (!o || o.providerId !== ctx.provider.id) return '';
    switch (o.estado) {
      case 'pendiente_confirmacion': return '<button class="btn danger" data-act="reject">Rechazar</button><button class="btn primary" data-act="accept">Aceptar</button>';
      case 'confirmada': return `<button class="btn primary" data-act="go">${icon('nav')}Salir hacia el domicilio</button>`;
      case 'en_camino': return '<button class="btn primary" data-act="code">Validar código</button>';
      case 'en_curso': return '<button class="btn primary" data-act="finish">Finalizar trabajo</button>';
      case 'finalizada': case 'calificada': case 'resuelta': return o.calificoPrestador ? '' : `<button class="btn primary" data-go="/calificar/${o.id}">Calificar al cliente</button>`;
      default: return '';
    }
  },
  actions: {
    accept(b, e, ctx) { run(b, async () => { await S.net(); S.acceptOrder(ctx.params.id, me(ctx)); toast('Orden confirmada', 'ok'); }); },
    async reject(b, e, ctx) { const m = await reasonSheet('Rechazar orden', MOTIVOS_RECHAZO); if (m) run(null, async () => { await S.net(); S.rejectOrder(ctx.params.id, me(ctx), m); toast('Orden rechazada', 'ok'); go('/trabajos'); }); },
    go(b, e, ctx) { run(b, async () => { await S.net(); S.startTrip(ctx.params.id, me(ctx)); toast('Le avisamos al cliente que vas en camino', 'ok'); }); },
    code(b, e, ctx) {
      const v = qs('#code')?.value.trim();
      if (!/^\d{4}$/.test(v || '')) { toast('El código tiene 4 dígitos', 'err'); return; }
      run(b, async () => {
        await S.net();
        const r = S.enterCode(ctx.params.id, v, me(ctx));
        if (r.ok) toast('Código correcto. ¡A trabajar!', 'ok');
        else toast(`Código incorrecto. Te quedan ${r.restantes} intentos.`, 'err');
      });
    },
    finish(b, e, ctx) {
      const o = S.order(ctx.params.id);
      const s = sheet({
        title: 'Finalizar trabajo',
        body: `<div class="stack"><div class="field"><label for="mf">Monto ${o.medio === 'efectivo' ? 'cobrado en efectivo' : 'a cobrar'}</label><div class="input-group"><span class="prefix">$</span><input class="input" id="mf" inputmode="numeric" value="${o.precioAcordado.toLocaleString('es-AR')}"></div><span class="hint">Acordado: <span class="mono">${money(o.precioAcordado)}</span>. Si cambió, explicale el motivo al cliente por el chat.</span></div>
          <p class="small muted">El cliente confirma el monto en su app. ${o.medio === 'efectivo' ? `Se registra una comisión de ${o.comisionPct}% a saldar.` : `La comisión de ${o.comisionPct}% se descuenta al acreditarse.`}</p></div>`,
        footer: '<button class="btn primary block" data-ok>Informar y finalizar</button>',
      });
      const inp = s.el.querySelector('#mf');
      inp.addEventListener('input', () => { const n = Number(inp.value.replace(/\D/g, '')); inp.value = n ? n.toLocaleString('es-AR') : ''; });
      const ok = s.el.querySelector('[data-ok]');
      ok.onclick = () => run(ok, async () => { await S.net(); S.finishOrder(o.id, Number(inp.value.replace(/\D/g, '')), me(ctx)); s.close(); toast('Listo. Esperamos la confirmación del cliente.', 'ok'); });
    },
    async cancel(b, e, ctx) {
      const o = S.order(ctx.params.id);
      const late = S.isLateCancel(o);
      const m = await reasonSheet('Cancelar orden', MOTIVOS_CANCELACION_PREST, late ? 'Cancelación tardía: suma a tu historial y afecta tu posición en las búsquedas.' : '');
      if (m) run(null, async () => { await S.net(); S.cancelOrder(o.id, me(ctx), m); toast('Orden cancelada', 'ok'); });
    },
    report(b, e, ctx) {
      const s = sheet({ title: 'Reportar un problema', body: `<div class="stack"><div class="stack" id="mo" style="gap:8px">${MOTIVOS_DISPUTA.map((m, i) => `<button type="button" class="opt ${i === 0 ? 'on' : ''}" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div><div class="field"><label for="de">Descripción</label><textarea class="textarea" id="de"></textarea></div></div>`, footer: '<button class="btn danger solid block" data-ok>Enviar reporte</button>' });
      s.el.querySelector('#mo').onclick = (ev) => { const bt = ev.target.closest('[data-v]'); if (!bt) return; s.el.querySelectorAll('#mo .opt').forEach((x) => x.classList.toggle('on', x === bt)); };
      const ok = s.el.querySelector('[data-ok]');
      ok.onclick = () => run(ok, async () => { const de = s.el.querySelector('#de').value.trim(); if (de.length < 10) throw new S.AppError('Describí el problema (mínimo 10 caracteres).'); await S.net(); S.openDispute(ctx.params.id, me(ctx), { motivo: s.el.querySelector('#mo .on').dataset.v, descripcion: de }); s.close(); toast('Reporte enviado', 'ok'); });
    },
    evidence(b, e, ctx) {
      const o = S.order(ctx.params.id);
      const s = sheet({ title: 'Tu versión', body: '<div class="field"><label for="ev">Contá qué pasó</label><textarea class="textarea" id="ev"></textarea></div>', footer: '<button class="btn primary block" data-ok>Enviar</button>' });
      const ok = s.el.querySelector('[data-ok]');
      ok.onclick = () => run(ok, async () => { const t = s.el.querySelector('#ev').value.trim(); if (t.length < 10) throw new S.AppError('Escribí al menos 10 caracteres.'); await S.net(); S.addEvidence(o.disputaId, ctx.user.id, t); s.close(); toast('Enviado a Royal', 'ok'); });
    },
    help(b, e, ctx) {
      const s = sheet({ title: 'Ayuda', body: `<div class="stack"><a class="btn danger solid block" href="tel:911">${icon('alert')}Emergencia · 911</a><button class="btn block" data-h="Situación de riesgo en el domicilio">Situación de riesgo en el domicilio</button><button class="btn block" data-h="El cliente no está / no responde">El cliente no está / no responde</button><button class="btn block" data-h="Otro problema">Otro problema</button></div>` });
      s.el.querySelectorAll('[data-h]').forEach((bt) => { bt.onclick = () => run(bt, async () => { await S.net(); S.requestHelp(ctx.params.id, ctx.user.id, bt.dataset.h); s.close(); toast('Soporte fue notificado con prioridad', 'ok'); }); });
    },
  },
};

const calificar = {
  back: true, title: 'Calificar al cliente', skeleton: false, live: false,
  render(ctx) {
    const o = S.order(ctx.params.id);
    const cu = S.user(o.clienteId);
    if (!['finalizada', 'calificada', 'resuelta'].includes(o.estado)) return empty('lock', 'Todavía no podés calificar', 'Se habilita cuando el cliente confirma el pago.');
    if (o.calificoPrestador) return empty('check', 'Ya calificaste', '', `<button class="btn" data-go="/orden/${o.id}">Ver orden</button>`);
    return `<div class="stack center">${avatar(cu, 'lg')}<h1>¿Cómo fue trabajar con ${esc(cu.nombre)}?</h1>
      <div class="starpick" id="sp">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-n="${n}" aria-label="${n} estrellas">${icon('star')}</button>`).join('')}</div>
      <div class="chips wrap" id="tg" style="justify-content:center">${REVIEW_TAGS_PRESTADOR.map((t) => `<button type="button" class="chip" data-t="${t}">${t}</button>`).join('')}</div>
      <div class="field" style="text-align:left"><label for="cm">Comentario (opcional)</label><textarea class="textarea" id="cm"></textarea></div></div>`;
  },
  cta: (ctx) => { const o = S.order(ctx.params.id); return ['finalizada', 'calificada', 'resuelta'].includes(o.estado) && !o.calificoPrestador ? '<button class="btn primary" data-act="send">Enviar</button>' : ''; },
  mount(el) {
    calificar._s = 0; calificar._t = new Set();
    el.querySelector('#sp')?.addEventListener('click', (e) => { const b = e.target.closest('[data-n]'); if (!b) return; calificar._s = Number(b.dataset.n); qsa('#sp button').forEach((x) => x.classList.toggle('on', Number(x.dataset.n) <= calificar._s)); });
    el.querySelector('#tg')?.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (!b) return; b.classList.toggle('on'); calificar._t.has(b.dataset.t) ? calificar._t.delete(b.dataset.t) : calificar._t.add(b.dataset.t); });
  },
  actions: {
    send(b, e, ctx) {
      if (!calificar._s) { toast('Elegí de 1 a 5 estrellas', 'err'); return; }
      run(b, async () => { await S.net(); S.submitReview(ctx.params.id, ctx.user.id, { estrellas: calificar._s, tags: [...calificar._t], comentario: qs('#cm').value }); toast('Calificación enviada', 'ok'); go(`/orden/${ctx.params.id}`, { drop: '/calificar/' }); });
    },
  },
};

/* ───────────── Agenda ───────────── */
let agendaDay = null, agendaMode = 'dia';
const agenda = {
  tab: '/agenda', title: 'Agenda',
  render(ctx) {
    const p = ctx.provider;
    const days = Array.from({ length: 7 }, (_, i) => S.isoDate(S.now() + i * 86400000));
    if (!agendaDay || !days.includes(agendaDay)) agendaDay = days[0];
    const orders = S.ordersOfProvider(p.id).filter((o) => ['confirmada', 'en_camino', 'en_curso', 'pendiente_confirmacion', 'finalizada_pend_cliente'].includes(o.estado));
    const byDay = (d) => orders.filter((o) => (o.asap ? S.isoDate(o.creadoEn) : o.fecha) === d);
    const dow = (d) => ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][new Date(d + 'T12:00:00').getDay()];
    const slotHtml = (d) => Object.entries(FRANJAS).map(([k, v]) => {
      const os = byDay(d).filter((o) => o.franja === k || (o.asap && S.currentFranja(o.creadoEn) === k));
      const avail = (p.disponibilidad[dow(d)] || []).includes(k);
      return `<div class="slot"><div class="h">${v.split(' ')[1]}</div><div class="c">${os.length ? os.map((o) => `<button class="active-order" style="padding:8px 10px" data-go="/orden/${o.id}"><div class="row between"><span class="small strong">${esc(S.rubro(o.rubroId).nombre)} · ${esc(S.user(o.clienteId).nombre)}</span>${statusBadge('order', o.estado, L)}</div><div class="xs muted">${esc(S.barrio(o.direccion.barrio).nombre)} · <span class="mono">${o.id}</span></div></button>`).join('') : avail ? '<span class="xs faint">Libre</span>' : '<div class="blocked">Franja bloqueada · fuera de tu disponibilidad</div>'}</div></div>`;
    }).join('');
    return `<div class="stack">
      <div class="seg"><button class="${agendaMode === 'dia' ? 'on' : ''}" data-act="mode" data-v="dia">Día</button><button class="${agendaMode === 'semana' ? 'on' : ''}" data-act="mode" data-v="semana">Semana</button></div>
      ${agendaMode === 'dia' ? `<div class="week">${days.map((d) => { const dd = new Date(d + 'T12:00:00'); return `<button class="${d === agendaDay ? 'on' : ''}" data-act="day" data-v="${d}">${DIAS_LABEL[dow(d)]}<b>${dd.getDate()}</b>${byDay(d).length ? '<i></i>' : '<span style="height:5px"></span>'}</button>`; }).join('')}</div>
      <div><div class="upper" style="margin-bottom:4px">${fmtDay(agendaDay)}</div>${slotHtml(agendaDay)}</div>`
        : days.map((d) => `<div><div class="upper">${fmtDay(d)}</div>${byDay(d).length ? `<div class="card list">${byDay(d).map((o) => `<button class="li" data-go="/orden/${o.id}">${rubroIcon(o.rubroId)}<div class="grow"><div class="small strong">${esc(o.descripcion)}</div><div class="xs muted">${o.asap ? 'Lo antes posible' : FRANJAS[o.franja]} · ${esc(S.barrio(o.direccion.barrio).nombre)}</div></div>${statusBadge('order', o.estado, L)}</button>`).join('')}</div>` : '<p class="xs faint">Sin órdenes</p>'}</div>`).join('')}
      <button class="btn block" data-go="/historial">${icon('clock')}Historial de órdenes</button>
    </div>`;
  },
  actions: {
    day: (b, e, ctx) => { agendaDay = b.dataset.v; ctx.refresh(); },
    mode: (b, e, ctx) => { agendaMode = b.dataset.v; ctx.refresh(); },
  },
};

const historial = {
  back: true, title: 'Historial',
  render(ctx) {
    const os = S.ordersOfProvider(ctx.provider.id);
    if (!os.length) return empty('clock', 'Sin órdenes todavía', 'Postulate a changas cerca para conseguir tu primer trabajo.', '<button class="btn primary" data-go="/trabajos">Ver trabajos</button>');
    const groups = [['Activas', S.ACTIVE], ['Finalizadas', ['finalizada', 'calificada', 'resuelta']], ['Canceladas, rechazadas o vencidas', ['cancelada', 'rechazada', 'vencida']]];
    return `<div class="stack">${groups.map(([t, st]) => { const g = os.filter((o) => st.includes(o.estado)); return g.length ? `<div class="upper">${t} · ${g.length}</div><div class="card list">${g.map((o) => `<button class="li" data-go="/orden/${o.id}">${rubroIcon(o.rubroId)}<div class="grow"><div class="small ellipsis">${esc(o.descripcion)}</div><div class="xs muted"><span class="mono">${o.id}</span> · ${fmtDate(o.creadoEn)} · ${esc(S.user(o.clienteId).nombre)}</div></div><div class="col" style="align-items:flex-end;gap:2px"><span class="small">${moneyHtml(o.montoFinal || o.precioAcordado)}</span>${statusBadge('order', o.estado, L)}</div></button>`).join('')}</div>` : ''; }).join('')}</div>`;
  },
};

/* ───────────── Billetera ───────────── */
const billetera = {
  tab: '/billetera', title: 'Billetera',
  render(ctx) {
    const p = ctx.provider;
    const db = S.getDb();
    const movs = db.ledger.filter((m) => m.providerId === p.id).sort((a, b) => b.t - a.t);
    const d0 = new Date(S.now()); d0.setDate(1); d0.setHours(0, 0, 0, 0);
    const mes = movs.filter((m) => m.t >= d0.getTime());
    const ingresos = mes.filter((m) => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0);
    const trabajos = mes.filter((m) => m.tipo === 'ingreso').length;
    const deducidas = -mes.filter((m) => m.tipo === 'comision_deducida').reduce((a, m) => a + m.monto, 0);
    const deuda = S.debtOf(p.id);
    const lim = db.config.limiteDeuda;
    const pct = Math.min(100, (deuda / lim) * 100);
    const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][d0.getMonth()];
    const label = { ingreso: 'Cobro', comision_deducida: 'Comisión deducida', deuda_efectivo: 'Comisión por efectivo', pago_deuda: 'Pago de deuda', ajuste_disputa: 'Ajuste por disputa' };
    return `<div class="stack">
      <div class="card pad"><div class="upper">Ingresos de ${MES}</div><div class="big">${money(ingresos)}</div><div class="small muted">${plural(trabajos, 'trabajo cobrado', 'trabajos cobrados')}</div></div>
      <div class="stat-grid"><div><div class="xs muted">Comisiones deducidas</div><div class="v">${money(deducidas)}</div><div class="xs faint">pagos digitales</div></div><div><div class="xs muted">Deuda por efectivo</div><div class="v" style="color:${deuda >= lim ? 'var(--danger)' : 'inherit'}">${money(deuda)}</div><div class="xs faint">a saldar</div></div></div>
      <div class="card pad stack" style="gap:8px"><div class="row between small"><span>Límite de deuda</span><span class="mono">${money(deuda)} / ${money(lim)}</span></div><div class="bar ${pct >= 100 ? 'danger' : pct > 70 ? 'warn' : 'ok'}"><i style="width:${pct}%"></i></div>
        ${deuda >= lim ? `<div class="banner danger">${icon('lock')}<div><b>Postulaciones bloqueadas.</b> Superaste el límite de ${money(lim)}. Regularizá para volver a postularte.</div></div>` : `<p class="xs muted">Cuando cobrás en efectivo, la comisión (3–5%) queda como deuda. Si llegás a ${money(lim)} se pausan tus postulaciones.</p>`}
        <button class="btn ${deuda >= lim ? 'primary' : ''} block" data-act="pay" ${deuda <= 0 ? 'disabled' : ''}>Regularizar ${deuda > 0 ? money(deuda) : ''}</button></div>
      <div class="section-title"><h2>Movimientos</h2></div>
      ${movs.length ? `<div class="card list">${movs.slice(0, 40).map((m) => `<div class="li"><div class="grow"><div class="small">${label[m.tipo]}</div><div class="xs muted">${esc(m.detalle)} · ${fmtDate(m.t)}</div></div><span class="money small" style="color:${m.tipo === 'ingreso' || m.tipo === 'pago_deuda' ? 'var(--ok)' : m.tipo === 'deuda_efectivo' ? 'var(--warn)' : 'var(--text-2)'}">${m.tipo === 'comision_deducida' ? '− ' + money(-m.monto) : m.tipo === 'deuda_efectivo' ? '+ ' + money(m.monto) + ' deuda' : m.tipo === 'pago_deuda' ? '− ' + money(m.monto) + ' deuda' : money(m.monto)}</span></div>`).join('')}</div>` : empty('wallet', 'Sin movimientos', 'Tus cobros y comisiones van a aparecer acá.')}
    </div>`;
  },
  actions: {
    pay(b, e, ctx) {
      const deuda = S.debtOf(ctx.provider.id);
      const s = sheet({ title: 'Regularizar deuda', body: `<div class="stack"><div class="card pad center"><div class="upper">Total adeudado</div><div class="big">${money(deuda)}</div></div><div class="stack" id="pm" style="gap:8px">${['mercadopago', 'transferencia'].map((m, i) => `<button type="button" class="opt ${i === 0 ? 'on' : ''}" data-v="${m}">${icon(MEDIOS[m].icono)}<span class="grow small">${MEDIOS[m].label}</span></button>`).join('')}</div><p class="xs faint">Pago simulado para la demo.</p></div>`, footer: `<button class="btn primary block" data-ok>Pagar ${money(deuda)}</button>` });
      s.el.querySelector('#pm').onclick = (ev) => { const bt = ev.target.closest('[data-v]'); if (!bt) return; s.el.querySelectorAll('#pm .opt').forEach((x) => x.classList.toggle('on', x === bt)); };
      const ok = s.el.querySelector('[data-ok]');
      ok.onclick = () => run(ok, async () => { await S.net(700, 1200); S.payDebt(ctx.provider.id, deuda, me(ctx), s.el.querySelector('#pm .on').dataset.v); s.close(); toast('Deuda saldada. Ya podés postularte.', 'ok'); });
    },
  },
};

/* ───────────── Reputación ───────────── */
const reputacion = {
  back: true, title: 'Reputación',
  render(ctx) {
    const p = ctx.provider;
    const st = S.providerStats(p);
    const r = st.rating;
    return `<div class="stack">
      <div class="stat-grid"><div><div class="xs muted">Calificación</div><div class="v">${r.count ? r.avg.toFixed(2) : '—'}</div>${r.count ? stars(r.avg) : ''}</div><div><div class="xs muted">Reseñas verificadas</div><div class="v">${r.count}</div></div><div><div class="xs muted">Cancelaciones tardías</div><div class="v">${p.cancelacionesTardias}</div></div><div><div class="xs muted">Penalizaciones</div><div class="v">${p.penalizacion || 0}</div></div></div>
      ${r.count ? `<div class="dist">${[5, 4, 3, 2, 1].map((n) => `<span>${n}</span><div class="bar"><i style="width:${(r.dist[n - 1] / r.count) * 100}%"></i></div><span class="right">${r.dist[n - 1]}</span>`).join('')}</div>` : ''}
      <div class="section-title"><h2>Reseñas recibidas</h2></div>
      ${r.reviews.length || S.getDb().reviews.some((x) => x.destId === ctx.user.id && x.estado === 'reportada') ? `<div class="card list">${S.getDb().reviews.filter((x) => x.destId === ctx.user.id && x.dir === 'c2p').sort((a, b) => b.t - a.t).slice(0, 30).map((rv) => { const au = S.user(rv.autorId); return `<div class="li" style="flex-direction:column;align-items:flex-start;gap:4px"><div class="row between" style="width:100%">${stars(rv.estrellas)}<span class="xs faint mono">${fmtDate(rv.t)} · ${esc(rv.orderId)}</span></div>${rv.comentario ? `<p class="small">${esc(rv.comentario)}</p>` : ''}<div class="row between" style="width:100%"><span class="xs muted">${esc(au.nombre)} ${esc(au.apellido[0])}. · ${esc(S.rubro(rv.rubroId).nombre)}</span>${rv.estado === 'reportada' ? '<span class="badge warn">En moderación</span>' : rv.estado === 'baja' ? '<span class="badge">Dada de baja</span>' : rv.estrellas <= 3 ? `<button class="btn ghost sm" data-act="report" data-id="${rv.id}">${icon('flag', 'sm')}Reportar</button>` : ''}</div></div>`; }).join('')}</div>` : empty('star', 'Todavía no tenés reseñas', 'Solo califican clientes con una orden finalizada: tus reseñas son verificadas.')}
    </div>`;
  },
  actions: {
    report(b, e, ctx) {
      const s = sheet({ title: 'Reportar reseña', body: '<div class="field"><label for="rm">¿Por qué no refleja el trabajo?</label><textarea class="textarea" id="rm"></textarea></div><p class="xs faint" style="margin-top:8px">La revisa el equipo de Royal. Si corresponde, se da de baja y se recalcula tu promedio.</p>', footer: '<button class="btn primary block" data-ok>Enviar a moderación</button>' });
      const ok = s.el.querySelector('[data-ok]');
      ok.onclick = () => run(ok, async () => { const m = s.el.querySelector('#rm').value.trim(); if (m.length < 10) throw new S.AppError('Contanos el motivo (mínimo 10 caracteres).'); await S.net(); S.reportReview(b.dataset.id, ctx.user.id, m); s.close(); toast('Reseña enviada a moderación', 'ok'); });
    },
  },
};

/* ───────────── Perfil y documentos ───────────── */
const perfil = {
  tab: '/perfil', title: 'Perfil', skeleton: false,
  render(ctx) {
    const u = ctx.user, p = ctx.provider;
    const st = S.providerStats(p);
    const v = st.verif;
    const docAlert = S.docsOf(p.id).some((d) => ['vencido', 'rechazado'].includes(d.estado)) || v.matriculas.some((m) => m.porVencer);
    return `<div class="stack">
      <div class="row">${avatar(u, 'lg', ['medio', 'alto'].includes(v.nivel))}<div class="grow"><h1>${esc(u.nombre)} ${esc(u.apellido)}</h1><div class="small muted">${p.rubros.map((r) => esc(S.rubro(r).nombre)).join(' · ') || 'Sin rubros'}</div><div class="row gap-1" style="margin-top:4px">${statusBadge('provider', p.estado, L)}<span class="badge ${v.nivel === 'ninguno' ? '' : 'ok'}">${S.NIVEL_LABEL[v.nivel]}</span></div></div></div>
      ${p.video?.estado === 'solicitado' ? `<div class="banner warn">${icon('video')}<div class="grow"><b>Video de validación pendiente.</b> Grabá 5 segundos mirando a cámara.</div><button class="btn sm primary" data-act="video">Grabar</button></div>` : ''}
      ${p.estado !== 'aprobado' ? applyBlockBanner(ctx) : ''}
      <div class="card list">
        <button class="li" data-go="/reputacion">${icon('star')}<span class="grow">Reputación</span>${rating(st.rating.avg, st.rating.count)}${icon('right', 'sm chev')}</button>
        <button class="li" data-go="/documentos">${icon('file')}<span class="grow">Documentos y verificación</span>${docAlert ? '<span class="dot warn"></span>' : ''}${icon('right', 'sm chev')}</button>
        <button class="li" data-go="/alta/2">${icon('briefcase')}<span class="grow">Rubros y descripción</span>${icon('right', 'sm chev')}</button>
        <button class="li" data-go="/alta/3">${icon('map')}<span class="grow">Zona y disponibilidad</span><span class="xs muted">${plural(p.barrios.length, 'barrio')}</span>${icon('right', 'sm chev')}</button>
        <button class="li" data-go="/historial">${icon('clock')}<span class="grow">Historial de órdenes</span>${icon('right', 'sm chev')}</button>
        <a class="li" href="cliente.html">${icon('external')}<span class="grow">Ir a la app de cliente</span></a>
      </div>
      ${profileFooter('prestador')}
    </div>`;
  },
  actions: {
    video(b, e, ctx) { run(b, async () => { toast('Grabando 5 s… (simulado)'); await S.net(1500, 2000); S.sendValidationVideo(ctx.provider.id); toast('Video enviado a revisión', 'ok'); }); },
  },
};

function docRows(ctx, { compact = false } = {}) {
  const p = ctx.provider;
  const req = S.requiredDocs(p);
  return `<div class="card list">${req.map(({ tipo, rubroId }) => {
    const d = S.docFor(p.id, tipo, rubroId);
    const porVencer = d?.estado === 'aprobado' && d.vence && d.vence - S.now() < 30 * 86400000;
    const label = DOC_TIPOS[tipo] + (rubroId ? ` · ${S.rubro(rubroId).nombre}` : '');
    const badge = !d ? '<span class="badge">Falta</span>' : porVencer ? '<span class="badge warn">Por vencer</span>' : statusBadge('document', d.estado, L);
    const canUpload = !d || ['rechazado', 'vencido'].includes(d.estado) || porVencer || (d.estado === 'cargado' && ['borrador', 'observado'].includes(p.estado));
    return `<div class="li"><div class="doc-thumb">${d ? docImage(d, ctx.user, rubroId ? S.rubro(rubroId).nombre : '') : ''}</div><div class="grow"><div class="small strong">${esc(label)}</div>
      <div class="xs muted">${d?.numero ? `<span class="mono">${esc(d.numero)}</span> · ` : ''}${d?.vence ? `vence ${fmtDateY(d.vence)}` : d ? `cargado ${fmtDate(d.creadoEn)}` : tipo === 'matricula' ? 'Obligatoria para este rubro' : 'Requerido'}</div>
      ${d?.estado === 'rechazado' && d.motivo ? `<div class="xs" style="color:var(--danger)">${esc(d.motivo)}</div>` : ''}</div>
      ${badge}${canUpload ? `<button class="btn sm" data-act="upload" data-tipo="${tipo}" data-rubro="${rubroId || ''}">${d ? 'Recargar' : 'Cargar'}</button>` : ''}</div>`;
  }).join('')}</div>`;
}

function uploadSheet(ctx, tipo, rubroId) {
  const p = ctx.provider;
  const isMat = tipo === 'matricula', isAnt = tipo === 'antecedentes', isSelfie = tipo === 'selfie';
  let file = null;
  const s = sheet({
    title: DOC_TIPOS[tipo] + (rubroId ? ` · ${S.rubro(rubroId).nombre}` : ''),
    body: `<div class="stack">
      <p class="small muted">${isSelfie ? 'Sacate una foto sosteniendo tu DNI al lado de la cara.' : isMat ? 'Foto de la matrícula completa, con el número y la fecha de vencimiento legibles.' : isAnt ? 'Certificado del Registro Nacional de Reincidencia, emitido hace menos de 6 meses.' : 'Foto nítida, sin reflejos, con las 4 esquinas visibles.'} JPG, PNG o PDF hasta 5 MB.</p>
      <div id="pv" class="doc-thumb" style="width:100%;height:auto;min-height:120px;display:flex;align-items:center;justify-content:center;color:var(--text-3)">${icon('image')}</div>
      <div class="row"><label class="btn grow">${icon(isSelfie ? 'camera' : 'upload')}${isSelfie ? 'Tomar selfie' : 'Subir archivo'}<input type="file" id="fi" class="sr-only" accept="image/*,application/pdf" ${isSelfie ? 'capture="user"' : ''}></label><button type="button" class="btn grow" data-sim>${icon('camera')}Simular captura</button></div>
      ${isMat ? `<div class="field"><label for="nu">N° de matrícula</label><input class="input mono" id="nu" placeholder="Mat. Litoral Gas 4417"></div><div class="field"><label for="en">Entidad emisora</label><input class="input" id="en" value="${esc({ gas: 'Litoral Gas S.A.', electricidad: 'Empresa Provincial de la Energía (EPE)', aires: 'Cámara de Aire Acondicionado y Refrigeración' }[rubroId] || '')}"></div><div class="field"><label for="ve">Vencimiento</label><input class="input mono" type="date" id="ve" min="${S.isoDate(S.now() + 86400000)}" value="${S.isoDate(S.now() + 365 * 86400000)}"></div>` : ''}
      ${isAnt ? '<div class="field"><label for="nu">N° de certificado</label><input class="input mono" id="nu" placeholder="RNR-482193"></div>' : ''}
    </div>`,
    footer: '<button class="btn primary block" data-ok>Guardar documento</button>',
  });
  const pv = s.el.querySelector('#pv');
  s.el.querySelector('#fi').onchange = async (e) => {
    try {
      const f = e.target.files[0];
      if (f.size > 5 * 1024 * 1024) throw new Error('El archivo supera los 5 MB.');
      file = await readImage(f, 560);
      pv.innerHTML = file.dataUrl ? `<img src="${file.dataUrl}" alt="Vista previa" style="max-height:200px;width:auto">` : `<div class="small">${icon('file')} ${esc(file.name)}</div>`;
    } catch (err) { toast(err.message, 'err'); }
  };
  s.el.querySelector('[data-sim]').onclick = () => {
    file = { dataUrl: null, mime: 'image/svg+xml', kb: 180, simulado: true };
    const num = s.el.querySelector('#nu');
    if (num && !num.value) num.value = isMat ? `${{ gas: 'Mat. Litoral Gas', electricidad: 'Reg. EPE', aires: 'Mat. CAyR' }[rubroId] || 'Mat.'} ${Math.floor(1000 + Math.random() * 9000)}` : `RNR-${Math.floor(100000 + Math.random() * 900000)}`;
    const fake = { tipo, numero: num?.value || '', vence: s.el.querySelector('#ve') ? new Date(s.el.querySelector('#ve').value).getTime() : null, entidad: s.el.querySelector('#en')?.value || '', estado: 'cargado' };
    pv.innerHTML = docImage(fake, ctx.user, rubroId ? S.rubro(rubroId).nombre : '');
    pv.style.background = 'transparent';
  };
  const ok = s.el.querySelector('[data-ok]');
  ok.onclick = () => run(ok, async () => {
    if (!file) throw new S.AppError('Subí un archivo o usá “Simular captura”.');
    const ve = s.el.querySelector('#ve');
    await S.net();
    S.uploadDoc(p.id, {
      tipo, rubroId: rubroId || null, archivo: file.dataUrl, mime: file.mime, kb: file.kb, simulado: !!file.simulado,
      numero: s.el.querySelector('#nu')?.value.trim() || '', entidad: s.el.querySelector('#en')?.value.trim() || '',
      vence: ve ? new Date(ve.value + 'T12:00:00').getTime() : tipo === 'antecedentes' ? S.now() + 180 * 86400000 : null,
    });
    s.close();
    toast('Documento cargado', 'ok');
  });
}

const documentos = {
  back: true, title: 'Documentos',
  render(ctx) {
    const p = ctx.provider;
    const v = S.verification(p);
    const r = S.maxRiesgo(p);
    return `<div class="stack">
      <div class="card pad"><div class="row between"><div><div class="upper">Nivel de verificación</div><div class="strong" style="font-size:17px">${S.NIVEL_LABEL[v.nivel]}</div></div><span class="badge ${r === 'alto' ? 'danger' : r === 'medio' ? 'warn' : 'info'}">${RIESGO_LABEL[r]}</span></div>
      <p class="xs muted" style="margin-top:8px">Pedimos más documentación en los rubros de mayor riesgo: gas, electricidad y aires exigen matrícula vigente; plomería, albañilería y cerrajería, certificado de antecedentes.</p></div>
      ${docRows(ctx)}
      ${p.video ? `<div class="card list"><div class="li">${icon('video')}<div class="grow"><div class="small strong">Video de validación</div><div class="xs muted">${p.video.estado === 'solicitado' ? 'Solicitado por Royal' : 'Enviado · en revisión'}</div></div>${p.video.estado === 'solicitado' ? '<button class="btn sm primary" data-act="video">Grabar</button>' : '<span class="badge warn">En revisión</span>'}</div></div>` : ''}
    </div>`;
  },
  actions: {
    upload: (b, e, ctx) => uploadSheet(ctx, b.dataset.tipo, b.dataset.rubro || null),
    video: (b, e, ctx) => perfil.actions.video(b, e, ctx),
  },
};

/* ───────────── Alta como prestador (wizard) ───────────── */
const ALTA_STEPS = ['Datos personales', 'Rubros', 'Zona y horarios', 'Documentación', 'Revisión'];
const altaHeader = (n, p) => {
  const flow = ['borrador', 'pendiente_revision', 'en_revision', 'aprobado'];
  const idx = p ? (p.estado === 'observado' ? 1 : flow.indexOf(p.estado)) : 0;
  return `<div class="stack" style="margin-bottom:16px"><div class="steps">${ALTA_STEPS.map((_, i) => `<span class="${i < n ? 'on' : ''}"></span>`).join('')}</div><div class="row between"><span class="xs faint mono">PASO ${n} DE 5 · ${ALTA_STEPS[n - 1].toUpperCase()}</span>${p ? statusBadge('provider', p.estado, L) : '<span class="badge">Borrador</span>'}</div></div>
  ${p?.estado === 'observado' ? `<div class="banner warn" style="margin-bottom:16px">${icon('alert')}<div><b>Observado:</b> ${esc(p.observacion?.motivo || '')}${p.observacion?.comentario ? `<div class="small">${esc(p.observacion.comentario)}</div>` : ''}<div class="small">Corregí el documento marcado y reenviá.</div></div></div>` : ''}`;
};
const altaEditable = (p) => !p || ['borrador', 'observado', 'aprobado', 'rechazado'].includes(p.estado);

const alta = {
  back: true, title: 'Alta como prestador', skeleton: false,
  render(ctx) {
    const p = ctx.provider;
    if (!p) { go('/alta/1'); return ''; }
    const flow = [['borrador', 'Borrador'], ['pendiente_revision', 'Pendiente de revisión'], ['en_revision', 'En revisión'], ['aprobado', 'Aprobado']];
    const cur = p.estado === 'observado' ? 1 : flow.findIndex(([k]) => k === p.estado);
    return `<div class="stack">
      <h1>Estado de tu alta</h1>
      ${providerProgress(p, L)}
      <ul class="timeline">${flow.map(([k, l], i) => `<li class="${i === cur ? 'now' : ''}" style="${i > cur ? 'opacity:.45' : ''}"><div class="strong small">${l}${p.estado === 'observado' && i === 1 ? ' · Observado' : ''}</div><div class="t">${(p.historial.filter((h) => h.estado === k).at(-1)?.t && fmtDate(p.historial.filter((h) => h.estado === k).at(-1).t)) || ''}</div></li>`).join('')}</ul>
      ${applyBlockBanner(ctx)}
      ${p.estado === 'rechazado' ? `<div class="banner danger">${icon('ban')}<div><b>Rechazado:</b> ${esc(p.observacion?.motivo || '')}. Si creés que es un error, escribinos a soporte.</div></div>` : ''}
      <div class="card list">${p.historial.slice().reverse().map((h) => `<div class="li"><div class="grow"><div class="small">${esc(h.texto || L.provider[h.estado])}</div><div class="xs faint mono">${fmtDate(h.t)} ${fmtTime(h.t)} · ${esc(h.actor)}</div></div></div>`).join('')}</div>
      <button class="btn block" data-go="/alta/1">Revisar mis datos</button>
    </div>`;
  },
};

const alta1 = {
  back: true, title: 'Alta como prestador', skeleton: false, live: false,
  render(ctx) {
    const u = ctx.user;
    const f = (id, label, val, type = 'text', attrs = '') => `<div class="field"><label for="${id}">${label}</label><input class="input" id="${id}" type="${type}" value="${esc(val || '')}" ${attrs}><span class="err" id="${id}-err"></span></div>`;
    return `${altaHeader(1, ctx.provider)}<form class="stack" id="f1">
      <p class="muted small">Tus datos tienen que coincidir con tu DNI. El teléfono no se muestra a los clientes.</p>
      ${f('nombre', 'Nombre', u.nombre)}${f('apellido', 'Apellido', u.apellido)}${f('dni', 'DNI', u.dni, 'text', 'inputmode="numeric"')}${f('telefono', 'Teléfono', u.telefono, 'tel')}</form>`;
  },
  cta: () => '<button class="btn primary" data-act="next">Siguiente</button>',
  actions: {
    next(b, e, ctx) {
      const v = (k) => qs('#' + k).value.trim();
      const errs = { nombre: v('nombre') ? '' : 'Requerido.', apellido: v('apellido') ? '' : 'Requerido.', dni: /^\d{7,8}$/.test(v('dni').replace(/\D/g, '')) ? '' : 'DNI inválido.', telefono: v('telefono').replace(/\D/g, '').length >= 8 ? '' : 'Teléfono inválido.' };
      Object.entries(errs).forEach(([k, m]) => { qs('#' + k + '-err').textContent = m; qs('#' + k).classList.toggle('invalid', !!m); });
      if (Object.values(errs).some(Boolean)) return;
      run(b, async () => {
        await S.net();
        const dni = v('dni').replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        S.setIdentity(ctx.user.id, { nombre: v('nombre'), apellido: v('apellido'), telefono: v('telefono'), dni });
        S.saveProviderDraft(ctx.user.id, {});
        go('/alta/2');
      });
    },
  },
};

const alta2 = {
  back: true, title: 'Alta como prestador', skeleton: false, live: false,
  render(ctx) {
    const p = ctx.provider;
    alta2._sel = new Set(p?.rubros || []);
    alta2._tags = new Set(p?.tags || []);
    return `${altaHeader(2, p)}<div class="stack">
      <h2>¿Qué trabajos hacés?</h2>
      <div class="stack" id="rbs" style="gap:8px">${RUBROS.map((r) => `<button type="button" class="opt ${alta2._sel.has(r.id) ? 'on' : ''}" data-id="${r.id}">${icon(r.icono)}<div class="grow"><div class="small strong">${esc(r.nombre)}</div><div class="xs muted">${RIESGO_LABEL[r.riesgo]} · comisión ${r.comision}%${r.riesgo === 'alto' ? ' · matrícula obligatoria' : r.riesgo === 'medio' ? ' · antecedentes' : ''}</div></div></button>`).join('')}</div>
      <div class="field"><span class="label">Especialidades</span><div class="chips wrap" id="tags"></div></div>
      <div class="field"><label for="ds">Descripción de tu servicio</label><textarea class="textarea" id="ds" maxlength="280" placeholder="Ej.: gasista matriculado, instalación de artefactos y pruebas de hermeticidad.">${esc(p?.descripcion || '')}</textarea></div>
    </div>`;
  },
  cta: () => '<button class="btn" data-act="__back">Atrás</button><button class="btn primary" data-act="next">Siguiente</button>',
  mount(el) {
    const drawTags = () => { el.querySelector('#tags').innerHTML = [...alta2._sel].flatMap((r) => S.rubro(r).tags).map((t) => `<button type="button" class="chip ${alta2._tags.has(t) ? 'on' : ''}" data-t="${esc(t)}">${esc(t)}</button>`).join('') || '<span class="xs faint">Elegí al menos un rubro</span>'; };
    el.querySelector('#rbs').onclick = (e) => { const b = e.target.closest('[data-id]'); if (!b) return; const id = b.dataset.id; alta2._sel.has(id) ? alta2._sel.delete(id) : alta2._sel.add(id); b.classList.toggle('on'); drawTags(); };
    el.querySelector('#tags').onclick = (e) => { const b = e.target.closest('[data-t]'); if (!b) return; const t = b.dataset.t; alta2._tags.has(t) ? alta2._tags.delete(t) : alta2._tags.add(t); b.classList.toggle('on'); };
    drawTags();
  },
  actions: {
    next(b, e, ctx) {
      if (!alta2._sel.size) { toast('Elegí al menos un rubro', 'err'); return; }
      const valid = [...alta2._sel].flatMap((r) => S.rubro(r).tags);
      run(b, async () => { await S.net(); S.saveProviderDraft(ctx.user.id, { rubros: [...alta2._sel], tags: [...alta2._tags].filter((t) => valid.includes(t)), descripcion: qs('#ds').value.trim() }); go('/alta/3'); });
    },
  },
};

const alta3 = {
  back: true, title: 'Alta como prestador', skeleton: false, live: false,
  render(ctx) {
    const p = ctx.provider;
    alta3._b = new Set(p?.barrios || []);
    alta3._d = JSON.parse(JSON.stringify(p?.disponibilidad && Object.keys(p.disponibilidad).length ? p.disponibilidad : { lun: ['manana', 'tarde'], mar: ['manana', 'tarde'], mie: ['manana', 'tarde'], jue: ['manana', 'tarde'], vie: ['manana', 'tarde'], sab: ['manana'], dom: [] }));
    return `${altaHeader(3, p)}<div class="stack">
      <h2>¿Dónde trabajás?</h2><p class="xs muted">Barrios habilitados en el lanzamiento de Córdoba capital.</p>
      <div id="mapb">${mapSvg({ highlight: [...alta3._b] })}</div>
      <div class="chips wrap" id="bs">${BARRIOS.filter((b) => S.getDb().config.barriosHabilitados.includes(b.id)).map((b) => `<button type="button" class="chip ${alta3._b.has(b.id) ? 'on' : ''}" data-id="${b.id}">${esc(b.nombre)}</button>`).join('')}</div>
      <h2 style="margin-top:8px">¿Cuándo?</h2>
      <div class="card" style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px" id="disp"><thead><tr><th></th>${DIAS.map((d) => `<th style="padding:6px 2px;font-weight:500;color:var(--text-3)">${DIAS_LABEL[d]}</th>`).join('')}</tr></thead><tbody>
        ${Object.entries(FRANJAS).map(([k, v]) => `<tr><td style="padding:6px;color:var(--text-2);white-space:nowrap">${v.split(' ')[0]}</td>${DIAS.map((d) => `<td style="text-align:center;padding:4px 2px"><input type="checkbox" data-d="${d}" data-f="${k}" ${alta3._d[d]?.includes(k) ? 'checked' : ''} aria-label="${DIAS_LABEL[d]} ${v}" style="width:20px;height:20px;accent-color:var(--accent)"></td>`).join('')}</tr>`).join('')}
      </tbody></table></div>
    </div>`;
  },
  cta: () => '<button class="btn" data-act="__back">Atrás</button><button class="btn primary" data-act="next">Siguiente</button>',
  mount(el) {
    el.querySelector('#bs').onclick = (e) => { const b = e.target.closest('[data-id]'); if (!b) return; const id = b.dataset.id; alta3._b.has(id) ? alta3._b.delete(id) : alta3._b.add(id); b.classList.toggle('on'); el.querySelector('#mapb').innerHTML = mapSvg({ highlight: [...alta3._b] }); };
    el.querySelector('#disp').onchange = (e) => { const c = e.target; const d = c.dataset.d, f = c.dataset.f; alta3._d[d] = alta3._d[d] || []; alta3._d[d] = c.checked ? [...new Set([...alta3._d[d], f])] : alta3._d[d].filter((x) => x !== f); };
  },
  actions: {
    next(b, e, ctx) {
      if (!alta3._b.size) { toast('Elegí al menos un barrio', 'err'); return; }
      if (!Object.values(alta3._d).some((x) => x.length)) { toast('Marcá al menos una franja disponible', 'err'); return; }
      run(b, async () => { await S.net(); S.saveProviderDraft(ctx.user.id, { barrios: [...alta3._b], disponibilidad: alta3._d }); go(ctx.provider && ['aprobado'].includes(ctx.provider.estado) ? '/perfil' : '/alta/4'); if (ctx.provider?.estado === 'aprobado') toast('Zona y disponibilidad actualizadas', 'ok'); });
    },
  },
};

const alta4 = {
  back: true, title: 'Alta como prestador', skeleton: false,
  render(ctx) {
    const p = ctx.provider;
    if (!p?.rubros.length) { go('/alta/2'); return ''; }
    const r = S.maxRiesgo(p);
    return `${altaHeader(4, p)}<div class="stack">
      <h2>Documentación</h2>
      <div class="banner ${r === 'alto' ? 'warn' : 'info'}">${icon('shield')}<div><b>${RIESGO_LABEL[r]}.</b> ${r === 'alto' ? 'Por trabajar con gas o electricidad pedimos DNI, selfie, antecedentes y matrícula vigente. Lo revisa una persona del equipo.' : r === 'medio' ? 'Pedimos DNI, selfie y certificado de antecedentes. Lo revisa una persona del equipo.' : 'Con DNI y selfie te validamos automáticamente en segundos.'}</div></div>
      ${docRows(ctx)}
      <p class="xs faint">Tus documentos se guardan cifrados y solo los ve el equipo de verificación.</p>
    </div>`;
  },
  cta: () => '<button class="btn" data-act="__back">Atrás</button><button class="btn primary" data-act="next">Siguiente</button>',
  actions: {
    upload: (b, e, ctx) => uploadSheet(ctx, b.dataset.tipo, b.dataset.rubro || null),
    next(b, e, ctx) { const m = S.missingDocs(ctx.provider); if (m.length) { toast(`Falta: ${m.map((x) => DOC_TIPOS[x.tipo]).join(', ')}`, 'err'); return; } go('/alta/5'); },
  },
};

const alta5 = {
  back: true, title: 'Alta como prestador', skeleton: false,
  render(ctx) {
    const p = ctx.provider;
    const u = ctx.user;
    const r = S.maxRiesgo(p);
    const sent = ['pendiente_revision', 'en_revision', 'aprobado'].includes(p.estado);
    return `${altaHeader(5, p)}<div class="stack">
      <h2>Revisá y enviá</h2>
      <dl class="kv card pad"><dt>Nombre</dt><dd>${esc(u.nombre)} ${esc(u.apellido)}</dd><dt>DNI</dt><dd class="mono">${esc(u.dni)}</dd><dt>Rubros</dt><dd>${p.rubros.map((x) => esc(S.rubro(x).nombre)).join(', ')}</dd><dt>Barrios</dt><dd>${p.barrios.map((b) => esc(S.barrio(b).nombre)).join(', ')}</dd><dt>Documentos</dt><dd>${S.requiredDocs(p).length - S.missingDocs(p).length}/${S.requiredDocs(p).length}</dd><dt>Revisión</dt><dd>${r === 'bajo' ? 'Automática' : 'Equipo Royal · < 24 h'}</dd></dl>
      <label class="check"><input type="checkbox" id="dj"> <span>Declaro que los datos y documentos son reales y acepto los términos para prestadores (comisión ${[...new Set(p.rubros.map((x) => S.rubro(x).comision))].join('/')}% por trabajo).</span></label>
      ${sent ? `<div class="banner info">${icon('info')}<div>Tu alta ya fue enviada. Estado: <b>${L.provider[p.estado]}</b>.</div></div>` : ''}
    </div>`;
  },
  cta: (ctx) => { const p = ctx.provider; return ['borrador', 'observado'].includes(p?.estado) ? `<button class="btn primary" data-act="send">${p.estado === 'observado' ? 'Reenviar correcciones' : 'Enviar a revisión'}</button>` : '<button class="btn" data-go="/trabajos">Ir a trabajos</button>'; },
  actions: {
    send(b, e, ctx) {
      if (!qs('#dj').checked) { toast('Aceptá la declaración para enviar', 'err'); return; }
      run(b, async () => {
        await S.net();
        const r = S.submitProvider(ctx.provider.id);
        toast(r === 'bajo' ? 'Enviado. Validamos tu identidad en segundos…' : 'Enviado a revisión', 'ok');
        go('/alta', { drop: '/alta/' });
      });
    },
  },
};

/* ───────────── arranque ───────────── */
const mensajes = {
  tab: '/mensajes', title: 'Mensajes',
  render(ctx) { return threadListHtml(ctx, threadsOf(ctx, S.ordersOfProvider(ctx.provider.id)), (o) => S.user(o.clienteId)); },
};

const fig1 = `<div class="stack" style="gap:8px"><div class="row between small"><span class="strong">Pierde agua la canilla</span><span class="badge accent">Urgente</span></div><div class="row between xs muted"><span class="mono">0,8 km · Güemes</span><span class="mono">Ref. $ 30.000</span></div></div>`;
const fig2 = `<div class="stack" style="gap:6px"><div class="row between small"><span>Comisión Royal</span><span class="mono strong">3–5%</span></div><div class="row between small muted"><span>Otras plataformas</span><span class="mono">hasta 40%</span></div></div>`;
const fig3 = `<div class="stack" style="gap:6px"><span class="badge ok">${icon('shield')}Identidad verificada</span><span class="badge ok">${icon('badge')}Matrícula vigente</span><span class="badge">${icon('star')}Reseñas de trabajos reales</span></div>`;

startMobileApp({
  app: 'prestador', theme: 'dark', home: '/trabajos', afterRegister: '/alta/1',
  parents: {
    '/trabajo/:id': '/trabajos', '/orden/:id': '/trabajos', '/calificar/:id': '/orden/:id', '/historial': '/agenda',
    '/reputacion': '/perfil', '/documentos': '/perfil', '/alta': '/perfil', '/alta/1': '/perfil', '/alta/2': '/alta/1', '/alta/3': '/alta/2',
    '/alta/4': '/alta/3', '/alta/5': '/alta/4', '/chat/:id': '/mensajes', '/notificaciones': '/trabajos', '/registro': '/login', '/recuperar': '/login', '/recuperar/:token': '/login',
  },
  tagline: 'Conseguí changas cerca, cobrá como quieras y construí tu reputación.',
  quickLogins: [{ label: 'Entrar como Ramiro — gasista matriculado', email: 'ramiro@demo.com' }, { label: 'Entrar como Alejandro — alta observada', email: 'alejandro.paredes@demo.com' }, { label: 'Entrar como Daniel — bloqueado por deuda', email: 'daniel.toledo@demo.com' }],
  onboarding: [
    { title: 'Changas cerca tuyo, todos los días', text: 'Ves los trabajos de tus rubros ordenados por distancia y te postulás con tu precio.', figure: fig1 },
    { title: 'Comisión baja, cobrás como quieras', text: 'Efectivo, transferencia o Mercado Pago. Si cobrás en mano, la comisión la saldás después.', figure: fig2 },
    { title: 'Tu reputación, verificada', text: 'Validamos tu identidad y matrícula una vez. Cada trabajo suma reseñas reales a tu perfil.', figure: fig3 },
  ],
  onUser(ctx) { ctx.provider = ctx.user ? S.providerByUser(ctx.user.id) : null; },
  guard(ctx, pattern) {
    if (ctx.user.roles.includes('admin') && !ctx.user.roles.includes('cliente')) { S.logout('prestador'); return '/login'; }
    if (!ctx.provider && !pattern.startsWith('/alta') && pattern !== '/notificaciones') return '/alta/1';
    return null;
  },
  tabs: [
    { path: '/trabajos', label: 'Trabajos', icon: 'briefcase', badge: (ctx) => S.ordersOfProvider(ctx.provider?.id).filter((o) => o.estado === 'pendiente_confirmacion').length },
    { path: '/agenda', label: 'Agenda', icon: 'calendar' },
    { path: '/mensajes', label: 'Mensajes', icon: 'message', badge: (ctx) => S.unreadMessages(ctx.user.id) },
    { path: '/billetera', label: 'Billetera', icon: 'wallet', badge: (ctx) => (ctx.provider && S.debtOf(ctx.provider.id) >= S.getDb().config.limiteDeuda ? 1 : 0) },
    { path: '/perfil', label: 'Perfil', icon: 'user' },
  ],
  routes: {
    '/trabajos': trabajos,
    '/trabajo/:id': trabajo,
    '/orden/:id': orden,
    '/calificar/:id': calificar,
    '/agenda': agenda,
    '/historial': historial,
    '/mensajes': mensajes,
    '/billetera': billetera,
    '/reputacion': reputacion,
    '/perfil': perfil,
    '/documentos': documentos,
    '/alta': alta,
    '/alta/1': alta1, '/alta/2': alta2, '/alta/3': alta3, '/alta/4': alta4, '/alta/5': alta5,
  },
});
