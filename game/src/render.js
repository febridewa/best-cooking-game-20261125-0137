// Drawing: the whole kitchen, flat 2D cartoon style, on one canvas.
// Every food item is drawn from vector shapes, so the game ships no image
// files. The order board, the tickets' countdown bars, the stations' progress
// rings and the plate mid-assembly are all drawn from the live world state,
// so a screenshot is always a true frame of the game.

import { BOARD, CHEF, COLORS, FLOOR, HUD, PREP, SHIFT, VIEW } from './config.js';
import { INGREDIENTS, RECIPES, recipeForPlate, shortName } from './recipes.js';
import { STATIONS, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, holdingPlate, nearestStation } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** One ingredient icon, drawn at (cx, cy) inside a `size` box. */
export function drawIngredient(ctx, id, cx, cy, size) {
  const s = size / 2;
  const ing = INGREDIENTS[id] ?? INGREDIENTS.burnt;
  ctx.save();
  ctx.translate(cx, cy);
  if (id === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, s * 0.25, s * 0.85, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-s * 0.85, s * 0.2, s * 1.7, s * 0.28);
    ctx.fillStyle = '#fff3d6';
    circle(ctx, -s * 0.35, -s * 0.35, s * 0.09);
    circle(ctx, s * 0.3, -s * 0.45, s * 0.09);
    circle(ctx, s * 0.05, -s * 0.15, s * 0.09);
  } else if (id === 'patty' || id === 'grilledPatty') {
    ctx.fillStyle = ing.color;
    roundRect(ctx, -s * 0.9, -s * 0.4, s * 1.8, s * 0.8, s * 0.35);
    ctx.fill();
    ctx.fillStyle = ing.dark;
    circle(ctx, -s * 0.4, 0, s * 0.1);
    circle(ctx, s * 0.25, -s * 0.12, s * 0.1);
    circle(ctx, s * 0.45, s * 0.15, s * 0.08);
    if (id === 'grilledPatty') {
      ctx.strokeStyle = '#3a2415';
      ctx.lineWidth = s * 0.12;
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, -s * 0.3);
      ctx.lineTo(s * 0.5, s * 0.3);
      ctx.moveTo(s * 0.5, -s * 0.3);
      ctx.lineTo(-s * 0.5, s * 0.3);
      ctx.stroke();
    }
  } else if (id === 'tomato' || id === 'choppedTomato') {
    ctx.fillStyle = ing.color;
    circle(ctx, 0, 0, s * 0.85);
    ctx.fill();
    ctx.fillStyle = '#f28a7a';
    circle(ctx, 0, 0, s * 0.55);
    ctx.fill();
    ctx.fillStyle = '#ffd9d0';
    circle(ctx, -s * 0.2, -s * 0.15, s * 0.14);
    circle(ctx, s * 0.25, s * 0.2, s * 0.14);
    ctx.fillStyle = COLORS.green;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.85);
    ctx.lineTo(-s * 0.3, -s * 0.55);
    ctx.lineTo(s * 0.3, -s * 0.55);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'lettuce' || id === 'choppedLettuce') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2;
      const x = Math.cos(a) * s * 0.7;
      const y = Math.sin(a) * s * 0.7;
      circle(ctx, x, y, s * 0.42);
    }
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.5);
    ctx.lineTo(0, s * 0.5);
    ctx.stroke();
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.85, s * 0.6);
    ctx.lineTo(s * 0.85, s * 0.6);
    ctx.lineTo(0, -s * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    circle(ctx, -s * 0.25, s * 0.15, s * 0.13);
    circle(ctx, s * 0.3, s * 0.3, s * 0.11);
  } else if (id === 'onion' || id === 'choppedOnion') {
    ctx.fillStyle = ing.color;
    circle(ctx, 0, 0, s * 0.8);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = s * 0.1;
    circle(ctx, 0, 0, s * 0.5);
    ctx.stroke();
    circle(ctx, 0, 0, s * 0.22);
    ctx.stroke();
  } else if (id === 'onionRings') {
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = s * 0.3;
    circle(ctx, -s * 0.25, s * 0.1, s * 0.42);
    ctx.stroke();
    circle(ctx, s * 0.35, -s * 0.15, s * 0.42);
    ctx.stroke();
  } else {
    ctx.fillStyle = ing.color;
    roundRect(ctx, -s * 0.8, -s * 0.5, s * 1.6, s, s * 0.3);
    ctx.fill();
    ctx.strokeStyle = '#8a7a70';
    ctx.lineWidth = s * 0.08;
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.3);
    ctx.lineTo(s * 0.4, s * 0.35);
    ctx.stroke();
  }
  ctx.restore();
}

function drawProgressRing(ctx, x, y, r, frac, color) {
  ctx.save();
  ctx.strokeStyle = 'rgba(43,33,24,0.25)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawTicket(ctx, ticket, x, y, w, h) {
  const urgent = ticket.timeLeft <= 12;
  const frac = Math.max(0, ticket.timeLeft / ticket.total);
  ctx.save();
  if (ticket.fresh > 0) ctx.globalAlpha = 0.55 + 0.45 * Math.sin(ticket.fresh * 14);
  ctx.fillStyle = urgent && Math.floor(ticket.timeLeft * 2) % 2 === 0 ? '#ffe3d6' : COLORS.ticket;
  ctx.strokeStyle = urgent ? COLORS.red : COLORS.ticketEdge;
  ctx.lineWidth = urgent ? 3 : 2;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`#${ticket.id} ${ticket.recipe.name}`, x + 10, y + 24);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#7a5c38';
  ctx.fillText(`$${ticket.recipe.price}  ·  ${ticket.recipe.blurb}`, x + 10, y + 42);
  // Ingredient chips, in recipe order.
  let ix = x + 12;
  for (const item of ticket.recipe.needs) {
    ctx.fillStyle = '#f3e3bd';
    roundRect(ctx, ix - 2, y + 50, 30, 30, 7);
    ctx.fill();
    drawIngredient(ctx, item, ix + 13, y + 65, 24);
    ix += 34;
  }
  // Countdown bar.
  ctx.fillStyle = '#e5d3a8';
  roundRect(ctx, x + 10, y + h - 16, w - 20, 8, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? COLORS.green : frac > 0.25 ? COLORS.orange : COLORS.red;
  roundRect(ctx, x + 10, y + h - 16, (w - 20) * frac, 8, 4);
  ctx.fill();
  ctx.fillStyle = urgent ? COLORS.red : '#7a5c38';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.ceil(ticket.timeLeft)}s`, x + w - 10, y + h - 22);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawHud(ctx, world) {
  ctx.fillStyle = COLORS.board;
  ctx.fillRect(0, 0, VIEW.width, HUD.height);
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('SIZZLE & SAGE', 16, 32);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#d9b96a';
  ctx.fillText('RUSH HOUR KITCHEN', 250, 34);

  // Shift timer.
  const shiftFrac = world.shiftLeft / SHIFT.lengthSeconds;
  const mins = Math.floor(world.shiftLeft / 60);
  const secs = Math.floor(world.shiftLeft % 60);
  ctx.fillStyle = '#4a3624';
  roundRect(ctx, 470, 16, 300, 30, 8);
  ctx.fill();
  ctx.fillStyle = shiftFrac > 0.33 ? COLORS.sage : COLORS.red;
  roundRect(ctx, 470, 16, 300 * shiftFrac, 30, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SHIFT ${mins}:${String(secs).padStart(2, '0')}`, 620, 32);

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.yellow;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(`$${world.coins}`, 900, 32);
  ctx.fillStyle = COLORS.cream;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`Served ${world.served}  ·  Combo x${world.combo}`, 900, 52);
  ctx.fillStyle = COLORS.red;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  let hx = 940;
  for (let i = 0; i < SHIFT.strikesToClose; i += 1) {
    ctx.fillText(i < world.strikes ? '✕' : '♥', hx, 32);
    hx += 26;
  }
  ctx.fillStyle = '#d9b96a';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(world.shiftLeft <= SHIFT.rushAtSecondsLeft && world.screen === SCREEN_PLAY ? 'DINNER RUSH!' : 'Orders', 940, 52);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawBoard(ctx, world) {
  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, BOARD.y - 8, VIEW.width, BOARD.ticketHeight + 24);
  ctx.fillStyle = '#d9b96a';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('— ORDER BOARD —', BOARD.x, BOARD.y - 12 + 8);
  if (world.tickets.length === 0) {
    ctx.fillStyle = '#8a7a5e';
    ctx.font = 'italic 16px system-ui, sans-serif';
    ctx.fillText('No orders yet — the first ticket is coming…', BOARD.x, BOARD.y + 60);
    return;
  }
  world.tickets.forEach((ticket, index) => {
    drawTicket(ctx, ticket, BOARD.x + index * (BOARD.ticketWidth + BOARD.gap), BOARD.y, BOARD.ticketWidth, BOARD.ticketHeight);
  });
}

