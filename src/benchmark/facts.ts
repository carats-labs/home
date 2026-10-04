/**
 * The measured benchmark, as typed data.
 *
 * `RowId` lives here rather than in the sheet, because the id is a property of
 * the measurement, not of any language.
 *
 * This is a hand transcription of `benchmark/landing-facts.json`, which
 * `benchmark/extract-landing-facts.mjs` derives from the raw run and asserts
 * against. The original JSON lives outside this project, so the values are
 * copied here verbatim and {@link assertFactsUnchanged} re-checks the headline
 * figures at module load.
 *
 * The point of that assertion is that a marketing page which quotes numbers must
 * not be able to quote numbers that were edited by hand without anyone noticing.
 * If a re-run of the benchmark changes a figure, this module fails loudly and
 * the copy is re-derived, rather than the page quietly continuing to advertise a
 * stale measurement.
 */
import factsJson from './landing-facts.json';

/** Concurrency levels of the load sweep, in request order. */
export const CONCURRENCY_LEVELS = [1, 10, 50, 100, 200] as const;

/** Throughput in requests per second at each level of {@link CONCURRENCY_LEVELS}. */
export interface ThroughputSweep {
  readonly carats: readonly number[];
  readonly nextjs: readonly number[];
}

/**
 * Every measured figure the page is allowed to quote.
 *
 * The absolute memory figures are included deliberately. Total memory is the one
 * row where Next.js wins, and the page states the framework-added overhead
 * alongside it, so the reader can see both rather than only the flattering one.
 */
export interface BenchmarkFacts {
  readonly payload: {
    readonly caratsGzip: number;
    readonly nextjsGzip: number;
    readonly gzipRatio: number;
    readonly caratsJsGzip: number;
    readonly nextjsJsGzip: number;
    readonly jsGzipRatio: number;
    readonly caratsAssets: number;
    readonly nextjsAssets: number;
  };
  readonly pageLoad: {
    readonly caratsTotalMs: number;
    readonly nextjsTotalMs: number;
    readonly ratio: number;
  };
  readonly build: {
    readonly caratsMs: number;
    readonly nextjsMs: number;
    readonly ratio: number;
  };
  readonly dev: {
    readonly caratsStartMs: number;
    readonly nextjsStartMs: number;
    readonly caratsWarmMs: number;
    readonly nextjsWarmMs: number;
  };
  readonly prod: {
    readonly caratsStartMs: number;
    readonly nextjsStartMs: number;
  };
  readonly disk: {
    readonly caratsProdMb: number;
    readonly nextjsProdMb: number;
    readonly prodRatio: number;
    readonly caratsBuildOutMb: number;
    readonly nextjsBuildOutMb: number;
    readonly buildOutRatio: number;
  };
  readonly deps: {
    readonly carats: number;
    readonly nextjs: number;
  };
  readonly memory: {
    readonly caratsOverheadMb: number;
    readonly nextjsOverheadMb: number;
    readonly overheadRatio: number;
    readonly caratsAbsMb: number;
    readonly nextjsAbsMb: number;
    readonly bunFloorMb: number;
    readonly nodeFloorMb: number;
  };
  readonly load: {
    readonly caratsPeak: number;
    readonly nextjsPeak: number;
    readonly peakRatio: number;
    readonly nextjsPlateauPct: number;
    readonly caratsPlateauPct: number;
  };
  readonly sweep: ThroughputSweep;
  readonly methodology: {
    readonly recordedOn: string;
    readonly bun: string;
    readonly node: string;
    readonly sequentialRequests: number;
    readonly requestsPerLevel: number;
    readonly levels: readonly number[];
  };
}

/**
 * The load sweep is the one table the page shows in full, so it lives beside the
 * other figures rather than in the copy. `load.json` is the raw record; these
 * two arrays are its `throughputRps` series for the two servers.
 */
const sweep: ThroughputSweep = {
  carats: [1514, 2795, 3003, 3987, 4256],
  nextjs: [1055, 2220, 2374, 2439, 2442],
};

