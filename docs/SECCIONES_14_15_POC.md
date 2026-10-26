# 14. Alcance completo del proyecto y recorte de la POC

Revisión funcional del 26 de octubre de 2026. Las secciones anteriores de contexto, introducción, investigación, encuestas y sus gráficos se conservan sin modificaciones. Esta revisión actualiza exclusivamente alcance, requerimientos, reglas de los recorridos, actores, casos de uso y trazabilidad.

## 14.1. Qué se presenta: POC, MVP y proyecto completo

La entrega académica es una prueba de concepto (POC): representa la factibilidad y coherencia del recorrido entre cliente, prestador y administración. Su recorte funcional corresponde a un MVP avanzado de demostración. No se presenta como una plataforma lista para operar ni como evidencia nueva de validación de mercado.

MVP designa las capacidades seleccionadas para el recorrido central. POC indica el nivel de ejecución de esta entrega: datos, documentos, pagos y servicios externos de ejemplo. Alcance completo reúne ese recorte y las capacidades futuras previstas. En esta revisión, las filas marcadas POC y todos los RF-01 a RF-35 pertenecen al mismo recorte funcional, sin marcas contradictorias entre tablas.

El recorrido central comprende: cuenta y perfil; alta del prestador con cobertura y disponibilidad; publicación o consulta de candidatos; postulación y contratación; confirmación o rechazo; ejecución e importe; pago por efectivo, transferencia o Mercado Pago; comisión, reputación e historial. También se representa la regularización de la comisión pendiente que genera el efectivo.

Las integraciones reales de Mercado Pago, banco, correo, push, identidad, cifrado y GPS no se presumen implementadas. Se representan sus entradas, resultados y efectos locales. La operación real requerirá desarrollo, verificación y definiciones técnicas adicionales. La matriz especifica requisitos; no certifica por sí sola que una versión del software ya los cumple.

## 14.1.1. Funcionalidades seleccionadas y evolución futura

POC = incluido como interacción o simulación de esta entrega. Futuro = parte de la visión del proyecto, excluido del recorrido obligatorio de demostración. Un mapa esquemático o una agenda son representaciones de una función ya vinculada a sus RF, no nuevas integraciones externas.

| Módulo | Funcionalidad | Recorte | RF |
| --- | --- | --- | --- |
| Usuarios | Registro de cliente y alta posterior como prestador | POC | RF-01, RF-26 |
| Usuarios | Acceso por credenciales y cierre de sesión local | POC | RF-02 |
| Usuarios | Recupero de contraseña con correo representado | POC | RF-03 |
| Usuarios | Bienvenida inicial y edición del perfil | POC | RF-04, RF-05 |
| Usuarios | 2FA, gestión de sesiones entre dispositivos y preferencias avanzadas de notificación | Futuro | - |
| Confianza | Carga, revisión y corrección de certificados y matrícula | POC | RF-06, RF-28 |
| Confianza | Representación de documentos de identidad de ejemplo dentro del alta | POC | RF-26, RF-28 |
| Confianza | Validación real de identidad, consulta externa de antecedentes y biometría de video | Futuro | - |
| Confianza | Niveles automáticos de verificación y gestión avanzada de bloqueos por DNI | Futuro | - |
| Servicios | Publicación de solicitudes con descripción, zona, urgencia y fotos opcionales | POC | RF-07 |
| Servicios | Catálogo, categorías, búsqueda y filtros de valoración, cercanía y tags | POC | RF-08, RF-09, RF-10, RF-11 |
| Servicios | Mapa esquemático como ayuda visual para seleccionar zonas y consultar ejemplos | POC | RF-08, RF-27 |
| Servicios | Mapa real de trabajos en tiempo real y ubicación GPS del dispositivo | Futuro | - |
| Servicios | Favoritos, slider de novedades, destacados y ofertas especiales | Futuro | - |
| Contratación | Postulación con precio y mensaje; revisión y comparación de candidatos | POC | RF-12, RF-13 |
| Contratación | Contratación directa o desde postulación, con fecha y horario | POC | RF-14, RF-15 |
| Contratación | Confirmación, rechazo, vencimiento sin respuesta y cancelación | POC | RF-16, RF-17 |
| Contratación | Preferencia de atención lo antes posible o programada, concretando fecha/franja al contratar | POC | RF-07, RF-12, RF-14, RF-15 |
| Ejecución | Informar finalización, confirmar monto y registrar revisiones | POC | RF-34, RF-35 |
| Seguimiento | Prestador en camino, tracking GPS y seguimiento de desplazamiento | Futuro | - |
| Comunicación | Centro de notificaciones y avisos locales de eventos | POC | RF-18 |
| Comunicación | Push real entre dispositivos, chat anti-filtración, soporte en línea, blog y chatbot | Futuro | - |
| Pagos | Efectivo del cliente al prestador con comisión diferida | POC | RF-19, RF-21 |
| Pagos | Transferencia del servicio con comprobante y acreditación representada | POC | RF-20, RF-21 |
| Pagos | Mercado Pago para el servicio, con aprobación, rechazo y espera simulados | POC | RF-31, RF-21 |
| Pagos | Referencias de tarjetas guardadas de prueba | POC | RF-22 |
| Pagos | Cobro directo con tarjeta como medio independiente, tokenización y pasarelas reales | Futuro | - |
| Comisiones | Billetera como resumen de cobros y comisiones, sin dinero disponible para retirar | POC | RF-32 |
| Comisiones | Regularizar deuda por transferencia o Mercado Pago, con acreditación representada | POC | RF-33, RF-21 |
| Comisiones | Retiros, recargas, envíos de dinero y recepción física de efectivo por Royal | Futuro | - |
| Reputación | Calificación bidireccional y reseñas de participantes de órdenes finalizadas | POC | RF-23, RF-25 |
| Historial | Mis órdenes e historial por estado y fecha; agenda Día/Semana del prestador | POC | RF-24 |
| Reputación | Penalización automática de score, puntos y referidos con descuentos | Futuro | - |
| Alta de prestador | Rubro, descripción, tags, cobertura, disponibilidad semanal y documentación | POC | RF-26, RF-27, RF-28 |
| Alta de prestador | Galería 360° y encuestas de satisfacción posteriores al servicio | Futuro | - |
| Administración | Panel mínimo para usuarios, altas/certificados, órdenes, reseñas y revisiones de pagos | POC | RF-06, RF-29, RF-30, RF-35 |
| Administración | Verificar regularizaciones y consultar movimientos de comisión | POC | RF-33, RF-32 |
| Administración | Administración ampliada, publicidad in-app y tutoriales audiovisuales | Futuro | - |
| Garantía | Fondo común de garantía, seguros, indemnizaciones y fee de mediación | Futuro | - |

## 14.1.2. Recorridos coherentes por actor

| Actor | Recorrido | Casos de uso |
| --- | --- | --- |
| Cliente | Registro, acceso, recupero y perfil | CU-01 a CU-05 |
| Cliente | Catálogo, búsqueda, candidato y solicitud | CU-08 / CU-09 / CU-10 / CU-12 |
| Prestador | Alta, documentos y postulación | CU-06 / CU-07 / CU-11 |
| Ambos | Contratación, confirmación/rechazo y cancelación | CU-13 / CU-14 / CU-15 |
| Prestador y cliente | Informar ejecución y confirmar importe | CU-27 |
| Cliente | Efectivo, transferencia o Mercado Pago del servicio | CU-17 / CU-18 / CU-24 |
| Prestador | Resumen de cobros/comisiones y regularización de deuda | CU-25 / CU-26 |
| Ambos | Reseñas y consulta de órdenes/agenda/historial | CU-20 / CU-21 |
| Administrador | Usuarios, moderación y revisión de importes/pagos | CU-23 / CU-22 / CU-28 |

