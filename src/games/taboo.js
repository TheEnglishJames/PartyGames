import { el, button, mount, drinkNote, keepAwake } from '../lib/ui.js';
import { sessionDeck } from '../lib/deck.js';
import { splitTeams } from '../lib/players.js';
import { sfx, vibrate } from '../lib/sound.js';
import cards from '../content/taboo.js';

const ROUND_SECONDS = 60;

export default {
  id: 'taboo',
  title: 'Taboo',
  emoji: '🚫',
  color: '#3dd9ff',
  rules: 'Two teams. Explain the word to your team without saying any of the forbidden words. The other team watches and hits BUZZ if you slip. 60 seconds per turn.',
  start(stage, { players, settings }) {
    const deck = sessionDeck('taboo', cards);
    let teams = splitTeams(players);
    const scores = [0, 0];
    const explainerIndex = [0, 0];
    let team = 0;
    let interval = null;
    let release = () => {};

    function stop() {
      clearInterval(interval);
      interval = null;
      release();
    }

    function showTeams() {
      mount(stage,
        el('div', { class: 'center stack' },
          el('h2', {}, 'Teams'),
          teams.map((members, t) => el('div', { class: 'team' }, el('strong', {}, `Team ${t + 1}`), members.join(', '))),
          button('Shuffle teams', () => { teams = splitTeams(players); showTeams(); }),
          button('Start', ready, 'primary'),
        ),
      );
    }

    function explainer() {
      const members = teams[team];
      return members[explainerIndex[team] % members.length];
    }

    function scoreboard() {
      return el('div', { class: 'scoreboard' },
        scores.map((s, t) => el('span', { class: t === team ? 'active' : '' }, `Team ${t + 1}: ${s}`)),
      );
    }

    function ready() {
      mount(stage,
        el('div', { class: 'center stack' },
          scoreboard(),
          el('p', { class: 'muted' }, `Team ${team + 1} · explaining:`),
          el('h2', { class: 'huge' }, explainer()),
          el('p', { class: 'rules' }, `Team ${3 - (team + 1)}: look over their shoulder and buzz any forbidden word!`),
          button('Start 60 seconds', play, 'primary'),
        ),
      );
    }

    async function play() {
      let left = ROUND_SECONDS;
      let points = 0;
      const timerEl = el('div', { class: 'timer-pill' }, left);
      const cardEl = el('div', { class: 'taboo-card' });
      const next = () => {
        const [word, ...forbidden] = deck.draw();
        cardEl.replaceChildren(el('div', { class: 'taboo-word' }, word), el('ul', {}, forbidden.map((f) => el('li', {}, f))));
      };
      const score = (delta) => {
        points += delta;
        if (delta > 0) sfx.correct();
        else if (delta < 0) { sfx.boom(); vibrate(200); }
        else sfx.skip();
        next();
      };
      next();
      mount(stage,
        el('div', { class: 'center stack' },
          timerEl,
          cardEl,
          el('div', { class: 'btn-row' },
            button('BUZZ −1', () => score(-1), 'bad'),
            button('Skip', () => score(0)),
            button('Got it +1', () => score(1), 'ok'),
          ),
        ),
      );
      interval = setInterval(() => {
        left--;
        timerEl.textContent = left;
        if (left <= 5 && left > 0) sfx.tick();
        if (left > 0) return;
        stop();
        sfx.end();
        vibrate(300);
        finish(points);
      }, 1000);
      release = await keepAwake();
      if (!interval) release();
    }

    function finish(points) {
      scores[team] += points;
      explainerIndex[team]++;
      const roundTeam = team;
      team = 1 - team;
      const behind = scores[0] === scores[1] ? null : scores[0] < scores[1] ? 1 : 2;
      mount(stage,
        el('div', { class: 'center stack' },
          el('h2', { class: 'huge' }, `${points >= 0 ? '+' : ''}${points}`),
          el('p', { class: 'muted' }, `for Team ${roundTeam + 1}`),
          scoreboard(),
          behind && drinkNote(settings, `Team ${behind} is behind — everyone on it drinks 1.`),
          button(`Next: Team ${team + 1}`, ready, 'primary'),
        ),
      );
    }

    showTeams();
    return stop;
  },
};
