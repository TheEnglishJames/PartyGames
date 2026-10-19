import './style.css';
import { el, button, mount } from './lib/ui.js';
import { loadPlayers, savePlayers, loadSettings, saveSettings, loadSeen, markSeen } from './lib/storage.js';
import { cleanNames, MIN_PLAYERS, MAX_PLAYERS } from './lib/players.js';
import { unlockAudio, setSoundEnabled } from './lib/sound.js';
import imposter from './games/imposter.js';
import hotPotato from './games/hot-potato.js';
import headsUp from './games/heads-up.js';
import mostLikely from './games/most-likely.js';
import truthOrDare from './games/truth-or-dare.js';
import neverHaveI from './games/never-have-i.js';
import wouldYouRather from './games/would-you-rather.js';
import paranoia from './games/paranoia.js';
import fiveSeconds from './games/five-seconds.js';
import stopAtTen from './games/stop-at-ten.js';
import spinTheBottle from './games/spin-the-bottle.js';
import wavelength from './games/wavelength.js';
import fibbage from './games/fibbage.js';
import taboo from './games/taboo.js';
import kingsCup from './games/kings-cup.js';
import whoWroteIt from './games/who-wrote-it.js';
import hotSeat from './games/hot-seat.js';
import deepTalk from './games/deep-talk.js';
import secretMissions from './games/secret-missions.js';
import shoeGame from './games/shoe-game.js';
import werewolf from './games/werewolf.js';
import teamSplitter from './games/team-splitter.js';

const SECTIONS = [
  { title: '🕵️ Bluff & Guess', games: [imposter, headsUp, taboo, wavelength, fibbage] },
  { title: '💍 Get to Know Each Other', games: [whoWroteIt, hotSeat, deepTalk, secretMissions, shoeGame, werewolf, teamSplitter] },
  { title: '💬 Talk & Confess', games: [mostLikely, neverHaveI, truthOrDare, wouldYouRather, paranoia] },
  { title: '⚡ Action', games: [hotPotato, fiveSeconds, stopAtTen, spinTheBottle] },
  { title: '🍺 Drinking', games: [kingsCup] },
];

const app = document.getElementById('app');
let players = loadPlayers();
let settings = loadSettings();
let cleanup = null;

setSoundEnabled(settings.sound);
document.addEventListener('pointerdown', unlockAudio);

// Every sub-screen pushes a history entry, so the Android back button
// (and our × button, which calls history.back()) returns to the menu.
function openScreen(render) {
  history.pushState({ sub: true }, '');
  render();
}

window.addEventListener('popstate', () => {
  if (players.length >= MIN_PLAYERS) showMenu();
  else showSetup();
});

function closeButton() {
  return el('button', { class: 'close', type: 'button', 'aria-label': 'Back to menu', onclick: () => history.back() }, '×');
}

function runCleanup() {
  cleanup?.();
  cleanup = null;
  document.body.style.removeProperty('--accent');
}

function showSetup() {
  runCleanup();
  const names = players.length ? [...players] : ['', '', ''];
  const list = el('div', { class: 'stack' });
  const error = el('p', { class: 'error', role: 'alert' });

  const addButton = button('', () => addPlayer(), 'add-player');

  function addPlayer() {
    if (names.length >= MAX_PLAYERS) return;
    names.push('');
    renderList();
    list.lastChild.querySelector('input').focus();
  }

  function renderList() {
    const canRemove = names.length > MIN_PLAYERS;
    list.replaceChildren(...names.map((name, i) =>
      el('div', { class: 'name-row' },
        el('span', { class: 'name-num' }, i + 1),
        el('input', {
          type: 'text',
          value: name,
          placeholder: `Player ${i + 1}`,
          maxlength: 20,
          autocomplete: 'off',
          enterkeyhint: 'next',
          'aria-label': `Player ${i + 1} name`,
          oninput: (e) => { names[i] = e.target.value; },
          // Enter jumps to the next name, or adds a new row after the last one.
          onkeydown: (e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            const next = list.children[i + 1];
            if (next) next.querySelector('input').focus();
            else if (names.length < MAX_PLAYERS) addPlayer();
          },
        }),
        el('button', {
          class: 'remove-btn',
          type: 'button',
          disabled: !canRemove,
          title: canRemove ? `Remove ${name || `player ${i + 1}`}` : `At least ${MIN_PLAYERS} players`,
          'aria-label': `Remove ${name || `player ${i + 1}`}`,
          onclick: () => { names.splice(i, 1); renderList(); },
        }, '✕'),
      ),
    ));
    addButton.textContent = names.length < MAX_PLAYERS
      ? `＋ Add player (${names.length}/${MAX_PLAYERS})`
      : `Full — ${MAX_PLAYERS} players max`;
    addButton.disabled = names.length >= MAX_PLAYERS;
  }
  renderList();

  mount(app,
    el('section', { class: 'screen stack' },
      players.length >= MIN_PLAYERS && closeButton(),
      el('h1', { class: 'logo' }, 'Arianna &', el('br'), "Sebastian's", el('br'), 'Party Games'),
      el('h2', { class: 'setup-title' }, `Who's playing? (${MIN_PLAYERS}–${MAX_PLAYERS})`),
      el('p', { class: 'muted tiny' }, 'Type a name and press Enter for the next one. Tap ✕ to remove someone.'),
      list,
      addButton,
      error,
      button("Let's go", () => {
        const clean = cleanNames(names);
        if (clean.length < MIN_PLAYERS) {
          error.textContent = `Need at least ${MIN_PLAYERS} different names.`;
          return;
        }
        players = clean;
        savePlayers(players);
        if (history.state?.sub) history.back();
        else showMenu();
      }, 'primary'),
    ),
  );
}