El cliente registra el pago del servicio y el prestador registra la regularización de una deuda de comisión. Son operaciones diferentes, con pagadores y destinatarios diferentes. Ambas deben conservar su referencia y sus efectos independientes.

## 14.1.3. Disponibilidad, pagos y reglas compartidas

### Disponibilidad y agenda

- La disponibilidad expresa días y franjas en que el prestador ofrece servicios. Enviar un alta requiere al menos una zona y una franja; una configuración vacía deja el alta incompleta, sin suspender la cuenta cliente.
- Las franjas no seleccionadas se consideran no disponibles. Una franja reservada por una orden confirmada se considera ocupada. Son condiciones de agenda, no estados de bloqueo de la persona.
- Día y Semana son vistas del mismo conjunto de órdenes; filtran o agrupan por fecha. El historial agrega el criterio de estado y conserva órdenes finalizadas, canceladas, rechazadas y vencidas.
- Una propuesta o contratación valida disponibilidad y solapamiento, y la aceptación vuelve a comprobarlos. Un cambio posterior de disponibilidad no cancela por sí solo una orden ya confirmada.
- La preferencia Lo antes posible no elimina el acuerdo de fecha y horario ni garantiza atención inmediata. El mapa de zona es esquemático; no demuestra seguimiento real.
### Pago del servicio y dinero de cada parte

- El cliente abona el precio acordado del servicio. La comisión de Royal, del 3-5%, está a cargo del prestador; no se añade silenciosamente un cargo extra al cliente.
- Efectivo: el cliente entrega el dinero al prestador; Royal registra únicamente su comisión pendiente. Royal no recibe ese efectivo ni lo muestra como saldo propio.
- Transferencia o Mercado Pago: se representa el cobro digital del servicio en el circuito de Royal. Se registran el bruto, la comisión deducida y el neto correspondiente al prestador. La liquidación bancaria efectiva se deja para una integración posterior.
- Ejemplo exclusivamente ilustrativo: servicio de $30.000 al 4%, comisión de $1.200 y neto económico de $28.800. En efectivo, el prestador recibe $30.000 y adeuda $1.200; en digital, se representa la deducción de $1.200.
- Para mantener el circuito acotado, la POC registra pagos después de informar la ejecución y reconocer el monto. No incluye anticipos, retenciones, garantías ni un proceso de reembolso real.
### Regularización de comisiones

- Es una operación distinta del pago del servicio: el prestador es quien paga, Royal es el destinatario y el importe cancela deuda de comisión previa.
- Los medios previstos en esta revisión son transferencia y Mercado Pago. El efectivo se acepta para el servicio entre cliente y prestador; no existe un circuito de entrega física de efectivo a Royal.
- Un comprobante cargado deja la regularización pendiente. La transferencia requiere verificación representada por el administrador; MP requiere un resultado aprobado representado. Antes de acreditar no se reduce la deuda.
- Cada acreditación descuenta una sola vez el importe validado. Un pago parcial conserva el saldo restante; el importe a regularizar no supera la deuda pendiente.
- Si se configura un límite de deuda, alcanzarlo o superarlo restringe nuevas postulaciones, no la consulta de órdenes ni la regularización. La restricción termina al quedar por debajo del límite.
### Significado de la billetera

- Billetera es el nombre de una vista de cobros y comisiones del prestador. Se distinguen cobros brutos, comisión deducida, comisión por efectivo pendiente y pagos de regularización.
- Los resúmenes mensuales son sumatorias de movimientos de ejemplo, no evidencia de ingresos reales del proyecto. Esta pantalla no ofrece retiros, recargas ni transferencias entre usuarios.
### Parámetros de demostración

- La tasa exacta por rubro dentro del rango 3-5%, el límite de deuda, los plazos de confirmación, los formatos/tamaños documentales, las franjas y el máximo de solicitudes son parámetros identificables de prueba; no resultados de las encuestas ni condiciones comerciales ya validadas.
- La configuración de ejemplo puede usar 15 minutos de confirmación, deuda límite de $15.000 y tres solicitudes abiertas. Estos valores son modificables para ensayar alternativas y no se presentan como decisiones respaldadas por investigación.
- Cualquier política productiva de sanción, cancelación tardía o vencimiento de reseñas deberá acordarse y documentarse antes de operar; no se infiere una fórmula de score de esas configuraciones.
## 14.1.4. Estados y condiciones de cierre

| Estado de la orden | Significado | Origen |
| --- | --- | --- |
| Pendiente de confirmación | Cliente contrató; falta la decisión del prestador. | CU-13 |
| Confirmada | Prestador aceptó. La ejecución y el monto informado son datos de esta orden hasta confirmar el pago. | CU-14 / CU-27 |
| Rechazada | Prestador rechazó con motivo; se reabre la solicitud vinculada. | CU-14 |
| Vencida | Faltó respuesta dentro del plazo de demostración configurado. | CU-14 |
| Cancelada | Una parte canceló antes de ejecutar; se libera la franja. | CU-15 |
| En revisión | Existe una diferencia de monto o pago que requiere decisión administrativa. | CU-17 / CU-18 / CU-28 |
| Finalizada | Servicio ejecutado y pago reconocido/acreditado; se habilita calificar. | CU-17 / CU-18 / CU-24 |

Informar finalización no agrega un estado de orden: se registran ejecución y monto y se mantiene Confirmada hasta el pago, o se deriva a En revisión. Calificar tampoco cambia Finalizada por un estado nuevo. No se exige un código de inicio ni estados de desplazamiento para el cierre del servicio.

Solicitud: abierta, cerrada a postulaciones al contratar o cancelada; el rechazo/vencimiento de la orden puede reabrirla. No se fija un vencimiento automático de solicitud sin una política configurada.

Pago del servicio y regularización: pendiente, pendiente de acreditación cuando se adjunta transferencia, acreditado, rechazado o en revisión. Aprobado en MP corresponde a acreditado dentro de la representación. El rechazo de un pago permite reintento y no rechaza por sí solo la orden.

Alta: incompleta, pendiente de verificación o activa. La revisión documental puede exigir correcciones. Ausencia de horario y franja ocupada no son suspensiones de cuenta. Un reporte puede quedar pendiente, en revisión o resuelto; su resolución no acredita dinero automáticamente.

Solo después de reconocer/acreditar el pago del servicio se finaliza la orden y se habilita una reseña por participante. Los movimientos de cobro, comisión y regularización deben registrarse una sola vez por operación reconocida, incluso si se repite una confirmación.

# 14.2. Requerimientos funcionales del MVP/POC

Se conservan RF-01 a RF-30 para mantener las referencias históricas y se aclara su redacción. RF-31 a RF-35 completan Mercado Pago, resumen de comisiones, regularización, finalización común y revisión administrativa. Todos están incluidos en la POC; su ejecución externa real queda fuera de esta entrega.

