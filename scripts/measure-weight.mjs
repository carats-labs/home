/**
 * Measures what a visitor actually downloads for this page.
 *
 * These numbers are NOT the ones the page quotes. The quoted figures come from
 * `benchmark/carats-app` — a separate four-route demo built once with Carats and
 * once with Next.js — and the whole table is a comparison of those two builds of
 * that one application. This page is a later artifact that deliberately ships
 * client-side behaviour, so its own weight is a different question.
 *
 * Worth knowing anyway, because it is the number that decides whether the page is
 * fast, and because it shows what the client-side features cost.
 *
 *   node scripts/measure-weight.mjs [port]
 */
import { spawn } from 'child_process';
import { gzipSync } from 'zlib';
import { resolve } from 'path';

const PORT = Number(process.argv[2] ?? 3190);
const BASE = `http://127.0.0.1:${PORT}`;
const LOCALES = ['en', 'tr', 'ar'];

const child = spawn('bun', ['dist/app.js'], {
  cwd: resolve('.'),
  env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
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
      await fetch(`${BASE}/assets/favicon.svg`, { method: 'HEAD' });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`no response in ${timeoutMs}ms\n${log}`);
};

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;

try {
  await waitForServer(45_000);
  console.log(`\nproduction build on ${BASE}\n`);

  console.log('  locale   html raw / gzip   css gzip   js gzip   total gzip');
  for (const locale of LOCALES) {
    const html = await (await fetch(`${BASE}/${locale}`, { headers: { 'accept-encoding': 'gzip' } })).text();
    const htmlRaw = Buffer.byteLength(html);
    const htmlGzip = gzipSync(html).length;

    const assets = [...html.matchAll(/(?:href|src)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
    let css = 0;
    let js = 0;
    for (const asset of new Set(assets)) {
      const buf = Buffer.from(await (await fetch(`${BASE}${asset}`)).arrayBuffer());
      const gz = gzipSync(buf).length;
      if (asset.endsWith('.css')) css += gz;
      else if (asset.endsWith('.js')) js += gz;
    }

    console.log(
      `  ${locale.padEnd(7)} ${kb(htmlRaw).padStart(9)} / ${kb(htmlGzip).padStart(6)} ${kb(css).padStart(10)} ${kb(js).padStart(9)} ${kb(htmlGzip + css + js).padStart(12)}`,
    );
  }

  console.log('\n  These are this page\'s own figures. The 5,436 B quoted on the page');
  console.log('  belongs to benchmark/carats-app, a separate four-route demo measured');
  console.log('  against the same app built with Next.js. The two are not comparable.');
} catch (error) {
  console.log(`\nprobe failed: ${error.message ?? error}`);
  if (log) console.log(`\n--- server ---\n${log.slice(0, 2000)}`);
} finally {
  stop();
}