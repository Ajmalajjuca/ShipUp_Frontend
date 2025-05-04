import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, ArrowDownUp, Navigation, MapPinOff } from 'lucide-react';
import { userService } from '../../../../services/user.service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../Redux/store';
import { toast } from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

// Required for Leaflet markers to work properly
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useNavigate } from 'react-router-dom';

interface Address {
  addressId: string;
  type: 'home' | 'work' | 'other';
  street: string;
  isDefault: boolean;
  userId: string;
  streetNumber?: string;
  buildingNumber?: string;
  floorNumber?: string;
  contactName?: string;
  contactPhone?: string;
  latitude?: number;
  longitude?: number;
}

interface AddressSelectorProps {
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
  
  onPickupSelected: (address: { addressId: string; street: string; latitude?: number; longitude?: number; } | null) => void;
  onDropoffSelected: (address: { addressId: string; street: string; latitude?: number; longitude?: number; } | null) => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  pickupAddress,
  dropoffAddress,
  onPickupSelected,
  onDropoffSelected
}) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?.userId || user?._id;
  const navigate = useNavigate();
  
  // State for custom address creation
  const [showMapForPickup, setShowMapForPickup] = useState(false);
  const [showMapForDropoff, setShowMapForDropoff] = useState(false);
  const [customPickupAddress, setCustomPickupAddress] = useState('');
  const [customDropoffAddress, setCustomDropoffAddress] = useState('');
  
  // Map refs
  const pickupMapRef = useRef<L.Map | null>(null);
  const dropoffMapRef = useRef<L.Map | null>(null);
  const pickupMapContainerRef = useRef<HTMLDivElement>(null);
  const dropoffMapContainerRef = useRef<HTMLDivElement>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);

  // Fetch user addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const response = await userService.getUserAddresses(userId);
        if (response.success && response.addresses) {
          setAddresses(response.addresses);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        toast.error('Failed to load addresses');
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [userId]);
  
  // Fix Leaflet icon issues
  useEffect(() => {
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
  }, []);
  
  // Initialize pickup map
  useEffect(() => {
    if (!pickupMapContainerRef.current || pickupMapRef.current || !showMapForPickup) return;

    const map = L.map(pickupMapContainerRef.current).setView([20.5937, 78.9629], 5); // Default to India
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Event handler for clicks on the map
    map.on('click', (e: L.LeafletMouseEvent) => {
      handlePickupMapClick(e.latlng);
    });

    pickupMapRef.current = map;

    return () => {
      map.remove();
      pickupMapRef.current = null;
    };
  }, [showMapForPickup]);
  
  // Initialize dropoff map
  useEffect(() => {
    if (!dropoffMapContainerRef.current || dropoffMapRef.current || !showMapForDropoff) return;

    const map = L.map(dropoffMapContainerRef.current).setView([20.5937, 78.9629], 5); // Default to India
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Event handler for clicks on the map
    map.on('click', (e: L.LeafletMouseEvent) => {
      handleDropoffMapClick(e.latlng);
    });

    dropoffMapRef.current = map;

    return () => {
      map.remove();
      dropoffMapRef.current = null;
    };
  }, [showMapForDropoff]);
  
  // Handle pickup map click
  const handlePickupMapClick = async (latLng: L.LatLng) => {
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
    }

    const marker = L.marker(latLng).addTo(pickupMapRef.current!);
    pickupMarkerRef.current = marker;

    try {
      // Fetch address from coordinates using Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latLng.lat}&lon=${latLng.lng}&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || '';
        setCustomPickupAddress(address);
        
        // Create a custom address object
        onPickupSelected({
          addressId: `temp-pickup-${Date.now()}`,
          street: address,
          latitude: latLng.lat,
          longitude: latLng.lng
        });
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      toast.error('Could not fetch address from location');
    }
  };
  
  // Handle dropoff map click
  const handleDropoffMapClick = async (latLng: L.LatLng) => {
    if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.remove();
    }

    const marker = L.marker(latLng).addTo(dropoffMapRef.current!);
    dropoffMarkerRef.current = marker;

    try {
      // Fetch address from coordinates using Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latLng.lat}&lon=${latLng.lng}&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || '';
        setCustomDropoffAddress(address);
        
        // Create a custom address object
        onDropoffSelected({
          addressId: `temp-dropoff-${Date.now()}`,
          street: address,
          latitude: latLng.lat,
          longitude: latLng.lng
        });
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      toast.error('Could not fetch address from location');
    }
  };
  
  // Get current location for pickup
  const getPickupCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const latLng = new L.LatLng(latitude, longitude);
          
          // Center map on current location
          pickupMapRef.current?.setView(latLng, 15);
          
          // Place a marker at current location
          handlePickupMapClick(latLng);
          
          toast.success('Current location detected');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your current location. Please check your browser permissions.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };
  
  // Get current location for dropoff
  const getDropoffCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const latLng = new L.LatLng(latitude, longitude);
          
          // Center map on current location
          dropoffMapRef.current?.setView(latLng, 15);
          
          // Place a marker at current location
          handleDropoffMapClick(latLng);
          
          toast.success('Current location detected');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your current location. Please check your browser permissions.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };
  
  // Swap pickup and dropoff
  const swapAddresses = () => {
    const temp = pickupAddress;
    onPickupSelected(dropoffAddress);
    onDropoffSelected(temp);
    
    // If custom addresses are shown, also swap the map states
    if (showMapForPickup && showMapForDropoff) {
      const tempPickupAddress = customPickupAddress;
      setCustomPickupAddress(customDropoffAddress);
      setCustomDropoffAddress(tempPickupAddress);
    }
  };
  
  // Navigate to add address
  const handleAddAddress = () => {
    navigate('/address/add');
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Select Addresses</h2>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <>
          {addresses.length === 0 && !showMapForPickup && !showMapForDropoff ? (
            <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg">
              <MapPin size={40} className="text-gray-400 mb-2" />
              <p className="text-gray-600 mb-4">No saved addresses found</p>
              <div className="flex gap-4">
                <button
                  onClick={handleAddAddress}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Add New Address
                </button>
                <button
                  onClick={() => {
                    setShowMapForPickup(true);
                    setShowMapForDropoff(true);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <MapPin size={16} className="mr-1" />
                  Use Map Location
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pickup Address */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
                  {!showMapForPickup && (
                    <button
                      onClick={() => setShowMapForPickup(true)}
                      className="text-blue-500 text-xs flex items-center"
                    >
                      <MapPin size={12} className="mr-1" />
                      Use Map
                    </button>
                  )}
                  {showMapForPickup && (
                    <button
                      onClick={() => setShowMapForPickup(false)}
                      className="text-blue-500 text-xs"
                    >
                      Use Saved Address
                    </button>
                  )}
                </div>
                
                {showMapForPickup ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-red-50 flex items-center border-b rounded-t-lg">
                      <div className="p-2 rounded-full bg-red-100 mr-2">
                        <MapPin size={16} className="text-red-500" />
                      </div>
                      <span className="font-medium text-red-500">Select Pickup Location on Map</span>
                    </div>
                    
                    <div className="border border-gray-200 rounded-b-lg overflow-hidden">
                      <div className="relative h-72 w-full">
                        <div ref={pickupMapContainerRef} className="h-full w-full"></div>
                        <div className="absolute bottom-2 left-2 right-2 bg-white p-2 rounded-lg shadow-md text-sm text-gray-700">
                          <p className="font-medium mb-1">Selected Address:</p>
                          <p className="truncate">
                            {customPickupAddress || 'Click on the map to place a marker.'}
                          </p>
                        </div>
                      </div>
                      <div className="p-2 bg-gray-50 flex justify-end">
                        <button
                          onClick={getPickupCurrentLocation}
                          className="flex items-center px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                        >
                          <Navigation size={14} className="mr-1" />
                          Use Current Location
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-3 bg-red-50 flex items-center border-b">
                      <div className="p-2 rounded-full bg-red-100 mr-2">
                        <MapPin size={16} className="text-red-500" />
                      </div>
                      <span className="font-medium text-red-500">Origin</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {addresses.map(address => (
                        <div 
                          key={`pickup-${address.addressId}`}
                          onClick={() => onPickupSelected({
                            addressId: address.addressId,
                            street: address.street,
                            latitude: address.latitude,
                            longitude: address.longitude
                          })}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            pickupAddress?.addressId === address.addressId
                              ? 'bg-red-50 border border-red-200'
                              : 'hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`p-1.5 rounded-full mr-2 ${
                              address.type === 'home' ? 'bg-blue-100 text-blue-500' : 
                              address.type === 'work' ? 'bg-purple-100 text-purple-500' : 
                              'bg-green-100 text-green-500'
                            }`}>
                              <MapPin size={14} />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-800">{address.type.charAt(0).toUpperCase() + address.type.slice(1)}</p>
                              <p className="text-sm text-gray-600 truncate">{address.street}</p>
                            </div>
                            {address.isDefault && (
                              <span className="ml-auto text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Default</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Swap button */}
              <div className="flex justify-center">
                <button
                  onClick={swapAddresses}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Swap addresses"
                >
                  <ArrowDownUp size={20} className="text-gray-600" />
                </button>
              </div>
              
              {/* Dropoff Address */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Dropoff Location</label>
                  {!showMapForDropoff && (
                    <button
                      onClick={() => setShowMapForDropoff(true)}
                      className="text-blue-500 text-xs flex items-center"
                    >
                      <MapPin size={12} className="mr-1" />
                      Use Map
                    </button>
                  )}
                  {showMapForDropoff && (
                    <button
                      onClick={() => setShowMapForDropoff(false)}
                      className="text-blue-500 text-xs"
                    >
                      Use Saved Address
                    </button>
                  )}
                </div>
                
                {showMapForDropoff ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 flex items-center border-b rounded-t-lg">
                      <div className="p-2 rounded-full bg-blue-100 mr-2">
                        <MapPin size={16} className="text-blue-500" />
                      </div>
                      <span className="font-medium text-blue-500">Select Dropoff Location on Map</span>
                    </div>
                    
                    <div className="border border-gray-200 rounded-b-lg overflow-hidden">
                      <div className="relative h-72 w-full">
                        <div ref={dropoffMapContainerRef} className="h-full w-full"></div>
                        <div className="absolute bottom-2 left-2 right-2 bg-white p-2 rounded-lg shadow-md text-sm text-gray-700">
                          <p className="font-medium mb-1">Selected Address:</p>
                          <p className="truncate">
                            {customDropoffAddress || 'Click on the map to place a marker.'}
                          </p>
                        </div>
                      </div>
                      <div className="p-2 bg-gray-50 flex justify-end">
                        <button
                          onClick={getDropoffCurrentLocation}
                          className="flex items-center px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                        >
                          <Navigation size={14} className="mr-1" />
                          Use Current Location
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="p-3 bg-blue-50 flex items-center border-b">
                      <div className="p-2 rounded-full bg-blue-100 mr-2">
                        <MapPin size={16} className="text-blue-500" />
                      </div>
                      <span className="font-medium text-blue-500">Destination</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {addresses.map(address => (
                        <div 
                          key={`dropoff-${address.addressId}`}
                          onClick={() => onDropoffSelected({
                            addressId: address.addressId,
                            street: address.street,
                            latitude: address.latitude,
                            longitude: address.longitude
                          })}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            dropoffAddress?.addressId === address.addressId
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`p-1.5 rounded-full mr-2 ${
                              address.type === 'home' ? 'bg-blue-100 text-blue-500' : 
                              address.type === 'work' ? 'bg-purple-100 text-purple-500' : 
                              'bg-green-100 text-green-500'
                            }`}>
                              <MapPin size={14} />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-800">{address.type.charAt(0).toUpperCase() + address.type.slice(1)}</p>
                              <p className="text-sm text-gray-600 truncate">{address.street}</p>
                            </div>
                            {address.isDefault && (
                              <span className="ml-auto text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Default</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Add New Address button */}
              <div className="flex justify-center">
                <button
                  onClick={handleAddAddress}
                  className="text-red-500 flex items-center hover:text-red-600 transition-colors"
                >
                  <Plus size={16} className="mr-1" />
                  Add New Address
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AddressSelector; 