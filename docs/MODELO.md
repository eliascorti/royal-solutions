# Modelo actual del prototipo

Referencia: sección 14 y CU-01 a CU-23 de RoyalSolutions_Final.pdf. Este archivo describe la representación local; no agrega requisitos al documento.

## Estructura

HTML, CSS y módulos JavaScript. Cliente y prestador usan `shell.js`; administración tiene su propio marco. `store.js` concentra mutaciones; `seed.js` genera datos ficticios; `data.js` contiene catálogo y parámetros de ejemplo; `alcance.js` transcribe la tabla documental.

El estado se guarda como JSON en `rs_db`, más versión de esquema, sesiones y preferencias. BroadcastChannel y storage propagan cambios entre pestañas del mismo navegador y origen. No hay API, transacciones remotas ni sincronización entre dispositivos.

Entidades: usuarios, perfiles, documentos, solicitudes, postulaciones, órdenes, pagos, movimientos de comisión, reseñas, reportes, mensajes y notificaciones. Los identificadores y nombres de campos son decisiones técnicas, no nuevos requisitos.

## Estados de orden

| Estado | Fuente | Comportamiento |
|---|---|---|
| Pendiente de confirmación | CU-13 | Se crea al contratar |
| Confirmada | CU-14 | Prestador acepta y reserva franja |
| Rechazada | CU-14 | Motivo y reapertura de solicitud |
| Vencida | CU-14, alternativa 3.b | Falta de respuesta dentro del plazo |
| Cancelada | CU-15 | Participante cancela antes de ejecutar |
| Finalizada | CU-17 | Servicio informado y pago confirmado |
| En revisión | CU-17, alternativa 3.a | Cliente no reconoce el monto |

La orden confirmada conserva ese estado cuando el prestador informa la finalización. `ejecutada` y `montoFinal` representan esa información hasta registrar el pago. Las reseñas y las marcas `calificoCliente`/`calificoPrestador` no crean un estado adicional. No se usa código de inicio ni estados de orden en camino, en curso, calificada o resuelta.

Resolver un reporte registra una decisión y puede ajustar el importe pendiente, pero no acredita dinero automáticamente. El estado del reporte y del pago pertenecen a entidades separadas.

La solicitud permanece abierta mientras recibe postulaciones, se cierra a postulaciones al contratar y puede cancelarse. No se impone el vencimiento de solicitudes a 48 horas: ese plazo no está especificado.

Las claves internas de revisión de altas se presentan como alta incompleta, pendiente de verificación o activa, con detalle de correcciones. Esas claves representan pasos técnicos de la demo; no se presentan como estados normativos definidos por el PDF.

Los pagos se muestran pendientes, pendientes de acreditación, acreditados, rechazados o en revisión. Un comprobante no equivale a dinero recibido.

## Alcance y pendientes

La matriz de 67 entradas toma la columna MVP de la sección 14 como criterio editorial y registra diferencias con RF. Chat, mapas, favoritos, identidad, video y checkout se identifican como alcance completo simulado. Las demás funciones previstas no se añaden mediante botones ficticios.

Límites, plazos, distribución de la comisión entre rubros, cobertura y ejemplos de importes requieren definición del equipo; los valores actuales son de prueba. Credenciales seguras, cifrado documental, push, correo, GPS, tokenización y servicios externos no están implementados realmente.
