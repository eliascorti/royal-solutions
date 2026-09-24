// "Backend falso" de Royal Solutions.
// Toda lectura/escritura del estado pasa por acá. Persistencia en localStorage (clave rs_db),
// máquinas de estado validadas, timeline, notificaciones y audit log por cada acción.

import { SCHEMA_VERSION, RUBROS, BARRIOS, CALLES, docsRequeridos, DOC_TIPOS, MEDIOS } from './data.js';
import { buildSeed } from './seed.js';
import { broadcast, isPresent, isLeader } from './sync.js';

const DB_KEY = 'rs_db';
const VER_KEY = 'rs_schema_version';
let db = null;
const subs = new Set();

export class AppError extends Error {}

/* ───────────── persistencia ───────────── */

export function load() {
  const ver = Number(localStorage.getItem(VER_KEY));
  const raw = localStorage.getItem(DB_KEY);
  if (ver !== SCHEMA_VERSION || !raw) return reseed();
  try { db = JSON.parse(raw); } catch { reseed(); }
}

export function reseed() {
  db = buildSeed(Date.now());
  localStorage.setItem(VER_KEY, String(SCHEMA_VERSION));
  persist();
}

function persist() {
  db.rev = (db.rev || 0) + 1;
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    throw new AppError('No hay más espacio en el navegador. Probá con fotos más livianas o reseteá la demo.');
  }
  broadcast();
  subs.forEach((fn) => fn('local'));
}

/** Relee el estado si otra pestaña lo cambió. Devuelve true si hubo cambios. */
export function syncFromStorage() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return false;
  try {
    const next = JSON.parse(raw);
    if ((next.rev || 0) !== (db?.rev || 0)) { db = next; return true; }
  } catch { /* ignorar */ }
  return false;
}

export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
export function getDb() { return db; }

/** Aplica una mutación sobre la versión más reciente del estado y la persiste. */
function mutate(fn) {
  syncFromStorage();
  const result = fn(db);
  persist();
  return result;
}

/* ───────────── utilidades ───────────── */

export const now = () => Date.now() + (db?.clockOffset || 0);
export const net = (min = 300, max = 700) => new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
const rnd = (a, b) => a + Math.random() * (b - a);
const round500 = (n) => Math.round(n / 500) * 500;

function nextId(prefix) {
  db.seq[prefix] = (db.seq[prefix] || 1000) + 1;
  return `${prefix}-${db.seq[prefix]}`;
}

export const rubro = (id) => RUBROS.find((r) => r.id === id);
export const barrio = (id) => BARRIOS.find((b) => b.id === id);
export const user = (id) => db.users.find((u) => u.id === id);
export const provider = (id) => db.providers.find((p) => p.id === id);
export const providerByUser = (uid) => db.providers.find((p) => p.userId === uid);
export const order = (id) => db.orders.find((o) => o.id === id);
export const request = (id) => db.requests.find((r) => r.id === id);
export const application = (id) => db.applications.find((a) => a.id === id);
export const paymentOf = (orderId) => db.payments.find((p) => p.orderId === orderId);
export const dispute = (id) => db.disputes.find((d) => d.id === id);
export const fullName = (u) => (u ? `${u.nombre} ${u.apellido}` : '—');
export const shortName = (u) => (u ? `${u.nombre} ${u.apellido[0]}.` : '—');

export function distKm(a, b) {
  if (!a || !b) return null;
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y) * 1.3 * 10) / 10;
}
export const etaMin = (km) => Math.max(2, Math.round(km * 3 + 2));

function actorLabel(actor) {
  if (!actor) return 'Sistema';
  if (actor.rol === 'sistema') return actor.nombre || 'Sistema';
  if (actor.rol === 'admin') return `Admin · ${user(actor.id)?.nombre || 'Operaciones'}`;
  return shortName(user(actor.id));
}
const SYS = { rol: 'sistema', nombre: 'Sistema' };

function notify(userId, app, titulo, cuerpo, link = '', tipo = 'info') {
  db.notifications.unshift({ id: nextId('NTF'), userId, app, titulo, cuerpo, link, tipo, leida: false, t: now() });
  if (db.notifications.length > 400) db.notifications.length = 400;
}
function notifyAdmin(titulo, cuerpo, link = '') { notify(null, 'admin', titulo, cuerpo, link); }

function audit(actor, accion, entidad, entidadId, detalle = '') {
  db.audit.unshift({ id: nextId('LOG'), t: now(), actor: actorLabel(actor), rol: actor?.rol || 'sistema', accion, entidad, entidadId, detalle });
  if (db.audit.length > 800) db.audit.length = 800;
}

function schedule(delayMs, type, payload) {
  db.scheduled.push({ id: nextId('JOB'), at: now() + delayMs, type, payload });
}

/* ───────────── máquinas de estado ───────────── */

export const SM = {
  request: {
    abierta: { postular: 'con_postulaciones', asignar: 'asignada', cancelar: 'cancelada', vencer: 'vencida' },
    con_postulaciones: { postular: 'con_postulaciones', asignar: 'asignada', cancelar: 'cancelada', vencer: 'vencida' },
    asignada: { reabrir: 'con_postulaciones', cancelar: 'cancelada' },
  },
  order: {
    pendiente_confirmacion: { aceptar: 'confirmada', rechazar: 'rechazada', vencer: 'vencida', cancelar: 'cancelada' },
    confirmada: { salir: 'en_camino', cancelar: 'cancelada' },
    en_camino: { codigo_ok: 'en_curso', cancelar: 'cancelada' },
    en_curso: { finalizar: 'finalizada_pend_cliente', disputa: 'en_disputa' },
    finalizada_pend_cliente: { confirmar: 'finalizada', disputa: 'en_disputa' },
    finalizada: { calificar: 'calificada', disputa: 'en_disputa' },
    en_disputa: { resolver: 'resuelta' },
  },
  payment: {
    pendiente: { efectivo_ok: 'acreditado', comprobante: 'pendiente_acreditacion', aprobado: 'acreditado', rechazado: 'rechazado' },
    pendiente_acreditacion: { acreditar: 'acreditado', no_coincide: 'en_revision' },
    en_revision: { acreditar: 'acreditado', rechazar: 'rechazado' },
    rechazado: { reintentar: 'pendiente' },
  },
  provider: {
    borrador: { enviar: 'pendiente_revision' },
    pendiente_revision: { tomar: 'en_revision', aprobar: 'aprobado', observar: 'observado', rechazar: 'rechazado' },
    en_revision: { aprobar: 'aprobado', observar: 'observado', rechazar: 'rechazado' },
    observado: { reenviar: 'pendiente_revision' },
    aprobado: { suspender: 'suspendido' },
    suspendido: { reactivar: 'aprobado' },
  },
  document: {
    cargado: { revisar: 'en_revision', aprobar: 'aprobado', rechazar: 'rechazado' },
    en_revision: { aprobar: 'aprobado', rechazar: 'rechazado' },
    aprobado: { vencer: 'vencido' },
  },
};

export const ESTADOS = {
  request: { abierta: 'Abierta', con_postulaciones: 'Con postulaciones', asignada: 'Asignada', cancelada: 'Cancelada', vencida: 'Vencida' },
  order: {
    pendiente_confirmacion: 'Esperando confirmación', confirmada: 'Confirmada', en_camino: 'En camino', en_curso: 'En curso',
    finalizada_pend_cliente: 'Falta confirmar pago', finalizada: 'Finalizada', calificada: 'Calificada',
    rechazada: 'Rechazada', vencida: 'Vencida', cancelada: 'Cancelada', en_disputa: 'En revisión', resuelta: 'Resuelta',
  },
  payment: { pendiente: 'Pendiente', pendiente_acreditacion: 'Pendiente de acreditación', acreditado: 'Acreditado', rechazado: 'Rechazado', en_revision: 'En revisión' },
  provider: { borrador: 'Borrador', pendiente_revision: 'Pendiente de revisión', en_revision: 'En revisión', observado: 'Observado', aprobado: 'Aprobado', rechazado: 'Rechazado', suspendido: 'Suspendido' },
  document: { cargado: 'Cargado', en_revision: 'En revisión', aprobado: 'Vigente', rechazado: 'Rechazado', vencido: 'Vencido' },
  dispute: { abierta: 'Abierta', en_analisis: 'En análisis', resuelta: 'Resuelta' },
};

/** Valida y aplica una transición. Lanza AppError si no está permitida. */
function transition(kind, entity, evento) {
  const to = SM[kind][entity.estado]?.[evento];
  if (!to) {
    const from = ESTADOS[kind]?.[entity.estado] || entity.estado;
    throw new AppError(`Acción no permitida: "${evento}" sobre ${kind} en estado ${from}.`);
  }
  entity.estado = to;
  return to;
}

function orderStep(o, evento, actor, texto) {
  transition('order', o, evento);
  o.timeline.push({ estado: o.estado, t: now(), actor: actorLabel(actor), texto });
  o.autoAt = now() + 6500;
  o.actualizado = now();
}

/* ───────────── sesión y cuentas ───────────── */

export const getSession = (app) => localStorage.getItem(`rs_session_${app}`);
export const setSession = (app, uid) => localStorage.setItem(`rs_session_${app}`, uid);
export const logout = (app) => localStorage.removeItem(`rs_session_${app}`);

export function login(email, pass, app) {
  return mutate(() => {
    const u = db.users.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase());
    // Mensaje genérico: no revelar si el email existe (CU-02 2.a)
    const generic = new AppError('Email o contraseña incorrectos.');
    if (!u) throw generic;
    if (u.bloqueoHasta && u.bloqueoHasta > now()) {
      const min = Math.ceil((u.bloqueoHasta - now()) / 60000);
      throw new AppError(`Demasiados intentos. Probá de nuevo en ${min} min o recuperá tu contraseña.`);
    }
    if (u.pass !== pass) {
      u.intentos = (u.intentos || 0) + 1;
      if (u.intentos >= 5) { u.bloqueoHasta = now() + 15 * 60000; u.intentos = 0; audit({ id: u.id, rol: 'cliente' }, 'auth.bloqueo_temporal', 'usuario', u.id); }
      throw generic;
    }
    if (u.estado !== 'activo') throw new AppError(u.estado === 'bloqueado' ? 'Esta cuenta está bloqueada. Escribinos a soporte@royalsolutions.com.ar.' : 'Tu cuenta está suspendida. Contactá a soporte.');
    if (app === 'admin' && !u.roles.includes('admin')) throw new AppError('Esta cuenta no tiene acceso al panel.');
    u.intentos = 0;
    audit({ id: u.id, rol: app === 'admin' ? 'admin' : app }, 'auth.login', 'usuario', u.id, app);
    setSession(app, u.id);
    return u;
  });
}

export function register(data) {
  return mutate(() => {
    const email = data.email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === email)) throw new AppError('Ya existe una cuenta con ese email.');
    if (data.dni && db.users.some((u) => u.dni === data.dni)) throw new AppError('Ya existe una cuenta con ese DNI.');
    if (data.dni && db.dniBloqueados.includes(data.dni)) throw new AppError('No podemos crear una cuenta con ese DNI.');
    const b = barrio(data.barrio || 'nueva-cordoba');
    const calle = `${CALLES[b.id][0]} ${Math.floor(rnd(100, 2400))}`;
    const loc = { x: b.x + rnd(-0.3, 0.3), y: b.y + rnd(-0.3, 0.3) };
    const u = {
      id: nextId('USR'), email, pass: data.pass, nombre: data.nombre.trim(), apellido: data.apellido.trim(),
      telefono: data.telefono, dni: data.dni || '', roles: ['cliente'], estado: 'activo', color: pickColor(),
      direcciones: [{ id: 'd1', alias: 'Casa', calle, barrio: b.id, ...loc }], tarjetas: [], favoritos: [],
      prefs: { postulaciones: true, estados: true, mensajes: true, promos: false }, creadoEn: now(), aceptoTerminosEn: now(),
      intentos: 0, cancelacionesTardias: 0,
    };
    db.users.push(u);
    audit({ id: u.id, rol: 'cliente' }, 'usuario.registro', 'usuario', u.id);
    return u;
  });
}

const COLORS = ['#E9D8C4', '#D6E2D3', '#D9DDE8', '#EBD5D0', '#E4E0C8', '#D3E0E2', '#E2D6E6', '#DCD6CC'];
function pickColor() { return COLORS[Math.floor(Math.random() * COLORS.length)]; }

/** Recupero de contraseña (CU-03): el "email" cae en una bandeja simulada. */
export function requestPasswordReset(email) {
  return mutate(() => {
    const u = db.users.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase());
    if (u) {
      const token = Math.random().toString(36).slice(2, 10);
      db.resets.push({ token, userId: u.id, venceEn: now() + 30 * 60000, usado: false });
      db.emails.unshift({ id: nextId('EML'), to: u.email, asunto: 'Restablecé tu contraseña', cuerpo: 'Usá este enlace dentro de los próximos 30 minutos.', token, t: now() });
      audit({ id: u.id, rol: 'cliente' }, 'auth.reset_solicitado', 'usuario', u.id);
    }
    return true; // siempre la misma respuesta
  });
}

export function resetPassword(token, pass) {
  return mutate(() => {
    const r = db.resets.find((x) => x.token === token);
    if (!r || r.usado || r.venceEn < now()) throw new AppError('El enlace venció o ya fue usado. Pedí uno nuevo.');
    const u = user(r.userId);
    u.pass = pass; u.intentos = 0; u.bloqueoHasta = null; r.usado = true;
    audit({ id: u.id, rol: 'cliente' }, 'auth.reset_ok', 'usuario', u.id);
    return u;
  });
}

export function updateProfile(uid, fields, passConfirm) {
  return mutate(() => {
    const u = user(uid);
    const sensitive = (fields.email && fields.email !== u.email) || (fields.dni && fields.dni !== u.dni);
    if (sensitive && passConfirm !== u.pass) throw new AppError('Para cambiar email o DNI, confirmá tu contraseña.');
    if (fields.email && fields.email !== u.email && db.users.some((x) => x.email === fields.email)) throw new AppError('Ese email ya está en uso.');
    Object.assign(u, fields);
    audit({ id: uid, rol: 'cliente' }, 'usuario.perfil_editado', 'usuario', uid, Object.keys(fields).join(', '));
    return u;
  });
}

/** Datos de identidad cargados en el alta de prestador (deben coincidir con el DNI). */
export function setIdentity(uid, data) {
  return mutate(() => {
    if (data.dni && db.users.some((x) => x.dni === data.dni && x.id !== uid)) throw new AppError('Ese DNI ya está registrado en otra cuenta.');
    if (data.dni && db.dniBloqueados.includes(data.dni)) throw new AppError('No podemos dar de alta ese DNI. Contactá a soporte.');
    Object.assign(user(uid), data);
    audit({ id: uid, rol: 'prestador' }, 'prestador.identidad', 'usuario', uid);
  });
}

export function setPrefs(uid, prefs) { return mutate(() => { Object.assign(user(uid).prefs, prefs); }); }

export function addCard(uid, number, venc) {
  return mutate(() => {
    const digits = String(number).replace(/\D/g, '');
    if (digits.length < 15 || digits.length > 16) throw new AppError('El número de tarjeta no es válido.');
    // Pasarela simulada: una tarjeta terminada en 0000 se rechaza (CU-19 4.a)
    if (digits.endsWith('0000')) throw new AppError('La pasarela rechazó la tarjeta: fondos insuficientes o datos inválidos.');
    const marca = digits[0] === '4' ? 'Visa' : digits[0] === '5' ? 'Mastercard' : digits[0] === '3' ? 'Amex' : 'Débito';
    const u = user(uid);
    const card = { id: nextId('TRJ'), marca, last4: digits.slice(-4), venc, token: 'tok_' + Math.random().toString(36).slice(2, 14) };
    u.tarjetas.push(card);
    audit({ id: uid, rol: 'cliente' }, 'pago.tarjeta_tokenizada', 'usuario', uid, `${marca} •••• ${card.last4}`);
    return card;
  });
}
export function removeCard(uid, cardId) {
  return mutate(() => { const u = user(uid); u.tarjetas = u.tarjetas.filter((c) => c.id !== cardId); audit({ id: uid, rol: 'cliente' }, 'pago.token_revocado', 'usuario', uid); });
}
export function addAddress(uid, { alias, calle, barrioId }) {
  return mutate(() => {
    const b = barrio(barrioId);
    const u = user(uid);
    u.direcciones.push({ id: 'd' + (u.direcciones.length + 1) + Date.now() % 1000, alias, calle, barrio: b.id, x: b.x + rnd(-0.3, 0.3), y: b.y + rnd(-0.3, 0.3) });
  });
}
export function toggleFavorite(uid, pid) {
  return mutate(() => {
    const u = user(uid);
    u.favoritos = u.favoritos.includes(pid) ? u.favoritos.filter((x) => x !== pid) : [...u.favoritos, pid];
    return u.favoritos.includes(pid);
  });
}

/* ───────────── reputación y verificación ───────────── */

export function ratingOf(userId, dir = 'c2p') {
  const revs = db.reviews.filter((r) => r.destId === userId && r.dir === dir && r.estado !== 'baja');
  const dist = [0, 0, 0, 0, 0];
  let sum = 0;
  revs.forEach((r) => { dist[r.estrellas - 1]++; sum += r.estrellas; });
  return { avg: revs.length ? sum / revs.length : 0, count: revs.length, dist, reviews: revs.sort((a, b) => b.t - a.t) };
}

export function docsOf(pid) { return db.documents.filter((d) => d.providerId === pid); }

export function maxRiesgo(p) {
  const order = { bajo: 0, medio: 1, alto: 2 };
  return p.rubros.map((r) => rubro(r).riesgo).sort((a, b) => order[b] - order[a])[0] || 'bajo';
}

/** Documentos que exige el conjunto de rubros del prestador. */
export function requiredDocs(p) {
  const req = new Set(docsRequeridos(maxRiesgo(p)).filter((t) => t !== 'matricula'));
  const list = [...req].map((tipo) => ({ tipo, rubroId: null }));
  p.rubros.filter((r) => rubro(r).riesgo === 'alto').forEach((r) => list.push({ tipo: 'matricula', rubroId: r }));
  return list;
}

export function docFor(pid, tipo, rubroId = null) {
  return docsOf(pid).filter((d) => d.tipo === tipo && (d.rubroId || null) === (rubroId || null)).sort((a, b) => b.creadoEn - a.creadoEn)[0];
}

export function missingDocs(p) {
  return requiredDocs(p).filter(({ tipo, rubroId }) => {
    const d = docFor(p.id, tipo, rubroId);
    return !d || d.estado === 'rechazado' || d.estado === 'vencido';
  });
}

/** Nivel de verificación según documentos aprobados y vigentes. */
export function verification(p) {
  const ok = (tipo, r = null) => docFor(p.id, tipo, r)?.estado === 'aprobado';
  const identidad = ok('dni_frente') && ok('dni_dorso') && ok('selfie');
  const antecedentes = ok('antecedentes');
  const matriculas = p.rubros.filter((r) => rubro(r).riesgo === 'alto').map((r) => {
    const d = docFor(p.id, 'matricula', r);
    const porVencer = d?.estado === 'aprobado' && d.vence && d.vence - now() < 30 * 86400000;
    return { rubroId: r, doc: d, vigente: d?.estado === 'aprobado', porVencer };
  });
  let nivel = 'ninguno';
  if (identidad) nivel = 'basico';
  if (identidad && antecedentes) nivel = 'medio';
  if (identidad && antecedentes && matriculas.some((m) => m.vigente)) nivel = 'alto';
  return { nivel, identidad, antecedentes, matriculas };
}
export const NIVEL_LABEL = { ninguno: 'Sin verificar', basico: 'Identidad verificada', medio: 'Verificación media', alto: 'Verificación alta' };

/** ¿Puede trabajar este rubro? Los de riesgo alto requieren matrícula vigente. */
export function canWorkRubro(p, rubroId) {
  if (!p.rubros.includes(rubroId)) return false;
  const r = rubro(rubroId);
  if (r.riesgo === 'alto') return docFor(p.id, 'matricula', rubroId)?.estado === 'aprobado';
  return true;
}

export function debtOf(pid) {
  return db.ledger.filter((m) => m.providerId === pid).reduce((acc, m) => {
    if (m.tipo === 'deuda_efectivo') return acc + m.monto;
    if (m.tipo === 'pago_deuda') return acc - m.monto;
    return acc;
  }, 0);
}

export function canApply(p) {
  if (!p) return { ok: false, reason: 'Completá tu alta como prestador para postularte.' };
  const u = user(p.userId);
  if (u.estado !== 'activo') return { ok: false, reason: 'Tu cuenta está suspendida.' };
  if (p.estado === 'suspendido') return { ok: false, reason: 'Tu perfil está suspendido. Escribinos a soporte.' };
  if (p.estado !== 'aprobado') return { ok: false, reason: 'Tu perfil todavía no está aprobado. Podés ver trabajos, pero para postularte necesitamos validar tu identidad y documentación.' };
  const deuda = debtOf(p.id);
  if (deuda >= db.config.limiteDeuda) return { ok: false, reason: `Tenés $ ${deuda.toLocaleString('es-AR')} de comisiones por efectivo sin saldar. Regularizá para volver a postularte.`, debt: true };
  return { ok: true };
}

export function providerStats(p) {
  const rating = ratingOf(p.userId);
  const trabajos = db.orders.filter((o) => o.providerId === p.id && ['finalizada', 'calificada', 'resuelta'].includes(o.estado)).length;
  const deuda = debtOf(p.id);
  return { rating, trabajos, deuda, bloqueado: deuda >= db.config.limiteDeuda, verif: verification(p), nuevo: trabajos === 0 && rating.count === 0 };
}

