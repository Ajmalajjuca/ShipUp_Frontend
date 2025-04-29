import React from 'react';
import { Phone, Star, User, HelpCircle } from 'lucide-react';
import { DriverData } from './useOrderTracking';

interface DriverInfoCardProps {
  driverData: DriverData | null;
  isLoading?: boolean;
  onCallDriver: () => void;
  onContactSupport: () => void;
}

const DriverInfoCard = ({ 
  driverData, 
  isLoading = false, 
  onCallDriver, 
  onContactSupport 
}: DriverInfoCardProps) => {
  // Handle loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle no driver assigned yet
  if (!driverData || !driverData.fullName) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="bg-gray-100 p-3 rounded-full inline-block mb-2">
              <User size={24} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">Awaiting Driver</h3>
            <p className="text-gray-500 text-sm mt-1">A driver will be assigned to your order soon</p>
          </div>
        </div>
      </div>
    );
  }

  // Render driver info
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
      <div className="flex items-start">
        {/* Driver Avatar */}
        <div className="mr-4 flex-shrink-0">
          {driverData.photoUrl ? (
            <img 
              src={driverData.photoUrl} 
              alt={`${driverData.fullName}`} 
              className="h-14 w-14 rounded-full object-cover border-2 border-blue-100"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
              <User size={24} className="text-blue-600" />
            </div>
          )}
        </div>
        
        {/* Driver Details */}
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-gray-800">{driverData.fullName}</h3>
          
          {/* Vehicle Info */}
          {driverData.vehicleInfo && (
            <div className="text-sm text-gray-600 mb-1">
              {driverData.vehicleInfo.make} {driverData.vehicleInfo.model} · {driverData.vehicleInfo.color} · {driverData.vehicleInfo.licensePlate}
            </div>
          )}
          
          {/* Rating */}
          {driverData.rating && (
            <div className="flex items-center mb-3">
              <Star size={16} className="text-yellow-500 mr-1 fill-current" />
              <span className="text-sm font-medium">{driverData.rating.toFixed(1)}</span>
              {driverData.totalRides && (
                <span className="text-xs text-gray-500 ml-1">({driverData.totalRides} rides)</span>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex space-x-2 mt-1">
            <button 
              onClick={onCallDriver} 
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-150 flex items-center justify-center"
            >
              <Phone size={16} className="mr-1.5" />
              Call Driver
            </button>
            
            <button 
              onClick={onContactSupport} 
              className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 px-3 rounded-md text-sm font-medium transition-colors duration-150 flex items-center justify-center"
            >
              <HelpCircle size={16} className="mr-1.5" />
              Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverInfoCard;