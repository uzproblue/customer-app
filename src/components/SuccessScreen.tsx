
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AppleLogo, GoogleWalletIcon, CoffeeIcon } from './Icons';
import { addToAppleWallet, addToGoogleWallet, type PassData, type WalletError } from '../services/walletService';
import { updatePushSubscription, getNotificationPermission } from '../services/notificationService';
import { useRestaurant } from '../contexts/RestaurantContext';
import { saveSession, clearSession } from '../services/sessionService';

interface SuccessScreenProps {
  name: string;
  userId: string;
  onReset: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ name, userId, onReset }) => {
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
  const { restaurantId } = useRestaurant();

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
        cardTitle: 'Coffee Rewards',
        cardDescription: 'Loyalty Member Card'
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

      {/* Loyalty Card Visual */}
      <div className="w-full relative aspect-[1/1] bg-[#0052cc] rounded-[32px] p-8 pb-16 text-white flex flex-col justify-between mb-8 shadow-2xl shadow-blue-200 overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none"></div>
        <div className="flex justify-between items-start relative z-10">
          <div className="text-left">
            <p className="text-[10px] font-bold tracking-[0.2em] opacity-80 mb-1">MEMBER CARD</p>
            <h3 className="text-2xl font-bold tracking-tight">Coffee Rewards</h3>
          </div>
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
            <CoffeeIcon className="w-6 h-6" />
          </div>
        </div>
        
        <div className="flex justify-center py-4  relative z-10">
          <div className="bg-white rounded-2xl w-full h-[85%] flex items-center p-8 justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-500">
            <QRCodeSVG 
              value={userId}
              size={256}
              level="H"
              includeMargin={false}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default SuccessScreen;
