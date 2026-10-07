import { beforeMount } from '@carats/hooks';
import type { CaratsComponent } from '@carats/render';
import {
  LOCALES,
  LOCALE_NAMES,
  DEFAULT_LOCALE,
  direction,
  dictionary,
  localePath,
  type CopyKey,
  type Locale,
} from '../../../i18n/locales';
import { copyFor } from '../../../i18n/props';
import './notfound.sass';

const asLocale = (value: string | undefined): Locale | null =>
  value !== undefined && (LOCALES as readonly string[]).includes(value) ? (value as Locale) : null;

/**
 * Resolves a URL segment to a locale, or the default when it names none we have.
 *
 * `/de` has no dictionary, so it is answered in the default language. That is the
 * honest answer — the reader asked for a language the site does not have, and
 * showing them English rather than an empty page is more use than nothing. It is
 * also the *only* awkward part of putting this copy in the dictionaries, and it does
 * not justify a second copy table: this page already loads a dictionary, for the
 * reading direction, so the strings were one property read away.
 */
export const localeOf = (lang: string | undefined): Locale => asLocale(lang) ?? DEFAULT_LOCALE;

/**
 * The not-found page body.
 *
 * A plain component with no `this`: Carats calls a nested component as
 * `type(props)`, with no receiver, so `this.head` inside one throws and turns a
 * 404 into a 500. Anything that needs the head slot has to be a route.
 *
 * Takes the resolved copy rather than a locale, so it holds no lookup of its own
 * and the same body serves any locale the dictionaries carry.
 */
export function NotFoundBody({ copy, locale }: { copy: Readonly<Record<CopyKey, string>>; locale: Locale }) {
  return (
    <div class="notfound">
      <p class="kicker">{copy.notFoundKicker}</p>
      <h1>{copy.notFoundHeading}</h1>
      <p class="lede">{copy.notFoundLede}</p>

      <a class="action" href={`https://docs.carats.dev/${locale}/latest`}>
        {copy.notFoundAction}
      </a>

      <nav class="locales" aria-label={copy.notFoundKicker}>
        {LOCALES.map((code) => (
          <a href={localePath(code)} hreflang={code} lang={code}>
            {LOCALE_NAMES[code]}
          </a>
        ))}
      </nav>
    </div>
  );
}

/**
 * The not-found route.
 *
 * Registered for `/:lang/:slug` and for anything no route matches, so it must
 * render on the server for every dead URL. It therefore takes the language from
 * its props — which the route's params supply as the raw segment — and never reads
 * the document, which does not exist there.
 */
export default async function NotFound(this: CaratsComponent, props?: { lang?: string }) {
  const locale = localeOf(props?.lang);

  // The dictionary, for the page's copy and its reading direction. Both come from
  // the same fetch, and the copy is `{token}`-substituted like every other page, so
  // a string on a 404 is subject to the same parity checks as the landing page.
  const dict = await dictionary(locale);
  const copy = copyFor(dict);

  beforeMount(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction(dict);
  });

  this.status = 404;
  this.head = (
    <>
      <title>{`${copy.notFoundKicker} — Carats`}</title>
      {/* A page that does not exist should not be indexed as if it were content. */}
      <meta name="robots" content="noindex" />
    </>
  );

  return <NotFoundBody copy={copy} locale={locale} />;
}