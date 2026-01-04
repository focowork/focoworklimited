/*************************************************
 * FOCOWORK — app.js (ESTABLE + GALERÍA + FIX CÁMARA)
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

set
