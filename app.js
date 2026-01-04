/*************************************************
 * FOCOWORK — app.js (ESTABLE FINAL)
 *************************************************/

/* ================= CONFIG ================= */

const FULL_CODE = "FOCOWORK-FULL-2026";
const WHATSAPP_PHONE = "34649383847";

/* ================= HELPERS ================= */

const $ = (id) => document.getElementById(id);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

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
    btn.classList.toggle("active", btn.dataset.activity === state.currentActivity);
  });

  $("cameraBtn").style.display = client ? "block" : "none";
  renderPhotoGallery();
  $("versionBox").style.display = state.isFull ? "none" : "block";
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

  const id = uid();
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
  if (!actives.length) return alert("No hay clientes activos");

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

  alert(`Cliente: ${client.name}\nTiempo total: ${formatTime(client.total)}`);

  state.currentClientId = null;
  state.currentActivity = null;
  state.sessionElapsed = 0;
  state.lastTick = null;

  save();
  updateUI();
}

/* ================= ACTIVIDADES ================= */

function setActivity(act) {
  if (!state.currentClientId) return alert("Primero selecciona un cliente");
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
      setTimeout(() => {
        const img = new Image();
        img.onload = () => {
          const MAX = 1024;
          let { width, height } = img;
          if (width > MAX) {
            height *= MAX / width;
            width = MAX;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);

          const data = canvas.toDataURL("image/jpeg", 0.7);
          state.clients[state.currentClientId].photos.push({
            id: uid(),
            date: new Date().toISOString(),
            data
          });

          save();
          renderPhotoGallery();
        };
        img.src = reader.result;
      }, 0);
    };

    reader.readAsDataURL(file);
  };

  input.click();
}

/* ================= 📂 GALERÍA (TAP / LONG PRESS) ================= */

function renderPhotoGallery() {
  const gallery = $("photoGallery");
  gallery.innerHTML = "";

  const client = state.clients[state.currentClientId];
  if (!client || !client.photos.length) return;

  [...client.photos]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach(p => {
      const img = document.createElement("img");
      img.src = p.data;
      img.className = "photo-thumb";

      let pressTimer = null;

      // TAP → ver foto grande
      img.onclick = () => {
        const w = window.open();
        if (w) {
          w.document.write(
            `<img src="${p.data}" style="width:100%;height:auto;background:#000">`
          );
        }
      };

      // LONG PRESS → borrar
      img.onpointerdown = () => {
        pressTimer = setTimeout(() => {
          if (confirm("¿Eliminar esta foto del cliente?")) {
            client.photos = client.photos.filter(f => f.id !== p.id);
            save();
            renderPhotoGallery();
          }
        }, 600);
      };

      img.onpointerup = img.onpointerleave = () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      };

      gallery.appendChild(img);
    });
}

/* ================= 🎯 ENFOQUE DETALLADO ================= */

function showFocus() {
  const total = Object.values(state.focus).reduce((a, b) => a + b, 0);
  if (!total) return alert("Aún no hay datos de hoy");

  let msg = `🎯 Enfoque diario — ${userName || "Usuario"}\n\n`;
  for (const act in state.focus) {
    const t = state.focus[act];
    const pct = Math.round((t / total) * 100);
    msg += `${act}: ${formatTime(t)} (${pct}%)\n`;
  }

  msg += `\nTotal: ${formatTime(total)}`;
  alert(msg);
}

/* ================= CSV ================= */

function exportTodayCSV() {
  let csv = "Usuario,Cliente,Tiempo\n";
  Object.values(state.clients).forEach(c => {
    csv += `${userName || ""},${c.name},${formatTime(c.total)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `focowork_${todayKey()}.csv`;
  a.click();
}

/* ================= FULL ================= */

function activateWhatsApp() {
  window.open(`https://wa.me/${WHATSAPP_PHONE}?text=Hola quiero activar focowork`, "_blank");
}

function applyCode() {
  if ($("activationCode").value.trim() === FULL_CODE) {
    state.isFull = true;
    localStorage.setItem("focowork_full", "true");
    save();
    updateUI();
    alert("Versión completa activada");
  } else alert("Código incorrecto");
}

/* ================= EVENTS ================= */

document.querySelectorAll(".activity").forEach(b =>
  b.onclick = () => setActivity(b.dataset.activity)
);

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
