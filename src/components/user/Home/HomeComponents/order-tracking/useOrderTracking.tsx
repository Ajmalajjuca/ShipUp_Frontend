// src/components/order-tracking/hooks/useOrderTracking.js
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

// Types
export interface OrderAddress {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface OrderData {
  orderId: string;
  driverId: string;
  status: 'driver_assigned' | 'driver_arrived' | 'picked_up' | 'completed' | string;
  pickupAddress?: OrderAddress;
  dropoffAddress?: OrderAddress;
  pickupOtp?: string;
  dropoffOtp?: string;
  createdAt?: string;
  estimatedPickupTime?: string;
  estimatedDeliveryTime?: string;
  cancellationReason?: string;
  // Timestamp properties for timeline
  confirmedAt?: string;
  driverAssignedAt?: string;
  enRouteToPickupAt?: string;
  arrivedAtPickupAt?: string;
  pickedUpAt?: string;
  enRouteToDropoffAt?: string;
  arrivedAtDropoffAt?: string;
  completedAt?: string;
}

export interface DriverData {
  fullName: string;
  mobileNumber?: string;
  photoUrl?: string;
  vehicleInfo?: {
    make: string;
    model: string;
    color: string;
    licensePlate: string;
  };
  rating?: number;
  totalRides?: number;
  location?: {
    coordinates: number[];
  };
}

export interface OrderTrackingResult {
  activeOrder: OrderData | null;
  driverData: DriverData | null;
  isLoading: boolean;
  mapCenter: { lat: number; lng: number };
  directions: google.maps.DirectionsResult | null;
  isCalculatingRoute: boolean;
  routeError: string | null;
  hasValidDriverLocation: () => boolean;
  getDriverPosition: () => { lat: number; lng: number } | null;
  updateOrderStatus: (status: string) => void;
  callDriver: () => void;
  openInMaps: () => void;
  onMapLoad: (map: google.maps.Map) => void;
  onMapUnmount: () => void;
}

// Constants
const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 }; // Example: Bangalore
const API_BASE_URL = 'http://localhost:3003';

