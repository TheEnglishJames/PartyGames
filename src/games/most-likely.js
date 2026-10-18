import { makeCardGame } from './card-game.js';
import content from '../content/most-likely.js';

export default makeCardGame({
  id: 'most-likely',
  title: 'Most Likely To',
  emoji: '👉',
  color: '#3dd9ff',
  rules: 'Read the card out loud. On three, everyone points at the person most likely to do it.',
  prefix: "Who's most likely to…",
  content,
  drink: 'Most fingers on you? Drink 2.',
  noDrink: 'Most fingers on you? Defend yourself!',
});
