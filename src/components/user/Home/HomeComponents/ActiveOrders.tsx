import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Truck, Package, Phone, Navigation, Clock, AlertCircle, Loader2, Timer, Route, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../Redux/store';
import { activeOrderService, ActiveOrder } from '../../../../services/active-order.service';
import {
    GoogleMap,
    Marker,
    DirectionsService,
    DirectionsRenderer
} from '@react-google-maps/api';
import { useGoogleMaps } from '../../../../contexts/GoogleMapsProvider';
import toast from 'react-hot-toast';
import PartnerRating from './order-tracking/PartnerRating'; // Adjust the import path as needed

// --- Interfaces ---
interface Address {
    latitude?: number;
    longitude?: number;
    [key: string]: any; // Allow other address properties
}

interface ActiveOrderData extends ActiveOrder {}

interface DriverData {
    fullName: string;
    profilePicturePath?: string;
    vehicleType?: string;
    mobileNumber?: string;
    location?: {
        type: 'Point';
        coordinates: [number, number]; // GeoJSON format: [longitude, latitude]
    };
}

// --- Constants ---
const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: 12.9716, lng: 77.5946 }; // Example: Bangalore
const containerStyle = { width: '100%', height: '100%' };
const POLLING_INTERVAL = 15000; // 15 seconds for location polling
const COMPLETION_MESSAGE_DELAY = 3000; // 3 seconds delay for completion message

