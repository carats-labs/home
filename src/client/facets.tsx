import { defineFacets } from '@carats/render';
import ErrorPage from './pages/_error';
import Landing from './pages/landing';
import NotFound from './pages/_not_found';
import { ROUTES } from '../server/culets';

/**
 * Declaration order is priority order.
 *
 * `getPageComponent` walks `routes` with `for...in` and returns the first pattern
 * `matchRoute` accepts, and `matchRoute` requires an exact segment count. So the
 * bare locale prefix has to be declared before the parametrised one, or `/en`
 * would be swallowed by `/:lang/:slug`.
 *
 * `/:lang` also matches `/de`, because the pattern does not constrain the value.
 * The landing page therefore checks the resolved locale itself and renders its
 * not-found state for a language the site does not ship, rather than falling back
 * to English under a URL that names another one.
 */
export default defineFacets({
  routes: {
    [ROUTES.root]: Landing,
    [ROUTES.home]: Landing,
    [ROUTES.page]: NotFound,
  },
  suspense: {
    error: ErrorPage,
    notFound: NotFound,
    loading: () => <div class="boot" role="status" aria-live="polite" />,
  },
  inAppRouting: true,
});