/**
 * The copy of the landing page, one sheet per locale.
 *
 * Carats has no i18n primitive, and instant-docs' `%d%.key` placeholders are a
 * build-time substitution that has no analogue here. So a "localization sheet" is
 * what the previous dictionary file was: a plain object of strings, one per
 * locale, all three declared as {@link Sheet}.
 *
 * Two properties are enforced rather than hoped for:
 *
 *   - **Every field is required**, so a missing key is a type error rather than an
 *     English string leaking onto the Turkish page. That failure mode was real:
 *     the old generator filled `tr` and `ar` from `en`, printed a note about it,
 *     and exited 0.
 *   - **Token sets must match across locales.** The compiler checks that a key
 *     exists; it cannot check that a key which interpolates a figure still does.
 *     `scripts/check-token-parity.mjs` does that, and it caught a Turkish method
 *     line that had hardcoded `300` while English interpolated `{sequential}`.
 *
 * The sheet is fetched server-side by a culet and reaches components as props,
 * so no copy is bundled into the client payload.
 */
import type { RowId } from '../benchmark/facts';

/** English, and the reference the other two are checked against. */
const english = {
  /* hero */
  heroEyebrow: 'Long-awaited brilliance',
  heroTitle: 'Carats',
  heroLine1: "The refined framework you've been looking for.",
  heroLine2: 'Crafted for flawless performance.',
  installLabel: 'Bring it to life',
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
  receiptLede: "Every claim Carats makes, tested against the field's strongest contender.",
  tableCaption:
    'Measured comparison of Carats and Next.js on the same five-route application, ordered by size of difference.',
  columnMetric: 'Measurement',
  columnMargin: 'Carats margin',
  /** One entry per `comparisonRows()` id. The id union is the missing-key check. */
  rowLabels: {
    js: 'JavaScript sent to the browser, gzip',
    payload: 'Total page weight, gzip',
    buildout: 'Build output size',
    disk: 'Disk footprint, installed and built',
    pageload: 'Page load, end to end',
    rps: 'Throughput ceiling',
    devwarm: 'Development, second page load',
    build: 'Production build, median',
    devstart: 'Development server startup',
    prodstart: 'Production server startup',
    assets: 'Assets per page',
    deps: 'Direct dependencies',
    memory: 'Memory added by the framework',
  },
  receiptNote: 'Carats tested on Bun {bun}, Next.js on Node {node}.',
  receiptMethod:
    'Each framework answered {sequential} sequential requests, then {perLevel} at each of five concurrency levels. Recorded {recordedOn}.',

  /* act 3 — under load */
  loadKicker: 'Under pressure',
  loadHeading: 'As load rises, the gap widens',
  loadLede:
    'The same two servers, {perLevel} requests at each of five concurrency levels. A framework that cannot absorb load pays for it on every request it serves.',
  chartCaption:
    'Requests per second at concurrency 1 to 200. Carats peaks at {caratsPeak} rps, Next.js at {nextjsPeak} rps.',
  chartUnit: 'Requests served per second',
  chartScaleNote: 'Bars are scaled to a maximum of {max} requests per second.',
  chartAxisConcurrency: 'Concurrent requests',
  loadNote:
    'At four times the concurrency Next.js gains {nextjsPlateau}%: a ceiling, not a curve. Carats gains {caratsPlateau}% over the same range, and was still climbing when the test ended.',

  /* act 4 — the close */
  closeHeading: 'We cut only the excess.',
  closeLede:
    'Carats renders on the server and sends the page as it is. No client bundle to grow, no hydration to wait on, no JavaScript standing between a visitor and the content.',
  closeAction: 'Read the documentation',

  /* chrome */
  languageMenuLabel: 'Change language',
  footerMark: '◆ carats v1.0',
} as const;

/** Keys that carry `{placeholder}` tokens, and the values each may receive. */
export interface SheetPlaceholders {
  readonly max: string;
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
 * typecheck until it is translated. Token parity across locales is a separate
 * check, because a key that exists but has lost its `{token}` still typechecks.
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
  /** Screen-reader only: what the bar lengths are measured against. */
  readonly chartScaleNote: string;
  readonly chartAxisConcurrency: string;
  readonly loadNote: string;

