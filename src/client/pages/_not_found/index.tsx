import { beforeMount } from '@carats/hooks';
import type { CaratsComponent } from '@carats/render';
import { LOCALES, LOCALE_NAMES, DEFAULT_LOCALE, direction, dictionary, localePath, type Locale } from '../../../i18n/locales';
import './notfound.sass';

interface Copy {
  readonly kicker: string;
  readonly heading: string;
  readonly lede: string;
  readonly action: string;
}

const COPY: Readonly<Record<Locale, Copy>> = {
  en: {
    kicker: 'Not found',
    heading: 'This page does not exist.',
    lede: 'The address may be mistyped, or the page may have moved.',
    action: 'Read the documentation',
  },
  tr: {
    kicker: 'Bulunamadı',
    heading: 'Bu sayfa mevcut değil.',
    lede: 'Adres yanlış yazılmış olabilir ya da sayfa taşınmış olabilir.',
    action: 'Dokümantasyonu okuyun',
  },
  ar: {
    kicker: 'غير موجود',
    heading: 'هذه الصفحة غير موجودة.',
    lede: 'قد يكون العنوان مكتوبًا بشكل خاطئ، أو ربما نُقلت الصفحة.',
    action: 'اقرأ التوثيق',
  },
};

const asLocale = (value: string | undefined): Locale | null =>
  value !== undefined && (LOCALES as readonly string[]).includes(value) ? (value as Locale) : null;

/**
 * Resolves a URL segment to a locale, or the default when it names none we have.
 *
 * `/de` has no dictionary, so there is nothing to write that page's copy in beyond
 * the default — which is the honest answer for a 404, and the reason the not-found
 * copy is a separate table from the dictionaries rather than a key inside them.
 */
export const localeOf = (lang: string | undefined): Locale => asLocale(lang) ?? DEFAULT_LOCALE;

/**
 * The not-found page body.
 *
 * A plain component with no `this`: Carats calls a nested component as
 * `type(props)`, with no receiver, so `this.head` inside one throws and turns a
 * 404 into a 500. Anything that needs the head slot has to be a route.
 */
export function NotFoundBody({ locale }: { locale: Locale }) {
  const copy = COPY[locale];

  return (
    <div class="notfound">
      <p class="kicker">{copy.kicker}</p>
      <h1>{copy.heading}</h1>
      <p class="lede">{copy.lede}</p>

      <a class="action" href="https://docs.carats.dev">
        {copy.action}
      </a>

      <nav class="locales" aria-label={copy.kicker}>
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
 * its props — which the culet supplies as the raw segment — and never reads the
 * document, which does not exist there.
 */
NotFound.status = 404;
export default async function NotFound(this: CaratsComponent, props?: { lang?: string }) {
  const locale = localeOf(props?.lang);
  const copy = COPY[locale];
  this.status = 404;

  // Async for the dictionary, and only for `__dir`: the page's own copy is the COPY
  // table above, so this is one small fetch to learn which way the page reads. The
  // alternative is a second list of RTL locales beside the dictionaries, and two
  // lists cannot be checked against each other.
  const dir = direction(await dictionary(locale));

  beforeMount(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  });

  this.head = (
    <>
      <title>{`${copy.kicker} — Carats`}</title>
      {/* A page that does not exist should not be indexed as if it were content. */}
      <meta name="robots" content="noindex" />
    </>
  );

  return <NotFoundBody locale={locale} />;
}

