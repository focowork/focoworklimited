/*************************************************
 * FOCOWORK – app.js (V2.5 - BUGS CRÍTICOS CORREGIDOS)
 * Sin alerts ni prompts, todo con modales personalizados
 * Identificadores internos separados de textos visibles
 * Enfoque con horario configurable
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

/* ================= ACTIVITIES (INTERNAL KEYS) ================= */

const ACTIVITIES = {
  WORK: "work",
  PHONE: "phone",
  CLIENT: "client",
  VISIT: "visit",
  OTHER: "other"
};

function activityLabel(act) {
  switch (act) {
    case ACTIVITIES.WORK: return "Trabajo";
    case ACTIVITIES.PHONE: return "Teléfono";
    case ACTIVITIES.CLIENT: return "Cliente";
    case ACTIVITIES.VISIT: return "Visitando";
    case ACTIVITIES.OTHER: return "Otros";
    default: return act;
  }
}

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

function isWithinFocusSchedule(date = new Date()) {
  if (!state.focusSchedule || !state.focusSchedule.enabled) {
    return true;
  }

  const [sh, sm] = state.focusSchedule.start.split(":").map(Number);
  const [eh, em] = state.focusSchedule.end.split(":").map(Number);

  const minutesNow = date.getHours() * 60 + date.getMinutes();
  const minutesStart = sh * 60 + sm;
  const minutesEnd = eh * 60 + em;

  return minutesNow >= minutesStart && minutesNow <= minutesEnd;
}

/* ================= MODALES ================= */

function openModal(id) {
  const modal = $(id);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(id) {
  const modal = $(id);
  if (modal) modal.classList.add('hidden');
}

function showAlert(title, message, icon = 'ℹ️') {
  $('alertTitle').textContent = title;
  $('alertText').textContent = message;
  $('alertIcon').textContent = icon;
  openModal('modalAlert');
}

/* ================= USER ================= */

let userName = localStorage.getItem("focowork_user_name") || "Usuario";

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
  focus: {},
  focusSchedule: {
    enabled: false,
    start: "09:00",
    end: "17:00"
  }
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

  if (isWithinFocusSchedule()) {
    state.focus[state.currentActivity] =
      (state.focus[state.currentActivity] || 0) + elapsed;
  }

  save();
  updateUI();
}

setInterval(tick, 1000);

/* ================= ACTIVIDADES ================= */

function setActivity(activity) {
  const client = state.clients[state.currentClientId];
  if (!client || !client.active) {
    showAlert('Sin cliente', 'Primero selecciona un cliente activo', '⚠️');
    return;
  }

  state.currentActivity = activity;
  state.sessionElapsed = 0;
  state.lastTick = Date.now();
  save();
  updateUI();
}

/* ================= WORKPAD (NOTAS) ================= */

let workpadTimeout = null;
let isWorkpadInitialized = false;

function updateWorkpad() {
  const workpadArea = $('clientWorkpad');
  const client = state.clients[state.currentClientId];
  
  if (!workpadArea || !client) {
    if (workpadArea) {
      workpadArea.style.display = 'none';
      isWorkpadInitialized = false;
    }
    return;
  }

  workpadArea.style.display = 'block';
  
  const savedNote = client.notes || '';
  if (workpadArea.value !== savedNote && !isWorkpadInitialized) {
    workpadArea.value = savedNote;
  }
  
  if (!isWorkpadInitialized) {
    workpadArea.oninput = handleWorkpadInput;
    isWorkpadInitialized = true;
  }
}

function handleWorkpadInput(e) {
  const client = state.clients[state.currentClientId];
  if (!client) return;

  client.notes = e.target.value;
  clearTimeout(workpadTimeout);

  workpadTimeout = setTimeout(() => {
    save();
  }, 1000);
}

/* ================= UI ================= */

function updateUI() {
  const client = state.currentClientId
    ? state.clients[state.currentClientId]
    : null;

  $("clientName").textContent = client
    ? `Cliente: ${client.name}${client.active ? "" : " (cerrado)"}`
    : "Sin cliente activo";

  $("activityName").textContent = state.currentActivity 
    ? activityLabel(state.currentActivity) 
    : "—";
  
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

  const deleteBtn = $("deleteClientBtn");
  if (deleteBtn) {
    deleteBtn.style.display = client && !client.active ? "block" : "none";
  }

  $("versionBox").style.display = state.isFull ? "none" : "block";

  // Mostrar aviso si está fuera de horario de enfoque
  updateFocusScheduleStatus();

  updateWorkpad();
  renderPhotoGallery();
}

