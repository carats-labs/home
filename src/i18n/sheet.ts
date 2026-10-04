/**
 * The copy of the landing page, one sheet per locale.
 *
 * Carats has no i18n primitive, and instant-docs' `%d%.key` placeholders are a
 * build-time substitution that has no analogue here. So a "localization sheet" is
 * what the previous dictionary file was: a plain object of strings, one per
 * locale, typed against English.
 *
 * English is the source of truth and derives {@link Sheet}. Every other locale is
 * declared as {@link Sheet}, so a missing or misspelled key is a type error at
 * build time rather than an English string leaking onto the Turkish page. That
 * failure mode was real: the old generator filled `tr` and `ar` from `en`, printed
 * a note about it, and exited 0.
 *
 * The sheet is fetched server-side by a culet and reaches components as props,
 * so no copy is bundled into the client payload.
 */
import type { RowId } from '../benchmark/facts';

/** Everything on the page that is a sentence. */
const english = {
  /* hero */
  heroEyebrow: 'Finally, something that sparkles',
  heroTitle: 'Carats',
  heroLine1: 'The premium framework you were looking for.',
  heroLine2: 'Crafted for flawless performance.',
  installLabel: 'Bring to Life',
  copy: 'copy',
  copied: 'copied',
  docsLink: 'Documentation',

  /* The opening act that led into the byte counter went with it. Its heading and
     lede were good lines, but they only worked as a lead-in to a number, and the
     number was the confusion: a bare "5,436 B" reads as the weight of the page
     you are on. That figure belongs to benchmark/carats-app and is now shown
     only inside the table, whose caption names the application. */

  /* act 2 — the full comparison */
  receiptKicker: 'The full appraisal',
  receiptHeading: 'Every facet, measured',
  receiptLede: 'Every claim Carats makes, measured against the one framework built to win.',
  tableCaption:
    'Measured comparison of Carats and Next.js on the same five-route application, ordered by size of difference.',
  columnMetric: 'Measurement',
  columnMargin: 'Carats margin',
  /** One entry per `BenchmarkFacts` row id, in `comparisonRows()` order. */
  rowLabels: {
    js: 'JavaScript to the browser, gzip',
    payload: 'Total page weight, gzip',
    buildout: 'Build output alone',
    disk: 'Disk, installed and built',
    pageload: 'Page load, whole waterfall',
    rps: 'Throughput ceiling',
    devwarm: 'Dev, second page load',
    build: 'Production build, median',
    devstart: 'Dev server start',
    prodstart: 'Production server start',
    assets: 'Assets per page',
    deps: 'Top-level dependencies',
    memory: 'Memory the framework itself adds',
  },
  receiptNote: 'Carats tested on Bun {bun}, Next.js on Node {node}.',
  receiptMethod:
    'Each framework answered {sequential} sequential requests, then {perLevel} at each of five concurrency levels. Recorded {recordedOn}.',

  /* act 3 — under load */
  loadKicker: 'Under pressure',
  loadHeading: 'Where each one gives way',
  loadLede:
    'The same two servers, two thousand requests, five levels of concurrency. A framework that cannot absorb load pays interest on every request it serves.',
  chartCaption:
    'Requests per second at concurrency 1 to 200. Carats peaks at {caratsPeak} rps, Next.js at {nextjsPeak} rps.',
  chartUnit: 'Requests served per second',
  chartAxisConcurrency: 'Concurrent requests',
  loadNote:
    'Quadruple the concurrency and Next.js gains {nextjsPlateau}%: a ceiling, not a curve. Carats gains {caratsPlateau}% over the same range, and was still climbing when the sweep ended.',

  /* act 4 — the close */
  closeHeading: 'Cut away everything but the page.',
  closeLede:
    'Carats renders on the server and sends the page, and nothing more. No client bundle to grow, no hydration to wait on, no JavaScript standing between a visitor and the content.',
  closeAction: 'Explore the documentation',

  /* chrome */
  languageMenuLabel: 'Change language',
  footerMark: '◆ carats v1.0',
} as const;

/** Keys that carry `{placeholder}` tokens, and the values each may receive. */
export interface SheetPlaceholders {
  readonly caratsPeak: string;
  readonly nextjsPeak: string;
  readonly nextjsPlateau: string;
  readonly caratsPlateau: string;
  readonly bun: string;
  readonly node: string;
  readonly sequential: string;
  readonly perLevel: string;
  readonly recordedOn: string;
}

/**
 * A complete, translated copy of the page.
 *
 * Every field is required, and the row labels are keyed by the benchmark's own
 * {@link RowId} union, so adding a measurement makes every locale fail to
 * typecheck until it is translated. That is the whole point of the sheet: the
 * compiler is the missing-key check, in place of a generator that used to fill
 * other languages from English and exit successfully.
 */
export interface Sheet {
  readonly heroEyebrow: string;
  readonly heroTitle: string;
  readonly heroLine1: string;
  readonly heroLine2: string;
  readonly installLabel: string;
  readonly copy: string;
  readonly copied: string;
  readonly docsLink: string;

  readonly receiptKicker: string;
  readonly receiptHeading: string;
  readonly receiptLede: string;
  readonly tableCaption: string;
  readonly columnMetric: string;
  readonly columnMargin: string;
  readonly rowLabels: Readonly<Record<RowId, string>>;
  readonly receiptNote: string;
  readonly receiptMethod: string;

  readonly loadKicker: string;
  readonly loadHeading: string;
  readonly loadLede: string;
  readonly chartCaption: string;
  readonly chartUnit: string;
  readonly chartAxisConcurrency: string;
  readonly loadNote: string;

  readonly closeHeading: string;
  readonly closeLede: string;
  readonly closeAction: string;

  readonly languageMenuLabel: string;
  readonly footerMark: string;
}

/**
 * Every locale's sheet, keyed by locale.
 *
 * English is derived from the literal above; the others are declared as
 * {@link Sheet}, so this record cannot be given a locale that is missing a key
 * without the compiler objecting.
 */
export const en: Sheet = english;

/** Turkish. Turkish groups thousands with a dot, so it needs its own numerals. */
export const tr: Sheet = {
  heroEyebrow: 'Nihayet, beklenen parıltı',
  heroTitle: 'Carats',
  heroLine1: 'Aradığınız o seçkin altyapı.',
  heroLine2: 'Kusursuz performans için titizlikle işlendi.',
  installLabel: 'Hayata Geçirin',
  copy: 'kopyala',
  copied: 'kopyalandı',
  docsLink: 'Dokümantasyon',

  receiptKicker: 'Tam ekspertiz',
  receiptHeading: 'Her yüz, ölçülmüş',
  receiptLede: 'Carats’in öne sürdüğü her iddia, kazanmak için tasarlanmış tek framework’e karşı ölçüldü.',
  tableCaption:
    'Carats ile Next.js’in aynı beş rotalı uygulama üzerindeki ölçülmüş karşılaştırması, farkın büyüklüğüne göre sıralı.',
  columnMetric: 'Ölçüm',
  columnMargin: 'Carats farkı',
  rowLabels: {
    js: 'Tarayıcıya giden JavaScript, gzip',
    payload: 'Toplam sayfa ağırlığı, gzip',
    buildout: 'Yalnızca derleme çıktısı',
    disk: 'Disk, kurulu ve derlenmiş',
    pageload: 'Sayfa yükleme, tüm akış',
    rps: 'Azami işlem kapasitesi',
    devwarm: 'Geliştirme, ikinci sayfa yükleme',
    build: 'Üretim derlemesi, medyan',
    devstart: 'Geliştirme sunucusu açılışı',
    prodstart: 'Üretim sunucusu açılışı',
    assets: 'Sayfa başına varlık',
    deps: 'Doğrudan bağımlılık sayısı',
    memory: 'Framework’in kendi eklediği bellek',
  },
  receiptNote: 'Carats Bun {bun}, Next.js ise Node {node} üzerinde test edildi.',
  receiptMethod:
    'Her framework {sequential} sıralı isteğe, ardından beş eşzamanlılık düzeyinin her birinde {perLevel} isteğe yanıt verdi. Kayıt tarihi: {recordedOn}.',

  loadKicker: 'Basınç altında',
  loadHeading: 'Hangisi nerede verir',
  loadLede:
    'Aynı iki sunucu, iki bin istek, beş eşzamanlılık düzeyi. Yükü kaldıramayan bir framework, sunduğu her istek için faiz öder.',
  chartCaption:
    'Eşzamanlılık 1 ile 200 arasında saniyedeki istek sayısı. Carats {caratsPeak} istek/sn ile zirveye çıkıyor, Next.js {nextjsPeak} ile.',
  chartUnit: 'Saniyede sunulan istek sayısı',
  chartAxisConcurrency: 'Eşzamanlı istekler',
  loadNote:
    'Eşzamanlılığı dörde katla: Next.js yalnızca %{nextjsPlateau} kazanıyor, yani bir eğri değil bir tavan. Carats aynı aralıkta %{caratsPlateau} kazanıyor ve ölçüm bittiğinde hâlâ tırmanıyordu.',

  closeHeading: 'Her şeyi atın, yalnızca sayfa kalsın.',
  closeLede:
    'Carats sunucuda oluşturur ve sayfayı gönderir, fazlasını değil. Büyüyecek bir istemci paketi yok, bekleyecek bir hidrasyon yok, ziyaretçiyi içerikten ayıran bir JavaScript yok.',
  closeAction: 'Dokümantasyonu keşfedin',

  languageMenuLabel: 'Dili değiştir',
  footerMark: '◆ carats v1.0',
};

