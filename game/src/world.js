// The world: the chef, the stations, the tickets and the shift itself.
// Everything the game simulates lives here; render.js only draws it and
// main.js only steps it. A station job (chopping, grilling, frying) runs on
// its own clock once an ingredient is placed, so the chef is free to plan
// the next move while food cooks — that planning is the game.

import { BOARD, CHEF, COLORS, FLOOR, PREP, SCORE, SHIFT, clamp, makeRng, pick } from './config.js';
import { INGREDIENTS, PANTRY, PREP_RESULTS, RECIPES, recipeForPlate } from './recipes.js';
import { sfx, startSizzle, stopSizzle } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** Station rectangles, in canvas coordinates. */
export const STATIONS = {
  pantry: PANTRY.map((ingredient, index) => ({
    kind: 'pantry',
    id: `pantry-${ingredient}`,
    ingredient,
    x: 20, y: 208 + index * 58, w: 168, h: 50,
    approach: { x: 230, y: 233 + index * 58 },
    label: INGREDIENTS[ingredient].name,
  })),
  board: {
    kind: 'board', id: 'board',
    x: 300, y: 208, w: 190, h: 92,
    approach: { x: 395, y: 330 },
    label: 'Chopping Board',
  },
  grill: {
    kind: 'grill', id: 'grill',
    x: 560, y: 208, w: 260, h: 92,
    approach: { x: 690, y: 330 },
    label: 'Grill',
  },
  fryer: {
    kind: 'fryer', id: 'fryer',
    x: 900, y: 208, w: 170, h: 92,
    approach: { x: 985, y: 330 },
    label: 'Fryer',
  },
  bin: {
    kind: 'bin', id: 'bin',
    x: 20, y: 660, w: 150, h: 110,
    approach: { x: 200, y: 715 },
    label: 'Bin',
  },
  assembly: {
    kind: 'assembly', id: 'assembly',
    x: 300, y: 660, w: 400, h: 110,
    approach: { x: 500, y: 630 },
    label: 'Assembly Counter',
  },
  serve: {
    kind: 'serve', id: 'serve',
    x: 900, y: 660, w: 348, h: 110,
    approach: { x: 1074, y: 630 },
    label: 'Serve Window',
  },
};

export function allStations() {
  return [...STATIONS.pantry, STATIONS.board, STATIONS.grill, STATIONS.fryer, STATIONS.bin, STATIONS.assembly, STATIONS.serve];
}

/** A fresh world for a new shift. */
export function createWorld(seed = 1) {
  return {
    seed,
    rng: makeRng(seed),
    screen: SCREEN_TITLE,
    time: 0,
    shiftLeft: SHIFT.lengthSeconds,
    spawnIn: 2,
    orderNumber: 0,
    tickets: [],
    coins: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    strikes: 0,
    rushAnnounced: false,
    lastTickSecond: -1,
    chef: {
      x: CHEF.startX, y: CHEF.startY,
      facing: -1,
      hands: null,
      moveTarget: null,
      moveStation: null,
      walking: false,
      bob: 0,
    },
    board: { job: null },
    grill: { slots: [null, null] },
    fryer: { slot: null },
    assembly: { plate: [] },
    particles: [],
    floats: [],
    banner: null,
    endStats: null,
  };
}

function addFloat(world, x, y, text, color) {
  world.floats.push({ x, y, text, color, life: 1.4, max: 1.4 });
}

function burst(world, x, y, color, count, speed = 90) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    world.particles.push({
      x, y,
      vx: Math.cos(angle) * v, vy: Math.sin(angle) * v - 40,
      life: 0.6 + Math.random() * 0.5, max: 1,
      color, size: 3 + Math.random() * 4,
    });
  }
}

function smoke(world, x, y) {
  world.particles.push({
    x: x + (Math.random() - 0.5) * 20, y,
    vx: (Math.random() - 0.5) * 12, vy: -28 - Math.random() * 18,
    life: 0.9, max: 0.9, color: 'rgba(200,200,200,0.55)', size: 5 + Math.random() * 5,
  });
}

function spawnTicket(world) {
  const recipe = pick(world.rng, RECIPES);
  const rush = world.shiftLeft <= SHIFT.rushAtSecondsLeft;
  const total = rush ? SHIFT.rushOrderTimeSeconds : SHIFT.orderTimeSeconds;
  world.orderNumber += 1;
  world.tickets.push({
    id: world.orderNumber,
    recipe,
    timeLeft: total,
    total,
    fresh: 0.6,
  });
  sfx.newOrder();
}

