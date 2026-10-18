import { el, button, mount, drinkNote, keepAwake } from '../lib/ui.js';
import { sessionDeck } from '../lib/deck.js';
import { sfx, vibrate } from '../lib/sound.js';
import categories from '../content/hot-potato.js';

const MIN_MS = 15_000;
const MAX_MS = 60_000;

export default {
  id: 'hot-potato',
  title: 'Hot Potato',
  emoji: '💣',
  color: '#ff7a1a',
  rules: 'Name one thing in the category, then pass the phone to the left. The bomb goes off at a random moment — whoever holds it loses.',
  start(stage, { settings }) {
    const deck = sessionDeck('hot-potato', categories);
    let timer = null;
    let release = () => {};

    function stop() {
      clearTimeout(timer);
      timer = null;
      release();
    }

    function ready() {
      mount(stage,
        el('div', { class: 'center stack' },
          el('div', { class: 'big-emoji' }, '💣'),
          el('p', { class: 'rules' }, 'The category appears when you hit go. Say your answer, pass it on. No repeats!'),
          button('Light the fuse', go, 'primary'),
        ),
      );
    }

    async function go() {
      const duration = MIN_MS + Math.random() * (MAX_MS - MIN_MS);
      const startedAt = performance.now();
      mount(stage,
        el('div', { class: 'center stack' },
          el('div', { class: 'card pulse' }, el('span', { class: 'label' }, 'Name one…'), deck.draw()),
          el('p', { class: 'muted' }, 'Answer & pass!'),
        ),
      );

      // Ticks speed up from ~0.7s to ~0.12s as the hidden deadline approaches.
      const tick = () => {
        const progress = (performance.now() - startedAt) / duration;
        if (progress >= 1) return boom();
        sfx.tick();
        timer = setTimeout(tick, 700 - 580 * progress);
      };
      tick();
      release = await keepAwake();
      if (!timer) release(); // left the game before the wake lock arrived
    }

    function boom() {
      stop();
      sfx.boom();
      vibrate([400, 100, 400]);
      mount(stage,
        el('div', { class: 'center stack boom', style: { margin: '-20px', padding: '20px' } },
          el('div', { class: 'big-emoji' }, '💥'),
          el('h2', { class: 'huge' }, 'BOOM!'),
          drinkNote(settings, 'Whoever is holding the phone drinks 2.', 'Whoever is holding the phone loses!'),
          button('Next round', go, 'primary'),
        ),
      );
    }

    ready();
    return stop;
  },
};
