/**
 * Screenshots a single region by selector, so a stale file from an earlier run
 * cannot be mistaken for the current state.
 *
 *   node scripts\shot.mjs [port] [selector] [name] [width]
 */
import { createRequire } from 'module';
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';

const require = createRequire(import.meta.url);
const candidates = ['playwright-core', '../carats-home/node_modules/playwright-core', '../node_modules/playwright-core'];
const installed = candidates.map((p) => resolve(process.cwd(), p)).find((p) => existsSync(p));
const { chromium } = installed ? require(installed) : await import('playwright-core');

const PORT = Number(process.argv[2] ?? 3285);
const SELECTOR = process.argv[3] ?? '.act-close';
const NAME = process.argv[4] ?? 'region';
const WIDTH = Number(process.argv[5] ?? 1440);
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = resolve('.scratch');
mkdirSync(OUT, { recursive: true });

const child = spawn('bun', ['src/app.ts'], {
  cwd: resolve('.'),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
child.stdout.on('data', (d) => (log += d));
child.stderr.on('data', (d) => (log += d));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });

try {
  const end = Date.now() + 60_000;
  let up = false;
  while (Date.now() < end && !up) {
    if (child.exitCode !== null) throw new Error(`server exited\n${log}`);
    try {
      await fetch(`${BASE}/en`, { method: 'HEAD' });
      up = true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  if (!up) throw new Error(`no response\n${log}`);

  const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });
  await page.goto(`${BASE}/en`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(6500); // let the hero entrance finish

  // reveal everything, then settle on the region
  await page.evaluate(() => {
    document.querySelectorAll('.reveal, .chart, .table-wrap').forEach((e) => e.classList.add('in-view'));
    document.querySelector('.js')?.classList.add('js');
  });
  await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center' }), SELECTOR);
  await page.waitForTimeout(700);

  const el = await page.$(SELECTOR);
  if (!el) throw new Error(`${SELECTOR} not found`);
  const path = resolve(OUT, `${NAME}.png`);
  await el.screenshot({ path });
  console.log(`wrote ${path}`);
} catch (error) {
  console.log(`failed: ${error.message ?? error}`);
  if (log) console.log(`\n--- server ---\n${log.slice(0, 1000)}`);
} finally {
  await browser.close();
  if (!child.killed) child.kill();
}