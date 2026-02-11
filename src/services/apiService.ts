/**
 * API Service
 * Handles communication with the backend server
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface CreateUserRequest {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
  restaurantId?: string;
}

export interface UserResponse {
  _id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: string[];
}

export type ApiError = {
  message: string;
  status?: number;
  errors?: string[];
};

/**
 * Create a new user
 */
export const createUser = async (userData: CreateUserRequest): Promise<UserResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        message: result.message || 'Failed to create user',
        status: response.status,
        errors: result.errors,
      };
      throw error;
    }

    if (!result.success) {
      throw new Error(result.message || 'Failed to create user');
    }

    // Normalize response: backend uses data with "id" (not _id); support data/customer/user or top-level
    const raw = result.data ?? result.customer ?? result.user ?? result;
    const id = raw._id ?? raw.id;
    if (!id) {
      throw new Error(result.message || 'Failed to create user');
    }
    const user: UserResponse = {
      _id: String(id),
      name: String(raw.name ?? ''),
      email: String(raw.email ?? ''),
      phone: String(raw.phone ?? ''),
      dateOfBirth: typeof raw.dateOfBirth === 'string' ? raw.dateOfBirth : '',
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
    };
    return user;
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw {
      message: error instanceof Error ? error.message : 'Network error occurred',
      status: 0,
    } as ApiError;
  }
};

/**
 * Get customer by ID
 */
export const getCustomerById = async (customerId: string): Promise<UserResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result: ApiResponse<UserResponse> = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        message: result.message || 'Failed to fetch customer',
        status: response.status,
      };
      throw error;
    }

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to fetch customer');
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw {
      message: error instanceof Error ? error.message : 'Network error occurred',
      status: 0,
    } as ApiError;
  }
};

/**
 * Get user by ID (legacy - use getCustomerById instead)
 */
export const getUserById = getCustomerById;

export interface RestaurantResponse {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  userId?: string;
  signupPageConfig?: {
    headerImage?: string;
    welcomeTitle?: string;
    description?: string;
    formFields?: {
      fullName: boolean;
      birthday: boolean;
      email: boolean;
      phone: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Get restaurant by ID
 */
export const getRestaurantById = async (restaurantId: string): Promise<RestaurantResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/restaurants/${restaurantId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result: ApiResponse<RestaurantResponse> = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        message: result.message || 'Failed to fetch restaurant',
        status: response.status,
      };
      throw error;
    }

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to fetch restaurant');
    }

    return result.data;
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw {
      message: error instanceof Error ? error.message : 'Network error occurred',
      status: 0,
    } as ApiError;
  }
};

