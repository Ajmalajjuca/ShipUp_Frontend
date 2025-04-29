import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import vehicleService from '../services/vehicleService';
import { VehicleType, VehicleFilterParams } from '../types/vehicle.types';

interface VehicleContextType {
  vehicles: VehicleType[];
  loading: boolean;
  error: string | null;
  selectedVehicle: VehicleType | null;
  fetchVehicles: (params?: VehicleFilterParams) => Promise<void>;
  getVehicleById: (id: string) => Promise<VehicleType | null>;
  selectVehicle: (vehicle: VehicleType | null) => void;
  refreshVehicles: () => Promise<void>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const useVehicles = () => {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicles must be used within a VehicleProvider');
  }
  return context;
};

interface VehicleProviderProps {
  children: ReactNode;
}

export const VehicleProvider: React.FC<VehicleProviderProps> = ({ children }) => {
  const [vehicles, setVehicles] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);

  const fetchVehicles = async (params?: VehicleFilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await vehicleService.getAllVehicles(params);
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching vehicles');
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleById = async (id: string): Promise<VehicleType | null> => {
    try {
      const vehicle = await vehicleService.getVehicleById(id);
      return vehicle;
    } catch (err) {
      console.error(`Error fetching vehicle with id ${id}:`, err);
      return null;
    }
  };

  const selectVehicle = (vehicle: VehicleType | null) => {
    setSelectedVehicle(vehicle);
  };

  const refreshVehicles = async () => {
    await fetchVehicles();
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const value = {
    vehicles,
    loading,
    error,
    selectedVehicle,
    fetchVehicles,
    getVehicleById,
    selectVehicle,
    refreshVehicles,
  };

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
};

export default VehicleContext; 