export const facts: BenchmarkFacts = {
  payload: {
    caratsGzip: factsJson.payload.caratsGzip,
    nextjsGzip: factsJson.payload.nextjsGzip,
    gzipRatio: factsJson.payload.gzipRatio,
    caratsJsGzip: factsJson.payload.caratsJsGzip,
    nextjsJsGzip: factsJson.payload.nextjsJsGzip,
    jsGzipRatio: factsJson.payload.jsGzipRatio,
    caratsAssets: factsJson.payload.caratsAssets,
    nextjsAssets: factsJson.payload.nextjsAssets,
  },
  pageLoad: {
    caratsTotalMs: factsJson.pageLoad.caratsTotal,
    nextjsTotalMs: factsJson.pageLoad.nextjsTotal,
    ratio: factsJson.pageLoad.ratio,
  },
  build: {
    caratsMs: factsJson.build.caratsMs,
    nextjsMs: factsJson.build.nextjsMs,
    ratio: factsJson.build.ratio,
  },
  dev: {
    caratsStartMs: factsJson.dev.caratsStart,
    nextjsStartMs: factsJson.dev.nextjsStart,
    caratsWarmMs: factsJson.dev.caratsWarm,
    nextjsWarmMs: factsJson.dev.nextjsWarm,
  },
  prod: {
    caratsStartMs: factsJson.prod.caratsStart,
    nextjsStartMs: factsJson.prod.nextjsStart,
  },
  disk: {
    caratsProdMb: factsJson.disk.caratsProd,
    nextjsProdMb: factsJson.disk.nextjsProd,
    prodRatio: factsJson.disk.prodRatio,
    caratsBuildOutMb: factsJson.disk.caratsBuildOut,
    nextjsBuildOutMb: factsJson.disk.nextjsBuildOut,
    buildOutRatio: factsJson.disk.buildOutRatio,
  },
  deps: {
    carats: factsJson.deps.carats,
    nextjs: factsJson.deps.nextjs,
  },
  memory: {
    caratsOverheadMb: factsJson.memory.caratsOverhead,
    nextjsOverheadMb: factsJson.memory.nextjsOverhead,
    overheadRatio: factsJson.memory.overheadRatio,
    caratsAbsMb: factsJson.memory.caratsAbs,
    nextjsAbsMb: factsJson.memory.nextjsAbs,
    bunFloorMb: factsJson.memory.bunFloor,
    nodeFloorMb: factsJson.memory.nodeFloor,
  },
  load: {
    caratsPeak: factsJson.load.caratsPeak,
    nextjsPeak: factsJson.load.nextjsPeak,
    peakRatio: factsJson.load.peakRatio,
    nextjsPlateauPct: factsJson.load.nextjsPlateau,
    caratsPlateauPct: factsJson.load.caratsPlateau,
  },
  sweep,
  methodology: {
    recordedOn: factsJson.methodology.when,
    bun: factsJson.methodology.bun,
    node: factsJson.methodology.node,
    sequentialRequests: factsJson.methodology.requests,
    requestsPerLevel: factsJson.methodology.perLevel,
    levels: factsJson.methodology.levels,
  },
};

/**
 * Figures that must not drift from the recorded run.
 *
 * Keys are dotted paths; values are what `landing-facts.json` recorded. This is
 * a transcription check, not a claim about whether the measurement is still
 * valid — re-run the benchmark and update both the JSON and this table.
 */
const EXPECTED: Readonly<Record<string, number>> = {
  'payload.caratsGzip': 5436,
  'payload.nextjsGzip': 176227,
  'payload.jsGzipRatio': 45.3,
  'payload.gzipRatio': 32.4,
  'build.ratio': 4.7,
  'disk.prodRatio': 4,
  'disk.buildOutRatio': 28.3,
  'load.caratsPeak': 4256,
  'load.nextjsPeak': 2442,
  'pageLoad.ratio': 10.8,
  'memory.caratsOverheadMb': 51.3,
  'memory.nextjsOverheadMb': 70.5,
};

const at = (path: string): unknown =>
  path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], facts);

/** Throws when a transcribed figure no longer matches the recorded run. */
export function assertFactsUnchanged(): void {
  const drift = Object.entries(EXPECTED)
    .filter(([path, expected]) => at(path) !== expected)
    .map(([path, expected]) => `  ${path}: copied ${String(at(path))}, recorded ${expected}`);

  if (drift.length > 0) {
    throw new Error(
      `Benchmark facts have drifted from the recorded run:\n${drift.join('\n')}\n` +
        'Update landing-facts.json and this module together, or re-derive the copy.',
    );
  }
}

/* ------------------------------------------------------------------ derived
   Everything the page shows is computed here rather than typed twice, so a bar
   width or a ratio can never disagree with the figure it came from. */

/** The larger bar length on the chart. Bars are scaled against this. */
export const chartMax = Math.max(facts.load.caratsPeak, facts.load.nextjsPeak);

/** A bar's share of {@link chartMax}, as a CSS percentage. */
export const barWidth = (rps: number): string => `${((rps / chartMax) * 100).toFixed(1)}%`;

