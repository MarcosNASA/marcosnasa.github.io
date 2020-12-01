const version = 1;
const CACHE_NAME = `marcosnasag-${version}`;
const urlsToCache = [
  './',
  './index.html',
  './src/app/views/404.html',
  './src/app/home/404.html',
  './src/app/projects/404.html',
  './src/app/styles/404.css',
  './src/app/styles/animations.css',
  './src/app/styles/home.css',
  './src/app/styles/projects.css',
  './src/app/styles/mediaqueries.css',
  './src/app/styles.css',
  './src/app/utils.js',
  './src/app/main.js',
  './src/app/router/router.js',
  './src/app/controllers/404.js',
  './src/app/controllers/home.js',
  './src/app/controllers/index.js',
  './src/app/controllers/projects.js',
  './src/app/controllers/controllers-utils.js',
  './assets/images/chipzset.webp',
  './assets/images/js-scope-visualizer.webp',
  './assets/images/reciptory.webp',
  './assets/icons/favicon.ico',
  './assets/icons/icon-64.png',
  './assets/icons/icon-96.png',
  './assets/icons/icon-128.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-256.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-1080.png',
  './assets/icons/icon-maskable.png',
  './manifest.json',
  './assets/fonts/Pacifico-Regular.ttf',
  './assets/fonts/Roboto-Regular.ttf',
];

self.addEventListener('install', onInstall);
self.addEventListener('activate', onActivate);
self.addEventListener('fetch', onFetch);

main().catch(console.error);

async function main() {
  await cacheFiles();
}

// Install.
function onInstall() {
  self.skipWaiting();
}

// Cache files.
async function cacheFiles(forceReload = false) {
  var cache = await caches.open(CACHE_NAME);

  return Promise.all(
    urlsToCache.map(async function requestFile(url) {
      try {
        let res;

        if (!forceReload) {
          res = await cache.match.url();
          if (res) {
            return res;
          }
        }

        let fetchOptions = {
          method: 'GET',
          cache: 'no-store',
        };

        res = await fetch(url, fetchOptions);
        if (res.ok) {
          await cache.put(url, res.clone());
        }
      } catch (err) {}
    }),
  );
}

// Clean up caches other than current.
function onActivate(event) {
  event.waitUntil(handleActivation());
}

// Cache and update with stale-while-revalidate policy.
function onFetch(event) {
  const { request } = event;

  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return;
  }

  event.respondWith(handleFetch(request));
}

async function handleFetch(request) {
  var url = new URL(request.url);
  var reqURL = url.pathname;
  var cache = await caches.open(CACHE_NAME);

  if (url.origin == location.origin) {
    // request for site's own URL? => network-and-cache
    let fetchOptions = {
      method: request.method,
      headers: request.headers,
      cache: 'no-store',
    };

    let res = await safeRequest(
      reqURL,
      request,
      fetchOptions,
      /* cacheResponse= */ false,
      /* checkCacheFirst= */ false,
      /* checkCacheLast= */ true,
    );
    if (res) {
      if (!res.headers.get('X-Not-Found')) {
        await cache.put(reqURL, res.clone());
      } else {
        await cache.delete(reqURL);
      }
      return res;
    }

    // otherwise, return a 404 page
    return cache.match('/404.html');
  } else {
    // all other files use "cache-first"

    let fetchOptions = {
      method: request.method,
      headers: request.headers,
      cache: 'no-store',
    };
    let res = await safeRequest(
      reqURL,
      request,
      fetchOptions,
      /* cacheResponse= */ true,
      /* checkCacheFirst= */ true,
    );
    if (res) {
      return res;
    }

    // otherwise, force a network-level 404 response
    return notFoundResponse();
  }
}

async function handleActivation() {
  await clearCaches();
  await cacheFiles(true);
}

async function clearCaches() {
  var cacheNames = await caches.keys();
  var oldCacheNames = cacheNames.filter(function matchOldCache(cacheName) {
    var [, cacheNameVersion] = cacheName.match(/^marcosnasag-(\d+)$/) || [];
    cacheNameVersion =
      cacheNameVersion != null ? Number(cacheNameVersion) : cacheNameVersion;
    return cacheNameVersion > 0 && version !== cacheNameVersion;
  });
  await Promise.all(
    oldCacheNames.map(function deleteCache(cacheName) {
      return caches.delete(cacheName);
    }),
  );
}

async function safeRequest(
  reqURL,
  request,
  options,
  cacheResponse = false,
  checkCacheFirst = false,
  checkCacheLast = false,
  useRequestDirectly = false,
) {
  var cache = await caches.open(CACHE_NAME);
  var res;

  if (checkCacheFirst) {
    res = await cache.match(reqURL);
    if (res) {
      return res;
    }
  }

  try {
    if (useRequestDirectly) {
      res = await fetch(request, options);
    } else {
      res = await fetch(request.url, options);
    }

    if (res && (res.ok || res.type == 'opaqueredirect')) {
      if (cacheResponse) {
        await cache.put(reqURL, res.clone());
      }
      return res;
    }
  } catch (err) {}

  if (checkCacheLast) {
    res = await cache.match(reqURL);
    if (res) {
      return res;
    }
  }
}

function notFoundResponse() {
  return new Response('', {
    status: 404,
    statusText: 'Not Found',
  });
}
