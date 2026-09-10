const APP_IDS = {
  'Counter-Strike 2': 730,
  'Dota 2': 570,
  Rust: 252490
};

const CURRENCY_IDS = { USD: 1, EUR: 3, GBP: 2, CNY: 23, JPY: 5, TRY: 17 };
const cacheKey = (game, item, currency) => `steamMarket:${game}:${item}:${currency}`;

function readCache(game, item, currency) {
  try {
    const value = JSON.parse(localStorage.getItem(cacheKey(game, item, currency)) || 'null');
    return value && Number(value.amount) > 0 ? value : null;
  } catch {
    return null;
  }
}

function saveCache(game, item, currency, amount) {
  try {
    localStorage.setItem(cacheKey(game, item, currency), JSON.stringify({ amount, savedAt: Date.now() }));
  } catch {
    // A live value remains usable when storage is unavailable.
  }
}

export async function fetchInventoryPrices(items, currency) {
  const currencyId = CURRENCY_IDS[currency];
  if (!currencyId) return { prices: {}, fetched: 0, failed: items.length };
  const prices = {};
  let fetched = 0;
  let failed = 0;
  await Promise.all(items.map(async item => {
    const appId = APP_IDS[item.game];
    if (!appId) { failed += 1; return; }
    const cached = readCache(item.game, item.name, currency);
    if (cached) {
      prices[`${item.game}\u0000${item.name}`] = cached.amount;
      fetched += 1;
      return;
    }
    try {
      const url = `https://steamcommunity.com/market/priceoverview/?appid=${appId}&currency=${currencyId}&market_hash_name=${encodeURIComponent(item.name)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Steam Market request failed: ${response.status}`);
      const payload = await response.json();
      const amount = Number(payload.lowest_price?.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Steam Market price unavailable');
      prices[`${item.game}\u0000${item.name}`] = amount;
      saveCache(item.game, item.name, currency, amount);
      fetched += 1;
    } catch {
      failed += 1;
    }
  }));
  return { prices, fetched, failed };
}
