import { el, button, mount, drinkNote } from '../lib/ui.js';
import { nextPlayer } from '../lib/players.js';
import { spicyDeck } from './card-game.js';
import content from '../content/truth-or-dare.js';

export default {
  id: 'truth-or-dare',
  title: 'Truth or Dare',
  emoji: '😈',
  color: '#ff3d8b',
  rules: 'The phone picks a victim. They choose truth or dare — and have to go through with it.',
  start(stage, { players, settings }) {
    const decks = {
      truth: spicyDeck('truth', content.truth, settings),
      dare: spicyDeck('dare', content.dare, settings),
    };
    let current = null;

    function choose() {
      current = nextPlayer(players.length, current);
      mount(stage,
        el('div', { class: 'center stack' },
          el('h2', { class: 'huge' }, players[current]),
          el('p', { class: 'muted' }, 'Truth or dare?'),
          el('div', { class: 'btn-row' },
            button('Truth', () => reveal('truth'), 'primary'),
            button('Dare', () => reveal('dare'), 'primary'),
          ),
        ),
      );
    }

    function reveal(kind) {
      mount(stage,
        el('div', { class: 'center stack' },
          el('div', { class: 'card' },
            el('span', { class: 'label' }, `${players[current]} · ${kind}`),
            decks[kind].draw(),
          ),
          drinkNote(settings, 'Chicken out? Drink 3.', 'Chicken out? The group picks a forfeit.'),
          button('Next player', choose, 'primary'),
        ),
      );
    }

    choose();
  },
};
