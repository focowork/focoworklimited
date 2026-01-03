import {
  newClient,
  changeClient,
  changeActivity,
  closeClient,
  getCurrentState
} from "./timeEngine.js";

/* =========================
   ESTADO LOCAL
========================= */
let timerInterval = null;

/* =========================
   ELEMENTOS DOM
========================= */
const clientNameEl = document.getElementById("clientName");
const activityNameEl = document.getElementById("activityName");
const timerEl = document.getElementById("timer");

const infoPanel = document.getElementById("infoPanel");
const infoTitle = document.getElementById("infoTitle");
const infoText = document.getElementById("infoText");

const trialBox = document.querySelector(".trial-box") || null;

/* =========================
   UTILIDADES
========================= */
function formatTime(ms) {
  if (!ms || ms < 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer(inicio) {
  stopTimer();
  timerInterval = setInterval(() => {
    timerEl.textContent = formatTime(Date.now() - inicio);
  }, 1000);
}

/* =========================
   RENDER
========================= */
function render() {
  const { state, clients, blocks } = getCurrentState();

  // Cliente activo
  const client = clients.find(c => c.id === state.currentClientId);
  clientNameEl.textContent = client
    ? `Cliente: ${client.nombre}`
    : "Sin cliente activo";

  // Bloque activo
  const block = blocks.find(b => b.id === state.currentBlockId && !b.fin);

  if (block) {
    activityNameEl.textContent = block.actividad;
    startTimer(block.inicio);
  } else {
    activityNameEl.textContent = "—";
    timerEl.textContent = "00:00:00";
    stopTimer();
  }
}

/* =========================
   BOTONES ACTIVIDAD
========================= */
document.querySelectorAll(".activity").forEach(btn => {
  btn.addEventListener("click", () => {
    const act = btn.dataset.activity;
    changeActivity(act);
    render();
  });
});

/* =========================
   CLIENTES
========================= */
document.getElementById("newClient").addEventListener("click", () => {
  const name = prompt("Nombre del cliente");
  if (!name) return;
  newClient(name);
  render();
});

document.getElementById("changeClient").addEventListener("click", () => {
  const { clients } = getCurrentState();
  const abiertos = clients.filter(c => c.estado === "abierto");

  if (abiertos.length === 0) {
    alert("No hay clientes activos");
    return;
  }

  const list = abiertos
    .map((c, i) => `${i + 1}. ${c.nombre}`)
    .join("\n");

  const sel = prompt(`Elige cliente:\n${list}`);
  const idx = Number(sel) - 1;

  if (abiertos[idx]) {
    changeClient(abiertos[idx].id);
    render();
  }
});

document.getElementById("closeClient").addEventListener("click", () => {
  const { clients, state } = getCurrentState();
  const client = clients.find(c => c.id === state.currentClientId);
  if (!client) return;

  closeClient();

  infoPanel.classList.remove("hidden");
  infoTitle.textContent = "Cliente cerrado";
  infoText.textContent = `Cliente: ${client.nombre}`;

  render();
});

/* =========================
   REPORTES (SIN ROMPER)
========================= */
document.getElementById("focusBtn").addEventListener("click", () => {
  alert("Enfoque: vista resumida (en desarrollo)");
});

document.getElementById("todayBtn").addEventListener("click", () => {
  alert("Reporte de hoy (en desarrollo)");
});

/* =========================
   LICENCIA – WHATSAPP
========================= */
const activateBtn = document.querySelector(
  'button[data-action="activate"]'
) || document.querySelector("button");

if (activateBtn) {
  activateBtn.addEventListener("click", () => {
    const msg = encodeURIComponent(
      "Hola, quiero activar FocoWork versión completa."
    );
    window.open(
      "https://wa.me/34649383847?text=" + msg,
      "_blank"
    );
  });
}

/* =========================
   INIT
========================= */
render();
