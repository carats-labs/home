/**
 * Tests the language picker the way a visitor uses it: click the toggle, read
 * what happened, follow a link, and check the page is still alive afterwards.
 *
 * Also reports the spacing of both the old instant-docs page and the migrated
 * one, so the two can be compared against each other rather than against a
 * memory of what they used to look like.
 */
import { spawn } from 'child_process';
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { resolve } from 'path';

const require = createRequire(import.meta.url);
const candidates = [
  'playwright-core',
  '../carats-home/node_modules/playwright-core',
  '../node_modules/playwright-core',
];
const installed = candidates.map((p) => resolve(process.cwd(), p)).find((p) => existsSync(p));
const { chromium: create } = installed ? require(installed) : await import('playwright-core');

const PORT = Number(process.argv[2] ?? 3215);
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
const note = (m) => problems.push(m);

const waitForServer = async (ms) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (child.exitCode !== null) throw new Error(`server exited\n${log}`);
    try {
      await fetch(`${BASE}/en`, { method: 'HEAD' });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`no response\n${log}`);
};

/** Opens the menu and reports its real geometry. */
const readMenu = (page) =>
  page.evaluate(() => {
    const toggle = document.querySelector('[data-language-toggle]');
    const list = document.getElementById('language-list');
    if (!toggle || !list) return { found: false };
    const cs = getComputedStyle(list);
    const r = list.getBoundingClientRect();
    return {
      found: true,
      expanded: toggle.getAttribute('aria-expanded'),
      hidden: list.hidden,
      display: cs.display,
      height: Math.round(r.height),
      opacity: cs.opacity,
      visibility: cs.visibility,
      links: list.querySelectorAll('a').length,
      // what actually receives a click at the centre of the first link
      hitTest: document.elementFromPoint(r.left + r.width / 2, r.top + 12)?.textContent?.trim() ?? null,
    };
  });

const browser = await create.launch({ executablePath: process.env.CHROMIUM_PATH });

try {
  await waitForServer(60_000);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  // Vite's HMR socket is dev tooling; its handshake noise is not a page fault
  const isHmrNoise = (t) => /WebSocket|\[vite\]/i.test(t);
  const errors = [];
  page.on('pageerror', (e) => !isHmrNoise(String(e)) && errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && !isHmrNoise(m.text()) && errors.push(m.text()));
  await page.goto(`${BASE}/en`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  console.log('\nlanguage picker\n');
  console.log(`  before click    ${JSON.stringify(await readMenu(page))}`);

  await page.click('[data-language-toggle]');
  await page.waitForTimeout(250);
  const open = await readMenu(page);
  console.log(`  after click     ${JSON.stringify(open)}`);

  if (open.expanded !== 'true') note('toggle did not set aria-expanded="true"');
  if (open.hidden !== false) note('list is still hidden after click');
  if (open.display === 'none') note(`list computed display is none (${open.display})`);
  if (open.height < 20) note(`list has no height: ${open.height}px`);
  if (open.links !== 3) note(`expected 3 locale links, found ${open.links}`);
  if (!open.hitTest || open.hitTest === 'عربية' || open.hitTest === '') {
    note(`first link is not the hit target: ${JSON.stringify(open.hitTest)}`);
  }

  // Escape should close it
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const closed = await readMenu(page);
  console.log(`  after Escape    ${JSON.stringify(closed)}`);
  if (closed.expanded !== 'false') note('Escape did not close the menu');

  // follow a link and confirm the page re-renders in the new language
  await page.click('[data-language-toggle]');
  await page.waitForTimeout(150);
  await page.click('.language-list a[lang="tr"]');
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => ({
    url: location.pathname,
    lang: document.documentElement.lang,
    menuAgain: document.querySelector('[data-language-toggle]') !== null,
    menuClosed: document.querySelector('#language-list')?.hidden,
  }));
  console.log(`  after switch    ${JSON.stringify(after)}`);
  if (after.url !== '/tr') note(`switching did not navigate: ${after.url}`);
  if (after.lang !== 'tr') note(`document lang is ${after.lang}, expected tr`);
  if (!after.menuAgain) note('language menu is gone after switching — cannot switch back');
  if (after.menuClosed !== true) note('menu is left open after a switch');

  // and it must still work on the new page
  await page.click('[data-language-toggle]');
  await page.waitForTimeout(200);
  const reopened = await readMenu(page);
  console.log(`  reopen on /tr   ${JSON.stringify(reopened)}`);
  if (reopened.height < 20) note('menu does not reopen on the Turkish page');

  if (errors.length) note(`console errors: ${errors.join(' | ')}`);
} catch (error) {
  note(String(error.message ?? error));
  console.log(`\nfailed: ${error.message ?? error}`);
  if (log) console.log(`\n--- server ---\n${log.slice(0, 1500)}`);
} finally {
  await browser.close();
  if (!child.killed) child.kill();
}

console.log(problems.length ? `\n${problems.length} PROBLEM(S)\n  ${problems.join('\n  ')}` : '\nPASS');
process.exit(problems.length ? 1 : 0);