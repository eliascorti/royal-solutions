# Royal Solutions — Modelo de datos y máquinas de estado (propuesta v1)

Persistencia: `localStorage`, una clave por colección con prefijo `rs_` (`rs_users`, `rs_requests`, `rs_orders`, …) + `rs_schema_version`, `rs_clock_offset`, `rs_session_<app>`, `rs_theme_<app>`, `rs_onboarding_done_<app>`.
IDs legibles y en mono: `USR-0012`, `PRV-0007`, `SOL-2031`, `ORD-1042`, `PAG-5310`, `DSP-0004`, `DOC-0123`.
Fechas: ISO string. Montos: enteros en ARS (sin centavos).

---

## 1. Entidades

### User (cuenta, común a todos los roles)
| campo | tipo | nota |
|---|---|---|
| id | `USR-xxxx` | |
| email, passwordHash | string | hash simple (no es seguridad real, es demo) |
| nombre, apellido, telefono | string | teléfono nunca se muestra a la contraparte |
| roles | `['cliente'] \| ['prestador'] \| ['cliente','prestador'] \| ['admin']` | |
| estado | `activo \| suspendido \| bloqueado` | bloqueo por DNI replica a otras cuentas con ese DNI. Suspendido no puede loguear (CU-02 2.c) ni publicar (CU-08) |
| dni | string? | único junto con email (CU-01) |
| intentosFallidos, bloqueoLoginHasta | int, date? | 5 intentos → bloqueo temporal 15 min + sugerir recupero (CU-02 2.b) |
| aceptoTerminosEn | date | obligatorio para crear cuenta (CU-01 3.a) |
| prefsNotificaciones | `{postulaciones, estados, mensajes, promos}` | |
| avatarColor | string | avatar = iniciales sobre neutro |
| barrio, direcciones[] | `{id, alias, calle, barrio, lat, lng}` | |
| mediosPago[] | `{id, tipo:'tarjeta'\|'mp', marca, last4, token}` | solo últimos 4 |
| favoritos[] | `PRV-id[]` | |
| ratingComoCliente | `{promedio, cantidad}` | derivado de reviews |
| creadoEn | date | para cohortes |

### ProviderProfile (1:1 con User cuando es prestador)
| campo | tipo | nota |
|---|---|---|
| id | `PRV-xxxx` | |
| userId | ref User | |
| estado | ver máquina **Prestador** | |
| rubros[] | `{rubroId, tags[], matricula?: {numero, vence}}` | |
| nivelVerificacion | `ninguno \| basico \| medio \| alto` | calculado de documentos aprobados |
| barriosCobertura[] | string[] | |
| disponibilidadSemanal | `{lun:[{desde,hasta}], …}` | |
| disponibleAhora | bool | toggle |
| ubicacion | `{lat, lng, barrio}` | |
| rating | `{promedio, cantidad, distribucion:{1..5}}` | derivado |
| trabajosRealizados | int | derivado |
| tiempoRespuestaMin | int | promedio publicación → postulación |
| cancelacionesTardias | int | |
| scorePenalizacion | int | disputas perdidas |
| galeria[] | `{id, rubroId, descripcion, svgSeed}` | |
| observacion | `{motivo, comentario, fecha}?` | cuando está Observado |
| bloqueadoPorDeuda | bool | derivado de deuda vs límite |
| historialEstados[] | `{de, a, actor, fecha, motivo?}` | |

### Document
| campo | tipo | nota |
|---|---|---|
| id | `DOC-xxxx` | |
| providerId | ref | |
| tipo | `dni_frente \| dni_dorso \| selfie \| antecedentes \| matricula` | |
| rubroId | string? | solo matrícula |
| estado | ver máquina **Documento** | |
| archivo | dataURL (foto subida) o `svgSeed` (documento falso generado) | |
| numero, entidadEmisora, vence | string?, string?, date? | matrícula / certificados (CU-07 paso 3) |
| mime, tamanoKB | | valida formato (jpg/png/pdf) y tamaño ≤ 5 MB (CU-07 4.a) |
| motivoRechazo | string? | |
| checklist | `{fotoCoincide, legible, vigente, sinRegistros}` | lo completa admin |

### Rubro (config)
`{id, nombre, icono, riesgo:'alto'|'medio'|'bajo', comisionPct, docsRequeridos[], sugerencias[], precioReferencia:{min,max}}`
- **alto** (gas, electricidad, técnico de aires): DNI + selfie + antecedentes + **matrícula obligatoria** — comisión 5%
- **medio** (plomería, albañilería, cerrajería): DNI + selfie + antecedentes — 4%
- **bajo** (limpieza, jardinería, fletes, pintura): DNI + selfie — 3%

