import React, { useState } from 'react';
import { MapPin, CheckCircle, Flag, Map } from 'lucide-react';

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
  paymentMethod: string;
  pickupOtp?: string;
  dropoffOtp?: string;
}

interface ActiveDeliveryCardProps {
  visible: boolean;
  orderDetails: DeliveryRequest | null;
  onMarkPickedUp: () => void;
  onMarkDelivered: () => void;
  deliveryStatus: 'heading_to_pickup' | 'picked_up' | 'delivering';
  onVerifyOtp: (type: 'pickup' | 'dropoff', otp: string) => void;
}

const ActiveDeliveryCard: React.FC<ActiveDeliveryCardProps> = ({
  visible,
  orderDetails,
  onMarkPickedUp,
  onMarkDelivered,
  deliveryStatus,
  onVerifyOtp
}) => {
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(false);

  if (!visible || !orderDetails) return null;

  const handleOtpSubmit = (type: 'pickup' | 'dropoff') => {
    if (otpInput.trim().length !== 4) {
      setOtpError(true);
      return;
    }
    setOtpError(false);
    onVerifyOtp(type, otpInput);
    setOtpInput('');
  };

  return (
    <div className="bg-white border shadow-sm rounded-lg overflow-hidden">
      <div className="p-4 bg-indigo-50 border-b">
        <h3 className="font-medium text-indigo-900">Active Delivery</h3>
      </div>
      <div className="p-4">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                deliveryStatus === 'heading_to_pickup' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
              }`}
            >
              {deliveryStatus === 'heading_to_pickup' ? <MapPin size={20} /> : <CheckCircle size={20} />}
            </div>
            <div className="ml-3">
              <p className="font-medium">Pickup Location</p>
              <p className="text-sm text-gray-600 truncate max-w-xs">{orderDetails.pickupLocation?.street || 'Address not available'}</p>
            </div>
          </div>
          <div className="w-10 flex justify-center">
            <div className="h-8 border-l-2 border-dashed border-gray-300"></div>
          </div>
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                deliveryStatus === 'delivering' ? 'bg-green-100 text-green-600' :
                (deliveryStatus === 'picked_up' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400')
              }`}
            >
              {deliveryStatus === 'delivering' ? <CheckCircle size={20} /> : <Flag size={20} />}
            </div>
            <div className="ml-3">
              <p className="font-medium">Dropoff Location</p>
              <p className="text-sm text-gray-600 truncate max-w-xs">{orderDetails.dropLocation?.street || 'Address not available'}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Order ID:</span>
            <span className="font-medium">{orderDetails.orderId.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Customer:</span>
            <span className="font-medium">{orderDetails.customerName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Distance:</span>
            <span className="font-medium">{orderDetails.distance.toFixed(1)} km</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment:</span>
            <span className="font-medium">{orderDetails.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">₹{orderDetails.amount.toFixed(2)}</span>
          </div>
        </div>
        {deliveryStatus === 'heading_to_pickup' && (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Ask the customer for their OTP to verify pickup.
            </p>
            <div className="mt-4 mb-6">
              <label htmlFor="pickupOtp" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Pickup OTP
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="pickupOtp"
                  className={`block w-full rounded-l-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                    otpError ? 'ring-red-300 placeholder:text-red-300' : 'ring-gray-300 placeholder:text-gray-400'
                  } focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-center text-xl tracking-widest`}
                  placeholder="Enter 4-digit OTP"
                  value={otpInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 4) {
                      setOtpInput(value);
                      setOtpError(false);
                    }
                  }}
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => handleOtpSubmit('pickup')}
                  className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
                >
                  Verify
                </button>
              </div>
              {otpError && (
                <p className="mt-1 text-sm text-red-600">
                  Please enter a valid 4-digit OTP
                </p>
              )}
            </div>
            <div className="flex space-x-4">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${orderDetails.pickupLocation?.latitude},${orderDetails.pickupLocation?.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-4 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors text-center flex items-center justify-center"
              >
                <Map size={16} className="mr-2" />
                Navigate to Pickup
              </a>
            </div>
          </>
        )}
        {deliveryStatus === 'picked_up' && (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Ask the customer for their OTP to verify delivery.
            </p>
            <div className="mt-4 mb-6">
              <label htmlFor="dropoffOtp" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Dropoff OTP
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="dropoffOtp"
                  className={`block w-full rounded-l-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                    otpError ? 'ring-red-300 placeholder:text-red-300' : 'ring-gray-300 placeholder:text-gray-400'
                  } focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-center text-xl tracking-widest`}
                  placeholder="Enter 4-digit OTP"
                  value={otpInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 4) {
                      setOtpInput(value);
                      setOtpError(false);
                    }
                  }}
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => handleOtpSubmit('dropoff')}
                  className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
                >
                  Verify
                </button>
              </div>
              {otpError && (
                <p className="mt-1 text-sm text-red-600">
                  Please enter a valid 4-digit OTP
                </p>
              )}
            </div>
            <div className="flex space-x-4">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${orderDetails.dropLocation.latitude},${orderDetails.dropLocation.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-4 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors text-center flex items-center justify-center"
              >
                <Map size={16} className="mr-2" />
                Navigate to Dropoff
              </a>
            </div>
          </>
        )}
        {deliveryStatus === 'heading_to_pickup' && (
          <div className="mt-6">
            <button
              onClick={onMarkPickedUp}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Confirm Item Pickup
            </button>
          </div>
        )}
        {deliveryStatus === 'picked_up' && (
          <div className="mt-6">
            <button
              onClick={onMarkDelivered}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Confirm Delivery
            </button>
          </div>
        )}
        {deliveryStatus === 'delivering' && (
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-2" />
            <p className="font-medium text-green-700">Delivery completed!</p>
            <p className="text-sm text-green-600 mb-3">Well done!</p>
            <p className="text-xs text-gray-500">This card will disappear soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveDeliveryCard;