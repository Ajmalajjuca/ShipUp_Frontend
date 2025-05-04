import { useState } from 'react';
import { User, Settings, LogOut, Truck, MapPin, CreditCard, Bell, LifeBuoy, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../Redux/store';

const ModernProfilePage: React.FC = () => {
  const [isHovering, setIsHovering] = useState('');
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  
  // Sample user data (use actual data from Redux in production)
  const userData = user || {
    fullName: "John Doe",
    email: "John.Doe@Gmail.Com",
    phone: "9887654321",
    referralId: "RF87534"
  };
  
  // Menu items expanded for a shipping profile
  const menuItems = [
    { id: 'profile/edit', label: 'Edit Your Profile', icon: <User size={20} /> },
    { id: 'address', label: 'Address Book', icon: <MapPin size={20} /> },
    { id: 'tracking', label: 'Track Shipments', icon: <Truck size={20} /> },
    { id: 'history', label: 'Order History', icon: <History size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'support', label: 'Get Support', icon: <LifeBuoy size={20} /> },
  ];
  
  const handleNavigate = (path: string) => {
    // Handle special cases
    if (path === 'address') {
      navigate('/address');
      return;
    }
    
    navigate(`/${path}`);
  };

  return (
    <div className="w-full md:w-2/3">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="space-y-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onMouseEnter={() => setIsHovering(item.id)}
              onMouseLeave={() => setIsHovering('')}
              onClick={() => handleNavigate(item.id)}
              className="w-full bg-white hover:bg-gray-50 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group border border-gray-100"
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-4 transition-all duration-300 ${
                  isHovering === item.id 
                    ? 'bg-red-100 text-red-400' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {item.icon}
                </div>
                <span className={`font-medium transition-all duration-300 ${
                  isHovering === item.id 
                    ? 'text-red-400' 
                    : 'text-gray-800'
                }`}>
                  {item.label}
                </span>
              </div>
              <svg 
                className={`w-5 h-5 transition-all duration-300 ${
                  isHovering === item.id 
                    ? 'transform translate-x-1 text-red-400' 
                    : 'text-gray-400'
                }`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModernProfilePage;