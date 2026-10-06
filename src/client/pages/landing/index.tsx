import { afterMount, beforeMount } from '@carats/hooks';
import type { CaratsComponent } from '@carats/render';
import Hero from '../../components/Hero';
import ReceiptAct from '../../components/acts/ReceiptAct';
import LoadAct from '../../components/acts/LoadAct';
import CloseAct from '../../components/acts/CloseAct';
import { registerBenchmarkBehaviour } from './behaviour';
import { pageContent } from '../../../i18n/props';
import type { Locale } from '../../../i18n/locales';
import './landing.sass';

/**
 * The landing page, in whichever language the URL asked for.
 *
 * Three acts, one continuous scroll: the comparison table is the evidence, the
 * chart is the evidence under pressure, and the close earns the install.
 *
 * There is deliberately no opening act that counts up to a byte figure. That
 * figure is measured on `benchmark/carats-app` — a separate four-route demo built
 * once with Carats and once with Next.js — and showing it as a lone "5,436 B"
 * with no application named made every reader take it for the weight of the page
 * they were looking at. It is not; this page ships roughly four times that. The
 * numbers now appear only inside the table, whose caption names the application
 * they belong to.
 *
 * The page resolves its own content from the URL rather than being handed it. See
 * the note on {@link Landing} below for why that is what makes a static build work.
 */
async function Landing(this: CaratsComponent, props: { lang: Locale }) {
  // The dictionary is fetched here rather than imported up front, so `/tr` does not
  // also pull `en.json` and `ar.json`. On the server this resolves from disk before
  // the first byte; in the browser it is one small chunk, fetched only if the reader
  // switches language.
  const content = await pageContent(props.lang);

  /**
   * `<html lang>` and `<html dir>` sit outside the head slot Carats exposes, so
   * the document element is the only place a component can reach them — and
   * `beforeMount` is client-only, which would leave the server's Arabic HTML in
   * the wrong direction until the bundle runs.
   *
   * So the rendered page carries `lang` and `dir` on its own root as well. `dir`
   * inherits, which means the direction is correct in the server's response, for a
   * reader with JavaScript disabled, and before first paint. The document element
   * is still updated on the client, because that is what assistive technology and
   * the browser's own UI read.
   */
  beforeMount(() => {
    const root = document.documentElement;
    root.lang = content.locale;
    root.dir = content.dir;
  });

  /**
   * Every observer, listener and timer is registered here, and `afterMount` runs
   * the returned cleanup before the next render. Carats replaces the whole `#app`
   * subtree on each navigation, so behaviour has to be re-attached every time —
   * which is the bug that left the counter reading `0B` after a language change.
   *
   * Unconditional, because every route that reaches this component names a locale
   * the site ships. There is no failure case to skip: an unsupported language does
   * not land here, it misses the route table entirely and is answered by
   * `suspense.notFound`. That is why `props.lang` is typed as `Locale` and not
   * `string | undefined` — the type is the guarantee, so there is no flag to read
   * and no branch that could be got wrong.
   */
  afterMount(() => registerBenchmarkBehaviour());

  const { copy } = content;

  this.head = (
    <>
      <title>{`${copy.heroTitle} — ${copy.heroLine1}`}</title>
      <meta name="description" content={copy.heroLine2} />
      <meta property="og:title" content={copy.heroTitle} />
      <meta property="og:description" content={copy.heroLine2} />
      <meta property="og:type" content="website" />
    </>
  );

  return (
    /* `lang` and `dir` on the page root as well as the document: the document
       values are set client-side only, so without these the server's response
       would render Arabic left-to-right until the bundle arrived. */
    <div class="site" lang={content.locale} dir={content.dir}>
      <div class="page">
        <Hero props={content} />
      </div>

      <main class="acts" id="benchmark">
        <ReceiptAct props={content} />
        <LoadAct props={content} />
        <CloseAct props={content} />
      </main>

      <footer class="foot">
        <div class="foot-rule">
          <span class="foot-mark">{copy.footerMark}</span>
        </div>
      </footer>
    </div>
  );
}

/**
 * The landing page is not a burnished component, and that is what makes the static
 * build usable.
 *
 * A burnished component is one Carats refetches props for from `/culet/<url>`,
 * and the client's own condition for doing so is
 *
 *     if (component.burnished && (ssp.for !== url || component.recast))
 *
 * `recast: true` made that true unconditionally, so every render — including the
 * first hydration of a page the server had already rendered — asked a server for
 * props it had been given. On a static host there is no `/culet/*` endpoint, the
 * response is not JSON, and the page lands in the error boundary. A backend was
 * not a deployment preference here; it was a hard requirement of the component.
 *
 * Unburnished, the client never fetches. It reads props from one of two places:
 *
 *   - first load:  `ssp.data`, the props the server serialised into the document
 *   - navigation:  `{ ...routeParams, ...component.defaultProps }`
 *
 * Both have to produce the page, so the page resolves itself from the language it
 * is handed with `pageContent` — the same pure function either side, which also
 * means the server-injected JSON is now just `{ lang: "en" }` instead of a full
 * copy of every translated string.
 *
 * The navigation branch is what a static host actually exercises: picking a
 * language calls `history.pushState` and re-renders, with no network at all.
 *
 * A literal route contributes no params — `matchRoute('/en', '/en')` returns `{}`,
 * because the pattern has nothing to bind — so each locale gets its own component
 * instance carrying `defaultProps`. That `defaultProps` is the only source of the
 * language for those routes, which is why it is typed `Locale` and not `string`.
 */
export function landingFor(locale: Locale): CaratsComponent<{ lang: Locale }> {
  const Page = function Page(this: CaratsComponent<{ lang: Locale }>, props: { lang: Locale }) {
    return Landing.call(this, props);
  } as CaratsComponent<{ lang: Locale }>;

  Page.defaultProps = { lang: locale };
  return Page;
}

/**
 * The bare `/` route, whose language comes from `Accept-Language`.
 *
 * Kept separate from {@link landingFor} because the negotiation is a server-only
 * concern: there is no request header in the browser, so this instance cannot
 * derive its language and takes it from a culet instead. The culet is typed, so
 * `lang` is a `Locale` here too and the component sees no difference between the
 * two ways of arriving.
 */
export default Landing;