function endShift(world, reason) {
  world.screen = SCREEN_OVER;
  stopSizzle();
  const served = world.served;
  const rank = served >= 12 ? 'S' : served >= 9 ? 'A' : served >= 6 ? 'B' : served >= 3 ? 'C' : 'D';
  world.endStats = { reason, rank, served, coins: world.coins, bestCombo: world.bestCombo };
  sfx.gameOver();
}

/** The station whose approach point is nearest the chef, within reach. */
export function nearestStation(world) {
  let best = null;
  let bestDist = 78;
  for (const station of allStations()) {
    const dx = station.approach.x - world.chef.x;
    const dy = station.approach.y - world.chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = station;
    }
  }
  return best;
}

/** True when the chef's hands hold a finished plate. */
export function holdingPlate(world) {
  return world.chef.hands !== null && typeof world.chef.hands === 'object';
}

function handsName(world) {
  const hands = world.chef.hands;
  if (hands === null) return 'empty hands';
  if (typeof hands === 'object') return 'a plated dish';
  return INGREDIENTS[hands].name;
}

/** Use the station the chef stands at. Returns a short status line. */
export function interact(world) {
  const station = nearestStation(world);
  if (station === null) return 'Walk up to a station first!';
  const chef = world.chef;

  if (station.kind === 'pantry') {
    if (chef.hands !== null) return 'Hands full — serve or bin it first!';
    chef.hands = station.ingredient;
    sfx.pickup();
    return `Picked up ${INGREDIENTS[station.ingredient].name}`;
  }

  if (station.kind === 'board') {
    const job = world.board.job;
    if (job === null) {
      if (typeof chef.hands !== 'string') return 'Bring something to chop!';
      const result = PREP_RESULTS.chop[chef.hands];
      if (!result) return `${INGREDIENTS[chef.hands].name} needs no chopping.`;
      world.board.job = { input: chef.hands, result, progress: 0, done: false };
      const chopping = INGREDIENTS[chef.hands].name;
      chef.hands = null;
      sfx.chop();
      return `Chopping ${chopping}…`;
    }
    if (!job.done) return 'Still chopping…';
    chef.hands = job.result;
    world.board.job = null;
    sfx.chopDone();
    burst(world, station.x + station.w / 2, station.y + 30, '#8fce6e', 8);
    return `Picked up ${INGREDIENTS[job.result].name}`;
  }

  if (station.kind === 'grill') {
    const slots = world.grill.slots;
    if (typeof chef.hands === 'string' && chef.hands === 'patty') {
      const free = slots.findIndex((slot) => slot === null);
      if (free === -1) return 'Grill is full!';
      slots[free] = { input: 'patty', result: 'grilledPatty', progress: 0, done: false, burnt: false };
      chef.hands = null;
      sfx.place();
      startSizzle();
      return 'Patty on the grill…';
    }
    const ready = slots.findIndex((slot) => slot !== null && (slot.done || slot.burnt));
    if (ready !== -1) {
      if (chef.hands !== null) return 'Hands full — clear them first!';
      const slot = slots[ready];
      slots[ready] = null;
      chef.hands = slot.burnt ? 'burnt' : slot.result;
      if (slot.burnt) { sfx.burn(); return 'Burnt! Bin it.'; }
      sfx.grillDone();
      return 'Picked up a grilled patty';
    }
    if (slots.some((slot) => slot !== null)) return 'Still grilling…';
    return 'Bring a raw patty to grill!';
  }

  if (station.kind === 'fryer') {
    const slot = world.fryer.slot;
    if (slot === null) {
      if (chef.hands !== 'onion') return 'Bring an onion to fry!';
      world.fryer.slot = { input: 'onion', result: 'onionRings', progress: 0, done: false, burnt: false };
      chef.hands = null;
      sfx.place();
      startSizzle();
      return 'Onion rings frying…';
    }
    if (!slot.done && !slot.burnt) return 'Still frying…';
    if (chef.hands !== null) return 'Hands full — clear them first!';
    world.fryer.slot = null;
    chef.hands = slot.burnt ? 'burnt' : slot.result;
    if (slot.burnt) { sfx.burn(); return 'Burnt! Bin it.'; }
    sfx.grillDone();
    return 'Picked up crispy onion rings';
  }

  if (station.kind === 'assembly') {
    const plate = world.assembly.plate;
    if (typeof chef.hands === 'string') {
      if (plate.length >= 5) return 'Plate is full — serve it or bin it!';
      plate.push(chef.hands);
      chef.hands = null;
      sfx.place();
      const recipe = recipeForPlate(plate);
      if (recipe) {
        addFloat(world, station.x + station.w / 2, station.y - 8, `${recipe.name} ready!`, COLORS.green);
        sfx.chopDone();
      }
      return recipe ? `${recipe.name} is ready to serve!` : 'Added to the plate';
    }
    if (holdingPlate(world)) {
      if (plate.length > 0) return 'Counter already holds a plate!';
      world.assembly.plate = chef.hands.plate;
      chef.hands = null;
      sfx.place();
      return 'Plate back on the counter';
    }
    if (plate.length === 0) return 'Bring ingredients to build a dish!';
    chef.hands = { plate: [...plate] };
    world.assembly.plate = [];
    sfx.pickup();
    return 'Picked up the plate';
  }

  if (station.kind === 'serve') {
    if (!holdingPlate(world)) return 'Bring a finished plate to serve!';
    const built = chef.hands.plate;
    const recipe = recipeForPlate(built);
    const ticketIndex = recipe === null ? -1 : world.tickets.findIndex((t) => t.recipe.id === recipe.id);
    if (ticketIndex === -1) {
      world.coins = Math.max(0, world.coins - SCORE.wrongServePenalty);
      world.combo = 0;
      sfx.wrong();
      addFloat(world, station.x + station.w / 2, station.y - 8, `No order for that! -$${SCORE.wrongServePenalty}`, COLORS.red);
      return 'Nobody ordered that dish!';
    }
    const ticket = world.tickets[ticketIndex];
    world.tickets.splice(ticketIndex, 1);
    const timeBonus = Math.floor(ticket.timeLeft) * SCORE.timeBonusPerSecond;
    const tip = ticket.timeLeft >= SCORE.tipThresholdSeconds ? SCORE.tipBonus : 0;
    const comboMult = 1 + world.combo * SCORE.comboStep;
    const earned = Math.round((SCORE.serveBase + recipe.price + timeBonus + tip) * comboMult);
    world.coins += earned;
    world.served += 1;
    world.combo += 1;
    world.bestCombo = Math.max(world.bestCombo, world.combo);
    chef.hands = null;
    sfx.serve();
    burst(world, station.x + station.w / 2, station.y + 40, COLORS.yellow, 16, 130);
    addFloat(world, station.x + station.w / 2, station.y - 8, `+$${earned}${tip > 0 ? ' inc. tip!' : ''}`, COLORS.green);
    return `${recipe.name} served! +$${earned}`;
  }

  if (station.kind === 'bin') {
    if (chef.hands === null) return 'Nothing to throw away.';
    const name = handsName(world);
    chef.hands = null;
    sfx.place();
    return `Binned ${name}`;
  }

  return '';
}

