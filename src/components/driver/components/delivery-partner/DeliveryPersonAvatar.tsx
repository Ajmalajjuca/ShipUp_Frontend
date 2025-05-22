import React from 'react';
import { Star, User } from 'lucide-react';

interface DeliveryPersonAvatarProps {
  rating: number;
  driverDetails: any;
  onClick: () => void;
}

const DeliveryPersonAvatar: React.FC<DeliveryPersonAvatarProps> = ({
  rating,
  driverDetails,
  onClick
}) => {
  const profileImage: string = driverDetails?.profilePicturePath || '';
  const hasProfileImage = !!profileImage;

  return (
    <div
      className="relative bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col items-center cursor-pointer hover:shadow-lg transition-all duration-300"
      onClick={onClick}
    >
      <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 flex items-center">
        <Star size={16} className="text-yellow-500 mr-1" />
        <span className="font-bold">{rating.toFixed(1)}</span>
      </div>
      <div className="mb-4">
        {hasProfileImage ? (
          <img
            src={profileImage}
            alt="Delivery Partner Avatar"
            className="h-48 w-48 rounded-full object-cover border-2 border-blue-100"
            onError={(e) => {
              console.error("Error loading image:", profileImage);
              e.currentTarget.style.display = 'none';
              const fallbackEl = e.currentTarget.parentElement?.querySelector('.fallback-avatar') as HTMLDivElement;
              if (fallbackEl) {
                fallbackEl.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          className={`h-48 w-48 rounded-full bg-blue-100 flex items-center justify-center fallback-avatar ${hasProfileImage ? 'hidden' : 'flex'}`}
        >
          <User size={64} className="text-blue-500" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="font-bold text-xl mb-1">{driverDetails?.fullName || 'Loading...'}</h3>
        <p className="text-gray-500 mb-4">Delivery Partner</p>
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="text-center p-3 bg-blue-50 rounded-xl">
            <p className="text-sm text-gray-500">Orders</p>
            <p className="font-bold text-xl">{driverDetails?.totalOrders || 0}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="font-bold text-xl">{driverDetails?.completedOrders || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPersonAvatar;