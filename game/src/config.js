// Ember & Egg — Dapur Perapian: all tuning, recipes and station layout in one place.
// A recipe is a list of components; each component names an ingredient and the state
// it must be in when it lands on the plate. The cook must route every component
// through the right station: crate -> chopping board (if chopped) -> pan (if cooked)
// -> plating counter -> serving window.
export const GAME = {
  width: 1280,
  height: 800,
  shiftSeconds: 180,
  maxOrders: 3,
  maxHearts: 3,
  orderLifetime: 60,
  cookSeconds: 4,
  burnSeconds: 3.5,
  chopSeconds: 1.6,
  playerSpeed: 300,
  playerRadius: 20,
  interactRange: 78,
  spawnIntervalStart: 14,
  spawnIntervalEnd: 8,
  // Star thresholds, calibrated from measured play: one scripted omelet serve
  // (crate -> pan -> plate -> window, with real cook/chop waits) pays ~22 coins
  // in ~40 s, so a steady cook serves ~2 dishes a minute: 1 star ~3 dishes,
  // 2 stars ~6, 3 stars ~8 dishes plus combo bonuses.
  starCoins: [50, 100, 150],
};

export const INGREDIENTS = {
  egg:      { name: 'Telur',   color: '#fff3c4', accent: '#f2c94c', choppable: false, cookable: true,  price: 4 },
  tomato:   { name: 'Tomat',   color: '#ff5a4e', accent: '#2e9e4f', choppable: true,  cookable: true,  price: 3 },
  cheese:   { name: 'Keju',    color: '#ffd23f', accent: '#e8a91c', choppable: false, cookable: true,  price: 4 },
  bread:    { name: 'Roti',    color: '#e8b06a', accent: '#b97a2e', choppable: false, cookable: true,  price: 3 },
  mushroom: { name: 'Jamur',   color: '#f3e6d0', accent: '#8a5a3b', choppable: true,  cookable: true,  price: 4 },
  chili:    { name: 'Cabai',   color: '#e6392b', accent: '#2e9e4f', choppable: true,  cookable: true,  price: 3 },
};

// Every recipe is a real cooking route: some components need chopping, all need the pan.
export const RECIPES = [
  {
    id: 'omelet',
    name: 'Omelet Ember',
    blurb: 'Telur + keju, digoreng di wajan panas.',
    coins: 15,
    components: [
      { kind: 'egg', state: 'cooked' },
      { kind: 'cheese', state: 'cooked' },
    ],
  },
  {
    id: 'sup',
    name: 'Sup Tomat Jamur',
    blurb: 'Tomat & jamur dicincang, lalu direbus.',
    coins: 20,
    components: [
      { kind: 'tomato', state: 'cooked' },
      { kind: 'mushroom', state: 'cooked' },
    ],
  },
  {
    id: 'roti',
    name: 'Roti Keju Panggang',
    blurb: 'Roti panggang dengan keju leleh.',
    coins: 15,
    components: [
      { kind: 'bread', state: 'cooked' },
      { kind: 'cheese', state: 'cooked' },
    ],
  },
  {
    id: 'tumis',
    name: 'Tumis Pedas Jamur',
    blurb: 'Jamur & cabai dicincang, ditumis pedas.',
    coins: 20,
    components: [
      { kind: 'mushroom', state: 'cooked' },
      { kind: 'chili', state: 'cooked' },
    ],
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// True when a plate's components match a recipe exactly (order-insensitive).
export function matchRecipe(components) {
  for (const recipe of RECIPES) {
    if (recipe.components.length !== components.length) continue;
    const pool = recipe.components.map((c) => c.kind + ':' + c.state);
    const got = components.map((c) => c.kind + ':' + c.state);
    if (pool.every((want) => {
      const i = got.indexOf(want);
      if (i === -1) return false;
      got.splice(i, 1);
      return true;
    })) return recipe;
  }
  return null;
}

// Stations: rectangles the cook collides with, plus an interaction point.
// x/y/w/h are the counter body; ix/iy is where the cook stands to use it.
export const STATIONS = {
  crates: [
    { kind: 'egg', label: 'Telur', x: 60, y: 640, w: 120, h: 90 },
    { kind: 'tomato', label: 'Tomat', x: 200, y: 640, w: 120, h: 90 },
    { kind: 'cheese', label: 'Keju', x: 340, y: 640, w: 120, h: 90 },
    { kind: 'bread', label: 'Roti', x: 480, y: 640, w: 120, h: 90 },
    { kind: 'mushroom', label: 'Jamur', x: 620, y: 640, w: 120, h: 90 },
    { kind: 'chili', label: 'Cabai', x: 760, y: 640, w: 120, h: 90 },
  ],
  board: { id: 'board', label: 'Talenan', x: 940, y: 620, w: 150, h: 110 },
  stove: [
    { id: 'burner0', label: 'Kompor 1', x: 940, y: 420, w: 150, h: 110 },
    { id: 'burner1', label: 'Kompor 2', x: 940, y: 300, w: 150, h: 110 },
  ],
  plating: { id: 'plating', label: 'Meja Rakit', x: 60, y: 300, w: 170, h: 110 },
  window: { id: 'window', label: 'Jendela Saji', x: 60, y: 150, w: 170, h: 80 },
  trash: { id: 'trash', label: 'Tempat Sampah', x: 1120, y: 640, w: 100, h: 90 },
  sink: { id: 'sink', label: 'Wastafel', x: 1120, y: 150, w: 100, h: 80 },
};

export const COLORS = {
  floorA: '#b98a56',
  floorB: '#a87a4a',
  wall: '#7a4a2b',
  wallTop: '#5d3620',
  counter: '#8a5a3b',
  counterTop: '#c98f5f',
  board: '#2b2b33',
  boardEdge: '#f2c94c',
  cream: '#fff6e0',
  ink: '#2b2118',
  red: '#e6392b',
  green: '#2e9e4f',
  gold: '#f2c94c',
};
