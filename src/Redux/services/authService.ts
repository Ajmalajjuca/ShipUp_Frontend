// src/Redux/services/authService.ts
import axios from 'axios';
import { loginSuccess, logout, restoreSessionStart, restoreSessionEnd } from '../slices/authSlice';
import { AppDispatch } from '../store';

export const restoreSession = async (dispatch: AppDispatch) => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const pendingUser = localStorage.getItem('pendingUser');
  const refreshToken = localStorage.getItem('refreshToken');
  

  dispatch(restoreSessionStart());

  if (token && storedUser) {
    try {
      const response = await axios.get('http://localhost:3001/auth/protected', {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch(loginSuccess({ user: JSON.parse(storedUser), token, refreshToken: refreshToken || '' }));
    } catch (error) {
      console.error('Token validation failed:', error);
      dispatch(logout());
    }
  } else if (token && pendingUser) {
    // If user is pending OTP verification, do not log them in yet
    console.log('Pending OTP verification for user:', pendingUser);
  }

  dispatch(restoreSessionEnd());
};

export const logoutUser = (dispatch: AppDispatch) => {
  dispatch(logout());
};