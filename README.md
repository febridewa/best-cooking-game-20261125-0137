# Sizzle & Sage — Rush Hour Kitchen

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/febridewa/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/febridewa/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete original cooking game, built for the [make.fun Best Cooking Game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137). Referral: `6etrfz79`.

## The game

You are the only chef on shift at **Sizzle & Sage**. Tickets land on the
order board with a countdown timer; your job is to run the kitchen and serve
every dish before its timer runs out. Three customers walking out ends the
shift early — and the last minute is the dinner rush, when tickets arrive
faster and run shorter.

**How a dish is made**

1. Grab raw ingredients from the pantry (left wall).
2. Prep them: chop tomato, lettuce and onion on the board, grill patties on
   the grill, fry onion rings in the fryer. Leave anything on the heat too
   long and it burns.
3. Stack the dish on the assembly counter — bun first, then the rest, in any
   order. When the plate matches a ticket it glows green: **READY!**
4. Pick the plate up and serve it at the window. Fast serves earn tips;
   combos multiply the payout.

Six recipes share six preps, so the skill is in the route: chop what the
next two tickets share, keep a patty on the grill while you fetch the next
ticket's lettuce, and never let a ticket hit its last ten seconds.

## Controls

- **WASD / arrow keys** — walk the chef
- **E / Space** — use the station in front of you (pick up, chop, grill,
  fry, add to the plate, serve, bin)
- **Click a station** — walk there and use it on arrival; click the floor to
  walk there
- **P** — pause · **M** — mute · **R** — restart · **Enter** — start

## Play it

No build step, no network: the game is plain static files under `game/`.

```sh
node serve.ts
# open http://localhost:8080
```

Screenshots are staged with `?shot=start|rush|serve|end` (see `shots.json`);
each one is a real frame of the game's own code in a real played state.

## Structure

- `game/index.html` — canvas page, no external requests
- `game/src/config.js` — layout, tuning, palette, seeded RNG
- `game/src/recipes.js` — ingredients, preps and the six recipes
- `game/src/world.js` — chef, stations, tickets, shift rules
- `game/src/render.js` — the whole kitchen, drawn in flat 2D vector art
- `game/src/input.js` — keyboard + mouse
- `game/src/audio.js` — synthesised WebAudio sound effects (no audio files)
- `game/src/shots.js` — staged screenshot scenes
- `game/src/main.js` — game loop and wiring
- `main.ts` — hands `game/` + `screenshots/` in and writes `dossier.json`

MIT licensed. Original art, sounds, music (none — all SFX are synthesised)
and names; no existing commercial game is copied.