/** Arabic. Right-to-left; the layout handles direction, not the copy. */
export const ar: Sheet = {
  heroEyebrow: 'أخيرًا، شيء يلمع',
  heroTitle: 'Carats',
  heroLine1: 'الإطار المتميز الذي تبحث عنه.',
  heroLine2: 'صُممت بحرفية عالية لتقديم أداء متميز.',
  installLabel: 'أحيِ أفكارك',
  copy: 'نسخ',
  copied: 'تم النسخ',
  docsLink: 'الوثائق',

  receiptKicker: 'التقييم الكامل',
  receiptHeading: 'كل وجه، مقيس',
  receiptLede: 'كل ما يدّعيه Carats، مقيس في مقابل الإطار الوحيد الذي صُمّم ليربح.',
  tableCaption: 'مقارنة مقيسة بين Carats وNext.js على التطبيق نفسه ذي المسارات الخمسة، مرتَّبة حسب حجم الفارق.',
  columnMetric: 'القياس',
  columnMargin: 'فارق Carats',
  rowLabels: {
    js: 'الجافاسكريبت إلى المتصفح، مضغوط',
    payload: 'إجمالي حجم الصفحة، مضغوط',
    buildout: 'مخرجات البناء وحدها',
    disk: 'القرص، بعد التثبيت والبناء',
    pageload: 'تحميل الصفحة، كامل المسار',
    rps: 'سقف الإنتاجية',
    devwarm: 'التطوير، تحميل الصفحة الثانية',
    build: 'بناء الإنتاج، الوسيط',
    devstart: 'إقلاع خادم التطوير',
    prodstart: 'إقلاع خادم الإنتاج',
    assets: 'الأصول في الصفحة',
    deps: 'الاعتماديات المباشرة',
    memory: 'الذاكرة التي يضيفها الإطار نفسه',
  },
  receiptNote: 'اختُبر Carats على Bun {bun}، وNext.js على Node {node}.',
  receiptMethod:
    'أجاب كل إطار عن {sequential} طلبًا متتابعًا، ثم {perLevel} عند كل واحد من مستويات التوازي الخمسة. سُجّل في {recordedOn}.',

  loadKicker: 'تحت الضغط',
  loadHeading: 'أين ينهار كلٌّ منهما',
  loadLede: 'الخادمان نفهما، ألفا طلب، خمسة مستويات توازٍ. الإطار الذي لا يتحمّل الحِمل يدفع فائدة على كل طلبٍ يقدّمه.',
  chartCaption:
    'الطلبات في الثانية عند توازٍ من 1 إلى 200. يبلغ Carats ذروته عند {caratsPeak} طلب/ثانية، وNext.js عند {nextjsPeak}.',
  chartUnit: 'الطلبات المقدَّمة في الثانية',
  chartAxisConcurrency: 'طلبات متزامنة',
  loadNote:
    'ارفع التوازي أربعة أضعاف فيكسب Next.js {nextjsPlateau}٪ فقط: سقفٌ لا منحنى. ويكسب Carats {caratsPlateau}٪ على المدى نفسه، وكان لا يزال يتصاعد حين انتهى القياس.',

  closeHeading: 'أزِل كل شيء عدا الصفحة.',
  closeLede:
    'يعرض Carats الصفحة على الخادم ثم يرسلها، لا أكثر. لا حزمة للمتصفح تنمو، ولا ترطيبٍ يُنتظر، ولا جافاسكريبت يفصل بين الزائر والمحتوى.',
  closeAction: 'استكشف التوثيق',

  languageMenuLabel: 'غيّر اللغة',
  footerMark: '◆ carats v1.0',
};

/** A sheet with every `{token}` resolved. */
export type ResolvedSheet = Sheet;

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Substitutes `{tokens}` in a sheet string.
 *
 * The previous implementation used a `%d%.key` prefix inside generated HTML and
 * a template literal for anything interpolated. Both put a number into the prose
 * by hand at the point of authoring, which is how a figure and its sentence could
 * drift apart. Here the tokens stay in the copy and the numbers come from
 * {@link BenchmarkFacts}, so the sheet only ever says *what* to show.
 *
 * An unknown token throws instead of rendering literally: a typo in a sheet is a
 * visible failure, not a stray `{caratsGzip}` on the page.
 */
export function fill(template: string, values: SheetPlaceholders): string {
  return template.replace(PLACEHOLDER, (match, key: string) => {
    const value = values[key as keyof SheetPlaceholders];
    if (value === undefined) throw new Error(`Unknown placeholder ${match} in sheet string`);
    return value;
  });
}