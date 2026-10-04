/**
 * Boots the dev server, makes one request per route, prints status and length,
 * then shuts the server down.
 *
 * The server has to live inside this single command: it is started, exercised and
 * stopped here, because a background process does not survive between separate
 * invocations.
 *
 *   node scripts/probe-routes.mjs [port]
 */
import { spawn } from 'child_process';
import { resolve } from 'path';

const PORT = Number(process.argv[2] ?? 3182);
const BASE = `http://127.0.0.1:${PORT}`;

const ROUTES = [
  { path: '/en', expect: 200, note: 'English landing' },
  { path: '/tr', expect: 200, note: 'Turkish landing' },
  { path: '/ar', expect: 200, note: 'Arabic landing' },
  { path: '/', expect: 200, note: 'root, negotiated' },
  { path: '/de', expect: 404, note: 'unsupported language' },
  { path: '/nonsense', expect: 404, note: 'unknown path' },
  { path: '/en/nonsense', expect: 404, note: 'unknown slug' },
];

/** Checks that must hold in the rendered body, not just the status line. */
const BODY_CHECKS = [
  { path: '/en', find: '5,436', note: 'English counter formatted with commas' },
  { path: '/tr', find: '5.436', note: 'Turkish counter formatted with dots' },
  { path: '/ar', find: '5,436', note: 'Arabic counter' },
  { path: '/en', find: '3,828 B', note: 'English table groups thousands' },
  { path: '/tr', find: '3.828 B', note: 'Turkish table uses its own separator' },
  { path: '/ar', find: '3,828 B', note: 'Arabic table' },
  { path: '/en', find: '4,256 rps', note: 'English throughput is grouped' },
  { path: '/tr', find: '4.256 rps', note: 'Turkish throughput' },
  { path: '/en', find: 'Memory the framework itself adds', note: 'memory row label' },
  { path: '/en', find: 'Requests served per second', note: 'chart unit label' },
  { path: '/en', find: 'Requests per second at concurrency 1 to 200', note: 'chart caption' },
  { path: '/en', find: 'bn-', notFound: true, note: 'no old instant-docs class names' },
  { path: '/en', find: '%d%.', notFound: true, note: 'no unsubstituted placeholders' },
  { path: '/tr', find: 'Her yüz', note: 'Turkish copy is Turkish' },
  { path: '/ar', find: 'كل وجه', note: 'Arabic copy is Arabic' },
  { path: '/ar', find: 'dir="rtl"', note: 'Arabic page declares rtl' },
  { path: '/en', find: 'dir="ltr"', note: 'English page declares ltr' },
  { path: '/en/nonsense', find: 'This page does not exist', note: '404 copy in the requested language' },
  { path: '/ar/nonsense', find: 'هذه الصفحة غير موجودة', note: 'Arabic 404 copy' },
  { path: '/en', find: 'noindex', notFound: true, note: 'landing page is indexable' },
];

const child = spawn('bun', ['src/app.ts'], {
  cwd: resolve('.'),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverLog = '';
child.stdout.on('data', (d) => (serverLog += d));
child.stderr.on('data', (d) => (serverLog += d));

const stop = () => {
  if (!child.killed) child.kill();
};

/** Waits until the port answers, or the process dies trying. */
const waitForServer = async (timeoutMs) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`server exited ${child.exitCode}\n${serverLog}`);
    try {
      await fetch(`${BASE}/assets/favicon.svg`, { method: 'HEAD' });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`server did not answer within ${timeoutMs}ms\n${serverLog}`);
};

const failures = [];

try {
  await waitForServer(60_000);
  console.log(`\nserver up on ${BASE}\n`);

  console.log('  path           status  bytes   expected');
  for (const route of ROUTES) {
    const res = await fetch(`${BASE}${route.path}`);
    const body = await res.text();
    const ok = res.status === route.expect;
    if (!ok) failures.push(`${route.path} returned ${res.status}, expected ${route.expect}`);
    console.log(
      `  ${route.path.padEnd(13)} ${String(res.status).padStart(6)}  ${String(body.length).padStart(6)}   ${route.expect === res.status ? 'ok' : `MISMATCH (want ${route.expect})`}  ${route.note}`,
    );
  }

  console.log('\n  body            result  check');
  for (const check of BODY_CHECKS) {
    const body = await (await fetch(`${BASE}${check.path}`)).text();
    const present = body.includes(check.find);
    const ok = check.notFound ? !present : present;
    if (!ok) {
      failures.push(`${check.path}: ${check.notFound ? 'found' : 'missing'} "${check.find}" (${check.note})`);
    }
    console.log(
      `  ${(check.path + ' ' + check.find).slice(0, 16).padEnd(16)} ${(ok ? 'ok  ' : 'FAIL').padEnd(6)}  ${check.note}`,
    );
  }
} catch (error) {
  failures.push(String(error.message ?? error));
  console.log(`\nprobe failed: ${error.message ?? error}`);
  if (serverLog) console.log(`\n--- server output ---\n${serverLog.slice(0, 3000)}`);
} finally {
  stop();
}

console.log(failures.length ? `\n${failures.length} FAILED\n  ${failures.join('\n  ')}` : '\nPASS');
process.exit(failures.length ? 1 : 0);