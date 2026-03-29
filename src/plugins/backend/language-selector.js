import { load } from 'cheerio';

const langLabelmap = {
  en: 'English',
  ar: 'العربية',
  tr: 'Türkçe',
}

export default function languageSelector({ html, meta, lang, dir }) {
  const $ = load(html);
  const langs = process.env.CONTENT_LANGUAGES.split(',');
  const links = `<div data-length="${langs.length}" class="dropdown hidden">${langs.map((l) => `<a href="/${l}/latest">${langLabelmap[l]}</a>`).join('')}</div>`;
  $('.page').prepend(`<nav><img src="/static/assets/globe.svg" alt="Language selector icon" /> ${links}</nav>`);
  return $.html();
}