/* ───────────── búsqueda ───────────── */

export function locOfUser(u) { return u?.direcciones?.[0] || barrio('centro'); }

export function searchProviders({ q = '', rubroId = null, minRating = 0, verificado = false, disponible = false, maxKm = null, tag = null, from = null, sort = 'distancia' } = {}) {
  const text = q.trim().toLowerCase();
  let list = db.providers.filter((p) => p.estado === 'aprobado' && user(p.userId)?.estado === 'activo').map((p) => {
    const st = providerStats(p);
    return { p, u: user(p.userId), st, km: distKm(from, p) };
  });
  if (rubroId) list = list.filter((x) => canWorkRubro(x.p, rubroId));
  if (text) list = list.filter((x) => fullName(x.u).toLowerCase().includes(text) || x.p.rubros.some((r) => rubro(r).nombre.toLowerCase().includes(text)) || x.p.tags.some((t) => t.toLowerCase().includes(text)) || (x.p.descripcion || '').toLowerCase().includes(text));
  if (minRating) list = list.filter((x) => x.st.rating.avg >= minRating);
  if (verificado) list = list.filter((x) => ['medio', 'alto'].includes(x.st.verif.nivel));
  if (disponible) list = list.filter((x) => x.p.disponible);
  if (maxKm) list = list.filter((x) => x.km != null && x.km <= maxKm);
  if (tag) list = list.filter((x) => x.p.tags.includes(tag));
  const sorters = {
    distancia: (a, b) => (a.km ?? 99) - (b.km ?? 99),
    rating: (a, b) => b.st.rating.avg - a.st.rating.avg || b.st.rating.count - a.st.rating.count,
    trabajos: (a, b) => b.st.trabajos - a.st.trabajos,
    respuesta: (a, b) => a.p.respuestaMin - b.p.respuestaMin,
  };
  return list.sort(sorters[sort] || sorters.distancia);
}

/* ───────────── solicitudes (changas) ───────────── */

export function requestsOfClient(uid) { return db.requests.filter((r) => r.clienteId === uid).sort((a, b) => b.creadoEn - a.creadoEn); }
export function applicationsOf(reqId) { return db.applications.filter((a) => a.requestId === reqId && a.estado !== 'retirada').sort((a, b) => a.creadoEn - b.creadoEn); }

export function createRequest(clientId, data) {
  return mutate(() => {
    const u = user(clientId);
    if (u.estado !== 'activo') throw new AppError('Tu cuenta está suspendida: no podés publicar changas.');
    const abiertas = db.requests.filter((r) => r.clienteId === clientId && ['abierta', 'con_postulaciones'].includes(r.estado)).length;
    if (abiertas >= db.config.maxSolicitudesAbiertas) throw new AppError(`Tenés ${abiertas} changas abiertas. Cerrá o cancelá alguna para publicar otra.`);
    const req = {
      id: nextId('SOL'), clienteId, rubroId: data.rubroId, descripcion: data.descripcion.trim(), fotos: data.fotos || [],
      direccion: data.direccion, cuando: data.cuando, urgente: !!data.urgente, presupuestoRef: data.presupuestoRef || null,
      medioPrevisto: data.medio, estado: 'abierta', creadoEn: now(), venceEn: now() + 48 * 3600000,
      historial: [{ estado: 'abierta', t: now(), texto: 'Changa publicada' }],
    };
    db.requests.push(req);
    // Avisar a prestadores del rubro cerca (CU-16)
    const cercanos = db.providers.filter((p) => p.estado === 'aprobado' && canWorkRubro(p, req.rubroId) && distKm(p, req.direccion) <= 6);
    cercanos.forEach((p) => notify(p.userId, 'prestador', `Nueva changa de ${rubro(req.rubroId).nombre}${req.urgente ? ' · Urgente' : ''}`, `${req.descripcion} — ${barrio(req.direccion.barrio).nombre}, a ${distKm(p, req.direccion)} km`, `/trabajo/${req.id}`, 'job'));
    audit({ id: clientId, rol: 'cliente' }, 'solicitud.publicada', 'solicitud', req.id, rubro(req.rubroId).nombre);
    if (!data.sinAutoPostulaciones) scheduleAutoApplications(req);
    return { req, sinPrestadores: cercanos.length === 0 };
  });
}

const PLANTILLAS = [
  'Hola {n}, puedo pasar hoy. Llevo los materiales básicos y te confirmo el precio final al ver el trabajo.',
  'Buenas {n}. Tengo experiencia con este tipo de arreglo, lo resuelvo en el día. El precio incluye mano de obra.',
  '¡Hola! Estoy cerca de tu zona. Si te sirve paso en la franja que elegiste. Trabajo con garantía de 30 días.',
  'Hola {n}, lo puedo ver hoy mismo. Si hace falta algún repuesto te aviso antes de comprarlo.',
];

function scheduleAutoApplications(req) {
  const cand = db.providers
    .filter((p) => p.estado === 'aprobado' && p.disponible && canWorkRubro(p, req.rubroId) && debtOf(p.id) < db.config.limiteDeuda && !isPresent('prestador', p.userId))
    .sort((a, b) => distKm(a, req.direccion) - distKm(b, req.direccion))
    .slice(0, 3);
  const delays = [4500, 10000, 17000];
  cand.forEach((p, i) => schedule(delays[i] + rnd(0, 1500), 'auto_apply', { reqId: req.id, pid: p.id }));
}

function suggestedPrice(req) {
  const r = rubro(req.rubroId);
  const base = req.presupuestoRef || (r.precio[0] + r.precio[1]) / 2 * 0.8;
  return round500(base * rnd(0.88, 1.18) * (req.urgente ? 1.15 : 1));
}

function doApply(p, req, { precio, mensaje, fecha, franja }, auto = false) {
  if (!['abierta', 'con_postulaciones'].includes(req.estado)) throw new AppError('Esta changa ya no recibe postulaciones.');
  const existing = db.applications.find((a) => a.requestId === req.id && a.providerId === p.id && a.estado === 'activa');
  const cliente = user(req.clienteId);
  if (existing) {
    Object.assign(existing, { precio, mensaje, fecha, franja, editadoEn: now() });
    notify(req.clienteId, 'cliente', `${shortName(user(p.userId))} actualizó su postulación`, `Nuevo precio: $ ${precio.toLocaleString('es-AR')}`, `/changa/${req.id}`, 'app');
    audit({ id: p.userId, rol: 'prestador' }, 'postulacion.editada', 'solicitud', req.id);
    return existing;
  }
  const a = {
    id: nextId('APL'), requestId: req.id, providerId: p.id, precio, mensaje: mensaje.replace('{n}', cliente.nombre),
    fecha, franja, estado: 'activa', distanciaKm: distKm(p, req.direccion), creadoEn: now(),
    respuestaMin: Math.max(1, Math.round((now() - req.creadoEn) / 60000)), auto,
  };
  db.applications.push(a);
  transition('request', req, 'postular');
  if (req.historial.length === 1) req.historial.push({ estado: 'con_postulaciones', t: now(), texto: 'Llegó la primera postulación' });
  notify(req.clienteId, 'cliente', `Nueva postulación · ${shortName(user(p.userId))}`, `$ ${precio.toLocaleString('es-AR')} · a ${a.distanciaKm} km · ${rubro(req.rubroId).nombre}`, `/changa/${req.id}`, 'app');
  audit({ id: p.userId, rol: 'prestador' }, 'postulacion.creada', 'solicitud', req.id, `$ ${precio}`);
  return a;
}

export function applyToJob(pid, reqId, data) {
  return mutate(() => {
    const p = provider(pid);
    const chk = canApply(p);
    if (!chk.ok) throw new AppError(chk.reason);
    if (!canWorkRubro(p, request(reqId).rubroId)) throw new AppError('No tenés habilitado este rubro. Revisá tu matrícula.');
    if (!(data.precio > 0)) throw new AppError('Ingresá un precio.');
    return doApply(p, request(reqId), data);
  });
}

export function withdrawApplication(appId) {
  return mutate(() => { const a = application(appId); a.estado = 'retirada'; audit({ id: provider(a.providerId).userId, rol: 'prestador' }, 'postulacion.retirada', 'solicitud', a.requestId); });
}

export function cancelRequest(reqId, clientId, motivo) {
  return mutate(() => {
    const r = request(reqId);
    transition('request', r, 'cancelar');
    r.historial.push({ estado: 'cancelada', t: now(), texto: `Cancelada: ${motivo}` });
    applicationsOf(reqId).forEach((a) => notify(provider(a.providerId).userId, 'prestador', 'Una changa fue cancelada', `${rubro(r.rubroId).nombre} en ${barrio(r.direccion.barrio).nombre}`, '/trabajos'));
    audit({ id: clientId, rol: 'cliente' }, 'solicitud.cancelada', 'solicitud', reqId, motivo);
  });
}

export function openJobsFor(p) {
  return db.requests
    .filter((r) => ['abierta', 'con_postulaciones'].includes(r.estado) && p.rubros.includes(r.rubroId) && r.clienteId !== p.userId)
    .map((r) => ({ r, km: distKm(p, r.direccion), mine: db.applications.find((a) => a.requestId === r.id && a.providerId === p.id && a.estado === 'activa') }))
    .sort((a, b) => (b.r.urgente - a.r.urgente) || a.km - b.km);
}

/* ───────────── órdenes ───────────── */

function slotTaken(pid, fecha, franja, exceptId) {
  return db.orders.some((o) => o.providerId === pid && o.id !== exceptId && o.fecha === fecha && o.franja === franja && ['confirmada', 'en_camino', 'en_curso'].includes(o.estado));
}

function createOrder({ origen, req, app, clienteId, providerId, rubroId, descripcion, direccion, fecha, franja, asap, precio, medio }) {
  const p = provider(providerId);
  if (p.estado !== 'aprobado' || user(p.userId).estado !== 'activo') throw new AppError('Este prestador no está disponible en este momento (cuenta suspendida o en revisión).');
  if (!asap && slotTaken(providerId, fecha, franja)) throw new AppError('Esa franja ya no está disponible. Elegí otra.');
  const o = {
    id: nextId('ORD'), origen, requestId: req?.id || null, applicationId: app?.id || null, clienteId, providerId, rubroId, descripcion,
    direccion, fecha, franja, asap: !!asap, precioAcordado: precio, montoFinal: null, comisionPct: db.config.comisiones[rubroId],
    medio, estado: 'pendiente_confirmacion', codigo: String(Math.floor(1000 + Math.random() * 9000)), intentosCodigo: 0,
    confirmarAntesDe: now() + db.config.plazoConfirmacionMin * 60000, tracking: null, cancelacion: null, garantia: false,
    timeline: [{ estado: 'pendiente_confirmacion', t: now(), actor: shortName(user(clienteId)), texto: 'Orden creada' }],
    calificoCliente: false, calificoPrestador: false, disputaId: null, live: true, autoAt: now() + 6000, creadoEn: now(), actualizado: now(),
  };
  db.orders.push(o);
  notify(p.userId, 'prestador', `Te eligieron · ${o.id}`, `${rubro(rubroId).nombre} en ${barrio(direccion.barrio).nombre}. Confirmá dentro de ${db.config.plazoConfirmacionMin} min.`, `/orden/${o.id}`, 'order');
  audit({ id: clienteId, rol: 'cliente' }, 'orden.creada', 'orden', o.id, `${origen} · $ ${precio}`);
  return o;
}

