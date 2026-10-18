import { makeCardGame } from './card-game.js';
import content from '../content/never-have-i.js';

export default makeCardGame({
  id: 'never-have-i',
  title: 'Never Have I Ever',
  emoji: '🙊',
  color: '#b18cff',
  rules: 'Read the card out loud. Everyone who has done it has to admit it.',
  prefix: 'Never have I ever…',
  content,
  drink: 'Done it? Drink.',
  noDrink: 'Done it? Put a finger down. Three down and you\'re out.',
});
