// Cook: the player character — movement with counter collision, carrying one
// thing at a time, and the context action for the nearest station.
// Carried things: a single ingredient item, or a plate (a dish being carried).
import { GAME, INGREDIENTS, STATIONS } from './config.js';
import { matchRecipe } from './config.js';

function rectsOverlapCircle(r, cx, cy, rad) {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < rad * rad;
}

export class Cook {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 640;
    this.y = 480;
    this.dir = 'down';
    this.moving = false;
    this.carrying = null; // {type:'item', item} | {type:'plate', plate}
    this.walkPhase = 0;
  }

  update(dt, input, kitchen, solids) {
    const a = input.axis();
    this.moving = a.x !== 0 || a.y !== 0;
    if (this.moving) {
      if (Math.abs(a.x) > Math.abs(a.y)) this.dir = a.x > 0 ? 'right' : 'left';
      else this.dir = a.y > 0 ? 'down' : 'up';
      this.walkPhase += dt * 10;
    }
    const step = GAME.playerSpeed * dt;
    const nx = this.x + a.x * step;
    const ny = this.y + a.y * step;
    const r = GAME.playerRadius;
    const inBounds = (x, y) => x > 30 + r && x < GAME.width - 30 - r && y > 150 + r && y < GAME.height - 30 - r;
    const hitsSolid = (x, y) => solids.some((s) => rectsOverlapCircle(s, x, y, r - 2));
    if (inBounds(nx, this.y) && !hitsSolid(nx, this.y)) this.x = nx;
    if (inBounds(this.x, ny) && !hitsSolid(this.x, ny)) this.y = ny;
  }

  // The station the cook can reach right now (nearest centre within range).
  nearestStation(kitchen) {
    let best = null;
    let bestD = GAME.interactRange;
    const consider = (rect, type, extra) => {
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      const d = Math.hypot(this.x - cx, this.y - cy);
      if (d < bestD) { bestD = d; best = { ...rect, type, ...extra }; }
    };
    for (const c of STATIONS.crates) consider(c, 'crate');
    consider(STATIONS.board, 'board');
    STATIONS.stove.forEach((s, i) => consider(s, 'burner', { index: i }));
    consider(STATIONS.plating, 'plating');
    consider(STATIONS.window, 'window');
    consider(STATIONS.trash, 'trash');
    consider(STATIONS.sink, 'sink');
    return best;
  }

  // One context action. Returns a message for the HUD toast, or null.
  interact(kitchen, orders, elapsed) {
    const st = this.nearestStation(kitchen);
    if (!st) return { ok: false, msg: 'Mendekatlah ke meja atau peti dulu.' };
    const held = this.carrying;

    if (st.type === 'crate') {
      if (held) return { ok: false, msg: 'Tangan penuh — letakkan dulu.' };
      this.carrying = { type: 'item', item: { kind: st.kind, state: 'raw' } };
      return { ok: true, msg: 'Mengambil ' + INGREDIENTS[st.kind].name + '.', sound: 'pickup' };
    }

    if (st.type === 'board') {
      if (held && held.type === 'item') {
        if (kitchen.placeOnBoard(held.item)) {
          this.carrying = null;
          return { ok: true, msg: 'Mencincang ' + INGREDIENTS[held.item.kind].name + '…', sound: 'place' };
        }
        return { ok: false, msg: 'Bahan ini tidak perlu dicincang.', sound: 'error' };
      }
      if (!held) {
        const item = kitchen.takeFromBoard();
        if (item) {
          this.carrying = { type: 'item', item };
          return { ok: true, msg: INGREDIENTS[item.kind].name + ' cincang siap.', sound: 'pickup' };
        }
        return { ok: false, msg: 'Talenan kosong.' };
      }
      return { ok: false, msg: 'Tangan penuh.' };
    }

    if (st.type === 'burner') {
      const b = kitchen.burners[st.index];
      if (held && held.type === 'item') {
        if (b.item && b.burnt) return { ok: false, msg: 'Wajan gosong — buang dulu ke sampah.', sound: 'error' };
        if (kitchen.placeOnBurner(held.item)) {
          this.carrying = null;
          return { ok: true, msg: 'Memasak ' + INGREDIENTS[held.item.kind].name + '…', sound: 'place' };
        }
        return { ok: false, msg: 'Wajan penuh atau bahan ini tidak dimasak.', sound: 'error' };
      }
      if (!held) {
        if (b.item && b.burnt) {
          kitchen.clearBurner(st.index);
          return { ok: true, msg: 'Wajan gosong dibuang.', sound: 'place' };
        }
        const item = kitchen.takeFromBurner(st.index);
        if (item) {
          this.carrying = { type: 'item', item };
          return { ok: true, msg: INGREDIENTS[item.kind].name + ' matang, angkat!', sound: 'pickup' };
        }
        return { ok: false, msg: 'Wajan kosong.' };
      }
      return { ok: false, msg: 'Tangan penuh.' };
    }

    if (st.type === 'plating') {
      if (held && held.type === 'item') {
        if (kitchen.addToPlate(held.item)) {
          const done = matchRecipe(kitchen.plate.components);
          this.carrying = null;
          return {
            ok: true,
            msg: done ? done.name + ' selesai dirakit!' : 'Ditambahkan ke piring.',
            sound: done ? 'cooked' : 'place',
          };
        }
        return { ok: false, msg: 'Hanya bahan matang yang bisa dirakit.', sound: 'error' };
      }
      if (!held) {
        const plate = kitchen.takePlate();
        if (plate) {
          this.carrying = { type: 'plate', plate };
          return { ok: true, msg: 'Piring diangkat — antar ke jendela saji!', sound: 'pickup' };
        }
        return { ok: false, msg: 'Tidak ada piring untuk diangkat.' };
      }
      return { ok: false, msg: 'Letakkan bahan dulu.' };
    }

    if (st.type === 'window') {
      if (held && held.type === 'plate') {
        const result = orders.serve(held.plate.components, elapsed);
        if (result) {
          this.carrying = null;
          return { ok: true, msg: 'Disajikan! +' + result.total + ' koin.', sound: 'serve', serve: result };
        }
        return { ok: false, msg: 'Tidak ada pesanan yang cocok dengan piring ini.', sound: 'error' };
      }
      return { ok: false, msg: 'Bawa piring hidangan ke sini.' };
    }

    if (st.type === 'trash') {
      if (held) {
        this.carrying = null;
        return { ok: true, msg: 'Dibuang.', sound: 'place' };
      }
      return { ok: false, msg: 'Tidak ada yang dibuang.' };
    }

    if (st.type === 'sink') {
      return { ok: true, msg: 'Air mengalir… (wastafel hanya hiasan).', sound: 'place' };
    }
    return { ok: false, msg: '' };
  }
}
