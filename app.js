import {
  newClient,
  changeActivity,
  changeClient,
  closeClient,
  getCurrentState
} from "./timeEngine.js";

import { loadLicense, saveLicense } from "./storage.js";

document.addEventListener("DOMContentLoaded", () => {

  /* ================== WHATSAPP + LICENCIA ================== */

  function getInstallId() {
    let id = localStorage.getItem("focowork_install_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("focowork_install_id", id);
    }
    return id;
  }

  function openWhatsAppActivation() {
    const id = getInstallId();
    const text = `Hola 👋\nQuiero activar FocoWork.\n\nID de instalación:\n${id}`;
    const phone = "34649383847";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  }

  const license = loadLicense?.() || "trial";

  const licensePanel = document.createElement("div");
  licensePanel.style.margin = "12px";
  licensePanel.style.padding = "10px";
  licensePanel.style.border = "1px solid #ccc";
  licensePanel.style.borderRadius = "8px";
  licensePanel.innerHTML = `
    🔒 <strong>Versión de prueba</strong><br>
    Máximo 2 clientes activos<br><br>
    <button id="activateFullBtn">Activar versión completa</button>
  `;

  document.querySelector(".app")?.appendChild(licensePanel);

  document.getElementById("activateFullBtn")?.addEventListener("click", openWhatsAppActivation);

  if (license === "full") {
    licensePanel.style.display = "none";
  }

  /* ================== UI ORIGINAL ================== */

  const clientNameEl = document.getElementById("clientName");
  const activityNameEl = document.getElementById("activityName");
  const timerEl = document.getElementById("timer");
  const activityButtons = document.querySelectorAll(".activity");

  function updateUI() {
    const { state, clients } = getCurrentState();
    const client = clients.find(c => c.id === state.currentClientId);

    clientNameEl.textContent = client ? `Cliente: ${client.nombre}` : "Sin cliente activo";
    activityNameEl.textContent = state.currentActivity || "—";
  }

  activityButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const { state } = getCurrentState();
      if (!state.currentClientId) return;
      changeActivity(btn.dataset.activity);
      updateUI();
    });
  });

  document.getElementById("newClient").onclick = () => {
    const name = prompt("Nombre del cliente:");
    if (!name) return;
    newClient(name);
    updateUI();
  };

  document.getElementById("changeClient").onclick = () => {
    const { clients } = getCurrentState();
    const abiertos = clients.filter(c => c.estado === "abierto");
    if (!abiertos.length) return;

    let txt = "Selecciona cliente:\n";
    abiertos.forEach((c, i) => txt += `${i + 1}. ${c.nombre}\n`);
    const sel = parseInt(prompt(txt), 10) - 1;
    if (!abiertos[sel]) return;

    changeClient(abiertos[sel].id);
    updateUI();
  };

  document.getElementById("closeClient").onclick = () => {
    closeClient();
    updateUI();
  };

  updateUI();


  // ⏱️ Refresco del temporizador (cada segundo)
  setInterval(() => {
    const { state } = getCurrentState();
    if (!state.currentClientId) {
      timerEl.textContent = "00:00:00";
      return;
    }

    const seconds = Math.floor(state.elapsed / 1000);
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");

    timerEl.textContent = `${h}:${m}:${s}`;
  }, 1000);

});
