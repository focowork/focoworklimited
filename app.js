/************************************************
 * FOCOWORK – app.js DEFINITIVO (SIN MÓDULOS)
 * Un solo reloj, estado coherente
 ************************************************/

/* ========= CONFIG ========= */
const FULL_CODE = "FOCOWORK-FULL-2024";
const WHATSAPP_PHONE = "34649383847";

/* ========= HELPERS ========= */
const $ = (id) => document.getElementById(id);

function now() {
  return Date.now();
}

function format(ms) {
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/* ========= STATE ========= */
let state = JSON.parse(localStorage.getItem("focowork_state")) || {
  isFull: false,
  currentClientId: null,
  currentActivity: null,
  lastTick: null,
  day: todayKey(),
  clients: {},       // id -> client
  focus: {},         // activity -> ms (daily)
};

function save() {
  localStorage.setItem("focowork_state", JSON.stringify(state));
}

/* ========= DAILY RESET ========= */
function resetDayIfNeeded() {
  const t = todayKey();
  if (state.day !== t) {
    state.day = t;
    state.focus = {};
    save();
  }
}

/* ========= TIME ENGINE (CORE) ========= */
function tick() {
  resetDayIfNeeded();

  if (!state.currentClientId || !state.currentActivity || !state.lastTick) {
    state.lastTick = now();
    return;
  }

  const elapsed = now() - state.lastTick;
  state.lastTick = now();

  const client = state.clients[state.currentClientId];
  if (!client) return;

  // total cliente
  client.total += elapsed;

  // por actividad cliente
  client.activities[state.currentActivity] =
    (client.activities[state.currentActivity] || 0) + elapsed;

  // enfoque diario
  state.focus[state.currentActivity] =
    (state.focus[state.currentActivity] || 0) + elapsed;

  save();
  updateUI();
}

setInterval(tick, 1000);

/* ========= UI ========= */
function updateUI() {
  const client = state.currentClientId
    ? state.clients[state.currentClientId]
    : null;

  $("clientName").textContent = client
    ? `Cliente: ${client.name}`
    : "Sin cliente activo";

  $("activityName").textContent = state.currentActivity || "—";

  $("timer").textContent = client
    ? format(client.total)
    : "00:00:00";

  if ($("clientTotal")) {
    $("clientTotal").textContent = client
      ? `Total cliente: ${format(client.total)}`
      : "";
  }

  if ($("versionBox")) {
    $("versionBox").style.display = state.isFull ? "none" : "block";
  }
}

/* ========= CLIENTS ========= */
function newClient() {
  const name = prompt("Nombre del cliente:");
  if (!name) return;

  const activeClients = Object.values(state.clients).filter(c => c.active);
  if (!state.isFull && activeClients.length >= 2) {
    alert("Versión de prueba: máximo 2 clientes activos");
    return;
  }

  const id = crypto.randomUUID();

  state.clients[id] = {
    id,
    name,
    active: true,
    total: 0,
    activities: {},
  };

  // activar cliente + actividad por defecto
  state.currentClientId = id;
  state.currentActivity = "trabajo";
  state.lastTick = now();

  save();
  updateUI();
}

function changeClient() {
  const actives = Object.values(state.clients).filter(c => c.active);
  if (!actives.length) {
    alert("No hay clientes activos");
    return;
  }

  const list = actives.map((c, i) => `${i + 1}. ${c.name}`).join("\n");
  const sel = parseInt(prompt("Clientes activos:\n" + list), 10);

  if (!sel || !actives[sel - 1]) return;

  state.currentClientId = actives[sel - 1].id;
  state.currentActivity = "trabajo";
  state.lastTick = now();

  save();
  updateUI();
}

function closeClient() {
  const id = state.currentClientId;
  if (!id) return;

  const client = state.clients[id];
  client.active = false;

  alert(
    `Cliente: ${client.name}\nTiempo total: ${format(client.total)}`
  );

  state.currentClientId = null;
  state.currentActivity = null;
  state.lastTick = null;

  save();
  updateUI();
}

/* ========= ACTIVITIES ========= */
function setActivity(act) {
  if (!state.currentClientId) return;

  state.currentActivity = act;
  state.lastTick = now();

  save();
  updateUI();
}

/* ========= ENFOQUE ========= */
function showFocus() {
  const total = Object.values(state.focus).reduce((a, b) => a + b, 0);
  if (!total) {
    alert("Aún no hay datos de enfoque hoy");
    return;
  }

  const trabajo = state.focus.trabajo || 0;
  const pct = Math.round((trabajo / total) * 100);

  let estado = "🔴 Disperso";
  if (pct >= 64) estado = "🟢 Enfocado";
  else if (pct >= 40) estado = "🟡 Atención";

  let detalle = "";
  for (const act in state.focus) {
    detalle += `${act}: ${format(state.focus[act])}\n`;
  }

  alert(
`🎯 Enfoque diario

${detalle}
Trabajo: ${pct}%
Estado: ${estado}`
  );
}

/* ========= FULL + WHATSAPP ========= */
function activateWhatsApp() {
  const msg = encodeURIComponent("Hola, quiero activar FocoWork");
  window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${msg}`, "_blank");
}

function applyCode() {
  const code = $("activationCode").value.trim();
  if (code === FULL_CODE) {
    state.isFull = true;
    save();
    updateUI();
    alert("Versión completa activada");
  } else {
    alert("Código incorrecto");
  }
}

/* ========= EVENTS ========= */
document.querySelectorAll(".activity").forEach(btn => {
  btn.onclick = () => setActivity(btn.dataset.activity);
});

$("newClient").onclick = newClient;
$("changeClient").onclick = changeClient;
$("closeClient").onclick = closeClient;
$("focusBtn").onclick = showFocus;

if ($("activateFull")) $("activateFull").onclick = activateWhatsApp;
if ($("applyCode")) $("applyCode").onclick = applyCode;

/* ========= INIT ========= */
updateUI();
