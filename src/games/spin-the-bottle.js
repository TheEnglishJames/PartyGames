import { el, button, mount } from '../lib/ui.js';
import { sfx, vibrate } from '../lib/sound.js';
import { spicyDeck } from './card-game.js';
import truthOrDare from '../content/truth-or-dare.js';

const SPIN_MS = 4000;
const ARROW_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true">
  <path d="M50 4 L74 40 L59 40 L59 92 L41 92 L41 40 L26 40 Z" fill="currentColor" stroke="#14101f" stroke-width="3" stroke-linejoin="round"/>
</svg>`;

export default {
  id: 'spin-the-bottle',
  title: 'Spin the Bottle',
  emoji: '🍾',
  color: '#ff3d8b',
  rules: 'Put the phone flat in the middle of the circle and spin. Whoever the arrow points at gets a truth or a dare.',
  start(stage, { settings }) {
    // Same decks as Truth or Dare, so cards don't repeat across both games.
    const decks = {
      truth: spicyDeck('truth', truthOrDare.truth, settings),
      dare: spicyDeck('dare', truthOrDare.dare, settings),
    };
    let angle = 0;
    let timer = null;

    const arrow = el('div', { class: 'bottle' });
    arrow.innerHTML = ARROW_SVG;
    const result = el('div', { class: 'stack', style: { width: '100%' } });
    const spinBtn = button('Spin', spin, 'primary');

    function spin() {
      spinBtn.disabled = true;
      result.replaceChildren();
      angle += 1440 + Math.random() * 360;
      arrow.style.transform = `rotate(${angle}deg)`;
      sfx.reveal();
      timer = setTimeout(() => {
        spinBtn.disabled = false;
        vibrate(100);
        result.replaceChildren(
          el('p', { class: 'muted', style: { textAlign: 'center' } },
            settings.spicy ? "Spinner's choice: a kiss, truth or dare." : 'Truth or dare?'),
          el('div', { class: 'btn-row' },
            button('Truth', () => show('truth')),
            button('Dare', () => show('dare')),
          ),
        );
      }, SPIN_MS);
    }

    function show(kind) {
      result.replaceChildren(el('div', { class: 'card' }, el('span', { class: 'label' }, kind), decks[kind].draw()));
    }

    mount(stage,
      el('div', { class: 'center stack' },
        el('p', { class: 'muted' }, 'Phone flat in the middle'),
        arrow,
        result,
        spinBtn,
      ),
    );
    return () => clearTimeout(timer);
  },
};