export function hireApplication(clientId, appId, medio) {
  return mutate(() => {
    const a = application(appId);
    const req = request(a.requestId);
    if (!['abierta', 'con_postulaciones'].includes(req.estado)) throw new AppError('Esta changa ya tiene un prestador asignado.');
    const o = createOrder({
      origen: 'postulacion', req, app: a, clienteId, providerId: a.providerId, rubroId: req.rubroId, descripcion: req.descripcion,
      direccion: req.direccion, fecha: a.fecha, franja: a.franja, asap: req.cuando.tipo === 'asap', precio: a.precio, medio: medio || req.medioPrevisto,
    });
    transition('request', req, 'asignar');
    req.ordenId = o.id;
    req.historial.push({ estado: 'asignada', t: now(), texto: `Elegiste a ${shortName(user(provider(a.providerId).userId))}` });
    a.estado = 'aceptada';
    return o;
  });
}

export function hireDirect(clientId, providerId, data) {
  return mutate(() => createOrder({ origen: 'directa', clienteId, providerId, ...data }));
}

export function ordersOfClient(uid) { return db.orders.filter((o) => o.clienteId === uid).sort((a, b) => b.creadoEn - a.creadoEn); }
export function ordersOfProvider(pid) { return db.orders.filter((o) => o.providerId === pid).sort((a, b) => b.creadoEn - a.creadoEn); }
export const ACTIVE = ['pendiente_confirmacion', 'confirmada', 'en_camino', 'en_curso', 'finalizada_pend_cliente', 'en_disputa'];

export function acceptOrder(orderId, actor) {
  return mutate(() => {
    const o = order(orderId);
    if (!o.asap && slotTaken(o.providerId, o.fecha, o.franja, o.id)) throw new AppError('Ya tenés otra orden confirmada en esa franja.');
    orderStep(o, 'aceptar', actor, 'El prestador confirmó la orden');
    notify(o.clienteId, 'cliente', `${shortName(user(provider(o.providerId).userId))} confirmó tu orden`, `${o.id} · ${o.asap ? 'Sale en unos minutos' : 'Queda agendada'}`, `/orden/${o.id}`, 'order');
    audit(actor, 'orden.confirmada', 'orden', o.id);
  });
}

export function rejectOrder(orderId, actor, motivo) {
  return mutate(() => {
    const o = order(orderId);
    orderStep(o, 'rechazar', actor, `Rechazada: ${motivo}`);
    reopenRequest(o, 'rechazada');
    notify(o.clienteId, 'cliente', 'El prestador no puede tomar la orden', `${motivo}. Tu changa volvió a recibir postulaciones.`, o.requestId ? `/changa/${o.requestId}` : `/orden/${o.id}`, 'warn');
    audit(actor, 'orden.rechazada', 'orden', o.id, motivo);
  });
}

function reopenRequest(o, appEstado) {
  if (!o.requestId) return;
  const r = request(o.requestId);
  if (r.estado === 'asignada') {
    transition('request', r, 'reabrir');
    r.historial.push({ estado: 'con_postulaciones', t: now(), texto: 'Volvió a recibir postulaciones' });
  }
  const a = application(o.applicationId);
  if (a) a.estado = appEstado;
}

/** Cancelación tardía: prestador ya en camino o faltan menos de 2 h para la franja. */
export function isLateCancel(o) {
  if (o.estado === 'en_camino') return true;
  if (o.asap) return o.estado === 'confirmada';
  const start = franjaStart(o.fecha, o.franja);
  return start - now() < 2 * 3600000;
}
export function franjaStart(fecha, franja) {
  const h = { manana: 8, tarde: 13, noche: 18 }[franja] ?? 9;
  const d = new Date(fecha + 'T00:00:00');
  d.setHours(h);
  return d.getTime();
}

export function cancelOrder(orderId, actor, motivo) {
  return mutate(() => {
    const o = order(orderId);
    const tardia = isLateCancel(o);
    orderStep(o, 'cancelar', actor, `Cancelada${tardia ? ' (tardía)' : ''}: ${motivo}`);
    o.cancelacion = { actor: actor.rol, motivo, tardia, t: now() };
    const p = provider(o.providerId);
    if (actor.rol === 'prestador') {
      if (tardia) p.cancelacionesTardias++;
      reopenRequest(o, 'cancelada');
      notify(o.clienteId, 'cliente', `${o.id} fue cancelada por el prestador`, `${motivo}. Tu changa vuelve a recibir postulaciones.`, `/orden/${o.id}`, 'warn');
    } else {
      if (tardia) user(o.clienteId).cancelacionesTardias++;
      if (o.requestId) { const r = request(o.requestId); if (SM.request[r.estado]?.cancelar) { transition('request', r, 'cancelar'); r.historial.push({ estado: 'cancelada', t: now(), texto: 'Cancelaste la orden' }); } }
      notify(p.userId, 'prestador', `${o.id} fue cancelada por el cliente`, motivo, `/orden/${o.id}`, 'warn');
    }
    audit(actor, tardia ? 'orden.cancelada_tardia' : 'orden.cancelada', 'orden', o.id, motivo);
    return tardia;
  });
}

export function startTrip(orderId, actor) {
  return mutate(() => {
    const o = order(orderId);
    orderStep(o, 'salir', actor, 'Salió hacia el domicilio');
    const p = provider(o.providerId);
    const km = distKm(p, o.direccion);
    o.tracking = { x: p.x, y: p.y, fromX: p.x, fromY: p.y, km0: km, eta: etaMin(km), arrived: false };
    notify(o.clienteId, 'cliente', `${shortName(user(p.userId))} está en camino`, `Llega en ${etaMin(km)} min. Tené a mano tu código de inicio.`, `/orden/${o.id}`, 'order');
    audit(actor, 'orden.en_camino', 'orden', o.id);
  });
}

export function enterCode(orderId, code, actor) {
  return mutate(() => {
    const o = order(orderId);
    if (o.estado !== 'en_camino') throw new AppError('La orden no está en camino.');
    if (o.intentosCodigo >= 3) throw new AppError('Superaste los intentos. Soporte ya fue notificado y te va a contactar.');
    if (String(code) !== o.codigo) {
      o.intentosCodigo++;
      if (o.intentosCodigo >= 3) { notifyAdmin('Código de inicio fallido 3 veces', `${o.id} — posible intento de fraude`, `/ordenes/${o.id}`); audit(actor, 'orden.codigo_bloqueado', 'orden', o.id); }
      return { ok: false, restantes: 3 - o.intentosCodigo };
    }
    orderStep(o, 'codigo_ok', actor, 'Código verificado · trabajo iniciado');
    if (o.tracking) { o.tracking.arrived = true; o.tracking.x = o.direccion.x; o.tracking.y = o.direccion.y; o.tracking.eta = 0; }
    notify(o.clienteId, 'cliente', 'Trabajo iniciado', `El código coincidió. ${o.id} está en curso.`, `/orden/${o.id}`, 'order');
    audit(actor, 'orden.iniciada', 'orden', o.id);
    return { ok: true };
  });
}

export function finishOrder(orderId, monto, actor) {
  return mutate(() => {
    const o = order(orderId);
    if (!(monto > 0)) throw new AppError('Ingresá el monto final.');
    orderStep(o, 'finalizar', actor, `Trabajo finalizado · monto informado $ ${monto.toLocaleString('es-AR')}`);
    o.montoFinal = monto;
    const pay = paymentOf(o.id) || { id: nextId('PAG'), orderId: o.id, historial: [] };
    Object.assign(pay, { medio: o.medio, monto, comision: Math.round(monto * o.comisionPct / 100), estado: 'pendiente' });
    pay.historial.push({ estado: 'pendiente', t: now() });
    if (!db.payments.includes(pay)) db.payments.push(pay);
    const txt = o.medio === 'efectivo' ? `Confirmá que le pagaste $ ${monto.toLocaleString('es-AR')} en efectivo.` : `Pagá $ ${monto.toLocaleString('es-AR')} por ${MEDIOS[o.medio].label}.`;
    notify(o.clienteId, 'cliente', 'Trabajo terminado', txt, `/pago/${o.id}`, 'pay');
    audit(actor, 'orden.finalizada_prestador', 'orden', o.id, `$ ${monto}`);
  });
}

/* ───────────── pagos ───────────── */

function payStep(pay, evento, texto) {
  transition('payment', pay, evento);
  pay.historial.push({ estado: pay.estado, t: now(), texto });
}

/** Impacto contable al acreditar: efectivo → deuda de comisión; digital → comisión deducida. */
function onCredited(o, pay, actor) {
  const p = provider(o.providerId);
  o.garantia = pay.medio !== 'efectivo';
  db.ledger.push({ id: nextId('MOV'), providerId: p.id, orderId: o.id, tipo: 'ingreso', monto: pay.monto, t: now(), detalle: `${o.id} · ${MEDIOS[pay.medio].label}` });
  if (pay.medio === 'efectivo') {
    db.ledger.push({ id: nextId('MOV'), providerId: p.id, orderId: o.id, tipo: 'deuda_efectivo', monto: pay.comision, t: now(), detalle: `Comisión ${o.comisionPct}% a saldar · ${o.id}` });
    const deuda = debtOf(p.id);
    if (deuda >= db.config.limiteDeuda) notify(p.userId, 'prestador', 'Llegaste al límite de deuda', `Debés $ ${deuda.toLocaleString('es-AR')} en comisiones. Regularizá para seguir postulándote.`, '/billetera', 'warn');
  } else {
    db.ledger.push({ id: nextId('MOV'), providerId: p.id, orderId: o.id, tipo: 'comision_deducida', monto: -pay.comision, t: now(), detalle: `Comisión ${o.comisionPct}% deducida · ${o.id}` });
  }
  if (o.estado === 'finalizada_pend_cliente') orderStep(o, 'confirmar', actor, `Pago acreditado · ${MEDIOS[pay.medio].label}`);
  notify(p.userId, 'prestador', `Pago acreditado · ${o.id}`, `$ ${pay.monto.toLocaleString('es-AR')} (${MEDIOS[pay.medio].label}). Calificá a ${shortName(user(o.clienteId))}.`, `/orden/${o.id}`, 'pay');
  notify(o.clienteId, 'cliente', '¿Cómo te fue?', `Calificá a ${shortName(user(p.userId))}: tu reseña ayuda a otros vecinos.`, `/calificar/${o.id}`, 'review');
  audit(actor, 'pago.acreditado', 'pago', pay.id, `${MEDIOS[pay.medio].label} · $ ${pay.monto}`);
}

export function setPaymentMedio(orderId, medio) {
  return mutate(() => {
    const o = order(orderId);
    const pay = paymentOf(orderId);
    if (!pay || !['pendiente', 'rechazado'].includes(pay.estado)) throw new AppError('El pago ya está en proceso.');
    if (pay.estado === 'rechazado') payStep(pay, 'reintentar', 'Reintento');
    o.medio = medio; pay.medio = medio;
  });
}

export function confirmCash(orderId, actor) {
  return mutate(() => {
    const o = order(orderId);
    const pay = paymentOf(orderId);
    payStep(pay, 'efectivo_ok', 'El cliente confirmó el pago en efectivo');
    onCredited(o, pay, actor);
  });
}

export function uploadTransferProof(orderId, archivo, actor) {
  return mutate(() => {
    const pay = paymentOf(orderId);
    payStep(pay, 'comprobante', 'Comprobante adjuntado');
    pay.comprobante = archivo;
    notify(provider(order(orderId).providerId).userId, 'prestador', 'Transferencia en camino', `${orderId}: el cliente adjuntó el comprobante. Se acredita al conciliar.`, `/orden/${orderId}`, 'pay');
    notifyAdmin('Transferencia a conciliar', `${orderId} · $ ${pay.monto.toLocaleString('es-AR')}`, `/ordenes/${orderId}`);
    audit(actor, 'pago.comprobante', 'pago', pay.id);
    schedule(9000, 'conciliar', { paymentId: pay.id }); // conciliación bancaria simulada
  });
}

export function acreditarTransfer(paymentId, actor, montoRecibido = null) {
  return mutate(() => doAcreditar(db.payments.find((p) => p.id === paymentId), actor, montoRecibido));
}
function doAcreditar(pay, actor, montoRecibido) {
  const o = order(pay.orderId);
  if (montoRecibido != null && montoRecibido !== pay.monto && pay.estado === 'pendiente_acreditacion') {
    payStep(pay, 'no_coincide', `Monto recibido $ ${montoRecibido} no coincide`);
    notifyAdmin('Transferencia en revisión', `${o.id}: se recibieron $ ${montoRecibido} de $ ${pay.monto}`, `/ordenes/${o.id}`);
    audit(actor, 'pago.en_revision', 'pago', pay.id);
    return;
  }
  payStep(pay, 'acreditar', 'Transferencia acreditada');
  onCredited(o, pay, actor);
}

export function payDigital(orderId, aprobado, actor) {
  return mutate(() => {
    const o = order(orderId);
    const pay = paymentOf(orderId);
    if (pay.estado === 'rechazado') payStep(pay, 'reintentar', 'Reintento');
    if (!aprobado) {
      payStep(pay, 'rechazado', 'Pago rechazado por la pasarela');
      audit(actor, 'pago.rechazado', 'pago', pay.id, MEDIOS[pay.medio].label);
      return false;
    }
    payStep(pay, 'aprobado', `Pago aprobado · ${MEDIOS[pay.medio].label}`);
    pay.ref = 'op_' + Math.floor(rnd(10000000, 99999999));
    onCredited(o, pay, actor);
    return true;
  });
}

/** El cliente no reconoce el monto informado (CU-17 3.a): pasa a revisión con disputa. */
export function rejectAmount(orderId, actor, detalle) {
  return mutate(() => doOpenDispute(order(orderId), actor, { motivo: 'El monto no coincide con lo acordado', descripcion: detalle || 'El monto informado no coincide con lo acordado.' }));
}

export function payDebt(pid, monto, actor, medio = 'mercadopago') {
  return mutate(() => {
    const deuda = debtOf(pid);
    const m = Math.min(monto || deuda, deuda);
    if (m <= 0) throw new AppError('No hay deuda para saldar.');
    db.ledger.push({ id: nextId('MOV'), providerId: pid, tipo: 'pago_deuda', monto: m, t: now(), detalle: `Pago de comisiones · ${MEDIOS[medio]?.label || medio}` });
    notify(provider(pid).userId, 'prestador', 'Deuda regularizada', `Registramos tu pago de $ ${m.toLocaleString('es-AR')}.`, '/billetera', 'ok');
    audit(actor, 'comision.pago_registrado', 'prestador', pid, `$ ${m}`);
    return m;
  });
}

/* ───────────── reseñas ───────────── */

export function submitReview(orderId, authorId, { estrellas, tags = [], comentario = '' }) {
  return mutate(() => {
    const o = order(orderId);
    const p = provider(o.providerId);
    if (!['finalizada', 'calificada', 'resuelta'].includes(o.estado)) throw new AppError('Solo se puede calificar una orden finalizada.');
    const esCliente = authorId === o.clienteId;
    const esPrest = authorId === p.userId;
    if (!esCliente && !esPrest) throw new AppError('Solo quien participó de la orden puede calificar.');
    if ((esCliente && o.calificoCliente) || (esPrest && o.calificoPrestador)) throw new AppError('Ya calificaste esta orden.');
    if (!(estrellas >= 1 && estrellas <= 5)) throw new AppError('Elegí de 1 a 5 estrellas.');
    const rev = {
      id: nextId('REV'), orderId, autorId: authorId, destId: esCliente ? p.userId : o.clienteId, dir: esCliente ? 'c2p' : 'p2c',
      estrellas, tags, comentario: comentario.trim(), rubroId: o.rubroId, t: now(), estado: 'publicada',
    };
    db.reviews.push(rev);
    if (esCliente) o.calificoCliente = true; else o.calificoPrestador = true;
    if (o.calificoCliente && o.calificoPrestador && o.estado === 'finalizada') orderStep(o, 'calificar', SYS, 'Ambas partes calificaron');
    notify(rev.destId, esCliente ? 'prestador' : 'cliente', `Recibiste una calificación de ${estrellas} ★`, comentario ? `“${comentario.slice(0, 80)}”` : `${o.id}`, esCliente ? '/reputacion' : '/perfil', 'review');
    audit({ id: authorId, rol: esCliente ? 'cliente' : 'prestador' }, 'resena.creada', 'orden', o.id, `${estrellas}★`);
    return rev;
  });
}

export function reportReview(reviewId, byId, motivo) {
  return mutate(() => {
    const r = db.reviews.find((x) => x.id === reviewId);
    r.estado = 'reportada'; r.reporte = { por: byId, motivo, t: now() };
    notifyAdmin('Reseña reportada', motivo, '/resenas');
    audit({ id: byId, rol: 'prestador' }, 'resena.reportada', 'resena', reviewId, motivo);
  });
}

export function moderateReview(reviewId, decision, nota, actor) {
  return mutate(() => {
    const r = db.reviews.find((x) => x.id === reviewId);
    r.estado = decision === 'baja' ? 'baja' : 'publicada';
    r.moderacion = { decision, nota, t: now() };
    notify(r.destId, r.dir === 'c2p' ? 'prestador' : 'cliente', decision === 'baja' ? 'Dimos de baja una reseña reportada' : 'La reseña reportada se mantiene', nota || 'Revisamos el caso.', '/reputacion');
    audit(actor, decision === 'baja' ? 'resena.baja' : 'resena.aprobada', 'resena', reviewId, nota);
  });
}

/* ───────────── disputas ───────────── */

function doOpenDispute(o, actor, { motivo, descripcion, foto }) {
  orderStep(o, 'disputa', actor, `Reporte abierto: ${motivo}`);
  const d = { id: nextId('DSP'), orderId: o.id, abiertaPor: actor.id, motivo, descripcion, estado: 'abierta', creadaEn: now(), evidencias: [{ autor: actor.id, texto: descripcion, foto: foto || null, t: now() }], resolucion: null };
  db.disputes.push(d);
  o.disputaId = d.id;
  const otra = actor.id === o.clienteId ? { id: provider(o.providerId).userId, app: 'prestador' } : { id: o.clienteId, app: 'cliente' };
  notify(otra.id, otra.app, `Se abrió un reporte sobre ${o.id}`, `${motivo}. Podés sumar tu versión desde la orden.`, `/orden/${o.id}`, 'warn');
  notifyAdmin('Nueva disputa', `${d.id} · ${o.id} · ${motivo}`, `/disputas/${d.id}`);
  audit(actor, 'disputa.abierta', 'disputa', d.id, motivo);
  return d;
}
export function openDispute(orderId, actor, data) { return mutate(() => doOpenDispute(order(orderId), actor, data)); }

export function addEvidence(disputeId, userId, texto, foto) {
  return mutate(() => { dispute(disputeId).evidencias.push({ autor: userId, texto, foto: foto || null, t: now() }); });
}

export function disputeAnalysis(disputeId, actor) {
  return mutate(() => { const d = dispute(disputeId); if (d.estado !== 'abierta') throw new AppError('La disputa ya está en análisis.'); d.estado = 'en_analisis'; audit(actor, 'disputa.en_analisis', 'disputa', d.id); });
}

export function resolveDispute(disputeId, { favor, montoAjustado, penalizar, nota }, actor) {
  return mutate(() => {
    const d = dispute(disputeId);
    if (d.estado === 'resuelta') throw new AppError('La disputa ya fue resuelta.');
    const o = order(d.orderId);
    d.estado = 'resuelta';
    d.resolucion = { favor, montoAjustado, penalizar, nota, t: now() };
    orderStep(o, 'resolver', actor, `Resuelta a favor de ${favor}${montoAjustado != null ? ` · monto $ ${montoAjustado.toLocaleString('es-AR')}` : ''}`);
    const pay = paymentOf(o.id);
    if (montoAjustado != null) {
      o.montoFinal = montoAjustado;
      if (pay && pay.estado !== 'acreditado') {
        pay.monto = montoAjustado; pay.comision = Math.round(montoAjustado * o.comisionPct / 100);
        pay.estado = 'acreditado'; pay.historial.push({ estado: 'acreditado', t: now(), texto: 'Acreditado por resolución de disputa' });
        onCredited(o, pay, actor);
      } else if (pay) {
        db.ledger.push({ id: nextId('MOV'), providerId: o.providerId, orderId: o.id, tipo: 'ajuste_disputa', monto: montoAjustado - pay.monto, t: now(), detalle: `Ajuste por ${d.id}` });
      }
    }
    if (penalizar) provider(o.providerId).penalizacion = (provider(o.providerId).penalizacion || 0) + 1;
    const txt = `Resolución: a favor de ${favor}. ${nota || ''}`;
    notify(o.clienteId, 'cliente', `Resolvimos el reporte de ${o.id}`, txt, `/orden/${o.id}`, 'ok');
    notify(provider(o.providerId).userId, 'prestador', `Resolvimos el reporte de ${o.id}`, txt, `/orden/${o.id}`, 'ok');
    audit(actor, 'disputa.resuelta', 'disputa', d.id, `${favor}${penalizar ? ' · penalización' : ''}`);
  });
}

