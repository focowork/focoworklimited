// timeEngine.js
let startTime = null;
let elapsed = 0;
let interval = null;

export function startTimer(onTick) {
  if (interval) return;

  startTime = Date.now();

  interval = setInterval(() => {
    const now = Date.now();
    const total = elapsed + (now - startTime);
    onTick(total);
  }, 1000);
}

export function stopTimer() {
  if (!interval) return;

  elapsed += Date.now() - startTime;
  clearInterval(interval);
  interval = null;
}

export function resetTimer() {
  startTime = null;
  elapsed = 0;
  clearInterval(interval);
  interval = null;
}

export function getElapsed() {
  if (!startTime) return elapsed;
  return elapsed + (Date.now() - startTime);
}

export function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
