# Royal Solutions · Guía para los cuatro integrantes

Equipo actual: **Corti, Cavanna, Reinante y Turchi**. Reparto propuesto para una defensa de 16 minutos, cuatro minutos por persona. Es un reparto de exposición actual, no una atribución de autoría histórica.

## 1. Cavanna: problema y propuesta

Fuentes: secciones 3-7, pp. 2-7 del PDF. Explicar las necesidades de ambas partes: el cliente busca confianza y disponibilidad; el prestador busca visibilidad y reputación. Presentar la propuesta de valor, los competidores y el proceso de Design Thinking. La comparación competitiva pertenece al documento histórico; no presentarla como investigación actualizada sin revisar sus fuentes.

Apertura: “Royal Solutions busca facilitar la contratación de oficios y changas. El problema afecta tanto a quien necesita resolver un trabajo como a quien necesita encontrar clientes”.

Conectar funcionalidades con necesidades: certificados y reseñas para decidir con información; postulación para comparar propuestas; registro del acuerdo y pago para dar continuidad al servicio.

Transición: “Estas necesidades orientaron la investigación; ahora mostramos sus resultados y el recorte elegido”.

## 2. Reinante: evidencia y alcance

Fuentes: sección 8 y sección 14. Los gráficos muestran diez respuestas por encuesta: evidencia exploratoria, sin afirmar representatividad del mercado. Prestadores: 80% usaría una aplicación y 90% aceptaría verificar su identidad. Clientes: 80% seleccionó calificaciones/reseñas y 70% pago desde la app y verificación de identidad (p. 10, respuestas múltiples).

Advertir las diferencias del documento: boca a boca 50% en gráfico de p. 9 frente a 60% en texto de p. 3; perfil “muy útil” 50% en gráfico de p. 13 frente a 60% en conclusión de p. 15. No inventar una conciliación.

Mostrar `presentacion.html#matriz` y explicar:

- **MVP:** recorte para validar el circuito principal, según sección 14.
- **MVP avanzado:** detalle del prototipo, alternativas y relación entre los tres roles.
- **Alcance completo:** visión escrita del sistema, también con funciones solo previstas.
- **Simulación:** que una pantalla funcione localmente no demuestra una integración externa.

Transición: “Con ese alcance definido, mostramos cómo una necesidad se transforma en una contratación”.

## 3. Turchi: mockup y recorrido del cliente

Fuentes: CU-01 a CU-13. Un mockup representa pantallas, jerarquía, iconos y navegación. El prototipo funcional permite ejecutar interacciones y modificar datos. El PDF menciona Figma, pero ese diseño no está en el repositorio: no atribuirle un archivo que no se inspeccionó.

Mostrar inicio, catálogo, búsqueda, filtros por valoración/cercanía/tags, perfil, publicación, comparación y contratación con fecha y precio. Mostrar una búsqueda vacía o un formulario incompleto. Un perfil nuevo debe aparecer sin reseñas inventadas.

La carcasa de teléfono de la vista demo es un marco visual; sus pantallas interiores ejecutan las aplicaciones. Nombres, barrios, importes, documentos y trabajos son ejemplos ficticios.

Transición: “La contratación genera una orden pendiente. Ahora el prestador debe confirmarla y completar el circuito”.

## 4. Corti: cierre, administración y viabilidad técnica

Fuentes: CU-14 a CU-23. Aceptar la orden, informar finalización y monto, confirmar el efectivo y mostrar la comisión. Ejemplo: $30.000 al 4% de demo genera $1.200 de deuda por efectivo; el documento define el rango 3-5%, no su asignación exacta por rubro.

Las dos partes califican una sola vez y solo si participaron en la orden finalizada. Mostrar usuarios y moderación básica. Resolver un reporte no demuestra una devolución ni una acreditación bancaria.

Arquitectura real: HTML, CSS y módulos JavaScript, estado local y sincronización entre pestañas del mismo navegador y origen. No hay backend ni servicios externos operativos. Credenciales seguras, cifrado de certificados, push, email, GPS, biometría y cobros necesitan desarrollo posterior.

Cierre: “El prototipo permite evaluar un recorrido consistente con los casos de uso. La siguiente etapa es validar su uso y resolver las definiciones pendientes antes de integrar servicios reales”.

## Preparación conjunta

1. Abrir la presentación, la vista demo y una pestaña de administración.
2. Mantener el logo dos segundos y cargar el escenario, o publicar y postularse manualmente.
3. Ensayar el circuito completo: aceptar, finalizar, pagar y calificar requieren acciones manuales.
4. Usar efectivo como recorrido principal y transferencia como alternativa. Chat, mapa y checkout se explican aparte como alcance completo.
5. Usar esta copia local. El sitio Netlify enlazado en el PDF sigue mostrando su versión publicada hasta una publicación posterior.

## Preguntas que todos deben poder responder

- **¿Está listo para operar?** Es un prototipo académico; la simulación no demuestra seguridad ni integración bancaria.
- **¿Por qué hay funciones fuera del MVP?** Están escritas en el alcance completo y se identifican como ampliaciones; su presencia no cambia silenciosamente el recorte original.
- **¿Qué prueba la encuesta?** Señales exploratorias de una muestra pequeña; no ventas, adopción real ni representatividad estadística.
- **¿Qué falta definir?** Marcas MVP contradictorias, territorio, plazos y límites, reglas concretas por rubro e integraciones.
- **¿Por qué aparecen cinco nombres en los PDF?** Son documentos históricos. La exposición actual corresponde a cuatro integrantes; no se modificó esa evidencia original.
