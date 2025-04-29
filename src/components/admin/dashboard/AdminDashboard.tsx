import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  ChevronDown, 
  ChevronRight,
  Home, 
  Package, 
  Settings, 
  Truck, 
  User, 
  Users, 
  Search, 
  Menu, 
  X, 
  CheckCircle, 
  Clock, 
  BarChart2, 
  AlertCircle, 
  Compass,
  LogOut,
  HelpCircle,
  Shield,
  ChevronLeft,
  Car
} from 'lucide-react';
import UserList from './components/users/UserList';
import PartnerList from './components/partners/PartnerList';
import PartnerRequest from './components/partners/PartnerRequest';
import VehicleList from './components/vehicles/VehicleList';
import { useNavigate, useLocation } from 'react-router-dom';
import { sessionManager } from "../../../utils/sessionManager"; 
import PartnerRequestView from './components/partners/PartnerRequestView';
import PartnerDetailView from './components/partners/PartnerDetailView';
import CustomerDetailView from './components/users/CustomerDetailView';

interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  hasDropdown?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  badge?: number;
  sidebarOpen: boolean;
}

// Improved SidebarItem component with better animations and styling
const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon, 
  title, 
  hasDropdown = false, 
  isActive = false, 
  onClick,
  badge,
  sidebarOpen
}) => {
  return (
    <div 
      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200 ease-in-out rounded-md mb-1 relative
        ${isActive 
          ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-medium shadow-sm' 
          : 'text-gray-700 hover:bg-gray-100'}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <span className={`${isActive ? 'text-blue-600' : 'text-gray-500'} ${sidebarOpen ? 'mr-3' : ''} ${!sidebarOpen ? 'mx-auto' : ''}`}>
          {icon}
        </span>
        {sidebarOpen && <span className={`${isActive ? 'font-medium' : ''}`}>{title}</span>}
      </div>
      {sidebarOpen && (
        <div className="flex items-center">
          {badge && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1 mr-2">
              {badge}
            </span>
          )}
          {hasDropdown && (
            isActive ? <ChevronDown size={16} className="text-blue-600" /> : <ChevronRight size={16} className="text-gray-500" />
          )}
        </div>
      )}
      {!sidebarOpen && badge && sidebarOpen && (
        <span className="bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center absolute -right-1 -top-1">
          {badge}
        </span>
      )}
    </div>
  );
};

