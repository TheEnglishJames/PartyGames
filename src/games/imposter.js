import { el, button, mount, passScreen, drinkNote } from '../lib/ui.js';
import { sessionDeck } from '../lib/deck.js';
import { pickImposters, imposterCount } from '../lib/players.js';
import { sfx } from '../lib/sound.js';
import words from '../content/imposter.js';

const RANDOM = 'Random';
const CATEGORIES = Object.keys(words);

export default {
  id: 'imposter',
  title: 'Imposter',
  emoji: '🕵️',
  color: '#ffb800',
  rules: 'Everyone secretly sees the same word — except the imposter, who only sees the category. Take turns saying one word about it, then vote on who\'s faking.',
  start(stage, { players, settings }) {
    let choice = RANDOM;

    function pickCategory() {
      const chips = [RANDOM, ...CATEGORIES].map((name) =>
        el('button', {
          class: 'chip',
          type: 'button',
          'aria-pressed': String(name === choice),
          onclick: () => { choice = name; pickCategory(); },
        }, name),
      );
      const n = imposterCount(players.length);
      mount(stage,
        el('div', { class: 'center stack' },
          el('h2', {}, 'Pick a category'),
          el('div', { class: 'chips' }, chips),
          el('p', { class: 'muted' }, `${players.length} players · ${n} imposter${n > 1 ? 's' : ''}`),
          button('Deal the cards', deal, 'primary'),
        ),
      );
    }

    function deal() {
      const category = choice === RANDOM ? sessionDeck('imposter:categories', CATEGORIES).draw() : choice;
      const word = sessionDeck(`imposter:${category}`, words[category]).draw();
      const imposters = pickImposters(players.length);
      const round = { category, word, imposters };
      showTurn(round, 0);
    }

    function showTurn(round, i) {
      if (i === players.length) return discuss(round);
      passScreen(stage, players[i], () => {
        const isImposter = round.imposters.has(i);
        mount(stage,
          el('div', { class: 'center stack' },
            el('p', { class: 'muted' }, players[i]),
            el('button', {
              class: 'card',
              type: 'button',
              onclick: (e) => {
                sfx.tap();
                e.currentTarget.replaceChildren(
                  el('span', { class: 'label' }, isImposter ? `Category: ${round.category}` : 'The word is'),
                  isImposter ? 'You are the IMPOSTER 🤫' : round.word,
                );
                e.currentTarget.disabled = true;
                hide.hidden = false;
              },
            }, el('span', { class: 'label' }, 'Make sure nobody is looking'), 'Tap to reveal'),
          ),
        );
        const hide = button('Got it — hide & pass', () => showTurn(round, i + 1), 'primary');
        hide.hidden = true;
        stage.firstChild.append(hide);
      }, "I'm ready, nobody's looking");
    }

    function discuss(round) {
      // An imposter starting would be too hard; let a crewmate go first.
      const crew = players.map((_, i) => i).filter((i) => !round.imposters.has(i));
      const starter = players[crew[Math.floor(Math.random() * crew.length)]];
      mount(stage,
        el('div', { class: 'center stack' },
          el('div', { class: 'big-emoji' }, '🗣️'),
          el('h2', {}, `${starter} starts`),
          el('p', { class: 'rules' }, 'Go around the circle. Everyone says ONE word about the secret word. Do two rounds, then count to three and point at the imposter.'),
          button('Reveal the imposter', () => reveal(round), 'primary'),
        ),
      );
    }

    function reveal(round) {
      sfx.reveal();
      const names = [...round.imposters].map((i) => players[i]).join(' & ');
      mount(stage,
        el('div', { class: 'center stack' },
          el('div', { class: 'card' },
            el('span', { class: 'label' }, round.imposters.size > 1 ? 'The imposters were' : 'The imposter was'),
            names,
          ),
          el('p', {}, 'The word was ', el('strong', {}, round.word), ` (${round.category})`),
          drinkNote(settings, 'Caught? Imposter drinks 3. Got away? Everyone else drinks 1.'),
          button('Play again', deal, 'primary'),
          button('Change category', pickCategory),
        ),
      );
    }

    pickCategory();
  },
};
