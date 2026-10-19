import { el } from '../lib/ui.js';
import { makeCardGame } from './card-game.js';
import content from '../content/would-you-rather.js';

export default makeCardGame({
  id: 'would-you-rather',
  title: 'Would You Rather',
  emoji: '⚖️',
  color: '#3dd9ff',
  rules: 'Read both options out loud. On three, everyone raises one hand for the left option or two for the right.',
  prefix: 'Would you rather…',
  content,
  drink: 'The minority drinks.',
  noDrink: 'The minority has to explain themselves.',
  render: ([a, b]) => [el('span', {}, a), el('span', { class: 'or' }, 'or'), el('span', {}, b)],
});
