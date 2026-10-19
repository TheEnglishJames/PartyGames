import { el, button, mount, passScreen, drinkNote } from '../lib/ui.js';
import { shuffle } from '../lib/deck.js';
import { imposterCount } from '../lib/players.js';
import { sfx } from '../lib/sound.js';

export const ROLES = {
  wolf: { name: 'Werewolf', emoji: '🐺', goal: 'Each night, eat a villager. Win when wolves equal the rest.' },
  seer: { name: 'Seer', emoji: '🔮', goal: 'Each night, check if one player is a werewolf.' },
  doctor: { name: 'Doctor', emoji: '🩺', goal: 'Each night, protect one player (yourself too) from the wolves.' },
  villager: { name: 'Villager', emoji: '🧑‍🌾', goal: 'Find the werewolves and vote them out.' },
};

// 1 wolf below 7 players, 2 from 7. Seer from 4 players, doctor from 5.
export function assignRoles(count, rng = Math.random) {
  const roles = Array(imposterCount(count)).fill('wolf');
  if (count >= 4) roles.push('seer');
  if (count >= 5) roles.push('doctor');
  while (roles.length < count) roles.push('villager');
  return shuffle(roles, rng);
}

// 'wolves', 'village' or null while the game goes on.
export function winner(roles, alive) {
  const wolves = [...alive].filter((i) => roles[i] === 'wolf').length;
  if (wolves === 0) return 'village';
  return wolves >= alive.size - wolves ? 'wolves' : null;
}

