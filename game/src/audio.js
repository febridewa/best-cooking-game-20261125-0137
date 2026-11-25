// Synthesised sound effects: every sound is built with WebAudio, so the
// game ships no audio files and plays fully offline. Sounds start only
// after the player's first key or click, as browsers require.

let audioCtx = null;
let muted = false;
let sizzleNodes = null;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopSizzle();
  return muted;
}

/** Create the audio context on first user gesture; safe to call any time. */
export function ensureAudio() {
  if (audioCtx !== null) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return;
  }
  try {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return;
    audioCtx = new Ctor();
  } catch {
    audioCtx = null;
  }
}

function tone(freq, seconds, type, gainValue, when = 0) {
  if (audioCtx === null || muted) return;
  const start = audioCtx.currentTime + when;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

function noiseBurst(seconds, gainValue, filterFreq) {
  if (audioCtx === null || muted) return;
  const start = audioCtx.currentTime;
  const length = Math.max(1, Math.floor(audioCtx.sampleRate * seconds));
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = audioCtx.createGain();
  gain.gain.value = gainValue;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  source.start(start);
}

export const sfx = {
  pickup() { tone(520, 0.08, 'sine', 0.12); tone(780, 0.07, 'sine', 0.08, 0.05); },
  place() { tone(340, 0.09, 'triangle', 0.14); },
  chop() { noiseBurst(0.07, 0.22, 900); tone(180, 0.06, 'square', 0.05); },
  chopDone() { tone(660, 0.09, 'sine', 0.12); tone(880, 0.12, 'sine', 0.1, 0.07); },
  grillDone() { tone(740, 0.1, 'sine', 0.12); tone(988, 0.14, 'sine', 0.1, 0.08); },
  burn() { tone(140, 0.35, 'sawtooth', 0.14); tone(98, 0.4, 'sawtooth', 0.1, 0.1); },
  serve() { tone(880, 0.1, 'sine', 0.14); tone(1174, 0.12, 'sine', 0.14, 0.08); tone(1568, 0.22, 'sine', 0.12, 0.16); },
  wrong() { tone(220, 0.18, 'square', 0.1); tone(174, 0.24, 'square', 0.09, 0.12); },
  tick() { tone(980, 0.05, 'sine', 0.07); },
  newOrder() { tone(587, 0.09, 'triangle', 0.1); tone(740, 0.1, 'triangle', 0.09, 0.07); },
  rush() { tone(440, 0.12, 'sawtooth', 0.09); tone(554, 0.12, 'sawtooth', 0.09, 0.1); tone(659, 0.2, 'sawtooth', 0.09, 0.2); },
  click() { tone(700, 0.05, 'sine', 0.08); },
  gameOver() { tone(392, 0.16, 'triangle', 0.12); tone(330, 0.16, 'triangle', 0.12, 0.14); tone(262, 0.34, 'triangle', 0.12, 0.28); },
};

/** A soft looping hiss while anything is on the grill or fryer. */
export function startSizzle() {
  if (audioCtx === null || muted || sizzleNodes !== null) return;
  const length = audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 5200;
  filter.Q.value = 0.6;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.035;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
  sizzleNodes = { source, gain };
}

export function stopSizzle() {
  if (sizzleNodes === null) return;
  try { sizzleNodes.source.stop(); } catch { /* already stopped */ }
  sizzleNodes = null;
}
