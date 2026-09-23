// Datos falsos realistas para Córdoba capital. Determinístico (misma semilla → mismos datos).
import { RUBROS, BARRIOS, CALLES, docsRequeridos } from './data.js';

export function buildSeed(NOW) {
  // PRNG determinístico (mulberry32)
  let s = 20260923;
  const rand = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const between = (a, b) => a + rand() * (b - a);
  const r500 = (n) => Math.round(n / 500) * 500;
  const H = 3600000, D = 86400000, MIN = 60000;
  const seq = {};
  const id = (p) => { seq[p] = (seq[p] || 1000) + 1; return `${p}-${seq[p]}`; };
  const rub = (rid) => RUBROS.find((r) => r.id === rid);
  const bar = (bid) => BARRIOS.find((b) => b.id === bid);
  const COLORS = ['#E9D8C4', '#D6E2D3', '#D9DDE8', '#EBD5D0', '#E4E0C8', '#D3E0E2', '#E2D6E6', '#DCD6CC'];
  const iso = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const db = {
    rev: 0, seq, clockOffset: 0, users: [], providers: [], documents: [], requests: [], applications: [], orders: [], payments: [],
    ledger: [], reviews: [], disputes: [], messages: [], notifications: [], audit: [], scheduled: [], typing: {}, emails: [], resets: [],
    dniBloqueados: ['22.814.093'],
    config: {
      comisiones: Object.fromEntries(RUBROS.map((r) => [r.id, r.comision])),
      nivelPorRubro: Object.fromEntries(RUBROS.map((r) => [r.id, r.riesgo])),
      limiteDeuda: 15000, plazoConfirmacionMin: 15, recargoUrgentePct: 20, maxSolicitudesAbiertas: 3, plazoCalificacionDias: 7,
      barriosHabilitados: BARRIOS.map((b) => b.id),
      alias: 'ROYAL.CHANGAS.CBA', cbu: '0170 3294 4000 0031 8870 12',
    },
  };

  const mkAddress = (bid, calle, extra = '') => {
    const b = bar(bid);
    return { id: 'd1', alias: 'Casa', calle: calle || `${pick(CALLES[bid])} ${Math.floor(between(100, 2600))}${extra}`, barrio: bid, x: b.x + between(-0.35, 0.35), y: b.y + between(-0.35, 0.35) };
  };
  const mkUser = ({ nombre, apellido, email, barrio, calle, roles = ['cliente'], dni, tel, creado, estado = 'activo' }) => {
    const u = {
      id: id('USR'), email, pass: 'demo1234', nombre, apellido, telefono: tel || `351 ${Math.floor(between(400, 799))}-${Math.floor(between(1000, 9999))}`,
      dni: dni || `${Math.floor(between(24, 44))}.${Math.floor(between(100, 999))}.${Math.floor(between(100, 999))}`, roles, estado,
      color: pick(COLORS), direcciones: [mkAddress(barrio, calle)], tarjetas: [], favoritos: [],
      prefs: { postulaciones: true, estados: true, mensajes: true, promos: false }, creadoEn: creado || NOW - between(20, 110) * D,
      aceptoTerminosEn: NOW - 30 * D, intentos: 0, cancelacionesTardias: 0,
    };
    db.users.push(u);
    return u;
  };

  /* ── admin ── */
  mkUser({ nombre: 'Mesa de', apellido: 'Operaciones', email: 'admin@royal.com', barrio: 'centro', roles: ['admin'], dni: '30.000.001', creado: NOW - 200 * D });

  /* ── clientes ── */
  const lucia = mkUser({ nombre: 'Lucía', apellido: 'Ferreyra', email: 'lucia@demo.com', barrio: 'nueva-cordoba', calle: 'Obispo Trejo 1240, 4° B', dni: '38.412.775', tel: '351 612-4480', creado: NOW - 64 * D });
  lucia.tarjetas.push({ id: 'TRJ-1001', marca: 'Visa', last4: '4821', venc: '08/29', token: 'tok_x81ka02mf9qe' });
  lucia.direcciones.push({ ...mkAddress('guemes', 'Fructuoso Rivera 530'), id: 'd2', alias: 'Casa de mamá' });
  const clientesDef = [
    ['Martín', 'Aguirre', 'general-paz'], ['Carolina', 'Sosa', 'alta-cordoba'], ['Federico', 'Paz', 'cerro'], ['Valentina', 'Molina', 'nueva-cordoba'],
    ['Gustavo', 'Rinaldi', 'alberdi'], ['Sofía', 'Quiroga', 'jardin'], ['Nicolás', 'Heredia', 'san-vicente'], ['Florencia', 'Bazán', 'guemes'],
    ['Diego', 'Villarreal', 'centro'], ['Camila', 'Ludueña', 'general-paz'], ['Pablo', 'Oviedo', 'cerro'], ['Mariela', 'Castro', 'alta-cordoba'],
    ['Joaquín', 'Funes', 'nueva-cordoba'], ['Agustina', 'Olmedo', 'jardin'],
  ];
  const clientes = [lucia, ...clientesDef.map(([n, a, b]) => mkUser({ nombre: n, apellido: a, email: `${slug(n)}.${slug(a)}@demo.com`, barrio: b }))];

  /* ── prestadores ── */
  const MATRICULA = { gas: ['Mat. ECOGAS', 'Distribuidora de Gas del Centro'], electricidad: ['Mat. ERSeP', 'Ente Regulador de Servicios Públicos'], aires: ['Mat. CAyR', 'Cámara de Aire Acondicionado y Refrigeración'] };
  const DESC = {
    plomeria: 'Plomería general y destapaciones. Trabajo con termofusión y dejo todo probado antes de irme.',
    electricidad: 'Electricista matriculado. Tableros, disyuntores y cableado. Presupuesto claro antes de empezar.',
    gas: 'Gasista matriculado. Instalación de artefactos, pruebas de hermeticidad y trámites.',
    albanileria: 'Albañilería en general: revoques, humedad y cerámicos. Trabajos chicos y medianos.',
    pintura: 'Pintura de interiores y exteriores. Cubro muebles y piso, entrego limpio.',
    jardineria: 'Corte de pasto, poda y mantenimiento de patios. Llevo mis herramientas.',
    limpieza: 'Limpieza de casas y departamentos por horas. Llevo productos si hace falta.',
    fletes: 'Fletes y mini mudanzas con utilitario. Con ayudante a pedido.',
    cerrajeria: 'Cerrajería 24 h: aperturas, cambio de cerraduras y copias.',
    aires: 'Instalación y service de splits. Carga de gas y limpieza profunda.',
  };
  // [nombre, apellido, email, rubros, barrio, estado, opciones]
  const provDef = [
    ['Ramiro', 'Bustos', 'ramiro@demo.com', ['gas', 'plomeria'], 'guemes', 'aprobado', { deuda: 2850, resp: 6, disponible: true, dni: '31.556.208', tel: '351 598-2217' }],
    ['Walter', 'Ceballos', null, ['electricidad'], 'alberdi', 'aprobado', { deuda: 4300, matVence: 18 * D, resp: 14 }],
    ['Hugo', 'Maldonado', null, ['plomeria'], 'nueva-cordoba', 'aprobado', { deuda: 9800, resp: 9 }],
    ['Daniel', 'Toledo', null, ['plomeria', 'albanileria'], 'general-paz', 'aprobado', { deuda: 16200, resp: 22 }],
    ['Marcela', 'Ríos', null, ['limpieza'], 'alta-cordoba', 'aprobado', { deuda: 900, resp: 11 }],
    ['Sergio', 'Arce', null, ['electricidad'], 'san-vicente', 'aprobado', { deuda: 1500, resp: 18 }],
    ['Claudio', 'Pereyra', null, ['albanileria'], 'jardin', 'aprobado', { deuda: 3100, resp: 35 }],
    ['Andrea', 'Gómez', null, ['limpieza'], 'nueva-cordoba', 'aprobado', { deuda: 0, resp: 8 }],
    ['Luis', 'Barrionuevo', null, ['fletes'], 'alberdi', 'aprobado', { deuda: 12400, resp: 16 }],
    ['Javier', 'Moyano', null, ['cerrajeria'], 'centro', 'aprobado', { deuda: 600, resp: 5 }],
    ['Rubén', 'Acosta', null, ['aires', 'electricidad'], 'cerro', 'aprobado', { deuda: 5200, resp: 27 }],
    ['Gabriela', 'Nieto', null, ['jardineria'], 'cerro', 'aprobado', { deuda: 0, resp: 19 }],
    ['Oscar', 'Vélez', null, ['pintura'], 'san-vicente', 'aprobado', { deuda: 2400, resp: 31 }],
    ['Matías', 'Cabrera', null, ['plomeria'], 'alta-cordoba', 'aprobado', { deuda: 0, resp: 12, nuevo: true }],
    ['Silvina', 'Luna', null, ['limpieza'], 'guemes', 'aprobado', { deuda: 1200, resp: 10 }],
    ['Ezequiel', 'Farías', null, ['gas'], 'general-paz', 'aprobado', { deuda: 7400, resp: 20 }],
    ['Leandro', 'Godoy', null, ['fletes'], 'jardin', 'aprobado', { deuda: 0, resp: 15 }],
    ['Norma', 'Peralta', null, ['pintura', 'limpieza'], 'alberdi', 'aprobado', { deuda: 800, resp: 24 }],
    ['Pablo', 'Bravo', null, ['aires'], 'centro', 'aprobado', { deuda: 3600, resp: 13 }],
    ['Franco', 'Ibarra', null, ['electricidad'], 'nueva-cordoba', 'pendiente_revision', { hace: 5 * H }],
    ['Mauricio', 'Soria', null, ['gas'], 'alta-cordoba', 'pendiente_revision', { hace: 26 * H }],
    ['Rocío', 'Medina', null, ['cerrajeria'], 'san-vicente', 'pendiente_revision', { hace: 50 * H }],
    ['Alejandro', 'Paredes', null, ['electricidad'], 'general-paz', 'observado', { hace: 3 * D }],
    ['Cristian', 'Ledesma', null, ['albanileria'], 'alberdi', 'rechazado', { hace: 9 * D }],
    ['Julio', 'Carrizo', null, ['plomeria'], 'guemes', 'suspendido', { deuda: 0, resp: 40 }],
  ];

  const provs = provDef.map(([nombre, apellido, email, rubros, bid, estado, o]) => {
    const u = mkUser({ nombre, apellido, email: email || `${slug(nombre)}.${slug(apellido)}@demo.com`, barrio: bid, roles: ['cliente', 'prestador'], dni: o.dni, tel: o.tel, creado: NOW - (o.hace ? o.hace + 2 * D : between(60, 160) * D) });
    const b = bar(bid);
    const vecinos = BARRIOS.filter((x) => x.id !== bid).sort((a, c) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y)).slice(0, 3).map((x) => x.id);
    const tags = rubros.flatMap((r) => rub(r).tags.slice(0, 2 + Math.floor(rand() * 2)));
    const creado = o.hace ? NOW - o.hace : u.creadoEn + 2 * D;
    const p = {
      id: id('PRV'), userId: u.id, estado, rubros, tags, descripcion: DESC[rubros[0]], barrios: [bid, ...vecinos],
      disponibilidad: { lun: ['manana', 'tarde'], mar: ['manana', 'tarde'], mie: ['manana', 'tarde'], jue: ['manana', 'tarde'], vie: ['manana', 'tarde'], sab: ['manana'], dom: [] },
      disponible: estado === 'aprobado' ? (o.disponible ?? rand() > 0.25) : false, x: u.direcciones[0].x + between(-0.2, 0.2), y: u.direcciones[0].y + between(-0.2, 0.2), barrio: bid,
      respuestaMin: o.resp || 20, cancelacionesTardias: estado === 'suspendido' ? 4 : (rand() > 0.8 ? 1 : 0), penalizacion: estado === 'suspendido' ? 2 : 0,
      galeria: o.nuevo || !['aprobado', 'suspendido'].includes(estado) ? [] : Array.from({ length: 3 + Math.floor(rand() * 4) }, (_, i) => ({ rubroId: rubros[i % rubros.length], n: i + 1 })),
      observacion: null, historial: [{ estado: 'borrador', t: creado - 2 * H, actor: `${nombre} ${apellido[0]}.` }], checklist: {}, creadoEn: creado, _o: o,
    };
    // historial de estados coherente
    if (estado !== 'borrador') p.historial.push({ estado: 'pendiente_revision', t: creado, actor: `${nombre} ${apellido[0]}.`, texto: 'Alta enviada a revisión' });
    if (['aprobado', 'suspendido'].includes(estado)) p.historial.push({ estado: 'aprobado', t: creado + 20 * H, actor: 'Admin · Mesa de', texto: 'Aprobado' });
    if (estado === 'suspendido') p.historial.push({ estado: 'suspendido', t: NOW - 6 * D, actor: 'Admin · Mesa de', texto: 'Suspendido: cancelaciones tardías reiteradas' });
    if (estado === 'observado') {
      p.historial.push({ estado: 'observado', t: NOW - 2 * D, actor: 'Admin · Mesa de', texto: 'Observado: Matrícula vencida o ilegible' });
      p.observacion = { motivo: 'Matrícula vencida o ilegible', comentario: 'La foto de la matrícula está cortada: no se lee la fecha de vencimiento.', t: NOW - 2 * D };
    }
    if (estado === 'rechazado') {
      p.historial.push({ estado: 'rechazado', t: NOW - 7 * D, actor: 'Admin · Mesa de', texto: 'Rechazado: el certificado registra antecedentes' });
      p.observacion = { motivo: 'El certificado de antecedentes registra causas', comentario: '', t: NOW - 7 * D };
    }
    if (estado === 'suspendido') p.historial.at(-1);
    db.providers.push(p);

    // documentos
    const riesgo = rubros.map((r) => rub(r).riesgo).includes('alto') ? 'alto' : rubros.map((r) => rub(r).riesgo).includes('medio') ? 'medio' : 'bajo';
    const tipos = docsRequeridos(riesgo).filter((t) => t !== 'matricula').map((t) => [t, null]);
    rubros.filter((r) => rub(r).riesgo === 'alto').forEach((r) => tipos.push(['matricula', r]));
    tipos.forEach(([tipo, rubroId]) => {
      let docEstado = { aprobado: 'aprobado', suspendido: 'aprobado', pendiente_revision: 'en_revision', observado: 'aprobado', rechazado: 'aprobado' }[estado];
      let motivo = null;
      if (estado === 'observado' && tipo === 'matricula') { docEstado = 'rechazado'; motivo = 'Matrícula vencida o ilegible'; }
      if (estado === 'rechazado' && tipo === 'antecedentes') { docEstado = 'rechazado'; motivo = 'Registra antecedentes penales'; }
      const [pre, entidad] = MATRICULA[rubroId] || ['', ''];
      const doc = {
        id: id('DOC'), providerId: p.id, tipo, rubroId, estado: docEstado, archivo: null, simulado: true,
        numero: tipo === 'matricula' ? `${pre} ${Math.floor(between(1000, 19999))}` : tipo === 'antecedentes' ? `RNR-${Math.floor(between(100000, 999999))}` : '',
        entidad: tipo === 'matricula' ? entidad : tipo === 'antecedentes' ? 'Registro Nacional de Reincidencia' : '',
        vence: tipo === 'matricula' ? NOW + (o.matVence || between(200, 700) * D) : tipo === 'antecedentes' ? creado + 180 * D : null,
        mime: 'image/jpeg', kb: Math.floor(between(300, 1800)), motivo, creadoEn: creado,
      };
      db.documents.push(doc);
    });
    return p;
  });
  const P = (email) => provs.find((p) => db.users.find((u) => u.id === p.userId).email === email);
  const ramiro = P('ramiro@demo.com');

  /* ── reseñas: textos ── */
  const TXT = {
    5: ['Llegó a horario, explicó qué tenía y dejó todo limpio. Lo vuelvo a llamar.', 'Impecable. Me mandó foto del repuesto por el chat antes de comprarlo.', 'Rápido y prolijo. Cobró exactamente lo que habíamos hablado.', 'Se nota que sabe. Resolvió en una hora algo que otro no pudo en dos visitas.', 'Vino el mismo día y trajo todo lo necesario. Muy recomendable.', 'Muy respetuoso y cuidadoso con la casa. Diez puntos.', 'Me explicó cómo evitar que vuelva a pasar. Eso no lo hace cualquiera.', 'Puntual, claro con el presupuesto y buena onda.', 'Excelente trabajo, lo recomiendo a ojos cerrados.', 'Todo perfecto. Hasta me dejó el teléfono de la garantía por la app.'],
    4: ['Buen trabajo. Llegó 20 minutos tarde pero avisó por el chat.', 'Quedó bien, aunque tuvo que volver al día siguiente por un repuesto.', 'Muy correcto. Un poco más caro que otros, pero vale la pena.', 'Resolvió el problema. Faltó limpiar un poco al terminar.', 'Buena predisposición y explicó todo. Recomendable.', 'Trabajo bien hecho, solo le faltó avisar cuánto iba a tardar.'],
    3: ['Hizo el trabajo pero tardó más de lo que dijo. Tuve que insistir para que terminara.', 'El arreglo quedó, pero dejó bastante tierra. Le falta prolijidad.', 'Correcto, sin más. Cobró extra por materiales que no me había mencionado.', 'Llegó tarde y sin avisar. El trabajo en sí está bien.'],
    2: ['No quedó del todo bien, a los dos días volvió el problema. Vino a revisar pero tuve que esperar una semana.', 'Poco claro con el precio y se fue antes de probar que funcionara.'],
    1: ['No resolvió el problema y cobró la visita completa.'],
  };
  const TXT_P2C = ['Muy amable, todo claro desde el principio.', 'Me esperó con el lugar despejado y pagó en el momento.', 'Dirección precisa y buena onda.', 'Todo en orden, cliente recomendable.', 'Tardó en abrir, pero después todo bien.', 'Explicó bien el problema, así llevé lo justo.'];
  const TAGS_C = ['Puntual', 'Prolijo', 'Explicó bien', 'Precio justo', 'Resolvió rápido'];
  const TAGS_P = ['Claro con el problema', 'Pagó en tiempo', 'Buena predisposición', 'Dirección precisa'];
  const starsFor = (p) => {
    const bias = p === ramiro ? 0.9 : p._o.nuevo ? 1 : p.estado === 'suspendido' ? 0.35 : 0.62;
    const x = rand();
    if (x < bias * 0.8) return 5;
    if (x < bias * 0.8 + 0.25) return 4;
    if (x < 0.95) return 3;
    return x < 0.985 ? 2 : 1;
  };

  /* ── órdenes históricas ── */
  const DESCS = {
    plomeria: ['Pierde agua la canilla de la cocina', 'Se tapó la pileta del lavadero', 'Pérdida en el depósito del inodoro', 'Cambiar la grifería del baño', 'Termotanque que no calienta'],
    electricidad: ['Salta la térmica cuando prendo el horno', 'Instalar ventilador de techo', 'Cambiar el tablero por uno con disyuntor', 'No anda la luz del pasillo'],
    gas: ['Revisión del calefactor antes del invierno', 'Instalar cocina nueva', 'Olor a gas cerca del termotanque', 'Prueba de hermeticidad para la inmobiliaria'],
    albanileria: ['Humedad en la pared del dormitorio', 'Colocar cerámicos en el patio', 'Reparar revoque del frente'],
    pintura: ['Pintar living y comedor', 'Pintar rejas del frente', 'Impermeabilizar el techo'],
    jardineria: ['Cortar el pasto y bordes', 'Poda del paraíso del patio', 'Limpieza general del patio'],
    limpieza: ['Limpieza general 4 h', 'Limpieza post mudanza', 'Limpieza de vidrios'],
    fletes: ['Llevar una heladera a Villa Allende', 'Mudanza de un monoambiente', 'Retirar escombros'],
    cerrajeria: ['Cambiar la cerradura de la puerta principal', 'Me quedé afuera', 'Arreglar el portón'],
    aires: ['Instalar split de 3000 frigorías', 'El aire no enfría', 'Limpieza de dos splits'],
  };
  const MEDIOS_W = () => { const x = rand(); return x < 0.5 ? 'efectivo' : x < 0.75 ? 'transferencia' : x < 0.9 ? 'mercadopago' : 'tarjeta'; };
  const FR = ['manana', 'tarde', 'noche'];
  const approvedHist = provs.filter((p) => ['aprobado', 'suspendido'].includes(p.estado) && !p._o.nuevo);

  const makeOrder = ({ p, c, rubroId, desc, t, estado, medio, precio, stars, p2c = rand() < 0.45, live = false, fecha, franja, withRequest = rand() < 0.75 }) => {
    rubroId = rubroId || pick(p.rubros);
    const r = rub(rubroId);
    precio = precio || r500(between(r.precio[0], r.precio[1]));
    medio = medio || MEDIOS_W();
    const dir = c.direcciones[0];
    let req = null, app = null;
    if (withRequest) {
      req = { id: id('SOL'), clienteId: c.id, rubroId, descripcion: desc || pick(DESCS[rubroId]), fotos: [], direccion: dir, cuando: { tipo: 'asap' }, urgente: rand() < 0.15, presupuestoRef: rand() < 0.5 ? r500(precio * between(0.8, 1.1)) : null, medioPrevisto: medio, estado: 'asignada', creadoEn: t - between(20, 180) * MIN, venceEn: t + 40 * H, historial: [] };
      req.historial.push({ estado: 'abierta', t: req.creadoEn, texto: 'Changa publicada' });
      db.requests.push(req);
      const otros = approvedHist.filter((x) => x !== p && x.rubros.includes(rubroId)).slice(0, Math.floor(rand() * 3));
      [...otros, p].forEach((pp, i) => {
        const a = { id: id('APL'), requestId: req.id, providerId: pp.id, precio: pp === p ? precio : r500(precio * between(0.85, 1.25)), mensaje: 'Hola, puedo pasar hoy. Llevo los materiales básicos.', fecha: iso(t), franja: franja || pick(FR), estado: pp === p ? 'aceptada' : 'activa', distanciaKm: Math.round(Math.hypot(pp.x - dir.x, pp.y - dir.y) * 13) / 10, creadoEn: req.creadoEn + (i + 1) * between(3, 25) * MIN, respuestaMin: Math.round((i + 1) * between(3, 25)) };
        db.applications.push(a);
        if (pp === p) app = a;
      });
      req.historial.push({ estado: 'con_postulaciones', t: req.creadoEn + 5 * MIN, texto: 'Llegó la primera postulación' });
      req.historial.push({ estado: 'asignada', t, texto: `Elegiste a ${db.users.find((u) => u.id === p.userId).nombre}` });
    }
    const pu = db.users.find((u) => u.id === p.userId);
    const pn = `${pu.nombre} ${pu.apellido[0]}.`, cn = `${c.nombre} ${c.apellido[0]}.`;
    const o = {
      id: id('ORD'), origen: req ? 'postulacion' : 'directa', requestId: req?.id || null, applicationId: app?.id || null, clienteId: c.id, providerId: p.id, rubroId,
      descripcion: req?.descripcion || desc || pick(DESCS[rubroId]), direccion: dir, fecha: fecha || iso(t), franja: franja || pick(FR), asap: false,
      precioAcordado: precio, montoFinal: null, comisionPct: r.comision, medio, estado, codigo: String(Math.floor(1000 + rand() * 9000)), intentosCodigo: 0,
      confirmarAntesDe: t + 15 * MIN, tracking: null, cancelacion: null, garantia: false, timeline: [{ estado: 'pendiente_confirmacion', t, actor: cn, texto: 'Orden creada' }],
      calificoCliente: false, calificoPrestador: false, disputaId: null, live, autoAt: null, creadoEn: t, actualizado: t,
    };
    if (req) req.ordenId = o.id;
    const step = (st, dt, actor, texto) => o.timeline.push({ estado: st, t: t + dt, actor, texto });
    const done = ['finalizada', 'calificada', 'en_disputa', 'resuelta', 'finalizada_pend_cliente'];
    if (['confirmada', 'en_camino', 'en_curso', ...done].includes(estado)) step('confirmada', 4 * MIN, pn, 'El prestador confirmó la orden');
    if (['en_camino', 'en_curso', ...done].includes(estado)) step('en_camino', 50 * MIN, pn, 'Salió hacia el domicilio');
    if (['en_curso', ...done].includes(estado)) step('en_curso', 75 * MIN, pn, 'Código verificado · trabajo iniciado');
    if (done.includes(estado)) {
      o.montoFinal = precio;
      step('finalizada_pend_cliente', 150 * MIN, pn, `Trabajo finalizado · monto informado $ ${precio.toLocaleString('es-AR')}`);
      const pay = { id: id('PAG'), orderId: o.id, medio, monto: precio, comision: Math.round(precio * r.comision / 100), estado: 'pendiente', historial: [{ estado: 'pendiente', t: t + 150 * MIN }] };
      db.payments.push(pay);
      if (estado !== 'finalizada_pend_cliente' && !(estado === 'en_disputa' && medio === 'efectivo' && o._montoDisputa)) {
        pay.estado = 'acreditado'; pay.historial.push({ estado: 'acreditado', t: t + 160 * MIN });
        o.garantia = medio !== 'efectivo';
        db.ledger.push({ id: id('MOV'), providerId: p.id, orderId: o.id, tipo: 'ingreso', monto: precio, t: t + 160 * MIN, detalle: `${o.id} · ${medio}` });
        db.ledger.push(medio === 'efectivo'
          ? { id: id('MOV'), providerId: p.id, orderId: o.id, tipo: 'deuda_efectivo', monto: pay.comision, t: t + 160 * MIN, detalle: `Comisión ${r.comision}% a saldar · ${o.id}` }
          : { id: id('MOV'), providerId: p.id, orderId: o.id, tipo: 'comision_deducida', monto: -pay.comision, t: t + 160 * MIN, detalle: `Comisión ${r.comision}% deducida · ${o.id}` });
        step('finalizada', 160 * MIN, cn, 'Pago acreditado');
      }
      if (['finalizada', 'calificada', 'resuelta'].includes(estado)) {
        const st = stars || starsFor(p);
        db.reviews.push({ id: id('REV'), orderId: o.id, autorId: c.id, destId: p.userId, dir: 'c2p', estrellas: st, tags: [...TAGS_C].sort(() => rand() - 0.5).slice(0, st >= 4 ? 2 : st === 3 ? 1 : 0), comentario: rand() < 0.85 ? pick(TXT[st]) : '', rubroId, t: t + between(3, 40) * H, estado: 'publicada' });
        o.calificoCliente = true;
        if (p2c || estado === 'calificada') {
          db.reviews.push({ id: id('REV'), orderId: o.id, autorId: p.userId, destId: c.id, dir: 'p2c', estrellas: rand() < 0.85 ? 5 : 4, tags: [pick(TAGS_P)], comentario: pick(TXT_P2C), rubroId, t: t + between(3, 30) * H, estado: 'publicada' });
          o.calificoPrestador = true;
        }
        if (o.calificoCliente && o.calificoPrestador && estado !== 'resuelta') { o.estado = 'calificada'; step('calificada', 30 * H, 'Sistema', 'Ambas partes calificaron'); }
        else if (estado === 'calificada') o.estado = 'finalizada';
      }
    }
    if (estado === 'cancelada') {
      const porCliente = rand() < 0.6;
      const tardia = rand() < 0.3;
      o.cancelacion = { actor: porCliente ? 'cliente' : 'prestador', motivo: porCliente ? pick(['Ya lo resolví por otro lado', 'Cambié de fecha', 'No puedo recibirlo']) : pick(['Me surgió otra urgencia', 'No llego en el horario']), tardia, t: t + 2 * H };
      step('cancelada', 2 * H, porCliente ? cn : pn, `Cancelada${tardia ? ' (tardía)' : ''}: ${o.cancelacion.motivo}`);
      if (req) { req.estado = 'cancelada'; req.historial.push({ estado: 'cancelada', t: t + 2 * H, texto: 'Orden cancelada' }); }
    }
    if (estado === 'rechazada') { step('rechazada', 6 * MIN, pn, 'Rechazada: No tengo disponibilidad'); if (req) { req.estado = 'vencida'; } if (app) app.estado = 'rechazada'; }
    if (estado === 'vencida') { step('vencida', 15 * MIN, 'Sistema', 'Venció el plazo de confirmación'); if (req) req.estado = 'vencida'; if (app) app.estado = 'vencida'; }
    o.actualizado = o.timeline.at(-1).t;
    db.orders.push(o);
    db.audit.push({ id: id('LOG'), t, actor: cn, rol: 'cliente', accion: 'orden.creada', entidad: 'orden', entidadId: o.id, detalle: `${o.origen} · $ ${precio}` });
    if (o.estado !== 'pendiente_confirmacion') db.audit.push({ id: id('LOG'), t: o.actualizado, actor: o.timeline.at(-1).actor, rol: 'sistema', accion: `orden.${o.estado}`, entidad: 'orden', entidadId: o.id, detalle: '' });
    return o;
  };

  // Historial de Ramiro (buen prestador, reputación alta)
  const otrosClientes = clientes.slice(1);
  for (let i = 0; i < 14; i++) makeOrder({ p: ramiro, c: otrosClientes[i % otrosClientes.length], t: NOW - between(3, 75) * D, estado: 'calificada' });
  makeOrder({ p: ramiro, c: otrosClientes[3], t: NOW - 12 * D, estado: 'cancelada' });

  // Historial de Lucía
  makeOrder({ p: ramiro, c: lucia, rubroId: 'gas', desc: 'Revisión del calefactor antes del invierno', t: NOW - 41 * D, estado: 'calificada', medio: 'efectivo', precio: 42000, stars: 5, p2c: true });
  makeOrder({ p: P('marcela.rios@demo.com'), c: lucia, rubroId: 'limpieza', desc: 'Limpieza post mudanza', t: NOW - 58 * D, estado: 'calificada', medio: 'mercadopago', precio: 45000, stars: 4, p2c: true });
  makeOrder({ p: P('javier.moyano@demo.com'), c: lucia, rubroId: 'cerrajeria', desc: 'Cambiar la cerradura de la puerta principal', t: NOW - 20 * D, estado: 'cancelada', medio: 'efectivo' });

  // Resto del mercado
  const W = [['calificada', 62], ['finalizada', 12], ['cancelada', 9], ['rechazada', 5], ['vencida', 4]];
  const pickEstado = () => { let x = rand() * 92; for (const [e, w] of W) { if ((x -= w) < 0) return e; } return 'calificada'; };
  const others = approvedHist.filter((p) => p !== ramiro);
  for (let i = 0; i < 115; i++) {
    const p = others[i % others.length];
    const c = pick(otrosClientes);
    // más actividad en las últimas semanas (crecimiento)
    const daysAgo = Math.pow(rand(), 1.6) * 70 + 1;
    makeOrder({ p, c, t: NOW - daysAgo * D, estado: pickEstado() });
  }

  // Órdenes activas (estáticas) para dar vida a agenda y admin
  const manana = NOW + D;
  const oRam = makeOrder({ p: ramiro, c: otrosClientes[0], rubroId: 'gas', desc: 'Instalar cocina nueva y conectar a la red', t: NOW - 3 * H, estado: 'confirmada', medio: 'transferencia', precio: 68000, fecha: iso(manana), franja: 'manana', withRequest: false });
  makeOrder({ p: P('sergio.arce@demo.com'), c: otrosClientes[5], t: NOW - 1 * H, estado: 'en_curso', medio: 'efectivo' });
  makeOrder({ p: P('andrea.gomez@demo.com'), c: otrosClientes[8], t: NOW - 5 * H, estado: 'confirmada', fecha: iso(manana), franja: 'tarde' });

  // Disputas abiertas
  const oD1 = makeOrder({ p: P('claudio.pereyra@demo.com'), c: otrosClientes[2], rubroId: 'albanileria', desc: 'Humedad en la pared del dormitorio', t: NOW - 9 * D, estado: 'finalizada', medio: 'transferencia', precio: 145000, stars: 2, p2c: false });
  oD1.estado = 'en_disputa';
  oD1.timeline.push({ estado: 'en_disputa', t: NOW - 2 * D, actor: `${otrosClientes[2].nombre} ${otrosClientes[2].apellido[0]}.`, texto: 'Reporte abierto: El trabajo quedó mal hecho' });
  const d1 = { id: id('DSP'), orderId: oD1.id, abiertaPor: otrosClientes[2].id, motivo: 'El trabajo quedó mal hecho', descripcion: 'A la semana volvió a aparecer la mancha de humedad en el mismo lugar. Pagué el trabajo completo.', estado: 'abierta', creadaEn: NOW - 2 * D, resolucion: null,
    evidencias: [
      { autor: otrosClientes[2].id, texto: 'A la semana volvió a aparecer la mancha de humedad en el mismo lugar. Pagué el trabajo completo.', foto: null, t: NOW - 2 * D },
      { autor: P('claudio.pereyra@demo.com').userId, texto: 'Avisé que la humedad venía del techo del vecino y que el revoque hidrófugo era una solución parcial. Ofrecí volver sin cargo a revisar.', foto: null, t: NOW - 1 * D },
    ] };
  db.disputes.push(d1); oD1.disputaId = d1.id;

  const oD2 = makeOrder({ p: P('daniel.toledo@demo.com'), c: otrosClientes[6], rubroId: 'plomeria', desc: 'Termotanque que no calienta', t: NOW - 20 * H, estado: 'finalizada_pend_cliente', medio: 'efectivo', precio: 38000, withRequest: true });
  oD2.montoFinal = 52000;
  db.payments.find((x) => x.orderId === oD2.id).monto = 52000;
  oD2.timeline.at(-1).texto = 'Trabajo finalizado · monto informado $ 52.000';
  oD2.estado = 'en_disputa';
  oD2.timeline.push({ estado: 'en_disputa', t: NOW - 16 * H, actor: `${otrosClientes[6].nombre} ${otrosClientes[6].apellido[0]}.`, texto: 'Reporte abierto: El monto no coincide con lo acordado' });
  const d2 = { id: id('DSP'), orderId: oD2.id, abiertaPor: otrosClientes[6].id, motivo: 'El monto no coincide con lo acordado', descripcion: 'Acordamos $ 38.000 en la app y me informó $ 52.000 al terminar.', estado: 'abierta', creadaEn: NOW - 16 * H, resolucion: null,
    evidencias: [
      { autor: otrosClientes[6].id, texto: 'Acordamos $ 38.000 en la app y me informó $ 52.000 al terminar.', foto: null, t: NOW - 16 * H },
      { autor: P('daniel.toledo@demo.com').userId, texto: 'Hubo que cambiar la válvula de seguridad, se lo mostré en el momento. El repuesto salió $ 14.000.', foto: null, t: NOW - 12 * H },
    ] };
  db.disputes.push(d2); oD2.disputaId = d2.id;

  // Una reseña reportada para moderar
  const revRep = db.reviews.find((r) => r.dir === 'c2p' && r.estrellas <= 2 && r.destId !== ramiro.userId);
  if (revRep) { revRep.estado = 'reportada'; revRep.reporte = { por: revRep.destId, motivo: 'La clienta no estaba en el domicilio el día pactado y la reseña no refleja el trabajo', t: NOW - 20 * H }; }
  const revRep2 = db.reviews.filter((r) => r.dir === 'c2p' && r.estrellas === 3)[2];
  if (revRep2) { revRep2.estado = 'reportada'; revRep2.reporte = { por: revRep2.destId, motivo: 'Menciona un cobro extra que estaba en el presupuesto', t: NOW - 3 * H }; }

  /* ── changas abiertas (feed de prestadores) ── */
  const openDef = [
    [otrosClientes[0], 'plomeria', 'Pierde agua la canilla de la cocina, gotea todo el tiempo', 35 * MIN, false, 30000],
    [otrosClientes[7], 'gas', 'Olor a gas cerca del calefactor del living', 12 * MIN, true, null],
    [otrosClientes[3], 'electricidad', 'Salta la térmica cuando enchufo el lavarropas', 3 * H, false, 45000],
    [otrosClientes[11], 'limpieza', 'Limpieza general de un 2 ambientes, 4 horas', 7 * H, false, 32000],
    [otrosClientes[9], 'fletes', 'Llevar un sillón y una mesa a Alta Córdoba', 20 * H, false, 40000],
    [otrosClientes[12], 'cerrajeria', 'Me quedé afuera, la llave quedó puesta del lado de adentro', 8 * MIN, true, null],
    [otrosClientes[4], 'plomeria', 'Se tapó la pileta del lavadero', 5 * H, false, null],
  ];
  openDef.forEach(([c, rubroId, desc, ago, urgente, ref]) => {
    const t = NOW - ago;
    const req = { id: id('SOL'), clienteId: c.id, rubroId, descripcion: desc, fotos: [], direccion: c.direcciones[0], cuando: urgente ? { tipo: 'asap' } : { tipo: 'programado', fecha: iso(NOW + D), franja: pick(FR) }, urgente, presupuestoRef: ref, medioPrevisto: MEDIOS_W(), estado: 'abierta', creadoEn: t, venceEn: t + 48 * H, historial: [{ estado: 'abierta', t, texto: 'Changa publicada' }] };
    db.requests.push(req);
    if (ago > 2 * H) {
      const pp = approvedHist.find((p) => p.rubros.includes(rubroId) && p !== ramiro && (rubroId !== 'plomeria' || p !== P('julio.carrizo@demo.com')));
      if (pp) {
        db.applications.push({ id: id('APL'), requestId: req.id, providerId: pp.id, precio: r500((ref || rub(rubroId).precio[0]) * 1.05), mensaje: 'Hola, lo puedo ver mañana a primera hora.', fecha: iso(NOW + D), franja: 'manana', estado: 'activa', distanciaKm: Math.round(Math.hypot(pp.x - req.direccion.x, pp.y - req.direccion.y) * 13) / 10, creadoEn: t + 40 * MIN, respuestaMin: 40 });
        req.estado = 'con_postulaciones';
        req.historial.push({ estado: 'con_postulaciones', t: t + 40 * MIN, texto: 'Llegó la primera postulación' });
      }
    }
  });

  /* ── deudas de comisión objetivo por prestador ── */
  provs.forEach((p) => {
    const target = p._o.deuda ?? Math.round(between(0, 2500) / 50) * 50;
    const cur = db.ledger.filter((m) => m.providerId === p.id).reduce((a, m) => a + (m.tipo === 'deuda_efectivo' ? m.monto : m.tipo === 'pago_deuda' ? -m.monto : 0), 0);
    if (cur > target) db.ledger.push({ id: id('MOV'), providerId: p.id, tipo: 'pago_deuda', monto: cur - target, t: NOW - between(4, 12) * D, detalle: 'Pago de comisiones · Mercado Pago' });
    if (cur < target) db.ledger.push({ id: id('MOV'), providerId: p.id, tipo: 'deuda_efectivo', monto: target - cur, t: NOW - between(1, 20) * D, detalle: 'Comisiones por efectivo acumuladas' });
    delete p._o;
  });

  /* ── mensajes ── */
  const msg = (o, from, text, ago, leido = true) => db.messages.push({ id: id('MSG'), orderId: o.id, from, text, masked: false, leido, t: NOW - ago });
  msg(oRam, otrosClientes[0].id, 'Hola Ramiro, la cocina ya está en casa. ¿Traés vos la llave de paso nueva?', 2.5 * H);
  msg(oRam, ramiro.userId, 'Hola Martín, sí, llevo llave y flexible reglamentario. Mañana 9 h estoy ahí.', 2.2 * H);
  msg(oRam, otrosClientes[0].id, 'Perfecto, te espero. Es el timbre de abajo.', 2 * H, false);
  const oLuciaRam = db.orders.find((o) => o.clienteId === lucia.id && o.providerId === ramiro.id);
  msg(oLuciaRam, lucia.id, 'Hola, ¿podés pasar a la mañana?', 41 * D);
  msg(oLuciaRam, ramiro.userId, 'Sí, a las 10 estoy. Te reviso también la ventilación del calefactor.', 41 * D - 20 * MIN);

  /* ── notificaciones iniciales ── */
  const nt = (userId, app, titulo, cuerpo, link, ago, leida = true) => db.notifications.push({ id: id('NTF'), userId, app, titulo, cuerpo, link, tipo: 'info', leida, t: NOW - ago });
  nt(lucia.id, 'cliente', 'Bienvenida a Royal', 'Publicá tu primera changa en menos de un minuto.', '/publicar', 60 * D);
  nt(ramiro.userId, 'prestador', 'Mensaje de Martín A.', 'Perfecto, te espero. Es el timbre de abajo.', `/chat/${oRam.id}`, 2 * H, false);
  nt(ramiro.userId, 'prestador', 'Nueva changa de Gas · Urgente', 'Olor a gas cerca del calefactor del living', '/trabajos', 12 * MIN, false);
  nt(null, 'admin', 'Nueva verificación pendiente', 'Franco Ibarra · Electricidad · alto', `/verificaciones/${P('franco.ibarra@demo.com').id}`, 5 * H, false);
  nt(null, 'admin', 'Nueva disputa', `${d2.id} · ${oD2.id} · El monto no coincide con lo acordado`, `/disputas/${d2.id}`, 16 * H, false);

  // audit extra: verificaciones y reseñas
  provs.forEach((p) => p.historial.slice(1).forEach((h) => db.audit.push({ id: id('LOG'), t: h.t, actor: h.actor, rol: h.actor.startsWith('Admin') ? 'admin' : 'prestador', accion: `prestador.${h.estado}`, entidad: 'prestador', entidadId: p.id, detalle: h.texto || '' })));
  db.notifications.sort((a, b) => b.t - a.t);
  db.audit.sort((a, b) => b.t - a.t);
  return db;
}
