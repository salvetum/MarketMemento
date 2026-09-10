import Papa from 'papaparse';
import '../../core.js';

const core = globalThis.MarketMementoCore;
export const currencies = ['USD', 'TRY', 'EUR', 'GBP', 'CNY', 'JPY'];
export const requiredColumns = ['Market Name', 'Price in Cents', 'Type'];

export function validateRows(rows, fields = []) {
  const available = fields.length ? fields : Object.keys(rows[0] || {});
  const missing = requiredColumns.filter(column => !available.includes(column));
  if (missing.length) return { error: `Missing required columns: ${missing.join(', ')}` };
  let invalidDateCount = 0;
  const cleaned = rows.filter(row => row && typeof row === 'object').map((row, index) => {
    const parsedDate = core.parseMarketDate(row['Acted On']);
    if (!parsedDate) invalidDateCount += 1;
    return {
      ...row,
      'Market Name': String(row['Market Name'] || '').trim(),
      'Game Name': String(row['Game Name'] || 'Steam Market').trim() || 'Steam Market',
      _type: core.normaliseType(row.Type),
      _price: core.priceInCents(row),
      _currency: core.detectMarketCurrency(row['Display Price']),
      _date: parsedDate?.toISOString() || null,
      _hasTime: core.marketDateHasTime(row['Acted On']),
      _index: index
    };
  }).filter(row => row['Market Name'] && row._type && row._price >= 0);
  return cleaned.length ? { rows: cleaned, invalidDateCount } : { error: 'No analysable purchase or sale records found.' };
}

export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: result => {
        const validation = validateRows(result.data, result.meta?.fields || []);
        if (validation.error) reject(new Error(validation.error));
        else resolve({ ...validation, name: file.name });
      },
      error: () => reject(new Error('The CSV could not be read.'))
    });
  });
}

export function deduplicateRows(rows) {
  return core.deduplicateRows(rows);
}

export function analyse(rows, options) {
  return core.analyseMarketData(rows, options);
}

export function convertRows(rows, targetCurrency, rates, fallbackCurrency) {
  return core.convertMarketRows(rows, targetCurrency, rates, fallbackCurrency);
}

export function exchangeKey(base, quote) {
  return `exchangeRate:${base}:${quote}`;
}

export function readCachedRate(base, quote) {
  try {
    const value = JSON.parse(localStorage.getItem(exchangeKey(base, quote)) || 'null');
    return value && Number(value.rate) > 0 ? value : null;
  } catch {
    return null;
  }
}

export function saveCachedRate(base, quote, rate, date) {
  try {
    localStorage.setItem(exchangeKey(base, quote), JSON.stringify({ rate, date, savedAt: Date.now() }));
  } catch {
    // A live response remains usable when storage is unavailable.
  }
}

export function demoRows() {
  const rows = [];
  const items = [
    ['Counter-Strike 2', 'AK-47 | Slate (Field-Tested)', 420, 650],
    ['Dota 2', 'Inscribed Immortal Treasure', 275, 410],
    ['Rust', 'Metal Door', 110, 165],
    ['Counter-Strike 2', 'Clutch Case', 85, 120]
  ];
  for (let index = 0; index < 48; index += 1) {
    const item = items[index % items.length];
    const purchase = index % 3 !== 2;
    const date = new Date(2024, index % 12, 2 + (index % 24), 9 + (index % 10), index % 60);
    rows.push({
      'Market Name': item[1],
      'Game Name': item[0],
      'Price in Cents': String(purchase ? item[2] : item[3]),
      Type: purchase ? 'Purchase' : 'Sale',
      'Display Price': `$${(purchase ? item[2] : item[3]) / 100}`,
      'Acted On': date.toISOString(),
      _type: purchase ? 'purchase' : 'sale',
      _price: purchase ? item[2] : item[3],
      _currency: 'USD',
      _date: date.toISOString(),
      _hasTime: true,
      _index: index
    });
  }
  return rows;
}