| Código | Módulo | Requerimiento | POC |
| --- | --- | --- | --- |
| RF-01 | Usuarios | Permitir el registro de una cuenta de cliente y su posterior alta como prestador, validando los datos obligatorios, la aceptación de términos y la unicidad del email. | Sí |
| RF-02 | Usuarios | Permitir el inicio de sesión y el acceso a las pantallas correspondientes al rol; representar errores de credenciales, cuenta suspendida y bloqueo temporal por intentos fallidos. | Sí |
| RF-03 | Usuarios | Permitir restablecer la contraseña mediante un enlace de un solo uso con vencimiento e invalidar las sesiones anteriores del usuario. | Sí |
| RF-04 | Usuarios | Mostrar una bienvenida inicial que pueda completarse u omitirse y registrar esa elección. | Sí |
| RF-05 | Usuarios | Permitir consultar y editar los datos del perfil, validar sus formatos y solicitar confirmación de contraseña para cambios de email o DNI. | Sí |
| RF-06 | Confianza | Permitir cargar certificados del rubro con entidad emisora y vencimiento, validar formato/tamaño y representar su revisión, rechazo y recarga. | Sí |
| RF-07 | Servicios | Permitir publicar una solicitud con categoría, descripción, zona/dirección y urgencia, y adjuntar fotos opcionales. | Sí |
| RF-08 | Servicios | Mostrar el catálogo de prestadores activos por categoría, ordenado por cercanía calculada sobre la zona o coordenadas de ejemplo seleccionadas. | Sí |
| RF-09 | Servicios | Listar las categorías disponibles y permitir acceder a sus prestadores y solicitudes relacionadas. | Sí |
| RF-10 | Servicios | Buscar prestadores y categorías por oficio, nombre o texto relacionado con el servicio. | Sí |
| RF-11 | Servicios | Filtrar prestadores por valoración, cercanía y tags, permitiendo limpiar los criterios y comprender los resultados vacíos. | Sí |
| RF-12 | Contratación | Permitir al prestador postularse con precio, mensaje y fecha/franja propuesta; actualizar la postulación existente sin duplicarla. | Sí |
| RF-13 | Contratación | Mostrar perfil, rubros, disponibilidad, certificados, historial y reseñas del candidato; identificar los perfiles nuevos sin atribuirles trabajos previos. | Sí |
| RF-14 | Contratación | Permitir acordar fecha y franja horaria dentro de la disponibilidad del prestador y evitar superponer órdenes confirmadas. | Sí |
| RF-15 | Contratación | Permitir contratar desde una postulación o desde el catálogo, confirmando descripción, domicilio, fecha, precio y medio previsto: efectivo, transferencia o Mercado Pago. | Sí |
| RF-16 | Contratación | Permitir al prestador confirmar o rechazar una orden; registrar el motivo de rechazo, reservar la franja al confirmar y reabrir la solicitud cuando corresponda. | Sí |
| RF-17 | Contratación | Permitir a cualquiera de las partes cancelar una orden antes de la ejecución del servicio, registrando actor, motivo y liberación de la franja. | Sí |
| RF-18 | Comunicación | Generar notificaciones sobre solicitudes, postulaciones, confirmaciones, cancelaciones, pagos y reseñas, con destinatario y acceso al evento asociado. | Sí |
| RF-19 | Pagos | Registrar el pago del cliente al prestador en efectivo con confirmación del cliente y generar la comisión diferida como deuda del prestador con Royal Solutions. | Sí |
| RF-20 | Pagos | Registrar el pago del servicio por transferencia, su comprobante, la acreditación o revisión por diferencia de monto y la comisión correspondiente. | Sí |
| RF-21 | Pagos | Calcular una comisión a cargo del prestador dentro del rango 3-5%; registrarla como deuda en efectivo o deducción en pagos digitales, evitando movimientos duplicados. | Sí |
| RF-22 | Pagos | Representar el alta, consulta y eliminación de referencias de tarjetas de prueba, mostrando únicamente sus últimos dígitos. Esto no incorpora un cuarto medio de cobro independiente. | Sí |
| RF-23 | Reputación | Permitir que cliente y prestador califiquen a la contraparte una vez finalizada la orden, con puntuación y comentario opcional. | Sí |
| RF-24 | Historial | Consultar las órdenes propias por estado y fecha. El prestador podrá visualizarlas como agenda de día o semana y como historial; esas vistas no cambian el estado de las órdenes. | Sí |
| RF-25 | Reputación | Permitir reseñas solamente a los participantes de una orden finalizada, una por autor y orden, y recalcular la reputación cuando se modere una reseña. | Sí |
| RF-26 | Alta de prestador | Habilitar el alta de prestador desde una cuenta cliente y mostrar su condición de incompleta, pendiente de verificación o activa. | Sí |
| RF-27 | Alta de prestador | Cargar rubros, tags, descripción, zonas de cobertura y disponibilidad semanal por días y franjas, y permitir su actualización sin suspender la cuenta por una edición incompleta. | Sí |
| RF-28 | Alta de prestador | Solicitar matrícula cuando el rubro configurado la requiera y evitar habilitar ese rubro sin la documentación necesaria. | Sí |
| RF-29 | Administración | Permitir revisar reseñas y reportes de usuarios, registrar una observación y aprobar o dar de baja el contenido según la decisión administrativa. | Sí |
| RF-30 | Administración | Listar, buscar y filtrar usuarios por perfil, estado y rubro, y acceder a su ficha y órdenes asociadas. | Sí |
| RF-31 | Pagos | Representar el pago del servicio con Mercado Pago y sus resultados pendiente, aprobado y rechazado; registrar la comisión y referencia de la operación una sola vez. | Sí |
| RF-32 | Comisiones | Permitir al prestador consultar una vista de cobros registrados, comisiones deducidas y deuda por efectivo, con movimientos vinculados a las órdenes. | Sí |
| RF-33 | Comisiones | Permitir regularizar la deuda de comisión mediante transferencia o Mercado Pago y disminuirla únicamente al confirmar la acreditación del pago, admitiendo pagos parciales y evitando descuentos duplicados. | Sí |
| RF-34 | Ejecución | Permitir al prestador informar la finalización del servicio y el monto final para cualquiera de los tres medios; solicitar confirmación o revisión al cliente antes de cerrar la orden. | Sí |
| RF-35 | Administración | Permitir al administrador revisar diferencias de monto o acreditación, registrar una resolución y corregir el importe pendiente sin generar una acreditación inexistente. | Sí |

## 14.3. Criterios de coherencia de la demostración

- Toda función incluida en el recorte tiene al menos un RF y un CU asociado. Una vista visual adicional, como Día/Semana, se vincula al CU existente que representa.
- Los tres medios previstos para pagar el servicio son efectivo, transferencia y Mercado Pago. Gestionar referencias de tarjetas no incorpora un cobro directo con tarjeta independiente.
- Cliente y prestador observan la misma orden y el mismo importe. Una corrección administrativa se informa a ambos antes de continuar el pago.
- La comisión por efectivo es deuda del prestador; la comisión digital es una deducción del cobro representado. No se suman las dos para una misma operación.
- Una transferencia adjuntada y un resultado MP pendiente no son acreditaciones. La deuda o el neto solo cambian al representar una confirmación válida.
- Los documentos y los ejemplos de la POC son ficticios. Los gráficos y conclusiones de las encuestas anteriores no se recalculan ni se reinterpretan como resultados nuevos.
# 15. Casos de uso y trazabilidad

