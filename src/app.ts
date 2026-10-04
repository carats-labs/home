/**
 * The express application.
 *
 * `@carats/express` is a router with a catch-all, and its catch-all answers with
 * `res.status(200)` unconditionally. Every unmatched request therefore returns
 * `200`, whatever the URL was — so `/de` and `/nonsense` would be served as
 * successful pages and indexed as duplicates of the landing page.
 *
 * The framework gives a component no way to set the status: `CaratsServerEntry.render`
 * returns only `{ html, head }`, and the one status hook in the system (`_status`
 * on a culet) applies to the `/culet/*` JSON endpoint, not to a page.
 *
 * So the status is pinned here, ahead of the framework, by holding `writeHead`.
 * The alternative — rendering the page ourselves to control the status — would
 * mean duplicating the framework's template substitution, which is the part most
 * likely to drift.
 */
import { carats } from '@carats/express';
import express, { type Response } from 'express';
import { LOCALES } from './i18n/locales';

const app = express();
const port = Number(process.env.PORT ?? 5173);

/**
 * Whether this request is for a page rather than for a file.
 *
 * Judged by what a page URL cannot contain, rather than by listing every
 * extension the app uses. A list was the first attempt and it was wrong twice
 * over: `/entrypoint.ts` was missing from it, and `/@vite/client` — Vite's own
 * client, which has no extension — was indistinguishable from `/nonsense`.
 * Both were answered with a forced `404`, which left the page unstyled and the
 * JavaScript unloaded.
 *
 * So: a page URL has no dot in its last segment, and does not address one of
 * Vite's internal paths.
 */
const isPageRequest = (req: express.Request): boolean => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  // the client asks for /culet/* JSON; that is the framework's own endpoint
  if (req.path.startsWith('/culet/')) return false;
  // Vite's dev client and its transformed modules live under /@
  if (req.path.startsWith('/@')) return false;

  const last = req.path.split('/').filter(Boolean).pop() ?? '';
  return !last.includes('.');
};

/**
 * Whether a route can serve this path.
 *
 * `/` and `/:lang` are the landing page in some language. `/:lang/:slug` is
 * declared but has no page yet, so a second segment is a 404 — the rule lives
 * here so there is one place to change when the first secondary page lands.
 */
const isKnownPath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return true;
  if (!LOCALES.includes(segments[0] as (typeof LOCALES)[number])) return false;

  return segments.length === 1;
};

/**
 * Forces `404` on unmatched page requests, whatever the framework later asks for.
 *
 * `res.status(404)` alone is not enough: the catch-all calls `res.status(200)`
 * after this middleware has run, overwriting it. `writeHead` is the last word
 * before the bytes go out, so the status is applied there instead.
 */
const pinNotFound = (req: express.Request, res: Response, next: express.NextFunction): void => {
  if (!isPageRequest(req) || isKnownPath(req.path)) {
    next();
    return;
  }

  const writeHead = res.writeHead.bind(res);
  res.writeHead = ((status: number, ...rest: unknown[]) => {
    void status; // the framework's code is deliberately discarded
    // keep the framework's own headers; only the code is replaced
    return writeHead(404, ...(rest as [Parameters<Response['writeHead']>[1]]));
  }) as Response['writeHead'];

  next();
};

app.use(pinNotFound);
app.use(carats());

export default app.listen(port, (error) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log(`Carats listening on http://localhost:${port}`);
});
