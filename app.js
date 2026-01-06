/*************************************************
 * FOCOWORK — app.js FINAL DEFINITIVO
 *************************************************/

/* ================= CONFIG ================= */

const WHATSAPP_PHONE = "34649383847";

const VALID_CODES = [
  "FW-ALQ2-VBP5","FW-QAWQ-WQ6P","FW-R40N-ZP88","FW-1DX3-2VQH","FW-0YDN-OE9V",
  "FW-60LF-VRRF","FW-FI6K-UEMV","FW-9DN2-XTFN","FW-SOEG-XPL3","FW-C9XQ-0JFT",
  "FW-FUVX-4CU5","FW-EXQX-G8ZP","FW-7H62-FMN7","FW-VQMQ-2JYG","FW-KU33-TR6I",
  "FW-7EEH-K1WG","FW-83OX-GNWZ","FW-5YIB-7SJE","FW-BBBF-CT47","FW-BNF4-DJ3Y",
  "FW-GSMY-XNI2","FW-DF0K-8VYO","FW-GCLP-5HXT","FW-AIE9-N9BX","FW-ROYX-JFJ4",
  "FW-7ZW0-2BQ6","FW-6ZIS-BXHC","FW-4R02-LYE9","FW-M5IR-2UDM","FW-LCM7-R3Q0",
  "FW-CFA9-B81K","FW-5DJR-4LGS","FW-X1FH-JXN9","FW-C19P-17I0","FW-UJ5B-RS3K",
  "FW-G0ZE-Z2P5","FW-IJY6-TM38","FW-G5WI-6VE3","FW-GPT6-XGXY","FW-NQG5-UBBJ",
  "FW-RAGX-PRAM","FW-RFA0-IH08","FW-9QGF-ZTTN","FW-ZK0F-5U47","FW-GSLS-ME29",
  "FW-0ODT-JU2R","FW-T299-WCQS","FW-NOEX-H6QO","FW-NPV1-NGO2","FW-2QQU-X1R1"
];

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

/* ================= ALERT PERSONALIZADO ================= */

function showAlert(title, message, icon = "ℹ️") {
  $("alertTitle").textContent = title;
  $("alertText").textContent = message;
  $("alertIcon").textContent = icon;
  $("alertOverlay").classList.remove("hidden");
}

$("alertOk").onclick = () => {
  $("alertOverlay").classList.add("hidden");
};

/* ================= USER ================= */

let userName = localStorage.getItem("focowork_user_name");
if (!userName) {
  userName = prompt("Tu nombre (para reportes):");
  if (userName) localStorage.setItem("focowork_user_name", userName);
}

/* ================= STATE ================= */

let state = JSON.parse(localStorage.getItem("focowork_state")) || {
  isFull: localStorage.getItem("focowork_full") === "true",
  license: localStorage.getItem("focowork_license") || null,
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
  if (state.day !== todayKey()) {
    state.day = todayKey();
    state.focus = {};
    save();
  }
}

/* ================= TIME ENGINE ================= */

function tick() {
  resetDayIfNeeded();

  const client = state.clients[state.currentClientId];
  if (!client || !client.active || !state.currentActivity || !state.lastTick) {
    state.lastTick = Date.now();
    return;
  }

  const now = Date.now();
  const elapsed = Math.floor((now - state.lastTick) / 1000);
  if (elapsed <= 0) return;

  state.lastTick = now;
  state.sessionElapsed += elapsed;
  client.total += elapsed;

  client.activities[state.currentActivity] =
    (client.activities[state.currentActivity] || 0) + elapsed;

  state.focus[state.currentActivity] =
    (state.focus[state.currentActivity] || 0) + elapsed;

  save();
  updateUI();
}

setInterval(tick, 1000);

/* ================= ACTIVIDADES ================= */

function setActivity(activity) {
  const client = state.clients[state.currentClientId];
  if (!client || !client.active) {
    showAlert("Atención", "Selecciona un cliente activo primero", "⚠️");
    return;
  }

  state.currentActivity = activity;
  state.sessionElapsed = 0;
  state.lastTick = Date.now();
  save();
  updateUI();
}

/* ================= UI ================= */

function updateUI() {
  const client = state.currentClientId
    ? state.clients[state.currentClientId]
    : null;

  $("clientName").textContent = client
    ? `Cliente: ${client.name}${client.active ? "" : " (cerrado)"}`
    : "Sin cliente activo";

  $("activityName").textContent = state.currentActivity || "—";
  $("timer").textContent =
    client && client.active ? formatTime(state.sessionElapsed) : "00:00:00";

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

  $("cameraBtn").style.display = client && client.active ? "block" : "none";
  $("deleteClientBtn").style.display = client && !client.active ? "block" : "none";
  $("versionBox").style.display = state.isFull ? "none" : "block";

  renderPhotoGallery();
}

/* ================= CLIENTES ================= */