function showSettings() {
  runCleanup();
  const toggle = (key, label, hint) =>
    el('label', { class: 'toggle' },
      el('span', {}, el('strong', {}, label), el('small', {}, hint)),
      el('input', {
        type: 'checkbox',
        checked: settings[key],
        onchange: (e) => {
          settings = { ...settings, [key]: e.target.checked };
          saveSettings(settings);
          setSoundEnabled(settings.sound);
        },
      }),
    );

  mount(app,
    el('section', { class: 'screen stack' },
      closeButton(),
      el('h1', {}, 'Settings'),
      el('p', { class: 'muted' }, 'These apply to every game and are saved on this phone.'),
      toggle('drinking', 'Drinking rules', 'Adds who-drinks-what to results. Off: points and dares instead'),
      toggle('spicy', 'Spicy mode', 'Adds 18+ cards: sex, embarrassment, exes. Off by default'),
      toggle('sound', 'Sound & vibration', 'Timers, buzzers and reveals'),
    ),
  );
}

// Shown on the menu until dismissed, so first-time players find the settings.
function settingsTip() {
  if (loadSeen('settings-tip')) return null;
  const tip = el('div', { class: 'tip' },
    el('strong', {}, '👋 New here? Set up your night in ⚙ Settings:'),
    el('ul', {},
      el('li', {}, '🌶 ', el('b', {}, 'Spicy mode'), ' adds 18+ cards (sex, embarrassment, exes). Off by default.'),
      el('li', {}, '🍺 ', el('b', {}, 'Drinking rules'), ' add who-drinks-what. Turn off for a sober crowd.'),
      el('li', {}, '🔊 ', el('b', {}, 'Sound & vibration'), ' for timers and buzzers.'),
    ),
    el('div', { class: 'btn-row' },
      button('Open settings', () => { markSeen('settings-tip'); openScreen(showSettings); }, 'primary'),
      button('Got it', () => { markSeen('settings-tip'); tip.remove(); }),
    ),
  );
  return tip;
}

function showMenu() {
  runCleanup();
  mount(app,
    el('section', { class: 'screen stack' },
      el('header', { class: 'menu-head' },
        el('h1', { class: 'logo small' }, "Arianna & Sebastian's", el('br'), 'Party Games'),
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Settings', onclick: () => openScreen(showSettings) }, '⚙'),
      ),
      el('button', { class: 'players-chip', type: 'button', onclick: () => openScreen(showSetup) },
        el('span', { class: 'players-names' }, `👥 ${players.length} players: ${players.join(', ')}`),
        el('span', { class: 'players-edit' }, '✏️ Add or remove players'),
      ),
      settingsTip(),
      SECTIONS.map(({ title, games }) => [
        el('h2', { class: 'section-title' }, title),
        el('div', { class: 'tiles' },
          games.map((game) =>
            el('button', {
              class: 'tile',
              type: 'button',
              style: { '--accent': game.color },
              onclick: () => openScreen(() => showRules(game)),
            },
              el('span', { class: 'tile-emoji' }, game.emoji),
              el('span', { class: 'tile-title' }, game.title),
            ),
          ),
        ),
      ]),
      el('p', { class: 'muted tiny' },
        settings.drinking ? '🍺 Drinking on' : 'Drinking off', ' · ',
        settings.spicy ? '🌶 Spicy' : 'Mild',
      ),
    ),
  );
}

function showRules(game) {
  runCleanup();
  document.body.style.setProperty('--accent', game.color);
  mount(app,
    el('section', { class: 'screen stack game' },
      closeButton(),
      el('div', { class: 'center stack' },
        el('div', { class: 'big-emoji' }, game.emoji),
        el('h1', {}, game.title),
        el('p', { class: 'rules' }, game.rules),
        button('Start', () => startGame(game), 'primary'),
      ),
    ),
  );
}

function startGame(game) {
  const stage = el('div', { class: 'stage' });
  mount(app, el('section', { class: 'screen game' }, closeButton(), stage));
  document.body.style.setProperty('--accent', game.color);
  cleanup = game.start(stage, { players, settings }) ?? null;
}

if (players.length >= MIN_PLAYERS) showMenu();
else showSetup();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
