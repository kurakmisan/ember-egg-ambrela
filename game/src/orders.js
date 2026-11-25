// OrderBoard: spawns orders, ticks their countdowns, scores serves.
// An order is a recipe + a deadline. Serving the matching plate pays the recipe
// coins plus a time bonus; an expired order costs one heart.
import { GAME, RECIPES, recipeById } from './config.js';
import { pick } from './random.js';

export class OrderBoard {
  constructor(rng) {
    this.rng = rng;
    this.orders = [];
    this.nextId = 1;
    this.spawnTimer = 2;
    this.served = 0;
    this.expired = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.lastServeAt = -999;
  }

  reset() {
    this.orders = [];
    this.nextId = 1;
    this.spawnTimer = 2;
    this.served = 0;
    this.expired = 0;
    this.combo = 0;
    this.comboTimer = 0;
  }

  spawnInterval(elapsed) {
    const t = Math.min(1, elapsed / GAME.shiftSeconds);
    return GAME.spawnIntervalStart + (GAME.spawnIntervalEnd - GAME.spawnIntervalStart) * t;
  }

  update(dt, elapsed, onExpire) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.orders.length < GAME.maxOrders) {
      this.spawnOrder();
      this.spawnTimer = this.spawnInterval(elapsed);
    }
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    for (const order of this.orders) {
      order.remaining -= dt;
      if (order.remaining <= 0) {
        this.orders.splice(this.orders.indexOf(order), 1);
        this.expired++;
        this.combo = 0;
        if (onExpire) onExpire(order);
      }
    }
  }

  spawnOrder() {
    const recipe = pick(this.rng, RECIPES);
    this.orders.push({
      id: this.nextId++,
      recipeId: recipe.id,
      name: recipe.name,
      coins: recipe.coins,
      remaining: GAME.orderLifetime,
      total: GAME.orderLifetime,
      components: recipe.components.map((c) => ({ kind: c.kind, state: c.state })),
    });
  }

  // Serve a plate: returns the payout breakdown or null when nothing matches.
  serve(plateComponents, elapsed) {
    const key = plateComponents.map((c) => c.kind + ':' + c.state).sort().join('|');
    const idx = this.orders.findIndex((o) => {
      const want = o.components.map((c) => c.kind + ':' + c.state).sort().join('|');
      return want === key;
    });
    if (idx === -1) return null;
    const order = this.orders.splice(idx, 1)[0];
    const timeBonus = Math.round(10 * (order.remaining / order.total));
    const withinCombo = elapsed - this.lastServeAt < 20;
    this.combo = withinCombo ? this.combo + 1 : 1;
    this.comboTimer = 20;
    this.lastServeAt = elapsed;
    const comboBonus = this.combo > 1 ? (this.combo - 1) * 2 : 0;
    const total = order.coins + timeBonus + comboBonus;
    this.served++;
    return { order, base: order.coins, timeBonus, combo: this.combo, comboBonus, total };
  }

  // For screenshot poses: force a set of orders with chosen remaining times.
  forceOrders(specs) {
    this.orders = specs.map((s) => {
      const recipe = recipeById(s.recipeId);
      return {
        id: this.nextId++,
        recipeId: recipe.id,
        name: recipe.name,
        coins: recipe.coins,
        remaining: s.remaining,
        total: GAME.orderLifetime,
        components: recipe.components.map((c) => ({ kind: c.kind, state: c.state })),
      };
    });
  }
}
