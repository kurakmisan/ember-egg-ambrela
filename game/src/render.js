// Render: every pixel of Ember & Egg is drawn here with canvas primitives —
// the hearth kitchen, the food, the cook, the order board and the HUD.
// No image assets, no fonts from the network; system fonts only.
import { GAME, INGREDIENTS, STATIONS, COLORS } from './config.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'left', bold = true) {
  ctx.fillStyle = color;
  ctx.font = (bold ? '700 ' : '') + size + 'px system-ui, "Segoe UI", sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// --- food art: each ingredient drawn so it reads at a glance ---
export function drawIngredient(ctx, kind, state, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 40; // unit
  if (kind === 'egg') {
    ctx.fillStyle = state === 'cooked' ? '#ffe9a8' : '#fff3c4';
    ctx.beginPath(); ctx.ellipse(0, 0, 15 * u, 19 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9b64a'; ctx.lineWidth = 2 * u; ctx.stroke();
    if (state === 'cooked') {
      ctx.fillStyle = '#f2c94c';
      ctx.beginPath(); ctx.arc(0, 2 * u, 7 * u, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'tomato') {
    ctx.fillStyle = state === 'cooked' ? '#d94a3a' : '#ff5a4e';
    ctx.beginPath(); ctx.arc(0, 0, 16 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2e9e4f';
    ctx.beginPath(); ctx.ellipse(0, -14 * u, 7 * u, 4 * u, 0, 0, Math.PI * 2); ctx.fill();
    if (state === 'chopped') {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * u;
      ctx.beginPath(); ctx.moveTo(-8 * u, -8 * u); ctx.lineTo(8 * u, 8 * u); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8 * u, -8 * u); ctx.lineTo(-8 * u, 8 * u); ctx.stroke();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = state === 'cooked' ? '#ffcf3d' : '#ffd23f';
    ctx.beginPath();
    ctx.moveTo(-16 * u, 10 * u); ctx.lineTo(16 * u, 10 * u); ctx.lineTo(0, -14 * u);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8a91c';
    ctx.beginPath(); ctx.arc(-6 * u, 2 * u, 2.5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6 * u, 4 * u, 2.5 * u, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'bread') {
    ctx.fillStyle = state === 'cooked' ? '#c98a3d' : '#e8b06a';
    rr(ctx, -17 * u, -10 * u, 34 * u, 20 * u, 9 * u); ctx.fill();
    ctx.strokeStyle = '#b97a2e'; ctx.lineWidth = 2 * u;
    ctx.beginPath(); ctx.moveTo(-8 * u, -10 * u); ctx.lineTo(-8 * u, 10 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -10 * u); ctx.lineTo(0, 10 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8 * u, -10 * u); ctx.lineTo(8 * u, 10 * u); ctx.stroke();
  } else if (kind === 'mushroom') {
    ctx.fillStyle = state === 'cooked' ? '#c9a37e' : '#f3e6d0';
    rr(ctx, -5 * u, -2 * u, 10 * u, 16 * u, 4 * u); ctx.fill();
    ctx.fillStyle = state === 'cooked' ? '#8a5a3b' : '#b06a4a';
    ctx.beginPath(); ctx.arc(0, -4 * u, 15 * u, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fff6e0';
    ctx.beginPath(); ctx.arc(-6 * u, -10 * u, 3 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5 * u, -12 * u, 2.5 * u, 0, Math.PI * 2); ctx.fill();
    if (state === 'chopped') {
      ctx.strokeStyle = '#8a5a3b'; ctx.lineWidth = 2 * u;
      ctx.beginPath(); ctx.moveTo(-10 * u, 0); ctx.lineTo(10 * u, 0); ctx.stroke();
    }
  } else if (kind === 'chili') {
    ctx.strokeStyle = state === 'cooked' ? '#a81f14' : '#e6392b';
    ctx.lineWidth = 9 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-12 * u, -8 * u); ctx.quadraticCurveTo(10 * u, -4 * u, 12 * u, 10 * u); ctx.stroke();
    ctx.strokeStyle = '#2e9e4f'; ctx.lineWidth = 4 * u;
    ctx.beginPath(); ctx.moveTo(-12 * u, -8 * u); ctx.lineTo(-16 * u, -14 * u); ctx.stroke();
    if (state === 'chopped') {
      ctx.fillStyle = '#e6392b';
      ctx.beginPath(); ctx.arc(-6 * u, 4 * u, 4 * u, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(4 * u, 8 * u, 4 * u, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, r) {
  ctx.fillStyle = '#f8f4ea';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d8cfc0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r - 4, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#c9bfa9';
  ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2); ctx.stroke();
}

function progressRing(ctx, x, y, r, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
}

function drawCounter(ctx, x, y, w, h, label, highlight) {
  ctx.fillStyle = COLORS.counter;
  rr(ctx, x, y, w, h, 8); ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, x + 3, y + 3, w - 6, h - 16, 6); ctx.fill();
  if (highlight) {
    ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 3;
    rr(ctx, x - 2, y - 2, w + 4, h + 4, 10); ctx.stroke();
  }
  text(ctx, label, x + w / 2, y + h - 7, 11, '#fff6e0', 'center');
}

// --- the kitchen floor, walls and stations ---
function drawKitchen(ctx, state) {
  const { kitchen, cook } = state;
  // Floor tiles.
  for (let ty = 0; ty < 8; ty++) {
    for (let tx = 0; tx < 13; tx++) {
      ctx.fillStyle = (tx + ty) % 2 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(30 + tx * 94, 150 + ty * 78, 94, 78);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 13; i++) { ctx.beginPath(); ctx.moveTo(30 + i * 94, 150); ctx.lineTo(30 + i * 94, 774); ctx.stroke(); }
  for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(30, 150 + i * 78); ctx.lineTo(1252, 150 + i * 78); ctx.stroke(); }

  // Top wall (brick) + hearth glow.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 96, 1280, 54);
  ctx.fillStyle = COLORS.wallTop;
  ctx.fillRect(0, 96, 1280, 10);
  ctx.fillStyle = 'rgba(242,150,60,0.25)';
  ctx.beginPath(); ctx.ellipse(640, 150, 260, 26, 0, 0, Math.PI * 2); ctx.fill();

  // Round woven rug in the middle of the floor (decoration, no collision).
  ctx.fillStyle = '#8a4a2b';
  ctx.beginPath(); ctx.ellipse(640, 480, 120, 84, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(640, 480, 104, 70, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(640, 480, 60, 40, 0, 0, Math.PI * 2); ctx.stroke();

  const near = cook.nearestStation(kitchen);
  const isNear = (type, id) => near && near.type === type && (id === undefined || near.index === id || near.id === id);

  // Serving window (top-left) with a brass bell.
  drawCounter(ctx, STATIONS.window.x, STATIONS.window.y, STATIONS.window.w, STATIONS.window.h, 'JENDELA SAJI', isNear('window'));
  ctx.fillStyle = '#f2c94c';
  ctx.beginPath(); ctx.arc(STATIONS.window.x + 85, STATIONS.window.y + 32, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a5a3b'; ctx.fillRect(STATIONS.window.x + 82, STATIONS.window.y + 18, 6, 6);

  // Sink (top-right, decorative).
  drawCounter(ctx, STATIONS.sink.x, STATIONS.sink.y, STATIONS.sink.w, STATIONS.sink.h, 'WASTAFEL', isNear('sink'));
  ctx.fillStyle = '#9fc4d8';
  rr(ctx, STATIONS.sink.x + 20, STATIONS.sink.y + 18, 60, 34, 8); ctx.fill();

  // Plating counter with the plate being assembled.
  drawCounter(ctx, STATIONS.plating.x, STATIONS.plating.y, STATIONS.plating.w, STATIONS.plating.h, 'MEJA RAKIT', isNear('plating'));
  const px = STATIONS.plating.x + 85;
  const py = STATIONS.plating.y + 42;
  drawPlate(ctx, px, py, 34);
  kitchen.plate.components.forEach((c, i) => {
    const offs = [[-12, -6], [12, -6], [0, 10]];
    drawIngredient(ctx, c.kind, c.state, px + offs[i][0], py + offs[i][1], 26);
  });
  if (kitchen.plate.components.length > 0) {
    const done = state.recipeForPlate;
    text(ctx, done ? done.name + ' ✓' : 'Dirakit…', px, py - 46, 12, done ? '#2e9e4f' : '#fff6e0', 'center');
  }

  // Chopping board.
  drawCounter(ctx, STATIONS.board.x, STATIONS.board.y, STATIONS.board.w, STATIONS.board.h, 'TALENAN', isNear('board'));
  ctx.fillStyle = '#e8d5a8';
  rr(ctx, STATIONS.board.x + 25, STATIONS.board.y + 18, 100, 56, 6); ctx.fill();
  if (kitchen.board.item) {
    drawIngredient(ctx, kitchen.board.item.kind, kitchen.board.item.state, STATIONS.board.x + 75, STATIONS.board.y + 46, 40);
    if (!kitchen.board.done) progressRing(ctx, STATIONS.board.x + 75, STATIONS.board.y + 46, 30, kitchen.board.progress, '#f2c94c');
    else text(ctx, 'SIAP!', STATIONS.board.x + 75, STATIONS.board.y + 88, 13, '#2e9e4f', 'center');
  } else {
    ctx.fillStyle = '#9a8a6a';
    ctx.save();
    ctx.translate(STATIONS.board.x + 118, STATIONS.board.y + 46);
    ctx.rotate(0.5);
    ctx.fillRect(-22, -3, 44, 6);
    ctx.restore();
  }

  // Stove burners with pans.
  STATIONS.stove.forEach((s, i) => {
    const b = kitchen.burners[i];
    drawCounter(ctx, s.x, s.y, s.w, s.h, s.label, isNear('burner', i));
    const cx = s.x + 75;
    const cy = s.y + 44;
    ctx.fillStyle = '#3a3a42';
    ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = b.item && b.burnt ? '#1c1c20' : '#55555e';
    ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.fill();
    if (b.item) {
      drawIngredient(ctx, b.item.kind, b.item.state, cx, cy, 34);
      if (!b.done) progressRing(ctx, cx, cy, 38, b.progress, '#ff8c42');
      else if (!b.burnt) {
        text(ctx, 'MATANG!', cx, s.y - 12, 12, '#2e9e4f', 'center');
        progressRing(ctx, cx, cy, 38, b.burnTimer / GAME.burnSeconds, '#e6392b');
      } else {
        text(ctx, 'GOSONG!', cx, s.y - 12, 12, '#e6392b', 'center');
      }
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.stroke();
    }
  });

  // Ingredient crates along the bottom.
  for (const c of STATIONS.crates) {
    drawCounter(ctx, c.x, c.y, c.w, c.h, c.label.toUpperCase(), isNear('crate') && near.kind === c.kind);
    const ing = INGREDIENTS[c.kind];
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    rr(ctx, c.x + 14, c.y + 12, c.w - 28, 44, 8); ctx.fill();
    drawIngredient(ctx, c.kind, 'raw', c.x + 36, c.y + 34, 30);
    drawIngredient(ctx, c.kind, 'raw', c.x + 84, c.y + 34, 30);
    text(ctx, ing.name, c.x + c.w / 2, c.y + 66, 12, '#fff6e0', 'center');
  }

  // Trash bin.
  drawCounter(ctx, STATIONS.trash.x, STATIONS.trash.y, STATIONS.trash.w, STATIONS.trash.h, 'SAMPAH', isNear('trash'));
  ctx.fillStyle = '#4a4a52';
  rr(ctx, STATIONS.trash.x + 28, STATIONS.trash.y + 14, 44, 46, 6); ctx.fill();
  ctx.fillStyle = '#6a6a72';
  ctx.fillRect(STATIONS.trash.x + 24, STATIONS.trash.y + 10, 52, 8);

  // Steam above hot pans.
  for (const s of kitchen.steam) {
    const b = kitchen.burners[s.burner];
    const st = STATIONS.stove[s.burner];
    const alpha = Math.max(0, s.life / s.max);
    ctx.fillStyle = 'rgba(255,255,255,' + (alpha * 0.5).toFixed(2) + ')';
    ctx.beginPath();
    ctx.arc(st.x + 75 + Math.sin(s.life * 6) * 6, st.y + 20 - (1 - alpha) * 30, 5 + (1 - alpha) * 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Interaction hint.
  if (near) {
    text(ctx, 'E / klik: ' + near.label, cook.x, cook.y - 34, 13, '#fff6e0', 'center');
    ctx.strokeStyle = 'rgba(242,201,76,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cook.x, cook.y - 34, 4, 0, Math.PI * 2); ctx.stroke();
  }
}

// --- the cook ---
function drawCook(ctx, cook) {
  const bob = cook.moving ? Math.sin(cook.walkPhase) * 2 : 0;
  const x = cook.x;
  const y = cook.y + bob;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, cook.y + 18, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Body (apron).
  ctx.fillStyle = '#fff6e0';
  rr(ctx, x - 14, y - 8, 28, 30, 10); ctx.fill();
  ctx.fillStyle = '#e6392b';
  ctx.fillRect(x - 14, y + 8, 28, 6);
  // Head + chef hat.
  ctx.fillStyle = '#f2c49b';
  ctx.beginPath(); ctx.arc(x, y - 18, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x - 7, y - 28, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 7, y - 28, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - 30, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - 12, y - 30, 24, 6);
  // Eyes look in the facing direction.
  const ex = cook.dir === 'left' ? -3 : cook.dir === 'right' ? 3 : 0;
  ctx.fillStyle = '#2b2118';
  ctx.beginPath(); ctx.arc(x - 4 + ex, y - 18, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 4 + ex, y - 18, 1.8, 0, Math.PI * 2); ctx.fill();
  // What the cook carries, held overhead.
  if (cook.carrying) {
    if (cook.carrying.type === 'item') {
      drawIngredient(ctx, cook.carrying.item.kind, cook.carrying.item.state, x, y - 46, 34);
    } else {
      drawPlate(ctx, x, y - 46, 20);
      cook.carrying.plate.components.forEach((c, i) => {
        const offs = [[-7, -3], [7, -3], [0, 6]];
        drawIngredient(ctx, c.kind, c.state, x + offs[i][0], y - 46 + offs[i][1], 16);
      });
    }
  }
}

// --- order board (top bar) ---
function drawOrderBoard(ctx, orders, coins, hearts, shiftRemaining, combo) {
  // Top bar.
  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, 0, 1280, 96);
  ctx.fillStyle = '#f2c94c';
  ctx.fillRect(0, 92, 1280, 4);
  text(ctx, 'EMBER & EGG', 24, 30, 26, '#f2c94c');
  text(ctx, 'Dapur Perapian', 24, 58, 13, '#c9a86a', 'left', false);

  // Coins + hearts + combo.
  text(ctx, '🪙 ' + coins, 250, 30, 22, '#ffd23f');
  let hx = 250;
  for (let i = 0; i < GAME.maxHearts; i++) {
    ctx.fillStyle = i < hearts ? '#e6392b' : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(hx + 8, 62, 8, 0, Math.PI * 2);
    ctx.arc(hx + 22, 62, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx, 62); ctx.lineTo(hx + 30, 62); ctx.lineTo(hx + 15, 78);
    ctx.closePath(); ctx.fill();
    hx += 36;
  }
  if (combo > 1) text(ctx, 'COMBO ×' + combo, 250, 84, 14, '#ff8c42');

  // Shift timer (centre).
  const total = GAME.shiftSeconds;
  const frac = Math.max(0, shiftRemaining / total);
  const mm = Math.floor(shiftRemaining / 60);
  const ss = Math.floor(shiftRemaining % 60).toString().padStart(2, '0');
  text(ctx, '⏱ ' + mm + ':' + ss, 640, 26, 24, frac < 0.2 ? '#ff5a4e' : '#fff6e0', 'center');
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  rr(ctx, 520, 44, 240, 12, 6); ctx.fill();
  ctx.fillStyle = frac < 0.2 ? '#e6392b' : '#2e9e4f';
  rr(ctx, 520, 44, 240 * frac, 12, 6); ctx.fill();

  // Order tickets (right side).
  let tx = 700;
  if (orders.orders.length === 0) {
    text(ctx, 'Menunggu pesanan…', 985, 48, 15, '#c9a86a', 'center');
  }
  for (const order of orders.orders) {
    const urgent = order.remaining < 15;
    ctx.fillStyle = urgent ? '#5d1f1a' : '#fff6e0';
    rr(ctx, tx, 10, 180, 76, 8); ctx.fill();
    ctx.strokeStyle = urgent ? '#e6392b' : '#d8cfc0';
    ctx.lineWidth = 2;
    rr(ctx, tx, 10, 180, 76, 8); ctx.stroke();
    text(ctx, order.name, tx + 12, 26, 13, urgent ? '#ffd9d0' : '#2b2118');
    // Needed components as mini icons.
    order.components.forEach((c, i) => {
      drawIngredient(ctx, c.kind, c.state, tx + 26 + i * 44, 50, 30);
    });
    // Countdown ring + seconds.
    const ofrac = Math.max(0, order.remaining / order.total);
    progressRing(ctx, tx + 158, 62, 12, ofrac, urgent ? '#e6392b' : '#2e9e4f');
    text(ctx, Math.ceil(order.remaining) + 'd', tx + 158, 62, 11, urgent ? '#ff5a4e' : '#2b2118', 'center');
    text(ctx, '+' + order.coins + ' koin', tx + 12, 72, 11, '#8a6d1f', 'left', false);
    tx += 190;
  }
}

// --- floating score texts + toast ---
function drawFloats(ctx, floats, toast) {
  for (const f of floats) {
    ctx.globalAlpha = Math.max(0, f.life / f.max);
    text(ctx, f.text, f.x, f.y, 20, f.color, 'center');
    ctx.globalAlpha = 1;
  }
  if (toast && toast.life > 0) {
    ctx.globalAlpha = Math.min(1, toast.life);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.font = '700 15px system-ui, "Segoe UI", sans-serif';
    const w = ctx.measureText(toast.msg).width + 120;
    rr(ctx, 640 - w / 2, 108, w, 34, 17); ctx.fill();
    text(ctx, toast.msg, 640, 125, 15, '#fff6e0', 'center');
    ctx.globalAlpha = 1;
  }
}

// --- screens ---
function drawTitle(ctx, best) {
  ctx.fillStyle = 'rgba(20,12,6,0.82)';
  ctx.fillRect(0, 0, 1280, 800);
  text(ctx, '🔥 EMBER & EGG 🔥', 640, 150, 56, '#f2c94c', 'center');
  text(ctx, 'Dapur Perapian — game masak seru di dapur kecil', 640, 210, 22, '#fff6e0', 'center');
  text(ctx, 'Ambil bahan → cincang → masak → rakit di piring → sajikan!', 640, 250, 18, '#c9a86a', 'center', false);
  const lines = [
    'WASD / panah — bergerak    E / Spasi / klik — pakai meja',
    'P — jeda    R — mulai ulang    M — suara',
    'Sajikan sebelum timer pesanan habis. Pesanan hangus = -1 hati.',
    'Kombo: sajikan cepat berturut-turut untuk bonus koin.',
  ];
  lines.forEach((l, i) => text(ctx, l, 640, 320 + i * 32, 16, '#fff6e0', 'center', false));
  // Mini recipe cards.
  const recipes = [
    ['Omelet Ember', 'Telur + Keju'],
    ['Sup Tomat Jamur', 'Tomat + Jamur'],
    ['Roti Keju Panggang', 'Roti + Keju'],
    ['Tumis Pedas Jamur', 'Jamur + Cabai'],
  ];
  recipes.forEach((r, i) => {
    const x = 220 + i * 220;
    ctx.fillStyle = '#fff6e0';
    rr(ctx, x, 470, 200, 90, 10); ctx.fill();
    text(ctx, r[0], x + 100, 496, 15, '#2b2118', 'center');
    text(ctx, r[1], x + 100, 524, 13, '#8a6d1f', 'center', false);
    text(ctx, 'dicincang bila perlu, lalu dimasak', x + 100, 546, 11, '#8a6d1f', 'center', false);
  });
  text(ctx, 'Tekan ENTER / klik untuk mulai memasak', 640, 620, 20, '#f2c94c', 'center');
  if (best > 0) text(ctx, 'Rekor koin: ' + best, 640, 660, 16, '#fff6e0', 'center', false);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20,12,6,0.7)';
  ctx.fillRect(0, 0, 1280, 800);
  text(ctx, 'JEDA', 640, 360, 48, '#f2c94c', 'center');
  text(ctx, 'Tekan P untuk lanjut — R untuk mulai ulang', 640, 420, 18, '#fff6e0', 'center', false);
}

function drawGameOver(ctx, stats) {
  ctx.fillStyle = 'rgba(20,12,6,0.85)';
  ctx.fillRect(0, 0, 1280, 800);
  text(ctx, stats.hearts <= 0 ? 'DAPUR TUTUP!' : 'SHIFT SELESAI!', 640, 180, 52, '#f2c94c', 'center');
  text(ctx, stats.hearts <= 0 ? 'Tiga pesanan hangus — reputasi dapur jatuh.' : 'Waktu shift habis. Dapur bersih, pelanggan puas!', 640, 230, 18, '#fff6e0', 'center', false);
  text(ctx, 'Koin: ' + stats.coins, 640, 320, 28, '#ffd23f', 'center');
  text(ctx, 'Pesanan tersaji: ' + stats.served + '   •   Hangus: ' + stats.expired + '   •   Kombo terbaik: ×' + stats.bestCombo, 640, 370, 18, '#fff6e0', 'center', false);
  const stars = '★'.repeat(stats.stars) + '☆'.repeat(3 - stats.stars);
  text(ctx, stars, 640, 440, 44, '#f2c94c', 'center');
  text(ctx, stats.stars === 3 ? 'Koki Bintang Tiga! Dapur ini legenda.' : stats.stars === 2 ? 'Koki hebat — sedikit lagi bintang tiga!' : 'Shift yang layak — coba lagi untuk bintang!', 640, 500, 17, '#c9a86a', 'center', false);
  text(ctx, 'Tekan R untuk masak lagi', 640, 580, 20, '#f2c94c', 'center');
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, GAME.width, GAME.height);
  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, 0, GAME.width, GAME.height);
  drawOrderBoard(ctx, state.orders, state.coins, state.hearts, state.shiftRemaining, state.orders.combo);
  drawKitchen(ctx, state);
  drawCook(ctx, state.cook);
  drawFloats(ctx, state.floats, state.toast);
  if (state.phase === 'title') drawTitle(ctx, state.best);
  if (state.phase === 'paused') drawPaused(ctx);
  if (state.phase === 'over') drawGameOver(ctx, state.stats);
  if (state.phase === 'playing' && state.muted) {
    text(ctx, '🔇 Suara mati (M)', 1256, 120, 13, 'rgba(255,255,255,0.6)', 'right', false);
  }
}
