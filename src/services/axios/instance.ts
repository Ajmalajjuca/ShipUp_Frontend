import axios from 'axios';
import { sessionManager } from '../../utils/sessionManager';
import { toast } from 'react-hot-toast';
import { store } from '../../Redux/store';
import { updateToken } from '../../Redux/slices/authSlice';
import { jwtDecode } from "jwt-decode";

// Create base instances for each microservice
export const authApi = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const userApi = axios.create({
  baseURL: 'http://localhost:3002/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const driverApi = axios.create({
  baseURL: 'http://localhost:3003',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add this new instance
export const partnerApi = axios.create({
  baseURL: 'http://localhost:3003',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add the orderApi instance after other API instances
export const orderApi = axios.create({
  baseURL: 'http://localhost:3004/api',
  headers: {
    'Content-Type': 'application/json'
  }
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
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

// Function to check if token needs refresh (less than 2 minutes remaining)
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
    
    // If token expires in less than 120 seconds (2 minutes), refresh it
    // This gives plenty of time to refresh before expiration
    return timeRemaining < 180;
  } catch (error) {
    console.error('Error decoding token:', error);
    // If we can't decode the token at all, it's likely invalid, so try to refresh
    return true;
  }
};

// Update the request interceptor to handle partner tokens and proactive token refresh
const requestInterceptor = async (config: any) => {
  // Skip token refresh for refresh-token requests to avoid loops
  if (config.url?.includes('/auth/refresh-token')) {
    console.log('Skipping token refresh for refresh-token request');
    return config;
  }
  
  // Debug the URL being requested
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
          const response = await authApi.post('/auth/refresh-token', { 
            refreshToken: partnerSession.driverData.refreshToken 
          });
          
          if (response.data.success) {
            console.log('Driver token refreshed successfully');
            const { token, refreshToken } = response.data;
            
            // Update the driver session
            sessionManager.setDriverSession(token, {
              ...partnerSession.driverData,
              refreshToken
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
    // Debug token information
    console.log('Using user session token');
    
    // Check if user token is expiring soon
    console.log(`User token: ${token}`);
    console.log(`User refresh token: ${refreshToken}`);
    console.log(`User token expiration: ${isTokenExpiringSoon(token)}`);
    console.log('isRefreshing:', isRefreshing);
    
    
    if (isTokenExpiringSoon(token) && refreshToken) {
      if (isRefreshing) {
        console.log('Token refresh already in progress, waiting...');
        // Wait for the refresh to complete
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
        
        const response = await authApi.post('/auth/refresh-token', { refreshToken });
        
        if (response.data.success) {
          console.log('User token refreshed successfully');
          const { token: newToken, refreshToken: newRefreshToken, user } = response.data;
          
          // Update the session
          sessionManager.setSession(
            user,
            newToken,
            newRefreshToken
          );
          
          // Update Redux store
          store.dispatch(updateToken({
            token: newToken,
            refreshToken: newRefreshToken
          }));
          
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
    responseData: error.response?.data
  });

  // Skip error handling for login-related endpoints
  const loginRelatedEndpoints = ['/auth/login', '/auth/register', '/auth/verify-otp','/auth/verify-login-otp'];
  if (originalRequest?.url && loginRelatedEndpoints.some(endpoint => originalRequest.url.includes(endpoint))) {
    console.log('Skip token refresh for login-related endpoint:', originalRequest.url);
    return Promise.reject(error);
  }

  // Skip 400 errors for password issues - these should not trigger logouts
  if (error.response?.status === 400 && 
      error.response?.data?.passwordError === true) {
    return Promise.reject(error);
  }

  // Also skip 401 errors for password issues
  if (error.response?.status === 401 && 
      error.response?.data?.passwordError === true) {
    return Promise.reject(error);
  }

  // Handle token expiration with refresh - respond to both 401 (Unauthorized) and 403 (Forbidden)
  if ((error.response?.status === 401 || error.response?.status === 403) && 
      !originalRequest._retry && 
      !originalRequest.url.includes('/auth/refresh-token')) {
    
    // If a refresh is already in progress, wait for it to complete and then retry
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
      // Try to refresh the token
      const newToken = await sessionManager.refreshAccessToken();
      
      if (newToken) {
        console.log('Token refreshed successfully, retrying request');
        // Update the request header and retry
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Process any queued requests
        onTokenRefreshed(newToken);
        
        isRefreshing = false;
        return axios(originalRequest);
      } else {
        console.log('Token refresh failed, redirecting to login');
        // If refresh fails, clear session and redirect to login
        isRefreshing = false;
        sessionManager.clearSession();
        toast.error('Session expired. Please login again...');
        // window.location.href = '/login';
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

// Apply interceptors to all instances including partnerApi and orderApi
[authApi, userApi, driverApi, partnerApi, orderApi].forEach(instance => {
  instance.interceptors.request.use(requestInterceptor);
  instance.interceptors.response.use(responseInterceptor, errorInterceptor);
}); 