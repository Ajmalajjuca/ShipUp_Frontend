// File: DeliveryPartnerDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, User, Package, Home, HelpCircle, DollarSign, Info, ChevronRight, Map, Clock, Star, Calendar, Truck, LogOut, MapPin, Flag, CheckCircle, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../../Redux/store';
import { partnerApi } from '../../../services/axios/instance';
import { setDriverData, clearDriverData } from '../../../Redux/slices/driverSlice';
import { sessionManager } from '../../../utils/sessionManager';
import toast from 'react-hot-toast';
import { Socket as SocketIOClient } from 'socket.io-client';
import io from 'socket.io-client';




// Types
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

interface Location {
  latitude: number;
  longitude: number;
  street?: string;
}

interface DeliveryRequest {
  orderId: string;
  pickupLocation: Location;
  dropLocation: Location;
  customerName: string;
  amount: number;
  estimatedTime:string;
  distance:number;
  expiresIn: number;
  paymentMethod:string;
  pickupOtp?: string;
  dropoffOtp?: string;
}

interface OtpVerification {
  isVerifying: boolean;
  type: 'pickup' | 'dropoff';
  enteredOtp: string;
  orderOtp?: string;
}

// Navigation Item Component
const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${active
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
const OnlineStatusToggle: React.FC<{ isOnline: boolean; onToggle: () => void; isLoading?: boolean }> = ({
  isOnline, 
  onToggle,
  isLoading = false
}) => {
  // Animation for status indicator
  const [position, setPosition] = useState(isOnline ? 100 : 0);

  useEffect(() => {
    setPosition(isOnline ? 100 : 0);
  }, [isOnline]);

  return (
    <div className="flex flex-col items-center gap-4 mb-6">
      <div 
        className={`relative px-8 py-3 rounded-xl text-white font-medium transition-all duration-300 shadow-lg ${isOnline
            ? 'bg-gradient-to-r from-green-500 to-green-400' 
            : 'bg-gradient-to-r from-red-500 to-red-400'
        }`}
      >
        {isLoading ? 'Updating...' : isOnline ? 'Online' : 'Offline'}
      </div>
      
      <div className="flex items-center">
        {isOnline ? (
          <button 
            onClick={onToggle}
            disabled={isLoading}
            className={`relative inline-flex h-8 w-16 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border border-gray-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: '#10b981' }}
            role="switch" 
            aria-checked="true"
            aria-label="Toggle online status"
          >
            <span 
              className="inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300"
              style={{ transform: `translateX(140%)` }}
            />
          </button>
        ) : (
          <button 
            onClick={onToggle}
            disabled={isLoading}
            className={`relative inline-flex h-8 w-16 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border border-gray-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: '#e5e7eb' }}
            role="switch" 
            aria-checked="false"
            aria-label="Toggle online status"
          >
            <span 
              className="inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300"
              style={{ transform: `translateX(15%)` }}
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
const GetStartedCard: React.FC<{ isOnline: boolean; onToggle: () => void; isLoading?: boolean }> = ({
  isOnline,
  onToggle,
  isLoading = false
}) => (
  <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 mb-8">
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold mb-2 flex items-center justify-center">
        Gear Up, Partner! <span className="ml-2">🚀</span>
      </h2>
      <h3 className="text-3xl font-bold bg-gradient-to-r from-coral-500 to-orange-400 bg-clip-text text-transparent">
        Go Online And Take Your<br />First Order
      </h3>
    </div>
    
    <OnlineStatusToggle isOnline={isOnline} onToggle={onToggle} isLoading={isLoading} />
    
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
const ActiveDeliveryCard: React.FC<{ 
  visible: boolean; 
  orderDetails: DeliveryRequest | null;
  onMarkPickedUp: () => void;
  onMarkDelivered: () => void;
  deliveryStatus: 'heading_to_pickup' | 'picked_up' | 'delivering';
  onVerifyOtp: (type: 'pickup' | 'dropoff', otp: string) => void;
}> = ({ 
  visible, 
  orderDetails, 
  onMarkPickedUp, 
  onMarkDelivered,
  deliveryStatus,
  onVerifyOtp
}) => {
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState(false);

  if (!visible || !orderDetails) return null;
  
  const handleOtpSubmit = (type: 'pickup' | 'dropoff') => {
    if (otpInput.trim().length !== 4) {
      setOtpError(true);
      return;
    }
    
    setOtpError(false);
    onVerifyOtp(type, otpInput);
    setOtpInput('');
  };

  return (
    <div className="bg-white border shadow-sm rounded-lg overflow-hidden">
      <div className="p-4 bg-indigo-50 border-b">
        <h3 className="font-medium text-indigo-900">Active Delivery</h3>
      </div>
      
      <div className="p-4">
        {/* Status indicators */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              deliveryStatus === 'heading_to_pickup' ? 'bg-yellow-100 text-yellow-600' : 
              'bg-green-100 text-green-600'
            }`}>
              {deliveryStatus === 'heading_to_pickup' ? 
                <MapPin size={20} /> : 
                <CheckCircle size={20} />
              }
            </div>
            <div className="ml-3">
              <p className="font-medium">Pickup Location</p>
              <p className="text-sm text-gray-600 truncate max-w-xs">{orderDetails.pickupLocation.street || 'Address not available'}</p>
            </div>
          </div>
          
          <div className="w-10 flex justify-center">
            <div className="h-8 border-l-2 border-dashed border-gray-300"></div>
          </div>
          
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              deliveryStatus === 'delivering' ? 'bg-green-100 text-green-600' : 
              (deliveryStatus === 'picked_up' ? 'bg-yellow-100 text-yellow-600' : 
              'bg-gray-100 text-gray-400')
            }`}>
              {deliveryStatus === 'delivering' ? 
                <CheckCircle size={20} /> : 
                <Flag size={20} />
              }
            </div>
            <div className="ml-3">
              <p className="font-medium">Dropoff Location</p>
              <p className="text-sm text-gray-600 truncate max-w-xs">{orderDetails.dropLocation.street || 'Address not available'}</p>
            </div>
          </div>
        </div>
        
        {/* Delivery details */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Order ID:</span>
            <span className="font-medium">{orderDetails.orderId.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Customer:</span>
            <span className="font-medium">{orderDetails.customerName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Distance:</span>
            <span className="font-medium">{orderDetails.distance.toFixed(1)} km</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment:</span>
            <span className="font-medium">{orderDetails.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">₹{orderDetails.amount.toFixed(2)}</span>
          </div>
        </div>
        
        {/* OTP verification for pickup */}
        {deliveryStatus === 'heading_to_pickup' && (
          <>
            <p className="text-sm text-gray-600 mb-3">
              When you arrive at the pickup location, ask the customer for their OTP to verify pickup.
            </p>
            
            <div className="mt-4 mb-6">
              <label htmlFor="pickupOtp" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Pickup OTP
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="pickupOtp"
                  className={`block w-full rounded-l-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                    otpError ? 'ring-red-300 placeholder:text-red-300' : 'ring-gray-300 placeholder:text-gray-400'
                  } focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-center text-xl tracking-widest`}
                  placeholder="Enter 4-digit OTP"
                  value={otpInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 4) {
                      setOtpInput(value);
                      setOtpError(false);
                    }
                  }}
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => handleOtpSubmit('pickup')}
                  className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
                >
                  Verify
                </button>
              </div>
              {otpError && (
                <p className="mt-1 text-sm text-red-600">
                  Please enter a valid 4-digit OTP
                </p>
              )}
            </div>
            
            <div className="flex space-x-4">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${orderDetails.pickupLocation.latitude},${orderDetails.pickupLocation.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-4 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors text-center flex items-center justify-center"
              >
                <Map size={16} className="mr-2" />
                Navigate to Pickup
              </a>
            </div>
          </>
        )}
        
        {/* OTP verification for dropoff */}
        {deliveryStatus === 'picked_up' && (
          <>
            <p className="text-sm text-gray-600 mb-3">
              When you arrive at the dropoff location, ask the customer for their OTP to verify delivery.
            </p>
            
            <div className="mt-4 mb-6">
              <label htmlFor="dropoffOtp" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Dropoff OTP
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="dropoffOtp"
                  className={`block w-full rounded-l-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                    otpError ? 'ring-red-300 placeholder:text-red-300' : 'ring-gray-300 placeholder:text-gray-400'
                  } focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-center text-xl tracking-widest`}
                  placeholder="Enter 4-digit OTP"
                  value={otpInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 4) {
                      setOtpInput(value);
                      setOtpError(false);
                    }
                  }}
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => handleOtpSubmit('dropoff')}
                  className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
                >
                  Verify
                </button>
              </div>
              {otpError && (
                <p className="mt-1 text-sm text-red-600">
                  Please enter a valid 4-digit OTP
                </p>
              )}
            </div>
            
            <div className="flex space-x-4">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${orderDetails.dropLocation.latitude},${orderDetails.dropLocation.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-4 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors text-center flex items-center justify-center"
              >
                <Map size={16} className="mr-2" />
                Navigate to Dropoff
              </a>
            </div>
          </>
        )}
        
        {/* Buttons for completing the delivery process */}
        {deliveryStatus === 'heading_to_pickup' && (
          <div className="mt-6">
            <button 
              onClick={onMarkPickedUp}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Confirm Item Pickup
            </button>
          </div>
        )}
        
        {deliveryStatus === 'picked_up' && (
          <div className="mt-6">
            <button 
              onClick={onMarkDelivered}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Confirm Delivery
            </button>
          </div>
        )}
        
        {deliveryStatus === 'delivering' && (
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-2" />
            <p className="font-medium text-green-700">Delivery completed!</p>
            <p className="text-sm text-green-600 mb-3">Well done! You've successfully completed this delivery.</p>
            <p className="text-xs text-gray-500">This card will disappear soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Modern Avatar Component
const DeliveryPersonAvatar: React.FC<{ 
  rating: number,
  driverDetails: any,
  onClick: () => void
}> = ({ rating, driverDetails, onClick }) => {
  // Extract profile image URL and ensure it's always a string
  console.log('Driver details:', driverDetails);
  
  const profileImage: string = driverDetails?.profilePicturePath || '';
  const hasProfileImage = !!profileImage;

  return (
  <div className="relative bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col items-center cursor-pointer hover:shadow-lg transition-all duration-300" onClick={onClick}>
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
            // Fall back to the user icon if image fails to load
            e.currentTarget.style.display = 'none';
              const fallbackEl = e.currentTarget.parentElement?.querySelector('.fallback-avatar') as HTMLDivElement;
            if (fallbackEl) {
              fallbackEl.style.display = 'flex';
            }
          }}
        />
      ) : null}
      
      {/* Fallback avatar that will be shown if image doesn't exist or fails to load */}
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
  )
};

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
  const [activeNav, setActiveNav] = useState('home');
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveDelivery, setHasActiveDelivery] = useState(false);
  const [deliveryRequest, setDeliveryRequest] = useState<DeliveryRequest | null>(null);
  const [activeDeliveryDetails, setActiveDeliveryDetails] = useState<DeliveryRequest | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<'heading_to_pickup' | 'picked_up' | 'delivering'>('heading_to_pickup');
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [wsEvents, setWsEvents] = useState<string[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [otpVerification, setOtpVerification] = useState<OtpVerification>({
    isVerifying: false,
    type: 'pickup',
    enteredOtp: '',
    orderOtp: undefined
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const Email = useSelector((state: RootState) => state.driver.email);
  const driver = useSelector((state: RootState) => state.driver);
  const [isOnline, setIsOnline] = useState<boolean>(driver.driverData?.isAvailable || false);
  const socketRef = useRef<SocketIOClient | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  console.log('Driver data:', driver);


  const addWsEvent = (event: string) => {
    setWsEvents(prev => [`${new Date().toLocaleTimeString()} - ${event}`, ...prev].slice(0, 10));
  };
  
  const fetchDriverDetails = async () => { 
    try {
      // Check if we already have driver data
      if (!driver.driverDetails) {
        const response = await partnerApi.get(`/api/drivers/by-email/${Email}`);
        console.log('Driver details responce:', response.data.partner.partnerDetails);
        
        
        dispatch(setDriverData({ 
          driverData: driver.driverData,
          driverDetails: response.data.partner.partnerDetails,
          token: driver.token || ""
        }));
      }
    } catch (error) {
      console.error('Error fetching driver details:', error);
    }
  }

  useEffect(() => {
    if (Email && !driver.driverDetails) {
      fetchDriverDetails();
    }
  }, [Email, driver.driverData]);

  // Connect to WebSocket when driver data is available
  useEffect(() => {
    if (driver.driverData?.partnerId && driver.token) {
      console.log("🔌 Attempting to connect to WebSocket server...");
      console.log("👤 Partner ID:", driver.driverData.partnerId);
      addWsEvent(`Connecting with partnerId: ${driver.driverData.partnerId}`);

      // Initialize socket connection
      const socket = io('http://localhost:3003', {
        path: '/socket',
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      // Log all events for debugging
      socket.onAny((event, ...args) => {
        console.log(`🔄 Socket event: ${event}`, args);
        addWsEvent(`Event: ${event}`);
      });

      // Handle connection events
      socket.on('connect', () => {
        console.log('✅ Socket connected successfully:', socket.id);
        addWsEvent(`Connected: ${socket.id}`);

        // Authenticate with the WebSocket server
        console.log('🔑 Sending authentication...');
        socket.emit('authenticate', {
          partnerId: driver.driverData?.partnerId,
          token: driver.token
        });
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        addWsEvent(`Connect error: ${error.message}`);
        toast.error('Connection error. Retrying...');
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        addWsEvent(`Disconnected: ${reason}`);

        if (reason === 'io server disconnect') {
          // The server has forcefully disconnected the socket
          setTimeout(() => {
            socket.connect();
          }, 1000);
        }
      });

      socket.on('authenticated', (data: any) => {
        console.log('🔓 Socket authenticated:', data);
        addWsEvent(`Authenticated: ${data.partnerId}`);
        toast.success('Connected to delivery network');

        // Explicitly try to join the partner room
        console.log(`🚪 Joining room: partner_${driver.driverData?.partnerId}`);
        socket.emit('join_room', `partner_${driver.driverData?.partnerId}`);

        // Start sending location updates if driver is online
        if (isOnline) {
          startSendingLocationUpdates();
        }
      });

      socket.on('room_joined', (room: string) => {
        console.log(`✅ Joined room: ${room}`);
        addWsEvent(`Joined room: ${room}`);
      });

      socket.on('authentication_error', (error: any) => {
        console.error('🔒 Socket authentication error:', error);
        addWsEvent(`Auth error: ${error.message || 'Unknown error'}`);
        toast.error('Failed to connect to delivery network');
      });

      socket.on('delivery_request', (data: any) => {
        console.log('📦 DELIVERY REQUEST RECEIVED:', data);
        addWsEvent(`Delivery request: ${data.orderId}`);

        // Use callback version to ensure state updates
        setDeliveryRequest(prev => {
          console.log('Updating deliveryRequest from', prev, 'to', data);
          return data;
        });

        // Play notification sound if available
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(err => console.log('Sound error:', err));
        } catch (e) {
          console.log('Browser blocked sound playback');
        }

        // Show toast notification
        toast.success('New delivery request!', {
          duration: 30000,
          icon: '🚚'
        });
      });

      socket.on('location_updated', (data: any) => {
        console.log('📍 Location update confirmed:', data);
        addWsEvent(`Location updated: ${data.timestamp || 'No timestamp'}`);
      });

      socket.on('location_error', (error: any) => {
        console.error('📍 Location update error:', error);
        addWsEvent(`Location error: ${error.message || 'Unknown error'}`);
        toast.error('Failed to update your location');
      });

      socket.on('auto_offline', () => {
        console.log('⚠️ You have been automatically set offline due to inactivity');
        addWsEvent('Auto offline due to inactivity');
        setIsOnline(false);
        toast.error('You have been set offline due to inactivity');
        stopSendingLocationUpdates();
      });

      // Clean up connection on unmount
      return () => {
        console.log('🧹 Cleaning up WebSocket connection');
        stopSendingLocationUpdates();
        socket.disconnect();
      };
    }
  }, [driver.driverData?.partnerId, driver.token]);

  // Start/stop location updates based on online status
  useEffect(() => {
    if (isOnline) {
      startSendingLocationUpdates();
    } else {
      stopSendingLocationUpdates();
    }

    return () => {
      stopSendingLocationUpdates();
    };
  }, [isOnline]);

  const getCurrentLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setCurrentLocation(location);
          resolve(location);
        },
        (error) => {
          toast.error('Unable to retrieve your location. Please check your device settings.');
          console.error('Error getting location:', error);
          reject(error);
        },
        { enableHighAccuracy: true }
      );
    });
  };

  const startSendingLocationUpdates = async () => {
    try {
      // Get initial location
      const location = await getCurrentLocation();

      // Send initial location update via WebSocket
      if (socketRef.current?.connected) {
        console.log('📍 Sending initial location update via WebSocket:', location);
        socketRef.current.emit('update_location', {
          partnerId: driver.driverData?.partnerId,
          location
        });
        addWsEvent(`Sent location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
      }

      // Also send initial location update to database
      updateLocationInDatabase(location);

      // Set up interval for location updates (every 30 seconds)
      stopSendingLocationUpdates(); // Clear any existing interval

      locationIntervalRef.current = setInterval(async () => {
        try {
          const updatedLocation = await getCurrentLocation();

          // Send via WebSocket
          if (socketRef.current?.connected) {
            console.log('📍 Sending location update via WebSocket:', updatedLocation);
            socketRef.current.emit('update_location', {
              partnerId: driver.driverData?.partnerId,
              location: updatedLocation
            });
            addWsEvent(`Sent location: ${updatedLocation.latitude.toFixed(4)}, ${updatedLocation.longitude.toFixed(4)}`);
          }

          // Also send to database every 2 minutes (less frequent than WebSocket updates)
          const shouldUpdateDB = Math.random() < 0.25; // 25% chance to update DB (roughly every 2 minutes)
          if (shouldUpdateDB) {
            updateLocationInDatabase(updatedLocation);
          }
        } catch (error) {
          console.error('Failed to update location:', error);
        }
      }, 30000); // Update every 30 seconds
    } catch (error) {
      console.error('Failed to start location updates:', error);
      toast.error('Unable to access your location. Please check your device settings.');
    }
  };

  const updateLocationInDatabase = async (location: Location) => {
    try {
      if (!driver.driverData?.partnerId) return;

      console.log('📍 Updating location in database:', location);
      await partnerApi.post(`/api/drivers/${driver.driverData.partnerId}/location`, {
        location
      });
    } catch (error) {
      console.error('Failed to update location in database:', error);
    }
  };

  const stopSendingLocationUpdates = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  };

  const updateDriverAvailability = async (status: boolean) => {
    if (!driver.driverData || !driver.driverData.partnerId) {
      console.error("Driver information not available");
      return false;
    }

    setIsLoading(true);
    try {
      const location = status ? await getCurrentLocation() : null

      const response = await partnerApi.put(`/api/drivers/update-availability/${driver.driverData.partnerId}`, {
        isAvailable: status,
        location
      });

      if (response.data && response.data.success) {
        console.log(`You are now ${status ? 'online' : 'offline'}`);

        // Also update via WebSocket for real-time sync
        if (socketRef.current?.connected) {
          console.log('🔄 Sending availability update via socket:', status);
          socketRef.current.emit('set_availability', {
            partnerId: driver.driverData.partnerId,
            isAvailable: status,
            location
          });
          addWsEvent(`Set availability: ${status ? 'online' : 'offline'}`);
        }

        // Update local driver data with new availability status
        dispatch(setDriverData({
          driverData: driver.driverData,
          driverDetails: {
            ...driver.driverDetails,
            isAvailable: status,
          },
          token: driver.token || ''
        }));
        return true;
      } else {
        console.error("Failed to update availability status");
        return false;
      }
    } catch (error) {
      console.error('Error updating driver availability:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOnline = async () => {
    const newStatus = !isOnline;

    if (newStatus) {
      // Going from offline to online
      const success = await updateDriverAvailability(true);
      if (success) {
        setIsOnline(true);
        toast.success("You're now online and ready to receive orders!");
        startSendingLocationUpdates();
      }
    } else {
      // Going from online to offline
      const success = await updateDriverAvailability(false);
      if (success) {
        setIsOnline(false);
        stopSendingLocationUpdates();
      }
    }
  };

  const respondToDeliveryRequest = (accept: boolean) => {
    if (!deliveryRequest || !driver.driverData?.partnerId) return;

    console.log(`📦 ${accept ? 'Accepting' : 'Rejecting'} delivery request:`, deliveryRequest.orderId);
    addWsEvent(`${accept ? 'Accept' : 'Reject'} order: ${deliveryRequest.orderId}`);

    // Respond to the order
    if (socketRef.current?.connected) {
      socketRef.current.emit('respond_to_order', {
        partnerId: driver.driverData.partnerId,
        orderId: deliveryRequest.orderId,
        accept
      });
    }

    if (accept) {
      setHasActiveDelivery(true);
      setActiveDeliveryDetails(deliveryRequest);
      setDeliveryStatus('heading_to_pickup');
      setDeliveryRequest(null); // Clear the request modal
      toast.success('Delivery accepted! Navigate to the pickup location.');
      
      // Attempt to open Google Maps for directions
      try {
        const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${deliveryRequest.pickupLocation.latitude},${deliveryRequest.pickupLocation.longitude}`;
        window.open(mapUrl, '_blank');
      } catch (error) {
        console.error('Could not open maps:', error);
      }
    } else {
      setDeliveryRequest(null);
      toast.error('Delivery rejected');
    }
  };

  const verifyOtp = async (type: 'pickup' | 'dropoff', otp: string) => {
    if (!activeDeliveryDetails || !driver.driverData?.partnerId) return;
    
    try {
      // Verify OTP on server
      const response = await partnerApi.post(`/api/orders/${activeDeliveryDetails.orderId}/verify-otp`, {
        type,
        otp,
        partnerId: driver.driverData.partnerId
      });
      
      if (response.data.success) {
        // OTP verification successful
        toast.success(`${type === 'pickup' ? 'Pickup' : 'Delivery'} verified successfully!`);
        
        // Update delivery status
        if (type === 'pickup') {
          setDeliveryStatus('picked_up');
          
          // Notify via socket about pickup verification
          if (socketRef.current?.connected) {
            socketRef.current.emit('order_status_update', {
              partnerId: driver.driverData.partnerId,
              orderId: activeDeliveryDetails.orderId,
              status: 'picked_up'
            });
          }
          
          // Try to open maps with directions to dropoff
          try {
            const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${activeDeliveryDetails.dropLocation.latitude},${activeDeliveryDetails.dropLocation.longitude}`;
            window.open(mapUrl, '_blank');
          } catch (error) {
            console.error('Could not open maps:', error);
          }
        } else {
          // For dropoff verification
          setDeliveryStatus('delivering');
          
          // Notify via socket about delivery completion
          if (socketRef.current?.connected) {
            socketRef.current.emit('order_status_update', {
              partnerId: driver.driverData.partnerId,
              orderId: activeDeliveryDetails.orderId,
              status: 'delivered'
            });
          }
          
          // Reset after a delay
          setTimeout(() => {
            setHasActiveDelivery(false);
            setActiveDeliveryDetails(null);
            setIsOnline(true); // Make available for new orders
          }, 5000);
        }
      } else {
        // Invalid OTP
        toast.error('Invalid OTP. Please check and try again.');
      }
    } catch (error) {
      console.error(`Error verifying ${type} OTP:`, error);
      toast.error(`Failed to verify ${type} OTP. Please try again.`);
    }
  };

  const handleMarkPickedUp = () => {
    if (!activeDeliveryDetails || !driver.driverData?.partnerId) return;
    
    toast.error('OTP verification required. Please ask the customer for their pickup OTP.');
  };
  
  const handleMarkDelivered = () => {
    if (!activeDeliveryDetails || !driver.driverData?.partnerId) return;
    
    toast.error('OTP verification required. Please ask the customer for their dropoff OTP.');
  };
  
  const handleLogout = async () => {
    try {
      // If driver is online, set them to offline first
      if (isOnline) {
        await updateDriverAvailability(false);
      }

      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

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

  // Delivery Request Modal Component
  const DeliveryRequestModal: React.FC = () => {
    if (!deliveryRequest) return null;
   
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">New Delivery Request</h3>
              <span className="px-3 py-1 bg-white bg-opacity-20 text-white text-xs font-medium rounded-full">
                {deliveryRequest.distance} km
              </span>
            </div>
          </div>
          
          <div className="p-6">
            {/* Locations */}
            <div className="mb-6 relative">
              {/* Connector line */}
              <div className="absolute left-4 top-10 bottom-10 w-0.5 bg-gray-200 z-0"></div>
              
              {/* Pickup Location */}
              <div className="flex mb-6 relative z-10">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <MapPin className="text-blue-600" size={16} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Pickup Location</p>
                  <p className="font-medium text-gray-800">{deliveryRequest.pickupLocation.street}</p>
                  <p className="text-xs text-gray-400 opacity-70">
                    {deliveryRequest.pickupLocation.latitude.toFixed(4)}, {deliveryRequest.pickupLocation.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
              
              {/* Drop Location */}
              <div className="flex relative z-10">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <Flag className="text-green-600" size={16} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Drop Location</p>
                  <p className="font-medium text-gray-800">{deliveryRequest.dropLocation.street}</p>
                  <p className="text-xs text-gray-400 opacity-70">
                    {deliveryRequest.dropLocation.latitude.toFixed(4)}, {deliveryRequest.dropLocation.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
  
            {/* Delivery Details */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Amount */}
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center mb-1">
                  <DollarSign className="text-blue-600 mr-2" size={14} />
                  <p className="text-xs font-medium text-gray-500">Payment</p>
                </div>
                <p className="text-lg font-semibold text-gray-800">${deliveryRequest.amount.toFixed(2)}</p>
                <p className="text-xs text-gray-500">{deliveryRequest.paymentMethod}</p>
              </div>
              
              {/* Time */}
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center mb-1">
                  <Clock className="text-blue-600 mr-2" size={14} />
                  <p className="text-xs font-medium text-gray-500">Time</p>
                </div>
                <p className="text-lg font-semibold text-gray-800">{deliveryRequest.estimatedTime}</p>
                <p className="text-xs text-gray-500">{deliveryRequest.distance} kilometers</p>
              </div>
            </div>
            
            {/* Additional Info */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="flex items-start">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <Info className="text-blue-600" size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Delivery Instructions</p>
                  <p className="text-sm text-gray-600 mt-1">Leave at door. Call upon arrival.</p>
                </div>
              </div>
            </div>
          
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => respondToDeliveryRequest(false)}
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Decline
              </button>
              <button
                onClick={() => respondToDeliveryRequest(true)}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
                {!hasActiveDelivery && (
                  <GetStartedCard isOnline={isOnline} onToggle={toggleOnline} isLoading={isLoading} />
                )}

                <ActiveDeliveryCard 
                  visible={hasActiveDelivery} 
                  orderDetails={activeDeliveryDetails}
                  onMarkPickedUp={handleMarkPickedUp}
                  onMarkDelivered={handleMarkDelivered}
                  deliveryStatus={deliveryStatus}
                  onVerifyOtp={verifyOtp}
                />
                
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
                  driverDetails={driver.driverDetails}
                  onClick={navigateToProfile}
                />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Show location status if online */}
      {isOnline && currentLocation && (
        <div className="fixed bottom-4 left-4 bg-white p-3 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            <span className="text-sm font-medium">Location active</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </div>
        </div>
      )}


      {/* Render the delivery request modal */}
      <DeliveryRequestModal />
    </div>
  );
};

export default DeliveryPartnerDashboard;