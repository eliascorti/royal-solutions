// Datos de referencia: rubros, barrios, documentos por nivel de riesgo.

export const SCHEMA_VERSION = 5;
export const APP_VERSION = 'v0.9.2';

// Riesgo del rubro → documentación exigida y comisión.
// alto: matrícula obligatoria · medio: antecedentes · bajo: DNI + selfie (validación automática)
export const RUBROS = [
  { id: 'plomeria', nombre: 'Plomería', icono: 'wrench', riesgo: 'medio', comision: 4, precio: [25000, 60000],
    sugerencias: ['Se rompió el flexible del lavatorio', 'Pierde agua la canilla', 'Destapar cañería', 'Pérdida en el depósito del inodoro', 'Cambiar grifería'],
    tags: ['Destapaciones', 'Termotanques', 'Pérdidas', 'Griferías'] },
  { id: 'electricidad', nombre: 'Electricidad', icono: 'plug', riesgo: 'alto', comision: 5, precio: [30000, 90000],
    sugerencias: ['Salta la térmica', 'No anda un enchufe', 'Instalar ventilador de techo', 'Cambiar tablero', 'Sin luz en un ambiente'],
    tags: ['Tableros', 'Disyuntores', 'Iluminación', 'Cableado'] },
  { id: 'gas', nombre: 'Gas', icono: 'flame', riesgo: 'alto', comision: 5, precio: [45000, 150000],
    sugerencias: ['Olor a gas en la cocina', 'Instalar cocina nueva', 'Revisión de calefactor', 'Prueba de hermeticidad', 'Conectar termotanque'],
    tags: ['Artefactos', 'Hermeticidad', 'Calefactores', 'Planos'] },
  { id: 'albanileria', nombre: 'Albañilería', icono: 'brick', riesgo: 'medio', comision: 4, precio: [60000, 250000],
    sugerencias: ['Humedad en una pared', 'Revocar una pared', 'Colocar cerámicos', 'Reparar vereda', 'Levantar un muro'],
    tags: ['Revoques', 'Cerámicos', 'Humedad', 'Contrapisos'] },
  { id: 'pintura', nombre: 'Pintura', icono: 'roller', riesgo: 'bajo', comision: 3, precio: [80000, 300000],
    sugerencias: ['Pintar un dormitorio', 'Pintar rejas', 'Impermeabilizar el techo', 'Pintar el frente'],
    tags: ['Interiores', 'Exteriores', 'Impermeabilización', 'Rejas'] },
  { id: 'jardineria', nombre: 'Jardinería', icono: 'leaf', riesgo: 'bajo', comision: 3, precio: [20000, 60000],
    sugerencias: ['Cortar el pasto', 'Podar un árbol', 'Limpiar el patio', 'Armar canteros'],
    tags: ['Corte de pasto', 'Poda', 'Parquización', 'Riego'] },
  { id: 'limpieza', nombre: 'Limpieza', icono: 'spray', riesgo: 'bajo', comision: 3, precio: [28000, 70000],
    sugerencias: ['Limpieza general 4 h', 'Limpieza final de obra', 'Limpiar vidrios', 'Limpieza post mudanza'],
    tags: ['Por horas', 'Final de obra', 'Vidrios', 'Oficinas'] },
  { id: 'fletes', nombre: 'Fletes', icono: 'truck', riesgo: 'bajo', comision: 3, precio: [35000, 120000],
    sugerencias: ['Mudanza chica', 'Llevar una heladera', 'Retirar escombros', 'Trasladar muebles'],
    tags: ['Mudanzas', 'Con ayudante', 'Escombros', 'Utilitario'] },
  { id: 'cerrajeria', nombre: 'Cerrajería', icono: 'key', riesgo: 'medio', comision: 4, precio: [25000, 70000],
    sugerencias: ['Me quedé afuera', 'Cambiar la cerradura', 'Copia de llaves', 'Arreglar el portón'],
    tags: ['Aperturas', 'Cerraduras', 'Portones', '24 h'] },
  { id: 'aires', nombre: 'Aires', icono: 'snow', riesgo: 'alto', comision: 5, precio: [45000, 180000],
    sugerencias: ['Instalar un split', 'El aire no enfría', 'Carga de gas del aire', 'Limpieza de split'],
    tags: ['Instalación', 'Carga de gas', 'Mantenimiento', 'Inverter'] },
];

export const RIESGO_LABEL = { alto: 'Riesgo alto', medio: 'Riesgo medio', bajo: 'Riesgo bajo' };

export const DOC_TIPOS = {
  dni_frente: 'DNI frente',
  dni_dorso: 'DNI dorso',
  selfie: 'Selfie de validación',
  antecedentes: 'Certificado de antecedentes',
  matricula: 'Matrícula profesional',
};

export function docsRequeridos(riesgo) {
  const base = ['dni_frente', 'dni_dorso', 'selfie'];
  if (riesgo === 'medio') return [...base, 'antecedentes'];
  if (riesgo === 'alto') return [...base, 'antecedentes', 'matricula'];
  return base;
}

