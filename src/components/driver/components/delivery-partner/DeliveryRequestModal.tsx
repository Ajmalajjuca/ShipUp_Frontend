import React from 'react';
import { MapPin, Flag, DollarSign, Clock, Info } from 'lucide-react';

interface Location {
  latitude: number;
  longitude: number;
  street?: string;
}

interface DeliveryRequest {
  orderId: string;
  pickupLocation: Location;
  dropLocation: Location;
  customerName: string;
  amount: number;
  estimatedTime: string;
  distance: number;
  expiresIn: number;
  paymentMethod: string;
  pickupOtp?: string;
  dropoffOtp?: string;
}

interface DeliveryRequestModalProps {
  deliveryRequest: DeliveryRequest | null;
  onRespond: (accept: boolean) => void;
}

const DeliveryRequestModal: React.FC<DeliveryRequestModalProps> = ({
  deliveryRequest,
  onRespond
}) => {
  if (!deliveryRequest) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="bg-blue-600 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">New Delivery Request</h3>
            <span className="px-3 py-1 bg-white bg-opacity-20 text-white text-xs font-medium rounded-full">
              {deliveryRequest.distance} km
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-6 relative">
            <div className="absolute left-4 top-10 bottom-10 w-0.5 bg-gray-200 z-0"></div>
            <div className="flex mb-6 relative z-10">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                <MapPin className="text-blue-600" size={16} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Pickup Location</p>
                <p className="font-medium text-gray-800">{deliveryRequest.pickupLocation.street}</p>
                <p className="text-xs text-gray-400 opacity-70">
                  {deliveryRequest.pickupLocation.latitude.toFixed(4)}, {deliveryRequest.pickupLocation.longitude.toFixed(4)}
                </p>
              </div>
            </div>
            <div className="flex relative z-10">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                <Flag className="text-green-600" size={16} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Drop Location</p>
                <p className="font-medium text-gray-800">{deliveryRequest.dropLocation.street}</p>
                <p className="text-xs text-gray-400 opacity-70">
                  {deliveryRequest.dropLocation.latitude.toFixed(4)}, {deliveryRequest.dropLocation.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center mb-1">
                <DollarSign className="text-blue-600 mr-2" size={14} />
                <p className="text-xs font-medium text-gray-500">Payment</p>
              </div>
              <p className="text-lg font-semibold text-gray-800">${deliveryRequest.amount.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{deliveryRequest.paymentMethod}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center mb-1">
                <Clock className="text-blue-600 mr-2" size={14} />
                <p className="text-xs font-medium text-gray-500">Time</p>
              </div>
              <p className="text-lg font-semibold text-gray-800">{deliveryRequest.estimatedTime}</p>
              <p className="text-xs text-gray-500">{deliveryRequest.distance} kilometers</p>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                <Info className="text-blue-600" size={14} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Delivery Instructions</p>
                <p className="text-sm text-gray-600 mt-1">Leave at door. Call upon arrival.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onRespond(false)}
              className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
            >
              Decline
            </button>
            <button
              onClick={() => onRespond(true)}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryRequestModal;