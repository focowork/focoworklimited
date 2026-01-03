/* =================================================
   FOCO WORK – APP.JS FINAL (PRUEBA + FULL)
   Teléfono WhatsApp: 34649383847
   ================================================= */

const $ = id => document.getElementById(id);

/* ---------- CONFIG ---------- */
const MAX_FREE_CLIENTS = 2;
const WHATSAPP_PHONE = "34649383847";
const LICENSE_KEY = "focowork_full";

/* ---------- HELPERS ---------- */
function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function isFull() {
  return localStorage.getItem(LICENSE_KEY) === "1";
}

/* ---------- USUARIO (1ª VEZ) ---------- */
function getOwnerName() {
  let name = localStorage.getItem("focowork_owner");
  if (!name) {
    name = prompt("Introduce tu nombre o negocio (para los reportes):");
    if (!name || !name.trim()) name = "Sin nombre";
    localStorage.setItem("focowork_owner", name.trim());
  }
  return name;
}
const OWNER = getOwnerName();

/* ---------- ESTADO ---------- */
let clients = JSON.parse(localStorage.getItem("focowork_clients")) || [];
let currentClientId = null;
let currentActivity = null;

let timerStart = null;
let timerInterval = null;
let elapsedSession = 0;

/* ---------- TIMER ---------- */
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

function resetTimer() {
  stopTimer();
  elapsedSession = 0;
  $("timer").textContent = "00:00:00";
}

/* ---------- CLIENTES ---------- */
function activeClients() {
  return clients.filter(c => c.active);
}

function saveClients() {
  localStorage.setItem("focowork_clients", JSON.stringify(clients));
}

function newClient() {
  if (!isFull() && activeClients().length >= MAX_FREE_CLIENTS) {
    alert("Versión de prueba: máximo 2 clientes activos.\nActiva la versión completa.");
    return;
  }

  const name = prompt("Nombre del cliente:");
  if (!name || !name.trim()) return;

  const client = {
    id: Date.now(),
    name: name.trim(),
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
  saveClients();
  selectClient(client);
}

function selectClient(client) {
  currentClientId = client.id;
  $("clientName").textContent = `Cliente: ${client.name}`;
  resetTimer();
}

function changeClient() {
  const actives = activeClients();
  if (!actives.length) {
    alert("No hay clientes activos.");
    return;
  }

  let msg = "Elige cliente:\n";
  actives.forEach((c, i) => msg += `${i + 1}. ${c.name}\n`);

  const choice = parseInt(prompt(msg), 10);
  if (!choice || !actives[choice - 1]) return;

  saveCurrentActivityTime();
  resetTimer();
  selectClient(actives[choice - 1]);
}

function closeClient() {
  if (!currentClientId) return;

  saveCurrentActivityTime();
  stopTimer();

  const client = clients.find(c => c.id === currentClientId);
  client.active = false;
  saveClients();

  const total = Object.values(client.activities).reduce((a, b) => a + b, 0);

  $("infoPanel").classList.remove("hidden");
  $("infoTitle").textContent = "Cliente cerrado";
  $("infoText").textContent =
    `Cliente: ${client.name}\nTiempo total: ${formatTime(total)}`;

  currentClientId = null;
  currentActivity = null;
  elapsedSession = 0;

  $("clientName").textContent = "Sin cliente activo";
  $("activityName").textContent = "—";
  $("timer").textContent = "00:00:00";
}

/* ---------- ACTIVIDADES ---------- */
function saveCurrentActivityTime() {
  if (!currentClientId || !currentActivity) return;
  const client = clients.find(c => c.id === currentClientId);
  if (!client) return;
  client.activities[currentActivity] += elapsedSession;
  elapsedSession = 0;
}

document.querySelectorAll(".activity").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!currentClientId) return;
    saveCurrentActivityTime();
    resetTimer();
    currentActivity = btn.dataset.activity;
    $("activityName").textContent = btn.textContent;
    startTimer();
  });
});

/* ---------- BOTONES ---------- */
$("newClient").onclick = newClient;
$("changeClient").onclick = changeClient;
$("closeClient").onclick = closeClient;

/* ---------- ENFOQUE ---------- */
$("focusBtn").onclick = () => {
  if (!currentClientId) return;
  const client = clients.find(c => c.id === currentClientId);
  const a = client.activities;
  const total = Object.values(a).reduce((x, y) => x + y, 0);
  if (!total) return alert("Aún no hay tiempo suficiente.");
  const focus = Math.round((a.trabajo / total) * 100);
  let msg = `🎯 Enfoque: ${focus}%\n`;
  if (focus >= 75) msg += "Muy buen enfoque";
  else if (focus >= 50) msg += "Enfoque medio";
  else msg += "Muchas interrupciones";
  alert(msg);
};

/* ---------- CSV ---------- */
function downloadCSV(filename, rows) {
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

/* ---------- REPORTE ---------- */
$("todayBtn").onclick = () => {
  const date = new Date().toISOString().slice(0, 10);
  const rows = [[
    "Usuario","Fecha","Cliente","Total",
    "Trabajo","Telefono","Cliente","Visitando","Otros","Enfoque %"
  ]];

  clients.forEach(c => {
    const a = c.activities;
    const total = Object.values(a).reduce((x, y) => x + y, 0);
    if (!total) return;
    const focus = Math.round((a.trabajo / total) * 100);
    rows.push([
      OWNER,date,c.name,
      formatTime(total),
      formatTime(a.trabajo),
      formatTime(a.telefono),
      formatTime(a.cliente),
      formatTime(a.visitando),
      formatTime(a.otros),
      focus
    ]);
  });

  downloadCSV(`focowork-${date}.csv`, rows);
};

/* ---------- ACTIVAR FULL ---------- */
(function () {
  if (isFull()) return;

  const panel = document.createElement("div");
  panel.style.marginTop = "16px";
  panel.innerHTML = `
    <div style="border:1px solid #444;padding:12px;border-radius:10px">
      🔒 <b>Versión de prueba</b><br>
      Máximo 2 clientes activos<br><br>
      <button id="activateFull">Activar versión completa</button><br><br>
      <input id="licenseInput" placeholder="Código de activación">
      <button id="licenseBtn">Activar</button>
    </div>
  `;
  document.querySelector(".app").appendChild(panel);

  $("activateFull").onclick = () => {
    const id = localStorage.getItem("focowork_id") ||
      (() => {
        const v = "FW-" + Math.random().toString(36).slice(2,10).toUpperCase();
        localStorage.setItem("focowork_id", v);
        return v;
      })();

    const msg = encodeURIComponent(
      `Hola, quiero activar FocoWork FULL.\nID: ${id}`
    );

    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${msg}`, "_blank");
  };

  $("licenseBtn").onclick = () => {
    const code = $("licenseInput").value.trim();
    if (code.startsWith("FW-FULL-")) {
      localStorage.setItem(LICENSE_KEY, "1");
      alert("Versión completa activada");
      location.reload();
    } else {
      alert("Código no válido");
    }
  };
})();

/* ---------- UI INICIAL ---------- */
$("timer").textContent = "00:00:00";
$("clientName").textContent = "Sin cliente activo";
$("activityName").textContent = "—";
