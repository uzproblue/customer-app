import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './fallback.css'
import App from './App.tsx'
import { initializeInstallPrompt } from './services/pwaInstallService'

// Initialize PWA install prompt listener
initializeInstallPrompt();

// Register service worker for PWA and push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker();
  });

  // Check for updates periodically (every hour)
  setInterval(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.update();
        }
      });
    }
  }, 60 * 60 * 1000); // 1 hour

  // Handle online/offline status
  window.addEventListener('online', () => {
    console.log('App is online');
    // Check for service worker updates when coming back online
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.update();
      }
    });
  });

  window.addEventListener('offline', () => {
    console.log('App is offline');
  });
}

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service Worker registered:', registration.scope);

    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available, prompt user to reload
            console.log('New service worker available. Reload to update.');
            // Optionally show a notification to the user
            if (confirm('A new version is available. Reload to update?')) {
              window.location.reload();
            }
          }
        });
      }
    });

    // Check for updates immediately
    await registration.update();

    // Listen for controller change (service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed');
      // Optionally reload the page to use the new service worker
      // window.location.reload();
    });
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