function newClient() {
  const name = prompt("Cliente + descripción del trabajo");
  if (!name) return;

  const activeClients = Object.values(state.clients).filter(c => c.active);
  if (!state.isFull && activeClients.length >= 2) {
    showAlert("Versión demo", "Máximo 2 clientes activos", "🔒");
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
  if (!actives.length) {
    showAlert("Info", "No hay clientes activos");
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
  const client = state.clients[state.currentClientId];
  if (!client) return;

  client.active = false;
  showAlert("Cliente cerrado",
    `${client.name}\nTotal: ${formatTime(client.total)}`,
    "✅"
  );

  state.currentClientId = null;
  state.currentActivity = null;
  state.lastTick = null;

  save();
  updateUI();
}

/* ================= HISTÓRICO ================= */

function showHistory() {
  const closed = Object.values(state.clients).filter(c => !c.active);
  if (!closed.length) {
    showAlert("Histórico", "No hay clientes cerrados");
    return;
  }

  const query = prompt("Buscar cliente (vacío = todos)");
  const filtered = query
    ? closed.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : closed;

  if (!filtered.length) {
    showAlert("Histórico", "Sin resultados");
    return;
  }

  const list = filtered.map((c, i) => `${i + 1}. ${c.name}`).join("\n");
  const sel = parseInt(prompt("Histórico:\n" + list), 10);
  if (!sel || !filtered[sel - 1]) return;

  state.currentClientId = filtered[sel - 1].id;
  state.currentActivity = null;
  state.sessionElapsed = 0;
  state.lastTick = null;

  updateUI();
}

/* ================= BORRAR CLIENTE ================= */

function deleteCurrentClient() {
  const client = state.clients[state.currentClientId];
  if (!client || client.active) return;

  const confirmText = prompt(
    `Eliminar DEFINITIVAMENTE:\n${client.name}\n\nEscribe BORRAR`
  );

  if (confirmText !== "BORRAR") return;

  delete state.clients[state.currentClientId];
  state.currentClientId = null;
  state.currentActivity = null;
  state.lastTick = null;

  save();
  updateUI();
  showAlert("Eliminado", "Cliente eliminado correctamente", "🗑️");
}

/* ================= FOTOS ================= */

function addPhotoToClient() {
  const client = state.clients[state.currentClientId];
  if (!client) return;

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.capture = "environment";

  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
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

        client.photos.push({
          id: uid(),
          date: new Date().toISOString(),
          data: canvas.toDataURL("image/jpeg", 0.7)
        });

        save();
        renderPhotoGallery();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  input.click();
}

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

      img.onclick = () => {
        const w = window.open();
        if (w) w.document.write(`<img src="${p.data}" style="width:100%">`);
      };

      img.oncontextmenu = (e) => {
        e.preventDefault();
        if (confirm("¿Eliminar esta foto?")) {
          client.photos = client.photos.filter(f => f.id !== p.id);
          save();
          renderPhotoGallery();
        }
      };

      gallery.appendChild(img);
    });
}

/* ================= ENFOQUE ================= */

function showFocus() {
  const total = Object.values(state.focus).reduce((a, b) => a + b, 0);
  if (!total) {
    showAlert("Enfoque", "Aún no hay datos");
    return;
  }

  let msg = "";
  for (const act in state.focus) {
    const t = state.focus[act];
    const pct = Math.round((t / total) * 100);
    msg += `${act}: ${formatTime(t)} (${pct}%)\n`;
  }

  showAlert("Enfoque diario", msg, "🎯");
}

/* ================= CSV ================= */

function exportTodayCSV() {
  let csv = "Usuario,Cliente,Tiempo\n";
  Object.values(state.clients).forEach(c => {
    csv += `${userName},${c.name},${formatTime(c.total)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `focowork_${todayKey()}.csv`;
  a.click();
}

/* ================= LICENCIA ================= */

function activateWhatsApp() {
  const msg = encodeURIComponent(
    "Hola, quiero activar FocoWork. ¿Cómo procedemos?"
  );
  window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${msg}`, "_blank");
}

function applyCode() {
  const input = $("activationCode");
  const code = input.value.trim().toUpperCase();

  if (!VALID_CODES.includes(code)) {
    showAlert("Código inválido", "El código introducido no es válido", "❌");
    return;
  }

  state.isFull = true;
  state.license = code;
  localStorage.setItem("focowork_full", "true");
  localStorage.setItem("focowork_license", code);

  save();
  updateUI();
  showAlert("Activado", "Versión completa activada", "🔓");
}

/* ================= EVENTOS ================= */

document.querySelectorAll(".activity").forEach(b =>
  b.onclick = () => setActivity(b.dataset.activity)
);

$("newClient").onclick = newClient;
$("changeClient").onclick = changeClient;
$("historyBtn").onclick = showHistory;
$("closeClient").onclick = closeClient;
$("deleteClientBtn").onclick = deleteCurrentClient;
$("cameraBtn").onclick = addPhotoToClient;
$("focusBtn").onclick = showFocus;
$("todayBtn").onclick = exportTodayCSV;
$("activateFull").onclick = activateWhatsApp;
$("applyCode").onclick = applyCode;

/* ================= INIT ================= */

updateUI();
