// File: DeliveryPartnerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Bell, User, Package, Home, HelpCircle, DollarSign, Info, ChevronRight, Map, Clock, Star, Calendar, Truck, LogOut } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../../Redux/store';
import { partnerApi } from '../../../services/axios/instance';
import { setDriverData, clearDriverData } from '../../../Redux/slices/driverSlice';
import { sessionManager } from '../../../utils/sessionManager';



// Types
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

// Navigation Item Component
const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md' 
        : 'text-gray-600 hover:bg-blue-50'
    }`}
  >
    <span className="mr-3">{icon}</span>
    <span className="font-medium">{label}</span>
    {active && <ChevronRight size={18} className="ml-auto" />}
  </button>
);

// OnlineStatus Component with working toggle
const OnlineStatusToggle: React.FC<{ isOnline: boolean; onToggle: () => void }> = ({ 
  isOnline, 
  onToggle 
}) => {
  // Animation for status indicator
  const [position, setPosition] = useState(isOnline ? 100 : 0);

  useEffect(() => {
    setPosition(isOnline ? 100 : 0);
  }, [isOnline]);

  return (
    <div className="flex flex-col items-center gap-4 mb-6">
      <div 
        className={`relative px-8 py-3 rounded-xl text-white font-medium transition-all duration-300 shadow-lg ${
          isOnline 
            ? 'bg-gradient-to-r from-green-500 to-green-400' 
            : 'bg-gradient-to-r from-red-500 to-red-400'
        }`}
      >
        {isOnline ? 'Online' : 'Offline'}
      </div>
      
      <div className="flex items-center">
        {isOnline ? (
          <button 
            onClick={onToggle}
            className="relative inline-flex h-8 w-16 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border border-gray-200"
            style={{ backgroundColor: '#10b981' }}
            role="switch" 
            aria-checked="true"
            aria-label="Toggle online status"
          >
            <span 
              className="inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300"
              style={{ transform: `translateX(100%)` }}
            />
          </button>
        ) : (
          <button 
            onClick={onToggle}
            className="relative inline-flex h-8 w-16 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border border-gray-200"
            style={{ backgroundColor: '#e5e7eb' }}
            role="switch" 
            aria-checked="false"
            aria-label="Toggle online status"
          >
            <span 
              className="inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300"
              style={{ transform: `translateX(0%)` }}
            />
          </button>
        )}
      </div>
    </div>
  );
};

// Modern Stats Card Component
const StatsCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
}> = ({ icon, title, value, trend, trendValue, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }[color] || 'bg-blue-50 text-blue-600';

  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center mb-3">
        <div className={`p-2 rounded-lg ${colorClasses} mr-3`}>
          {icon}
        </div>
        <h3 className="text-gray-700 font-medium">{title}</h3>
      </div>
      <div className="flex items-baseline">
        <p className="text-2xl font-bold">{value}</p>
        {trend && trendValue && (
          <span className={`ml-2 text-sm font-medium flex items-center ${trendColor}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
          </span>
        )}
      </div>
    </div>
  );
};

// Quick Action Button
const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ 
  icon, label, onClick 
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:bg-blue-50"
  >
    <div className="p-2 rounded-full bg-blue-100 text-blue-600 mb-2">
      {icon}
    </div>
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </button>
);

// Get Started Card Component (Improved)
const GetStartedCard: React.FC<{ isOnline: boolean; onToggle: () => void }> = ({ isOnline, onToggle }) => (
  <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 mb-8">
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold mb-2 flex items-center justify-center">
        Gear Up, Partner! <span className="ml-2">🚀</span>
      </h2>
      <h3 className="text-3xl font-bold bg-gradient-to-r from-coral-500 to-orange-400 bg-clip-text text-transparent">
        Go Online And Take Your<br />First Order
      </h3>
    </div>
    
    <OnlineStatusToggle isOnline={isOnline} onToggle={onToggle} />
    
    {isOnline && (
      <div className="grid grid-cols-3 gap-3 mt-6">
        <ActionButton 
          icon={<Map size={20} />} 
          label="Navigation" 
          onClick={() => console.log('Navigation clicked')} 
        />
        <ActionButton 
          icon={<Clock size={20} />} 
          label="Schedule" 
          onClick={() => console.log('Schedule clicked')} 
        />
        <ActionButton 
          icon={<Package size={20} />} 
          label="Orders" 
          onClick={() => console.log('Orders clicked')} 
        />
      </div>
    )}
  </div>
);

