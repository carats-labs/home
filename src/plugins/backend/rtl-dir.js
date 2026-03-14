import { load } from "cheerio";

export default function setRTLDir({ html, lang }) {
    const $ = load(html);
    const rtlLanguages = ['ar', 'fa', 'ur', 'he'];
    const isRTL = rtlLanguages.includes(lang);
    if(isRTL) $('html').attr('dir', 'rtl');
    return $.html();
}