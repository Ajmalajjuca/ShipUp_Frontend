import React, { useCallback } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { Navigation, Timer, Route, Loader2, AlertCircle } from 'lucide-react';
import { OrderData, DriverData } from './useOrderTracking';

// Types
interface OrderTrackingMapProps {
    isLoaded: boolean;
    activeOrder: OrderData;
    mapCenter: google.maps.LatLngLiteral;
    directions: google.maps.DirectionsResult | null;
    routeError: string | null;
    isCalculatingRoute: boolean;
    driverData: DriverData | null;
    hasValidDriverLocation: () => boolean;
    getDriverPosition: () => google.maps.LatLngLiteral | null;
    openInMaps: () => void;
    onMapLoad: (map: google.maps.Map) => void;
    onMapUnmount: () => void;
}

interface MapEtaOverlayProps {
    currentLeg: google.maps.DirectionsLeg;
    activeOrder: OrderData;
}

interface MapStatusOverlayProps {
    type: 'loading' | 'error';
    message: string;
}

// Constants
const containerStyle = { width: '100%', height: '100%' };

const OrderTrackingMap = ({
    isLoaded,
    activeOrder,
    mapCenter,
    directions,
    routeError,
    isCalculatingRoute,
    driverData,
    hasValidDriverLocation,
    getDriverPosition,
    openInMaps,
    onMapLoad,
    onMapUnmount
}: OrderTrackingMapProps) => {
    // Callback handlers
    const handleMapLoad = useCallback((map: google.maps.Map) => {
        if (onMapLoad) onMapLoad(map);
    }, [onMapLoad]);

    const handleMapUnmount = useCallback(() => {
        if (onMapUnmount) onMapUnmount();
    }, [onMapUnmount]);

    // Use for rendering - guaranteed to be current for this render pass
    const isDriverLocValidRender = hasValidDriverLocation();
    const driverMarkerPosRender = getDriverPosition();
    const currentLeg = directions?.routes?.[0]?.legs?.[0]; // Helper for ETA/Distance

    return (
        <div className="rounded-lg overflow-hidden h-80 md:h-[450px] bg-gray-200 relative border border-gray-200">
            {isLoaded ? (
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={mapCenter}
                    zoom={14}
                    onLoad={handleMapLoad}
                    onUnmount={handleMapUnmount}
                    options={{ 
                        fullscreenControl: false, 
                        mapTypeControl: false, 
                        streetViewControl: false, 
                        zoomControl: true, 
                        gestureHandling: 'cooperative',
                        styles: [
                            {
                                featureType: 'poi',
                                elementType: 'labels',
                                stylers: [{ visibility: 'off' }]
                            },
                            {
                                featureType: 'transit',
                                elementType: 'labels',
                                stylers: [{ visibility: 'off' }]
                            }
                        ]
                    }}
                >
                    {/* Directions Route */}
                    {directions && activeOrder.status !== 'completed' && (
                        <DirectionsRenderer 
                            directions={directions} 
                            options={{ 
                                suppressMarkers: true, 
                                polylineOptions: { 
                                    strokeColor: '#1D4ED8', 
                                    strokeOpacity: 0.8, 
                                    strokeWeight: 6, 
                                    zIndex: 1 
                                } 
                            }} 
                        />
                    )}

                    {/* Driver Marker */}
                    {isDriverLocValidRender && driverMarkerPosRender && activeOrder.status !== 'completed' && (
                        <Marker 
                            position={driverMarkerPosRender} 
                            title={`Driver: ${driverData?.fullName || '...'}`} 
                            zIndex={10} 
                            icon={{ 
                                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, 
                                scale: 7, 
                                fillColor: "#1F2937", 
                                fillOpacity: 1, 
                                strokeWeight: 2, 
                                strokeColor: "#FFFFFF" 
                            }}
                        />
                    )}

                    {/* Pickup Marker */}
                    {activeOrder.pickupAddress?.latitude && (
                        <Marker 
                            position={{ 
                                lat: activeOrder.pickupAddress.latitude, 
                                lng: activeOrder.pickupAddress.longitude 
                            }} 
                            title="Pickup" 
                            zIndex={5} 
                            label={{ 
                                text: "P", 
                                color: "white", 
                                fontWeight: "bold", 
                                fontSize: "11px" 
                            }} 
                            icon={{ 
                                path: window.google.maps.SymbolPath.CIRCLE, 
                                scale: 9, 
                                fillColor: "#10B981", 
                                fillOpacity: 1, 
                                strokeWeight: 1, 
                                strokeColor: '#ffffff'
                            }}
                        />
                    )}

                    {/* Dropoff Marker */}
                    {activeOrder.dropoffAddress?.latitude && (
                        <Marker 
                            position={{ 
                                lat: activeOrder.dropoffAddress.latitude, 
                                lng: activeOrder.dropoffAddress.longitude 
                            }} 
                            title="Dropoff" 
                            zIndex={5} 
                            label={{ 
                                text: "D", 
                                color: "white", 
                                fontWeight: "bold", 
                                fontSize: "11px" 
                            }} 
                            icon={{ 
                                path: window.google.maps.SymbolPath.CIRCLE, 
                                scale: 9, 
                                fillColor: "#EF4444", 
                                fillOpacity: 1, 
                                strokeWeight: 1, 
                                strokeColor: '#ffffff' 
                            }}
                        />
                    )}

                    {/* ETA / Distance Overlay */}
                    {currentLeg && activeOrder.status !== 'completed' && !routeError && !isCalculatingRoute && (
                        <MapEtaOverlay currentLeg={currentLeg} activeOrder={activeOrder} />
                    )}

                    {/* Loading/Error States */}
                    {isCalculatingRoute && activeOrder.status !== 'completed' && (
                        <MapStatusOverlay type="loading" message="Calculating route..." />
                    )}
                    
                    {routeError && activeOrder.status !== 'completed' && (
                        <MapStatusOverlay type="error" message={routeError} />
                    )}
                </GoogleMap>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                    Loading map interface...
                </div>
            )}

            {/* Open in Maps Button */}
            <div className="absolute bottom-4 right-4 z-10">
                <button 
                    onClick={openInMaps} 
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center text-sm transition duration-150 ease-in-out"
                >
                    <Navigation size={16} className="mr-1.5" /> View in Maps
                </button>
            </div>
        </div>
    );
};

// Sub-components
const MapEtaOverlay = ({ currentLeg, activeOrder }: MapEtaOverlayProps) => (
    <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-2.5 rounded-lg shadow-lg border border-gray-200 max-w-[calc(100%-1rem)]">
        <div className="flex items-center gap-2 mb-1">
            <Timer size={16} className="text-blue-600 flex-shrink-0"/>
            <span className="font-bold text-base text-gray-800">
                {currentLeg.duration?.text || 'Calculating...'}
            </span>
        </div>
        <div className="flex items-center gap-2">
            <Route size={16} className="text-blue-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">
                {currentLeg.distance?.text || 'Calculating distance...'}
            </span>
        </div>
    </div>
);

const MapStatusOverlay = ({ type, message }: MapStatusOverlayProps) => (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/30">
        <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs text-center">
            {type === 'loading' ? (
                <Loader2 size={24} className="mx-auto mb-2 text-blue-500 animate-spin" />
            ) : (
                <AlertCircle size={24} className="mx-auto mb-2 text-red-500" />
            )}
            <p className="text-sm font-medium text-gray-700">{message}</p>
        </div>
    </div>
);

export default OrderTrackingMap;