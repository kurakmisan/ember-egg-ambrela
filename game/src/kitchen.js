// Kitchen: the physical stations and what sits on them.
// The chopping board holds one item while it is chopped, each burner holds one
// item in a pan while it cooks (and burns if forgotten), the plating counter
// holds the plate being assembled. All timers tick here.
import { GAME, INGREDIENTS, STATIONS } from './config.js';

export class Kitchen {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = { item: null, progress: 0, done: false };
    this.burners = [
      { item: null, progress: 0, done: false, burnt: false, burnTimer: 0 },
      { item: null, progress: 0, done: false, burnt: false, burnTimer: 0 },
    ];
    this.plate = { components: [] };
    this.steam = [];
  }

  update(dt, onEvent) {
    // Chopping board: progress while an item sits on it.
    if (this.board.item && !this.board.done) {
      this.board.progress += dt / GAME.chopSeconds;
      if (this.board.progress >= 1) {
        this.board.done = true;
        this.board.item.state = 'chopped';
        if (onEvent) onEvent('chopDone');
      }
    }
    // Burners: cook, then burn if left too long.
    this.burners.forEach((b, i) => {
      if (!b.item) return;
      if (!b.done) {
        b.progress += dt / GAME.cookSeconds;
        if (b.progress >= 1) {
          b.done = true;
          b.item.state = 'cooked';
          b.burnTimer = GAME.burnSeconds;
          if (onEvent) onEvent('cooked', i);
        }
      } else if (!b.burnt) {
        b.burnTimer -= dt;
        if (b.burnTimer <= 0) {
          b.burnt = true;
          b.item.state = 'burnt';
          if (onEvent) onEvent('burnt', i);
        }
      }
    });
    // Steam puffs above hot pans.
    for (const b of this.burners) {
      if (b.item && Math.random() < dt * 6) {
        this.steam.push({ x: 0, y: 0, life: 0.8, max: 0.8, burner: this.burners.indexOf(b) });
      }
    }
    for (const s of this.steam) s.life -= dt;
    this.steam = this.steam.filter((s) => s.life > 0);
  }

  // --- chopping board ---
  placeOnBoard(item) {
    if (this.board.item) return false;
    if (!INGREDIENTS[item.kind].choppable) return false;
    if (item.state !== 'raw') return false;
    this.board.item = item;
    this.board.progress = 0;
    this.board.done = false;
    return true;
  }

  takeFromBoard() {
    if (!this.board.item || !this.board.done) return null;
    const item = this.board.item;
    this.board.item = null;
    this.board.progress = 0;
    this.board.done = false;
    return item;
  }

  // --- burners ---
  placeOnBurner(item) {
    if (!INGREDIENTS[item.kind].cookable) return false;
    if (item.state === 'cooked' || item.state === 'burnt') return false;
    const free = this.burners.find((b) => !b.item);
    if (!free) return false;
    free.item = item;
    free.progress = 0;
    free.done = false;
    free.burnt = false;
    free.burnTimer = 0;
    return true;
  }

  takeFromBurner(index) {
    const b = this.burners[index];
    if (!b || !b.item || !b.done) return null;
    const item = b.item;
    b.item = null;
    b.progress = 0;
    b.done = false;
    b.burnt = false;
    return item;
  }

  clearBurner(index) {
    const b = this.burners[index];
    if (!b || !b.item) return false;
    b.item = null;
    b.progress = 0;
    b.done = false;
    b.burnt = false;
    return true;
  }

  // --- plating counter ---
  addToPlate(item) {
    if (this.plate.components.length >= 3) return false;
    if (item.state !== 'cooked') return false;
    this.plate.components.push({ kind: item.kind, state: item.state });
    return true;
  }

  takePlate() {
    if (this.plate.components.length === 0) return null;
    const plate = { components: this.plate.components.slice() };
    this.plate.components = [];
    return plate;
  }

  plateSummary() {
    return this.plate.components.map((c) => c.kind).join('+');
  }

  stationRects() {
    const rects = [];
    for (const c of STATIONS.crates) rects.push({ ...c, type: 'crate' });
    rects.push({ ...STATIONS.board, type: 'board' });
    for (const s of STATIONS.stove) rects.push({ ...s, type: 'burner', index: STATIONS.stove.indexOf(s) });
    rects.push({ ...STATIONS.plating, type: 'plating' });
    rects.push({ ...STATIONS.window, type: 'window' });
    rects.push({ ...STATIONS.trash, type: 'trash' });
    rects.push({ ...STATIONS.sink, type: 'sink' });
    return rects;
  }
}
