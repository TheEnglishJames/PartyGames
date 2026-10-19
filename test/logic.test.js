import { describe, it, expect } from 'vitest';
import { createDeck } from '../src/lib/deck.js';
import { classifyTilt } from '../src/games/heads-up.js';
import { rankByDistance } from '../src/games/stop-at-ten.js';
import { wavelengthScore } from '../src/games/wavelength.js';
import { buildOptions, normalize } from '../src/games/fibbage.js';
import { buildDeck, KINGS } from '../src/games/kings-cup.js';
import { assignRoles, winner } from '../src/games/werewolf.js';
import { dealMissions } from '../src/games/secret-missions.js';
import { pickImposters, imposterCount, nextPlayer, cleanNames, splitTeams } from '../src/lib/players.js';

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

describe('stop at 10', () => {
  it('ranks by distance to the target, either side', () => {
    const ranked = rankByDistance([
      { name: 'A', time: 11.5 }, { name: 'B', time: 9.9 }, { name: 'C', time: 8 }, { name: 'D', time: 10.3 },
    ]);
    expect(ranked.map((r) => r.name)).toEqual(['B', 'D', 'A', 'C']);
  });
});

describe('wavelengthScore', () => {
  it('scores 4/3/2/0 by distance', () => {
    expect(wavelengthScore(50, 50)).toBe(4);
    expect(wavelengthScore(50, 54)).toBe(4);
    expect(wavelengthScore(50, 40)).toBe(3);
    expect(wavelengthScore(50, 66)).toBe(2);
    expect(wavelengthScore(50, 67)).toBe(0);
  });
});

describe('fibbage buildOptions', () => {
  it('includes the truth once and merges duplicate lies', () => {
    const options = buildOptions('aglet', [
      { author: 'Anna', text: 'Shoe nib' },
      { author: 'Ben', text: 'shoe  nib!' },
      { author: 'Cleo', text: 'Lace cap' },
    ]);
    expect(options).toHaveLength(3);
    expect(options.filter((o) => o.real)).toEqual([{ text: 'aglet', authors: [], real: true }]);
    expect(options.find((o) => normalize(o.text) === 'shoe nib').authors).toEqual(['Anna', 'Ben']);
  });
});

describe('splitTeams', () => {
  it('splits everyone into two near-equal teams', () => {
    for (let n = 3; n <= 10; n++) {
      const players = Array.from({ length: n }, (_, i) => `P${i}`);
      const [a, b] = splitTeams(players);
      expect(a.length - b.length).toBeGreaterThanOrEqual(0);
      expect(a.length - b.length).toBeLessThanOrEqual(1);
      expect([...a, ...b].sort()).toEqual([...players].sort());
    }
  });
});

describe('splitTeams with crowds', () => {
  it('makes n even teams and spreads each crowd across them', () => {
    const players = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1'];
    for (let run = 0; run < 50; run++) {
      const teams = splitTeams(players, 2, (p) => p[0]);
      expect(teams.map((t) => t.length).sort()).toEqual([4, 5]);
      for (const t of teams) {
        expect(t.filter((p) => p[0] === 'A')).toHaveLength(2);
        expect(t.filter((p) => p[0] === 'B')).toHaveLength(2);
      }
      const three = splitTeams(players, 3);
      expect(three.map((t) => t.length)).toEqual([3, 3, 3]);
      expect(three.flat().sort()).toEqual([...players].sort());
    }
  });
});

describe('werewolf', () => {
  it('deals the right roles for each group size', () => {
    for (let n = 3; n <= 10; n++) {
      const roles = assignRoles(n);
      const count = (r) => roles.filter((x) => x === r).length;
      expect(roles).toHaveLength(n);
      expect(count('wolf')).toBe(n >= 7 ? 2 : 1);
      expect(count('seer')).toBe(n >= 4 ? 1 : 0);
      expect(count('doctor')).toBe(n >= 5 ? 1 : 0);
    }
  });

  it('ends when wolves are gone or equal the rest', () => {
    const roles = ['wolf', 'seer', 'villager', 'villager'];
    expect(winner(roles, new Set([0, 1, 2, 3]))).toBe(null);
    expect(winner(roles, new Set([0, 1]))).toBe('wolves');
    expect(winner(roles, new Set([1, 2]))).toBe('village');
  });
});

describe('dealMissions', () => {
  it('gives every player a different mission', () => {
    const players = ['A', 'B', 'C', 'D'];
    const missions = dealMissions(players, createDeck(['m1', 'm2', 'm3', 'm4', 'm5']).draw);
    expect(Object.keys(missions)).toEqual(players);
    expect(new Set(Object.values(missions)).size).toBe(4);
  });
});

describe("King's Cup deck", () => {
  it('has 52 unique cards with 4 kings', () => {
    const deck = buildDeck();
    expect(new Set(deck.map((c) => c.rank + c.suit)).size).toBe(52);
    expect(deck.filter((c) => c.rank === 'K')).toHaveLength(KINGS);
  });
});

describe('content', () => {
  it('has well-formed entries', async () => {
    const taboo = (await import('../src/content/taboo.js')).default;
    const fibbage = (await import('../src/content/fibbage.js')).default;
    const pairs = (await import('../src/content/undercover.js')).default;
    const spectra = (await import('../src/content/wavelength.js')).default;
    const wyr = (await import('../src/content/would-you-rather.js')).default;
    for (const card of taboo) expect(card).toHaveLength(6);
    for (const f of fibbage) expect(f.q).toContain('___');
    const hotSeat = (await import('../src/content/hot-seat.js')).default;
    const missions = (await import('../src/content/secret-missions.js')).default;
    const deepTalk = (await import('../src/content/deep-talk.js')).default;
    for (const p of [...pairs, ...spectra, ...wyr.mild, ...wyr.spicy, ...hotSeat.mild, ...hotSeat.spicy]) expect(p).toHaveLength(2);
    // Secret Missions needs a different mission for each of up to 10 players.
    expect(missions.mild.length).toBeGreaterThanOrEqual(10);
    for (const questions of Object.values(deepTalk)) expect(questions.length).toBeGreaterThan(0);
  });
});

describe('cleanNames', () => {
  it('trims, drops empties and duplicates', () => {
    expect(cleanNames([' Anna ', '', 'anna', 'Ben', '  '])).toEqual(['Anna', 'Ben']);
  });
});
