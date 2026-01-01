import {
  loadState,
  saveState,
  loadClients,
  saveClients,
  loadBlocks,
  saveBlocks
} from "./storage.js";

let state = loadState();
let clients = loadClients();
let blocks = loadBlocks();

function now() {
  return Date.now();
}

function generateId() {
  return Math.random().toString(36).slice(2);
}

function closeCurrentBlock() {
  if (!state.currentBlock) return;
  const block = blocks.find(b => b.id === state.currentBlock);
  if (!block) return;
  block.fin = now();
  saveBlocks(blocks);
  state.currentBlock = null;
  saveState(state);
}

function startBlock(clientId, actividad) {
  const block = {
    id: generateId(),
    clientId,
    actividad,
    inicio: now(),
    fin: null
  };
  blocks.push(block);
  saveBlocks(blocks);
  state.currentBlock = block.id;
  saveState(state);
}

export function newClient(nombre) {
  if (clients.length >= 2) {
    alert("Versión de prueba: máximo 2 clientes");
    return;
  }

  closeCurrentBlock();

  const client = {
    id: generateId(),
    nombre,
    estado: "abierto",
    creado_en: now(),
    cerrado_en: null
  };

  clients.push(client);
  saveClients(clients);

  state.currentClientId = client.id;
  saveState(state);

  startBlock(client.id, "trabajo");
}

export function changeClient(id) {
  if (state.currentClientId === id) return;
  closeCurrentBlock();
  state.currentClientId = id;
  saveState(state);
  startBlock(id, "trabajo");
}

export function changeActivity(act) {
  if (!state.currentClientId) return;
  closeCurrentBlock();
  startBlock(state.currentClientId, act);
}

export function closeClient() {
  closeCurrentBlock();
  const client = clients.find(c => c.id === state.currentClientId);
  if (!client) return;
  client.estado = "cerrado";
  client.cerrado_en = now();
  saveClients(clients);
  state.currentClientId = null;
  saveState(state);
}

export function getCurrentState() {
  return { state, clients, blocks };
}
