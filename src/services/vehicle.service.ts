import { orderApi } from './axios/instance';
import {
  VehicleType,
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleResponse,
  VehiclesResponse
} from '../types/vehicle.types';

// Define interface for image upload response
interface ImageUploadResponse {
  success: boolean;
  message?: string;
  imageUrl?: string;
}

// Mock data for development


// Vehicle service
export const vehicleService = {
  // Get all vehicles
  getVehicles: async (): Promise<VehiclesResponse> => {
    try {
      // In a real implementation, we would call the API
      const response = await orderApi.get('/admin/vehicles');
      return response.data;

    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return {
        success: false,
        message: 'Failed to fetch vehicles',
        vehicles: [],
        total: 0
      };
    }
  },

  // Get a single vehicle by ID
  getVehicleById: async (id: string): Promise<VehicleResponse> => {
    try {
      const response = await orderApi.get(`/admin/vehicles/${id}`);
      return response.data;

    } catch (error) {
      console.error('Error fetching vehicle:', error);
      return {
        success: false,
        message: 'Failed to fetch vehicle'
      };
    }
  },

  // Upload vehicle image
  uploadVehicleImage: async (formData: FormData): Promise<ImageUploadResponse> => {
    try {
      const response = await orderApi.post('/admin/vehicles/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        message: 'Failed to upload image'
      };
    }
  },

  // Create a new vehicle
  createVehicle: async (data: CreateVehicleInput): Promise<VehicleResponse> => {
    try {
      // In a real implementation, we would call the API
      const response = await orderApi.post('/admin/vehicles', data);
      return response.data;

    } catch (error) {
      console.error('Error creating vehicle:', error);
      return {
        success: false,
        message: 'Failed to create vehicle'
      };
    }
  },

  // Update an existing vehicle
  updateVehicle: async (id: string, data: UpdateVehicleInput): Promise<VehicleResponse> => {
    try {
      const response = await orderApi.put(`/admin/vehicles/${id}`, data);
      return response.data;

    } catch (error) {
      console.error('Error updating vehicle:', error);
      return {
        success: false,
        message: 'Failed to update vehicle'
      };
    }
  },

  // Delete a vehicle (soft delete by setting isActive to false)
  deleteVehicle: async (id: string): Promise<VehicleResponse> => {
    try {
      const response = await orderApi.delete(`/admin/vehicles/${id}`);
      return response.data;

    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return {
        success: false,
        message: 'Failed to delete vehicle'
      };
    }
  },

  // Toggle vehicle status (active/inactive)
  toggleVehicleStatus: async (id: string): Promise<VehicleResponse> => {
    try {
      const response = await orderApi.patch(`/admin/vehicles/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error('Error toggling vehicle status:', error);
      return {
        success: false,
        message: 'Failed to toggle vehicle status'
      };
    }
  }

}; 