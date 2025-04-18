import { userApi } from './axios/instance';

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
    
    // Ensure userId is included in the form data
    if (data.userId) {
      formData.append('userId', data.userId);
    }
    
    // Add other fields to form data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'userId') {
        // Handle profile image differently if it's a URL vs a File
        if (key === 'profileImage') {
          // If it's a string (URL), append it directly
          formData.append('profileImagePath', value.toString());
        } else {
          formData.append(key, value);
        }
      }
    });

    const response = await userApi.put('/update-profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getUserProfile: async () => {
    const response = await userApi.get('/profile');
    return response.data;
  },

  getAllUsers: async () => {
    const response = await userApi.get('/users');
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await userApi.get(`/users/${id}`);
    return response.data;
  },

  updateUserStatus: async (id: string, status: boolean) => {
    const response = await userApi.put(`/users/${id}/status`, { status });
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>) => {
    const response = await userApi.put(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await userApi.delete(`/users/${id}`);
    return response.data;
  }
}; 