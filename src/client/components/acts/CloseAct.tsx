import type { PageContent } from '../../../i18n/props';

const INSTALL_COMMAND = 'bun create carats';

/**
 * Act four: the close.
 *
 * Ends on the two actions and nothing else. The method line that used to sit here
 * moved to the receipt act, where the numbers it describes are: a page that ends
 * on fine print ends on its smallest, quietest text instead of the command.
 */
export default function CloseAct({ props }: { props: PageContent }) {
  const { copy, locale } = props;

  return (
    <section class="act act-close" aria-labelledby="close-heading">
      <div class="shell close-shell reveal">
        <h2 id="close-heading">{copy.closeHeading}</h2>
        <p class="lede close-lede">{copy.closeLede}</p>

        <div class="close-pair">
          <bdi class="command command-close" title={copy.copy} data-copy-command>
            <span class="prompt">$</span>
            <span class="cmd-text">bun</span>
            <span class="cmd-arg">create</span>
            <span class="cmd-name">carats</span>
            <CopyButton label={copy.copy} copied={copy.copied} />
          </bdi>

          <a class="secondary-action" href={`https://docs.carats.dev/${locale}/latest`}>
            <span>{copy.closeAction}</span>
            <span class="action-arrow" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

/**
 * The copy control, shared by the hero and the close so both behave identically.
 *
 * `type="button"` matters: without it a button inside a form defaults to submit,
 * and this one is a label that happens to be clickable.
 */
function CopyButton({ label, copied }: { label: string; copied: string }) {
  return (
    <button type="button" class="copy" data-copy={INSTALL_COMMAND} data-copied-label={copied}>
      {label}
    </button>
  );
}
