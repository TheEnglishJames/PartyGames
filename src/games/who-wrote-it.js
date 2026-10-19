import { el, button, mount, passScreen, drinkNote } from '../lib/ui.js';
import { shuffle } from '../lib/deck.js';
import { sfx } from '../lib/sound.js';
import { spicyDeck } from './card-game.js';
import content from '../content/who-wrote-it.js';

export default {
  id: 'who-wrote-it',
  title: 'Who Wrote It?',
  emoji: '✍️',
  color: '#ffd166',
  rules: 'Everyone secretly writes a true answer to the same prompt. Then the answers are read out one by one — guess who wrote each one, and get the story behind it.',
  start(stage, { players, settings }) {
    const deck = spicyDeck('who-wrote-it', content, settings);

    function prompt() {
      const question = deck.draw();
      mount(stage,
        el('div', { class: 'center stack' },
          el('div', { class: 'card' }, el('span', { class: 'label' }, 'Everyone answers'), question),
          el('p', { class: 'muted' }, 'Keep it true, but write it so nobody can tell it was you.'),
          button('Start writing', () => write(question, [], 0), 'primary'),
        ),
      );
    }

    function write(question, answers, i) {
      if (i === players.length) return guess(question, shuffle(answers), 0);
      passScreen(stage, players[i], () => {
        const input = el('input', { type: 'text', maxlength: 80, placeholder: 'Your true answer', autocomplete: 'off', 'aria-label': 'Your answer' });
        const error = el('p', { class: 'error', role: 'alert' });
        const submit = () => {
          const text = input.value.trim();
          if (!text) {
            error.textContent = 'Write something!';
            return;
          }
          answers.push({ author: players[i], text });
          write(question, answers, i + 1);
        };
        mount(stage,
          el('form', { class: 'center stack', onsubmit: (e) => { e.preventDefault(); submit(); } },
            el('div', { class: 'card' }, question),
            input,
            error,
            button('Submit & pass', submit, 'primary'),
          ),
        );
        input.focus();
      }, "I'm ready, nobody's looking");
    }

    function guess(question, answers, i) {
      if (i === answers.length) return prompt();
      const { author, text } = answers[i];
      const reveal = el('div', { class: 'stack' },
        button('Reveal who wrote it', () => {
          sfx.reveal();
          reveal.replaceChildren(
            el('h2', { class: 'huge' }, author),
            el('p', { class: 'muted' }, `${author}: tell the story behind it!`),
            drinkNote(settings, 'Guessed wrong? Drink 1. Nobody guessed you? Hand out 2.',
              'Guessed right? 1 point. Nobody guessed you? 2 points.'),
            button(i + 1 < answers.length ? 'Next answer' : 'New prompt', () => guess(question, answers, i + 1), 'primary'),
          );
        }, 'primary'),
      );
      mount(stage,
        el('div', { class: 'center stack' },
          el('p', { class: 'muted' }, `${question} · ${i + 1}/${answers.length}`),
          el('div', { class: 'card' }, `“${text}”`),
          el('p', { class: 'muted' }, 'Who wrote it? On three, everyone points.'),
          reveal,
        ),
      );
    }

    prompt();
  },
};
