// Service Worker for Push Notifications
// This service worker handles push notifications for the customer app

self.addEventListener('push', function(event) {
  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
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

// Service worker activation
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

// Service worker installation
self.addEventListener('install', function(event) {
  self.skipWaiting(); // Activate immediately
});
