import { describe, it, expect } from 'vitest';
import { createDeck } from '../src/lib/deck.js';
import { classifyTilt } from '../src/games/heads-up.js';
import { pickImposters, imposterCount, nextPlayer, cleanNames } from '../src/lib/players.js';

describe('createDeck', () => {
  it('draws every item once before repeating', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const deck = createDeck(items);
    for (let pass = 0; pass < 20; pass++) {
      const drawn = items.map(() => deck.draw());
      expect([...drawn].sort()).toEqual(items);
    }
  });

  it('never repeats a card across a reshuffle', () => {
    const deck = createDeck(['a', 'b', 'c']);
    let prev = deck.draw();
    for (let i = 0; i < 300; i++) {
      const card = deck.draw();
      expect(card).not.toBe(prev);
      prev = card;
    }
  });

  it('works with a single item', () => {
    const deck = createDeck(['x']);
    expect([deck.draw(), deck.draw()]).toEqual(['x', 'x']);
  });

  it('rejects an empty deck', () => {
    expect(() => createDeck([])).toThrow();
  });
});

describe('imposters', () => {
  it('uses 1 imposter below 7 players, 2 from 7', () => {
    expect(imposterCount(3)).toBe(1);
    expect(imposterCount(6)).toBe(1);
    expect(imposterCount(7)).toBe(2);
    expect(imposterCount(10)).toBe(2);
  });

  it('picks distinct, valid indices', () => {
    for (let n = 3; n <= 10; n++) {
      for (let i = 0; i < 50; i++) {
        const set = pickImposters(n);
        expect(set.size).toBe(imposterCount(n));
        for (const idx of set) expect(idx >= 0 && idx < n).toBe(true);
      }
    }
  });
});

describe('nextPlayer', () => {
  it('never picks the same player twice in a row and reaches everyone', () => {
    let prev = null;
    const seen = new Set();
    for (let i = 0; i < 500; i++) {
      const p = nextPlayer(4, prev);
      expect(p).not.toBe(prev);
      expect(p >= 0 && p < 4).toBe(true);
      seen.add(p);
      prev = p;
    }
    expect(seen.size).toBe(4);
  });
});

describe('classifyTilt', () => {
  it('reads upright, face-up and face-down positions in either landscape direction', () => {
    expect(classifyTilt(0, 88)).toBe('neutral');
    expect(classifyTilt(175, -85)).toBe('neutral');
    expect(classifyTilt(5, 20)).toBe('up');
    expect(classifyTilt(-3, -30)).toBe('up');
    expect(classifyTilt(170, -25)).toBe('down');
    expect(classifyTilt(-165, 30)).toBe('down');
    expect(classifyTilt(0, 55)).toBe('between');
  });
});

describe('cleanNames', () => {
  it('trims, drops empties and duplicates', () => {
    expect(cleanNames([' Anna ', '', 'anna', 'Ben', '  '])).toEqual(['Anna', 'Ben']);
  });
});
