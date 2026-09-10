import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NivoChart } from './nivoCharts.jsx';
import {
  analyse, convertRows, currencies, demoRows, deduplicateRows, parseCsvFile, readCachedRate,
  saveCachedRate, validateRows
} from './services/marketService.js';
import { analyseInWorker, parseCsvFileInWorker } from './services/marketWorkerClient.js';
import { fetchInventoryPrices } from './services/steamMarket.js';
import { clearDataset, readDataset, writeDataset } from './services/storage.js';

const copy = {
  tr: {
    subtitle: 'CSV geçmiş görüntüleyici', hero: 'Pazar geçmişini', heroAccent: 'kolayca incele.',
    heroText: 'Steam Market CSV dosyanı yükle; alış ve satış geçmişini grafikler ve tablolarla incele.',
    upload: 'Dosyanı aç', drop: 'CSV dosyanı buraya bırak', choose: 'Dosya seç', demo: 'Örnek verilerle keşfet',
    exportCsvTooltip: 'CSV olarak dışa aktar', exportJsonTooltip: 'JSON olarak dışa aktar', activityCount: 'Bu zaman aralığındaki işlem sayısı',
    realisedHelp: 'Satışlardan elde edilen, ücret tahmini düşülmüş fark.', soldHelp: 'Tüm satış işlemlerinin toplam değeri.',
    boughtHelp: 'Tüm alış işlemlerinin toplam değeri.', feesHelp: 'Satışlardan düşülen tahmini Steam ücretleri.',
    inventoryHelp: 'FIFO eşleşmesinden sonra kalan ürün adedi.', inventoryCostHelp: 'Kalan ürünlerin alış maliyeti.', inventoryValueHelp: 'Kalan ürünlerin güncel tahmini piyasa değeri.',
    unrealisedHelp: 'Henüz satılmamış ürünlerdeki tahmini fark.', unrealisedRoiHelp: 'Kalan envanterin maliyetine göre tahmini getirisi.',
    holdingDaysHelp: 'Kalan ürünlerin ortalama elde tutulma süresi.', transactionsHelp: 'Filtrelerden sonra analiz edilen toplam işlem sayısı.',
    dashboard: 'Pazar geçmişin', newFile: 'Yeni dosya', add: 'CSV ekle', settings: 'Ayarlar', install: 'Uygulamayı yükle',
    exportHint: 'PNG ve PDF, açık olan analiz sekmesini raporlar.', game: 'Oyun', all: 'Tüm oyunlar', item: 'Ürün ara',
    from: 'Başlangıç', to: 'Bitiş', clear: 'Filtreleri temizle', preset: 'Tarih aralığı', allTime: 'Tüm zamanlar', last30: 'Son 30 gün', last90: 'Son 90 gün', yearToDate: 'Bu yıl', type: 'İşlem türü', allTypes: 'Tümü', purchaseType: 'Alış', saleType: 'Satış', sourceCurrencyLabel: 'Kaynak para birimi', overview: 'Genel bakış', games: 'Oyunlar',
    profit: 'Alış / satış', activity: 'Aktivite', purchases: 'Alışlar', sales: 'Satışlar', net: 'Net',
    realised: 'Gerçekleşmiş fark', sold: 'Satış hacmi', bought: 'Alış hacmi', fees: 'Tahmini ücret',
    inventory: 'Kalan envanter', inventoryCost: 'Kalan maliyet', inventoryValue: 'Kalan piyasa değeri',
    unrealised: 'Gerçekleşmemiş kâr', unrealisedRoi: 'Gerçekleşmemiş ROI', holdingDays: 'Ort. elde tutma',
    oldestHolding: 'En eski envanter', valuation: 'Değerleme: son alış fiyatı', transactions: 'İşlem', types: 'Alış / satış dağılımı',
    refreshPrices: 'Canlı fiyatları yenile', pricesLoading: 'Steam fiyatları alınıyor…', pricesDone: 'Canlı fiyatlar güncellendi.', pricesFallback: 'Bazı canlı fiyatlar alınamadı; son alış fiyatı kullanılıyor.',
    timeline: 'Aylık işlem hareketi', cumulative: 'Kümülatif gerçekleşmiş kâr', roi: 'Aylık ROI',
    gameTable: 'Oyun özeti', profitTable: 'FIFO alış / satış eşleşmeleri', inventoryTable: 'Kalan envanter',
    demoData: 'Demo verisi', records: 'kayıt', cashflow: 'Nakit akışı', avgBuy: 'Ort. alış', avgSale: 'Ort. satış', quantity: 'Adet', fifoNote: 'FIFO, satışları en eski uygun alışlarla eşleştirir.',
    comparison: 'Oyun karşılaştırması', comparisonSpent: 'Alış', comparisonEarned: 'Satış', comparisonCashflow: 'Net nakit akışı',
    search: 'Tabloda ara…', previous: 'Önceki', next: 'Sonraki', page: 'Sayfa', noData: 'Bu filtre için gösterilecek veri yok.',
    quality: 'Veri kalitesi', confirm: 'İçe aktar', cancel: 'İptal', preview: 'CSV içe aktarma önizlemesi',
    failed: 'başarısız dosya', failedFiles: 'İşlenemeyen dosyalar', noFailed: 'Tüm dosyalar işlendi',
    files: 'dosya', accepted: 'kabul edilen kayıt', duplicates: 'atlanan tekrar', invalid: 'okunamayan tarih',
    fee: 'Ücret tahmini uygula', feeText: 'Satış değerlerinden seçilen oranı düşerek FIFO farkını hesaplar.',
    rate: 'Tahmini ücret oranı', source: 'Yedek CSV para birimi', currency: 'Görüntüleme para birimi',
    privacy: 'Veriler yalnızca bu cihazda işlenir.', login: 'Steam girişi gerekmez', fast: 'Hızlı özet', oneOrMore: 'bir veya birden fazla dosya seçebilirsin',
    infoPrivacy: 'CSV dosyan herhangi bir sunucuya gönderilmez. Analiz cihazında yapılır ve kolaylık için tarayıcı depolamasında tutulabilir.',
    infoAccuracy: 'Sonuçlar CSV içindeki tutarlara dayanır. Eksik geçmiş, farklı para birimleri veya Steam ücretlerinin gösterim biçimi sonuçları etkileyebilir.',
    infoProject: 'Bu site boş zamanda geliştirilen kişisel bir deneme projesidir.', infoAffiliation: 'MarketMemento; Valve, Steam veya Steam Inventory Helper ile bağlantılı değildir.',
    techKicker: 'Altyapı şeffaflığı', techTitle: 'Kütüphaneler ve servisler', techLicenses: 'Lisanslar',
    techReact: 'Uygulama arayüzü', techNivo: 'Etkileşimli veri grafikleri', techPapa: 'CSV dosyalarını ayrıştırma', techExport: 'PNG ve PDF rapor çıktıları', techRates: 'Para birimi referans kurları', techBrowser: 'Yerel saklama ve çevrimdışı çalışma',
    techPrivacy: 'CSV içeriği yalnızca tarayıcıda işlenir. Frankfurter’a kur dönüşümü için yalnızca para birimi kodları gönderilir.',
    guide: 'CSV dosyasını edin', guideTitle: 'Dosyayı nereden bulacağım?', installHelper: "Steam Inventory Helper'ı kur", installHelperText: 'Eklentiyi yalnızca resmi Chrome Web Mağazası sayfasından yükle.', openStore: "Chrome Web Mağazası'nı aç",
    openMarket: "Pazar Geçmişim'i aç", marketText: 'Tarayıcıdan Steam’e giriş yap ve “Pazar Geçmişim” bölümüne git.', exportCsv: "CSV dosyasını dışa aktar", exportCsvText: 'Eklentinin eklediği dışa aktarma düğmesiyle geçmişini indir, sonra dosyayı yukarıya bırak.',
    info: 'Gizlilik ve hesaplama', close: 'Kapat', report: 'Rapor hazırlanıyor…', exportError: 'Rapor oluşturulamadı.', theme: 'Temayı değiştir', github: 'GitHub deposunu aç',
    csvOnly: 'Yalnızca .csv dosyaları desteklenir.', reading: 'Okunuyor ve doğrulanıyor…', noRows: 'Analiz edilebilir kayıt bulunamadı.',
    heatmap: 'Aktivite ısı haritası', year: 'Yıllara göre aylık işlemler', matched: 'eşleşen satış', unmatched: 'eşleşmemiş alış',
    jan: 'Oca', feb: 'Şub', mar: 'Mar', apr: 'Nis', may: 'May', jun: 'Haz', jul: 'Tem', aug: 'Ağu', sep: 'Eyl', oct: 'Eki', nov: 'Kas', dec: 'Ara'
  },
  en: {
    subtitle: 'CSV history viewer', hero: 'Explore your market', heroAccent: 'history with ease.',
    exportCsvTooltip: 'Export as CSV', exportJsonTooltip: 'Export as JSON', activityCount: 'Transactions in this time range',
    realisedHelp: 'Difference from sales after estimated fees.', soldHelp: 'Total value of all sale transactions.',
    boughtHelp: 'Total value of all purchase transactions.', feesHelp: 'Estimated Steam fees deducted from sales.',
    inventoryHelp: 'Items remaining after FIFO matching.', inventoryCostHelp: 'Purchase cost of the remaining items.', inventoryValueHelp: 'Estimated current market value of remaining items.',
    unrealisedHelp: 'Estimated difference on items not sold yet.', unrealisedRoiHelp: 'Estimated return against remaining inventory cost.',
    holdingDaysHelp: 'Average time the remaining items have been held.', transactionsHelp: 'Total transactions included after filtering.',
    heroText: 'Upload your Steam Market CSV and explore purchases, sales, charts and tables.',
    upload: 'Open your file', drop: 'Drop your CSV here', choose: 'Choose file', demo: 'Explore sample data',
    dashboard: 'Your market history', newFile: 'New file', add: 'Add CSV', settings: 'Settings', install: 'Install app',
    exportHint: 'PNG and PDF report the currently open analysis tab.', game: 'Game', all: 'All games', item: 'Search items', preset: 'Date range', allTime: 'All time', last30: 'Last 30 days', last90: 'Last 90 days', yearToDate: 'Year to date', type: 'Transaction type', allTypes: 'All types', purchaseType: 'Purchase', saleType: 'Sale', sourceCurrencyLabel: 'Source currency',
    from: 'From', to: 'To', clear: 'Clear filters', overview: 'Overview', games: 'Games', profit: 'Buy / sell',
    activity: 'Activity', purchases: 'Purchases', sales: 'Sales', net: 'Net', realised: 'Realised difference',
    sold: 'Sales volume', bought: 'Purchase volume', fees: 'Estimated fees', inventory: 'Remaining inventory',
    inventoryCost: 'Remaining cost', inventoryValue: 'Remaining market value', unrealised: 'Unrealised profit',
    unrealisedRoi: 'Unrealised ROI', holdingDays: 'Avg. holding time', oldestHolding: 'Oldest inventory',
    valuation: 'Valuation: latest purchase price', transactions: 'Transactions', types: 'Purchases / sales', timeline: 'Monthly activity',
    refreshPrices: 'Refresh live prices', pricesLoading: 'Fetching Steam prices…', pricesDone: 'Live prices updated.', pricesFallback: 'Some live prices were unavailable; latest purchase prices are used.',
    cumulative: 'Cumulative realised profit', roi: 'Monthly ROI', gameTable: 'Game summary',
    profitTable: 'FIFO buy / sell matches', inventoryTable: 'Remaining inventory', search: 'Search table…',
    demoData: 'Demo data', records: 'records', cashflow: 'Cash flow', avgBuy: 'Avg. buy', avgSale: 'Avg. sale', quantity: 'Qty', fifoNote: 'FIFO matches sales with the oldest available purchase.',
    comparison: 'Game comparison', comparisonSpent: 'Purchases', comparisonEarned: 'Sales', comparisonCashflow: 'Net cash flow',
    previous: 'Previous', next: 'Next', page: 'Page', noData: 'No data for these filters.',
    quality: 'Data quality', confirm: 'Import', cancel: 'Cancel', preview: 'CSV import preview',
    failed: 'failed files', failedFiles: 'Files that could not be processed', noFailed: 'All files processed',
    files: 'files', accepted: 'accepted records', duplicates: 'duplicates skipped', invalid: 'unreadable dates',
    fee: 'Apply fee estimate', feeText: 'Subtract the selected rate from sales when calculating FIFO profit.',
    rate: 'Estimated fee rate', source: 'Fallback CSV currency', currency: 'Display currency',
    privacy: 'Data is processed only on this device.', login: 'Steam login not required', fast: 'Fast overview', oneOrMore: 'you can choose one or more files',
    infoPrivacy: 'Your CSV is never sent to a server. Analysis runs on your device and may be kept in browser storage for convenience.',
    infoAccuracy: 'Results are based on the amounts in your CSV. Missing history, mixed currencies, or Steam fee formatting can affect the results.',
    infoProject: 'This is a personal side project built for fun.', infoAffiliation: 'MarketMemento is not affiliated with Valve, Steam or Steam Inventory Helper.',
    techKicker: 'Stack transparency', techTitle: 'Libraries and services', techLicenses: 'Licenses',
    techReact: 'Application interface', techNivo: 'Interactive data charts', techPapa: 'CSV file parsing', techExport: 'PNG and PDF report exports', techRates: 'Currency reference rates', techBrowser: 'Local storage and offline support',
    techPrivacy: 'CSV content is processed only in your browser. Only currency codes are sent to Frankfurter when exchange-rate conversion is needed.',
    guide: 'Get your CSV', guideTitle: 'Where can I find it?', installHelper: 'Install Steam Inventory Helper', installHelperText: 'Use the official Chrome Web Store page only.', openStore: 'Open Chrome Web Store',
    openMarket: 'Open market history', marketText: 'Open your Steam Community Market history while signed in.', exportCsv: 'Export the CSV file', exportCsvText: 'Download your history with the extension, then drop the file above.',
    info: 'Privacy and calculation', close: 'Close', report: 'Preparing report…', exportError: 'The report could not be created.', theme: 'Toggle theme', github: 'Open GitHub repository',
    csvOnly: 'Only .csv files are supported.', reading: 'Reading and validating…', noRows: 'No analysable rows found.',
    heatmap: 'Activity heatmap', year: 'Monthly activity by year', matched: 'matched sales', unmatched: 'unmatched purchases',
    jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec'
  }
};

