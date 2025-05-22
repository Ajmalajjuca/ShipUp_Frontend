import React, { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, Home, Package, DollarSign, Calendar, HelpCircle, Info, User, Truck } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import NavItem from './NavItem';
import OnlineStatusToggle from './OnlineStatusToggle';
import StatsCard from './StatsCard';
import ActionButton from './ActionButton';
import GetStartedCard from './GetStartedCard';
import ActiveDeliveryCard from './ActiveDeliveryCard';
import DeliveryPersonAvatar from './DeliveryPersonAvatar';
import PerformanceCard from './PerformanceCard';
import DeliveryRequestModal from './DeliveryRequestModal';
import DeliveryList from '../DeliveryList';
import Earnings from '../Earnings';
import { RootState } from '../../../../Redux/store';
import { api } from '../../../../services/axios/instance';
import { clearDriverData, setDriverData } from '../../../../Redux/slices/driverSlice';
import { sessionManager } from '../../../../utils/sessionManager';
import { driverService } from '../../../../services/driver.service';
import { activeOrderService } from '../../../../services/active-order.service';

// Types
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
  estimatedTime: string;
  distance: number;
  expiresIn: number;
  paymentMethod: string;
  pickupOtp?: string;
  dropoffOtp?: string;
}

interface OtpVerification {
  isVerifying: boolean;
  type: 'pickup' | 'dropoff';
  enteredOtp: string;
  orderOtp?: string;
}

interface DriverActiveOrder {
  driverId: string;
  orderId: string;
  pickupLocation: Location;
  dropLocation: Location;
  customerName: string;
  amount: number;
  estimatedTime: string;
  distance: number;
  paymentMethod: string;
  pickupOtp?: string;
  dropoffOtp?: string;
  status: 'heading_to_pickup' | 'picked_up' | 'delivering' | 'completed';
  timestamp: number;
}

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
    orderOtp: undefined,
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const Email = useSelector((state: RootState) => state.driver.email);
  const driver = useSelector((state: RootState) => state.driver);
  const [isOnline, setIsOnline] = useState<boolean>(driver.driverData?.isAvailable || false);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasFetchedRatingRef = useRef<string | null>(null); // Track fetched partnerId

  const addWsEvent = (event: string) => {
    setWsEvents((prev) => [`${new Date().toLocaleTimeString()} - ${event}`, ...prev].slice(0, 10));
  };

  const fetchDriverDetailsAndRating = async (email: string, partnerId?: string) => {
    setIsLoading(true);
    try {
      // Fetch driver details if not already present
      let driverDetails = driver.driverDetails;
      if (!driverDetails && email) {
        const response = await api.get(`/api/partners/drivers/by-email/${email}`);
        driverDetails = response.data.partner.partnerDetails;
      }

      // Fetch average rating if partnerId exists and not already fetched
      let averageRating = driver.driverDetails?.averageRating;
      if (partnerId && hasFetchedRatingRef.current !== partnerId) {
        try {
          const ratingResponse = await driverService.getRatingByDriverId(partnerId);
          averageRating = ratingResponse.data?.averageRating || null;
          console.log(`Average rating for partner ${partnerId}: ${averageRating}`);
          
          hasFetchedRatingRef.current = partnerId; // Mark as fetched
        } catch (error) {
          console.error(`Error fetching average rating for partner ${partnerId}:`, error);
          toast.error('Failed to load average rating');
        }
      }

      // Update Redux with both driver details and rating
      dispatch(
        setDriverData({
          driverData: driver.driverData,
          driverDetails: {
            ...driverDetails,
            averageRating,
            isAvailable: driver.driverDetails?.isAvailable || isOnline,
          },
          token: driver.token || '',
        })
      );
    } catch (error) {
      console.error('Error fetching driver details:', error);
      toast.error('Failed to load driver details');
    } finally {
      setIsLoading(false);
    }
  };

  // Consolidated initialization useEffect
  useEffect(() => {
    const initializeDriver = async () => {
      if (Email && (!driver.driverDetails || !driver.driverData?.partnerId)) {
        await fetchDriverDetailsAndRating(Email, driver.driverData?.partnerId);
      }
      if (driver.driverData?.partnerId) {
        await loadActiveDelivery();
      }
    };
    initializeDriver();
  }, [Email, driver.driverData?.partnerId]);

  // WebSocket setup
  useEffect(() => {
    if (driver.driverData?.partnerId && driver.token) {
      const socket = io('http://localhost:3003', {
        path: '/socket',
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.onAny((event: string, ...args: any[]) => {
        console.log(`🔄 Socket event: ${event}`, args);
        addWsEvent(`Event: ${event}`);
      });

      socket.on('connect', () => {
        console.log('✅ Socket connected successfully:', socket.id);
        addWsEvent(`Connected: ${socket.id}`);
        socket.emit('authenticate', {
          partnerId: driver.driverData?.partnerId,
          token: driver.token,
        });
      });

      socket.on('connect_error', (error: Error) => {
        console.error('❌ Socket connection error:', error);
        addWsEvent(`Connect error: ${error.message}`);
        toast.error('Connection error. Retrying...');
      });

      socket.on('disconnect', (reason: string) => {
        console.log('🔌 Socket disconnected:', reason);
        addWsEvent(`Disconnected: ${reason}`);
      });

      socket.on('authenticated', (data: any) => {
        console.log('🔓 Socket authenticated:', data);
        addWsEvent(`Authenticated: ${data.partnerId}`);
        toast.success('Connected to delivery network');
        socket.emit('join_room', `partner_${driver.driverData?.partnerId}`);
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
        setDeliveryRequest(data);
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch((err) => console.log('Sound error:', err));
        } catch (e) {
          console.log('Browser blocked sound playback');
        }
        toast.success('New delivery request!', {
          duration: 30000,
          icon: '🚚',
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
        console.log('⚠️ Auto offline due to inactivity');
        addWsEvent('Auto offline due to inactivity');
        setIsOnline(false);
        toast.error('You have been set offline due to inactivity');
        stopSendingLocationUpdates();
      });

      return () => {
        console.log('🧹 Cleaning up WebSocket connection');
        stopSendingLocationUpdates();
        socket.disconnect();
      };
    }
  }, [driver.driverData?.partnerId, driver.token]);

  // Location updates
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
            longitude: position.coords.longitude,
          };
          setCurrentLocation(location);
          resolve(location);
        },
        (error) => {
          toast.error('Unable to retrieve your location.');
          console.error('Error getting location:', error);
          reject(error);
        },
        { enableHighAccuracy: true }
      );
    });
  };

  const startSendingLocationUpdates = async () => {
    try {
      const location = await getCurrentLocation();
      if (socketRef.current?.connected) {
        socketRef.current.emit('update_location', {
          partnerId: driver.driverData?.partnerId,
          location,
        });
        addWsEvent(`Sent location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
      }
      updateLocationInDatabase(location);
      stopSendingLocationUpdates();
      locationIntervalRef.current = setInterval(async () => {
        try {
          const updatedLocation = await getCurrentLocation();
          if (socketRef.current?.connected) {
            socketRef.current.emit('update_location', {
              partnerId: driver.driverData?.partnerId,
              location: updatedLocation,
            });
            addWsEvent(`Sent location: ${updatedLocation.latitude.toFixed(4)}, ${updatedLocation.longitude.toFixed(4)}`);
          }
          const shouldUpdateDB = Math.random() < 0.25;
          if (shouldUpdateDB) {
            updateLocationInDatabase(updatedLocation);
          }
        } catch (error) {
          console.error('Failed to update location:', error);
        }
      }, 30000);
    } catch (error) {
      console.error('Failed to start location updates:', error);
      toast.error('Unable to access your location.');
    }
  };

  const updateLocationInDatabase = async (location: Location) => {
    try {
      if (!driver.driverData?.partnerId) return;
      await api.post(`/api/partners/drivers/${driver.driverData.partnerId}/location`, {
        location,
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
    if (!driver.driverData || !driver.driverData.partnerId) return false;
    setIsLoading(true);
    try {
      const location = status ? await getCurrentLocation() : null;
      const response = await api.put(`/api/partners/drivers/update-availability/${driver.driverData.partnerId}`, {
        isAvailable: status,
        location,
      });
      if (response.data && response.data.success) {
        if (socketRef.current?.connected) {
          socketRef.current.emit('set_availability', {
            partnerId: driver.driverData.partnerId,
            isAvailable: status,
            location,
          });
          addWsEvent(`Set availability: ${status ? 'online' : 'offline'}`);
        }
        dispatch(
          setDriverData({
            driverData: driver.driverData,
            driverDetails: {
              ...driver.driverDetails,
              isAvailable: status,
            },
            token: driver.token || '',
          })
        );
        return true;
      }
      return false;
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
      const success = await updateDriverAvailability(true);
      if (success) {
        setIsOnline(true);
        toast.success("You're now online!");
        startSendingLocationUpdates();
      }
    } else {
      const success = await updateDriverAvailability(false);
      if (success) {
        setIsOnline(false);
        stopSendingLocationUpdates();
      }
    }
  };

  const respondToDeliveryRequest = (accept: boolean) => {
    if (!deliveryRequest || !driver.driverData?.partnerId) return;
    if (socketRef.current?.connected) {
      socketRef.current.emit('respond_to_order', {
        partnerId: driver.driverData.partnerId,
        orderId: deliveryRequest.orderId,
        accept,
      });
    }
    if (accept) {
      setHasActiveDelivery(true);
      setActiveDeliveryDetails(deliveryRequest);
      setDeliveryStatus('heading_to_pickup');
      saveActiveDelivery(deliveryRequest, 'heading_to_pickup');
      setDeliveryRequest(null);
      toast.success('Delivery accepted!');
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
      const response = await driverService.verifyDeliveryOtp(
        activeDeliveryDetails.orderId,
        otp,
        type,
        driver.driverData.partnerId
      );
      if (response.success) {
        toast.success(`${type === 'pickup' ? 'Pickup' : 'Delivery'} verified!`);
        if (type === 'pickup') {
          await updateDeliveryStatus('picked_up');
          if (socketRef.current?.connected) {
            socketRef.current.emit('order_status_update', {
              partnerId: driver.driverData.partnerId,
              orderId: activeDeliveryDetails.orderId,
              status: 'picked_up',
            });
          }
          try {
            const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${activeDeliveryDetails.dropLocation?.latitude},${activeDeliveryDetails.dropLocation?.longitude}`;
            window.open(mapUrl, '_blank');
          } catch (error) {
            console.error('Could not open maps:', error);
          }
        } else {
          await updateDeliveryStatus('completed');
          if (socketRef.current?.connected) {
            socketRef.current.emit('order_status_update', {
              partnerId: driver.driverData.partnerId,
              orderId: activeDeliveryDetails.orderId,
              status: 'delivered',
            });
          }
        }
      } else {
        toast.error(response.data.message || 'Invalid OTP.');
      }
    } catch (error) {
      console.error(`Error verifying ${type} OTP:`, error);
      toast.error(`Failed to verify ${type} OTP.`);
    }
  };

  const handleMarkPickedUp = () => {
    if (!activeDeliveryDetails || !driver.driverData?.partnerId) return;
    toast.error('OTP verification required.');
  };

  const handleMarkDelivered = () => {
    if (!activeDeliveryDetails || !driver.driverData?.partnerId) return;
    toast.error('OTP verification required.');
  };

  const handleLogout = async () => {
    try {
      if (isOnline) {
        await updateDriverAvailability(false);
      }
      if (hasActiveDelivery && driver.driverData?.partnerId) {
        await removeActiveDelivery();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      sessionManager.clearDriverSession();
      document.cookie.split(';').forEach((cookie) => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      localStorage.clear();
      sessionStorage.clear();
      dispatch(clearDriverData());
      navigate('/partner', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/partner', { replace: true });
    }
  };

  const navigateToProfile = () => {
    navigate('/partner/profile');
  };

  const saveActiveDelivery = async (
    delivery: DeliveryRequest,
    status: 'heading_to_pickup' | 'picked_up' | 'delivering' | 'completed'
  ) => {
    if (!driver.driverData?.partnerId) return;
    try {
      const activeOrderData: DriverActiveOrder = {
        driverId: driver.driverData.partnerId,
        orderId: delivery.orderId,
        pickupLocation: delivery.pickupLocation,
        dropLocation: delivery.dropLocation,
        customerName: delivery.customerName,
        amount: delivery.amount,
        estimatedTime: delivery.estimatedTime,
        distance: delivery.distance,
        paymentMethod: delivery.paymentMethod,
        pickupOtp: delivery.pickupOtp,
        dropoffOtp: delivery.dropoffOtp,
        status: status,
        timestamp: Date.now(),
      };
      await activeOrderService.storeActiveOrder(driver.driverData.partnerId, activeOrderData as any);
      localStorage.setItem('driverActiveDelivery', JSON.stringify(activeOrderData));
    } catch (error) {
      console.error('Error saving active delivery:', error);
      toast.error('Could not save delivery state');
      try {
        const activeOrderData = {
          driverId: driver.driverData.partnerId,
          orderId: delivery.orderId,
          pickupLocation: delivery.pickupLocation,
          dropLocation: delivery.dropLocation,
          customerName: delivery.customerName,
          amount: delivery.amount,
          estimatedTime: delivery.estimatedTime,
          distance: delivery.distance,
          paymentMethod: delivery.paymentMethod,
          pickupOtp: delivery.pickupOtp,
          dropoffOtp: delivery.dropoffOtp,
          status: status,
          timestamp: Date.now(),
        };
        localStorage.setItem('driverActiveDelivery', JSON.stringify(activeOrderData));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }
    }
  };

  const loadActiveDelivery = async () => {
    if (!driver.driverData?.partnerId) return;
    try {
      const activeOrder = await activeOrderService.getActiveOrder(driver.driverData.partnerId);
      if (activeOrder && activeOrder.orderId) {
        const deliveryData: DeliveryRequest = {
          orderId: activeOrder.orderId,
          pickupLocation: activeOrder.pickupLocation as Location,
          dropLocation: activeOrder.dropLocation as Location,
          customerName: activeOrder.customerName || 'Customer',
          amount: activeOrder.amount || 0,
          estimatedTime: activeOrder.estimatedTime || '',
          distance: activeOrder.distance || 0,
          expiresIn: 0,
          paymentMethod: activeOrder.paymentMethod || 'Cash',
          pickupOtp: activeOrder.pickupOtp,
          dropoffOtp: activeOrder.dropoffOtp,
        };
        setActiveDeliveryDetails(deliveryData);
        setHasActiveDelivery(true);
        if (activeOrder.status === 'driver_arrived' || activeOrder.status === 'driver_assigned') {
          setDeliveryStatus('heading_to_pickup');
        } else if (activeOrder.status === 'picked_up') {
          setDeliveryStatus('picked_up');
        } else if (activeOrder.status === 'completed') {
          setDeliveryStatus('delivering');
          setTimeout(() => {
            removeActiveDelivery();
          }, 5000);
        }
        return true;
      }
      const localData = localStorage.getItem('driverActiveDelivery');
      if (localData) {
        try {
          const parsedData = JSON.parse(localData) as DriverActiveOrder;
          const MAX_AGE = 24 * 60 * 60 * 1000;
          if (
            parsedData.status !== 'completed' &&
            parsedData.driverId === driver.driverData.partnerId &&
            Date.now() - parsedData.timestamp < MAX_AGE
          ) {
            const deliveryData: DeliveryRequest = {
              orderId: parsedData.orderId,
              pickupLocation: parsedData.pickupLocation,
              dropLocation: parsedData.dropLocation,
              customerName: parsedData.customerName,
              amount: parsedData.amount,
              estimatedTime: parsedData.estimatedTime,
              distance: parsedData.distance,
              expiresIn: 0,
              paymentMethod: parsedData.paymentMethod,
              pickupOtp: parsedData.pickupOtp,
              dropoffOtp: parsedData.dropoffOtp,
            };
            setActiveDeliveryDetails(deliveryData);
            setHasActiveDelivery(true);
            setDeliveryStatus(parsedData.status === 'completed' ? 'delivering' : parsedData.status);
            saveActiveDelivery(deliveryData, parsedData.status);
            return true;
          } else {
            localStorage.removeItem('driverActiveDelivery');
          }
        } catch (e) {
          console.error('Error parsing local delivery data:', e);
          localStorage.removeItem('driverActiveDelivery');
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading active delivery:', error);
      try {
        const localData = localStorage.getItem('driverActiveDelivery');
        if (localData) {
          const parsedData = JSON.parse(localData) as DriverActiveOrder;
          const MAX_AGE = 24 * 60 * 60 * 1000;
          if (
            parsedData.status !== 'completed' &&
            parsedData.driverId === driver.driverData.partnerId &&
            Date.now() - parsedData.timestamp < MAX_AGE
          ) {
            const deliveryData: DeliveryRequest = {
              orderId: parsedData.orderId,
              pickupLocation: parsedData.pickupLocation,
              dropLocation: parsedData.dropLocation,
              customerName: parsedData.customerName,
              amount: parsedData.amount,
              estimatedTime: parsedData.estimatedTime,
              distance: parsedData.distance,
              expiresIn: 0,
              paymentMethod: parsedData.paymentMethod,
              pickupOtp: parsedData.pickupOtp,
              dropoffOtp: parsedData.dropoffOtp,
            };
            setActiveDeliveryDetails(deliveryData);
            setHasActiveDelivery(true);
            setDeliveryStatus(parsedData.status === 'completed' ? 'delivering' : parsedData.status);
            return true;
          }
        }
      } catch (e) {
        console.error('Error with localStorage fallback:', e);
      }
      return false;
    }
  };

  const removeActiveDelivery = async () => {
    if (!driver.driverData?.partnerId) return;
    try {
      await activeOrderService.removeActiveOrder(driver.driverData.partnerId);
      localStorage.removeItem('driverActiveDelivery');
      setHasActiveDelivery(false);
      setActiveDeliveryDetails(null);
    } catch (error) {
      console.error('Error removing active delivery:', error);
      localStorage.removeItem('driverActiveDelivery');
      setHasActiveDelivery(false);
      setActiveDeliveryDetails(null);
    }
  };

  const updateDeliveryStatus = async (
    newStatus: 'heading_to_pickup' | 'picked_up' | 'delivering' | 'completed'
  ) => {
    if (!activeDeliveryDetails || !driver.driverData?.partnerId) return;
    setDeliveryStatus(newStatus === 'completed' ? 'delivering' : newStatus);
    await saveActiveDelivery(activeDeliveryDetails, newStatus);
    if (newStatus === 'completed') {
      setTimeout(() => {
        removeActiveDelivery();
      }, 5000);
    }
  };

  // Render content based on activeNav
  const renderContent = () => {
    switch (activeNav) {
      case 'deliveries':
        return <DeliveryList partnerId={driver.driverData?.partnerId || ''} />;
      case 'earnings':
        return <Earnings />;
      case 'home':
      default:
        return (
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
              <h3 className="font-bold text-lg text-gray-800 mb-3">Overview</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <StatsCard
                  icon={<Package size={18} />}
                  title="Today's Deliveries"
                  value={isOnline ? '2' : '0'}
                  color="blue"
                />
                <StatsCard
                  icon={<DollarSign size={18} />}
                  title="Today's Earnings"
                  value={isOnline ? '$24.50' : '$0.00'}
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
                rating={driver.driverDetails?.averageRating || 4.8}
                driverDetails={driver.driverDetails}
                onClick={navigateToProfile}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <header className="flex justify-between items-center mb-6 bg-white p-3 rounded-xl shadow-sm">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              ShipUp
            </h1>
          </div>
          <div className="flex items-center gap-4">
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
              <p className="text-sm text-gray-600 mb-3">Have questions or facing issues?</p>
              <button className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Contact Support
              </button>
            </div>
          </aside>
          <main className="flex-1">{renderContent()}</main>
        </div>
      </div>
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
      <DeliveryRequestModal deliveryRequest={deliveryRequest} onRespond={respondToDeliveryRequest} />
    </div>
  );
};

export default DeliveryPartnerDashboard;