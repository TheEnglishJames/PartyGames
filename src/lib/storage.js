// localStorage can throw (private mode, blocked storage) — the app must still run.
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* not persisted, fine for a party game */
  }
}

const DEFAULT_SETTINGS = { drinking: true, spicy: false, sound: true };

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...read('ptp.settings', {}) };
}

export function saveSettings(settings) {
  write('ptp.settings', settings);
}

export function loadPlayers() {
  const players = read('ptp.players', []);
  return Array.isArray(players) ? players.filter((p) => typeof p === 'string') : [];
}

export function savePlayers(players) {
  write('ptp.players', players);
}