### ServiceRequest (la "changa" publicada)
| campo | tipo | nota |
|---|---|---|
| id | `SOL-xxxx` | |
| clienteId | ref User | |
| rubroId, descripcion, fotos[] | | fotos como dataURL reducido |
| direccion | `{calle, barrio, lat, lng}` | |
| cuando | `{tipo:'asap'} \| {tipo:'programado', fecha, franja:'mañana'\|'tarde'\|'noche'}` | |
| urgente | bool | recargo sugerido +20% |
| presupuestoRef | int? | |
| medioPagoPrevisto | `efectivo \| transferencia \| tarjeta \| mercadopago` | tarjeta = guardada y tokenizada (CU-13 paso 4, CU-19) |
| estado | ver máquina **Solicitud** | |
| venceEn | date | 48 h asap / fecha programada |
| ordenId | ref? | cuando se asigna |
| creadoEn | date | |

### Application (postulación)
`{id:'APL-xxxx', requestId, providerId, precio, mensaje, fechaPropuesta, franja, estado:'activa'|'editada'|'retirada'|'aceptada'|'descartada', distanciaKm (snapshot), creadoEn, editadoEn?}`

### Order
| campo | tipo | nota |
|---|---|---|
| id | `ORD-xxxx` | |
| origen | `postulacion \| directa` | CU-13: se contrata a un postulante **o directo desde el catálogo** |
| requestId?, applicationId?, clienteId, providerId | refs | request/application vacíos si la contratación es directa |
| rubroId, direccion, fechaAcordada, franja | snapshot | |
| precioAcordado | int | |
| montoFinal | int? | lo informa el prestador al finalizar |
| comisionPct, comisionMonto | | congelados al crear la orden |
| medioPago | enum | |
| estado | ver máquina **Orden** | |
| codigoInicio | string(4) | solo visible para el cliente |
| confirmarAntesDe | date | plazo para que el prestador acepte (config, default 15 min) |
| eta | `{minutos, lat, lng, actualizado}` | simulación en camino |
| cancelacion | `{actor, motivo, tardia:bool, fecha}?` | |
| garantiaRoyal | bool | true si pago acreditado dentro de la plataforma |
| timeline[] | `{estado, fecha, actor, texto}` | |
| calificadoPorCliente, calificadoPorPrestador | bool | |
| disputaId | ref? | |

### Payment
`{id:'PAG-xxxx', orderId, medio, monto, comision, total, estado, comprobante? (dataURL), mpResultado?, tarjetaToken?, montoDeclaradoCliente?, montoDeclaradoPrestador?, recordatorioEnviado, historial[]}`
- Transferencia: el cliente transfiere al alias de Royal; al acreditar, se liquida al prestador con la comisión ya deducida (CU-18 paso 5). Sin comprobante → recordatorio (CU-18 3.a).

### PasswordReset (CU-03)
`{token, userId, venceEn (30 min), usado}` — el "email" se muestra en una bandeja simulada dentro de la app. Si el email no existe, mismo mensaje genérico (CU-03 2.a). Al cambiarla se invalidan las sesiones previas.

### CommissionLedger (billetera del prestador)
`{id:'MOV-xxxx', providerId, orderId?, tipo:'ingreso'|'comision_deducida'|'deuda_efectivo'|'pago_deuda'|'ajuste_disputa', monto (+/-), fecha, detalle}`
- Deuda actual = Σ `deuda_efectivo` − Σ `pago_deuda`. Si ≥ `limiteDeuda` (config, $ 15.000) → no puede postularse.

### Review
`{id:'REV-xxxx', orderId, autorId, destinatarioId, rol:'cliente→prestador'|'prestador→cliente', estrellas, tags[], comentario, rubroId, fecha, estado:'publicada'|'reportada'|'dada_de_baja', reporte?:{motivo, por}}`
- Solo se crea si la orden está `finalizada` o `calificada` y el autor participó. Una por autor por orden.

### Dispute
`{id:'DSP-xxxx', orderId, abiertaPor, motivo, descripcion, evidencias[]:{autor, texto, foto?, fecha}, estado:'abierta'|'en_analisis'|'resuelta', resolucion?:{favor:'cliente'|'prestador'|'parcial', montoAjustado, penalizacion, nota, fecha}}`

