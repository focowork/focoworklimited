/* ===============================
   FOCO WORK — APP.JS FINAL
   Núcleo estable + límite + activación
   =============================== */

const MAX_FREE_CLIENTS = 2;
const WHATSAPP_NUMBER = "34649383847"; // tu número

/* ---------- ESTADO GLOBAL ---------- */
let state = {
  clients: [],              // clientes activos
  currentClientId: null,
  currentActivity: null,
  activityStart: null,
  timerInterval: null,
  isPro: localStorage.getItem("focowork_pro") === "true"
};

/* ---------- DOM ---------- */
const clientNameEl = document.getElementById("clientName");
const activityNameEl = document.getElementById("activityName");
const timerEl = document.getElementById("timer");

const newClientBtn = document.getElementById("newClient");
const changeClientBtn = document.getElementById("changeClient");
const closeClientBtn = document.getElementById("closeClient");

const activityButtons = document.querySelectorAll(".activity");
const activateBtn = document.getElementById("activatePro");

/* ---------- UTILIDADES ---------- */
function now() {
  return Date.now();
}

function formatTime(ms) {
  if (!ms || ms < 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/* ---------- TIMER ---------- */
function startTimer() {
  stopTimer();
  state.timerInterval = setInterval(() => {
    if (!state.activityStart) return;
    const elapsed = now() - state.activityStart;
    timerEl.textContent = formatTime(elapsed);
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

/* ---------- CLIENTES ---------- */
function activeClientsCount() {
  return state.clients.filter(c => c.active).length;
}

function createClient(name) {
  if (!state.isPro && activeClientsCount() >= MAX_FREE_CLIENTS) {
    alert("Versión de prueba: máximo 2 clientes activos");
    return;
  }

  const id = crypto.randomUUID();
  state.clients.push({
    id,
    name,
    active: true
  });

  selectClient(id);
}

function selectClient(id) {
  const client = state.clients.find(c => c.id === id && c.active);
  if (!client) return;

  state.currentClientId = id;
  clientNameEl.textContent = `Cliente: ${client.name}`;
  resetActivity();
}

function closeCurrentClient() {
  const client = state.clients.find(c => c.id === state.currentClientId);
  if (!client) return;

  client.active = false;
  state.currentClientId = null;
  resetActivity();
  clientNameEl.textContent = "Sin cliente activo";
}

/* ---------- ACTIVIDADES ---------- */
function resetActivity() {
  stopTimer();
  state.currentActivity = null;
  state.activityStart = null;
  activityNameEl.textContent = "—";
  timerEl.textContent = "00:00:00";
}

function startActivity(activity) {
  if (!state.currentClientId) {
    alert("Primero selecciona un cliente");
    return;
  }

  state.currentActivity = activity;
  state.activityStart = now();
  activityNameEl.textContent = activity;
  startTimer();
}

/* ---------- EVENTOS ---------- */
newClientBtn?.addEventListener("click", () => {
  const name = prompt("Nombre del cliente:");
  if (name) createClient(name.trim());
});

changeClientBtn?.addEventListener("click", () => {
  const active = state.clients.filter(c => c.active);
  if (active.length === 0) return alert("No hay clientes activos");

  const list = active.map((c, i) => `${i + 1}. ${c.name}`).join("\n");
  const choice = prompt(`Selecciona cliente:\n${list}`);
  const idx = parseInt(choice, 10) - 1;
  if (active[idx]) selectClient(active[idx].id);
});

closeClientBtn?.addEventListener("click", closeCurrentClient);

activityButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const act = btn.dataset.activity;
    if (act) startActivity(act);
  });
});

/* ---------- ACTIVACIÓN PRO ---------- */
activateBtn?.addEventListener("click", () => {
  const deviceId = localStorage.getItem("focowork_id") ||
    crypto.randomUUID();

  localStorage.setItem("focowork_id", deviceId);

  const msg = encodeURIComponent(
    `Hola, quiero activar FocoWork PRO.\nID: ${deviceId}`
  );

  window.open(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`,
    "_blank"
  );
});

/* ---------- MODO PRO (MANUAL) ----------
   Cuando cobres y quieras activar:
   En consola del cliente ejecuta:
   localStorage.setItem("focowork_pro","true")
   y recarga
-------------------------------------- */

if (state.isPro && activateBtn) {
  activateBtn.style.display = "none";
}

/* ---------- INICIO ---------- */
resetActivity();
