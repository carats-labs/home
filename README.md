# carats-home

The Carats landing page, on the Carats framework. Server-rendered in four
languages, with the benchmark figures built from a single typed source.

Migrated from an instant-docs project of the same content. Nothing is committed;
`carats-home` (the old project) is untouched and still runs.

## Commands

| Command | What it does |
|---|---|
| `bun install` | install |
| `bun dev` | dev server with HMR, port 5173 or `$PORT` |
| `bun run build` | server bundle, then client bundle, into `dist/` |
| `bun run preview` | serve the built output |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run check` | typecheck plus a SASS compile |
| `bun run check:routes` | boot the dev server, assert every route's status and body |
| `bun run check:weight` | gzip sizes of what a visitor actually downloads |

The three `check` scripts start and stop a server inside a single command, so
they leave nothing running.

## Layout

```
src/
  app.ts                  express app, 404 guard
  benchmark/
    facts.ts              every measured figure, typed and asserted
    landing-facts.json    transcribed from the benchmark run
  i18n/
    locales.ts            Locale union, negotiation, dictionary loading
    dictionaries/*.json   the copy, one file per locale
    props.ts              resolves a locale into content for a page
  server/
    culets.ts             route strings and their props
  client/
    facets.tsx            the route table
    entrypoint.ts         mounts the app
    base.sass             tokens and reset
    components/           Hero, acts/
    pages/landing/        the page, its behaviour, its styles
    pages/_not_found/     also used by the error page
scripts/                  the checks above
```

## Localization sheets

Carats has no i18n primitive. There is no `dir` helper, no dictionary loader and
no locale type — verified against all seven installed packages and their type
definitions. So localization is built on top.

**A locale is part of the URL.** `/`, `/:lang`, `/:lang/:slug`. `matchRoute`
matches on an exact segment count with no wildcards, so each shape is declared
explicitly, and declaration order is priority order.

**Each dictionary is one JSON file.** `src/i18n/dictionaries/{en,es,tr,ar}.json`
holds a language's copy alongside its own facts — reading direction, numeral
system, unit labels — under `__`-prefixed keys. English is the reference: the
`Dictionary` type is derived from `en.json`, so every other file is checked against
it.

Dictionaries load on demand through a dynamic `import()` in `locales.ts`, one
chunk each. Loading `/tr` does not also fetch `en.json` and `ar.json`, and a
reader who never switches language never downloads them. The two facts the picker
needs before any dictionary has loaded — each language's endonym — live in
`LOCALE_NAMES` instead.

**The compiler is the missing-key check.** Adding a measurement adds a `RowId`,
which makes `rowLabels` incomplete, which makes every locale fail to typecheck
until it is translated. The previous project had a generator that filled `tr` and
`ar` from English, printed a note about the untranslated keys, and exited `0` — so
a Turkish reader was served English dressed as a translation and nothing broke.

Figures are not written into the copy. A sentence says `{caratsPeak}` and the
value arrives from `BenchmarkFacts`, formatted for the locale, so the number and
the sentence about it cannot drift apart. Spanish and Turkish read `5.436`;
English and Arabic read `5,436`.

`scripts/check-token-parity.mjs` covers what the compiler cannot: a key that
exists but has lost its `{token}`. `check:tokens:selftest` mutates the dictionaries
and requires the check to reject each change — including the ones the compiler
stays silent about, so the two mechanisms are known not to overlap.

### What a locale cannot do

`<html lang>` and `<html dir>` sit outside the head slot Carats exposes, so a
component cannot set them during server rendering. The page therefore carries
`lang` and `dir` on its own root as well, where `dir` inherits — which means
Arabic arrives right-to-left in the server's response, not after the bundle
loads. The document element is still updated on the client, because that is what
assistive technology and browser UI read.

## The benchmark cannot lie

`src/benchmark/facts.ts` transcribes the recorded run and asserts twelve headline
figures against `landing-facts.json` at import. A hand-edited number fails the
process instead of shipping. Ratios, bar widths and the counter's bar share are
derived in that one module, so nothing downstream can disagree with it.

## Notes on the framework

Things worth knowing before changing this code:

- **Every navigation replaces the entire `#app` subtree.** There is no hydration
  and no diffing — the page is rendered to a string and assigned as `innerHTML`.
  Any observer, listener or timer must be registered on every render, which is
  what `afterMount` returning its cleanup is for. The previous project got this
  wrong: the counter latched a "done" flag in a closure, so after the first
  language change the fresh node kept its server-rendered `0` and read `0B`
  forever. Nothing here is latched across renders; whether the counter has run is
  read from the DOM.
- **`this.head` only works on a route component.** A nested component is called
  as `type(props)` with no receiver, so `this.head = …` inside one throws. The
  not-found page is split into a body component and a route wrapper for this
  reason.
- **Components render on the server.** Anything that touches `document` during
  render is a bug. `beforeMount` and `afterMount` are client-only by design.
- **Every response is `200`.** `@carats/express` ends its catch-all with
  `res.status(200)` regardless of the URL, and `CaratsServerEntry.render` returns
  only `{ html, head }`, so there is no framework way to set a status. `app.ts`
  pins `404` by holding `writeHead` for paths no route can serve.
- **An unmatched first segment renders the not-found page.** `/de` matches no route
  — each locale is a literal path, not a `/:lang` pattern — so `getPageComponent`
  returns its own fallback and the framework answers `404` from `app.ts`. Nothing
  falls back to English under a URL naming a language the site does not have.
- **Do not import a dictionary at module scope.** That is what pulls all four into
  the entry chunk. `locales.ts` imports each one inside a loader function for that
  reason, which is why the page components are `async`.
- **Attributes are `Record<string, string>`.** `<video autoplay>` is a type error;
  `autoplay=""` is both what the types ask for and what reaches the browser.
- **Partial stylesheets do not import `base.sass`.** The tokens are custom
  properties, and `@use` would emit a second copy of the whole reset into every
  partial.

## Page weight

`bun run check:weight` reports what a visitor downloads for **this** page:

| locale | html gzip | css gzip | js gzip | dictionary gzip | total |
|---|---|---|---|---|---|
| en | 3.5 kB | 3.7 kB | 11.3 kB | 1.2 kB | 19.8 kB |
| es | 3.8 kB | 3.7 kB | 11.3 kB | 1.3 kB | 20.1 kB |
| tr | 3.8 kB | 3.7 kB | 11.3 kB | 1.4 kB | 20.2 kB |
| ar | 4.0 kB | 3.7 kB | 11.3 kB | 1.6 kB | 20.6 kB |

The dictionary is a separate row because each one is its own chunk, fetched only
for the language being read. `bun run check:weight` measures the rest.

These are not the figures the page quotes. Every number in the benchmark table —
5,436 B against 176,227 B, 1,541 ms against 7,283 ms — belongs to
`benchmark/carats-app`: one four-route demo, built once with Carats and once with
Next.js, and measured on the same machine. The comparison is between those two
builds of that one application.

This page is a separate, later artifact. An earlier version opened with a byte
counter that animated up to 5,436 B under the visitor's own scroll, which read as
the weight of the page being viewed. It was not; it was the weight of a different
application, named nowhere near the number. That act was removed and the figure
now appears only inside the table, whose caption names the application it belongs
to.

The remaining 11.3 kB of JavaScript is the framework runtime plus the language
picker and the scroll reveals.