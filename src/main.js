import './style.css';
import { el, button, mount } from './lib/ui.js';
import { loadPlayers, savePlayers, loadSettings, saveSettings } from './lib/storage.js';
import { cleanNames, MIN_PLAYERS, MAX_PLAYERS } from './lib/players.js';
import { unlockAudio, setSoundEnabled } from './lib/sound.js';
import imposter from './games/imposter.js';
import hotPotato from './games/hot-potato.js';
import headsUp from './games/heads-up.js';
import mostLikely from './games/most-likely.js';
import truthOrDare from './games/truth-or-dare.js';
import neverHaveI from './games/never-have-i.js';

const GAMES = [imposter, hotPotato, headsUp, mostLikely, truthOrDare, neverHaveI];

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

  function renderList() {
    list.replaceChildren(...names.map((name, i) =>
      el('div', { class: 'name-row' },
        el('input', {
          type: 'text',
          value: name,
          placeholder: `Player ${i + 1}`,
          maxlength: 20,
          autocomplete: 'off',
          'aria-label': `Player ${i + 1} name`,
          oninput: (e) => { names[i] = e.target.value; },
        }),
        names.length > MIN_PLAYERS &&
          el('button', { class: 'icon-btn', type: 'button', 'aria-label': `Remove player ${i + 1}`, onclick: () => { names.splice(i, 1); renderList(); } }, '−'),
      ),
    ));
  }
  renderList();

  mount(app,
    el('section', { class: 'screen stack' },
      players.length >= MIN_PLAYERS && closeButton(),
      el('h1', { class: 'logo' }, 'Pass the', el('br'), 'Phone'),
      el('p', { class: 'muted' }, `Who's playing? (${MIN_PLAYERS}–${MAX_PLAYERS})`),
      list,
      button('+ Add player', () => {
        if (names.length < MAX_PLAYERS) {
          names.push('');
          renderList();
          list.lastChild.querySelector('input').focus();
        }
      }, 'ghost'),
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
      toggle('drinking', 'Drinking rules', 'Adds who-drinks-what to results'),
      toggle('spicy', 'Spicy mode', 'Adds 18+ cards: sex, embarrassment, exes'),
      toggle('sound', 'Sound & vibration', ''),
    ),
  );
}

function showMenu() {
  runCleanup();
  mount(app,
    el('section', { class: 'screen stack' },
      el('header', { class: 'menu-head' },
        el('h1', { class: 'logo small' }, 'Pass the Phone'),
        el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Settings', onclick: () => openScreen(showSettings) }, '⚙'),
      ),
      el('button', { class: 'players-chip', type: 'button', onclick: () => openScreen(showSetup) },
        `👥 ${players.join(', ')}`, el('span', { class: 'muted' }, ' · edit'),
      ),
      el('div', { class: 'tiles' },
        GAMES.map((game) =>
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