Se mantiene la numeración CU-01 a CU-23 y se completa su coherencia con los recorridos revisados. Se agregan CU-24 (Mercado Pago), CU-25 (consulta de cobros/comisiones), CU-26 (regularización), CU-27 (finalización común) y CU-28 (revisión de pagos). No se agrega un CU separado por cada botón o modo de visualización.

## 15.1. Actores del sistema

| Actor | Tipo | Responsabilidad en esta entrega |
| --- | --- | --- |
| Cliente | Principal | Publica, consulta candidatos, contrata, confirma importes, paga y califica. |
| Prestador | Principal | Configura actividad y disponibilidad, se postula, confirma órdenes, informa finalización, consulta comisiones y regulariza deuda. |
| Administrador | Principal | Revisa altas y certificados, consulta usuarios, modera contenido y representa acreditaciones y revisiones de pagos. |
| Mercado Pago / pasarela | Externo representado | Aprobación, rechazo o espera de pagos del servicio y regularizaciones; sin conexión real en la POC. |
| Servicio de correo | Externo representado | Entrega del enlace de recupero en una bandeja de demostración. |
| Servicio de notificaciones | Externo previsto | Push real futuro. La POC conserva avisos internos y banners locales. |
| Banco / conciliación | Externo representado | Transferencias y comprobantes ficticios; el administrador representa la verificación. |
| Servicio de geolocalización | Externo futuro | GPS y mapas reales fuera de la POC; se utilizan zonas y coordenadas de ejemplo. |

## 15.1.1. Relación entre acciones del cliente y del prestador

El alta del prestador parte de una cuenta cliente. La contratación la inicia el cliente; la aceptación y finalización las informa el prestador. El cliente reconoce el importe y paga el servicio. Ambos pueden consultar la orden y calificar después del cierre. El prestador consulta su comisión y, si corresponde, paga su propia deuda a Royal. El administrador representa decisiones y verificaciones cuando el circuito las necesita.

# 15.2. Matriz de trazabilidad CU - RF

La X indica que el caso de uso implementa o utiliza explícitamente el requerimiento. Los bloques A, B y C conforman una única matriz; las filas CU-01 a CU-28 se repiten para facilitar la lectura.

## Bloque A: RF-01 a RF-12

| CU | RF-01 | RF-02 | RF-03 | RF-04 | RF-05 | RF-06 | RF-07 | RF-08 | RF-09 | RF-10 | RF-11 | RF-12 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CU-01 | X |  |  |  |  |  |  |  |  |  |  |  |
| CU-02 |  | X |  |  |  |  |  |  |  |  |  |  |
| CU-03 |  |  | X |  |  |  |  |  |  |  |  |  |
| CU-04 |  |  |  | X |  |  |  |  |  |  |  |  |
| CU-05 |  |  |  |  | X |  |  |  |  |  |  |  |
| CU-06 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-07 |  |  |  |  |  | X |  |  |  |  |  |  |
| CU-08 |  |  |  |  |  |  | X |  |  |  |  |  |
| CU-09 |  |  |  |  |  |  |  | X | X |  |  |  |
| CU-10 |  |  |  |  |  |  |  |  |  | X | X |  |
| CU-11 |  |  |  |  |  |  |  |  |  |  |  | X |
| CU-12 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-13 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-14 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-15 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-16 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-17 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-18 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-19 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-20 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-21 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-22 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-23 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-24 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-25 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-26 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-27 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-28 |  |  |  |  |  |  |  |  |  |  |  |  |

## Bloque B: RF-13 a RF-24

| CU | RF-13 | RF-14 | RF-15 | RF-16 | RF-17 | RF-18 | RF-19 | RF-20 | RF-21 | RF-22 | RF-23 | RF-24 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CU-01 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-02 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-03 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-04 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-05 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-06 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-07 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-08 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-09 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-10 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-11 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-12 | X |  |  |  |  |  |  |  |  |  |  |  |
| CU-13 |  | X | X |  |  |  |  |  |  |  |  |  |
| CU-14 |  |  |  | X |  |  |  |  |  |  |  |  |
| CU-15 |  |  |  |  | X |  |  |  |  |  |  |  |
| CU-16 |  |  |  |  |  | X |  |  |  |  |  |  |
| CU-17 |  |  |  |  |  |  | X |  | X |  |  |  |
| CU-18 |  |  |  |  |  |  |  | X | X |  |  |  |
| CU-19 |  |  |  |  |  |  |  |  |  | X |  |  |
| CU-20 |  |  |  |  |  |  |  |  |  |  | X |  |
| CU-21 |  |  |  |  |  |  |  |  |  |  |  | X |
| CU-22 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-23 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-24 |  |  |  |  |  |  |  |  | X |  |  |  |
| CU-25 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-26 |  |  |  |  |  |  |  |  | X |  |  |  |
| CU-27 |  |  |  |  |  |  |  |  |  |  |  |  |
| CU-28 |  |  |  |  |  |  |  |  |  |  |  |  |

## Bloque C: RF-25 a RF-35

| CU | RF-25 | RF-26 | RF-27 | RF-28 | RF-29 | RF-30 | RF-31 | RF-32 | RF-33 | RF-34 | RF-35 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CU-01 |  |  |  |  |  |  |  |  |  |  |  |
| CU-02 |  |  |  |  |  |  |  |  |  |  |  |
| CU-03 |  |  |  |  |  |  |  |  |  |  |  |
| CU-04 |  |  |  |  |  |  |  |  |  |  |  |
| CU-05 |  |  |  |  |  |  |  |  |  |  |  |
| CU-06 |  | X | X | X |  |  |  |  |  |  |  |
| CU-07 |  |  |  |  |  |  |  |  |  |  |  |
| CU-08 |  |  |  |  |  |  |  |  |  |  |  |
| CU-09 |  |  |  |  |  |  |  |  |  |  |  |
| CU-10 |  |  |  |  |  |  |  |  |  |  |  |
| CU-11 |  |  |  |  |  |  |  |  |  |  |  |
| CU-12 |  |  |  |  |  |  |  |  |  |  |  |
| CU-13 |  |  |  |  |  |  |  |  |  |  |  |
| CU-14 |  |  |  |  |  |  |  |  |  |  |  |
| CU-15 |  |  |  |  |  |  |  |  |  |  |  |
| CU-16 |  |  |  |  |  |  |  |  |  |  |  |
| CU-17 |  |  |  |  |  |  |  |  |  |  |  |
| CU-18 |  |  |  |  |  |  |  |  |  |  |  |
| CU-19 |  |  |  |  |  |  |  |  |  |  |  |
| CU-20 | X |  |  |  |  |  |  |  |  |  |  |
| CU-21 |  |  |  |  |  |  |  |  |  |  |  |
| CU-22 | X |  |  |  | X |  |  |  |  |  |  |
| CU-23 |  |  |  |  |  | X |  |  |  |  |  |
| CU-24 |  |  |  |  |  |  | X |  |  |  |  |
| CU-25 |  |  |  |  |  |  |  | X |  |  |  |
| CU-26 |  |  |  |  |  |  |  |  | X |  |  |
| CU-27 |  |  |  |  |  |  |  |  |  | X |  |
| CU-28 |  |  |  |  |  |  |  |  |  |  | X |

