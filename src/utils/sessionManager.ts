import { store } from '../Redux/store';
import { loginSuccess, logout } from '../Redux/slices/authSlice';
import { setEmailId, setDriverData, clearDriverData } from '../Redux/slices/driverSlice';
import axios from 'axios';
import { authService } from '../services/auth.service';

export const sessionManager = {
  setSession(user: any, token: string, refreshToken: string) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userData', JSON.stringify(user));
    store.dispatch(loginSuccess({ user, token, refreshToken }));
  },

  getSession() {
    const token = localStorage.getItem('authToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const user = JSON.parse(localStorage.getItem('userData') || 'null');
    return { token, refreshToken, user };
  },

  clearSession() {
    try {
      // Try to logout from server if user ID is available
      const userData = JSON.parse(localStorage.getItem('userData') || 'null');
      if (userData?.userId) {
        // Don't wait for this to complete
        authService.logout(userData.userId).catch(err => console.error('Logout error:', err));
      }
      
      // Clear all auth-related storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      sessionStorage.clear();
      
      // Clear Redux state
      store.dispatch(logout());
      
      // Clear any other auth-related data
      document.cookie.split(";").forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
    } catch (error) {
      console.error('Error during session cleanup:', error);
      throw error;
    }
  },

  setTempSession(user: any, token: string) {
    sessionStorage.setItem('tempToken', token);
    sessionStorage.setItem('pendingUser', JSON.stringify(user));
  },

  getTempSession() {
    const token = sessionStorage.getItem('tempToken');
    const user = JSON.parse(sessionStorage.getItem('pendingUser') || 'null');
    return { token, user };
  },

  clearTempSession() {
    sessionStorage.removeItem('tempToken');
    sessionStorage.removeItem('pendingUser');
  },

  async refreshAccessToken() {
    const { refreshToken, user } = this.getSession();
    
    if (!refreshToken || !user) {
      console.warn('No refresh token or user found in session');
      // Don't clear the session here - let the error handler decide
      return null;
    }
    
    try {
      console.log('Attempting to refresh access token with refresh token:', refreshToken.substring(0, 15) + '...');
      
      const response = await authService.refreshToken(refreshToken);
      
      if (response.success) {
        console.log('Access token refreshed successfully');
        console.log('New token expiry details:', {
          userId: response.user.userId,
          email: response.user.email,
          role: response.user.role
        });
        
        // Store the new tokens
        this.setSession(
          response.user, 
          response.token, 
          response.refreshToken
        );
        return response.token;
      } else {
        console.warn('Token refresh failed:', response.error || 'Unknown error');
        
        // Only clear session for specific error types
        if (response.errorCode === 'REFRESH_TOKEN_EXPIRED' || 
            response.errorCode === 'REFRESH_TOKEN_INVALID' ||
            response.errorCode === 'REFRESH_TOKEN_MISMATCH') {
          console.log('Clearing session due to invalid refresh token');
          this.clearSession();
        }
        return null;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      
      // Check if it's a network error - if so, don't clear session yet
      if (axios.isAxiosError(error) && !error.response) {
        console.warn('Network error during token refresh, keeping session');
        return null;
      }
      
      // Check for specific HTTP status codes
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        // Only clear session for auth errors
        if (status === 401 || status === 403) {
          console.log(`Clearing session due to ${status} response`);
          this.clearSession();
        }
        return null;
      }
      
      // For other errors, keep the session intact
      return null;
    }
  },

  async refreshDriverToken() {
    const { driverData, token } = this.getDriverSession();
    
    if (!driverData?.refreshToken) {
      console.warn('No refresh token found in driver session');
      return null;
    }
    
    try {
      console.log('Attempting to refresh driver token with refresh token:', 
        driverData.refreshToken.substring(0, 15) + '...');
      
      const response = await authService.refreshToken(driverData.refreshToken);
      
      if (response.success) {
        console.log('Driver token refreshed successfully');
        console.log('New driver token expiry details:', {
          userId: response.user.userId,
          email: response.user.email,
          role: response.user.role
        });
        
        this.setDriverSession(response.token, {
          ...driverData,
          refreshToken: response.refreshToken
        });
        return response.token;
      } else {
        console.warn('Driver token refresh failed:', response.error || 'Unknown error');
        
        // Only clear session for specific error types
        if (response.errorCode === 'REFRESH_TOKEN_EXPIRED' || 
            response.errorCode === 'REFRESH_TOKEN_INVALID' ||
            response.errorCode === 'REFRESH_TOKEN_MISMATCH') {
          console.log('Clearing driver session due to invalid refresh token');
          this.clearDriverSession();
        }
        return null;
      }
    } catch (error) {
      console.error('Failed to refresh driver token:', error);
      
      // Check if it's a network error - if so, don't clear session yet
      if (axios.isAxiosError(error) && !error.response) {
        console.warn('Network error during driver token refresh, keeping session');
        return null;
      }
      
      // Check for specific HTTP status codes
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        // Only clear session for auth errors
        if (status === 401 || status === 403) {
          console.log(`Clearing driver session due to ${status} response`);
          this.clearDriverSession();
        }
        return null;
      }
      
      // For other errors, keep the session intact
      return null;
    }
  },

  async verifyToken() {
    const { token, user } = this.getSession();
    
    if (!token || !user) return false;

    try {
      // Use auth service to verify token
      const authResponse = await authService.verifyToken(token);
      
      if (!authResponse.success) {
        // Try to refresh the token
        const newToken = await this.refreshAccessToken();
        return !!newToken;
      }

      // Then get latest user data from user service
      const userResponse = await axios.get(`http://localhost:3002/api/users/${user.userId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
console.log('userResponse:', userResponse.data);

      if (userResponse.data.success) {
        // Get the current refresh token
        const { refreshToken } = this.getSession();
        
        // Update session with latest user data
        this.setSession({ ...user, ...userResponse.data.user }, token, refreshToken || '');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token verification failed:', error);
      
      // Try to refresh the token
      const newToken = await this.refreshAccessToken();
      return !!newToken;
    }
  },

  async verifyPartnerToken() {
    const { token, driverData } = this.getDriverSession();
    console.log('Verifying partner token:', token);
    console.log('Driver data:', driverData);
    
    
    if (!token || !driverData) return false;

    try {
      // Use auth service to verify partner token
      const authResponse = await authService.verifyPartnerToken( driverData.email);
      
      if (!authResponse.success) {
        // Try to refresh the token
        const newToken = await this.refreshDriverToken();
        return !!newToken;
      }

      // Check the partner's data in the partner service
      const partnerResponse = await axios.get(`http://localhost:3003/api/drivers/${driverData.partnerId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (partnerResponse.data.success) {
        // Update driver session with latest data
        this.setDriverSession(token, {
          ...driverData,
          ...partnerResponse.data.driver
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Partner token verification failed:', error);
      
      // Try to refresh the token
      const newToken = await this.refreshDriverToken();
      return !!newToken;
    }
  },

  logout() {
    this.clearSession();
    window.location.href = '/admin';
  },

  setDriverSession(token: string, driverData: any) {
    localStorage.setItem('driverToken', token);
    localStorage.setItem('driverData', JSON.stringify(driverData));
    store.dispatch(setDriverData({ driverData, token,driverDetails:'' }));
  },

  getDriverSession() {
    const token = localStorage.getItem('driverToken');
    const driverData = JSON.parse(localStorage.getItem('driverData') || 'null');
    return { token, driverData };
  },

  clearDriverSession() {
    try {
      localStorage.removeItem('driverToken');
      localStorage.removeItem('driverData');
      sessionStorage.clear();
      
      store.dispatch(clearDriverData());
      
      document.cookie.split(";").forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
    } catch (error) {
      console.error('Error during session cleanup:', error);
      throw error;
    }
  },

  isDriverAuthenticated() {
    const token = localStorage.getItem('driverToken');
    return !!token;
  },

  isAdminAuthenticated() {
    const { token, user } = this.getSession();
    return token && user?.role === 'admin';
  }
};

window.addEventListener('storage', (e) => {
  if (e.key === 'authToken' && !e.newValue) {
    store.dispatch(logout());
    window.location.href = '/login';
  }
});

window.addEventListener('storage', (e) => {
  if (e.key === 'driverToken' && !e.newValue) {
    store.dispatch(clearDriverData());
    window.location.href = '/partner/login';
  }
});