function stepStationJobs(world, dt) {
  const boardJob = world.board.job;
  if (boardJob !== null && !boardJob.done) {
    boardJob.progress += dt;
    if (boardJob.progress >= PREP.chopSeconds) {
      boardJob.done = true;
      sfx.chopDone();
    }
  }
  let cooking = false;
  for (const slot of world.grill.slots) {
    if (slot === null) continue;
    cooking = true;
    slot.progress += dt;
    if (!slot.done && slot.progress >= PREP.grillSeconds) {
      slot.done = true;
      sfx.grillDone();
      addFloat(world, STATIONS.grill.x + STATIONS.grill.w / 2, STATIONS.grill.y - 8, 'Patty ready!', COLORS.green);
    }
    if (!slot.burnt && slot.progress >= PREP.grillBurnSeconds) {
      slot.burnt = true;
      slot.done = false;
      sfx.burn();
      addFloat(world, STATIONS.grill.x + STATIONS.grill.w / 2, STATIONS.grill.y - 8, 'Burnt!', COLORS.red);
    }
    if (slot.progress > PREP.grillSeconds * 0.5 && slot.progress < PREP.grillBurnSeconds) {
      if (Math.random() < dt * 6) smoke(world, STATIONS.grill.x + 60 + (world.grill.slots.indexOf(slot) * 110), STATIONS.grill.y + 24);
    }
  }
  const fry = world.fryer.slot;
  if (fry !== null) {
    cooking = true;
    fry.progress += dt;
    if (!fry.done && fry.progress >= PREP.frySeconds) {
      fry.done = true;
      sfx.grillDone();
      addFloat(world, STATIONS.fryer.x + STATIONS.fryer.w / 2, STATIONS.fryer.y - 8, 'Rings ready!', COLORS.green);
    }
    if (!fry.burnt && fry.progress >= PREP.fryBurnSeconds) {
      fry.burnt = true;
      fry.done = false;
      sfx.burn();
      addFloat(world, STATIONS.fryer.x + STATIONS.fryer.w / 2, STATIONS.fryer.y - 8, 'Burnt!', COLORS.red);
    }
  }
  if (!cooking) stopSizzle();
}

