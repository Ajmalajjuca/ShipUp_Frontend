import React, { useState, useEffect } from 'react';
import { MapPin, Home, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileLayout from '../ProfileLayout';
import { userService } from '../../../../services/user.service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../Redux/store';
import { toast } from 'react-hot-toast';

interface Address {
  addressId: string;
  type: 'home' | 'work' | 'other';
  street: string;
  isDefault: boolean;
  userId: string;
  streetNumber?: string;
  buildingNumber?: string;
  floorNumber?: string;
  contactName?: string;
  contactPhone?: string;
  latitude?: number;
  longitude?: number;
}

const AddressBook: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?.userId || user?._id;

  // Fetch addresses when component mounts
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const response = await userService.getUserAddresses(userId);
        if (response.success && response.addresses) {
          setAddresses(response.addresses);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        toast.error('Failed to load addresses');
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [userId]);

  const handleAddAddress = () => {
    navigate('/address/add');
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const response = await userService.deleteAddress(addressId);
      if (response.success) {
        toast.success('Address deleted successfully');
        // Remove the deleted address from state
        setAddresses(addresses.filter(address => address.addressId !== addressId));
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await userService.setDefaultAddress(userId, addressId);
      if (response.success) {
        toast.success('Default address updated');
        // Update the addresses state to reflect the new default
        setAddresses(addresses.map(address => ({
          ...address,
          isDefault: address.addressId === addressId
        })));
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default address');
    }
  };

  return (
    <ProfileLayout>
      <div className="w-full md:w-2/3">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Address Book</h2>
            {addresses.length > 0 && (
              <button 
                onClick={handleAddAddress}
                className="bg-red-500 hover:bg-red-600 text-white flex items-center px-4 py-2 rounded-lg text-sm"
              >
                <Plus size={16} className="mr-1" />
                Add New Address
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
            </div>
          ) : addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <div key={address.addressId} className="border border-gray-200 rounded-lg p-4 relative">
                  <div className="flex items-center mb-2">
                    <div className={`p-2 rounded-full ${
                      address.type === 'home' ? 'bg-blue-100 text-blue-500' : 
                      address.type === 'work' ? 'bg-purple-100 text-purple-500' : 
                      'bg-green-100 text-green-500'
                    }`}>
                      {address.type === 'home' ? <Home size={16} /> : 
                       address.type === 'work' ? <Briefcase size={16} /> : 
                       <MapPin size={16} />}
                    </div>
                    <h3 className="font-medium ml-2">{address.type.charAt(0).toUpperCase() + address.type.slice(1)}</h3>
                    {address.isDefault && (
                      <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Default</span>
                    )}
                  </div>
                  <p className="text-gray-700">{address.street}</p>
                  {address.contactName && (
                    <p className="text-gray-500 text-sm mt-2">
                      <span className="font-medium">Contact:</span> {address.contactName}
                    </p>
                  )}
                  {address.contactPhone && (
                    <p className="text-gray-500 text-sm">
                      <span className="font-medium">Phone:</span> +91 {address.contactPhone}
                    </p>
                  )}
                  
                  <div className="absolute top-3 right-3 flex space-x-2">
                    {!address.isDefault && (
                      <button 
                        className="p-1 text-green-500 hover:text-green-700"
                        onClick={() => handleSetDefault(address.addressId)}
                        title="Set as default"
                        aria-label="Set as default address"
                      >
                        <StarIcon size={16} />
                      </button>
                    )}
                    <button 
                      className="p-1 text-blue-500 hover:text-blue-700"
                      onClick={() => navigate(`/address/edit/${address.addressId}`)}
                      title="Edit address"
                      aria-label="Edit address"
                    >
                      <PencilIcon size={16} />
                    </button>
                    <button 
                      className="p-1 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteAddress(address.addressId)}
                      title="Delete address"
                      aria-label="Delete address"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="bg-gray-100 rounded-full p-6 mb-6 flex items-center justify-center">
                <svg 
                  width="80" 
                  height="80" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-gray-400"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">No saved address found!</h2>
              <p className="text-gray-500 mb-6 text-center">
                Please add your address for your better experience
              </p>
              <button
                onClick={handleAddAddress}
                className="bg-indigo-900 hover:bg-indigo-800 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center"
              >
                Add Address
              </button>
            </div>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
};

// Icons
const PencilIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

const TrashIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const Briefcase = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);

const StarIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

export default AddressBook; 