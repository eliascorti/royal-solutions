# Requerimientos, matriz de trazabilidad y casos de uso

## 14.2. Requerimientos
| Código | Detalle | Tipo | Módulo | MVP |
| --- | --- | --- | --- | --- |
| RF-31 | Representar el pago del servicio con Mercado Pago con resultado aprobado o rechazado, reintento y referencia local; registrar la comisión una sola vez al acreditar. | Funcional | Pagos | Sí |
| RF-32 | Permitir al administrador consultar comisiones pendientes y registrar una regularización de ejemplo por transferencia o Mercado Pago, total o parcial, sin una billetera en la app prestador. | Funcional | Administración | Sí |
| RF-33 | Permitir a los participantes enviar y leer mensajes vinculados a su orden, mostrando nuevos mensajes y ocultando datos de contacto detectados por reglas locales. | Funcional | Comunicación | Sí |
| RF-34 | Permitir al prestador informar la finalización y el monto final; el cliente confirma el pago o solicita revisión antes del cierre de la orden. | Funcional | Ejecución | Sí |
| RF-35 | Permitir revisar diferencias de importe o acreditación y registrar una resolución; corregir un importe no acredita por sí solo el pago. | Funcional | Administración | Sí |
| RF-36 | Permitir al cliente agregar o quitar prestadores favoritos y consultar su listado. | Funcional | Servicios | Sí |
| RF-37 | Permitir al cliente guardar direcciones con alias, calle y barrio y seleccionar una para la búsqueda y contratación. | Funcional | Usuarios | Sí |
| RF-38 | Permitir configurar las preferencias locales de notificaciones de postulaciones, estados y mensajes. | Funcional | Comunicación | Sí |

## Bloque B - RF-16 a RF-30
| CU | RF-16 | RF-17 | RF-18 | RF-19 | RF-20 | RF-21 | RF-22 | RF-23 | RF-24 | RF-25 | RF-26 | RF-27 | RF-28 | RF-29 | RF-30 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CU-24 |  |  |  |  |  | X |  |  |  |  |  |  |  |  |  |
| CU-25 |  |  |  |  |  | X |  |  |  |  |  |  |  |  |  |
| CU-26 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-27 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-28 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-29 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-30 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-31 |  |  | X |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-32 |  |  |  |  |  |  |  |  | X |  |  | X |  |  |  |
| CU-33 |  |  |  |  |  |  |  |  |  |  |  |  |  | X |  |

## Bloque C - RF-31 a RF-38
| CU | RF-31 | RF-32 | RF-33 | RF-34 | RF-35 | RF-36 | RF-37 | RF-38 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CU-24 | X |  |  |  |  |  |  |  |
| CU-25 |  | X |  |  |  |  |  |  |
| CU-26 |  |  | X |  |  |  |  |  |
| CU-27 |  |  |  | X |  |  |  |  |
| CU-28 |  |  |  |  | X |  |  |  |
| CU-29 |  |  |  |  |  | X |  |  |
| CU-30 |  |  |  |  |  |  | X |  |
| CU-31 |  |  |  |  |  |  |  | X |
| CU-32 |  |  |  |  |  |  |  |  |
| CU-33 |  |  |  |  | X |  |  |  |

### CU-24 - Pagar el servicio mediante Mercado Pago

**Actor principal:** Cliente
**RF asociados:** RF-31, RF-21
**Descripción:** Representar el cobro digital del servicio mediante Mercado Pago.
**Precondiciones:** Orden confirmada y ejecutada, importe reconocido por el cliente y medio Mercado Pago.
**Postcondiciones:** Pago acreditado y orden finalizada, o pago rechazado sin comisión deducida.
**Flujo principal:** 1. Abrir el pago y revisar orden e importe.
2. Acceder a la pasarela representada de Mercado Pago.
3. Simular resultado aprobado o rechazado y asociar una referencia a la orden.
4. Solo al aprobar, registrar una vez cobro, comisión deducida y neto del prestador; finalizar y notificar.
**Flujos alternativos:** 1. Rechazo o abandono: mantener el importe pendiente y permitir reintentar o cambiar de medio antes de acreditar.
2. Respuesta repetida de la misma operación: no duplicar cobro ni comisión. No se utiliza dinero real.
### CU-25 - Registrar regularización interna de comisión

**Actor principal:** Administrador
**RF asociados:** RF-32, RF-21
**Descripción:** Registrar un pago de comisión ya verificado en el contexto local de la POC.
**Precondiciones:** Administrador autenticado y deuda de comisión positiva del prestador.
**Postcondiciones:** Deuda reducida por el importe registrado; movimiento y aviso conservados.
**Flujo principal:** 1. Abrir Comisiones en el panel interno.
2. Elegir prestador y consultar la deuda.
3. Ingresar importe y seleccionar transferencia o Mercado Pago.
4. Registrar el pago de ejemplo; reducir la deuda, conservar el movimiento y notificar al prestador.
**Flujos alternativos:** 1. Pago parcial: conservar el saldo restante.
2. Sin deuda positiva: no registrar.
3. Este formulario representa un pago confirmado; no implementa una pasarela ni un circuito de comprobantes de regularización pendiente. No hay acceso a esta operación desde una billetera del prestador.
### CU-26 - Intercambiar mensajes de una orden

**Actor principal:** Cliente / prestador
**RF asociados:** RF-33
**Descripción:** Conversar dentro de una contratación existente.
**Precondiciones:** Sesión iniciada y participación en la orden.
**Postcondiciones:** Mensaje local registrado y visible para la contraparte.
**Flujo principal:** 1. Abrir Mensajes y elegir la conversación de una orden.
2. Escribir y enviar el mensaje.
3. Aplicar reglas locales de ocultamiento de datos de contacto detectados.
4. Mostrarlo a la contraparte y marcar lectura al abrir el chat.
**Flujos alternativos:** 1. Mensaje vacío: no enviar.
2. Persona ajena a la orden: rechazar acceso al envío.
3. El filtrado es heurístico; no constituye detección infalible de comunicaciones externas. No hay mensajería entre dispositivos fuera del almacenamiento local.
### CU-27 - Informar finalización del servicio

**Actor principal:** Prestador / cliente
**RF asociados:** RF-34
**Descripción:** Informar ejecución e importe final antes del registro de pago, para los tres medios.
**Precondiciones:** Orden confirmada asignada al prestador y servicio ejecutado.
**Postcondiciones:** Ejecución e importe registrados; cliente notificado. La orden permanece confirmada hasta registrar el pago o queda en revisión si hay desacuerdo.
**Flujo principal:** 1. Abrir la orden y seleccionar Finalizar trabajo.
2. Ingresar el importe final.
3. Registrar que el servicio fue ejecutado y pedir al cliente confirmar el monto.
4. Si está conforme, continuar al efectivo (CU-17), transferencia (CU-18) o Mercado Pago (CU-24).
**Flujos alternativos:** 1. Importe inválido o repetición de finalización: impedir el registro duplicado.
2. Desacuerdo del cliente: enviar a revisión administrativa (CU-28).
3. No se exige código de inicio ni se agrega tracking como condición para finalizar.
### CU-28 - Resolver una revisión de importe o pago

**Actor principal:** Administrador, con intervención de cliente/prestador
**RF asociados:** RF-35
**Descripción:** Resolver diferencias de importe o acreditación conservando la distinción entre acuerdo y dinero recibido.
**Precondiciones:** Orden o pago de servicio en revisión.
**Postcondiciones:** Resolución registrada y participantes notificados; importe corregido o pago validado según la evidencia.
**Flujo principal:** 1. Abrir el caso y revisar precio acordado, monto informado, comprobante y versiones.
2. Registrar una observación y decidir si corresponde corregir el importe, mantener pendiente o confirmar una acreditación representada.
3. Si solo se corrige el acuerdo, volver a solicitar el pago o su confirmación sin crear ingresos.
4. Si se confirma una acreditación, continuar con CU-18 o CU-24, según el medio del servicio.
5. Cerrar la revisión y notificar a los participantes.
**Flujos alternativos:** 1. Evidencia insuficiente: mantener el caso pendiente/en revisión.
2. Un ajuste de importe no prueba un cobro; no debe duplicar movimientos previos.
3. Reembolsos reales, seguros, indemnizaciones y penalizaciones automáticas no forman parte de este caso.
### CU-29 - Gestionar favoritos

