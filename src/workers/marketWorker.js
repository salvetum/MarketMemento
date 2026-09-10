import Papa from 'papaparse';
import '../../core.js';

const core = globalThis.MarketMementoCore;

function parseFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: result => {
        try {
          const validation = validateRows(result.data, result.meta?.fields || []);
          if (validation.error) reject(new Error(validation.error));
          else resolve({ ...validation, name: file.name });
        } catch (error) {
          reject(error);
        }
      },
      error: error => reject(error instanceof Error ? error : new Error('The CSV could not be read.'))
    });
  });
}

function validateRows(rows, fields = []) {
  const requiredColumns = ['Market Name', 'Price in Cents', 'Type'];
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

self.onmessage = async event => {
  const { id, type, file, rows, options } = event.data;
  try {
    const result = type === 'parse' ? await parseFile(file) : core.analyseMarketData(rows, options);
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
