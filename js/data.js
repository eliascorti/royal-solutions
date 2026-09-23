// Datos de referencia: rubros, barrios, documentos por nivel de riesgo.

export const SCHEMA_VERSION = 3;
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

// Barrios de Córdoba capital. x/y en km respecto del Centro (norte = y positivo).
export const BARRIOS = [
  { id: 'centro', nombre: 'Centro', x: 0, y: 0, poly: '132,192 172,188 176,226 134,230' },
  { id: 'nueva-cordoba', nombre: 'Nueva Córdoba', x: 0.2, y: -1.6, poly: '140,236 180,232 186,282 138,286' },
  { id: 'guemes', nombre: 'Güemes', x: -1.1, y: -1.3, poly: '96,236 132,236 132,272 98,270' },
  { id: 'alberdi', nombre: 'Alberdi', x: -2.2, y: 0.4, poly: '56,180 126,178 126,224 60,226' },
  { id: 'alta-cordoba', nombre: 'Alta Córdoba', x: 0.6, y: 2.4, poly: '136,106 204,102 206,164 140,168' },
  { id: 'general-paz', nombre: 'General Paz', x: 2.1, y: 0.6, poly: '184,172 246,166 250,216 186,222' },
  { id: 'san-vicente', nombre: 'San Vicente', x: 3.6, y: -1.0, poly: '228,226 296,220 300,268 232,272' },
  { id: 'cerro', nombre: 'Cerro de las Rosas', x: -2.0, y: 5.2, poly: '48,22 136,18 138,88 54,92' },
  { id: 'jardin', nombre: 'Barrio Jardín', x: 1.0, y: -4.8, poly: '150,322 214,318 218,388 154,390' },
];

export const CALLES = {
  'centro': ['27 de Abril', 'Av. Colón', 'Deán Funes', 'San Jerónimo', 'Rivera Indarte'],
  'nueva-cordoba': ['Obispo Trejo', 'Independencia', 'Buenos Aires', 'Chacabuco', 'Rondeau'],
  'guemes': ['Fructuoso Rivera', 'Belgrano', 'Laprida', 'Pueyrredón', 'Achával Rodríguez'],
  'alberdi': ['Duarte Quirós', 'Santa Rosa', 'Av. Colón', 'Caseros', 'Mariano Castex'],
  'alta-cordoba': ['Av. Juan B. Justo', 'Jerónimo Luis de Cabrera', 'Fragueiro', 'Rodríguez Peña', 'Sarmiento'],
  'general-paz': ['25 de Mayo', 'Rosario de Santa Fe', 'Ovidio Lagos', 'Av. Patria', 'Lima'],
  'san-vicente': ['Agustín Garzón', 'Sargento Cabral', 'Entre Ríos', 'San Jerónimo', 'Diego de Torres'],
  'cerro': ['Av. Rafael Núñez', 'Luis de Tejeda', 'José Roque Funes', 'Gregorio Gavier', 'Martín Cartechini'],
  'jardin': ['Av. Richieri', 'Ricardo Rojas', 'Arturo M. Bas', 'Av. Cruz Roja', 'Valparaíso'],
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
