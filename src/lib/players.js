import { shuffle } from './deck.js';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 10;

export function imposterCount(playerCount) {
  return playerCount >= 7 ? 2 : 1;
}

// Returns a Set of player indices that are imposters.
export function pickImposters(playerCount, rng = Math.random) {
  const count = imposterCount(playerCount);
  const picked = new Set();
  while (picked.size < count) picked.add(Math.floor(rng() * playerCount));
  return picked;
}

// Random player index, never the same as `previous`.
export function nextPlayer(playerCount, previous, rng = Math.random) {
  if (playerCount < 2 || previous == null) return Math.floor(rng() * playerCount);
  const i = Math.floor(rng() * (playerCount - 1));
  return i >= previous ? i + 1 : i;
}

// Trims names, drops empties and case-insensitive duplicates.
export function cleanNames(names) {
  const seen = new Set();
  const out = [];
  for (const raw of names) {
    const name = raw.trim().slice(0, 20);
    const key = name.toLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      out.push(name);
    }
  }
  return out;
}

// Random teams as even as possible. Players sharing a crowd (e.g. "came with
// the bride") are spread across teams, so the groups actually mix.
export function splitTeams(players, count = 2, crowdOf = () => 0, rng = Math.random) {
  const crowds = new Map();
  for (const p of shuffle(players, rng)) {
    const c = crowdOf(p);
    if (!crowds.has(c)) crowds.set(c, []);
    crowds.get(c).push(p);
  }
  const teams = Array.from({ length: count }, () => []);
  [...crowds.values()].flat().forEach((p, i) => teams[i % count].push(p));
  return teams;
}
