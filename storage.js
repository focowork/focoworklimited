const STORAGE_KEYS = {
  STATE: "timeapp_state",
  CLIENTS: "timeapp_clients",
  BLOCKS: "timeapp_blocks"
};

function load(key, defaultValue) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : defaultValue;
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadState() {
  return load(STORAGE_KEYS.STATE, {
    currentClientId: null,
    currentBlockId: null
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


// --- LICENCIA SIMPLE ---
const LICENSE_KEY = "timeapp_license";
const MAX_TRIAL_CLIENTS = 2;

export function loadLicense() {
  return load(LICENSE_KEY, "trial");
}

export function saveLicense(license) {
  save(LICENSE_KEY, license);
}

// --- OVERRIDE DE GUARDADO DE CLIENTES ---
export function saveClients(clients) {
  const license = loadLicense();
  if (license === "trial" && clients.length > MAX_TRIAL_CLIENTS) {
    clients = clients.slice(0, MAX_TRIAL_CLIENTS);
    alert("Versión de prueba: máximo 2 clientes");
  }
  save(STORAGE_KEYS.CLIENTS, clients);
}