## 15.2.1. Trazabilidad inversa y cobertura

Todos los RF incluidos tienen cobertura. La siguiente relación permite localizar el caso correspondiente sin interpretar una celda vacía como un requisito fuera del MVP.

| RF | Casos asociados | RF | Casos asociados |
| --- | --- | --- | --- |
| RF-01 | CU-01 | RF-19 | CU-17 |
| RF-02 | CU-02 | RF-20 | CU-18 |
| RF-03 | CU-03 | RF-21 | CU-17, CU-18, CU-24, CU-26 |
| RF-04 | CU-04 | RF-22 | CU-19 |
| RF-05 | CU-05 | RF-23 | CU-20 |
| RF-06 | CU-07 | RF-24 | CU-21 |
| RF-07 | CU-08 | RF-25 | CU-20, CU-22 |
| RF-08 | CU-09 | RF-26 | CU-06 |
| RF-09 | CU-09 | RF-27 | CU-06 |
| RF-10 | CU-10 | RF-28 | CU-06 |
| RF-11 | CU-10 | RF-29 | CU-22 |
| RF-12 | CU-11 | RF-30 | CU-23 |
| RF-13 | CU-12 | RF-31 | CU-24 |
| RF-14 | CU-13 | RF-32 | CU-25 |
| RF-15 | CU-13 | RF-33 | CU-26 |
| RF-16 | CU-14 | RF-34 | CU-27 |
| RF-17 | CU-15 | RF-35 | CU-28 |
| RF-18 | CU-16 |  |  |

# 15.3. Especificación de casos de uso

Los flujos describen el comportamiento acordado para la POC. Las operaciones externas se representan con datos de prueba, sin afirmar validación bancaria, documental o de identidad real. Los parámetros numéricos de demostración se identifican en 14.1.3.

### CU-01 - Registrar usuario

**Actor:** Cliente / futuro prestador
**RF:** RF-01
**Incluido:** MVP/POC

**Descripción:** Crear una cuenta desde la que se puede contratar y luego habilitar el perfil de prestador.

**Precondiciones:** No existe una cuenta con el mismo email; si se informa DNI, tampoco debe duplicarse.

**Postcondiciones:** Cuenta activa como cliente, sesión local iniciada y bienvenida disponible.

**Flujo principal**

1. Ingresar nombre, apellido, email, teléfono y contraseña; completar los datos identificatorios solicitados.
2. Aceptar términos y condiciones.
3. Validar formatos y unicidad; crear la cuenta y ofrecer la bienvenida (CU-04).
4. Si desea ofrecer servicios, continuar al alta de prestador (CU-06).

**Alternativas**

- Sin aceptación o con datos inválidos, señalar los campos y no crear la cuenta.
- Email ya registrado: ofrecer acceso o recupero (CU-03).

### CU-02 - Iniciar y cerrar sesión

**Actor:** Cliente / prestador / administrador
**RF:** RF-02
**Incluido:** MVP/POC

**Descripción:** Acceder a la interfaz correspondiente al rol y cerrar la sesión local al terminar.

**Precondiciones:** Cuenta registrada y habilitada para el rol elegido.

**Postcondiciones:** Sesión local iniciada, o cerrada cuando el usuario selecciona esa acción.

**Flujo principal**

1. Ingresar email y contraseña.
2. Validar credenciales y condición de la cuenta.
3. Abrir la pantalla inicial del rol.
4. Al seleccionar cerrar sesión, invalidar su acceso local y volver al inicio de sesión.

**Alternativas**

- Credenciales incorrectas: mensaje genérico y posibilidad de reintento.
- Cuenta suspendida: impedir acceso. Exceso de intentos: bloqueo temporal según parámetro de demostración y opción de recupero.

### CU-03 - Recuperar contraseña

**Actor:** Cliente / prestador
**RF:** RF-03
**Incluido:** MVP/POC

**Descripción:** Restablecer la contraseña mediante un enlace con vencimiento y un solo uso.

**Precondiciones:** El usuario dispone de una cuenta y del correo representado en la demostración.

**Postcondiciones:** Contraseña actualizada y sesiones anteriores invalidadas.

**Flujo principal**

1. Solicitar recupero e ingresar email.
2. Generar el enlace y mostrar el correo en la bandeja simulada.
3. Abrir el enlace e ingresar y repetir la nueva contraseña.
4. Validar, guardar e indicar que puede volver a iniciar sesión.

**Alternativas**

- Email inexistente: misma respuesta genérica de envío.
- Enlace vencido/usado o contraseñas distintas: informar y permitir una nueva solicitud.

### CU-04 - Visualizar bienvenida

**Actor:** Cliente / prestador
**RF:** RF-04
**Incluido:** MVP/POC

**Descripción:** Presentar los pasos principales antes de utilizar la aplicación.

**Precondiciones:** Primer acceso de la cuenta en el entorno de demostración.

**Postcondiciones:** Bienvenida completada u omitida; ingreso a la pantalla principal.

**Flujo principal**

1. Detectar que la bienvenida está pendiente.
2. Mostrar los pasos y permitir avanzar.
3. Al terminar, registrar la elección y mostrar el inicio.

**Alternativas**

- Si selecciona Saltar, registrar la omisión y permitir continuar. No modifica el estado de la cuenta.

### CU-05 - Gestionar datos del perfil

**Actor:** Cliente / prestador
**RF:** RF-05
**Incluido:** MVP/POC

**Descripción:** Consultar y editar datos personales y de contacto.

**Precondiciones:** Sesión iniciada y acceso al perfil propio.

**Postcondiciones:** Datos válidos guardados, sin alterar órdenes históricas.

**Flujo principal**

1. Abrir Mi perfil y visualizar los datos.
2. Editar los campos habilitados.
3. Si cambia email o DNI, confirmar contraseña.
4. Validar formatos, unicidad y guardar.

**Alternativas**

- Formato inválido o contraseña incorrecta: conservar los datos previos e informar el problema.

### CU-06 - Darse de alta como prestador

**Actor:** Cliente
**RF:** RF-26, RF-27, RF-28
**Incluido:** MVP/POC

**Descripción:** Habilitar el perfil prestador cargando actividad, zona, disponibilidad y documentación.

**Precondiciones:** Cuenta cliente con sesión iniciada; sin perfil prestador activo duplicado.

**Postcondiciones:** Perfil incompleto, pendiente de verificación o activo, según sus datos y revisión.

**Flujo principal**

1. Seleccionar Quiero ofrecer mis servicios.
2. Cargar rubros, tags, descripción y zonas de cobertura; el mapa esquemático es una ayuda visual opcional.
3. Indicar días de la semana y al menos una franja en la que ofrece servicios.
4. Adjuntar los documentos requeridos por el rubro y revisar la solicitud.
5. Validar datos y enviar a revisión; habilitar la actividad al aprobar el alta.

**Alternativas**

- Sin franja, zona o documentación requerida: guardar el borrador e indicar qué falta antes de enviar. No se suspende la cuenta cliente.
- Documentación en revisión: el perfil aún no aparece como activo en el catálogo.
- Al editar un perfil existente, conservar la configuración previa hasta confirmar una modificación válida.

### CU-07 - Cargar certificados por rubro