function drawFloor(ctx) {
  for (let y = 0; y < 10; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(FLOOR.left + x * 79, FLOOR.top + y * 60, 79, 60);
    }
  }
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= 16; x += 1) {
    ctx.beginPath();
    ctx.moveTo(FLOOR.left + x * 79, FLOOR.top);
    ctx.lineTo(FLOOR.left + x * 79, FLOOR.bottom);
    ctx.stroke();
  }
  for (let y = 0; y <= 10; y += 1) {
    ctx.beginPath();
    ctx.moveTo(FLOOR.left, FLOOR.top + y * 60);
    ctx.lineTo(FLOOR.right, FLOOR.top + y * 60);
    ctx.stroke();
  }
}

function drawStationLabel(ctx, station, highlight) {
  ctx.fillStyle = highlight ? COLORS.ember : '#7a5c38';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(station.label.toUpperCase(), station.x + station.w / 2, station.y + station.h + 18);
  ctx.textAlign = 'left';
}

function drawPantry(ctx, world, near) {
  for (const bin of STATIONS.pantry) {
    const isNear = near === bin;
    ctx.fillStyle = isNear ? '#a8763e' : COLORS.counterTop;
    ctx.strokeStyle = isNear ? COLORS.yellow : COLORS.counterSide;
    ctx.lineWidth = isNear ? 3 : 2;
    roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 8);
    ctx.fill();
    ctx.stroke();
    drawIngredient(ctx, bin.ingredient, bin.x + 30, bin.y + bin.h / 2, 34);
    ctx.fillStyle = COLORS.cream;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(INGREDIENTS[bin.ingredient].name, bin.x + 52, bin.y + 30);
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = '#e8cfa0';
    const need = INGREDIENTS[bin.ingredient].needs;
    ctx.fillText(need === 'none' ? 'ready to use' : `needs: ${need}`, bin.x + 52, bin.y + 44);
    if (isNear) drawStationLabel(ctx, bin, true);
  }
}

