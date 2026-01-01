const STORAGE_KEYS = {
  STATE: "timeapp_state",
  CLIENTS: "timeapp_clients",
  BLOCKS: "timeapp_blocks"
};

function load(key, def) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : def;
}

function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export function loadState() {
  return load(STORAGE_KEYS.STATE, {
    currentClientId: null,
    currentBlock: null
  });
}

export function saveState(state) {
  save(STORAGE_KEYS.STATE, state);
}

export function loadClients() {
  return load(STORAGE_KEYS.CLIENTS, []);
}

export function saveClients(clients) {
  save(STORAGE_KEYS.CLIENTS, clients);
}

export function loadBlocks() {
  return load(STORAGE_KEYS.BLOCKS, []);
}

export function saveBlocks(blocks) {
  save(STORAGE_KEYS.BLOCKS, blocks);
}