/** Botón de ayuda / emergencia durante una orden: avisa a soporte con prioridad. */
export function requestHelp(orderId, userId, motivo) {
  return mutate(() => {
    const o = order(orderId);
    o.timeline.push({ estado: o.estado, t: now(), actor: shortName(user(userId)), texto: `Pidió ayuda a soporte: ${motivo}` });
    notifyAdmin('Pedido de ayuda durante una orden', `${orderId} · ${motivo}`, `/ordenes/${orderId}`);
    audit({ id: userId, rol: userId === o.clienteId ? 'cliente' : 'prestador' }, 'soporte.ayuda', 'orden', orderId, motivo);
  });
}

/* ───────────── chat ───────────── */

const LEAK = [
  /[\w.+-]+@[\w-]+\.[\w.]+/g,
  /\b(pas(a|á)me|mand(a|á)me|dame|te paso|agendame|escribime (al|por))\s+(tu|mi|el)?\s*(wsp|whatsapp|wpp|what?s?app|cel(ular)?|n[uú]mero|tel(e|é)fono|mail|instagram|ig)\b/gi,
  /\b(wsp|whatsapp|wpp|wasap|guasap|telegram)\b/gi,
];
/** Enmascara datos de contacto para evitar que la operación salga de la plataforma. */
export function maskContact(text) {
  let out = text;
  let masked = false;
  out = out.replace(/\+?\d[\d\s().-]{6,}\d/g, (m) => {
    if (m.replace(/\D/g, '').length >= 8 && !/\d{1,3}\.\d{3}(?!\d)/.test(m.trim())) { masked = true; return '[dato oculto]'; }
    return m;
  });
  LEAK.forEach((re) => { out = out.replace(re, () => { masked = true; return '[dato oculto]'; }); });
  return { text: out, masked };
}

export function messagesOf(orderId) { return db.messages.filter((m) => m.orderId === orderId).sort((a, b) => a.t - b.t); }

export function sendMessage(orderId, fromId, raw) {
  return mutate(() => {
    const text = raw.trim();
    if (!text) throw new AppError('Escribí un mensaje.');
    const o = order(orderId);
    const { text: safe, masked } = maskContact(text);
    db.messages.push({ id: nextId('MSG'), orderId, from: fromId, text: safe, masked, leido: false, t: now() });
    const p = provider(o.providerId);
    const toCliente = fromId !== o.clienteId;
    const toId = toCliente ? o.clienteId : p.userId;
    const toApp = toCliente ? 'cliente' : 'prestador';
    notify(toId, toApp, `Mensaje de ${shortName(user(fromId))}`, safe.slice(0, 90), `/chat/${orderId}`, 'msg');
    if (masked) audit({ id: fromId, rol: toCliente ? 'prestador' : 'cliente' }, 'chat.dato_enmascarado', 'orden', orderId);
    // Si la contraparte no tiene la app abierta, respondemos con un mensaje automático creíble.
    if (!isPresent(toApp, toId)) {
      db.typing[orderId] = { userId: toId, until: now() + 3200 };
      schedule(3400, 'chat_reply', { orderId, fromId: toId, texto: text, rolReply: toCliente ? 'cliente' : 'prestador' });
    }
    return { masked };
  });
}

export function markThreadRead(orderId, userId) {
  const pend = db.messages.some((m) => m.orderId === orderId && m.from !== userId && !m.leido);
  const notif = db.notifications.some((n) => n.userId === userId && !n.leida && n.link === `/chat/${orderId}`);
  if (!pend && !notif) return;
  mutate(() => {
    db.messages.forEach((m) => { if (m.orderId === orderId && m.from !== userId) m.leido = true; });
    db.notifications.forEach((n) => { if (n.userId === userId && n.link === `/chat/${orderId}`) n.leida = true; });
  });
}

function autoReply(texto, rol) {
  const t = texto.toLowerCase();
  if (rol === 'prestador') {
    if (/cu[aá]nto|precio|sale|cobr/.test(t)) return 'El precio es el que quedó en la orden. Si al ver el trabajo hace falta un repuesto extra, te aviso antes.';
    if (/lleg|tard|d[oó]nde|demor/.test(t)) return 'Estoy saliendo, te voy avisando. Lo ves en el mapa de la app.';
    if (/foto|imagen/.test(t)) return 'Sí, con la foto que subiste me doy una idea. Llevo lo necesario.';
    if (/gracias/.test(t)) return '¡De nada! Cualquier cosa escribime por acá.';
    if (/wsp|whats|cel|n[uú]mero|tel/.test(t)) return 'Mejor sigamos por acá así queda todo registrado y tenemos la garantía de Royal.';
    return 'Perfecto, quedo atento. Cualquier cosa me escribís por acá.';
  }
  if (/lleg|estoy|abajo|puerta/.test(t)) return 'Dale, ya bajo a abrirte.';
  if (/timbre|piso|depto|departamento/.test(t)) return 'Es el 4° B, el timbre a veces no anda, avisame por acá.';
  if (/gracias/.test(t)) return '¡Gracias a vos!';
  return 'Buenísimo, te espero.';
}

/* ───────────── notificaciones ───────────── */

export function notificationsOf(userId, app) {
  return db.notifications.filter((n) => n.app === app && (app === 'admin' ? true : n.userId === userId));
}
export function unreadCount(userId, app) { return notificationsOf(userId, app).filter((n) => !n.leida).length; }
export function markNotificationsRead(userId, app) {
  if (!unreadCount(userId, app)) return;
  mutate(() => notificationsOf(userId, app).forEach((n) => { n.leida = true; }));
}
export function unreadMessages(userId) {
  return db.messages.filter((m) => m.from !== userId && !m.leido && (() => {
    const o = order(m.orderId);
    return o && (o.clienteId === userId || provider(o.providerId)?.userId === userId);
  })()).length;
}

/* ───────────── alta de prestador ───────────── */

export function saveProviderDraft(userId, data) {
  return mutate(() => {
    const u = user(userId);
    let p = providerByUser(userId);
    if (!p) {
      const b = barrio(data.barrios?.[0] || u.direcciones[0]?.barrio || 'centro');
      p = {
        id: nextId('PRV'), userId, estado: 'borrador', rubros: [], tags: [], descripcion: '', barrios: [], disponibilidad: {},
        disponible: false, x: b.x + rnd(-0.4, 0.4), y: b.y + rnd(-0.4, 0.4), barrio: b.id, respuestaMin: 0, cancelacionesTardias: 0,
        penalizacion: 0, galeria: [], observacion: null, historial: [{ estado: 'borrador', t: now(), actor: shortName(u) }], checklist: {}, creadoEn: now(),
      };
      db.providers.push(p);
      if (!u.roles.includes('prestador')) u.roles.push('prestador');
      audit({ id: userId, rol: 'prestador' }, 'prestador.alta_iniciada', 'prestador', p.id);
    }
    if (!['borrador', 'observado'].includes(p.estado) && data.rubros) {
      // Si ya está aprobado, agregar rubros no rompe su estado (los de riesgo alto exigen matrícula).
    }
    Object.assign(p, data);
    if (data.barrios?.[0]) { const b = barrio(data.barrios[0]); p.barrio = b.id; }
    return p;
  });
}

export function uploadDoc(pid, { tipo, rubroId = null, archivo = null, numero = '', entidad = '', vence = null, mime = 'image/svg+xml', kb = 40, simulado = false }) {
  return mutate(() => {
    const okMime = /^image\/|application\/pdf/.test(mime);
    if (!okMime) throw new AppError('Formato no admitido. Subí JPG, PNG o PDF.');
    if (kb > 5120) throw new AppError('El archivo supera los 5 MB.');
    if (tipo === 'matricula' && !numero) throw new AppError('Ingresá el número de matrícula.');
    const p = provider(pid);
    const doc = { id: nextId('DOC'), providerId: pid, tipo, rubroId, estado: 'cargado', archivo, simulado, numero, entidad, vence, mime, kb, motivo: null, creadoEn: now() };
    // Si el prestador ya está aprobado (recarga por vencimiento), el doc va directo a revisión.
    if (['aprobado', 'suspendido'].includes(p.estado)) {
      doc.estado = 'en_revision';
      notifyAdmin('Documento para revisar', `${DOC_TIPOS[tipo]} · ${fullName(user(p.userId))}`, `/verificaciones/${pid}`);
    }
    db.documents.push(doc);
    audit({ id: p.userId, rol: 'prestador' }, 'documento.cargado', 'documento', doc.id, DOC_TIPOS[tipo]);
    return doc;
  });
}

export function submitProvider(pid) {
  return mutate(() => {
    const p = provider(pid);
    if (!p.rubros.length) throw new AppError('Elegí al menos un rubro.');
    if (!p.barrios.length) throw new AppError('Elegí al menos un barrio de cobertura.');
    const falta = missingDocs(p);
    if (falta.length) throw new AppError(`Faltan documentos: ${falta.map((f) => DOC_TIPOS[f.tipo]).join(', ')}.`);
    const ev = p.estado === 'observado' ? 'reenviar' : 'enviar';
    transition('provider', p, ev);
    p.historial.push({ estado: p.estado, t: now(), actor: shortName(user(p.userId)), texto: ev === 'reenviar' ? 'Correcciones enviadas' : 'Alta enviada a revisión' });
    p.observacion = null;
    docsOf(pid).forEach((d) => { if (d.estado === 'cargado') d.estado = 'en_revision'; });
    const riesgo = maxRiesgo(p);
    if (riesgo === 'bajo') {
      schedule(5000, 'auto_validar', { pid }); // validación automática de DNI + selfie (simulada)
    } else {
      notifyAdmin('Nueva verificación pendiente', `${fullName(user(p.userId))} · ${p.rubros.map((r) => rubro(r).nombre).join(', ')} · ${riesgo}`, `/verificaciones/${pid}`);
    }
    audit({ id: p.userId, rol: 'prestador' }, ev === 'reenviar' ? 'prestador.reenviado' : 'prestador.enviado', 'prestador', pid, riesgo);
    return riesgo;
  });
}

export function setAvailable(pid, on) {
  return mutate(() => { const p = provider(pid); p.disponible = on; audit({ id: p.userId, rol: 'prestador' }, on ? 'prestador.disponible' : 'prestador.no_disponible', 'prestador', pid); });
}

export function sendValidationVideo(pid) {
  return mutate(() => {
    const p = provider(pid);
    p.video = { estado: 'enviado', t: now() };
    notifyAdmin('Video de validación recibido', fullName(user(p.userId)), `/verificaciones/${pid}`);
    audit({ id: p.userId, rol: 'prestador' }, 'prestador.video_enviado', 'prestador', pid);
  });
}

/* ───────────── acciones de admin ───────────── */

