import { driverApi, partnerApi } from './axios/instance';
import axios from 'axios';
import { sessionManager } from '../utils/sessionManager';

interface Driver {
  partnerId: string;
  fullName: string;
  email: string;
  phone: string;
  status: boolean;
}

interface DashboardStats {
  todayDeliveries: number;
  todayEarnings: number;
  weeklyDeliveries: number;
  weeklyEarnings: number;
  weeklyDeliveryTrend: number;
  weeklyEarningTrend: number;
}

interface PerformanceMetrics {
  onTimeDelivery: number;
  customerSatisfaction: number;
  orderAcceptance: number;
  period: string;
}

interface ActiveDelivery {
  orderId: string;
  destination: string;
  eta: number;
  status: 'pending' | 'in_progress' | 'completed';
  customerName: string;
  customerPhone: string;
}

interface DriverProfile {
  fullName: string;
  rating: number;
  totalDeliveries: number;
  memberSince: string;
  profileImage?: string;
  isOnline: boolean;
  phone: string;
  email: string;
  address?: string;
}

const PARTNER_SERVICE_URL = import.meta.env.VITE_PARTNER_SERVICE_URL || 'http://localhost:3003/api';

export const driverService = {
  getAllDrivers: async () => {
    const response = await driverApi.get('/api/drivers');
    return response.data;
  },

  getDriverById: async (id: string) => {
    const response = await driverApi.get(`/api/drivers/${id}`);
    return response.data;
  },

  getPartnerOrders: async (partnerId: string) => {
    try {
      const response = await driverApi.get(`/api/drivers/${partnerId}/orders`);
      return response.data;
    } catch (error) {
      console.error('Error fetching partner orders:', error);
      // Return mock data for demo purposes
      return {
        success: true,
        orders: [
          
        ]
      };
    }
  },

  updateDriverStatus: async (id: string, status: boolean) => {
    const response = await driverApi.put(`/api/drivers/${id}/status`, { status });
    return response.data;
  },

  updateDriver: async (id: string, data: Partial<Driver>) => {
    const response = await driverApi.put(`/api/drivers/${id}`, data);
    return response.data;
  },

  deleteDriver: async (id: string) => {
    const response = await driverApi.delete(`/api/drivers/${id}`);
    return response.data;
  },

  verifyDocument: async (id: string, field: string) => {
    const response = await driverApi.put(`/api/drivers/${id}/verification`, {
      [field]: true
    });
    return response.data;
  },

  checkVerificationStatus: async (email: string) => {
    const response = await partnerApi.get(`/api/drivers/verify-doc?email=${email}`);
    return response.data;
  },

  getDashboardStats: async (driverId: string): Promise<DashboardStats> => {
    const response = await driverApi.get(`/api/drivers/${driverId}/dashboard-stats`);
    return response.data;
  },

  getPerformanceMetrics: async (driverId: string, period: string): Promise<PerformanceMetrics> => {
    const response = await driverApi.get(`/api/drivers/${driverId}/performance?period=${period}`);
    return response.data;
  },

  getActiveDelivery: async (driverId: string): Promise<ActiveDelivery | null> => {
    const response = await driverApi.get(`/api/drivers/${driverId}/active-delivery`);
    return response.data.delivery;
  },

  getDriverProfile: async (driverId: string): Promise<DriverProfile> => {
    const response = await driverApi.get(`/api/drivers/${driverId}/profile`);
    return response.data.profile;
  },

  updateOnlineStatus: async (driverId: string, isOnline: boolean): Promise<boolean> => {
    const response = await driverApi.put(`/api/drivers/${driverId}/status`, { isOnline });
    return response.data.success;
  },

  updateProfile: async (driverId: string, data: Partial<DriverProfile>): Promise<DriverProfile> => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value && typeof value === 'object' && 'name' in value && 'type' in value) {
        // This is a file-like object
        formData.append(key, value as any);
      } else if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const response = await driverApi.put(`/api/drivers/${driverId}/profile`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.profile;
  },

  // Add a new method to update document URLs
  async updateDocumentUrls(partnerId: string, vehicleDocuments: any) {
    try {
      const { token } = sessionManager.getDriverSession();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.put(
        `${PARTNER_SERVICE_URL}/drivers/${partnerId}/documents`,
        { vehicleDocuments },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error updating document URLs:', error);
      throw error.response?.data || error.message;
    }
  }
}; 