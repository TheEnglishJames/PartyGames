import { el, button, mount, drinkNote } from '../lib/ui.js';
import { sessionDeck } from '../lib/deck.js';
import levels from '../content/deep-talk.js';

const LEVELS = Object.keys(levels);

export default {
  id: 'deep-talk',
  title: 'Deep Talk',
  emoji: '🫶',
  color: '#7fe0c4',
  rules: 'Conversation cards for dinner or the morning after. Ask the card to someone in the group — they answer honestly, then they pick the next person. Start at Level 1 and go deeper when it feels right.',
  start(stage, { settings }) {
    let level = LEVELS[0];

    function show() {
      const question = sessionDeck(`deep-talk:${level}`, levels[level]).draw();
      mount(stage,
        el('div', { class: 'center stack' },
          el('div', { class: 'chips' },
            LEVELS.map((name, i) =>
              el('button', { class: 'chip', type: 'button', 'aria-pressed': String(name === level), onclick: () => { level = name; show(); } }, `Level ${i + 1}`),
            ),
          ),
          el('div', { class: 'card' }, el('span', { class: 'label' }, level), question),
          drinkNote(settings, 'Rather not answer? Drink 2 and pass it on.', 'Rather not answer? Pass it on — no pressure.'),
          button('Next card', show, 'primary'),
        ),
      );
    }

    show();
  },
};