export function adminProvider(pid, action, { motivo = '', comentario = '', docId = null } = {}, actor) {
  return mutate(() => {
    const p = provider(pid);
    const u = user(p.userId);
    const push = (texto) => p.historial.push({ estado: p.estado, t: now(), actor: actorLabel(actor), texto });
    switch (action) {
      case 'tomar':
        transition('provider', p, 'tomar'); push('Revisión iniciada'); break;
      case 'aprobar':
        if (p.estado === 'pendiente_revision') transition('provider', p, 'tomar');
        transition('provider', p, 'aprobar');
        docsOf(pid).forEach((d) => { if (['cargado', 'en_revision'].includes(d.estado)) d.estado = 'aprobado'; });
        p.disponible = true; push('Aprobado');
        notify(u.id, 'prestador', 'Tu perfil fue aprobado', 'Ya podés postularte a changas de tus rubros.', '/trabajos', 'ok');
        break;
      case 'observar': {
        if (p.estado === 'pendiente_revision') transition('provider', p, 'tomar');
        transition('provider', p, 'observar');
        p.observacion = { motivo, comentario, docId, t: now() };
        if (docId) { const d = db.documents.find((x) => x.id === docId); d.estado = 'rechazado'; d.motivo = motivo; }
        push(`Observado: ${motivo}`);
        notify(u.id, 'prestador', 'Tenés que corregir tu alta', `${motivo}${comentario ? ` — ${comentario}` : ''}`, '/alta', 'warn');
        break;
      }
      case 'rechazar':
        if (p.estado === 'pendiente_revision') transition('provider', p, 'tomar');
        transition('provider', p, 'rechazar'); p.observacion = { motivo, comentario, t: now() }; push(`Rechazado: ${motivo}`);
        notify(u.id, 'prestador', 'No pudimos aprobar tu alta', motivo, '/perfil', 'warn');
        break;
      case 'suspender':
        transition('provider', p, 'suspender'); p.disponible = false; push(`Suspendido: ${motivo}`);
        notify(u.id, 'prestador', 'Tu perfil fue suspendido', motivo, '/perfil', 'warn');
        break;
      case 'reactivar':
        transition('provider', p, 'reactivar'); push('Reactivado');
        notify(u.id, 'prestador', 'Tu perfil fue reactivado', 'Ya podés volver a postularte.', '/trabajos', 'ok');
        break;
      case 'video':
        p.video = { estado: 'solicitado', t: now() }; push('Se solicitó video de validación');
        notify(u.id, 'prestador', 'Necesitamos un video de validación', 'Grabá un video de 5 segundos mirando a cámara desde tu perfil.', '/perfil', 'warn');
        break;
      default: throw new AppError('Acción desconocida');
    }
    audit(actor, `prestador.${action}`, 'prestador', pid, motivo);
  });
}

export function adminDoc(docId, decision, motivo, actor) {
  return mutate(() => {
    const d = db.documents.find((x) => x.id === docId);
    if (d.estado === 'cargado') transition('document', d, 'revisar');
    transition('document', d, decision === 'aprobar' ? 'aprobar' : 'rechazar');
    d.motivo = decision === 'aprobar' ? null : motivo;
    const p = provider(d.providerId);
    notify(p.userId, 'prestador', decision === 'aprobar' ? `${DOC_TIPOS[d.tipo]} aprobado` : `${DOC_TIPOS[d.tipo]} rechazado`, decision === 'aprobar' ? 'Tu documentación está al día.' : motivo, '/documentos', decision === 'aprobar' ? 'ok' : 'warn');
    audit(actor, `documento.${decision}`, 'documento', docId, motivo || '');
  });
}

export function setChecklist(pid, key, val) { return mutate(() => { provider(pid).checklist[key] = val; }); }

export function adminUser(uid, action, motivo, actor) {
  return mutate(() => {
    const u = user(uid);
    const p = providerByUser(uid);
    if (action === 'suspender') {
      u.estado = 'suspendido';
      if (p && p.estado === 'aprobado') { transition('provider', p, 'suspender'); p.disponible = false; }
    } else if (action === 'reactivar') {
      if (db.dniBloqueados.includes(u.dni)) throw new AppError('El DNI de esta cuenta está bloqueado.');
      u.estado = 'activo';
      if (p && p.estado === 'suspendido') transition('provider', p, 'reactivar');
    } else if (action === 'bloquear_dni') {
      if (!u.dni) throw new AppError('La cuenta no tiene DNI cargado.');
      db.dniBloqueados.push(u.dni);
      db.users.filter((x) => x.dni === u.dni).forEach((x) => {
        x.estado = 'bloqueado';
        const px = providerByUser(x.id);
        if (px && px.estado === 'aprobado') { transition('provider', px, 'suspender'); px.disponible = false; }
      });
    }
    audit(actor, `usuario.${action}`, 'usuario', uid, motivo || '');
  });
}

export function updateConfig(patch, actor) {
  return mutate(() => {
    Object.assign(db.config, patch);
    audit(actor, 'config.actualizada', 'config', '—', Object.keys(patch).join(', '));
  });
}

/* ───────────── reloj de simulación (solo pestaña líder) ───────────── */

let ticking = false;
export function tick() {
  if (!db || ticking || !isLeader()) return;
  ticking = true;
  try {
    syncFromStorage();
    let changed = false;
    const t = now();
    const mark = () => { changed = true; };

    // 1) trabajos programados
    const due = db.scheduled.filter((j) => j.at <= t);
    if (due.length) {
      db.scheduled = db.scheduled.filter((j) => j.at > t);
      due.forEach((j) => { try { runJob(j); } catch (e) { console.warn('job', j.type, e.message); } });
      mark();
    }

    // 2) órdenes pendientes de confirmación que vencen
    db.orders.filter((o) => o.estado === 'pendiente_confirmacion' && o.confirmarAntesDe < t).forEach((o) => {
      orderStep(o, 'vencer', SYS, 'Venció el plazo de confirmación');
      reopenRequest(o, 'vencida');
      notify(o.clienteId, 'cliente', `${o.id} venció sin confirmación`, 'Tu changa volvió a recibir postulaciones.', o.requestId ? `/changa/${o.requestId}` : `/orden/${o.id}`, 'warn');
      notify(provider(o.providerId).userId, 'prestador', `${o.id} venció`, 'No confirmaste a tiempo.', `/orden/${o.id}`, 'warn');
      audit(SYS, 'orden.vencida', 'orden', o.id); mark();
    });

    // 3) solicitudes vencidas
    db.requests.filter((r) => ['abierta', 'con_postulaciones'].includes(r.estado) && r.venceEn < t).forEach((r) => {
      transition('request', r, 'vencer'); r.historial.push({ estado: 'vencida', t, texto: 'Venció sin contratación' }); mark();
    });

    // 4) documentos vencidos
    db.documents.filter((d) => d.estado === 'aprobado' && d.vence && d.vence < t).forEach((d) => {
      transition('document', d, 'vencer');
      const p = provider(d.providerId);
      notify(p.userId, 'prestador', `Se venció tu ${DOC_TIPOS[d.tipo].toLowerCase()}`, d.rubroId ? `No vas a ver changas de ${rubro(d.rubroId).nombre} hasta que la renueves.` : 'Recargalo para seguir activo.', '/documentos', 'warn');
      notifyAdmin('Documento vencido', `${DOC_TIPOS[d.tipo]} · ${fullName(user(p.userId))}`, `/verificaciones/${p.id}`);
      audit(SYS, 'documento.vencido', 'documento', d.id); mark();
    });

    // 5) seguimiento del prestador en camino
    db.orders.filter((o) => o.estado === 'en_camino' && o.tracking && !o.tracking.arrived).forEach((o) => {
      const tr = o.tracking;
      const dx = o.direccion.x - tr.x, dy = o.direccion.y - tr.y;
      const d = Math.hypot(dx, dy);
      const step = Math.max(0.12, Math.hypot(o.direccion.x - tr.fromX, o.direccion.y - tr.fromY) / 14);
      if (d <= step) {
        tr.x = o.direccion.x; tr.y = o.direccion.y; tr.eta = 0; tr.arrived = true;
        notify(o.clienteId, 'cliente', 'Tu prestador llegó', 'Dictale tu código de 4 dígitos para iniciar el trabajo.', `/orden/${o.id}`, 'order');
        o.autoAt = t + 5000;
      } else {
        tr.x += (dx / d) * step; tr.y += (dy / d) * step; tr.eta = etaMin(d * 1.3 - step * 1.3);
      }
      mark();
    });

    // 6) typing expirado
    Object.keys(db.typing).forEach((k) => { if (db.typing[k].until < t) { delete db.typing[k]; mark(); } });

    // 7) piloto automático para la parte que no tiene la app abierta
    if (autopilot(t)) mark();

    // 8) plazo de calificación
    const plazo = db.config.plazoCalificacionDias * 86400000;
    db.orders.filter((o) => o.estado === 'finalizada' && o.actualizado + plazo < t && (o.calificoCliente || o.calificoPrestador)).forEach((o) => {
      orderStep(o, 'calificar', SYS, 'Cerró el plazo de calificación'); mark();
    });

    if (changed) persist();
  } finally {
    ticking = false;
  }
}

function runJob(j) {
  const p = j.payload;
  switch (j.type) {
    case 'auto_apply': {
      const req = request(p.reqId); const pr = provider(p.pid);
      if (!req || !['abierta', 'con_postulaciones'].includes(req.estado)) return;
      if (db.applications.some((a) => a.requestId === req.id && a.providerId === pr.id)) return;
      doApply(pr, req, {
        precio: p.precio || suggestedPrice(req),
        mensaje: p.mensaje || PLANTILLAS[Math.floor(Math.random() * PLANTILLAS.length)],
        fecha: req.cuando.fecha || isoDate(now()), franja: req.cuando.franja || currentFranja(),
      }, true);
      break;
    }
    case 'chat_reply': {
      const o = order(p.orderId);
      db.messages.forEach((m) => { if (m.orderId === p.orderId && m.from !== p.fromId) m.leido = true; });
      db.messages.push({ id: nextId('MSG'), orderId: p.orderId, from: p.fromId, text: autoReply(p.texto, p.rolReply), masked: false, leido: false, t: now(), auto: true });
      delete db.typing[p.orderId];
      const toId = p.rolReply === 'prestador' ? o.clienteId : provider(o.providerId).userId;
      notify(toId, p.rolReply === 'prestador' ? 'cliente' : 'prestador', `Mensaje de ${shortName(user(p.fromId))}`, autoReply(p.texto, p.rolReply).slice(0, 90), `/chat/${o.id}`, 'msg');
      break;
    }
    case 'auto_validar': {
      const pr = provider(p.pid);
      if (pr.estado !== 'pendiente_revision') return;
      transition('provider', pr, 'tomar');
      transition('provider', pr, 'aprobar');
      docsOf(pr.id).forEach((d) => { if (['cargado', 'en_revision'].includes(d.estado)) d.estado = 'aprobado'; });
      pr.disponible = true;
      pr.historial.push({ estado: 'aprobado', t: now(), actor: 'Validación automática', texto: 'DNI y selfie validados (rubro de riesgo bajo)' });
      notify(pr.userId, 'prestador', 'Identidad validada', 'Tu rubro es de riesgo bajo: con DNI y selfie ya podés postularte.', '/trabajos', 'ok');
      audit({ rol: 'sistema', nombre: 'Validación automática' }, 'prestador.aprobar', 'prestador', pr.id, 'riesgo bajo');
      break;
    }
    case 'conciliar': {
      const pay = db.payments.find((x) => x.id === p.paymentId);
      if (pay?.estado === 'pendiente_acreditacion') doAcreditar(pay, { rol: 'sistema', nombre: 'Conciliación bancaria' }, null);
      break;
    }
    default: break;
  }
}

