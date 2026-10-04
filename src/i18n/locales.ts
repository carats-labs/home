/**
 * The locale is part of the URL: `/:lang`, `/:lang/:slug`.
 *
 * `matchRoute` matches on exact segment count with no wildcards, so the three
 * shapes below are declared explicitly rather than with one parametrised route.
 * Declaration order is priority order, because `getPageComponent` returns the
 * first match from `for...in` over `routes`.
 *
 * `/:lang` is declared before `/:lang/:slug` so the landing page wins for the
 * bare locale prefix. It also means an unknown first segment such as `/de`
 * resolves to `/:lang` with `lang: "de"`, which `resolveLocale` rejects and the
 * page turns into a 404 — see routes.ts.
 */

/** Every locale the site ships. Order is the order they appear in the picker. */
export const LOCALES = ['en', 'tr', 'ar'] as const;

export type Locale = (typeof LOCALES)[number];

/** The locale used when a request carries no usable language preference. */
export const DEFAULT_LOCALE: Locale = 'en';

/** Endonyms: a language picker should never translate a language into itself. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  tr: 'Türkçe',
  ar: 'العربية',
};

/** BCP 47 tags for `<html lang>`. Kept beside the locale rather than guessed. */
export const LOCALE_BCP47: Record<Locale, string> = {
  en: 'en',
  tr: 'tr',
  ar: 'ar',
};

const RTL_LOCALES: ReadonlySet<Locale> = new Set<Locale>(['ar']);

export const isRtl = (locale: Locale): boolean => RTL_LOCALES.has(locale);

export const dirOf = (locale: Locale): 'ltr' | 'rtl' => (isRtl(locale) ? 'rtl' : 'ltr');

const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

/**
 * Narrows an arbitrary URL segment to a supported locale.
 *
 * Returns `null` rather than falling back, because a caller that maps
 * `/de/latest` onto English would serve a German URL with English copy and a
 * `200`, which is worse than an honest 404.
 */
export const resolveLocale = (value: string | undefined): Locale | null =>
  value !== undefined && isLocale(value) ? value : null;

/**
 * Picks the best supported locale from an `Accept-Language` header.
 *
 * Quality values are honoured and ties keep header order. Tags are matched on
 * their primary subtag, so `en-GB`, `en_US` and `en` all resolve to `en`;
 * anything unsupported falls back to {@link DEFAULT_LOCALE}.
 */
export const negotiateLocale = (acceptLanguage: string | undefined): Locale => {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const candidates = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith('q='))
        ?.slice(2);

      return {
        tag: tag.trim().toLowerCase(),
        // An absent or unparseable q is 1 per RFC 9110. The index breaks ties
        // so the sort is stable without relying on the engine's sort.
        quality: q === undefined ? 1 : Number.parseFloat(q) || 0,
        index,
      };
    })
    .filter((c) => c.tag !== '' && c.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const { tag } of candidates) {
    const primary = tag.split('-')[0];
    if (isLocale(primary)) return primary;
  }

  return DEFAULT_LOCALE;
};

/**
 * Builds a path for a locale.
 *
 * Every internal link goes through here rather than being written by hand, so a
 * locale change can never produce a link that drops the reader back to English.
 * Paths are passed unencoded and only the locale and slug segments are
 * interpolated, both of which are drawn from closed sets.
 */
export const localePath = (locale: Locale, slug = ''): string => `/${locale}${slug ? `/${slug}` : ''}`;

/** A stable key for `<link rel="alternate">`, which wants the BCP 47 tag. */
export const alternateHref = (locale: Locale, slug = ''): string => localePath(locale, slug);