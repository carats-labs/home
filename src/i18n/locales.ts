/**
 * Which locales exist, and how to get one's dictionary.
 *
 * The dictionaries are `./dictionaries/*.json` — one file per language, holding its
 * copy together with the facts about it that only that language needs: reading
 * direction, numeral system, unit labels. Keys beginning with `__` are metadata;
 * everything else is translatable copy.
 *
 * They are loaded per locale with a dynamic `import()`, not imported up front, so
 * loading `/tr` does not also fetch `en.json` and `ar.json`. Three consequences,
 * all of them intended:
 *
 *   - Vite emits one small chunk per dictionary instead of inlining all three into
 *     the client bundle, so a visitor pays for one language rather than three.
 *   - Switching language fetches the other dictionary, and then caches it. So the
 *     page component is async, and {@link prefetch} warms the other two while the
 *     reader is on the first one — the picker then switches without a wait.
 *   - The server is unaffected: it renders one locale per request and has all three
 *     available on disk.
 *
 * The two facts every dictionary would have to repeat — a language's own name and
 * its BCP 47 tag — live here instead, because the language picker needs all three
 * *before* any of them is loaded. Keeping them in the JSON as well would mean two
 * places to change and no way to check they agree.
 */
import type en from './dictionaries/en.json';

/** Every locale the site ships. Order is the order they appear in the picker. */
export const LOCALES = ['en', 'es', 'tr', 'ar'] as const;

export type Locale = (typeof LOCALES)[number];

/** The locale used when a request carries no usable language preference. */
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * A language's name in that language.
 *
 * An endonym: a picker must never translate a language into itself. Static because
 * the picker shows all of them at once, so it cannot wait on a dictionary it has
 * not loaded.
 */
export const LOCALE_NAMES: Readonly<Record<Locale, string>> = {
  en: 'English',
  es: 'Español',
  tr: 'Türkçe',
  ar: 'العربية',
};

/** Reading direction. */
export type Direction = 'ltr' | 'rtl';

/** The metadata keys, which describe the language rather than its copy. */
type MetaKey = `__${string}`;

/** The translatable string keys, as a union. */
export type CopyKey = Exclude<keyof typeof en, MetaKey | 'rowLabels'>;

/** The row-label keys: the benchmark's own row ids. */
export type RowLabelKey = keyof (typeof en)['rowLabels'];

/**
 * One locale's dictionary.
 *
 * `__dir` is typed `string` rather than {@link Direction}, and that is deliberate:
 * TypeScript widens every JSON string, so `"__dir": "rtl"` arrives as `string`
 * whatever it is declared to be. Declaring it a `Direction` would assert the value
 * is valid before anything checked it — and would not fail, because `as` silences
 * the mismatch. So the width is stated honestly and {@link direction} narrows it
 * once, by value.
 */
export type Dictionary = {
  readonly __dir: string;
  readonly __numberLocale: string;
  readonly __dateLocale: string;
  readonly __dateNumberingSystem?: string;
  readonly __units: { readonly rps: string };
  readonly rowLabels: Readonly<Record<RowLabelKey, string>>;
} & Readonly<Record<CopyKey, string>>;

/**
 * The dictionaries, each behind a dynamic import.
 *
 * The arrow functions are what defer the fetch: `import()` is evaluated when called,
 * not when this module is loaded. A plain `import ar from '...'` at the top of the
 * file would pull all three into the entry chunk, which is the thing being avoided.
 */
const LOADERS: Readonly<Record<Locale, () => Promise<Dictionary>>> = {
  en: async () => (await import('./dictionaries/en.json')).default,
  es: async () => (await import('./dictionaries/es.json')).default,
  tr: async () => (await import('./dictionaries/tr.json')).default,
  ar: async () => (await import('./dictionaries/ar.json')).default,
};

const loaded = new Map<Locale, Promise<Dictionary>>();

/**
 * One locale's dictionary, fetched once and remembered.
 *
 * The promise is cached rather than the value, so two components asking for `tr`
 * during one render share a single request instead of racing.
 *
 * A dictionary that fails to load rejects rather than falling back to English: a
 * locale switch that silently shows another language is worse than an error.
 */
export function dictionary(locale: Locale): Promise<Dictionary> {
  const cached = loaded.get(locale);
  if (cached) return cached;

  const pending = LOADERS[locale]();
  loaded.set(locale, pending);
  return pending;
}

/**
 * The direction a locale reads in.
 *
 * The one runtime check in the i18n layer, and it earns its place: a typo in
 * `__dir` is invisible to the compiler for the reason above, and the consequence
 * would be a whole language silently rendering the wrong way round.
 */
export function direction(dict: Dictionary): Direction {
  if (dict.__dir !== 'ltr' && dict.__dir !== 'rtl') {
    throw new Error(`__dir is "${dict.__dir}", expected "ltr" or "rtl"`);
  }

  return dict.__dir;
}

const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

/**
 * Picks the best supported locale from an `Accept-Language` header.
 *
 * Quality values are honoured and ties keep header order. Tags are matched on
 * their primary subtag, so `en-GB`, `en_US` and `en` all resolve to `en`; anything
 * unsupported falls back to {@link DEFAULT_LOCALE}.
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