/* =========================
   FOCOWORK – APP.JS FINAL
   ========================= */

alert("JS CARGADO OK");

/* ---------- ESTADO ---------- */

const state = {
  currentClient: null,
  currentActivity: null,
  timerStart: null,
  tickInterval: null,
  isFull: false,
  today: new Date().toDateString()
};

const DATA_KEY = "focowork_data";
const FULL_KEY = "focowork_full";
const FOCUS_KEY = "focowork_focus";

/* ---------- STORAGE ---------- */

function loadData() {
  return JSON.parse(localStorage.getItem(DATA_KEY) || "{}");
}

function saveData(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

/* ---------- TIMER ---------- */

function startTimer() {
  if (state.tickInterval) return;

  state.timerStart = Date.now();
  state.tickInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
  if (!state.tickInterval) return;

  clearInterval(state.tickInterval);
  state.tickInterval = null;

  const elapsed = Date.now() - state.timerStart;
  state.timerStart = null;

  if (state.currentClient && state.currentActivity) {
    const data = loadData();
    const c = data[state.currentClient];
    c.activities[state.currentActivity] += elapsed;
    c.total += elapsed;
    saveData(data);
  }
}

function updateTimer() {
  let elapsed = 0;
  if (state.timerStart) elapsed = Date.now() - state.timerStart;
  document.getElementById("timer").textContent = formatTime(elapsed);
}

/* ---------- HELPERS ---------- */

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

function pad(n) {
  return n.toString().padStart(2, "0");
}

/* ---------- CLIENTES ---------- */

function newClient() {
  const name = prompt("Nombre del cliente:");
  if (!name) return;

  const data = loadData();
  const active = Object.values(data).filter(c => c.active);

  if (!state.isFull && active.length >= 2) {
    alert("Versión de prueba: máximo 2 clientes");
    return;
  }

  data[name] = {
    active: true,
    total: 0,
    activities: {
      trabajo: 0,
      telefono: 0,
      cliente: 0,
      visitando: 0,
      otros: 0
    }
  };

  saveData(data);
  switchClient(name);
}

function switchClient(name) {
  stopTimer();

  state.currentClient = name;
  document.getElementById("clientName").textContent = "Cliente: " + name;
  document.getElementById("activityName").textContent = "—";

  updateClientTotal();
}

function changeClient() {
  const data = loadData();
  const names = Object.keys(data).filter(n => data[n].active);

  if (names.length === 0) {
    alert("No hay clientes");
    return;
  }

  const pick = prompt("Clientes:\n" + names.join("\n"));
  if (!pick || !data[pick]) return;

  switchClient(pick);
}

function closeClient() {
  if (!state.currentClient) return;

  stopTimer();

  const data = loadData();
  const c = data[state.currentClient];
  c.active = false;

  log(`Cliente: ${state.currentClient} Tiempo total: ${formatTime(c.total)}`);

  state.currentClient = null;
  document.getElementById("clientName").textContent = "Sin cliente activo";
  document.getElementById("activityName").textContent = "—";
  document.getElementById("clientTotal").textContent = "";

  saveData(data);
}

/* ---------- ACTIVIDADES ---------- */

function setActivity(act) {
  stopTimer();
  state.currentActivity = act;
  document.getElementById("activityName").textContent = act;
  startTimer();
  addFocus(act);
}

/* ---------- ENFOQUE DIARIO ---------- */

function loadFocus() {
  const f = JSON.parse(localStorage.getItem(FOCUS_KEY) || "{}");
  if (f.day !== state.today) {
    return {
      day: state.today,
      trabajo: 0,
      total: 0
    };
  }
  return f;
}

function saveFocus(f) {
  localStorage.setItem(FOCUS_KEY, JSON.stringify(f));
}

function addFocus(act) {
  const f = loadFocus();
  f.total += 1;
  if (act === "trabajo" || !state.currentClient) f.trabajo += 1;
  saveFocus(f);
}

function showFocus() {
  const f = loadFocus();
  const pct = f.total ? Math.round((f.trabajo / f.total) * 100) : 0;

  let estado = "🟢 Enfocado";
  if (pct < 64) estado = "🔴 Disperso";
  else if (pct < 80) estado = "🟡 Atención";

  alert(
    `🎯 Enfoque diario\n\nTrabajo: ${pct}%\nEstado: ${estado}`
  );
}

/* ---------- FULL VERSION ---------- */

function checkFull() {
  state.isFull = localStorage.getItem(FULL_KEY) === "1";
  if (state.isFull) {
    document.getElementById("versionBox").style.display = "none";
  }
}

function activateWhatsApp() {
  const msg = encodeURIComponent("Quiero activar FocoWork");
  window.open(`https://wa.me/34649383847?text=${msg}`, "_blank");
}

function applyCode() {
  const code = document.getElementById("activationCode").value.trim();
  if (code === "FOCOWORK-FULL-2024") {
    localStorage.setItem(FULL_KEY, "1");
    alert("Versión completa activada");
    checkFull();
  } else {
    alert("Código incorrecto");
  }
}

/* ---------- UI ---------- */

function log(text) {
  const d = document.createElement("div");
  d.className = "log";
  d.textContent = text;
  document.getElementById("log").prepend(d);
}

function updateClientTotal() {
  if (!state.currentClient) return;
  const data = loadData();
  const t = data[state.currentClient].total;
  document.getElementById("clientTotal").textContent =
    "Total cliente: " + formatTime(t);
}

/* ---------- INIT ---------- */

document.querySelectorAll(".activity").forEach(b =>
  b.onclick = () => setActivity(b.dataset.activity)
);

document.getElementById("newClient").onclick = newClient;
document.getElementById("changeClient").onclick = changeClient;
document.getElementById("closeClient").onclick = closeClient;
document.getElementById("focusBtn").onclick = showFocus;
document.getElementById("activateFull").onclick = activateWhatsApp;
document.getElementById("applyCode").onclick = applyCode;

checkFull();
