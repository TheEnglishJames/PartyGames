import { el, button, mount, drinkNote } from '../lib/ui.js';
import { sessionDeck } from '../lib/deck.js';

// Spicy mode mixes the 18+ cards into the mild ones.
export function spicyDeck(key, content, settings) {
  return settings.spicy
    ? sessionDeck(`${key}:spicy`, [...content.mild, ...content.spicy])
    : sessionDeck(`${key}:mild`, content.mild);
}

// Shared shape for "read a card, everyone reacts, next card" games.
export function makeCardGame({ id, title, emoji, color, rules, prefix, content, drink, noDrink, render = (card) => card }) {
  return {
    id, title, emoji, color, rules,
    start(stage, { settings }) {
      const deck = spicyDeck(id, content, settings);
      const show = () =>
        mount(stage,
          el('div', { class: 'center stack' },
            el('div', { class: 'card' }, el('span', { class: 'label' }, prefix), render(deck.draw())),
            drinkNote(settings, drink, noDrink),
            button('Next card', show, 'primary'),
          ),
        );
      show();
    },
  };
}
