import { api } from './axios/instance';

interface UpdateProfileData {
  fullName?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
  profileImage?: string;
  userId?: string;
}

interface User {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  status: boolean;
  profileImage?: string;
  totalOrders?: number;
  totalAmount?: number;
  availablePoints?: number;
}

export const userService = {
  updateProfile: async (data: UpdateProfileData) => {
    const formData = new FormData();

    if (data.userId) {
      formData.append('userId', data.userId);
    }

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'userId') {
        if (key === 'profileImage') {
          formData.append('profileImagePath', value.toString());
        } else {
          formData.append(key, value);
        }
      }
    });

    const response = await api.put('/api/users/update-profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getUserProfile: async () => {
    const response = await api.get('/api/users/profile');
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get('/api/users');
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  updateUserStatus: async (id: string, status: boolean) => {
    const response = await api.put(`/api/users/${id}/status`, { status });
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>) => {
    const response = await api.put(`/api/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  },

  addAddress: async (userId: string, address: any) => {
    const response = await api.post(`/api/users/${userId}/addresses`, {
      type: address.type,
      street: address.street,
      isDefault: address.isDefault,
      latitude: address.latitude,
      longitude: address.longitude,
      streetNumber: address.streetNumber,
      buildingNumber: address.buildingNumber,
      floorNumber: address.floorNumber,
      contactName: address.contactName,
      contactPhone: address.contactPhone,
    });
    return response.data;
  },

  getUserAddresses: async (userId: string) => {
    const response = await api.get(`/api/users/${userId}/addresses`);
    return response.data;
  },

  deleteAddress: async (addressId: string) => {
    const response = await api.delete(`/api/users/addresses/${addressId}`);
    return response.data;
  },

  setDefaultAddress: async (userId: string, addressId: string) => {
    const response = await api.put(`/api/users/${userId}/addresses/${addressId}/default`);
    return response.data;
  },

  getAddress: async (addressId: string) => {
    const response = await api.get(`/api/users/addresses/${addressId}`);
    return response.data;
  },

  updateAddress: async (addressId: string, addressData: any) => {
    const response = await api.put(`/api/users/addresses/${addressId}`, addressData);
    return response.data;
  },

  getOrdersByUserId: async (userId: string) => {
    const response = await api.get(`/api/orders/user/${userId}`);
    return response.data;
  },
};