// Barrios de Santa Fe capital. x/y en km respecto del Centro (norte = y positivo).
// La ciudad es alargada norte-sur, entre el río Salado (oeste) y la laguna Setúbal (este).
export const BARRIOS = [
  { id: 'centro', nombre: 'Centro', x: 0, y: 0, poly: '136,278 186,276 188,326 134,328' },
  { id: 'sur', nombre: 'Barrio Sur', x: 0.1, y: -1.4, poly: '138,336 190,334 194,384 140,386' },
  { id: 'candioti', nombre: 'Candioti', x: 1.3, y: 0.9, poly: '192,240 238,236 242,286 194,290' },
  { id: 'mariano-comas', nombre: 'Mariano Comas', x: -0.2, y: 1.7, poly: '130,206 182,204 186,256 132,258' },
  { id: 'barranquitas', nombre: 'Barranquitas', x: -1.8, y: 1.0, poly: '62,232 122,230 124,286 64,288' },
  { id: 'constituyentes', nombre: 'Constituyentes', x: 0.3, y: 3.1, poly: '146,146 196,144 198,196 148,198' },
  { id: 'siete-jefes', nombre: 'Siete Jefes', x: 1.7, y: 2.9, poly: '204,152 250,148 252,206 206,208' },
  { id: 'los-hornos', nombre: 'Los Hornos', x: -1.1, y: 4.4, poly: '86,88 144,86 146,140 88,142' },
  { id: 'guadalupe', nombre: 'Guadalupe', x: 2.2, y: 5.2, poly: '214,52 266,48 270,116 218,118' },
];

export const CALLES = {
  'centro': ['San Martín', '25 de Mayo', 'Rivadavia', 'San Jerónimo', '1° de Mayo'],
  'sur': ['San Lorenzo', 'Juan de Garay', 'Mendoza', 'Tucumán', '3 de Febrero'],
  'candioti': ['Bv. Gálvez', 'Marcial Candioti', 'Sarmiento', 'Balcarce', 'Rivadavia'],
  'mariano-comas': ['Castelli', 'Pedro Vittori', 'Iturraspe', 'Gdor. Freyre', 'Mitre'],
  'barranquitas': ['Av. López y Planes', 'Ituzaingó', 'Dr. Zavalla', 'Estrada', 'Pje. Irigoyen'],
  'constituyentes': ['Av. Aristóbulo del Valle', 'Padre Genesio', 'Lavalle', 'Pje. Koch', 'Güemes'],
  'siete-jefes': ['Av. General Paz', 'Javier de la Rosa', 'Alberdi', 'Castellanos', 'Belgrano'],
  'los-hornos': ['Av. Blas Parera', 'Gorostiaga', 'Llerena', 'French', 'E. Zeballos'],
  'guadalupe': ['Av. Galicia', 'Javier de la Rosa', 'Almonacid', 'Laprida', 'Regimiento 12 de Infantería'],
};

export const FRANJAS = { manana: 'Mañana 8–12', tarde: 'Tarde 13–17', noche: 'Noche 18–21' };
export const DIAS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
export const DIAS_LABEL = { lun: 'Lun', mar: 'Mar', mie: 'Mié', jue: 'Jue', vie: 'Vie', sab: 'Sáb', dom: 'Dom' };

export const MEDIOS = {
  efectivo: { label: 'Efectivo', icono: 'cash' },
  transferencia: { label: 'Transferencia', icono: 'bank' },
  mercadopago: { label: 'Mercado Pago', icono: 'wallet' },
  tarjeta: { label: 'Tarjeta guardada', icono: 'card' },
};

export const REVIEW_TAGS_CLIENTE = ['Puntual', 'Prolijo', 'Explicó bien', 'Precio justo', 'Resolvió rápido'];
export const REVIEW_TAGS_PRESTADOR = ['Claro con el problema', 'Pagó en tiempo', 'Buena predisposición', 'Dirección precisa'];

export const MOTIVOS_CANCELACION = ['Ya lo resolví por otro lado', 'Cambié de fecha', 'El precio no me cierra', 'No puedo recibirlo', 'Otro motivo'];
export const MOTIVOS_CANCELACION_PREST = ['No llego en el horario', 'Me surgió otra urgencia', 'Falta de materiales', 'Zona fuera de cobertura', 'Otro motivo'];
export const MOTIVOS_RECHAZO = ['No tengo disponibilidad', 'Fuera de mi zona', 'No es mi especialidad', 'Precio no acordado'];
export const MOTIVOS_OBSERVACION = ['Foto del DNI ilegible', 'La selfie no coincide con el DNI', 'Matrícula vencida o ilegible', 'Falta el dorso del DNI', 'Certificado de antecedentes desactualizado'];
export const MOTIVOS_DISPUTA = ['El trabajo quedó mal hecho', 'El monto no coincide con lo acordado', 'No se presentó', 'Daños en el domicilio', 'Otro'];

// Encuestas del POC (Escalón 5, mayo–junio 2026)
export const ENCUESTAS = {
  prestadores: [
    ['Usaría una app para conseguir más trabajos', 80],
    ['Acepta verificar su identidad', 90],
    ['Necesita conseguir clientes nuevos siempre', 70],
    ['Valora un perfil con historial y calificaciones', 60],
  ],
  clientes: [
    ['Prioriza las reseñas de otros clientes', 80],
    ['Valora la verificación de identidad', 70],
    ['Prefiere pagar en efectivo', 80],
    ['Usa billeteras digitales', 70],
    ['Hoy depende del boca a boca', 60],
  ],
};
