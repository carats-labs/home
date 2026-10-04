/**
 * Renders the landing page in a real browser and reports what is actually on it.
 *
 * The route probe checks status codes and markup. That is not enough: a page can
 * return 200, contain every string, and still be visually empty, because the
 * reveal rules hide content until JavaScript confirms it can show it. A broken
 * build fails here rather than in front of a visitor.
 *
 *   node scripts/inspect-page.mjs [port] [locale] [width]
 */
/**
 * playwright-core is not a dependency of the site, so it is resolved from the
 * copy that is already on the machine rather than added to package.json for one
 * inspection script.
 */
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const require = createRequire(import.meta.url);
const CANDIDATES = [
  'playwright-core',
  '../carats-home/node_modules/playwright-core',
  '../node_modules/playwright-core',
];

const playwrightPath = CANDIDATES.map((p) => resolve(process.cwd(), p)).find((p) => existsSync(p));
const { chromium } = playwrightPath ? require(playwrightPath) : await import('playwright-core');

const PORT = Number(process.argv[2] ?? 3195);
/** receipt, load, close. The opening byte-counter act was removed: a bare 
/** 5,436 B  read as the weight of the page being viewed, when it belongs to 
/** benchmark/carats-app. */
const ACTS = 3;
const LOCALE = process.argv[3] ?? 'en';
const WIDTH = Number(process.argv[4] ?? 1440);
const BASE = `http://127.0.0.1:${PORT}`;

const child = spawn('bun', ['src/app.ts'], {
  cwd: resolve('.'),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let log = '';
child.stdout.on('data', (d) => (log += d));
child.stderr.on('data', (d) => (log += d));

const stop = () => !child.killed && child.kill();

const waitForServer = async (timeoutMs) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`server exited ${child.exitCode}\n${log}`);
    try {
      await fetch(`${BASE}/${LOCALE}`, { method: 'HEAD' });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`no response in ${timeoutMs}ms\n${log}`);
};

const problems = [];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });

try {
  await waitForServer(60_000);
  const page = await browser.newPage({ viewport: { width: WIDTH, height: 900 } });

  const errors = [];
  const failed = [];

  /* Vite's HMR socket is dev tooling, not the page. A headless browser racing
     another dev server for the HMR port produces handshake failures that say
     nothing about the code under test, so they are not counted here. */
  const isHmrNoise = (text) => /WebSocket|vite\] failed to connect|\[vite\]/i.test(text);

  page.on('pageerror', (e) => !isHmrNoise(String(e)) && errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && !isHmrNoise(m.text()) && errors.push(m.text()));
  page.on('requestfailed', (r) => failed.push(`${r.url()} ${r.failure()?.errorText ?? ''}`));
  page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));

  await page.goto(`${BASE}/${LOCALE}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const report = await page.evaluate(() => {
    const visible = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.opacity !== '0' && s.visibility !== 'hidden' && s.display !== 'none' && r.height > 0;
    };
    const reveals = [...document.querySelectorAll('.reveal')];

    return {
      title: document.title,
      heading: document.querySelector('h1')?.textContent?.trim(),
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      siteDir: document.querySelector('.site')?.getAttribute('dir'),
      reveals: reveals.length,
      revealsHidden: reveals.filter((el) => !visible(el)).length,
      hiddenFirst: reveals.filter((el) => !visible(el)).slice(0, 4).map((el) => el.className),
      acts: document.querySelectorAll('.act').length,
      rows: document.querySelectorAll('.table tbody tr').length,
      bars: document.querySelectorAll('.chart-bar').length,
      scrollHeight: document.documentElement.scrollHeight,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  console.log(`\n${LOCALE} at ${WIDTH}px\n`);
  console.log(`  title            ${report.title}`);
  console.log(`  heading          ${report.heading}`);
  console.log(`  lang / dir       ${report.lang} / ${report.dir}   (page root: ${report.siteDir})`);
  console.log(`  acts             ${report.acts}`);
  console.log(`  reveals hidden   ${report.revealsHidden} of ${report.reveals}`);
  if (report.hiddenFirst.length) console.log(`                   ${report.hiddenFirst.join(' | ')}`);
  console.log(`  table rows       ${report.rows}`);
  console.log(`  chart bars       ${report.bars}`);
  console.log(`  page height      ${report.scrollHeight}px`);
  console.log(`  h-overflow       ${report.horizontalOverflow}px`);
  console.log(`  console errors   ${errors.length ? errors.join(' | ') : 'none'}`);
  console.log(`  failed requests  ${failed.length ? '\n                   ' + failed.join('\n                   ') : 'none'}`);

  if (report.acts !== ACTS) problems.push(`expected ${ACTS} acts, found ${report.acts}`);
  if (report.rows !== 13) problems.push(`expected 13 table rows, found ${report.rows}`);
  if (report.bars !== 10) problems.push(`expected 10 chart bars, found ${report.bars}`);
  if (report.horizontalOverflow > 0) problems.push(`${report.horizontalOverflow}px horizontal overflow`);
  if (errors.length) problems.push(`${errors.length} console error(s)`);
  if (failed.length) problems.push(`${failed.length} failed request(s)`);
  if (report.pageHeight < 3000) problems.push(`page is only ${report.pageHeight}px tall; styles are probably not applied`);

  // scroll the whole page so every observer gets a chance to fire
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
  });
  await page.waitForTimeout(1200);

  const afterScroll = await page.evaluate(() => {
    const visible = (el) => {
      const s = getComputedStyle(el);
      return s.opacity !== '0' && s.visibility !== 'hidden';
    };
    const reveals = [...document.querySelectorAll('.reveal')];
    return {
      hidden: reveals.filter((el) => !visible(el)).length,
      total: reveals.length,
    };
  });

  console.log(`\n  after scrolling  ${afterScroll.hidden} of ${afterScroll.total} still hidden`);

  /* Reveals hidden on load is correct: the hero fills the viewport and every act
     begins below it, so nothing should be revealed yet. The assertion is that
     scrolling reveals all of them. */
  if (afterScroll.hidden > 0) problems.push(`${afterScroll.hidden} reveal(s) still hidden after scrolling`);
} catch (error) {
  problems.push(String(error.message ?? error));
  console.log(`\ninspect failed: ${error.message ?? error}`);
  if (log) console.log(`\n--- server ---\n${log.slice(0, 2000)}`);
} finally {
  await browser.close();
  stop();
}

console.log(problems.length ? `\n${problems.length} PROBLEM(S)\n  ${problems.join('\n  ')}` : '\nPASS');
process.exit(problems.length ? 1 : 0);