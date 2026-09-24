// Shell común de las apps mobile (cliente y prestador): layout, router, login/registro,
// onboarding, notificaciones, chat y refresco en vivo cuando otra pestaña cambia el estado.
import * as S from './store.js';
import { initSync, setPresenceUser } from './sync.js';
import { initDevtools } from './devtools.js';
import { APP_VERSION, BARRIOS } from './data.js';
import {
  icon, esc, avatar, toast, pushBanner, run, initTheme, toggleTheme, parseHash, matchRoute, go, skeleton, delay,
  fmtRel, fmtTime, empty, sheet, qs, qsa,
} from './ui.js';

export function startMobileApp(cfg) {
  const { app } = cfg;
  const url = new URLSearchParams(location.search);
  if (url.get('reset') === '1') {
    S.resetAll();
    location.replace(location.pathname + location.hash);
    return;
  }
  document.body.classList.add('m');
  if (window.self !== window.top) document.body.classList.add('embedded');
  initTheme(app, cfg.theme);
  S.load();

  document.body.innerHTML = `<div class="device"><header class="appbar" id="appbar"></header><main class="screen" id="screen" tabindex="-1"></main><div id="cta"></div><nav class="tabbar" id="tabbar" aria-label="Navegación principal"></nav></div>`;
  const $appbar = qs('#appbar'), $screen = qs('#screen'), $cta = qs('#cta'), $tabbar = qs('#tabbar');

  const ctx = {
    app, user: null, params: {}, query: {}, go,
    refresh: () => render(false),
    get db() { return S.getDb(); },
  };
  let current = null; // { key, view }
  const seen = new Set();

  const routes = {
    '/login': loginView(cfg),
    '/registro': registerView(cfg),
    '/recuperar': recoverView(),
    '/recuperar/:token': resetView(),
    '/notificaciones': notificationsView(app),
    '/chat/:id': chatView(app),
    ...cfg.routes,
  };

  function loadUser() {
    const uid = S.getSession(app);
    ctx.user = uid ? S.user(uid) : null;
    if (uid && !ctx.user) S.logout(app);
    cfg.onUser?.(ctx);
    setPresenceUser(ctx.user?.id || null);
  }

  async function render(navigated = true) {
    loadUser();
    let { path, query } = parseHash();
    if (path === '/') path = ctx.user ? cfg.home : '/login';
    let m = matchRoute(routes, path);
    if (!m) { go(ctx.user ? cfg.home : '/login'); return; }
    if (!ctx.user && !m.view.public) { go('/login'); return; }
    if (ctx.user && m.view.public && path === '/login') { go(cfg.home); return; }
    const guard = ctx.user && cfg.guard?.(ctx, m.pattern);
    if (guard && guard !== path) { go(guard); return; }

    ctx.params = m.params; ctx.query = query;
    const view = m.view;
    const key = location.hash;
    const isNew = navigated || current?.key !== key;
    current = { key, view };

    renderChrome(view);
    const scroll = isNew ? 0 : $screen.scrollTop;
    if (isNew && view.skeleton !== false) {
      $screen.innerHTML = `<div class="view">${skeleton(view.skeleton || 'list')}</div>`;
      await delay(220 + Math.random() * 260); // latencia "de red"
      if (current.key !== key) return;
    }
    let html;
    try { html = await view.render(ctx); } catch (e) { console.error(e); html = empty('alert', 'No pudimos cargar esta pantalla', e.message); }
    if (current.key !== key) return;
    const cta = view.cta ? view.cta(ctx) : '';
    $screen.innerHTML = `<div class="view ${view.cls || ''} ${cta ? 'has-cta' : ''}">${html}</div>`;
    $cta.innerHTML = cta ? `<div class="cta-bar">${cta}</div>` : '';
    view.mount?.(qs('.view', $screen), ctx);
    $screen.scrollTop = scroll;
    if (isNew) $screen.focus({ preventScroll: true });
  }

  function renderChrome(view) {
    const title = typeof view.title === 'function' ? view.title(ctx) : view.title || '';
    const unread = ctx.user ? S.unreadCount(ctx.user.id, app) : 0;
    const left = view.back
      ? `<button class="btn ghost icon back" data-act="__back" aria-label="Volver">${icon('left')}</button>`
      : `<span class="logo" data-logo><span class="mark">R</span></span>`;
    const right = [
      view.actions?.bar ? view.actions.bar(ctx) : '',
      ctx.user && !view.public ? `<button class="btn ghost icon icon-btn" data-go="/notificaciones" aria-label="Notificaciones">${icon('bell')}${unread ? `<span class="count">${unread > 9 ? '9+' : unread}</span>` : ''}</button>` : '',
    ].join('');
    $appbar.innerHTML = `${left}<div class="title">${esc(title)}</div>${right}`;
    $appbar.classList.toggle('hidden', !!view.noBar);
    if (view.tab && ctx.user) {
      $tabbar.classList.remove('hidden');
      $tabbar.innerHTML = cfg.tabs.map((t) => {
        const n = t.badge ? t.badge(ctx) : 0;
        return `<a href="#${t.path}" class="${view.tab === t.path ? 'on' : ''}" ${view.tab === t.path ? 'aria-current="page"' : ''}>${icon(t.icon)}<span>${t.label}</span>${n ? `<span class="count">${n > 9 ? '9+' : n}</span>` : ''}</a>`;
      }).join('');
    } else {
      $tabbar.classList.add('hidden');
    }
  }

  // ── refresco en vivo ──
  let pending = false;
  function onChange() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      loadUser();
      showPushes();
      if (!current) return;
      const view = current.view;
      renderChrome(view);
      const el = qs('.view', $screen);
      if (view.update && el) { view.update(el, ctx); return; }
      if (view.live === false) return;
      const a = document.activeElement;
      if (a && $screen.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return; // no pisar lo que se está escribiendo
      if (document.querySelector('.sheet, .modal')) return;
      render(false);
    });
  }
  function showPushes() {
    if (!ctx.user) return;
    const mine = S.notificationsOf(ctx.user.id, app).filter((n) => !n.leida && !seen.has(n.id));
    mine.slice(0, 2).forEach((n) => {
      if (location.hash === '#' + n.link && n.tipo === 'msg') return;
      pushBanner(n, () => go(n.link));
    });
    mine.forEach((n) => seen.add(n.id));
  }

  S.subscribe(() => onChange());
  initSync(app, () => { if (S.syncFromStorage()) onChange(); });
  setInterval(() => S.tick(), 1500);
  setInterval(updateCountdowns, 1000);

  // ── delegación de eventos ──
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); go(g.dataset.go); return; }
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const name = a.dataset.act;
    if (name === '__back') { history.length > 1 ? history.back() : go(cfg.home); return; }
    if (name === '__theme') { toggleTheme(app); render(false); return; }
    if (name === '__logout') { S.logout(app); setPresenceUser(null); go('/login'); return; }
    const fn = current?.view.actions?.[name];
    if (fn) { e.preventDefault(); fn(a, e, ctx); }
  });

  window.addEventListener('hashchange', () => render(true));

  // ── onboarding (una sola vez por app) ──
  loadUser();
  seedSeen();
  function seedSeen() { if (ctx.user) S.notificationsOf(ctx.user.id, app).forEach((n) => seen.add(n.id)); }
  window.addEventListener('rs:login', () => { loadUser(); seedSeen(); });
  if (!localStorage.getItem(`rs_onboarding_done_${app}`)) showOnboarding(cfg, () => render(true));
  else render(true);

  initDevtools(app);
}

