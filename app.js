if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

function hasSoftwareRenderingRisk() {
    const cores = Number(navigator.hardwareConcurrency || 0);
    const memory = Number(navigator.deviceMemory || 0);
    if ((cores > 0 && cores <= 2) || (memory > 0 && memory <= 2)) return true;

    try {
        const canvas = document.createElement('canvas');
        const options = { failIfMajorPerformanceCaveat: true, powerPreference: 'high-performance' };
        const gl = canvas.getContext('webgl2', options) || canvas.getContext('webgl', options);
        if (!gl) return true;

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = String(debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i.test(renderer);
    } catch (_) {
        return false;
    }
}

function enablePerformanceMode() {
    document.documentElement.classList.add('performance-mode');
}

if (hasSoftwareRenderingRisk()) enablePerformanceMode();

function probeFrameRate() {
    if (document.hidden || document.documentElement.classList.contains('performance-mode') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let startedAt = 0;
    let previousFrame = 0;
    let frames = 0;
    let slowFrames = 0;

    function sample(timestamp) {
        if (!startedAt) startedAt = timestamp;
        if (previousFrame && timestamp - previousFrame > 28) slowFrames += 1;
        previousFrame = timestamp;
        frames += 1;

        const elapsed = timestamp - startedAt;
        if (elapsed < 1800) {
            requestAnimationFrame(sample);
            return;
        }

        const measuredFps = frames * 1000 / Math.max(elapsed, 1);
        if (measuredFps < 42 || (frames > 30 && slowFrames / frames > .3)) enablePerformanceMode();
    }

    requestAnimationFrame(sample);
}

window.addEventListener('load', () => window.setTimeout(probeFrameRate, 1600), { once: true });

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const { normaliseType, priceInCents, convertAmount, parseMarketDate, marketDateHasTime, deduplicateRows, analyseMarketData } = window.MarketMementoCore;

    const translations = {
        tr: {
            brandSubtitle: 'CSV geçmiş görüntüleyici', localBadge: 'Veri cihazında kalır', eyebrow: 'Steam geçmişin, tek ekranda',
            heroTitle: 'Pazar geçmişini<br><span>kolayca incele.</span>',
            heroText: 'Steam Market CSV dosyanı yükle; alış ve satış geçmişini grafikler ve tablolarla incele.',
            pointPrivacy: 'Dosyan cihazından çıkmaz', pointAccount: 'Steam girişi gerekmez', pointFast: 'Hızlı özet',
            uploadKicker: 'Dosyanı aç', dropTitle: 'CSV dosyanı buraya bırak', dropText: 'bir veya birden fazla dosya seçebilirsin',
            chooseFile: 'Dosya seç', browserOnly: 'Tarayıcı içinde işlenir', demoButton: 'Örnek verilerle keşfet',
            guideKicker: 'CSV dosyasını edin', guideTitle: 'Dosyayı nereden bulacağım?',
            guideStep1Title: "Steam Inventory Helper'ı kur", guideStep1Text: 'Eklentiyi yalnızca resmi Chrome Web Mağazası sayfasından yükle.',
            extensionLink: "Chrome Web Mağazası'nı aç", guideStep2Title: "Steam Topluluk Pazarı'nı aç",
            guideStep2Text: 'Tarayıcıdan Steam’e giriş yap ve “Pazar Geçmişim” bölümüne git.', marketLink: "Pazar Geçmişim'i aç",
            guideStep3Title: "Export .CSV file'a tıkla", guideStep3Text: 'Eklentinin eklediği dışa aktarma düğmesiyle geçmişini indir, sonra dosyayı yukarıya bırak.',
            securityTitle: 'Üçüncü taraf eklenti uyarısı',
            securityText: "Steam Inventory Helper; Valve, Steam veya MarketMemento'ya ait değildir ve Steam siteleri, sekmeler ya da çerezler için geniş izinler isteyebilir. Kurmadan önce güncel izinleri, geliştiriciyi ve gizlilik politikasını incele. Yalnızca resmi mağaza bağlantısını kullan; şifreni eklenti ekranlarına girme ve istersen CSV'yi aldıktan sonra eklentiyi devre dışı bırak.",
            dashboardEyebrow: 'Dosya özeti', dashboardTitle: 'Pazar geçmişin', newFile: 'Yeni dosya', addFiles: 'CSV ekle', calculationButton: 'Ayarlar', installApp: 'Uygulamayı yükle',
            exportHint: 'PNG ve PDF, açık olan analiz sekmesini raporlar.',
            gameFilter: 'Oyun', allGames: 'Tüm oyunlar', itemFilter: 'Ürün ara', itemPlaceholder: 'Ürün adı...', dateFrom: 'Başlangıç', dateTo: 'Bitiş', clearFilters: 'Filtreleri temizle',
            tabOverview: 'Genel bakış', tabGames: 'Oyunlar', tabProfit: 'Alış / satış', tabActivity: 'Aktivite',
            fifoNote: 'Gerçekleşmiş sonuçlar, satışları en eski eşleşen alışlarla eşleştiren FIFO yaklaşımıyla tahmin edilir.',
            footerText: 'Kişisel bir proje · Veriler yalnızca bu tarayıcıda işlenir.', infoTitle: 'Gizlilik ve hesaplama',
            infoPrivacy: 'Yüklediğiniz CSV herhangi bir sunucuya gönderilmez. Analiz cihazınızda yapılır ve kolaylık için tarayıcı depolamasında tutulur.',
            infoAccuracy: "Sonuçlar CSV'deki tutarlara dayanır. Eksik geçmiş, farklı para birimleri veya Steam ücretlerinin dosyada gösterilme biçimi sonuçları etkileyebilir.",
            infoProject: 'Bu site boş zamanda geliştirilen kişisel bir deneme projesidir.',
            infoAffiliation: 'MarketMemento; Valve, Steam veya Steam Inventory Helper ile bağlantılı değildir.',
            statusReading: 'Dosya okunuyor ve doğrulanıyor…', statusNoFile: 'Lütfen bir CSV dosyası seç.', statusWrongType: 'Yalnızca .csv dosyaları destekleniyor.',
            statusMissingColumns: 'Dosyada gerekli sütunlar bulunamadı:', statusNoRows: 'Analiz edilebilir alış veya satış kaydı bulunamadı.',
            statusParseError: 'CSV okunurken bir sorun oluştu. Dosyanın Steam Inventory Helper dışa aktarımı olduğundan emin ol.',
            statusStorageWarning: 'Özet hazır; ancak veriler tarayıcı hafızasına kaydedilemedi.',
            statusMerged: 'CSV dosyası birleştirildi', statusDuplicates: 'tekrar eden kayıt atlandı', statusFilesFailed: 'dosya okunamadı',
            rows: 'kayıt', filteredRows: 'filtrelenmiş kayıt', demoData: 'Örnek veri', matchedSales: 'eşleşen satış', unmatchedPurchases: 'eşleşmemiş alış', invalidDates: 'kaydın tarihi okunamadı',
            summaryProfit: 'Gerçekleşmiş fark', summarySales: 'Satış hacmi', summaryGrossSales: 'Brüt satış hacmi', summaryPurchases: 'Alış hacmi', summaryFees: 'Tahmini ücret', summaryTransactions: 'İşlem',
            importFiles: 'CSV dosyası', importAccepted: 'kabul edilen kayıt', importDuplicates: 'atlanan tekrar', importInvalidDates: 'okunamayan tarih', importReportLabel: 'İçe aktarma özeti',
            chartTimeline: 'Aylık işlem hareketi', chartTypes: 'Alış / satış dağılımı', chartProfit: 'En kârlı ürünler', chartLoss: 'En zararlı ürünler',
            purchases: 'Alışlar', sales: 'Satışlar', net: 'Net', noData: 'Bu filtre için gösterilecek veri yok.',
            gameTableTitle: 'Oyun özeti', profitTableTitle: 'FIFO alış / satış eşleşmeleri', searchTable: 'Tabloda ara…',
            colGame: 'Oyun', colTransactions: 'İşlem', colSpent: 'Alış', colEarned: 'Satış', colCashflow: 'Nakit akışı',
            colItem: 'Ürün', colMatched: 'Eşleşme', colAvgBuy: 'Ort. alış', colAvgSell: 'Ort. satış', colRoi: 'ROI', colNet: 'Net',
            heatmapKicker: 'Gün ve saat', heatmapKickerMonths: 'Gün ve ay', heatmapTitle: 'Aktivite ısı haritası', heatmapCell: 'işlem', yearComparison: 'Yıllara göre aylık işlemler',
            calculationKicker: 'Görünüm ayarları', calculationTitle: 'Hesaplama tercihleri', sourceCurrencyTitle: 'CSV para birimi', sourceCurrencyText: 'Dosyadaki tutarların ait olduğu para birimini seç.', currencyTitle: 'Görüntüleme para birimi', currencyText: 'Tutarları günlük referans kuruyla dönüştürür; CSV verin gönderilmez.',
            exchangeSame: 'Dönüşüm gerekmiyor.', exchangeLoading: 'Güncel kur alınıyor…', exchangeLive: 'Güncel referans kuru', exchangeCached: 'Son kayıtlı referans kuru', exchangeError: 'Kur alınamadı; tutarlar CSV para biriminde gösteriliyor.',
            feeTitle: 'Ücret tahmini uygula', feeText: 'Satış tutarından belirlediğin oranı düşerek FIFO farkını yeniden hesaplar.', feeRateTitle: 'Tahmini ücret oranı', feeRateText: "CSV tutarının ücreti zaten içerip içermediğini kontrol et.", feeWarning: "Bu seçenek yalnızca tahmindir. Steam'in oyun ve ürün bazlı ücretleri değişebilir.",
            exportPreparing: 'Rapor hazırlanıyor…', exportError: 'Rapor oluşturulamadı. Sayfayı yenileyip tekrar deneyebilirsin.', exportComplete: 'Rapor indirildi.',
            uploadName: 'Yüklenen dosya', multipleFiles: 'CSV dosyası'
        },
        en: {
            brandSubtitle: 'CSV history viewer', localBadge: 'Data stays on your device', eyebrow: 'Your Steam history, in one place',
            heroTitle: 'Explore your market history<br><span>at a glance.</span>',
            heroText: 'Upload your Steam Market CSV and browse your purchase and sale history with simple charts and tables.',
            pointPrivacy: 'Your file stays on your device', pointAccount: 'No Steam login required', pointFast: 'Quick summary',
            uploadKicker: 'Open your file', dropTitle: 'Drop your CSV files here', dropText: 'you can choose one or more files',
            chooseFile: 'Choose file', browserOnly: 'Processed in your browser', demoButton: 'Explore with sample data',
            guideKicker: 'Get the CSV file', guideTitle: 'Where do I find the file?',
            guideStep1Title: 'Install Steam Inventory Helper', guideStep1Text: 'Install the extension only from its official Chrome Web Store page.',
            extensionLink: 'Open Chrome Web Store', guideStep2Title: 'Open Steam Community Market',
            guideStep2Text: 'Sign in to Steam in your browser and go to “My Market History”.', marketLink: 'Open My Market History',
            guideStep3Title: 'Click Export .CSV file', guideStep3Text: 'Download your history using the export button added by the extension, then drop the file above.',
            securityTitle: 'Third-party extension notice',
            securityText: 'Steam Inventory Helper is not owned by Valve, Steam or MarketMemento and may request broad permissions for Steam sites, tabs or cookies. Review its current permissions, publisher and privacy policy before installing. Use only the official store link, never enter your password into an extension screen, and consider disabling it after exporting the CSV.',
            dashboardEyebrow: 'File summary', dashboardTitle: 'Your market history', newFile: 'New file', addFiles: 'Add CSV', calculationButton: 'Settings', installApp: 'Install app',
            exportHint: 'PNG and PDF include the currently open analysis tab.',
            gameFilter: 'Game', allGames: 'All games', itemFilter: 'Find an item', itemPlaceholder: 'Item name...', dateFrom: 'From', dateTo: 'To', clearFilters: 'Clear filters',
            tabOverview: 'Overview', tabGames: 'Games', tabProfit: 'Purchases / sales', tabActivity: 'Activity',
            fifoNote: 'Realized results are estimated with FIFO, matching each sale against the oldest available purchase.',
            footerText: 'A personal project · Your data is processed only in this browser.', infoTitle: 'Privacy and calculations',
            infoPrivacy: 'Your CSV is never sent to a server. Analysis runs on your device and is kept in browser storage for convenience.',
            infoAccuracy: 'Results are based on values in the CSV. Missing history, mixed currencies or the way Steam fees appear in the export can affect the results.',
            infoProject: 'This is a personal side project built for fun.',
            infoAffiliation: 'MarketMemento is not affiliated with Valve, Steam or Steam Inventory Helper.',
            statusReading: 'Reading and validating your file…', statusNoFile: 'Please choose a CSV file.', statusWrongType: 'Only .csv files are supported.',
            statusMissingColumns: 'Required columns are missing:', statusNoRows: 'No usable purchase or sale records were found.',
            statusParseError: 'The CSV could not be read. Make sure it is an export from Steam Inventory Helper.',
            statusStorageWarning: 'The summary is ready, but the data could not be saved in browser storage.',
            statusMerged: 'CSV files merged', statusDuplicates: 'duplicate records skipped', statusFilesFailed: 'files could not be read',
            rows: 'records', filteredRows: 'filtered records', demoData: 'Sample data', matchedSales: 'matched sales', unmatchedPurchases: 'unmatched purchases', invalidDates: 'records have unreadable dates',
            summaryProfit: 'Realized difference', summarySales: 'Sales volume', summaryGrossSales: 'Gross sales volume', summaryPurchases: 'Purchase volume', summaryFees: 'Estimated fees', summaryTransactions: 'Transactions',
            importFiles: 'CSV files', importAccepted: 'accepted records', importDuplicates: 'duplicates skipped', importInvalidDates: 'unreadable dates', importReportLabel: 'Import summary',
            chartTimeline: 'Monthly transaction activity', chartTypes: 'Purchase / sale split', chartProfit: 'Most profitable items', chartLoss: 'Largest item losses',
            purchases: 'Purchases', sales: 'Sales', net: 'Net', noData: 'There is no data to show for this filter.',
            gameTableTitle: 'Game summary', profitTableTitle: 'FIFO purchase / sale matches', searchTable: 'Search table…',
            colGame: 'Game', colTransactions: 'Transactions', colSpent: 'Purchases', colEarned: 'Sales', colCashflow: 'Cash flow',
            colItem: 'Item', colMatched: 'Matched', colAvgBuy: 'Avg. buy', colAvgSell: 'Avg. sale', colRoi: 'ROI', colNet: 'Net',
            heatmapKicker: 'Day and time', heatmapKickerMonths: 'Day and month', heatmapTitle: 'Activity heatmap', heatmapCell: 'transactions', yearComparison: 'Monthly activity by year',
            calculationKicker: 'Display settings', calculationTitle: 'Calculation preferences', sourceCurrencyTitle: 'CSV currency', sourceCurrencyText: 'Choose the currency used by the amounts in the file.', currencyTitle: 'Display currency', currencyText: 'Converts amounts using a daily reference rate; your CSV data is not sent.',
            exchangeSame: 'No conversion is needed.', exchangeLoading: 'Fetching the latest rate…', exchangeLive: 'Current reference rate', exchangeCached: 'Last saved reference rate', exchangeError: 'The rate could not be fetched; amounts are shown in the CSV currency.',
            feeTitle: 'Apply fee estimate', feeText: 'Recalculates the FIFO difference after subtracting your chosen rate from sale values.', feeRateTitle: 'Estimated fee rate', feeRateText: 'Check whether your CSV values already include fees.', feeWarning: 'This option is only an estimate. Steam fees can vary by game and item.',
            exportPreparing: 'Preparing report…', exportError: 'The report could not be created. Refresh the page and try again.', exportComplete: 'Report downloaded.',
            uploadName: 'Uploaded file', multipleFiles: 'CSV files'
        }
    };

    const requiredColumns = ['Market Name', 'Price in Cents', 'Type'];
    const supportedCurrencies = ['USD', 'TRY', 'EUR', 'GBP', 'CNY', 'JPY'];
    const savedCurrency = localStorage.getItem('currency');
    const savedSourceCurrency = localStorage.getItem('sourceCurrency');
    const state = {
        data: [],
        charts: {},
        lang: localStorage.getItem('language') === 'en' ? 'en' : 'tr',
        fileNames: [],
        demo: false,
        invalidDateCount: 0,
        duplicatesRemoved: 0,
        sourceCurrency: supportedCurrencies.includes(savedSourceCurrency) ? savedSourceCurrency : 'USD',
        currency: supportedCurrencies.includes(savedCurrency) ? savedCurrency : 'USD',
        exchangeRate: 1,
        exchangeRateDate: '',
        exchangeRateState: 'loading',
        exchangeRequestId: 0,
        applyFees: localStorage.getItem('applyFees') === null ? true : localStorage.getItem('applyFees') === 'true',
        feeRate: Math.min(40, Math.max(0, Number(localStorage.getItem('feeRate') || 15)))
    };

    const elements = {
        onboarding: document.getElementById('onboarding'),
        dashboard: document.getElementById('dashboard'),
        fileInput: document.getElementById('csv-file-input'),
        mergeFileInput: document.getElementById('merge-file-input'),
        dropZone: document.getElementById('drop-zone'),
        uploadStatus: document.getElementById('upload-status'),
        demoButton: document.getElementById('demo-button'),
        resetButton: document.getElementById('reset-button'),
        dashboardStatus: document.getElementById('dashboard-status'),
        importReport: document.getElementById('import-report'),
        installApp: document.getElementById('install-app'),
        exportPNG: document.getElementById('export-png'),
        exportPDF: document.getElementById('export-pdf'),
        exportOverlay: document.getElementById('export-overlay'),
        sourceCurrencySelect: document.getElementById('source-currency-select'),
        currencySelect: document.getElementById('currency-select'),
        quickCurrencySelect: document.getElementById('quick-currency-select'),
        exchangeRateStatus: document.getElementById('exchange-rate-status'),
        feeToggle: document.getElementById('fee-toggle'),
        feeRate: document.getElementById('fee-rate'),
        themeSwitcher: document.getElementById('theme-switcher'),
        langTR: document.getElementById('lang-tr'),
        langEN: document.getElementById('lang-en'),
        gameFilter: document.getElementById('game-filter'),
        itemFilter: document.getElementById('item-filter'),
        dateFrom: document.getElementById('date-from'),
        dateTo: document.getElementById('date-to'),
        clearFilters: document.getElementById('clear-filters'),
        datasetMeta: document.getElementById('dataset-meta'),
        activityHeatmap: document.getElementById('activity-heatmap'),
        heatmapKicker: document.getElementById('heatmap-kicker'),
        heatmapTooltip: document.getElementById('heatmap-tooltip')
    };

    const t = key => translations[state.lang][key] || key;
    let deferredInstallPrompt = null;

    function setLanguage(lang) {
        state.lang = lang;
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const value = t(element.dataset.i18n);
            if (element.dataset.i18n === 'heroTitle') element.innerHTML = value;
            else element.textContent = value;
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            element.placeholder = t(element.dataset.i18nPlaceholder);
        });
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            element.title = t(element.dataset.i18nTitle);
        });
        elements.langTR.classList.toggle('active', lang === 'tr');
        elements.langTR.setAttribute('aria-pressed', String(lang === 'tr'));
        elements.langEN.classList.toggle('active', lang === 'en');
        elements.langEN.setAttribute('aria-pressed', String(lang === 'en'));
        elements.quickCurrencySelect.setAttribute('aria-label', t('currencyTitle'));
        updateExchangeRateStatus();
        refreshAllGamesLabel();
        if (state.data.length) renderDashboard();
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
        elements.themeSwitcher.innerHTML = theme === 'dark' ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
        const rootStyles = getComputedStyle(document.documentElement);
        Object.values(state.charts).forEach(chart => chart?.updateOptions?.({
            chart: { background: 'transparent', foreColor: rootStyles.getPropertyValue('--muted').trim() },
            grid: { borderColor: rootStyles.getPropertyValue('--line-strong').trim() },
            theme: { mode: theme },
            tooltip: { theme }
        }, false, false));
    }

    function showStatus(message, type = '') {
        elements.uploadStatus.hidden = !message;
        elements.uploadStatus.className = `upload-status ${type}`.trim();
        elements.uploadStatus.textContent = message;
    }

    function showDashboardStatus(message, type = '', timeout = 5200) {
        elements.dashboardStatus.hidden = !message;
        elements.dashboardStatus.className = `dashboard-status ${type}`.trim();
        elements.dashboardStatus.textContent = message;
        window.clearTimeout(showDashboardStatus.timer);
        if (message && timeout) showDashboardStatus.timer = window.setTimeout(() => { elements.dashboardStatus.hidden = true; }, timeout);
    }

    const storage = {
        dbName: 'marketmemento-data',
        storeName: 'datasets',
        async open() {
            if (!('indexedDB' in window)) throw new Error('IndexedDB unavailable');
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, 1);
                request.onupgradeneeded = () => {
                    if (!request.result.objectStoreNames.contains(this.storeName)) request.result.createObjectStore(this.storeName);
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },
        async set(value) {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(this.storeName, 'readwrite');
                transaction.objectStore(this.storeName).put(value, 'current');
                transaction.oncomplete = () => { db.close(); resolve(); };
                transaction.onerror = () => { db.close(); reject(transaction.error); };
            });
        },
        async get() {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(this.storeName, 'readonly');
                const request = transaction.objectStore(this.storeName).get('current');
                request.onsuccess = () => { db.close(); resolve(request.result || null); };
                request.onerror = () => { db.close(); reject(request.error); };
            });
        },
        async clear() {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(this.storeName, 'readwrite');
                transaction.objectStore(this.storeName).delete('current');
                transaction.oncomplete = () => { db.close(); resolve(); };
                transaction.onerror = () => { db.close(); reject(transaction.error); };
            });
        }
    };

    async function persistDataset() {
        if (state.demo) return true;
        const payload = {
            data: state.data,
            fileNames: state.fileNames,
            invalidDateCount: state.invalidDateCount,
            duplicatesRemoved: state.duplicatesRemoved
        };
        try {
            await storage.set(payload);
            localStorage.removeItem('marketData');
            localStorage.removeItem('marketFileName');
            return true;
        } catch (_) {
            try {
                localStorage.setItem('marketData', JSON.stringify(state.data));
                localStorage.setItem('marketFileName', state.fileNames.join(', '));
                return true;
            } catch (_) {
                return false;
            }
        }
    }

    function validateRows(rows, fields = []) {
        const available = fields.length ? fields : Object.keys(rows[0] || {});
        const missing = requiredColumns.filter(column => !available.includes(column));
        if (missing.length) return { error: `${t('statusMissingColumns')} ${missing.join(', ')}` };

        let invalidDateCount = 0;
        const cleaned = rows
            .filter(row => row && typeof row === 'object')
            .map((row, index) => {
                const parsedDate = parseMarketDate(row['Acted On']);
                if (!parsedDate) invalidDateCount += 1;
                return {
                    ...row,
                    'Market Name': String(row['Market Name'] || '').trim(),
                    'Game Name': String(row['Game Name'] || 'Steam Market').trim() || 'Steam Market',
                    _type: normaliseType(row.Type),
                    _price: priceInCents(row),
                    _date: parsedDate?.toISOString() || null,
                    _hasTime: marketDateHasTime(row['Acted On']),
                    _index: index
                };
            })
            .filter(row => row['Market Name'] && row._type && row._price >= 0);

        return cleaned.length ? { rows: cleaned, invalidDateCount } : { error: t('statusNoRows') };
    }

    function parseCSVFile(file) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: 'greedy',
                complete: results => {
                    const validation = validateRows(results.data, results.meta?.fields || []);
                    if (validation.error) reject(new Error(validation.error));
                    else resolve({ ...validation, name: file.name });
                },
                error: () => reject(new Error(t('statusParseError')))
            });
        });
    }

    async function handleFiles(fileList, { merge = false } = {}) {
        const files = [...(fileList || [])].filter(file => file.name.toLowerCase().endsWith('.csv'));
        if (!fileList?.length) return showStatus(t('statusNoFile'), 'error');
        if (!files.length) return showStatus(t('statusWrongType'), 'error');

        showStatus(t('statusReading'), 'loading');
        elements.fileInput.disabled = true;
        elements.mergeFileInput.disabled = true;
        const results = await Promise.allSettled(files.map(parseCSVFile));
        elements.fileInput.disabled = false;
        elements.mergeFileInput.disabled = false;

        const valid = results.filter(result => result.status === 'fulfilled').map(result => result.value);
        const failed = results.length - valid.length;
        if (!valid.length) return showStatus(results[0]?.reason?.message || t('statusParseError'), 'error');

        const incoming = valid.flatMap(result => result.rows);
        const deduped = deduplicateRows(merge ? [...state.data, ...incoming] : incoming);
        const previousDuplicates = merge ? state.duplicatesRemoved : 0;
        const previousNames = merge ? state.fileNames : [];
        state.data = deduped.rows;
        state.invalidDateCount = state.data.filter(row => !row._date).length;
        state.duplicatesRemoved = previousDuplicates + deduped.duplicates;
        state.fileNames = [...new Set([...previousNames, ...valid.map(result => result.name)])];
        state.demo = false;

        const stored = await persistDataset();
        showStatus('');
        openDashboard();
        const details = [
            `${state.fileNames.length.toLocaleString(state.lang)} ${t('multipleFiles')}`,
            deduped.duplicates ? `${deduped.duplicates.toLocaleString(state.lang)} ${t('statusDuplicates')}` : '',
            failed ? `${failed.toLocaleString(state.lang)} ${t('statusFilesFailed')}` : '',
            stored ? '' : t('statusStorageWarning')
        ].filter(Boolean).join(' · ');
        showDashboardStatus(`${t('statusMerged')} · ${details}`, stored && !failed ? 'success' : 'warning');
    }

    function createDemoData() {
        const entries = [
            ['AK-47 | Slate (Field-Tested)', 'Counter-Strike 2', 'purchase', 510, 'Jan 14 2025 09:15'],
            ['AK-47 | Slate (Field-Tested)', 'Counter-Strike 2', 'sale', 735, 'Mar 9 2025 21:40'],
            ['Recoil Case', 'Counter-Strike 2', 'purchase', 72, 'Feb 4 2025 17:10'],
            ['Recoil Case', 'Counter-Strike 2', 'sale', 108, 'Apr 16 2025 18:32'],
            ['Mann Co. Supply Crate Key', 'Team Fortress 2', 'purchase', 229, 'May 2 2025 13:05'],
            ['Mann Co. Supply Crate Key', 'Team Fortress 2', 'sale', 268, 'Jul 18 2025 22:18'],
            ['Exalted Arcana', 'Dota 2', 'purchase', 1820, 'Aug 11 2025 11:48'],
            ['Exalted Arcana', 'Dota 2', 'sale', 1650, 'Oct 23 2025 20:26'],
            ['Dreams & Nightmares Case', 'Counter-Strike 2', 'purchase', 95, 'Nov 8 2025 16:11'],
            ['Dreams & Nightmares Case', 'Counter-Strike 2', 'sale', 144, 'Jan 12 2026 19:54'],
            ['USP-S | Ticket to Hell', 'Counter-Strike 2', 'purchase', 88, 'Feb 7 2026 12:22'],
            ['USP-S | Ticket to Hell', 'Counter-Strike 2', 'sale', 121, 'Mar 19 2026 23:03'],
            ['Sticker Capsule 2', 'Counter-Strike 2', 'purchase', 1160, 'Apr 3 2026 15:37'],
            ['Sticker Capsule 2', 'Counter-Strike 2', 'sale', 1090, 'May 22 2026 20:49']
        ];
        return entries.map((entry, index) => ({
            'Market Name': entry[0], 'Game Name': entry[1], Type: entry[2], 'Price in Cents': String(entry[3]),
            'Acted On': entry[4], _type: entry[2], _price: entry[3], _date: parseMarketDate(entry[4])?.toISOString() || null, _index: index
        }));
    }

    function playImportReportAnimation() {
        window.clearTimeout(playImportReportAnimation.timer);
        elements.importReport.classList.remove('is-entering');
        requestAnimationFrame(() => {
            elements.importReport.classList.add('is-entering');
            playImportReportAnimation.timer = window.setTimeout(() => {
                elements.importReport.classList.remove('is-entering');
            }, 1000);
        });
    }

    function openDashboard({ scrollBehavior = 'smooth' } = {}) {
        populateGameFilter();
        populateDateBounds();
        elements.onboarding.hidden = true;
        elements.dashboard.hidden = false;
        renderDashboard();
        playImportReportAnimation();
        window.scrollTo({ top: 0, left: 0, behavior: scrollBehavior });
    }

    async function resetView() {
        localStorage.removeItem('marketData');
        localStorage.removeItem('marketFileName');
        try { await storage.clear(); } catch (_) { /* Storage may be unavailable in file mode. */ }
        state.data = [];
        state.fileNames = [];
        state.demo = false;
        state.invalidDateCount = 0;
        state.duplicatesRemoved = 0;
        elements.fileInput.value = '';
        elements.mergeFileInput.value = '';
        elements.fileInput.disabled = false;
        elements.itemFilter.value = '';
        elements.gameFilter.value = '';
        elements.dateFrom.value = '';
        elements.dateTo.value = '';
        Object.values(state.charts).forEach(chart => chart?.destroy?.());
        state.charts = {};
        elements.dashboard.hidden = true;
        elements.onboarding.hidden = false;
        showStatus('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function refreshAllGamesLabel() {
        const allOption = elements.gameFilter.querySelector('option[value=""]');
        if (allOption) allOption.textContent = t('allGames');
    }

    function populateGameFilter() {
        const selected = elements.gameFilter.value;
        elements.gameFilter.replaceChildren();
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = t('allGames');
        elements.gameFilter.appendChild(allOption);
        [...new Set(state.data.map(row => row['Game Name']).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, state.lang))
            .forEach(game => {
                const option = document.createElement('option');
                option.value = game;
                option.textContent = game;
                elements.gameFilter.appendChild(option);
            });
        if ([...elements.gameFilter.options].some(option => option.value === selected)) elements.gameFilter.value = selected;
    }

    function populateDateBounds() {
        const months = state.data
            .filter(row => row._date)
            .map(row => {
                const date = new Date(row._date);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            })
            .sort();
        const min = months[0] || '';
        const max = months[months.length - 1] || '';
        [elements.dateFrom, elements.dateTo].forEach(input => {
            input.min = min;
            input.max = max;
        });
    }

    function filteredData() {
        const game = elements.gameFilter.value;
        const query = elements.itemFilter.value.trim().toLocaleLowerCase(state.lang);
        const from = elements.dateFrom.value;
        const to = elements.dateTo.value;
        return state.data.filter(row => {
            const matchesGame = !game || row['Game Name'] === game;
            const matchesItem = !query || row['Market Name'].toLocaleLowerCase(state.lang).includes(query);
            if (!matchesGame || !matchesItem) return false;
            if (!from && !to) return true;
            if (!row._date) return false;
            const date = new Date(row._date);
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return (!from || month >= from) && (!to || month <= to);
        });
    }

    function exchangeCacheKey(base, quote) {
        return `exchangeRate:${base}:${quote}`;
    }

    function readCachedExchangeRate(base, quote) {
        try {
            const cached = JSON.parse(localStorage.getItem(exchangeCacheKey(base, quote)) || 'null');
            return cached && Number.isFinite(Number(cached.rate)) && Number(cached.rate) > 0 ? cached : null;
        } catch (_) {
            return null;
        }
    }

    function saveExchangeRate(base, quote, rate, date) {
        try {
            localStorage.setItem(exchangeCacheKey(base, quote), JSON.stringify({ rate, date, savedAt: Date.now() }));
        } catch (_) {
            // The live rate still works when browser storage is unavailable.
        }
    }

    function effectiveCurrency() {
        return ['same', 'live', 'cached'].includes(state.exchangeRateState) ? state.currency : state.sourceCurrency;
    }

    function convertMoney(value) {
        const rate = ['same', 'live', 'cached'].includes(state.exchangeRateState) ? state.exchangeRate : 1;
        return convertAmount(value, rate);
    }

    function formatCurrencyValue(value) {
        return new Intl.NumberFormat(state.lang === 'tr' ? 'tr-TR' : 'en-US', {
            style: 'currency', currency: effectiveCurrency(), currencyDisplay: 'symbol'
        }).format(value);
    }

    function formatMoney(value) {
        return formatCurrencyValue(convertMoney(value));
    }

    function updateExchangeRateStatus() {
        if (!elements.exchangeRateStatus) return;
        if (state.sourceCurrency === state.currency) {
            elements.exchangeRateStatus.textContent = t('exchangeSame');
            return;
        }
        if (state.exchangeRateState === 'loading') {
            elements.exchangeRateStatus.textContent = t('exchangeLoading');
            return;
        }
        if (state.exchangeRateState === 'error') {
            elements.exchangeRateStatus.textContent = t('exchangeError');
            return;
        }
        const rate = state.exchangeRate.toLocaleString(state.lang === 'tr' ? 'tr-TR' : 'en-US', { maximumFractionDigits: 6 });
        const date = state.exchangeRateDate
            ? new Intl.DateTimeFormat(state.lang === 'tr' ? 'tr-TR' : 'en-US', { dateStyle: 'medium' }).format(new Date(`${state.exchangeRateDate}T00:00:00`))
            : '';
        const label = state.exchangeRateState === 'cached' ? t('exchangeCached') : t('exchangeLive');
        elements.exchangeRateStatus.textContent = `${label}: 1 ${state.sourceCurrency} = ${rate} ${state.currency}${date ? ` · ${date}` : ''}`;
    }

    async function refreshExchangeRate({ render = true } = {}) {
        const base = state.sourceCurrency;
        const quote = state.currency;
        const requestId = ++state.exchangeRequestId;
        if (base === quote) {
            state.exchangeRate = 1;
            state.exchangeRateDate = '';
            state.exchangeRateState = 'same';
            updateExchangeRateStatus();
            if (render && state.data.length) renderDashboard();
            return;
        }

        const cached = readCachedExchangeRate(base, quote);
        if (cached) {
            state.exchangeRate = Number(cached.rate);
            state.exchangeRateDate = String(cached.date || '');
            state.exchangeRateState = 'cached';
            updateExchangeRateStatus();
            if (render && state.data.length) renderDashboard();
        } else {
            state.exchangeRate = 1;
            state.exchangeRateDate = '';
            state.exchangeRateState = 'loading';
            updateExchangeRateStatus();
            if (render && state.data.length) renderDashboard();
        }

        try {
            const response = await fetch(`https://api.frankfurter.dev/v2/rate/${base}/${quote}`, {
                headers: { Accept: 'application/json' },
                cache: 'no-store'
            });
            const payload = await response.json();
            const rate = Number(payload.rate);
            if (!response.ok || !Number.isFinite(rate) || rate <= 0) throw new Error('Invalid exchange rate');
            if (requestId !== state.exchangeRequestId) return;
            state.exchangeRate = rate;
            state.exchangeRateDate = String(payload.date || '');
            state.exchangeRateState = 'live';
            saveExchangeRate(base, quote, rate, state.exchangeRateDate);
        } catch (_) {
            if (requestId !== state.exchangeRequestId) return;
            state.exchangeRateState = cached ? 'cached' : 'error';
            if (!cached) {
                state.exchangeRate = 1;
                state.exchangeRateDate = '';
                if (state.data.length) showDashboardStatus(t('exchangeError'), 'warning');
            }
        }
        updateExchangeRateStatus();
        if (render && state.data.length) renderDashboard();
    }

    function updateCurrency(currency) {
        state.currency = supportedCurrencies.includes(currency) ? currency : 'USD';
        elements.currencySelect.value = state.currency;
        elements.quickCurrencySelect.value = state.currency;
        localStorage.setItem('currency', state.currency);
        void refreshExchangeRate();
    }

    function updateSourceCurrency(currency) {
        state.sourceCurrency = supportedCurrencies.includes(currency) ? currency : 'USD';
        elements.sourceCurrencySelect.value = state.sourceCurrency;
        localStorage.setItem('sourceCurrency', state.sourceCurrency);
        void refreshExchangeRate();
    }

    function formatPercent(value) {
        return `${value.toLocaleString(state.lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
    }

    function renderDashboard() {
        const data = filteredData();
        const analysis = analyseMarketData(data, { applyFees: state.applyFees, feeRate: state.feeRate });
        const metaPrefix = state.demo
            ? t('demoData')
            : (state.fileNames.length > 1 ? `${state.fileNames.length.toLocaleString(state.lang)} ${t('multipleFiles')}` : (state.fileNames[0] || t('uploadName')));
        const countLabel = data.length === state.data.length ? t('rows') : t('filteredRows');
        const details = [
            `${metaPrefix} · ${data.length.toLocaleString(state.lang)} ${countLabel}`,
            `${analysis.matchedCount.toLocaleString(state.lang)} ${t('matchedSales')}`,
            `${analysis.unmatchedCount.toLocaleString(state.lang)} ${t('unmatchedPurchases')}`,
            state.duplicatesRemoved ? `${state.duplicatesRemoved.toLocaleString(state.lang)} ${t('statusDuplicates')}` : '',
            state.invalidDateCount ? `${state.invalidDateCount.toLocaleString(state.lang)} ${t('invalidDates')}` : ''
        ].filter(Boolean);
        elements.datasetMeta.textContent = details.join(' · ');
        renderImportReport();
        renderSummary(analysis.summary);
        renderCharts(analysis);
        renderTables(analysis);
        renderActivity(analysis);
    }

    function renderImportReport() {
        const stats = [
            { icon: 'bi-files', value: state.demo ? 1 : state.fileNames.length, label: t('importFiles') },
            { icon: 'bi-check2-circle', value: state.data.length, label: t('importAccepted') },
            { icon: 'bi-intersect', value: state.duplicatesRemoved, label: t('importDuplicates') },
            { icon: 'bi-calendar-x', value: state.invalidDateCount, label: t('importInvalidDates') }
        ];
        elements.importReport.replaceChildren();
        elements.importReport.setAttribute('aria-label', t('importReportLabel'));
        stats.forEach((stat, index) => {
            const item = document.createElement('div');
            item.className = 'import-stat';
            item.style.setProperty('--import-stat-index', index);
            const icon = document.createElement('i');
            icon.className = `bi ${stat.icon}`;
            icon.setAttribute('aria-hidden', 'true');
            const text = document.createElement('span');
            const value = document.createElement('strong');
            value.textContent = Number(stat.value).toLocaleString(state.lang);
            const label = document.createElement('small');
            label.textContent = stat.label;
            text.append(value, label);
            item.append(icon, text);
            elements.importReport.appendChild(item);
        });
        elements.importReport.hidden = false;
    }

    function renderSummary(summary) {
        const cards = [
            { label: t('summaryProfit'), value: formatMoney(summary.realisedProfit), icon: 'bi-graph-up-arrow', tone: summary.realisedProfit >= 0 ? 'positive' : 'negative' },
            { label: t(state.applyFees ? 'summaryGrossSales' : 'summarySales'), value: formatMoney(summary.totalSold), icon: 'bi-arrow-up-right-circle', tone: '' },
            { label: t('summaryPurchases'), value: formatMoney(summary.totalPurchased), icon: 'bi-arrow-down-left-circle', tone: '' },
            { label: t('summaryFees'), value: formatMoney(summary.totalFees), icon: 'bi-percent', tone: '' },
            { label: t('summaryTransactions'), value: summary.transactions.toLocaleString(state.lang), icon: 'bi-receipt', tone: '' }
        ];
        const container = document.getElementById('summary-cards');
        container.replaceChildren();
        cards.forEach((card, index) => {
            const article = document.createElement('article');
            article.className = `stat-card ${card.tone}`.trim();
            article.style.setProperty('--card-index', index);
            const top = document.createElement('div');
            top.className = 'stat-top';
            const label = document.createElement('span');
            label.className = 'stat-label';
            label.textContent = card.label;
            const icon = document.createElement('span');
            icon.className = 'stat-icon';
            icon.innerHTML = `<i class="bi ${card.icon}"></i>`;
            const value = document.createElement('strong');
            value.className = 'stat-value';
            value.textContent = card.value;
            top.append(label, icon);
            article.append(top, value);
            container.appendChild(article);
        });
    }

    function renderChart(id, options) {
        state.charts[id]?.destroy?.();
        const container = document.getElementById(id);
        container.replaceChildren();
        const theme = document.documentElement.getAttribute('data-bs-theme') || 'dark';
        const baseChart = {
            background: 'transparent',
            foreColor: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim(),
            toolbar: { show: false },
            animations: { enabled: !document.documentElement.classList.contains('performance-mode'), speed: 420 }
        };
        state.charts[id] = new ApexCharts(container, {
            ...options,
            chart: { ...baseChart, ...options.chart },
            theme: { mode: theme },
            grid: { borderColor: getComputedStyle(document.documentElement).getPropertyValue('--line-strong').trim(), strokeDashArray: 4 },
            tooltip: { theme, ...options.tooltip },
            dataLabels: { enabled: false },
            noData: { text: t('noData') }
        });
        state.charts[id].render();
    }

    function renderCharts(analysis) {
        const monthFormatter = new Intl.DateTimeFormat(state.lang === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', year: '2-digit' });
        const firstTimelineDate = analysis.timeline[0]?.date || new Date();
        const lastTimelineDate = analysis.timeline[analysis.timeline.length - 1]?.date || firstTimelineDate;
        const monthSpan = Math.max(1, (lastTimelineDate.getFullYear() - firstTimelineDate.getFullYear()) * 12 + lastTimelineDate.getMonth() - firstTimelineDate.getMonth() + 1);
        const targetLabelCount = window.innerWidth < 680 ? 5 : 10;
        const labelEvery = Math.max(1, Math.ceil(monthSpan / targetLabelCount));
        renderChart('monthly-activity-chart', {
            series: [
                { name: t('purchases'), data: analysis.timeline.map(item => [item.date.getTime(), item.purchase]) },
                { name: t('sales'), data: analysis.timeline.map(item => [item.date.getTime(), item.sale]) }
            ],
            chart: { type: 'area', height: 350 },
            colors: ['#a684ff', '#67c1f5'],
            stroke: { curve: 'smooth', width: 2.5 },
            fill: { type: 'gradient', gradient: { opacityFrom: .34, opacityTo: .02 } },
            xaxis: {
                type: 'datetime',
                min: analysis.timeline.length ? firstTimelineDate.getTime() : undefined,
                max: analysis.timeline.length ? lastTimelineDate.getTime() : undefined,
                labels: {
                    datetimeUTC: false,
                    rotate: 0,
                    hideOverlappingLabels: true,
                    formatter: (_value, timestamp) => {
                        const date = new Date(timestamp);
                        const monthOffset = (date.getFullYear() - firstTimelineDate.getFullYear()) * 12 + date.getMonth() - firstTimelineDate.getMonth();
                        return monthOffset % labelEvery === 0 ? monthFormatter.format(date) : '';
                    }
                },
                tooltip: { enabled: false }
            },
            title: { text: t('chartTimeline'), style: { fontFamily: 'Space Grotesk', fontSize: '16px', fontWeight: 600 } },
            legend: { position: 'top', horizontalAlign: 'right' }
        });
        renderChart('type-pie-chart', {
            series: [analysis.typeCounts.purchase, analysis.typeCounts.sale],
            labels: [t('purchases'), t('sales')],
            chart: { type: 'donut', height: 350 },
            colors: ['#a684ff', '#67c1f5'],
            title: { text: t('chartTypes'), style: { fontFamily: 'Space Grotesk', fontSize: '16px', fontWeight: 600 } },
            legend: { position: 'bottom' },
            plotOptions: { pie: { donut: { size: '68%' } } }
        });
        const profits = [...analysis.profitAnalysis].filter(item => item.net > 0).sort((a, b) => b.net - a.net).slice(0, 6);
        const losses = [...analysis.profitAnalysis].filter(item => item.net < 0).sort((a, b) => a.net - b.net).slice(0, 6);
        renderChart('roi-profit-chart', {
            series: [{ name: t('net'), data: profits.map(item => Number(convertMoney(item.net).toFixed(2))) }],
            chart: { type: 'bar', height: 350 },
            colors: ['#57e6a5'],
            xaxis: { categories: profits.map(item => shorten(item.name, 30)), labels: { formatter: value => formatCurrencyValue(Number(value)) } },
            tooltip: { y: { formatter: value => formatCurrencyValue(Number(value)) } },
            plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '58%' } },
            title: { text: t('chartProfit'), style: { fontFamily: 'Space Grotesk', fontSize: '16px', fontWeight: 600 } }
        });
        renderChart('roi-loss-chart', {
            series: [{ name: t('net'), data: losses.map(item => Number(convertMoney(item.net).toFixed(2))) }],
            chart: { type: 'bar', height: 350 },
            colors: ['#ff758a'],
            xaxis: { categories: losses.map(item => shorten(item.name, 30)), labels: { formatter: value => formatCurrencyValue(Number(value)) } },
            tooltip: { y: { formatter: value => formatCurrencyValue(Number(value)) } },
            plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '58%' } },
            title: { text: t('chartLoss'), style: { fontFamily: 'Space Grotesk', fontSize: '16px', fontWeight: 600 } }
        });
    }

    function renderActivity(analysis) {
        const locale = state.lang === 'tr' ? 'tr-TR' : 'en-US';
        const monthLabels = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2026, month, 1)));
        const usesMonths = analysis.activityMode === 'month';
        const columnCount = usesMonths ? 12 : 24;
        const grid = document.createElement('div');
        grid.className = 'heatmap-grid';
        grid.classList.toggle('by-month', usesMonths);
        grid.style.setProperty('--heatmap-columns', columnCount);
        elements.heatmapKicker.textContent = t(usesMonths ? 'heatmapKickerMonths' : 'heatmapKicker');
        const corner = document.createElement('span');
        corner.className = 'heatmap-label';
        grid.appendChild(corner);
        for (let column = 0; column < columnCount; column += 1) {
            const label = document.createElement('span');
            label.className = 'heatmap-label heatmap-hour';
            label.textContent = usesMonths ? monthLabels[column] : (column % 3 === 0 ? String(column).padStart(2, '0') : '');
            grid.appendChild(label);
        }

        const dayOrder = [1, 2, 3, 4, 5, 6, 0];
        const maxCount = Math.max(0, ...analysis.activity.flat());
        dayOrder.forEach(dayIndex => {
            const dayLabel = document.createElement('span');
            dayLabel.className = 'heatmap-label';
            const referenceDate = new Date(2026, 0, 4 + dayIndex);
            dayLabel.textContent = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(referenceDate);
            grid.appendChild(dayLabel);
            analysis.activity[dayIndex].forEach((count, column) => {
                const cell = document.createElement('span');
                cell.className = 'heatmap-cell';
                cell.dataset.level = count && maxCount ? String(Math.max(1, Math.ceil((count / maxCount) * 4))) : '0';
                const positionLabel = usesMonths ? monthLabels[column] : `${String(column).padStart(2, '0')}:00`;
                const tooltipText = `${dayLabel.textContent} · ${positionLabel} · ${count.toLocaleString(state.lang)} ${t('heatmapCell')}`;
                cell.dataset.tooltip = tooltipText;
                cell.setAttribute('aria-label', tooltipText);
                cell.setAttribute('role', 'img');
                cell.tabIndex = 0;
                cell.addEventListener('mouseenter', () => showHeatmapTooltip(cell));
                cell.addEventListener('focus', () => showHeatmapTooltip(cell));
                cell.addEventListener('mouseleave', hideHeatmapTooltip);
                cell.addEventListener('blur', hideHeatmapTooltip);
                grid.appendChild(cell);
            });
        });
        elements.activityHeatmap.replaceChildren(grid);

        renderChart('year-comparison-chart', {
            series: analysis.yearSeries,
            chart: { type: 'line', height: 330 },
            colors: ['#67c1f5', '#a684ff', '#57e6a5', '#ffb45f'],
            stroke: { curve: 'smooth', width: 3 },
            markers: { size: 4, strokeWidth: 0 },
            xaxis: { categories: monthLabels },
            yaxis: { min: 0, forceNiceScale: true },
            title: { text: t('yearComparison'), style: { fontFamily: 'Space Grotesk', fontSize: '16px', fontWeight: 600 } },
            legend: { position: 'top', horizontalAlign: 'right' }
        });
    }

    function showHeatmapTooltip(cell) {
        const text = cell.dataset.tooltip;
        if (!text) return;
        elements.heatmapTooltip.textContent = text;
        elements.heatmapTooltip.hidden = false;
        const cellRect = cell.getBoundingClientRect();
        const tooltipRect = elements.heatmapTooltip.getBoundingClientRect();
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const padding = 12;
        const gap = 9;
        const preferredLeft = cellRect.left + (cellRect.width - tooltipRect.width) / 2;
        const maxLeft = Math.max(padding, viewportWidth - tooltipRect.width - padding);
        const left = Math.max(padding, Math.min(preferredLeft, maxLeft));
        const maxTop = Math.max(padding, viewportHeight - tooltipRect.height - padding);
        const above = cellRect.top - tooltipRect.height - gap;
        const below = cellRect.bottom + gap;
        const top = Math.max(padding, Math.min(above >= padding ? above : below, maxTop));
        elements.heatmapTooltip.style.left = `${left}px`;
        elements.heatmapTooltip.style.top = `${top}px`;
    }

    function hideHeatmapTooltip() {
        elements.heatmapTooltip.hidden = true;
    }

    function shorten(value, length) {
        const text = String(value || '');
        return text.length > length ? `${text.slice(0, length - 1)}…` : text;
    }

    function renderTables(analysis) {
        createTable('game-stats-container', 'game-stats', t('gameTableTitle'), [
            { label: t('colGame'), key: 'game', format: value => value },
            { label: t('colTransactions'), key: 'transactions', format: value => value.toLocaleString(state.lang) },
            { label: t('colSpent'), key: 'spent', format: formatMoney },
            { label: t('colEarned'), key: 'earned', format: formatMoney },
            { label: t('colCashflow'), key: 'cashflow', format: formatMoney, tone: true }
        ], analysis.gameStats);
        createTable('profit-analysis-container', 'profit-analysis', t('profitTableTitle'), [
            { label: t('colItem'), key: 'name', format: value => value },
            { label: t('colGame'), key: 'game', format: value => value },
            { label: t('colMatched'), key: 'matched', format: value => value.toLocaleString(state.lang) },
            { label: t('colAvgBuy'), key: 'avgBuy', format: formatMoney },
            { label: t('colAvgSell'), key: 'avgSell', format: formatMoney },
            { label: t('colRoi'), key: 'roi', format: formatPercent, tone: true },
            { label: t('colNet'), key: 'net', format: formatMoney, tone: true }
        ], analysis.profitAnalysis);
    }

    function createTable(containerId, tableId, title, columns, rows) {
        const container = document.getElementById(containerId);
        container.replaceChildren();

        const toolbar = document.createElement('div');
        toolbar.className = 'table-toolbar';
        const heading = document.createElement('h2');
        heading.textContent = title;
        const actions = document.createElement('div');
        actions.className = 'table-actions';
        const search = document.createElement('input');
        search.type = 'search';
        search.className = 'form-control';
        search.placeholder = t('searchTable');
        search.setAttribute('aria-label', t('searchTable'));
        const csvButton = exportButton('bi-filetype-csv', 'CSV');
        const jsonButton = exportButton('bi-filetype-json', 'JSON');
        actions.append(search, csvButton, jsonButton);
        toolbar.append(heading, actions);
        container.appendChild(toolbar);

        if (!rows.length) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.innerHTML = '<i class="bi bi-inboxes"></i>';
            const message = document.createElement('span');
            message.textContent = t('noData');
            empty.appendChild(message);
            container.appendChild(empty);
            search.disabled = true;
            csvButton.disabled = true;
            jsonButton.disabled = true;
            return;
        }

        const wrap = document.createElement('div');
        wrap.className = 'table-responsive';
        const table = document.createElement('table');
        table.className = 'table table-hover align-middle';
        table.id = tableId;
        const thead = table.createTHead();
        const headRow = thead.insertRow();
        columns.forEach((column, index) => {
            const th = document.createElement('th');
            th.scope = 'col';
            th.textContent = column.label;
            th.addEventListener('click', () => sortTable(table, index));
            headRow.appendChild(th);
        });
        const tbody = table.createTBody();
        rows.forEach((row, rowIndex) => {
            const tr = tbody.insertRow();
            tr.style.setProperty('--row-index', Math.min(rowIndex, 12));
            columns.forEach(column => {
                const td = tr.insertCell();
                const raw = row[column.key];
                td.textContent = column.format(raw);
                td.dataset.sort = typeof raw === 'number' ? String(raw) : String(raw || '').toLocaleLowerCase(state.lang);
                if (column.tone && typeof raw === 'number' && raw !== 0) td.classList.add(raw > 0 ? 'profit' : 'loss');
            });
        });
        wrap.appendChild(table);
        container.appendChild(wrap);

        search.addEventListener('input', () => {
            const query = search.value.trim().toLocaleLowerCase(state.lang);
            [...tbody.rows].forEach(row => { row.hidden = Boolean(query && !row.textContent.toLocaleLowerCase(state.lang).includes(query)); });
        });
        csvButton.addEventListener('click', () => exportTable(table, 'csv'));
        jsonButton.addEventListener('click', () => exportTable(table, 'json'));
    }

    function exportButton(icon, label) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'export-button';
        button.title = label;
        button.setAttribute('aria-label', label);
        button.innerHTML = `<i class="bi ${icon}"></i>`;
        return button;
    }

    function sortTable(table, columnIndex) {
        const body = table.tBodies[0];
        const previous = Number(table.dataset.sortColumn);
        const ascending = previous !== columnIndex || table.dataset.sortDirection !== 'asc';
        table.dataset.sortColumn = String(columnIndex);
        table.dataset.sortDirection = ascending ? 'asc' : 'desc';
        const rows = [...body.rows];
        rows.sort((a, b) => {
            const left = a.cells[columnIndex].dataset.sort;
            const right = b.cells[columnIndex].dataset.sort;
            const leftNumber = Number(left);
            const rightNumber = Number(right);
            const result = Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
                ? leftNumber - rightNumber
                : left.localeCompare(right, state.lang, { numeric: true });
            return ascending ? result : -result;
        });
        body.append(...rows);
    }

    function exportTable(table, format) {
        const headers = [...table.tHead.rows[0].cells].map(cell => cell.textContent);
        const rows = [...table.tBodies[0].rows].filter(row => !row.hidden).map(row => [...row.cells].map(cell => cell.textContent));
        let content;
        let type;
        if (format === 'csv') {
            const quote = value => `"${String(value).replace(/"/g, '""')}"`;
            content = [headers, ...rows].map(row => row.map(quote).join(',')).join('\n');
            type = 'text/csv;charset=utf-8';
        } else {
            content = JSON.stringify(rows.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index]]))), null, 2);
            type = 'application/json;charset=utf-8';
        }
        const url = URL.createObjectURL(new Blob(['\uFEFF', content], { type }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${table.id}.${format}`;
        anchor.click();
        URL.revokeObjectURL(url);
    }

    async function exportDashboard(format) {
        if (!window.html2canvas || (format === 'pdf' && !window.jspdf?.jsPDF)) {
            return showDashboardStatus(t('exportError'), 'error');
        }
        elements.exportOverlay.hidden = false;
        elements.dashboard.classList.add('exporting');
        elements.exportPNG.disabled = true;
        elements.exportPDF.disabled = true;
        try {
            window.dispatchEvent(new Event('resize'));
            await document.fonts?.ready;
            await new Promise(resolve => window.setTimeout(resolve, 180));
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const theme = document.documentElement.getAttribute('data-bs-theme');
            const backgroundColor = theme === 'light' ? '#edf6fb' : '#071016';
            const exportWidth = Math.max(1280, elements.dashboard.scrollWidth + 80);
            const exportHeight = Math.max(document.documentElement.clientHeight, elements.dashboard.scrollHeight + 120);
            const capture = (target, scale = 2) => html2canvas(target, {
                scale,
                backgroundColor,
                logging: false,
                useCORS: true,
                allowTaint: false,
                foreignObjectRendering: false,
                imageTimeout: 15000,
                removeContainer: true,
                scrollX: -window.scrollX,
                scrollY: -window.scrollY,
                windowWidth: exportWidth,
                windowHeight: exportHeight
            });
            const date = new Date().toISOString().slice(0, 10);
            if (format === 'png') {
                const canvas = await capture(elements.dashboard);
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                if (!blob) throw new Error('PNG encoding failed');
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `marketmemento-report-${date}.png`;
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
                URL.revokeObjectURL(url);
            } else {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
                const margin = 8;
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const availableWidth = pageWidth - margin * 2;
                const availableHeight = pageHeight - margin * 2;
                const headerCanvas = await capture(elements.dashboard.querySelector('.dashboard-header'), 1.75);
                const summaryCanvas = await capture(document.getElementById('summary-cards'), 1.75);
                const analyticsCanvas = await capture(elements.dashboard.querySelector('.analytics-panel'), 1.75);
                const paintPage = () => {
                    pdf.setFillColor(backgroundColor);
                    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
                };
                const addPageNumber = number => {
                    pdf.setTextColor(theme === 'light' ? '#5c7080' : '#91a5b5');
                    pdf.setFontSize(8);
                    pdf.text(`MarketMemento - ${number}/2`, pageWidth - margin, pageHeight - 3, { align: 'right' });
                };

                paintPage();
                const sectionGap = 6;
                const overviewScale = Math.min(
                    availableWidth / Math.max(headerCanvas.width, summaryCanvas.width),
                    (availableHeight - sectionGap) / (headerCanvas.height + summaryCanvas.height)
                );
                const overviewHeight = (headerCanvas.height + summaryCanvas.height) * overviewScale + sectionGap;
                let overviewY = (pageHeight - overviewHeight) / 2;
                [headerCanvas, summaryCanvas].forEach((section, index) => {
                    const width = section.width * overviewScale;
                    const height = section.height * overviewScale;
                    pdf.addImage(section.toDataURL('image/png'), 'PNG', (pageWidth - width) / 2, overviewY, width, height, undefined, 'FAST');
                    overviewY += height + (index ? 0 : sectionGap);
                });
                addPageNumber(1);

                pdf.addPage('a4', 'landscape');
                paintPage();
                const analyticsScale = Math.min(availableWidth / analyticsCanvas.width, availableHeight / analyticsCanvas.height);
                const analyticsWidth = analyticsCanvas.width * analyticsScale;
                const analyticsHeight = analyticsCanvas.height * analyticsScale;
                pdf.addImage(analyticsCanvas.toDataURL('image/png'), 'PNG', (pageWidth - analyticsWidth) / 2, (pageHeight - analyticsHeight) / 2, analyticsWidth, analyticsHeight, undefined, 'FAST');
                addPageNumber(2);
                // jsPDF's built-in metadata encoder can corrupt non-ASCII dataset labels.
                pdf.setProperties({ title: 'MarketMemento Report', subject: 'Steam market CSV overview', creator: 'MarketMemento' });
                pdf.save(`marketmemento-report-${date}.pdf`);
            }
            showDashboardStatus(t('exportComplete'), 'success');
        } catch (error) {
            console.error(error);
            showDashboardStatus(t('exportError'), 'error');
        } finally {
            elements.dashboard.classList.remove('exporting');
            window.dispatchEvent(new Event('resize'));
            elements.exportOverlay.hidden = true;
            elements.exportPNG.disabled = false;
            elements.exportPDF.disabled = false;
        }
    }

    async function restoreDataset() {
        let payload = null;
        try { payload = await storage.get(); } catch (_) { /* Fall back to legacy storage below. */ }
        if (!payload) {
            const saved = localStorage.getItem('marketData');
            if (saved) {
                try {
                    payload = {
                        data: JSON.parse(saved),
                        fileNames: (localStorage.getItem('marketFileName') || '').split(',').map(name => name.trim()).filter(Boolean)
                    };
                } catch (_) {
                    localStorage.removeItem('marketData');
                }
            }
        }
        if (!Array.isArray(payload?.data) || !payload.data.length) return;
        const validation = validateRows(payload.data);
        if (!validation.rows?.length) return;
        const deduped = deduplicateRows(validation.rows);
        state.data = deduped.rows;
        state.fileNames = Array.isArray(payload.fileNames)
            ? payload.fileNames
            : (payload.fileName ? [String(payload.fileName)] : []);
        state.invalidDateCount = validation.invalidDateCount || payload.invalidDateCount || 0;
        state.duplicatesRemoved = Number(payload.duplicatesRemoved || 0) + deduped.duplicates;
        state.demo = false;
        openDashboard({ scrollBehavior: 'auto' });
        requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
    }

    elements.fileInput.addEventListener('change', event => {
        void handleFiles(event.target.files).finally(() => { event.target.value = ''; });
    });
    elements.mergeFileInput.addEventListener('change', event => {
        void handleFiles(event.target.files, { merge: true }).finally(() => { event.target.value = ''; });
    });
    ['dragenter', 'dragover'].forEach(type => elements.dropZone.addEventListener(type, event => {
        event.preventDefault();
        elements.dropZone.classList.add('dragover');
    }));
    ['dragleave', 'drop'].forEach(type => elements.dropZone.addEventListener(type, event => {
        event.preventDefault();
        elements.dropZone.classList.remove('dragover');
    }));
    elements.dropZone.addEventListener('drop', event => { void handleFiles(event.dataTransfer?.files); });
    elements.demoButton.addEventListener('click', () => {
        state.data = createDemoData();
        state.fileNames = [];
        state.demo = true;
        state.invalidDateCount = 0;
        state.duplicatesRemoved = 0;
        openDashboard();
    });
    elements.resetButton.addEventListener('click', resetView);
    elements.exportPNG.addEventListener('click', () => { void exportDashboard('png'); });
    elements.exportPDF.addEventListener('click', () => { void exportDashboard('pdf'); });
    elements.installApp.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        elements.installApp.hidden = true;
    });
    elements.langTR.addEventListener('click', () => setLanguage('tr'));
    elements.langEN.addEventListener('click', () => setLanguage('en'));
    elements.themeSwitcher.addEventListener('click', () => setTheme(document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark'));
    elements.sourceCurrencySelect.addEventListener('change', () => updateSourceCurrency(elements.sourceCurrencySelect.value));
    elements.currencySelect.addEventListener('change', () => updateCurrency(elements.currencySelect.value));
    elements.quickCurrencySelect.addEventListener('change', () => updateCurrency(elements.quickCurrencySelect.value));
    elements.feeToggle.addEventListener('change', () => {
        state.applyFees = elements.feeToggle.checked;
        elements.feeRate.disabled = !state.applyFees;
        localStorage.setItem('applyFees', String(state.applyFees));
        if (state.data.length) renderDashboard();
    });
    elements.feeRate.addEventListener('change', () => {
        state.feeRate = Math.min(40, Math.max(0, Number(elements.feeRate.value) || 0));
        elements.feeRate.value = String(state.feeRate);
        localStorage.setItem('feeRate', String(state.feeRate));
        if (state.data.length) renderDashboard();
    });
    elements.gameFilter.addEventListener('change', renderDashboard);
    elements.itemFilter.addEventListener('input', renderDashboard);
    elements.dateFrom.addEventListener('change', () => {
        if (elements.dateTo.value && elements.dateFrom.value > elements.dateTo.value) elements.dateTo.value = elements.dateFrom.value;
        renderDashboard();
    });
    elements.dateTo.addEventListener('change', () => {
        if (elements.dateFrom.value && elements.dateTo.value < elements.dateFrom.value) elements.dateFrom.value = elements.dateTo.value;
        renderDashboard();
    });
    elements.clearFilters.addEventListener('click', () => {
        elements.gameFilter.value = '';
        elements.itemFilter.value = '';
        elements.dateFrom.value = '';
        elements.dateTo.value = '';
        renderDashboard();
    });
    document.querySelectorAll('.tab-button').forEach(button => button.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(tab => {
            const active = tab === button;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', String(active));
        });
        document.querySelectorAll('.tab-panel').forEach(panel => {
            const active = panel.id === button.dataset.tab;
            panel.classList.toggle('active', active);
            panel.hidden = !active;
        });
        requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    }));

    elements.sourceCurrencySelect.value = state.sourceCurrency;
    elements.currencySelect.value = state.currency;
    elements.quickCurrencySelect.value = state.currency;
    elements.feeToggle.checked = state.applyFees;
    elements.feeRate.value = String(state.feeRate);
    elements.feeRate.disabled = !state.applyFees;
    setTheme(localStorage.getItem('theme') === 'light' ? 'light' : 'dark');
    setLanguage(state.lang);
    elements.activityHeatmap.addEventListener('scroll', hideHeatmapTooltip, { passive: true });
    window.addEventListener('scroll', hideHeatmapTooltip, { passive: true, capture: true });
    window.addEventListener('resize', hideHeatmapTooltip, { passive: true });
    void (async () => {
        await refreshExchangeRate({ render: false });
        await restoreDataset();
    })();
    window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        deferredInstallPrompt = event;
        elements.installApp.hidden = false;
    });
    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        elements.installApp.hidden = true;
    });
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
});
