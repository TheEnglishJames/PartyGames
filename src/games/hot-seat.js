import { el, button, mount, passScreen, drinkNote } from '../lib/ui.js';
import { sfx } from '../lib/sound.js';
import { spicyDeck } from './card-game.js';
import content from '../content/hot-seat.js';

export default {
  id: 'hot-seat',
  title: 'Hot Seat',
  emoji: '🪑',
  color: '#ff7a59',
  rules: 'One player is in the hot seat and secretly picks which option fits them. Everyone else predicts: hold up 1 or 2 fingers. Then the truth comes out — and the hot seat explains.',
  start(stage, { players, settings }) {
    const deck = spicyDeck('hot-seat', content, settings);
    let turn = 0;

    function pick() {
      const name = players[turn % players.length];
      const options = deck.draw();
      passScreen(stage, name, () => {
        mount(stage,
          el('div', { class: 'center stack' },
            el('p', { class: 'muted' }, `${name}, you're in the hot seat. Which one is you?`),
            options.map((option, i) =>
              button(`${i + 1} · ${option}`, () => predict(name, options, i), 'primary'),
            ),
          ),
        );
      }, "I'm ready, nobody's looking");
    }

    function predict(name, options, answer) {
      mount(stage,
        el('div', { class: 'center stack' },
          el('p', { class: 'muted' }, `Show this to everyone except ${name}`),
          el('h2', {}, `Which one is ${name}?`),
          el('ol', { class: 'options' }, options.map((o, i) => el('li', {}, el('b', {}, i + 1), o))),
          el('p', { class: 'muted' }, 'On three, everyone holds up 1 or 2 fingers.'),
          button('Reveal', () => reveal(name, options, answer), 'primary'),
        ),
      );
    }

    function reveal(name, options, answer) {
      sfx.reveal();
      turn++;
      mount(stage,
        el('div', { class: 'center stack' },
          el('p', { class: 'muted' }, `${name} picked`),
          el('div', { class: 'card' }, el('span', { class: 'label' }, `Option ${answer + 1}`), options[answer]),
          el('p', { class: 'muted' }, `${name}: explain yourself!`),
          drinkNote(settings, 'Guessed wrong? Drink 1. Everyone wrong? The hot seat hands out 3.',
            'Everyone wrong? The hot seat is a mystery — one more question for them.'),
          button(`Next: ${players[turn % players.length]}`, pick, 'primary'),
        ),
      );
    }

    pick();
  },
};
