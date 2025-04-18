import React, { useState } from 'react';
import { ArrowLeft, Home, Briefcase, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ProfileLayout from '../ProfileLayout';

interface AddressFormData {
  type: 'home' | 'work' | 'other';
  street: string;
  isDefault: boolean;
}

const AddAddressForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AddressFormData>({
    type: 'home',
    street: '',
    isDefault: false,
  });
  const [errors, setErrors] = useState<Partial<AddressFormData>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when field is being edited
    if (errors[name as keyof AddressFormData]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleTypeSelect = (type: 'home' | 'work' | 'other') => {
    setFormData({ ...formData, type });
  };

  const validate = (): boolean => {
    const newErrors: Partial<AddressFormData> = {};
    
    if (!formData.street.trim()) {
      newErrors.street = 'Address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    try {
      setLoading(true);
      // Here you would call your API to save the address
      // const response = await addressService.addAddress(formData);
      
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
      toast.success('Address added successfully!');
      navigate('/address');
    } catch (error) {
      toast.error('Failed to add address. Please try again.');
      console.error('Error adding address:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileLayout>
      <div className="w-full md:w-2/3">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/address')}
              className="p-2 mr-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Go back"
              title="Go back to address book"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold">Add New Address</h1>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Address Type Selection */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-3">
                Select Address Type
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={`flex items-center px-4 py-3 rounded-lg border ${
                    formData.type === 'home'
                      ? 'border-red-500 bg-red-50 text-red-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTypeSelect('home')}
                >
                  <Home size={18} className="mr-2" />
                  <span>Home</span>
                </button>
                
                <button
                  type="button"
                  className={`flex items-center px-4 py-3 rounded-lg border ${
                    formData.type === 'work'
                      ? 'border-red-500 bg-red-50 text-red-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTypeSelect('work')}
                >
                  <Briefcase size={18} className="mr-2" />
                  <span>Work</span>
                </button>
                
                <button
                  type="button"
                  className={`flex items-center px-4 py-3 rounded-lg border ${
                    formData.type === 'other'
                      ? 'border-red-500 bg-red-50 text-red-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTypeSelect('other')}
                >
                  <MapPin size={18} className="mr-2" />
                  <span>Other</span>
                </button>
              </div>
            </div>
            
            {/* Contact Person Info - Similar to the image */}
            <div className="mb-6">
              <h2 className="text-base font-semibold mb-4 text-gray-700">Contact Person Info</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="contactName" className="block text-gray-700 text-sm font-medium mb-2">
                    Contact Person Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                    </div>
                    <input
                      type="text"
                      id="contactName"
                      name="contactName"
                      className="w-full pl-12 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 border-gray-300"
                      placeholder="Enter contact person name"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="contactPhone" className="block text-gray-700 text-sm font-medium mb-2">
                    Contact Phone Number
                  </label>
                  <div className="flex">
                    <div className="w-20 mr-2">
                      <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50">
                        <img src="https://purecatamphetamine.github.io/country-flag-icons/3x2/IN.svg" className="w-5 h-3 mr-1" alt="India flag" />
                        <span className="text-gray-700">+91</span>
                      </div>
                    </div>
                    <input
                      type="tel"
                      id="contactPhone"
                      name="contactPhone"
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 border-gray-300"
                      placeholder="Enter phone number"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Delivery Address Section */}
            <div className="mb-6">
              <h2 className="text-base font-semibold mb-4 text-gray-700">Delivery Address</h2>
              
              {/* Street Address */}
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    type="text"
                    required
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.street ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your complete address"
                  />
                </div>
                {errors.street && (
                  <p className="mt-1 text-sm text-red-500">{errors.street}</p>
                )}
              </div>
              
              {/* Street Number */}
              <div className="mb-4">
                <label htmlFor="streetNumber" className="block text-gray-700 text-sm font-medium mb-2">
                  Street Number
                </label>
                <input
                  type="text"
                  id="streetNumber"
                  name="streetNumber"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 border-gray-300"
                  placeholder="Enter street number"
                />
              </div>
              
              {/* Building Details */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Building/Floor Number
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="House no."
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 border-gray-300"
                  />
                  <input
                    type="text"
                    placeholder="Floor no."
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 border-gray-300"
                  />
                </div>
              </div>

            </div>
            
            {/* Map placeholder */}
            <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden h-64 bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500">Map will display here</p>
            </div>
            
            {/* Set as default checkbox */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleCheckboxChange}
                  className="h-5 w-5 text-red-500 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-gray-700">Set as default address</span>
              </label>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : 'Save Info'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default AddAddressForm; 