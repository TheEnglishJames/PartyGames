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

// Emoji fireworks from the centre of an element; cleans itself up.
export function burst(target, emojis = ['🎉', '✨', '💥', '🥂', '🔥']) {
  const r = target.getBoundingClientRect();
  const layer = el('div', { class: 'burst', style: { left: `${r.left + r.width / 2}px`, top: `${r.top + r.height / 2}px` } },
    Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 50 + Math.random() * 40;
      return el('span', {
        style: { '--dx': `${Math.cos(angle) * dist}px`, '--dy': `${Math.sin(angle) * dist}px` },
      }, emojis[i % emojis.length]);
    }));
  document.body.append(layer);
  setTimeout(() => layer.remove(), 800);
}
