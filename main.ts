// Sizzle & Sage: Rush Hour Kitchen — hand-in program.
//
// The game itself is plain static files under game/ (game/index.html plus its
// ES modules, no libraries, no network requests at all), so any static server
// can serve it. This program's only job is to hand those files in: it copies
// game/ and screenshots/ from beside this file into the output directory and
// writes /output/dossier.json, the summary the judge reads, using the
// vendored make.fun library. It runs on Node 22 with the standard library
// only — nothing is installed before it runs.
//
// Serve the game locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps, as the kit documents them: the dossier text is capped,
// and the other caps refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; game/ over 993 files or 48 MiB in all, or
// any path under game/ over 1000 bytes — game/ shares /output's own
// 1000-entry cap with screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
