import { api } from './axios/instance';
import {
  VehicleType,
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleResponse,
  VehiclesResponse,
} from '../types/vehicle.types';

interface ImageUploadResponse {
  success: boolean;
  message?: string;
  imageUrl?: string;
}

export const vehicleService = {
  getVehicles: async (): Promise<VehiclesResponse> => {
    try {
      const response = await api.get('/api/vehicles');
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return {
        success: false,
        message: 'Failed to fetch vehicles',
        vehicles: [],
        total: 0,
      };
    }
  },

  getVehicleById: async (id: string): Promise<VehicleResponse> => {
    try {
      const response = await api.get(`/api/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return {
        success: false,
        message: 'Failed to fetch vehicle',
      };
    }
  },

  uploadVehicleImage: async (formData: FormData): Promise<ImageUploadResponse> => {
    try {
      const response = await api.post('/api/vehicles/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        message: 'Failed to upload image',
      };
    }
  },

  createVehicle: async (data: CreateVehicleInput): Promise<VehicleResponse> => {
    try {
      const response = await api.post('/api/vehicles', data);
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      return {
        success: false,
        message: 'Failed to create vehicle',
      };
    }
  },

  updateVehicle: async (id: string, data: UpdateVehicleInput): Promise<VehicleResponse> => {
    try {
      const response = await api.put(`/api/vehicles/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      return {
        success: false,
        message: 'Failed to update vehicle',
      };
    }
  },

  deleteVehicle: async (id: string): Promise<VehicleResponse> => {
    try {
      const response = await api.delete(`/api/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return {
        success: false,
        message: 'Failed to delete vehicle',
      };
    }
  },

  toggleVehicleStatus: async (id: string): Promise<VehicleResponse> => {
    try {
      const response = await api.patch(`/api/vehicles/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error('Error toggling vehicle status:', error);
      return {
        success: false,
        message: 'Failed to toggle vehicle status',
      };
    }
  },
};