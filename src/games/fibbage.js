import { el, button, mount, passScreen, drinkNote } from '../lib/ui.js';
import { sessionDeck, shuffle } from '../lib/deck.js';
import { sfx } from '../lib/sound.js';
import facts from '../content/fibbage.js';

export const normalize = (s) => s.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

// Merges identical lies (crediting every author) and shuffles them in with the truth.
export function buildOptions(answer, lies, rng = Math.random) {
  const byText = new Map();
  for (const { author, text } of lies) {
    const key = normalize(text);
    if (byText.has(key)) byText.get(key).authors.push(author);
    else byText.set(key, { text: text.trim(), authors: [author], real: false });
  }
  return shuffle([{ text: answer, authors: [], real: true }, ...byText.values()], rng);
}

const LETTERS = 'ABCDEFGHIJK';

export default {
  id: 'fibbage',
  title: 'Fibbage',
  emoji: '🤥',
  color: '#ff3d8b',
  rules: 'A weird true fact has a gap. Everyone secretly writes a fake answer. Then all answers are shown — find the truth, and fool the others with your lie.',
  start(stage, { players, settings }) {
    const deck = sessionDeck('fibbage', facts);

    function prompt() {
      const fact = deck.draw();
      mount(stage,
        el('div', { class: 'center stack' },
          el('div', { class: 'card' }, el('span', { class: 'label' }, 'Read this out loud'), fact.q),
          el('p', { class: 'muted' }, 'Now everyone writes a believable fake answer.'),
          button('Start writing', () => write(fact, [], 0), 'primary'),
        ),
      );
    }

    function write(fact, lies, i) {
      if (i === players.length) return vote(fact, buildOptions(fact.a, lies));
      passScreen(stage, players[i], () => {
        const input = el('input', { type: 'text', maxlength: 40, placeholder: 'Your fake answer', autocomplete: 'off', 'aria-label': 'Your fake answer' });
        const error = el('p', { class: 'error', role: 'alert' });
        const submit = () => {
          const text = input.value.trim();
          if (!text) {
            error.textContent = 'Write something!';
          } else if (normalize(text) === normalize(fact.a)) {
            error.textContent = "That's the real answer! 🤫 Write a fake one.";
            input.value = '';
          } else {
            lies.push({ author: players[i], text });
            write(fact, lies, i + 1);
          }
        };
        mount(stage,
          el('form', { class: 'center stack', onsubmit: (e) => { e.preventDefault(); submit(); } },
            el('div', { class: 'card' }, fact.q),
            input,
            error,
            button('Submit & pass', submit, 'primary'),
          ),
        );
        input.focus();
      });
    }

    function vote(fact, options) {
      mount(stage,
        el('div', { class: 'center stack' },
          el('div', { class: 'card' }, fact.q),
          el('ol', { class: 'options' }, options.map((o, i) => el('li', {}, el('b', {}, LETTERS[i]), o.text))),
          el('p', { class: 'muted' }, 'Which one is true? On three, everyone shouts a letter.'),
          button('Reveal the truth', () => reveal(fact, options), 'primary'),
        ),
      );
    }

    function reveal(fact, options) {
      sfx.reveal();
      mount(stage,
        el('div', { class: 'center stack' },
          el('ol', { class: 'options' },
            options.map((o, i) =>
              el('li', { class: o.real ? 'real' : '' },
                el('b', {}, LETTERS[i]),
                el('span', {}, o.text, el('small', {}, o.real ? 'THE TRUTH' : `lie by ${o.authors.join(' & ')}`)),
              ),
            ),
          ),
          drinkNote(settings, 'Fell for a lie? Drink 1. Your lie fooled someone? Hand out 1 per victim.',
            'Found the truth? 1 point. Your lie fooled someone? 1 point per victim.'),
          button('Next question', prompt, 'primary'),
        ),
      );
    }

    prompt();
  },
};
