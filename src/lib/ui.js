import { sfx } from './sound.js';

// Tiny DOM builder: el('button', { class: 'btn', onclick }, 'Go')
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'style' && typeof value === 'object') {
      for (const [prop, v] of Object.entries(value)) {
        if (prop.startsWith('--')) node.style.setProperty(prop, v);
        else node.style[prop] = v;
      }
    }
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : String(child));
  }
  return node;
}

export function button(label, onClick, cls = '') {
  return el('button', {
    class: `btn ${cls}`,
    type: 'button',
    onclick: (e) => {
      sfx.tap();
      onClick(e);
    },
  }, label);
}

export function mount(root, ...children) {
  root.replaceChildren(...children);
}

// "Pass the phone to X" interstitial so the next person doesn't see the previous screen.
export function passScreen(root, name, onReady, hint = 'Tap when you have the phone') {
  mount(root,
    el('div', { class: 'center stack' },
      el('p', { class: 'muted' }, 'Pass the phone to'),
      el('h2', { class: 'huge' }, name),
      button(hint, onReady, 'primary'),
    ),
  );
}

export function drinkNote(settings, withDrinks, without = null) {
  const text = settings.drinking ? withDrinks : without;
  return text ? el('p', { class: 'drink' }, settings.drinking ? `🍺 ${text}` : text) : null;
}

// Keeps the screen awake during timed games; silently unsupported on old browsers.
export async function keepAwake() {
  try {
    const lock = await navigator.wakeLock?.request('screen');
    return () => lock?.release().catch(() => {});
  } catch {
    return () => {};
  }
}
