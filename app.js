import * as T from "/focoworklimited/timeEngine.js";

const $ = id => document.getElementById(id);

const MAX_FREE = 2;
const WHATSAPP = "34649383847";

/* ================= ESTADO ================= */
let clients = JSON.parse(localStorage.getItem("fw_clients")) || [];
let currentClient = null;
let currentActivity = null;
let full = localStorage.getItem("fw_full") === "1";

/* 🔧 RESETEO DE SESIÓN */
clients.forEach(c => c.active = false);
save();

/* ============ TIEMPO DIARIO (ENFOQUE) ============ */
let dailyTime = JSON.parse(localStorage.getItem("fw_dailyTime")) || {
  date: new Date().toISOString().slice(0, 10),
  trabajo: 0,
  telefono: 0,
  cliente: 0,
  visitando: 0,
  otros: 0
};

const today = new Date().toISOString().slice(0, 10);
if (dailyTime.date !== today) {
  dailyTime = {
    date: today,
    trabajo: 0,
    telefono: 0,
    cliente: 0,
    visitando: 0,
    otros: 0
  };
  localStorage.setItem("fw_dailyTime", JSON.stringify(dailyTime));
}

/* ================= UTIL ================= */
function save() {
  localStorage.setItem("fw_clients", JSON.stringify(clients));
}

function saveDaily() {
  localStorage.setItem("fw_dailyTime", JSON.stringify(dailyTime));
}

function activeClients() {
  return clients.filter(c => c.active);
}

function formatSeconds(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/* ============ TIMER + ENFOQUE REALTIME ============ */
setInterval(() => {
  if (!currentActivity) return;

  $("timer").textContent = T.format(T.getElapsed());

  if (dailyTime[currentActivity] !== undefined) {
    dailyTime[currentActivity] += 1;
    saveDaily();
  }
}, 1000);

/* ================= NUEVO CLIENTE ================= */
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

/* ================= CAMBIAR CLIENTE (FINAL) ================= */
$("changeClient").onclick = () => {
  const activos = activeClients();

  if (activos.length === 0) {
    alert("No hay clientes activos");
    return;
  }

  let msg = "Clientes activos:\n";
  activos.forEach((c, i) => {
    msg += `${i + 1}. ${c.name}${c === currentClient ? " (actual)" : ""}\n`;
  });

  const sel = parseInt(prompt(msg), 10);
  if (!sel || !activos[sel - 1]) return;

  const elegido = activos[sel - 1];

  // Si aún no hay cliente actual
  if (!currentClient) {
    currentClient = elegido;
    currentActivity = "trabajo";
    T.start();

    $("clientName").textContent = `Cliente: ${elegido.name}`;
    $("activityName").textContent = "Trabajo";
    return;
  }

  // Si elige el mismo, no hacemos nada
  if (elegido === currentClient) return;

  // Guardar tiempo del cliente actual
  const spent = T.stop();
  currentClient.activities[currentActivity] += spent;

  // Cambiar cliente
  currentClient = elegido;
  currentActivity = "trabajo";
  T.start();

  $("clientName").textContent = `Cliente: ${currentClient.name}`;
  $("activityName").textContent = "Trabajo";

  save();
};

/* ================= CERRAR CLIENTE ================= */
$("closeClient").onclick = () => {
  if (!currentClient) return;

  const spent = T.stop();
  currentClient.activities[currentActivity] += spent;
  currentClient.active = false;

  const total = Object.values(currentClient.activities)
    .reduce((a, b) => a + b, 0);

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

/* ================= ACTIVIDADES ================= */
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

/* ================= 🎯 ENFOQUE DIARIO ================= */
$("focusBtn").onclick = () => {
  const total =
    dailyTime.trabajo +
    dailyTime.telefono +
    dailyTime.cliente +
    dailyTime.visitando +
    dailyTime.otros;

  if (total === 0) {
    alert("Aún no hay actividad registrada hoy.");
    return;
  }

  const pctTrabajo = Math.round((dailyTime.trabajo / total) * 100);

  let estado = "🟢 Enfocado";
  if (pctTrabajo < 64) estado = "🟡 Atención";
  if (pctTrabajo < 40) estado = "🔴 Disperso";

  alert(
`🎯 Enfoque de hoy

Trabajo: ${formatSeconds(dailyTime.trabajo)}
Teléfono: ${formatSeconds(dailyTime.telefono)}
Cliente: ${formatSeconds(dailyTime.cliente)}
Visitando: ${formatSeconds(dailyTime.visitando)}
Otros: ${formatSeconds(dailyTime.otros)}

Trabajo: ${pctTrabajo}%
Estado: ${estado}`
  );
};

/* ================= REPORTE CSV ================= */
$("todayBtn").onclick = () => {
  let csv = "Cliente,Trabajo,Telefono,Cliente,Visitando,Otros,Total\n";

  clients.forEach(c => {
    const t = Object.values(c.activities).reduce((x, y) => x + y, 0);
    if (!t) return;

    csv += `${c.name},${T.format(c.activities.trabajo)},${T.format(c.activities.telefono)},${T.format(c.activities.cliente)},${T.format(c.activities.visitando)},${T.format(c.activities.otros)},${T.format(t)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `focowork_${dailyTime.date}.csv`;
  a.click();
};

/* ================= FULL / WHATSAPP ================= */
$("activateFull").onclick = () => {
  const msg = encodeURIComponent("Hola, quiero activar FocoWork FULL");
  window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, "_blank");
};

$("licenseBtn").onclick = () => {
  const code = $("licenseInput").value.trim();
  if (!code) return alert("Introduce un código");

  if (code.startsWith("FW-FULL-")) {
    localStorage.setItem("fw_full", "1");
    alert("Versión completa activada");
    location.reload();
  } else {
    alert("Código no válido");
  }
};
