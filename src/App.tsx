import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import Footer from "./components/Footer";
import SignupCard from "./components/SignupCard";
import SuccessScreen from "./components/SuccessScreen";
import RestaurantError from "./components/RestaurantError";
import { RestaurantProvider, useRestaurant } from "./contexts/RestaurantContext";
import { updatePushSubscription, getNotificationPermission } from "./services/notificationService";
import { getSession, saveSession } from "./services/sessionService";
import { getCustomerById } from "./services/apiService";

const MainApp: React.FC = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const { restaurantId, isValid, isLoading } = useRestaurant();

  const handleSignup = (name: string, id: string) => {
    setUserName(name);
    setUserId(id);
    setIsSuccess(true);
  };

  // Restore user session on app load
  useEffect(() => {
    const restoreSession = async () => {
      if (!restaurantId || !isValid || isLoading) {
        setIsLoadingSession(false);
        return;
      }

      try {
        const session = getSession();
        
        if (session) {
          // Verify session is for current restaurant
          if (session.restaurantId === restaurantId) {
            // Verify customer still exists in database
            try {
              const customer = await getCustomerById(session.customerId);
              
              // Session is valid, restore it
              setUserName(customer.name);
              setUserId(customer._id);
              setIsSuccess(true);
              
              // Update session with latest data
              saveSession({
                customerId: customer._id,
                name: customer.name,
                email: customer.email,
                restaurantId: restaurantId,
                createdAt: session.createdAt
              });
              
              // Update push subscription if permission granted
              const permission = getNotificationPermission();
              if (permission === 'granted') {
                updatePushSubscription(customer._id, restaurantId).catch(err => {
                  console.warn('Background push subscription update failed:', err);
                });
              }
            } catch (error) {
              // Customer not found or invalid, clear session
              console.warn('Session invalid, clearing:', error);
              const { clearSession } = await import('./services/sessionService');
              clearSession();
            }
          } else {
            // Different restaurant, clear old session
            const { clearSession } = await import('./services/sessionService');
            clearSession();
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
      } finally {
        setIsLoadingSession(false);
      }
    };

    restoreSession();
  }, [restaurantId, isValid, isLoading]);

  // Show loading state while checking restaurant or restoring session
  if (isLoading || isLoadingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-light">
        <div className="text-center">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if restaurant ID is invalid
  if (!isValid || !restaurantId) {
    return <RestaurantError />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <main className="flex-grow flex flex-col items-center justify-start pt-12 px-6 pb-12">
        <div className="w-full max-w-[480px]">
          {isSuccess ? (
            <SuccessScreen
              name={userName}
              userId={userId}
              onReset={() => setIsSuccess(false)}
            />
          ) : (
            <SignupCard onSignup={handleSignup} restaurantId={restaurantId} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

const RestaurantRoute: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  
  return (
    <RestaurantProvider restaurantId={restaurantId || null}>
      <MainApp />
    </RestaurantProvider>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/:restaurantId" element={<RestaurantRoute />} />
      <Route path="/" element={<Navigate to="/default" replace />} />
      <Route path="*" element={<RestaurantError />} />
    </Routes>
  );
};

export default App;
