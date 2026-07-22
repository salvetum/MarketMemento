const CACHE_NAME = 'marketmemento-v8';
const APP_ASSETS = [
    './',
    './index.html',
    './styles.css?v=15',
    './core.js',
    './app.js?v=15',
    './manifest.webmanifest',
    './icon.svg',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './vendor/fonts/fonts.css',
    './vendor/fonts/manrope-latin-ext.woff2',
    './vendor/fonts/manrope-latin.woff2',
    './vendor/fonts/space-grotesk-latin-ext.woff2',
    './vendor/fonts/space-grotesk-latin.woff2',
    './vendor/bootstrap/bootstrap.min.css',
    './vendor/bootstrap/bootstrap.bundle.min.js',
    './vendor/bootstrap-icons/bootstrap-icons.min.css',
    './vendor/bootstrap-icons/fonts/bootstrap-icons.woff',
    './vendor/bootstrap-icons/fonts/bootstrap-icons.woff2',
    './vendor/bootstrap-icons/fonts/bootstrap-icons.woff?dd67030699838ea613ee6dbda90effa6',
    './vendor/bootstrap-icons/fonts/bootstrap-icons.woff2?dd67030699838ea613ee6dbda90effa6',
    './vendor/apexcharts/apexcharts.min.js',
    './vendor/papaparse/papaparse.min.js',
    './vendor/html2canvas/html2canvas.min.js',
    './vendor/jspdf/jspdf.umd.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin === self.location.origin) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                    return response;
                })
                .catch(() => caches.match(event.request).then(response => response || caches.match('./index.html')))
        );
        return;
    }
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