function drawPrepStations(ctx, world, near) {
  const board = STATIONS.board;
  const isNearBoard = near === board;
  ctx.fillStyle = '#f3e3bd';
  ctx.strokeStyle = isNearBoard ? COLORS.yellow : '#c9a86a';
  ctx.lineWidth = isNearBoard ? 3 : 2;
  roundRect(ctx, board.x, board.y, board.w, board.h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(board.x + 12, board.y + i * 20);
    ctx.lineTo(board.x + board.w - 12, board.y + i * 20);
    ctx.stroke();
  }
  const job = world.board.job;
  if (job !== null) {
    drawIngredient(ctx, job.input, board.x + board.w / 2, board.y + 40, 44);
    if (job.done) {
      ctx.fillStyle = COLORS.green;
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('READY — press E', board.x + board.w / 2, board.y + 82);
      ctx.textAlign = 'left';
    } else {
      drawProgressRing(ctx, board.x + board.w / 2, board.y + 40, 26, job.progress / PREP.chopSeconds, COLORS.orange);
    }
  } else {
    ctx.fillStyle = '#8a7a5e';
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Chop here', board.x + board.w / 2, board.y + 50);
    ctx.textAlign = 'left';
  }
  drawStationLabel(ctx, board, isNearBoard);

  const grill = STATIONS.grill;
  const isNearGrill = near === grill;
  ctx.fillStyle = COLORS.steelDark;
  ctx.strokeStyle = isNearGrill ? COLORS.yellow : '#4a545a';
  ctx.lineWidth = isNearGrill ? 3 : 2;
  roundRect(ctx, grill.x, grill.y, grill.w, grill.h, 10);
  ctx.fill();
  ctx.stroke();
  world.grill.slots.forEach((slot, i) => {
    const cx = grill.x + 65 + i * 130;
    const cy = grill.y + 46;
    ctx.fillStyle = '#3a3f44';
    roundRect(ctx, cx - 52, cy - 30, 104, 60, 8);
    ctx.fill();
    ctx.strokeStyle = '#5a636a';
    ctx.lineWidth = 2;
    for (let g = -2; g <= 2; g += 1) {
      ctx.beginPath();
      ctx.moveTo(cx - 44, cy + g * 11);
      ctx.lineTo(cx + 44, cy + g * 11);
      ctx.stroke();
    }
    if (slot !== null) {
      drawIngredient(ctx, slot.burnt ? 'burnt' : slot.input, cx, cy, 40);
      if (slot.burnt) {
        ctx.fillStyle = COLORS.red;
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BURNT!', cx, cy - 38);
        ctx.textAlign = 'left';
      } else if (slot.done) {
        ctx.fillStyle = COLORS.green;
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('READY!', cx, cy - 38);
        ctx.textAlign = 'left';
      } else {
        drawProgressRing(ctx, cx, cy, 26, slot.progress / PREP.grillSeconds, COLORS.ember);
      }
    }
  });
  drawStationLabel(ctx, grill, isNearGrill);

  const fryer = STATIONS.fryer;
  const isNearFryer = near === fryer;
  ctx.fillStyle = COLORS.steel;
  ctx.strokeStyle = isNearFryer ? COLORS.yellow : COLORS.steelDark;
  ctx.lineWidth = isNearFryer ? 3 : 2;
  roundRect(ctx, fryer.x, fryer.y, fryer.w, fryer.h, 10);
  ctx.fill();
  ctx.stroke();
  const slot = world.fryer.slot;
  ctx.fillStyle = '#c98f2e';
  roundRect(ctx, fryer.x + 22, fryer.y + 18, fryer.w - 44, 56, 8);
  ctx.fill();
  if (slot !== null) {
    drawIngredient(ctx, slot.burnt ? 'burnt' : slot.input, fryer.x + fryer.w / 2, fryer.y + 46, 40);
    if (slot.burnt) {
      ctx.fillStyle = COLORS.red;
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BURNT!', fryer.x + fryer.w / 2, fryer.y + 86);
      ctx.textAlign = 'left';
    } else if (slot.done) {
      ctx.fillStyle = COLORS.green;
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('READY!', fryer.x + fryer.w / 2, fryer.y + 86);
      ctx.textAlign = 'left';
    } else {
      drawProgressRing(ctx, fryer.x + fryer.w / 2, fryer.y + 46, 26, slot.progress / PREP.frySeconds, COLORS.orange);
    }
  } else {
    ctx.fillStyle = '#7a5c2e';
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Fry onions here', fryer.x + fryer.w / 2, fryer.y + 50);
    ctx.textAlign = 'left';
  }
  drawStationLabel(ctx, fryer, isNearFryer);
}

