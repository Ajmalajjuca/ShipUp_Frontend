import React, { useState, useEffect, useRef } from 'react';
import { Truck, MapPin, Clock, CreditCard, DollarSign, Map, Phone, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from '../../../Redux/store';
import { useNavigate } from 'react-router-dom';
import AddressSelector from './BookingComponents/AddressSelector';
import VehicleSelection from './BookingComponents/VehicleSelection';
import DeliveryTypeSelection from './BookingComponents/DeliveryTypeSelection';
import PaymentMethodSelection, { PaymentMethod } from './BookingComponents/PaymentMethodSelection';
import OrderSummary from './BookingComponents/OrderSummary';
import { orderService, OrderInput, PricingConfig } from '../../../services/order.service';
import { vehicleService } from '../../../services/vehicle.service';
import { activeOrderService, ActiveOrder } from '../../../services/active-order.service';
import NavBar from '../NavBar';
import Footer from '../Footer';
import axios from 'axios';
import io from 'socket.io-client';

// Interfaces
interface OrderDetails {
  // Locations
  pickupAddress: {
    addressId: string;
    street: string;
    latitude?: number;
    longitude?: number;
  } | null;
  dropoffAddress: {
    addressId: string;
    street: string;
    latitude?: number;
    longitude?: number;
  } | null;
  
  // Selections
  vehicleId: string | null;
  vehicleName: string | null;
  vehiclePricePerKm: number | null;
  deliveryType: 'normal' | 'express' | null;
  paymentMethod: PaymentMethod | null;
  
  // Calculations
  distance: number;
  price: number;
  basePrice: number;
  deliveryPrice: number;
  commission: number;
  gstAmount: number;
  estimatedTime: string;
  effectiveDistance: number;
}

interface DriverTracking {
  driverId: string;
  driverName: string;
  profileImage?: string;
  vehicle: string;
  location: {
    latitude: number;
    longitude: number;
  };
  estimatedArrival: string;
  distance: number;
  phone?: string;
}

interface OtpStatus {
  pickupOtp: string | null;
  dropoffOtp: string | null;
  pickupVerified: boolean;
  dropoffVerified: boolean;
}

interface DriverResponseData {
  partnerId: string;
  orderId: string;
  accepted: boolean;
  timestamp: number;
}

interface OrderStatusUpdateData {
  orderId: string;
  status: string;
  partnerId?: string;
  timestamp: number;
}

const OrderBooking: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [vehicles, setVehicles] = useState<Array<{id: string; name: string; pricePerKm: number; maxWeight: number; imageUrl?: string}>>([]);
  const [orderStatus, setOrderStatus] = useState<'created' | 'finding_driver' | 'driver_assigned' | 'driver_arrived' | 'picked_up' | 'completed' | null>(null);
  const [driverTracking, setDriverTracking] = useState<DriverTracking | null>(null);
  const driverLocationInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Add new state for OTP
  const [otpStatus, setOtpStatus] = useState<OtpStatus>({
    pickupOtp: null,
    dropoffOtp: null,
    pickupVerified: false,
    dropoffVerified: false
  });
  
  // Order details state
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    pickupAddress: null,
    dropoffAddress: null,
    vehicleId: null,
    vehicleName: null,
    vehiclePricePerKm: null,
    deliveryType: null,
    paymentMethod: null,
    distance: 0,
    price: 0,
    basePrice: 0,
    deliveryPrice: 0,
    commission: 0,
    gstAmount: 0,
    estimatedTime: '',
    effectiveDistance: 0
  });
  
  // Load pricing configuration and vehicles on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load pricing config
        const config = await orderService.getPricingConfig();
        setPricingConfig(config);
        
        // Load vehicles
        const vehicleResponse = await vehicleService.getVehicles();
        if (vehicleResponse.success && vehicleResponse.vehicles) {
          const vehicleData = vehicleResponse.vehicles.map(vehicle => ({
            id: vehicle.id,
            name: vehicle.name,
            pricePerKm: vehicle.pricePerKm || 0, 
            maxWeight: typeof vehicle.maxWeight === 'string' ? parseFloat(vehicle.maxWeight) : (vehicle.maxWeight || 0),
            imageUrl: vehicle.imageUrl
          }));
          setVehicles(vehicleData);
        } else {
          toast.error('Could not load vehicle information');
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Could not load necessary information');
      }
    };
    
    loadData();
  }, []);
  
  useEffect(() => {
    // Calculate distance if both pickup and dropoff locations are selected
    if (orderDetails.pickupAddress && orderDetails.dropoffAddress &&
        orderDetails.pickupAddress.latitude && orderDetails.pickupAddress.longitude &&
        orderDetails.dropoffAddress.latitude && orderDetails.dropoffAddress.longitude) {
      
      const distance = calculateDistance(
        orderDetails.pickupAddress.latitude,
        orderDetails.pickupAddress.longitude,
        orderDetails.dropoffAddress.latitude,
        orderDetails.dropoffAddress.longitude
      );
      
      setOrderDetails(prev => ({
        ...prev,
        distance: parseFloat(distance.toFixed(2))
      }));
    }
  }, [orderDetails.pickupAddress, orderDetails.dropoffAddress]);
  
  useEffect(() => {
    // Calculate price if distance, vehicle ID, delivery type, and pricing config are available
    if (
      orderDetails.distance > 0 && 
      orderDetails.vehicleId && 
      orderDetails.vehiclePricePerKm &&
      orderDetails.deliveryType && 
      pricingConfig
    ) {
      // Get rates from pricing config
      const vehicleRate = orderDetails.vehiclePricePerKm;
      const deliveryMultiplier = pricingConfig.deliveryMultipliers[orderDetails.deliveryType];
      const gstRate = pricingConfig.taxRates.gst;
      const commissionRate = pricingConfig.taxRates.commission;
      const minimumDistance = pricingConfig.minimumDistance;
      
      // Apply minimum distance if actual distance is less than minimum
      const effectiveDistance = Math.max(orderDetails.distance, minimumDistance);
      
      // Calculate base price using effective distance
      const basePrice = effectiveDistance * vehicleRate;
      
      // Apply delivery type multiplier
      const deliveryPrice = basePrice * deliveryMultiplier;
      
      // Calculate commission
      const commission = deliveryPrice * commissionRate;
      
      // Calculate GST on (delivery price + commission)
      const gstAmount = (deliveryPrice + commission) * gstRate;
      
      // Calculate final price with GST
      const finalPrice = deliveryPrice + commission + gstAmount;
      
      // Get vehicle average speed based on type (assuming from vehicle name)
      let speedKmPerHour = 30; // Default
      const vehicleName = orderDetails.vehicleName?.toLowerCase() || '';
      
      if (vehicleName.includes('bike') || vehicleName.includes('cycle')) {
        speedKmPerHour = 25;
      } else if (vehicleName.includes('van')) {
        speedKmPerHour = 40;
      } else if (vehicleName.includes('truck')) {
        speedKmPerHour = 30;
      }
      
      // Adjustment for delivery type
      const timeMultiplier = orderDetails.deliveryType === 'express' ? 0.8 : 1;
      
      // Calculate hours then convert to hours and minutes
      const timeInHours = (effectiveDistance / speedKmPerHour) * timeMultiplier;
      const hours = Math.floor(timeInHours);
      const minutes = Math.round((timeInHours - hours) * 60);
      
      const estimatedTime = hours > 0 
        ? `${hours} hr${hours > 1 ? 's' : ''} ${minutes} min` 
        : `${minutes} min`;
      
      setOrderDetails(prev => ({
        ...prev,
        price: parseFloat(finalPrice.toFixed(2)),
        basePrice: parseFloat(basePrice.toFixed(2)),
        deliveryPrice: parseFloat(deliveryPrice.toFixed(2)),
        commission: parseFloat(commission.toFixed(2)),
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        effectiveDistance,
        estimatedTime
      }));
    }
  }, [orderDetails.distance, orderDetails.vehicleId, orderDetails.vehiclePricePerKm, orderDetails.deliveryType, pricingConfig]);
  
  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  };
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };
  
  // Update order details
  const updateOrderDetails = (key: keyof OrderDetails, value: any) => {
    setOrderDetails(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle selection of a vehicle
  const handleVehicleSelect = (vehicleId: string) => {
    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    if (selectedVehicle) {
      setOrderDetails(prev => ({
        ...prev,
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        vehiclePricePerKm: selectedVehicle.pricePerKm
      }));
    }
  };
  
  // Handle payment method selection
  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setOrderDetails(prev => ({
      ...prev,
      paymentMethod: method
    }));
  };
  
  // Handle next step
  const handleNextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      if (!orderDetails.pickupAddress || !orderDetails.dropoffAddress) {
        toast.error('Please select both pickup and dropoff locations');
        return;
      }
    } else if (currentStep === 2) {
      if (!orderDetails.vehicleId) {
        toast.error('Please select a vehicle');
        return;
      }
    } else if (currentStep === 3) {
      if (!orderDetails.deliveryType) {
        toast.error('Please select a delivery type');
        return;
      }
    } else if (currentStep === 4) {
      if (!orderDetails.paymentMethod) {
        toast.error('Please select a payment method');
        return;
      }
    }
    
    // Move to next step
    setCurrentStep(prev => prev + 1);
  };
  
  // Handle previous step
  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };
  
  // New function to generate OTP
  const generateOtp = (): string => {
    // Generate a 4-digit OTP
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Function to handle driver arrival at pickup location
  const handleDriverArrived = (orderId: string) => {
    // Generate pickup OTP
    const pickupOtp = generateOtp();
    
    // Update OTP status
    setOtpStatus(prev => ({
      ...prev,
      pickupOtp: pickupOtp
    }));
    
    // Update order status
    setOrderStatus('driver_arrived');
    
    // Notify server about OTP generation
    axios.post(`http://localhost:3003/api/orders/${orderId}/otp`, {
      type: 'pickup',
      otp: pickupOtp
    }).catch(error => {
      console.error('Error saving pickup OTP:', error);
    });
    
    toast.success('Driver has arrived at pickup location!');
  };
  
  // Function to handle pickup verification
  const handlePickupVerified = (orderId: string) => {
    // Update OTP status
    setOtpStatus(prev => ({
      ...prev,
      pickupVerified: true
    }));
    
    // Update order status
    setOrderStatus('picked_up');
    
    // Generate dropoff OTP
    const dropoffOtp = generateOtp();
    setOtpStatus(prev => ({
      ...prev,
      dropoffOtp: dropoffOtp
    }));
    
    // Notify server about OTP generation
    axios.post(`http://localhost:3003/api/orders/${orderId}/otp`, {
      type: 'dropoff',
      otp: dropoffOtp
    }).catch(error => {
      console.error('Error saving dropoff OTP:', error);
    });
    
    // Update active order status in Redis if user is available
    if (user?.userId) {
      // First get current active order
      activeOrderService.getActiveOrder(user.userId)
        .then(activeOrder => {
          if (activeOrder) {
            // Update status and add dropoff OTP
            const updatedOrder: ActiveOrder = {
              ...activeOrder,
              status: 'picked_up',
              dropoffOtp: dropoffOtp
            };
            
            // Store updated order
            return activeOrderService.storeActiveOrder(user.userId, updatedOrder);
          }
          return false;
        })
        .catch(error => {
          console.error('Error updating active order after pickup:', error);
        });
    }
    
    toast.success('Package has been picked up!');
  };
  
  // Function to handle delivery completion
  const handleDeliveryCompleted = (orderId: string) => {
    // Update OTP status
    setOtpStatus(prev => ({
      ...prev,
      dropoffVerified: true
    }));
    
    // Update order status
    setOrderStatus('completed');
    
    // Update active order status in Redis if user is available
    if (user?.userId) {
      // First get current active order
      activeOrderService.getActiveOrder(user.userId)
        .then(activeOrder => {
          if (activeOrder) {
            // Update status
            const updatedOrder: ActiveOrder = {
              ...activeOrder,
              status: 'completed'
            };
            
            // Store updated order with shorter TTL since it's completed
            return activeOrderService.storeActiveOrder(user.userId, updatedOrder, 3600); // 1 hour TTL
          }
          return false;
        })
        .then(() => {
          // After a delay, remove the active order completely
          setTimeout(() => {
            if (user?.userId) {
              activeOrderService.removeActiveOrder(user.userId).catch(console.error);
            }
          }, 5000);
        })
        .catch(error => {
          console.error('Error updating active order after completion:', error);
        });
    }
    
    toast.success('Delivery has been completed!');
    
    // Navigate to orders page after a delay
    setTimeout(() => {
      navigate('/orders');
    }, 3000);
  };
  
  // Submit order function
  const submitOrder = async () => {
    console.log('Submitting order with details:', orderDetails);
    
    if (!orderDetails.pickupAddress || !orderDetails.dropoffAddress || 
        !orderDetails.vehicleId|| !orderDetails.deliveryType ||
        !orderDetails.paymentMethod || !user?.userId) {
      toast.error('Please complete all required fields');
      return;
    }
    
    setIsLoading(true);
    setOrderStatus('created');
    
    try {
      // Create order input data for API
      const orderInput: OrderInput = {
        pickupAddress: {
          street: orderDetails.pickupAddress.street,
          latitude: orderDetails.pickupAddress.latitude,
          longitude: orderDetails.pickupAddress.longitude
        },
        dropoffAddress: {
          street: orderDetails.dropoffAddress.street,
          latitude: orderDetails.dropoffAddress.latitude,
          longitude: orderDetails.dropoffAddress.longitude
        },
        pickupAddressId: orderDetails.pickupAddress.addressId,
        dropoffAddressId: orderDetails.dropoffAddress.addressId,
        vehicleId: orderDetails.vehicleId,
        deliveryType: orderDetails.deliveryType,
        distance: orderDetails.distance,
        price: orderDetails.price,
        basePrice: orderDetails.basePrice,
        deliveryPrice: orderDetails.deliveryPrice,
        commission: orderDetails.commission,
        gstAmount: orderDetails.gstAmount,
        estimatedTime: orderDetails.estimatedTime,
        paymentMethod: orderDetails.paymentMethod,
        paymentStatus: isPrePaymentMethod(orderDetails.paymentMethod) ? 'pending' : 'not_required'
      };
      
      // Call API to create order with userId
      const response = await orderService.createOrder(orderInput, user.userId);
      console.log('Order creation response:', response);
      
      if (response.success) {
        toast.success('Order placed successfully!');
        
        // Process payment for pre-payment methods
        if (isPrePaymentMethod(orderDetails.paymentMethod)) {
          // For Razorpay
          if (orderDetails.paymentMethod === 'razorpay') {
            // Call function to initialize Razorpay - this would be implemented separately
            // initiateRazorpayPayment(response.order.id, orderDetails.price);
            toast.success('Redirecting to payment gateway...');
          } 
          // For wallet
          else if (orderDetails.paymentMethod === 'wallet') {
            // Process wallet payment
            toast.success('Processing wallet payment...');
          }
        }
        
        // Set order status to searching for driver
        setOrderStatus('finding_driver');
        
        // Find and assign a driver for the order
        findDriver(response.data.orderId, {
          pickupLatitude: orderDetails.pickupAddress.latitude || 0,
          pickupLongitude: orderDetails.pickupAddress.longitude || 0,
          vehicleType: orderDetails.vehicleName || 'standard'
        });
        
        // Subscribe to real-time order updates via WebSocket to get notified of driver arrival, etc.
        subscribeToOrderUpdates(response.data.orderId);
      } else {
        toast.error(response.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Find and assign a driver for the order
  const findDriver = async (orderId: string, orderLocation: { 
    pickupLatitude: number; 
    pickupLongitude: number;
    vehicleType: string;
  }) => {
    try {
      console.log('Finding driver for order:', orderId);
      
      // Call the partner service to find available drivers
      const response = await axios.post(`http://localhost:3003/api/drivers/assign-driver`, {
        orderId: orderId,
        pickupLocation: {
          latitude: orderLocation.pickupLatitude,
          longitude: orderLocation.pickupLongitude
        },
        vehicleType: orderLocation.vehicleType,
        maxDistance: 10, // Maximum distance in km to look for drivers
        maxWaitTime: 60 // Maximum time in seconds to wait for a driver
      });
      console.log('Driver request response:', response.data);
      
      const result = response.data;
      
      if (result.success) {
        console.log('Driver request sent successfully:', result);
        setOrderStatus('finding_driver');
        toast.success('Looking for nearby drivers...');
        
        // Connect to WebSocket to listen for driver acceptance
        const socket = io('http://localhost:3003', {
          path: '/socket',
          transports: ['websocket'],
          reconnection: true
        });
        
        socket.on('connect', () => {
          console.log('WebSocket connected for driver assignment');
          
          // Join the order-specific room
          socket.emit('join_order_room', {
            orderId,
            userId: user?.userId || user?._id
          });
        });
        
        // Set a timeout for driver acceptance
        const driverAcceptanceTimeout = setTimeout(() => {
          toast.error('No driver accepted your request. We\'ll try again with another driver.');
          setOrderStatus('created');
          socket.disconnect();
          
          // Try to find another driver
          // This could be implemented by calling findDriver again or showing a manual retry button
        }, 45000); // 45 seconds timeout
        
        // Listen for driver response
        socket.on('driver_response', (data: DriverResponseData) => {
          console.log('Driver response:', data);
          
          if (data.accepted) {
            // Driver accepted the request
            clearTimeout(driverAcceptanceTimeout);
            setOrderStatus('driver_assigned');
            toast.success('Driver assigned to your order!');
            
            // Start driver location updates immediately
            startDriverLocationUpdates(orderId, data.partnerId);
            
            // Fetch driver details to initialize tracking
            fetchDriverDetails(data.partnerId, orderId);
            
            // Generate pickup OTP right away
            const pickupOtp = generateOtp();
            setOtpStatus(prev => ({
              ...prev,
              pickupOtp: pickupOtp
            }));
            
            // Save OTP to server
            axios.post(`http://localhost:3003/api/orders/${orderId}/otp`, {
              type: 'pickup',
              otp: pickupOtp
            }).catch(error => {
              console.error('Error saving pickup OTP:', error);
            });
            
            // Store active order in Redis (with localStorage fallback via service)
            if (user?.userId) {
              const activeOrderData: ActiveOrder = {
                userId: user.userId,
                orderId,
                driverId: data.partnerId,
                pickupLocation: orderDetails.pickupAddress || {},
                dropLocation: orderDetails.dropoffAddress || {},
                status: 'driver_assigned',
                timestamp: Date.now(),
                vehicle: orderDetails.vehicleName || null,
                pickupOtp: pickupOtp
              };
              
              // Use the activeOrderService to store the order data
              activeOrderService.storeActiveOrder(user.userId, activeOrderData)
                .then(success => {
                  if (success) {
                    console.log('Active order data stored successfully');
                  } else {
                    console.warn('Failed to store active order data in Redis, using localStorage fallback');
                  }
                })
                .catch(error => {
                  console.error('Error storing active order data:', error);
                });
            } else {
              // Fallback to localStorage if no user ID is available
              console.log('Storing active order in localStorage as user ID is not available');
              localStorage.setItem('activeOrder', JSON.stringify({
                orderId,
                driverId: data.partnerId,
                pickupAddress: orderDetails.pickupAddress,
                dropoffAddress: orderDetails.dropoffAddress,
                status: 'driver_assigned',
                timestamp: Date.now(),
                vehicle: orderDetails.vehicleName,
                pickupOtp: pickupOtp
              }));
            }
            
            // Wait a moment to show success message before redirecting
            setTimeout(() => {
              // Navigate to home page to show active order
              navigate('/home');
            }, 2000);
          } else {
            // Driver rejected the request
            toast.error('Driver rejected the request. Looking for another driver...');
            // System will automatically try the next available driver
          }
        });
        
        // Listen for status updates
        socket.on('order_status_updated', (data: OrderStatusUpdateData) => {
          console.log('Order status updated:', data);
          
          if (data.status === 'driver_rejected') {
            toast.error('Driver is not available. System is trying the next available driver...');
          } else if (data.status === 'no_drivers_available') {
            toast.error('No more drivers are available. Our team will assign a driver manually.');
            
            // Set order status to created so user knows manual assignment is needed
            setOrderStatus('created');
            
            // Wait a moment then navigate to orders page
            setTimeout(() => {
              navigate('/orders');
            }, 4000);
          }
        });
        
        // Return the socket so it can be closed later if needed
        return socket;
      } else {
        console.log('Driver assignment failed:', result);
        // Show error and fallback to manual assignment
        toast.error('No drivers available. Our team will assign a driver manually.');
        
        // Wait a moment then navigate to orders page
        setTimeout(() => {
          navigate('/orders');
        }, 4000);
      }
    } catch (error) {
      console.error('Error finding driver:', error);
      toast.error('We could not find a driver automatically. Our team will handle your order.');
      
      // Wait a moment then navigate to orders page anyway
      setTimeout(() => {
        navigate('/orders');
      }, 4000);
    }
  };
  
  // Fetch driver details after they accept the request
  const fetchDriverDetails = async (driverId: string, orderId: string) => {
    try {
      // Fetch driver details using the driver ID from the response
      const driverResponse = await axios.get(`http://localhost:3003/api/drivers/${driverId}`);
      const driverData = driverResponse.data.partner;
      console.log('Driver details:', driverData);
      
      if (driverData) {
        // Calculate estimated arrival time based on distance
        const distance = driverData.distance || 3; // Default to 3 km if no distance info
        let estimatedMinutes = Math.round(distance * 3); // Rough estimate: 3 minutes per km
        if (estimatedMinutes < 1) estimatedMinutes = 1;
        const estimatedArrival = `${estimatedMinutes} min`;
        
        // Get pickup coordinates safely
        const pickupLat = orderDetails.pickupAddress?.latitude || 0;
        const pickupLng = orderDetails.pickupAddress?.longitude || 0;
        
        // Get driver coordinates safely
        const driverLat = driverData.location?.coordinates?.[1] || pickupLat;
        const driverLng = driverData.location?.coordinates?.[0] || pickupLng;
        
        const initialDriverData: DriverTracking = {
          driverId: driverId,
          driverName: driverData?.fullName || 'Your Driver',
          profileImage: driverData?.profilePicturePath,
          vehicle: driverData?.vehicleType || 'Standard Vehicle',
          location: {
            latitude: driverLat,
            longitude: driverLng
          },
          estimatedArrival: estimatedArrival,
          distance: distance,
          phone: driverData?.mobileNumber 
        };
        
        setDriverTracking(initialDriverData);
        console.log('Driver tracking initialized:', initialDriverData);
        
        // Note: we don't start location updates here, as it's already started in the driver_response handler
      } else {
        // Fallback if driver details aren't available
        toast.error('Driver details not available. Please contact support.');
      }
    } catch (error) {
      console.error('Error fetching driver details:', error);
      toast.error('Could not fetch driver details. Please contact support.');
    }
  };
  
  // Start polling for driver location updates
  const startDriverLocationUpdates = (orderId: string, driverId: string) => {
    // Clear any existing interval
    if (driverLocationInterval.current) {
      clearInterval(driverLocationInterval.current);
    }
    
    let failedAttempts = 0;
    const MAX_FAILED_ATTEMPTS = 5;
    
    console.log(`Starting location updates for driver ${driverId} on order ${orderId}`);
    
    // Poll for driver location every 5 seconds
    driverLocationInterval.current = setInterval(async () => {
      try {
        // Use the existing driver endpoint to get updated location
        const response = await axios.get(`http://localhost:3003/api/drivers/${driverId}`);
        const driverData = response.data?.partner;
        
        if (!driverData) {
          console.error('No driver data received in location update');
          failedAttempts++;
          
          if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            console.error(`Maximum failed attempts (${MAX_FAILED_ATTEMPTS}) reached for driver location updates`);
            clearInterval(driverLocationInterval.current!);
            driverLocationInterval.current = null;
          }
          return;
        }
        
        // Reset failure counter on success
        failedAttempts = 0;
        
        console.log('Driver location update:', driverData);
        
        // Check if driver has location data
        if (driverData.location && driverData.location.coordinates) {
          const driverLat = driverData.location.coordinates[1];
          const driverLng = driverData.location.coordinates[0];
          const pickupLat = orderDetails.pickupAddress?.latitude || 0;
          const pickupLng = orderDetails.pickupAddress?.longitude || 0;
          
          // Calculate distance using Haversine formula
          const distance = calculateDistance(
            driverLat,
            driverLng,
            pickupLat,
            pickupLng
          );
          
          // Calculate estimated arrival time based on distance
          let estimatedMinutes = Math.round(distance * 3); // Rough estimate: 3 minutes per km
          if (estimatedMinutes < 1) estimatedMinutes = 1;
          const estimatedArrival = `${estimatedMinutes} min`;
          
          // Create an updated driver info object
          // Don't rely on existing driverTracking state as it might be null
          const updatedDriverInfo: DriverTracking = {
            driverId: driverId,
            driverName: driverData?.fullName || 'Your Driver',
            profileImage: driverData?.profilePicturePath,
            vehicle: driverData?.vehicleType || 'Standard Vehicle',
            location: {
              latitude: driverLat,
              longitude: driverLng
            },
            estimatedArrival: estimatedArrival,
            distance: parseFloat(distance.toFixed(2)),
            phone: driverData?.mobileNumber
          };
          
          // Update the driver tracking state
          setDriverTracking(updatedDriverInfo);
          
          // If we're not already in driver_assigned status, set it
          if (orderStatus !== 'driver_assigned' && orderStatus !== 'driver_arrived' && orderStatus !== 'picked_up') {
            setOrderStatus('driver_assigned');
          }
        } else {
          console.log('Driver location coordinates not available in update');
          failedAttempts++;
          
          if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            console.error(`Maximum failed attempts (${MAX_FAILED_ATTEMPTS}) reached for driver location updates`);
            clearInterval(driverLocationInterval.current!);
            driverLocationInterval.current = null;
            
            // Still maintain the driver assigned status, just won't have live updates
            toast.error('Live driver location updates are not available. Please contact support if needed.');
          }
        }
      } catch (error) {
        console.error('Error getting driver location:', error);
        failedAttempts++;
        
        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          console.error(`Maximum failed attempts (${MAX_FAILED_ATTEMPTS}) reached for driver location updates`);
          clearInterval(driverLocationInterval.current!);
          driverLocationInterval.current = null;
          
          // Show a message to the user
          toast.error('Unable to track driver location. Please contact support if needed.');
        }
      }
    }, 5000);
  };
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (driverLocationInterval.current) {
        clearInterval(driverLocationInterval.current);
      }
    };
  }, []);
  
  // Helper to determine if payment method is pre-payment or post-payment
  const isPrePaymentMethod = (method: PaymentMethod): boolean => {
    return ['razorpay', 'wallet'].includes(method);
  };
  
  // Get the progress based on current step (now 5 steps total)
  const getProgress = () => {
    return (currentStep / 5) * 100;
  };
  
  // Render the current step
  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <AddressSelector 
            pickupAddress={orderDetails.pickupAddress}
            dropoffAddress={orderDetails.dropoffAddress}
            onPickupSelected={(address) => updateOrderDetails('pickupAddress', address)}
            onDropoffSelected={(address) => updateOrderDetails('dropoffAddress', address)}
          />
        );
      case 2:
        return (
          <VehicleSelection 
            vehicles={vehicles}
            selectedVehicleId={orderDetails.vehicleId}
            onSelect={handleVehicleSelect}
          />
        );
      case 3:
        return (
          <DeliveryTypeSelection 
            selectedType={orderDetails.deliveryType}
            onSelect={(type) => updateOrderDetails('deliveryType', type)}
          />
        );
      case 4:
        return (
          <PaymentMethodSelection
            selectedMethod={orderDetails.paymentMethod}
            onSelect={handlePaymentMethodSelect}
          />
        );
      case 5:
        return (
          <OrderSummary 
            orderDetails={orderDetails as any} // Type cast to avoid error with OrderSummary component
            onSubmit={submitOrder}
            isLoading={isLoading}
            onBack={handlePreviousStep}
          />
        );
      default:
        return null;
    }
  };
  
  // New function to subscribe to real-time order updates
  const subscribeToOrderUpdates = (orderId: string) => {
    // Connect to WebSocket server
    const socket = io('http://localhost:3003', {
      path: '/socket',
      transports: ['websocket'],
      reconnection: true
    });
    
    socket.on('connect', () => {
      console.log('WebSocket connected for order updates');
      
      // Join the order-specific room
      socket.emit('join_order_room', {
        orderId,
        userId: user?.userId || user?._id
      });
    });
    
    // Listen for driver arrival at pickup
    socket.on('driver_arrived_pickup', () => {
      handleDriverArrived(orderId);
    });
    
    // Listen for pickup verification
    socket.on('pickup_verified', () => {
      handlePickupVerified(orderId);
    });
    
    // Listen for delivery completion
    socket.on('delivery_completed', () => {
      handleDeliveryCompleted(orderId);
    });
    
    // Clean up on component unmount
    return () => {
      socket.disconnect();
    };
  };
  
  // Render order status if order has been created and waiting for driver
  const renderOrderStatus = () => {
    if (!orderStatus) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="mb-4">
              {orderStatus === 'finding_driver' ? (
                <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="animate-spin h-8 w-8 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : orderStatus === 'driver_arrived' ? (
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin size={32} className="text-blue-500" />
                </div>
              ) : orderStatus === 'picked_up' ? (
                <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
                  <Package size={32} className="text-indigo-500" />
                </div>
              ) : orderStatus === 'completed' ? (
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              )}
            </div>
            
            <h3 className="text-lg font-medium mb-2">
              {orderStatus === 'finding_driver' && 'Finding a driver...'}
              {orderStatus === 'driver_assigned' && 'Driver found!'}
              {orderStatus === 'driver_arrived' && 'Driver has arrived!'}
              {orderStatus === 'picked_up' && 'Package picked up!'}
              {orderStatus === 'completed' && 'Delivery completed!'}
            </h3>
            
            {orderStatus === 'finding_driver' && (
              <p className="text-gray-600 mb-4">
                We are searching for the nearest available driver for your order.
              </p>
            )}
            
            {orderStatus === 'driver_arrived' && (
              <div className="mt-4">
                <p className="text-gray-600 mb-4">
                  Your driver has arrived at the pickup location. Please share this OTP with the driver.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-1">Pickup OTP</p>
                  <p className="text-2xl font-bold tracking-widest flex justify-center">
                    {otpStatus.pickupOtp?.split('').map((digit, idx) => (
                      <span key={idx} className="w-12 h-12 bg-white flex items-center justify-center rounded border border-blue-200 mx-1">{digit}</span>
                    ))}
                  </p>
                </div>
              </div>
            )}
            
            {orderStatus === 'picked_up' && (
              <div className="mt-4">
                <p className="text-gray-600 mb-4">
                  Your package has been picked up and is on the way to the destination. 
                </p>
                <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-1">Dropoff OTP</p>
                  <p className="text-2xl font-bold tracking-widest flex justify-center">
                    {otpStatus.dropoffOtp?.split('').map((digit, idx) => (
                      <span key={idx} className="w-12 h-12 bg-white flex items-center justify-center rounded border border-indigo-200 mx-1">{digit}</span>
                    ))}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  Please share this OTP with the driver when they arrive at the delivery location.
                </p>
              </div>
            )}
            
            {orderStatus === 'driver_assigned' && driverTracking && (
              <div className="mt-4">
                {/* Driver Details */}
                <div className="flex items-center justify-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden mr-3">
                    {driverTracking.profileImage ? (
                      <img 
                        src={driverTracking.profileImage} 
                        alt={driverTracking.driverName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = `<span className="text-2xl text-blue-500">${driverTracking.driverName.charAt(0)}</span>`;
                        }}
                      />
                    ) : (
                      <span className="text-2xl text-blue-500">{driverTracking.driverName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{driverTracking.driverName}</p>
                    <p className="text-sm text-gray-600">{driverTracking.vehicle}</p>
                  </div>
                </div>
                
                {/* Live tracking details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <MapPin size={16} className="text-red-500 mr-2" />
                      <span className="text-sm">Driver's Location</span>
                    </div>
                    <span className="text-sm font-medium">{driverTracking.distance.toFixed(1)} km away</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-in-out" 
                      style={{ width: `${Math.min(100, 100 - (driverTracking.distance * 10))}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>On the way</span>
                    <span>{driverTracking.estimatedArrival}</span>
                  </div>
                </div>
                
                {/* Map Button */}
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${driverTracking.location.latitude},${driverTracking.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 px-4 bg-blue-50 text-blue-600 rounded-lg font-medium mb-2 hover:bg-blue-100 transition-colors text-center"
                >
                  <Map size={16} className="inline-block mr-2" />
                  View Driver on Map
                </a>
                
                {/* Call Button */}
                {driverTracking.phone && (
                  <a 
                    href={`tel:${driverTracking.phone}`}
                    className="block w-full py-2 px-4 bg-green-50 text-green-600 rounded-lg font-medium hover:bg-green-100 transition-colors text-center"
                  >
                    <Phone size={16} className="inline-block mr-2" />
                    Call Driver
                  </a>
                )}
              </div>
            )}
            
            {orderStatus === 'completed' && (
              <p className="text-gray-600 mb-4">
                Your delivery has been completed successfully! Thank you for using our service.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <NavBar />
      
      <div className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200">
              <div 
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
            
            {/* Steps indicator */}
            <div className="flex justify-between px-8 pt-6">
              <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-red-500' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                  <MapPin size={20} />
                </div>
                <span className="text-xs mt-1">Location</span>
              </div>
              <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-red-500' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                  <Truck size={20} />
                </div>
                <span className="text-xs mt-1">Vehicle</span>
              </div>
              <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-red-500' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 3 ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                  <Clock size={20} />
                </div>
                <span className="text-xs mt-1">Delivery</span>
              </div>
              <div className={`flex flex-col items-center ${currentStep >= 4 ? 'text-red-500' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 4 ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                  <DollarSign size={20} />
                </div>
                <span className="text-xs mt-1">Payment</span>
              </div>
              <div className={`flex flex-col items-center ${currentStep >= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 5 ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                  <CreditCard size={20} />
                </div>
                <span className="text-xs mt-1">Summary</span>
              </div>
            </div>
            
            {/* Current step content */}
            <div className="p-6">
              {renderStep()}
            </div>
            
            {/* Navigation buttons */}
            {currentStep < 5 && (
              <div className="flex justify-between p-6 border-t">
                <button
                  onClick={handlePreviousStep}
                  disabled={currentStep === 1}
                  className={`px-4 py-2 rounded-lg ${
                    currentStep === 1 
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Order Status Overlay */}
      {renderOrderStatus()}
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default OrderBooking; 