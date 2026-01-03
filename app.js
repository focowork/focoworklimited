/*************************************************
 * FocoWork – app.js DEFINITIVO
 * Núcleo estable y coherente
 *************************************************/

/* ============ CONFIG ============ */
const WHATSAPP_PHONE = "34649383847";
const FULL_CODE = "FOCOWORK-FULL-2024";
const MAX_FREE_CLIENTS = 2;

/* ============ HELPERS ============ */
const $ = (id) => document.getElementById(id);
const now = () => Date.now();

function format(ms) {
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/* ============ STATE ============ */
let state = JSON.parse(localStorage.getItem("focowork_state")) || {
  isFull: false,
  day: today(),
  focus: {
    trabajo: 0,
    telefono: 0,
    cliente: 0,
    visitando: 0,
    otros: 0,
  },
  clients: [],
  activeClientId: null,
  activeActivity: null,
  lastTick: null,
};

/* ============ STORAGE ============ */
function save() {
  localStorage.setItem("focowork_state", JSON.stringify(state));
}

/* ============ DAILY RESET ============ */
function resetDayIfNeeded() {
  const t = today();
  if (state.day !== t) {
    state.day = t;
    state.focus = {
      trabajo: 0,
      telefono: 0,
      cliente: 0,
      visitando: 0,
      otros: 0,
    };
    save();
  }
}

/* ============ CLIENT HELPERS ============ */
function activeClient() {
  return state.clients.find(c => c.id === state.activeClientId) || null;
}

function clientTotal(c) {
  return Object.values(c.activities).reduce((a, b) => a + b, 0);
}

/* ============ TIME CORE ============ */
function closeSlice() {
  if (!state.lastTick || !state.activeActivity) return;

  const elapsed = now() - state.lastTick;
  const c = activeClient();

  if (c) {
    c.activities[state.activeActivity] += elapsed;
    state.focus[state.activeActivity] += elapsed;
  }

  state.lastTick = now();
  save();
}

function tick() {
  resetDayIfNeeded();
  if (!state.activeClientId || !state.activeActivity) return;
  closeSlice();
  updateUI();
}

setInterval(tick, 1000);

/* ============ UI UPDATE ============ */
function updateUI() {
  const c = activeClient();

  $("clientName").textContent = c
    ? `Cliente: ${c.name}`
    : "Sin cliente activo";

  $("activityName").textContent = state.activeActivity
    ? state.activeActivity
    : "—";

  if (state.lastTick && c) {
    $("timer").textContent = format(
      clientTotal(c)
    );
  } else {
    $("timer").textContent = "00:00:00";
  }

  // total cliente pequeño
  let totalEl = $("clientTotal");
  if (!totalEl && $("timer")) {
    totalEl = document.createElement("div");
    totalEl.id = "clientTotal";
    totalEl.style.fontSize = "0.8em";
    totalEl.style.opacity = "0.7";
    $("timer").after(totalEl);
  }

  if (c && totalEl) {
    totalEl.textContent = `Total cliente: ${format(clientTotal(c))}`;
  } else if (totalEl) {
    totalEl.textContent = "";
  }

  $("versionBox").style.display = state.isFull ? "none" : "block";
}

/* ============ CLIENT ACTIONS ============ */
$("newClient").onclick = () => {
  if (!state.isFull && state.clients.filter(c => c.active).length >= MAX_FREE_CLIENTS) {
    alert("Versión de prueba: máximo 2 clientes activos");
    return;
  }

  const name = prompt("Nombre del cliente:");
  if (!name) return;

  closeSlice();

  const client = {
    id: crypto.randomUUID(),
    name,
    active: true,
    activities: {
      trabajo: 0,
      telefono: 0,
      cliente: 0,
      visitando: 0,
      otros: 0,
    },
  };

  state.clients.push(client);
  state.activeClientId = client.id;
  state.activeActivity = "trabajo";
  state.lastTick = now();
  save();
  updateUI();
};

$("changeClient").onclick = () => {
  const actives = state.clients.filter(c => c.active);
  if (!actives.length) {
    alert("No hay clientes activos");
    return;
  }

  closeSlice();

  const list = actives.map((c, i) => `${i + 1}. ${c.name}`).join("\n");
  const sel = parseInt(prompt("Clientes activos:\n" + list), 10);
  if (!sel || !actives[sel - 1]) return;

  state.activeClientId = actives[sel - 1].id;
  state.activeActivity = "trabajo";
  state.lastTick = now();
  save();
  updateUI();
};

$("closeClient").onclick = () => {
  const c = activeClient();
  if (!c) return;

  closeSlice();
  c.active = false;

  alert(
    `Cliente: ${c.name}\nTiempo total: ${format(clientTotal(c))}`
  );

  state.activeClientId = null;
  state.activeActivity = null;
  state.lastTick = null;
  save();
  updateUI();
};

/* ============ ACTIVITIES ============ */
document.querySelectorAll(".activity").forEach(btn => {
  btn.onclick = () => {
    if (!activeClient()) return;
    closeSlice();
    state.activeActivity = btn.dataset.activity;
    state.lastTick = now();
    save();
    updateUI();
  };
});

/* ============ ENFOQUE ============ */
$("focusBtn").onclick = () => {
  const total = Object.values(state.focus).reduce((a, b) => a + b, 0);
  if (!total) {
    alert("Aún no hay datos de enfoque hoy");
    return;
  }

  const pct = Math.round((state.focus.trabajo / total) * 100);
  let estado = "🔴 Disperso";
  if (pct >= 64) estado = "🟢 Enfocado";
  else if (pct >= 40) estado = "🟡 Atención";

  alert(
`🎯 Enfoque de hoy

Trabajo: ${format(state.focus.trabajo)}
Teléfono: ${format(state.focus.telefono)}
Cliente: ${format(state.focus.cliente)}
Visitando: ${format(state.focus.visitando)}
Otros: ${format(state.focus.otros)}

Trabajo: ${pct}%
Estado: ${estado}`
  );
};

/* ============ FULL + WHATSAPP ============ */
$("activateFull").onclick = () => {
  const input = $("activationCode").value.trim();

  if (input === FULL_CODE) {
    state.isFull = true;
    save();
    updateUI();
    alert("Versión completa activada");
    return;
  }

  if (!input) {
    const msg =
      "Hola, quiero activar FocoWork.\n\nID:\n" +
      navigator.userAgent;
    window.open(
      `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
    return;
  }

  alert("Código incorrecto");
};

/* ============ INIT ============ */
updateUI();