function updateFocusScheduleStatus() {
  const statusEl = $("focusScheduleStatus");
  if (!statusEl) return;

  if (state.focusSchedule.enabled && !isWithinFocusSchedule()) {
    statusEl.textContent = "⏳ Fuera de horario de enfoque";
    statusEl.style.display = "block";
  } else {
    statusEl.style.display = "none";
  }
}

/* ================= CLIENTES ================= */

function newClient() {
  const activeClients = Object.values(state.clients).filter(c => c.active);
  if (!state.isFull && activeClients.length >= 2) {
    showAlert('Versión demo', 'Máximo 2 clientes activos.\nActiva la versión completa para clientes ilimitados.', '🔒');
    return;
  }

  $('inputNewClient').value = '';
  openModal('modalNewClient');
  
  setTimeout(() => $('inputNewClient').focus(), 300);
}

function confirmNewClient() {
  const name = $('inputNewClient').value.trim();
  if (!name) return;

  const id = uid();
  state.clients[id] = {
    id,
    name,
    active: true,
    total: 0,
    activities: {},
    photos: [],
    notes: ""
  };

  state.currentClientId = id;
  state.currentActivity = ACTIVITIES.WORK;
  state.sessionElapsed = 0;
  state.lastTick = Date.now();
  isWorkpadInitialized = false;

  save();
  updateUI();
  closeModal('modalNewClient');
}

function changeClient() {
  const actives = Object.values(state.clients).filter(c => c.active);
  if (!actives.length) {
    showAlert('Sin clientes', 'No hay clientes activos', '⚠️');
    return;
  }

  const list = $('activeClientsList');
  list.innerHTML = '';

  actives.forEach(client => {
    const item = document.createElement('div');
    item.className = 'client-item';
    item.innerHTML = `
      <div class="client-name">${client.name}</div>
      <div class="client-time">Total: ${formatTime(client.total)}</div>
    `;
    item.onclick = () => selectClient(client.id);
    list.appendChild(item);
  });

  openModal('modalChangeClient');
}

function selectClient(clientId) {
  state.currentClientId = clientId;
  state.currentActivity = ACTIVITIES.WORK;
  state.sessionElapsed = 0;
  state.lastTick = Date.now();
  isWorkpadInitialized = false;

  save();
  updateUI();
  closeModal('modalChangeClient');
}

function closeClient() {
  const client = state.clients[state.currentClientId];
  if (!client) return;

  $('closeClientText').textContent = 
    `Cliente: ${client.name}\nTiempo total: ${formatTime(client.total)}`;
  
  openModal('modalCloseClient');
}

function confirmCloseClient() {
  const client = state.clients[state.currentClientId];
  if (!client) return;

  client.active = false;

  state.currentClientId = null;
  state.currentActivity = null;
  state.lastTick = null;
  isWorkpadInitialized = false;

  save();
  updateUI();
  closeModal('modalCloseClient');
  
  showAlert('Cliente cerrado', `${client.name}\nTiempo total: ${formatTime(client.total)}`, '✅');
}

/* ================= HISTÓRICO ================= */

function showHistory() {
  const closed = Object.values(state.clients).filter(c => !c.active);
  if (!closed.length) {
    showAlert('Sin histórico', 'No hay clientes cerrados', 'ℹ️');
    return;
  }

  renderHistoryList(closed);
  openModal('modalHistory');
}

function renderHistoryList(clients) {
  const list = $('historyClientsList');
  list.innerHTML = '';

  if (!clients.length) {
    list.innerHTML = '<p class="modal-text" style="opacity: 0.6; text-align: center;">Sin resultados</p>';
    return;
  }

  clients.forEach(client => {
    const item = document.createElement('div');
    item.className = 'client-item';
    
    const notesPreview = client.notes && client.notes.trim() 
      ? ` • ${client.notes.slice(0, 30)}${client.notes.length > 30 ? '...' : ''}`
      : '';
    
    item.innerHTML = `
      <div class="client-name">${client.name}</div>
      <div class="client-time">Total: ${formatTime(client.total)} • ${client.photos.length} fotos${notesPreview}</div>
    `;
    item.onclick = () => selectHistoryClient(client.id);
    list.appendChild(item);
  });
}

