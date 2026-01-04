/*************************************************
 * FOCOWORK — app.js (GALERÍA POR CLIENTE)
 *************************************************/

/* ================= CONFIG ================= */

const FULL_CODE = "FOCOWORK-FULL-2026";
const WHATSAPP_PHONE = "34649383847";

/* ================= HELPERS ================= */

const $ = (id) => document.getElementById(id);

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/* ================= USER ================= */

let userName = localStorage.getItem("focowork_user_name");
if (!userName) {
  userName = prompt("Tu nombre (para los reportes):");
  if (userName) localStorage.setItem("focowork_user_name", userName);
}

/* ================= STATE ================= */

let state = JSON.parse(localStorage.getItem("focowork_state")) || {
  isFull: localStorage.getItem("focowork_full") === "true",
  day: todayKey(),
  currentClientId: null,
  currentActivity: null,
  lastTick: null,
  sessionElapsed: 0,
  clients: {},
  focus: {}
};

function save() {
  localStorage.setItem("focowork_state", JSON.stringify(state));
}

/* ================= DAILY RESET ================= */

function resetDayIfNeeded() {
  const today = todayKey();
  if (state.day !== today) {
    state.day = today;
    state.focus = {};
    save();
  }
}

/* ================= TIME ENGINE ================= */

function tick() {
  resetDayIfNeeded();

  if (!state.currentClientId || !state.currentActivity || !state.lastTick) {
    state.lastTick = Date.now();
    return;
  }

  const now = Date.now();
  const elapsed = Math.floor((now - state.lastTick) / 1000);
  if (elapsed <= 0) return;

  state.lastTick = now;
  state.sessionElapsed += elapsed;

  const client = state.clients[state.currentClientId];
  if (!client) return;

  client.total += elapsed;
  client.activities[state.currentActivity] =
    (client.activities[state.currentActivity] || 0) + elapsed;

  state.focus[state.currentActivity] =
    (state.focus[state.currentActivity] || 0) + elapsed;

  save();
  updateUI();
}

setInterval(tick, 1000);

/* ================= UI ================= */

function updateUI() {
  const client = state.currentClientId
    ? state.clients[state.currentClientId]
    : null;

  $("clientName").textContent = client
    ? `Cliente: ${client.name}`
    : "Sin cliente activo";

  $("activityName").textContent = state.currentActivity || "—";

  $("timer").textContent = client
    ? formatTime(state.sessionElapsed)
    : "00:00:00";

  if ($("clientTotal")) {
    $("clientTotal").textContent = client
      ? `Total cliente: ${formatTime(client.total)}`
      : "";
  }

  document.querySelectorAll(".activity").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.activity === state.currentActivity
    );
  });

  const cam = $("cameraBtn");
  if (cam) cam.style.display = client ? "block" : "none";

  renderPhotoGallery();

  if ($("versionBox")) {
    $("versionBox").style.display = state.isFull ? "none" : "block";
  }
}

/* ================= CLIENTES ================= */

function newClient() {
  const name = prompt("Nombre del cliente:");
  if (!name) return;

  const activeClients = Object.values(state.clients).filter(c => c.active);
  if (!state.isFull && activeClients.length >= 2) {
    alert("Versión de prueba: máximo 2 clientes activos");
    return;
  }

  const id = crypto.randomUUID();

  state.clients[id] = {
    id,
    name,
    active: true,
    total: 0,
    activities: {},
    photos: []
  };

  state.currentClientId = id;
  state.currentActivity = "trabajo";
  state.sessionElapsed = 0;
  state.lastTick = Date.now();

  save();
  updateUI();
}

function changeClient() {
  const actives = Object.values(state.clients).filter(c => c.active);
  if (!actives.length) {
    alert("No hay clientes activos");
    return;
  }

  const list = actives.map((c, i) => `${i + 1}. ${c.name}`).join("\n");
  const sel = parseInt(prompt("Clientes activos:\n" + list), 10);
  if (!sel || !actives[sel - 1]) return;

  state.currentClientId = actives[sel - 1].id;
  state.currentActivity = "trabajo";
  state.sessionElapsed = 0;
  state.lastTick = Date.now();

  save();
  updateUI();
}