/** Carats' share of the Next.js page, used to place the marker on the bar. */
export const payloadShare = (): string =>
  `${((facts.payload.caratsGzip / facts.payload.nextjsGzip) * 100).toFixed(2)}%`;

/** How far throughput rose between the two ends of the sweep. */
export const sweepGain = (series: readonly number[]): number =>
  Math.round((series[series.length - 1] / series[Math.floor(series.length / 2)] - 1) * 100);

/**
 * Identifies a measurement.
 *
 * A closed union rather than `string`, because the same union keys the localised
 * label record. That is what makes a missing translation a compile error: adding
 * a row here makes every sheet fail to typecheck until it is translated.
 */
export type RowId =
  | 'js'
  | 'payload'
  | 'buildout'
  | 'disk'
  | 'pageload'
  | 'rps'
  | 'devwarm'
  | 'build'
  | 'devstart'
  | 'prodstart'
  | 'assets'
  | 'deps'
  | 'memory';

/** A row of the comparison table, before it is formatted for a language. */
export interface ComparisonRow {
  readonly id: RowId;
  /**
   * Raw figures with their unit, not strings.
   *
   * Formatting happens per locale in `localisedRows`. Formatting here produced
   * `3828 B` on every language — no thousands separator, and the wrong separator
   * for Turkish — while the chart beside it showed `4,256`.
   */
  readonly caratsValue: number;
  readonly nextjsValue: number;
  readonly unit: 'B' | 'MB' | 'ms' | 'rps' | '';
  /** Carats' advantage, as a multiplier. Above 10 it is rounded to a whole number. */
  readonly ratio: number;
}

/**
 * Every measurement, strongest difference first.
 *
 * Rows are sorted by advantage rather than grouped by category, so the reader
 * meets the most striking result before the narrowest one. Values stay numeric so
 * a locale can format them; see {@link ComparisonRow}.
 */
const rows: readonly ComparisonRow[] = ([
  ['js', facts.payload.caratsJsGzip, facts.payload.nextjsJsGzip, 'B', facts.payload.jsGzipRatio],
  ['payload', facts.payload.caratsGzip, facts.payload.nextjsGzip, 'B', facts.payload.gzipRatio],
  ['buildout', facts.disk.caratsBuildOutMb, facts.disk.nextjsBuildOutMb, 'MB', facts.disk.buildOutRatio],
  ['disk', facts.disk.caratsProdMb, facts.disk.nextjsProdMb, 'MB', facts.disk.prodRatio],
  ['pageload', facts.pageLoad.caratsTotalMs, facts.pageLoad.nextjsTotalMs, 'ms', facts.pageLoad.ratio],
  ['rps', facts.load.caratsPeak, facts.load.nextjsPeak, 'rps', facts.load.peakRatio],
  ['devwarm', facts.dev.caratsWarmMs, facts.dev.nextjsWarmMs, 'ms', facts.dev.nextjsWarmMs / facts.dev.caratsWarmMs],
  ['build', facts.build.caratsMs, facts.build.nextjsMs, 'ms', facts.build.ratio],
  ['devstart', facts.dev.caratsStartMs, facts.dev.nextjsStartMs, 'ms', facts.dev.nextjsStartMs / facts.dev.caratsStartMs],
  ['prodstart', facts.prod.caratsStartMs, facts.prod.nextjsStartMs, 'ms', facts.prod.nextjsStartMs / facts.prod.caratsStartMs],
  ['assets', facts.payload.caratsAssets, facts.payload.nextjsAssets, '', facts.payload.nextjsAssets / facts.payload.caratsAssets],
  ['deps', facts.deps.carats, facts.deps.nextjs, '', facts.deps.nextjs / facts.deps.carats],
  ['memory', facts.memory.caratsOverheadMb, facts.memory.nextjsOverheadMb, 'MB', facts.memory.overheadRatio],
] as const satisfies readonly (readonly [RowId, number, number, ComparisonRow['unit'], number])[])
  .map(([id, caratsValue, nextjsValue, unit, ratio]) => ({ id, caratsValue, nextjsValue, unit, ratio }))
  .sort((a, b) => b.ratio - a.ratio);

/** How a ratio is written in the table: whole numbers above ten, else one decimal. */
export const formatRatio = (ratio: number): string =>
  ratio >= 10 ? String(Math.round(ratio)) : String(Math.round(ratio * 10) / 10);

/** The comparison table, ordered by advantage. */
export const comparisonRows = (): readonly ComparisonRow[] => rows;