import { el, button, mount } from '../lib/ui.js';
import { shuffle } from '../lib/deck.js';
import { sfx, vibrate } from '../lib/sound.js';

const SUITS = ['♠', '♥', '♦', '♣'];
const RULES = {
  A: ['Waterfall', 'Everyone starts drinking. You can only stop when the person to your right stops.'],
  2: ['You', 'Pick someone to drink.'],
  3: ['Me', 'You drink.'],
  4: ['Floor', 'Last person to touch the floor drinks.'],
  5: ['Guys', 'All guys drink.'],
  6: ['Chicks', 'All girls drink.'],
  7: ['Heaven', 'Last person to point to the sky drinks.'],
  8: ['Mate', 'Pick a mate. They drink every time you drink, for the rest of the game.'],
  9: ['Rhyme', 'Say a word. Go around rhyming with it. First to fail drinks.'],
  10: ['Categories', 'Pick a category. Go around naming things in it. First to fail drinks.'],
  J: ['Make a Rule', 'Invent a rule everyone has to follow. Anyone who breaks it drinks.'],
  Q: ['Question Master', 'Until the next Queen, anyone who answers your questions drinks.'],
  K: ["King's Cup", 'Pour some of your drink into the cup in the middle.'],
};
export const KINGS = 4;

export function buildDeck(rng = Math.random) {
  return shuffle(Object.keys(RULES).flatMap((rank) => SUITS.map((suit) => ({ rank, suit }))), rng);
}

export default {
  id: 'kings-cup',
  title: "King's Cup",
  emoji: '👑',
  color: '#ffb800',
  rules: 'Put an empty cup in the middle. Take turns drawing a card and follow its rule. Whoever draws the 4th King drinks the whole cup.',
  start(stage, { players }) {
    let deck;
    let kings;
    let turn = 0;

    function newGame() {
      deck = buildDeck();
      kings = 0;
      ready();
    }

    function ready() {
      mount(stage,
        el('div', { class: 'center stack' },
          el('p', { class: 'muted' }, `${deck.length} cards left · Kings ${kings}/${KINGS}`),
          el('h2', { class: 'huge' }, players[turn % players.length]),
          button('Draw a card', draw, 'primary'),
        ),
      );
    }

    function draw() {
      const card = deck.pop();
      const name = players[turn % players.length];
      turn++;
      const red = card.suit === '♥' || card.suit === '♦';
      let [title, text] = RULES[card.rank];
      const last = card.rank === 'K' && ++kings === KINGS;
      if (last) {
        title = 'The last King!';
        text = `${name} drinks the whole King's Cup. Game over!`;
        sfx.boom();
        vibrate([300, 100, 300]);
      } else {
        sfx.reveal();
      }
      mount(stage,
        el('div', { class: 'center stack' },
          el('p', { class: 'muted' }, `${name} drew`),
          el('div', { class: `playing-card${red ? ' red' : ''}` },
            el('span', {}, card.rank), el('span', { class: 'suit' }, card.suit),
          ),
          el('h2', {}, title),
          el('p', { class: 'rules' }, text),
          last
            ? button('New game', newGame, 'primary')
            : button(`Next: ${players[turn % players.length]}`, ready, 'primary'),
        ),
      );
    }

    newGame();
  },
};
