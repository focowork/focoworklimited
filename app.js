import {
  newClient,
  changeActivity,
  changeClient,
  closeClient,
  getCurrentState
} from "./timeEngine.js";

document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
     ELEMENTOS DOM
  =============================== */
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

  /* ===============================
     UTILIDADES
  =============================== */
  function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  }

  /* ===============================
     UI
  =============================== */
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

  /* ===============================
     TIMER (NO TOCAR MOTOR)
  =============================== */
  setInterval(() => {
    const { state } = getCurrentState();

    if (!state.currentClientId) {
      timerEl.textContent = "00:00:00";
      return;
    }

    timerEl.textContent = formatTime(state.elapsed || 0);
  }, 1000);

  /* ===============================
     ACTIVIDADES
  =============================== */
  activityButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const { state } = getCurrentState();
      if (!state.currentClientId) return;

      changeActivity(btn.dataset.activity);
      updateUI();
    });
  });

  /* ===============================
     CLIENTES
  =============================== */

  // NUEVO CLIENTE — CON LÍMITE 2 ACTIVOS
  newClientBtn.onclick = () => {
    const { clients } = getCurrentState();
    const activos = clients.filter(c => c.estado === "abierto");

    if (activos.length >= 2) {
      alert("Versión de prueba: máximo 2 clientes activos simultáneamente.");
      return;
    }

    const name = prompt("Nombre del cliente:");
    if (!name) return;

    newClient(name.trim());
    changeActivity("trabajo");
    updateUI();
  };

  // CAMBIAR CLIENTE
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

  // CERRAR CLIENTE
  closeClientBtn.onclick = () => {
    const { state, clients } = getCurrentState();
    const client = clients.find(c => c.id === state.currentClientId);
    if (!client) return;

    closeClient();

    infoText.innerHTML = `Cliente: ${client.nombre}`;
    infoPanel.classList.remove("hidden");

    updateUI();
  };

  /* ===============================
     ENFOQUE Y REPORTE (COMO ANTES)
  =============================== */
  focusBtn.onclick = () => {
    alert("Función Enfoque (sin cambios).");
  };

  todayBtn.onclick = () => {
    alert("Reporte diario (sin cambios).");
  };

  /* ===============================
     TEXTO VERSIÓN DE PRUEBA (SOLO UI)
  =============================== */
  const trialInfo = document.createElement("div");
  trialInfo.style.marginTop = "16px";
  trialInfo.style.padding = "10px";
  trialInfo.style.borderTop = "1px solid #ccc";
  trialInfo.style.fontSize = "14px";
  trialInfo.innerHTML = `
    🔒 <strong>Versión de prueba</strong><br>
    Máximo 2 clientes activos simultáneamente
  `;
  document.querySelector(".app").appendChild(trialInfo);

  /* ===============================
     INIT
  =============================== */
  updateUI();
});