**Actor:** Prestador
**RF:** RF-06
**Incluido:** MVP/POC

**Descripción:** Adjuntar y revisar certificados o matrícula de la actividad.

**Precondiciones:** Existe un perfil de prestador y un tipo de documento asociado al rubro.

**Postcondiciones:** Documento pendiente de validación, validado o no válido, con motivo de corrección.

**Flujo principal**

1. Abrir Certificaciones y seleccionar el documento.
2. Adjuntar JPG, PNG o PDF de prueba y completar entidad, número cuando corresponda y vencimiento.
3. Validar formato y tamaño según parámetros informados; conservar el archivo cargado.
4. Registrar la carga y representar la decisión administrativa de revisión.

**Alternativas**

- Archivo inválido o excesivo: rechazar esa carga e informar requisitos.
- Documento no válido: registrar motivo y permitir reemplazo; no inventar una verificación externa.
- Cifrado y custodia productiva pertenecen a la implementación futura; no se declaran ejecutados en la POC.

### CU-08 - Publicar solicitud de servicio

**Actor:** Cliente
**RF:** RF-07
**Incluido:** MVP/POC

**Descripción:** Describir una necesidad para recibir postulaciones.

**Precondiciones:** Sesión de cliente activa.

**Postcondiciones:** Solicitud abierta, visible a prestadores del rubro y la zona.

**Flujo principal**

1. Elegir categoría e ingresar descripción, zona/dirección y urgencia; agregar fotos si desea.
2. Indicar preferencia temporal y, cuando se programe, fecha y franja; el presupuesto de referencia es orientativo y opcional.
3. Revisar y confirmar publicación.
4. Validar los obligatorios, registrar la solicitud y emitir avisos locales (CU-16).

**Alternativas**

- Campos incompletos: señalar y no publicar.
- Si se configura un máximo de solicitudes abiertas y se alcanza, informar el límite sin inventar un valor normativo.
- Sin prestadores cercanos: publicar e informar que puede demorar. La urgencia no genera un recargo automático.

### CU-09 - Consultar catálogo de prestadores

**Actor:** Cliente
**RF:** RF-08, RF-09
**Incluido:** MVP/POC

**Descripción:** Explorar categorías y candidatos activos de una zona.

**Precondiciones:** Acceso al catálogo; pueden existir categorías sin candidatos.

**Postcondiciones:** Listado de candidatos o resultado vacío comprensible.

**Flujo principal**

1. Mostrar categorías de servicios.
2. Seleccionar categoría y zona de referencia.
3. Consultar candidatos activos y ordenar por cercanía estimada.
4. Mostrar valoración y acceso al perfil (CU-12).

**Alternativas**

- Sin ubicación del dispositivo: utilizar zona manual o coordenadas de ejemplo.
- Sin candidatos: informar y ofrecer publicar una solicitud (CU-08). El esquema de mapa no equivale a GPS real.

### CU-10 - Buscar y filtrar prestadores

**Actor:** Cliente
**RF:** RF-10, RF-11
**Incluido:** MVP/POC

**Descripción:** Encontrar candidatos por texto y criterios básicos.

**Precondiciones:** El cliente está en el catálogo o buscador.

**Postcondiciones:** Resultados que cumplen los criterios seleccionados.

**Flujo principal**

1. Ingresar oficio, categoría, nombre o texto del servicio.
2. Mostrar coincidencias.
3. Aplicar valoración mínima, cercanía y tags.
4. Actualizar los resultados y permitir quitar filtros.

**Alternativas**

- Sin coincidencias: mostrar estado vacío y acceso a categorías o publicación.
- Filtros incompatibles: proponer limpiarlos. No modificar los estados ni la reputación de los candidatos.

### CU-11 - Postularse a una solicitud

**Actor:** Prestador
**RF:** RF-12
**Incluido:** MVP/POC

**Descripción:** Ofrecer un servicio mediante precio, mensaje y horario propuesto.

**Precondiciones:** Perfil activo; solicitud abierta del rubro y zona; sin restricción vigente por comisiones.

**Postcondiciones:** Propuesta creada o actualizada y visible para el cliente.

**Flujo principal**

1. Consultar solicitudes disponibles y abrir el detalle.
2. Ingresar precio y mensaje; proponer fecha y franja dentro de su disponibilidad.
3. Validar que la solicitud continúe abierta y que la franja no tenga una orden confirmada.
4. Registrar la propuesta y notificar al cliente (CU-16).

**Alternativas**

- Ya existe postulación: editarla sin crear un duplicado.
- Solicitud cerrada, cancelada o asignada: impedir la nueva propuesta.
- Sin disponibilidad para la propuesta: pedir otra franja; no suspender la cuenta.

### CU-12 - Consultar perfil e historial del candidato

**Actor:** Cliente
**RF:** RF-13
**Incluido:** MVP/POC

**Descripción:** Revisar información para decidir la contratación.

**Precondiciones:** Candidato del catálogo o de las postulaciones.

**Postcondiciones:** Cliente informado y con opción de regresar o contratar.

**Flujo principal**

1. Abrir la ficha del prestador.
2. Mostrar rubros, descripción, disponibilidad y certificados representados.
3. Mostrar trabajos y reseñas vinculados a órdenes finalizadas.
4. Volver al listado o continuar a CU-13.

**Alternativas**

- Sin trabajos previos: identificar Perfil nuevo y no atribuir reputación inexistente.
- Documentos ficticios: su presencia no prueba identidad ni antecedentes reales.

### CU-13 - Contratar prestador

**Actor:** Cliente
**RF:** RF-14, RF-15
**Incluido:** MVP/POC

**Descripción:** Convertir una propuesta o selección del catálogo en una orden acordada.

**Precondiciones:** Cliente autenticado y prestador activo seleccionado.

**Postcondiciones:** Orden pendiente de confirmación; solicitud vinculada cerrada a nuevas postulaciones.

**Flujo principal**

1. Elegir al prestador desde catálogo o postulación.
2. Confirmar descripción, domicilio, fecha, franja y precio. Si solicita atención inmediata, concretar igualmente el horario acordado.
3. Mostrar disponibilidad y verificar que la franja no esté ocupada.
4. Seleccionar efectivo, transferencia o Mercado Pago como medio previsto.
5. Confirmar el resumen, crear la orden y notificar al prestador.

**Alternativas**

- Franja fuera de disponibilidad u ocupada: pedir otra.
- Prestador dejó de estar activo: impedir contratación.
- Seleccionar medio previsto no acredita dinero ni descuenta una comisión. El pago del servicio se representa después de su ejecución.

### CU-14 - Confirmar o rechazar una orden

**Actor:** Prestador
**RF:** RF-16
**Incluido:** MVP/POC

**Descripción:** Aceptar el acuerdo o rechazarlo indicando motivo.

**Precondiciones:** Orden pendiente de confirmación asignada al prestador.

**Postcondiciones:** Orden confirmada, rechazada o vencida por falta de respuesta.

**Flujo principal**

1. Abrir la orden y revisar cliente, servicio, domicilio, horario y precio.
2. Comprobar que conserva disponibilidad y que no existe otra orden confirmada en esa franja.
3. Aceptar y reservar la franja; notificar al cliente.

**Alternativas**

- Rechazo: registrar motivo, notificar y reabrir la solicitud si existe.
- Sin respuesta dentro del plazo configurado de demo: vencer y notificar.
- Una franja ocupada no es un bloqueo de cuenta; impide aceptar dos órdenes superpuestas.

