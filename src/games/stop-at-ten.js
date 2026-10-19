import { el, button, mount, passScreen, drinkNote } from '../lib/ui.js';
import { sfx } from '../lib/sound.js';

const TARGET = 10;
const VISIBLE_FOR = 3; // seconds the clock is shown before it goes blind

// Closest to the target first.
export function rankByDistance(results, target = TARGET) {
  return [...results].sort((a, b) => Math.abs(a.time - target) - Math.abs(b.time - target));
}

const fmt = (s) => s.toFixed(2);

export default {
  id: 'stop-at-ten',
  title: 'Stop at 10',
  emoji: '🎯',
  color: '#ffb800',
  rules: 'Start the stopwatch and stop it at exactly 10.00 seconds. The clock goes blind after 3 seconds. Everyone gets one go.',
  start(stage, { players, settings }) {
    let frame = null;
    let results = [];

    function turn(i) {
      if (i === players.length) return showRanking();
      passScreen(stage, players[i], () => {
        const display = el('div', { class: 'stopwatch' }, fmt(0));
        let startedAt = null;
        const action = button('Start', () => {
          if (startedAt == null) {
            startedAt = performance.now();
            action.textContent = 'STOP';
            const loop = () => {
              const t = (performance.now() - startedAt) / 1000;
              display.textContent = t < VISIBLE_FOR ? fmt(t) : '🙈';
              frame = requestAnimationFrame(loop);
            };
            loop();
          } else {
            cancelAnimationFrame(frame);
            const time = (performance.now() - startedAt) / 1000;
            results.push({ name: players[i], time });
            const off = time - TARGET;
            display.textContent = fmt(time);
            action.replaceWith(
              el('p', { class: 'muted' }, `${off >= 0 ? '+' : ''}${fmt(off)} s`),
              button(i + 1 < players.length ? `Next: ${players[i + 1]}` : 'See results', () => turn(i + 1), 'primary'),
            );
          }
        }, 'primary');
        mount(stage, el('div', { class: 'center stack' }, el('h2', {}, players[i]), display, action));
      });
    }

    function showRanking() {
      sfx.reveal();
      const ranked = rankByDistance(results);
      const best = ranked[0];
      const worst = ranked[ranked.length - 1];
      mount(stage,
        el('div', { class: 'center stack' },
          el('h2', {}, 'Results'),
          el('ol', { class: 'result-list ranking' },
            ranked.map((r) => el('li', {}, el('span', {}, r.name), el('span', {}, fmt(r.time)))),
          ),
          drinkNote(settings, `${worst.name} drinks 2. ${best.name} hands out 2.`, `${best.name} wins! ${worst.name}… practise.`),
          button('Play again', () => { results = []; turn(0); }, 'primary'),
        ),
      );
    }

    turn(0);
    return () => cancelAnimationFrame(frame);
  },
};
