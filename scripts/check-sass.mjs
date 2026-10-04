/**
 * Compiles every stylesheet with sass directly.
 *
 * Iterating through the dev server to find a SASS syntax error is slow and the
 * error Vite reports is sometimes positioned against a stale copy of the file.
 * This gives the compiler's own message, in one pass.
 */
import { compile } from 'sass-embedded';
import { relative, resolve } from 'path';

const FILES = [
  'src/client/base.sass',
  'src/client/app.sass',
  'src/client/pages/landing/landing.sass',
  'src/client/pages/_not_found/notfound.sass',
];

let failed = false;

for (const file of FILES) {
  try {
    // compile(path) resolves the file's own imports relative to it
    const result = compile(resolve(file), { style: 'compressed' });
    console.log(`  ok    ${file}  ${(result.css.length / 1024).toFixed(1)} kB`);
  } catch (error) {
    failed = true;
    console.log(`  FAIL  ${file}`);
    console.log(
      String(error.message)
        .split('\n')
        .slice(0, 12)
        .map((line) => `        ${line}`)
        .join('\n'),
    );
  }
}

process.exit(failed ? 1 : 0);