function updateCountdowns() {
  qsa('[data-countdown]').forEach((el) => {
    const ms = Number(el.dataset.countdown) - S.now();
    if (ms <= 0) { el.textContent = '00:00'; return; }
    const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
    el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });
}

/* ───────────── onboarding ───────────── */
function showOnboarding(cfg, done) {
  const slides = cfg.onboarding;
  let i = 0;
  const el = document.createElement('div');
  el.className = 'onb';
  document.querySelector('.device').appendChild(el);
  const finish = () => { localStorage.setItem(`rs_onboarding_done_${cfg.app}`, '1'); el.remove(); done(); };
  const draw = () => {
    const s = slides[i];
    el.innerHTML = `<div class="top"><span class="logo"><span class="mark">R</span>Royal Solutions</span><button class="btn ghost sm" data-skip>Saltar</button></div>
      <div class="body"><span class="num">0${i + 1} / 0${slides.length}</span><h1>${esc(s.title)}</h1><p>${esc(s.text)}</p>${s.figure ? `<div class="figure">${s.figure}</div>` : ''}</div>
      <div class="bottom"><div class="steps">${slides.map((_, k) => `<span class="${k <= i ? 'on' : ''}"></span>`).join('')}</div><button class="btn primary block" data-next>${i === slides.length - 1 ? 'Empezar' : 'Siguiente'}</button></div>`;
    el.querySelector('[data-skip]').onclick = finish;
    el.querySelector('[data-next]').onclick = () => { if (i === slides.length - 1) finish(); else { i++; draw(); } };
  };
  draw();
}

