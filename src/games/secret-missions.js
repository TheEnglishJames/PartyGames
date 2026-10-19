import { el, button, mount, passScreen, drinkNote } from '../lib/ui.js';
import { sfx } from '../lib/sound.js';
import { loadMissions, saveMissions } from '../lib/storage.js';
import { spicyDeck } from './card-game.js';
import content from '../content/secret-missions.js';

// One mission per player, drawn from the no-repeat deck so nobody shares one.
export function dealMissions(players, draw) {
  return Object.fromEntries(players.map((name) => [name, draw()]));
}

export default {
  id: 'secret-missions',
  title: 'Secret Missions',
  emoji: '🎯',
  color: '#9be15d',
  rules: 'Everyone gets a secret mission for the whole weekend — most of them make you talk to people you don\'t know yet. Keep it quiet! At the end of the weekend, reveal all missions and confess who pulled theirs off.',
  start(stage, { players, settings }) {
    const deck = spicyDeck('secret-missions', content, settings);
    let missions = loadMissions();

    function home() {
      if (!missions) {
        return mount(stage,
          el('div', { class: 'center stack' },
            el('div', { class: 'big-emoji' }, '🎯'),
            el('h2', {}, 'No missions yet'),
            el('p', { class: 'rules' }, 'Deal the missions at the start of the weekend. Everyone looks at theirs in private.'),
            button('Deal missions', deal, 'primary'),
          ),
        );
      }
      const names = Object.keys(missions);
      mount(stage,
        el('div', { class: 'center stack' },
          el('h2', {}, 'Missions are running'),
          el('p', { class: 'muted' }, `Dealt to ${names.join(', ')}`),
          el('p', { class: 'muted' }, 'Forgot yours? Tap your name.'),
          el('div', { class: 'chips' },
            names.map((name) => el('button', { class: 'chip', type: 'button', onclick: () => showOne(name, home) }, name)),
          ),
          button('End of weekend: reveal all', revealAll, 'primary'),
          button('Deal new missions', () => confirmDeal(), 'ghost'),
        ),
      );
    }

    function confirmDeal() {
      mount(stage,
        el('div', { class: 'center stack' },
          el('h2', {}, 'Throw away the current missions?'),
          el('p', { class: 'muted' }, 'Everyone gets a new one.'),
          button('Yes, deal new ones', deal, 'primary'),
          button('Keep them', home),
        ),
      );
    }

    function deal() {
      missions = dealMissions(players, deck.draw);
      saveMissions(missions);
      handOut(0);
    }

    function handOut(i) {
      if (i === players.length) return home();
      showOne(players[i], () => handOut(i + 1));
    }

    function showOne(name, onDone) {
      passScreen(stage, name, () => {
        const hide = button('Got it — hide & pass', onDone, 'primary');
        hide.hidden = true;
        mount(stage,
          el('div', { class: 'center stack' },
            el('p', { class: 'muted' }, name),
            el('button', {
              class: 'card',
              type: 'button',
              onclick: (e) => {
                sfx.tap();
                e.currentTarget.replaceChildren(el('span', { class: 'label' }, 'Your secret mission'), missions[name]);
                e.currentTarget.disabled = true;
                hide.hidden = false;
              },
            }, el('span', { class: 'label' }, 'Make sure nobody is looking'), 'Tap to reveal'),
            hide,
          ),
        );
      }, "I'm ready, nobody's looking");
    }

    function revealAll() {
      sfx.reveal();
      mount(stage,
        el('div', { class: 'center stack' },
          el('h2', {}, 'All missions'),
          el('ol', { class: 'options' },
            Object.entries(missions).map(([name, mission]) => el('li', {}, el('span', {}, name, el('small', {}, mission)))),
          ),
          el('p', { class: 'muted' }, 'Go around: did you pull it off? Prove it!'),
          drinkNote(settings, 'Failed your mission? Drink 2. Nailed it? Hand out 3.', 'Nailed it? Take a bow.'),
          button('Deal new missions', deal, 'primary'),
        ),
      );
    }

    home();
  },
};
