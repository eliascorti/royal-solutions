// Helpers de render, formato, toasts, sheets, mapa, gráficos y documentos falsos.
import { icon } from './icons.js';
import { BARRIOS, RUBROS } from './data.js';

export { icon };

/* ───────────── formato ───────────── */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (n) => (n == null ? '—' : `$ ${Math.round(n).toLocaleString('es-AR')}`);
export const moneyHtml = (n) => `<span class="money">${money(n)}</span>`;
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
export const fmtDate = (ts) => { const d = new Date(ts); return `${d.getDate()} ${MESES[d.getMonth()]}`; };
export const fmtDateY = (ts) => { const d = new Date(ts); return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`; };
export const fmtTime = (ts) => { const d = new Date(ts); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
export const fmtDateTime = (ts) => `${fmtDate(ts)} ${fmtTime(ts)}`;
export const fmtDay = (iso) => { const d = new Date(iso + 'T12:00:00'); return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`; };
export function fmtRel(ts, now = Date.now()) {
  const s = Math.round((now - ts) / 1000);
  if (s < 45) return 'recién';
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} d`;
  return fmtDate(ts);
}
export const plural = (n, s, p) => `${n} ${n === 1 ? s : p || s + 's'}`;
export const initials = (u) => (u ? (u.nombre[0] + (u.apellido?.[0] || '')).toUpperCase() : '?');
export const delay = (ms) => new Promise((r) => setTimeout(r, ms));
export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ───────────── piezas ───────────── */
export function avatar(u, size = '', verified = false) {
  return `<span class="av ${size}" style="background:${u?.color || '#DCD6CC'}" aria-hidden="true">${esc(initials(u))}${verified ? `<span class="vmark">${icon('check')}</span>` : ''}</span>`;
}
export function stars(n, max = 5) {
  let h = '<span class="stars" aria-label="' + n + ' de 5 estrellas">';
  for (let i = 1; i <= max; i++) h += icon('star', i <= Math.round(n) ? 'fill' : 'empty');
  return h + '</span>';
}
export function rating(avg, count) {
  if (!count) return '<span class="badge outline">Perfil nuevo</span>';
  return `<span class="rating">${icon('star')}<b class="mono">${avg.toFixed(1)}</b><span class="faint">(${count})</span></span>`;
}
export const rubroIcon = (id) => icon(RUBROS.find((r) => r.id === id)?.icono || 'dot');

const TONE = {
  order: { pendiente_confirmacion: 'warn', confirmada: 'info', en_camino: 'accent', en_curso: 'accent', finalizada_pend_cliente: 'warn', finalizada: 'ok', calificada: 'ok', rechazada: 'danger', vencida: '', cancelada: '', en_disputa: 'danger', resuelta: 'ok' },
  request: { abierta: 'info', con_postulaciones: 'accent', asignada: 'ok', cancelada: '', vencida: '' },
  payment: { pendiente: 'warn', pendiente_acreditacion: 'warn', acreditado: 'ok', rechazado: 'danger', en_revision: 'danger' },
  provider: { borrador: '', pendiente_revision: 'warn', en_revision: 'info', observado: 'warn', aprobado: 'ok', rechazado: 'danger', suspendido: 'danger' },
  document: { cargado: 'info', en_revision: 'warn', aprobado: 'ok', rechazado: 'danger', vencido: 'danger' },
  dispute: { abierta: 'danger', en_analisis: 'warn', resuelta: 'ok' },
};
export function statusBadge(kind, estado, labels) {
  return `<span class="badge ${TONE[kind]?.[estado] || ''}">${esc(labels?.[kind]?.[estado] || estado)}</span>`;
}

export function empty(ic, title, text, actionHtml = '') {
  return `<div class="empty">${icon(ic)}<h3>${esc(title)}</h3><p class="small">${esc(text)}</p>${actionHtml}</div>`;
}

export function skeleton(kind = 'list') {
  if (kind === 'detail') return `<div class="stack"><div class="sk sk-block" style="height:120px"></div><div class="sk sk-line" style="width:60%"></div><div class="sk sk-line" style="width:40%"></div><div class="sk sk-block"></div><div class="sk sk-block"></div></div>`;
  return `<div class="stack">${Array.from({ length: 5 }, () => `<div class="row" style="gap:12px"><div class="sk" style="width:40px;height:40px;border-radius:50%"></div><div class="grow"><div class="sk sk-line" style="width:70%"></div><div class="sk sk-line" style="width:45%"></div></div></div>`).join('')}</div>`;
}

/* ───────────── toasts, push, sheets ───────────── */
let toastBox = null;
function host() { return document.querySelector('.device') || document.body; }
export function toast(msg, type = '') {
  if (!toastBox || !toastBox.isConnected) { toastBox = document.createElement('div'); toastBox.className = 'toasts'; toastBox.setAttribute('role', 'status'); host().appendChild(toastBox); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `${type === 'ok' ? icon('check', 'sm') : type === 'err' ? icon('alert', 'sm') : icon('info', 'sm')}<span>${esc(msg)}</span>`;
  toastBox.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 200); }, type === 'err' ? 4200 : 2800);
}

export function pushBanner(n, onClick) {
  const el = document.createElement('div');
  el.className = 'push';
  el.setAttribute('role', 'alert');
  el.innerHTML = `${icon('bell', 'sm')}<div class="grow"><div class="small strong">${esc(n.titulo)}</div><div class="small muted">${esc(n.cuerpo)}</div></div>`;
  el.onclick = () => { onClick?.(); close(); };
  host().appendChild(el);
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 180); };
  setTimeout(close, 4200);
}

export function sheet({ title, body, footer = '', modal = false, onClose }) {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  const el = document.createElement('div');
  el.className = modal ? 'modal' : 'sheet';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `${modal ? '' : '<div class="grab"></div>'}<div class="sheet-h"><h2>${esc(title)}</h2><button class="btn ghost icon sm" data-close aria-label="Cerrar">${icon('x')}</button></div><div class="sheet-b">${body}</div>${footer ? `<div class="sheet-f">${footer}</div>` : ''}`;
  const h = host();
  h.appendChild(ov); h.appendChild(el);
  const close = () => {
    ov.classList.add('out'); el.classList.add('out');
    setTimeout(() => { ov.remove(); el.remove(); }, 160);
    document.removeEventListener('keydown', onKey);
    onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  ov.onclick = close;
  el.querySelector('[data-close]').onclick = close;
  setTimeout(() => el.querySelector('input,textarea,select,button:not([data-close])')?.focus(), 60);
  return { el, close };
}

export function confirmDialog(msg, { title = 'Confirmar', ok = 'Confirmar', danger = false, detail = '' } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const s = sheet({
      title, modal: true,
      body: `<p>${esc(msg)}</p>${detail ? `<p class="small muted" style="margin-top:8px">${esc(detail)}</p>` : ''}`,
      footer: `<button class="btn" data-no>Volver</button><button class="btn ${danger ? 'danger solid' : 'primary'}" data-yes>${esc(ok)}</button>`,
      onClose: () => { if (!done) resolve(false); },
    });
    s.el.querySelector('[data-no]').onclick = () => { done = true; resolve(false); s.close(); };
    s.el.querySelector('[data-yes]').onclick = () => { done = true; resolve(true); s.close(); };
  });
}

/** Ejecuta una acción "de red" con estado de carga en el botón y manejo de errores. */
export async function run(btn, fn) {
  if (btn?.classList.contains('loading')) return;
  btn?.classList.add('loading');
  btn?.setAttribute('aria-busy', 'true');
  try {
    return await fn();
  } catch (e) {
    console.warn(e);
    toast(e.message || 'Algo salió mal. Probá de nuevo.', 'err');
    return undefined;
  } finally {
    if (btn?.isConnected) { btn.classList.remove('loading'); btn.removeAttribute('aria-busy'); }
  }
}

/* ───────────── tema ───────────── */
export function initTheme(app, def) {
  let t = def;
  try { t = localStorage.getItem(`rs_theme_${app}`) || def; } catch { /* sin storage */ }
  document.documentElement.dataset.theme = t;
}
export function toggleTheme(app) {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem(`rs_theme_${app}`, next); } catch { /* */ }
  return next;
}

/* ───────────── archivos ───────────── */
/** Lee una imagen y la reduce (máx. 640 px, JPEG) para que entre en localStorage. */
export function readImage(file, max = 640) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('Sin archivo'));
    if (file.type === 'application/pdf') {
      return resolve({ dataUrl: null, mime: file.type, kb: Math.round(file.size / 1024), name: file.name });
    }
    if (!file.type.startsWith('image/')) return reject(new Error('Formato no admitido. Subí JPG, PNG o PDF.'));
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve({ dataUrl: c.toDataURL('image/jpeg', 0.72), mime: file.type, kb: Math.round(file.size / 1024), name: file.name });
      };
      img.onerror = () => reject(new Error('No pudimos leer la imagen.'));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ───────────── mapa SVG de Córdoba ───────────── */
export const toPx = (x, y) => [150 + x * 30, 210 - y * 30];

/**
 * pins: [{x,y,label,id,verified,selected}] · me: {x,y} · jobs: [{x,y,id}] · mover: {x,y,label} · highlight: barrioId
 */
export function mapSvg({ pins = [], me = null, jobs = [], mover = null, dest = null, highlight = [], height = null, pinAction = 'pin' } = {}) {
  const hl = new Set([].concat(highlight));
  let s = `<div class="map"${height ? ` style="height:${height}px"` : ''}><svg viewBox="20 10 300 390" role="img" aria-label="Mapa de barrios de Córdoba">`;
  s += `<path class="road" d="M20 210 H320"/><path class="road" d="M152 10 V400"/><path class="road" d="M40 330 L300 120"/>`;
  s += `<path class="river" d="M20 158 C 70 170, 110 176, 150 178 S 230 160, 320 200"/>`;
  BARRIOS.forEach((b) => {
    s += `<polygon class="barrio ${hl.has(b.id) ? 'on' : ''}" points="${b.poly}"/>`;
    const [x, y] = toPx(b.x, b.y);
    s += `<text class="blabel" x="${x}" y="${y + (b.id === 'centro' ? 4 : 0)}" text-anchor="middle">${esc(b.nombre)}</text>`;
  });
  jobs.forEach((j) => { const [x, y] = toPx(j.x, j.y); s += `<g class="job" data-act="${pinAction}" data-id="${esc(j.id)}" style="cursor:pointer"><rect x="${x - 6}" y="${y - 6}" width="12" height="12" rx="2" transform="rotate(45 ${x} ${y})"/></g>`; });
  if (me) { const [x, y] = toPx(me.x, me.y); s += `<g class="me"><circle class="halo" cx="${x}" cy="${y}" r="14"/><circle cx="${x}" cy="${y}" r="5"/></g>`; }
  if (dest && mover) { const [x1, y1] = toPx(mover.x, mover.y); const [x2, y2] = toPx(dest.x, dest.y); s += `<line class="route" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; }
  pins.forEach((p) => {
    const [x, y] = toPx(p.x, p.y);
    s += `<g class="pin ${p.verified ? 'v' : ''} ${p.selected ? 'sel' : ''}" data-act="${pinAction}" data-id="${esc(p.id)}" tabindex="0" aria-label="${esc(p.title || p.label)}"><circle class="b" cx="${x}" cy="${y}" r="9"/><text x="${x}" y="${y}">${esc(p.label)}</text></g>`;
  });
  if (mover) { const [x, y] = toPx(mover.x, mover.y); s += `<g class="pin sel mover"><circle class="b" cx="${x}" cy="${y}" r="10"/><text x="${x}" y="${y}">${esc(mover.label)}</text></g>`; }
  return s + '</svg></div>';
}

