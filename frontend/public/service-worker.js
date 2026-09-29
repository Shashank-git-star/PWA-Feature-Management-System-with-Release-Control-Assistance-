const CACHE_PREFIX = 'feature-flag-manager-';
const CACHE_NAME = `${CACHE_PREFIX}v5`;
const SHELL_URLS = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/screenshots/dashboard-wide.png',
    '/screenshots/dashboard-mobile.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(SHELL_URLS);

        const response = await cache.match('/');
        const html = response ? await response.text() : '';
        const appAssets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
            .map((match) => match[1])
            .filter((assetUrl) => {
                const path = new URL(assetUrl, self.location.origin).pathname;
                return path.startsWith('/assets/')
                    || path.startsWith('/src/')
                    || path.startsWith('/@vite/')
                    || path.startsWith('/@react-refresh');
            });

        await Promise.all(appAssets.map((assetUrl) => cache.add(assetUrl)));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames
            .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin) return;

    if (/^\/(api|auth|analytics|audit-logs|environments|flags|groups|overrides|targeting)(\/|$)/.test(url.pathname)) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const response = await fetch(request);
                if (response.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put('/', response.clone());
                    await cache.put('/index.html', response.clone());
                }
                return response;
            } catch {
                const cachedPage = await caches.match(request, { ignoreSearch: true });
                return cachedPage || caches.match('/index.html');
            }
        })());
        return;
    }

    event.respondWith((async () => {
        try {
            const response = await fetch(request);
            if (response.ok) {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(request, response.clone());
            }
            return response;
        } catch (error) {
            const cachedResource = await caches.match(request, { ignoreSearch: true });
            if (cachedResource) return cachedResource;
            throw error;
        }
    })());
});
