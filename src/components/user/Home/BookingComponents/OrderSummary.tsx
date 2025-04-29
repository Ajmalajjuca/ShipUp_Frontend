import React, { useEffect, useRef } from 'react';
import { MapPin, Truck, Clock, CreditCard, ArrowRight, ChevronLeft, DollarSign } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { Link } from 'react-router-dom';
import { PaymentMethod } from './PaymentMethodSelection';

// Required for Leaflet markers to work properly
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon issues
const DefaultIcon = L.Icon.extend({
  options: {
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }
});

L.Marker.prototype.options.icon = new DefaultIcon();

// Extend the Leaflet namespace to include Routing
declare global {
  namespace L {
    namespace Routing {
      function control(options: any): Control;
      interface Control extends L.Control {
        on(event: string, handler: Function): void;
      }
    }
    interface Icon {
      extend(options: any): any;
    }
    namespace Icon {
      function extend(options: any): any;
    }
    // No need to redeclare these types as they already exist in the Leaflet types
  }
}

interface OrderSummaryProps {
  orderDetails: {
    pickupAddress: { 
      street: string;
      latitude?: number;
      longitude?: number;
    } | null;
    dropoffAddress: { 
      street: string;
      latitude?: number;
      longitude?: number;
    } | null;
    vehicleId: string | null;
    vehicleName: string | null;
    vehiclePricePerKm: number | null;
    deliveryType: 'normal' | 'express' | null;
    paymentMethod: PaymentMethod | null;
    distance: number;
    effectiveDistance: number;
    price: number;
    basePrice: number;
    deliveryPrice: number;
    commission: number;
    gstAmount: number;
    estimatedTime: string;
  };
  onSubmit: () => void;
  isLoading: boolean;
  onBack: () => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ orderDetails, onSubmit, isLoading, onBack }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  
  // Initialize map and route
  useEffect(() => {
    // Check if we have valid coordinates for both pickup and dropoff
    if (
      !mapContainerRef.current || 
      mapRef.current || 
      !orderDetails.pickupAddress?.latitude || 
      !orderDetails.pickupAddress?.longitude || 
      !orderDetails.dropoffAddress?.latitude || 
      !orderDetails.dropoffAddress?.longitude
    ) {
      return;
    }
    
    const pickupLat = orderDetails.pickupAddress.latitude;
    const pickupLng = orderDetails.pickupAddress.longitude;
    const dropoffLat = orderDetails.dropoffAddress.latitude;
    const dropoffLng = orderDetails.dropoffAddress.longitude;
    const pickupStreet = orderDetails.pickupAddress.street;
    const dropoffStreet = orderDetails.dropoffAddress.street;
    
    // Initialize map with better zoom and center
    const map = L.map(mapContainerRef.current).setView([
      (pickupLat + dropoffLat) / 2,
      (pickupLng + dropoffLng) / 2
    ], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Create custom pickup marker
    const pickupIcon = L.divIcon({
      className: 'custom-marker-container',
      html: `
        <div class="pickup-marker-outer">
          <div class="pickup-marker-inner"></div>
        </div>
        <div class="marker-label">Pickup</div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
    
    // Create custom dropoff marker
    const dropoffIcon = L.divIcon({
      className: 'custom-marker-container',
      html: `
        <div class="dropoff-marker-outer">
          <div class="dropoff-marker-inner"></div>
        </div>
        <div class="marker-label">Dropoff</div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
    
    // Add custom markers directly to map
    const pickupMarker = L.marker([pickupLat, pickupLng], { icon: pickupIcon }).addTo(map);
    const dropoffMarker = L.marker([dropoffLat, dropoffLng], { icon: dropoffIcon }).addTo(map);
    
    // Add popups with address info
    pickupMarker.bindPopup(`<b>Pickup:</b> ${pickupStreet}`).openPopup();
    dropoffMarker.bindPopup(`<b>Dropoff:</b> ${dropoffStreet}`);
    
    // Add routing with improved styling
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(pickupLat, pickupLng),
        L.latLng(dropoffLat, dropoffLng)
      ],
      routeWhileDragging: false,
      showAlternatives: false,
      fitSelectedRoutes: true,
      show: false, // Hide turn-by-turn instructions
      lineOptions: {
        styles: [
          { color: '#6366f1', opacity: 0.8, weight: 6 },
          { color: 'white', opacity: 0.3, weight: 4 }
        ]
      },
      altLineOptions: {
        styles: [
          { color: '#f59e0b', opacity: 0.8, weight: 6 },
          { color: 'white', opacity: 0.3, weight: 4 }
        ]
      },
      createMarker: function() {
        // Return null to prevent the default routing markers
        return null;
      }
    }).addTo(map);
    
    // Remove the itinerary instructions and ensure the map is properly zoomed
    routingControl.on('routesfound', function(e: { routes: any[] }) {
      const container = document.querySelector('.leaflet-routing-container');
      if (container) {
        container.remove();
      }
      
      // Ensure the map is properly zoomed to show both markers and the route
      const bounds = L.latLngBounds([
        [pickupLat, pickupLng],
        [dropoffLat, dropoffLng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    });
    
    mapRef.current = map;
    routingControlRef.current = routingControl;
    
    // Add custom styling for markers
    const style = document.createElement('style');
    style.innerHTML = `
      .custom-marker-container {
        position: relative;
        text-align: center;
      }
      .pickup-marker-outer, .dropoff-marker-outer {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      }
      .pickup-marker-outer {
        background-color: rgba(239, 68, 68, 0.7);
        border: 2px solid #ef4444;
      }
      .dropoff-marker-outer {
        background-color: rgba(59, 130, 246, 0.7);
        border: 2px solid #3b82f6;
      }
      .pickup-marker-inner, .dropoff-marker-inner {
        width: 14px;
        height: 14px;
        border-radius: 50%;
      }
      .pickup-marker-inner {
        background-color: #ef4444;
      }
      .dropoff-marker-inner {
        background-color: #3b82f6;
      }
      .marker-label {
        position: absolute;
        top: 28px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(255, 255, 255, 0.9);
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: bold;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        white-space: nowrap;
      }
      .leaflet-marker-icon {
        background: transparent !important;
        border: none !important;
      }
      .leaflet-popup-content {
        font-size: 12px;
        margin: 8px 12px;
      }
      .leaflet-popup-content b {
        color: #4b5563;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [orderDetails.pickupAddress?.latitude, orderDetails.pickupAddress?.longitude, 
      orderDetails.dropoffAddress?.latitude, orderDetails.dropoffAddress?.longitude]);
  
  // Format price to show in INR with 2 decimal places
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(price);
  };

  // Get payment method display name
  const getPaymentMethodName = (method: PaymentMethod | null): string => {
    switch (method) {
      case 'razorpay':
        return 'Credit/Debit Card (Razorpay)';
      case 'wallet':
        return 'ShipUp Wallet';
      case 'cash':
        return 'Cash on Delivery';
      case 'upi':
        return 'UPI on Delivery';
      default:
        return 'Not selected';
    }
  };

  // Determine if payment method is pre-payment or post-delivery
  const isPrePaymentMethod = (method: PaymentMethod | null): boolean => {
    return method === 'razorpay' || method === 'wallet';
  };
  
  return (
    <div className="space-y-6">
      {/* Back button and heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={onBack} 
            className="mr-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Order Summary</h2>
            <p className="text-gray-600 text-sm">Please review your order details before confirming</p>
          </div>
        </div>
        <div className="hidden sm:block">
          <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-medium">Final Step</span>
        </div>
      </div>

      {/* Map View with improved styling */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="p-3 border-b border-gray-200 bg-indigo-50">
          <h3 className="font-medium text-indigo-800">Delivery Route</h3>
        </div>
        <div className="h-72" ref={mapContainerRef}></div>
      </div>

      <div className="bg-gray-50 rounded-lg p-5 space-y-4">
        {/* Pickup and Delivery */}
        <div className="flex items-start">
          <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
            <MapPin className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3 flex-grow">
            <div className="flex flex-col">
              <div className="flex flex-col mb-4">
                <span className="text-sm font-medium text-gray-500">Pickup Location</span>
                <span className="text-sm font-medium text-gray-900">{orderDetails.pickupAddress?.street}</span>
              </div>
              
              <div className="flex items-center justify-center mb-4">
                <div className="w-px h-6 bg-gray-300"></div>
                <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                <div className="w-px h-6 bg-gray-300"></div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-500">Delivery Location</span>
                <span className="text-sm font-medium text-gray-900">{orderDetails.dropoffAddress?.street}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Vehicle Type */}
        <div className="flex items-start pt-2 border-t border-gray-200">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <Truck className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <span className="text-sm font-medium text-gray-500">Vehicle Type</span>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900 mr-2">{orderDetails.vehicleName}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 rounded-full">
                {formatPrice(orderDetails.vehiclePricePerKm || 0)}/km
              </span>
            </div>
          </div>
        </div>
        
        {/* Delivery Type & Time */}
        <div className="flex items-start pt-2 border-t border-gray-200">
          <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
            <Clock className="h-5 w-5 text-green-500" />
          </div>
          <div className="ml-3">
            <span className="text-sm font-medium text-gray-500">Delivery Type</span>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900 capitalize mr-2">
                {orderDetails.deliveryType}
              </span>
              <span className="text-xs bg-green-100 text-green-800 px-2 rounded-full">
                Est. {orderDetails.estimatedTime}
              </span>
            </div>
          </div>
        </div>
        
        {/* Payment Method */}
        <div className="flex items-start pt-2 border-t border-gray-200">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-amber-500" />
          </div>
          <div className="ml-3">
            <span className="text-sm font-medium text-gray-500">Payment Method</span>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900 mr-2">
                {getPaymentMethodName(orderDetails.paymentMethod)}
              </span>
              <span className={`text-xs px-2 rounded-full ${
                isPrePaymentMethod(orderDetails.paymentMethod) 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {isPrePaymentMethod(orderDetails.paymentMethod) ? 'Pay Now' : 'Pay on Delivery'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Distance */}
        <div className="flex items-start pt-2 border-t border-gray-200">
          <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
            <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div className="ml-3">
            <span className="text-sm font-medium text-gray-500">Distance</span>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900">
                {orderDetails.distance.toFixed(2)} km 
                {orderDetails.effectiveDistance > orderDetails.distance && (
                  <span className="text-xs text-gray-500 ml-1">
                    (Min. {orderDetails.effectiveDistance.toFixed(2)} km applied)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pricing Breakdown */}
      <div className="border rounded-lg divide-y">
        <h3 className="text-lg font-medium p-4">Payment Details</h3>
        
        <div className="p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Base price</span>
            <span>{formatPrice(orderDetails.basePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery charge</span>
            <span>{formatPrice(orderDetails.deliveryPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Commission</span>
            <span>{formatPrice(orderDetails.commission)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">GST</span>
            <span>{formatPrice(orderDetails.gstAmount)}</span>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-lg">{formatPrice(orderDetails.price)}</span>
          </div>
          {isPrePaymentMethod(orderDetails.paymentMethod) ? (
            <p className="text-xs text-gray-500 mt-2">You will be redirected to payment after placing order</p>
          ) : (
            <p className="text-xs text-gray-500 mt-2">Payment will be collected upon delivery</p>
          )}
        </div>
      </div>
      
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="px-6 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 disabled:bg-indigo-300 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 inline-block mr-1" /> Place Order
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default OrderSummary; 