// ===============================
// CONFIG
// ===============================
const MAX_FREE_CLIENTS = 2;
const WHATSAPP_PHONE = "34649383847";
const LICENSE_KEY = "focowork_full";

// ===============================
// STATE
// ===============================
let state = {
  currentClientId: null,
  currentActivity: null,
  elapsed: 0,
  lastTick: null,
  clients: []
};

// ===============================
// HELPERS
// ===============================
const $ = id => document.getElementById(id);

function isFullVersion() {
  return localStorage.getItem(LICENSE_KEY) === "1";
}

function saveState() {
  localStorage.setItem("focowork_state", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("focowork_state");
  if (saved) state = JSON.parse(saved);
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function activeClientsCount() {
  return state.clients.filter(c => !c.closed).length;
}

// ===============================
// UI UPDATE
// ===============================
function updateUI() {
  if (!state.currentClientId) {
    $("clientName").textContent = "Sin cliente activo";
    $("activityName").textContent = "—";
    $("timer").textContent = "00:00:00";
    return;
  }

  const client = state.clients.find(c => c.id === state.currentClientId);
  $("clientName").textContent = `Cliente: ${client.name}`;
  $("activityName").textContent = state.currentActivity || "—";
  $("timer").textContent = formatTime(state.elapsed);
}

// ===============================
// TIMER LOOP
// ===============================
setInterval(() => {
  if (!state.currentClientId || !state.currentActivity) return;

  const now = Date.now();
  if (!state.lastTick) {
    state.lastTick = now;
    return;
  }

  const diff = now - state.lastTick;
  state.lastTick = now;
  state.elapsed += diff;

  saveState();
  updateUI();
}, 1000);

// ===============================
// CLIENT ACTIONS
// ===============================
$("newClient").onclick = () => {
  if (!isFullVersion() && activeClientsCount() >= MAX_FREE_CLIENTS) {
    alert("Versión de prueba: máximo 2 clientes activos.");
    return;
  }

  const name = prompt("Nombre del cliente:");
  if (!name) return;

  const id = "C-" + Date.now();

  state.clients.push({
    id,
    name,
    closed: false
  });

  state.currentClientId = id;
  state.currentActivity = null;
  state.elapsed = 0;
  state.lastTick = null;

  saveState();
  updateUI();
};

$("closeClient").onclick = () => {
  if (!state.currentClientId) return;

  const client = state.clients.find(c => c.id === state.currentClientId);
  client.closed = true;

  state.currentClientId = null;
  state.currentActivity = null;
  state.elapsed = 0;
  state.lastTick = null;

  saveState();
  updateUI();
};

$("changeClient").onclick = () => {
  const active = state.clients.filter(c => !c.closed);
  if (!active.length) return alert("No hay clientes activos");

  const names = active.map(c => c.name).join("\n");
  const chosen = prompt("Clientes activos:\n" + names);
  const found = active.find(c => c.name === chosen);
  if (!found) return;

  state.currentClientId = found.id;
  state.currentActivity = null;
  state.elapsed = 0;
  state.lastTick = null;

  saveState();
  updateUI();
};

// ===============================
// ACTIVITIES
// ===============================
document.querySelectorAll(".activity").forEach(btn => {
  btn.onclick = () => {
    if (!state.currentClientId) return alert("No hay cliente activo");

    state.currentActivity = btn.dataset.activity;
    state.lastTick = Date.now();

    saveState();
    updateUI();
  };
});

// ===============================
// LICENSE / FULL VERSION
// ===============================
$("activateFullBtn")?.addEventListener("click", () => {
  const deviceId =
    localStorage.getItem("focowork_id") ||
    (() => {
      const id = "FW-" + Math.random().toString(36).slice(2, 10).toUpperCase();
      localStorage.setItem("focowork_id", id);
      return id;
    })();

  const text = encodeURIComponent(
    `Hola, quiero activar FocoWork.\nID: ${deviceId}`
  );

  window.open(
    `https://wa.me/${WHATSAPP_PHONE}?text=${text}`,
    "_blank"
  );

  $("licensePanel")?.classList.remove("hidden");
});

$("licenseConfirm")?.addEventListener("click", () => {
  const input = $("licenseInput").value.trim();
  const msg = $("licenseMsg");

  if (input.startsWith("FW-FULL-") && input.length >= 12) {
    localStorage.setItem(LICENSE_KEY, "1");
    msg.textContent = "✅ Versión completa activada";
    setTimeout(() => location.reload(), 1000);
  } else {
    msg.textContent = "❌ Código no válido";
  }
});

// ===============================
// INIT
// ===============================
loadState();
updateUI();
