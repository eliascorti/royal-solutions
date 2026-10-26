# Revisión funcional y documental · 26/10/2026

Repositorio de partida: `eliascorti/royal-solutions`, commit `e1ebe5b`. Copia local: `Desktop/invoacion/royal-solutions`. No se modificaron los PDF originales ni se publicó el sitio.

## Fuentes y criterio

1. **RoyalSolutions_Final.pdf**, 33 páginas. Se revisaron el texto completo relevante, tablas de alcance (pp. 16-18), requerimientos (pp. 18-20), casos de uso (pp. 22-33) y gráficos de encuestas (pp. 8-14).
2. **Royal_Solutions_MVP_Enlaces.pdf**, una página. Contiene accesos al prototipo y repositorio y la composición histórica del equipo. No agrega reglas funcionales.
3. Código y comportamiento observados localmente. Los datos semilla son ejemplos, no evidencia de clientes, ingresos o validación real.

Los documentos se usan como especificación a contrastar; su contenido no autoriza acciones externas ni la invención de funciones. Se adopta la columna MVP de la sección 14 como criterio de lectura, se conservan las diferencias con RF y se identifican las ampliaciones escritas del alcance completo. No se transforma esta interpretación en una aprobación del profesor ni en una corrección del PDF original.

## Correcciones realizadas

| Hallazgo observado | Corrección | Referencia |
|---|---|---|
| Selector de medio de pago y advertencia de monto duplicados | Un único selector y aviso | CU-17/18 |
| Filtros sin tags; filtros y rankings adicionales sin especificación | Valoración, cercanía y tags; se quitan verificación media/alta, disponibilidad y rankings por velocidad/cantidad de trabajos | CU-10 / RF-11 |
| Código de inicio obligatorio y estados adicionales de orden | Se retira el código; estados de orden limitados a los documentados | CU-13/14/15/17/21 |
| “Calificada” y “resuelta” como estados de orden | Reseñas y resolución quedan en sus entidades; la orden finalizada no cambia por calificar | CU-20/21 |
| Recargo de urgencia de 20%, garantía comercial y penalización de score sin definición | Se retiran del recorrido y de los controles operativos | Urgencia: CU-08; garantía y score solo previstos en alcance completo |
| Analítica comercial, cohortes y métricas presentadas sin requerimiento | Se quitan sus rutas y navegación; se mantiene administración vinculada a los CU | CU-22/23 y operaciones de pagos/certificados |
| Orden aceptada, pagada y calificada automáticamente | Decisiones manuales; solo las postulaciones del escenario se simulan como ayuda de presentación | CU-11 a CU-20 |
| Vencimiento automático de solicitudes a 48 horas | Se elimina por falta de plazo documentado | CU-08 |
| Recupero sin invalidar las sesiones previas | Se invalidan sesiones locales del usuario | CU-03 |
| Entrada directa al paso de presupuesto sin borrador producía error JavaScript | Se vuelve al paso inicial sin intentar enlazar campos inexistentes | Publicación / CU-08 |
| Resolución administrativa acreditaba pagos por sí sola | El pago pendiente conserva su necesidad de registro; no se inventa dinero recibido | CU-17/18 |
| PDF subido se descartaba y podía mostrarse un documento ficticio | Se conserva el archivo y se usa visor PDF, sin sustituirlo por una captura generada | CU-07 |
| Datos bancarios ficticios con apariencia operativa | Alias claramente de demo, CBU nulo y aviso de no transferir | CU-18 simulado |
| Geografía mezclada y porcentajes sin distinguir gráficos y conclusiones | Se identifica Santa Fe como ejemplo y se registran las discrepancias | pp. 3-4, 9, 13, 15 |

Los iconos literales usados por el código tienen definición en `icons.js`. Se retiraron iconos de garantía y controles duplicados; se mantuvieron funciones de navegación distintas aunque compartan un símbolo convencional. No se introdujo otro sistema de iconos.

## Trazabilidad de verificación