function selectHistoryClient(clientId) {
  state.currentClientId = clientId;
  state.currentActivity = null;
  state.sessionElapsed = 0;
  state.lastTick = null;
  isWorkpadInitialized = false;

  updateUI();
  closeModal('modalHistory');
}

/* ================= BORRAR CLIENTE ================= */

function deleteCurrentClient() {
  const client = state.clients[state.currentClientId];
  if (!client || client.active) return;

  $('deleteClientText').textContent = 
    `Cliente: ${client.name}\nTiempo: ${formatTime(client.total)}\nFotos: ${client.photos.length}\n\nEsta acción no se puede deshacer.`;
  
  $('inputDeleteConfirm').value = '';
  openModal('modalDeleteClient');
  
  setTimeout(() => $('inputDeleteConfirm').focus(), 300);
}

function confirmDeleteClient() {
  const confirm = $('inputDeleteConfirm').value.trim().toUpperCase();
  
  if (confirm !== 'BORRAR') {
    showAlert('Error', 'Debes escribir BORRAR para confirmar', '⚠️');
    return;
  }

  delete state.clients[state.currentClientId];
  state.currentClientId = null;
  state.currentActivity = null;
  state.lastTick = null;
  isWorkpadInitialized = false;

  save();
  updateUI();
  closeModal('modalDeleteClient');
  
  showAlert('Cliente eliminado', 'El cliente ha sido eliminado definitivamente', '🗑️');
}

/* ================= FOTOS ================= */

let photoToDelete = null;

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
  if (!gallery) return;
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
        if (w) {
          w.document.write(
            `<img src="${p.data}" style="width:100%;background:#000">`
          );
        }
      };

      img.oncontextmenu = (e) => {
        e.preventDefault();
        photoToDelete = p.id;
        openModal('modalDeletePhoto');
      };

      gallery.appendChild(img);
    });
}

function confirmDeletePhoto() {
  if (!photoToDelete) return;

  const client = state.clients[state.currentClientId];
  if (!client) return;

  client.photos = client.photos.filter(f => f.id !== photoToDelete);
  photoToDelete = null;
  
  save();
  renderPhotoGallery();
  closeModal('modalDeletePhoto');
}

/* ================= ENFOQUE ================= */

