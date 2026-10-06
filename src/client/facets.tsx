import { defineFacets } from '@carats/render';
import ErrorPage from './pages/_error';
import Landing, { landingFor } from './pages/landing';
import NotFound from './pages/_not_found';
import { LOCALES, localePath } from '../i18n/locales';
import { ROUTES } from '../server/culets';

/**
 * Declaration order is priority order.
 *
 * `getPageComponent` walks `routes` with `for...in` and returns the first pattern
 * `matchRoute` accepts, and `matchRoute` requires an exact segment count. So the
 * bare locale prefix has to be declared before the parametrised one, or `/en`
 * would be swallowed by `/:lang/:slug`.
 *
 * Each locale is declared as a literal path rather than left to `/:lang`, because
 * `carats-ssg` pre-renders only the routes whose key contains no parameter — it
 * filters with `!route.includes('/:')`. With only `/:lang` declared, the generator
 * emitted `/` and nothing else: there was no `/en`, `/tr` or `/ar` file to host,
 * and the whole reason for `build:static` was to produce them. Literal keys also
 * mean no culet and no fetch — see the note on `landingFor`.
 *
 * There is deliberately no `/:lang` route. An unknown first segment such as `/de`
 * matches nothing here, so `getPageComponent` returns its own fallback —
 * `suspense.notFound`, rendered by `NotFound` — which is a 404 page that reads the
 * requested segment and speaks the reader's language.
 *
 * The landing page used to be registered at `/:lang` and carry a not-found branch
 * of its own, on the reasoning that it had to refuse a language it does not ship.
 * That is the framework's job, not the page's: the fallback already does it, with
 * the same `noindex` and the same localised copy. Keeping a second implementation
 * meant two places to change when the not-found page changed, and the landing
 * component had to carry an `ok` flag and a `requested` string that existed only
 * to describe a failure the route should never have been given.
 *
 * The 404 status still comes from the guard in `app.ts`, which is unaffected: it
 * judges paths, not routes.
 */
export default defineFacets({
  routes: {
    [ROUTES.root]: Landing,
    // literal, and ahead of `/:lang`, so each locale is a distinct pre-renderable route
    ...Object.fromEntries(LOCALES.map((locale) => [localePath(locale), landingFor(locale)])),
  },
  suspense: {
    error: ErrorPage,
    notFound: NotFound,
    loading: () => <div class="boot" role="status" aria-live="polite" />,
  },
  inAppRouting: true,
});