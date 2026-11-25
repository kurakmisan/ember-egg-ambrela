// Takes the entry's screenshots from the real game in headless Chromium (development tool only).
// Usage: node tools/take-shots.mjs   (serves game/ on a local port, loads each ?shot= pose)
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = fileURLToPath(new URL('../game', import.meta.url));
const shotsDir = fileURLToPath(new URL('../screenshots', import.meta.url));
const require = createRequire(process.env.PLAYWRIGHT_FROM + '/');
const { chromium } = require('playwright');

const SHOTS = [
  ['1-kitchen-rush.jpg', 'cover'],
  ['2-title.jpg', 'title'],
  ['3-plate-ready.jpg', 'serve'],
  ['4-service-rush.jpg', 'rush'],
];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript' };

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
await new Promise((ready) => server.listen(8124, '127.0.0.1', ready));
mkdirSync(shotsDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => console.log('console:', m.text()));
page.on('pageerror', (e) => console.log('pageerror:', e.message));
for (const [file, pose] of SHOTS) {
  await page.goto('http://127.0.0.1:8124/?shot=' + pose + '&seed=1');
  await page.waitForFunction(() => document.title === 'shot-ready', null, { timeout: 15000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(shotsDir, file), type: 'jpeg', quality: 84 });
  console.log('wrote', file);
}
await browser.close();
server.close();