### CU-15 - Cancelar una orden

**Actor:** Cliente / prestador
**RF:** RF-17
**Incluido:** MVP/POC

**Descripción:** Deshacer una contratación antes de ejecutar el servicio.

**Precondiciones:** Orden propia pendiente de confirmación o confirmada, aún no ejecutada.

**Postcondiciones:** Orden cancelada, motivo registrado y franja liberada.

**Flujo principal**

1. Abrir el detalle y seleccionar Cancelar.
2. Indicar motivo y confirmar.
3. Registrar actor y motivo, liberar la franja y avisar a la contraparte.
4. Si cancela el prestador y existe solicitud vinculada, permitir nuevas postulaciones.

**Alternativas**

- Servicio ya ejecutado: impedir cancelación y ofrecer reporte/revisión (CU-22/28).
- La POC no cobra antes de la ejecución: cancelar no supone una devolución bancaria automática.
- Una marca de cancelación tardía, si se usa, depende de un parámetro explícito; no crea una penalización de score.

### CU-16 - Recibir notificaciones

**Actor:** Cliente / prestador / administrador
**RF:** RF-18
**Incluido:** MVP/POC

**Descripción:** Informar eventos relevantes del circuito.

**Precondiciones:** Ocurre un evento con destinatarios identificables.

**Postcondiciones:** Aviso local registrado y acceso a su pantalla relacionada.

**Flujo principal**

1. Detectar solicitud, postulación, cambio de orden, pago, regularización o reseña.
2. Determinar destinatarios por participación, rubro o zona.
3. Registrar el aviso en el centro de notificaciones y mostrar el banner local cuando corresponda.
4. Al abrirlo, ir al detalle asociado.

**Alternativas**

- Sin banner o sin permiso push: conservar el aviso interno.
- El envío real a otros dispositivos requiere un servicio externo futuro; no se declara realizado por la POC.

### CU-17 - Registrar pago en efectivo con comisión diferida

**Actor:** Cliente y prestador
**RF:** RF-19, RF-21
**Incluido:** MVP/POC

**Descripción:** Registrar el efectivo que el cliente entrega al prestador y la comisión pendiente con Royal.

**Precondiciones:** Orden confirmada; finalización e importe informados mediante CU-27; medio efectivo.

**Postcondiciones:** Pago registrado, orden finalizada y deuda de comisión del prestador actualizada una sola vez.

**Flujo principal**

1. El cliente consulta el importe informado y el precio acordado.
2. Entrega el efectivo al prestador y confirma monto y finalización en su aplicación.
3. Calcular la comisión y registrarla como deuda del prestador con Royal.
4. Finalizar la orden, notificar y habilitar calificaciones (CU-20).

**Alternativas**

- Monto no reconocido: pasar a revisión y notificar al administrador (CU-28).
- Confirmación repetida: no crear otro movimiento.
- Al alcanzar el límite de deuda configurado, restringir nuevas postulaciones hasta acreditar una regularización (CU-26), sin impedir consultar órdenes o pagar la deuda.

### CU-18 - Registrar pago del servicio por transferencia

**Actor:** Cliente / administrador
**RF:** RF-20, RF-21
**Incluido:** MVP/POC

**Descripción:** Representar la transferencia del servicio al destino de cobro de Royal y su acreditación.

**Precondiciones:** Orden confirmada y ejecutada; cliente conforme con el importe; medio transferencia.

**Postcondiciones:** Pago acreditado, comisión deducida y neto del prestador registrado; o pago pendiente/en revisión.

**Flujo principal**

1. Mostrar importe y datos bancarios ficticios de destino de Royal.
2. Adjuntar el comprobante de prueba y registrar pendiente de acreditación.
3. El administrador representa la conciliación del monto y la referencia.
4. Si coincide, acreditar una vez, registrar comisión y neto, finalizar la orden y notificar.

**Alternativas**

- Sin comprobante: conservar pendiente; adjuntarlo no equivale a acreditar.
- Monto diferente o comprobante no válido: registrar revisión y tratar con CU-28.
- La liquidación bancaria real al prestador está fuera de la POC; solo se representa el importe neto correspondiente.

### CU-19 - Gestionar tarjetas guardadas de prueba

**Actor:** Cliente
**RF:** RF-22
**Incluido:** MVP/POC

**Descripción:** Representar referencias de tarjetas para explicar la gestión de medios de pago.

**Precondiciones:** Sesión iniciada y uso exclusivo de datos ficticios.

**Postcondiciones:** Referencia de prueba agregada, consultada o eliminada.

**Flujo principal**

1. Abrir Medios de pago.
2. Mostrar marca y últimos dígitos de las referencias existentes.
3. Agregar una tarjeta de prueba y representar aceptación o rechazo de la pasarela.
4. Conservar una referencia ficticia y permitir eliminarla con confirmación.

**Alternativas**

- Datos de prueba inválidos o rechazo simulado: no agregar referencia.
- Este caso no habilita un medio de cobro directo con tarjeta separado de efectivo, transferencia y Mercado Pago. Tokenización real queda para la implementación externa.

### CU-20 - Calificar a la contraparte

**Actor:** Cliente / prestador
**RF:** RF-23, RF-25
**Incluido:** MVP/POC

**Descripción:** Dejar una reseña vinculada a una contratación finalizada.

**Precondiciones:** Orden finalizada; actor participante que aún no calificó.

**Postcondiciones:** Una reseña por autor, reputación actualizada y orden conservada como finalizada.

**Flujo principal**

1. Abrir Calificar desde la orden o notificación.
2. Elegir puntuación y comentario opcional; tags descriptivos si están disponibles.
3. Validar participación y ausencia de calificación previa.
4. Registrar la reseña vinculada a la orden y recalcular el promedio.

**Alternativas**

- Autor ajeno, orden no finalizada o reseña duplicada: rechazar.
- Sin calificación: conservar la orden finalizada sin inventar una reseña.
- Reseña denunciada: pasar a moderación (CU-22). Un plazo opcional de calificación debe estar configurado explícitamente.

### CU-21 - Consultar órdenes, agenda e historial

**Actor:** Cliente / prestador
**RF:** RF-24
**Incluido:** MVP/POC

**Descripción:** Consultar las órdenes propias por fecha y estado; la agenda es otra presentación de esos mismos datos.

**Precondiciones:** Sesión iniciada del participante.

**Postcondiciones:** Listado, agenda o detalle de órdenes consultado sin modificar sus estados.

**Flujo principal**

1. Abrir Mis órdenes o Historial; en el prestador, abrir Agenda.
2. Recuperar solo órdenes propias y agruparlas por estado, ordenadas por fecha.
3. En Agenda, alternar Día/Semana y seleccionar fecha para consultar compromisos.
4. Distinguir franjas libres, ocupadas por orden confirmada y no disponibles según su configuración.
5. Abrir una orden para consultar su detalle.

**Alternativas**

- Sin órdenes: mostrar vacío y acceso a publicar o buscar trabajos.
- Sin disponibilidad configurada: indicar que falta completarla; no bloquear la cuenta.
- Cambiar Día/Semana solo cambia la presentación; no agrega un caso de contratación ni altera la disponibilidad.

### CU-22 - Moderar reseñas y reportes

