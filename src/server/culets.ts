/**
 * Server-side props.
 *
 * There is exactly one culet, and its existence is the reason every other route
 * has none.
 *
 * A culet is the only way a component can receive props that come from the
 * *request* rather than the URL: `Accept-Language` has no equivalent in the
 * browser, so the bare `/` cannot derive its language and has to be handed one.
 * Every other route knows its language from its own path and reads it from its own
 * params, which is what lets the client re-render those routes with no network at
 * all, and therefore what lets a static host serve them.
 *
 * Registering a culet for `/en` as well would be harmless on the server and fatal
 * on the client: a culet makes its component's props arrive over `/culet/*`, and
 * that endpoint does not exist once the output is a directory of HTML files.
 */
import { culet } from '@carats/ssr';
import { assertFactsUnchanged } from '../benchmark/facts';
import { rootPageProps } from '../i18n/props';

/**
 * The one route that needs a culet, named here so the facets cannot drift from it.
 *
 * The not-found patterns live in `facets.tsx`, where they are declared for
 * matching order rather than for props. They need no culet: the framework hands a
 * route its own params, so `lang` arrives from the path and both sides resolve it
 * the same way.
 */
export const ROUTES = {
  /** Bare `/` — the language is negotiated from Accept-Language. */
  root: '/',
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
 * Props for the bare root, and only there.
 *
 * `/en`, `/tr` and `/ar` deliberately have no culet. Without one the server
 * resolves them the same way the client does — `{ ...params, ...defaultProps }` —
 * so both sides build the page from the same input and cannot disagree about what
 * `/en` renders.
 */
culet(ROUTES.root, ({ headers }) => rootPageProps(headers['accept-language']));