// Active Delivery Card
const ActiveDeliveryCard: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  
  return (
    <div className="bg-white rounded-2xl shadow-md border-l-4 border-l-green-500 border-gray-100 p-5 mb-6 animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg">Active Delivery</h3>
        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">In Progress</span>
      </div>
      
      <div className="flex items-center mb-4">
        <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
          <Map size={18} />
        </div>
        <div>
          <p className="text-sm text-gray-500">Destination</p>
          <p className="font-medium">123 Main St, Cityville</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="p-2 rounded-full bg-orange-100 text-orange-600 mr-3">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-sm text-gray-500">ETA</p>
            <p className="font-medium">15 minutes</p>
          </div>
        </div>
        
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Details
        </button>
      </div>
    </div>
  );
};

// Modern Avatar Component
const DeliveryPersonAvatar: React.FC<{ 
  rating: number,
  driverData: any,
  onClick: () => void
}> = ({ rating, driverData, onClick }) => {
  // Log data to help with debugging
  
  // Extract profile image URL or default to null
  const profileImage = driverData?.profilePicturePath
  

  return (
  <div className="relative bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col items-center cursor-pointer hover:shadow-lg transition-all duration-300" onClick={onClick}>
    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 flex items-center">
      <Star size={16} className="text-yellow-500 mr-1" />
      <span className="font-bold">{rating.toFixed(1)}</span>
    </div>
    
    <div className="mb-4">
      {profileImage ? (
        <img 
          src={profileImage} 
          alt="Delivery Partner Avatar" 
          className="h-48 w-48 rounded-full object-cover border-2 border-blue-100"
          onError={(e) => {
            console.error("Error loading image:", profileImage);
            // Fall back to the user icon if image fails to load
            e.currentTarget.style.display = 'none';
            const fallbackEl = e.currentTarget.parentElement!.querySelector('.fallback-avatar') as HTMLDivElement;
            if (fallbackEl) {
              fallbackEl.style.display = 'flex';
            }
          }}
        />
      ) : null}
      
      {/* Fallback avatar that will be shown if image doesn't exist or fails to load */}
      <div 
        className={`h-48 w-48 rounded-full bg-blue-100 flex items-center justify-center fallback-avatar ${profileImage ? 'hidden' : 'flex'}`}
      >
        <User size={64} className="text-blue-500" />
      </div>
    </div>
    
    <div className="text-center">
      <h3 className="font-bold text-xl mb-1">{driverData?.fullName || 'Loading...'}</h3>
      <p className="text-gray-500 mb-4">Delivery Partner</p>
      
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="text-center p-3 bg-blue-50 rounded-xl">
          <p className="text-sm text-gray-500">Orders</p>
          <p className="font-bold text-xl">{driverData?.totalOrders || 0}</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-xl">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="font-bold text-xl">{driverData?.completedOrders || 0}</p>
        </div>
      </div>
    </div>
  </div>
)};

// Performance Card
const PerformanceCard: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-bold text-lg">Your Performance</h3>
      <select 
        className="bg-gray-100 border-0 rounded-lg text-sm p-2"
        aria-label="Performance time period"
        title="Select time period"
      >
        <option>This Week</option>
        <option>This Month</option>
        <option>Last Month</option>
      </select>
    </div>
    
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-600">On-time De  livery</span>
      <span className="font-medium">96%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
      <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }}></div>
    </div>
    
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-600">Customer Satisfaction</span>
      <span className="font-medium">92%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
    </div>
    
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-600">Order Acceptance</span>
      <span className="font-medium">88%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '88%' }}></div>
    </div>
  </div>
);