**Actor:** Administrador
**RF:** RF-29, RF-25
**Incluido:** MVP/POC

**Descripción:** Revisar contenido denunciado y registrar una decisión motivada.

**Precondiciones:** Administrador autenticado y reseña o reporte pendiente.

**Postcondiciones:** Contenido aprobado o dado de baja, con registro de la decisión y reputación recalculada si corresponde.

**Flujo principal**

1. Abrir la bandeja y revisar motivo, participantes y orden.
2. Aprobar o dar de baja el contenido e ingresar observación.
3. Aplicar la decisión, recalcular el promedio cuando corresponda y notificar.

**Alternativas**

- Reporte relacionado con monto o acreditación: derivar a CU-28.
- Sanciones automáticas de score y bloqueo avanzado por DNI no forman parte de esta decisión de moderación.

### CU-23 - Consultar listado de usuarios

**Actor:** Administrador
**RF:** RF-30
**Incluido:** MVP/POC

**Descripción:** Consultar usuarios y su información relacionada.

**Precondiciones:** Sesión administrativa iniciada.

**Postcondiciones:** Listado filtrado o ficha de usuario consultada.

**Flujo principal**

1. Abrir Usuarios y mostrar nombre, rol, estado y fecha de alta.
2. Buscar por datos identificatorios y filtrar por perfil, estado o rubro.
3. Seleccionar un usuario y consultar ficha, órdenes y reseñas asociadas.

**Alternativas**

- Sin coincidencias: mantener criterios y mostrar vacío.
- La consulta de usuarios no autoriza a ejecutar pagos ni a dar por comprobada una identidad real.

### CU-24 - Pagar el servicio mediante Mercado Pago

**Actor:** Cliente
**RF:** RF-31, RF-21
**Incluido:** MVP/POC

**Descripción:** Representar el cobro digital del servicio mediante Mercado Pago.

**Precondiciones:** Orden confirmada y ejecutada, importe reconocido por el cliente y medio Mercado Pago.

**Postcondiciones:** Pago acreditado y orden finalizada, o pago pendiente/rechazado sin comisión deducida.

**Flujo principal**

1. Abrir el pago y revisar orden e importe.
2. Acceder a la pasarela representada de Mercado Pago.
3. Simular resultado aprobado, pendiente o rechazado y asociar una referencia a la orden.
4. Solo al aprobar, registrar una vez cobro, comisión deducida y neto del prestador; finalizar y notificar.

**Alternativas**

- Rechazo o abandono: mantener el importe pendiente y permitir reintentar o cambiar de medio antes de acreditar.
- Resultado pendiente: conservar espera; no habilitar reseña todavía.
- Respuesta repetida de la misma operación: no duplicar cobro ni comisión. No se utiliza dinero real.

### CU-25 - Consultar cobros y comisiones

**Actor:** Prestador
**RF:** RF-32
**Incluido:** MVP/POC

**Descripción:** Consultar el resumen denominado Billetera o Comisiones en la interfaz.

**Precondiciones:** Sesión del prestador iniciada.

**Postcondiciones:** Movimientos y deuda consultados sin mover dinero.

**Flujo principal**

1. Abrir Billetera/Comisiones.
2. Mostrar cobros de servicios, comisiones deducidas de pagos digitales y comisión pendiente por efectivo.
3. Permitir consultar el detalle y la orden de cada movimiento; los totales por período resumen esos registros.
4. Si existe deuda, acceder a su regularización (CU-26).

**Alternativas**

- Sin movimientos: mostrar vacío.
- La vista no es una cuenta de dinero electrónico y no ofrece retiros, recargas ni saldo disponible para gastar. El efectivo cobrado por el prestador no ingresó a Royal.

### CU-26 - Regularizar comisión pendiente

**Actor:** Prestador / administrador
**RF:** RF-33, RF-21
**Incluido:** MVP/POC

**Descripción:** Representar el pago de la deuda de comisión del prestador a Royal.

**Precondiciones:** Existe deuda positiva por comisiones de servicios cobrados en efectivo.

**Postcondiciones:** Deuda reducida por el monto acreditado una sola vez, o regularización pendiente/en revisión.

**Flujo principal**

1. Consultar deuda y elegir el importe a saldar, hasta el saldo pendiente.
2. Elegir transferencia o Mercado Pago. El destinatario es Royal; el pagador es el prestador.
3. Por transferencia, adjuntar comprobante y mantener pendiente hasta la verificación administrativa; por MP, representar aprobación, rechazo o espera.
4. Al acreditar, registrar el movimiento de regularización y disminuir la deuda.
5. Si vuelve a quedar bajo el límite configurado, permitir nuevas postulaciones; conservar el historial del pago.

**Alternativas**

- Pago parcial: reducir solo el importe acreditado y conservar el resto.
- Comprobante o monto no coincidente: mantener revisión sin descontar deuda.
- Rechazo, espera o resultado duplicado: no disminuir deuda indebidamente.
- No se contempla entregar efectivo a Royal, pagar en oficina ni compensar deudas con otros servicios en esta POC.

### CU-27 - Informar finalización del servicio

**Actor:** Prestador / cliente
**RF:** RF-34
**Incluido:** MVP/POC

**Descripción:** Informar ejecución e importe final antes del registro de pago, para los tres medios.

**Precondiciones:** Orden confirmada asignada al prestador y servicio ejecutado.

**Postcondiciones:** Ejecución e importe registrados; cliente notificado. La orden permanece confirmada hasta registrar el pago o queda en revisión si hay desacuerdo.

**Flujo principal**

1. Abrir la orden y seleccionar Finalizar trabajo.
2. Ingresar el importe final.
3. Registrar que el servicio fue ejecutado y pedir al cliente confirmar el monto.
4. Si está conforme, continuar al efectivo (CU-17), transferencia (CU-18) o Mercado Pago (CU-24).

**Alternativas**

- Importe inválido o repetición de finalización: impedir el registro duplicado.
- Desacuerdo del cliente: enviar a revisión administrativa (CU-28).
- No se exige código de inicio ni se agrega tracking como condición para finalizar.

### CU-28 - Resolver una revisión de importe o pago

**Actor:** Administrador, con intervención de cliente/prestador
**RF:** RF-35
**Incluido:** MVP/POC

**Descripción:** Resolver diferencias de importe o acreditación conservando la distinción entre acuerdo y dinero recibido.

**Precondiciones:** Orden, pago de servicio o regularización en revisión.

**Postcondiciones:** Resolución registrada y participantes notificados; importe corregido o pago validado según la evidencia.

**Flujo principal**

1. Abrir el caso y revisar precio acordado, monto informado, comprobante y versiones.
2. Registrar una observación y decidir si corresponde corregir el importe, mantener pendiente o confirmar una acreditación representada.
3. Si solo se corrige el acuerdo, volver a solicitar el pago o su confirmación sin crear ingresos.
4. Si se confirma una acreditación, continuar con CU-18, CU-24 o CU-26, según la operación.
5. Cerrar la revisión y notificar a los participantes.

**Alternativas**

- Evidencia insuficiente: mantener el caso pendiente/en revisión.
- Un ajuste de importe no prueba un cobro; no debe duplicar movimientos previos.
- Reembolsos reales, seguros, indemnizaciones y penalizaciones automáticas no forman parte de este caso.
