import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { validateRestaurantId } from '../utils/restaurantContext';
import { getRestaurantById, type RestaurantResponse } from '../services/apiService';

interface RestaurantContextType {
  restaurantId: string | null;
  restaurant: RestaurantResponse | null;
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
  const [restaurant, setRestaurant] = useState<RestaurantResponse | null>(null);

  useEffect(() => {
    const checkRestaurant = async () => {
      if (!restaurantId) {
        setIsValid(false);
        setIsLoading(false);
        setRestaurant(null);
        return;
      }

      // First check format
      if (!validateRestaurantId(restaurantId)) {
        setIsValid(false);
        setIsLoading(false);
        setRestaurant(null);
        return;
      }

      // Then check if restaurant exists in database and fetch data
      try {
        console.log('Checking restaurant:', restaurantId);
        const restaurantData = await getRestaurantById(restaurantId);
        setRestaurant(restaurantData);
        setIsValid(true);
      } catch (error) {
        console.error('Restaurant validation error:', error);
        setIsValid(false);
        setRestaurant(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkRestaurant();
  }, [restaurantId]);

  return (
    <RestaurantContext.Provider value={{ restaurantId, restaurant, isValid, isLoading }}>
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