  readonly closeHeading: string;
  readonly closeLede: string;
  readonly closeAction: string;

  readonly languageMenuLabel: string;
  readonly footerMark: string;
}

/** A sheet with every `{token}` resolved. Structurally identical to {@link Sheet}. */
export type ResolvedSheet = Sheet;

/** Turkish. Groups thousands with a dot and separates decimals with a comma. */
export const tr: Sheet = {
  heroEyebrow: 'Beklenen parıltı',
  heroTitle: 'Carats',
  heroLine1: 'Aradığınız seçkin altyapı.',
  heroLine2: 'Kusursuz performans için titizlikle işlendi.',
  installLabel: 'Hayata geçirin',
  copy: 'kopyala',
  copied: 'kopyalandı',
  docsLink: 'Dokümantasyon',

  receiptKicker: 'Eksiksiz değerleme',
  receiptHeading: 'Her yönüyle ölçüldü',
  receiptLede: 'Carats’ın her iddiası, alanın en güçlü rakibine karşı sınandı.',
  tableCaption:
    'Carats ile Next.js’in aynı beş rotalı uygulama üzerindeki ölçülmüş karşılaştırması, farkın büyüklüğüne göre sıralı.',
  columnMetric: 'Ölçüm',
  columnMargin: 'Carats farkı',
  rowLabels: {
    js: 'Tarayıcıya giden JavaScript, gzip',
    payload: 'Toplam sayfa ağırlığı, gzip',
    buildout: 'Yalnızca derleme çıktısı',
    disk: 'Diskte kapladığı alan, kurulu ve derlenmiş',
    pageload: 'Sayfa yükleme, uçtan uca',
    rps: 'Tepe istek kapasitesi',
    devwarm: 'Geliştirme, ikinci sayfa yükleme',
    build: 'Üretim derlemesi, medyan',
    devstart: 'Geliştirme sunucusu açılışı',
    prodstart: 'Üretim sunucusu açılışı',
    assets: 'Sayfa başına kaynak',
    deps: 'Doğrudan bağımlılık sayısı',
    memory: 'Framework’ün bellek yükü',
  },
  receiptNote: 'Carats, Bun {bun}; Next.js ise Node {node} üzerinde test edildi.',
  receiptMethod:
    'Her framework {sequential} ardışık isteğe, ardından beş eşzamanlılık düzeyinin her birinde {perLevel} isteğe yanıt verdi. Ölçüm tarihi: {recordedOn}.',

  loadKicker: 'Basınç altında',
  loadHeading: 'Yük arttıkça fark açılır',
  loadLede:
    'Aynı iki sunucu, beş eşzamanlılık düzeyinin her birinde {perLevel} istek. Yükü kaldıramayan bir altyapı, sunduğu her istekte bedel öder.',
  chartCaption:
    'Eşzamanlılık 1 ile 200 arasında saniyedeki istek sayısı. Carats {caratsPeak} istek/sn ile zirveye çıkıyor, Next.js {nextjsPeak} ile.',
  chartUnit: 'Saniyede sunulan istek sayısı',
  chartScaleNote: 'Çubuklar, saniyede en fazla {max} isteğe göre ölçeklenmiştir.',
  chartAxisConcurrency: 'Eşzamanlı istekler',
  loadNote:
    'Eşzamanlılığı dört katına çıkardığınızda Next.js yalnızca %{nextjsPlateau} kazanıyor; bu bir eğri değil, bir tavan. Carats aynı aralıkta %{caratsPlateau} kazanıyor ve ölçüm bittiğinde hâlâ tırmanıyordu.',

  closeHeading: 'Yalnızca fazlalığı kestik.',
  closeLede:
    'Carats sayfayı sunucuda oluşturur ve olduğu gibi gönderir. Büyüyen bir istemci paketi yok, beklenecek bir hydration yok, ziyaretçiyle içerik arasına giren bir JavaScript yok.',
  closeAction: 'Dokümantasyonu inceleyin',

  languageMenuLabel: 'Dili değiştir',
  footerMark: '◆ carats v1.0',
};

