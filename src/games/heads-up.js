import { el, button, mount, drinkNote, keepAwake } from '../lib/ui.js';
import { sessionDeck } from '../lib/deck.js';
import { sfx, vibrate } from '../lib/sound.js';
import decks from '../content/heads-up.js';

const ROUND_SECONDS = 60;
const DECKS = Object.keys(decks);

// Phone held sideways against the forehead: |gamma| ≈ 90.
// Tilting away from vertical drops |gamma|; beta tells which way
// (|beta| < 90 → screen facing the ceiling, otherwise facing the floor).
const TRIGGER_GAMMA = 45;
const NEUTRAL_GAMMA = 65;

export function classifyTilt(beta, gamma) {
  const g = Math.abs(gamma);
  if (g > NEUTRAL_GAMMA) return 'neutral';
  if (g < TRIGGER_GAMMA) return Math.abs(beta) < 90 ? 'up' : 'down';
  return 'between';
}

async function requestMotionPermission() {
  const DOE = window.DeviceOrientationEvent;
  if (typeof DOE?.requestPermission !== 'function') return true;
  try {
    return (await DOE.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

async function enterLandscape() {
  try {
    await document.documentElement.requestFullscreen?.();
    await screen.orientation?.lock?.('landscape');
  } catch {
    /* iOS & desktop: CSS rotation fallback in .headsup.landscape */
  }
}

function exitLandscape() {
  try {
    screen.orientation?.unlock?.();
  } catch { /* ignore */ }
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

export default {
  id: 'heads-up',
  title: 'Heads Up',
  emoji: '🤔',
  color: '#3ddc84',
  rules: 'Hold the phone to your forehead, screen facing out. Your friends explain the word. Tilt down if you got it, tilt up to pass. 60 seconds!',
  start(stage, { players, settings }) {
    let alive = true;
    let deckName = DECKS[0];
    let turn = 0;
    let teardown = () => {};

    function pickDeck() {
      mount(stage,
        el('div', { class: 'center stack' },
          el('h2', {}, 'Pick a deck'),
          el('div', { class: 'chips' },
            DECKS.map((name) =>
              el('button', {
                class: 'chip',
                type: 'button',
                'aria-pressed': String(name === deckName),
                onclick: () => { deckName = name; pickDeck(); },
              }, name),
            ),
          ),
          button('Continue', ready, 'primary'),
        ),
      );
    }

    function ready() {
      const player = players[turn % players.length];
      mount(stage,
        el('div', { class: 'center stack' },
          el('p', { class: 'muted' }, `${deckName} · guesser:`),
          el('h2', { class: 'huge' }, player),
          el('p', { class: 'rules' }, 'Tap start, then put the phone on your forehead sideways.'),
          button('Start', start, 'primary'),
          button('Change deck', pickDeck),
        ),
      );
    }

    async function start() {
      const motionAllowed = await requestMotionPermission();
      await enterLandscape();
      const release = await keepAwake();
      if (!alive) return release(), exitLandscape();
      const deck = sessionDeck(`heads-up:${deckName}`, decks[deckName]);
      const results = [];
      let word = null;
      let armed = false; // must return to neutral between answers
      let remaining = ROUND_SECONDS;
      let interval = null;
      let flashTimer = null;
      let countdown = 3;

      const timerEl = el('div', { class: 'timer' });
      const wordEl = el('div', { class: 'word' });
      const zones = el('div', { class: 'tap-zones' },
        button('Pass', () => answer(false)),
        button('Got it', () => answer(true)),
      );
      const quit = el('button', { class: 'close', type: 'button', 'aria-label': 'Back to menu', onclick: () => history.back() }, '×');
      const root = el('div', { class: 'headsup landscape' }, quit, timerEl, wordEl, zones);
      zones.hidden = true;
      document.body.append(root);

      function nextWord() {
        word = deck.draw();
        wordEl.textContent = word;
      }

      function answer(correct) {
        if (!word || flashTimer) return;
        results.push({ word, correct });
        word = null;
        armed = false;
        (correct ? sfx.correct : sfx.skip)();
        vibrate(correct ? 80 : [40, 40, 40]);
        root.classList.add(correct ? 'flash-ok' : 'flash-skip');
        wordEl.textContent = correct ? 'Correct!' : 'Pass';
        flashTimer = setTimeout(() => {
          flashTimer = null;
          root.classList.remove('flash-ok', 'flash-skip');
          if (remaining > 0) nextWord();
        }, 700);
      }

      function onOrientation(e) {
        if (e.beta == null || e.gamma == null) return;
        const tilt = classifyTilt(e.beta, e.gamma);
        if (tilt === 'neutral') armed = true;
        else if (armed && word && (tilt === 'down' || tilt === 'up')) answer(tilt === 'down');
      }

      function tick() {
        if (countdown > 0) {
          timerEl.textContent = '';
          wordEl.textContent = countdown;
          sfx.tick();
          countdown--;
          return;
        }
        if (!word && remaining === ROUND_SECONDS && !results.length) {
          zones.hidden = false;
          nextWord();
        }
        timerEl.textContent = remaining;
        if (remaining <= 5) sfx.tick();
        if (remaining-- <= 0) finish();
      }

      function cleanupRound() {
        clearInterval(interval);
        clearTimeout(flashTimer);
        window.removeEventListener('deviceorientation', onOrientation);
        root.remove();
        exitLandscape();
        release();
      }

      function finish() {
        cleanupRound();
        teardown = () => {};
        sfx.end();
        vibrate(300);
        showResults(results);
      }

      if (motionAllowed) window.addEventListener('deviceorientation', onOrientation);
      wordEl.textContent = 'Place on forehead';
      interval = setInterval(tick, 1000);
      teardown = cleanupRound;
    }

    function showResults(results) {
      const score = results.filter((r) => r.correct).length;
      const passes = results.length - score;
      const player = players[turn % players.length];
      turn++;
      mount(stage,
        el('div', { class: 'center stack' },
          el('p', { class: 'muted' }, player),
          el('h2', { class: 'huge' }, `${score} correct`),
          el('ul', { class: 'result-list' },
            results.map((r) => el('li', { class: r.correct ? '' : 'skipped' }, r.correct ? '✓ ' : '✗ ', r.word)),
          ),
          drinkNote(settings, passes ? `${player} drinks ${passes} for ${passes} pass${passes > 1 ? 'es' : ''}.` : null),
          button(`Next: ${players[turn % players.length]}`, ready, 'primary'),
        ),
      );
    }

    pickDeck();
    return () => {
      alive = false;
      teardown();
    };
  },
};
