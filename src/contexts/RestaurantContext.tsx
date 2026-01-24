import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { validateRestaurantId } from '../utils/restaurantContext';
import { getRestaurantById } from '../services/apiService';

interface RestaurantContextType {
  restaurantId: string | null;
  isValid: boolean;
  isLoading: boolean;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

interface RestaurantProviderProps {
  children: ReactNode;
  restaurantId: string | null;
}

export const RestaurantProvider: React.FC<RestaurantProviderProps> = ({ children, restaurantId }) => {
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRestaurant = async () => {
      if (!restaurantId) {
        setIsValid(false);
        setIsLoading(false);
        return;
      }

      // First check format
      if (!validateRestaurantId(restaurantId)) {
        setIsValid(false);
        setIsLoading(false);
        return;
      }

      // Then check if restaurant exists in database
      try {
        console.log('Checking restaurant:', restaurantId);
        await getRestaurantById(restaurantId);
        setIsValid(true);
      } catch (error) {
        console.error('Restaurant validation error:', error);
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkRestaurant();
  }, [restaurantId]);

  return (
    <RestaurantContext.Provider value={{ restaurantId, isValid, isLoading }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = (): RestaurantContextType => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
