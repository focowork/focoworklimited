import {
  startClient,
  stopClient,
  switchActivity,
  getElapsed,
  format
} from "./timeEngine.js";

const $ = id => document.getElementById(id);
const WHATSAPP = "34649383847";
const MAX_FREE = 2;

/* -------- ESTADO -------- */
let clients = JSON.parse(localStorage.getItem("fw_clients")) || [];
let currentClient = null;
let currentActivity = null;
let full = localStorage.getItem("fw_full") === "1";

/* -------- UTIL -------- */
function save() {
  localStorage.setItem("fw_clients", JSON.stringify(clients));
}

function activeClients() {
  return clients.filter(c => c.active);
}

/* -------- CLIENTES -------- */
$("newClient").onclick = () => {
  if (!full && activeClients().length >= MAX_FREE) {
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
  currentClient = client;
  currentActivity = null;

  startClient();

  $("clientName").textContent = `Cliente: ${name}`;
  $("activityName").textContent = "—";
  save();
};

$("closeClient").onclick = () => {
  if (!currentClient) return;

  if (currentActivity) {
    switchActivity(null, currentClient.activities);
  }

  const total = stopClient();
  currentClient.active = false;

  $("infoPanel").classList.remove("hidden");
  $("infoText").textContent =
    `Cliente: ${currentClient.name}\nTiempo total: ${format(total)}`;

  currentClient = null;
  currentActivity = null;

  $("clientName").textContent = "Sin cliente activo";
  $("activityName").textContent = "—";
  $("timer").textContent = "00:00:00";
  save();
};

/* -------- ACTIVIDADES -------- */
document.querySelectorAll(".activity").forEach(btn => {
  btn.onclick = () => {
    if (!currentClient) return;

    switchActivity(btn.dataset.activity, currentClient.activities);
    currentActivity = btn.dataset.activity;
    $("activityName").textContent = btn.textContent;
  };
});

/* -------- TIMER UI -------- */
setInterval(() => {
  if (!currentClient) return;
  $("timer").textContent = format(getElapsed());
}, 1000);

/* -------- ENFOQUE -------- */
$("focusBtn").onclick = () => {
  if (!currentClient) return;

  const a = currentClient.activities;
  const total = Object.values(a).reduce((x, y) => x + y, 0);
  if (!total) return alert("Sin datos aún");

  const focus = Math.round((a.trabajo / total) * 100);
  alert(`🎯 Enfoque: ${focus}%`);
};

/* -------- REPORTE CSV -------- */
$("todayBtn").onclick = () => {
  const rows = [
    ["Cliente", "Total", "Trabajo", "Telefono", "Otros", "Enfoque %"]
  ];

  clients.forEach(c => {
    const t = Object.values(c.activities).reduce((x, y) => x + y, 0);
    if (!t) return;
    const f = Math.round((c.activities.trabajo / t) * 100);
    rows.push([
      c.name,
      format(t),
      format(c.activities.trabajo),
      format(c.activities.telefono),
      format(c.activities.otros),
      f
    ]);
  });

  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "focowork.csv";
  a.click();
};

/* -------- ACTIVAR FULL -------- */
document.getElementById("activateFull")?.onclick = () => {
  const msg = encodeURIComponent("Quiero activar FocoWork FULL");
  window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, "_blank");
};
