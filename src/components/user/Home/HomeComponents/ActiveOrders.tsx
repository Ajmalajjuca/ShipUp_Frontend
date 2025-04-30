import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Truck, Package, Phone, Navigation, Clock, AlertCircle, Loader2, Timer, Route } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../Redux/store';
import { activeOrderService, ActiveOrder } from '../../../../services/active-order.service';
import {
    GoogleMap,
    useJsApiLoader,
    Marker,
    DirectionsService,
    DirectionsRenderer
} from '@react-google-maps/api';

// --- Interfaces ---
interface Address {
    latitude?: number;
    longitude?: number;
    [key: string]: any; // Allow other address properties
}

// Use the type from the service instead of redefining
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

// --- React Component ---
const ActiveOrders: React.FC = () => {
    // --- State Variables ---
    const [activeOrder, setActiveOrder] = useState<ActiveOrderData | null>(null);
    const [driverData, setDriverData] = useState<DriverData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
    const [routeError, setRouteError] = useState<string | null>(null);
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

    // --- Google Maps Loader ---
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places', 'geometry'], // Ensure geometry is loaded if using heading calculation
    });

    // --- Update Refs whenever state changes ---
    useEffect(() => { activeOrderRef.current = activeOrder; }, [activeOrder]);
    useEffect(() => { driverDataRef.current = driverData; }, [driverData]);
    useEffect(() => { isCalculatingRouteRef.current = isCalculatingRoute; }, [isCalculatingRoute]);

    // --- Helper Functions ---
    const getDriverPosition = useCallback((): google.maps.LatLngLiteral | null => {
        const coords = driverDataRef.current?.location?.coordinates; // Use ref
        if (coords && coords.length === 2) {
            return { lat: coords[1], lng: coords[0] }; // Lat, Lng for Google Maps
        }
        return null;
    }, []); // No state dependency needed

    const hasValidDriverLocation = useCallback((): boolean => {
        return getDriverPosition() !== null;
    }, [getDriverPosition]); // Depends on the result of getDriverPosition

    const generateOtp = (): string => {
        return Math.floor(1000 + Math.random() * 9000).toString();
    };

    // --- Status Update Function (Handles triggering route calculation) ---
    const updateOrderStatus = useCallback((status: ActiveOrderData['status']) => {
        const prevOrder = activeOrderRef.current; // Get current state from ref
        if (!prevOrder || prevOrder.status === status || !user?.userId) return; // Avoid redundant updates or no user

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
            if (!isCalculatingRouteRef.current) { // Check ref if already calculating
                setIsCalculatingRoute(true);
            }
        } else if (status === 'completed') {
            console.log("Status change: Order completed. Clearing route.");
            setDirections(null);
            setRouteError(null);
            setIsCalculatingRoute(false); // Stop any ongoing calculation
        } else if ((status === 'driver_assigned' || status === 'driver_arrived') && hasValidDriverLocation()) {
             // Trigger on assign/arrive if location is known and not already calculating
             if (!isCalculatingRouteRef.current) {
                  console.log("Status assigned/arrived: Triggering route calc.");
                  setIsCalculatingRoute(true);
             }
        }
    }, [hasValidDriverLocation, user?.userId]); // Added user.userId as dependency

    // --- Main Effect: Initial Load, Polling, WebSocket ---
    useEffect(() => {
        console.log('ActiveOrders: Component Mounting...');
        setIsLoading(true);
        let currentDriverId: string | null = null;
        let currentOrderId: string | null = null;

        // Check if we have a user ID
        if (!user || !user.userId) {
            console.log('ActiveOrders: No authenticated user found');
            setIsLoading(false);
            return;
        }

        // 1. Load Order from Redis with localStorage fallback
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
                // Continue with the rest of the initialization
                if (currentDriverId) {
                    await fetchAndSetDriverData(true); // Initial fetch
                    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
                    locationIntervalRef.current = setInterval(() => fetchAndSetDriverData(false), POLLING_INTERVAL);
                    console.log('ActiveOrders: Location polling started.');
                } else {
                    setIsLoading(false); // No driver ID found, stop loading
                }
                
                setupWebsocket(currentOrderId);
            }
        };

        // Function to fetch driver data
        const fetchAndSetDriverData = async (isInitialLoad = false) => {
            if (!currentDriverId) {
                if (isInitialLoad) setIsLoading(false); // Stop loading if no driver ID
                return;
            }
            const currentOrder = activeOrderRef.current; // Use ref

            try {
                console.log(`Fetching driver ${currentDriverId} (${isInitialLoad ? 'initial' : 'poll'})...`);
                const response = await axios.get<{ partner: DriverData }>(`http://localhost:3003/api/drivers/${currentDriverId}`);

                if (response.data?.partner) {
                    const partnerData = response.data.partner;
                    const previousLocationJson = JSON.stringify(driverDataRef.current?.location?.coordinates);
                    const newLocationJson = JSON.stringify(partnerData.location?.coordinates);

                    // Update Ref and State
                    driverDataRef.current = partnerData;
                    setDriverData(partnerData); // Update state for rendering

                    // Set initial map center only on first successful fetch
                    if (isInitialLoad) {
                        let initialCenter = DEFAULT_CENTER;
                        const driverCoords = partnerData.location?.coordinates;
                        const pickupCoords = currentOrder?.pickupAddress;
                        if (driverCoords?.length === 2) initialCenter = { lat: driverCoords[1], lng: driverCoords[0] };
                        else if (pickupCoords?.latitude) initialCenter = { lat: pickupCoords.latitude, lng: pickupCoords.longitude! };
                        setMapCenter(initialCenter);
                        console.log('ActiveOrders: Initial map center set:', initialCenter);
                    }

                    // Trigger route recalculation on location change (if order not completed)
                    if (newLocationJson !== previousLocationJson && currentOrder?.status !== 'completed') {
                        console.log("Location changed. Triggering route calculation.");
                        setDirections(null); // Clear old route visually
                        setRouteError(null);
                        if (!isCalculatingRouteRef.current) { // Check ref
                            setIsCalculatingRoute(true); // Set state to trigger effect
                        }
                    }
                } else {
                     console.warn('No partner data received for driver.');
                     if(isInitialLoad) setIsLoading(false); // Stop loading if initial fetch fails
                }
            } catch (error) {
                console.error('ActiveOrders: Error fetching driver:', error);
                if(isInitialLoad) setIsLoading(false); // Stop loading on error
            }
            finally {
                // Ensure loading stops after initial attempt, even if driver wasn't found immediately
                 if(isInitialLoad && isLoading) {
                      setIsLoading(false);
                 }
            }
        };

        // Setup WebSocket connection
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

                 // --- Socket Event Handlers using updateOrderStatus ---
                 socket.on('driver_arrived_pickup', () => updateOrderStatus('driver_arrived'));
                 socket.on('pickup_verified', () => {
                     updateOrderStatus('picked_up');
                     // Generate/save dropoff OTP using refs
                     const order = activeOrderRef.current;
                     if (order && !order.dropoffOtp) {
                         const otp = generateOtp();
                         const updated = { ...order, dropoffOtp: otp };
                         setActiveOrder(updated); // Update state for UI

                         // Store the updated order in Redis
                         if (user.userId) {
                             activeOrderService.storeActiveOrder(user.userId, updated as ActiveOrder)
                                 .catch(err => console.error("Failed to store updated order with dropoff OTP:", err));
                         }

                         // Notify server about the OTP
                         axios.post(`http://localhost:3003/api/orders/${order.orderId}/otp`, { type: 'dropoff', otp })
                             .catch(err => console.error("Failed to save dropoff OTP:", err));
                     }
                 });
                 socket.on('delivery_completed', () => {
                     updateOrderStatus('completed');
                     setTimeout(() => { // Delay clearing state/storage
                         const finalOrder = activeOrderRef.current; // Use ref for check
                         if (finalOrder?.orderId === orderId && finalOrder?.status === 'completed') {
                             // Remove from Redis with localStorage fallback
                             if (user.userId) {
                                 activeOrderService.removeActiveOrder(user.userId)
                                     .catch(err => console.error("Failed to remove completed order:", err));
                             }
                             setActiveOrder(null);
                             setDriverData(null);
                             setDirections(null);
                             console.log(`ActiveOrders: Removed completed order ${orderId}.`);
                         }
                     }, 5000); // 5 second delay
                 });
            }
        };

        // Start the loading process
        loadActiveOrder();

        // 4. Cleanup Function
        return () => {
            console.log('ActiveOrders: Cleaning up component...');
            if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
            if (socketRef.current) socketRef.current.disconnect();
            locationIntervalRef.current = null;
            socketRef.current = null;
            console.log('ActiveOrders: Cleanup complete.');
        };
    }, [user]); // Dependencies include user to re-run when user changes

    // --- Directions Calculation Effect ---
    useEffect(() => {
        // Use refs for checks inside effect to get latest values
        const order = activeOrderRef.current;
        const isCalculating = isCalculatingRouteRef.current; // Use ref
        const driverInfo = driverDataRef.current; // Use ref

        console.log("Directions Effect Check:", { isLoaded, isCalculating, status: order?.status });

        // --- Exit conditions ---
        if (!isLoaded || !isCalculating || !order || order.status === 'completed' || !driverInfo) {
            // If calculation was intended but conditions changed, reset the state flag if it's still true
            if (isCalculating && isCalculatingRoute) {
                 console.log("Directions Effect: Conditions unmet/changed, resetting calculation flag.");
                 setIsCalculatingRoute(false);
            }
            return; // Stop if conditions aren't right
        }

        const driverPosition = getDriverPosition(); // Uses ref internally
        if (!driverPosition) {
            console.log("Directions Effect: No valid driver position available.");
            setRouteError("Driver location unavailable.");
            setIsCalculatingRoute(false); // Reset flag
            setDirections(null);
            return;
        }

        // Determine Destination
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
            setIsCalculatingRoute(false); // Reset flag
            setDirections(null);
            return;
        }

        // --- Proceed with API call ---
        console.log(`Directions Effect: Calling DirectionsService Driver -> ${destinationType}`);
        setRouteError(null); // Clear previous error

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
            {
                origin: driverPosition,
                destination: destinationPosition,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                console.log("DirectionsService Callback:", { status });
                // Check if calculation is still relevant (flag might have been reset)
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
                    setDirections(null); // Clear route visuals
                    setRouteError(`Route error: ${status}`); // Show specific error
                }
                // --- CRITICAL: Reset the flag AFTER processing response ---
                setIsCalculatingRoute(false);
                console.log("Directions Effect: Calculation finished, flag set to false.");
            }
        );
    // Dependencies: Only trigger when load state or calculation *request* changes
    }, [isLoaded, isCalculatingRoute, getDriverPosition]); // getDriverPosition depends on ref, stable unless ref changes

    // --- Map Instance Callbacks ---
    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        console.log('ActiveOrders: Map loaded.');
        const currentOrder = activeOrderRef.current;
        const currentDriverPos = getDriverPosition(); // Uses ref

        // Trigger initial calc only if map loaded, order exists, driver pos known, and not already calculating
        if (currentOrder && currentOrder.status !== 'completed' && currentDriverPos && !isCalculatingRouteRef.current) {
            console.log("Map onLoad: Triggering initial route calculation.");
            setIsCalculatingRoute(true); // Set state to trigger effect
        }
    }, [getDriverPosition]); // Dependency needed

    const onUnmount = useCallback(() => { mapRef.current = null; console.log('Map unmounted.'); }, []);

    // --- UI Action Handlers (Using Refs for Data Access) ---
    const callDriver = () => {
        const mobile = driverDataRef.current?.mobileNumber; // Use ref
        if (mobile) {
            window.location.href = `tel:${mobile}`;
        } else {
            alert('Driver phone number is not available.');
        }
    };

    const openInMaps = () => {
        const driverPos = getDriverPosition(); // Use ref
        const order = activeOrderRef.current; // Use ref
        let url = '';

        if (driverPos) url = `https://www.google.com/maps?q=${driverPos.lat},${driverPos.lng}`;
        else if (order?.pickupLocation?.latitude) url = `https://www.google.com/maps?q=${order.pickupLocation.latitude},${order.pickupLocation.longitude}`;
        else if (order?.dropLocation?.latitude) url = `https://www.google.com/maps?q=${order.dropLocation.latitude},${order.dropLocation.longitude}`;

        if (url) {
             console.log('Opening in Google Maps:', url);
             window.open(url, '_blank', 'noopener,noreferrer'); // Added security attributes
        } else {
             alert('No location available to open in maps.');
        }
    };

    // --- Render Logic ---

    if (loadError) return <div className="p-4 text-red-600 font-semibold text-center">Error loading Google Maps. Please check your API key configuration and network connection.</div>;
    if (isLoading) return <div className="p-4 md:p-6 text-center py-10"><Loader2 className="animate-spin inline-block mr-2 h-5 w-5 text-blue-600" />Loading active order details...</div>;
    if (!activeOrder) return <div className="p-4 md:p-6 text-center py-10 text-gray-600">No active order found.</div>;

    // Use state for rendering checks (guaranteed to be up-to-date for this render pass)
    const isDriverLocValidRender = hasValidDriverLocation();
    const driverMarkerPosRender = getDriverPosition();
    const currentLeg = directions?.routes?.[0]?.legs?.[0]; // Helper for ETA/Distance

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
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={containerStyle}
                                    center={mapCenter}
                                    zoom={14}
                                    onLoad={onLoad}
                                    onUnmount={onUnmount}
                                    options={{ fullscreenControl: false, mapTypeControl: false, streetViewControl: false, zoomControl: true, gestureHandling: 'cooperative' }}
                                >
                                    {/* Directions Route */}
                                    {directions && activeOrder.status !== 'completed' && (
                                        <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#1D4ED8', strokeOpacity: 0.8, strokeWeight: 6, zIndex: 1 } }} />
                                    )}

                                    {/* Markers */}
                                    {isDriverLocValidRender && driverMarkerPosRender && activeOrder.status !== 'completed' && (
                                        <Marker position={driverMarkerPosRender} title={`Driver: ${driverData?.fullName || '...'}`} zIndex={10} icon={{ path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 7, fillColor: "#1F2937", fillOpacity: 1, strokeWeight: 2, strokeColor: "#FFFFFF" }}/>
                                    )}
                                    {activeOrder.pickupLocation?.latitude && (
                                        <Marker position={{ lat: activeOrder.pickupLocation.latitude, lng: activeOrder.pickupLocation.longitude! }} title="Pickup" zIndex={5} label={{ text: "P", color: "white", fontWeight: "bold", fontSize: "11px" }} icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: "#10B981", fillOpacity: 1, strokeWeight: 1, strokeColor: '#ffffff'}}/>
                                    )}
                                    {activeOrder.dropLocation?.latitude && (
                                        <Marker position={{ lat: activeOrder.dropLocation.latitude, lng: activeOrder.dropLocation.longitude! }} title="Dropoff" zIndex={5} label={{ text: "D", color: "white", fontWeight: "bold", fontSize: "11px" }} icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: "#EF4444", fillOpacity: 1, strokeWeight: 1, strokeColor: '#ffffff' }}/>
                                    )}

                                    {/* ETA / Distance Overlay */}
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

                                    {/* Calculation/Error Overlay */}
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
                            ) : ( <div className="flex items-center justify-center h-full text-gray-500">Loading map interface...</div> )}

                            {/* Open in Maps Button */}
                            <div className="absolute bottom-4 right-4 z-10">
                                <button onClick={openInMaps} className="px-3 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center text-sm transition duration-150 ease-in-out">
                                    <Navigation size={16} className="mr-1.5" /> View in Maps
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Details Column */}
                    <div className="w-full md:w-2/5 flex flex-col gap-4">
                        {/* Driver Info */}
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

                        {/* OTP Section */}
                        {activeOrder.status !== 'completed' && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Verification Codes</h3>
                                {/* Pickup OTP */}
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
                                {/* Dropoff OTP */}
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

                        {/* Status Timeline */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Order Status</h3>
                            <div className="relative pl-8">
                                <div className="absolute left-4 top-1 bottom-1 w-0.5 bg-gray-300 rounded-full"></div>
                                {/* Status Step Helper */}
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