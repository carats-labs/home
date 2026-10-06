import { facts, barWidth } from '../../../benchmark/facts';
import type { PageContent } from '../../../i18n/props';

interface SeriesProps {
  readonly name: string;
  readonly values: readonly string[];
  readonly isCarats: boolean;
}

/**
 * One row of the load chart.
 *
 * Bar length is written inline as a percentage of the shared peak, so the chart
 * cannot disagree with the figures behind it: the scale lives next to the data
 * rather than in the stylesheet, where it would have to be kept in step by hand.
 */
function Series({ name, values, isCarats }: SeriesProps) {
  const measured = facts.sweep[isCarats ? 'carats' : 'nextjs'];

  return (
    <div class={`chart-row${isCarats ? ' is-carats' : ''}`}>
      <span class="chart-name">{name}</span>
      <div class="chart-track">
        {measured.map((rps, i) => (
          <span class="chart-bar" style={`--w:${barWidth(rps)}`}>
            <span class="chart-value">{values[i]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Act three: under load.
 *
 * The chart shows one row per server, five bars per row, one bar per concurrency
 * level. Each bar is labelled with the requests per second that server sustained,
 * and the bars share a scale capped at the fastest figure on the page, so
 * Next.js' ceiling reads as a visibly shorter row rather than a number the reader
 * has to hold in their head.
 */
export default function LoadAct({ props }: { props: PageContent }) {
  const { copy, figures } = props;

  return (
    <section class="act act-load" aria-labelledby="load-heading">
      <div class="shell">
        <p class="kicker">{copy.loadKicker}</p>
        <h2 id="load-heading" class="reveal">
          {copy.loadHeading}
        </h2>
        <p class="lede reveal">{copy.loadLede}</p>

        <figure class="chart reveal" data-chart>
          <figcaption class="sr-only">{copy.chartCaption}</figcaption>
          {/* sighted readers get the unit; the caption carries it for assistive tech */}
          <p class="chart-unit" aria-hidden="true">
            {copy.chartUnit}
          </p>

          <div class="chart-grid" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <div class="chart-rows">
            <Series
              name="Carats"
              values={figures.sweep.map((s) => s.carats)}
              isCarats
            />
            <Series
              name="Next.js"
              values={figures.sweep.map((s) => s.nextjs)}
              isCarats={false}
            />
          </div>

          <div class="chart-axis" aria-hidden="true">
            <span class="chart-axis-title">{copy.chartAxisConcurrency}</span>
            <div class="chart-ticks">
              {figures.sweep.map((s) => (
                <span>{s.level}</span>
              ))}
            </div>
          </div>
        </figure>

        <p class="note reveal">{copy.loadNote}</p>
      </div>

      {/* Translated, and carrying the locale's own digit grouping. This line was
          previously a template literal in the component, so it stayed English on
          the Turkish and Arabic pages. */}
      <p class="sr-only">{copy.chartScaleNote}</p>
    </section>
  );
}
