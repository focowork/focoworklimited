import * as T from "/focoworklimited/timeEngine.js";

const $ = id => document.getElementById(id);

const MAX_FREE = 2;
const WHATSAPP = "34649383847";

/* ========= ESTADO ========= */
let clients = JSON.parse(localStorage.getItem("fw_clients")) || [];
let currentClient = null;
let currentActivity = null;
let full = localStorage.getItem("fw_full") === "1";

/* 🔧 RESETEO DE SESIÓN (CLAVE) */
clients.forEach(c => c.active = false);
save();

/* ========= UTIL ========= */
function save() {
  localStorage.setItem("fw_clients", JSON.stringify(clients));
}

function activeClients() {
  return clients.filter(c => c.active);
}

/* ========= TIMER UI ========= */
setInterval(() => {
  if (!currentClient) return;
  $("timer").textContent = T.format(T.getElapsed());
}, 1000);

/* ========= NUEVO CLIENTE ========= */
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

/* ========= CAMBIAR CLIENTE ========= */
$("changeClient").onclick = () => {
  if (!currentClient) return;

  const activos = activeClients();
  if (activos.length < 2) {
    alert("No hay otro cliente activo");
    return;
  }

  let msg = "Elige cliente:\n";
  activos.forEach((c, i) => {
    msg += `${i + 1}. ${c.name}\n`;
  });

  const sel = parseInt(prompt(msg), 10);
  if (!sel || !activos[sel - 1]) return;

  const spent = T.stop();
  currentClient.activities[currentActivity] += spent;

  currentClient = activos[sel - 1];
  currentActivity = "trabajo";

  T.reset();
  T.start();

  $("clientName").textContent = `Cliente: ${currentClient.name}`;
  $("activityName").textContent = "Trabajo";

  save();
};

/* ========= CERRAR CLIENTE ========= */
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

/* ========= ACTIVIDADES ========= */
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

/* ========= 🎯 ENFOQUE (PULIDO) ========= */
$("focusBtn").onclick = () => {
  if (!currentClient) {
    alert("No hay cliente activo");
    return;
  }

  const a = currentClient.activities;
  const total = Object.values(a).reduce((s, v) => s + v, 0);

  if (total === 0) {
    alert("Aún no hay tiempo suficiente");
    return;
  }

  const pctTrabajo = Math.round((a.trabajo / total) * 100);

  let estado, texto;
  if (pctTrabajo >= 64) {
    estado = "🟢 Enfocado";
    texto = "Buen nivel de foco";
  } else if (pctTrabajo >= 40) {
    estado = "🟡 Atención";
    texto = "Puedes mejorar el foco";
  } else {
    estado = "🔴 Disperso";
    texto = "Demasiadas interrupciones";
  }

  alert(
`🎯 Enfoque

Trabajo: ${T.format(a.trabajo)}
Teléfono: ${T.format(a.telefono)}
Cliente: ${T.format(a.cliente)}
Visitando: ${T.format(a.visitando)}
Otros: ${T.format(a.otros)}

Trabajo: ${pctTrabajo}%

${estado}
${texto}`
  );
};

/* ========= REPORTE CSV ========= */
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
  a.download = "focowork.csv";
  a.click();
};

/* ========= FULL / WHATSAPP ========= */
$("activateFull").onclick = () => {
  const msg = encodeURIComponent("Hola, quiero activar FocoWork FULL");
  window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, "_blank");
};

$("licenseBtn").onclick = () => {
  const code = $("licenseInput").value.trim();
  if (!code) {
    alert("Introduce un código");
    return;
  }

  if (code.startsWith("FW-FULL-")) {
    localStorage.setItem("fw_full", "1");
    alert("Versión completa activada");
    location.reload();
  } else {
    alert("Código no válido");
  }
};
