/**
 * Server-side props.
 *
 * A culet is keyed by the exact route string used in `facets.tsx`, so the two
 * files have to agree. The route strings are declared here and imported by the
 * facets, so a typo cannot leave a culet silently unregistered.
 */
import { culet, type CuletArgs } from '@carats/ssr';
import { assertFactsUnchanged } from '../benchmark/facts';
import {
  resolvePageProps,
  rootPageProps,
  type LocalePageProps,
} from '../i18n/props';

/** Route strings, shared with the facets so the two cannot drift apart. */
export const ROUTES = {
  /** Bare `/` — the language is negotiated from Accept-Language. */
  root: '/',
  /** `/:lang`, the landing page in a specific language. */
  home: '/:lang',
  /** `/:lang/:slug`, for the secondary pages. */
  page: '/:lang/:slug',
} as const;

/**
 * Fails the process if a quoted figure has drifted from the recorded run.
 *
 * Asserted once at import rather than per request: the values are compile-time
 * constants, so a mismatch cannot be fixed at runtime and there is no reason to
 * pay for the check twice.
 */
assertFactsUnchanged();

/**
 * Props for a locale route.
 *
 * `params.lang` is `Record<string, string>` from the router, so it may be absent
 * even on a route that declares it. `resolvePageProps` narrows it: an unsupported
 * language produces `{ ok: false }` rather than a fallback, and the page renders
 * its not-found state instead of English under a foreign URL.
 */
const fromParams = ({ params }: CuletArgs): LocalePageProps => resolvePageProps(params.lang);

culet<LocalePageProps>(ROUTES.root, ({ headers }) => rootPageProps(headers['accept-language']));
culet<LocalePageProps>(ROUTES.home, fromParams);

/**
 * The not-found route's props.
 *
 * Only the raw segment, so the page can say the not-found copy in the language
 * that was asked for. `/en/nonsense` should read "This page does not exist" in
 * English and `/ar/nonsense` in Arabic, rather than reverting every reader to
 * English because they reached a dead end.
 */
culet<{ lang: string }>(ROUTES.page, ({ params }) => ({ lang: params.lang ?? '' }));