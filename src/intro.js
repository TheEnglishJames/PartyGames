import './intro.css';
import { el } from './lib/ui.js';

const CONFETTI = ['🎉', '🥂', '💍', '🍾', '🎊', '💃', '🕺', '🍻', '🔥', '🤡'];

// Sarcastic, over-the-top splash. Each step: text, CSS animation class, how long it stays.
const STEPS = [
  { text: 'Oh. You actually opened it.', cls: 'pop', ms: 1700 },
  { text: 'Another party. Truly groundbreaking.', cls: 'shake', ms: 1900 },
  { bar: true, ms: 4600 },
  { text: 'Fine. It works. Try not to embarrass yourselves.', cls: 'spin-in', ms: 2000 },
];

export function playIntro() {
  return new Promise((resolve) => {
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    let done = false;

    const stage = el('div', { class: 'intro-stage' });
    const emojis = Array.from({ length: 14 }, (_, i) =>
      el('span', {
        class: 'intro-float',
        style: {
          '--x': `${Math.round(Math.random() * 100)}%`,
          '--d': `${(5 + Math.random() * 6).toFixed(1)}s`,
          '--delay': `${(-Math.random() * 8).toFixed(1)}s`,
          '--s': `${(1.4 + Math.random() * 2).toFixed(1)}rem`,
        },
      }, CONFETTI[i % CONFETTI.length]));

    const skip = el('button', { class: 'intro-skip', type: 'button', onclick: () => finish() }, 'Skip (coward)');
    const root = el('div', { class: 'intro', onclick: () => finish() }, emojis, stage, skip);
    document.body.append(root);

    function finish() {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      root.classList.add('intro-out');
      setTimeout(() => { root.remove(); resolve(); }, 500);
    }

    function showText(step) {
      stage.replaceChildren(el('h1', { class: `intro-text ${step.cls}` }, step.text));
    }

    function showBar() {
      const pct = el('span', { class: 'intro-pct' }, '0%');
      const label = el('p', { class: 'intro-label' }, 'Loading fun…');
      const fill = el('div', { class: 'intro-fill' });
      stage.replaceChildren(el('div', { class: 'intro-load' },
        label, el('div', { class: 'intro-bar' }, fill), pct));
      const set = (n, text, ms = 700) => {
        fill.style.transitionDuration = `${ms}ms`;
        fill.style.width = `${n}%`;
        pct.textContent = `${n}%`;
        if (text) label.textContent = text;
      };
      later(() => set(42, 'Searching for your friends…'), 100);
      later(() => set(42, 'Found 0. Concerning.', 10), 1300);
      later(() => { set(99, 'Almost there… (lie)', 900); label.classList.add('wobble'); }, 2200);
      later(() => { label.classList.remove('wobble'); set(99, 'Stuck at 99%. Just like your diet.', 10); pct.classList.add('shake'); }, 3300);
      later(() => set(100, 'Done. Somehow.', 300), 4200);
    }

    let t = 300;
    STEPS.forEach((step) => {
      later(() => (step.bar ? showBar() : showText(step)), t);
      t += step.ms;
    });
    later(() => {
      stage.replaceChildren(el('div', { class: 'intro-logo' },
        el('span', { class: 'intro-ring' }, '💍'),
        el('h1', {}, 'A&S Wedding', el('br'), 'Games')));
      navigator.vibrate?.([30, 40, 60]);
    }, t);
    later(finish, t + 1700);
  });
}
