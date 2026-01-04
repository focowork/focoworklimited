/*************************************************
 * FOCO WORK - APP.JS DEFINITIVO
 * Sin módulos – GitHub Pages compatible
 *************************************************/

/* ========= ESTADO GLOBAL ========= */

let clients = JSON.parse(localStorage.getItem("clients")) || {};
let currentClient = null;
let currentActivity = null;

let elapsedSession = 0;   // tiempo de la actividad actual
let timerInterval = null;

/* ========= ELEMENTOS DOM ========= */

const clientNameEl = document.getElementById("clientName");
const activityNameEl = document.getElementById("activityName");
const timerEl = document.getElementById("timer");
const infoPanel = document.getElementById("infoPanel");
const infoText = document.getElementById("infoText");

/* ========= UTILIDADES ========= */

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function save() {
  localStorage.setItem("clients", JSON.stringify(clients));
}

/* ========= TIMER ========= */

function startTimer() {
  if (timerInterval) return;

  timerInterval = setInterval(() => {
    elapsedSession++;

    if (currentClient && clients[currentClient]) {
      clients[currentClient].totalTime++;
      clients[currentClient].activities[currentActivity]++;
      save();
    }

    updateUI();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

/* ========= UI ========= */

function updateUI() {
  if (!currentClient) {
    clientNameEl.textContent = "Sin cliente activo";
    activityNameEl.textContent = "—";
    timerEl.textContent = "00:00:00";
    return;
  }

  clientNameEl.textContent = `Cliente: ${currentClient}`;
  activityNameEl.textContent = currentActivity;
  timerEl.textContent = formatTime(elapsedSession);

  let totalEl = document.getElementById("totalClientTime");
  if (!totalEl) {
    totalEl = document.createElement("div");
    totalEl.id = "totalClientTime";
    totalEl.style.opacity = "0.7";
    timerEl.after(totalEl);
  }

  totalEl.textContent =
    "Total cliente: " + formatTime(clients[currentClient].totalTime);
}

/* ========= CLIENTES ========= */

function newClient() {
  const name = prompt("Nombre del cliente:");
  if (!name) return;

  if (!clients[name]) {
    clients[name] = {
      totalTime: 0,
      activities: {
        trabajo: 0,
        telefono: 0,
        cliente: 0,
        visitando: 0,
        otros: 0,
      },
    };
  }

  currentClient = name;
  currentActivity = "trabajo";
  elapsedSession = 0;

  save();
  startTimer();
  updateUI();
}

function changeClient() {
  const names = Object.keys(clients);
  if (names.length === 0) {
    alert("No hay clientes");
    return;
  }

  const selected = prompt(
    "Clientes:\n" + names.map((n, i) => `${i + 1}. ${n}`).join("\n")
  );

  const index = parseInt(selected) - 1;
  if (!names[index]) return;

  currentClient = names[index];
  elapsedSession = 0;
  startTimer();
  updateUI();
}

function closeClient() {
  if (!currentClient) return;

  stopTimer();

  infoPanel.classList.remove("hidden");
  infoText.innerHTML = `
    <strong>Cliente cerrado</strong><br>
    Cliente: ${currentClient}<br>
    Tiempo total: ${formatTime(clients[currentClient].totalTime)}
  `;

  currentClient = null;
  currentActivity = null;
  elapsedSession = 0;

  updateUI();
}

/* ========= ACTIVIDADES ========= */

document.querySelectorAll(".activity").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!currentClient) return;

    currentActivity = btn.dataset.activity;
    elapsedSession = 0;
    startTimer();
    updateUI();
  });
});

/* ========= ENFOQUE ========= */

function showFocus() {
  if (!clients[currentClient]) {
    alert("No hay cliente activo");
    return;
  }

  const acts = clients[currentClient].activities;
  const total =
    acts.trabajo +
    acts.telefono +
    acts.cliente +
    acts.visitando +
    acts.otros;

  const focusPct = total
    ? Math.round((acts.trabajo / total) * 100)
    : 0;

  let estado = "🔴 Disperso";
  if (focusPct >= 64) estado = "🟢 Enfocado";
  else if (focusPct >= 40) estado = "🟡 Atención";

  infoPanel.classList.remove("hidden");
  infoText.innerHTML = `
    <strong>🎯 Enfoque (hoy)</strong><br><br>
    Trabajo: ${formatTime(acts.trabajo)}<br>
    Teléfono: ${formatTime(acts.telefono)}<br>
    Cliente: ${formatTime(acts.cliente)}<br>
    Visitando: ${formatTime(acts.visitando)}<br>
    Otros: ${formatTime(acts.otros)}<br><br>
    Trabajo: ${focusPct}%<br>
    Estado: ${estado}
  `;
}

/* ========= CSV HOY ========= */

function exportTodayCSV() {
  const date = new Date().toISOString().slice(0, 10);
  let csv = "Cliente,Tiempo total\n";

  for (const c in clients) {
    csv += `${c},${formatTime(clients[c].totalTime)}\n`;
  }

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `focowork_${date}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

/* ========= EVENTOS ========= */

document.getElementById("newClient").onclick = newClient;
document.getElementById("changeClient").onclick = changeClient;
document.getElementById("closeClient").onclick = closeClient;
document.getElementById("focusBtn").onclick = showFocus;
document.getElementById("todayBtn").onclick = exportTodayCSV;

/* ========= INICIO ========= */

updateUI();
