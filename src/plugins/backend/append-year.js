import { load } from 'cheerio';

export default function addSignature({ html, meta, lang, dir }) {
  const $ = load(html);
  const currentYear = new Date().getFullYear();

  // Find the footer element and append the year
  $('footer').append(`<div>${currentYear}</div>`);

  // Get the updated HTML
  return $.html();
}
