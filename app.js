/**********************
 * CONFIGURACIÓN
 **********************/
const WHATSAPP_NUMBER = "34649383847";
const MAX_FREE_CLIENTS = 2;

/**********************
 * ESTADO GLOBAL
 **********************/
let clients = JSON.parse(localStorage.getItem("clients")) || [];
let currentClientId = null;
let currentActivity = null;

let timerInterval = null;
let timerStart = 0;
let elapsedSession = 0;

/**********************
 * HELPERS DOM
 **********************/
const $ = id => document.getElementById(id);

/**********************
 * UTILIDADES
 **********************/
function saveClients() {
  localStorage.setItem("clients", JSON.stringify(clients));
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/**********************
 * TIMER CORE (CLAVE)
 **********************/
function startTimer() {
  if (timerInterval) return;

  timerStart = Date.now();
  timerInterval = setInterval(() => {
    const total = elapsedSession + (Date.now() - timerStart);
    $("timer").textContent = formatTime(total);
  }, 1000);
}

function stopTimer() {
  if (!timerInterval) return;

  elapsedSession += Date.now() - timerStart;
  clearInterval(timerInterval);
  timerInterval = null;
}

/**********************
 * CONSOLIDAR TIEMPO
 **********************/
function commitTime() {
  if (!currentClientId || !currentActivity) return;

  const client = clients.find(c => c.id === currentClientId);
  if (!client) return;

  if (typeof client.activities[currentActivity] !== "number") {
    client.activities[currentActivity] = 0;
  }

  client.activities[currentActivity] += elapsedSession;

  elapsedSession = 0;
  timerStart = Date.now();
  saveClients();
}

/**********************
 * CLIENTES
 **********************/
function activeClientsCount() {
  return clients.filter(c => c.active).length;
}

function newClient() {
  if (!localStorage.getItem("fullVersion") &&
      activeClientsCount() >= MAX_FREE_CLIENTS) {
    alert("Versión de prueba: máximo 2 clientes activos");
    return;
  }

  const name = prompt("Nombre del cliente:");
  if (!name) return;

  const client = {
    id: Date.now(),
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

  clients.push(client);
  currentClientId = client.id;
  currentActivity = null;
  elapsedSession = 0;

  $("clientName").textContent = `Cliente: ${name}`;
  $("activityName").textContent = "—";
  $("timer").textContent = "00:00:00";

  saveClients();
}

function closeClient() {
  if (!currentClientId) return;

  stopTimer();
  commitTime();

  const client = clients.find(c => c.id === currentClientId);
  client.active = false;

  const total = Object.values(client.activities)
    .reduce((a, b) => a + b, 0);

  showInfo(
    "Cliente cerrado",
    `Cliente: ${client.name}\nTiempo total: ${formatTime(total)}\n✔ Tiempo listo para facturación`
  );

  currentClientId = null;
  currentActivity = null;
  elapsedSession = 0;

  $("clientName").textContent = "Sin cliente activo";
  $("activityName").textContent = "—";
  $("timer").textContent = "00:00:00";

  saveClients();
}

/**********************
 * ACTIVIDADES
 **********************/
document.querySelectorAll(".activity").forEach(btn => {
  btn.onclick = () => {
    if (!currentClientId) {
      alert("Selecciona un cliente primero");
      return;
    }

    if (currentActivity) commitTime();

    currentActivity = btn.dataset.activity;
    $("activityName").textContent = btn.textContent;

    timerStart = Date.now();
    startTimer();
  };
});

/**********************
 * ENFOQUE
 **********************/
$("focusBtn")?.addEventListener("click", () => {
  if (!currentClientId) return;

  commitTime();

  const client = clients.find(c => c.id === currentClientId);
  const a = client.activities;

  const total = Object.values(a).reduce((x, y) => x + y, 0);
  if (!total) {
    alert("Aún no hay tiempo suficiente");
    return;
  }

  const focus = Math.round((a.trabajo / total) * 100);

  let msg = `🎯 Enfoque: ${focus}%\n`;
  if (focus >= 75) msg += "Excelente enfoque";
  else if (focus >= 50) msg += "Enfoque aceptable";
  else msg += "Demasiadas interrupciones";

  alert(msg);
});

/**********************
 * REPORTE CSV
 **********************/
$("reportBtn")?.addEventListener("click", () => {
  commitTime();

  const today = new Date().toISOString().slice(0, 10);
  let csv = "Cliente,Trabajo,Telefono,Cliente,Visitando,Otros,Total\n";

  clients.forEach(c => {
    const a = c.activities;
    const total = Object.values(a).reduce((x, y) => x + y, 0);

    csv += `${c.name},${formatTime(a.trabajo)},${formatTime(a.telefono)},${formatTime(a.cliente)},${formatTime(a.visitando)},${formatTime(a.otros)},${formatTime(total)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte_${today}.csv`;
  link.click();

  URL.revokeObjectURL(url);
});

/**********************
 * INFO PANEL
 **********************/
function showInfo(title, text) {
  $("infoTitle").textContent = title;
  $("infoText").textContent = text;
  $("infoPanel").classList.remove("hidden");
}

/**********************
 * ACTIVAR FULL
 **********************/
$("activateFullBtn")?.addEventListener("click", () => {
  const msg = encodeURIComponent(
    "Hola, quiero activar FocoWork versión completa. Mi ID es: " +
    navigator.userAgent
  );

  window.open(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`,
    "_blank"
  );
});

/**********************
 * INICIALIZACIÓN
 **********************/
(function init() {
  $("timer").textContent = "00:00:00";
  $("clientName").textContent = "Sin cliente activo";
  $("activityName").textContent = "—";
})();
