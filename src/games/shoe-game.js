import { makeCardGame } from './card-game.js';
import content from '../content/shoe-game.js';

export default makeCardGame({
  id: 'shoe-game',
  title: 'Shoe Game',
  emoji: '👟',
  color: '#ff9fd6',
  rules: 'For the couple. They sit back to back, each holding one of their own shoes and one of their partner\'s. Someone reads the card out loud and both raise the shoe of who it fits. The crowd watches for disagreements.',
  prefix: 'Who…',
  content,
  drink: 'Raised different shoes? The couple drinks 1. Same shoe? The guests drink 1.',
  noDrink: 'Raised different shoes? Time to explain yourselves.',
});
