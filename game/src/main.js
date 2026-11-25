// Sizzle & Sage: Rush Hour Kitchen — entry point.
//
// One canvas, one requestAnimationFrame loop: read input, step the world,
// draw it. The canvas is scaled to the window while the game itself always
// thinks in its 1280 x 800 logical view. A ?shot=start|rush|serve|end query
// stages a real played state for screenshots instead of starting a shift;
// ?seed=<n> picks the order deck (default 1).

import { VIEW } from './config.js';
import { createInput } from './input.js';
import { createWorld, interact, clickStation, startShift, stepWorld, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './world.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { ensureAudio, isMuted, sfx, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? 1) || 1;
const shot = params.get('shot');

const world = createWorld(seed);
const input = createInput(canvas);
let lastStatus = '';
let lastTime = performance.now();

if (shot !== null) {
  world.screen = stageShot(shot, world);
} else {
  world.screen = SCREEN_TITLE;
}

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.width = Math.round(VIEW.width * scale * window.devicePixelRatio);
  canvas.height = Math.round(VIEW.height * scale * window.devicePixelRatio);
  canvas.style.width = `${Math.round(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.round(VIEW.height * scale)}px`;
  ctx.setTransform(canvas.width / VIEW.width, 0, 0, canvas.height / VIEW.height, 0, 0);
}

window.addEventListener('resize', fitCanvas);
fitCanvas();

function announce(text) {
  if (text === lastStatus) return;
  lastStatus = text;
  statusLine.textContent = text;
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  const click = input.takeClick();
  if (click !== null) {
    ensureAudio();
    if (world.screen === SCREEN_TITLE) {
      startShift(world);
      sfx.click();
    } else if (world.screen === SCREEN_OVER) {
      startShift(world);
      sfx.click();
    } else if (world.screen === SCREEN_PLAY) {
      // Clicks arrive in canvas (device) pixels; convert to logical coordinates.
      const logicalX = click.x * (VIEW.width / canvas.width);
      const logicalY = click.y * (VIEW.height / canvas.height);
      if (!clickStation(world, logicalX, logicalY)) {
        world.chef.moveTarget = { x: logicalX, y: logicalY };
        world.chef.moveStation = null;
      }
    }
  }

  if (input.wasPressed('enter', ' ')) {
    ensureAudio();
    if (world.screen === SCREEN_TITLE || world.screen === SCREEN_OVER) {
      startShift(world);
      sfx.click();
    }
  }
  if (input.wasPressed('r') && (world.screen === SCREEN_OVER || world.screen === SCREEN_PLAY)) {
    startShift(world);
    sfx.click();
  }
  if (input.wasPressed('p') && (world.screen === SCREEN_PLAY || world.screen === SCREEN_PAUSED)) {
    world.screen = world.screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
    sfx.click();
  }
  if (input.wasPressed('m')) {
    toggleMute();
  }
  if (input.wasPressed('e') && world.screen === SCREEN_PLAY) {
    ensureAudio();
    const line = interact(world);
    world.banner = { text: line, life: 1.6 };
  }

  stepWorld(world, dt, input);
  render(ctx, world);

  const status = world.screen === SCREEN_PLAY
    ? `Shift ${Math.ceil(world.shiftLeft)} seconds left, $${world.coins}, ${world.served} served, ${world.tickets.length} orders waiting.`
    : world.screen === SCREEN_OVER
      ? `Shift over. ${world.endStats?.served ?? 0} dishes served, $${world.coins} earned.`
      : 'Sizzle and Sage, Rush Hour Kitchen. Press Enter to start your shift.';
  announce(status);

  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
