// timeEngine.js
let engine = {
  running: false,
  startTime: 0,
  currentActivity: null,
  elapsedTotal: 0
};

export function startClient() {
  engine.running = true;
  engine.startTime = Date.now();
  engine.elapsedTotal = 0;
  engine.currentActivity = null;
}

export function stopClient() {
  if (!engine.running) return engine.elapsedTotal;
  engine.elapsedTotal += Date.now() - engine.startTime;
  engine.running = false;
  return engine.elapsedTotal;
}

export function switchActivity(activity, activitiesStore) {
  if (!engine.running) return;

  const now = Date.now();
  const delta = now - engine.startTime;

  if (engine.currentActivity) {
    activitiesStore[engine.currentActivity] += delta;
  }

  engine.elapsedTotal += delta;
  engine.startTime = now;
  engine.currentActivity = activity;
}

export function getElapsed() {
  if (!engine.running) return engine.elapsedTotal;
  return engine.elapsedTotal + (Date.now() - engine.startTime);
}

export function format(ms) {
  const t = Math.floor(ms / 1000);
  const h = String(Math.floor(t / 3600)).padStart(2, "0");
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
  const s = String(t % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
      }
