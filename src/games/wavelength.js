import { el, button, mount, passScreen, drinkNote } from '../lib/ui.js';
import { sessionDeck } from '../lib/deck.js';
import { sfx } from '../lib/sound.js';
import spectra from '../content/wavelength.js';

// Scoring bands around the target, as distance on a 0–100 scale.
const ZONES = [[4, 4], [10, 3], [16, 2]];

export function wavelengthScore(target, guess) {
  const d = Math.abs(target - guess);
  for (const [width, points] of ZONES) if (d <= width) return points;
  return 0;
}

function scale([left, right], { target, guess } = {}) {
  const bar = el('div', { class: 'spectrum' });
  if (target != null) {
    for (const [width, points] of [...ZONES].reverse()) {
      bar.append(el('div', {
        class: `zone zone-${points}`,
        style: { left: `${target - width}%`, width: `${width * 2}%` },
      }, points));
    }
  }
  if (guess != null) bar.append(el('div', { class: 'needle', style: { left: `${guess}%` } }));
  return el('div', { class: 'stack', style: { width: '100%' } },
    bar,
    el('div', { class: 'spectrum-labels' }, el('span', {}, `← ${left}`), el('span', {}, `${right} →`)),
  );
}

export default {
  id: 'wavelength',
  title: 'Wavelength',
  emoji: '📡',
  color: '#3ddc84',
  rules: 'One player secretly sees a target on a scale (e.g. Cold ↔ Hot) and gives a one-word clue. Everyone else moves the dial to where they think the target is.',
  start(stage, { players, settings }) {
    const deck = sessionDeck('wavelength', spectra);
    let turn = 0;

    function giverTurn() {
      const giver = players[turn % players.length];
      const round = { giver, spectrum: deck.draw(), target: 8 + Math.round(Math.random() * 84) };
      passScreen(stage, giver, () => {
        mount(stage,
          el('div', { class: 'center stack' },
            el('h2', {}, 'Only you can see this'),
            scale(round.spectrum, { target: round.target }),
            el('p', { class: 'rules' }, 'Think of a clue that sits right on the target. Then hide this and say your clue out loud.'),
            button('Hide & give my clue', () => guess(round), 'primary'),
          ),
        );
      }, "Tap when nobody's looking");
    }

    function guess(round) {
      const dial = el('input', { type: 'range', min: 0, max: 100, value: 50, class: 'dial', 'aria-label': 'Your guess' });
      mount(stage,
        el('div', { class: 'center stack' },
          el('h2', {}, `${round.giver}'s clue`),
          el('p', { class: 'muted' }, 'Everyone else: agree on a spot.'),
          scale(round.spectrum),
          dial,
          button('Lock it in', () => reveal(round, Number(dial.value)), 'primary'),
        ),
      );
    }

    function reveal(round, value) {
      sfx.reveal();
      const points = wavelengthScore(round.target, value);
      turn++;
      const drinks = points === 4
        ? `Bullseye! ${round.giver} hands out 4 drinks.`
        : points === 0 ? `Miss! ${round.giver} drinks 2.` : `${round.giver} hands out ${points - 1}.`;
      mount(stage,
        el('div', { class: 'center stack' },
          el('h2', { class: 'huge' }, points ? `${points} points` : 'Miss!'),
          scale(round.spectrum, { target: round.target, guess: value }),
          drinkNote(settings, drinks),
          button(`Next: ${players[turn % players.length]}`, giverTurn, 'primary'),
        ),
      );
    }

    giverTurn();
  },
};