/* ───────────── documentos falsos (SVG) ───────────── */
export function fakeDocSvg(doc, u, rubroNombre = '') {
  const name = `${u?.apellido?.toUpperCase() || ''} ${u?.nombre?.toUpperCase() || ''}`;
  const face = `<g><rect x="22" y="44" width="70" height="86" fill="#CFC6B8"/><circle cx="57" cy="76" r="17" fill="#A89C8A"/><path d="M28 130c4-22 16-30 29-30s25 8 29 30z" fill="#A89C8A"/></g>`;
  const lines = (x, y, n, w = 150) => Array.from({ length: n }, (_, i) => `<rect x="${x}" y="${y + i * 12}" width="${w - (i % 3) * 30}" height="5" fill="#B9B0A2"/>`).join('');
  const wrap = (inner, bg = '#EDE7DC') => `<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" font-family="IBM Plex Mono, monospace"><rect width="320" height="200" rx="8" fill="${bg}"/>${inner}</svg>`;
  switch (doc.tipo) {
    case 'dni_frente':
      return wrap(`<rect x="0" y="0" width="320" height="30" rx="8" fill="#9DB4C8"/><text x="14" y="20" font-size="10" fill="#1F2A36">REPÚBLICA ARGENTINA · DOCUMENTO NACIONAL DE IDENTIDAD</text>${face}<text x="108" y="56" font-size="8" fill="#6B6255">APELLIDO / NOMBRE</text><text x="108" y="70" font-size="11" fill="#2A2520">${esc(name.slice(0, 26))}</text><text x="108" y="92" font-size="8" fill="#6B6255">DOCUMENTO</text><text x="108" y="106" font-size="13" fill="#2A2520">${esc(u?.dni || '')}</text><text x="108" y="126" font-size="8" fill="#6B6255">NACIONALIDAD · ARGENTINA</text><rect x="108" y="150" width="190" height="26" fill="#DDD5C8"/><text x="112" y="167" font-size="8" fill="#6B6255">IDARG${esc((u?.dni || '').replace(/\D/g, ''))}&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>`);
    case 'dni_dorso':
      return wrap(`<text x="16" y="28" font-size="9" fill="#6B6255">DOMICILIO: ${esc((u?.direcciones?.[0]?.calle || '').toUpperCase())} · CÓRDOBA</text>${lines(16, 44, 4, 200)}<rect x="226" y="40" width="76" height="76" fill="#fff"/><g fill="#2A2520">${Array.from({ length: 36 }, (_, i) => ((i * 7) % 5 < 3 ? `<rect x="${230 + (i % 6) * 12}" y="${44 + Math.floor(i / 6) * 12}" width="10" height="10"/>` : '')).join('')}</g><rect x="16" y="140" width="288" height="44" fill="#DDD5C8"/><text x="22" y="158" font-size="9" fill="#4A4238">IDARG${esc((u?.dni || '').replace(/\D/g, ''))}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text><text x="22" y="174" font-size="9" fill="#4A4238">${esc(name.replace(/ /g, '<').slice(0, 30))}&lt;&lt;&lt;</text>`);
    case 'selfie':
      return wrap(`<rect x="100" y="14" width="120" height="172" rx="6" fill="#CFC6B8"/><circle cx="160" cy="80" r="30" fill="#A89C8A"/><path d="M112 186c6-40 26-56 48-56s42 16 48 56z" fill="#A89C8A"/><rect x="118" y="126" width="84" height="44" fill="#EDE7DC" stroke="#8A8279"/><text x="160" y="146" font-size="7" text-anchor="middle" fill="#4A4238">DNI ${esc(u?.dni || '')}</text><text x="160" y="160" font-size="6" text-anchor="middle" fill="#6B6255">SOSTENIDO JUNTO AL ROSTRO</text>`, '#E4DED3');
    case 'antecedentes':
      return wrap(`<text x="16" y="26" font-size="10" fill="#2A2520">MINISTERIO DE JUSTICIA · REGISTRO NACIONAL DE REINCIDENCIA</text><text x="16" y="48" font-size="9" fill="#6B6255">CERTIFICADO N° ${esc(doc.numero || '')}</text><text x="16" y="70" font-size="9" fill="#2A2520">${esc(name)} · DNI ${esc(u?.dni || '')}</text>${lines(16, 86, 4, 280)}<rect x="16" y="140" width="190" height="22" fill="${doc.estado === 'rechazado' ? '#F1CFCF' : '#D6E8D5'}"/><text x="24" y="155" font-size="9" fill="#2A2520">${doc.estado === 'rechazado' ? 'REGISTRA ANTECEDENTES' : 'NO REGISTRA ANTECEDENTES'}</text><circle cx="270" cy="160" r="24" fill="none" stroke="#8A8279" stroke-dasharray="3 2"/>`, '#F3F0EA');
    case 'matricula':
      return wrap(`<rect x="0" y="0" width="320" height="34" rx="8" fill="#D9C39F"/><text x="14" y="22" font-size="10" fill="#2A2520">MATRÍCULA PROFESIONAL · ${esc(rubroNombre.toUpperCase())}</text>${face}<text x="108" y="58" font-size="8" fill="#6B6255">TITULAR</text><text x="108" y="72" font-size="11" fill="#2A2520">${esc(name.slice(0, 26))}</text><text x="108" y="96" font-size="8" fill="#6B6255">N° MATRÍCULA</text><text x="108" y="110" font-size="12" fill="#2A2520">${esc(doc.numero || '')}</text><text x="108" y="132" font-size="8" fill="#6B6255">VENCE ${doc.vence ? esc(fmtDateY(doc.vence).toUpperCase()) : '—'}</text><text x="108" y="160" font-size="7" fill="#6B6255">${esc((doc.entidad || '').toUpperCase().slice(0, 40))}</text>${doc.estado === 'rechazado' ? '<rect x="0" y="120" width="320" height="80" fill="#EDE7DC" opacity=".85"/>' : ''}`, '#F2EBDD');
    default:
      return wrap(lines(16, 30, 8, 280));
  }
}
export function docImage(doc, u, rubroNombre) {
  if (doc.archivo) return `<img src="${doc.archivo}" alt="Documento cargado">`;
  return fakeDocSvg(doc, u, rubroNombre);
}

