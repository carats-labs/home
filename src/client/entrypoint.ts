import { mount, clientRender } from '@carats/csr';
import './base.sass';
import './app.sass';
import facets from './facets';

/**
 * Client entry.
 *
 * `base.sass` is imported here rather than from a page, so the tokens and resets
 * are present on every route — including the not-found and error pages, which do
 * not render the landing page's stylesheet.
 *
 * The `js` class is the marker the reveal rules key off. Without JavaScript the
 * class is never added, every `.reveal` stays visible, and the page is complete
 * and readable: the animation is the thing that can fail, not the content.
 */
document.documentElement.classList.add('js');

mount(facets);
clientRender();