### Message / Thread
`Thread {id: orderId|requestId+providerId, participantes[], ultimoMensaje, noLeidos:{userId:n}}`
`Message {id, threadId, autorId, texto, textoOriginal? (si se enmascaró), enmascarado:bool, estado:'enviado'|'leido', fecha}`
`typing {threadId, userId, hasta}` (efímero, vía BroadcastChannel)

### Notification
`{id, userId, app:'cliente'|'prestador'|'admin', tipo, titulo, cuerpo, link (hash route), leida, fecha}`

### AuditLog
`{id, fecha, actorId, actorRol, accion ('order.transition', 'provider.approve', …), entidad, entidadId, detalle}`

### Config (singleton)
`{comisionPorRubro, limiteDeuda, plazoConfirmacionMin, nivelPorRubro, barriosHabilitados[], recargoUrgentePct, maxSolicitudesAbiertas (3, CU-08 4.b), plazoCalificacionDias (7, CU-20 2.a), version}`

### Metrics (derivado, no se persiste)
KPIs, embudo y cohortes se calculan en `store.getMetrics(rango)`; los resultados de encuestas del POC son constantes en seed (los 7 del brief + del documento: 60% de clientes depende del boca a boca, 60% de prestadores valora un perfil con historial y calificaciones).

---

## 2. Máquinas de estado

Todas en `store.js` como tabla `{estado: {evento: {to, roles[], guard?}}}`. `transition(entidad, id, evento, actor, payload)` valida → aplica → timeline → notificación a contraparte → audit log → emite evento sync. Transición inválida ⇒ `InvalidTransitionError` ⇒ toast, UI intacta.

### Solicitud
```
abierta ──postulacion──▶ con_postulaciones ──asignar──▶ asignada
   │                         │
   ├──cancelar (cliente)─────┴──▶ cancelada
   └──vencer (tiempo)────────┴──▶ vencida
```
Guard `asignar`: application activa + prestador aprobado y no bloqueado.

### Orden
```
pendiente_confirmacion ─aceptar(prest)─▶ confirmada ─salir(prest)─▶ en_camino ─codigo_ok(prest)─▶ en_curso
        │  rechazar(prest)▶ rechazada                                                              │
        │  vencer(tiempo)▶ vencida                                                        finalizar(prest, monto)
                                                                                                   ▼
             calificada ◀─calificar(ambos)─ finalizada ◀─confirmar(cliente)─ finalizada_pend_cliente

cancelar (cliente|prest) desde: pendiente_confirmacion, confirmada, en_camino → cancelada   (libera la franja, CU-15)
   tardía = en_camino, o < 2 h de la fecha acordada → suma a cancelacionesTardias
   desde en_curso en adelante NO se cancela: se ofrece "Reportar problema" (CU-15 1.a)
rechazar_monto (cliente) desde finalizada_pend_cliente → en_disputa  (se muestra "En revisión", avisa al admin — CU-17 3.a)
abrir_disputa (cliente|prest) desde: en_curso, finalizada_pend_cliente, finalizada → en_disputa
resolver (admin) desde en_disputa → resuelta
```
- `codigo_ok` valida el código de 4 dígitos (3 intentos, luego aviso a soporte).
- `confirmar` exige pago en `acreditado` (efectivo se acredita al confirmar monto; transferencia/MP según su máquina).
- `calificada` cuando existen ambas reviews; si vence el plazo de calificación (7 días) la instancia se cierra y queda sin reseña (CU-20 2.a).
- `aceptar` bloquea la franja en la agenda del prestador (CU-14 paso 4). Al crear la orden se valida que la franja siga libre (CU-13 3.a) y que el prestador siga activo (CU-13 5.a).
- Rechazar requiere motivo; la solicitud vuelve a `con_postulaciones` para elegir otro.

### Pago
```
pendiente ─efectivo_confirmado──────────────▶ acreditado
pendiente ─comprobante_subido──▶ pendiente_acreditacion ─acreditar─▶ acreditado
                                        ├──monto_no_coincide──▶ en_revision ─resolver─▶ acreditado | rechazado
pendiente ─mp_aprobado─▶ acreditado     pendiente ─mp_rechazado─▶ rechazado ─reintentar─▶ pendiente
```
Efecto: efectivo → ledger `deuda_efectivo` (comisión); digital → `ingreso` neto + `comision_deducida`.

### Prestador
```
borrador ─enviar─▶ pendiente_revision ─tomar(admin)─▶ en_revision ─aprobar─▶ aprobado ─suspender─▶ suspendido
                        ▲                                  │ observar ─▶ observado        ▲   reactivar │
                        └──────────reenviar(prest)─────────────────────┘                 └────────────┘
                                                           └ rechazar ─▶ rechazado
```
Guard `enviar`: docs requeridos según el rubro de mayor riesgo cargados. Solo `aprobado` + no bloqueado por deuda ⇒ puede postularse.

