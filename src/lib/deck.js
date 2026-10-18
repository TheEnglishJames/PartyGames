export function shuffle(items, rng = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Draws every item once in random order before any item repeats.
// A reshuffle never starts with the item that ended the previous pass.
export function createDeck(items, rng = Math.random) {
  if (items.length === 0) throw new Error('Deck needs at least one item');
  let pile = [];
  let last;
  return {
    draw() {
      if (pile.length === 0) {
        pile = shuffle(items, rng);
        if (pile.length > 1 && pile[pile.length - 1] === last) {
          [pile[0], pile[pile.length - 1]] = [pile[pile.length - 1], pile[0]];
        }
      }
      last = pile.pop();
      return last;
    },
  };
}

// Decks live for the whole app session so leaving and re-entering a game
// does not bring back cards you just saw.
const cache = new Map();
export function sessionDeck(key, items) {
  if (!cache.has(key)) cache.set(key, createDeck(items));
  return cache.get(key);
}
