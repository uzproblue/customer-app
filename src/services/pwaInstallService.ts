/**
 * PWA Install Service
 * Handles PWA installation prompts and state
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installPromptShown = false;

/**
 * Check if the app is already installed
 */
export const isAppInstalled = (): boolean => {
  // Check if running in standalone mode (installed)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check for iOS standalone mode
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  return false;
};

/**
 * Check if running on iOS Safari
 */
export const isIOSSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
  
  return isIOS && isSafari;
};

/**
 * Check if PWA installation is supported (Chrome/Edge with beforeinstallprompt)
 */
export const isInstallSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
};

/**
 * Initialize the install prompt listener
 * Call this once when the app loads
 */
export const initializeInstallPrompt = (): void => {
  if (!isInstallSupported()) {
    return;
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent the default browser install prompt
    e.preventDefault();
    
    // Store the event for later use
    deferredPrompt = e as BeforeInstallPromptEvent;
    installPromptShown = false;
    
    console.log('[PWA] Install prompt available');
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
    installPromptShown = false;
  });
};

/**
 * Check if install prompt is available
 */
export const isInstallPromptAvailable = (): boolean => {
  return deferredPrompt !== null && !installPromptShown && !isAppInstalled();
};

/**
 * Show the install prompt
 * Returns true if prompt was shown, false otherwise
 */
export const showInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt || installPromptShown || isAppInstalled()) {
    return false;
  }

  try {
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for user choice
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }
    
    // Clear the deferred prompt
    deferredPrompt = null;
    installPromptShown = true;
    
    return choiceResult.outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Error showing install prompt:', error);
    return false;
  }
};

/**
 * Reset the install prompt state (useful for testing)
 */
export const resetInstallPrompt = (): void => {
  deferredPrompt = null;
  installPromptShown = false;
};
