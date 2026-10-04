import type { CaratsComponent } from '@carats/render';
// the same surface as the not-found page: an error should not look like a
// different product
import '../_not_found/notfound.sass';

/**
 * The error boundary.
 *
 * Carats calls this with the thrown error and renders whatever it returns in place
 * of the page. The message is shown because a developer needs it; the styling is
 * the same surface as every other page so a failure does not look like a
 * different product.
 */
export default function ErrorPage(this: CaratsComponent, error: Error) {
  const message = error?.message ?? 'Unknown error';

  this.head = (
    <>
      <title>Something went wrong — Carats</title>
      <meta name="robots" content="noindex" />
    </>
  );

  return (
    <div class="notfound">
      <p class="kicker">Error</p>
      <h1>Something went wrong.</h1>
      <pre class="message">{message}</pre>
      <a class="action" href="/">
        Back to the start
      </a>
    </div>
  );
}