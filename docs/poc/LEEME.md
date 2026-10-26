# Documento funcional corregido - 26/10/2026

Esta revisión responde al pedido de mantener la introducción, investigación, encuestas y gráficos, y corregir exclusivamente alcance, MVP/POC, requerimientos, recorridos de cliente/prestador y trazabilidad.

## Entrega

- Documento completo: `output/pdf/RoyalSolutions_Final_Corregido_POC.pdf` (41 páginas).
- Texto editable de las secciones sustituidas: `docs/SECCIONES_14_15_POC.md`.
- Fuente estructurada: `docs/poc/especificacion.py`.
- Generador y validación: `scripts/generar_documento_poc.py`.

Las primeras 15 páginas se toman directamente del PDF original, conservando sus textos, imágenes y streams gráficos. Desde la página 16 se reemplazan las secciones 14 y 15. El original de `../material-fuente/` no se sobrescribe.

## Decisiones incorporadas

- Efectivo, transferencia y Mercado Pago incluidos en el recorte funcional de la POC, con ejecución externa simulada.
- Pago del servicio y pago de la deuda de comisión como operaciones diferentes.
- Regularización por transferencia o Mercado Pago; sin recepción física de efectivo por Royal.
- Billetera definida como resumen de cobros y comisiones, sin retiros ni dinero electrónico disponible.
- Disponibilidad semanal y agenda Día/Semana vinculadas a los CU existentes de alta y consulta de órdenes.
- Estados de orden separados de estados de pago, revisión, alta y calificación.
- RF-01 a RF-30 conservados y aclarados; RF-31 a RF-35 añadidos.
- CU-01 a CU-23 conservados y revisados; CU-24 a CU-28 añadidos.
- Matriz en tres bloques e inversa RF a CU, ambas generadas de las mismas referencias.

## Validación realizada

El generador comprueba numeración continua de 35 RF y 28 CU, cobertura completa entre alcance/RF/CU, referencias existentes y campos completos de cada caso. Tras generar, reabre el PDF y compara las primeras 15 páginas con el original: texto, hash del contenido gráfico y hashes de las imágenes. El informe se escribe en `tmp/pdfs/validacion_documento.json`.

Además se renderizaron e inspeccionaron las 26 páginas nuevas y se comprobó que no existiera texto fuera de sus márgenes.

## Relación con el software

El pedido de este turno modifica el documento, no la aplicación. Esta especificación define la referencia revisada: no afirma que todos los nuevos flujos estén ya implementados. En particular, habrá que contrastar la regularización pendiente de acreditar, los resultados MP pendientes, las validaciones de disponibilidad y los medios visibles del cliente antes de presentar la web como cumplimiento de esta revisión.

La página de presentación y la guía de defensa anteriores pertenecen a la revisión previa; sus afirmaciones de Mercado Pago fuera del MVP quedan superadas por este documento. No deben usarse como la matriz vigente de esta revisión.

## Regenerar

Desde la raíz del repositorio, ejecutar el generador con Python y las bibliotecas `reportlab` y `pypdf`. Utiliza las fuentes Times de Windows y el PDF original ubicado junto al repositorio en `material-fuente/`.

Los PDF y los archivos de revisión visual quedan fuera de Git; el contenido editable y el generador permiten reconstruir la entrega.
