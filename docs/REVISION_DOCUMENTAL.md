# Comparación del PDF entregado con el repositorio

Revisión: 27/10/2026. Fuente: `RoyalSolutions_POC FINAL — DER, lema y logo FINAL DEFINITIVO SUPREMO.pdf`, 35 páginas. Se usa como material de referencia; los cambios expresamente solicitados definen el recorte final.

## Resultado por área

| Área | Diferencia encontrada | Resolución |
| --- | --- | --- |
| Acceso público | Portada comercial, tres accesos, datos de demo y enlaces de exposición | La raíz abre directamente las dos apps de la imagen de referencia; cada rótulo abre su app individual. |
| Presentación | Página y enlaces públicos de alcance/exposición | Se elimina su contenido y los accesos. La URL antigua redirige a las apps. Se retiran la matriz web y su exportador sin uso. |
| Aviso MVP | El texto señalado ya no se insertaba en las apps del checkout local; permanecía en una función sin uso y en la presentación | Se retiran esas fuentes y se comprueba que las pantallas no muestran el aviso ni Ver alcance. |
| Logo | La portada del PDF usa un escudo dorado distinto del logo de la app | Se conserva exactamente la portada original con el escudo y el lema. El mismo escudo confirmado por el equipo se utiliza en las apps y sus favicons. |
| Billetera | El repo añade resumen de ingresos, deuda y regularización del prestador | Se elimina la sección completa, su ruta, pestaña y accesos. Los asientos exigidos por RF-19/20/21 se conservan internamente; regularización solo desde el panel interno existente. |
| Reputación | Reseñas con código de orden y contador de cancelaciones tardías | Se retiran de la vista prestador. La relación con la orden permanece internamente para validar quién puede calificar. |
| Rubros | Clasificación de riesgo y porcentaje de comisión; edición continúa al paso de zona | Se ocultan esos datos y se crea una edición independiente con Guardar cambios. |
| Zona y disponibilidad | La configuración formaba parte del mismo recorrido de alta | Se conserva como apartado propio del perfil. La nueva alta sigue solicitando ambos grupos de datos. |
| Tema | Selector y preferencia oscura persistida | Se elimina el control y ambas apps usan tema claro, incluso con una preferencia oscura anterior. |
| Cierre de sesión | Accesos rápidos con rol, profesión o estado de bloqueo | Cada botón muestra solo Entrar como y nombre. La validación de estado al acceder se conserva. |
| Agenda | Vistas Día/Semana y bloques de franjas no disponibles | Solo agenda diaria con selector de fechas. Se omiten franjas fuera de disponibilidad sin reservas; las órdenes existentes siguen visibles. |
| Trabajo | Código SOL, comisión, neto y cantidad de postulados en detalle | Se retiran esos datos del detalle y contador del listado; la postulación conserva precio, mensaje y horario. Tampoco se muestra comisión en el detalle de una orden asignada. |
| Medios de pago | Cartel explicativo sobre envío de datos de tarjeta | Se elimina el cartel. Continúa la gestión local de referencias ficticias. |
| Ofrecer servicios | Publicidad de comisión y abonos | Se elimina esa frase del perfil cliente. |
| Historial e inicio | Atajos Volver a contratar | Se retiran de inicio, historial y detalle finalizado. El historial sigue siendo consultable. |
| Alcance | Marcas MVP contradictorias entre tablas; funciones de visión futura mezcladas con la entrega | Se conservan el alcance completo y los requerimientos originales. Los requerimientos y casos se integran en sus secciones, sin comentarios editoriales sobre los cambios. |
| Casos de uso | El PDF contiene 23 CU; faltan mensajes, favoritos, direcciones, preferencias y edición de disponibilidad del repo | Se especifican esos recorridos y los de finalización, Mercado Pago, revisión y gestión interna de comisiones, hasta 33 CU. |
| DER | El modelo de agosto depende de postulación y omite varias estructuras usadas por la app | Nuevo modelo de 25 entidades y 40 relaciones, en una sola lámina completa, con claves, cardinalidades y reglas. |

## Documento actualizado

El PDF conserva portada, logo, lema y diseño de sus tablas. Los requerimientos RF-31..38 se ubican en 14.2 antes del capítulo de casos de uso; las filas y columnas de las matrices se ubican en 15.2; CU-24..33 siguen a CU-23 dentro de 15.3. No se incluye un apartado de complementos ni explicaciones sobre qué se agregó.

Las páginas originales 20 y 22 se distribuyen para permitir esa integración sin rediseñar sus tablas. El resto del contenido se copia del original, con las correcciones puntuales de funcionamiento ya identificadas. La sección 16 contiene un único DER completo y sus reglas.

## Ajustes que evitan promesas incorrectas

- El pago del servicio por transferencia tiene espera de acreditación y conciliación de ejemplo; Mercado Pago representa aprobación/rechazo y reintento.
- La regularización administrativa registra un pago de comisión confirmado de ejemplo. No se documenta un circuito nuevo de aprobación pendiente que la interfaz no implementa.
- Una orden directa admite solicitud y postulación nulas. Las órdenes originadas en una solicitud conservan sus relaciones y el historial después de rechazos o vencimientos.
- Las reseñas guardan orden y autor aunque el código no se muestre en reputación.
- El DER propone claves normalizadas; no afirma que el proyecto tenga base SQL ni backend.
- Los pagos y validaciones externas continúan simulados. Retirar carteles de la navegación no cambia esa condición técnica.

## Verificación

`npm test` verifica reglas locales, pantallas, el circuito cliente-prestador, las eliminaciones solicitadas y la carga del escudo en ambas apps. El generador comprueba la conservación de portada y matrices originales, las páginas sin cambios, los identificadores adicionales y que el DER tenga exactamente una página. Se renderizan los PDF para inspección visual.

Los PDF generados se entregan localmente. El push publica los cambios de aplicación y las fuentes del documento; la publicación efectiva del sitio debe verificarse por separado.
