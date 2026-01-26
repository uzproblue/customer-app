
import React, { useState } from 'react';
import { createUser } from '../services/apiService';
import type { ApiError } from '../services/apiService';
import NotificationPermissionModal from './NotificationPermissionModal';
import { saveSession } from '../services/sessionService';
import { useRestaurant } from '../contexts/RestaurantContext';

interface SignupCardProps {
  onSignup: (name: string, userId: string) => void;
  restaurantId: string;
}

const SignupCard: React.FC<SignupCardProps> = ({ onSignup, restaurantId }) => {
  const { restaurant } = useRestaurant();
  const brandingConfig = restaurant?.signupPageConfig;
  
  // Default values for branding
  const headerImage = brandingConfig?.headerImage || '';
  const welcomeTitle = brandingConfig?.welcomeTitle || 'Join our rewards program';
  const description = brandingConfig?.description || 'Earn points for every purchase and unlock exclusive rewards. It\'s free and easy to join!';
  const formFields = brandingConfig?.formFields || {
    fullName: true,
    birthday: true,
    email: true,
    phone: false,
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  // Convert MM/DD/YYYY to YYYY-MM-DD
  const convertDateFormat = (dateStr: string): string => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate based on visible fields
    const requiredFields: string[] = [];
    if (formFields.fullName && !formData.name) requiredFields.push('Full Name');
    if (formFields.email && !formData.email) requiredFields.push('Email');
    if (formFields.phone && !formData.phone) requiredFields.push('Phone');
    if (formFields.birthday && !formData.dateOfBirth) requiredFields.push('Birthday');

    if (requiredFields.length > 0) {
      setError(`Please fill in: ${requiredFields.join(', ')}`);
      return;
    }

    // Validate date format (MM/DD/YYYY)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (formFields.birthday && formData.dateOfBirth && !dateRegex.test(formData.dateOfBirth)) {
      setError('Please enter a valid date (MM/DD/YYYY)');
      return;
    }

    setLoading(true);

    try {
      const userResponse = await createUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formFields.birthday ? convertDateFormat(formData.dateOfBirth) : '',
        restaurantId: restaurantId,
      });
      
      // Save session immediately
      saveSession({
        customerId: userResponse._id,
        name: userResponse.name,
        email: userResponse.email,
        restaurantId: restaurantId,
        createdAt: userResponse.createdAt || new Date().toISOString()
      });
      
      // Set the registered user ID and show notification modal
      setRegisteredUserId(userResponse._id);
      setShowNotificationModal(true);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors && apiError.errors.length > 0) {
        setError(apiError.errors.join(', '));
      } else {
        setError(apiError.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header Image */}
      <div
        className="h-40 w-full bg-gray-200 bg-center bg-cover flex items-end"
        style={headerImage ? { backgroundImage: `url(${headerImage})` } : {}}
      >
        <div className="w-full h-1/2 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      {/* Content Card */}
      <div className="bg-white dark:bg-[#191919] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-[#333] -mt-6 flex flex-col items-center text-center">
        <h3 className="text-lg font-bold text-primary dark:text-white mb-2 leading-tight">{welcomeTitle}</h3>
        <p className="text-xs text-[#757575] dark:text-gray-400 mb-6 leading-relaxed">{description}</p>
        
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {formFields.fullName && (
            <div className="space-y-1 text-left">
              <label htmlFor="name" className="text-[10px] font-bold text-[#757575] uppercase tracking-wider ml-1">Full Name</label>
              <input
                id="name"
                type="text"
                required={formFields.fullName}
                className="w-full bg-gray-50  border-none rounded-lg text-xs py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}

          {formFields.birthday && (
            <div className="space-y-1 text-left">
              <label htmlFor="dateOfBirth" className="text-[10px] font-bold text-[#757575] uppercase tracking-wider ml-1">Birthday</label>
              <input
                id="dateOfBirth"
                type="text"
                required={formFields.birthday}
                className="w-full bg-gray-50 border-none rounded-lg text-xs py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                placeholder="MM/DD/YYYY"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
          )}

          {formFields.email && (
            <div className="space-y-1 text-left">
              <label htmlFor="email" className="text-[10px] font-bold text-[#757575] uppercase tracking-wider ml-1">Email Address</label>
              <input
                id="email"
                type="email"
                required={formFields.email}
                className="w-full bg-gray-50  border-none rounded-lg text-xs py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          )}

          {formFields.phone && (
            <div className="space-y-1 text-left">
              <label htmlFor="phone" className="text-[10px] font-bold text-[#757575] uppercase tracking-wider ml-1">Phone Number</label>
              <input
                id="phone"
                type="tel"
                required={formFields.phone}
                className="w-full bg-gray-50 border-none rounded-lg text-xs py-3 px-4 focus:ring-1 focus:ring-primary outline-none"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary dark:bg-white text-white dark:text-primary font-bold text-sm py-3 rounded-lg shadow-lg shadow-primary/10 mt-2 hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Create Account'
            )}
          </button>

          <p className="text-[10px] text-[#757575] mt-4">
            By signing up you agree to our Terms of Service
          </p>
      </form>

      {/* Notification Permission Modal */}
      {showNotificationModal && registeredUserId && (
        <NotificationPermissionModal
          customerId={registeredUserId}
          restaurantId={restaurantId}
          onComplete={() => {
            setShowNotificationModal(false);
            onSignup(formData.name, registeredUserId);
          }}
          onSkip={() => {
            setShowNotificationModal(false);
            onSignup(formData.name, registeredUserId);
          }}
        />
      )}
      </div>
    </div>
  );
};

export default SignupCard;
