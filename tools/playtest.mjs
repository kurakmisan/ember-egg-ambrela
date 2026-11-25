// End-to-end playtest of the real game in headless Chromium (development tool only).
// Usage: PLAYWRIGHT_FROM=<path-to-playwright> node tools/playtest.mjs
// Drives the game with real keyboard events and asserts the full loop:
// walk -> take egg -> cook -> plate -> take cheese -> cook -> plate -> serve,
// plus order expiry, shift timer, game over and restart. Fails (exit 1) on any
// console/page error, any external request, or any failed assertion.
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = fileURLToPath(new URL('../game', import.meta.url));
const require = createRequire(process.env.PLAYWRIGHT_FROM + '/');
const { chromium } = require('playwright');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript' };

let failures = 0;
function check(name, ok, extra = '') {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (extra ? ' — ' + extra : ''));
  if (!ok) failures++;
}

const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try {
    const body = readFileSync(join(root, normalize(path)));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((ready) => server.listen(8125, '127.0.0.1', ready));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
const requests = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('request', (r) => requests.push(r.url()));

const G = (expr) => page.evaluate(expr);
const sleep = (ms) => page.waitForTimeout(ms);
const near = async (x, y) => page.evaluate(([x, y]) => {
  const g = window.__emberEgg;
  g.cook.x = x; g.cook.y = y;
}, [x, y]);
const pressE = async () => { await page.keyboard.press('e'); await sleep(150); };

await page.goto('http://127.0.0.1:8125/?shift=120&seed=1');
await sleep(600);
check('title phase on load', (await G(`window.__emberEgg.phase`)) === 'title');
await page.keyboard.press('Enter');
await sleep(300);
check('Enter starts the shift', (await G(`window.__emberEgg.phase`)) === 'playing');

// Real movement with the keyboard (no teleport): hold D, cook must move right.
const x0 = await G(`window.__emberEgg.cook.x`);
await page.keyboard.down('d');
await sleep(500);
await page.keyboard.up('d');
const x1 = await G(`window.__emberEgg.cook.x`);
check('WASD moves the cook', x1 - x0 > 80, `x ${x0.toFixed(0)} -> ${x1.toFixed(0)}`);

// Shift timer ticks down.
const t0 = await G(`window.__emberEgg.shiftRemaining`);
await sleep(2000);
const t1 = await G(`window.__emberEgg.shiftRemaining`);
check('shift timer runs', t1 < t0, `${t0.toFixed(1)} -> ${t1.toFixed(1)}`);

// Orders spawn on their own.
await sleep(3000);
check('orders spawn', (await G(`window.__emberEgg.orders.orders.length`)) >= 1);

// Force one omelet order so the serve is deterministic.
await G(`window.__emberEgg.orders.forceOrders([{recipeId:'omelet', remaining:55}])`);

// 1. Egg crate -> take egg.
await near(120, 610);
await pressE();
check('take egg from crate', (await G(`window.__emberEgg.cook.carrying?.item?.kind`)) === 'egg');

// 2. Burner 1 -> cook the egg.
await near(1015, 550);
await pressE();
check('egg placed in pan', (await G(`window.__emberEgg.kitchen.burners[0].item?.kind`)) === 'egg');
await page.waitForFunction(() => window.__emberEgg.kitchen.burners[0].done, null, { timeout: 20000 });
check('egg cooked', (await G(`window.__emberEgg.kitchen.burners[0].done`)) === true);
await pressE();
check('take cooked egg', (await G(`window.__emberEgg.cook.carrying?.item?.state`)) === 'cooked');

// 3. Plating counter -> add egg to plate.
await near(145, 430);
await pressE();
check('egg on plate', (await G(`window.__emberEgg.kitchen.plate.components.length`)) === 1);

// 4. Cheese crate -> cook cheese on burner 2.
await near(400, 610);
await pressE();
check('take cheese from crate', (await G(`window.__emberEgg.cook.carrying?.item?.kind`)) === 'cheese');
await near(1015, 430);
await pressE();
check('cheese placed in a pan', (await G(`window.__emberEgg.kitchen.burners.some(b => b.item?.kind === 'cheese')`)) === true);
await page.waitForFunction(() => window.__emberEgg.kitchen.burners.some(b => b.item?.kind === 'cheese' && b.done), null, { timeout: 20000 });
check('cheese cooked', (await G(`window.__emberEgg.kitchen.burners.some(b => b.item?.kind === 'cheese' && b.done)`)) === true);
await pressE();
await near(145, 430);
await pressE();
check('cheese on plate, omelet complete', (await G(`window.__emberEgg.recipeForPlate?.id`)) === 'omelet');

// 5. Take the plate, serve at the window.
await pressE();
check('plate carried', (await G(`window.__emberEgg.cook.carrying?.type`)) === 'plate');
await near(145, 260);
await pressE();
const served = await G(`window.__emberEgg.orders.served`);
const coins = await G(`window.__emberEgg.coins`);
check('omelet served for coins', served === 1 && coins > 0, `served=${served} coins=${coins}`);

// 6. Chopping: tomato on the board becomes chopped.
await near(260, 610);
await pressE();
check('take tomato', (await G(`window.__emberEgg.cook.carrying?.item?.kind`)) === 'tomato');
await near(1015, 750);
await pressE();
check('tomato on board', (await G(`window.__emberEgg.kitchen.board.item?.kind`)) === 'tomato');
await sleep(2000);
check('tomato chopped', (await G(`window.__emberEgg.kitchen.board.done`)) === true);
await pressE();
check('take chopped tomato', (await G(`window.__emberEgg.cook.carrying?.item?.state`)) === 'chopped');

// 7. Order expiry costs a heart.
const hearts0 = await G(`window.__emberEgg.hearts`);
await G(`window.__emberEgg.orders.forceOrders([{recipeId:'roti', remaining:1}])`);
await sleep(1800);
const hearts1 = await G(`window.__emberEgg.hearts`);
check('expired order costs a heart', hearts1 === hearts0 - 1, `${hearts0} -> ${hearts1}`);

// 8. FPS over 2 seconds of live play.
const fps = await page.evaluate(() => new Promise((resolve) => {
  let n = 0;
  const t0 = performance.now();
  const tick = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else resolve(n / 2); };
  requestAnimationFrame(tick);
}));
check('render loop ~60fps', fps > 30, fps.toFixed(1) + ' fps');

// 9. Game over on a short shift, then restart with R.
await page.goto('http://127.0.0.1:8125/?shift=6&seed=2');
await sleep(500);
await page.keyboard.press('Enter');
await sleep(7500);
check('game over when shift ends', (await G(`window.__emberEgg.phase`)) === 'over');
await page.keyboard.press('r');
await sleep(300);
check('R restarts a new shift', (await G(`window.__emberEgg.phase`)) === 'playing');

// 10. No console/page errors, no external requests.
check('zero console/page errors', errors.length === 0, errors.join(' | ').slice(0, 300));
const external = requests.filter((u) => !u.startsWith('http://127.0.0.1:8125/'));
check('zero external requests', external.length === 0, external.join(', ').slice(0, 200));
console.log('total requests:', requests.length);

await browser.close();
server.close();
process.exit(failures ? 1 : 0);