/* ───────────── auth ───────────── */
function field(id, label, type = 'text', attrs = '') {
  return `<div class="field"><label for="${id}">${label}</label><input class="input" id="${id}" name="${id}" type="${type}" ${attrs}><span class="err" id="${id}-err"></span></div>`;
}
function setErr(form, id, msg) {
  const inp = form.querySelector('#' + id);
  const er = form.querySelector('#' + id + '-err');
  inp?.classList.toggle('invalid', !!msg);
  if (er) er.textContent = msg || '';
  return !msg;
}

function loginView(cfg) {
  return {
    public: true, noBar: true, skeleton: false, live: false,
    render: () => `<div class="auth">
      <div class="brand"><span class="logo" data-logo style="font-size:20px"><span class="mark">R</span>Royal Solutions</span><p class="muted" style="margin-top:8px">${esc(cfg.tagline)}</p></div>
      <form id="login" class="stack" novalidate>
        ${field('email', 'Email', 'email', 'autocomplete="email" required')}
        ${field('pass', 'Contraseña', 'password', 'autocomplete="current-password" required')}
        <button class="btn primary block" type="submit">Entrar</button>
        <div class="row between small"><a href="#/recuperar">Olvidé mi contraseña</a><a href="#/registro">Crear cuenta</a></div>
      </form>
      <div class="section-title"><h2 class="upper">Accesos de demo</h2></div>
      <div class="quick">${cfg.quickLogins.map((q) => `<button class="btn" data-quick="${esc(q.email)}">${icon('user', 'sm')}${esc(q.label)}</button>`).join('')}</div>
    </div>`,
    mount(el) {
      const form = el.querySelector('#login');
      const doLogin = (email, pass, btn) => run(btn, async () => {
        await S.net();
        const u = S.login(email, pass, cfg.app);
        window.dispatchEvent(new Event('rs:login'));
        toast(`Hola, ${u.nombre}`, 'ok');
        go(cfg.home);
      });
      form.onsubmit = (e) => {
        e.preventDefault();
        const email = form.email.value.trim(), pass = form.pass.value;
        const ok = setErr(form, 'email', /\S+@\S+\.\S+/.test(email) ? '' : 'Ingresá un email válido.') & setErr(form, 'pass', pass ? '' : 'Ingresá tu contraseña.');
        if (ok) doLogin(email, pass, form.querySelector('[type=submit]'));
      };
      el.querySelectorAll('[data-quick]').forEach((b) => { b.onclick = () => doLogin(b.dataset.quick, 'demo1234', b); });
    },
  };
}

function registerView(cfg) {
  return {
    public: true, back: true, title: 'Crear cuenta', skeleton: false, live: false,
    render: () => `<form id="reg" class="stack" novalidate>
      <div class="row gap-3"><div class="grow">${field('nombre', 'Nombre', 'text', 'autocomplete="given-name"')}</div><div class="grow">${field('apellido', 'Apellido', 'text', 'autocomplete="family-name"')}</div></div>
      ${field('email', 'Email', 'email', 'autocomplete="email"')}
      ${field('telefono', 'Teléfono', 'tel', 'autocomplete="tel" placeholder="342 555-1234"')}
      ${field('dni', 'DNI', 'text', 'inputmode="numeric" placeholder="38.412.775"')}
      <div class="field"><label for="barrio">Barrio</label><select class="select" id="barrio">${BARRIOS.map((b) => `<option value="${b.id}">${esc(b.nombre)}</option>`).join('')}</select></div>
      ${field('pass', 'Contraseña', 'password', 'autocomplete="new-password"')}
      <p class="hint small faint" style="margin-top:-6px">Mínimo 8 caracteres, con al menos un número.</p>
      <label class="check"><input type="checkbox" id="terminos"> <span>Acepto los términos y condiciones y la política de privacidad de Royal Solutions.</span></label>
      <span class="err small" id="terminos-err" style="color:var(--danger)"></span>
      <button class="btn primary block" type="submit">Crear cuenta</button>
      ${cfg.app === 'prestador' ? '<p class="small muted center">Después de crear la cuenta vas a completar tu alta como prestador.</p>' : ''}
    </form>`,
    mount(el) {
      const f = el.querySelector('#reg');
      f.onsubmit = (e) => {
        e.preventDefault();
        const v = (k) => f.querySelector('#' + k).value.trim();
        let ok = true;
        ok &= setErr(f, 'nombre', v('nombre') ? '' : 'Requerido.');
        ok &= setErr(f, 'apellido', v('apellido') ? '' : 'Requerido.');
        ok &= setErr(f, 'email', /\S+@\S+\.\S+/.test(v('email')) ? '' : 'Email inválido.');
        ok &= setErr(f, 'telefono', v('telefono').replace(/\D/g, '').length >= 8 ? '' : 'Teléfono inválido.');
        ok &= setErr(f, 'dni', /^\d{7,8}$/.test(v('dni').replace(/\D/g, '')) ? '' : 'DNI inválido.');
        ok &= setErr(f, 'pass', v('pass').length >= 8 && /\d/.test(v('pass')) ? '' : 'Mínimo 8 caracteres y un número.');
        const terms = f.querySelector('#terminos').checked;
        f.querySelector('#terminos-err').textContent = terms ? '' : 'Tenés que aceptar los términos para continuar.';
        if (!ok || !terms) return;
        const dniRaw = v('dni').replace(/\D/g, '');
        const dni = dniRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        run(f.querySelector('[type=submit]'), async () => {
          await S.net();
          const u = S.register({ nombre: v('nombre'), apellido: v('apellido'), email: v('email'), telefono: v('telefono'), dni, pass: v('pass'), barrio: f.querySelector('#barrio').value });
          S.setSession(cfg.app, u.id);
          window.dispatchEvent(new Event('rs:login'));
          toast('Cuenta creada', 'ok');
          go(cfg.afterRegister || cfg.home);
        });
      };
    },
  };
}

function recoverView() {
  return {
    public: true, back: true, title: 'Recuperar contraseña', skeleton: false, live: false,
    render: () => `<form id="rec" class="stack" novalidate>
      <p class="muted">Te enviamos un enlace para crear una contraseña nueva. Vence en 30 minutos.</p>
      ${field('email', 'Email de tu cuenta', 'email')}
      <button class="btn primary block" type="submit">Enviar enlace</button>
      <div id="sent"></div>
    </form>`,
    mount(el) {
      const f = el.querySelector('#rec');
      f.onsubmit = (e) => {
        e.preventDefault();
        const email = f.email.value.trim();
        if (!setErr(f, 'email', /\S+@\S+\.\S+/.test(email) ? '' : 'Email inválido.')) return;
        run(f.querySelector('[type=submit]'), async () => {
          await S.net();
          S.requestPasswordReset(email);
          const mail = S.getDb().emails.find((m) => m.to === email.toLowerCase());
          f.querySelector('#sent').innerHTML = `<div class="banner ok">${icon('check')}<div>Si el email está registrado, te llega un enlace en unos segundos.</div></div>
            ${mail ? `<div class="card pad stack" style="margin-top:12px"><div class="upper">Bandeja simulada · ${esc(mail.to)}</div><div class="strong">${esc(mail.asunto)}</div><p class="small muted">${esc(mail.cuerpo)}</p><button type="button" class="btn sm" data-go="/recuperar/${mail.token}">Abrir enlace</button></div>` : ''}`;
        });
      };
    },
  };
}