function closeClient() {
  const id = state.currentClientId;
  if (!id) return;

  const client = state.clients[id];
  client.active = false;

  alert(
    `Cliente: ${client.name}\nTiempo total: ${formatTime(client.total)}`
  );

  state.currentClientId = null;
  state.currentActivity = null;
  state.sessionElapsed = 0;
  state.lastTick = null;

  save();
  updateUI();
}

/* ================= ACTIVIDADES ================= */

function setActivity(act) {
  if (!state.currentClientId) {
    alert("Primero selecciona un cliente");
    return;
  }
  state.currentActivity = act;
  state.sessionElapsed = 0;
  state.lastTick = Date.now();
  save();
  updateUI();
}

/* ================= 📷 CÁMARA ================= */

function addPhotoToClient() {
  if (!state.currentClientId) return;

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.capture = "environment";

  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const client = state.clients[state.currentClientId];
      if (!client) return;

      client.photos.push({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        data: reader.result
      });

      save();
      renderPhotoGallery();
    };

    reader.readAsDataURL(file);
  };

  input.click();
}

/* ================= 📂 GALERÍA ================= */

function renderPhotoGallery() {
  const gallery = $("photoGallery");
  if (!gallery) return;

  gallery.innerHTML = "";

  const client = state.currentClientId
    ? state.clients[state.currentClientId]
    : null;

  if (!client || !client.photos.length) return;

  const photos = [...client.photos].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  photos.forEach(p => {
    const img = document.createElement("img");
    img.src = p.data;
    img.className = "photo-thumb";
    img.onclick = () => openPhoto(p, client);
    gallery.appendChild(img);
  });
}

function openPhoto(photo, client) {
  const win = window.open();
  win.document.write(`
    <img src="${photo.data}" style="width:100%;height:auto;background:#000">
  `);
}

/* ================= ENFOQUE ================= */

function showFocus() {
  const total = Object.values(state.focus).reduce((a, b) => a + b, 0);
  if (!total) {
    alert("Aún no hay datos de enfoque hoy");
    return;
  }

  const trabajo = state.focus.trabajo || 0;
  const pct = Math.round((trabajo / total) * 100);

  let estado = "🔴 Disperso";
  if (pct >= 64) estado = "🟢 Enfocado";
  else if (pct >= 40) estado = "🟡 Atención";

  let detalle = "";
  for (const act in state.focus) {
    detalle += `${act}: ${formatTime(state.focus[act])}\n`;
  }

  alert(
`🎯 Enfoque diario — ${userName || "Usuario"}

${detalle}
Trabajo: ${pct}%
Estado: ${estado}`
  );
}

/* ================= CSV ================= */

function exportTodayCSV() {
  const date = todayKey();
  let csv = "Usuario,Cliente,Tiempo total\n";

  Object.values(state.clients).forEach(c => {
    csv += `${userName || ""},${c.name},${formatTime(c.total)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `focowork_${date}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

/* ================= FULL ================= */

function activateWhatsApp() {
  const msg = encodeURIComponent("Hola, quiero activar FocoWork");
  window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${msg}`, "_blank");
}

function applyCode() {
  const input = $("activationCode");
  if (!input) return;

  if (input.value.trim() === FULL_CODE) {
    state.isFull = true;
    localStorage.setItem("focowork_full", "true");
    save();
    updateUI();
    alert("✅ Versión completa activada");
    input.value = "";
  } else {
    alert("❌ Código incorrecto");
  }
}

/* ================= EVENTS ================= */

document.querySelectorAll(".activity").forEach(btn => {
  btn.onclick = () => setActivity(btn.dataset.activity);
});

$("newClient").onclick = newClient;
$("changeClient").onclick = changeClient;
$("closeClient").onclick = closeClient;
$("focusBtn").onclick = showFocus;
$("todayBtn").onclick = exportTodayCSV;
$("cameraBtn").onclick = addPhotoToClient;
$("activateFull").onclick = activateWhatsApp;
$("applyCode").onclick = applyCode;

/* ================= INIT ================= */

updateUI();
