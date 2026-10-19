import { el, button, mount, passScreen, drinkNote } from '../lib/ui.js';
import { sfx } from '../lib/sound.js';
import { spicyDeck } from './card-game.js';
import content from '../content/paranoia.js';

export default {
  id: 'paranoia',
  title: 'Paranoia',
  emoji: '🤫',
  color: '#b18cff',
  rules: 'Read the question secretly and whisper it to the person on your left. They answer out loud — with a name only. Then a coin decides if the question gets revealed.',
  start(stage, { players, settings }) {
    const deck = spicyDeck('paranoia', content, settings);
    let turn = 0;

    function whisper() {
      const name = players[turn % players.length];
      const question = deck.draw();
      passScreen(stage, name, () => {
        mount(stage,
          el('div', { class: 'center stack' },
            el('div', { class: 'card' }, el('span', { class: 'label' }, 'Whisper this to your left'), question),
            el('p', { class: 'muted' }, 'They answer out loud with a name only.'),
            button('They answered — flip the coin', () => flip(question), 'primary'),
          ),
        );
      }, "Tap when nobody's looking");
    }

    function flip(question) {
      const heads = Math.random() < 0.5;
      const coin = el('div', { class: 'coin spinning' }, '🪙');
      mount(stage, el('div', { class: 'center stack' }, coin, el('p', { class: 'muted' }, 'Flipping…')));
      sfx.tick();
      setTimeout(() => {
        if (!coin.isConnected) return;
        sfx.reveal();
        turn++;
        mount(stage,
          el('div', { class: 'center stack' },
            heads
              ? [el('h2', {}, 'Heads! Here was the question:'), el('div', { class: 'card' }, question)]
              : [el('div', { class: 'big-emoji' }, '🤐'), el('h2', {}, 'Tails — it stays secret.'),
                drinkNote(settings, 'Dying to know? Drink 2 and the whisperer tells you.')],
            button(`Next: ${players[turn % players.length]}`, whisper, 'primary'),
          ),
        );
      }, 1200);
    }

    whisper();
  },
};
