import { formatRatio } from '../../../benchmark/facts';
import type { PageContent } from '../../../i18n/props';

/**
 * Act two: the full comparison.
 *
 * Every measurement, ordered by how large the difference is, so the strongest
 * result is the first one a reader meets. The row labels come from the sheet and
 * the values from the benchmark module, paired by row id: the old implementation
 * held both in one HTML template literal, where a regeneration from a different
 * script revision could pair a value with the wrong heading without anything
 * failing.
 */
export default function ReceiptAct({ props }: { props: PageContent }) {
  const { sheet, rows } = props;

  return (
    <section class="act act-receipt" aria-labelledby="receipt-heading">
      <div class="shell">
        <p class="kicker">{sheet.receiptKicker}</p>
        <h2 id="receipt-heading" class="reveal">
          {sheet.receiptHeading}
        </h2>
        <p class="lede lede-wide reveal">{sheet.receiptLede}</p>

        <div class="table-wrap reveal" data-table>
          <table class="table">
            <caption class="sr-only">{sheet.tableCaption}</caption>
            <thead>
              <tr>
                <th scope="col">{sheet.columnMetric}</th>
                <th scope="col" class="numeric">
                  Carats
                </th>
                <th scope="col" class="numeric">
                  Next.js
                </th>
                <th scope="col" class="numeric">
                  {sheet.columnMargin}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr>
                  <th scope="row">{row.label}</th>
                  <td class="numeric is-carats">{row.carats}</td>
                  <td class="numeric">{row.nextjs}</td>
                  <td class="numeric margin">{formatRatio(row.ratio)}&times;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p class="note reveal">{sheet.receiptNote}</p>
        <p class="method reveal">{sheet.receiptMethod}</p>
      </div>
    </section>
  );
}