function resetView() {
  return {
    public: true, back: true, title: 'Nueva contraseña', skeleton: false, live: false,
    render: () => `<form id="rs" class="stack" novalidate>
      ${field('p1', 'Contraseña nueva', 'password', 'autocomplete="new-password"')}
      ${field('p2', 'Repetila', 'password', 'autocomplete="new-password"')}
      <button class="btn primary block" type="submit">Guardar</button></form>`,
    mount(el, ctx) {
      const f = el.querySelector('#rs');
      f.onsubmit = (e) => {
        e.preventDefault();
        const ok = setErr(f, 'p1', f.p1.value.length >= 8 && /\d/.test(f.p1.value) ? '' : 'Mínimo 8 caracteres y un número.') & setErr(f, 'p2', f.p1.value === f.p2.value ? '' : 'No coinciden.');
        if (!ok) return;
        run(f.querySelector('[type=submit]'), async () => {
          await S.net();
          S.resetPassword(ctx.params.token, f.p1.value);
          toast('Contraseña actualizada. Ya podés entrar.', 'ok');
          go('/login');
        });
      };
    },
  };
}

/* ───────────── notificaciones ───────────── */
function notificationsView(app) {
  return {
    back: true, title: 'Notificaciones',
    render(ctx) {
      const list = S.notificationsOf(ctx.user.id, app).slice(0, 60);
      if (!list.length) return empty('bell', 'Sin novedades', 'Acá vas a ver postulaciones, cambios de estado y mensajes.');
      return `<div class="card list">${list.map((n) => `<button class="li" data-act="open" data-link="${esc(n.link)}" data-id="${n.id}">
        <span class="dot ${n.leida ? '' : 'accent'}"></span>
        <div class="grow"><div class="small ${n.leida ? '' : 'strong'}">${esc(n.titulo)}</div><div class="small muted">${esc(n.cuerpo)}</div><div class="xs faint mono">${fmtRel(n.t, S.now())}</div></div>
        ${icon('right', 'sm chev')}</button>`).join('')}</div>`;
    },
    mount(el, ctx) { setTimeout(() => S.markNotificationsRead(ctx.user.id, app), 1200); },
    actions: { open: (el) => go(el.dataset.link || '/') },
  };
}

/* ───────────── chat ───────────── */
export function threadsOf(ctx, orders) {
  return orders.map((o) => {
    const msgs = S.messagesOf(o.id);
    return { o, last: msgs.at(-1), unread: msgs.filter((m) => m.from !== ctx.user.id && !m.leido).length };
  }).filter((t) => t.last || S.ACTIVE.includes(t.o.estado)).sort((a, b) => (b.last?.t || b.o.creadoEn) - (a.last?.t || a.o.creadoEn));
}

export function threadListHtml(ctx, threads, counterpart) {
  if (!threads.length) return empty('message', 'Todavía no tenés conversaciones', 'El chat se habilita cuando hay una orden. Así todo queda registrado y con garantía.');
  return `<div class="card list">${threads.map(({ o, last, unread }) => {
    const u = counterpart(o);
    return `<button class="li" data-go="/chat/${o.id}">${avatar(u)}<div class="grow"><div class="row between"><span class="strong small">${esc(u.nombre)} ${esc(u.apellido)}</span><span class="xs faint mono">${last ? fmtRel(last.t, S.now()) : ''}</span></div>
      <div class="row between"><span class="small muted ellipsis">${last ? esc((last.from === ctx.user.id ? 'Vos: ' : '') + last.text) : 'Sin mensajes'}</span>${unread ? `<span class="count">${unread}</span>` : ''}</div>
      <div class="xs faint mono">${o.id} · ${esc(S.rubro(o.rubroId).nombre)}</div></div></button>`;
  }).join('')}</div>`;
}