### Documento
```
cargado ─revisar─▶ en_revision ─aprobar─▶ aprobado ─vencer(tiempo)─▶ vencido
                        └─rechazar(motivo)─▶ rechazado        (recarga ⇒ nuevo doc en `cargado`)
```
Documento `vencido` de matrícula ⇒ baja nivel de verificación y oculta ese rubro del feed hasta recargar. "Por vencer" = aprobado con vencimiento < 30 días (derivado, no estado).

---

## 3. Trazabilidad con el POC (CU → dónde vive en la demo)

| CU | Qué | Dónde |
|---|---|---|
| CU-01 | Registrar usuario (nombre, apellido, email, teléfono, contraseña, T&C; queda como cliente) | Cliente y Prestador › Registro |
| CU-02 | Iniciar sesión (intentos, suspendida) | Login de las 3 apps |
| CU-03 | Recuperar contraseña (link con vencimiento) | Login › "Olvidé mi contraseña" + bandeja simulada |
| CU-04 | Onboarding una sola vez, con "Saltar" | Cliente y Prestador |
| CU-05 | Editar perfil (email/DNI piden contraseña) | Perfil |
| CU-06 | Alta como prestador desde cuenta cliente | Cliente › Perfil › "Quiero ofrecer mis servicios" → wizard |
| CU-07 | Cargar certificados por rubro (entidad, vencimiento, formato/tamaño) | Prestador › Perfil › Documentos |
| CU-08 | Publicar solicitud (límite de abiertas, sin prestadores en zona) | Cliente › Publicar changa |
| CU-09 | Catálogo por categoría ordenado por cercanía (sin permiso → por valoración + zona manual) | Cliente › Inicio / rubro |
| CU-10 | Buscar y filtrar (valoración, cercanía, tags; relajar filtros) | Cliente › Buscar |
| CU-11 | Postularse (una por solicitud, se edita) | Prestador › Trabajos |
| CU-12 | Perfil del candidato ("Perfil nuevo" visible) | Cliente › Perfil prestador |
| CU-13 | Contratar (postulante o catálogo, fecha/franja, medio de pago) | Cliente › Detalle changa / Perfil prestador › "Contratar" |
| CU-14 | Confirmar/rechazar orden con plazo | Prestador › Órdenes |
| CU-15 | Cancelar orden (motivo, tardía) | Ambas apps › Orden |
| CU-16 | Notificaciones (centro in-app + banner simulado de push) | Las 3 apps |
| CU-17 | Efectivo con comisión diferida (cliente confirma monto) | Orden › Pago + Billetera |
| CU-18 | Transferencia (datos, comprobante, acreditación) | Cliente › Pago; Admin › Órdenes acredita |
| CU-19 | Tarjetas guardadas (tokenización simulada) | Cliente › Perfil › Medios de pago |
| CU-20 | Calificación bidireccional verificada | Ambas apps al finalizar |
| CU-21 | Historial agrupado por estado | Cliente › Mis changas / Prestador › Agenda-Historial |
| CU-22 | Moderar reseñas y reportes | Admin › Reseñas |
| CU-23 | Listado de usuarios | Admin › Usuarios |

Actores externos del POC (push, pasarela de pagos, geolocalización) se simulan en `store.js` como servicios con latencia y posibles fallos controlados (ej. tarjeta terminada en 0000 = rechazada).

**Fuera del MVP según el POC pero pedidos para la demo** (se implementan simulados porque sostienen los 3 diferenciales de la sección 5): chat anti-filtración, tracking del prestador en camino, Mercado Pago, antecedentes, video de validación, bloqueo por DNI, penalización de score, panel admin completo. Lo marcado "–" en el POC que no pedimos (blog, chatbot, referidos, puntos, 2FA, publicidad in-app, vista 360°) queda **afuera**.

## 4. Reloj y tiempo
`store.now()` = `Date.now() + rs_clock_offset`. "Avanzar tiempo 1 hora" suma al offset y corre `store.tick()` (vence órdenes sin confirmar, solicitudes, documentos, actualiza ETA).

## 5. Sync
Cada escritura: `localStorage.setItem` + `BroadcastChannel('rs')` `{tipo:'changed', colecciones[], evento}`. Las vistas se suscriben por colección y re-renderizan. Fallback a evento `storage`. Solo la pestaña "líder" (lock simple en `rs_leader`) corre `tick()` y las respuestas automáticas de chat, para no duplicar.
