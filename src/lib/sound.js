// All sounds are synthesized with Web Audio: no asset files, works offline.
let ctx;
let enabled = true;

export function setSoundEnabled(on) {
  enabled = on;
}

// Browsers only allow audio after a user gesture; call this from a tap handler.
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function tone(freq, duration, { type = 'sine', gain = 0.2, slideTo, delay = 0 } = {}) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration);
}

function noise(duration, gain = 0.6) {
  if (!enabled || !ctx) return;
  const len = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(ctx.destination);
  src.start();
}

export const sfx = {
  tap: () => tone(660, 0.06, { type: 'triangle', gain: 0.12 }),
  tick: () => tone(1200, 0.04, { type: 'square', gain: 0.08 }),
  correct: () => {
    tone(660, 0.12, { type: 'triangle' });
    tone(990, 0.18, { type: 'triangle', delay: 0.1 });
  },
  skip: () => tone(300, 0.2, { type: 'sawtooth', gain: 0.1, slideTo: 150 }),
  reveal: () => tone(220, 0.5, { type: 'sawtooth', gain: 0.12, slideTo: 880 }),
  boom: () => {
    noise(1.2);
    tone(120, 0.8, { type: 'sine', gain: 0.5, slideTo: 30 });
  },
  end: () => {
    tone(523, 0.15, { type: 'square', gain: 0.1 });
    tone(392, 0.15, { type: 'square', gain: 0.1, delay: 0.15 });
    tone(262, 0.4, { type: 'square', gain: 0.1, delay: 0.3 });
  },
};

// iPhones ignore this; Android buzzes.
export function vibrate(pattern) {
  if (enabled && navigator.vibrate) navigator.vibrate(pattern);
}
