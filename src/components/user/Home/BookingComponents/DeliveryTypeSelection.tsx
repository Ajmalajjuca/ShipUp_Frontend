import React from 'react';
import { Clock, Zap } from 'lucide-react';

interface DeliveryTypeSelectionProps {
  selectedType: 'normal' | 'express' | null;
  onSelect: (type: 'normal' | 'express') => void;
}

const DeliveryTypeSelection: React.FC<DeliveryTypeSelectionProps> = ({ selectedType, onSelect }) => {
  const deliveryTypes = [
    {
      id: 'normal',
      name: 'Standard Delivery',
      description: 'Regular delivery at standard prices',
      icon: <Clock size={24} />,
      priceMultiplier: '1x',
      timeEstimate: 'Regular delivery time'
    },
    {
      id: 'express',
      name: 'Express Delivery',
      description: 'Faster delivery at premium prices',
      icon: <Zap size={24} />,
      priceMultiplier: '1.5x',
      timeEstimate: 'Up to 20% faster'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Select Delivery Type</h2>
      <p className="text-gray-600">Choose how quickly you want your package delivered</p>

      <div className="space-y-4">
        {deliveryTypes.map(delivery => (
          <div
            key={delivery.id}
            onClick={() => onSelect(delivery.id as 'normal' | 'express')}
            className={`border rounded-lg p-5 cursor-pointer transition-all hover:shadow-md ${
              selectedType === delivery.id
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start">
              <div className={`p-3 rounded-lg mr-4 ${
                delivery.id === 'normal' ? 'bg-blue-100 text-blue-500' : 'bg-yellow-100 text-yellow-600'
              }`}>
                {delivery.icon}
              </div>
              
              <div className="flex-grow">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">{delivery.name}</h3>
                  {selectedType === delivery.id && (
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 1L3.5 6.5L1 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{delivery.description}</p>
                
                <div className="flex mt-3 space-x-4 text-sm">
                  <div className="bg-gray-100 rounded-full px-3 py-1 font-medium text-gray-700">
                    Price: {delivery.priceMultiplier}
                  </div>
                  <div className="bg-gray-100 rounded-full px-3 py-1 font-medium text-gray-700">
                    Time: {delivery.timeEstimate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
        <h4 className="font-medium text-yellow-800 mb-2">Delivery Speed Information</h4>
        <ul className="space-y-1 text-sm text-yellow-700">
          <li>• <strong>Standard Delivery</strong>: Most economical option with regular delivery times</li>
          <li>• <strong>Express Delivery</strong>: Premium service with priority handling and faster delivery times</li>
          <li>• Actual delivery times may vary based on distance, traffic, and weather conditions</li>
        </ul>
      </div>
    </div>
  );
};

export default DeliveryTypeSelection; 