export function useOrderTracking(pollingInterval = 15000): OrderTrackingResult {
    // State Variables
    const [activeOrder, setActiveOrder] = useState<OrderData | null>(null);
    const [driverData, setDriverData] = useState<DriverData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
    const [routeError, setRouteError] = useState<string | null>(null);

    // Refs
    const mapRef = useRef<google.maps.Map | null>(null);
    const socketRef = useRef<any>(null);
    const locationIntervalRef = useRef<number | null>(null);
    // Refs to access latest state values in callbacks/intervals
    const activeOrderRef = useRef<OrderData | null>(activeOrder);
    const driverDataRef = useRef<DriverData | null>(driverData);
    const isCalculatingRouteRef = useRef<boolean>(isCalculatingRoute);

    // Update Refs whenever state changes
    useEffect(() => { activeOrderRef.current = activeOrder; }, [activeOrder]);
    useEffect(() => { driverDataRef.current = driverData; }, [driverData]);
    useEffect(() => { isCalculatingRouteRef.current = isCalculatingRoute; }, [isCalculatingRoute]);

    // Helper Functions
    const getDriverPosition = useCallback((): { lat: number; lng: number } | null => {
        const coords = driverDataRef.current?.location?.coordinates;
        if (coords && coords.length === 2) {
            return { lat: coords[1], lng: coords[0] }; // Lat, Lng for Google Maps
        }
        return null;
    }, []);

    const hasValidDriverLocation = useCallback((): boolean => {
        return getDriverPosition() !== null;
    }, [getDriverPosition]);

    const generateOtp = (): string => {
        return Math.floor(1000 + Math.random() * 9000).toString();
    };

    // Status Update Function
    const updateOrderStatus = useCallback((status: string): void => {
        const prevOrder = activeOrderRef.current;
        if (!prevOrder || prevOrder.status === status) return;

        console.log(`Status Update: ${prevOrder.status} -> ${status}`);
        const updatedOrder = { ...prevOrder, status };
        setActiveOrder(updatedOrder);
        localStorage.setItem('activeOrder', JSON.stringify(updatedOrder));

        // Trigger route calculation logic
        const shouldRecalculateForDropoff =
            ((prevOrder.status === 'driver_assigned' || prevOrder.status === 'driver_arrived') && status === 'picked_up');

        if (shouldRecalculateForDropoff) {
            console.log("Status changed (-> picked_up), triggering route calc for dropoff.");
            setDirections(null);
            setRouteError(null);
            if (!isCalculatingRouteRef.current) {
                setIsCalculatingRoute(true);
            }
        } else if (status === 'completed') {
            console.log("Status change: Order completed. Clearing route.");
            setDirections(null);
            setRouteError(null);
            setIsCalculatingRoute(false);
        } else if ((status === 'driver_assigned' || status === 'driver_arrived') && hasValidDriverLocation()) {
             if (!isCalculatingRouteRef.current) {
                  console.log("Status assigned/arrived: Triggering route calc.");
                  setIsCalculatingRoute(true);
             }
        }
    }, [hasValidDriverLocation]);

    // Main Effect: Initial Load, Polling, WebSocket
    useEffect(() => {
        console.log('ActiveOrders: Component Mounting...');
        setIsLoading(true);
        let currentDriverId: string | null = null;
        let currentOrderId: string | null = null;

        // 1. Load Order from LocalStorage
        try {
            const storedOrderString = localStorage.getItem('activeOrder');
            if (storedOrderString) {
                const parsedOrder = JSON.parse(storedOrderString) as OrderData;
                if (parsedOrder.orderId && parsedOrder.driverId && parsedOrder.status !== 'completed') {
                    setActiveOrder(parsedOrder);
                    currentDriverId = parsedOrder.driverId;
                    currentOrderId = parsedOrder.orderId;
                    console.log(`ActiveOrders: Loaded active order ${currentOrderId}.`);
                } else {
                    localStorage.removeItem('activeOrder');
                }
            } else {
                 console.log('ActiveOrders: No active order in storage.');
            }
        } catch (error) {
            console.error('ActiveOrders: Error parsing stored order:', error);
            localStorage.removeItem('activeOrder');
        }

        // Function to fetch driver data
        const fetchAndSetDriverData = async (isInitialLoad = false) => {
            if (!currentDriverId) {
                if (isInitialLoad) setIsLoading(false);
                return;
            }
            const currentOrder = activeOrderRef.current;

            try {
                console.log(`Fetching driver ${currentDriverId} (${isInitialLoad ? 'initial' : 'poll'})...`);
                const response = await axios.get(`${API_BASE_URL}/api/drivers/${currentDriverId}`);
                console.log('Driver data response:', response.data);
                
                if (response.data?.partner) {
                    const partnerData = response.data.partner as DriverData;
                    const previousLocationJson = JSON.stringify(driverDataRef.current?.location?.coordinates);
                    const newLocationJson = JSON.stringify(partnerData.location?.coordinates);

                    // Update Ref and State
                    driverDataRef.current = partnerData;
                    setDriverData(partnerData);

                    // Set initial map center only on first successful fetch
                    if (isInitialLoad) {
                        let initialCenter = DEFAULT_CENTER;
                        const driverCoords = partnerData.location?.coordinates;
                        const pickupCoords = currentOrder?.pickupAddress;
                        if (driverCoords?.length === 2) initialCenter = { lat: driverCoords[1], lng: driverCoords[0] };
                        else if (pickupCoords?.latitude) initialCenter = { lat: pickupCoords.latitude, lng: pickupCoords.longitude };
                        setMapCenter(initialCenter);
                        console.log('ActiveOrders: Initial map center set:', initialCenter);
                    }

                    // Trigger route recalculation on location change
                    if (newLocationJson !== previousLocationJson && currentOrder?.status !== 'completed') {
                        console.log("Location changed. Triggering route calculation.");
                        setDirections(null);
                        setRouteError(null);
                        if (!isCalculatingRouteRef.current) {
                            setIsCalculatingRoute(true);
                        }
                    }
                } else {
                     console.warn('No partner data received for driver.');
                     if(isInitialLoad) setIsLoading(false);
                }
            } catch (error) {
                console.error('ActiveOrders: Error fetching driver:', error);
                if(isInitialLoad) setIsLoading(false);
            }
            finally {
                if(isInitialLoad && isLoading) {
                     setIsLoading(false);
                }
            }
        };

        // 2. Initial Fetch and Polling Setup
        if (currentDriverId) {
            fetchAndSetDriverData(true);
            if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = window.setInterval(() => fetchAndSetDriverData(false), pollingInterval);
            console.log('ActiveOrders: Location polling started.');
        } else {
            setIsLoading(false);
        }

        // 3. WebSocket Setup
        if (currentOrderId && !socketRef.current) {
             console.log('ActiveOrders: Setting up WebSocket...');
             const socket = io(API_BASE_URL, { path: '/socket', transports: ['websocket'], reconnection: true });
             socketRef.current = socket;

             socket.on('connect', () => {
                 console.log('ActiveOrders: WebSocket connected:', socket.id);
                 socket.emit('join_order_room', { orderId: currentOrderId });
             });
             socket.on('connect_error', (err) => console.error('WS Connect Error:', err));
             socket.on('disconnect', (reason) => console.log('WS Disconnected:', reason));

             // Socket Event Handlers
             socket.on('driver_arrived_pickup', () => updateOrderStatus('driver_arrived'));
             socket.on('pickup_verified', () => {
                 updateOrderStatus('picked_up');
                 // Generate/save dropoff OTP
                 const order = activeOrderRef.current;
                 if (order && !order.dropoffOtp) {
                     const otp = generateOtp();
                     const updated = { ...order, dropoffOtp: otp };
                     setActiveOrder(updated);
                     localStorage.setItem('activeOrder', JSON.stringify(updated));
                     axios.post(`${API_BASE_URL}/api/orders/${order.orderId}/otp`, { type: 'dropoff', otp })
                         .catch(err => console.error("Failed to save dropoff OTP:", err));
                 }
             });
             socket.on('delivery_completed', () => {
                 updateOrderStatus('completed');
                 setTimeout(() => {
                     const finalOrder = activeOrderRef.current;
                     if (finalOrder?.orderId === currentOrderId && finalOrder?.status === 'completed') {
                         localStorage.removeItem('activeOrder');
                         setActiveOrder(null);
                         setDriverData(null);
                         setDirections(null);
                         console.log(`ActiveOrders: Removed completed order ${currentOrderId}.`);
                     }
                 }, 5000);
             });
        }

        // 4. Cleanup Function
        return () => {
            console.log('ActiveOrders: Cleaning up component...');
            if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
            if (socketRef.current) socketRef.current.disconnect();
            locationIntervalRef.current = null;
            socketRef.current = null;
            console.log('ActiveOrders: Cleanup complete.');
        };
    }, [pollingInterval, updateOrderStatus]);

    // Directions Calculation Effect
    useEffect(() => {
        const order = activeOrderRef.current;
        const isCalculating = isCalculatingRouteRef.current;
        const driverInfo = driverDataRef.current;

        // Skip calculations if Google Maps isn't loaded
        if (!window.google?.maps?.DirectionsService) {
            console.log("Directions Effect: Google Maps DirectionsService not available yet");
            return;
        }

        console.log("Directions Effect Check:", { 
            isCalculating, 
            status: order?.status,
            hasDriverInfo: !!driverInfo,
            driverPosition: getDriverPosition(),
            hasPickupCoords: !!order?.pickupAddress?.latitude,
            hasDropoffCoords: !!order?.dropoffAddress?.latitude
        });

        // Exit conditions
        if (!isCalculating || !order || order.status === 'completed' || !driverInfo) {
            if (isCalculating && isCalculatingRoute) {
                 console.log("Directions Effect: Conditions unmet/changed, resetting calculation flag.");
                 setIsCalculatingRoute(false);
            }
            return;
        }

        const driverPosition = getDriverPosition();
        if (!driverPosition) {
            console.log("Directions Effect: No valid driver position available.");
            console.log("Driver location data:", driverInfo.location);
            setRouteError("Driver location unavailable.");
            setIsCalculatingRoute(false);
            setDirections(null);
            return;
        }

        // Determine Destination
        let destinationPosition = null;
        let destinationType = '';
        if ((order.status === 'driver_assigned' || order.status === 'driver_arrived') && order.pickupAddress?.latitude) {
            destinationPosition = { lat: order.pickupAddress.latitude, lng: order.pickupAddress.longitude };
            destinationType = 'Pickup';
        } else if (order.status === 'picked_up' && order.dropoffAddress?.latitude) {
            destinationPosition = { lat: order.dropoffAddress.latitude, lng: order.dropoffAddress.longitude };
            destinationType = 'Dropoff';
        }

        if (!destinationPosition) {
            console.log(`Directions Effect: No valid ${destinationType || 'destination'} coords.`);
            setRouteError(`Valid ${destinationType || 'destination'} location not found.`);
            setIsCalculatingRoute(false);
            setDirections(null);
            return;
        }

        // Proceed with API call
        console.log(`Directions Effect: Calling DirectionsService Driver -> ${destinationType}`);
        setRouteError(null);

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
            {
                origin: driverPosition,
                destination: destinationPosition,
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                console.log("DirectionsService Callback:", { status });
                // Check if calculation is still relevant
                if (!isCalculatingRouteRef.current) {
                     console.log("Directions Callback: Calculation flag is now false, ignoring potentially stale result.");
                     return;
                }

                if (status === window.google.maps.DirectionsStatus.OK && result) {
                    setDirections(result);
                    setRouteError(null);
                    console.log("Directions Effect: Route calculation SUCCESS.");
                } else {
                    console.error(`Directions Effect: Route calculation FAILED - Status: ${status}`);
                    setDirections(null);
                    setRouteError(`Route error: ${status}`);
                }
                setIsCalculatingRoute(false);
                console.log("Directions Effect: Calculation finished, flag set to false.");
            }
        );
    }, [isCalculatingRoute, getDriverPosition]);

    // UI Action Handlers
    const callDriver = useCallback(() => {
        const mobile = driverDataRef.current?.mobileNumber;
        if (mobile) {
            window.location.href = `tel:${mobile}`;
        } else {
            alert('Driver phone number is not available.');
        }
    }, []);

    const openInMaps = useCallback(() => {
        const driverPos = getDriverPosition();
        const order = activeOrderRef.current;
        let url = '';

        if (driverPos) url = `https://www.google.com/maps?q=${driverPos.lat},${driverPos.lng}`;
        else if (order?.pickupAddress?.latitude) url = `https://www.google.com/maps?q=${order.pickupAddress.latitude},${order.pickupAddress.longitude}`;
        else if (order?.dropoffAddress?.latitude) url = `https://www.google.com/maps?q=${order.dropoffAddress.latitude},${order.dropoffAddress.longitude}`;

        if (url) {
             console.log('Opening in Google Maps:', url);
             window.open(url, '_blank', 'noopener,noreferrer');
        } else {
             alert('No location available to open in maps.');
        }
    }, [getDriverPosition]);

    // Map Control Callbacks
    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        console.log('ActiveOrders: Map loaded.');
        const currentOrder = activeOrderRef.current;
        const currentDriverPos = getDriverPosition();

        // Trigger initial calc if needed
        if (currentOrder && currentOrder.status !== 'completed' && currentDriverPos && !isCalculatingRouteRef.current) {
            console.log("Map onLoad: Triggering initial route calculation.");
            setIsCalculatingRoute(true);
        }
    }, [getDriverPosition]);

    const onMapUnmount = useCallback(() => { 
        mapRef.current = null; 
        console.log('Map unmounted.');
    }, []);

    return {
        // State
        activeOrder,
        driverData,
        isLoading,
        mapCenter,
        directions,
        isCalculatingRoute,
        routeError,
        
        // Helper methods
        hasValidDriverLocation,
        getDriverPosition,
        updateOrderStatus,
        
        // Map control
        onMapLoad,
        onMapUnmount,
        
        // UI Actions
        callDriver,
        openInMaps,
    };
}