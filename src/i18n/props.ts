/**
 * Turns a locale's dictionary into what the page renders.
 *
 * Every figure a page shows is formatted here, so no component ever formats a
 * number or picks a locale's separators. A component has no number to format; that
 * is the property worth keeping.
 *
 * Copy keeps its `{token}`s until this file substitutes them, which is why the
 * benchmark's numbers and the sentences quoting them cannot drift apart.
 *
 * The functions take a {@link Dictionary} rather than a locale, so they are
 * synchronous and the only `await` in the layer is the dictionary fetch itself — in
 * the page component, once.
 */
import { chartMax, comparisonRows, facts } from '../benchmark/facts';
import {
  direction,
  dictionary,
  negotiateLocale,
  type CopyKey,
  type Dictionary,
  type Direction,
  type Locale,
  type RowLabelKey,
} from './locales';

/**
 * The `{token}`s a dictionary string may use, and the value each receives.
 *
 * Numbers are formatted per locale below; `bun` and `node` are already strings and
 * pass through.
 */
const PLACEHOLDERS = {
  // the chart's scale, so the screen-reader note quotes the same grouped figure
  // the bars beside it are drawn against
  max: chartMax,
  caratsPeak: facts.load.caratsPeak,
  nextjsPeak: facts.load.nextjsPeak,
  nextjsPlateau: facts.load.nextjsPlateauPct,
  caratsPlateau: facts.load.caratsPlateauPct,
  bun: facts.methodology.bun,
  node: facts.methodology.node,
  sequential: facts.methodology.sequentialRequests,
  perLevel: facts.methodology.requestsPerLevel,
} as const;

const TOKEN = /\{(\w+)\}/g;

/** One locale's tokens, formatted the way that language writes numbers and dates. */
function tokensFor(dict: Dictionary): Record<string, string> {
  const number = new Intl.NumberFormat(dict.__numberLocale);

  const dateFormat: Intl.DateTimeFormatOptions = {
    dateStyle: 'long',
    // `new Date('2026-09-29')` is midnight UTC and Intl defaults to the *local*
    // zone, so anywhere west of Greenwich the date rendered as the 28th. The
    // figure on the page has to be the figure in the benchmark.
    timeZone: 'UTC',
  };

  return {
    ...Object.fromEntries(
      Object.entries(PLACEHOLDERS).map(([key, value]) => [
        key,
        typeof value === 'number' ? number.format(value) : value,
      ]),
    ),
    recordedOn: new Intl.DateTimeFormat(
      dict.__dateLocale,
      // Arabic pins Latin digits so the date agrees with the figures in the table
      // beside it. The key is absent from the other two dictionaries.
      dict.__dateNumberingSystem
        ? { ...dateFormat, numberingSystem: dict.__dateNumberingSystem }
        : dateFormat,
    ).format(new Date(facts.methodology.recordedOn)),
  };
}

/**
 * Substitutes `{token}`s in a copy string.
 *
 * An unknown token throws instead of rendering literally, so a typo in a dictionary
 * is a visible failure rather than a stray `{caratsGzip}` on the page.
 */
function fill(template: string, tokens: Record<string, string>): string {
  return template.replace(TOKEN, (match, key: string) => {
    const value = tokens[key];
    if (value === undefined) throw new Error(`Unknown token ${match} in "${template}"`);
    return value;
  });
}

/**
 * A dictionary's copy, with its `{token}`s substituted.
 *
 * The `__` metadata and `rowLabels` are left out: the labels are read as table rows
 * by {@link localisedRows}, and the metadata by whoever needs it.
 */
function resolveCopy(dict: Dictionary, tokens: Record<string, string>): Readonly<Record<CopyKey, string>> {
  const entries = Object.entries(dict).filter(
    ([key, value]) => !key.startsWith('__') && key !== 'rowLabels' && typeof value === 'string',
  ) as [CopyKey, string][];

  return Object.freeze(
    Object.fromEntries(entries.map(([key, value]) => [key, fill(value, tokens)])),
  ) as Readonly<Record<CopyKey, string>>;
}

/** The row labels of a dictionary, with their `{token}`s substituted. */
function resolveRowLabels(
  dict: Dictionary,
  tokens: Record<string, string>,
): Readonly<Record<RowLabelKey, string>> {
  return Object.freeze(
    Object.fromEntries(Object.entries(dict.rowLabels).map(([id, label]) => [id, fill(label, tokens)])),
  ) as Readonly<Record<RowLabelKey, string>>;
}