const currencyOptions = ['USD', 'TRY', 'EUR', 'GBP', 'CNY', 'JPY'];
const money = (value, currency, lang) => new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', {
  style: 'currency', currency
}).format(Number(value) || 0);

function reviveAnalysisDates(value) {
  if (Array.isArray(value)) return value.map(reviveAnalysisDates);
  if (value instanceof Date) return value;
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
    key,
    key === 'date' && typeof entry === 'string' ? new Date(entry) : reviveAnalysisDates(entry)
  ]));
}

function Modal({ title, onClose, children, closeLabel }) {
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef(null);
  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, 260);
  };
  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);
  return <div className={`react-modal-backdrop ${closing ? 'is-closing' : ''}`} role="presentation" onMouseDown={event => {
    if (event.target === event.currentTarget) requestClose();
  }}><div className="modal-content glass-panel" role="dialog" aria-modal="true" aria-labelledby="react-modal-title">
    <div className="modal-header border-0"><h2 id="react-modal-title" className="modal-title fs-5">{title}</h2>
      <button type="button" className="btn-close" onClick={requestClose} aria-label={closeLabel} /></div>
    <div className="modal-body pt-0">{children}</div>
  </div></div>;
}

function StyledSelect({ value, onChange, options, ariaLabel, className = 'form-select' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(option => option.value === value) || options[0];
  useEffect(() => {
    const close = event => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return <div ref={ref} className={`styled-select ${open ? 'is-open' : ''}`}>
    <select className="styled-select-native" aria-label={ariaLabel} value={value} onChange={event => onChange(event.target.value)}>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    <button type="button" className={className} aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)}>
      <span>{selected?.label}</span><i className={`bi bi-chevron-${open ? 'up' : 'down'}`} />
    </button>
    {open ? <div className="styled-select-menu" role="listbox" aria-label={ariaLabel}>{options.map(option => <button type="button" role="option" aria-selected={option.value === value} className={option.value === value ? 'is-selected' : ''} key={option.value} onClick={() => { onChange(option.value); setOpen(false); }}>{option.label}</button>)}</div> : null}
  </div>;
}

function ExportButton({ tableId, rows, columns, format, t }) {
  const exportRows = () => {
    const values = rows.map(row => columns.map(column => column.value(row)));
    const headers = columns.map(column => column.label);
    const content = format === 'csv'
      ? [headers, ...values].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
      : JSON.stringify(values.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index]]))), null, 2);
    const url = URL.createObjectURL(new Blob([format === 'csv' ? '\uFEFF' : '', content], {
      type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8'
    }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${tableId}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const tooltip = format === 'csv' ? 'exportCsvTooltip' : 'exportJsonTooltip';
  return <button className="export-button has-tooltip" type="button" onClick={exportRows} data-tooltip={t(tooltip)} aria-label={t(tooltip)}>
    <i className={`bi ${format === 'csv' ? 'bi-filetype-csv' : 'bi-braces'}`} />
  </button>;
}

function DataTable({ id, title, rows, columns, t, pageSize = 25 }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ index: -1, direction: 1 });
  const matching = useMemo(() => rows.filter(row => !query || columns.some(column =>
    String(column.value(row)).toLocaleLowerCase().includes(query.toLocaleLowerCase()))), [rows, columns, query]);
  const sorted = useMemo(() => [...matching].sort((left, right) => {
    if (sort.index < 0) return 0;
    const a = columns[sort.index].value(left);
    const b = columns[sort.index].value(right);
    const result = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), undefined, { numeric: true });
    return result * sort.direction;
  }), [matching, columns, sort]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return <section className="table-section tab-panel active">
    <div className="section-heading"><h2>{title}</h2><div className="table-tools"><input className="table-search" value={query} placeholder={t('search')} onChange={event => { setQuery(event.target.value); setPage(1); }} />
      <ExportButton tableId={id} rows={matching} columns={columns} format="csv" t={t} /><ExportButton tableId={id} rows={matching} columns={columns} format="json" t={t} /></div></div>
    <div className="table-wrap"><table id={id}><thead><tr>{columns.map((column, index) => <th scope="col" key={column.key}><button type="button" className="table-sort" onClick={() => setSort(value => ({ index, direction: value.index === index ? -value.direction : 1 }))}>{column.label}</button></th>)}</tr></thead>
      <tbody>{visible.map((row, index) => <tr key={`${id}-${index}-${String(columns[0].value(row))}`}>{columns.map(column => {
        const value = column.value(row);
        return <td key={column.key} className={column.tone && typeof value === 'number' ? value > 0 ? 'profit' : value < 0 ? 'loss' : '' : ''}>{column.format ? column.format(value) : value}</td>;
      })}</tr>)}</tbody></table></div>
    {sorted.length > pageSize ? <div className="table-pagination"><button type="button" className="pagination-button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹ {t('previous')}</button><span>{t('page')} {currentPage} / {pages}</span><button type="button" className="pagination-button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>{t('next')} ›</button></div> : null}
  </section>;
}

