# Modelo lógico revisado

Fuente estructurada: `docs/poc/modelo.py`. Las aplicaciones mantienen objetos JSON en localStorage; el DER no es una migración ejecutada.

# 16.2. Diccionario de entidades y correspondencia
| Entidad | Origen en la POC | Claves y atributos |
| --- | --- | --- |
| USUARIO | users | PK id; UK email; DNI si informado; nombre; apellido; telefono; credencial_local; roles; estado; preferencias; creado_en |
| PRESTADOR | providers | PK id; FK UK usuario_id; descripcion; tags; estado; disponible; coordenadas_base |
| RUBRO | RUBROS + config | PK id; nombre; especialidades; comision_pct_interna; requisitos_documentales |
| PRESTADOR_RUBRO | providers[].rubros | PK FK prestador_id; PK FK rubro_id |
| BARRIO | BARRIOS | PK id; nombre; x; y |
| COBERTURA | providers[].barrios | PK FK prestador_id; PK FK barrio_id |
| DISPONIBILIDAD | providers[].disponibilidad | PK FK prestador_id; PK dia_semana; PK franja |
| DOCUMENTO | documents | PK id; FK prestador_id; FK rubro_id (opcional); tipo; numero; entidad; vence; archivo; estado; motivo |
| DIRECCION | users[].direcciones | PK id_logico; FK usuario_id; FK barrio_id; alias; calle; x; y; id_local dentro del usuario |
| SOLICITUD | requests | PK id; FK cliente_id; FK rubro_id; descripcion; domicilio_copia; urgente; fecha; franja; presupuesto_ref; estado |
| FOTO_SOLICITUD | requests[].fotos | PK FK solicitud_id; PK posicion; archivo |
| POSTULACION | applications | PK id; FK solicitud_id; FK prestador_id; precio; mensaje; fecha; franja; UK solicitud + prestador |
| ORDEN | orders | PK id; FK cliente_id; prestador_id; FK rubro_id; FK solicitud_id (opcional); FK postulacion_id (opcional); domicilio_copia; fecha; franja; precio; monto_final; estado; comision_pct; ejecutada |
| PAGO | payments | PK id; FK UK orden_id; medio; monto; comision; estado; referencia; comprobante; historial |
| MOVIMIENTO | ledger | PK id; FK prestador_id; FK orden_id (opcional); tipo; monto; fecha; detalle |
| RESENA | reviews | PK id; FK orden_id; FK autor_id; destinatario_id; puntuacion; comentario; tags; estado; fecha; UK orden + autor |
| REPORTE | disputes | PK id; FK orden_id; FK autor_id; motivo; descripcion; estado; resolucion; fecha |
| EVIDENCIA | disputes[].evidencias | PK id_logico; FK reporte_id; FK autor_id; texto; foto; fecha |
| DENUNCIA_RESENA | reviews[].reporte / moderacion | PK FK resena_id; FK denunciante_id; motivo; fecha; decision; observacion |
| MENSAJE | messages | PK id; FK orden_id; FK emisor_id; texto; ocultado; leido; fecha |
| NOTIFICACION | notifications | PK id; FK usuario_id; app; tipo; titulo; cuerpo; ruta_destino; leida; fecha |
| TARJETA | users[].tarjetas | PK id; FK usuario_id; marca; ultimos_4; vencimiento; token_ficticio |
| FAVORITO | users[].favoritos | PK FK cliente_id; PK FK prestador_id |
| RECUPERACION | resets | PK token; FK usuario_id; vence; usado |
| AUDITORIA | audit | PK id; FK actor_id (opcional); rol; accion; entidad; entidad_id; detalle; fecha |

