export interface VehicleType {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  maxWeight?: string | number;
  pricePerKm?: number;
  isActive?: boolean;
}

export interface CreateVehicleInput {
  name: string;
  description?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  maxWeight?: string | number;
  pricePerKm?: number;
  isActive?: boolean;
}

export interface UpdateVehicleInput {
  name?: string;
  description?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  maxWeight?: string | number;
  pricePerKm?: number;
  isActive?: boolean;
}

export interface VehicleFilterParams {
  isAvailable?: boolean;
  minCapacity?: number;
  maxCapacity?: number;
}

export interface VehicleResponse {
  success: boolean;
  message?: string;
  data?: VehicleType | VehicleType[];
  vehicle?: VehicleType;
}

export interface VehiclesResponse {
  success: boolean;
  message?: string;
  vehicles: VehicleType[];
  total: number;
  page?: number;
  limit?: number;
} 