/**
 * Arabic. Right-to-left; the layout handles direction, not the copy.
 *
 * Carats is masculine here, so the copy uses masculine agreement throughout —
 * the earlier draft made it feminine in one line and masculine in the rest.
 * Numerals are Western throughout, matching `Bun 1.3.12` and the table beside
 * this text, and the percent sign is the plain `%` for the same reason: this is a
 * technical audience, not a literary one.
 */
export const ar: Sheet = {
  heroEyebrow: 'البريق المنتظر',
  heroTitle: 'Carats',
  heroLine1: 'إطار العمل الراقي الذي كنت تبحث عنه.',
  heroLine2: 'صُنع بإتقان من أجل أداء لا تشوبه شائبة.',
  installLabel: 'أحيِ أفكارك',
  copy: 'نسخ',
  copied: 'تم النسخ',
  docsLink: 'الوثائق',

  receiptKicker: 'التقييم الشامل',
  receiptHeading: 'كل جانب قِيس بدقة',
  receiptLede: 'كل ما يدّعيه Carats، اختُبر أمام أقوى منافس في المجال.',
  tableCaption: 'مقارنة مقيسة بين Carats وNext.js على التطبيق نفسه ذي المسارات الخمسة، مرتَّبة حسب حجم الفارق.',
  columnMetric: 'القياس',
  columnMargin: 'فارق Carats',
  rowLabels: {
    js: 'جافاسكريبت المُرسَل إلى المتصفح، بعد ضغط gzip',
    payload: 'الحجم الكلي للصفحة، بعد ضغط gzip',
    buildout: 'مخرجات البناء وحدها',
    disk: 'المساحة على القرص، بعد التثبيت والبناء',
    pageload: 'تحميل الصفحة، من البداية إلى النهاية',
    rps: 'سقف الإنتاجية',
    devwarm: 'التطوير، تحميل الصفحة الثانية',
    build: 'بناء الإنتاج، الوسيط',
    devstart: 'إقلاع خادم التطوير',
    prodstart: 'إقلاع خادم الإنتاج',
    assets: 'الموارد في كل صفحة',
    deps: 'الاعتماديات المباشرة',
    memory: 'الذاكرة التي يضيفها إطار العمل',
  },
  receiptNote: 'اختُبر Carats على Bun {bun}، وNext.js على Node {node}.',
  receiptMethod:
    'أجاب كل إطار عمل عن {sequential} طلبًا متتابعًا، ثم {perLevel} طلبًا عند كل مستوى من مستويات التزامن الخمسة. تاريخ القياس: {recordedOn}.',

  loadKicker: 'تحت الضغط',
  loadHeading: 'مع ازدياد الحِمل، يتّسع الفارق',
  loadLede:
    'الخادمان نفسهما، و{perLevel} طلب عند كل واحد من مستويات التزامن الخمسة. الإطار الذي لا يتحمّل الحِمل يدفع ثمنه مع كل طلب يخدمه.',
  chartCaption:
    'الطلبات في الثانية عند مستويات تزامن من 1 إلى 200. يبلغ Carats ذروته عند {caratsPeak} طلب/ثانية، وNext.js عند {nextjsPeak}.',
  chartUnit: 'الطلبات المُلبّاة في الثانية',
  chartScaleNote: 'تُقاس أطوال الأعمدة نسبةً إلى حدٍّ أقصى قدره {max} طلب في الثانية.',
  chartAxisConcurrency: 'طلبات متزامنة',
  loadNote:
    'عند أربعة أضعاف التزامن يكسب Next.js {nextjsPlateau}% فقط: سقفٌ لا منحنى. بينما يكسب Carats {caratsPlateau}% على المدى نفسه، وكان لا يزال يتصاعد حين انتهى القياس.',

  closeHeading: 'لم نقطع سوى الزائد.',
  closeLede:
    'يُنشئ Carats الصفحة على الخادم ويرسلها كما هي. لا حزمة عميل تتضخم، ولا hydration يُنتظر، ولا جافاسكريبت يقف بين الزائر والمحتوى.',
  closeAction: 'اطّلع على الوثائق',

  languageMenuLabel: 'غيّر اللغة',
  footerMark: '◆ carats v1.0',
};

/** English, as a sheet. Declared after {@link Sheet} so the type exists. */
export const en: Sheet = english;

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