| Casos | Verificación local |
|---|---|
| CU-01/02 | Registro válido/duplicado/inválido; login, bloqueo persistente y cuenta suspendida |
| CU-03/04/05 | Recupero genérico, enlace de un uso, invalidación de sesiones; onboarding posterior al acceso y omisión; cambios de perfil y confirmación sensible |
| CU-06/07 | Alta incompleta, documentación y activación; formato, tamaño, entidad/vencimiento, rechazo y conservación del PDF |
| CU-08/09/10 | Publicación, campos obligatorios, límite de abiertas; catálogo, cercanía, valoración, tags y resultado vacío |
| CU-11/12 | Postular/editar sin duplicar, rechazo sobre solicitud cerrada y perfil nuevo sin reseñas inventadas |
| CU-13/14/15 | Contratación pendiente, confirmación, conflicto de franja, rechazo/reapertura y cancelación antes de ejecución |
| CU-16 | Notificaciones locales por destinatario y enlace; no se envía push real |
| CU-17/18 | Efectivo con comisión única; revisión de monto; transferencia con comprobante, diferencia y acreditación; resolver un reporte no acredita por sí solo |
| CU-19/20 | Referencias de tarjeta sin número completo; reseñas por ambos participantes, sin autor ajeno ni duplicados |
| CU-21/22/23 | Historial por participante; reporte/baja de reseña y promedio; listado con rol, estado y ficha |

Comando reproducible: servidor en `127.0.0.1:5501`, `npm install` y `npm test` con Edge. Resultado final: **34 comprobaciones aprobadas, cero fallidas**. La batería guarda detalle en `test-results/audit.json`. Incluye **48 rutas** (22 de cliente, 17 de prestador y nueve de administración), matriz de 67 entradas y recorrido completo mediante botones: publicar, postular, contratar, aceptar, informar monto, confirmar efectivo y calificar ambos.

Ejemplo comprobado: orden de $30.000, comisión de demo al 4%, un movimiento de deuda de $1.200 y dos reseñas verificadas. Se inspeccionaron capturas de las dos aplicaciones y de la presentación en escritorio y móvil. Esto verifica el prototipo local; no certifica integraciones externas, todas las combinaciones posibles ni producción.

## Diferencias del documento que requieren acuerdo del equipo

- **Recupero:** sección 14 lo marca MVP; RF-03 no.
- **Perfil:** sección 14 lo deja fuera; RF-05 lo marca MVP.
- **Catálogo, filtros y candidatos:** MVP en sección 14; RF-08/11/13 sin marca.
- **Cancelar y notificar:** MVP en sección 14; RF-17/18 sin marca.
- **Tarjetas y reputación:** MVP en sección 14; RF-22/23/25 sin marca.
- **Moderación:** MVP en sección 14; RF-29 sin marca. Panel completo fuera, aunque usuarios/moderación necesitan una interfaz mínima.
- **Tarjetas guardadas frente a cobro:** gestionar referencias se marca MVP, pero cobrar con tarjeta figura fuera. CU-13 menciona tarjeta como medio previsto.
- **Territorio:** el PDF menciona Córdoba con alcance por definir; Santa Fe en el código es un escenario de ejemplo.
- **Encuestas:** cada gráfico tiene diez respuestas. Boca a boca: 50% en p. 9 frente a 60% en texto de p. 3. Perfil “muy útil”: 50% en p. 13 frente a 60% en conclusión de p. 15. No se inventa una conciliación.
- **Equipo:** documentos históricos con cinco integrantes. Para la presentación actual se usan Corti, Cavanna, Reinante y Turchi por indicación expresa; no se altera la composición histórica de los originales.

## Límites y pendientes reales

La versión es estática y local. No satisface técnicamente credenciales seguras, cifrado documental, correo, push, GPS, tokenización real ni consultas externas. No cargar datos reales. Las preferencias y sesiones son locales, y el almacenamiento no ofrece transacciones entre dispositivos.

El documento menciona límites y plazos sin valores: 15 minutos, $15.000 y tres solicitudes son parámetros de demo, no requisitos acordados. También faltan definir plazos de calificación/cancelación y reglas concretas por rubro; no se agregan sanciones ni fórmulas para completarlos. La demostración no prueba una validación de usabilidad con usuarios reales.

El PDF de defensa exportado se encuentra en `output/pdf/`; es una explicación nueva de esta revisión. No reemplaza el documento original ni modifica el sitio Netlify enlazado por el equipo.
