import { el, button, mount, drinkNote } from '../lib/ui.js';
import { splitTeams } from '../lib/players.js';
import { sfx } from '../lib/sound.js';

// Tap a name to cycle its crowd. Kept for the app session so re-splitting is quick.
const CROWDS = ['', '🔵', '🟠'];
const crowdOf = new Map();
let teamCount = 2;

export default {
  id: 'team-splitter',
  title: 'Team Splitter',
  emoji: '🎲',
  color: '#5ad1ff',
  rules: 'Random teams for any game. Optional: tap people to mark which crowd they came with (🔵 / 🟠, e.g. bride\'s side and groom\'s side) and the teams get mixed evenly so the groups actually meet.',
  start(stage, { players, settings }) {
    const maxTeams = Math.min(4, Math.floor(players.length / 2));
    teamCount = Math.max(2, Math.min(teamCount, maxTeams));

    function setup() {
      mount(stage,
        el('div', { class: 'center stack' },
          el('h2', {}, 'How many teams?'),
          el('div', { class: 'chips' },
            Array.from({ length: maxTeams - 1 }, (_, k) => k + 2).map((n) =>
              el('button', { class: 'chip', type: 'button', 'aria-pressed': String(n === teamCount), onclick: () => { teamCount = n; setup(); } }, n),
            ),
          ),
          el('p', { class: 'muted' }, 'Mix the crowds? Tap names to mark them 🔵 or 🟠.'),
          el('div', { class: 'chips' },
            players.map((name) => {
              const crowd = crowdOf.get(name) ?? 0;
              return el('button', {
                class: 'chip',
                type: 'button',
                'aria-label': `${name}, crowd ${CROWDS[crowd] || 'none'}`,
                onclick: () => { crowdOf.set(name, (crowd + 1) % CROWDS.length); setup(); },
              }, CROWDS[crowd] && `${CROWDS[crowd]} `, name);
            }),
          ),
          button('Split!', split, 'primary'),
        ),
      );
    }

    function split() {
      sfx.reveal();
      const teams = splitTeams(players, teamCount, (name) => crowdOf.get(name) ?? 0);
      mount(stage,
        el('div', { class: 'center stack' },
          el('h2', {}, 'Teams'),
          teams.map((members, t) => el('div', { class: 'team' }, el('strong', {}, `Team ${t + 1}`), members.join(', '))),
          drinkNote(settings, 'Each team toasts their new teammates — cheers!', null),
          button('Shuffle again', split, 'primary'),
          button('Change setup', setup),
        ),
      );
    }

    if (maxTeams < 2) {
      mount(stage, el('div', { class: 'center stack' }, el('p', { class: 'rules' }, 'Need at least 4 players for teams.')));
      return;
    }
    setup();
  },
};