function drawBottomRow(ctx, world, near) {
  const bin = STATIONS.bin;
  const isNearBin = near === bin;
  ctx.fillStyle = '#5a636a';
  ctx.strokeStyle = isNearBin ? COLORS.yellow : '#3a3f44';
  ctx.lineWidth = isNearBin ? 3 : 2;
  roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2e3337';
  roundRect(ctx, bin.x + 18, bin.y + 14, bin.w - 36, bin.h - 28, 6);
  ctx.fill();
  ctx.fillStyle = '#cfd6da';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BIN', bin.x + bin.w / 2, bin.y + bin.h / 2 + 5);
  ctx.textAlign = 'left';
  drawStationLabel(ctx, bin, isNearBin);

  const assembly = STATIONS.assembly;
  const isNearAssembly = near === assembly;
  ctx.fillStyle = isNearAssembly ? '#a8763e' : COLORS.counterTop;
  ctx.strokeStyle = isNearAssembly ? COLORS.yellow : COLORS.counterSide;
  ctx.lineWidth = isNearAssembly ? 3 : 2;
  roundRect(ctx, assembly.x, assembly.y, assembly.w, assembly.h, 10);
  ctx.fill();
  ctx.stroke();
  const plate = world.assembly.plate;
  if (plate.length === 0) {
    ctx.fillStyle = '#e8cfa0';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Build the dish here — press E to add what you carry', assembly.x + assembly.w / 2, assembly.y + 58);
    ctx.textAlign = 'left';
  } else {
    // The plate, mid-assembly: a white plate with the stacked ingredients.
    const px = assembly.x + 70;
    const py = assembly.y + 58;
    ctx.fillStyle = '#ffffff';
    circle(ctx, px, py, 46);
    ctx.fill();
    ctx.strokeStyle = '#d9d9d9';
    ctx.lineWidth = 2;
    circle(ctx, px, py, 46);
    ctx.stroke();
    plate.forEach((item, i) => {
      drawIngredient(ctx, item, px, py - 6 - i * 4, 52 - i * 2);
    });
    const recipe = recipeForPlate(plate);
    ctx.textAlign = 'left';
    if (recipe) {
      ctx.fillStyle = COLORS.green;
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.fillText(`✓ ${recipe.name} — READY!`, assembly.x + 140, assembly.y + 48);
      ctx.fillStyle = '#e8cfa0';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText('Press E to pick it up, then serve it →', assembly.x + 140, assembly.y + 72);
    } else {
      ctx.fillStyle = COLORS.cream;
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText('Building…', assembly.x + 140, assembly.y + 48);
      ctx.fillStyle = '#e8cfa0';
      ctx.font = '13px system-ui, sans-serif';
      plate.forEach((item, i) => {
        ctx.fillText(`• ${shortName(item)}`, assembly.x + 140, assembly.y + 70 + i * 16);
      });
    }
  }
  drawStationLabel(ctx, assembly, isNearAssembly);

  const serve = STATIONS.serve;
  const isNearServe = near === serve;
  const readyPlate = holdingPlate(world) && recipeForPlate(world.chef.hands.plate) !== null;
  ctx.fillStyle = readyPlate ? '#2f7d32' : '#7a4a2e';
  ctx.strokeStyle = isNearServe ? COLORS.yellow : '#4a2c17';
  ctx.lineWidth = isNearServe ? 3 : 2;
  roundRect(ctx, serve.x, serve.y, serve.w, serve.h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f3e3bd';
  roundRect(ctx, serve.x + 16, serve.y + 14, serve.w - 32, 44, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(readyPlate ? 'READY TO SERVE — press E!' : '— SERVE WINDOW —', serve.x + serve.w / 2, serve.y + 43);
  ctx.fillStyle = '#e8cfa0';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Serve the dish a ticket asks for, while its timer runs', serve.x + serve.w / 2, serve.y + 82);
  ctx.textAlign = 'left';
  drawStationLabel(ctx, serve, isNearServe);
}

function drawChef(ctx, world) {
  const chef = world.chef;
  const bob = chef.walking ? Math.sin(chef.bob) * 3 : Math.sin(world.time * 2) * 1.5;
  ctx.save();
  ctx.translate(chef.x, chef.y + bob * 0.4);
  // Shadow.
  ctx.fillStyle = 'rgba(43,33,24,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 26, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white apron, sage scarf.
  ctx.fillStyle = '#f5f0e6';
  roundRect(ctx, -20, -8, 40, 34, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.sage;
  ctx.fillRect(-20, 8, 40, 8);
  // Head + toque.
  ctx.fillStyle = '#f2c89b';
  circle(ctx, 0, -20, 15);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  circle(ctx, -11, -33, 9);
  circle(ctx, 0, -38, 11);
  circle(ctx, 11, -33, 9);
  ctx.fill();
  ctx.fillRect(-13, -34, 26, 8);
  // Eyes look where the chef faces.
  ctx.fillStyle = '#2b2118';
  circle(ctx, chef.facing * 4 - 4, -20, 2);
  circle(ctx, chef.facing * 4 + 5, -20, 2);
  // What the chef carries, held high.
  if (chef.hands !== null) {
    ctx.fillStyle = 'rgba(255,246,223,0.95)';
    circle(ctx, 0, -62, 20);
    ctx.fill();
    ctx.strokeStyle = COLORS.ticketEdge;
    ctx.lineWidth = 2;
    circle(ctx, 0, -62, 20);
    ctx.stroke();
    if (typeof chef.hands === 'object') {
      ctx.fillStyle = '#ffffff';
      circle(ctx, 0, -62, 14);
      ctx.fill();
      chef.hands.plate.forEach((item, i) => {
        drawIngredient(ctx, item, 0, -64 - i * 2, 26 - i);
      });
    } else {
      drawIngredient(ctx, chef.hands, 0, -62, 30);
    }
  }
  ctx.restore();
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    circle(ctx, p.x, p.y, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const f of world.floats) {
    ctx.globalAlpha = Math.max(0, f.life / f.max);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawPrompt(ctx, world, near) {
  if (world.screen !== SCREEN_PLAY) return;
  let text = 'WASD / arrows to walk  ·  E to use a station  ·  click a station to walk there';
  if (near !== null) {
    if (near.kind === 'pantry') text = `E — Pick up ${INGREDIENTS[near.ingredient].name}`;
    else if (near.kind === 'board') text = world.board.job === null ? 'E — Chop what you carry' : world.board.job.done ? 'E — Pick up the chopped food' : 'Chopping…';
    else if (near.kind === 'grill') text = 'E — Grill a patty / take it off';
    else if (near.kind === 'fryer') text = 'E — Fry an onion / take the rings off';
    else if (near.kind === 'assembly') text = 'E — Add to the plate / pick the plate up';
    else if (near.kind === 'serve') text = 'E — Serve the plate!';
    else if (near.kind === 'bin') text = 'E — Throw away what you carry';
  }
  ctx.fillStyle = 'rgba(43,33,24,0.85)';
  roundRect(ctx, 300, 596, 680, 34, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 640, 618);
  ctx.textAlign = 'left';
  if (world.banner !== null) {
    ctx.globalAlpha = Math.min(1, world.banner.life);
    ctx.fillStyle = COLORS.ember;
    roundRect(ctx, 340, 196, 600, 40, 10);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.banner.text, 640, 222);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(24,16,10,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = COLORS.ticket;
  roundRect(ctx, 290, 170, 700, 460, 16);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  roundRect(ctx, 290, 170, 700, 460, 16);
  ctx.stroke();
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 640, 240);
  ctx.font = '17px system-ui, sans-serif';
  let y = 290;
  for (const line of lines) {
    ctx.fillText(line, 640, y);
    y += 30;
  }
  ctx.textAlign = 'left';
}

function drawTitle(ctx, world) {
  overlay(ctx, 'SIZZLE & SAGE', [
    'Rush Hour Kitchen — the dinner rush is coming.',
    '',
    'Walk the kitchen with WASD or arrows (or click a station).',
    'Grab ingredients from the pantry, chop, grill and fry them,',
    'build each ticket on the assembly counter, and serve it',
    'at the window before its timer runs out.',
    'Three customers walking out ends the shift early.',
    '',
    'Press ENTER or click to start your shift!',
  ], COLORS.ember);
  ctx.fillStyle = '#7a5c38';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('P pause · M mute · E use station · R restart', 640, 600);
  ctx.textAlign = 'left';
}

function drawPaused(ctx) {
  overlay(ctx, 'PAUSED', ['Take a breath — the tickets wait for no one.', '', 'Press P to get back to the rush.'], COLORS.blue);
}

function drawOver(ctx, world) {
  const stats = world.endStats ?? { reason: 'Shift over!', rank: 'C', served: 0, coins: 0, bestCombo: 0 };
  overlay(ctx, `SHIFT OVER — RANK ${stats.rank}`, [
    stats.reason,
    '',
    `Dishes served: ${stats.served}      Coins earned: $${stats.coins}`,
    `Best combo: x${stats.bestCombo}`,
    '',
    stats.rank === 'S' ? 'A flawless service — the regulars are already back!' :
    stats.rank === 'A' ? 'A cracking shift — the kitchen sang tonight!' :
    stats.rank === 'B' ? 'Solid cooking — a steadier hand on the grill next time.' :
    'The rush got away from you — plan the route, prep ahead!',
    '',
    'Press R or ENTER to cook another shift.',
  ], COLORS.yellow);
}

/** Draw one frame of the world. */
export function render(ctx, world) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx);
  const near = world.screen === SCREEN_PLAY ? nearestStation(world) : null;
  drawBoard(ctx, world);
  drawPantry(ctx, world, near);
  drawPrepStations(ctx, world, near);
  drawBottomRow(ctx, world, near);
  drawChef(ctx, world);
  drawParticles(ctx, world);
  drawHud(ctx, world);
  drawPrompt(ctx, world, near);
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  else if (world.screen === SCREEN_PAUSED) drawPaused(ctx);
  else if (world.screen === SCREEN_OVER) drawOver(ctx, world);
}

export { RECIPES };
