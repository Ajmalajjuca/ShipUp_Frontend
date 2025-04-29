import React from 'react';
import { Truck, Bike, Package, Check } from 'lucide-react';

export interface VehicleSelectionProps {
  vehicles: Array<{
    id: string;
    name: string;
    pricePerKm: number;
    maxWeight: number;
    imageUrl?: string;
  }>;
  selectedVehicleId: string | null;
  onSelect: (vehicleId: string) => void;
}

const VehicleSelection: React.FC<VehicleSelectionProps> = ({ 
  vehicles,
  selectedVehicleId, 
  onSelect 
}) => {
  // Get the appropriate icon based on vehicle name
  const getVehicleIcon = (vehicleName: string) => {
    const name = vehicleName.toLowerCase();
    if (name.includes('bike') || name.includes('cycle')) {
      return <Bike size={28} />;
    } else if (name.includes('van')) {
      return <Package size={28} />;
    } else {
      return <Truck size={28} />;
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Select a vehicle</h2>
      <p className="text-gray-600 mb-6">Choose the right vehicle for your delivery needs</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            onClick={() => onSelect(vehicle.id)}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedVehicleId === vehicle.id
                ? 'border-indigo-600 bg-indigo-50 shadow-md'
                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-3">
                {vehicle.imageUrl ? (
                  <img 
                    src={vehicle.imageUrl} 
                    alt={vehicle.name} 
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  getVehicleIcon(vehicle.name)
                )}
              </div>
              <div className="flex-grow">
                <h3 className="font-medium text-gray-900">{vehicle.name}</h3>
                <p className="text-sm text-gray-500">Up to {vehicle.maxWeight} kg</p>
                <p className="text-sm font-medium text-indigo-900">₹{vehicle.pricePerKm}/km</p>
              </div>
              {selectedVehicleId === vehicle.id && (
                <div className="flex-shrink-0 bg-indigo-600 text-white p-1 rounded-full">
                  <Check size={16} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleSelection; 