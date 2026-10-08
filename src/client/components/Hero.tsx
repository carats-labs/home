import type { PageContent } from '../../i18n/props';
import { LOCALE_NAMES, LOCALES } from '../../i18n/locales';

const INSTALL_COMMAND = 'bun create carats';

interface CopyProps {
  readonly label: string;
  readonly copied: string;
}

/**
 * The copy control.
 *
 * The label is carried in a `data-` attribute rather than baked into the click
 * handler, so the same component works in all three locales: one implementation,
 * three strings, and switching language cannot leave a stale label behind.
 */
function CopyButton({ label, copied }: CopyProps) {
  return (
    <button type="button" class="copy" data-copy={INSTALL_COMMAND} data-label={label} data-copied-label={copied}>
      {label}
    </button>
  );
}

/**
 * The language picker.
 *
 * A real button and list rather than a hover-revealed div. The previous
 * implementation drove it with `max-height: attr(data-length lh)`, which is an
 * experimental CSS function: where a browser does not resolve it the declaration
 * is invalid, the max-height stays `0`, and the menu can never open at all. It was
 * also hover-only, so it was unreachable on touch.
 *
 * The links are plain same-origin anchors, so Carats' own in-app routing picks them
 * up and the page re-renders in the new locale, fetching that locale's dictionary.
 * No partial DOM morph to undo.
 *
 * Each label is a locale's own endonym — a picker must never translate a language
 * into itself. They come from `LOCALE_NAMES` rather than from the dictionaries,
 * because the picker lists every language at once and a dictionary per language has
 * not been loaded at that point.
 */
function LanguageMenu({ locale, label }: { locale: PageContent['locale']; label: string }) {
  return (
    <nav class="language-nav" aria-label={label}>
      <button
        type="button"
        class="language-toggle"
        aria-expanded="false"
        aria-controls="language-list"
        data-language-toggle
      >
        <img src="/assets/globe.svg" alt="" aria-hidden="true" width="14" height="14" />
        <span>{LOCALE_NAMES[locale]}</span>
      </button>

      <ul class="language-list" id="language-list" hidden>
        {LOCALES.map((code) => (
          <li>
            <a
              href={`/${code}`}
              hreflang={code}
              lang={code}
              aria-current={code === locale ? 'true' : undefined}
            >
              {LOCALE_NAMES[code]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * The hero.
 *
 * The language picker is a sibling of the hero grid, not a child of the text
 * column: it is positioned absolutely, and inside the 400px text column that
 * anchored it to the column's own box, so it landed between the eyebrow and the
 * wordmark instead of in the page's corner.
 */
export default function Hero({ props }: { props: PageContent }) {
  const { copy, locale } = props;

  return (
    <>
      <LanguageMenu locale={locale} label={copy.languageMenuLabel} />

      <div class="hero">
        <div class="hero-text">
          <p class="eyebrow">{copy.heroEyebrow}</p>
          <h1>
            <span class="shimmer">{copy.heroTitle}</span>
          </h1>
          <p class="tagline">
            <span>{copy.heroLine1}</span>
            <span>{copy.heroLine2}</span>
          </p>
        </div>

        {/* String attribute values, not booleans: jjsx types attributes as
            `Record<string, string>` and emits a bare attribute for `true`, so
            passing the string is both what the types ask for and what reaches the
            browser as a valueless attribute. */}
        <video
          class="hero-media"
          autoplay=""
          muted=""
          loop=""
          playsinline=""
          src="/assets/diamond.mp4"
          width="380"
          height="430"
          aria-hidden="true"
        />
      </div>

      <div class="action-row">
        <p class="action-label">{copy.installLabel}</p>
        <div class="action-body">
          <bdi class="command" title={copy.copy} data-copy-command>
            <span class="prompt">$</span>
            <span class="cmd-text">bun</span>
            <span class="cmd-arg">create</span>
            <span class="cmd-name">carats</span>
            <CopyButton label={copy.copy} copied={copy.copied} />
          </bdi>

          <span class="action-divider" aria-hidden="true" />

          <a class="action-link" href={`https://docs.carats.dev/${locale}/latest`}>
            <span>{copy.docsLink}</span>
            <span class="action-arrow" aria-hidden="true" />
          </a>
        </div>
      </div>
    </>
  );
}