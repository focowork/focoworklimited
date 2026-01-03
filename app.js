/**********************
 * FocoWork – app.js
 * Versión estable FINAL
 **********************/

// ---------- ESTADO GLOBAL ----------
let state = {
  clients: [],
  activeClientId: null,
  currentActivity: null,
  sessionStart: null,
  timerInterval: null,
  isFull: false,
  dailyFocus: {
    date: null,
    activities: {
      trabajo: 0,
      telefono: 0,
      cliente: 0,
      visitando: 0,
      otros: 0
    }
  }
};

// ---------- UTILIDADES ----------
const $ = id => document.getElementById(id);

const now = () => Date.now();

const formatTime = ms => {
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

// ---------- STORAGE ----------
function saveState() {
  localStorage.setItem("focowork_state", JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem("focowork_state");
  if (!raw) return;
  state = JSON.parse(raw);
}

// ---------- DAILY RESET ENFOQUE ----------
function resetDailyFocusIfNeeded() {
  const today = todayKey();
  if (state.dailyFocus.date !== today) {
    state.dailyFocus = {
      date: today,
      activities: {
        trabajo: 0,
        telefono: 0,
        cliente: 0,
        visitando: 0,
        otros: 0
      }
    };
    saveState();
  }
}

// ---------- CLIENT HELPERS ----------
function getActiveClient() {
  return state.clients.find(c => c.id === state.activeClientId);
}

function getClientTotal(client) {
  return Object.values(client.activities).reduce((a, b) => a + b, 0);
}

// ---------- TIME CLOSURE (CLAVE DEL SISTEMA) ----------
function closeCurrentSession() {
  if (!state.sessionStart || !state.currentActivity) return;

  const elapsed = now() - state.sessionStart;

  // Guardar en cliente activo
  const client = getActiveClient();
  if (client) {
    client.activities[state.currentActivity] += elapsed;
  }

  // Guardar en enfoque diario
  state.dailyFocus.activities[state.currentActivity] += elapsed;

  state.sessionStart = null;
  saveState();
}

// ---------- TIMER ----------
function startTimer(activity) {
  closeCurrentSession();
  state.currentActivity = activity;
  state.sessionStart = now();

  if (state.timerInterval) clearInterval(state.timerInterval);

  state.timerInterval = setInterval(updateUI, 1000);
  saveState();
}

function stopTimer() {
  closeCurrentSession();
  state.currentActivity = null;
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = null;
  updateUI();
}

// ---------- CLIENT ACTIONS ----------
function newClient() {
  if (!state.isFull && state.clients.filter(c => c.active).length >= 2) {
    alert("Versión de prueba: máximo 2 clientes activos");
    return;
  }

  const name = prompt("Nombre del cliente");
  if (!name) return;

  closeCurrentSession();

  const client = {
    id: crypto.randomUUID(),
    name,
    active: true,
    activities: {
      trabajo: 0,
      telefono: 0,
      cliente: 0,
      visitando: 0,
      otros: 0
    }
  };

  state.clients.push(client);
  state.activeClientId = client.id;
  startTimer("trabajo");
  saveState();
  updateUI();
}

function changeClient() {
  const actives = state.clients.filter(c => c.active);
  if (actives.length === 0) {
    alert("No hay clientes activos");
    return;
  }

  closeCurrentSession();

  const list = actives
    .map((c, i) => `${i + 1}. ${c.name}`)
    .join("\n");

  const idx = parseInt(prompt("Selecciona cliente:\n" + list), 10) - 1;
  if (isNaN(idx) || !actives[idx]) return;

  state.activeClientId = actives[idx].id;
  startTimer("trabajo");
  saveState();
  updateUI();
}

function closeClient() {
  const client = getActiveClient();
  if (!client) return;

  closeCurrentSession();
  client.active = false;
  alert(
    `Cliente: ${client.name}\nTiempo total: ${formatTime(
      getClientTotal(client)
    )}`
  );

  state.activeClientId = null;
  state.currentActivity = null;
  updateUI();
  saveState();
}

// ---------- ENFOQUE ----------
function showFocus() {
  resetDailyFocusIfNeeded();

  const total = Object.values(state.dailyFocus.activities).reduce(
    (a, b) => a + b,
    0
  );

  if (total === 0) {
    alert("Aún no hay datos de enfoque hoy");
    return;
  }

  const trabajo = state.dailyFocus.activities.trabajo;
  const pct = Math.round((trabajo / total) * 100);

  let estado = "🟢 Enfocado";
  if (pct < 64) estado = "🔴 Disperso";
  else if (pct < 75) estado = "🟡 Atención";

  alert(
    `🎯 Enfoque diario\n\n` +
      `Trabajo: ${formatTime(trabajo)}\n` +
      `Teléfono: ${formatTime(state.dailyFocus.activities.telefono)}\n` +
      `Cliente: ${formatTime(state.dailyFocus.activities.cliente)}\n` +
      `Visitando: ${formatTime(state.dailyFocus.activities.visitando)}\n` +
      `Otros: ${formatTime(state.dailyFocus.activities.otros)}\n\n` +
      `Trabajo: ${pct}%\nEstado: ${estado}`
  );
}

// ---------- UI ----------
function updateUI() {
  const client = getActiveClient();

  $("clientName").textContent = client
    ? `Cliente: ${client.name}`
    : "Sin cliente activo";

  $("activityName").textContent = state.currentActivity
    ? state.currentActivity.charAt(0).toUpperCase() +
      state.currentActivity.slice(1)
    : "—";

  if (state.sessionStart) {
    $("timer").textContent = formatTime(now() - state.sessionStart);
  } else {
    $("timer").textContent = "00:00:00";
  }

  if (client) {
    let totalEl = $("totalClient");
    if (!totalEl) {
      totalEl = document.createElement("div");
      totalEl.id = "totalClient";
      totalEl.style.opacity = "0.7";
      totalEl.style.fontSize = "14px";
      $("timer").after(totalEl);
    }
    totalEl.textContent =
      "Total cliente: " + formatTime(getClientTotal(client));
  } else {
    const el = $("totalClient");
    if (el) el.remove();
  }

  $("versionBox").style.display = state.isFull ? "none" : "block";
}

// ---------- ACTIVACIÓN FULL ----------
function activateFull() {
  const input = $("activationCode").value.trim();
  if (input === "FOCOWORK-FULL-2024") {
    state.isFull = true;
    saveState();
    updateUI();
    alert("Versión completa activada");
  } else {
    alert("Código incorrecto");
  }
}

// ---------- EVENTOS ----------
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  resetDailyFocusIfNeeded();

  document.querySelectorAll(".activity").forEach(btn => {
    btn.addEventListener("click", () =>
      startTimer(btn.dataset.activity)
    );
  });

  $("newClient").onclick = newClient;
  $("changeClient").onclick = changeClient;
  $("closeClient").onclick = closeClient;
  $("focusBtn").onclick = showFocus;
  $("activateFull").onclick = activateFull;

  updateUI();
});
