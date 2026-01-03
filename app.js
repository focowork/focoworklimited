import {
  newClient,
  changeActivity,
  changeClient,
  closeClient,
  getCurrentState
} from "./timeEngine.js";

// ===============================
// CONFIG
// ===============================
const MAX_FREE_CLIENTS = 2;
const WHATSAPP_PHONE = "34649383847";

// ===============================
// DOM
// ===============================
const clientNameEl = document.getElementById("clientName");
const activityNameEl = document.getElementById("activityName");
const timerEl = document.getElementById("timer");

const activityButtons = document.querySelectorAll(".activity");

const newClientBtn = document.getElementById("newClient");
const changeClientBtn = document.getElementById("changeClient");
const closeClientBtn = document.getElementById("closeClient");

const focusBtn = document.getElementById("focusBtn");
const todayBtn = document.getElementById("todayBtn");

const infoPanel = document.getElementById("infoPanel");
const infoText = document.getElementById("infoText");

// ===============================
// HELPERS
// ===============================
function isFullVersion() {
  return localStorage.getItem("focowork_full") === "1";
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

// ===============================
// UI UPDATE
// ===============================
function updateUI() {
  const { state, clients } = getCurrentState();
  const client = clients.find(c => c.id === state.currentClientId);

  clientNameEl.textContent = client
    ? `Cliente: ${client.nombre}`
    : "Sin cliente activo";

  activityNameEl.textContent = state.currentActivity
    ? `Actividad: ${state.currentActivity}`
    : "—";
}

// ===============================
// TIMER (REFRESCO)
// ===============================
setInterval(() => {
  const { state } = getCurrentState();

  if (!state.currentClientId) {
    timerEl.textContent = "00:00:00";
    return;
  }

  timerEl.textContent = formatTime(state.elapsed || 0);
}, 1000);

// ===============================
// ACTIVIDADES
// ===============================
activityButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const { state } = getCurrentState();
    if (!state.currentClientId) return;

    changeActivity(btn.dataset.activity);
    updateUI();
  });
});

// ===============================
// CLIENTES
// ===============================
newClientBtn.onclick = () => {
  const { clients } = getCurrentState();
  const activos = clients.filter(c => c.estado === "abierto");

  if (!isFullVersion() && activos.length >= MAX_FREE_CLIENTS) {
    alert("Versión de prueba: máximo 2 clientes activos.");
    return;
  }

  const name = prompt("Nombre del cliente:");
  if (!name) return;

  newClient(name.trim());
  changeActivity("trabajo");
  updateUI();
};

changeClientBtn.onclick = () => {
  const { clients } = getCurrentState();
  const activos = clients.filter(c => c.estado === "abierto");

  if (!activos.length) {
    alert("No hay clientes activos");
    return;
  }

  const list = activos
    .map((c, i) => `${i + 1}. ${c.nombre}`)
    .join("\n");

  const choice = parseInt(prompt("Clientes activos:\n" + list), 10) - 1;
  if (!activos[choice]) return;

  changeClient(activos[choice].id);
  changeActivity("trabajo");
  updateUI();
};

closeClientBtn.onclick = () => {
  const { state, clients } = getCurrentState();
  const client = clients.find(c => c.id === state.currentClientId);
  if (!client) return;

  closeClient();
  infoText.innerHTML = `Cliente: ${client.nombre}`;
  infoPanel.classList.remove("hidden");

  updateUI();
};

// ===============================
// ENFOQUE (SIMPLE)
// ===============================
focusBtn.onclick = () => {
  alert("Modo enfoque activo (funcionalidad básica).");
};

// ===============================
// REPORTE HOY (SIMPLE)
// ===============================
todayBtn.onclick = () => {
  alert("Reporte diario disponible en versión completa.");
};

// ===============================
// PANEL VERSIÓN DE PRUEBA
// ===============================
if (!isFullVersion()) {
  const panel = document.createElement("div");
  panel.style.marginTop = "16px";
  panel.style.padding = "12px";
  panel.style.borderTop = "1px solid #ccc";
  panel.style.fontSize = "14px";
  panel.innerHTML = `
    🔒 <strong>Versión de prueba</strong><br>
    Máximo 2 clientes activos simultáneamente<br><br>
    <button id="activateFullBtn">Activar versión completa</button>
  `;

  document.querySelector(".app").appendChild(panel);

  document
    .getElementById("activateFullBtn")
    .addEventListener("click", () => {
      let id = localStorage.getItem("focowork_id");
      if (!id) {
        id =
          "FW-" +
          Math.random().toString(36).slice(2, 10).toUpperCase();
        localStorage.setItem("focowork_id", id);
      }

      const text = encodeURIComponent(
        `Hola 👋\nQuiero activar FocoWork.\n\nID de instalación:\n${id}`
      );

      window.open(
        `https://wa.me/${WHATSAPP_PHONE}?text=${text}`,
        "_blank"
      );
    });
}

// ===============================
// INIT
// ===============================
updateUI();