## 16.3. Relaciones y cardinalidades
La columna Hijos por padre indica cuántos registros del hijo corresponden a un registro del padre. FK opcional = cada hijo puede tener cero o un padre; FK obligatoria = cada hijo tiene exactamente uno.
| Padre | Hijo / clave foránea | Hijos por padre | FK |
| --- | --- | --- | --- |
| USUARIO | PRESTADOR / usuario_id | 0..1 | Obligatoria |
| USUARIO | DIRECCION / usuario_id | 0..N | Obligatoria |
| BARRIO | DIRECCION / barrio_id | 0..N | Obligatoria |
| PRESTADOR | PRESTADOR_RUBRO / prestador_id | 0..N | Obligatoria |
| RUBRO | PRESTADOR_RUBRO / rubro_id | 0..N | Obligatoria |
| PRESTADOR | COBERTURA / prestador_id | 0..N | Obligatoria |
| BARRIO | COBERTURA / barrio_id | 0..N | Obligatoria |
| PRESTADOR | DISPONIBILIDAD / prestador_id | 0..N | Obligatoria |
| PRESTADOR | DOCUMENTO / prestador_id | 0..N | Obligatoria |
| RUBRO | DOCUMENTO / rubro_id | 0..N | Opcional |
| USUARIO | SOLICITUD / cliente_id | 0..N | Obligatoria |
| RUBRO | SOLICITUD / rubro_id | 0..N | Obligatoria |
| SOLICITUD | FOTO_SOLICITUD / solicitud_id | 0..N | Obligatoria |
| SOLICITUD | POSTULACION / solicitud_id | 0..N | Obligatoria |
| PRESTADOR | POSTULACION / prestador_id | 0..N | Obligatoria |
| USUARIO | ORDEN / cliente_id | 0..N | Obligatoria |
| PRESTADOR | ORDEN / prestador_id | 0..N | Obligatoria |
| RUBRO | ORDEN / rubro_id | 0..N | Obligatoria |
| SOLICITUD | ORDEN / solicitud_id | 0..N | Opcional |
| POSTULACION | ORDEN / postulacion_id | 0..N | Opcional |
| ORDEN | PAGO / orden_id | 0..1 | Obligatoria |
| PRESTADOR | MOVIMIENTO / prestador_id | 0..N | Obligatoria |
| ORDEN | MOVIMIENTO / orden_id | 0..N | Opcional |
| ORDEN | RESENA / orden_id | 0..2 | Obligatoria |
| USUARIO | RESENA / autor_id | 0..N | Obligatoria |
| USUARIO | RESENA / destinatario_id | 0..N | Obligatoria |
| ORDEN | REPORTE / orden_id | 0..N | Obligatoria |
| USUARIO | REPORTE / autor_id | 0..N | Obligatoria |
| REPORTE | EVIDENCIA / reporte_id | 0..N | Obligatoria |
| USUARIO | EVIDENCIA / autor_id | 0..N | Obligatoria |
| RESENA | DENUNCIA_RESENA / resena_id | 0..1 | Obligatoria |
| USUARIO | DENUNCIA_RESENA / denunciante_id | 0..N | Obligatoria |
| ORDEN | MENSAJE / orden_id | 0..N | Obligatoria |
| USUARIO | MENSAJE / emisor_id | 0..N | Obligatoria |
| USUARIO | NOTIFICACION / usuario_id | 0..N | Obligatoria |
| USUARIO | TARJETA / usuario_id | 0..N | Obligatoria |
| USUARIO | FAVORITO / cliente_id | 0..N | Obligatoria |
| PRESTADOR | FAVORITO / prestador_id | 0..N | Obligatoria |
| USUARIO | RECUPERACION / usuario_id | 0..N | Obligatoria |
| USUARIO | AUDITORIA / actor_id | 0..N | Opcional |

## 16.4. Reglas de integridad
- Cada usuario puede tener cero o un perfil prestador; usuario_id es único en PRESTADOR. Un alta en borrador puede no tener rubros ni horarios; aprobarla requiere completar los datos y documentos.
- PRESTADOR_RUBRO, COBERTURA y DISPONIBILIDAD evitan repetir la misma combinación de claves. La disponibilidad mínima para operar es una franja y una zona.
- POSTULACION tiene una sola fila por solicitud y prestador; una edición actualiza la existente. Tras rechazo o vencimiento puede existir una nueva contratación del mismo vínculo; se conserva el historial y se permite solo una orden activa por solicitud.
- Una ORDEN directa no necesita solicitud ni postulación. Si informa postulación, esta debe pertenecer a la solicitud y al prestador de la orden; el cliente y rubro deben coincidir. No se puede contratar al propio perfil.
- El domicilio de SOLICITUD y ORDEN se guarda como copia histórica, con barrio, calle y coordenadas; no depende de cambios posteriores a DIRECCION. Los identificadores locales d1/d2 de la POC solo son únicos dentro del usuario.
- Una ORDEN puede tener cero o un PAGO local. Rechazo y reintento actualizan ese pago y su historial; no crean cobros duplicados. Las comisiones se registran una sola vez al acreditar.
- MOVIMIENTO con orden_id nulo representa una regularización global de comisión, no un cobro de servicio. El registro interno conserva deuda y deducciones; no implica la existencia de una billetera del prestador.
- RESENA: puntuación entera entre 1 y 5; autor y destinatario deben ser las contrapartes de una orden finalizada. UNIQUE(orden_id, autor_id) admite como máximo dos reseñas. El código de la orden es interno y no se muestra en la reputación del prestador.
- Los mensajes y reportes exigen participación en la orden. EVIDENCIA pertenece a un reporte y a su autor. Una denuncia de reseña se distingue del reporte del servicio.
- NOTIFICACION conserva usuario, aplicación y ruta de destino; su vínculo con una pantalla no se modela como una FK de orden porque puede apuntar también al perfil, documentos o solicitudes.
- RECUPERACION tiene token de un solo uso y vencimiento. TARJETA conserva únicamente referencia de prueba y últimos cuatro dígitos. AUDITORIA permite actor nulo para eventos del sistema; entidad_id es referencia de auditoría, no una FK polimórfica ficticia.
- La versión de navegador conserva arreglos, historiales y atributos anidados en JSON. Este DER explicita sus relaciones y propone claves normalizadas para una futura base; no ejecuta una migración ni garantiza integridad de una BD todavía inexistente.
## 16.5. Correspondencia con los casos de uso
| Datos | Casos |
| --- | --- |
| Usuario, prestador y recuperación | CU-01 a CU-07 / CU-23 / CU-32 |
| Rubro, cobertura, disponibilidad y documento | CU-06 / CU-07 / CU-09 a CU-14 / CU-21 / CU-32 |
| Solicitud, fotografías, postulación y orden | CU-08 / CU-11 / CU-13 a CU-15 / CU-21 / CU-27 |
| Pago y movimiento interno | CU-17 / CU-18 / CU-24 / CU-25 / CU-27 / CU-28 |
| Reseña, denuncia, reporte y evidencia | CU-20 / CU-22 / CU-28 / CU-33 |
| Mensaje y notificación | CU-16 / CU-26 / CU-31 |
| Tarjeta, favorito y dirección | CU-19 / CU-29 / CU-30 |
| Auditoría y atributos de historial | Operaciones de cuenta, orden, pago, alta y moderación |
