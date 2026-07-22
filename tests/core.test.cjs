const test = require('node:test');
const assert = require('node:assert/strict');
const {
    normaliseType,
    priceInCents,
    convertAmount,
    detectMarketCurrency,
    convertMarketRows,
    parseMarketDate,
    marketDateHasTime,
    deduplicateRows,
    analyseMarketData
} = require('../core.js');

test('işlem türü ve sent değeri normalize edilir', () => {
    assert.equal(normaliseType('Purchase'), 'purchase');
    assert.equal(normaliseType('sold'), 'sale');
    assert.equal(normaliseType('unknown'), '');
    assert.equal(priceInCents({ 'Price in Cents': '$1,299' }), 1299);
});

test('para tutarı geçerli kurla dönüştürülür', () => {
    assert.equal(convertAmount(10, 47.195), 471.95);
    assert.equal(convertAmount(10, 0), 0);
});

test('Display Price para birimini algılar ve karışık satırları ayrı dönüştürür', () => {
    assert.equal(detectMarketCurrency('$0.12 USD'), 'USD');
    assert.equal(detectMarketCurrency('0,24 TL'), 'TRY');
    assert.equal(detectMarketCurrency('€1.20'), 'EUR');
    assert.equal(detectMarketCurrency('100'), '');
    const converted = convertMarketRows([
        { _price: 100, _currency: 'USD' },
        { _price: 100, 'Display Price': '1,00 TL' }
    ], 'TRY', { USD: 47.195, TRY: 1 });
    assert.deepEqual(converted.map(row => row._price), [4719.5, 100]);
    assert.equal(converted.some(row => row._conversionMissing), false);
});

test('İngilizce ve Türkçe tarihler saatleriyle ayrıştırılır', () => {
    const english = parseMarketDate('Jan 04 2024 @ 3:25pm');
    const turkish = parseMarketDate('04 Oca 2024 09:15');
    assert.deepEqual(
        [english.getFullYear(), english.getMonth(), english.getDate(), english.getHours(), english.getMinutes()],
        [2024, 0, 4, 15, 25]
    );
    assert.deepEqual(
        [turkish.getFullYear(), turkish.getMonth(), turkish.getDate(), turkish.getHours(), turkish.getMinutes()],
        [2024, 0, 4, 9, 15]
    );
});

test('yılı olmayan gelecek tarih önceki yıla alınır ve bozuk tarih reddedilir', () => {
    const reference = new Date(2026, 6, 21, 12, 0, 0);
    assert.equal(parseMarketDate('Dec 02 18:30', reference).getFullYear(), 2025);
    assert.equal(parseMarketDate('2023-02-29'), null);
    assert.equal(parseMarketDate('Jan 04 2024 12:75'), null);
});

test('saat içermeyen geçmiş aylık, saat içeren geçmiş saatlik ısı haritası üretir', () => {
    const dateOnly = [{
        'Market Name': 'Case', 'Game Name': 'Game', 'Acted On': '2025-01-06',
        _type: 'purchase', _price: 100, _date: '2025-01-06T00:00:00.000Z', _index: 0
    }];
    const timed = [{
        'Market Name': 'Case', 'Game Name': 'Game', 'Acted On': '2025-01-06 14:30',
        _type: 'purchase', _price: 100, _date: '2025-01-06T14:30:00.000Z', _index: 0
    }];
    assert.equal(marketDateHasTime(dateOnly[0]['Acted On']), false);
    assert.equal(marketDateHasTime(timed[0]['Acted On']), true);
    assert.equal(analyseMarketData(dateOnly).activityMode, 'month');
    assert.equal(analyseMarketData(timed).activityMode, 'hour');
    assert.equal(analyseMarketData([...dateOnly, ...timed]).activityMode, 'month');
});

test('işlem kimliği ve satır içeriği tekrarları güvenli biçimde ayıklar', () => {
    const rows = [
        { 'Transaction ID': 'A1', 'Market Name': 'Case', Type: 'purchase', _index: 0 },
        { 'Transaction ID': 'A1', 'Market Name': 'Changed text', Type: 'sale', _index: 1 },
        { 'Market Name': 'Key', Type: 'purchase', 'Price in Cents': '250', _index: 2 },
        { 'Market Name': 'Key', Type: 'purchase', 'Price in Cents': '250', _index: 3 }
    ];
    const result = deduplicateRows(rows);
    assert.equal(result.rows.length, 2);
    assert.equal(result.duplicates, 2);
    assert.deepEqual(result.rows.map(row => row._index), [0, 1]);
});

test('FIFO en eski alışları eşleştirir ve eşleşmeyen stoğu korur', () => {
    const makeRow = (type, price, date, index) => ({
        'Market Name': 'Test Item',
        'Game Name': 'Test Game',
        _type: type,
        _price: price,
        _date: new Date(date).toISOString(),
        _index: index
    });
    const rows = [
        makeRow('purchase', 100, '2025-01-01T10:00:00', 0),
        makeRow('purchase', 200, '2025-02-01T10:00:00', 1),
        makeRow('sale', 150, '2025-03-01T10:00:00', 2),
        makeRow('sale', 250, '2025-04-01T10:00:00', 3),
        makeRow('purchase', 300, '2025-05-01T10:00:00', 4)
    ];
    const result = analyseMarketData(rows);
    assert.equal(result.matchedCount, 2);
    assert.equal(result.unmatchedCount, 1);
    assert.equal(result.summary.realisedProfit, 1);
    assert.equal(result.profitAnalysis[0].avgBuy, 1.5);
    assert.equal(result.profitAnalysis[0].avgSell, 2);
});

test('ücret tahmini satış geliri ve FIFO sonucuna uygulanır', () => {
    const rows = [
        { 'Market Name': 'Item', 'Game Name': 'Game', _type: 'purchase', _price: 100, _date: '2025-01-01T10:00:00.000Z', _index: 0 },
        { 'Market Name': 'Item', 'Game Name': 'Game', _type: 'sale', _price: 200, _date: '2025-01-02T10:00:00.000Z', _index: 1 }
    ];
    const result = analyseMarketData(rows, { applyFees: true, feeRate: 15 });
    assert.equal(result.summary.totalSold, 2);
    assert.equal(result.summary.totalFees, 0.3);
    assert.equal(result.summary.realisedProfit, 0.7);
    assert.equal(result.gameStats[0].cashflow, 0.7);
});
