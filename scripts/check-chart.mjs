/**
 * Measures both series of the load chart.
 *
 * The Next.js row was rendering bars that could not be seen: a dark grey gradient
 * on a near-black surface. The chart's entire argument is the two rows side by
 * side, so a row that disappears is the feature failing, not a cosmetic detail.
 * The bar lengths are checked here so a zero-height bar is also caught.
 */
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';

const require = createRequire(import.meta.url);
const candidates = ['playwright-core', '../carats-home/node_modules/playwright-core', '../node_modules/playwright-core'];
const installed = candidates.map((p) => resolve(process.cwd(), p)).find((p) => existsSync(p));
const { chromium } = installed ? require(installed) : await import('playwright-core');

const PORT = Number(process.argv[2] ?? 3275);
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
  await page.evaluate(() => document.querySelector('.chart').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1500);

  const bars = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.chart-row').forEach((row) => {
      const series = row.className.includes('is-carats') ? 'carats' : 'nextjs';
      row.querySelectorAll('.chart-bar').forEach((bar, i) => {
        const r = bar.getBoundingClientRect();
        const c = getComputedStyle(bar);
        out.push({
          series,
          i,
          w: Math.round(r.width),
          h: Math.round(r.height),
          border: c.borderTopColor,
          bg: c.backgroundImage.replace(/rgba?\([^)]*\)/g, (m) => m).slice(0, 60),
        });
      });
    });
    return out;
  });

  console.log('\nchart bars\n');
  console.log('  series  i    w    h   border-top');
  for (const b of bars) {
    console.log(`  ${b.series.padEnd(7)} ${String(b.i).padStart(2)} ${String(b.w).padStart(4)} ${String(b.h).padStart(4)}   ${b.border}`);
  }

  const heights = (series) => bars.filter((b) => b.series === series).map((b) => b.h);
  const carats = heights('carats');
  const nextjs = heights('nextjs');

  console.log(`\n  carats heights ${carats.join(', ')}`);
  console.log(`  nextjs heights ${nextjs.join(', ')}`);

  for (const [name, hs] of [['carats', carats], ['nextjs', nextjs]]) {
    if (hs.length !== 5) problems.push(`${name} row has ${hs.length} bars, expected 5`);
    if (hs.some((h) => h < 4)) problems.push(`${name} has a bar under 4px: ${hs.join(', ')}`);
  }

  // the series must be distinguishable at a glance, not only by label
  const borderOf = (series) => bars.find((b) => b.series === series)?.border;
  if (borderOf('carats') === borderOf('nextjs')) {
    problems.push(`both series use the same border colour: ${borderOf('carats')}`);
  }

  await page.screenshot({ path: resolve('.scratch', 'chart.png'), clip: await page.evaluate(() => {
    const r = document.querySelector('.chart').getBoundingClientRect();
    return { x: 0, y: Math.max(0, r.y - 20), width: 1440, height: Math.min(880, r.height + 40) };
  }) });
  console.log('\n  wrote .scratch/chart.png');
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