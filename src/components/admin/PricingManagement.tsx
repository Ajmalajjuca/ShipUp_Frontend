import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { orderService, PricingConfig } from '../../services/order.service';

const PricingManagement: React.FC = () => {
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPricingConfig();
  }, []);

  const loadPricingConfig = async () => {
    setIsLoading(true);
    try {
      const config = await orderService.getPricingConfig();
      setPricingConfig(config);
    } catch (error) {
      console.error('Failed to load pricing configuration:', error);
      toast.error('Could not load pricing information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePricingConfig = async () => {
    if (!pricingConfig) return;

    setIsSaving(true);
    try {
      const result = await orderService.updatePricingConfig(pricingConfig);
      if (result.success) {
        toast.success('Pricing configuration updated successfully');
        setPricingConfig(result.pricingConfig);
      } else {
        toast.error(result.message || 'Failed to update pricing configuration');
      }
    } catch (error) {
      console.error('Error saving pricing configuration:', error);
      toast.error('An error occurred while saving pricing configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (section: keyof PricingConfig, key: string, value: string) => {
    if (!pricingConfig) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setPricingConfig({
      ...pricingConfig,
      [section]: {
        ...(pricingConfig[section] as Record<string, any>),
        [key]: numValue
      }
    });
  };

  const handleDirectInputChange = (key: keyof PricingConfig, value: string) => {
    if (!pricingConfig) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setPricingConfig({
      ...pricingConfig,
      [key]: numValue
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!pricingConfig) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        Failed to load pricing configuration. Please try again.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Pricing Configuration</h2>
      
      <div className="space-y-6">
        {/* Minimum Distance */}
        <div className="p-4 border rounded-md border-blue-200 bg-blue-50">
          <h3 className="text-lg font-medium text-blue-700 mb-3">Minimum Distance</h3>
          <div className="flex items-center">
            <input
              id="minimum-distance"
              type="number"
              min="0"
              step="0.1"
              value={pricingConfig.minimumDistance}
              onChange={(e) => handleDirectInputChange('minimumDistance', e.target.value)}
              className="w-full max-w-xs p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              aria-label="Minimum distance"
              placeholder="Minimum distance"
            />
            <span className="ml-2 text-gray-500">km</span>
          </div>
          <p className="text-sm text-blue-600 mt-2">
            This is the minimum distance that will be used for pricing calculations, even if the actual distance is shorter.
          </p>
        </div>
      
        {/* Vehicle Prices */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Vehicle Prices (₹/km)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-md">
              <label htmlFor="bike-price" className="block text-sm font-medium text-gray-600 mb-2">Bike</label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">₹</span>
                <input
                  id="bike-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricingConfig.vehiclePrices.bike}
                  onChange={(e) => handleInputChange('vehiclePrices', 'bike', e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Bike price per kilometer"
                  placeholder="Price per km"
                />
              </div>
            </div>
            
            <div className="p-4 border rounded-md">
              <label htmlFor="van-price" className="block text-sm font-medium text-gray-600 mb-2">Van</label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">₹</span>
                <input
                  id="van-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricingConfig.vehiclePrices.van}
                  onChange={(e) => handleInputChange('vehiclePrices', 'van', e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Van price per kilometer"
                  placeholder="Price per km"
                />
              </div>
            </div>
            
            <div className="p-4 border rounded-md">
              <label htmlFor="truck-price" className="block text-sm font-medium text-gray-600 mb-2">Truck</label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">₹</span>
                <input
                  id="truck-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricingConfig.vehiclePrices.truck}
                  onChange={(e) => handleInputChange('vehiclePrices', 'truck', e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Truck price per kilometer"
                  placeholder="Price per km"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Delivery Multipliers */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Delivery Multipliers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-md">
              <label htmlFor="standard-multiplier" className="block text-sm font-medium text-gray-600 mb-2">Standard Delivery</label>
              <input
                id="standard-multiplier"
                type="number"
                min="0.1"
                step="0.1"
                value={pricingConfig.deliveryMultipliers.normal}
                onChange={(e) => handleInputChange('deliveryMultipliers', 'normal', e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                aria-label="Standard delivery multiplier"
                placeholder="Standard delivery multiplier"
              />
              <p className="text-xs text-gray-500 mt-1">Base multiplier (usually 1.0)</p>
            </div>
            
            <div className="p-4 border rounded-md">
              <label htmlFor="express-multiplier" className="block text-sm font-medium text-gray-600 mb-2">Express Delivery</label>
              <input
                id="express-multiplier"
                type="number"
                min="0.1"
                step="0.1"
                value={pricingConfig.deliveryMultipliers.express}
                onChange={(e) => handleInputChange('deliveryMultipliers', 'express', e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                aria-label="Express delivery multiplier"
                placeholder="Express delivery multiplier"
              />
              <p className="text-xs text-gray-500 mt-1">Premium multiplier (usually 1.5)</p>
            </div>
          </div>
        </div>
        
        {/* Tax Rates */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Tax & Commission Rates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-md">
              <label htmlFor="gst-rate" className="block text-sm font-medium text-gray-600 mb-2">GST Rate</label>
              <div className="flex items-center">
                <input
                  id="gst-rate"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={pricingConfig.taxRates.gst}
                  onChange={(e) => handleInputChange('taxRates', 'gst', e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  aria-label="GST tax rate"
                  placeholder="GST rate (decimal)"
                />
                <span className="ml-2 text-gray-500">({(pricingConfig.taxRates.gst * 100).toFixed(0)}%)</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter as decimal (e.g., 0.18 for 18%)</p>
            </div>
            
            <div className="p-4 border rounded-md">
              <label htmlFor="commission-rate" className="block text-sm font-medium text-gray-600 mb-2">Commission Rate</label>
              <div className="flex items-center">
                <input
                  id="commission-rate"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={pricingConfig.taxRates.commission}
                  onChange={(e) => handleInputChange('taxRates', 'commission', e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Commission rate"
                  placeholder="Commission rate (decimal)"
                />
                <span className="ml-2 text-gray-500">({(pricingConfig.taxRates.commission * 100).toFixed(0)}%)</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter as decimal (e.g., 0.10 for 10%)</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button
          onClick={loadPricingConfig}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md mr-2 hover:bg-gray-300 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleSavePricingConfig}
          disabled={isSaving}
          className="px-4 py-2 bg-indigo-900 text-white rounded-md hover:bg-indigo-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-700">
          <strong>Note:</strong> Changing pricing will affect all new orders. Existing orders will not be affected.
        </p>
      </div>
    </div>
  );
};

export default PricingManagement; 