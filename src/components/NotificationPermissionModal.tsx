import React, { useState, useEffect } from 'react';
import {
  requestNotificationPermission,
  registerPushSubscription,
  saveNotificationPermission,
  isNotificationSupported,
  getNotificationPermission
} from '../services/notificationService';

interface NotificationPermissionModalProps {
  customerId: string;
  restaurantId: string;
  onComplete: () => void;
  onSkip: () => void;
}

const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  customerId,
  restaurantId,
  onComplete,
  onSkip
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isNotificationSupported());
    
    // Handle already granted permission on mount
    const currentPermission = getNotificationPermission();
    if (currentPermission === 'granted') {
      // Permission already granted, try to register push subscription and save
      const setupPermission = async () => {
        try {
          // Try to register push subscription (may have failed before or service worker wasn't ready)
          let pushSubscription = null;
          try {
            pushSubscription = await registerPushSubscription();
          } catch (pushError) {
            console.warn('Push subscription failed, but browser notifications are enabled:', pushError);
            // Continue even if push subscription fails
          }

          // Save permission to backend (this will update existing permission with push subscription if available)
          await saveNotificationPermission({
            customerId,
            restaurantId,
            permissionGranted: true,
            pushSubscription: pushSubscription || undefined
          });
        } catch (error) {
          console.error('Error setting up notification permission:', error);
        } finally {
          onComplete();
        }
      };
      
      setupPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleAllow = async () => {
    setLoading(true);
    setError(null);

    try {
      // Request browser permission
      const permission = await requestNotificationPermission();

      if (permission === 'granted') {
        // Try to register push subscription (optional - may fail if service worker not set up)
        let pushSubscription = null;
        try {
          pushSubscription = await registerPushSubscription();
        } catch (pushError) {
          console.warn('Push subscription failed, but browser notifications are enabled:', pushError);
          // Continue even if push subscription fails
        }

        // Save permission to backend
        await saveNotificationPermission({
          customerId,
          restaurantId,
          permissionGranted: true,
          pushSubscription: pushSubscription || undefined
        });

        onComplete();
      } else if (permission === 'denied') {
        // Save denied status to backend
        await saveNotificationPermission({
          customerId,
          restaurantId,
          permissionGranted: false
        });
        setError('Notification permission was denied. You can enable it later in your browser settings.');
      } else {
        // User dismissed the prompt
        onSkip();
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      setError(err instanceof Error ? err.message : 'Failed to request notification permission');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Save that user skipped (no permission granted)
    saveNotificationPermission({
      customerId,
      restaurantId,
      permissionGranted: false
    }).catch(err => {
      console.error('Error saving skipped permission:', err);
    });
    onSkip();
  };

  if (!supported) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
          <div className="text-center">
            <div className="mb-4">
              <span className="material-symbols-outlined text-5xl text-gray-400">
                notifications_off
              </span>
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">Notifications Not Supported</h2>
            <p className="text-gray-600 mb-6">
              Your browser doesn't support notifications. You can still use the app, but you won't receive push notifications.
            </p>
            <button
              onClick={handleSkip}
              className="w-full h-12 bg-primary text-white rounded-xl font-bold hover:bg-black transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPermission = getNotificationPermission();
  
  if (currentPermission === 'granted') {
    // Already granted - the useEffect will handle saving and completing
    return null;
  }

  if (currentPermission === 'denied') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
          <div className="text-center">
            <div className="mb-4">
              <span className="material-symbols-outlined text-5xl text-orange-500">
                notifications_off
              </span>
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">Notifications Blocked</h2>
            <p className="text-gray-600 mb-6">
              Notifications are currently blocked. To enable them, please update your browser settings and allow notifications for this site.
            </p>
            <button
              onClick={handleSkip}
              className="w-full h-12 bg-primary text-white rounded-xl font-bold hover:bg-black transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl animate-slide-up">
        <div className="text-center">
          <div className="mb-4">
            <span className="material-symbols-outlined text-5xl text-primary">
              notifications_active
            </span>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Stay Updated!</h2>
          <p className="text-gray-600 mb-6">
            Get notified about special offers, new rewards, and important updates. You can change this anytime in your browser settings.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleAllow}
              disabled={loading}
              className="w-full h-12 bg-primary text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Requesting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">notifications</span>
                  Allow Notifications
                </>
              )}
            </button>
            <button
              onClick={handleSkip}
              disabled={loading}
              className="w-full h-12 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-70"
            >
              Not Now
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            We'll only send you notifications from this restaurant. You can manage this in your account settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionModal;
