
import React, { useState } from 'react';
import { createUser } from '../services/apiService';
import type { ApiError } from '../services/apiService';
import NotificationPermissionModal from './NotificationPermissionModal';
import { saveSession } from '../services/sessionService';

interface SignupCardProps {
  onSignup: (name: string, userId: string) => void;
  restaurantId: string;
}

const SignupCard: React.FC<SignupCardProps> = ({ onSignup, restaurantId }) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name || !formData.email || !formData.phone || !formData.dateOfBirth) {
      setError('Please fill in all fields');
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.dateOfBirth)) {
      setError('Please enter a valid date (YYYY-MM-DD)');
      return;
    }

    setLoading(true);

    try {
      const userResponse = await createUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
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
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full animate-slide-up">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-semibold text-primary ml-1">Full Name</label>
          <input
            id="name"
            type="text"
            required
            className="w-full h-14 px-4 rounded-xl border border-gray-200 bg-white text-primary focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-400"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-primary ml-1">Email Address</label>
          <input
            id="email"
            type="email"
            required
            className="w-full h-14 px-4 rounded-xl border border-gray-200 bg-white text-primary focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-400"
            placeholder="name@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-semibold text-primary ml-1">Mobile Number</label>
          <input
            id="phone"
            type="tel"
            required
            className="w-full h-14 px-4 rounded-xl border border-gray-200 bg-white text-primary focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-400"
            placeholder="+1 (555) 000-0000"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="dateOfBirth" className="text-sm font-semibold text-primary ml-1">Date of Birth</label>
          <input
            id="dateOfBirth"
            type="date"
            required
            className="w-full h-14 px-4 rounded-xl border border-gray-200 bg-white text-primary focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-400"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full h-14 bg-primary text-white rounded-xl font-bold text-lg hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Create My Card
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-gray-400 text-center leading-relaxed px-4">
          By signing up, you agree to Artisan Roasters' <a href="#" className="underline hover:text-gray-600">Terms</a> and <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>. We'll send you updates on your points.
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
  );
};

export default SignupCard;
