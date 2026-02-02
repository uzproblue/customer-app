// Service Worker for Push Notifications and Offline Caching
// This service worker handles push notifications and provides offline functionality

const CACHE_NAME = 'artisan-roasters-v1';
const RUNTIME_CACHE = 'artisan-roasters-runtime-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.svg',
  '/manifest.json'
];

// Service worker installation - cache critical assets
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' }))).catch(err => {
        console.warn('[Service Worker] Failed to cache some assets:', err);
        // Continue even if some assets fail to cache
        return Promise.resolve();
      });
    }).then(() => {
      // Activate immediately
      return self.skipWaiting();
    })
  );
});

// Service worker activation - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // Delete old caches that don't match current version
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', function(event) {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip API calls for now (network-first strategy below)
  const isApiCall = url.pathname.startsWith('/api/');
  
  // Static assets: Cache-first strategy
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
    url.pathname === '/' ||
    url.pathname === '/index.html'
  ) {
    event.respondWith(
      caches.match(request).then(function(response) {
        if (response) {
          return response;
        }
        return fetch(request).then(function(response) {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // Clone the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(request, responseToCache);
          });
          return response;
        });
      })
    );
    return;
  }

  // HTML: Stale-while-revalidate strategy
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(function(cache) {
        return cache.match(request).then(function(cachedResponse) {
          const fetchPromise = fetch(request).then(function(networkResponse) {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(function() {
            // Network failed, return cached if available
            return cachedResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // API calls: Network-first with cache fallback
  if (isApiCall) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(function(cache) {
        return fetch(request).then(function(networkResponse) {
          // Cache successful GET API responses
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(function() {
          // Network failed, try cache
          return cache.match(request).then(function(cachedResponse) {
            return cachedResponse || new Response(
              JSON.stringify({ error: 'Network unavailable and no cached data' }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        });
      })
    );
    return;
  }

  // Default: Network-first for other resources
  event.respondWith(
    fetch(request).catch(function() {
      return caches.match(request);
    })
  );
});

// Push notification handler
self.addEventListener('push', function(event) {
  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/logo.svg',
    badge: '/logo.svg',
    data: {}
  };

  if (event.data) {
    let rawData = null;
    
    // Try to get the data as text first
    try {
      rawData = event.data.text();
    } catch (textError) {
      // If text() fails, try json() method
      try {
        const jsonData = event.data.json();
        if (jsonData && typeof jsonData === 'object') {
          notificationData = {
            title: jsonData.title || notificationData.title,
            body: jsonData.body || notificationData.body,
            icon: jsonData.icon || notificationData.icon,
            badge: jsonData.badge || notificationData.badge,
            data: jsonData.data || {}
          };
        }
      } catch (jsonError) {
        console.error('[Service Worker] Error parsing push data:', jsonError);
      }
      rawData = null; // Skip JSON parsing below
    }
    
    // Try to parse as JSON if we have raw text data
    if (rawData) {
      try {
        const parsed = JSON.parse(rawData);
        if (parsed && typeof parsed === 'object') {
          notificationData = {
            title: parsed.title || notificationData.title,
            body: parsed.body || notificationData.body,
            icon: parsed.icon || notificationData.icon,
            badge: parsed.badge || notificationData.badge,
            data: parsed.data || {}
          };
        }
      } catch (parseError) {
        // If it's not JSON, use it as the notification body
        if (rawData && rawData.trim()) {
          notificationData.body = rawData;
        }
      }
    }
  }

  // Build notification options, only include icon/badge if they exist
  const notificationOptions = {
    body: notificationData.body,
    data: notificationData.data,
    tag: 'notification',
    requireInteraction: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  // Only add icon if provided (don't fail if icon doesn't exist)
  if (notificationData.icon) {
    notificationOptions.icon = notificationData.icon;
  }

  // Only add badge if provided
  if (notificationData.badge) {
    notificationOptions.badge = notificationData.badge;
  }

  const promiseChain = self.registration.showNotification(notificationData.title, notificationOptions)
    .catch(error => {
      console.error('[Service Worker] Error showing notification:', error);
      // Try again without icon/badge if it failed
      return self.registration.showNotification(notificationData.title, {
        body: notificationData.body,
        data: notificationData.data,
        tag: 'notification',
        requireInteraction: false
      });
    })
    .catch(error => {
      console.error('[Service Worker] Failed to show notification:', error);
    });

  event.waitUntil(promiseChain);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Handle the click action
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a window is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && (client.url.includes('/') || client.url === self.location.origin + '/')) {
          if ('focus' in client) {
            return client.focus();
          }
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    }).catch(error => {
      console.error('[Service Worker] Error handling notification click:', error);
    })
  );
});