/** Avanza órdenes "en vivo" cuando la contraparte no tiene su app abierta, para que la demo funcione con una sola app. */
function autopilot(t) {
  let changed = false;
  db.orders.filter((o) => o.live && o.autoAt && o.autoAt <= t).forEach((o) => {
    const p = provider(o.providerId);
    const provAway = !isPresent('prestador', p.userId);
    const cliAway = !isPresent('cliente', o.clienteId);
    const PA = { id: p.userId, rol: 'prestador' };
    const CA = { id: o.clienteId, rol: 'cliente' };
    try {
      if (provAway && o.estado === 'pendiente_confirmacion') {
        orderStep(o, 'aceptar', PA, 'El prestador confirmó la orden');
        notify(o.clienteId, 'cliente', `${shortName(user(p.userId))} confirmó tu orden`, o.id, `/orden/${o.id}`, 'order');
        audit(PA, 'orden.confirmada', 'orden', o.id); changed = true;
      } else if (provAway && o.estado === 'confirmada' && (o.asap || o.fecha === isoDate(t))) {
        const km = distKm(p, o.direccion);
        orderStep(o, 'salir', PA, 'Salió hacia el domicilio');
        o.tracking = { x: p.x, y: p.y, fromX: p.x, fromY: p.y, km0: km, eta: etaMin(km), arrived: false };
        notify(o.clienteId, 'cliente', `${shortName(user(p.userId))} está en camino`, `Llega en ${etaMin(km)} min.`, `/orden/${o.id}`, 'order');
        audit(PA, 'orden.en_camino', 'orden', o.id); changed = true;
      } else if (provAway && o.estado === 'en_camino' && o.tracking?.arrived) {
        orderStep(o, 'codigo_ok', PA, 'Código verificado · trabajo iniciado');
        notify(o.clienteId, 'cliente', 'Trabajo iniciado', `${shortName(user(p.userId))} ingresó tu código.`, `/orden/${o.id}`, 'order');
        audit(PA, 'orden.iniciada', 'orden', o.id);
        o.autoAt = t + 12000; changed = true;
      } else if (provAway && o.estado === 'en_curso') {
        o.montoFinal = o.precioAcordado;
        orderStep(o, 'finalizar', PA, `Trabajo finalizado · monto informado $ ${o.precioAcordado.toLocaleString('es-AR')}`);
        const pay = { id: nextId('PAG'), orderId: o.id, medio: o.medio, monto: o.precioAcordado, comision: Math.round(o.precioAcordado * o.comisionPct / 100), estado: 'pendiente', historial: [{ estado: 'pendiente', t }] };
        db.payments.push(pay);
        notify(o.clienteId, 'cliente', 'Trabajo terminado', `Confirmá el pago de $ ${pay.monto.toLocaleString('es-AR')}.`, `/pago/${o.id}`, 'pay');
        audit(PA, 'orden.finalizada_prestador', 'orden', o.id); changed = true;
      } else if (cliAway && o.estado === 'finalizada_pend_cliente') {
        const pay = paymentOf(o.id);
        if (pay?.estado === 'pendiente') {
          if (pay.medio === 'efectivo') payStep(pay, 'efectivo_ok', 'El cliente confirmó el pago en efectivo');
          else if (pay.medio === 'transferencia') { payStep(pay, 'comprobante', 'Comprobante adjuntado'); payStep(pay, 'acreditar', 'Transferencia acreditada'); }
          else payStep(pay, 'aprobado', 'Pago aprobado');
          onCredited(o, pay, CA); changed = true;
        }
      } else if (o.estado === 'finalizada' && ((cliAway && !o.calificoCliente) || (provAway && !o.calificoPrestador))) {
        const esCli = cliAway && !o.calificoCliente;
        db.reviews.push({ id: nextId('REV'), orderId: o.id, autorId: esCli ? o.clienteId : p.userId, destId: esCli ? p.userId : o.clienteId, dir: esCli ? 'c2p' : 'p2c', estrellas: 5, tags: esCli ? ['Puntual', 'Prolijo'] : ['Buena predisposición'], comentario: esCli ? 'Llegó en horario y dejó todo limpio. Recomendable.' : 'Muy amable, todo claro.', rubroId: o.rubroId, t, estado: 'publicada' });
        if (esCli) o.calificoCliente = true; else o.calificoPrestador = true;
        if (o.calificoCliente && o.calificoPrestador) orderStep(o, 'calificar', SYS, 'Ambas partes calificaron');
        o.autoAt = t + 6000; changed = true;
      }
    } catch (e) { console.warn('autopilot', o.id, e.message); o.autoAt = t + 10000; }
  });
  return changed;
}

export function isoDate(ts) { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function currentFranja(ts = now()) { const h = new Date(ts).getHours(); return h < 12 ? 'manana' : h < 17 ? 'tarde' : 'noche'; }

/* ───────────── devtools ───────────── */

export function resetAll() {
  Object.keys(localStorage).filter((k) => k.startsWith('rs_')).forEach((k) => localStorage.removeItem(k));
  reseed();
}
export function resetOnboarding() { ['cliente', 'prestador'].forEach((a) => localStorage.removeItem(`rs_onboarding_done_${a}`)); }

export function advanceClock(ms) {
  mutate(() => {
    db.clockOffset = (db.clockOffset || 0) + ms;
    audit({ rol: 'sistema', nombre: 'Devtools' }, 'demo.avanzar_tiempo', 'reloj', '—', `+${Math.round(ms / 60000)} min`);
  });
}

/** Escenario de la demo: Lucía publica, llegan 3 postulaciones en ~20 s (incluida la de Ramiro). */
export function loadScenario() {
  resetAll();
  const lucia = db.users.find((u) => u.email === 'lucia@demo.com');
  const ramiro = db.users.find((u) => u.email === 'ramiro@demo.com');
  setSession('cliente', lucia.id);
  setSession('prestador', ramiro.id);
  localStorage.setItem('rs_onboarding_done_cliente', '1');
  localStorage.setItem('rs_onboarding_done_prestador', '1');
  const { req } = createRequest(lucia.id, {
    rubroId: 'plomeria', descripcion: 'Se rompió el flexible del lavatorio. Pierde agua abajo del mueble, ya cerré la llave de paso.',
    direccion: lucia.direcciones[0], cuando: { tipo: 'asap' }, urgente: false, presupuestoRef: 30000, medio: 'efectivo', sinAutoPostulaciones: true,
  });
  mutate(() => {
    const byMail = (m) => providerByUser(db.users.find((u) => u.email === m).id);
    schedule(5000, 'auto_apply', { reqId: req.id, pid: byMail('hugo.maldonado@demo.com').id, precio: 32000, mensaje: 'Hola {n}, paso a la tarde. Cambio flexible y reviso la llave de paso. Incluye materiales.' });
    schedule(11000, 'auto_apply', { reqId: req.id, pid: byMail('ramiro@demo.com').id, precio: 28500, mensaje: 'Hola {n}, tengo flexibles en la camioneta. Estoy a 10 minutos, lo resuelvo ahora. Materiales incluidos.' });
    schedule(18000, 'auto_apply', { reqId: req.id, pid: byMail('matias.cabrera@demo.com').id, precio: 26000, mensaje: 'Buenas {n}, soy nuevo en la app pero hace 6 años que trabajo de plomero. Puedo ir hoy.' });
    audit({ rol: 'sistema', nombre: 'Devtools' }, 'demo.escenario_cargado', 'solicitud', req.id);
  });
  return req;
}

/** Eventos simulados desde el panel oculto. */
export function simulate(type) {
  return mutate(() => {
    const t = now();
    const liveOrders = db.orders.filter((o) => o.live).sort((a, b) => b.creadoEn - a.creadoEn);
    switch (type) {
      case 'postulacion': {
        const req = db.requests.filter((r) => ['abierta', 'con_postulaciones'].includes(r.estado)).sort((a, b) => b.creadoEn - a.creadoEn)[0];
        if (!req) throw new AppError('No hay changas abiertas.');
        const cand = db.providers.find((p) => p.estado === 'aprobado' && canWorkRubro(p, req.rubroId) && !db.applications.some((a) => a.requestId === req.id && a.providerId === p.id));
        if (!cand) throw new AppError('No quedan prestadores de ese rubro para postular.');
        schedule(0, 'auto_apply', { reqId: req.id, pid: cand.id });
        return `Postulación de ${shortName(user(cand.userId))} en ${req.id}`;
      }
      case 'en_camino': {
        const o = liveOrders.find((x) => ['pendiente_confirmacion', 'confirmada'].includes(x.estado)) || db.orders.find((x) => x.estado === 'confirmada');
        if (!o) throw new AppError('No hay órdenes confirmadas.');
        const p = provider(o.providerId); const PA = { id: p.userId, rol: 'prestador' };
        if (o.estado === 'pendiente_confirmacion') orderStep(o, 'aceptar', PA, 'El prestador confirmó la orden');
        orderStep(o, 'salir', PA, 'Salió hacia el domicilio');
        const km = distKm(p, o.direccion);
        o.tracking = { x: p.x, y: p.y, fromX: p.x, fromY: p.y, km0: km, eta: etaMin(km), arrived: false };
        o.live = true;
        notify(o.clienteId, 'cliente', `${shortName(user(p.userId))} está en camino`, `Llega en ${etaMin(km)} min.`, `/orden/${o.id}`, 'order');
        return `${o.id} en camino`;
      }
      case 'pago': {
        const o = db.orders.find((x) => x.estado === 'finalizada_pend_cliente');
        if (!o) throw new AppError('No hay órdenes esperando pago.');
        const pay = paymentOf(o.id);
        if (pay.medio === 'efectivo') payStep(pay, 'efectivo_ok', 'El cliente confirmó el pago en efectivo');
        else if (pay.estado === 'pendiente_acreditacion') payStep(pay, 'acreditar', 'Transferencia acreditada');
        else payStep(pay, 'aprobado', 'Pago aprobado');
        onCredited(o, pay, { id: o.clienteId, rol: 'cliente' });
        return `Pago de ${o.id} confirmado`;
      }
      case 'doc_vencido': {
        const d = db.documents.find((x) => x.tipo === 'matricula' && x.estado === 'aprobado' && x.vence && x.vence - t < 60 * 86400000) || db.documents.find((x) => x.tipo === 'matricula' && x.estado === 'aprobado');
        d.vence = t - 1000;
        return `Matrícula de ${fullName(user(provider(d.providerId).userId))} vencida`;
      }
      default: throw new AppError('Evento desconocido');
    }
  });
}
