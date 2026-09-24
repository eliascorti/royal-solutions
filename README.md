# Royal Solutions · MVP navegable

Plataforma de oficios y changas para **Santa Fe capital**. Conecta a quien necesita un servicio cotidiano con prestadores verificados cerca, con reputación real y acuerdo económico dentro de la plataforma.

Tres apps que comparten el mismo estado en el navegador (localStorage + BroadcastChannel): lo que pasa en una se ve en las otras en tiempo real.

| App | Archivo | Dirección corta (Netlify) |
|---|---|---|
| Inicio y vista demo | `index.html` | `/` y `/demo` |
| App Cliente (mobile) | `cliente.html` | `/cliente` |
| App Prestador (mobile) | `prestador.html` | `/prestador` |
| Panel Admin (web) | `admin.html` | `/admin` |

## Cómo correrlo

Tiene que abrirse desde un servidor (no con `file://`), para que las apps compartan el almacenamiento.

- **Windows:** doble clic en `abrir.bat` (necesita Python). Abre `http://localhost:5500`.
- **Cualquier sistema:** `python -m http.server 5500` o `npx serve .` desde la carpeta.
- **Netlify:** conectar el repo; `netlify.toml` ya publica la raíz sin build. Cada push a `main` se publica solo.

Sin frameworks ni build: HTML + CSS + JavaScript (ES modules).

## Cuentas de demo

Todas usan la contraseña `demo1234`. En cada login hay botones de acceso rápido.

| Cuenta | Email | Para mostrar |
|---|---|---|
| Lucía Ferreyra, cliente (Candioti) | `lucia@demo.com` | Publicar, contratar, pagar, calificar |
| Ramiro Bustos, gasista y plomero matriculado | `ramiro@demo.com` | Postularse, ejecutar la orden, billetera |
| Alejandro Paredes, alta observada | `alejandro.paredes@demo.com` | Corregir documentación |
| Daniel Toledo, bloqueado por deuda | `daniel.toledo@demo.com` | Límite de deuda por efectivo y regularizar |
| Mesa de Operaciones, admin | `admin@royal.com` | Panel de administración |

## Panel oculto de demo

Se abre sin botones visibles:
- mantener presionado el logo **2 segundos**, o
- tocar **5 veces** el número de versión en Perfil, o
- abrir cualquier app con `?dev=1`.

Opciones: cargar el escenario demo, reiniciar el onboarding, resetear los datos, avanzar el reloj 1 hora y simular eventos (nueva postulación, prestador en camino, cliente confirma pago, documento vencido). `?reset=1` resetea todo y recarga.

Si una app se queda sola (por ejemplo, solo la del cliente abierta), la otra parte avanza en "piloto automático": el prestador acepta, sale, llega e inicia el trabajo, y el chat responde solo. Así la demo funciona también con una sola pantalla.

## Guion de demo · 5 minutos

**Preparación (antes de empezar):** abrir `/demo` (o `index.html#demo`) y, en una pestaña aparte, `/admin`. Abrir el panel oculto manteniendo presionado el logo y tocar **Cargar escenario demo**. Esto deja a Lucía logueada como cliente y a Ramiro como prestador.

1. **El problema (0:00–0:30).** En Tracción, mostrar las encuestas del POC: el 80% de los prestadores usaría la app, el 90% acepta verificar su identidad y el 80% de los clientes prioriza las reseñas.
2. **Publicar en menos de 45 s (0:30–1:15).** El escenario ya publicó "Se rompió el flexible del lavatorio" en Candioti. Si querés hacerlo en vivo, en el teléfono de Lucía tocá *Publicar changa*: rubro → sugerencia → *Siguiente* ×3 → *Publicar*. El toast muestra el tiempo que llevó.
3. **Postulaciones en vivo (1:15–2:00).** En unos 20 segundos llegan 3 postulaciones: Hugo, Ramiro y Matías (perfil nuevo, mostrado con honestidad). Tocar *Comparar* para ver la tabla de precio, calificación, distancia y verificación. Abrir el perfil de Ramiro: DNI, antecedentes, matrícula de gas con número y vencimiento, reseñas verificadas.
4. **Contratar y ejecutar (2:00–3:15).** Elegir a Ramiro y pagar en efectivo. En el teléfono de Ramiro: *Aceptar* → *Salir hacia el domicilio*. En el de Lucía se ve el mapa con el prestador en movimiento y su **código de 4 dígitos**. Ramiro ingresa el código → *Finalizar trabajo* con el monto.
5. **Pago y reputación (3:15–4:00).** Lucía confirma el pago en efectivo y califica con 5 estrellas y los tags *Puntual* y *Prolijo*. En la Billetera de Ramiro aparece la **deuda de comisión diferida** (4%) y la barra del límite de $ 15.000.
6. **Chat seguro (4:00–4:20).** En el chat, escribir "pasame tu wsp 342 555 1234": el dato se oculta y aparece el aviso de por qué conviene quedarse en la plataforma.
7. **Operación y control (4:20–5:00).** En el admin: Dashboard con GMV, take rate y la actividad en vivo de todo lo anterior. En Verificaciones, abrir a Franco (electricista, riesgo alto), ampliar la matrícula y **Aprobar**. En Disputas, resolver el caso del monto que no coincide. En Auditoría queda cada acción con quién, qué y cuándo.

## Estructura

```
index.html · cliente.html · prestador.html · admin.html
css/  tokens.css (tema claro/oscuro) · base.css · mobile.css · admin.css
js/   store.js   backend falso: estado, máquinas de estado, notificaciones, auditoría, reloj de simulación
      seed.js    datos de ejemplo de Santa Fe (25 prestadores, 15 clientes, ~135 órdenes, reseñas, disputas)
      sync.js    sincronización entre pestañas e iframes, presencia y pestaña líder
      ui.js      componentes, formato, mapa SVG, gráficos, documentos simulados
      shell.js   base común de las apps mobile (router, login, onboarding, chat)
      cliente.js · prestador.js · admin.js · devtools.js · data.js · icons.js
docs/MODELO.md   modelo de datos, máquinas de estado y trazabilidad con los casos de uso del POC
```

Toda escritura pasa por `store.js`. Las claves de localStorage usan el prefijo `rs_`. Si cambia la versión del esquema (`rs_schema_version`), los datos se vuelven a cargar solos.

## Qué está simulado

Validación de identidad (DNI, selfie, antecedentes, video), pasarela de pagos (Mercado Pago y tarjetas tokenizadas), conciliación de transferencias, geolocalización (mapa SVG de barrios de Santa Fe), notificaciones push (banner dentro de la app) y los emails de recupero (bandeja simulada). No se procesa dinero ni datos reales.
