# Royal Solutions

Apps de cliente y prestador para publicar y contratar servicios de oficios y changas.

Equipo: Elías Corti, Joaquín Cavanna, Marco Turchi y Tadeo Reinante.

## Ejecutar

Usar `abrir.bat`, o ejecutar `python -m http.server 5501 --bind 127.0.0.1` y abrir `http://127.0.0.1:5501/`.

La raíz muestra directamente ambas apps en teléfonos. Los rótulos abren cada app individual: `cliente.html` y `prestador.html`. La primera visita prepara Lucía y Ramiro con los datos existentes, sin reiniciar el estado; las siguientes conservan las sesiones y los cierres de sesión. `presentacion.html` redirige a las apps para conservar enlaces antiguos. El panel interno sigue en `admin.html`, sin acceso desde la portada pública.

Ambas apps usan tema claro. No hay billetera de prestador, agenda semanal ni atajos de volver a contratar. Rubros y descripción se edita por separado de zona y disponibilidad.

Se requiere HTTP; no abrir con `file://`.

## Recorrido funcional

Publicar una necesidad, postular con precio y mensaje, elegir un prestador desde la solicitud o catálogo, acordar fecha/franja, confirmar o rechazar, informar ejecución, registrar pago y calificar. Se conservan búsqueda y filtros, favoritos, direcciones, mensajes por orden, notificaciones, alta y documentación, reputación e historial.

Efectivo, transferencia y Mercado Pago son operaciones de ejemplo. La comisión se registra internamente; el panel administrativo conserva el registro de su regularización. No existe una billetera ni gestión de saldo en la app del prestador.

El estado se conserva en `localStorage` y se comparte entre apps del mismo navegador/origen. No hay backend, base remota, correo, GPS, push, cobros ni verificaciones documentales externas. Usar exclusivamente datos ficticios; no cargar documentos ni tarjetas reales.

## Documentos actualizados

- POC: `output/pdf/RoyalSolutions_POC_Actualizado.pdf`.
- DER: `output/pdf/RoyalSolutions_DER_Actualizado.pdf`.
- [Comparación y cambios](docs/REVISION_DOCUMENTAL.md).
- [Alcance y casos de uso editables](docs/SECCIONES_14_15_POC.md).
- [Modelo, cardinalidades y reglas](docs/MODELO.md).
- [Fuente del DER](docs/poc/modelo.py), [Mermaid](docs/poc/DER.mmd) y el DER completo Graphviz en `docs/poc/der/completo.dot`.
- [Regeneración de documentos](docs/poc/LEEME.md).

Se conservan el documento original y sus matrices; los agregados completan 38 requerimientos y 33 casos de uso. El DER es una sola lámina de 25 entidades y 40 relaciones. El documento y ambas apps usan el escudo con la corona confirmado por el equipo. Es un modelo lógico propuesto; la app aún usa objetos JSON. Los PDF generados y resultados de pruebas están ignorados en Git y se entregan como archivos locales.

## Verificación

Con Node, Edge y el servidor en puerto 5501, ejecutar `npm install` y `npm test`. Playwright es una dependencia de desarrollo; las apps no necesitan build ni dependencias de ejecución. El resultado se guarda en `test-results/audit.json` y las capturas en `test-results/`.

Las pruebas incluyen los recorridos centrales, revisión de las pantallas y las eliminaciones solicitadas. No certifican una operación productiva ni servicios externos.

## Accesos de ejemplo

Contraseña: `demo1234`. Cliente: `lucia@demo.com`. Prestador: `ramiro@demo.com`. Interno: `admin@royal.com`. También existen perfiles con documentación observada y restricciones para comprobar alternativas.

Las herramientas de prueba se abren manteniendo el logo dos segundos, tocando cinco veces la versión del perfil o mediante `?dev=1`. `?reset=1` reinicia explícitamente los datos de ejemplo.
