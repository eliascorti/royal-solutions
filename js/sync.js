// Sincronización entre pestañas / iframes del mismo origen.
// - Evento `storage` + BroadcastChannel para avisar cambios en rs_db.
// - Presencia: qué usuario tiene abierta cada app (para respuestas automáticas y "piloto automático").
// - Líder: una sola pestaña corre el reloj de la simulación (tick) para no duplicar eventos.

const TAB_ID = Math.random().toString(36).slice(2, 10);
const PRES_KEY = 'rs_presence';
const LEADER_KEY = 'rs_leader';
let channel = null;
let onRemote = () => {};
let app = null;
let userId = null;

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

export function initSync(appName, onRemoteChange) {
  app = appName;
  onRemote = onRemoteChange;
  try {
    channel = new BroadcastChannel('rs');
    channel.onmessage = (e) => { if (e.data?.type === 'changed' && e.data.from !== TAB_ID) onRemote(); };
  } catch { channel = null; }
  window.addEventListener('storage', (e) => { if (e.key === 'rs_db') onRemote(); });
  heartbeat();
  setInterval(heartbeat, 2000);
  window.addEventListener('beforeunload', () => {
    const lead = readJSON(LEADER_KEY, null);
    if (lead?.id === TAB_ID) localStorage.removeItem(LEADER_KEY);
  });
}

export function broadcast() {
  try { channel?.postMessage({ type: 'changed', from: TAB_ID }); } catch { /* sin canal */ }
}

export function setPresenceUser(id) { userId = id; heartbeat(); }

function heartbeat() {
  const now = Date.now();
  const pres = readJSON(PRES_KEY, {});
  pres[`${app}:${TAB_ID}`] = { app, userId, ts: now };
  for (const k of Object.keys(pres)) if (now - pres[k].ts > 7000) delete pres[k];
  localStorage.setItem(PRES_KEY, JSON.stringify(pres));
  const lead = readJSON(LEADER_KEY, null);
  if (!lead || lead.id === TAB_ID || now - lead.ts > 5000) {
    localStorage.setItem(LEADER_KEY, JSON.stringify({ id: TAB_ID, ts: now }));
  }
}

/** ¿Hay alguna pestaña de `appName` abierta con este usuario logueado? */
export function isPresent(appName, uid) {
  const now = Date.now();
  return Object.values(readJSON(PRES_KEY, {})).some((p) => p.app === appName && p.userId === uid && now - p.ts < 7000);
}

export function isLeader() {
  const lead = readJSON(LEADER_KEY, null);
  return lead?.id === TAB_ID;
}
