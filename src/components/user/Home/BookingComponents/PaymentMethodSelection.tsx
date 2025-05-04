import React from 'react';
import { CreditCard, Wallet, DollarSign, QrCode } from 'lucide-react';

export type PaymentMethod = 'razorpay' | 'wallet' | 'cash' | 'upi';
export type PaymentTiming = 'pre' | 'post';

export interface PaymentOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ReactNode;
  timing: PaymentTiming;
}

interface PaymentMethodSelectionProps {
  selectedMethod: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}

const PaymentMethodSelection: React.FC<PaymentMethodSelectionProps> = ({ 
  selectedMethod, 
  onSelect 
}) => {
  const paymentOptions: PaymentOption[] = [
    // Pre-payment options
    {
      id: 'razorpay',
      name: 'Credit/Debit Card',
      description: 'Pay securely with Razorpay',
      icon: <CreditCard className="w-5 h-5" />,
      timing: 'pre'
    },
    {
      id: 'wallet',
      name: 'Wallet',
      description: 'Pay using your ShipUp wallet',
      icon: <Wallet className="w-5 h-5" />,
      timing: 'pre'
    },
    // Post-delivery options
    {
      id: 'cash',
      name: 'Cash on Delivery',
      description: 'Pay when your package arrives',
      icon: <DollarSign className="w-5 h-5" />,
      timing: 'post'
    },
    {
      id: 'upi',
      name: 'UPI on Delivery',
      description: 'Pay via UPI when package arrives',
      icon: <QrCode className="w-5 h-5" />,
      timing: 'post'
    }
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Payment Method</h2>
      <p className="text-gray-600 mb-6">Choose how you would like to pay for your delivery</p>
      
      <div className="space-y-6">
        {/* Pre-payment options */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Pay Now</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentOptions
              .filter(option => option.timing === 'pre')
              .map(option => (
                <div
                  key={option.id}
                  onClick={() => onSelect(option.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedMethod === option.id
                      ? 'border-indigo-600 bg-indigo-50 shadow-md'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedMethod === option.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {option.icon}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{option.name}</p>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                    {selectedMethod === option.id && (
                      <div className="ml-auto w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
        
        {/* Post-delivery options */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Pay on Delivery</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentOptions
              .filter(option => option.timing === 'post')
              .map(option => (
                <div
                  key={option.id}
                  onClick={() => onSelect(option.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedMethod === option.id
                      ? 'border-indigo-600 bg-indigo-50 shadow-md'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedMethod === option.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {option.icon}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{option.name}</p>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                    {selectedMethod === option.id && (
                      <div className="ml-auto w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelection; 