// Dropdown menu item with smoother animations
const DropdownItem: React.FC<{
  title: string;
  badge?: number;
  isActive?: boolean;
  onClick?: () => void;
}> = ({ title, badge, isActive = false, onClick }) => {
  return (
    <div 
      className={`px-3 py-2 rounded-md cursor-pointer transition-all duration-200 ml-7 text-sm
        ${isActive 
          ? 'bg-blue-50 text-blue-600 font-medium' 
          : 'text-gray-600 hover:bg-gray-100'}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span>{title}</span>
        {badge && (
          <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};

interface OrderCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

const OrderCard: React.FC<OrderCardProps> = ({ title, count, icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-600 font-medium">{title}</h3>
        <span className={`${color} p-2 rounded-full`}>{icon}</span>
      </div>
      <p className="text-3xl font-bold">{count}</p>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('Dashboard');
  const [activeSubItem, setActiveSubItem] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [selectedVerifiedPartnerId, setSelectedVerifiedPartnerId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    sessionManager.logout();
  };

  // Check screen size and adjust sidebar for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleDropdown = (item: string) => {
    setExpandedItems(expandedItems.includes(item) ? expandedItems.filter(i => i !== item) : [...expandedItems, item]);
    setActiveItem(item);
  };
  const isDropdownExpanded = (item: string) => expandedItems.includes(item);
  const handleSubItemClick = (item: string, subItem: string) => {
    setActiveItem(item);
    setActiveSubItem(subItem);
  };

  const orderStats = [
    { title: 'Pending', count: 37, icon: <Clock size={20} />, color: 'text-yellow-500 bg-yellow-100' },
    { title: 'Confirmed', count: 24, icon: <CheckCircle size={20} />, color: 'text-green-500 bg-green-100' },
    { title: 'Processing', count: 6, icon: <Package size={20} />, color: 'text-blue-500 bg-blue-100' },
    { title: 'Out for delivery', count: 3, icon: <Truck size={20} />, color: 'text-purple-500 bg-purple-100' },
  ];

  const secondaryStats = [
    { title: 'Delivered', count: 35, icon: <CheckCircle size={20} />, color: 'text-green-500' },
    { title: 'Canceled', count: 3, icon: <X size={20} />, color: 'text-red-500' },
    { title: 'Returned', count: 2, icon: <Package size={20} />, color: 'text-orange-500' },
    { title: 'Failed To Deliver', count: 2, icon: <AlertCircle size={20} />, color: 'text-red-500' }
  ];

  // Function to render the main content based on route and activeSubItem
  const renderMainContent = () => {
    // If a user is selected for viewing details
    if (selectedUserId) {
      return <CustomerDetailView
               userId={selectedUserId}
               onBack={() => {
                 setSelectedUserId(null);
                 setActiveItem('Users');
                 setActiveSubItem('User List');
               }}
             />;
    }

    // If a partner request is selected for viewing details
    if (selectedPartnerId) {
      return <PartnerRequestView 
               partnerId={selectedPartnerId} 
               onBack={() => {
                 setSelectedPartnerId(null);
                 setActiveItem('Partners');
                 setActiveSubItem('Requests');
               }}
             />;
    }

    // If a verified partner is selected for viewing details
    if (selectedVerifiedPartnerId) {
      return <PartnerDetailView 
               partnerId={selectedVerifiedPartnerId} 
               onBack={() => {
                 setSelectedVerifiedPartnerId(null);
                 setActiveItem('Partners');
                 setActiveSubItem('Partner List');
               }}
             />;
    }

    // Otherwise render based on activeSubItem
    switch (activeSubItem) {
      case 'User List':
        return <UserList onViewUser={(id) => setSelectedUserId(id)} />;
      case 'Partner List':
        return <PartnerList onViewPartner={(id) => setSelectedVerifiedPartnerId(id)} />;
      case 'Requests':
        return <PartnerRequest onViewPartner={(id) => setSelectedPartnerId(id)} />;
      case 'Vehicle List':
        return <VehicleList onViewVehicle={(id) => setSelectedVehicleId(id)} />;
      default:
        return (
          <>
            {/* Dashboard content */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Welcome, Admin!</h2>
              <p className="text-gray-600">Monitor your logistics operations and statistics</p>
            </div>

            {/* Business Analytics */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <BarChart2 size={20} className="text-blue-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-700">Business Analytics</h2>
                </div>
                <select 
                  className="border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Select time period"
                >
                  <option>Overall Statistics</option>
                  <option>Weekly Report</option>
                  <option>Monthly Report</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {orderStats.map((stat, index) => (
                  <OrderCard 
                    key={index}
                    title={stat.title}
                    count={stat.count}
                    icon={stat.icon}
                    color={stat.color}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {secondaryStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                  <div>
                    <h3 className="text-sm text-gray-600">{stat.title}</h3>
                    <p className="text-xl font-bold">{stat.count}</p>
                  </div>
                  <span className={`${stat.color}`}>{stat.icon}</span>
                </div>
              ))}
            </div>

            {/* Order Statistics */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div className="flex items-center mb-3 md:mb-0">
                  <Package size={20} className="text-blue-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-700">Order Statistics</h2>
                </div>
                <div className="flex space-x-2">
                  <button className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg text-sm shadow-sm hover:shadow-md transition-shadow duration-200">This Year</button>
                  <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition-colors duration-200">This Month</button>
                  <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition-colors duration-200">This Week</button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Order Status Statistics</h3>
                <div className="h-64 w-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Chart placeholder - Order status distribution</p>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Always visible */}
      <div className={`${isMobile ? 'fixed' : 'relative'} z-20 h-full transform transition-all duration-300 ease-in-out 
        ${sidebarOpen ? 'w-64 translate-x-0' : 'w-16 translate-x-0'} 
        bg-white shadow-lg flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            {sidebarOpen && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-2 rounded-lg shadow-sm">
                <Truck size={20} />
              </div>
            )}
            {sidebarOpen && (
              <h1 onClick={() => navigate('/')} className="ml-3 text-xl font-semibold">
                Ship<span className="text-red-500 font-bold">Up</span>
              </h1>
            )}
            {!sidebarOpen && (
              <div className="flex justify-center w-full">
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-1 rounded-lg shadow-sm">
                  <Truck size={18} />
                </div>
              </div>
            )}
          </div>
          <button 
            className={`text-gray-500 hover:text-gray-700 transition-colors duration-200 focus:outline-none ${!sidebarOpen && 'hidden'}`}
            onClick={toggleSidebar}
            title="Toggle sidebar"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Sidebar content with improved section separation */}
        <div className={`p-3 flex-1 overflow-y-auto ${!sidebarOpen && 'overflow-visible'}`}>
          <div className="mb-6">
            <SidebarItem 
              icon={<Home size={18} />} 
              title="Dashboard" 
              isActive={activeItem === 'Dashboard'}
              onClick={() => {
                setActiveItem('Dashboard');
                setActiveSubItem(null);
              }}
              sidebarOpen={sidebarOpen}
            />
          </div>
          
          {sidebarOpen && (
            <div className="mb-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
                Management
              </p>
            </div>
          )}
          
          {/* Users section */}
          <div className="mb-2">
            <SidebarItem 
              icon={<Users size={18} />} 
              title="Users" 
              hasDropdown={true}
              isActive={activeItem === 'Users'}
              onClick={() => toggleDropdown('Users')}
              sidebarOpen={sidebarOpen}
            />
            
            {isDropdownExpanded('Users') && sidebarOpen && (
              <div className="my-1 transition-all duration-300 ease-in-out" style={{maxHeight: '500px', overflow: 'hidden'}}>
                <DropdownItem 
                  title="User List" 
                  isActive={activeSubItem === 'User List'} 
                  onClick={() => handleSubItemClick('Users', 'User List')}
                />
              </div>
            )}
            
            {/* Partners section */}
            <SidebarItem 
              icon={<Truck size={18} />} 
              title="Partners" 
              hasDropdown={true}
              isActive={activeItem === 'Partners'}
              onClick={() => toggleDropdown('Partners')}
              sidebarOpen={sidebarOpen}
            />
            
            {isDropdownExpanded('Partners') && sidebarOpen && (
              <div className="my-1 transition-all duration-300 ease-in-out" style={{maxHeight: '500px', overflow: 'hidden'}}>
                <DropdownItem 
                  title="Partner List" 
                  isActive={activeSubItem === 'Partner List'} 
                  onClick={() => handleSubItemClick('Partners', 'Partner List')}
                />
                <DropdownItem 
                  title="Requests" 
                  isActive={activeSubItem === 'Requests'} 
                  onClick={() => handleSubItemClick('Partners', 'Requests')}
                />
              </div>
            )}
            
            {/* Vehicles section */}
            <SidebarItem 
              icon={<Car size={18} />} 
              title="Vehicles" 
              hasDropdown={true}
              isActive={activeItem === 'Vehicles'}
              onClick={() => toggleDropdown('Vehicles')}
              sidebarOpen={sidebarOpen}
            />
            
            {isDropdownExpanded('Vehicles') && sidebarOpen && (
              <div className="my-1 transition-all duration-300 ease-in-out" style={{maxHeight: '500px', overflow: 'hidden'}}>
                <DropdownItem 
                  title="Vehicle List" 
                  isActive={activeSubItem === 'Vehicle List'} 
                  onClick={() => handleSubItemClick('Vehicles', 'Vehicle List')}
                />
              </div>
            )}
            
            {/* Orders section */}
            <SidebarItem 
              icon={<Package size={18} />} 
              title="Orders" 
              hasDropdown={true}
              isActive={activeItem === 'Orders'}
              onClick={() => toggleDropdown('Orders')}
              sidebarOpen={sidebarOpen}
            />
            
            {isDropdownExpanded('Orders') && sidebarOpen && (
              <div className="my-1 transition-all duration-300 ease-in-out" style={{maxHeight: '500px', overflow: 'hidden'}}>
                <DropdownItem 
                  title="All Orders" 
                  isActive={activeSubItem === 'All Orders'} 
                  onClick={() => handleSubItemClick('Orders', 'All Orders')}
                />
                <DropdownItem 
                  title="Pending Orders" 
                  isActive={activeSubItem === 'Pending Orders'} 
                  onClick={() => handleSubItemClick('Orders', 'Pending Orders')}
                />
                <DropdownItem 
                  title="Completed Orders" 
                  isActive={activeSubItem === 'Completed Orders'} 
                  onClick={() => handleSubItemClick('Orders', 'Completed Orders')}
                />
              </div>
            )}
          </div>
          
          {sidebarOpen && (
            <div className="mb-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
                Analytics & Operations
              </p>
            </div>
          )}
          
          <div className="mb-6">  
            <SidebarItem 
              icon={<BarChart2 size={18} />} 
              title="Analytics" 
              isActive={activeItem === 'Analytics'}
              onClick={() => {
                setActiveItem('Analytics');
                setActiveSubItem(null);
              }}
              sidebarOpen={sidebarOpen}
            />
            
            <SidebarItem 
              icon={<Compass size={18} />} 
              title="Route Management" 
              isActive={activeItem === 'Route Management'}
              onClick={() => {
                setActiveItem('Route Management');
                setActiveSubItem(null);
              }}
              sidebarOpen={sidebarOpen}
            />
          </div>
          
          {sidebarOpen && (
            <div className="mb-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
                System
              </p>
            </div>
          )}
          
          <div>
            <SidebarItem 
              icon={<Settings size={18} />} 
              title="Settings" 
              isActive={activeItem === 'Settings'}
              onClick={() => {
                setActiveItem('Settings');
                setActiveSubItem(null);
              }}
              sidebarOpen={sidebarOpen}
            />
            
            <SidebarItem 
              icon={<Shield size={18} />} 
              title="Security" 
              isActive={activeItem === 'Security'}
              onClick={() => {
                setActiveItem('Security');
                setActiveSubItem(null);
              }}
              sidebarOpen={sidebarOpen}
            />
            
            <SidebarItem 
              icon={<HelpCircle size={18} />} 
              title="Help & Support" 
              isActive={activeItem === 'Help & Support'}
              onClick={() => {
                setActiveItem('Help & Support');
                setActiveSubItem(null);
              }}
              sidebarOpen={sidebarOpen}
            />
          </div>
        </div>
        
        {/* User profile section in sidebar */}
        {sidebarOpen ? (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center mr-3 shadow-sm">
                A
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium">Admin User</h4>
                <p className="text-xs text-gray-500">System Administrator</p>
              </div>
              <button
              onClick={handleLogout}
              className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-sm"
                title="Logout"
            >
              <LogOut size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-gray-200 flex justify-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-sm cursor-pointer">
              A
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isMobile && sidebarOpen ? 'ml-64' : ''}`}>
        {/* Top Navigation - Always visible */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
          {/* Mobile menu toggle */}
          {isMobile ? (
            <button 
              className="text-gray-500 mr-4 md:hidden" 
              onClick={toggleSidebar}
              title="Toggle menu"
            >
              <Menu size={24} />
            </button>
          ) : (
            !sidebarOpen && (
              <button 
                className="text-gray-500 mr-4" 
                onClick={toggleSidebar}
                title="Toggle menu"
              >
                <Menu size={24} />
              </button>
            )
          )}
          
          <h1 className="text-xl font-semibold text-gray-800">
            {selectedPartnerId || selectedVerifiedPartnerId 
              ? 'Deliveryman Details' 
              : selectedUserId
                ? 'Customer Details'
                : (activeSubItem || activeItem)}
          </h1>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="Search..." 
                className="py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
              />
              <Search size={18} className="absolute top-2.5 left-3 text-gray-400" />
            </div>
            
            <div className="relative">
              <Bell size={20} className="text-gray-600 cursor-pointer hover:text-blue-500 transition-colors duration-200" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                2
              </span>
            </div>
            
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center mr-2 shadow-sm">
                A
              </div>
              <span className="text-gray-700 font-medium hidden md:inline">Admin</span>
            </div>
          </div>
        </header>

        {/* Main Content - Changes based on route/active item */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;