// Ember & Egg — Dapur Perapian: entry point, game loop and state machine.
// Phases: title -> playing <-> paused -> over. All rules live in orders.js,
// kitchen.js and cook.js; this file only wires them together and ticks time.
import { GAME, matchRecipe } from './config.js';
import { mulberry32 } from './random.js';
import { SoundEngine } from './audio.js';
import { Input } from './input.js';
import { OrderBoard } from './orders.js';
import { Kitchen } from './kitchen.js';
import { Cook } from './cook.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
canvas.width = GAME.width;
canvas.height = GAME.height;

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || '1') || 1;
const shotPose = params.get('shot');
const shiftOverride = Number(params.get('shift') || '0') || 0;

export class Game {
  constructor() {
    this.rng = mulberry32(seed);
    this.sound = new SoundEngine();
    this.input = new Input(canvas);
    this.orders = new OrderBoard(this.rng);
    this.kitchen = new Kitchen();
    this.cook = new Cook();
    this.phase = 'title';
    this.elapsed = 0;
    this.shiftRemaining = GAME.shiftSeconds;
    this.coins = 0;
    this.hearts = GAME.maxHearts;
    this.best = Number(localStorage.getItem('ember-egg-best') || '0');
    this.floats = [];
    this.toast = null;
    this.stats = { coins: 0, served: 0, expired: 0, bestCombo: 0, stars: 0, hearts: 3 };
    this.bestCombo = 0;
    this.lastTickSecond = -1;
    this.statusText = '';
    this.state = this; // shots.js reads game.state
    this.input.onKey = (key) => this.onKey(key);
  }

  get recipeForPlate() {
    return matchRecipe(this.kitchen.plate.components);
  }

  setPhase(p) {
    this.phase = p;
    if (p === 'playing') this.sound.startMusic();
    else this.sound.stopMusic();
  }

  startShift() {
    this.orders.reset();
    this.kitchen.reset();
    this.cook.reset();
    this.elapsed = 0;
    this.shiftRemaining = shiftOverride || GAME.shiftSeconds;
    this.coins = 0;
    this.hearts = GAME.maxHearts;
    this.floats = [];
    this.bestCombo = 0;
    this.lastTickSecond = -1;
    this.toast = null;
    this.setPhase('playing');
    this.showToast('Shift dimulai! Pesanan pertama segera masuk.');
    this.announce('Shift dimulai. Sajikan pesanan sebelum timer habis.');
  }

  endShift() {
    const stars = this.coins >= GAME.starCoins[2] ? 3
      : this.coins >= GAME.starCoins[1] ? 2
      : this.coins >= GAME.starCoins[0] ? 1 : 0;
    this.stats = {
      coins: this.coins,
      served: this.orders.served,
      expired: this.orders.expired,
      bestCombo: this.bestCombo,
      stars,
      hearts: this.hearts,
    };
    if (this.coins > this.best) {
      this.best = this.coins;
      try { localStorage.setItem('ember-egg-best', String(this.best)); } catch { /* private mode */ }
    }
    this.setPhase('over');
    this.sound.win();
    this.announce('Shift selesai. Koin ' + this.coins + ', ' + this.orders.served + ' pesanan tersaji.');
  }

  onKey(key) {
    if (key === 'm') {
      const muted = this.sound.toggleMute();
      this.showToast(muted ? 'Suara dimatikan.' : 'Suara dinyalakan.');
      return;
    }
    if (key === 'r' && (this.phase === 'playing' || this.phase === 'paused' || this.phase === 'over')) {
      this.startShift();
      return;
    }
    if (key === 'p' && (this.phase === 'playing' || this.phase === 'paused')) {
      this.setPhase(this.phase === 'playing' ? 'paused' : 'playing');
      return;
    }
    if (this.phase === 'title' && (key === 'enter' || key === ' ')) {
      this.sound.ensure();
      this.startShift();
    }
  }

  showToast(msg) {
    this.toast = { msg, life: 3 };
  }

