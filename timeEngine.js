// ===============================
// FOCO WORK — TIME ENGINE
// ===============================

let state = {
  currentClientId: null,
  currentActivity: null,
  elapsed: 0,              // tiempo total del cliente actual
  lastTick: null           // timestamp del último tick
};

let clients = [];
let blocks = [];

// ===============================
// UTILIDADES
// ===============================
function now() {
  return Date.now();
}

function save() {
  localStorage.setItem(
    "focowork_engine",
    JSON.stringify({ state, clients, blocks })
  );
}

function load() {
  const saved = localStorage.getItem("focowork_engine");
  if (!saved) return;

  const data = JSON.parse(saved);
  state = data.state;
  clients = data.clients;
  blocks = data.blocks;
}

// ===============================
// TICK GLOBAL (CORAZÓN)
// ===============================
setInterval(() => {
  if (!state.currentClientId || !state.currentActivity) return;

  const t = now();

  if (!state.lastTick) {
    state.lastTick = t;
    return;
  }

  const diff = t - state.lastTick;
  state.lastTick = t;
  state.elapsed += diff;

  save();
}, 1000);

// ===============================
// CLIENTES
// ===============================
export function newClient(name) {
  const id = crypto.randomUUID();

  clients.push({
    id,
    nombre: name,
    estado: "abierto"
  });

  state.currentClientId = id;
  state.currentActivity = null;
  state.elapsed = 0;
  state.lastTick = null;

  save();
}

export function changeClient(id) {
  const client = clients.find(c => c.id === id && c.estado === "abierto");
  if (!client) return;

  state.currentClientId = id;
  state.currentActivity = null;
  state.elapsed = 0;
  state.lastTick = null;

  save();
}

export function closeClient() {
  const client = clients.find(c => c.id === state.currentClientId);
  if (!client) return;

  client.estado = "cerrado";

  state.currentClientId = null;
  state.currentActivity = null;
  state.elapsed = 0;
  state.lastTick = null;

  save();
}

// ===============================
// ACTIVIDADES
// ===============================
export function changeActivity(activity) {
  if (!state.currentClientId) return;

  state.currentActivity = activity;
  state.lastTick = now();

  blocks.push({
    cliente_id: state.currentClientId,
    actividad: activity,
    inicio: state.lastTick,
    fin: null
  });

  save();
}

// ===============================
// ESTADO PÚBLICO
// ===============================
export function getCurrentState() {
  return {
    state: { ...state },
    clients: [...clients],
    blocks: [...blocks]
  };
}

// ===============================
// INIT
// ===============================
load();
