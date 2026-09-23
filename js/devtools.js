// Panel oculto de desarrollo / demo.
// Se abre con: 5 toques en el número de versión, mantener presionado el logo 2 s, o ?dev=1.
import * as S from './store.js';
import { sheet, confirmDialog, toast, icon, run } from './ui.js';

export function initDevtools(app) {
  let taps = 0, tapTimer = null, pressTimer = null;

  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-version]')) return;
    taps++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { taps = 0; }, 2500);
    if (taps >= 5) { taps = 0; open(app); }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('[data-logo]')) return;
    pressTimer = setTimeout(() => open(app), 2000);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => document.addEventListener(ev, () => clearTimeout(pressTimer)));

  if (new URLSearchParams(location.search).get('dev') === '1') setTimeout(() => open(app), 400);
}

function open(app) {
  if (document.querySelector('[data-devtools]')) return;
  const s = sheet({
    title: 'Panel de demo',
    body: `<div class="stack" data-devtools>
      <p class="small muted">Herramientas para presentar. Los cambios impactan en las 3 apps abiertas.</p>
      <div class="card list">
        <button class="li" data-dv="scenario">${icon('play')}<div class="grow"><div class="strong small">Cargar escenario demo</div><div class="xs muted">Lucía publica “se rompió el flexible”, llegan 3 postulaciones en ~20 s</div></div></button>
        <button class="li" data-dv="onboarding">${icon('refresh')}<div class="grow small">Reiniciar onboarding</div></button>
        <button class="li" data-dv="clock">${icon('clock')}<div class="grow small">Avanzar tiempo 1 hora</div></button>
        <button class="li" data-dv="reset">${icon('trash')}<div class="grow small" style="color:var(--danger)">Resetear todos los datos (re-seed)</div></button>
      </div>
      <div class="upper">Simular evento</div>
      <div class="card list">
        <button class="li" data-sim="postulacion">${icon('briefcase')}<span class="grow small">Nueva postulación</span></button>
        <button class="li" data-sim="en_camino">${icon('nav')}<span class="grow small">Prestador en camino</span></button>
        <button class="li" data-sim="pago">${icon('cash')}<span class="grow small">Cliente confirma pago</span></button>
        <button class="li" data-sim="doc_vencido">${icon('file')}<span class="grow small">Documento vencido</span></button>
      </div>
      <p class="xs faint mono">Tip: abrí cualquier app con ?reset=1 para resetear y recargar.</p>
    </div>`,
  });
  const reload = () => { s.close(); setTimeout(() => location.reload(), 150); };
  s.el.querySelectorAll('[data-dv]').forEach((b) => {
    b.onclick = async () => {
      const k = b.dataset.dv;
      if (k === 'onboarding') { S.resetOnboarding(); toast('Onboarding reiniciado', 'ok'); reload(); }
      if (k === 'clock') { S.advanceClock(3600000); S.tick(); toast('Reloj +1 hora', 'ok'); }
      if (k === 'reset') {
        if (await confirmDialog('Se borran todos los datos y se vuelven a cargar los de ejemplo.', { title: 'Resetear datos', ok: 'Resetear', danger: true })) { S.resetAll(); reload(); }
      }
      if (k === 'scenario') {
        if (await confirmDialog('Se resetean los datos y se inicia sesión como Lucía (cliente) y Ramiro (prestador).', { title: 'Cargar escenario demo', ok: 'Cargar' })) {
          S.loadScenario();
          location.hash = app === 'prestador' ? '#/trabajos' : app === 'admin' ? '#/dashboard' : '#/mis-changas';
          reload();
        }
      }
    };
  });
  s.el.querySelectorAll('[data-sim]').forEach((b) => {
    b.onclick = () => run(b, async () => { const msg = S.simulate(b.dataset.sim); S.tick(); toast(msg, 'ok'); });
  });
}
