import { authApi } from './axios/instance';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  fullName: string;
  phone: string;
  role: string;
}

export const authService = {
  login: async (data: LoginData) => {
    const response = await authApi.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await authApi.post('/auth/register', data);
    return response.data;
  },

  verifyOtp: async (data: { email: string; otp: string; newPassword?: string }) => {
    const response = await authApi.post('/auth/verify-otp', data);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await authApi.post('/auth/forgot-password', { email });
    return response.data;
  },

  googleAuth: async (credential: string) => {
    const response = await authApi.post('/auth/google-login', { credential });
    return response.data;
  },

  resendOtp: async (email: string) => {
    const response = await authApi.post('/auth/send-otp', { email });
    return response.data;
  },
  
  verifyLoginOtp: async (email: string, otp: string) => {
    const response = await authApi.post('/auth/verify-login-otp', { email, otp });
    return response.data;
  },
  
  refreshToken: async (refreshToken: string) => {
    const response = await authApi.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },
  
  logout: async (userId: string) => {
    const response = await authApi.post('/auth/logout', { userId });
    return response.data;
  },

  verifyToken: async (token: string) => {
    const response = await authApi.post('/auth/verify-token', { token });
    return response.data;
  },

  verifyPartnerToken: async (email: string) => {
    const response = await authApi.post('/auth/verify-partner-token', { email });
    return response.data;
  },

  createTempToken: async (userId: string) => {
    const response = await authApi.post('/auth/temp-token', { userId });
    return response.data;
  }
}; 