export default {
  id: 'werewolf',
  title: 'Werewolf',
  emoji: '🐺',
  color: '#8c9eff',
  rules: 'The app is the narrator. Everyone secretly gets a role: Werewolf, Seer, Doctor or Villager. At night, the phone goes around and everyone makes a secret move (villagers too, so nobody can tell who\'s who). By day, discuss and vote someone out. Best with 6+ players.',
  start(stage, { players, settings }) {
    let roles;
    let alive;
    let night;

    const role = (i) => ROLES[roles[i]];
    const alivePlayers = () => [...alive];

    function pickList(indices, onPick) {
      return el('div', { class: 'chips' },
        indices.map((i) => el('button', { class: 'chip', type: 'button', onclick: () => { sfx.tap(); onPick(i); } }, players[i])),
      );
    }

    function newGame() {
      roles = assignRoles(players.length);
      alive = new Set(players.map((_, i) => i));
      dealRole(0);
    }

    function wolfMates(i) {
      return alivePlayers().filter((j) => j !== i && roles[j] === 'wolf').map((j) => players[j]);
    }

    function dealRole(i) {
      if (i === players.length) return nightFalls();
      passScreen(stage, players[i], () => {
        const hide = button('Got it — hide & pass', () => dealRole(i + 1), 'primary');
        hide.hidden = true;
        mount(stage,
          el('div', { class: 'center stack' },
            el('p', { class: 'muted' }, players[i]),
            el('button', {
              class: 'card',
              type: 'button',
              onclick: (e) => {
                sfx.tap();
                const mates = roles[i] === 'wolf' ? wolfMates(i) : [];
                e.currentTarget.replaceChildren(
                  el('span', { class: 'label' }, 'Your role'),
                  `${role(i).emoji} ${role(i).name}`,
                  el('span', { class: 'label' }, role(i).goal),
                  mates.length > 0 && el('span', { class: 'label' }, `Your pack: ${mates.join(', ')}`),
                );
                e.currentTarget.disabled = true;
                hide.hidden = false;
              },
            }, el('span', { class: 'label' }, 'Make sure nobody is looking'), 'Tap to see your role'),
            hide,
          ),
        );
      }, "I'm ready, nobody's looking");
    }

    function nightFalls() {
      night = { victim: null, saved: null };
      mount(stage,
        el('div', { class: 'center stack' },
          el('div', { class: 'big-emoji' }, '🌙'),
          el('h2', {}, 'Night falls'),
          el('p', { class: 'rules' }, 'The phone goes around. Everyone makes a secret move — act the same, so nobody can tell your role.'),
          button('Start the night', () => nightTurn(0), 'primary'),
        ),
      );
    }

    function nightTurn(order) {
      const queue = alivePlayers();
      if (order === queue.length) return morning();
      const i = queue[order];
      const done = () => nightTurn(order + 1);
      passScreen(stage, players[i], () => mount(stage, el('div', { class: 'center stack' }, nightAction(i, done))), "I'm ready, nobody's looking");
    }

    function nightAction(i, done) {
      const title = el('p', { class: 'muted' }, `${role(i).emoji} ${role(i).name}`);
      const others = alivePlayers().filter((j) => j !== i);
      const finish = (text) => [title, el('div', { class: 'card' }, text), button('Done — pass on', done, 'primary')];

      if (roles[i] === 'wolf') {
        if (night.victim != null) return finish(`Your pack is eating ${players[night.victim]} tonight. 🐺`);
        const prey = others.filter((j) => roles[j] !== 'wolf');
        return [title, el('h2', {}, 'Who do you eat tonight?'),
          pickList(prey, (j) => { night.victim = j; mount(stage, el('div', { class: 'center stack' }, finish(`You chose ${players[j]}.`))); })];
      }
      if (roles[i] === 'seer') {
        return [title, el('h2', {}, 'Whose role do you check?'),
          pickList(others, (j) => mount(stage, el('div', { class: 'center stack' },
            finish(roles[j] === 'wolf' ? `${players[j]} IS a werewolf 🐺` : `${players[j]} is not a werewolf`))))];
      }
      if (roles[i] === 'doctor') {
        return [title, el('h2', {}, 'Who do you protect tonight?'),
          pickList(alivePlayers(), (j) => { night.saved = j; mount(stage, el('div', { class: 'center stack' }, finish(`You protect ${players[j]}.`))); })];
      }
      return [title, el('h2', {}, 'Who do you suspect?'), el('p', { class: 'muted' }, 'Just for show — it keeps the night secret.'),
        pickList(others, () => done())];
    }

    function morning() {
      const killed = night.victim != null && night.victim !== night.saved ? night.victim : null;
      if (killed != null) alive.delete(killed);
      sfx.reveal();
      mount(stage,
        el('div', { class: 'center stack' },
          el('div', { class: 'big-emoji' }, '☀️'),
          el('h2', {}, 'Everyone wake up!'),
          killed != null
            ? [el('div', { class: 'card' }, el('span', { class: 'label' }, 'Eaten tonight'), players[killed]),
              el('p', {}, `They were the ${role(killed).emoji} ${role(killed).name}.`),
              drinkNote(settings, `${players[killed]} drinks 2 to rest in peace — and stays quiet.`, `${players[killed]} is out and stays quiet.`)]
            : el('p', { class: 'rules' }, night.victim != null ? 'The wolves attacked — but the doctor saved them. Nobody died!' : 'A quiet night. Nobody died.'),
          button('Continue', () => checkWin(dayVote), 'primary'),
        ),
      );
    }

    function dayVote() {
      mount(stage,
        el('div', { class: 'center stack' },
          el('h2', {}, 'Discuss & vote'),
          el('p', { class: 'muted' }, 'Who is a werewolf? On three, everyone points. Most votes is out.'),
          pickList(alivePlayers(), votedOut),
          button('Tie — nobody is out', nightFalls, 'ghost'),
        ),
      );
    }

    function votedOut(i) {
      alive.delete(i);
      sfx.reveal();
      mount(stage,
        el('div', { class: 'center stack' },
          el('div', { class: 'card' }, el('span', { class: 'label' }, `${players[i]} was`), `${role(i).emoji} ${role(i).name}`),
          drinkNote(settings, roles[i] === 'wolf' ? `Caught! ${players[i]} drinks 3.` : `Wrong person! Everyone who voted for ${players[i]} drinks 1.`, null),
          button('Continue', () => checkWin(nightFalls), 'primary'),
        ),
      );
    }

    function checkWin(next) {
      const side = winner(roles, alive);
      if (!side) return next();
      sfx.end();
      mount(stage,
        el('div', { class: 'center stack' },
          el('div', { class: 'big-emoji' }, side === 'wolves' ? '🐺' : '🎉'),
          el('h2', {}, side === 'wolves' ? 'The werewolves win!' : 'The village wins!'),
          el('ol', { class: 'options' },
            players.map((name, i) => el('li', {}, el('b', {}, role(i).emoji), el('span', {}, name, el('small', {}, role(i).name)))),
          ),
          drinkNote(settings, 'The losing side drinks 2.', null),
          button('Play again', newGame, 'primary'),
        ),
      );
    }

    newGame();
  },
};
