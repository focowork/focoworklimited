/* =========================
   FOCO WORK – APP.JS FINAL
   ========================= */

/* ---------- UTILIDADES ---------- */

function $(id) {
  return document.getElementById(id);
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/* ---------- USUARIO (SOLO 1 VEZ) ---------- */

function getOwnerName() {
  let name = localStorage.getItem("focowork_owner");
  if (!name) {
    name = prompt("Introduce tu nombre o negocio (para los reportes):");
    if (!name || !name.trim()) name = "Sin nombre";
    localStorage.setItem("focowork_owner", name.trim());
  }
  return name;
}

const OWNER_NAME = getOwnerName();

/* ---------- ESTADO GLOBAL ---------- */

let clients = JSON.parse(localStorage.getItem("focowork_clients")) || [];
let currentClientId = null;
let currentActivity = null;

let timerStart = null;
let timerInterval = null;
let elapsedBefore = 0;

/* ---------- TIMER ---------- */

function startTimer() {
  if (timerInterval) return;

  timerStart = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = elapsedBefore + (Date.now() - timerStart);
    $("timer").textContent = formatTime(elapsed);
  }, 1000);
}

function stopTimer() {
  if (!timerInterval) return;

  elapsedBefore += Date.now() - timerStart;
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  stopTimer();
  elapsedBefore = 0;
  $("timer").textContent = "00:00:00";
}

/* ---------- CLIENTES ---------- */

function activeClientsCount() {
  return clients.filter(c => c.active).length;
}

function saveClients() {
  localStorage.setItem("focowork_clients", JSON.stringify(clients));
}

function setCurrentClient(client) {
  currentClientId = client.id;
  $("clientName").textContent = `Cliente: ${client.name}`;
  resetTimer();
  startTimer();
}

function newClient() {
  if (activeClientsCount() >= 2) {
    alert("Versión de prueba:\nMáximo 2 clientes activos simultáneamente.");
    return;
  }

  const name = prompt("Nombre del cliente:");
  if (!name || !name.trim()) return;

  const client = {
    id: Date.now(),
    name: name.trim(),
    active: true,
    time: 0
  };

  clients.push(client);
  saveClients();
  setCurrentClient(client);
}

function changeClient() {
  const actives = clients.filter(c => c.active);
  if (actives.length === 0) {
    alert("No hay clientes activos.");
    return;
  }

  let msg = "Elige cliente:\n";
  actives.forEach((c, i) => {
    msg += `${i + 1}. ${c.name}\n`;
  });

  const choice = parseInt(prompt(msg), 10);
  if (!choice || !actives[choice - 1]) return;

  stopTimer();
  actives.find(c => c.id === currentClientId).time += elapsedBefore;

  elapsedBefore = 0;
  setCurrentClient(actives[choice - 1]);
}

function closeClient() {
  if (!currentClientId) return;

  stopTimer();

  const client = clients.find(c => c.id === currentClientId);
  client.time += elapsedBefore;
  client.active = false;

  saveClients();

  $("infoPanel").classList.remove("hidden");
  $("infoTitle").textContent = "Cliente cerrado";
  $("infoText").textContent =
    `Cliente: ${client.name}\nTiempo: ${formatTime(client.time)}`;

  currentClientId = null;
  elapsedBefore = 0;
  $("clientName").textContent = "Sin cliente activo";
  $("activityName").textContent = "—";
  $("timer").textContent = "00:00:00";
}

/* ---------- ACTIVIDADES ---------- */

document.querySelectorAll(".activity").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!currentClientId) return;
    currentActivity = btn.dataset.activity;
    $("activityName").textContent = btn.textContent;
  });
});

/* ---------- BOTONES ---------- */

$("newClient").onclick = newClient;
$("changeClient").onclick = changeClient;
$("closeClient").onclick = closeClient;

$("focusBtn").onclick = () => {
  alert("Función Enfoque (sin cambios).");
};

$("todayBtn").onclick = () => {
  alert(
    `Reporte diario\n\n` +
    `Usuario: ${OWNER_NAME}\n` +
    `Fecha: ${new Date().toLocaleDateString()}\n\n` +
    `Clientes totales: ${clients.length}`
  );
};

/* ---------- PANEL VERSIÓN ---------- */

(function showTrialInfo() {
  const panel = document.createElement("div");
  panel.style.marginTop = "20px";
  panel.innerHTML = `
    <div style="border:1px solid #444;padding:14px;border-radius:12px">
      🔒 <b>Versión de prueba</b><br>
      Máximo 2 clientes activos simultáneamente
    </div>
  `;
  document.querySelector(".app").appendChild(panel);
})();

/* ---------- INIT ---------- */

$("timer").textContent = "00:00:00";
$("clientName").textContent = "Sin cliente activo";
$("activityName").textContent = "—";
