/**
 * Screenshots the three areas that need work, so spacing and placement can be
 * judged from the rendered page rather than from the stylesheet.
 *
 *   node scripts/shoot-regions.mjs [port]
 */
import { createRequire } from 'module';
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';

const require = createRequire(import.meta.url);
const candidates = ['playwright-core', '../carats-home/node_modules/playwright-core', '../node_modules/playwright-core'];
const installed = candidates.map((p) => resolve(process.cwd(), p)).find((p) => existsSync(p));
const { chromium } = installed ? require(installed) : await import('playwright-core');

const PORT = Number(process.argv[2] ?? 3270);
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

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/en`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000); // let the hero finish its entrance

  /* The measurements behind the three complaints, printed next to the images so
     a visual judgement and a number can be checked against each other. */
  const report = await page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const c = getComputedStyle(el);
      return {
        sel,
        x: Math.round(r.x),
        y: Math.round(r.y + window.scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
        font: `${c.fontSize} ${c.fontWeight} ${c.fontFamily.split(',')[0].replace(/['"]/g, '')}`,
        letter: c.letterSpacing,
        marginTop: c.marginTop,
        marginBottom: c.marginBottom,
        padding: c.padding,
      };
    };
    return {
      nav: box('.language-nav'),
      navParent: document.querySelector('.language-nav')?.parentElement?.className,
      navOffsetParent: getComputedStyle(document.querySelector('.language-nav')).position,
      eyebrow: box('.eyebrow'),
      heroText: box('.hero-text'),
      heroMedia: box('.hero-media'),
      actionLabel: box('.action-label'),
      actionLink: box('.action-link'),
      command: box('.command'),
      actionDivider: box('.action-divider'),
      closeShell: box('.close-shell'),
      closePair: box('.close-pair'),
      closeCommand: box('.command-close'),
      secondary: box('.secondary-action'),
      closeMethod: box('.bn-method'),
      method: box('.method'),
    };
  });

  console.log('\nmeasurements\n');
  for (const [k, v] of Object.entries(report)) {
    if (v === null) {
      if (['navParent', 'navOffsetParent'].includes(k)) console.log(`  ${k.padEnd(14)} ${v}`);
      continue;
    }
    if (k === 'navParent' || k === 'navOffsetParent') {
      console.log(`  ${k.padEnd(14)} ${v}`);
      continue;
    }
    console.log(
      `  ${k.padEnd(14)} x${String(v.x).padStart(5)} y${String(v.y).padStart(5)} ${String(v.w).padStart(5)}x${String(v.h).padStart(4)}  ${v.font.padEnd(28)} ls ${v.letter.padEnd(7)} mt ${v.marginTop.padEnd(8)} mb ${v.marginBottom.padEnd(8)}`,
    );
  }

  // regions worth looking at
  const shots = [
    { name: 'hero', clip: { x: 0, y: 0, width: 1440, height: 900 } },
    { name: 'action-row', clip: await page.evaluate(() => {
        const r = document.querySelector('.action-row').getBoundingClientRect();
        return { x: 0, y: Math.max(0, r.y + window.scrollY - 120), width: 1440, height: Math.min(400, r.height + 240) };
      }) },
    { name: 'close', clip: await page.evaluate(() => {
        const el = document.querySelector('.act-close');
        el.scrollIntoView();
        const r = el.getBoundingClientRect();
        return { x: 0, y: 0, width: 1440, height: 900 };
      }) },
    { name: 'close-only', clip: await page.evaluate(() => {
        const r = document.querySelector('.close-shell').getBoundingClientRect();
        return { x: Math.max(0, r.x - 80), y: Math.max(0, r.y - 80), width: Math.min(1440, r.width + 160), height: Math.min(900, r.height + 160) };
      }) },
  ];

  for (const shot of shots) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(120);
    if (shot.name.startsWith('close')) {
      await page.evaluate(() => document.querySelector('.act-close').scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: resolve(OUT, `${shot.name}.png`), clip: shot.clip });
    console.log(`\n  wrote .scratch/${shot.name}.png`);
  }

  // language menu open
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('[data-language-toggle]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: resolve(OUT, 'language-open.png') });
  console.log('  wrote .scratch/language-open.png');
} catch (error) {
  console.log(`\nfailed: ${error.message ?? error}`);
  if (log) console.log(`\n--- server ---\n${log.slice(0, 1200)}`);
} finally {
  await browser.close();
  if (!child.killed) child.kill();
}