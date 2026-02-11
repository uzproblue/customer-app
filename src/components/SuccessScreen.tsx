
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AppleLogo, GoogleWalletIcon } from './Icons';
import { addToAppleWallet, addToGoogleWallet, type PassData, type WalletError } from '../services/walletService';
import { updatePushSubscription, getNotificationPermission } from '../services/notificationService';
import { useRestaurant } from '../contexts/RestaurantContext';
import { saveSession, clearSession } from '../services/sessionService';
import { isInstallPromptAvailable, showInstallPrompt, isAppInstalled, isIOSSafari } from '../services/pwaInstallService';
import NotificationPermissionModal from './NotificationPermissionModal';

interface SuccessScreenProps {
  name: string;
  userId: string;
  onReset: () => void;
  showNotificationModal?: boolean;
  onNotificationComplete?: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ name, userId, onReset, showNotificationModal, onNotificationComplete }) => {
  const handleSignOut = () => {
    clearSession();
    onReset();
  };
  const [isAddingApple, setIsAddingApple] = useState(false);
  const [isAddingGoogle, setIsAddingGoogle] = useState(false);
  const [isAddedApple, setIsAddedApple] = useState(false);
  const [isAddedGoogle, setIsAddedGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [showPWAInstall, setShowPWAInstall] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const { restaurantId, restaurant } = useRestaurant();

  // Card branding defaults (aligned with platform WalletCardPreview)
  const cardBackgroundColor = '#303030';
  const textColor = '#FFFFFF';
  const qrCodeColor = '#000000';
  const qrCodeBackgroundColor = '#FFFFFF';
  const cardTitle = restaurant?.name ?? 'Rewards Card';
  const logo = restaurant?.signupPageConfig?.headerImage ?? '';
  const memberDisplay = userId ? `#${userId.slice(-6)}` : '—';

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('other'); // Default to showing both or choosing one for desktop demo
    }
  }, []);

  // Store full session in localStorage for future visits
  useEffect(() => {
    if (userId && restaurantId && name) {
      saveSession({
        customerId: userId,
        name: name,
        email: '', // Will be updated if we have it
        restaurantId: restaurantId,
        createdAt: new Date().toISOString()
      });
    }
  }, [userId, restaurantId, name]);

  // Try to update push subscription if permission is granted but subscription might be missing
  useEffect(() => {
    if (userId && restaurantId) {
      const permission = getNotificationPermission();
      if (permission === 'granted') {
        // Try to update push subscription in the background (don't block UI)
        updatePushSubscription(userId, restaurantId).catch(err => {
          console.warn('Background push subscription update failed:', err);
        });
      }
    }
  }, [userId, restaurantId]);

  // Check for PWA install prompt availability after registration
  useEffect(() => {
    // Small delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      if (isAppInstalled()) {
        return; // Already installed, don't show anything
      }
      
      if (isIOSSafari()) {
        // Show iOS instructions instead of install button
        setShowIOSInstructions(true);
      } else if (isInstallPromptAvailable()) {
        // Show install button for Chrome/Edge
        setShowPWAInstall(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleAddToAppleWallet = async () => {
    if (isAddedApple) return;
    
    setIsAddingApple(true);
    setError(null);
    
    try {
      const passData: PassData = {
        userName: name,
        cardTitle: 'Coffee Rewards',
        cardDescription: 'Loyalty Member Card'
      };
      
      await addToAppleWallet(passData);
      setIsAddedApple(true);
    } catch (err) {
      const walletError = err as WalletError;
      setError(walletError.message || 'Failed to add to Apple Wallet. Please try again.');
      console.error('Apple Wallet error:', walletError);
    } finally {
      setIsAddingApple(false);
    }
  };

  const handleAddToGoogleWallet = async () => {
    if (isAddedGoogle) return;
    
    setIsAddingGoogle(true);
    setError(null);
    
    try {
      const passData: PassData = {
        userName: name,
        cardTitle: restaurant?.name ?? 'Rewards Card',
        cardDescription: 'Loyalty Member Card',
        customerId: userId,
        restaurantId: restaurantId ?? undefined
      };
      
      await addToGoogleWallet(passData);
      setIsAddedGoogle(true);
    } catch (err) {
      const walletError = err as WalletError;
      setError(walletError.message || 'Failed to add to Google Wallet. Please try again.');
      console.error('Google Wallet error:', walletError);
    } finally {
      setIsAddingGoogle(false);
    }
  };

  const handleInstallPWA = async () => {
    setIsInstalling(true);
    try {
      const installed = await showInstallPrompt();
      if (installed) {
        setShowPWAInstall(false);
      }
    } catch (err) {
      console.error('PWA install error:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  const renderWalletButtons = () => {
    // Show Apple Wallet for iOS or "Other" (for demo purposes we show Apple on Desktop if not Android)
    const showApple = platform === 'ios' || platform === 'other';
    // Show Google Wallet for Android or "Other" (for demo purposes we show both on Desktop)
    const showGoogle = platform === 'android' || platform === 'other';

    return (
      <div className="w-full space-y-3">
        {error && (
          <div className="w-full p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              <div className="flex-1">
                <p className="font-semibold mb-1">Error</p>
                <p>{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
                aria-label="Dismiss error"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>
        )}

        {showApple && (
          <>
            {isAddedApple ? (
              <div className="w-full h-14 bg-green-50 text-green-700 rounded-2xl font-semibold flex items-center justify-center gap-2 border border-green-100">
                <span className="material-symbols-outlined font-bold">check_circle</span>
                Added to Apple Wallet
              </div>
            ) : (
              <button 
                onClick={handleAddToAppleWallet}
                disabled={isAddingApple || isAddingGoogle}
                className="w-full h-14 bg-black text-white rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-80"
              >
                {isAddingApple ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <AppleLogo className="w-5 h-5 mb-1" />
                    Add to Apple Wallet
                  </>
                )}
              </button>
            )}
          </>
        )}
        
        {showGoogle && (
          <>
            {isAddedGoogle ? (
              <div className="w-full h-14 bg-green-50 text-green-700 rounded-2xl font-semibold flex items-center justify-center gap-2 border border-green-100">
                <span className="material-symbols-outlined font-bold">check_circle</span>
                Added to Google Wallet
              </div>
            ) : (
              <button 
                onClick={handleAddToGoogleWallet}
                disabled={isAddingGoogle || isAddingApple}
                className="w-full h-14 bg-[#262626] text-white rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-black active:scale-[0.98] transition-all disabled:opacity-80"
              >
                {isAddingGoogle ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <GoogleWalletIcon className="w-6 h-6" />
                    Add to Google Wallet
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center text-center animate-fade-in w-full">
      {/* Success Icon */}
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 shadow-sm">
        <span className="material-symbols-outlined text-4xl font-bold">check</span>
      </div>
      
      {/* Title & Subtitle */}
      <div className="space-y-3 mb-10">
        <h1 className="text-3xl font-bold text-gray-900">You're all set!</h1>
        <p className="text-gray-500 text-base max-w-[400px] mx-auto leading-relaxed px-4">
          Your loyalty card is ready. Scan it at any participating location to start earning rewards.
        </p>
      </div>

      {/* Loyalty Card Visual (matches platform WalletCardPreview) */}
      <div
        className="relative w-full max-w-[340px] aspect-[1/1.6] rounded-[24px] overflow-hidden flex flex-col transition-all border border-white/10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] mb-8"
        style={{ backgroundColor: cardBackgroundColor }}
      >
        {/* Top Bar (Logo & Title) */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 justify-between w-full">
            {logo ? (
              <img
                src={logo}
                alt="Logo"
                className="w-8 h-8 min-w-8 min-h-8 max-w-8 max-h-8 rounded-full border border-white/20 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-sm">image</span>
              </div>
            )}
            <span className="text-sm font-bold tracking-tight" style={{ color: textColor }}>
              {cardTitle}
            </span>
            <div className="text-sm font-bold tracking-tight" style={{ color: textColor }}>
              {memberDisplay}
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="flex-1 px-6 py-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: `${textColor}99` }}>
                Points Balance
              </p>
              <p className="text-2xl font-black mt-1" style={{ color: textColor }}>
                0 pts
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: `${textColor}99` }}>
                Tier
              </p>
              <p className="text-lg font-bold mt-1" style={{ color: textColor }}>
                Member
              </p>
            </div>
          </div>
          {/* QR Code Area */}
          <div className="px-2 py-6 flex flex-col items-center gap-2">
            <div className="w-full h-full p-3 rounded-lg" style={{ backgroundColor: qrCodeBackgroundColor }}>
              <QRCodeSVG
                value={userId}
                size={248}
                level="H"
                fgColor={qrCodeColor}
                bgColor={qrCodeBackgroundColor}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: `${textColor}99` }}>
              Member Name
            </p>
            <p className="text-lg font-medium" style={{ color: textColor }}>
              {name}
            </p>
          </div>
        </div>
      </div>

      {/* PWA Install Prompt - Chrome/Edge */}
      {showPWAInstall && (
        <div className="w-full mb-6 p-4 bg-gradient-to-r from-primary to-gray-800 text-white rounded-2xl shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1">Install App for Quick Access</h3>
              <p className="text-xs text-white/90">Get faster access and work offline</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPWAInstall(false)}
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
              <button
                onClick={handleInstallPWA}
                disabled={isInstalling}
                className="px-4 py-2 bg-white text-primary font-semibold rounded-lg text-sm hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isInstalling ? (
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                ) : (
                  'Install'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Install Instructions */}
      {showIOSInstructions && (
        <div className="w-full mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl shadow-lg">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-blue-600 text-2xl">download</span>
                <h3 className="font-bold text-gray-900 text-base">Add to Home Screen</h3>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Install this app for quick access and offline use
              </p>
            </div>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                1
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm text-gray-800 font-medium">Tap the Share button</p>
                <p className="text-xs text-gray-600 mt-1">Look for the <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-200 rounded mx-1"><span className="material-symbols-outlined text-xs">ios_share</span></span> icon at the bottom of Safari</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                2
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm text-gray-800 font-medium">Scroll and tap "Add to Home Screen"</p>
                <p className="text-xs text-gray-600 mt-1">It's in the share menu options</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                3
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm text-gray-800 font-medium">Tap "Add" to confirm</p>
                <p className="text-xs text-gray-600 mt-1">The app will appear on your home screen</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Action Buttons */}
      <div className="w-full mb-10">
        {renderWalletButtons()}
      </div>

      {/* How to use info box */}
      <div className="w-full bg-white p-6 rounded-3xl border border-gray-100 text-left mb-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-500 text-xl font-bold">info</span>
          </div>
          <h4 className="font-bold text-gray-900">How to use</h4>
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">
          Add this card to your mobile wallet for quick access without an internet connection. Simply show the QR code to the cashier when making a purchase.
        </p>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="text-sm text-gray-500 hover:text-gray-700 underline"
      >
        Sign Out
      </button>

      {/* Notification permission modal after signup */}
      {showNotificationModal && restaurantId && onNotificationComplete && (
        <NotificationPermissionModal
          customerId={userId}
          restaurantId={restaurantId}
          onComplete={onNotificationComplete}
          onSkip={onNotificationComplete}
        />
      )}
    </div>
  );
};

export default SuccessScreen;
