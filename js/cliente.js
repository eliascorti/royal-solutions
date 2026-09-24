// App del cliente
import * as S from './store.js';
import { RUBROS, BARRIOS, FRANJAS, MEDIOS, DIAS, REVIEW_TAGS_CLIENTE, MOTIVOS_CANCELACION, MOTIVOS_DISPUTA, RIESGO_LABEL } from './data.js';
import { startMobileApp, threadsOf, threadListHtml, profileFooter } from './shell.js';
import {
  icon, esc, money, moneyHtml, avatar, rating, stars, rubroIcon, statusBadge, empty, toast, sheet, confirmDialog, run,
  fmtDate, fmtDateY, fmtRel, fmtDay, fmtTime, plural, mapSvg, galleryTile, readImage, go, qs, qsa, delay, orderProgress,
} from './ui.js';

const L = S.ESTADOS;
const origin = (ctx) => ctx.user.direcciones.find((d) => d.id === (sessionStorage.getItem('rs_origin') || '')) || ctx.user.direcciones[0];
const isoToday = () => S.isoDate(S.now());

/* ───────────── piezas ───────────── */
function verifBadges(p, compact = false) {
  const v = S.verification(p);
  const out = [];
  if (v.identidad) out.push(`<span class="badge ok">${icon('shield')}${compact ? 'Identidad' : 'DNI verificado'}</span>`);
  if (v.antecedentes) out.push(`<span class="badge ok">${icon('check')}Antecedentes</span>`);
  v.matriculas.forEach((m) => {
    if (m.vigente) out.push(`<span class="badge ${m.porVencer ? 'warn' : 'ok'}">${icon('badge')}Matrícula ${esc(S.rubro(m.rubroId).nombre)}${m.porVencer ? ' · por vencer' : ''}</span>`);
  });
  return out.join(' ');
}

function providerCard(x, extra = '') {
  const { p, u, st, km } = x;
  const verified = ['medio', 'alto'].includes(st.verif.nivel);
  return `<button class="pcard" data-go="/prestador/${p.id}">
    ${avatar(u, '', verified)}
    <div class="grow">
      <div class="row between"><span class="strong">${esc(u.nombre)} ${esc(u.apellido)}</span>${rating(st.rating.avg, st.rating.count)}</div>
      <div class="small muted">${p.rubros.map((r) => esc(S.rubro(r).nombre)).join(' · ')}</div>
      <div class="meta">${km != null ? `<span class="mono">${km} km</span>` : ''}<span>${plural(st.trabajos, 'trabajo')}</span><span>Responde en ~${p.respuestaMin} min</span>${p.disponible ? '<span class="badge ok">Disponible ahora</span>' : ''}</div>
      ${extra}
    </div></button>`;
}

function orderRow(o, { rehire = false } = {}) {
  const p = S.provider(o.providerId);
  const u = S.user(p.userId);
  return `<div class="li" style="flex-wrap:wrap">
    <button class="row grow" style="background:none;border:0;padding:0;text-align:left;cursor:pointer;color:inherit" data-go="/orden/${o.id}">
      <span class="av sm" style="background:var(--surface-2);color:var(--text)">${rubroIcon(o.rubroId)}</span>
      <div class="grow"><div class="row between"><span class="small strong ellipsis">${esc(o.descripcion)}</span>${o.montoFinal || o.precioAcordado ? `<span class="small">${moneyHtml(o.montoFinal || o.precioAcordado)}</span>` : ''}</div>
      <div class="row between"><span class="xs muted">${esc(u.nombre)} ${esc(u.apellido[0])}. · <span class="mono">${o.id}</span> · ${fmtDate(o.creadoEn)}</span>${statusBadge('order', o.estado, L)}</div></div>
    </button>
    ${rehire ? `<button class="btn sm" data-go="/contratar/${p.id}?rubro=${o.rubroId}" style="margin-left:44px">${icon('repeat', 'sm')}Volver a contratar</button>` : ''}
  </div>`;
}

function activeBanner(ctx) {
  const o = S.ordersOfClient(ctx.user.id).find((x) => S.ACTIVE.includes(x.estado));
  if (!o) return '';
  const pu = S.user(S.provider(o.providerId).userId);
  const sub = {
    pendiente_confirmacion: `Esperando que ${pu.nombre} confirme`,
    confirmada: o.asap ? `${pu.nombre} sale en unos minutos` : `${fmtDay(o.fecha)} · ${FRANJAS[o.franja]}`,
    en_camino: o.tracking?.arrived ? `${pu.nombre} llegó · dictale tu código` : `Llega en ${o.tracking?.eta ?? '—'} min`,
    en_curso: 'Trabajo en curso',
    finalizada_pend_cliente: `Confirmá el pago de ${money(o.montoFinal)}`,
    en_disputa: 'Royal está revisando el caso',
  }[o.estado];
  return `<button class="active-order" data-go="/orden/${o.id}"><div class="row between"><span class="upper">Orden en curso · <span class="mono">${o.id}</span></span>${statusBadge('order', o.estado, L)}</div>
    <div class="row" style="margin-top:6px">${rubroIcon(o.rubroId)}<div class="grow"><div class="strong">${esc(sub)}</div><div class="small muted ellipsis">${esc(o.descripcion)}</div></div>${icon('right', 'sm')}</div></button>`;
}

/* ───────────── Inicio ───────────── */
const inicio = {
  tab: '/inicio', title: 'Inicio',
  render(ctx) {
    const u = ctx.user;
    const loc = origin(ctx);
    const cerca = S.searchProviders({ from: loc, sort: 'distancia' }).slice(0, 5);
    const openReqs = S.requestsOfClient(u.id).filter((r) => ['abierta', 'con_postulaciones'].includes(r.estado));
    const past = [...new Map(S.ordersOfClient(u.id).filter((o) => ['finalizada', 'calificada'].includes(o.estado)).map((o) => [o.providerId, o])).values()].slice(0, 4);
    return `<div class="stack">
      <div><div class="hello">Hola, ${esc(u.nombre)}</div><div class="small muted row gap-1">${icon('pin', 'sm')}${esc(S.barrio(loc.barrio).nombre)} · ${esc(loc.calle)}</div></div>
      ${activeBanner(ctx)}
      ${openReqs.map((r) => { const n = S.applicationsOf(r.id).length; return `<button class="active-order" data-go="/changa/${r.id}" style="border-left-color:var(--info)"><div class="row between"><span class="upper">Changa publicada · <span class="mono">${r.id}</span></span>${statusBadge('request', r.estado, L)}</div><div class="row" style="margin-top:6px">${rubroIcon(r.rubroId)}<div class="grow"><div class="strong">${n ? `${plural(n, 'postulación', 'postulaciones')} para comparar` : 'Esperando postulaciones'}</div><div class="small muted ellipsis">${esc(r.descripcion)}</div></div>${icon('right', 'sm')}</div></button>`; }).join('')}
      <button class="search-fake" data-go="/buscar">${icon('search')}<span>Buscar plomero, gasista, flete…</span></button>
      <button class="publish-cta" data-go="/publicar/1">${icon('plus')}<div class="grow"><b>Publicar changa</b><span>Describilo en una línea y recibí precios de prestadores cerca</span></div>${icon('right')}</button>
      <div class="rubros">${RUBROS.map((r) => `<button data-go="/buscar?rubro=${r.id}">${icon(r.icono)}<span>${esc(r.nombre)}</span></button>`).join('')}</div>
      ${past.length ? `<div class="section-title"><h2>Volver a contratar</h2></div><div class="chips">${past.map((o) => { const pu = S.user(S.provider(o.providerId).userId); return `<button class="chip" data-go="/contratar/${o.providerId}?rubro=${o.rubroId}">${icon('repeat', 'sm')}${esc(pu.nombre)} · ${esc(S.rubro(o.rubroId).nombre)}</button>`; }).join('')}</div>` : ''}
      <div class="section-title"><h2>Cerca tuyo</h2><a class="small" href="#/buscar?vista=mapa">Ver mapa</a></div>
      <div class="card list">${cerca.map((x) => providerCard(x)).join('')}</div>
      <p class="xs faint">Solo mostramos prestadores con identidad verificada. Ordenados por distancia a tu dirección.</p>
    </div>`;
  },
};

