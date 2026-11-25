// Screenshot poses: deterministic staged states of the real game, rendered by
// the game's own renderer. ?shot=cover|title|serve|rush (plus &seed=N).
// Each pose ends by setting document.title = 'shot-ready'.
import { GAME } from './config.js';

export function applyShot(game, pose) {
  const s = game.state;
  if (pose === 'title') {
    game.setPhase('title');
    return;
  }
  if (pose === 'serve') {
    game.setPhase('playing');
    game.state.orders.forceOrders([
      { recipeId: 'omelet', remaining: 38 },
      { recipeId: 'sup', remaining: 52 },
    ]);
    // A finished omelet on the plate, cook carrying it toward the window.
    game.state.kitchen.plate.components = [
      { kind: 'egg', state: 'cooked' },
      { kind: 'cheese', state: 'cooked' },
    ];
    const plate = game.state.kitchen.takePlate();
    game.state.cook.carrying = { type: 'plate', plate };
    game.state.cook.x = 300;
    game.state.cook.y = 210;
    game.state.cook.dir = 'up';
    game.state.coins = 45;
    game.state.shiftRemaining = 122;
    game.showToast('Omelet Ember siap — antar ke jendela saji!');
    return;
  }
  if (pose === 'rush') {
    game.setPhase('playing');
    game.state.orders.forceOrders([
      { recipeId: 'tumis', remaining: 9 },
      { recipeId: 'roti', remaining: 21 },
      { recipeId: 'sup', remaining: 44 },
    ]);
    game.state.orders.combo = 4;
    game.state.orders.comboTimer = 12;
    game.state.kitchen.burners[0].item = { kind: 'mushroom', state: 'chopped' };
    game.state.kitchen.burners[0].progress = 0.7;
    game.state.kitchen.burners[1].item = { kind: 'chili', state: 'chopped' };
    game.state.kitchen.burners[1].progress = 0.95;
    game.state.kitchen.burners[1].done = true;
    game.state.kitchen.burners[1].item.state = 'cooked';
    game.state.kitchen.burners[1].burnTimer = 2.2;
    game.state.kitchen.board.item = { kind: 'tomato', state: 'raw' };
    game.state.kitchen.board.progress = 0.55;
    game.state.kitchen.plate.components = [{ kind: 'mushroom', state: 'cooked' }];
    game.state.cook.carrying = { type: 'item', item: { kind: 'tomato', state: 'chopped' } };
    game.state.cook.x = 760;
    game.state.cook.y = 560;
    game.state.cook.dir = 'up';
    game.state.coins = 132;
    game.state.hearts = 2;
    game.state.shiftRemaining = 47;
    game.showToast('Rush! Selesaikan Tumis Pedas sebelum timer habis.');
    return;
  }
  // cover (default): the full kitchen at its busiest and most readable.
  game.setPhase('playing');
  game.state.orders.forceOrders([
    { recipeId: 'omelet', remaining: 41 },
    { recipeId: 'sup', remaining: 28 },
    { recipeId: 'tumis', remaining: 53 },
  ]);
  game.state.kitchen.burners[0].item = { kind: 'egg', state: 'raw' };
  game.state.kitchen.burners[0].progress = 0.62;
  game.state.kitchen.burners[1].item = { kind: 'cheese', state: 'raw' };
  game.state.kitchen.burners[1].progress = 0.25;
  game.state.kitchen.board.item = { kind: 'tomato', state: 'raw' };
  game.state.kitchen.board.progress = 0.45;
  game.state.kitchen.plate.components = [
    { kind: 'egg', state: 'cooked' },
    { kind: 'cheese', state: 'cooked' },
  ];
  game.state.cook.x = 700;
  game.state.cook.y = 500;
  game.state.cook.dir = 'left';
  game.state.coins = 78;
  game.state.shiftRemaining = 104;
  game.showToast('Omelet Ember selesai dirakit — angkat piringnya!');
  void GAME;
}