/** Miniatura de galería de trabajos: esquema sobrio con el ícono del rubro. */
export function galleryTile(item, i = 0) {
  const r = RUBROS.find((x) => x.id === item.rubroId);
  const tones = ['#D9D2C6', '#CFD6D0', '#D3D6DE', '#DED3CD'];
  return `<div class="g"><svg viewBox="0 0 100 100"><rect width="100" height="100" fill="${tones[i % 4]}"/><path d="M0 70 L30 55 L55 68 L100 45 V100 H0z" fill="rgba(0,0,0,.07)"/><g transform="translate(38 30) scale(1)" stroke="#4A4238" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round">${icon(r?.icono || 'dot').replace(/<svg[^>]*>|<\/svg>/g, '')}</g><text x="6" y="92" font-family="IBM Plex Mono" font-size="8" fill="#4A4238">#${String(item.n).padStart(2, '0')} ${esc(r?.nombre || '')}</text></svg></div>`;
}

/* ───────────── gráficos (SVG propios, un solo acento) ───────────── */
export function lineChart(values, labels, { h = 180, fmt = (v) => v, compare = null } = {}) {
  const W = 560, pad = { l: 44, r: 8, t: 12, b: 24 };
  const all = compare ? [...values, ...compare] : values;
  const max = Math.max(...all, 1) * 1.1;
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(values.length - 1, 1);
  const y = (v) => pad.t + (h - pad.t - pad.b) * (1 - v / max);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img">`;
  for (let i = 0; i <= 3; i++) { const v = (max / 3) * i; s += `<line class="gridl" x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${pad.l - 6}" y="${y(v) + 3}" text-anchor="end">${fmt(v)}</text>`; }
  labels.forEach((l, i) => { if (i % Math.ceil(labels.length / 8) === 0 || i === labels.length - 1) s += `<text class="axis" x="${x(i)}" y="${h - 6}" text-anchor="middle">${esc(l)}</text>`; });
  const path = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
  s += `<path class="area" d="${path} L${x(values.length - 1)},${y(0)} L${x(0)},${y(0)}z"/><path class="line" d="${path}"/>`;
  if (compare) s += `<path class="line2" d="${compare.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')}"/>`;
  s += `<circle cx="${x(values.length - 1)}" cy="${y(values.at(-1))}" r="3.5" fill="var(--accent)"/>`;
  return s + '</svg>';
}
export function barChart(items, { h = 180, fmt = (v) => v } = {}) {
  const W = 560, pad = { l: 8, r: 8, t: 16, b: 26 };
  const max = Math.max(...items.map((i) => i.v), 1);
  const bw = (W - pad.l - pad.r) / items.length;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img">`;
  items.forEach((it, i) => {
    const bh = (h - pad.t - pad.b) * (it.v / max);
    const x = pad.l + i * bw + bw * 0.18;
    s += `<rect class="barr ${it.muted ? 'muted' : ''}" x="${x}" y="${h - pad.b - bh}" width="${bw * 0.64}" height="${bh}"/><text class="val" x="${x + bw * 0.32}" y="${h - pad.b - bh - 4}" text-anchor="middle">${fmt(it.v)}</text><text class="axis" x="${x + bw * 0.32}" y="${h - 8}" text-anchor="middle">${esc(it.l)}</text>`;
  });
  return s + '</svg>';
}

/* ───────────── router por hash ───────────── */
export function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  return { path, query: Object.fromEntries(new URLSearchParams(query)) };
}
export function matchRoute(routes, path) {
  for (const [pattern, view] of Object.entries(routes)) {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    const m = path.match(re);
    if (m) return { view, params: Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])), pattern };
  }
  return null;
}
export const go = (path) => { location.hash = '#' + path; };