  addFloat(x, y, text, color) {
    this.floats.push({ x, y, text, color, life: 1.4, max: 1.4 });
  }

  announce(msg) {
    this.statusText = msg;
    if (statusEl) statusEl.textContent = msg;
  }

  interact() {
    const result = this.cook.interact(this.kitchen, this.orders, this.elapsed);
    if (!result) return;
    if (result.msg) this.showToast(result.msg);
    if (result.sound) this.sound[result.sound]();
    if (result.serve) {
      const s = result.serve;
      this.coins += s.total;
      this.bestCombo = Math.max(this.bestCombo, s.combo);
      const wx = 145;
      const wy = 190;
      this.addFloat(wx, wy, '+' + s.total + ' koin', '#ffd23f');
      if (s.combo > 1) this.addFloat(wx, wy - 26, 'KOMBO ×' + s.combo, '#ff8c42');
      this.announce(s.order.name + ' disajikan, +' + s.total + ' koin.');
    }
  }

  update(dt) {
    if (this.phase !== 'playing') return;
    this.elapsed += dt;
    this.shiftRemaining -= dt;

    // Shift timer ticks + urgent beeps in the last 10 seconds.
    const sec = Math.ceil(this.shiftRemaining);
    if (sec !== this.lastTickSecond) {
      this.lastTickSecond = sec;
      if (sec <= 10 && sec > 0) this.sound.tick();
    }

    this.orders.update(dt, this.elapsed, (order) => {
      this.hearts -= 1;
      this.sound.expire();
      this.showToast('Pesanan ' + order.name + ' hangus! -1 hati.');
      this.addFloat(640, 200, 'PESANAN HANGUS', '#ff5a4e');
      if (this.hearts <= 0) this.endShift();
    });

    this.kitchen.update(dt, (event) => {
      if (event === 'chopDone') this.sound.chopDone();
      if (event === 'cooked') { this.sound.cooked(); this.sound.sizzle(); }
      if (event === 'burnt') {
        this.sound.burn();
        this.showToast('Gosong! Buang isi wajan ke tempat sampah.');
      }
    });

    // Chopping sound while the board is working.
    if (this.kitchen.board.item && !this.kitchen.board.done && Math.random() < dt * 2.5) {
      this.sound.chop();
    }

    // Sizzle while a pan cooks.
    for (const b of this.kitchen.burners) {
      if (b.item && !b.done && Math.random() < dt * 1.5) this.sound.sizzle();
    }

    const solids = this.kitchen.stationRects();
    this.cook.update(dt, this.input, this.kitchen, solids);

    if (this.input.pressed.has('e') || this.input.pressed.has(' ')) {
      this.interact();
    } else if (this.input.mouse.clicked && this.cook.nearestStation(this.kitchen)) {
      this.interact();
    }

    if (this.toast) {
      this.toast.life -= dt;
      if (this.toast.life <= 0) this.toast = null;
    }
    for (const f of this.floats) { f.life -= dt; f.y -= dt * 30; }
    this.floats = this.floats.filter((f) => f.life > 0);

    if (this.shiftRemaining <= 0) this.endShift();
  }

  frame(now) {
    const dt = Math.min(0.1, (now - (this.lastNow || now)) / 1000 || 0.016);
    this.lastNow = now;
    if (this.phase === 'title' && shotPose) {
      applyShot(this, shotPose);
      document.title = 'shot-ready';
    }
    this.update(dt);
    // Mouse click on the title screen starts the game too.
    if (this.phase === 'title' && this.input.mouse.clicked) {
      this.sound.ensure();
      this.startShift();
    }
    render(ctx, this);
    this.input.endFrame();
    requestAnimationFrame((t) => this.frame(t));
  }
}

const game = new Game();
// Test hook: the playtest script drives and asserts through this.
window.__emberEgg = game;
if (shotPose) {
  applyShot(game, shotPose);
  // Let one frame render, then signal readiness.
  requestAnimationFrame(() => { document.title = 'shot-ready'; });
}
requestAnimationFrame((t) => game.frame(t));
