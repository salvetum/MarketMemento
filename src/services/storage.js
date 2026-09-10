const DB_NAME = 'marketmemento-data';
const STORE_NAME = 'datasets';

const openDatabase = () => new Promise((resolve, reject) => {
  if (!('indexedDB' in window)) {
    reject(new Error('IndexedDB unavailable'));
    return;
  }
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
      request.result.createObjectStore(STORE_NAME);
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

export const datasetStorage = {
  async get() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get('current');
      request.onsuccess = () => {
        db.close();
        resolve(request.result || null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  },
  async set(value) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(value, 'current');
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  },
  async clear() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete('current');
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  }
};

export async function readDataset() {
  try {
    const indexed = await datasetStorage.get();
    if (indexed?.data?.length) return indexed;
  } catch {
    // File:// and private browsing can disable IndexedDB.
  }
  try {
    const data = JSON.parse(localStorage.getItem('marketData') || 'null');
    return Array.isArray(data) && data.length
      ? { data, fileNames: (localStorage.getItem('marketFileName') || '').split(',').map(value => value.trim()).filter(Boolean) }
      : null;
  } catch {
    localStorage.removeItem('marketData');
    return null;
  }
}

export async function writeDataset(payload, demo = false) {
  if (demo) return true;
  try {
    await datasetStorage.set(payload);
    localStorage.removeItem('marketData');
    localStorage.removeItem('marketFileName');
    return true;
  } catch {
    try {
      localStorage.setItem('marketData', JSON.stringify(payload.data));
      localStorage.setItem('marketFileName', payload.fileNames.join(', '));
      return true;
    } catch {
      return false;
    }
  }
}

export async function clearDataset() {
  localStorage.removeItem('marketData');
  localStorage.removeItem('marketFileName');
  try {
    await datasetStorage.clear();
  } catch {
    // Storage is optional; reset in-memory state regardless.
  }
}
