import axios from 'axios';
import { sessionManager } from '../../utils/sessionManager';
import { toast } from 'react-hot-toast';
import { store } from '../../Redux/store';
import { updateToken } from '../../Redux/slices/authSlice';
import { jwtDecode } from 'jwt-decode';

// Create a single Axios instance for the API Gateway
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to track if a refresh is in progress
let isRefreshing = false;
// Queue of requests to retry after token refresh
let refreshSubscribers: Array<(token: string) => void> = [];

// Function to add callbacks to the queue
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Function to process the queue with a new token
const onTokenRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

// Function to check if token needs refresh (less than 3 minutes remaining)
const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const decodedToken: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    // If token doesn't have an expiry, assume it's valid
    if (!decodedToken.exp) {
      console.log('Token has no expiration');
      return false;
    }

    const timeRemaining = decodedToken.exp - currentTime;
    console.log(`Token expires in ${timeRemaining.toFixed(0)} seconds`);

    // DEBUG: Show actual expiration time in human-readable format
    const expirationDate = new Date(decodedToken.exp * 1000);
    console.log(`Token expires at: ${expirationDate.toLocaleString()}`);

    // If token expires in less than 180 seconds (3 minutes), refresh it
    return timeRemaining < 180;
  } catch (error) {
    console.error('Error decoding token:', error);
    // If we can't decode the token, assume it needs refresh
    return true;
  }
};

// Request interceptor
const requestInterceptor = async (config: any) => {
  // Skip token refresh for refresh-token requests to avoid loops
  if (config.url?.includes('/auth/refresh-token')) {
    console.log('Skipping token refresh for refresh-token request');
    return config;
  }

  console.log(`Request to: ${config.method?.toUpperCase()} ${config.url}`);

  // Check for partner session first
  const partnerSession = sessionManager.getDriverSession();
  if (partnerSession.token) {
    console.log('Using driver session token');
    console.log(`Driver token: ${partnerSession.token}`);
    console.log(`Driver refresh token: ${partnerSession.driverData?.refreshToken}`);
    console.log(`Driver token expiration: ${isTokenExpiringSoon(partnerSession.token)}`);
    console.log('isRefreshing:', isRefreshing);

    // Check if driver token is expiring soon
    if (isTokenExpiringSoon(partnerSession.token) && partnerSession.driverData?.refreshToken) {
      if (isRefreshing) {
        console.log('Token refresh already in progress, waiting...');
      } else {
        console.log('Driver token expiring soon, attempting refresh');
        try {
          isRefreshing = true;
          const response = await api.post('/auth/refresh-token', {
            refreshToken: partnerSession.driverData.refreshToken,
          });

          if (response.data.success) {
            console.log('Driver token refreshed successfully');
            const { token, refreshToken } = response.data;

            // Update the driver session
            sessionManager.setDriverSession(token, {
              ...partnerSession.driverData,
              refreshToken,
            });

            // Update the authorization header with the new token
            config.headers.Authorization = `Bearer ${token}`;

            // Mark refresh as complete
            isRefreshing = false;
          } else {
            console.log('Driver token refresh failed:', response.data.error);
            isRefreshing = false;
          }
        } catch (error) {
          console.error('Error refreshing driver token:', error);
          isRefreshing = false;
        }
      }
    } else {
      // Use existing token
      config.headers.Authorization = `Bearer ${partnerSession.token}`;
    }
    return config;
  }

  // Fall back to regular session
  const { token, refreshToken } = sessionManager.getSession();
  if (token) {
    console.log('Using user session token');
    console.log(`User token: ${token}`);
    console.log(`User refresh token: ${refreshToken}`);
    console.log(`User token expiration: ${isTokenExpiringSoon(token)}`);
    console.log('isRefreshing:', isRefreshing);

    if (isTokenExpiringSoon(token) && refreshToken) {
      if (isRefreshing) {
        console.log('Token refresh already in progress, waiting...');
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            console.log('Using newly refreshed token for request');
            config.headers.Authorization = `Bearer ${newToken}`;
            resolve(config);
          });
        });
      }

      try {
        console.log('User token expiring soon, attempting refresh');
        isRefreshing = true;

        const response = await api.post('/auth/refresh-token', { refreshToken });

        if (response.data.success) {
          console.log('User token refreshed successfully');
          const { token: newToken, refreshToken: newRefreshToken, user } = response.data;

          // Update the session
          sessionManager.setSession(user, newToken, newRefreshToken);

          // Update Redux store
          store.dispatch(
            updateToken({
              token: newToken,
              refreshToken: newRefreshToken,
            })
          );

          // Update the authorization header with the new token
          config.headers.Authorization = `Bearer ${newToken}`;

          // Process any queued requests
          onTokenRefreshed(newToken);

          isRefreshing = false;
        } else {
          console.warn('User token refresh failed:', response.data.error);
          isRefreshing = false;
        }
      } catch (error) {
        console.error('Error refreshing user token:', error);
        isRefreshing = false;
      }
    } else {
      console.log('Token not expiring soon, using existing token');
      config.headers.Authorization = `Bearer ${token}`;
    }
  } else {
    console.log('No token available for request');
  }
  return config;
};

// Response interceptor
const responseInterceptor = (response: any) => response;

// Error interceptor
const errorInterceptor = async (error: any) => {
  const originalRequest = error.config;
  console.log('Axios error interceptor:', {
    status: error.response?.status,
    url: originalRequest?.url,
    method: originalRequest?.method,
    responseData: error.response?.data,
  });

  // Skip error handling for login-related endpoints
  const loginRelatedEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/verify-otp',
    '/auth/verify-login-otp',
  ];
  if (originalRequest?.url && loginRelatedEndpoints.some((endpoint) => originalRequest.url.includes(endpoint))) {
    console.log('Skip token refresh for login-related endpoint:', originalRequest.url);
    return Promise.reject(error);
  }

  // Skip 400 errors for password issues
  if (error.response?.status === 400 && error.response?.data?.passwordError === true) {
    return Promise.reject(error);
  }

  // Skip 401 errors for password issues
  if (error.response?.status === 401 && error.response?.data?.passwordError === true) {
    return Promise.reject(error);
  }

  // Handle token expiration with refresh
  if (
    (error.response?.status === 401 || error.response?.status === 403) &&
    !originalRequest._retry &&
    !originalRequest.url.includes('/auth/refresh-token')
  ) {
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axios(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      console.log('Attempting token refresh after 401/403 error');
      const newToken = await sessionManager.refreshAccessToken();

      if (newToken) {
        console.log('Token refreshed successfully, retrying request');
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        onTokenRefreshed(newToken);
        isRefreshing = false;
        return axios(originalRequest);
      } else {
        console.log('Token refresh failed, redirecting to login');
        isRefreshing = false;
        sessionManager.clearSession();
        toast.error('Session expired. Please login again...');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    } catch (refreshError) {
      console.error('Error during token refresh:', refreshError);
      isRefreshing = false;
      sessionManager.clearSession();
      toast.error('Session expired. Please login again.');
      window.location.href = '/login';
      return Promise.reject(error);
    }
  }

  return Promise.reject(error);
};

// Apply interceptors to the single instance
api.interceptors.request.use(requestInterceptor);
api.interceptors.response.use(responseInterceptor, errorInterceptor);