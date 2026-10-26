# Royal Solutions · MVP avanzado académico

Equipo actual: **Corti, Cavanna, Reinante y Turchi**.

Prototipo funcional de oficios y changas, con alcance contrastado con RoyalSolutions_Final.pdf y Royal_Solutions_MVP_Enlaces.pdf. Los originales se conservan fuera del repositorio, en `../material-fuente/`.

## Abrir

Ejecutar `abrir.bat`, o `python -m http.server 5501 --bind 127.0.0.1` y abrir http://127.0.0.1:5501/.

- `presentacion.html`: MVP frente a alcance completo, matriz de 67 entradas, mockup, guion y cuatro bloques de exposición.
- `index.html#demo`: cliente y prestador en dos teléfonos.
- `cliente.html`, `prestador.html`, `admin.html`: aplicaciones individuales.

Se necesita HTTP; no abrir las aplicaciones con `file://`.

## Alcance

El MVP permite publicar, postularse, contratar con fecha, confirmar/rechazar/cancelar, informar finalización, registrar el pago, calcular comisión y calificar. También contempla cuentas, recupero, catálogo con filtros, alta y certificados, tarjetas guardadas, historial y moderación básica.

Se adopta como criterio de lectura la columna MVP de la sección 14 (pp. 16-18). La página de presentación registra sus diferencias con las marcas de RF. No se afirma que ambos listados coincidan. “Avanzado” describe el detalle del recorrido y sus alternativas, no disponibilidad para producción.

Chat, mapas esquemáticos, favoritos, identidad, video y checkout representan ampliaciones documentadas del alcance completo. Tracking real, 2FA, referidos, fidelidad, fondo de garantía y otros módulos solo previstos no tienen una ejecución ficticia añadida.

## Límites reales

Estado ficticio en `localStorage` (`rs_db`), compartido por BroadcastChannel y eventos storage entre pestañas del mismo navegador y origen. Sin backend ni base remota, correo, push, GPS, consulta de antecedentes o biometría reales. Pagos y tokenización simulados; no hay cobros ni cuenta bancaria operativa. Contraseñas y archivos se guardan localmente: no cumple seguridad productiva ni el cifrado de CU-07. No cargar datos personales, documentos ni tarjetas reales.

Los barrios de Santa Fe son ejemplos. El PDF menciona Córdoba con alcance a definir; no se presenta una ciudad de lanzamiento como acordada.

## Preparación de demo

Contraseña común: `demo1234`. Cuentas: `lucia@demo.com` (cliente), `ramiro@demo.com` (prestador), `alejandro.paredes@demo.com` (corrección de documentos), `daniel.toledo@demo.com` (restricción por comisiones) y `admin@royal.com`.

Mantener el logo dos segundos, tocar cinco veces la versión o agregar `?dev=1` abre las herramientas. Cargar escenario demo inicia cliente y prestador y prepara tres postulaciones de ejemplo. Las postulaciones automáticas son una ayuda de presentación: no representan usuarios conectados. Aceptar, finalizar, pagar y calificar requieren acciones manuales.

El plazo de confirmación de 15 minutos, límite de deuda de $15.000, máximo de tres solicitudes y clasificación de rubros son parámetros de prueba, no valores fijados por el PDF. El rango de comisión 3-5% sí está documentado; su distribución por rubro es de demo.

## Documentación

- [Guía de exposición](docs/GUIA_DEFENSA.md).
- [Modelo actual](docs/MODELO.md).
- [Revisión documental](docs/REVISION_DOCUMENTAL.md).

## Pruebas

Con Node, Edge y servidor local en puerto 5501: `npm install` y `npm test`. Playwright solo se usa para pruebas; las aplicaciones no tienen build ni dependencias de ejecución. Resultados y capturas se escriben en `test-results/` (ignorado por Git).

La verificación cubre reglas locales CU-01 a CU-23, pantallas y un circuito completo mediante controles visibles. No certifica servicios externos ni producción.

## Publicación

La revisión es local. Los PDF originales y el sitio publicado no se modificaron. El repositorio conserva su configuración estática Netlify: un push podría activar su despliegue, por lo que debe revisarse antes de publicar.