function showFocus() {
  const total = Object.values(state.focus).reduce((a, b) => a + b, 0);
  if (!total) {
    showAlert('Sin datos', 'Aún no hay datos de enfoque hoy', 'ℹ️');
    return;
  }

  const trabajo = state.focus[ACTIVITIES.WORK] || 0;
  const pct = Math.round((trabajo / total) * 100);

  $('modalUserName').textContent = userName;
  $('modalTotalTime').textContent = formatTime(total);
  
  const list = $('modalActivityList');
  list.innerHTML = '';
  
  for (const act in state.focus) {
    const seconds = state.focus[act];
    const actPct = Math.round((seconds / total) * 100);
    
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <span class="activity-name">${activityLabel(act)}</span>
      <div class="activity-stats">
        <span class="activity-time">${formatTime(seconds)}</span>
        <span class="activity-percent">${actPct}%</span>
      </div>
    `;
    list.appendChild(item);
  }

  const focusState = $('modalFocusState');
  if (pct >= 64) {
    focusState.className = 'focus-state enfocado';
    focusState.innerHTML = '🟢 Enfocado';
  } else if (pct >= 40) {
    focusState.className = 'focus-state atencion';
    focusState.innerHTML = '🟡 Atención';
  } else {
    focusState.className = 'focus-state disperso';
    focusState.innerHTML = '🔴 Disperso';
  }

  openModal('modalEnfoque');
}

/* ================= CSV ================= */

function exportTodayCSV() {
  let csv = "Usuario,Cliente,Tiempo,Notas\n";
  Object.values(state.clients).forEach(c => {
    const notes = (c.notes || '').replace(/[\n\r]/g, ' ').replace(/"/g, '""');
    csv += `${userName},"${c.name}",${formatTime(c.total)},"${notes}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `focowork_${todayKey()}.csv`;
  a.click();
  
  showAlert('CSV exportado', 'El archivo se ha descargado correctamente', '📄');
}

/* ================= CONFIGURACIÓN DE HORARIO ================= */

function openScheduleModal() {
  const checkbox = $('scheduleEnabled');
  const config = $('scheduleConfig');
  const startInput = $('scheduleStart');
  const endInput = $('scheduleEnd');

  checkbox.checked = state.focusSchedule.enabled;
  startInput.value = state.focusSchedule.start;
  endInput.value = state.focusSchedule.end;

  config.style.display = checkbox.checked ? 'block' : 'none';

  updateSchedulePreview();

  checkbox.onchange = () => {
    config.style.display = checkbox.checked ? 'block' : 'none';
  };

  startInput.oninput = updateSchedulePreview;
  endInput.oninput = updateSchedulePreview;

  openModal('modalSchedule');
}

function updateSchedulePreview() {
  const start = $('scheduleStart').value;
  const end = $('scheduleEnd').value;

  $('schedulePreview').textContent = `${start} - ${end}`;

  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const totalMinutes = endMinutes - startMinutes;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  $('scheduleDuration').textContent = `${hours}h ${minutes}m`;
}

function applyPreset(start, end) {
  $('scheduleStart').value = start;
  $('scheduleEnd').value = end;
  updateSchedulePreview();
}

function saveScheduleConfig() {
  const enabled = $('scheduleEnabled').checked;
  const start = $('scheduleStart').value;
  const end = $('scheduleEnd').value;

  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  if ((eh * 60 + em) <= (sh * 60 + sm)) {
    showAlert('Error', 'La hora de fin debe ser posterior a la hora de inicio', '⚠️');
    return;
  }

  state.focusSchedule.enabled = enabled;
  state.focusSchedule.start = start;
  state.focusSchedule.end = end;

  save();
  closeModal('modalSchedule');
  showAlert('Guardado', 'Configuración de horario guardada correctamente', '✅');
}

/* ================= ACTIVACIÓN ================= */

function activateFull() {
  const msg = `Hola, quiero activar FocoWork completo`;
  window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`);
}

function applyCode() {
  const code = $("activationCode").value.trim().toUpperCase();
  
  if (!code) {
    showAlert('Error', 'Introduce un código de activación', '⚠️');
    return;
  }

  if (VALID_CODES.includes(code)) {
    state.isFull = true;
    state.license = code;
    localStorage.setItem("focowork_full", "true");
    localStorage.setItem("focowork_license", code);
    save();
    updateUI();
    showAlert('¡Activado!', 'FocoWork completo activado correctamente.\nDisfruta de clientes ilimitados.', '🎉');
    $("activationCode").value = '';
  } else {
    showAlert('Código inválido', 'El código introducido no es válido', '❌');
  }
}
/* ================= EVENT LISTENERS ================= */

document.addEventListener('DOMContentLoaded', () => {

  // BOTONS PRINCIPALS
  $('newClient').onclick = newClient;
  $('changeClient').onclick = changeClient;
  $('historyBtn').onclick = showHistory;
  $('closeClient').onclick = closeClient;
  $('focusBtn').onclick = showFocus;
  $('scheduleBtn').onclick = openScheduleModal;
  $('todayBtn').onclick = exportTodayCSV;
  $('cameraBtn').onclick = addPhotoToClient;
  $('deleteClientBtn').onclick = deleteCurrentClient;

  // BOTONS D'ACTIVITAT
  document.querySelectorAll('.activity').forEach(btn => {
    btn.onclick = () => setActivity(btn.dataset.activity);
  });

  // CLIC FORA PER TANCAR MODALS
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  // BUSCADOR D'HISTÒRIC
  if ($('searchHistory')) {
    $('searchHistory').addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const closed = Object.values(state.clients).filter(c => !c.active);
      const filtered = closed.filter(c =>
        c.name.toLowerCase().includes(query) ||
        (c.notes || '').toLowerCase().includes(query)
      );
      renderHistoryList(filtered);
    });
  }

  // INICIALITZACIÓ UI
  updateUI();
});
