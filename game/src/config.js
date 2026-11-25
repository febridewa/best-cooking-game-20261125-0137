// Layout, tuning and palette for Sizzle & Sage: Rush Hour Kitchen.
// One logical canvas, 1280 x 800, scaled to the window. The kitchen is a
// single room: an order board along the top, pantry shelves on the left,
// work stations across the middle, and the assembly counter + serve window
// along the bottom, so every order is a short planned route through the room.

export const VIEW = { width: 1280, height: 800 };

export const HUD = { height: 62 };
export const BOARD = { x: 16, y: 74, ticketWidth: 204, ticketHeight: 108, gap: 12 };
export const FLOOR = { top: 196, bottom: 788, left: 12, right: 1268 };

// The chef walks the open floor between the top stations and the bottom counter.
export const CHEF = {
  radius: 24,
  speed: 265,
  startX: 640,
  startY: 560,
};

// One shift lasts three minutes; the last minute is the dinner rush.
export const SHIFT = {
  lengthSeconds: 180,
  rushAtSecondsLeft: 60,
  orderIntervalSeconds: 15,
  rushOrderIntervalSeconds: 9,
  orderTimeSeconds: 55,
  rushOrderTimeSeconds: 42,
  maxTickets: 4,
  strikesToClose: 3,
};

export const PREP = {
  chopSeconds: 2.4,
  grillSeconds: 6,
  grillBurnSeconds: 11,
  frySeconds: 5,
  fryBurnSeconds: 10,
};

export const SCORE = {
  serveBase: 10,
  timeBonusPerSecond: 1,
  tipThresholdSeconds: 20,
  tipBonus: 8,
  wrongServePenalty: 5,
  expiredPenalty: 10,
  comboStep: 0.25,
};

// Warm kitchen palette: cream tiles, tomato red, sage green, ember orange.
export const COLORS = {
  wall: '#3a2a1c',
  floorA: '#e8d5b0',
  floorB: '#dfc79c',
  floorLine: '#c9ad7d',
  counterTop: '#8a5a33',
  counterSide: '#6e4525',
  steel: '#9aa5ad',
  steelDark: '#6d787f',
  board: '#2b2118',
  ticket: '#fff6df',
  ticketEdge: '#d9b96a',
  ink: '#2b2118',
  red: '#d94f3d',
  redDark: '#a83226',
  green: '#5d9b4a',
  sage: '#7fb069',
  orange: '#f08a24',
  ember: '#e85d2f',
  yellow: '#f6c945',
  cream: '#fff3d6',
  blue: '#4a90c2',
};

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Deterministic RNG (mulberry32) so a seed always deals the same orders. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one entry of `list` with the seeded RNG. */
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}
