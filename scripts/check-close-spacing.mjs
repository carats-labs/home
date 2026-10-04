/**
 * Measures the closing act's spacing and ragging.
 *
 * A screenshot said the paragraph still ended on an orphan word, which
 * contradicted the computed values. This reads the values and the real gaps so
 * the disagreement is settled by measurement rather than by squinting.
 */
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';

const require = createRequire(import.meta.url);
const candidates = ['playwright-core', '../carats-home/node_modules/playwright-core', '../node_modules/playwright-core'];
const installed = candidates.map((p) => resolve(process.cwd(), p)).find((p) => existsSync(p));
const { chromium } = installed ? require(installed) : await import('playwright-core');

const PORT = Number(process.argv[2] ?? 3280);
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

  for (const width of [1440, 768, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`${BASE}/en`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const r = await page.evaluate(() => {
      const lede = document.querySelector('.close-lede');
      const cmd = document.querySelector('.command-close');
      const sec = document.querySelector('.secondary-action');
      const h2 = document.querySelector('.act-close h2');
      const cs = getComputedStyle(lede);
      const lb = lede.getBoundingClientRect();
      const cb = cmd.getBoundingClientRect();
      const sb = sec.getBoundingClientRect();

      // how many visual lines, and how wide the last one is
      const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.85;
      const lines = Math.round(lb.height / lh);

      return {
        ledeWidth: Math.round(lb.width),
        maxWidth: cs.maxWidth,
        textWrap: cs.textWrap || cs.textWrapStyle,
        textAlign: cs.textAlign,
        lines,
        lineHeight: Math.round(lh),
        gapLedeToCommand: Math.round(cb.top - lb.bottom),
        gapCommandToSecondary: Math.round(sb.top - cb.bottom),
        gapH2ToLede: Math.round(lb.top - h2.getBoundingClientRect().bottom),
        commandMarginTop: getComputedStyle(cmd).marginTop,
        text: lede.textContent.trim(),
      };
    });

    console.log(`\n${width}px`);
    console.log(`  lede width ${r.ledeWidth}px (max ${r.maxWidth}, wrap ${r.textWrap})`);
    console.log(`  lines ${r.lines} at ${r.lineHeight}px, align ${r.textAlign}`);
    console.log(`  h2 -> lede     ${r.gapH2ToLede}px`);
    console.log(`  lede -> cmd    ${r.gapLedeToCommand}px  (margin-top ${r.commandMarginTop})`);
    console.log(`  cmd -> cta     ${r.gapCommandToSecondary}px`);

    // the paragraph must not collide with the command below it
    if (r.gapLedeToCommand < 28) problems.push(`${width}px: only ${r.gapLedeToCommand}px between the lede and the command`);
    // and the two controls must be visibly separate
    if (r.gapCommandToSecondary < 12) problems.push(`${width}px: only ${r.gapCommandToSecondary}px between command and CTA`);
    await page.close();
  }
} catch (error) {
  problems.push(String(error.message ?? error));
  console.log(`\nfailed: ${error.message ?? error}`);
  if (log) console.log(`\n--- server ---\n${log.slice(0, 1000)}`);
} finally {
  await browser.close();
  if (!child.killed) child.kill();
}

console.log(problems.length ? `\n${problems.length} PROBLEM(S)\n  ${problems.join('\n  ')}` : '\nPASS');
process.exit(problems.length ? 1 : 0);