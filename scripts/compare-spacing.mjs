/**
 * Compares the spacing of the migrated page against the original instant-docs
 * page, side by side.
 *
 * The hero rhythm was the thing that looked wrong: the migration re-derived it
 * from scratch rather than reading the original's values, so the eyebrow gap, the
 * action-row offset and the section padding all drifted. This measures both
 * pages in the same browser and prints the differences, so "does it look the
 * same" stops being a matter of opinion.
 *
 *   node scripts/compare-spacing.mjs [newPort] [oldUrl]
 */
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';

const require = createRequire(import.meta.url);
const candidates = ['playwright-core', '../carats-home/node_modules/playwright-core', '../node_modules/playwright-core'];
const installed = candidates.map((p) => resolve(process.cwd(), p)).find((p) => existsSync(p));
const { chromium } = installed ? require(installed) : await import('playwright-core');

const PORT = Number(process.argv[2] ?? 3220);
const OLD = process.argv[3] ?? 'http://localhost:3000/en/latest';
const BASE = `http://127.0.0.1:${PORT}`;

/** Both sites' selectors, mapped to one name so the rows line up. */
const PROBES = [
  { key: 'page padding', new: '.page', old: '.page', read: 'padding' },
  { key: 'hero gap', new: '.hero', old: '.hero', read: 'gap' },
  { key: 'eyebrow size', new: '.eyebrow', old: '.eyebrow', read: 'fontSize' },
  { key: 'eyebrow margin-bottom', new: '.eyebrow', old: '.eyebrow', read: 'marginBottom' },
  { key: 'h1 font-size', new: 'h1', old: 'h1', read: 'fontSize' },
  { key: 'tagline margin-top', new: '.tagline', old: '.tagline', read: 'marginTop' },
  { key: 'tagline font-size', new: '.tagline', old: '.tagline', read: 'fontSize' },
  { key: 'action-row margin-top', new: '.action-row', old: '.action-row', read: 'marginTop' },
  { key: 'action-body gap', new: '.action-body', old: '.action-body', read: 'gap' },
  { key: 'command padding', new: '.command', old: '.command-block', read: 'padding' },
  { key: 'section padding-block', new: '.act', old: '.bn-act', read: 'paddingBlock' },
  { key: 'kicker margin-bottom', new: '.kicker', old: '.bn-kicker', read: 'marginBottom' },
  { key: 'h2 font-size', new: '.act h2', old: '.bn-act h2', read: 'fontSize' },
  { key: 'lede margin-top', new: '.lede', old: '.bn-lede', read: 'marginTop' },
  { key: 'table-wrap margin-top', new: '.table-wrap', old: '.bn-table-wrap', read: 'marginTop' },
  { key: 'footer padding-bottom', new: '.foot', old: '.bn-foot', read: 'paddingBottom' },
];

const readAll = (page, probes) =>
  page.evaluate((list) => {
    const out = {};
    for (const p of list) {
      const el = document.querySelector(p.sel);
      if (!el) {
        out[p.key] = null;
        continue;
      }
      const cs = getComputedStyle(el);
      out[p.key] = {
        value: cs[p.read],
        // where the element starts and ends, for the rhythm rather than the box
        top: Math.round(el.getBoundingClientRect().top + window.scrollY),
      };
    }
    out.__pageHeight = document.documentElement.scrollHeight;
    return out;
  }, probes);

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

  const newProbes = PROBES.map((p) => ({ key: p.key, sel: p.new, read: p.read }));
  const oldProbes = PROBES.map((p) => ({ key: p.key, sel: p.old, read: p.read }));

  const pageA = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pageA.goto(`${BASE}/en`, { waitUntil: 'networkidle' });
  await pageA.waitForTimeout(400);
  const a = await readAll(pageA, newProbes);

  const pageB = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let b = null;
  try {
    await pageB.goto(OLD, { waitUntil: 'networkidle', timeout: 30_000 });
    await pageB.waitForTimeout(600);
    b = await readAll(pageB, oldProbes);
  } catch (error) {
    console.log(`\ncould not read the original at ${OLD}: ${error.message}`);
  }

  console.log(`\nspacing: migrated vs original\n`);
  if (b) {
    console.log('  property                     migrated        original');
    for (const p of PROBES) {
      const left = a[p.key]?.value ?? 'missing';
      const right = b[p.key]?.value ?? 'missing';
      const same = left === right;
      console.log(`  ${p.key.padEnd(26)} ${String(left).padEnd(14)} ${String(right).padEnd(14)}${same ? '' : '   <-- differs'}`);
    }
    console.log(`\n  page height                 ${String(a.__pageHeight).padEnd(14)} ${b.__pageHeight}`);
  } else {
    for (const p of PROBES) console.log(`  ${p.key.padEnd(26)} ${a[p.key]?.value ?? 'missing'}`);
    console.log(`\n  page height                 ${a.__pageHeight}`);
  }
} catch (error) {
  console.log(`\nfailed: ${error.message ?? error}`);
  if (log) console.log(`\n--- server ---\n${log.slice(0, 1200)}`);
} finally {
  await browser.close();
  if (!child.killed) child.kill();
}