const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Makes an authenticated fetch request to the API
 * @param endpoint - API endpoint (without the base URL)
 * @param options - fetch options
 * @returns Promise with the response data
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  console.log(`Making API request to: ${url}`);
  
  // Get the token from localStorage (only available on client side)
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
    console.log('Token available:', !!token);
  }

  // Create headers with auth token if available
  const headers = new Headers(options.headers);
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Create the request with updated headers
  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Include cookies for JWT auth
  };

  console.log('Request config:', {
    method: config.method,
    headers: Object.fromEntries(headers.entries()),
    hasBody: !!config.body
  });

  try {
    const response = await fetch(url, config);
    console.log(`Response status: ${response.status}`);
    
    // Handle unauthorized errors (expired token, etc.)
    if (response.status === 401) {
      // If running on client, redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Use router for navigation instead of direct window.location change
        // This will be handled by the calling component
        return Promise.reject('Unauthorized');
      }
    }
    
    // Handle other status codes
    if (!response.ok) {
      const error = await response.text();
      console.error(`API error: ${error}`);
      return Promise.reject(new Error(error));
    }
    
    // Return parsed JSON or empty object for 204 responses
    if (response.status !== 204) {
      const data = await response.json();
      console.log('Response data:', data);
      return data;
    }
    
    return {} as T;
  } catch (error) {
    console.error('API request error:', error);
    return Promise.reject(error);
  }
} 

// Helper methods for different HTTP verbs
export const apiHelpers = {
  /**
   * GET request to API
   * @param endpoint - API endpoint
   * @param options - Additional fetch options
   * @returns Promise with the response data
   */
  get: <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    return apiClient<T>(endpoint, { ...options, method: 'GET' });
  },
  
  /**
   * POST request to API
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @param options - Additional fetch options
   * @returns Promise with the response data
   */
  post: <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> => {
    return apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  /**
   * PATCH request to API
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @param options - Additional fetch options
   * @returns Promise with the response data
   */
  patch: <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> => {
    return apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  /**
   * PUT request to API
   * @param endpoint - API endpoint
   * @param data - Request body data
   * @param options - Additional fetch options
   * @returns Promise with the response data
   */
  put: <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> => {
    return apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  /**
   * DELETE request to API
   * @param endpoint - API endpoint
   * @param options - Additional fetch options
   * @returns Promise with the response data
   */
  delete: <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
  },
}; 