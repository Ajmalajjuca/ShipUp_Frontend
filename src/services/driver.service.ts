import { api } from './axios/instance';
import { sessionManager } from '../utils/sessionManager';
import { verify } from 'crypto';
import { get } from 'http';

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

export const driverService = {
  getAllDrivers: async () => {
    const response = await api.get('/api/partners/drivers');
    return response.data;
  },

  getDriverById: async (id: string) => {
    const response = await api.get(`/api/partners/drivers/${id}`);
    return response.data;
  },

  getRatingByDriverId: async (id: string) => {
    const response = await api.get(`/api/partners/drivers/${id}/ratings`);
    return response.data;
  },

  getOrderRating: async (orderId: string) => {
    const response = await api.get(`/api/partners/drivers/orders/${orderId}/ratings`);
    return response.data;
  },

  


  getPartnerOrders: async (
    partnerId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string
  ) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) params.append('status', status);
      if (search) params.append('search', search);

      const response = await api.get(`/api/orders/drivers/${partnerId}?${params.toString()}`);
      return response.data; // Expected: { orders: Array, total: number, page: number, limit: number, totalPages: number }
    } catch (error) {
      console.error(`Failed to fetch orders for partner ${partnerId}:`, error);
      throw error; // Rethrow to allow fetchDeliveriesById to handle
    }
  },

  updateDriverStatus: async (id: string, status: boolean) => {
    const response = await api.put(`/api/partners/drivers/${id}/status`, { status });
    return response.data;
  },

  updateDriver: async (id: string, data: Partial<Driver>) => {
    const response = await api.put(`/api/partners/drivers/${id}`, data);
    return response.data;
  },

  deleteDriver: async (id: string) => {
    const response = await api.delete(`/api/partners/drivers/${id}`);
    return response.data;
  },

  verifyDocument: async (id: string, field: string) => {
    const response = await api.put(`/api/partners/drivers/${id}/verification`, {
      [field]: true,
    });
    return response.data;
  },

  checkVerificationStatus: async (email: string) => {
    const response = await api.get(`/api/partners/drivers/verify-doc?email=${email}`);
    return response.data;
  },

  getDashboardStats: async (driverId: string): Promise<DashboardStats> => {
    const response = await api.get(`/api/partners/drivers/${driverId}/dashboard-stats`);
    return response.data;
  },

  getPerformanceMetrics: async (driverId: string, period: string): Promise<PerformanceMetrics> => {
    const response = await api.get(`/api/partners/drivers/${driverId}/performance?period=${period}`);
    return response.data;
  },

  getActiveDelivery: async (driverId: string): Promise<ActiveDelivery | null> => {
    const response = await api.get(`/api/partners/drivers/${driverId}/active-delivery`);
    return response.data.delivery;
  },

  getDriverProfile: async (driverId: string): Promise<DriverProfile> => {
    const response = await api.get(`/api/partners/drivers/${driverId}/profile`);
    return response.data.profile;
  },

  updateOnlineStatus: async (driverId: string, isOnline: boolean): Promise<boolean> => {
    const response = await api.put(`/api/partners/drivers/${driverId}/status`, { isOnline });
    return response.data.success;
  },

  updatePrFofile: async (driverId: string, data: Partial<DriverProfile>): Promise<DriverProfile> => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value && typeof value === 'object' && 'name' in value && 'type' in value) {
        formData.append(key, value as any);
      } else if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const response = await api.put(`/api/partners/drivers/${driverId}/profile`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.profile;
  },

  async updateDocumentUrls(partnerId: string, vehicleDocuments: any) {
    try {
      const { token } = sessionManager.getDriverSession();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await api.put(
        `/api/partners/drivers/${partnerId}/documents`,
        { vehicleDocuments },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error updating document URLs:', error);
      throw error.response?.data || error.message;
    }
  },

  async sendDeliveryOtp(orderId: string, Otp:string,type: string) {
    try {
      const response = await api.post(`/api/orders/${orderId}/otp`, {
        type: type,
        otp: Otp,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending pickup OTP:', error);
      throw error;
    }
  },

  verifyDeliveryOtp: async (orderId: string, otp: string, type: string, partnerId: string) => {
    try {
      const response = await api.post(`/api/partners/drivers/orders/${orderId}/verify-otp`, {
        type,
        otp,
        partnerId
      });
      return response.data;
    } catch (error) {
      console.error('Error verifying pickup OTP:', error);
      throw error;
    }
  },

  updateDriverById: async (id: string, data: any, section: any) => {
    const response = await api.put(`/api/partners/drivers/${id}/${section}`,{...data[section]});
    return response.data;
  },
  updateImage: async (id: string, data: any) => {
    const response = await api.put(`/api/partners/drivers/${id}/profile-image`, data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },





  
};