/** A table row, formatted for the page's language. */
export interface LocalisedRow {
  readonly id: string;
  readonly label: string;
  readonly carats: string;
  readonly nextjs: string;
  /** Carats' advantage, formatted for the locale, e.g. `45` or `1,4`. */
  readonly margin: string;
}

/**
 * The comparison table, ordered by advantage, formatted and labelled in the page's
 * language.
 *
 * Numbers, units and the advantage column are formatted here, at the last moment
 * before they reach the page. Doing it earlier gave every language `3828 B` with no
 * separator, and `1.4` with a full stop in a table that writes `1,81 MB` with a
 * comma.
 */
export function localisedRows(dict: Dictionary): readonly LocalisedRow[] {
  const number = new Intl.NumberFormat(dict.__numberLocale);
  const decimal = new Intl.NumberFormat(dict.__numberLocale, { maximumFractionDigits: 1 });
  const labels = resolveRowLabels(dict, tokensFor(dict));

  // `rps` is the only unit that is a word rather than an SI symbol, so it is the only
  // one the dictionary supplies; `B`, `MB` and `ms` read the same everywhere, and
  // inviting a translation of them would only allow a locale to "translate" a symbol.
  const withUnit = (value: number, unit: string): string =>
    unit === '' ? number.format(value) : `${number.format(value)} ${unit === 'rps' ? dict.__units.rps : unit}`;

  return comparisonRows().map((row) => ({
    id: row.id,
    label: labels[row.id],
    carats: withUnit(row.caratsValue, row.unit),
    nextjs: withUnit(row.nextjsValue, row.unit),
    margin: decimal.format(row.ratio >= 10 ? Math.round(row.ratio) : Math.round(row.ratio * 10) / 10),
  }));
}

/** Everything a rendered page needs, with no locale left to look up. */
export interface PageContent {
  readonly locale: Locale;
  readonly dir: Direction;
  /** Every translatable string, with its `{token}`s substituted. */
  readonly copy: Readonly<Record<CopyKey, string>>;
  readonly rows: readonly LocalisedRow[];
  /**
   * The load sweep, formatted for the locale.
   *
   * The only figures that reach a component as values. Everything else is either a
   * table row or lives inside a sentence as a `{token}`, so a component never
   * formats a number itself.
   */
  readonly figures: {
    readonly sweep: readonly { level: number; carats: string; nextjs: string }[];
  };
}

/** Assembles the content for one locale, fetching its dictionary. */
export async function pageContent(locale: Locale): Promise<PageContent> {
  const dict = await dictionary(locale);

  return {
    locale,
    dir: direction(dict),
    copy: copyFor(dict),
    rows: localisedRows(dict),
    figures: {
      sweep: facts.methodology.levels.map((level, i) => ({
        level,
        carats: new Intl.NumberFormat(dict.__numberLocale).format(facts.sweep.carats[i]),
        nextjs: new Intl.NumberFormat(dict.__numberLocale).format(facts.sweep.nextjs[i]),
      })),
    },
  };
}

/**
 * A dictionary's copy, with its `{token}`s substituted.
 *
 * Exported separately from {@link pageContent} because the not-found page needs
 * the strings and nothing else — no table rows, no chart figures. Building a whole
 * page's content to read four sentences of a 404 would pay for a table it never
 * renders.
 *
 * Takes a dictionary rather than a locale so a caller that already has one — which
 * the not-found route does, for the reading direction — does not fetch it twice.
 */
export function copyFor(dict: Dictionary): Readonly<Record<CopyKey, string>> {
  return resolveCopy(dict, tokensFor(dict));
}

/**
 * Props for the bare root, where the language comes from a request header.
 *
 * Expressed as a `lang` rather than as assembled content, because the landing page
 * resolves its own content from the language. Handing `/` pre-built content meant
 * the root component received one shape while every other route received another,
 * and it disagreed with itself accordingly: the component asked for `props.lang`,
 * found none, and rendered the not-found page at the site root.
 *
 * Returning the shape the routes return is also what shrinks the root document —
 * the serialised props are one short string instead of every translated string.
 */
export function rootPageProps(acceptLanguage: string | undefined): { lang: Locale } {
  return { lang: negotiateLocale(acceptLanguage) };
}