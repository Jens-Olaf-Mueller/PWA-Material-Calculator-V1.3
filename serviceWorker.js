import { APP_NAME, VERSION } from "./js/constants.js";
/**
 * @description for further information see:
 * 
 * @see {@link https://developer.chrome.com/docs/workbox/service-worker-overview?hl=de}
 * @see {@link https://github.com/w3c/ServiceWorker/blob/main/explainer.md}
 * @see {@link https://github.com/NekR/self-destroying-sw}
 * @see {@link https://www.youtube.com/watch?v=dhV4uJeBuGs}
 * @see {@link https://www.ankursheel.com/blog/programmatically-remove-service-worker#}
 */

/**
 * The array holds all required assets for the service worker.
 */
const assets = [
    '/',
    '/templates/main.html',
    '/templates/settings.html',
    '/templates/ruler.html',
    '/templates/calc.html',

    '/img/icon.png',
    '/img/english.png',
    '/img/german.png',
    '/img/italian.png',
    '/img/portugese.png',
    '/img/romanian.png',

    '/js/library.js',
    '/js/material.js',
    '/js/material_class.js',
    '/js/calculator_class.js',
    '/js/constants.js',
    '/js/languages.js',
    
    '/style/style.css',
    '/style/controls.css',
    '/style/calculator.css'
]

const cacheTypes = [APP_NAME, 'font', 'image', 'style'];

self.addEventListener('install', (evt) => {
    self.skipWaiting();
    // make sure we have all assets in cache before continueing
    evt.waitUntil(
        caches.open(cacheTypes[0] + '_v' + VERSION).then((cache) => {
            cache.addAll(assets);
        })
    );
    console.log(`Service worker for ${APP_NAME} installed...`)
});


self.addEventListener('activate', (evt) => {
    evt.waitUntil(
        // tell the browser to use the new service worker
        clearCache().then(() => clients.claim())
    );
    console.log(`Service worker for ${APP_NAME} activated...`);
});


async function clearCache() {
    let cachesToKeep = [];
    cacheTypes.forEach(cache => {
        cachesToKeep.push(cache + VERSION);
    });

    const keys =  await caches.keys();
    let cachesToDelete = keys.filter((key) => !cachesToKeep.includes(key));

    await Promise.all(
        cachesToDelete.map(key => caches.delete(key))
    );    
}


self.addEventListener('fetch', (evt) => {
    let response = null;
    switch (evt.request.destination) {
        case 'font':
        case 'image':
            response = cacheFirst(evt.request);
            break;    
        default:
            response = networkFirst(evt.request);
            break;
    }
    evt.respondWith(response);
});


async function cacheFirst(request) {
    let responseFromCache = await caches.match(request);
    if (responseFromCache) return responseFromCache;

    let responseFromServer = await fetch(request);
    pushToCache(request, responseFromServer.clone());
    return responseFromServer;
}


async function networkFirst(request) {
    try {
        let responseFromServer = await fetch(request);
        pushToCache(request, responseFromServer.clone());
        return responseFromServer;
    } catch (error) {
        let responseFromCache = await caches.match(request);
        if (responseFromCache) return responseFromCache;
        return error;
    }
}


function pushToCache(request, response) {
    const key = cacheTypes.includes(request.destination) ? request.destination : APP_NAME;
    caches.open(key + VERSION).then((cache) => {
        const url = request.url;
        if (url.includes('chrome-extension') || url.includes('fiveserver')) return;
        // console.log(url);
        cache.put(request, response);
    })
}

// navigator.serviceWorker.getRegistrations().then(registrations => {
//     for (const registration of registrations) {
//         registration.unregister();
//     } 
// });