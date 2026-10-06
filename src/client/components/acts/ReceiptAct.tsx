import type { PageContent } from '../../../i18n/props';

/**
 * Act two: the full comparison.
 *
 * Every measurement, ordered by how large the difference is, so the strongest
 * result is the first one a reader meets. The row labels come from the locale's
 * dictionary and the values from the benchmark module, paired by row id: the old
 * implementation held both in one HTML template literal, where a regeneration from
 * a different script revision could pair a value with the wrong heading without
 * anything failing.
 */
export default function ReceiptAct({ props }: { props: PageContent }) {
  const { copy, rows } = props;

  return (
    <section class="act act-receipt" aria-labelledby="receipt-heading">
      <div class="shell">
        <p class="kicker">{copy.receiptKicker}</p>
        <h2 id="receipt-heading" class="reveal">
          {copy.receiptHeading}
        </h2>
        <p class="lede reveal">{copy.receiptLede}</p>

        <div class="table-wrap reveal" data-table>
          <table class="table">
            <caption class="sr-only">{copy.tableCaption}</caption>
            <thead>
              <tr>
                <th scope="col">{copy.columnMetric}</th>
                <th scope="col" class="numeric">
                  Carats
                </th>
                <th scope="col" class="numeric">
                  Next.js
                </th>
                <th scope="col" class="numeric">
                  {copy.columnMargin}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr>
                  <th scope="row">{row.label}</th>
                  <td class="numeric is-carats">{row.carats}</td>
                  <td class="numeric">{row.nextjs}</td>
                  <td class="numeric margin">{row.margin}&times;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p class="note reveal">{copy.receiptNote}</p>
        <p class="method reveal">{copy.receiptMethod}</p>
      </div>
    </section>
  );
}