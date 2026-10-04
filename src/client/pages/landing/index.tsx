import { afterMount, beforeMount } from '@carats/hooks';
import { Burnish, type CaratsComponent } from '@carats/render';
import Hero from '../../components/Hero';
import ReceiptAct from '../../components/acts/ReceiptAct';
import LoadAct from '../../components/acts/LoadAct';
import CloseAct from '../../components/acts/CloseAct';
import { NotFoundBody, localeOf } from '../_not_found';
import { registerBenchmarkBehaviour } from './behaviour';
import type { LocalePageProps, PageContent } from '../../../i18n/props';
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
 */
function Landing(this: CaratsComponent, props: LocalePageProps) {
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
    root.lang = props.ok ? props.locale : 'en';
    root.dir = props.ok ? props.dir : 'ltr';
  });

  /**
   * Every observer, listener and timer is registered here, and `afterMount` runs
   * the returned cleanup before the next render. Carats replaces the whole `#app`
   * subtree on each navigation, so behaviour has to be re-attached every time —
   * which is the bug that left the counter reading `0B` after a language change.
   *
   * Nothing is registered for the not-found branch, which has no acts to animate.
   */
  afterMount(() => (props.ok ? registerBenchmarkBehaviour() : undefined));

  /* `/:lang` matches any first segment, so `/de` lands here rather than on a
     route that could refuse it. Rendering the not-found body is what stops an
     unsupported language being served English copy under a URL that names a
     fourth language. The 404 status comes from the guard in app.ts. */
  if (!props.ok) {
    this.head = (
      <>
        <title>Carats</title>
        <meta name="robots" content="noindex" />
      </>
    );
    return <NotFoundBody locale={localeOf(props.requested)} />;
  }

  const content: PageContent = props;
  const { sheet } = content;

  this.head = (
    <>
      <title>{`${sheet.heroTitle} — ${sheet.heroLine1}`}</title>
      <meta name="description" content={sheet.heroLine2} />
      <meta property="og:title" content={sheet.heroTitle} />
      <meta property="og:description" content={sheet.heroLine2} />
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
          <span class="foot-mark">{sheet.footerMark}</span>
        </div>
      </footer>
    </div>
  );
}

/**
 * `Burnish` is what makes the props arrive.
 *
 * Without it, a client-side navigation re-renders the component from
 * `{...params, ...defaultProps}` — the route params and nothing else. For this
 * page that means `{ lang: 'tr' }`, which has no `ok`, so the component took its
 * not-found branch: the language menu disappeared, `<html lang>` never changed,
 * and there was no way to switch back. The culet was never called.
 *
 * Marking it burnished tells Carats to fetch `/culet/<url>` for real props on
 * navigation, which is exactly what a page whose content is assembled on the
 * server needs. `recast` forces that fetch even when the URL has not changed,
 * which is what makes the picker usable after a switch.
 */
export default Burnish(Landing, { recast: true });