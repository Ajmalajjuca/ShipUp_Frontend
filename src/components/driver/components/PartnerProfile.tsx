import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Camera, ArrowLeft, Truck, 
  Calendar, CreditCard, Edit2, Check, X, UserCircle, 
  FileText, Landmark as Bank, Shield, Star, Award 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../../Redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { api } from '../../../services/axios/instance';
import { setDriverData } from '../../../Redux/slices/driverSlice';
import { vehicleService } from '../../../services/vehicle.service';
import { driverService } from '../../../services/driver.service';

// TypeScript Interfaces
interface EditableSectionProps {
  title: string;
  icon: React.ElementType;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  children:React.ReactNode;
}

interface EditDataType {
  personal: {
    fullName: string;
    mobileNumber: string;
    email: string;
    address: string;
    dateOfBirth: string;
  };
  vehicle: {
    vehicleType: string;
    registrationNumber: string;
  };
  bank: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
  };
}

// Editable Section Component
const EditableSection: React.FC<EditableSectionProps> = ({ 
  title, 
  icon: Icon,
  isEditing, 
  onEdit, 
  onSave, 
  onCancel, 
  children 
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 p-6 mb-6">
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center space-x-3">
        <Icon className="text-blue-600" size={24} />
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      </div>
      <div className="flex gap-2">
        {isEditing ? (
          <div className="flex space-x-2">
            <button
              onClick={onCancel}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition group"
              title="Cancel"
            >
              <X size={20} className="group-hover:scale-110 transition" />
            </button>
            <button
              onClick={onSave}
              className="p-2 text-green-500 hover:bg-green-50 rounded-full transition group"
              title="Save"
            >
              <Check size={20} className="group-hover:scale-110 transition" />
            </button>
          </div>
        ) : (
          <button
            onClick={onEdit}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition group"
            title="Edit"
          >
            <Edit2 size={20} className="group-hover:rotate-45 transition" />
          </button>
        )}
      </div>
    </div>
    {children}
  </div>
);

// Main Partner Profile Component
const PartnerProfile: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const driver = useSelector((state: RootState) => state.driver.driverDetails);
  const Email = useSelector((state: RootState) => state.driver.email);

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [vehicleTypes, setVehicleTypes] = useState<{ id: string; label: string }[]>([]);
  const [editData, setEditData] = useState<EditDataType>({
    personal: {
      fullName: driver?.fullName || '',
      mobileNumber: driver?.mobileNumber || '',
      email: driver?.email || '',
      address: driver?.address || '',
      dateOfBirth: driver?.dateOfBirth || ''
    },
    vehicle: {
      vehicleType: driver?.vehicleType || '',
      registrationNumber: driver?.registrationNumber || ''
    },
    bank: {
      accountHolderName: driver?.accountHolderName || '',
      accountNumber: driver?.accountNumber || '',
      ifscCode: driver?.ifscCode || '',
      upiId: driver?.upiId || ''
    }
  });

  // const fetchVehicleData = async () => {
  //   console.log('Fetching vehicle data...',driver?.vehicleId);
    
  //   try {
  //     const response = await vehicleService.getVehicleById(driver?.vehicleId);
  //     if (response.success) {
  //       setEditData((prevData) => ({
  //         ...prevData,
  //         vehicle: {
  //           ...prevData.vehicle,
  //           vehicleType: response?.vehicle?.name || ''
  //         }
  //       }));
  //       dispatch(setDriverData({
  //         driverData: {
  //           ...driver,
  //         },

  //         driverDetails: {
  //           ...driver,
  //           vehicleType: response?.vehicle?.name || ''
  //         },
  //         token: driver.token
  //       }));
  //     }
  //   } catch (error) {
  //     console.error('Error fetching vehicle data:', error);
  //     toast.error('Failed to fetch vehicle data');
  //   }
  // };

  const fetchVehicleTypes = async () => {
    try {
      const response = await vehicleService.getVehicles();
      if (response.success) {
        setVehicleTypes(response.vehicles.map(vehicle => ({ 
          id: vehicle.id, 
          label: vehicle.name 
        })));
      } else {
        console.error('Failed to fetch vehicle types:', response.message);
        toast.error('Failed to fetch vehicle types');
      }
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
      toast.error('Error fetching vehicle types');
    }
  };

  // Consolidated effect for initialization and data fetching
  useEffect(() => {
    if (!Email) {
      navigate('/partner');
      return;
    }

    if (driver) {
      // Update editData when driver changes
      setEditData({
        personal: {
          fullName: driver.fullName || '',
          mobileNumber: driver.mobileNumber || '',
          email: driver.email || '',
          address: driver.address || '',
          dateOfBirth: driver.dateOfBirth || ''
        },
        vehicle: {
          vehicleType: driver.vehicleType || '',
          registrationNumber: driver.registrationNumber || ''
        },
        bank: {
          accountHolderName: driver.accountHolderName || '',
          accountNumber: driver.accountNumber || '',
          ifscCode: driver.ifscCode || '',
          upiId: driver.upiId || ''
        }
      });

      // Fetch vehicle-related data
      const fetchData = async () => {
        await Promise.all([ fetchVehicleTypes()]);
      };
      
      fetchData();
    }

    // Cleanup function
    return () => {
      // Cancel any pending async operations if needed
    };
  }, [ Email, navigate, dispatch]);

  // Save handler for different sections
  const handleSave = async (section: keyof EditDataType) => {
    try {
      const response = await driverService.updateDriverById(driver.partnerId, editData, section)
      
      if (response.success) {
        toast.success(`${section} details updated successfully`);
        setActiveSection(null);
        dispatch(setDriverData({
          driverData: {
            ...driver,
          },
          driverDetails: response.partner,
          token: driver.token
        }));
      }
    } catch (error) {
      console.error(`Failed to update ${section} details:`, error);
      toast.error(`Failed to update ${section} details`);
    }
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const response = await driverService.updateImage(driver.partnerId, formData);
      if (response.success) {
        toast.success('Profile image updated successfully');
        dispatch(setDriverData({
          driverData: {
            ...driver,
          },
          driverDetails: response.partner,
          token: driver.token
        }));
      }
    } catch (error) {
      console.error('Failed to update profile image:', error);
      toast.error('Failed to update profile image');
    }
  };

  // Stats calculation
  const stats = {
    'Total Orders': driver?.totalOrders || 0,
    'Completed': driver?.completedOrders || 0,
    'Canceled': driver?.canceledOrders || 0,
    'Ongoing': driver?.ongoingOrders || 0
  };

  // Loading state
  if (!driver) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Modern Header */}
        <div className="flex items-center mb-10 space-x-4">
          <button 
            onClick={() => navigate('/partner/dashboard')}
            className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition group"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={24} className="text-blue-600 group-hover:-translate-x-1 transition" />
          </button>
          <h1 className="text-3xl font-extrabold text-gray-800">Partner Profile</h1>
        </div>

        {/* Profile Header Card with Enhanced Design */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl shadow-2xl p-8 mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-20">
            <Shield size={200} className="text-white" />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative group">
              <div className="w-40 h-40 rounded-full border-4 border-white shadow-lg overflow-hidden transform transition group-hover:scale-105">
                <img 
                  src={driver.profilePicturePath || '/delivery-avatar.png'}
                  alt={driver.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <label className="absolute bottom-2 right-2 p-3 bg-white rounded-full shadow-lg cursor-pointer hover:bg-blue-50 transition group">
                <Camera size={20} className="text-blue-600 group-hover:rotate-12 transition" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                <h2 className="text-3xl font-bold text-white">{driver.fullName}</h2>
                <Award size={24} className="text-yellow-300" />
              </div>
              <p className="text-blue-200 mb-4 tracking-wider">Partner ID: {driver.partnerId}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats).map(([key, value]) => (
                  <div key={key} className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition">
                    <p className="text-blue-100 text-sm">{key}</p>
                    <p className="text-white text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <EditableSection
          title="Personal Information"
          icon={UserCircle}
          isEditing={activeSection === 'personal'}
          onEdit={() => setActiveSection('personal')}
          onSave={() => handleSave('personal')}
          onCancel={() => setActiveSection(null)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSection === 'personal' ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Full Name</label>
                  <input
                    type="text"
                    value={editData.personal.fullName}
                    onChange={(e) => setEditData({
                      ...editData,
                      personal: { ...editData.personal, fullName: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Mobile Number</label>
                  <input
                    type="tel"
                    value={editData.personal.mobileNumber}
                    onChange={(e) => setEditData({
                      ...editData,
                      personal: { ...editData.personal, mobileNumber: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Email</label>
                  <input
                    type="email"
                    value={editData.personal.email}
                    disabled
                    className="w-full p-2 border rounded-lg bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Address</label>
                  <input
                    type="text"
                    value={editData.personal.address}
                    onChange={(e) => setEditData({
                      ...editData,
                      personal: { ...editData.personal, address: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Date of Birth</label>
                  <input
                    type="date"
                    value={editData.personal.dateOfBirth}
                    onChange={(e) => setEditData({
                      ...editData,
                      personal: { ...editData.personal, dateOfBirth: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <UserCircle className="text-blue-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium">{driver.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Phone className="text-blue-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Mobile Number</p>
                    <p className="font-medium">{driver.mobileNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="text-blue-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{driver.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <MapPin className="text-blue-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{driver.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="text-blue-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-medium">{new Date(driver.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </EditableSection>

        {/* Vehicle Information Section */}
        <EditableSection
          title="Vehicle Information"
          icon={Truck}
          isEditing={activeSection === 'vehicle'}
          onEdit={() => setActiveSection('vehicle')}
          onSave={() => handleSave('vehicle')}
          onCancel={() => setActiveSection(null)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSection === 'vehicle' ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Vehicle Type</label>
                  <select
                    value={editData.vehicle.vehicleType}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        vehicle: { ...editData.vehicle, vehicleType: e.target.value }
                      })
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select vehicle type</option>
                    {vehicleTypes.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.label}>
                        {vehicle.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Registration Number</label>
                  <input
                    type="text"
                    value={editData.vehicle.registrationNumber}
                    onChange={(e) => setEditData({
                      ...editData,
                      vehicle: { ...editData.vehicle, registrationNumber: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Truck className="text-blue-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Vehicle Type</p>
                    <p className="font-medium">{driver.vehicleType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <FileText className="text-blue-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Registration Number</p>
                    <p className="font-medium">{driver.registrationNumber}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </EditableSection>

        {/* Bank Details Section */}
        <EditableSection
          title="Bank Details"
          icon={Bank}
          isEditing={activeSection === 'bank'}
          onEdit={() => setActiveSection('bank')}
          onSave={() => handleSave('bank')}
          onCancel={() => setActiveSection(null)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSection === 'bank' ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Account Holder Name</label>
                  <input
                    type="text"
                    value={editData.bank.accountHolderName}
                    onChange={(e) => setEditData({
                      ...editData,
                      bank: { ...editData.bank, accountHolderName: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Account Number</label>
                  <input
                    type="text"
                    value={editData.bank.accountNumber}
                    onChange={(e) => setEditData({
                      ...editData,
                      bank: { ...editData.bank, accountNumber: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">IFSC Code</label>
                  <input
                    type="text"
                    value={editData.bank.ifscCode}
                    onChange={(e) => setEditData({
                      ...editData,
                      bank: { ...editData.bank, ifscCode: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">UPI ID</label>
                  <input
                    type="text"
                    value={editData.bank.upiId}
                    onChange={(e) => setEditData({
                      ...editData,
                      bank: { ...editData.bank, upiId: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Bank className="text-blue-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Account Holder Name</p>
                    <p className="font-medium">{driver.accountHolderName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <CreditCard className="text-blue-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Account Number</p>
                    <p className="font-medium">XXXX-XXXX-{driver.accountNumber.slice(-4)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Bank className="text-blue-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">IFSC Code</p>
                    <p className="font-medium">{driver.ifscCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <CreditCard className="text-blue-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">UPI ID</p>
                    <p className="font-medium">{driver.upiId}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </EditableSection>
      </div>
    </div>
  );
};

export default PartnerProfile;