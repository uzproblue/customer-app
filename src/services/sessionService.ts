/**
 * Session Service
 * Manages user session persistence in localStorage
 */

export interface UserSession {
  customerId: string;
  name: string;
  email: string;
  restaurantId: string;
  createdAt: string;
}

const SESSION_KEY = 'customerSession';

/**
 * Save user session to localStorage
 */
export const saveSession = (session: UserSession): void => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

/**
 * Get user session from localStorage
 */
export const getSession = (): UserSession | null => {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) {
      return null;
    }
    return JSON.parse(sessionData) as UserSession;
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
};

/**
 * Clear user session from localStorage
 */
export const clearSession = (): void => {
  try {
    localStorage.removeItem(SESSION_KEY);
    // Also clear the old customerId key for backward compatibility
    localStorage.removeItem('customerId');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

/**
 * Check if a session exists
 */
export const hasSession = (): boolean => {
  return getSession() !== null;
};

/**
 * Update session data (partial update)
 */
export const updateSession = (updates: Partial<UserSession>): void => {
  const currentSession = getSession();
  if (currentSession) {
    saveSession({ ...currentSession, ...updates });
  }
};
