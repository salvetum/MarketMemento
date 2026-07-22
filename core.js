(function exposeMarketMementoCore(root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.MarketMementoCore = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createMarketMementoCore() {
    'use strict';

    const monthMap = {
        jan: 0, january: 0, oca: 0, ocak: 0,
        feb: 1, february: 1, sub: 1, subat: 1, şub: 1, şubat: 1,
        mar: 2, march: 2, mart: 2,
        apr: 3, april: 3, nis: 3, nisan: 3,
        may: 4, mayis: 4, mayıs: 4,
        jun: 5, june: 5, haz: 5, haziran: 5,
        jul: 6, july: 6, tem: 6, temmuz: 6,
        aug: 7, august: 7, agu: 7, agustos: 7, ağu: 7, ağustos: 7,
        sep: 8, sept: 8, september: 8, eyl: 8, eylul: 8, eylül: 8,
        oct: 9, october: 9, eki: 9, ekim: 9,
        nov: 10, november: 10, kas: 10, kasim: 10, kasım: 10,
        dec: 11, december: 11, ara: 11, aralik: 11, aralık: 11
    };

    function normaliseType(value) {
        const type = String(value || '').trim().toLowerCase();
        if (type === 'purchase' || type === 'buy' || type.startsWith('purch')) return 'purchase';
        if (type === 'sale' || type === 'sell' || type.startsWith('sold')) return 'sale';
        return '';
    }

    function priceInCents(row) {
        const raw = String(row?.['Price in Cents'] ?? '').replace(/[^\d-]/g, '');
        return Number.parseInt(raw, 10) || 0;
    }

    function convertAmount(value, rate = 1) {
        const amount = Number(value);
        const multiplier = Number(rate);
        return Number.isFinite(amount) && Number.isFinite(multiplier) && multiplier > 0 ? amount * multiplier : 0;
    }

    function detectMarketCurrency(value) {
        const source = String(value || '').replace(/\u00a0/g, ' ').trim().toUpperCase();
        if (!source) return '';
        const code = source.match(/(?:^|\s)(USD|EUR|GBP|CNY|JPY|TRY|TL)(?:\s|$)/)?.[1];
        if (code) return code === 'TL' ? 'TRY' : code;
        if (source.includes('₺')) return 'TRY';
        if (source.includes('€')) return 'EUR';
        if (source.includes('£')) return 'GBP';
        if (source.includes('$')) return 'USD';
        return '';
    }

    function convertMarketRows(rows, targetCurrency, rates = {}, fallbackCurrency = 'USD') {
        return (rows || []).map(row => {
            const sourceCurrency = row._currency || detectMarketCurrency(row['Display Price']) || fallbackCurrency;
            const rate = sourceCurrency === targetCurrency ? 1 : Number(rates[sourceCurrency]);
            const hasRate = Number.isFinite(rate) && rate > 0;
            return {
                ...row,
                _price: hasRate ? convertAmount(row._price, rate) : row._price,
                _sourceCurrency: sourceCurrency,
                _conversionMissing: !hasRate
            };
        });
    }

    function marketDateHasTime(value) {
        const source = String(value || '').trim();
        if (/^\d{10,13}$/.test(source)) return true;
        return /(?:^|[T\s@,])(\d{1,2}):(\d{2})(?::\d{2})?\s*(?:am|pm)?\b/i.test(source);
    }

    function parseMarketDate(value, referenceDate = new Date()) {
        const source = String(value || '').replace(/\u00a0/g, ' ').trim();
        if (!source) return null;

        const unixValue = Number(source);
        if (/^\d{10,13}$/.test(source) && Number.isFinite(unixValue)) {
            const unixDate = new Date(source.length === 10 ? unixValue * 1000 : unixValue);
            return Number.isNaN(unixDate.getTime()) ? null : unixDate;
        }

        const cleaned = source
            .replace(/\s*@\s*/g, ' ')
            .replace(/(\d+)(st|nd|rd|th)/gi, '$1')
            .replace(/\s+/g, ' ')
            .trim();
        const timeMatch = cleaned.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?\b/i);
        let hour = Number(timeMatch?.[1] || 0);
        const minute = Number(timeMatch?.[2] || 0);
        const second = Number(timeMatch?.[3] || 0);
        if (timeMatch?.[4]?.toLowerCase() === 'pm' && hour < 12) hour += 12;
        if (timeMatch?.[4]?.toLowerCase() === 'am' && hour === 12) hour = 0;
        if (hour > 23 || minute > 59 || second > 59) return null;

        const today = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
        const normaliseMonth = token => String(token || '').toLocaleLowerCase('tr-TR').replace(/\./g, '');
        const safeDate = (year, month, day = 1) => {
            const date = new Date(Number(year), Number(month), Number(day), hour, minute, second);
            if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) || date.getDate() !== Number(day)) return null;
            return date;
        };
        const inferYear = (month, day) => {
            let year = today.getFullYear();
            const candidate = safeDate(year, month, day);
            if (candidate && candidate.getTime() > today.getTime() + 86_400_000) year -= 1;
            return year;
        };

        let match = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\D|$)/);
        if (match) return safeDate(match[1], Number(match[2]) - 1, match[3]);

        match = cleaned.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\D|$)/);
        if (match) {
            const first = Number(match[1]);
            const secondValue = Number(match[2]);
            const monthFirst = secondValue > 12 && first <= 12;
            return safeDate(match[3], (monthFirst ? first : secondValue) - 1, monthFirst ? secondValue : first);
        }

        const dayMonth = cleaned.match(/^(\d{1,2})\s+([\p{L}.]+)(?:,?\s+(\d{4}))?/u);
        if (dayMonth) {
            const month = monthMap[normaliseMonth(dayMonth[2])];
            if (month !== undefined) return safeDate(dayMonth[3] || inferYear(month, Number(dayMonth[1])), month, dayMonth[1]);
        }

        const monthDay = cleaned.match(/^([\p{L}.]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?/u);
        if (monthDay) {
            const month = monthMap[normaliseMonth(monthDay[1])];
            if (month !== undefined) return safeDate(monthDay[3] || inferYear(month, Number(monthDay[2])), month, monthDay[2]);
        }

        if (/\b(?:19|20)\d{2}\b/.test(cleaned)) {
            const timestamp = Date.parse(cleaned);
            if (Number.isFinite(timestamp)) return new Date(timestamp);
        }
        return null;
    }

    function rowFingerprint(row) {
        const transactionId = row['Transaction ID'] || row['Transaction Id'] || row.TransactionID || row.transaction_id;
        if (transactionId) return `id:${String(transactionId).trim()}`;
        return Object.entries(row)
            .filter(([key]) => !key.startsWith('_'))
            .sort(([left], [right]) => left.localeCompare(right, 'en-US'))
            .map(([key, value]) => `${key}:${String(value ?? '').trim().toLocaleLowerCase('en-US')}`)
            .join('\u0001');
    }

    function deduplicateRows(rows) {
        const unique = new Map();
        let duplicates = 0;
        rows.forEach(row => {
            const key = rowFingerprint(row);
            if (unique.has(key)) duplicates += 1;
            else unique.set(key, row);
        });
        return {
            rows: [...unique.values()].map((row, index) => ({ ...row, _index: index })),
            duplicates
        };
    }

    function analyseMarketData(data, options = {}) {
        const purchases = data.filter(row => row._type === 'purchase');
        const sales = data.filter(row => row._type === 'sale');
        const configuredRate = Math.min(40, Math.max(0, Number(options.feeRate) || 0));
        const feeRate = options.applyFees ? configuredRate / 100 : 0;
        const netSaleValue = cents => cents * (1 - feeRate);
        const totalPurchased = purchases.reduce((sum, row) => sum + row._price, 0) / 100;
        const totalSold = sales.reduce((sum, row) => sum + row._price, 0) / 100;
        const totalFees = sales.reduce((sum, row) => sum + row._price * feeRate, 0) / 100;

        const byItem = new Map();
        [...data].sort((a, b) => {
            if (a._date && b._date) return new Date(a._date) - new Date(b._date);
            if (a._date) return -1;
            if (b._date) return 1;
            return (a._index || 0) - (b._index || 0);
        }).forEach(row => {
            const key = `${row['Game Name']}\u0000${row['Market Name']}`;
            if (!byItem.has(key)) byItem.set(key, { name: row['Market Name'], game: row['Game Name'], queue: [], pairs: [] });
            const item = byItem.get(key);
            if (row._type === 'purchase') item.queue.push(row);
            else if (item.queue.length) item.pairs.push({ buy: item.queue.shift(), sale: row });
        });

        const profitAnalysis = [...byItem.values()]
            .filter(item => item.pairs.length)
            .map(item => {
                const buyTotal = item.pairs.reduce((sum, pair) => sum + pair.buy._price, 0);
                const saleTotal = item.pairs.reduce((sum, pair) => sum + netSaleValue(pair.sale._price), 0);
                const netCents = saleTotal - buyTotal;
                return {
                    name: item.name,
                    game: item.game,
                    matched: item.pairs.length,
                    avgBuy: buyTotal / item.pairs.length / 100,
                    avgSell: saleTotal / item.pairs.length / 100,
                    net: netCents / 100,
                    roi: buyTotal ? (netCents / buyTotal) * 100 : 0
                };
            });

        const gameMap = new Map();
        data.forEach(row => {
            const game = row['Game Name'];
            if (!gameMap.has(game)) gameMap.set(game, { game, transactions: 0, spent: 0, earned: 0 });
            const item = gameMap.get(game);
            item.transactions += 1;
            if (row._type === 'purchase') item.spent += row._price / 100;
            if (row._type === 'sale') item.earned += netSaleValue(row._price) / 100;
        });
        const gameStats = [...gameMap.values()].map(game => ({ ...game, cashflow: game.earned - game.spent }));

        const monthly = new Map();
        const hourlyActivity = Array.from({ length: 7 }, () => Array(24).fill(0));
        const monthlyActivity = Array.from({ length: 7 }, () => Array(12).fill(0));
        let timedRows = 0;
        let datedRows = 0;
        const years = new Map();
        data.forEach(row => {
            if (!row._date) return;
            datedRows += 1;
            const date = new Date(row._date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthly.has(key)) monthly.set(key, { date, purchase: 0, sale: 0 });
            monthly.get(key)[row._type] += 1;
            hourlyActivity[date.getDay()][date.getHours()] += 1;
            monthlyActivity[date.getDay()][date.getMonth()] += 1;
            if (row._hasTime ?? marketDateHasTime(row['Acted On'])) timedRows += 1;
            if (!years.has(date.getFullYear())) years.set(date.getFullYear(), Array(12).fill(0));
            years.get(date.getFullYear())[date.getMonth()] += 1;
        });

        const timeline = [...monthly.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, value]) => value);
        const realisedProfit = profitAnalysis.reduce((sum, item) => sum + item.net, 0);
        const matchedCount = profitAnalysis.reduce((sum, item) => sum + item.matched, 0);
        const unmatchedCount = [...byItem.values()].reduce((sum, item) => sum + item.queue.length, 0);
        const hasCompleteTimeData = datedRows > 0 && timedRows === datedRows;

        return {
            summary: { realisedProfit, totalSold, totalPurchased, totalFees, transactions: data.length },
            typeCounts: { purchase: purchases.length, sale: sales.length },
            profitAnalysis,
            gameStats,
            timeline,
            matchedCount,
            unmatchedCount,
            activity: hasCompleteTimeData ? hourlyActivity : monthlyActivity,
            activityMode: hasCompleteTimeData ? 'hour' : 'month',
            yearSeries: [...years.entries()].sort(([left], [right]) => left - right).map(([year, values]) => ({ name: String(year), data: values }))
        };
    }

    return { normaliseType, priceInCents, convertAmount, detectMarketCurrency, convertMarketRows, parseMarketDate, marketDateHasTime, rowFingerprint, deduplicateRows, analyseMarketData };
}));
