/**
 * Restaurant Context Utilities
 * Handles restaurant ID extraction and validation from URL path
 */

/**
 * Extract restaurant ID from URL path
 * Expected format: /restaurant-123 or /:restaurantId
 */
export const extractRestaurantIdFromPath = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const restaurantId = pathParts[0] || null;

  return restaurantId;
};

/**
 * Validate restaurant ID format
 * Basic validation - can be enhanced based on your restaurant ID format
 */
export const validateRestaurantId = (restaurantId: string | null): boolean => {
  if (!restaurantId) {
    return false;
  }

  // Basic validation: non-empty string, no special characters that could break URLs
  // Adjust this regex based on your restaurant ID format
  const restaurantIdRegex = /^[a-zA-Z0-9_-]+$/;
  return restaurantIdRegex.test(restaurantId) && restaurantId.length > 0;
};

/**
 * Get restaurant ID from environment or URL
 * Falls back to environment variable if not in URL
 */
export const getRestaurantId = (): string | null => {
  const fromPath = extractRestaurantIdFromPath();
  if (fromPath && validateRestaurantId(fromPath)) {
    return fromPath;
  }

  // Fallback to environment variable
  const fromEnv = import.meta.env.VITE_RESTAURANT_ID;
  if (fromEnv && validateRestaurantId(fromEnv)) {
    return fromEnv;
  }

  return null;
};
