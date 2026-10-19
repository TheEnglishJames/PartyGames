import { el, button, mount, drinkNote } from '../lib/ui.js';
import { sessionDeck } from '../lib/deck.js';
import { sfx, vibrate } from '../lib/sound.js';
import topics from '../content/five-seconds.js';

const SECONDS = 5;

export default {
  id: 'five-seconds',
  title: '5 Second Rule',
  emoji: '⏱️',
  color: '#ff7a1a',
  rules: 'Read the topic out loud, then start the clock. The player has 5 seconds to name three things. Sounds easy. It isn\'t.',
  start(stage, { players, settings }) {
    const deck = sessionDeck('five-seconds', topics);
    let turn = 0;
    let timer = null;

    function ready() {
      const topic = deck.draw();
      mount(stage,
        el('div', { class: 'center stack' },
          el('h2', { class: 'huge' }, players[turn % players.length]),
          el('div', { class: 'card' }, el('span', { class: 'label' }, 'Name 3…'), topic),
          button('Start the clock', run, 'primary'),
        ),
      );
    }

    function run() {
      let left = SECONDS;
      const count = el('div', { class: 'countdown' }, left);
      stage.querySelector('.btn')?.replaceWith(count);
      sfx.tick();
      timer = setInterval(() => {
        left--;
        if (left > 0) {
          count.textContent = left;
          sfx.tick();
          return;
        }
        clearInterval(timer);
        timer = null;
        sfx.end();
        vibrate(300);
        turn++;
        count.replaceWith(
          el('h2', { class: 'huge' }, "TIME'S UP!"),
          drinkNote(settings, "Didn't get all 3? Drink 2.", "Didn't get all 3? You lose this round."),
          button(`Next: ${players[turn % players.length]}`, ready, 'primary'),
        );
      }, 1000);
    }

    ready();
    return () => clearInterval(timer);
  },
};