function Heatmap({ analysis, t }) {
  const labels = analysis.activityMode === 'hour'
    ? Array.from({ length: 24 }, (_, index) => `${index}:00`)
    : [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')];
  const max = Math.max(1, ...analysis.activity.flatMap(row => row));
  return <div className="heatmap-wrap"><div className="heatmap-grid" style={{ '--heatmap-columns': labels.length }}>{analysis.activity.map((row, day) => row.map((value, index) => {
    const level = value ? Math.min(4, Math.max(1, Math.ceil((value / max) * 4))) : 0;
    return <span key={`${day}-${index}`} className="heatmap-cell has-tooltip" data-level={level} data-tooltip={`${value} ${t('transactions')}`} aria-label={`${value} ${t('transactions')}`} />;
  }))}</div><div className="heatmap-axis" style={{ '--heatmap-columns': labels.length }}>{labels.map(label => <small key={label}>{label}</small>)}</div></div>;
}

function ChartGrid({ analysis, t, formatMoney }) {
  const timestamp = value => value instanceof Date ? value.getTime() : new Date(value).getTime();
  const line = (id, title, series, colors, type = 'line') => <div className="chart-card chart-wide" id={id} key={title}><NivoChart options={{ chart: { type }, title: { text: title }, series, colors, noData: { text: t('noData') } }} /></div>;
  const timeline = analysis.timeline.map(value => [timestamp(value.date), value.purchase]);
  const sales = analysis.timeline.map(value => [timestamp(value.date), value.sale]);
  return <div className="chart-grid tab-panel active">
    {line('monthly-activity-chart', t('timeline'), [{ name: t('purchases'), data: timeline }, { name: t('sales'), data: sales }], ['#a684ff', '#67c1f5'], 'area')}
    {line('cumulative-profit-chart', t('cumulative'), [{ name: t('net'), data: analysis.cumulativeProfit.map(value => [timestamp(value.date), value.cumulativeProfit]) }], ['#57e6a5'])}
    <div className="chart-card" id="monthly-roi-chart"><NivoChart options={{ chart: { type: 'line' }, title: { text: t('roi') }, series: [{ name: 'ROI', data: analysis.monthlyRoi.map(value => [timestamp(value.date), value.roi]) }], colors: ['#a684ff'] }} /></div>
    <div className="chart-card" id="type-pie-chart"><NivoChart options={{ chart: { type: 'donut' }, title: { text: t('types') }, series: [analysis.typeCounts.purchase, analysis.typeCounts.sale], labels: [t('purchases'), t('sales')], colors: ['#a684ff', '#67c1f5'] }} /></div>
    <div className="chart-card" id="roi-profit-chart"><NivoChart options={{ chart: { type: 'bar' }, plotOptions: { bar: { horizontal: true } }, title: { text: t('profit') }, xaxis: { categories: analysis.profitAnalysis.filter(item => item.net > 0).slice(0, 6).map(item => item.name), }, series: [{ name: t('net'), data: analysis.profitAnalysis.filter(item => item.net > 0).slice(0, 6).map(item => item.net) }], colors: ['#57e6a5'] }} /></div>
    <div className="chart-card" id="roi-loss-chart"><NivoChart options={{ chart: { type: 'bar' }, plotOptions: { bar: { horizontal: true } }, title: { text: t('profit') }, xaxis: { categories: analysis.profitAnalysis.filter(item => item.net < 0).slice(0, 6).map(item => item.name), }, series: [{ name: t('net'), data: analysis.profitAnalysis.filter(item => item.net < 0).slice(0, 6).map(item => item.net) }], colors: ['#ff718d'] }} /></div>
    <div className="chart-card chart-wide" id="game-comparison-chart"><NivoChart options={{ chart: { type: 'bar' }, plotOptions: { bar: { horizontal: true } }, title: { text: t('comparison') }, xaxis: { categories: analysis.gameComparison.slice().sort((left, right) => (right.spent + right.earned) - (left.spent + left.earned)).slice(0, 12).map(item => item.name) }, series: [{ name: t('comparisonSpent'), data: analysis.gameComparison.slice().sort((left, right) => (right.spent + right.earned) - (left.spent + left.earned)).slice(0, 12).map(item => item.spent) }, { name: t('comparisonEarned'), data: analysis.gameComparison.slice().sort((left, right) => (right.spent + right.earned) - (left.spent + left.earned)).slice(0, 12).map(item => item.earned) }, { name: t('comparisonCashflow'), data: analysis.gameComparison.slice().sort((left, right) => (right.spent + right.earned) - (left.spent + left.earned)).slice(0, 12).map(item => item.cashflow) }], colors: ['#a684ff', '#67c1f5', '#57e6a5'] }} /></div>
  </div>;
}

function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('language') === 'en' ? 'en' : 'tr');
  const t = useCallback(key => copy[lang][key] || key, [lang]);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [rows, setRows] = useState([]);
  const [fileNames, setFileNames] = useState([]);
  const [demo, setDemo] = useState(false);
  const [invalidDateCount, setInvalidDateCount] = useState(0);
  const [duplicatesRemoved, setDuplicatesRemoved] = useState(0);
  const [currency, setCurrency] = useState(() => currencies.includes(localStorage.getItem('currency')) ? localStorage.getItem('currency') : 'USD');
  const [sourceCurrency, setSourceCurrency] = useState(() => currencies.includes(localStorage.getItem('sourceCurrency')) ? localStorage.getItem('sourceCurrency') : 'USD');
  const [rates, setRates] = useState({});
  const [rateState, setRateState] = useState('loading');
  const [applyFees, setApplyFees] = useState(() => localStorage.getItem('applyFees') !== 'false');
  const [feeRate, setFeeRate] = useState(() => Math.min(40, Math.max(0, Number(localStorage.getItem('feeRate') || 15))));
  const [game, setGame] = useState('');
  const [item, setItem] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [tab, setTab] = useState('overview-panel');
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(null);
  const [modal, setModal] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [exporting, setExporting] = useState(false);
  const fileInput = useRef(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('language', lang);
    localStorage.setItem('theme', theme);
    document.title = lang === 'tr' ? 'MarketMemento — Steam Market Geçmişi Analizi' : 'MarketMemento — Steam Market History Analysis';
    document.querySelector('meta[name="description"]')?.setAttribute('content', lang === 'tr'
      ? 'Steam Topluluk Pazarı CSV geçmişinizi tarayıcıda analiz edin. Alış, satış, FIFO kâr, oyun ve aktivite grafiklerini güvenli biçimde inceleyin.'
      : 'Analyze your Steam Community Market CSV history in the browser with purchase, sale, FIFO profit, game and activity charts.');
  }, [lang, theme]);

  useEffect(() => {
    readDataset().then(payload => {
      if (!payload?.data?.length) return;
      const validation = validateRows(payload.data);
      if (validation.rows?.length) {
        const deduped = deduplicateRows(validation.rows);
        setRows(deduped.rows); setFileNames(payload.fileNames || []); setInvalidDateCount(payload.invalidDateCount || validation.invalidDateCount); setDuplicatesRemoved(payload.duplicatesRemoved || deduped.duplicates);
      }
    });
    const handler = event => { event.preventDefault(); setInstallPrompt(event); };
    window.addEventListener('beforeinstallprompt', handler);
    if ('serviceWorker' in navigator) {
      let reloadedForServiceWorker = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloadedForServiceWorker) return;
        reloadedForServiceWorker = true;
        window.location.reload();
      });
      navigator.serviceWorker.register(`sw.js?v=${import.meta.env.VITE_BUILD_VERSION || '13'}`).catch(() => {});
    }
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const sourceCurrencies = useMemo(() => [...new Set(rows.map(row => row._currency).filter(value => currencies.includes(value)))], [rows]);
  const refreshRates = useCallback(async () => {
    const sources = [...new Set([...sourceCurrencies, sourceCurrency])].filter(value => currencies.includes(value) && value !== currency);
    const next = { [currency]: 1 };
    let cached = true;
    setRateState('loading');
    await Promise.all(sources.map(async source => {
      const stored = readCachedRate(source, currency);
      if (stored) { next[source] = Number(stored.rate); return; }
      cached = false;
      try {
        const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${source}&symbols=${currency}`);
        const payload = await response.json();
        if (Number(payload.rates?.[currency]) > 0) {
          next[source] = Number(payload.rates[currency]); saveCachedRate(source, currency, next[source], payload.date);
        }
      } catch {
        // Missing rates are shown as unconverted values.
      }
    }));
    setRates(next); setRateState(sources.every(source => Number(next[source]) > 0) ? cached ? 'cached' : 'live' : 'error');
  }, [currency, sourceCurrency, sourceCurrencies]);
  useEffect(() => { refreshRates(); }, [refreshRates]);

  const converted = useMemo(() => convertRows(rows, currency, rates, sourceCurrency), [rows, currency, rates, sourceCurrency]);
  const presetRange = useMemo(() => {
    if (!datePreset) return { from: '', to: '' };
    const end = new Date();
    const start = new Date(end);
    if (datePreset === '30') start.setDate(start.getDate() - 30);
    if (datePreset === '90') start.setDate(start.getDate() - 90);
    if (datePreset === 'ytd') start.setMonth(0, 1);
    return { from: start.toISOString().slice(0, 7), to: end.toISOString().slice(0, 7) };
  }, [datePreset]);
  const effectiveFrom = presetRange.from || from;
  const effectiveTo = presetRange.to || to;
  const filtered = useMemo(() => converted.filter(row => {
    const matchesGame = !game || row['Game Name'] === game;
    const matchesItem = !item || row['Market Name'].toLocaleLowerCase(lang).includes(item.toLocaleLowerCase(lang));
    const matchesType = !type || row._type === type;
    const matchesSource = !sourceFilter || row._currency === sourceFilter;
    const month = row._date ? row._date.slice(0, 7) : '';
    return matchesGame && matchesItem && matchesType && matchesSource && (!effectiveFrom || month >= effectiveFrom) && (!effectiveTo || month <= effectiveTo);
  }), [converted, game, item, type, sourceFilter, effectiveFrom, effectiveTo, lang]);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [marketPrices, setMarketPrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesStatus, setPricesStatus] = useState('');
  const refreshMarketPrices = useCallback(async () => {
    if (!analysis?.inventory?.length) return;
    setPricesLoading(true);
    setPricesStatus(t('pricesLoading'));
    const result = await fetchInventoryPrices(analysis.inventory, currency);
    setMarketPrices(result.prices);
    setPricesStatus(result.failed ? t('pricesFallback') : t('pricesDone'));
    setPricesLoading(false);
  }, [analysis, currency, t]);
  useEffect(() => {
    let active = true;
    if (!filtered.length) { setAnalysis(null); return () => { active = false; }; }
    setAnalysisLoading(true);
    analyseInWorker(filtered, { applyFees, feeRate, marketPrices })
      .then(result => { if (active) setAnalysis(reviveAnalysisDates(result)); })
      .catch(error => { console.error(error); if (active) setAnalysis(analyse(filtered, { applyFees, feeRate })); })
      .finally(() => { if (active) setAnalysisLoading(false); });
    return () => { active = false; };
  }, [filtered, applyFees, feeRate, marketPrices]);
  const games = useMemo(() => [...new Set(rows.map(row => row['Game Name']).filter(Boolean))].sort((a, b) => a.localeCompare(b, lang)), [rows, lang]);
  const months = useMemo(() => rows.map(row => row._date).filter(Boolean).map(value => value.slice(0, 7)).sort(), [rows]);
  const formatMoney = useCallback(value => money(value, currency, lang), [currency, lang]);

  const persist = useCallback(async (nextRows, nextFiles, isDemo = false, metadata = {}) => {
    await writeDataset({
      data: nextRows,
      fileNames: nextFiles,
      invalidDateCount: metadata.invalidDateCount ?? invalidDateCount,
      duplicatesRemoved: metadata.duplicatesRemoved ?? duplicatesRemoved
    }, isDemo);
  }, [invalidDateCount, duplicatesRemoved]);
  const importFiles = useCallback(async files => {
    const list = [...files];
    if (!list.length) return;
    if (list.some(file => !file.name.toLowerCase().endsWith('.csv'))) { setStatus(t('csvOnly')); return; }
    setStatus(t('reading'));
    const results = await Promise.allSettled(list.map(file => parseCsvFileInWorker(file).catch(() => parseCsvFile(file))));
    const successful = results.filter(result => result.status === 'fulfilled').map(result => result.value);
    const failedResults = results.map((result, index) => ({ result, name: list[index]?.name || 'unknown.csv' })).filter(entry => entry.result.status === 'rejected');
    const failed = failedResults.length;
    const incoming = successful.flatMap(result => result.rows);
    if (!incoming.length) { setStatus(t('noRows')); return; }
    const deduped = deduplicateRows([...rows, ...incoming]);
    setPending({ incoming, deduped, files: successful.map(result => result.name), failedFiles: failedResults.map(entry => entry.name), invalidDateCount: successful.reduce((sum, result) => sum + result.invalidDateCount, 0), failed });
    setStatus('');
  }, [rows, t]);
  const confirmImport = useCallback(async () => {
    if (!pending) return;
    const names = [...fileNames, ...pending.files];
    setRows(pending.deduped.rows); setFileNames(names); setDemo(false); setInvalidDateCount(pending.invalidDateCount); setDuplicatesRemoved(pending.deduped.duplicates);
    await persist(pending.deduped.rows, names, false, {
      invalidDateCount: pending.invalidDateCount,
      duplicatesRemoved: pending.deduped.duplicates
    }); setPending(null);
  }, [fileNames, pending, persist]);
  const loadDemo = () => { const data = demoRows(); setRows(data); setFileNames(['demo']); setDemo(true); setInvalidDateCount(0); setDuplicatesRemoved(0); setStatus(''); };
  const reset = async () => { await clearDataset(); setRows([]); setFileNames([]); setDemo(false); setGame(''); setItem(''); setFrom(''); setTo(''); setType(''); setSourceFilter(''); setDatePreset(''); setStatus(''); };
  const updateCurrency = value => { setCurrency(value); localStorage.setItem('currency', value); };
  const updateSource = value => { setSourceCurrency(value); localStorage.setItem('sourceCurrency', value); };
  const toggleFees = value => { setApplyFees(value); localStorage.setItem('applyFees', String(value)); };

  const doExport = async format => {
    const target = document.getElementById('dashboard');
    if (!target) return;
    setExporting(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(target, { scale: 2, backgroundColor: theme === 'light' ? '#edf6fb' : '#071016', useCORS: true });
      const date = new Date().toISOString().slice(0, 10);
      if (format === 'png') {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('PNG encoding failed');
        const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `marketmemento-report-${date}.png`; anchor.click(); URL.revokeObjectURL(url);
      } else {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const width = pdf.internal.pageSize.getWidth() - 16;
        const pageHeight = pdf.internal.pageSize.getHeight() - 16;
        const renderedHeight = canvas.height * width / canvas.width;
        const pageCount = Math.max(1, Math.ceil(renderedHeight / pageHeight));
        for (let page = 0; page < pageCount; page += 1) {
          if (page > 0) pdf.addPage();
          const offset = page * pageHeight;
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 8, 8 - offset, width, renderedHeight);
        }
        pdf.save(`marketmemento-report-${date}.pdf`);
      }
    } catch (error) { console.error(error); setStatus(t('exportError')); }
    finally { setExporting(false); }
  };

  return <><div className="ambient" aria-hidden="true"><span className="orb orb-blue" /><span className="orb orb-violet" /><span className="orb orb-green" /><span className="grid-overlay" /></div>
    <main className="site-shell">
      <header className="topbar glass-panel"><a className="brand" href="#" onClick={event => { event.preventDefault(); reset(); }}><span className="brand-mark"><img src="icon.svg" alt="" /></span><span><strong>Market<span>Memento</span></strong><small>{t('subtitle')}</small></span></a>
        <div className="topbar-actions"><div className="language-switch"><button type="button" className={lang === 'tr' ? 'active' : ''} aria-pressed={lang === 'tr'} onClick={() => setLang('tr')}>TR</button><button type="button" className={lang === 'en' ? 'active' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button></div>
          <button type="button" className="icon-button" onClick={() => setModal('info')} aria-label={t('info')}><i className="bi bi-info-circle" /></button><button type="button" className="icon-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={t('theme')}><i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'}`} /></button>
          <a className="icon-button github-link" href="https://github.com/salvetum/MarketMemento" target="_blank" rel="noreferrer" aria-label={t('github')}><i className="bi bi-github" /></a></div>
      </header>
      {!rows.length ? <section className="onboarding"><div className="hero-copy"><span className="eyebrow"><i className="bi bi-stars" /> {t('guide')}</span><h1>{t('hero')}<br /><span>{t('heroAccent')}</span></h1><p>{t('heroText')}</p><div className="hero-points"><span><i className="bi bi-check2-circle" /> {t('privacy')}</span><span><i className="bi bi-check2-circle" /> {t('login')}</span><span><i className="bi bi-check2-circle" /> {t('fast')}</span></div></div>
        <div className="upload-card glass-panel"><div className="card-kicker"><span className="step-index">01</span>{t('upload')}</div><label className="drop-zone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); importFiles(event.dataTransfer.files); }}><input ref={fileInput} type="file" accept=".csv,text/csv" multiple hidden onChange={event => importFiles(event.target.files)} /><span className="upload-icon"><i className="bi bi-cloud-arrow-up" /></span><strong>{t('drop')}</strong><small>{t('oneOrMore')}</small><span className="primary-button" onClick={() => fileInput.current?.click()}><i className="bi bi-folder2-open" /> {t('choose')}</span></label>{status ? <div className="upload-status error" role="status">{status}</div> : null}<button type="button" className="text-button" onClick={loadDemo}><i className="bi bi-play-circle" /> {t('demo')}</button></div>
        <div className="csv-guide glass-panel"><div className="guide-heading"><div><span className="card-kicker"><span className="step-index">02</span>{t('guide')}</span><h2>{t('guideTitle')}</h2></div><i className="bi bi-compass guide-icon" /></div><div className="guide-steps"><article className="guide-step"><span>1</span><div><h3>{t('installHelper')}</h3><p>{t('installHelperText')}</p><a className="guide-link" href="https://chromewebstore.google.com/detail/steam-inventory-helper/cmeakgjggjdlcpncigglobpjbkabhmjl" target="_blank" rel="noreferrer">{t('openStore')} <i className="bi bi-arrow-up-right" /></a></div></article><article className="guide-step"><span>2</span><div><h3>Steam Community Market</h3><p>{t('marketText')}</p><a className="guide-link" href="https://steamcommunity.com/market/#myhistory" target="_blank" rel="noreferrer">{t('openMarket')} <i className="bi bi-arrow-up-right" /></a></div></article><article className="guide-step"><span>3</span><div><h3>{t('exportCsv')}</h3><p>{t('exportCsvText')}</p></div></article></div></div>
      </section> : <section id="dashboard" className={`dashboard ${exporting ? 'exporting' : ''}`}><div className="dashboard-header glass-panel"><div><span className="eyebrow"><i className="bi bi-activity" /> {t('dashboard')}</span><h1>{t('dashboard')}</h1><p>{demo ? `${t('demoData')} ·` : fileNames.join(', ')} {filtered.length.toLocaleString(lang)} {t('records')}</p></div><div className="dashboard-tools"><div className="dashboard-actions"><label className="secondary-button action-label"><input type="file" accept=".csv,text/csv" multiple hidden onChange={event => importFiles(event.target.files)} /><i className="bi bi-file-earmark-plus" /> {t('add')}</label>            <label className="quick-currency"><i className="bi bi-currency-exchange" /><StyledSelect value={currency} onChange={updateCurrency} ariaLabel={t('currency')} className="quick-currency-select" options={currencyOptions.map(value => ({ value, label: value }))} /></label><button className="secondary-button" type="button" onClick={() => setModal('settings')}><i className="bi bi-sliders" /> {t('settings')}</button>{installPrompt ? <button type="button" className="secondary-button" onClick={async () => { await installPrompt.prompt(); setInstallPrompt(null); }}><i className="bi bi-download" /> {t('install')}</button> : null}<button type="button" className="secondary-button" onClick={() => doExport('png')} disabled={exporting}><i className="bi bi-image" /> PNG</button><button type="button" className="secondary-button" onClick={() => doExport('pdf')} disabled={exporting}><i className="bi bi-file-earmark-pdf" /> PDF</button><button type="button" className="secondary-button" onClick={reset}><i className="bi bi-arrow-counterclockwise" /> {t('newFile')}</button></div><small className="export-hint">{t('exportHint')}</small></div></div>
        {status ? <div className="dashboard-status error" role="status">{status}</div> : null}<div id="import-report" className="import-report glass-panel" hidden={!invalidDateCount && !duplicatesRemoved}><div className="import-stat import-stat-warning"><i className="bi bi-calendar-x" /><span><strong>{invalidDateCount}</strong><small>{t('invalid')}</small></span></div><div className="import-stat"><i className="bi bi-copy" /><span><strong>{duplicatesRemoved}</strong><small>{t('duplicates')}</small></span></div></div><div className="filter-bar glass-panel"><label><span>{t('game')}</span><select className="form-select" value={game} onChange={event => setGame(event.target.value)}><option value="">{t('all')}</option>{games.map(value => <option key={value}>{value}</option>)}</select></label><label><span>{t('item')}</span><input className="form-control" value={item} placeholder={t('item')} onChange={event => setItem(event.target.value)} /></label><label><span>{t('type')}</span><select className="form-select" value={type} onChange={event => setType(event.target.value)}><option value="">{t('allTypes')}</option><option value="purchase">{t('purchaseType')}</option><option value="sale">{t('saleType')}</option></select></label><label><span>{t('sourceCurrencyLabel')}</span><select className="form-select" value={sourceFilter} onChange={event => setSourceFilter(event.target.value)}><option value="">{t('allTypes')}</option>{currencies.map(value => <option key={value}>{value}</option>)}</select></label><label><span>{t('preset')}</span><select className="form-select" value={datePreset} onChange={event => setDatePreset(event.target.value)}><option value="">{t('allTime')}</option><option value="30">{t('last30')}</option><option value="90">{t('last90')}</option><option value="ytd">{t('yearToDate')}</option></select></label><label><span>{t('from')}</span><input type="month" className="form-control" min={months[0]} max={months.at(-1)} value={from} disabled={Boolean(datePreset)} onChange={event => setFrom(event.target.value)} /></label><label><span>{t('to')}</span><input type="month" className="form-control" min={months[0]} max={months.at(-1)} value={to} disabled={Boolean(datePreset)} onChange={event => setTo(event.target.value)} /></label><button type="button" className="secondary-button" onClick={() => { setGame(''); setItem(''); setFrom(''); setTo(''); setType(''); setSourceFilter(''); setDatePreset(''); }}>{t('clear')}</button></div>
        <div className="analytics-panel glass-panel">{analysisLoading ? <div className="dashboard-status" role="status">{t('reading')}</div> : null}{analysis?.inventory?.length ? <div className="inventory-live-tools"><button type="button" className="secondary-button" onClick={refreshMarketPrices} disabled={pricesLoading}><i className="bi bi-cloud-download" /> {t('refreshPrices')}</button>{pricesStatus ? <span role="status">{pricesStatus}</span> : null}</div> : null}<div className="summary-grid" id="summary-cards">{analysis ? [{ label: t('realised'), value: formatMoney(analysis.summary.realisedProfit), help: t('realisedHelp'), icon: 'bi-graph-up-arrow', tone: analysis.summary.realisedProfit >= 0 ? 'positive' : 'negative' }, { label: t('sold'), value: formatMoney(analysis.summary.totalSold), help: t('soldHelp'), icon: 'bi-arrow-up-right-circle' }, { label: t('bought'), value: formatMoney(analysis.summary.totalPurchased), help: t('boughtHelp'), icon: 'bi-arrow-down-left-circle' }, { label: t('fees'), value: formatMoney(analysis.summary.totalFees), help: t('feesHelp'), icon: 'bi-percent' }, { label: t('inventory'), value: analysis.summary.remainingQuantity.toLocaleString(lang), help: t('inventoryHelp'), icon: 'bi-box-seam' }, { label: t('inventoryCost'), value: formatMoney(analysis.summary.remainingCost), help: t('inventoryCostHelp'), icon: 'bi-wallet2' }, { label: t('inventoryValue'), value: formatMoney(analysis.summary.remainingValue), help: t('inventoryValueHelp'), icon: 'bi-bar-chart-line' }, { label: t('unrealised'), value: formatMoney(analysis.summary.unrealisedProfit), help: t('unrealisedHelp'), icon: 'bi-graph-up', tone: analysis.summary.unrealisedProfit >= 0 ? 'positive' : 'negative' }, { label: t('unrealisedRoi'), value: `${analysis.summary.unrealisedRoi.toFixed(2)}%`, help: t('unrealisedRoiHelp'), icon: 'bi-percent' }, { label: t('holdingDays'), value: `${analysis.summary.averageHoldingDays.toFixed(0)} ${lang === 'tr' ? 'gün' : 'days'}`, help: t('holdingDaysHelp'), icon: 'bi-hourglass-split' }, { label: t('transactions'), value: analysis.summary.transactions.toLocaleString(lang), help: t('transactionsHelp'), icon: 'bi-receipt' }].map((card, index) => <article className={`stat-card has-tooltip ${card.tone || ''}`} data-tooltip={`${card.label}: ${card.value} — ${card.help}`} style={{ '--card-index': index }} key={card.label}><div className="stat-top"><span className="stat-label">{card.label}</span><span className="stat-icon"><i className={`bi ${card.icon}`} /></span></div><strong className="stat-value">{card.value}</strong></article>) : null}</div>
          <div className="tab-bar" role="tablist">{[['overview-panel', 'overview'], ['games-panel', 'games'], ['profit-panel', 'profit'], ['activity-panel', 'activity']].map(([id, label]) => <button key={id} id={`${id}-tab`} type="button" className={`tab-button ${tab === id ? 'active' : ''}`} role="tab" aria-controls={id} aria-selected={tab === id} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)}>{t(label)}</button>)}</div>
          {analysis && tab === 'overview-panel' ? <ChartGrid analysis={analysis} t={t} formatMoney={formatMoney} /> : null}
          {analysis && tab === 'games-panel' ? <DataTable id="game-stats-table" title={t('gameTable')} rows={analysis.gameStats} t={t} columns={[{ key: 'game', label: t('game'), value: row => row.game }, { key: 'transactions', label: t('transactions'), value: row => row.transactions }, { key: 'spent', label: t('bought'), value: row => row.spent, format: formatMoney }, { key: 'earned', label: t('sold'), value: row => row.earned, format: formatMoney }, { key: 'cashflow', label: t('cashflow'), value: row => row.cashflow, format: formatMoney, tone: true }]} /> : null}
          {analysis && tab === 'profit-panel' ? <><div className="method-note"><i className="bi bi-info-circle" /> {t('valuation')} · {t('fifoNote')}</div><DataTable id="profit-analysis-table" title={t('profitTable')} rows={analysis.profitAnalysis} t={t} columns={[{ key: 'game', label: t('game'), value: row => row.game }, { key: 'name', label: t('item'), value: row => row.name }, { key: 'matched', label: t('matched'), value: row => row.matched }, { key: 'avgBuy', label: t('avgBuy'), value: row => row.avgBuy, format: formatMoney }, { key: 'avgSell', label: t('avgSale'), value: row => row.avgSell, format: formatMoney }, { key: 'roi', label: 'ROI', value: row => row.roi, format: value => `${value.toFixed(2)}%`, tone: true }, { key: 'net', label: t('net'), value: row => row.net, format: formatMoney, tone: true }]} /><DataTable id="inventory-table" title={t('inventoryTable')} rows={analysis.inventory} t={t} columns={[{ key: 'game', label: t('game'), value: row => row.game }, { key: 'name', label: t('item'), value: row => row.name }, { key: 'quantity', label: t('quantity'), value: row => row.quantity }, { key: 'cost', label: t('inventoryCost'), value: row => row.cost, format: formatMoney }, { key: 'marketValue', label: t('inventoryValue'), value: row => row.marketValue, format: formatMoney }, { key: 'unrealisedProfit', label: t('unrealised'), value: row => row.unrealisedProfit, format: formatMoney, tone: true }, { key: 'unrealisedRoi', label: t('unrealisedRoi'), value: row => row.unrealisedRoi, format: value => `${value.toFixed(2)}%`, tone: true }, { key: 'averageHoldingDays', label: t('holdingDays'), value: row => row.averageHoldingDays, format: value => `${value.toFixed(0)} ${lang === 'tr' ? 'gün' : 'days'}` }]} /></> : null}
          {analysis && tab === 'activity-panel' ? <div className="activity-grid tab-panel active"><div className="activity-card"><div className="section-heading"><h2>{t('heatmap')}</h2></div><div id="activity-heatmap"><Heatmap analysis={analysis} t={t} /></div></div><div className="activity-card" id="year-comparison-chart"><NivoChart options={{ chart: { type: 'bar' }, legendPosition: 'bottom', title: { text: t('year') }, xaxis: { categories: Array.from({ length: 12 }, (_, index) => String(index + 1)) }, series: analysis.yearSeries.map(series => ({ name: series.name, data: series.data })), colors: ['#a684ff', '#67c1f5', '#57e6a5', '#ffb45f', '#ff718d'] }} /></div></div> : null}
        </div>
      </section>}
      <footer><span>MarketMemento <small className="footer-signature">~ salvetum</small></span><span>{t('privacy')}</span></footer>
    </main>
    {pending ? <Modal title={t('preview')} closeLabel={t('close')} onClose={() => setPending(null)}><div className="preview-dashboard"><div className="preview-summary"><div className="preview-summary-card"><i className="bi bi-file-earmark-spreadsheet" /><strong>{pending.files.length}</strong><span>{t('files')}</span></div><div className="preview-summary-card preview-summary-card-success"><i className="bi bi-check2-circle" /><strong>{pending.deduped.rows.length.toLocaleString(lang)}</strong><span>{t('accepted')}</span></div><div className="preview-summary-card"><i className="bi bi-copy" /><strong>{pending.deduped.duplicates}</strong><span>{t('duplicates')}</span></div><div className={`preview-summary-card ${pending.invalidDateCount ? 'preview-summary-card-warning' : ''}`}><i className="bi bi-calendar-x" /><strong>{pending.invalidDateCount}</strong><span>{t('invalid')}</span></div></div><div className="preview-quality-panel"><div><span className="mini-kicker">{t('quality')}</span><strong>{pending.failed ? `${pending.failed} ${t('failed')}` : t('noFailed')}</strong></div><div className="preview-quality-meter"><span style={{ width: `${Math.max(8, Math.min(100, (pending.deduped.rows.length / Math.max(1, pending.deduped.rows.length + pending.failed)) * 100))}%` }} /></div></div>{pending.failedFiles.length ? <div className="upload-status error preview-failed-list" role="alert"><strong>{t('failedFiles')}</strong><ul>{pending.failedFiles.map(file => <li key={file}>{file}</li>)}</ul></div> : <div className="preview-clean-state"><i className="bi bi-shield-check" /> {t('noFailed')}</div>}<div className="import-preview-actions"><button className="secondary-button" type="button" onClick={() => setPending(null)}>{t('cancel')}</button><button className="primary-button" type="button" onClick={confirmImport}>{t('confirm')}</button></div></div></Modal> : null}
    {modal === 'info' ? <Modal title={t('info')} closeLabel={t('close')} onClose={() => setModal(null)}><p>{t('infoPrivacy')}</p><p>{t('infoAccuracy')}</p><p>{t('infoProject')}</p><p>{t('infoAffiliation')}</p><section className="tech-section" aria-labelledby="tech-title"><div className="tech-heading"><div><span className="mini-kicker">{t('techKicker')}</span><h3 id="tech-title">{t('techTitle')}</h3></div><a className="tech-license-link" href="https://github.com/salvetum/MarketMemento/blob/main/vendor/THIRD_PARTY_NOTICES.md" target="_blank" rel="noreferrer">{t('techLicenses')} <i className="bi bi-arrow-up-right" aria-hidden="true" /></a></div><div className="tech-grid"><a className="tech-item" href="https://react.dev/" target="_blank" rel="noreferrer"><i className="bi bi-braces" aria-hidden="true" /><span><strong>React + Vite</strong><small>{t('techReact')}</small></span><i className="bi bi-arrow-up-right tech-arrow" aria-hidden="true" /></a><a className="tech-item" href="https://nivo.rocks/" target="_blank" rel="noreferrer"><i className="bi bi-bar-chart-line" aria-hidden="true" /><span><strong>Nivo</strong><small>{t('techNivo')}</small></span><i className="bi bi-arrow-up-right tech-arrow" aria-hidden="true" /></a><a className="tech-item" href="https://www.papaparse.com/" target="_blank" rel="noreferrer"><i className="bi bi-filetype-csv" aria-hidden="true" /><span><strong>Papa Parse</strong><small>{t('techPapa')}</small></span><i className="bi bi-arrow-up-right tech-arrow" aria-hidden="true" /></a><a className="tech-item" href="https://github.com/parallax/jsPDF" target="_blank" rel="noreferrer"><i className="bi bi-file-earmark-arrow-down" aria-hidden="true" /><span><strong>html2canvas + jsPDF</strong><small>{t('techExport')}</small></span><i className="bi bi-arrow-up-right tech-arrow" aria-hidden="true" /></a><a className="tech-item" href="https://frankfurter.dev/" target="_blank" rel="noreferrer"><i className="bi bi-currency-exchange" aria-hidden="true" /><span><strong>Frankfurter API</strong><small>{t('techRates')}</small></span><i className="bi bi-arrow-up-right tech-arrow" aria-hidden="true" /></a><a className="tech-item" href="https://developer.mozilla.org/docs/Web/API/IndexedDB_API" target="_blank" rel="noreferrer"><i className="bi bi-device-ssd" aria-hidden="true" /><span><strong>Browser APIs</strong><small>{t('techBrowser')}</small></span><i className="bi bi-arrow-up-right tech-arrow" aria-hidden="true" /></a></div><div className="tech-privacy-note"><i className="bi bi-shield-check" aria-hidden="true" /><p className="mb-0">{t('techPrivacy')}</p></div></section></Modal> : null}
    {modal === 'settings' ? <Modal title={t('settings')} closeLabel={t('close')} onClose={() => setModal(null)}><label className="setting-row"><span><strong>{t('source')}</strong><small>{lang === 'tr' ? 'Para birimi belirtilmeyen satırlarda kullanılır.' : 'Used for rows without a currency marker.'}</small></span><select className="form-select setting-control" value={sourceCurrency} onChange={event => updateSource(event.target.value)}>{currencyOptions.map(value => <option key={value}>{value}</option>)}</select></label><label className="setting-row"><span><strong>{t('currency')}</strong><small>{rateState === 'loading' ? (lang === 'tr' ? 'Kurlar alınıyor…' : 'Fetching rates…') : rateState === 'error' ? (lang === 'tr' ? 'Bazı kurlar alınamadı.' : 'Some rates unavailable.') : (lang === 'tr' ? 'Referans kurlar yüklendi.' : 'Reference rates loaded.')}</small></span><select className="form-select setting-control" value={currency} onChange={event => updateCurrency(event.target.value)}>{currencyOptions.map(value => <option key={value}>{value}</option>)}</select></label><label className="setting-row"><span><strong>{t('fee')}</strong><small>{t('feeText')}</small></span><input type="checkbox" checked={applyFees} onChange={event => toggleFees(event.target.checked)} /></label><label className="setting-row"><span><strong>{t('rate')}</strong></span><input className="form-control setting-control" type="number" min="0" max="40" step="0.1" disabled={!applyFees} value={feeRate} onChange={event => { const value = Math.min(40, Math.max(0, Number(event.target.value))); setFeeRate(value); localStorage.setItem('feeRate', String(value)); }} /></label></Modal> : null}
    {exporting ? <div className="export-overlay"><div className="glass-panel"><span className="spinner-border spinner-border-sm" /> {t('report')}</div></div> : null}
  </>;
}

export default App;
