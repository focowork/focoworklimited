import * as T from "/focoworklimited/timeEngine.js";

const $ = id => document.getElementById(id);
const MAX_FREE = 2;
const WHATSAPP = "34649383847";

let clients = JSON.parse(localStorage.getItem("fw_clients")) || [];
let currentClient = null;
let currentActivity = null;
let full = localStorage.getItem("fw_full") === "1";

/* ---------- UTIL ---------- */
function save() {
  localStorage.setItem("fw_clients", JSON.stringify(clients));
}

function activeClients() {
  return clients.filter(c => c.active);
}

/* ---------- TIMER UI ---------- */
setInterval(() => {
  if (!currentClient) return;
  $("timer").textContent = T.format(T.getElapsed());
}, 1000);

/* ---------- CLIENTES ---------- */
$("newClient").onclick = () => {
  if (!full && activeClients().length >= MAX_FREE) {
    alert("Versión de prueba: máximo 2 clientes activos");
    return;
  }

  const name = prompt("Nombre del cliente:");
  if (!name) return;

  currentClient = {
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

  clients.push(currentClient);
  currentActivity = "trabajo";

  T.reset();
  T.start();

  $("clientName").textContent = `Cliente: ${name}`;
  $("activityName").textContent = "Trabajo";

  save();
};

$("closeClient").onclick = () => {
  if (!currentClient) return;

  const total = T.stop();
  currentClient.activities[currentActivity] += total;
  currentClient.active = false;

  $("infoPanel").classList.remove("hidden");
  $("infoText").textContent =
    `Cliente: ${currentClient.name}\nTiempo total: ${T.format(total)}`;

  currentClient = null;
  currentActivity = null;

  $("clientName").textContent = "Sin cliente activo";
  $("activityName").textContent = "—";
  $("timer").textContent = "00:00:00";

  save();
};

/* ---------- ACTIVIDADES ---------- */
document.querySelectorAll(".activity").forEach(btn => {
  btn.onclick = () => {
    if (!currentClient) return;

    const spent = T.stop();
    currentClient.activities[currentActivity] += spent;

    currentActivity = btn.dataset.activity;
    $("activityName").textContent = btn.textContent;

    T.start();
    save();
  };
});

/* ---------- ENFOQUE ---------- */
$("focusBtn").onclick = () => {
  if (!currentClient) return;

  const a = currentClient.activities;
  const total = Object.values(a).reduce((x, y) => x + y, 0);
  if (!total) return alert("Aún no hay datos");

  const focus = Math.round((a.trabajo / total) * 100);
  alert(`🎯 Enfoque: ${focus}%`);
};

/* ---------- REPORTE CSV ---------- */
$("todayBtn").onclick = () => {
  let csv = "Cliente,Trabajo,Telefono,Otros,Total\n";

  clients.forEach(c => {
    const t = Object.values(c.activities).reduce((x, y) => x + y, 0);
    if (!t) return;
    csv += `${c.name},${T.format(c.activities.trabajo)},${T.format(c.activities.telefono)},${T.format(c.activities.otros)},${T.format(t)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "focowork.csv";
  a.click();
};

/* ---------- FULL ---------- */
$("activateFull").onclick = () => {
  const msg = encodeURIComponent("Quiero activar FocoWork FULL");
  window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, "_blank");
};
