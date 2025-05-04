import React, { useState } from 'react';
import { CreditCard, Award, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileCardProps {
  userData: {
    fullName: string;
    email: string;
    phone?: string;
    referralId?: string;
    profileImage?: string;
    loyaltyPoints?: number;
    walletBalance?: number;
  };
  showControls?: boolean;
  onLogout?: () => void;
  isEditing?: boolean;
  children?: React.ReactNode;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
  userData, 
  showControls = true, 
  onLogout,
  isEditing = false,
  children 
}) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  return (
    <div className="w-full md:w-1/3 bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100">
      {/* Header gradient banner */}
      <div className="h-12 bg-indigo-900"></div>
      
      <div className="p-6 relative">
        {/* Profile image positioned to overlap the banner */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
          {userData.profileImage && !imageError ? (
            <img 
              src={userData.profileImage}
              alt={userData.fullName}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
              onError={() => {
                console.error('Failed to load profile image:', userData.profileImage);
                setImageError(true);
              }}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-teal-500 flex items-center justify-center border-4 border-white shadow-md">
              <span className="text-white text-xl font-bold">
                {userData?.fullName?.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-bold mt-12 mb-6 text-center text-gray-800">
          {isEditing ? 'Edit Profile' : userData.fullName}
        </h2>
        
        <div className="flex flex-col items-center">
          <p className="text-gray-600 text-center">{userData.email}</p>
          {userData.phone && <p className="text-gray-600 mt-1 text-center">{userData.phone}</p>}

          {userData.referralId && (
            <div className="mt-6 w-full bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Referral Id:</span>
                <span className="font-mono font-medium text-indigo-900">{userData.referralId}</span>
              </div>
            </div>
          )}

          {/* Slot for additional content */}
          {children}
        </div>
        
        {showControls && (
          <div className="mt-6">
            {/* Balance & Loyalty Point Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl p-4 text-white shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <CreditCard size={64} />
                </div>
                <div className="flex items-center mb-2">
                  <CreditCard size={18} className="mr-2" />
                  <span className="text-sm font-medium">Wallet</span>
                </div>
                <div className="text-lg font-bold">
                  ${userData.walletBalance?.toFixed(2) || '0.00'}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Award size={64} />
                </div>
                <div className="flex items-center mb-2">
                  <Award size={18} className="mr-2" />
                  <span className="text-sm font-medium">Loyalty</span>
                </div>
                <div className="text-lg font-bold">
                  {userData.loyaltyPoints || 0} pts
                </div>
              </div>
            </div>
            
            {/* Logout Button */}
            {onLogout && (
              <button 
                onClick={onLogout}
                className="w-full mt-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-red-50 hover:to-red-100 text-gray-700 hover:text-red-600 py-3 px-4 rounded-lg transition-all duration-300 border border-gray-200 hover:border-red-200"
              >
                <span className="font-medium">Logout</span>
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;