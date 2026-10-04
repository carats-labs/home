/**
 * Builds the per-locale props a page renders from.
 *
 * The sheet is fetched here, on the server, and delivered as props. Nothing in
 * `src/client` imports a locale, so switching language cannot leave one string
 * behind in a client bundle and there is no client-side dictionary to download.
 */
import { comparisonRows, facts } from '../benchmark/facts';
import { ar, en, fill, tr, type ResolvedSheet, type Sheet, type SheetPlaceholders } from './sheet';
import { DEFAULT_LOCALE, dirOf, negotiateLocale, resolveLocale, type Locale } from './locales';

const SHEETS: Readonly<Record<Locale, Sheet>> = { en, tr, ar };

/**
 * Numerals as the locale writes them.
 *
 * English groups with a comma and Turkish with a dot, so the same figure reads
 * `176,227` to one reader and `176.227` to another. Arabic keeps Western digits,
 * which is the convention for technical copy in the region.
 */
const FORMATTERS: Readonly<Record<Locale, (n: number) => string>> = {
  en: (n) => n.toLocaleString('en-US'),
  tr: (n) => n.toLocaleString('tr-TR'),
  ar: (n) => n.toLocaleString('en-US'),
};

const group = (locale: Locale) => (n: number): string => FORMATTERS[locale](n);

/** The placeholder values for a locale: figures, formatted for that locale. */
export function placeholders(locale: Locale): SheetPlaceholders {
  const n = group(locale);
  return {
    caratsPeak: n(facts.load.caratsPeak),
    nextjsPeak: n(facts.load.nextjsPeak),
    nextjsPlateau: String(facts.load.nextjsPlateauPct),
    caratsPlateau: String(facts.load.caratsPlateauPct),
    bun: facts.methodology.bun,
    node: facts.methodology.node,
    sequential: n(facts.methodology.sequentialRequests),
    perLevel: n(facts.methodology.requestsPerLevel),
    recordedOn: facts.methodology.recordedOn,
  };
}

/** Every string on the page, translated and with its figures filled in. */
export function resolveSheet(locale: Locale): ResolvedSheet {
  const sheet = SHEETS[locale] ?? SHEETS[DEFAULT_LOCALE];
  const values = placeholders(locale);
  return Object.fromEntries(
    Object.entries(sheet).map(([key, value]) => [
      key,
      typeof value === 'string' ? fill(value, values) : value,
    ]),
  ) as ResolvedSheet;
}

/** A table row, formatted for the page's language. */
export interface LocalisedRow {
  readonly id: string;
  readonly label: string;
  readonly carats: string;
  readonly nextjs: string;
  /** Carats' advantage, as a multiplier. Above 10 it is rounded to a whole number. */
  readonly ratio: number;
}

/**
 * The comparison table, ordered by advantage, formatted and labelled in the
 * page's language.
 *
 * Numbers are grouped with the locale's own separator here, at the last moment
 * before they reach the page. Doing it earlier — while building the rows — gave
 * every language `3828 B`, with no separator at all.
 */
export function localisedRows(sheet: ResolvedSheet, locale: Locale): readonly LocalisedRow[] {
  const n = group(locale);

  return comparisonRows().map((row) => {
    const unit = row.unit === '' ? '' : ` ${row.unit}`;
    return {
      id: row.id,
      label: sheet.rowLabels[row.id],
      carats: `${n(row.caratsValue)}${unit}`,
      nextjs: `${n(row.nextjsValue)}${unit}`,
      ratio: row.ratio,
    };
  });
}

/** Everything a rendered page needs, with no locale left to look up. */
export interface PageContent {
  readonly locale: Locale;
  readonly dir: 'ltr' | 'rtl';
  readonly sheet: ResolvedSheet;
  readonly rows: readonly LocalisedRow[];
  /**
   * The load sweep, formatted for the locale.
   *
   * The only figures that reach a component as values. Everything else is either
   * a table row or lives inside a sentence as a `{token}`, so a component never
   * formats a number itself and cannot pick the wrong locale's separators.
   */
  readonly figures: {
    readonly sweep: readonly { level: number; carats: string; nextjs: string }[];
  };
}

/**
 * What a locale route resolves to.
 *
 * A discriminated union rather than an optional field, because `/:lang` matches
 * any first segment: `/de` reaches the landing route with `lang: "de"`, and the
 * route has to be able to say so. Without this the component would render
 * `undefined` copy, or fall back to English and serve it under a URL naming a
 * language the site does not have — the soft 404 the previous implementation
 * produced for `/de/latest`.
 */
export type LocalePageProps =
  | { readonly ok: true } & PageContent
  | { readonly ok: false; readonly requested: string };

/** Assembles the content for one locale. */
export function pageContent(locale: Locale): PageContent {
  const sheet = resolveSheet(locale);
  const n = group(locale);
  const { levels } = facts.methodology;

  return {
    locale,
    dir: dirOf(locale),
    sheet,
    rows: localisedRows(sheet, locale),
    figures: {
      sweep: levels.map((level, i) => ({
        level,
        carats: n(facts.sweep.carats[i]),
        nextjs: n(facts.sweep.nextjs[i]),
      })),
    },
  };
}

/**
 * Resolves a URL segment to props, or reports that it names no language we have.
 *
 * The only place a `requested` string reaches the page, and it is kept as a plain
 * segment for the not-found copy rather than being interpreted.
 */
export function resolvePageProps(lang: string | undefined): LocalePageProps {
  const locale = resolveLocale(lang);
  return locale === null ? { ok: false, requested: lang ?? '' } : { ok: true, ...pageContent(locale) };
}

/** Props for the bare root, where the language comes from a request header. */
export function rootPageProps(acceptLanguage: string | undefined): LocalePageProps {
  return { ok: true, ...pageContent(negotiateLocale(acceptLanguage)) };
}