function chatView(app) {
  const counterpart = (ctx, o) => (app === 'cliente' ? S.user(S.provider(o.providerId).userId) : S.user(o.clienteId));
  const bubbles = (ctx, o) => {
    const msgs = S.messagesOf(o.id);
    const intro = `<div class="msg sys">${icon('shield', 'sm')} Chat de la orden ${o.id}. Los datos de contacto se ocultan: si la operación sigue en Royal, tenés garantía y reputación verificada.</div>`;
    return intro + msgs.map((m) => {
      const me = m.from === ctx.user.id;
      const text = esc(m.text).replace(/\[dato oculto\]/g, '<span class="masked">dato oculto</span>');
      return `<div class="msg ${me ? 'me' : ''}">${text}<div class="meta">${fmtTime(m.t)}${me ? ` · ${m.leido ? 'Leído' : 'Enviado'}` : ''}</div></div>`;
    }).join('');
  };
  const typingHtml = (ctx, o) => {
    const t = S.getDb().typing[o.id];
    return t && t.userId !== ctx.user.id && t.until > S.now() ? `${esc(counterpart(ctx, o).nombre)} está escribiendo <i></i><i></i><i></i>` : '';
  };
  return {
    back: true, cls: 'chatview', skeleton: false,
    title: (ctx) => { const o = S.order(ctx.params.id); return o ? `${counterpart(ctx, o).nombre} · ${o.id}` : 'Chat'; },
    render(ctx) {
      const o = S.order(ctx.params.id);
      if (!o) return empty('message', 'Conversación no encontrada', '');
      return `<div class="chat-wrap"><div class="chat-scroll" id="cs"><div class="chat" id="bubbles">${bubbles(ctx, o)}</div><div class="typing" id="typing">${typingHtml(ctx, o)}</div></div>
        <form class="chat-input" id="cf"><label class="sr-only" for="msg">Mensaje</label><input class="input" id="msg" autocomplete="off" placeholder="Escribí un mensaje"><button class="btn primary icon" type="submit" aria-label="Enviar">${icon('send')}</button></form></div>`;
    },
    mount(el, ctx) {
      const o = S.order(ctx.params.id);
      if (!o) return;
      const cs = el.querySelector('#cs');
      cs.scrollTop = cs.scrollHeight;
      S.markThreadRead(o.id, ctx.user.id);
      const f = el.querySelector('#cf');
      f.onsubmit = (e) => {
        e.preventDefault();
        const inp = f.querySelector('#msg');
        const text = inp.value;
        if (!text.trim()) return;
        inp.value = '';
        try {
          const { masked } = S.sendMessage(o.id, ctx.user.id, text);
          if (masked) {
            const s = sheet({ title: 'Ocultamos un dato de contacto', body: `<div class="stack"><p>Detectamos un teléfono, email o pedido de WhatsApp y lo reemplazamos por <span class="badge warn">dato oculto</span>.</p>
              <ul class="small muted" style="padding-left:18px;margin:0"><li>Si pagás o cobrás fuera de Royal, perdés la Garantía Royal ante problemas.</li><li>Las reseñas solo cuentan para trabajos hechos dentro de la plataforma.</li><li>El chat queda registrado por si hace falta resolver un reclamo.</li></ul></div>`, footer: '<button class="btn primary block" data-ok>Entendido</button>' });
            s.el.querySelector('[data-ok]').onclick = s.close;
          }
        } catch (err) { toast(err.message, 'err'); }
        inp.focus();
      };
    },
    update(el, ctx) {
      const o = S.order(ctx.params.id);
      if (!o) return;
      const cs = el.querySelector('#cs');
      const atBottom = cs.scrollHeight - cs.scrollTop - cs.clientHeight < 80;
      el.querySelector('#bubbles').innerHTML = bubbles(ctx, o);
      el.querySelector('#typing').innerHTML = typingHtml(ctx, o);
      if (atBottom) cs.scrollTop = cs.scrollHeight;
      if (document.visibilityState === 'visible') S.markThreadRead(o.id, ctx.user.id);
    },
  };
}

/* ───────────── piezas compartidas de perfil ───────────── */
export function profileFooter(app) {
  return `<div class="card list" style="margin-top:16px">
    <button class="li" data-act="__theme">${icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon')}<span class="grow">Tema ${document.documentElement.dataset.theme === 'dark' ? 'claro' : 'oscuro'}</span></button>
    <button class="li" data-act="__logout">${icon('logout')}<span class="grow">Cerrar sesión</span></button>
  </div>
  <p class="center xs faint mono" style="margin-top:20px;padding:8px;user-select:none" data-version>Royal Solutions ${APP_VERSION} · ${app}</p>`;
}
