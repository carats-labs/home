/**
 * Verifies the hero's entrance: that the video and the two text blocks start
 * hidden and reach full opacity, and that the animation is switched off entirely
 * for a reader who has asked for reduced motion.
 *
 * Sampling computed opacity over time is the only way to tell an entrance that
 * ran from one that is merely declared: a rule can exist and still never play.
 *
 *   node scripts/check-hero-entrance.mjs [port]
 */
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';

const require = createRequire(import.meta.url);
const candidates = ['playwright-core', '../carats-home/node_modules/playwright-core', '../node_modules/playwright-core'];
const installed = candidates.map((p) => resolve(process.cwd(), p)).find((p) => existsSync(p));
const { chromium } = installed ? require(installed) : await import('playwright-core');

const PORT = Number(process.argv[2] ?? 3250);
const BASE = `http://127.0.0.1:${PORT}`;

const child = spawn('bun', ['src/app.ts'], {
  cwd: resolve('.'),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
child.stdout.on('data', (d) => (log += d));
child.stderr.on('data', (d) => (log += d));

const problems = [];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });

const opacity = (page) =>
  page.evaluate(() => {
    const v = document.querySelector('.hero-media');
    const t = document.querySelector('.hero-text');
    const a = document.querySelector('.action-row');
    const cs = (el) => (el ? Number(getComputedStyle(el).opacity) : null);
    return { video: cs(v), text: cs(t), action: cs(a) };
  });

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
  await page.goto(`${BASE}/en`, { waitUntil: 'commit' });

  console.log('\nhero entrance, opacity over time\n');
  const samples = [];
  // the video fades over 5s after a 0.1s delay, so sample past that to see it land
  const CHECKPOINTS = [120, 600, 1500, 3000, 4500, 5600];
  const started = Date.now();

  for (const at of CHECKPOINTS) {
    const wait = at - (Date.now() - started);
    if (wait > 0) await page.waitForTimeout(wait);
    const elapsed = Date.now() - started;
    const o = await opacity(page);
    samples.push({ elapsed, ...o });
    console.log(
      `  ${String(elapsed).padStart(4)}ms   video ${o.video?.toFixed(2)}   text ${o.text?.toFixed(2)}   action ${o.action?.toFixed(2)}`,
    );
  }

  const first = samples[0];
  const last = samples[samples.length - 1];

  if (!(first.video < 0.5)) problems.push(`video starts at opacity ${first.video}, expected hidden`);
  if (!(first.text < 0.5)) problems.push(`hero text starts at opacity ${first.text}, expected hidden`);
  if (last.video !== 1) problems.push(`video ends at opacity ${last.video}, expected 1`);
  if (last.text !== 1) problems.push(`hero text ends at opacity ${last.text}, expected 1`);
  if (last.action !== 1) problems.push(`action row ends at opacity ${last.action}, expected 1`);
  // the text must be visibly moving: rising 24px, not merely fading
  const moved = await page.evaluate(() => {
    const t = document.querySelector('.hero-text');
    return t ? getComputedStyle(t).transform : null;
  });
  console.log(`\n  final transform on .hero-text: ${moved}`);

  // reduced motion: everything visible immediately, no animation
  const reduced = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await reduced.goto(`${BASE}/en`, { waitUntil: 'networkidle' });
  await reduced.waitForTimeout(250);
  const r = await opacity(reduced);
  console.log(`\n  prefers-reduced-motion   video ${r.video?.toFixed(2)}   text ${r.text?.toFixed(2)}   action ${r.action?.toFixed(2)}`);
  if (r.video !== 1 || r.text !== 1 || r.action !== 1) {
    problems.push(`reduced motion left something hidden: ${JSON.stringify(r)}`);
  }
} catch (error) {
  problems.push(String(error.message ?? error));
  console.log(`\nfailed: ${error.message ?? error}`);
  if (log) console.log(`\n--- server ---\n${log.slice(0, 1200)}`);
} finally {
  await browser.close();
  if (!child.killed) child.kill();
}

console.log(problems.length ? `\n${problems.length} PROBLEM(S)\n  ${problems.join('\n  ')}` : '\nPASS');
process.exit(problems.length ? 1 : 0);