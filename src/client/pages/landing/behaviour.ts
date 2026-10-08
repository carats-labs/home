/**
 * Scroll behaviour for the benchmark acts.
 *
 * Carats renders to an HTML string and assigns it to `#app`, so every navigation
 * throws the entire subtree away and builds a new one. There is no hydration and
 * no diffing. Anything that holds state — an observer, a timer, a listener —
 * therefore has to be attached again on every render, and torn down before the
 * next one.
 *
 * That constraint caused the bug this replaces: the counter latched a `done`
 * flag in a closure, so after the first language change the fresh node kept its
 * server-rendered `0` and nothing ever wrote the figure again. Nothing here is
 * latched in a closure across renders. Whether the counter has run is read from
 * the DOM, which is the only state a replaced subtree cannot leave stale.
 *
 * Every registration returns its own cleanup and the whole set is handed to
 * `afterMount`, which runs it before the next render.
 */

/** Reveal threshold: the line at 78% of the viewport, not its bottom edge. */
const REVEAL_TRIGGER = 0.78;

/**
 * Root margin that shrinks the observer's viewport to the trigger line.
 *
 * Testing against the bottom edge started headings while they were still peeking
 * into view, which reads as premature: the reader watches a block they cannot
 * read yet. Above 78% an element is comfortably in frame.
 */
const rootMargin = `0px 0px -${Math.round((1 - REVEAL_TRIGGER) * 100)}% 0px`;

type Cleanup = () => void;

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const reached = (el: Element): boolean =>
  el.getBoundingClientRect().top < window.innerHeight * REVEAL_TRIGGER;

/**
 * Staggers reveals within each act so the eye travels down the block.
 *
 * Re-applied on every render, which is harmless: it rewrites the same value on an
 * element that already has one.
 */
function armReveals(): Cleanup {
  if (prefersReducedMotion()) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in-view'));
    return () => {};
  }

  document.querySelectorAll<HTMLElement>('.act').forEach((act) => {
    act.querySelectorAll<HTMLElement>('.reveal').forEach((el, i) => {
      el.style.setProperty('--delay', `${Math.min(i, 6) * 70}ms`);
    });
  });

  const pending = document.querySelectorAll('.reveal:not(.in-view)');
  if (pending.length === 0) return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting && !reached(entry.target)) continue;
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin, threshold: 0 },
  );

  pending.forEach((el) => observer.observe(el));

  /* Also swept on scroll, for the jump case — an anchor, a restored scroll
     position, a fast flick — where an element can be passed over without ever
     intersecting. Re-queried every sweep, so it covers a subtree that was
     replaced since the last scroll event. */
  let queued = false;
  const sweep = (): void => {
    queued = false;
    document.querySelectorAll('.reveal:not(.in-view)').forEach((el) => {
      if (reached(el)) el.classList.add('in-view');
    });
  };
  const onScroll = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sweep);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  sweep();

  return () => {
    observer.disconnect();
    window.removeEventListener('scroll', onScroll);
  };
}

/**
 * Staggers the bars, and the rows beneath them.
 *
 * `data-chart` and `data-table` are read rather than queried by class, so a
 * stylesheet rename cannot silently detach the behaviour.
 */
function armChart(): Cleanup {
  const chart = document.querySelector<HTMLElement>('[data-chart]');
  if (!chart) return () => {};

  if (prefersReducedMotion()) {
    chart.classList.add('in-view');
    return () => {};
  }

  chart.querySelectorAll<HTMLElement>('.chart-bar').forEach((bar, i) => {
    bar.style.setProperty('--delay', `${i * 55}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting && !reached(entry.target)) continue;
        entry.target.classList.add('in-view');
        observer.disconnect();
      }
    },
    { rootMargin, threshold: 0 },
  );
  observer.observe(chart);

  return () => observer.disconnect();
}

/** Fades the receipt rows in as the table arrives. */
function armTable(): Cleanup {
  const table = document.querySelector<HTMLElement>('[data-table]');
  if (!table || prefersReducedMotion()) {
    table?.classList.add('in-view');
    return () => {};
  }

  const rows = [...table.querySelectorAll<HTMLElement>('tbody tr')];
  rows.forEach((row, i) => row.style.setProperty('--delay', `${i * 40}ms`));

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting && !reached(entry.target)) continue;
        entry.target.classList.add('in-view');
        observer.disconnect();
      }
    },
    { rootMargin, threshold: 0 },
  );
  observer.observe(table);

  return () => observer.disconnect();
}

/**
 * Copies the install command and confirms it.
 *
 * The labels come from `data-` attributes on the button, so the same handler
 * serves all three locales without shipping a dictionary.
 *
 * `fallback` covers a non-secure context, where the async clipboard API is
 * unavailable. Without it the button would throw and appear dead.
 */
function armCopyButtons(): Cleanup {
  if (document.querySelector('[data-copy]') === null) return () => {};

  const timers = new Set<number>();

  const onClick = async (button: HTMLButtonElement): Promise<void> => {
    const text = button.dataset.copy ?? '';
    const label = button.dataset.label ?? '';
    const done = button.dataset.copiedLabel ?? label;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      button.textContent = done;
      button.classList.add('is-copied');
    } catch {
      // clipboard blocked; showing the command is more useful than failing silently
      button.textContent = text;
    }

    const timer = window.setTimeout(() => {
      timers.delete(timer);
      button.textContent = label;
      button.classList.remove('is-copied');
    }, 1800);
    timers.add(timer);
  };

  // One handler for the whole page, dispatched from the buttons themselves. A
  // listener per button would need unbinding each one by identity, and the
  // elements are replaced on every navigation anyway.
  const onPageClick = (event: Event): void => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('[data-copy]');
    if (button) void onClick(button);
  };

  document.addEventListener('click', onPageClick);

  return () => {
    document.removeEventListener('click', onPageClick);
    timers.forEach((timer) => window.clearTimeout(timer));
    timers.clear();
  };
}

/**
 * The language menu.
 *
 * A button with `aria-expanded`, a click and touch path, Escape to dismiss, and
 * a click outside to close. The list is `hidden` rather than collapsed with
 * `max-height`, so it is out of the accessibility tree and out of the tab order
 * when closed, with no dependence on an experimental CSS function resolving.
 */
function armLanguageMenu(): Cleanup {
  const toggle = document.querySelector<HTMLButtonElement>('[data-language-toggle]');
  const list = toggle?.nextElementSibling as HTMLElement | null;
  if (!toggle || !list) return () => {};

  const setOpen = (open: boolean): void => {
    toggle.setAttribute('aria-expanded', String(open));
    list.hidden = !open;
  };

  const onToggle = (): void => setOpen(toggle.getAttribute('aria-expanded') !== 'true');

  const onDocumentClick = (event: Event): void => {
    if (!toggle.contains(event.target as Node) && !list.contains(event.target as Node)) setOpen(false);
  };

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      setOpen(false);
      toggle.focus();
    }
  };

  setOpen(false);
  toggle.addEventListener('click', onToggle);
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeydown);

  return () => {
    toggle.removeEventListener('click', onToggle);
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onKeydown);
  };
}

/**
 * Registers everything, and returns the single cleanup for all of it.
 *
 * `afterMount` runs this before the next render, so no observer or listener can
 * outlive the subtree it was attached to.
 */
export function registerBenchmarkBehaviour(): Cleanup {
  const cleanups = [armReveals(), armChart(), armTable(), armCopyButtons(), armLanguageMenu()];

  return () => cleanups.forEach((dispose) => dispose());
}