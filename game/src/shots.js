// Screenshot scenes behind ?shot=start|rush|serve|end. Each one sets the
// live world to a real played state — real tickets, real stations, a real
// plate mid-assembly — and the renderer draws it exactly as a player would
// see it, so every screenshot is a true frame of the game's own code.

import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';
import { RECIPES } from './recipes.js';

function ticket(world, recipeId, timeLeft, total) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  world.orderNumber += 1;
  return { id: world.orderNumber, recipe, timeLeft, total, fresh: 0, lastWhole: Math.ceil(timeLeft) };
}

/**
 * Set `world` to the named scene (start, rush, serve or end; any other name
 * is start) and return the screen to draw over it.
 */
export function stageShot(name, world) {
  if (name === 'rush') {
    world.screen = SCREEN_PLAY;
    world.shiftLeft = 94;
    world.coins = 86;
    world.served = 5;
    world.combo = 3;
    world.bestCombo = 4;
    world.strikes = 1;
    world.tickets = [
      ticket(world, 'ember-classic', 38, 55),
      ticket(world, 'sage-melt', 22, 55),
      ticket(world, 'crunch-ring', 14, 55),
      ticket(world, 'garden-stack', 47, 55),
    ];
    // A dish mid-assembly on the counter: bun, grilled patty, lettuce —
    // one tomato short of an Ember Classic.
    world.assembly.plate = ['bun', 'grilledPatty', 'choppedLettuce'];
    world.chef.hands = 'choppedTomato';
    world.chef.x = 500;
    world.chef.y = 590;
    world.chef.facing = 1;
    // Grill: one patty nearly done, one fresh on. Fryer: rings ready.
    world.grill.slots = [
      { input: 'patty', result: 'grilledPatty', progress: 5.2, done: false, burnt: false },
      { input: 'patty', result: 'grilledPatty', progress: 1.4, done: false, burnt: false },
    ];
    world.fryer.slot = { input: 'onion', result: 'onionRings', progress: 5, done: true, burnt: false };
    world.board.job = { input: 'lettuce', result: 'choppedLettuce', progress: 1.2, done: false };
    world.banner = { text: 'Ticket #2 is nearly out of time — serve it first!', life: 99 };
    return SCREEN_PLAY;
  }

  if (name === 'serve') {
    world.screen = SCREEN_PLAY;
    world.shiftLeft = 121;
    world.coins = 54;
    world.served = 3;
    world.combo = 2;
    world.bestCombo = 3;
    world.strikes = 0;
    world.tickets = [
      ticket(world, 'ember-classic', 31, 55),
      ticket(world, 'double-ember', 44, 55),
    ];
    // The chef carries a finished Ember Classic to the serve window.
    world.chef.hands = { plate: ['bun', 'grilledPatty', 'choppedLettuce', 'choppedTomato'] };
    world.chef.x = 1010;
    world.chef.y = 600;
    world.chef.facing = 1;
    world.grill.slots = [
      { input: 'patty', result: 'grilledPatty', progress: 6, done: true, burnt: false },
      null,
    ];
    world.fryer.slot = null;
    world.board.job = null;
    world.floats = [{ x: 1074, y: 640, text: '+$32 inc. tip!', color: '#5d9b4a', life: 1.2, max: 1.4 }];
    world.banner = { text: 'Ember Classic is ready — serve it at the window!', life: 99 };
    return SCREEN_PLAY;
  }

  if (name === 'end') {
    world.screen = SCREEN_OVER;
    world.shiftLeft = 0;
    world.coins = 148;
    world.served = 9;
    world.combo = 0;
    world.bestCombo = 5;
    world.strikes = 1;
    world.endStats = {
      reason: 'Shift complete — the dinner rush is over!',
      rank: 'A',
      served: 9,
      coins: 148,
      bestCombo: 5,
    };
    world.tickets = [];
    return SCREEN_OVER;
  }

  // start: the title screen over a kitchen with its first two tickets.
  world.screen = SCREEN_TITLE;
  world.shiftLeft = 180;
  world.coins = 0;
  world.served = 0;
  world.combo = 0;
  world.tickets = [
    ticket(world, 'ember-classic', 52, 55),
    ticket(world, 'sage-melt', 48, 55),
  ];
  world.chef.x = 300;
  world.chef.y = 420;
  world.chef.facing = 1;
  return SCREEN_TITLE;
}