function stepTickets(world, dt) {
  for (let i = world.tickets.length - 1; i >= 0; i -= 1) {
    const ticket = world.tickets[i];
    ticket.timeLeft -= dt;
    ticket.fresh = Math.max(0, ticket.fresh - dt);
    const whole = Math.ceil(ticket.timeLeft);
    if (ticket.timeLeft <= 10 && whole !== ticket.lastWhole) {
      ticket.lastWhole = whole;
      if (whole <= 5) sfx.tick();
    }
    if (ticket.timeLeft <= 0) {
      world.tickets.splice(i, 1);
      world.strikes += 1;
      world.combo = 0;
      world.coins = Math.max(0, world.coins - SCORE.expiredPenalty);
      sfx.wrong();
      addFloat(world, 640, 200, `${ticket.recipe.name} walked out! -$${SCORE.expiredPenalty}`, COLORS.red);
      if (world.strikes >= SHIFT.strikesToClose) {
        endShift(world, 'Three customers walked out — the kitchen closed early.');
        return;
      }
    }
  }
  world.spawnIn -= dt;
  const rush = world.shiftLeft <= SHIFT.rushAtSecondsLeft;
  if (world.spawnIn <= 0 && world.tickets.length < SHIFT.maxTickets) {
    spawnTicket(world);
    world.spawnIn = rush ? SHIFT.rushOrderIntervalSeconds : SHIFT.orderIntervalSeconds;
  }
}

function stepChef(world, dt, input) {
  const chef = world.chef;
  const move = input.moveVector();
  let vx = move.x;
  let vy = move.y;
  if ((vx !== 0 || vy !== 0) && chef.moveTarget !== null) {
    chef.moveTarget = null;
    chef.moveStation = null;
  }
  if (vx === 0 && vy === 0 && chef.moveTarget !== null) {
    const dx = chef.moveTarget.x - chef.x;
    const dy = chef.moveTarget.y - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      chef.moveTarget = null;
      if (chef.moveStation !== null) {
        const station = chef.moveStation;
        chef.moveStation = null;
        const line = interact(world);
        world.banner = { text: line, life: 1.6 };
      }
    } else {
      vx = dx / dist;
      vy = dy / dist;
    }
  }
  if (vx !== 0 || vy !== 0) {
    chef.facing = vx < 0 ? -1 : vx > 0 ? 1 : chef.facing;
    chef.walking = true;
    chef.bob += dt * 12;
  } else {
    chef.walking = false;
  }
  chef.x = clamp(chef.x + vx * CHEF.speed * dt, FLOOR.left + CHEF.radius, FLOOR.right - CHEF.radius);
  chef.y = clamp(chef.y + vy * CHEF.speed * dt, FLOOR.top + CHEF.radius, FLOOR.bottom - CHEF.radius);
}

/** Advance the world one frame. `input` is the object from input.js. */
export function stepWorld(world, dt, input) {
  world.time += dt;
  if (world.banner !== null) {
    world.banner.life -= dt;
    if (world.banner.life <= 0) world.banner = null;
  }
  for (let i = world.particles.length - 1; i >= 0; i -= 1) {
    const p = world.particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
    if (p.life <= 0) world.particles.splice(i, 1);
  }
  for (let i = world.floats.length - 1; i >= 0; i -= 1) {
    const f = world.floats[i];
    f.life -= dt;
    f.y -= 34 * dt;
    if (f.life <= 0) world.floats.splice(i, 1);
  }
  if (world.screen !== SCREEN_PLAY) return;

  world.shiftLeft -= dt;
  const whole = Math.ceil(world.shiftLeft);
  if (whole !== world.lastTickSecond) {
    world.lastTickSecond = whole;
    if (whole === SHIFT.rushAtSecondsLeft) {
      world.rushAnnounced = true;
      world.banner = { text: 'DINNER RUSH! Orders come faster now!', life: 2.4 };
      sfx.rush();
    }
  }
  if (world.shiftLeft <= 0) {
    world.shiftLeft = 0;
    endShift(world, 'Shift complete — the dinner rush is over!');
    return;
  }

  stepChef(world, dt, input);
  stepStationJobs(world, dt);
  stepTickets(world, dt);
}

/** Start a fresh shift from the title screen. */
export function startShift(world) {
  const fresh = createWorld(world.seed);
  Object.assign(world, fresh);
  world.screen = SCREEN_PLAY;
  spawnTicket(world);
  spawnTicket(world);
  world.spawnIn = SHIFT.orderIntervalSeconds;
}

/** Click on a station: walk to it, then use it on arrival. */
export function clickStation(world, x, y) {
  for (const station of allStations()) {
    if (x >= station.x && x <= station.x + station.w && y >= station.y && y <= station.y + station.h) {
      world.chef.moveTarget = { x: station.approach.x, y: station.approach.y };
      world.chef.moveStation = station;
      return true;
    }
  }
  return false;
}

export { BOARD, COLORS };
