/**
 * Notification Service
 * Handles browser notification permissions and push subscriptions
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPermissionRequest {
  customerId: string;
  restaurantId: string;
  permissionGranted: boolean;
  pushSubscription?: PushSubscription;
}

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied';

/**
 * Check if browser supports notifications
 */
export const isNotificationSupported = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = (): NotificationPermissionStatus => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission as NotificationPermissionStatus;
};

/**
 * Request browser notification permission
 */
export const requestNotificationPermission = async (): Promise<NotificationPermissionStatus> => {
  if (!isNotificationSupported()) {
    throw new Error('Notifications are not supported in this browser');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission as NotificationPermissionStatus;
};

/**
 * Get VAPID public key from backend
 */
export const getVapidPublicKey = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/vapid-key`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return null;
    }

    return result.data?.publicKey || null;
  } catch (error) {
    console.error('Error fetching VAPID key:', error);
    return null;
  }
};

/**
 * Register push subscription (for Web Push API)
 * Note: Requires service worker to be registered first
 */
export const registerPushSubscription = async (): Promise<PushSubscription | null> => {
  if (!isNotificationSupported()) {
    return null;
  }

  try {
    // Get VAPID public key from backend
    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) {
      console.warn('VAPID public key not available, skipping push subscription');
      return null;
    }

    // Check if service worker is supported and registered
    if ('serviceWorker' in navigator) {
      // Try to get existing registration or register service worker
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        // Register service worker if not already registered
        try {
          registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          console.log('Service worker registered:', registration);
          
          // Wait for the service worker to be ready
          await navigator.serviceWorker.ready;
        } catch (swError) {
          console.error('Error registering service worker:', swError);
          return null;
        }
      } else {
        // Service worker already registered, ensure it's ready
        await navigator.serviceWorker.ready;
      }

      // Check if push manager is available
      if (!registration.pushManager) {
        console.warn('Push manager not available');
        return null;
      }

      // Try to get existing subscription first
      let subscription = await registration.pushManager.getSubscription();
      
      // If no subscription exists, create a new one
      if (!subscription) {
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
          });
        } catch (subscribeError: any) {
          // If subscription fails (e.g., due to different VAPID key), 
          // try to unsubscribe existing subscriptions and retry
          console.warn('Subscription failed, attempting to clean up and retry:', subscribeError);
          const existingSubs = await registration.pushManager.getSubscription();
          if (existingSubs) {
            try {
              await existingSubs.unsubscribe();
            } catch (unsubError) {
              console.warn('Failed to unsubscribe existing subscription:', unsubError);
            }
          }
          // Retry subscription
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
          });
        }
      }

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };
    }
  } catch (error) {
    console.error('Error registering push subscription:', error);
    // Return null if push subscription fails - we can still use browser notifications
  }

  return null;
};

/**
 * Save notification permission to backend
 */
export const saveNotificationPermission = async (
  request: NotificationPermissionRequest
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/permission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to save notification permission');
    }
  } catch (error) {
    console.error('Error saving notification permission:', error);
    throw error;
  }
};

/**
 * Update push subscription for existing permission
 * Useful for users who already granted permission but don't have push subscription yet
 */
export const updatePushSubscription = async (
  customerId: string,
  restaurantId: string
): Promise<boolean> => {
  try {
    // Check if permission is granted in browser
    const permission = getNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted, skipping push subscription update');
      return false;
    }

    // Try to register push subscription
    const pushSubscription = await registerPushSubscription();
    if (!pushSubscription) {
      console.warn('Failed to register push subscription');
      return false;
    }

    // Update permission with push subscription
    await saveNotificationPermission({
      customerId,
      restaurantId,
      permissionGranted: true,
      pushSubscription
    });

    console.log('Push subscription updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating push subscription:', error);
    return false;
  }
};

/**
 * Get notification permission status from backend
 */
export const getNotificationPermissionStatus = async (
  customerId: string,
  restaurantId: string
): Promise<{ permissionGranted: boolean }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/notifications/permission/${customerId}/${restaurantId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch notification permission');
    }

    return {
      permissionGranted: result.data?.permissionGranted || false
    };
  } catch (error) {
    console.error('Error fetching notification permission:', error);
    throw error;
  }
};

/**
 * Utility: Convert VAPID public key from base64 URL to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Utility: Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Debug utility: Check service worker and notification status
 */
export const checkNotificationStatus = async (): Promise<void> => {
  console.log('=== Notification Status Check ===');
  
  // Check browser support
  console.log('Browser supports notifications:', 'Notification' in window);
  console.log('Browser supports service workers:', 'serviceWorker' in navigator);
  console.log('Notification permission:', Notification.permission);
  
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        console.log('Service Worker registered:', registration.scope);
        console.log('Service Worker active:', !!registration.active);
        console.log('Push Manager available:', !!registration.pushManager);
        
        if (registration.pushManager) {
          const subscription = await registration.pushManager.getSubscription();
          console.log('Push subscription exists:', !!subscription);
          if (subscription) {
            console.log('Push subscription endpoint:', subscription.endpoint);
          }
        }
      } else {
        console.warn('No service worker registration found');
      }
    } catch (error) {
      console.error('Error checking service worker:', error);
    }
  }
  
  console.log('=== End Status Check ===');
};