**Actor principal:** Cliente
**RF asociados:** RF-36
**Descripción:** Guardar prestadores para encontrarlos desde el perfil.
**Precondiciones:** Sesión de cliente y candidato existente.
**Postcondiciones:** Listado actualizado sin generar una contratación.
**Flujo principal:** 1. Abrir la ficha de un prestador.
2. Marcar o desmarcar favorito.
3. Abrir Favoritos desde Perfil y consultar las fichas guardadas.
**Flujos alternativos:** 1. Sin favoritos: mostrar vacío y acceso a búsqueda.
### CU-30 - Guardar y seleccionar direcciones

**Actor principal:** Cliente
**RF asociados:** RF-37
**Descripción:** Mantener domicilios de referencia para buscar y contratar.
**Precondiciones:** Sesión iniciada.
**Postcondiciones:** Dirección agregada o seleccionada para el recorrido.
**Flujo principal:** 1. Abrir Perfil y Direcciones.
2. Ingresar alias, calle y barrio.
3. Guardar y seleccionar una dirección para la búsqueda o contratación.
**Flujos alternativos:** 1. Dirección incompleta: indicar el dato faltante sin guardar. Los domicilios históricos de las órdenes se conservan como copias.
### CU-31 - Configurar notificaciones

**Actor principal:** Cliente
**RF asociados:** RF-38, RF-18
**Descripción:** Ajustar qué eventos generan avisos locales.
**Precondiciones:** Sesión iniciada.
**Postcondiciones:** Preferencias locales guardadas.
**Flujo principal:** 1. Abrir Perfil y Notificaciones.
2. Activar o desactivar postulaciones, estados o mensajes.
3. Guardar la elección y aplicarla a los eventos siguientes.
**Flujos alternativos:** 1. Desactivar un aviso no cancela órdenes ni elimina mensajes. No configura un servicio push externo.
### CU-32 - Editar actividad, zona y disponibilidad

**Actor principal:** Prestador
**RF asociados:** RF-27, RF-24
**Descripción:** Actualizar el servicio y los horarios desde apartados separados del perfil.
**Precondiciones:** Perfil prestador existente y sesión iniciada.
**Postcondiciones:** Configuración guardada; retorno al perfil.
**Flujo principal:** 1. Abrir Rubros y descripción para elegir actividades, especialidades y texto.
2. Guardar cambios sin abrir zona ni horarios.
3. Abrir Zona y disponibilidad para elegir barrios y franjas semanales.
4. Guardar y consultar los compromisos desde la agenda diaria.
**Flujos alternativos:** 1. Sin rubros o sin zona/franjas: mostrar validación y conservar el estado anterior.
2. Un cambio de disponibilidad no elimina una reserva existente. La agenda no muestra franjas no disponibles sin reservas.
### CU-33 - Reportar un problema de una orden

**Actor principal:** Cliente / prestador
**RF asociados:** RF-29, RF-35
**Descripción:** Solicitar revisión del servicio o importe conservando evidencia.
**Precondiciones:** Participante de una orden existente.
**Postcondiciones:** Reporte abierto y administración notificada.
**Flujo principal:** 1. Abrir el detalle y seleccionar Reportar problema o revisión del monto.
2. Indicar motivo y descripción; agregar evidencia si corresponde.
3. Conservar el reporte asociado a la orden y permitir sumar la versión de la contraparte.
4. Administración revisa y resuelve mediante CU-28.
**Flujos alternativos:** 1. Reporte ya abierto: consultar el existente.
2. El reporte no acredita un pago ni devuelve dinero automáticamente.