/* ───────────── Buscar ───────────── */
const buscarState = { q: '', rubro: null, maxKm: null, minRating: 0, verificado: false, disponible: false, sort: 'distancia', vista: 'lista', sel: null, originId: null };
const buscar = {
  tab: '/buscar', title: 'Buscar', live: false,
  render(ctx) {
    if (ctx.query.rubro) buscarState.rubro = ctx.query.rubro;
    if (ctx.query.vista) buscarState.vista = ctx.query.vista;
    const st = buscarState;
    const active = [st.maxKm, st.minRating, st.verificado, st.disponible].filter(Boolean).length;
    return `<div class="stack">
      <div class="row"><div class="grow"><label class="sr-only" for="q">Buscar</label><input class="input" id="q" type="search" placeholder="Oficio, nombre o problema" value="${esc(st.q)}" autocomplete="off"></div>
      <button class="btn icon" data-act="filters" aria-label="Filtros">${icon('sliders')}${active ? `<span class="count" style="position:absolute;top:-6px;right:-6px">${active}</span>` : ''}</button></div>
      <div class="chips" id="rchips"><button class="chip ${!st.rubro ? 'on' : ''}" data-act="rubro" data-id="">Todos</button>${RUBROS.map((r) => `<button class="chip ${st.rubro === r.id ? 'on' : ''}" data-act="rubro" data-id="${r.id}">${esc(r.nombre)}</button>`).join('')}</div>
      <div class="row between"><div class="seg" style="width:180px"><button class="${st.vista === 'lista' ? 'on' : ''}" data-act="vista" data-v="lista">${icon('list', 'sm')} Lista</button><button class="${st.vista === 'mapa' ? 'on' : ''}" data-act="vista" data-v="mapa">${icon('map', 'sm')} Mapa</button></div>
      <label class="small muted row gap-1" for="origen">${icon('pin', 'sm')}<select id="origen" class="select" style="min-height:32px;padding:4px 8px;width:auto;font-size:13px">${ctx.user.direcciones.map((d) => `<option value="d:${d.id}" ${origin(ctx).id === d.id ? 'selected' : ''}>${esc(d.alias)}</option>`).join('')}${BARRIOS.map((b) => `<option value="b:${b.id}">${esc(b.nombre)}</option>`).join('')}</select></label></div>
      <div id="results"></div>
    </div>`;
  },
  mount(el, ctx) {
    const draw = () => drawResults(el, ctx);
    el.querySelector('#q').addEventListener('input', (e) => { buscarState.q = e.target.value; draw(); });
    el.querySelector('#origen').addEventListener('change', (e) => {
      const [k, v] = e.target.value.split(':');
      if (k === 'd') { sessionStorage.setItem('rs_origin', v); buscarState.originId = null; } else buscarState.originId = v;
      draw();
    });
    draw();
  },
  actions: {
    rubro: (b, e, ctx) => { buscarState.rubro = b.dataset.id || null; qsa('#rchips .chip').forEach((c) => c.classList.toggle('on', c === b)); drawResults(qs('.view'), ctx); },
    vista: (b, e, ctx) => { buscarState.vista = b.dataset.v; qsa('.seg button').forEach((c) => c.classList.toggle('on', c === b)); drawResults(qs('.view'), ctx); },
    pin: (b, e, ctx) => { buscarState.sel = b.dataset.id; drawResults(qs('.view'), ctx); },
    clear: (b, e, ctx) => { Object.assign(buscarState, { q: '', rubro: null, maxKm: null, minRating: 0, verificado: false, disponible: false }); ctx.refresh(); },
    filters(b, e, ctx) {
      const st = buscarState;
      const s = sheet({
        title: 'Filtros',
        body: `<div class="stack">
          <div class="field"><span class="label">Distancia máxima</span><div class="seg" id="fk">${[[null, 'Todas'], [2, '2 km'], [5, '5 km'], [8, '8 km']].map(([v, l]) => `<button type="button" data-v="${v ?? ''}" class="${st.maxKm === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
          <div class="field"><span class="label">Calificación mínima</span><div class="seg" id="fr">${[[0, 'Todas'], [4, '4+'], [4.5, '4.5+']].map(([v, l]) => `<button type="button" data-v="${v}" class="${st.minRating === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
          <label class="check"><input type="checkbox" id="fv" ${st.verificado ? 'checked' : ''}> <span>Solo verificación media o alta (antecedentes / matrícula)</span></label>
          <label class="check"><input type="checkbox" id="fd" ${st.disponible ? 'checked' : ''}> <span>Disponible ahora</span></label>
          <div class="field"><label for="fs">Ordenar por</label><select class="select" id="fs">${[['distancia', 'Más cerca'], ['rating', 'Mejor calificados'], ['trabajos', 'Más trabajos'], ['respuesta', 'Responde más rápido']].map(([v, l]) => `<option value="${v}" ${st.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        </div>`,
        footer: '<button class="btn" data-reset>Limpiar</button><button class="btn primary grow" data-apply>Aplicar</button>',
      });
      const segPick = (id) => { const w = s.el.querySelector(id); w.onclick = (ev) => { const bt = ev.target.closest('button'); if (!bt) return; w.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === bt)); }; };
      segPick('#fk'); segPick('#fr');
      s.el.querySelector('[data-apply]').onclick = () => {
        const k = s.el.querySelector('#fk .on')?.dataset.v; st.maxKm = k ? Number(k) : null;
        st.minRating = Number(s.el.querySelector('#fr .on')?.dataset.v || 0);
        st.verificado = s.el.querySelector('#fv').checked; st.disponible = s.el.querySelector('#fd').checked;
        st.sort = s.el.querySelector('#fs').value;
        s.close(); ctx.refresh();
      };
      s.el.querySelector('[data-reset]').onclick = () => { Object.assign(st, { maxKm: null, minRating: 0, verificado: false, disponible: false, sort: 'distancia' }); s.close(); ctx.refresh(); };
    },
  },
};

function drawResults(el, ctx) {
  const st = buscarState;
  const from = st.originId ? S.barrio(st.originId) : origin(ctx);
  const list = S.searchProviders({ q: st.q, rubroId: st.rubro, maxKm: st.maxKm, minRating: st.minRating, verificado: st.verificado, disponible: st.disponible, sort: st.sort, from });
  const box = el.querySelector('#results');
  if (!list.length) {
    const related = st.q ? RUBROS.filter((r) => r.nombre.toLowerCase().includes(st.q.toLowerCase().slice(0, 3)) || r.sugerencias.some((s) => s.toLowerCase().includes(st.q.toLowerCase()))).slice(0, 3) : [];
    box.innerHTML = empty('search', 'Sin resultados con estos filtros', 'Probá ampliar la distancia o sacar filtros. También podés publicar la changa y que te lleguen postulaciones.',
      `<div class="row wrap" style="justify-content:center"><button class="btn sm" data-act="clear">Quitar filtros</button><button class="btn sm primary" data-go="/publicar/1${st.rubro ? '?rubro=' + st.rubro : ''}">Publicar changa</button></div>${related.length ? `<div class="chips wrap" style="justify-content:center">${related.map((r) => `<button class="chip" data-act="rubro" data-id="${r.id}">${esc(r.nombre)}</button>`).join('')}</div>` : ''}`);
    return;
  }
  const count = `<p class="xs faint">${plural(list.length, 'prestador verificado', 'prestadores verificados')} · orden: ${{ distancia: 'distancia', rating: 'calificación', trabajos: 'trabajos', respuesta: 'respuesta' }[st.sort]}</p>`;
  if (st.vista === 'mapa') {
    const sel = list.find((x) => x.p.id === st.sel) || list[0];
    box.innerHTML = `${mapSvg({ me: from, pins: list.map((x) => ({ x: x.p.x, y: x.p.y, id: x.p.id, label: (x.u.nombre[0] + x.u.apellido[0]), title: `${x.u.nombre} ${x.u.apellido}`, verified: ['medio', 'alto'].includes(x.st.verif.nivel), selected: x === sel })) })}
      <div class="card list" style="margin-top:8px">${providerCard(sel)}</div>${count}`;
  } else {
    box.innerHTML = `<div class="card list">${list.map((x) => providerCard(x)).join('')}</div>${count}`;
  }
}

/* ───────────── Publicar changa (3 pasos + resumen) ───────────── */
let draft = null;
function newDraft(ctx) {
  return { rubroId: null, descripcion: '', fotos: [], urgente: false, direccionId: ctx.user.direcciones[0].id, cuando: 'asap', fecha: S.isoDate(S.now() + 86400000), franja: 'manana', presupuesto: '', medio: 'efectivo', startedAt: Date.now() };
}
const stepper = (n) => `<div class="stack" style="margin-bottom:16px"><div class="steps">${[1, 2, 3, 4].map((i) => `<span class="${i <= n ? 'on' : ''}"></span>`).join('')}</div><div class="xs faint mono">PASO ${Math.min(n, 3)} DE 3${n === 4 ? ' · RESUMEN' : ''}</div></div>`;

const pub1 = {
  back: true, title: 'Publicar changa', skeleton: false, live: false,
  render(ctx) {
    if (!draft || ctx.query.nuevo) {
      draft = newDraft(ctx);
      if (ctx.query.nuevo) { delete ctx.query.nuevo; setTimeout(() => go('/publicar/1' + (ctx.query.rubro ? `?rubro=${ctx.query.rubro}` : ''), { replace: true })); }
    }
    if (ctx.query.rubro && !draft.rubroId) draft.rubroId = ctx.query.rubro;
    const r = draft.rubroId && S.rubro(draft.rubroId);
    return `${stepper(1)}<div class="stack">
      <h1>¿Qué necesitás?</h1>
      <div class="rubros" id="rg">${RUBROS.map((x) => `<button type="button" data-id="${x.id}" class="${draft.rubroId === x.id ? 'on' : ''}" aria-pressed="${draft.rubroId === x.id}">${icon(x.icono)}<span>${esc(x.nombre)}</span></button>`).join('')}</div>
      <span class="err small" id="rubro-err" style="color:var(--danger)"></span>
      <div class="field"><label for="desc">Contalo en una línea</label><textarea class="textarea" id="desc" maxlength="240" placeholder="Ej.: pierde agua abajo del lavatorio">${esc(draft.descripcion)}</textarea><span class="err" id="desc-err"></span></div>
      <div class="chips wrap" id="sug">${r ? r.sugerencias.map((s) => `<button type="button" class="chip" data-s="${esc(s)}">${esc(s)}</button>`).join('') : '<span class="xs faint">Elegí un rubro para ver sugerencias</span>'}</div>
      <label class="opt ${draft.urgente ? 'on' : ''}" id="urg"><input type="checkbox" class="sr-only" ${draft.urgente ? 'checked' : ''}>${icon('zap')}<div class="grow"><div class="strong small">Changa urgente</div><div class="xs muted">Se destaca en el feed. Recargo sugerido de ${S.getDb().config.recargoUrgentePct}% para quien va ya.</div></div>${draft.urgente ? '<span class="badge accent">Urgente</span>' : ''}</label>
      <div class="field"><span class="label">Fotos (opcional)</span><div class="photos" id="ph">${draft.fotos.map((f, i) => `<div class="ph"><img src="${f}" alt="Foto ${i + 1}"><button type="button" class="btn icon sm" style="position:absolute;top:2px;right:2px;min-height:24px;width:24px;background:var(--surface)" data-rm="${i}" aria-label="Quitar">${icon('x', 'sm')}</button></div>`).join('')}${draft.fotos.length < 3 ? `<label class="add">${icon('camera')}<input type="file" accept="image/*" id="file" class="sr-only" multiple></label>` : ''}</div></div>
    </div>`;
  },
  cta: () => '<button class="btn primary" data-act="next">Siguiente</button>',
  mount(el, ctx) {
    el.querySelector('#rg').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; draft.rubroId = b.dataset.id; saveDesc(); ctx.refresh(); };
    const saveDesc = () => { draft.descripcion = el.querySelector('#desc').value; };
    el.querySelector('#desc').addEventListener('input', saveDesc);
    el.querySelector('#sug').onclick = (e) => { const b = e.target.closest('[data-s]'); if (!b) return; el.querySelector('#desc').value = b.dataset.s; saveDesc(); };
    el.querySelector('#urg').onclick = (e) => { e.preventDefault(); saveDesc(); draft.urgente = !draft.urgente; ctx.refresh(); };
    el.querySelector('#ph').onclick = (e) => { const b = e.target.closest('[data-rm]'); if (!b) return; draft.fotos.splice(Number(b.dataset.rm), 1); saveDesc(); ctx.refresh(); };
    const file = el.querySelector('#file');
    if (file) file.onchange = async () => {
      saveDesc();
      for (const f of [...file.files].slice(0, 3 - draft.fotos.length)) { try { draft.fotos.push((await readImage(f, 520)).dataUrl); } catch (err) { toast(err.message, 'err'); } }
      ctx.refresh();
    };
  },
  actions: {
    next() {
      const el = qs('.view');
      draft.descripcion = el.querySelector('#desc').value.trim();
      let ok = true;
      el.querySelector('#rubro-err').textContent = draft.rubroId ? '' : 'Elegí un rubro.';
      if (!draft.rubroId) ok = false;
      const de = draft.descripcion.length >= 8 ? '' : 'Contanos un poco más (mínimo 8 caracteres).';
      el.querySelector('#desc-err').textContent = de; el.querySelector('#desc').classList.toggle('invalid', !!de);
      if (de) ok = false;
      if (ok) go('/publicar/2');
    },
  },
};

const pub2 = {
  back: true, title: 'Publicar changa', skeleton: false, live: false,
  render(ctx) {
    if (!draft) { draft = newDraft(ctx); }
    return `${stepper(2)}<div class="stack">
      <h1>¿Dónde y cuándo?</h1>
      <div class="field"><span class="label">Dirección</span><div class="stack" id="dirs" style="gap:8px">${ctx.user.direcciones.map((d) => `<button type="button" class="opt ${draft.direccionId === d.id ? 'on' : ''}" data-id="${d.id}">${icon('pin')}<div class="grow"><div class="strong small">${esc(d.alias)}</div><div class="xs muted">${esc(d.calle)} · ${esc(S.barrio(d.barrio).nombre)}</div></div></button>`).join('')}</div>
      <button type="button" class="btn ghost sm" data-go="/perfil/direcciones" style="align-self:flex-start">${icon('plus', 'sm')}Agregar dirección</button></div>
      <div class="field"><span class="label">Cuándo</span><div class="seg" id="when"><button type="button" data-v="asap" class="${draft.cuando === 'asap' ? 'on' : ''}">Lo antes posible</button><button type="button" data-v="prog" class="${draft.cuando === 'prog' ? 'on' : ''}">Programar</button></div></div>
      <div id="prog" class="${draft.cuando === 'prog' ? '' : 'hidden'} stack">
        <div class="field"><label for="fecha">Fecha</label><input class="input mono" type="date" id="fecha" min="${isoToday()}" value="${draft.fecha}"></div>
        <div class="field"><span class="label">Franja horaria</span><div class="chips wrap" id="fr">${Object.entries(FRANJAS).map(([k, v]) => `<button type="button" class="chip ${draft.franja === k ? 'on' : ''}" data-v="${k}">${v}</button>`).join('')}</div></div>
      </div>
    </div>`;
  },
  cta: () => '<button class="btn" data-act="__back">Atrás</button><button class="btn primary" data-act="next">Siguiente</button>',
  mount(el) {
    el.querySelector('#dirs').onclick = (e) => { const b = e.target.closest('[data-id]'); if (!b) return; draft.direccionId = b.dataset.id; qsa('#dirs .opt').forEach((x) => x.classList.toggle('on', x === b)); };
    el.querySelector('#when').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; draft.cuando = b.dataset.v; qsa('#when button').forEach((x) => x.classList.toggle('on', x === b)); el.querySelector('#prog').classList.toggle('hidden', draft.cuando !== 'prog'); };
    el.querySelector('#fr').onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; draft.franja = b.dataset.v; qsa('#fr .chip').forEach((x) => x.classList.toggle('on', x === b)); };
    el.querySelector('#fecha').onchange = (e) => { draft.fecha = e.target.value; };
  },
  actions: {
    next() {
      if (draft.cuando === 'prog' && (!draft.fecha || draft.fecha < isoToday())) { toast('Elegí una fecha desde hoy en adelante.', 'err'); return; }
      go('/publicar/3');
    },
  },
};

const pub3 = {
  back: true, title: 'Publicar changa', skeleton: false, live: false,
  render(ctx) {
    if (!draft?.rubroId) { go('/publicar/1'); return ''; }
    const r = S.rubro(draft.rubroId);
    return `${stepper(3)}<div class="stack">
      <h1>Presupuesto y pago</h1>
      <div class="field"><label for="pres">Presupuesto de referencia (opcional)</label><div class="input-group"><span class="prefix">$</span><input class="input" id="pres" inputmode="numeric" placeholder="30.000" value="${draft.presupuesto ? Number(draft.presupuesto).toLocaleString('es-AR') : ''}"></div>
      <span class="hint">Referencia en Santa Fe para ${esc(r.nombre.toLowerCase())}: <span class="mono">${money(r.precio[0])} – ${money(r.precio[1])}</span>. Los prestadores te mandan su precio.</span></div>
      <div class="field"><span class="label">¿Cómo pensás pagar?</span><div class="stack" id="med" style="gap:8px">${['efectivo', 'transferencia', 'mercadopago'].map((m) => `<button type="button" class="opt ${draft.medio === m ? 'on' : ''}" data-v="${m}">${icon(MEDIOS[m].icono)}<div class="grow"><div class="strong small">${MEDIOS[m].label}</div><div class="xs muted">${{ efectivo: 'Le pagás en mano al terminar. Confirmás el monto en la app.', transferencia: 'A la cuenta de Royal. Incluye Garantía Royal.', mercadopago: 'Pago online al terminar. Incluye Garantía Royal.' }[m]}</div></div></button>`).join('')}</div></div>
      <div class="banner info">${icon('info')}<div>Vos pagás el precio acordado. La comisión de Royal (${r.comision}%) la paga el prestador.</div></div>
    </div>`;
  },
  cta: () => '<button class="btn" data-act="__back">Atrás</button><button class="btn primary" data-act="next">Ver resumen</button>',
  mount(el) {
    const pres = el.querySelector('#pres');
    pres.addEventListener('input', () => { const n = pres.value.replace(/\D/g, ''); draft.presupuesto = n; pres.value = n ? Number(n).toLocaleString('es-AR') : ''; });
    el.querySelector('#med').onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; draft.medio = b.dataset.v; qsa('#med .opt').forEach((x) => x.classList.toggle('on', x === b)); };
  },
  actions: { next: () => go('/publicar/resumen') },
};

const pubResumen = {
  back: true, title: 'Revisá y publicá', skeleton: false, live: false,
  render(ctx) {
    if (!draft?.rubroId) { go('/publicar/1'); return ''; }
    const r = S.rubro(draft.rubroId);
    const d = ctx.user.direcciones.find((x) => x.id === draft.direccionId);
    const row = (label, value, step) => `<div class="li"><div class="grow"><div class="xs faint">${label}</div><div class="small">${value}</div></div><button class="btn ghost sm" data-go="/publicar/${step}">Editar</button></div>`;
    return `${stepper(4)}<div class="stack">
      <h1>Resumen</h1>
      <div class="card list">
        ${row('Rubro', `${esc(r.nombre)} ${draft.urgente ? '<span class="badge accent">Urgente</span>' : ''}`, 1)}
        ${row('Descripción', esc(draft.descripcion), 1)}
        ${draft.fotos.length ? row('Fotos', `<div class="photos">${draft.fotos.map((f) => `<div class="ph" style="width:48px;height:48px"><img src="${f}" alt=""></div>`).join('')}</div>`, 1) : ''}
        ${row('Dirección', `${esc(d.calle)} · ${esc(S.barrio(d.barrio).nombre)}`, 2)}
        ${row('Cuándo', draft.cuando === 'asap' ? 'Lo antes posible' : `${fmtDay(draft.fecha)} · ${FRANJAS[draft.franja]}`, 2)}
        ${row('Presupuesto de referencia', draft.presupuesto ? moneyHtml(Number(draft.presupuesto)) : 'Sin referencia', 3)}
        ${row('Pago previsto', MEDIOS[draft.medio].label, 3)}
      </div>
      <p class="xs faint">Al publicar, avisamos a los prestadores verificados de ${esc(r.nombre.toLowerCase())} cerca de ${esc(S.barrio(d.barrio).nombre)}.</p>
    </div>`;
  },
  cta: () => '<button class="btn primary" data-act="publish">Publicar changa</button>',
  actions: {
    publish(b, e, ctx) {
      run(b, async () => {
        await S.net();
        const d = ctx.user.direcciones.find((x) => x.id === draft.direccionId);
        const { req, sinPrestadores } = S.createRequest(ctx.user.id, {
          rubroId: draft.rubroId, descripcion: draft.descripcion, fotos: draft.fotos, direccion: d,
          cuando: draft.cuando === 'asap' ? { tipo: 'asap' } : { tipo: 'programado', fecha: draft.fecha, franja: draft.franja },
          urgente: draft.urgente, presupuestoRef: draft.presupuesto ? Number(draft.presupuesto) : null, medio: draft.medio,
        });
        const secs = Math.round((Date.now() - draft.startedAt) / 1000);
        draft = null;
        toast(sinPrestadores ? 'Publicada. Hoy hay pocos prestadores en tu zona: puede demorar.' : `Changa publicada en ${secs} s`, 'ok');
        go(`/changa/${req.id}`, { drop: '/publicar' });
      });
    },
  },
};

/* ───────────── Detalle de changa publicada ───────────── */
const changa = {
  back: true, title: (ctx) => ctx.params.id, skeleton: 'detail',
  render(ctx) {
    const r = S.request(ctx.params.id);
    if (!r || r.clienteId !== ctx.user.id) return empty('alert', 'Changa no encontrada', '');
    const apps = S.applicationsOf(r.id).filter((a) => a.estado === 'activa' || a.estado === 'aceptada');
    const open = ['abierta', 'con_postulaciones'].includes(r.estado);
    const rb = S.rubro(r.rubroId);
    const avisados = S.getDb().providers.filter((p) => p.estado === 'aprobado' && S.canWorkRubro(p, r.rubroId) && S.distKm(p, r.direccion) <= 6).length;
    return `<div class="stack">
      <div class="row between">${statusBadge('request', r.estado, L)}${r.urgente ? '<span class="badge accent">' + icon('zap') + 'Urgente</span>' : ''}</div>
      <div class="row top">${rubroIcon(r.rubroId)}<div class="grow"><h1 style="font-size:19px">${esc(r.descripcion)}</h1><div class="small muted">${esc(rb.nombre)} · ${esc(S.barrio(r.direccion.barrio).nombre)} · ${r.cuando.tipo === 'asap' ? 'Lo antes posible' : `${fmtDay(r.cuando.fecha)} · ${FRANJAS[r.cuando.franja]}`}</div></div></div>
      ${r.fotos?.length ? `<div class="photos">${r.fotos.map((f) => `<div class="ph"><img src="${f}" alt="Foto"></div>`).join('')}</div>` : ''}
      <dl class="kv card pad"><dt>Presupuesto de referencia</dt><dd>${r.presupuestoRef ? moneyHtml(r.presupuestoRef) : '—'}</dd><dt>Pago previsto</dt><dd>${MEDIOS[r.medioPrevisto].label}</dd><dt>Publicada</dt><dd class="mono">${fmtRel(r.creadoEn, S.now())}</dd></dl>
      ${r.estado === 'asignada' && r.ordenId ? `<button class="banner ok" style="width:100%;text-align:left;cursor:pointer" data-go="/orden/${r.ordenId}">${icon('check')}<div class="grow">Contrataste. Seguí la orden <span class="mono">${r.ordenId}</span>.</div>${icon('right', 'sm')}</button>` : ''}
      <div class="section-title"><h2>Postulaciones <span class="mono faint">${apps.length}</span></h2>${apps.length > 1 && open ? '<button class="btn sm" data-act="compare">Comparar</button>' : ''}</div>
      ${apps.length ? `<div class="stack" id="apps">${apps.map((a) => appCard(a, r, open)).join('')}</div>`
        : open ? `<div class="card pad stack"><div class="row">${icon('clock')}<div class="grow"><div class="strong small">Esperando postulaciones</div><div class="xs muted">Avisamos a ${plural(avisados, 'prestador verificado', 'prestadores verificados')} a menos de 6 km. Suelen responder en minutos.</div></div></div><div class="sk sk-block" style="height:56px"></div></div>` : '<p class="small muted">Sin postulaciones.</p>'}
      <div class="section-title"><h2>Historial</h2></div>
      <ul class="timeline">${r.historial.map((h, i) => `<li class="${i === r.historial.length - 1 ? 'now' : ''}"><div>${esc(h.texto)}</div><div class="t">${fmtDate(h.t)} ${fmtTime(h.t)}</div></li>`).join('')}</ul>
      ${open ? '<button class="btn danger block" data-act="cancel">Cancelar changa</button>' : ''}
    </div>`;
  },
  actions: {
    hire(b, e, ctx) {
      const a = S.application(b.dataset.id);
      const r = S.request(a.requestId);
      const pu = S.user(S.provider(a.providerId).userId);
      let medio = r.medioPrevisto;
      const s = sheet({
        title: `Contratar a ${pu.nombre}`,
        body: `<div class="stack"><dl class="kv"><dt>Precio</dt><dd>${moneyHtml(a.precio)}</dd><dt>Cuándo</dt><dd>${r.cuando.tipo === 'asap' ? 'Lo antes posible' : `${fmtDay(a.fecha)} · ${FRANJAS[a.franja]}`}</dd><dt>Dirección</dt><dd>${esc(r.direccion.calle)}</dd></dl>
          <div class="field"><span class="label">Medio de pago</span><div class="seg" id="m">${['efectivo', 'transferencia', 'mercadopago', 'tarjeta'].map((m) => `<button type="button" data-v="${m}" class="${m === medio ? 'on' : ''}">${MEDIOS[m].label.replace(' guardada', '')}</button>`).join('')}</div></div>
          <p class="xs muted">${esc(pu.nombre)} tiene ${S.getDb().config.plazoConfirmacionMin} min para confirmar. Si no confirma, tu changa vuelve a recibir postulaciones.</p></div>`,
        footer: '<button class="btn primary block" data-ok>Confirmar y contratar</button>',
      });
      s.el.querySelector('#m').onclick = (ev) => { const bt = ev.target.closest('button'); if (!bt) return; medio = bt.dataset.v; s.el.querySelectorAll('#m button').forEach((x) => x.classList.toggle('on', x === bt)); };
      const ok = s.el.querySelector('[data-ok]');
      ok.onclick = () => run(ok, async () => {
        if (medio === 'tarjeta' && !ctx.user.tarjetas.length) throw new S.AppError('No tenés tarjetas guardadas. Agregá una en Perfil › Medios de pago.');
        await S.net();
        const o = S.hireApplication(ctx.user.id, a.id, medio);
        s.close();
        toast(`Listo, contrataste a ${pu.nombre}`, 'ok');
        go(`/orden/${o.id}`);
      });
    },
    compare(b, e, ctx) {
      const r = S.request(ctx.params.id);
      const apps = S.applicationsOf(r.id).filter((a) => a.estado === 'activa');
      const rows = apps.map((a) => { const p = S.provider(a.providerId); return { a, p, u: S.user(p.userId), st: S.providerStats(p) }; });
      const best = (fn, dir = 1) => rows.reduce((m, x) => (fn(x) * dir > fn(m) * dir ? x : m), rows[0]);
      const cheapest = best((x) => x.a.precio, -1), topRated = best((x) => x.st.rating.avg), nearest = best((x) => x.a.distanciaKm, -1);
      const cell = (x, v, isBest) => `<td class="${isBest ? 'strong' : ''}" style="padding:8px 6px;border-bottom:1px solid var(--border)">${v}${isBest ? ' <span class="dot accent" style="display:inline-block"></span>' : ''}</td>`;
      const s = sheet({
        title: 'Comparar postulaciones',
        body: `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th></th>${rows.map((x) => `<th style="text-align:left;padding:6px">${avatar(x.u, 'sm')}<div class="small">${esc(x.u.nombre)}</div></th>`).join('')}</tr></thead><tbody>
          <tr><td class="xs muted">Precio</td>${rows.map((x) => cell(x, `<span class="mono">${money(x.a.precio)}</span>`, x === cheapest)).join('')}</tr>
          <tr><td class="xs muted">Calificación</td>${rows.map((x) => cell(x, x.st.rating.count ? `<span class="mono">${x.st.rating.avg.toFixed(1)}</span> (${x.st.rating.count})` : 'Nuevo', x === topRated && x.st.rating.count)).join('')}</tr>
          <tr><td class="xs muted">Trabajos</td>${rows.map((x) => cell(x, `<span class="mono">${x.st.trabajos}</span>`)).join('')}</tr>
          <tr><td class="xs muted">Distancia</td>${rows.map((x) => cell(x, `<span class="mono">${x.a.distanciaKm} km</span>`, x === nearest)).join('')}</tr>
          <tr><td class="xs muted">Verificación</td>${rows.map((x) => cell(x, S.NIVEL_LABEL[x.st.verif.nivel].replace('Verificación ', ''))).join('')}</tr>
          <tr><td class="xs muted">Responde en</td>${rows.map((x) => cell(x, `<span class="mono">~${x.p.respuestaMin} min</span>`)).join('')}</tr>
          <tr><td></td>${rows.map((x) => `<td style="padding:8px 6px"><button class="btn sm primary" data-pick="${x.a.id}">Elegir</button></td>`).join('')}</tr>
        </tbody></table></div><p class="xs faint" style="margin-top:8px"><span class="dot accent" style="display:inline-block"></span> mejor valor en cada fila</p>`,
      });
      s.el.querySelectorAll('[data-pick]').forEach((bt) => { bt.onclick = () => { s.close(); setTimeout(() => changa.actions.hire({ dataset: { id: bt.dataset.pick } }, null, ctx), 180); }; });
    },
    async cancel(b, e, ctx) {
      const motivo = await pickReason('Cancelar changa', MOTIVOS_CANCELACION);
      if (!motivo) return;
      run(null, async () => { await S.net(); S.cancelRequest(ctx.params.id, ctx.user.id, motivo); toast('Changa cancelada', 'ok'); });
    },
  },
};

function appCard(a, r, open) {
  const p = S.provider(a.providerId);
  const u = S.user(p.userId);
  const st = S.providerStats(p);
  return `<div class="card" style="animation:viewin .2s">
    <div class="pad stack" style="gap:8px">
      <div class="row">${avatar(u, '', ['medio', 'alto'].includes(st.verif.nivel))}<div class="grow"><div class="row between"><button class="strong" style="background:none;border:0;padding:0;cursor:pointer;color:inherit;font:inherit;font-weight:600" data-go="/prestador/${p.id}?app=${a.id}">${esc(u.nombre)} ${esc(u.apellido)}</button><span class="money strong" style="font-size:17px">${money(a.precio)}</span></div>
      <div class="row between">${rating(st.rating.avg, st.rating.count)}<span class="xs faint mono">${a.distanciaKm} km · ${fmtRel(a.creadoEn, S.now())}</span></div></div></div>
      <div class="row wrap gap-1">${verifBadges(p, true)}<span class="badge outline">${plural(st.trabajos, 'trabajo')}</span></div>
      <p class="small">“${esc(a.mensaje)}”</p>
      <div class="xs muted">${r.cuando.tipo === 'asap' ? 'Puede ir hoy' : `Propone ${fmtDay(a.fecha)} · ${FRANJAS[a.franja]}`} · respondió en ${a.respuestaMin} min</div>
    </div>
    ${open && a.estado === 'activa' ? `<div class="row" style="border-top:1px solid var(--border);padding:8px 12px"><button class="btn sm ghost grow" data-go="/prestador/${p.id}?app=${a.id}">Ver perfil</button><button class="btn sm primary grow" data-act="hire" data-id="${a.id}">Elegir</button></div>` : a.estado === 'aceptada' ? '<div class="pad" style="border-top:1px solid var(--border);padding:8px 12px"><span class="badge ok">Elegido</span></div>' : ''}
  </div>`;
}

function pickReason(title, reasons, { warn = '' } = {}) {
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

/* ───────────── Perfil del prestador ───────────── */
const perfilPrestador = {
  back: true, title: 'Perfil', skeleton: 'detail',
  render(ctx) {
    const p = S.provider(ctx.params.id);
    if (!p) return empty('user', 'Prestador no encontrado', '');
    const u = S.user(p.userId);
    const st = S.providerStats(p);
    const km = S.distKm(origin(ctx), p);
    const fav = ctx.user.favoritos.includes(p.id);
    const v = st.verif;
    const docMat = v.matriculas;
    const revs = st.rating.reviews.slice(0, 12);
    const ordersCli = new Map(S.getDb().orders.map((o) => [o.id, o]));
    return `<div class="stack">
      <div class="row top">${avatar(u, 'lg', ['medio', 'alto'].includes(v.nivel))}<div class="grow"><h1>${esc(u.nombre)} ${esc(u.apellido)}</h1><div class="small muted">${p.rubros.map((r) => esc(S.rubro(r).nombre)).join(' · ')}</div><div class="small muted row gap-1">${icon('pin', 'sm')}${esc(S.barrio(p.barrio).nombre)}${km != null ? ` · <span class="mono">${km} km</span>` : ''}</div></div>
      <button class="btn icon ghost" data-act="fav" aria-label="${fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}" aria-pressed="${fav}" style="color:${fav ? 'var(--accent)' : 'inherit'}">${icon('heart', fav ? 'fill' : '')}</button></div>
      ${fav ? '<style>.view [aria-pressed="true"] .ic{fill:currentColor}</style>' : ''}
      ${st.nuevo ? `<div class="banner info">${icon('info')}<div><b>Perfil nuevo.</b> Todavía no tiene trabajos en Royal. Su identidad${v.antecedentes ? ' y antecedentes están verificados' : ' está verificada'}.</div></div>` : ''}
      ${p.disponible ? '<span class="badge ok" style="align-self:flex-start">Disponible ahora</span>' : '<span class="badge" style="align-self:flex-start">No disponible ahora</span>'}
      <div class="stat-grid">
        <div><div class="xs muted">Calificación</div><div class="v">${st.rating.count ? st.rating.avg.toFixed(1) : '—'}</div><div class="xs faint">${plural(st.rating.count, 'reseña verificada', 'reseñas verificadas')}</div></div>
        <div><div class="xs muted">Trabajos en Royal</div><div class="v">${st.trabajos}</div><div class="xs faint">finalizados</div></div>
        <div><div class="xs muted">Responde en</div><div class="v">~${p.respuestaMin} min</div><div class="xs faint">promedio</div></div>
        <div><div class="xs muted">Cancelaciones tardías</div><div class="v">${p.cancelacionesTardias}</div><div class="xs faint">últimos 90 días</div></div>
      </div>
      <div class="section-title"><h2>Verificación</h2><span class="badge ${v.nivel === 'alto' ? 'ok' : v.nivel === 'medio' ? 'ok' : 'info'}">${S.NIVEL_LABEL[v.nivel]}</span></div>
      <div class="card list">
        <div class="li">${icon('shield')}<div class="grow"><div class="small strong">Identidad</div><div class="xs muted">DNI frente y dorso + selfie de validación</div></div>${v.identidad ? '<span class="badge ok">Verificado</span>' : '<span class="badge warn">Pendiente</span>'}</div>
        <div class="li">${icon('file')}<div class="grow"><div class="small strong">Antecedentes penales</div><div class="xs muted">Registro Nacional de Reincidencia</div></div>${v.antecedentes ? '<span class="badge ok">Sin registros</span>' : '<span class="badge">No requerido</span>'}</div>
        ${docMat.map((m) => `<div class="li">${icon('badge')}<div class="grow"><div class="small strong">Matrícula · ${esc(S.rubro(m.rubroId).nombre)}</div><div class="xs muted mono">${esc(m.doc?.numero || '—')} · vence ${m.doc?.vence ? fmtDateY(m.doc.vence) : '—'}</div></div>${m.vigente ? `<span class="badge ${m.porVencer ? 'warn' : 'ok'}">${m.porVencer ? 'Por vencer' : 'Vigente'}</span>` : '<span class="badge danger">No vigente</span>'}</div>`).join('')}
      </div>
      <p class="xs faint">Rubros de riesgo alto (gas, electricidad, aires) exigen matrícula vigente. Riesgo: ${p.rubros.map((r) => `${esc(S.rubro(r).nombre)} ${RIESGO_LABEL[S.rubro(r).riesgo].toLowerCase()}`).join(' · ')}.</p>
      <div class="section-title"><h2>Sobre su trabajo</h2></div>
      <p class="small">${esc(p.descripcion)}</p>
      <div class="chips wrap">${p.tags.map((t) => `<span class="chip" style="cursor:default">${esc(t)}</span>`).join('')}</div>
      ${p.galeria.length ? `<div class="section-title"><h2>Trabajos realizados</h2></div><div class="gallery">${p.galeria.map((g, i) => galleryTile(g, i)).join('')}</div>` : ''}
      <div class="section-title"><h2>Zona de cobertura</h2></div>
      ${mapSvg({ highlight: p.barrios, pins: [{ x: p.x, y: p.y, id: p.id, label: u.nombre[0] + u.apellido[0], verified: true }], me: origin(ctx) })}
      <p class="small muted">${p.barrios.map((b) => esc(S.barrio(b).nombre)).join(' · ')}</p>
      <div class="section-title"><h2>Reseñas verificadas</h2><span class="small">${st.rating.count ? stars(st.rating.avg) : ''}</span></div>
      ${st.rating.count ? `<div class="dist">${[5, 4, 3, 2, 1].map((n) => `<span>${n}</span><div class="bar"><i style="width:${(st.rating.dist[n - 1] / st.rating.count) * 100}%"></i></div><span class="right">${st.rating.dist[n - 1]}</span>`).join('')}</div>
      <div class="card list">${revs.map((rv) => { const au = S.user(rv.autorId); return `<div class="li" style="align-items:flex-start;flex-direction:column;gap:4px"><div class="row between" style="width:100%">${stars(rv.estrellas)}<span class="xs faint mono">${fmtDate(rv.t)}</span></div>${rv.comentario ? `<p class="small">${esc(rv.comentario)}</p>` : ''}<div class="row wrap gap-1">${rv.tags.map((t) => `<span class="badge outline">${esc(t)}</span>`).join('')}</div><div class="xs muted">${esc(au.nombre)} ${esc(au.apellido[0])}. · ${esc(S.rubro(rv.rubroId).nombre)} · <span class="badge ok" style="height:18px">${icon('check')}Trabajo verificado ${esc(rv.orderId)}</span></div></div>`; }).join('')}</div>`
        : '<p class="small muted">Todavía no tiene reseñas. Solo pueden calificar clientes que completaron una orden con este prestador.</p>'}
    </div>`;
  },
  cta(ctx) {
    const p = S.provider(ctx.params.id);
    if (!p) return '';
    const a = ctx.query.app && S.application(ctx.query.app);
    if (a && a.estado === 'activa') return `<button class="btn primary" data-act="pickApp">Elegir · ${money(a.precio)}</button>`;
    return `<button class="btn" data-go="/publicar/1?rubro=${p.rubros[0]}">Publicar changa</button><button class="btn primary" data-go="/contratar/${p.id}">Contratar</button>`;
  },
  actions: {
    fav(b, e, ctx) { const on = S.toggleFavorite(ctx.user.id, ctx.params.id); toast(on ? 'Agregado a favoritos' : 'Quitado de favoritos', 'ok'); },
    pickApp(b, e, ctx) { changa.actions.hire({ dataset: { id: ctx.query.app } }, null, ctx); },
  },
};

/* ───────────── Contratación directa desde el catálogo ───────────── */
const contratar = {
  back: true, title: 'Contratar', skeleton: false, live: false,
  render(ctx) {
    const p = S.provider(ctx.params.id);
    const u = S.user(p.userId);
    const rubros = p.rubros.filter((r) => S.canWorkRubro(p, r));
    const rsel = ctx.query.rubro && rubros.includes(ctx.query.rubro) ? ctx.query.rubro : rubros[0];
    const days = Array.from({ length: 7 }, (_, i) => S.isoDate(S.now() + (i + 1) * 86400000));
    return `<form id="hf" class="stack" novalidate>
      <div class="row">${avatar(u)}<div class="grow"><div class="strong">${esc(u.nombre)} ${esc(u.apellido)}</div><div class="xs muted">Contratación directa · confirma dentro de ${S.getDb().config.plazoConfirmacionMin} min</div></div></div>
      <div class="field"><label for="rb">Rubro</label><select class="select" id="rb">${rubros.map((r) => `<option value="${r}" ${r === rsel ? 'selected' : ''}>${esc(S.rubro(r).nombre)}</option>`).join('')}</select></div>
      <div class="field"><label for="ds">¿Qué necesitás?</label><textarea class="textarea" id="ds" placeholder="Contalo en una línea"></textarea><span class="err" id="ds-err"></span></div>
      <div class="field"><label for="dr">Dirección</label><select class="select" id="dr">${ctx.user.direcciones.map((d) => `<option value="${d.id}">${esc(d.alias)} · ${esc(d.calle)}</option>`).join('')}</select></div>
      <div class="field"><span class="label">Día</span><div class="chips" id="days">${days.map((d, i) => `<button type="button" class="chip ${i === 0 ? 'on' : ''}" data-v="${d}">${fmtDay(d)}</button>`).join('')}</div></div>
      <div class="field"><span class="label">Franja (según su disponibilidad)</span><div class="chips wrap" id="frs"></div><span class="err" id="fr-err"></span></div>
      <div class="field"><label for="pr">Precio acordado</label><div class="input-group"><span class="prefix">$</span><input class="input" id="pr" inputmode="numeric"></div><span class="hint" id="pr-hint"></span><span class="err" id="pr-err"></span></div>
      <div class="field"><label for="md">Medio de pago</label><select class="select" id="md">${['efectivo', 'transferencia', 'mercadopago', 'tarjeta'].map((m) => `<option value="${m}">${MEDIOS[m].label}${m === 'tarjeta' && ctx.user.tarjetas[0] ? ` · •••• ${ctx.user.tarjetas[0].last4}` : ''}</option>`).join('')}</select></div>
    </form>`;
  },
  cta: () => '<button class="btn primary" data-act="send">Enviar pedido</button>',
  mount(el, ctx) {
    const p = S.provider(ctx.params.id);
    let day = el.querySelector('#days .chip.on').dataset.v, fr = null;
    const drawFr = () => {
      const dow = S.getDb() && ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'][new Date(day + 'T12:00:00').getDay()];
      const avail = p.disponibilidad[dow] || [];
      const taken = (k) => S.getDb().orders.some((o) => o.providerId === p.id && o.fecha === day && o.franja === k && ['confirmada', 'en_camino', 'en_curso'].includes(o.estado));
      el.querySelector('#frs').innerHTML = Object.entries(FRANJAS).map(([k, v]) => { const ok = avail.includes(k) && !taken(k); return `<button type="button" class="chip ${fr === k ? 'on' : ''}" data-v="${k}" ${ok ? '' : 'disabled style="opacity:.4;cursor:not-allowed" data-tip="No disponible"'}>${v}</button>`; }).join('');
    };
    const hint = () => { const r = S.rubro(el.querySelector('#rb').value); el.querySelector('#pr-hint').innerHTML = `Referencia: <span class="mono">${money(r.precio[0])} – ${money(r.precio[1])}</span>`; };
    el.querySelector('#days').onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; day = b.dataset.v; fr = null; qsa('#days .chip').forEach((x) => x.classList.toggle('on', x === b)); drawFr(); };
    el.querySelector('#frs').onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b || b.disabled) return; fr = b.dataset.v; qsa('#frs .chip').forEach((x) => x.classList.toggle('on', x === b)); };
    el.querySelector('#rb').onchange = hint;
    const pr = el.querySelector('#pr');
    pr.addEventListener('input', () => { const n = pr.value.replace(/\D/g, ''); pr.value = n ? Number(n).toLocaleString('es-AR') : ''; });
    drawFr(); hint();
    contratar._get = () => ({ day, fr });
  },
  actions: {
    send(b, e, ctx) {
      const el = qs('.view');
      const { day, fr } = contratar._get();
      const desc = el.querySelector('#ds').value.trim();
      const precio = Number(el.querySelector('#pr').value.replace(/\D/g, ''));
      el.querySelector('#ds-err').textContent = desc.length >= 8 ? '' : 'Contanos un poco más.';
      el.querySelector('#fr-err').textContent = fr ? '' : 'Elegí una franja disponible.';
      el.querySelector('#pr-err').textContent = precio > 0 ? '' : 'Ingresá el precio acordado.';
      if (desc.length < 8 || !fr || !(precio > 0)) return;
      const medio = el.querySelector('#md').value;
      run(b, async () => {
        if (medio === 'tarjeta' && !ctx.user.tarjetas.length) throw new S.AppError('No tenés tarjetas guardadas. Agregá una en Perfil › Medios de pago.');
        await S.net();
        const d = ctx.user.direcciones.find((x) => x.id === el.querySelector('#dr').value);
        const o = S.hireDirect(ctx.user.id, ctx.params.id, { rubroId: el.querySelector('#rb').value, descripcion: desc, direccion: d, fecha: day, franja: fr, asap: false, precio, medio });
        toast('Pedido enviado', 'ok');
        go(`/orden/${o.id}`, { drop: '/contratar/' });
      });
    },
  },
};

/* ───────────── Mis changas ───────────── */
let misTab = 'activas';
const misChangas = {
  tab: '/mis-changas', title: 'Mis changas',
  render(ctx) {
    const reqs = S.requestsOfClient(ctx.user.id);
    const orders = S.ordersOfClient(ctx.user.id);
    const openReqs = reqs.filter((r) => ['abierta', 'con_postulaciones'].includes(r.estado));
    const act = orders.filter((o) => S.ACTIVE.includes(o.estado));
    const done = orders.filter((o) => ['finalizada', 'calificada', 'resuelta'].includes(o.estado));
    const other = orders.filter((o) => ['cancelada', 'rechazada', 'vencida'].includes(o.estado));
    const closedReqs = reqs.filter((r) => ['cancelada', 'vencida'].includes(r.estado) && !r.ordenId);
    const tabs = `<div class="seg" style="margin-bottom:16px"><button class="${misTab === 'activas' ? 'on' : ''}" data-act="tab" data-v="activas">Activas · ${openReqs.length + act.length}</button><button class="${misTab === 'historial' ? 'on' : ''}" data-act="tab" data-v="historial">Historial · ${done.length + other.length}</button></div>`;
    if (misTab === 'activas') {
      if (!openReqs.length && !act.length) return tabs + empty('clipboard', 'No tenés changas activas', 'Publicá lo que necesitás y recibí postulaciones de prestadores verificados cerca tuyo.', '<button class="btn primary" data-go="/publicar/1?nuevo=1">Publicar changa</button>');
      return `${tabs}<div class="stack">
        ${act.length ? `<div class="upper">Órdenes</div><div class="card list">${act.map((o) => orderRow(o)).join('')}</div>` : ''}
        ${openReqs.length ? `<div class="upper">Changas publicadas</div><div class="card list">${openReqs.map((r) => { const n = S.applicationsOf(r.id).length; return `<button class="li" data-go="/changa/${r.id}"><span class="av sm" style="background:var(--surface-2);color:var(--text)">${rubroIcon(r.rubroId)}</span><div class="grow"><div class="small strong ellipsis">${esc(r.descripcion)}</div><div class="xs muted"><span class="mono">${r.id}</span> · ${fmtRel(r.creadoEn, S.now())}</div></div><span class="badge ${n ? 'accent' : 'info'}">${n ? plural(n, 'postulación', 'postulaciones') : 'Esperando'}</span></button>`; }).join('')}</div>` : ''}
      </div>`;
    }
    if (!done.length && !other.length) return tabs + empty('clock', 'Sin historial todavía', 'Cuando termines tu primera orden la vas a ver acá.');
    return `${tabs}<div class="stack">
      ${done.length ? `<div class="upper">Finalizadas</div><div class="card list">${done.map((o) => orderRow(o, { rehire: true })).join('')}</div>` : ''}
      ${other.length || closedReqs.length ? `<div class="upper">Canceladas, rechazadas o vencidas</div><div class="card list">${other.map((o) => orderRow(o)).join('')}${closedReqs.map((r) => `<button class="li" data-go="/changa/${r.id}"><span class="av sm" style="background:var(--surface-2);color:var(--text)">${rubroIcon(r.rubroId)}</span><div class="grow"><div class="small ellipsis">${esc(r.descripcion)}</div><div class="xs muted mono">${r.id}</div></div>${statusBadge('request', r.estado, L)}</button>`).join('')}</div>` : ''}
    </div>`;
  },
  actions: { tab: (b, e, ctx) => { misTab = b.dataset.v; ctx.refresh(); } },
};

/* ───────────── Orden ───────────── */
const orden = {
  back: true, title: (ctx) => ctx.params.id, skeleton: 'detail',
  render(ctx) {
    const o = S.order(ctx.params.id);
    if (!o || o.clienteId !== ctx.user.id) return empty('alert', 'Orden no encontrada', '');
    const p = S.provider(o.providerId);
    const pu = S.user(p.userId);
    const pay = S.paymentOf(o.id);
    const st = S.providerStats(p);
    const head = {
      pendiente_confirmacion: [`Esperando que ${pu.nombre} confirme`, `Vence en <span class="mono" data-countdown="${o.confirmarAntesDe}">--:--</span>. Si no confirma, tu changa vuelve a recibir postulaciones.`],
      confirmada: [o.asap ? `${pu.nombre} confirmó` : `Confirmada para ${fmtDay(o.fecha)}`, o.asap ? 'Sale hacia tu domicilio en unos minutos.' : FRANJAS[o.franja]],
      en_camino: [o.tracking?.arrived ? `${pu.nombre} llegó` : `Llega en ${o.tracking?.eta ?? '—'} min`, o.tracking?.arrived ? 'Dictale tu código para iniciar el trabajo.' : 'Seguilo en el mapa. Cuando llegue, dictale tu código.'],
      en_curso: ['Trabajo en curso', `Código verificado. ${pu.nombre} está trabajando.`],
      finalizada_pend_cliente: [`${pu.nombre} terminó`, `Informó ${money(o.montoFinal)}. Confirmá el pago para cerrar la orden.`],
      finalizada: ['Orden finalizada', o.calificoCliente ? '¡Gracias por calificar!' : 'Calificá el trabajo: ayuda a otros vecinos.'],
      calificada: ['Orden finalizada y calificada', 'Gracias por usar Royal.'],
      en_disputa: ['En revisión por Royal', 'Estamos analizando el reporte con ambas partes. Te avisamos la resolución.'],
      resuelta: ['Reporte resuelto', S.dispute(o.disputaId)?.resolucion?.nota || ''],
      cancelada: ['Orden cancelada', `${o.cancelacion?.actor === 'cliente' ? 'La cancelaste' : `La canceló ${pu.nombre}`}: ${o.cancelacion?.motivo || ''}${o.cancelacion?.tardia ? ' · Cancelación tardía' : ''}`],
      rechazada: [`${pu.nombre} no pudo tomarla`, 'Tu changa volvió a recibir postulaciones.'],
      vencida: ['Venció sin confirmación', 'Tu changa volvió a recibir postulaciones.'],
    }[o.estado] || [L.order[o.estado], ''];
    const canCancel = ['pendiente_confirmacion', 'confirmada', 'en_camino'].includes(o.estado);
    const canReport = ['en_curso', 'finalizada_pend_cliente', 'finalizada'].includes(o.estado);
    const help = ['en_camino', 'en_curso'].includes(o.estado);
    const d = o.disputaId && S.dispute(o.disputaId);
    return `<div class="stack">
      <div class="card pad stack" style="gap:6px;border-left:3px solid var(--accent)">
        <div class="row between">${statusBadge('order', o.estado, L)}${o.garantia ? `<span class="badge ok">${icon('shield')}Garantía Royal</span>` : ''}</div>
        <h1 style="font-size:20px">${esc(head[0])}</h1><p class="small muted">${head[1]}</p><div style="margin-top:6px">${orderProgress(o, L)}</div>
      </div>
      ${o.estado === 'en_camino' && o.tracking ? mapSvg({ me: o.direccion, mover: { x: o.tracking.x, y: o.tracking.y, label: pu.nombre[0] + pu.apellido[0] }, dest: o.direccion }) : ''}
      ${['confirmada', 'en_camino'].includes(o.estado) ? `<div class="card pad stack center"><div class="upper">Tu código de inicio</div><div class="code">${o.codigo.split('').map((c) => `<span>${c}</span>`).join('')}</div><p class="xs muted">Dictáselo a ${esc(pu.nombre)} cuando esté en tu puerta. Así confirmamos que es la persona verificada. No lo compartas antes.</p></div>` : ''}
      ${d ? `<div class="banner ${d.estado === 'resuelta' ? 'ok' : 'warn'}">${icon('scale')}<div><b>${esc(d.id)} · ${esc(L.dispute[d.estado])}</b><div class="small">${esc(d.motivo)}</div>${d.resolucion ? `<div class="small">Resolución: a favor de ${esc(d.resolucion.favor)}${d.resolucion.montoAjustado != null ? ` · monto ${money(d.resolucion.montoAjustado)}` : ''}. ${esc(d.resolucion.nota || '')}</div>` : ''}</div></div>` : ''}
      <div class="card list"><button class="li" data-go="/prestador/${p.id}">${avatar(pu, '', ['medio', 'alto'].includes(st.verif.nivel))}<div class="grow"><div class="strong small">${esc(pu.nombre)} ${esc(pu.apellido)}</div><div class="xs muted">${S.NIVEL_LABEL[st.verif.nivel]} · ${rating(st.rating.avg, st.rating.count)}</div></div>${icon('right', 'sm chev')}</button>
        <button class="li" data-go="/chat/${o.id}">${icon('message')}<span class="grow small">Mensajes</span>${(() => { const n = S.messagesOf(o.id).filter((m) => m.from !== ctx.user.id && !m.leido).length; return n ? `<span class="count">${n}</span>` : ''; })()}${icon('right', 'sm chev')}</button></div>
      <dl class="kv card pad">
        <dt>Trabajo</dt><dd>${esc(S.rubro(o.rubroId).nombre)}</dd>
        <dt>Descripción</dt><dd>${esc(o.descripcion)}</dd>
        <dt>Dirección</dt><dd>${esc(o.direccion.calle)}</dd>
        <dt>Cuándo</dt><dd>${o.asap ? 'Lo antes posible' : `${fmtDay(o.fecha)} · ${FRANJAS[o.franja]}`}</dd>
        <dt>Precio acordado</dt><dd>${moneyHtml(o.precioAcordado)}</dd>
        ${o.montoFinal ? `<dt>Monto final</dt><dd class="strong">${moneyHtml(o.montoFinal)}</dd>` : ''}
        <dt>Medio de pago</dt><dd>${MEDIOS[o.medio].label}</dd>
        ${pay ? `<dt>Pago</dt><dd>${statusBadge('payment', pay.estado, L)}</dd>` : ''}
      </dl>
      ${help ? `<button class="btn block" data-act="help">${icon('lifebuoy')}Ayuda / emergencia</button>` : ''}
      <div class="section-title"><h2>Timeline</h2></div>
      <ul class="timeline">${[...o.timeline].reverse().map((h, i) => `<li class="${i === 0 ? 'now' : ''}"><div>${esc(h.texto)}</div><div class="t">${fmtDate(h.t)} ${fmtTime(h.t)} · ${esc(h.actor)}</div></li>`).join('')}</ul>
      ${['finalizada', 'calificada'].includes(o.estado) ? `<button class="btn block" data-go="/contratar/${p.id}?rubro=${o.rubroId}">${icon('repeat')}Volver a contratar a ${esc(pu.nombre)}</button>` : ''}
      ${canReport ? `<button class="btn ghost block" data-go="/reportar/${o.id}">${icon('flag')}Reportar un problema</button>` : ''}
      ${canCancel ? '<button class="btn danger block" data-act="cancel">Cancelar orden</button>' : ''}
      ${['calificada', 'finalizada', 'resuelta'].includes(o.estado) && !canReport ? '' : ''}
    </div>`;
  },
  cta(ctx) {
    const o = S.order(ctx.params.id);
    if (!o) return '';
    if (o.estado === 'finalizada_pend_cliente') { const pay = S.paymentOf(o.id); return `<button class="btn primary" data-go="/pago/${o.id}">${pay?.estado === 'pendiente_acreditacion' ? 'Ver estado del pago' : o.medio === 'efectivo' ? `Confirmar pago · ${money(o.montoFinal)}` : `Pagar ${money(o.montoFinal)}`}</button>`; }
    if (['finalizada', 'calificada', 'resuelta'].includes(o.estado) && !o.calificoCliente) return '<button class="btn primary" data-go="/calificar/' + o.id + '">Calificar trabajo</button>';
    return '';
  },
  actions: {
    async cancel(b, e, ctx) {
      const o = S.order(ctx.params.id);
      const late = S.isLateCancel(o);
      const motivo = await pickReason('Cancelar orden', MOTIVOS_CANCELACION, { warn: late ? 'Es una cancelación tardía: queda registrada en tu historial y la ve el prestador.' : '' });
      if (!motivo) return;
      run(null, async () => { await S.net(); const t = S.cancelOrder(o.id, { id: ctx.user.id, rol: 'cliente' }, motivo); toast(t ? 'Orden cancelada (tardía)' : 'Orden cancelada', 'ok'); });
    },
    help(b, e, ctx) {
      const s = sheet({
        title: 'Ayuda durante la orden',
        body: `<div class="stack"><a class="btn danger solid block" href="tel:911">${icon('alert')}Emergencia · llamar al 911</a>
          <div class="upper">Avisar a soporte de Royal</div>
          <div class="stack" id="hm" style="gap:8px">${['No llegó y no responde', 'Me siento inseguro/a', 'No es la persona del perfil', 'Otro problema'].map((m, i) => `<button type="button" class="opt ${i === 0 ? 'on' : ''}" data-v="${m}">${esc(m)}</button>`).join('')}</div></div>`,
        footer: '<button class="btn primary block" data-ok>Avisar a soporte</button>',
      });
      s.el.querySelector('#hm').onclick = (ev) => { const bt = ev.target.closest('[data-v]'); if (!bt) return; s.el.querySelectorAll('#hm .opt').forEach((x) => x.classList.toggle('on', x === bt)); };
      const ok = s.el.querySelector('[data-ok]');
      ok.onclick = () => run(ok, async () => { await S.net(); S.requestHelp(ctx.params.id, ctx.user.id, s.el.querySelector('#hm .on').dataset.v); s.close(); toast('Soporte fue notificado con prioridad. Te contactamos en minutos.', 'ok'); });
    },
  },
};

/* ───────────── Pago ───────────── */
const pago = {
  back: true, title: 'Pago', skeleton: 'detail',
  render(ctx) {
    const o = S.order(ctx.params.id);
    const pay = S.paymentOf(o?.id);
    if (!o || !pay) return empty('wallet', 'Todavía no hay nada para pagar', 'El pago se habilita cuando el prestador marca el trabajo como terminado.');
    const pu = S.user(S.provider(o.providerId).userId);
    const cfg = S.getDb().config;
    if (pay.estado === 'acreditado') return `<div class="stack center" style="padding-top:24px">${icon('check', 'lg')}<h1>Pago acreditado</h1><p class="muted">${money(pay.monto)} · ${MEDIOS[pay.medio].label}</p><button class="btn primary" data-go="/calificar/${o.id}">Calificar a ${esc(pu.nombre)}</button></div>`;
    const diff = o.montoFinal !== o.precioAcordado;
    const methods = ['efectivo', 'transferencia', 'mercadopago', 'tarjeta'];
    const editable = ['pendiente', 'rechazado'].includes(pay.estado);
    let body = '';
    if (pay.medio === 'efectivo') {
      body = `<div class="banner info">${icon('cash')}<div>Pagale <b class="mono">${money(pay.monto)}</b> en mano a ${esc(pu.nombre)} y confirmalo acá. Así queda registrado y suma a su reputación.</div></div>`;
    } else if (pay.medio === 'transferencia') {
      body = pay.estado === 'pendiente_acreditacion'
        ? `<div class="banner warn">${icon('clock')}<div><b>Comprobante recibido.</b> Estamos conciliando la transferencia (unos segundos en la demo). Te avisamos cuando se acredite.</div></div>`
        : pay.estado === 'en_revision' ? `<div class="banner danger">${icon('alert')}<div>El monto recibido no coincide. Soporte lo está revisando.</div></div>`
        : `<div class="card list">
            <div class="li"><div class="grow"><div class="xs faint">Alias</div><div class="mono">${cfg.alias}</div></div><button class="btn sm" data-act="copy" data-v="${cfg.alias}">Copiar</button></div>
            <div class="li"><div class="grow"><div class="xs faint">CBU</div><div class="mono small">${cfg.cbu}</div></div><button class="btn sm" data-act="copy" data-v="${cfg.cbu.replace(/\s/g, '')}">Copiar</button></div>
            <div class="li"><div class="grow"><div class="xs faint">Titular</div><div class="small">Royal Solutions S.A.S. · CUIT 30-71829456-3</div></div></div>
          </div>
          <div class="field"><span class="label">Comprobante</span><label class="btn block">${icon('upload')}Adjuntar comprobante<input type="file" id="comp" accept="image/*,application/pdf" class="sr-only"></label><button type="button" class="btn ghost sm" data-act="fakeProof">Simular comprobante</button></div>`;
    } else {
      const card = ctx.user.tarjetas[0];
      body = pay.estado === 'rechazado' ? `<div class="banner danger">${icon('alert')}<div>El pago fue rechazado. Probá de nuevo o elegí otro medio.</div></div>` : '';
      if (pay.medio === 'tarjeta') body += card ? `<div class="opt on">${icon('card')}<div class="grow"><div class="small strong">${esc(card.marca)} •••• ${card.last4}</div><div class="xs muted mono">token ${esc(card.token.slice(0, 10))}…</div></div></div>` : `<div class="banner warn">${icon('card')}<div>No tenés tarjetas guardadas. <a href="#/perfil/pagos">Agregar una</a>.</div></div>`;
    }
    return `<div class="stack">
      <div class="card pad"><div class="row">${avatar(pu, 'sm')}<div class="grow small"><b>${esc(pu.nombre)} ${esc(pu.apellido)}</b><div class="xs muted mono">${o.id} · ${esc(S.rubro(o.rubroId).nombre)}</div></div></div>
        <hr class="divider"><dl class="kv"><dt>Precio acordado</dt><dd>${moneyHtml(o.precioAcordado)}</dd>${diff ? `<dt>Monto informado</dt><dd class="strong" style="color:var(--warn)">${moneyHtml(o.montoFinal)}</dd>` : ''}<dt>Comisión Royal (${o.comisionPct}%)</dt><dd class="muted">${moneyHtml(pay.comision)} <span class="xs">a cargo del prestador</span></dd><dt class="strong" style="color:var(--text)">Total a pagar</dt><dd class="strong" style="font-size:17px">${moneyHtml(pay.monto)}</dd></dl></div>
      ${diff ? `<div class="banner warn">${icon('alert')}<div>El monto informado es distinto al acordado. Si no lo reconocés, tocá “El monto no coincide”.</div></div>` : ''}
      <div class="field"><span class="label">Medio de pago</span><div class="stack" style="gap:8px" id="mm">${methods.map((m) => `<button type="button" class="opt ${pay.medio === m ? 'on' : ''}" data-v="${m}" ${editable ? '' : 'disabled'}>${icon(MEDIOS[m].icono)}<div class="grow"><div class="small strong">${MEDIOS[m].label}</div></div>${m !== 'efectivo' ? `<span class="badge ok">${icon('shield')}Garantía</span>` : ''}</button>`).join('')}</div></div>
      ${body}
      ${pay.medio === 'efectivo' && editable ? '<button class="btn ghost block" data-act="reject">El monto no coincide</button>' : ''}
    </div>`;
  },
  cta(ctx) {
    const o = S.order(ctx.params.id); const pay = S.paymentOf(o?.id);
    if (!pay || !['pendiente', 'rechazado'].includes(pay.estado)) return '';
    if (pay.medio === 'efectivo') return `<button class="btn primary" data-act="cash">Confirmo que pagué ${money(pay.monto)}</button>`;
    if (pay.medio === 'transferencia') return '';
    return `<button class="btn primary" data-go="/checkout/${o.id}">Pagar ${money(pay.monto)} con ${MEDIOS[pay.medio].label}</button>`;
  },
  mount(el, ctx) {
    el.querySelector('#mm')?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]'); if (!b || b.disabled) return;
      run(null, async () => { S.setPaymentMedio(ctx.params.id, b.dataset.v); });
    });
    const comp = el.querySelector('#comp');
    if (comp) comp.onchange = () => run(null, async () => {
      const img = await readImage(comp.files[0], 480);
      await S.net();
      S.uploadTransferProof(ctx.params.id, img.dataUrl, { id: ctx.user.id, rol: 'cliente' });
      toast('Comprobante enviado', 'ok');
    });
  },
  actions: {
    copy(b) { navigator.clipboard?.writeText(b.dataset.v).then(() => toast('Copiado', 'ok'), () => toast('Copiado', 'ok')); },
    fakeProof(b, e, ctx) { run(b, async () => { await S.net(); S.uploadTransferProof(ctx.params.id, null, { id: ctx.user.id, rol: 'cliente' }); toast('Comprobante enviado', 'ok'); }); },
    cash(b, e, ctx) {
      run(b, async () => { await S.net(); S.confirmCash(ctx.params.id, { id: ctx.user.id, rol: 'cliente' }); toast('Pago registrado', 'ok'); go(`/calificar/${ctx.params.id}`, { replace: true }); });
    },
    reject(b, e, ctx) {
      const s = sheet({ title: 'El monto no coincide', body: `<div class="stack"><p class="small muted">Tu orden pasa a revisión y Royal media con ambas partes. No pagues hasta que se resuelva.</p><div class="field"><label for="rd">¿Qué pasó?</label><textarea class="textarea" id="rd" placeholder="Ej.: acordamos $ 28.500 y me pidió $ 40.000"></textarea></div></div>`, footer: '<button class="btn danger solid block" data-ok>Enviar a revisión</button>' });
      const ok = s.el.querySelector('[data-ok]');
      ok.onclick = () => run(ok, async () => { await S.net(); S.rejectAmount(ctx.params.id, { id: ctx.user.id, rol: 'cliente' }, s.el.querySelector('#rd').value); s.close(); toast('Enviado a revisión', 'ok'); go(`/orden/${ctx.params.id}`, { drop: '/pago/' }); });
    },
  },
};

/* Checkout simulado de Mercado Pago / tarjeta */
const checkout = {
  back: true, title: 'Checkout', skeleton: false, live: false,
  render(ctx) {
    const o = S.order(ctx.params.id); const pay = S.paymentOf(o.id);
    const card = ctx.user.tarjetas[0];
    return `<div class="stack">
      <div class="banner info">${icon('info')}<div>Pasarela de pago <b>simulada</b> para la demo. No se procesa dinero real.</div></div>
      <div class="card pad stack center"><div class="upper">${pay.medio === 'tarjeta' ? 'Pago con tarjeta' : 'Mercado Pago'}</div><div class="big">${money(pay.monto)}</div><div class="xs muted">Royal Solutions · ${o.id}</div></div>
      ${pay.medio === 'tarjeta' && card ? `<div class="opt on">${icon('card')}<div class="grow small">${esc(card.marca)} •••• ${card.last4}</div></div>` : `<div class="opt on">${icon('wallet')}<div class="grow small">Dinero en cuenta · ${esc(ctx.user.email)}</div></div>`}
      <label class="check"><input type="checkbox" id="fail"> <span>Simular pago rechazado</span></label>
      <div id="res"></div>
    </div>`;
  },
  cta: () => '<button class="btn primary" data-act="pay">Pagar</button>',
  actions: {
    pay(b, e, ctx) {
      const fail = qs('#fail').checked;
      run(b, async () => {
        const pay = S.paymentOf(ctx.params.id);
        if (pay.medio === 'tarjeta' && !ctx.user.tarjetas.length) throw new S.AppError('Agregá una tarjeta en Perfil › Medios de pago.');
        await S.net(700, 1300);
        const ok = S.payDigital(ctx.params.id, !fail, { id: ctx.user.id, rol: 'cliente' });
        if (ok) { toast('Pago aprobado', 'ok'); go(`/calificar/${ctx.params.id}`, { drop: ['/pago/', '/checkout/'] }); }
        else qs('#res').innerHTML = `<div class="banner danger">${icon('alert')}<div><b>Pago rechazado.</b> La pasarela no aprobó la operación. Probá con otro medio.</div></div><button class="btn block" data-go="/pago/${ctx.params.id}">Elegir otro medio</button>`;
      });
    },
  },
};

/* ───────────── Calificar ───────────── */
const calificar = {
  back: true, title: 'Calificar', skeleton: false, live: false,
  render(ctx) {
    const o = S.order(ctx.params.id);
    const pu = S.user(S.provider(o.providerId).userId);
    if (!['finalizada', 'calificada', 'resuelta'].includes(o.estado)) return empty('lock', 'Todavía no podés calificar', 'Las reseñas se habilitan cuando la orden está finalizada. Así todas las reseñas son de trabajos reales.');
    if (o.calificoCliente) return empty('check', 'Ya calificaste esta orden', 'Gracias por tu reseña.', `<button class="btn" data-go="/orden/${o.id}">Ver orden</button>`);
    return `<div class="stack center">${avatar(pu, 'lg')}<h1>¿Cómo trabajó ${esc(pu.nombre)}?</h1><p class="small muted">${esc(S.rubro(o.rubroId).nombre)} · <span class="mono">${o.id}</span></p>
      <div class="starpick" id="sp" role="radiogroup" aria-label="Calificación">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-n="${n}" aria-label="${n} estrellas">${icon('star')}</button>`).join('')}</div>
      <div class="chips wrap" id="tg" style="justify-content:center">${REVIEW_TAGS_CLIENTE.map((t) => `<button type="button" class="chip" data-t="${t}">${t}</button>`).join('')}</div>
      <div class="field" style="text-align:left"><label for="cm">Comentario (opcional)</label><textarea class="textarea" id="cm" placeholder="¿Qué destacarías?"></textarea></div>
      <p class="xs faint">Tu reseña se publica como <b>verificada</b> porque viene de una orden real.</p></div>`;
  },
  cta: (ctx) => { const o = S.order(ctx.params.id); return ['finalizada', 'calificada', 'resuelta'].includes(o.estado) && !o.calificoCliente ? '<button class="btn primary" data-act="send">Enviar calificación</button>' : ''; },
  mount(el) {
    calificar._stars = 0; calificar._tags = new Set();
    el.querySelector('#sp')?.addEventListener('click', (e) => { const b = e.target.closest('[data-n]'); if (!b) return; calificar._stars = Number(b.dataset.n); qsa('#sp button').forEach((x) => x.classList.toggle('on', Number(x.dataset.n) <= calificar._stars)); });
    el.querySelector('#tg')?.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (!b) return; b.classList.toggle('on'); calificar._tags.has(b.dataset.t) ? calificar._tags.delete(b.dataset.t) : calificar._tags.add(b.dataset.t); });
  },
  actions: {
    send(b, e, ctx) {
      if (!calificar._stars) { toast('Elegí de 1 a 5 estrellas', 'err'); return; }
      run(b, async () => {
        await S.net();
        S.submitReview(ctx.params.id, ctx.user.id, { estrellas: calificar._stars, tags: [...calificar._tags], comentario: qs('#cm').value });
        toast('¡Gracias! Reseña publicada', 'ok');
        go(`/orden/${ctx.params.id}`, { drop: '/calificar/' });
      });
    },
  },
};

/* ───────────── Reportar problema ───────────── */
const reportar = {
  back: true, title: 'Reportar un problema', skeleton: false, live: false,
  render(ctx) {
    return `<div class="stack"><p class="small muted">Royal media entre las partes. Mientras se revisa, la orden queda en pausa.</p>
      <div class="stack" id="mo" style="gap:8px">${MOTIVOS_DISPUTA.map((m, i) => `<button type="button" class="opt ${i === 0 ? 'on' : ''}" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div>
      <div class="field"><label for="de">Contanos qué pasó</label><textarea class="textarea" id="de"></textarea><span class="err" id="de-err"></span></div>
      <div class="field"><span class="label">Foto (opcional)</span><div class="photos" id="fp"><label class="add">${icon('camera')}<input type="file" id="ff" accept="image/*" class="sr-only"></label></div></div></div>`;
  },
  cta: () => '<button class="btn danger solid" data-act="send">Enviar reporte</button>',
  mount(el) {
    reportar._foto = null;
    el.querySelector('#mo').onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; qsa('#mo .opt').forEach((x) => x.classList.toggle('on', x === b)); };
    el.querySelector('#ff').onchange = async (e) => { try { reportar._foto = (await readImage(e.target.files[0], 480)).dataUrl; el.querySelector('#fp').innerHTML = `<div class="ph"><img src="${reportar._foto}" alt="Evidencia"></div>`; } catch (err) { toast(err.message, 'err'); } };
  },
  actions: {
    send(b, e, ctx) {
      const desc = qs('#de').value.trim();
      qs('#de-err').textContent = desc.length >= 10 ? '' : 'Describí el problema (mínimo 10 caracteres).';
      if (desc.length < 10) return;
      run(b, async () => { await S.net(); S.openDispute(ctx.params.id, { id: ctx.user.id, rol: 'cliente' }, { motivo: qs('#mo .on').dataset.v, descripcion: desc, foto: reportar._foto }); toast('Reporte enviado', 'ok'); go(`/orden/${ctx.params.id}`, { drop: '/reportar/' }); });
    },
  },
};

/* ───────────── Mensajes ───────────── */
const mensajes = {
  tab: '/mensajes', title: 'Mensajes',
  render(ctx) { return threadListHtml(ctx, threadsOf(ctx, S.ordersOfClient(ctx.user.id)), (o) => S.user(S.provider(o.providerId).userId)); },
};

/* ───────────── Perfil ───────────── */
const perfil = {
  tab: '/perfil', title: 'Perfil', skeleton: false,
  render(ctx) {
    const u = ctx.user;
    const p = S.providerByUser(u.id);
    const rc = S.ratingOf(u.id, 'p2c');
    return `<div class="stack">
      <div class="row">${avatar(u, 'lg')}<div class="grow"><h1>${esc(u.nombre)} ${esc(u.apellido)}</h1><div class="small muted">${esc(u.email)}</div><div class="small">${rc.count ? `${rating(rc.avg, rc.count)} <span class="xs muted">como cliente</span>` : ''}</div></div></div>
      <div class="card list">
        <button class="li" data-go="/perfil/datos">${icon('user')}<span class="grow">Mis datos</span>${icon('right', 'sm chev')}</button>
        <button class="li" data-go="/perfil/pagos">${icon('card')}<span class="grow">Medios de pago</span><span class="xs muted">${plural(u.tarjetas.length, 'tarjeta')}</span>${icon('right', 'sm chev')}</button>
        <button class="li" data-go="/perfil/direcciones">${icon('pin')}<span class="grow">Direcciones</span><span class="xs muted">${u.direcciones.length}</span>${icon('right', 'sm chev')}</button>
        <button class="li" data-go="/favoritos">${icon('heart')}<span class="grow">Favoritos</span><span class="xs muted">${u.favoritos.length}</span>${icon('right', 'sm chev')}</button>
        <button class="li" data-go="/perfil/notificaciones">${icon('bell')}<span class="grow">Notificaciones</span>${icon('right', 'sm chev')}</button>
      </div>
      <button class="card pad row" style="width:100%;text-align:left;cursor:pointer;color:inherit" data-act="offer">${icon('briefcase')}<div class="grow"><div class="strong">${p ? 'Ir a mi perfil de prestador' : 'Quiero ofrecer mis servicios'}</div><div class="xs muted">${p ? `Estado: ${L.provider[p.estado]}` : 'Sumate como prestador. Comisión de 3 a 5%, sin abonos.'}</div></div>${icon('external', 'sm')}</button>
      <div class="card list"><button class="li" disabled data-tip="Próximamente" style="opacity:.55">${icon('help')}<span class="grow">Centro de ayuda</span></button></div>
      ${profileFooter('cliente')}
    </div>`;
  },
  actions: {
    offer(b, e, ctx) { S.setSession('prestador', ctx.user.id); location.href = `prestador.html#${S.providerByUser(ctx.user.id) ? '/trabajos' : '/alta'}`; },
  },
};

const perfilDatos = {
  back: true, title: 'Mis datos', skeleton: false, live: false,
  render(ctx) {
    const u = ctx.user;
    const f = (id, label, val, type = 'text') => `<div class="field"><label for="${id}">${label}</label><input class="input" id="${id}" type="${type}" value="${esc(val)}"></div>`;
    return `<form class="stack" id="pf">${f('nombre', 'Nombre', u.nombre)}${f('apellido', 'Apellido', u.apellido)}${f('telefono', 'Teléfono', u.telefono, 'tel')}${f('email', 'Email', u.email, 'email')}${f('dni', 'DNI', u.dni)}
      <p class="xs faint">Tu teléfono nunca se muestra a los prestadores. Para cambiar email o DNI te pedimos la contraseña.</p></form>`;
  },
  cta: () => '<button class="btn primary" data-act="save">Guardar cambios</button>',
  actions: {
    async save(b, e, ctx) {
      const v = (k) => qs('#' + k).value.trim();
      const fields = { nombre: v('nombre'), apellido: v('apellido'), telefono: v('telefono'), email: v('email').toLowerCase(), dni: v('dni') };
      if (!fields.nombre || !fields.apellido || !/\S+@\S+\.\S+/.test(fields.email)) { toast('Revisá los datos: nombre, apellido y email son obligatorios.', 'err'); return; }
      let pass = null;
      if (fields.email !== ctx.user.email || fields.dni !== ctx.user.dni) {
        pass = await new Promise((res) => {
          const s = sheet({ title: 'Confirmá tu contraseña', modal: true, body: '<div class="field"><label for="cp">Contraseña</label><input class="input" id="cp" type="password" autocomplete="current-password"></div>', footer: '<button class="btn primary" data-ok>Confirmar</button>', onClose: () => res(null) });
          s.el.querySelector('[data-ok]').onclick = () => { const val = s.el.querySelector('#cp').value; res(val); s.close(); };
        });
        if (pass == null) return;
      }
      run(b, async () => { await S.net(); S.updateProfile(ctx.user.id, fields, pass); toast('Datos actualizados', 'ok'); });
    },
  },
};

const perfilPagos = {
  back: true, title: 'Medios de pago',
  render(ctx) {
    const u = ctx.user;
    return `<div class="stack">
      ${u.tarjetas.length ? `<div class="card list">${u.tarjetas.map((c) => `<div class="li">${icon('card')}<div class="grow"><div class="small strong">${esc(c.marca)} •••• ${c.last4}</div><div class="xs muted mono">Vence ${esc(c.venc)} · ${esc(c.token.slice(0, 12))}…</div></div><button class="btn ghost icon sm" data-act="del" data-id="${c.id}" aria-label="Eliminar">${icon('trash', 'sm')}</button></div>`).join('')}</div>` : empty('card', 'Sin tarjetas guardadas', 'Agregá una para pagar más rápido.')}
      <button class="btn block" data-act="add">${icon('plus')}Agregar tarjeta</button>
      <div class="banner info">${icon('lock')}<div>Los datos de la tarjeta van directo a la pasarela de pagos. Royal solo guarda un <b>token</b> y los últimos 4 dígitos.</div></div>
      <p class="xs faint">Demo: una tarjeta terminada en 0000 es rechazada por la pasarela.</p>
    </div>`;
  },
  actions: {
    async del(b, e, ctx) { if (await confirmDialog('La tarjeta se elimina y se revoca su token.', { title: 'Eliminar tarjeta', ok: 'Eliminar', danger: true })) run(null, async () => { await S.net(); S.removeCard(ctx.user.id, b.dataset.id); toast('Tarjeta eliminada', 'ok'); }); },
    add(b, e, ctx) {
      const s = sheet({ title: 'Agregar tarjeta', body: `<div class="stack"><div class="field"><label for="cn">Número</label><input class="input mono" id="cn" inputmode="numeric" placeholder="4509 9535 6623 3704" autocomplete="cc-number"></div><div class="row gap-3"><div class="field grow"><label for="cv">Vencimiento</label><input class="input mono" id="cv" placeholder="MM/AA" autocomplete="cc-exp"></div><div class="field grow"><label for="cc">CVV</label><input class="input mono" id="cc" inputmode="numeric" placeholder="123" autocomplete="cc-csc"></div></div><p class="xs faint">Usá una tarjeta de prueba. No ingreses datos reales.</p></div>`, footer: '<button class="btn primary block" data-ok>Guardar tarjeta</button>' });
      const ok = s.el.querySelector('[data-ok]');
      ok.onclick = () => run(ok, async () => {
        const venc = s.el.querySelector('#cv').value.trim();
        if (!/^\d{2}\/\d{2}$/.test(venc)) throw new S.AppError('Vencimiento inválido (MM/AA).');
        if (!/^\d{3,4}$/.test(s.el.querySelector('#cc').value.trim())) throw new S.AppError('CVV inválido.');
        await S.net(500, 900);
        const c = S.addCard(ctx.user.id, s.el.querySelector('#cn').value, venc);
        s.close(); toast(`${c.marca} •••• ${c.last4} guardada`, 'ok');
      });
    },
  },
};

const perfilDirecciones = {
  back: true, title: 'Direcciones',
  render(ctx) {
    return `<div class="stack"><div class="card list">${ctx.user.direcciones.map((d) => `<div class="li">${icon('pin')}<div class="grow"><div class="small strong">${esc(d.alias)}</div><div class="xs muted">${esc(d.calle)} · ${esc(S.barrio(d.barrio).nombre)}</div></div></div>`).join('')}</div>
      <button class="btn block" data-act="add">${icon('plus')}Agregar dirección</button></div>`;
  },
  actions: {
    add(b, e, ctx) {
      const s = sheet({ title: 'Nueva dirección', body: `<div class="stack"><div class="field"><label for="al">Nombre</label><input class="input" id="al" placeholder="Trabajo"></div><div class="field"><label for="ca">Calle y número</label><input class="input" id="ca" placeholder="San Martín 2450"></div><div class="field"><label for="ba">Barrio</label><select class="select" id="ba">${BARRIOS.map((x) => `<option value="${x.id}">${esc(x.nombre)}</option>`).join('')}</select></div></div>`, footer: '<button class="btn primary block" data-ok>Guardar</button>' });
      const ok = s.el.querySelector('[data-ok]');
      ok.onclick = () => run(ok, async () => {
        const alias = s.el.querySelector('#al').value.trim(), calle = s.el.querySelector('#ca').value.trim();
        if (!alias || !calle) throw new S.AppError('Completá nombre y calle.');
        await S.net(); S.addAddress(ctx.user.id, { alias, calle, barrioId: s.el.querySelector('#ba').value }); s.close(); toast('Dirección guardada', 'ok');
      });
    },
  },
};

const perfilNotif = {
  back: true, title: 'Notificaciones', skeleton: false,
  render(ctx) {
    const p = ctx.user.prefs;
    const row = (k, t, d) => `<div class="li"><div class="grow"><div class="small strong">${t}</div><div class="xs muted">${d}</div></div><label class="switch"><input type="checkbox" data-k="${k}" ${p[k] ? 'checked' : ''} aria-label="${t}"><span></span></label></div>`;
    return `<div class="card list">${row('postulaciones', 'Postulaciones', 'Cuando un prestador se postula a tu changa')}${row('estados', 'Estado de la orden', 'Confirmaciones, en camino, finalización')}${row('mensajes', 'Mensajes', 'Chat con el prestador')}${row('promos', 'Novedades', 'Promociones y novedades de Royal')}</div>`;
  },
  mount(el, ctx) { el.addEventListener('change', (e) => { const k = e.target.dataset.k; if (k) S.setPrefs(ctx.user.id, { [k]: e.target.checked }); toast('Preferencia guardada', 'ok'); }); },
};

const favoritos = {
  back: true, title: 'Favoritos',
  render(ctx) {
    const favs = ctx.user.favoritos.map((id) => S.provider(id)).filter(Boolean);
    if (!favs.length) return empty('heart', 'Sin favoritos', 'Tocá el corazón en el perfil de un prestador para guardarlo.', '<button class="btn" data-go="/buscar">Buscar prestadores</button>');
    const loc = origin(ctx);
    return `<div class="card list">${favs.map((p) => providerCard({ p, u: S.user(p.userId), st: S.providerStats(p), km: S.distKm(loc, p) })).join('')}</div>`;
  },
};

/* ───────────── arranque ───────────── */
const fig1 = `<div class="stack" style="gap:8px"><div class="row between small"><span class="strong">Plomería</span><span class="badge accent">3 postulaciones</span></div><div class="small muted">“Se rompió el flexible del lavatorio”</div><div class="row between small"><span>Ramiro B. · ${icon('star', 'sm')} 4.9</span><span class="mono">$ 28.500</span></div></div>`;
const fig2 = `<div class="stack" style="gap:6px"><span class="badge ok">${icon('shield')}DNI verificado</span><span class="badge ok">${icon('check')}Antecedentes</span><span class="badge ok">${icon('badge')}Matrícula de gas · vigente</span></div>`;
const fig3 = `<div class="row wrap gap-1"><span class="badge">${icon('cash')}Efectivo</span><span class="badge">${icon('bank')}Transferencia</span><span class="badge">${icon('wallet')}Mercado Pago</span><span class="badge ok">${icon('shield')}Garantía Royal</span></div>`;

startMobileApp({
  app: 'cliente', theme: 'light', home: '/inicio',
  parents: {
    '/changa/:id': '/mis-changas', '/orden/:id': '/mis-changas', '/pago/:id': '/orden/:id', '/checkout/:id': '/pago/:id',
    '/calificar/:id': '/orden/:id', '/reportar/:id': '/orden/:id', '/prestador/:id': '/buscar', '/contratar/:id': '/prestador/:id',
    '/publicar/1': '/inicio', '/publicar/2': '/publicar/1', '/publicar/3': '/publicar/2', '/publicar/resumen': '/publicar/3',
    '/perfil/datos': '/perfil', '/perfil/pagos': '/perfil', '/perfil/direcciones': '/perfil', '/perfil/notificaciones': '/perfil', '/favoritos': '/perfil',
    '/chat/:id': '/mensajes', '/notificaciones': '/inicio', '/registro': '/login', '/recuperar': '/login', '/recuperar/:token': '/login',
  },
  tagline: 'Oficios y changas en Santa Fe, con prestadores verificados cerca tuyo.',
  quickLogins: [{ label: 'Entrar como Lucía — cliente', email: 'lucia@demo.com' }, { label: 'Entrar como Martín — cliente', email: 'martin.aguirre@demo.com' }],
  onboarding: [
    { title: 'Publicá lo que necesitás', text: 'Contalo en una línea. Los prestadores cerca tuyo te mandan su precio en minutos.', figure: fig1 },
    { title: 'Elegí con datos, no a ciegas', text: 'Identidad, antecedentes y matrícula verificadas. Las reseñas son solo de trabajos reales.', figure: fig2 },
    { title: 'Pagá como te quede cómodo', text: 'Efectivo, transferencia o Mercado Pago. Dentro de Royal tenés garantía.', figure: fig3 },
  ],
  guard(ctx) { if (!ctx.user.roles.includes('cliente')) { S.logout('cliente'); toast('Esta cuenta no es de cliente.', 'err'); return '/login'; } return null; },
  tabs: [
    { path: '/inicio', label: 'Inicio', icon: 'home' },
    { path: '/buscar', label: 'Buscar', icon: 'search' },
    { path: '/mis-changas', label: 'Mis changas', icon: 'clipboard', badge: (ctx) => S.ordersOfClient(ctx.user.id).filter((o) => o.estado === 'finalizada_pend_cliente' || (o.estado === 'finalizada' && !o.calificoCliente)).length },
    { path: '/mensajes', label: 'Mensajes', icon: 'message', badge: (ctx) => S.unreadMessages(ctx.user.id) },
    { path: '/perfil', label: 'Perfil', icon: 'user' },
  ],
  routes: {
    '/inicio': inicio,
    '/buscar': buscar,
    '/publicar/1': pub1, '/publicar/2': pub2, '/publicar/3': pub3, '/publicar/resumen': pubResumen,
    '/changa/:id': changa,
    '/prestador/:id': perfilPrestador,
    '/contratar/:id': contratar,
    '/mis-changas': misChangas,
    '/orden/:id': orden,
    '/pago/:id': pago,
    '/checkout/:id': checkout,
    '/calificar/:id': calificar,
    '/reportar/:id': reportar,
    '/mensajes': mensajes,
    '/perfil': perfil,
    '/perfil/datos': perfilDatos,
    '/perfil/pagos': perfilPagos,
    '/perfil/direcciones': perfilDirecciones,
    '/perfil/notificaciones': perfilNotif,
    '/favoritos': favoritos,
    '/publicar': { render: () => { go('/publicar/1'); return ''; }, skeleton: false },
  },
});
