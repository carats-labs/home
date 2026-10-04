/**
 * Compares the hero against the original, at every width, and reports what the
 * video is actually rendering at.
 *
 * The migration guessed at the hero: a `minmax(0,1fr)` text column where the
 * original has a fixed 380px, and a `max-width` on the hero where the original
 * has none. That is what made the video look wrong, and it is not visible from
 * the stylesheet alone — the numbers have to be read off both pages.
 *
 *   node scripts/compare-hero.mjs [newPort] [oldUrl]
 */
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';

const require = createRequire(import.meta.url);
const candidates = ['playwright-core', '../carats-home/node_modules/playwright-core', '../node_modules/playwright-core'];
const installed = candidates.map((p) => resolve(process.cwd(), p)).find((p) => existsSync(p));
const { chromium } = installed ? require(installed) : await import('playwright-core');

const PORT = Number(process.argv[2] ?? 3240);
const OLD = process.argv[3] ?? 'http://localhost:3000/en/latest';
const BASE = `http://127.0.0.1:${PORT}`;
const WIDTHS = [390, 768, 1440, 2560, 3840];

const read = (page, videoSel, heroSel) =>
  page.evaluate(
    ([v, h]) => {
      const el = document.querySelector(v);
      const hero = document.querySelector(h);
      const video = el?.getBoundingClientRect();
      const heroBox = hero?.getBoundingClientRect();
      const page = document.querySelector('.page')?.getBoundingClientRect();
      return {
        videoW: video ? Math.round(video.width) : null,
        videoH: video ? Math.round(video.height) : null,
        videoX: video ? Math.round(video.x) : null,
        intrinsic: el ? `${el.videoWidth}x${el.videoHeight}` : null,
        heroCols: hero ? getComputedStyle(hero).gridTemplateColumns : null,
        heroW: heroBox ? Math.round(heroBox.width) : null,
        pageW: page ? Math.round(page.width) : null,
        pagePad: page ? getComputedStyle(document.querySelector('.page')).padding : null,
        actPad: (() => {
          const a = document.querySelector('.bn-act, .act');
          return a ? getComputedStyle(a).paddingBlock : null;
        })(),
        pageH: document.documentElement.scrollHeight,
      };
    },
    [videoSel, heroSel],
  );

const child = spawn('bun', ['src/app.ts'], {
  cwd: resolve('.'),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
child.stdout.on('data', (d) => (log += d));
child.stderr.on('data', (d) => (log += d));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const fmt = (v) => (v === null ? '  —  ' : String(v).padEnd(5));

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

  console.log('\nmigrated page\n');
  console.log('  vw    video      hero cols                heroW  pageW  actPad     pageH');
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`${BASE}/en`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const r = await read(page, '.hero-media', '.hero');
    console.log(
      `  ${String(width).padStart(5)} ${fmt(r.videoW) + 'x' + fmt(r.videoH).slice(0, 4)} ${(r.heroCols ?? '—').padEnd(24)} ${String(r.heroW).padStart(5)} ${String(r.pageW).padStart(6)}  ${(r.actPad ?? '—').padEnd(10)} ${r.pageH}`,
    );
    await page.close();
  }

  console.log(`\noriginal (${OLD})\n`);
  console.log('  vw    video      hero cols                heroW  pageW  actPad     pageH');
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    try {
      await page.goto(OLD, { waitUntil: 'networkidle', timeout: 25_000 });
      await page.waitForTimeout(500);
      const r = await read(page, '#diamond, .hero-media', '.hero');
      console.log(
        `  ${String(width).padStart(5)} ${fmt(r.videoW) + 'x' + fmt(r.videoH).slice(0, 4)} ${(r.heroCols ?? '—').padEnd(24)} ${String(r.heroW).padStart(5)} ${String(r.pageW).padStart(6)}  ${(r.actPad ?? '—').padEnd(10)} ${r.pageH}`,
      );
    } catch {
      console.log(`  ${String(width).padStart(5)} could not read`);
    }
    await page.close();
  }
} catch (error) {
  console.log(`\nfailed: ${error.message ?? error}`);
  if (log) console.log(`\n--- server ---\n${log.slice(0, 1200)}`);
} finally {
  await browser.close();
  if (!child.killed) child.kill();
}