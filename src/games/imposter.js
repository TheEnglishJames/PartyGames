import { el, button, mount, passScreen, drinkNote } from '../lib/ui.js';
import { sessionDeck } from '../lib/deck.js';
import { pickImposters, imposterCount } from '../lib/players.js';
import { sfx } from '../lib/sound.js';
import words from '../content/imposter.js';
import pairs from '../content/undercover.js';

const RANDOM = 'Random';
const CATEGORIES = Object.keys(words);
const MODES = {
  classic: 'Classic',
  undercover: 'Undercover',
};

function chip(label, pressed, onclick) {
  return el('button', { class: 'chip', type: 'button', 'aria-pressed': String(pressed), onclick }, label);
}

export default {
  id: 'imposter',
  title: 'Imposter',
  emoji: '🕵️',
  color: '#ffb800',
  rules: 'Everyone secretly sees the same word — except the imposter. Take turns saying one word about it, then vote on who\'s faking. Undercover mode: the imposter gets a similar word and doesn\'t know they\'re the imposter.',
  start(stage, { players, settings }) {
    let mode = 'classic';
    let choice = RANDOM;

    function setup() {
      const n = imposterCount(players.length);
      mount(stage,
        el('div', { class: 'center stack' },
          el('div', { class: 'chips' },
            Object.entries(MODES).map(([key, label]) => chip(label, key === mode, () => { mode = key; setup(); })),
          ),
          mode === 'classic'
            ? [el('h2', {}, 'Pick a category'),
              el('div', { class: 'chips' },
                [RANDOM, ...CATEGORIES].map((name) => chip(name, name === choice, () => { choice = name; setup(); })),
              )]
            : el('p', { class: 'rules' }, 'Everyone gets a word. One of you has a slightly different one — and has no idea.'),
          el('p', { class: 'muted' }, `${players.length} players · ${n} imposter${n > 1 ? 's' : ''}`),
          button('Deal the cards', deal, 'primary'),
        ),
      );
    }

    function deal() {
      const imposters = pickImposters(players.length);
      if (mode === 'undercover') {
        const pair = sessionDeck('undercover', pairs).draw();
        const flip = Math.random() < 0.5;
        const [word, imposterWord] = flip ? pair : [pair[1], pair[0]];
        return showTurn({ mode, word, imposterWord, imposters }, 0);
      }
      const category = choice === RANDOM ? sessionDeck('imposter:categories', CATEGORIES).draw() : choice;
      const word = sessionDeck(`imposter:${category}`, words[category]).draw();
      showTurn({ mode, category, word, imposters }, 0);
    }

    function secretFor(round, i) {
      const isImposter = round.imposters.has(i);
      if (round.mode === 'undercover') return ['The word is', isImposter ? round.imposterWord : round.word];
      return isImposter ? [`Category: ${round.category}`, 'You are the IMPOSTER 🤫'] : ['The word is', round.word];
    }

    function showTurn(round, i) {
      if (i === players.length) return discuss(round);
      passScreen(stage, players[i], () => {
        const [label, text] = secretFor(round, i);
        const hide = button('Got it — hide & pass', () => showTurn(round, i + 1), 'primary');
        hide.hidden = true;
        mount(stage,
          el('div', { class: 'center stack' },
            el('p', { class: 'muted' }, players[i]),
            el('button', {
              class: 'card',
              type: 'button',
              onclick: (e) => {
                sfx.tap();
                e.currentTarget.replaceChildren(el('span', { class: 'label' }, label), text);
                e.currentTarget.disabled = true;
                hide.hidden = false;
              },
            }, el('span', { class: 'label' }, 'Make sure nobody is looking'), 'Tap to reveal'),
            hide,
          ),
        );
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
          round.mode === 'undercover'
            ? el('p', {}, 'Crew word: ', el('strong', {}, round.word), ' · Imposter word: ', el('strong', {}, round.imposterWord))
            : el('p', {}, 'The word was ', el('strong', {}, round.word), ` (${round.category})`),
          drinkNote(settings, 'Caught? Imposter drinks 3. Got away? Everyone else drinks 1.'),
          button('Play again', deal, 'primary'),
          button('Change mode or category', setup),
        ),
      );
    }

    setup();
  },
};