// Main Dashboard Component
const DeliveryPartnerDashboard: React.FC = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const Email = useSelector((state: RootState) => state.driver.email);
  const driver = useSelector((state: RootState) => state.driver);
  

  
  const fetchDriverDetails = async () => { 
    try {
      // Check if we already have driver data
      if (!driver.driverData) {
        const response = await partnerApi.get(`/api/drivers/by-email/${Email}`);
        console.log('Driver details:', response.data);
        
        
        dispatch(setDriverData({ 
          driverData: response.data.partner.partnerDetails,
          token: response.data.token || driver.token
        }));
      }
    } catch (error) {
      console.error('Error fetching driver details:', error);
    }
  }

  useEffect(() => {
    if (Email && !driver.driverData) {      
      fetchDriverDetails();
    }
  }, [Email, driver.driverData]);

  const toggleOnline = () => {
    setIsOnline(!isOnline);
  };
  
  const handleLogout = async () => {
    try {
      // Clear the partner session
      sessionManager.clearDriverSession();
      
      // Clear all cookies
      document.cookie.split(";").forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });

      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();

      // Clear Redux state
      dispatch(clearDriverData());

      // Redirect to login page
      navigate('/partner', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, still try to redirect
      navigate('/partner', { replace: true });
    }
  };
  
  const navigateToProfile = () => {
    navigate('/partner/profile');
  };

  const scrollToTop = () => {
    if (document.documentElement) {
      document.documentElement.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Header */}
        <header className="flex justify-between items-center mb-6 bg-white p-3 rounded-xl shadow-sm">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">ShipUp</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label="Notifications"
                title="View notifications"
              >
                <Bell size={20} className="text-gray-700" />
              </button>
              <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500"></span>
            </div>

            {/* Profile Button */}
            {/* <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-blue-600"
              onClick={navigateToProfile}
              title="View profile"
            >
              <User size={18} />
              <span className="font-medium">Profile</span>
            </button> */}
            
            {/* Logout Button */}
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors text-red-600"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={18} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </header>

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-white rounded-xl shadow-sm p-3 h-full">
            <nav className="flex flex-col gap-2">
              <NavItem 
                icon={<Home size={20} />} 
                label="Home" 
                active={activeNav === 'home'} 
                onClick={() => setActiveNav('home')}
              />
              <NavItem 
                icon={<Package size={20} />} 
                label="Deliveries" 
                active={activeNav === 'deliveries'} 
                onClick={() => setActiveNav('deliveries')}
              />
              <NavItem 
                icon={<DollarSign size={20} />} 
                label="Earnings" 
                active={activeNav === 'earnings'} 
                onClick={() => setActiveNav('earnings')}
              />
              <NavItem 
                icon={<Calendar size={20} />} 
                label="Schedule" 
                active={activeNav === 'schedule'} 
                onClick={() => setActiveNav('schedule')}
              />
              <NavItem 
                icon={<HelpCircle size={20} />} 
                label="Support" 
                active={activeNav === 'support'} 
                onClick={() => setActiveNav('support')}
              />
              <NavItem 
                icon={<Info size={20} />} 
                label="About" 
                active={activeNav === 'about'} 
                onClick={() => setActiveNav('about')}
              />
              <NavItem 
                icon={<User size={20} />} 
                label="Profile" 
                active={activeNav === 'profile'} 
                onClick={() => navigate('/partner/profile')}
              />
              <NavItem 
                icon={<LogOut size={20} />} 
                label="Logout" 
                active={false} 
                onClick={handleLogout}
              />
            </nav>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-700 mb-2">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-3">Have questions or facing issues with your deliveries?</p>
              <button className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Contact Support
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <GetStartedCard isOnline={isOnline} onToggle={toggleOnline} />
                
                <ActiveDeliveryCard visible={isOnline} />
                
                {/* Stats Grid */}
                <h3 className="font-bold text-lg text-gray-800 mb-3">Overview</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <StatsCard 
                    icon={<Package size={18} />} 
                    title="Today's Deliveries" 
                    value={isOnline ? "2" : "0"} 
                    color="blue"
                  />
                  <StatsCard 
                    icon={<DollarSign size={18} />} 
                    title="Today's Earnings" 
                    value={isOnline ? "$24.50" : "$0.00"} 
                    color="green"
                  />
                  <StatsCard 
                    icon={<Truck size={18} />} 
                    title="This Week" 
                    value="12" 
                    trend="up"
                    trendValue="15%"
                    color="orange"
                  />
                  <StatsCard 
                    icon={<DollarSign size={18} />} 
                    title="This Week" 
                    value="$247.50" 
                    trend="up"
                    trendValue="22%"
                    color="purple"
                  />
                </div>
                
                <PerformanceCard />
              </div>
              
              <div className="lg:col-span-2">
                <DeliveryPersonAvatar 
                  rating={4.8} 
                  driverData={driver.driverData}
                  onClick={navigateToProfile}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// Add some CSS animations


export default DeliveryPartnerDashboard;