// --- React Component ---
const ActiveOrders: React.FC = () => {
    // --- State Variables ---
    const [activeOrder, setActiveOrder] = useState<ActiveOrderData | null>(null);
    const [driverData, setDriverData] = useState<DriverData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [isRatingSubmitted, setIsRatingSubmitted] = useState<boolean>(false);
    const [showCompletionMessage, setShowCompletionMessage] = useState<boolean>(false); // New state for completion message
    const { user } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();

    // --- Refs ---
    const mapRef = useRef<google.maps.Map | null>(null);
    const socketRef = useRef<ReturnType<typeof io> | null>(null);
    const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    // Refs to access latest state values in callbacks/intervals
    const activeOrderRef = useRef(activeOrder);
    const driverDataRef = useRef(driverData);
    const isCalculatingRouteRef = useRef(isCalculatingRoute);

    // --- Google Maps Context ---
    const { isLoaded } = useGoogleMaps();

    // --- Update Refs whenever state changes ---
    useEffect(() => { activeOrderRef.current = activeOrder; }, [activeOrder]);
    useEffect(() => { driverDataRef.current = driverData; }, [driverData]);
    useEffect(() => { isCalculatingRouteRef.current = isCalculatingRoute; }, [isCalculatingRoute]);

    useEffect(() => {
        if (activeOrder?.status && activeOrder?.orderId) {
            const updateOrderStatusInDB = async () => {
                try {
                    await axios.patch(`http://localhost:3004/api/orders/${activeOrder.orderId}`, {
                        status: activeOrder.status
                    });
                    console.log(`Order status updated in DB===>: ${activeOrder.status}`);
                } catch (error) {
                    console.error('Error updating order status in DB:', error);
                    toast.error('Failed to update order status. Please contact support.');
                }
            };
            updateOrderStatusInDB();
        }
    }, [activeOrder?.status, activeOrder?.orderId]);

    // --- Helper Functions ---
    const getDriverPosition = useCallback((): google.maps.LatLngLiteral | null => {
        const coords = driverDataRef.current?.location?.coordinates; // Use ref
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

    // --- Handle Rating Completion ---
    const handleRatingComplete = useCallback(() => {
        setIsRatingSubmitted(true);
        // Optionally clear the order from state and storage
        if (user?.userId) {
            activeOrderService.removeActiveOrder(user.userId)
                .catch(err => console.error("Failed to remove completed order after rating:", err));
        }
        setActiveOrder(null);
        setDriverData(null);
        setDirections(null);
        console.log('Rating submitted, order cleared.');
    }, [user?.userId]);

    // --- Status Update Function ---
    const updateOrderStatus = useCallback((status: ActiveOrderData['status']) => {
        const prevOrder = activeOrderRef.current;
        if (!prevOrder || prevOrder.status === status || !user?.userId) return;

        console.log(`Status Update: ${prevOrder.status} -> ${status}`);
        const updatedOrder = { ...prevOrder, status };
        
        // Update local state
        setActiveOrder(updatedOrder);
        
        // Update Redis via service
        activeOrderService.updateOrderStatus(user.userId, status)
            .catch(err => console.error('Failed to update order status in Redis:', err));

        // --- Trigger route calculation logic ---
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
            console.log("Status change: Order completed. Showing completion message.");
            setDirections(null);
            setRouteError(null);
            setIsCalculatingRoute(false);
            setShowCompletionMessage(true); // Show completion message
        } else if ((status === 'driver_assigned' || status === 'driver_arrived') && hasValidDriverLocation()) {
            if (!isCalculatingRouteRef.current) {
                console.log("Status assigned/arrived: Triggering route calc.");
                setIsCalculatingRoute(true);
            }
        }
    }, [hasValidDriverLocation, user?.userId]);

    // --- Effect to Handle Completion Message Timeout ---
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (showCompletionMessage) {
            timer = setTimeout(() => {
                setShowCompletionMessage(false); // Hide completion message after 3 seconds
            }, COMPLETION_MESSAGE_DELAY);
        }
        return () => clearTimeout(timer); // Cleanup timer on unmount or state change
    }, [showCompletionMessage]);

    // --- Main Effect: Initial Load, Polling, WebSocket ---
    useEffect(() => {
        console.log('ActiveOrders: Component Mounting...');
        setIsLoading(true);
        let currentDriverId: string | null = null;
        let currentOrderId: string | null = null;

        if (!user || !user.userId) {
            console.log('ActiveOrders: No authenticated user found');
            setIsLoading(false);
            return;
        }

        const loadActiveOrder = async () => {
            try {
                const order = await activeOrderService.getActiveOrder(user.userId);
                console.log('ActiveOrders: Loaded order from Redis:', order);
                
                if (order && order.orderId && order.driverId && order.status !== 'completed') {
                    setActiveOrder(order);
                    currentDriverId = order.driverId;
                    currentOrderId = order.orderId;
                    console.log(`ActiveOrders: Loaded active order ${currentOrderId} from Redis.`);
                } else {
                    console.log('ActiveOrders: No active order in Redis or localStorage.');
                }
            } catch (error) {
                console.error('ActiveOrders: Error retrieving active order:', error);
            } finally {
                if (currentDriverId) {
                    await fetchAndSetDriverData(true);
                    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
                    locationIntervalRef.current = setInterval(() => fetchAndSetDriverData(false), POLLING_INTERVAL);
                    console.log('ActiveOrders: Location polling started.');
                } else {
                    setIsLoading(false);
                }
                
                setupWebsocket(currentOrderId);
            }
        };

        const fetchAndSetDriverData = async (isInitialLoad = false) => {
            if (!currentDriverId) {
                if (isInitialLoad) setIsLoading(false);
                return;
            }
            const currentOrder = activeOrderRef.current;

            try {
                console.log(`Fetching driver ${currentDriverId} (${isInitialLoad ? 'initial' : 'poll'})...`);
                const response = await axios.get<{ partner: DriverData }>(`http://localhost:3003/api/drivers/${currentDriverId}`);

                if (response.data?.partner) {
                    const partnerData = response.data.partner;
                    const previousLocationJson = JSON.stringify(driverDataRef.current?.location?.coordinates);
                    const newLocationJson = JSON.stringify(partnerData.location?.coordinates);

                    driverDataRef.current = partnerData;
                    setDriverData(partnerData);

                    if (isInitialLoad) {
                        let initialCenter = DEFAULT_CENTER;
                        const driverCoords = partnerData.location?.coordinates;
                        const pickupCoords = currentOrder?.pickupAddress;
                        if (driverCoords?.length === 2) initialCenter = { lat: driverCoords[1], lng: driverCoords[0] };
                        else if (pickupCoords?.latitude) initialCenter = { lat: pickupCoords.latitude, lng: pickupCoords.longitude! };
                        setMapCenter(initialCenter);
                        console.log('ActiveOrders: Initial map center set:', initialCenter);
                    }

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
                    if (isInitialLoad) setIsLoading(false);
                }
            } catch (error) {
                console.error('ActiveOrders: Error fetching driver:', error);
                if (isInitialLoad) setIsLoading(false);
            } finally {
                if (isInitialLoad && isLoading) {
                    setIsLoading(false);
                }
            }
        };

        const setupWebsocket = (orderId: string | null) => {
            if (orderId && !socketRef.current) {
                console.log('ActiveOrders: Setting up WebSocket...');
                const socket = io('http://localhost:3003', { path: '/socket', transports: ['websocket'], reconnection: true });
                socketRef.current = socket;

                socket.on('connect', () => {
                    console.log('ActiveOrders: WebSocket connected:', socket.id);
                    socket.emit('join_order_room', { orderId, userId: user.userId });
                });
                socket.on('connect_error', (err: Error) => console.error('WS Connect Error:', err));
                socket.on('disconnect', (reason: string) => console.log('WS Disconnected:', reason));

                socket.on('driver_arrived_pickup', () => updateOrderStatus('driver_arrived'));
                socket.on('pickup_verified', () => {
                    updateOrderStatus('picked_up');
                    const order = activeOrderRef.current;
                    if (order && !order.dropoffOtp) {
                        const otp = generateOtp();
                        const updated = { ...order, dropoffOtp: otp };
                        setActiveOrder(updated);

                        if (user.userId) {
                            activeOrderService.storeActiveOrder(user.userId, updated as ActiveOrder)
                                .catch(err => console.error("Failed to store updated order with dropoff OTP:", err));
                        }

                        axios.post(`http://localhost:3003/api/orders/${order.orderId}/otp`, { type: 'dropoff', otp })
                            .catch(err => console.error("Failed to save dropoff OTP:", err));
                    }
                });
                socket.on('delivery_completed', () => {
                    updateOrderStatus('completed');
                });
            }
        };

        loadActiveOrder();

        return () => {
            console.log('ActiveOrders: Cleaning up component...');
            if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
            if (socketRef.current) socketRef.current.disconnect();
            locationIntervalRef.current = null;
            socketRef.current = null;
            console.log('ActiveOrders: Cleanup complete.');
        };
    }, [user]);

    // --- Directions Calculation Effect ---
    useEffect(() => {
        const order = activeOrderRef.current;
        const isCalculating = isCalculatingRouteRef.current;
        const driverInfo = driverDataRef.current;

        console.log("Directions Effect Check:", { isLoaded, isCalculating, status: order?.status });

        if (!isLoaded || !isCalculating || !order || order.status === 'completed' || !driverInfo) {
            if (isCalculating && isCalculatingRoute) {
                console.log("Directions Effect: Conditions unmet/changed, resetting calculation flag.");
                setIsCalculatingRoute(false);
            }
            return;
        }

        const driverPosition = getDriverPosition();
        if (!driverPosition) {
            console.log("Directions Effect: No valid driver position available.");
            setRouteError("Driver location unavailable.");
            setIsCalculatingRoute(false);
            setDirections(null);
            return;
        }

        let destinationPosition: google.maps.LatLngLiteral | null = null;
        let destinationType: string = '';
        if ((order.status === 'driver_assigned' || order.status === 'driver_arrived') && order.pickupLocation?.latitude) {
            destinationPosition = { lat: order.pickupLocation.latitude, lng: order.pickupLocation.longitude! };
            destinationType = 'Pickup';
        } else if (order.status === 'picked_up' && order.dropLocation?.latitude) {
            destinationPosition = { lat: order.dropLocation.latitude, lng: order.dropLocation.longitude! };
            destinationType = 'Dropoff';
        }

        if (!destinationPosition) {
            console.log(`Directions Effect: No valid ${destinationType || 'destination'} coords.`);
            setRouteError(`Valid ${destinationType || 'destination'} location not found.`);
            setIsCalculatingRoute(false);
            setDirections(null);
            return;
        }

        console.log(`Directions Effect: Calling DirectionsService Driver -> ${destinationType}`);
        setRouteError(null);

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
            {
                origin: driverPosition,
                destination: destinationPosition,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                console.log("DirectionsService Callback:", { status });
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
    }, [isLoaded, isCalculatingRoute, getDriverPosition]);

    // --- Map Instance Callbacks ---
    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        console.log('ActiveOrders: Map loaded.');
        const currentOrder = activeOrderRef.current;
        const currentDriverPos = getDriverPosition();

        if (currentOrder && currentOrder.status !== 'completed' && currentDriverPos && !isCalculatingRouteRef.current) {
            console.log("Map onLoad: Triggering initial route calculation.");
            setIsCalculatingRoute(true);
        }
    }, [getDriverPosition]);

    const onUnmount = useCallback(() => { mapRef.current = null; console.log('Map unmounted.'); }, []);

    // --- UI Action Handlers ---
    const callDriver = () => {
        const mobile = driverDataRef.current?.mobileNumber;
        if (mobile) {
            window.location.href = `tel:${mobile}`;
        } else {
            alert('Driver phone number is not available.');
        }
    };

    const openInMaps = () => {
        const driverPos = getDriverPosition();
        const order = activeOrderRef.current;
        let url = '';

        if (driverPos) url = `https://www.google.com/maps?q=${driverPos.lat},${driverPos.lng}`;
        else if (order?.pickupLocation?.latitude) url = `https://www.google.com/maps?q=${order.pickupLocation.latitude},${order.pickupLocation.longitude}`;
        else if (order?.dropLocation?.latitude) url = `https://www.google.com/maps?q=${order.dropLocation.latitude},${order.dropLocation.longitude}`;

        if (url) {
            console.log('Opening in Google Maps:', url);
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            alert('No location available to open in maps.');
        }
    };

    // --- Render Logic ---
    if (!isLoaded) return <div className="p-4 text-gray-500 font-semibold text-center">Loading Google Maps...</div>;
    if (isLoading) return <div className="p-4 md:p-6 text-center py-10"><Loader2 className="animate-spin inline-block mr-2 h-5 w-5 text-blue-600" />Loading active order details...</div>;
    if (!activeOrder) return <div></div>;

    // Show completion message for 3 seconds
    if (activeOrder.status === 'completed' && showCompletionMessage && !isRatingSubmitted) {
        return (
            <div className="p-4 md:p-6 max-w-6xl mx-auto font-sans flex items-center justify-center min-h-[50vh]">
                <div className="bg-white rounded-lg shadow-lg p-6 text-center max-w-md mx-auto">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-green-600 w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Delivery Completed!</h3>
                    <p className="text-gray-600">Your delivery has been completed successfully! Thank you for using our service.</p>
                </div>
            </div>
        );
    }

    // Show PartnerRating component after completion message or if rating hasn't been submitted
    if (activeOrder.status === 'completed' && !showCompletionMessage && !isRatingSubmitted) {
        return (
            <div className="p-4 md:p-6 max-w-6xl mx-auto font-sans">
                <PartnerRating
                    orderId={activeOrder.orderId}
                    driverId={activeOrder.driverId}
                    driverName={driverData?.fullName}
                    driverPhoto={driverData?.profilePicturePath}
                    onRatingComplete={handleRatingComplete}
                />
            </div>
        );
    }

    // Normal order tracking UI
    const isDriverLocValidRender = hasValidDriverLocation();
    const driverMarkerPosRender = getDriverPosition();
    const currentLeg = directions?.routes?.[0]?.legs?.[0];

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto font-sans">
            {/* Header */}
            <div className="mb-6 md:mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Active Order Tracking</h2>
                <p className="text-sm text-gray-500">Order ID: {activeOrder.orderId}</p>
                <div className="border-b-2 border-red-500 w-20 mt-1"></div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
                {/* Status Header */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                    <div className="font-semibold text-lg text-gray-700">Shipment Progress</div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${activeOrder.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {activeOrder.status === 'driver_assigned' && 'Driver Assigned'}
                        {activeOrder.status === 'driver_arrived' && 'Driver Arrived'}
                        {activeOrder.status === 'picked_up' && 'Package En Route'}
                        {activeOrder.status === 'completed' && 'Delivery Completed'}
                    </span>
                </div>

                {/* Map and Details Layout */}
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Map Column */}
                    <div className="w-full md:w-3/5">
                        <div className="rounded-lg overflow-hidden h-80 md:h-[450px] bg-gray-200 relative border border-gray-200">
                            <GoogleMap
                                mapContainerStyle={containerStyle}
                                center={mapCenter}
                                zoom={14}
                                onLoad={onLoad}
                                onUnmount={onUnmount}
                                options={{ fullscreenControl: false, mapTypeControl: false, streetViewControl: false, zoomControl: true, gestureHandling: 'cooperative' }}
                            >
                                {directions && activeOrder.status !== 'completed' && (
                                    <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#1D4ED8', strokeOpacity: 0.8, strokeWeight: 6, zIndex: 1 } }} />
                                )}

                                {isDriverLocValidRender && driverMarkerPosRender && activeOrder.status !== 'completed' && (
                                    <Marker position={driverMarkerPosRender} title={`Driver: ${driverData?.fullName || '...'}`} zIndex={10} icon={{ path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 7, fillColor: "#1F2937", fillOpacity: 1, strokeWeight: 2, strokeColor: "#FFFFFF" }}/>
                                )}
                                {activeOrder.pickupLocation?.latitude && (
                                    <Marker position={{ lat: activeOrder.pickupLocation.latitude, lng: activeOrder.pickupLocation.longitude! }} title="Pickup" zIndex={5} label={{ text: "P", color: "white", fontWeight: "bold", fontSize: "11px" }} icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: "#10B981", fillOpacity: 1, strokeWeight: 1, strokeColor: '#ffffff'}}/>
                                )}
                                {activeOrder.dropLocation?.latitude && (
                                    <Marker position={{ lat: activeOrder.dropLocation.latitude, lng: activeOrder.dropLocation.longitude! }} title="Dropoff" zIndex={5} label={{ text: "D", color: "white", fontWeight: "bold", fontSize: "11px" }} icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: "#EF4444", fillOpacity: 1, strokeWeight: 1, strokeColor: '#ffffff' }}/>
                                )}

                                {currentLeg && activeOrder.status !== 'completed' && !routeError && !isCalculatingRoute && (
                                    <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-2.5 rounded-lg shadow-lg border border-gray-200 max-w-[calc(100%-1rem)]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Timer size={16} className="text-blue-600 flex-shrink-0"/>
                                            <span className="font-bold text-base text-gray-800">
                                                {currentLeg.duration?.text || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Route size={14} className="text-gray-500 flex-shrink-0"/>
                                            <span>
                                                {currentLeg.distance?.text || 'N/A'}
                                                {' to '}
                                                <span className="font-medium text-gray-700">
                                                    {activeOrder.status === 'picked_up' ? 'Dropoff' : 'Pickup'}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {isCalculatingRoute && activeOrder.status !== 'completed' && (
                                    <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow z-20 text-xs text-blue-600 font-medium flex items-center">
                                        <Loader2 size={14} className="animate-spin mr-1"/> Calculating route...
                                    </div>
                                )}
                                {routeError && activeOrder.status !== 'completed' && (
                                    <div className="absolute top-2 left-2 bg-red-100/80 backdrop-blur-sm px-2 py-1 rounded shadow z-20 text-xs text-red-700 font-medium flex items-center">
                                        <AlertCircle size={14} className="mr-1"/> {routeError}
                                    </div>
                                )}
                            </GoogleMap>

                            <div className="absolute bottom-4 right-4 z-10">
                                <button onClick={openInMaps} className="px-3 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center text-sm transition duration-150 ease-in-out">
                                    <Navigation size={16} className="mr-1.5" /> View in Maps
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Details Column */}
                    <div className="w-full md:w-2/5 flex flex-col gap-4">
                        {driverData ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Driver Details</h3>
                                <div className="flex items-center mb-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden mr-3 flex-shrink-0 border-2 border-white shadow">
                                        {driverData.profilePicturePath ? (<img src={driverData.profilePicturePath} alt={driverData.fullName} className="w-full h-full object-cover"/>) : (<span className="text-xl font-semibold text-gray-500">{driverData.fullName?.charAt(0)?.toUpperCase() || '?'}</span>)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{driverData.fullName || 'N/A'}</p>
                                        <p className="text-sm text-gray-600">{driverData.vehicleType || activeOrder.vehicle || 'N/A'}</p>
                                    </div>
                                </div>
                                <button onClick={callDriver} disabled={!driverData.mobileNumber || activeOrder.status === 'completed'} className="w-full py-2.5 px-4 rounded-lg bg-green-600 text-white flex items-center justify-center hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition text-sm font-medium">
                                    <Phone size={16} className="mr-2" /> Call Driver
                                </button>
                            </div>
                        ) : (!isLoading && <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-500 text-center">Fetching driver details...</div>)}

                        {activeOrder.status !== 'completed' && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Verification Codes</h3>
                                <div className="bg-blue-50 p-3 rounded-lg mb-3 border border-blue-200 shadow-sm">
                                    <p className="text-xs text-blue-800 font-medium mb-1.5">Pickup Code</p>
                                    <div className="text-2xl font-bold tracking-widest flex justify-center items-center space-x-2 my-2">
                                        {activeOrder.pickupOtp?.split('').map((d, i) => <span key={`p-${i}`} className="w-9 h-10 bg-white flex items-center justify-center rounded border border-blue-300 shadow-inner">{d}</span>) || '----'}
                                    </div>
                                    <p className="text-xs text-center text-gray-600 mt-1.5">
                                        {activeOrder.status === 'driver_assigned' ? 'Share when driver arrives' :
                                        activeOrder.status === 'driver_arrived' ? 'Share with driver now' :
                                        (activeOrder.status === 'picked_up' || activeOrder.status === 'completed') ? 'Pickup code verified' : ''}
                                    </p>
                                </div>
                                {(activeOrder.status === 'picked_up' || activeOrder.dropoffOtp) && (
                                    <div className="bg-green-50 p-3 rounded-lg border border-green-200 shadow-sm">
                                        <p className="text-xs text-green-800 font-medium mb-1.5">Dropoff Code</p>
                                        <div className="text-2xl font-bold tracking-widest flex justify-center items-center space-x-2 my-2">
                                            {activeOrder.dropoffOtp?.split('').map((d, i) => <span key={`d-${i}`} className="w-9 h-10 bg-white flex items-center justify-center rounded border border-green-300 shadow-inner">{d}</span>) || '----'}
                                        </div>
                                        <p className="text-xs text-center text-gray-600 mt-1.5">
                                            {activeOrder.status === 'picked_up' ? 'Share upon delivery arrival' : 
                                             activeOrder.status === 'completed' ? 'Dropoff code verified' : ''}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Order Status</h3>
                            <div className="relative pl-8">
                                <div className="absolute left-4 top-1 bottom-1 w-0.5 bg-gray-300 rounded-full"></div>
                                {([
                                    { statusMet: !!activeOrder, icon: Truck, title: 'Driver Assigned', desc: 'Waiting for pickup' },
                                    { statusMet: ['driver_arrived', 'picked_up', 'completed'].includes(activeOrder.status), icon: MapPin, title: 'Driver Arrived', desc: 'Verify pickup code' },
                                    { statusMet: ['picked_up', 'completed'].includes(activeOrder.status), icon: Package, title: 'Package Picked Up', desc: 'Package en route' },
                                    { statusMet: activeOrder.status === 'completed', icon: Clock, title: 'Delivery Completed', desc: 'Package delivered' }
                                ]).map((step, index, arr) => (
                                    <div key={step.title} className={`relative ${index < arr.length - 1 ? 'mb-5' : ''}`}>
                                        <div className={`absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center z-10 border-2 border-white shadow ${step.statusMet ? (step.title === 'Delivery Completed' ? 'bg-green-500' : 'bg-blue-500') : 'bg-gray-400'}`}>
                                            <step.icon size={12} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-gray-800">{step.title}</p>
                                            <p className="text-xs text-gray-500">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActiveOrders;