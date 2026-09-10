let worker;
let sequence = 0;
const pending = new Map();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('../workers/marketWorker.js', import.meta.url), { type: 'module' });
    worker.onmessage = event => {
      const request = pending.get(event.data.id);
      if (!request) return;
      pending.delete(event.data.id);
      if (event.data.error) request.reject(new Error(event.data.error));
      else request.resolve(event.data.result);
    };
    worker.onerror = event => {
      for (const request of pending.values()) request.reject(event.error || new Error('Worker failed.'));
      pending.clear();
      worker = undefined;
    };
  }
  return worker;
}

function request(payload) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, ...payload });
  });
}

export const parseCsvFileInWorker = file => request({ type: 'parse', file });
export const analyseInWorker = (rows, options) => request({ type: 'analyse', rows, options });
