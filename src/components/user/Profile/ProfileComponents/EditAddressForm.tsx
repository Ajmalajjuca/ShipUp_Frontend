import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Home, Briefcase, MapPin, Navigation, Pencil, MapPinOff } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import ProfileLayout from '../ProfileLayout';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { userService } from '../../../../services/user.service';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../Redux/store';

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

interface AddressFormData {
  type: 'home' | 'work' | 'other';
  street: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
  streetNumber?: string;
  buildingNumber?: string;
  floorNumber?: string;
  contactName?: string;
  contactPhone?: string;
}

const EditAddressForm: React.FC = () => {
  const navigate = useNavigate();
  const { addressId } = useParams<{ addressId: string }>();
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?.userId || user?._id;
  
  const [formData, setFormData] = useState<AddressFormData>({
    type: 'home',
    street: '',
    isDefault: false,
    latitude: undefined,
    longitude: undefined,
    streetNumber: '',
    buildingNumber: '',
    floorNumber: '',
    contactName: '',
    contactPhone: ''
  });
  
  const [errors, setErrors] = useState<Partial<AddressFormData>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [addressFromMap, setAddressFromMap] = useState<string>('');

  // Map references
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const drawControlRef = useRef<any>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  // Fetch the address details when component mounts
  useEffect(() => {
    const fetchAddress = async () => {
      if (!addressId) return;
      
      try {
        setInitialLoading(true);
        const response = await userService.getAddress(addressId);
        
        if (response.success && response.address) {
          const address = response.address;
          
          setFormData({
            type: address.type,
            street: address.street,
            isDefault: address.isDefault,
            latitude: address.latitude,
            longitude: address.longitude,
            streetNumber: address.streetNumber || '',
            buildingNumber: address.buildingNumber || '',
            floorNumber: address.floorNumber || '',
            contactName: address.contactName || '',
            contactPhone: address.contactPhone || ''
          });
          
          setAddressFromMap(address.street);
        } else {
          toast.error('Failed to load address details');
          navigate('/address');
        }
      } catch (error) {
        console.error('Error fetching address:', error);
        toast.error('Failed to load address details');
        navigate('/address');
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchAddress();
  }, [addressId, navigate]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || initialLoading) return;

    // Initialize the map
    const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5); // Default to India

    // Add OSM tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Initialize feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Initialize draw control
    const drawControl = new (L.Control as any).Draw({
      draw: {
        polyline: {},
        polygon: {},
        circle: {},
        rectangle: {},
        marker: {}
      },
      edit: {
        featureGroup: drawnItems,
        remove: true
      }
    });
    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    // Event handler for draw:created
    map.on('draw:created', (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);

      // If a marker is created, update form data with coordinates
      if (e.layerType === 'marker') {
        const latLng = layer.getLatLng();
        updateLocationData(latLng);
      }
    });

    // Event handler for clicks on the map to place markers
    map.on('click', (e: L.LeafletMouseEvent) => {
      handleMapClick(e.latlng);
    });

    mapRef.current = map;

    // If we have coordinates, set the marker and view
    if (formData.latitude && formData.longitude) {
      const latLng = new L.LatLng(formData.latitude, formData.longitude);
      map.setView(latLng, 15);
      
      // Create a marker
      const marker = L.marker(latLng).addTo(map);
      markerRef.current = marker;
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialLoading, formData.latitude, formData.longitude]);

  // Handle map click to place marker
  const handleMapClick = (latLng: L.LatLng) => {
    if (markerRef.current) {
      // Remove existing marker
      markerRef.current.remove();
      markerRef.current = null;
    }

    // Create and add a new marker
    const marker = L.marker(latLng).addTo(mapRef.current!);
    markerRef.current = marker;

    // Update form data with the new coordinates
    updateLocationData(latLng);
  };

  // Update location data and fetch address from coordinates
  const updateLocationData = async (latLng: L.LatLng) => {
    setFormData(prev => ({
      ...prev,
      latitude: latLng.lat,
      longitude: latLng.lng
    }));

    try {
      // Fetch address from coordinates using Nominatim API (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latLng.lat}&lon=${latLng.lng}&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || '';
        setAddressFromMap(address);
        
        // Extract address components from the response
        const { address: addressDetails } = data;
        
        // Update form data with address details
        setFormData(prev => ({
          ...prev,
          street: address,
          // house_number can be used as building number
          buildingNumber: addressDetails?.house_number || '',
          // road can be used with street number
          streetNumber: addressDetails?.road ? `${addressDetails.road}` : ''
        }));
        
        // Clear any previous errors
        if (errors.street) {
          setErrors(prev => ({ ...prev, street: undefined }));
        }
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      toast.error('Could not fetch address from location');
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const latLng = new L.LatLng(latitude, longitude);
          
          // Center map on current location
          mapRef.current?.setView(latLng, 15);
          
          // Place a marker at current location
          handleMapClick(latLng);
          
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

  // Clear all drawn items and markers
  const clearMapItems = () => {
    if (drawnItemsRef.current) {
      drawnItemsRef.current.clearLayers();
    }
    
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when field is being edited
    if (errors[name as keyof AddressFormData]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleTypeSelect = (type: 'home' | 'work' | 'other') => {
    setFormData({ ...formData, type });
  };

  const validate = (): boolean => {
    const newErrors: Partial<AddressFormData> = {};
    
    if (!formData.street.trim()) {
      newErrors.street = 'Address is required';
    }

    if (!formData.contactName?.trim()) {
      newErrors.contactName = 'Contact person name is required';
    }

    if (!formData.contactPhone?.trim()) {
      newErrors.contactPhone = 'Contact phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Please enter a valid 10-digit Indian phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate() || !addressId) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await userService.updateAddress(addressId, {
        ...formData,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        streetNumber: formData.streetNumber || undefined,
        buildingNumber: formData.buildingNumber || undefined, 
        floorNumber: formData.floorNumber || undefined,
        contactName: formData.contactName || undefined,
        contactPhone: formData.contactPhone || undefined
      });
      
      console.log('Address updated:', response);
      
      toast.success('Address updated successfully!');
      navigate('/address');
    } catch (error) {
      toast.error('Failed to update address. Please try again.');
      console.error('Error updating address:', error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <ProfileLayout>
        <div className="w-full md:w-2/3">
          <div className="bg-white rounded-xl shadow-md p-6 flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout>
      <div className="w-full md:w-2/3">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/address')}
              className="p-2 mr-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Go back"
              title="Go back to address book"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold">Edit Address</h1>
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Address Type Selection */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-3">
                Select Address Type
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={`flex items-center px-4 py-3 rounded-lg border ${
                    formData.type === 'home'
                      ? 'border-red-500 bg-red-50 text-red-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTypeSelect('home')}
                >
                  <Home size={18} className="mr-2" />
                  <span>Home</span>
                </button>
                
                <button
                  type="button"
                  className={`flex items-center px-4 py-3 rounded-lg border ${
                    formData.type === 'work'
                      ? 'border-red-500 bg-red-50 text-red-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTypeSelect('work')}
                >
                  <Briefcase size={18} className="mr-2" />
                  <span>Work</span>
                </button>
                
                <button
                  type="button"
                  className={`flex items-center px-4 py-3 rounded-lg border ${
                    formData.type === 'other'
                      ? 'border-red-500 bg-red-50 text-red-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTypeSelect('other')}
                >
                  <MapPin size={18} className="mr-2" />
                  <span>Other</span>
                </button>
              </div>
            </div>
            
            {/* Contact Person Info */}
            <div className="mb-6">
              <h2 className="text-base font-semibold mb-4 text-gray-700">Contact Person Info</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="contactName" className="block text-gray-700 text-sm font-medium mb-2">
                    Contact Person Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                    </div>
                    <input
                      type="text"
                      id="contactName"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        errors.contactName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter contact person name"
                      required
                    />
                  </div>
                  {errors.contactName && (
                    <p className="mt-1 text-sm text-red-500">{errors.contactName}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="contactPhone" className="block text-gray-700 text-sm font-medium mb-2">
                    Contact Phone Number
                  </label>
                  <div className="flex">
                    <div className="w-20 mr-2">
                      <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50">
                        <img src="https://purecatamphetamine.github.io/country-flag-icons/3x2/IN.svg" className="w-5 h-3 mr-1" alt="India flag" />
                        <span className="text-gray-700">+91</span>
                      </div>
                    </div>
                    <input
                      type="tel"
                      id="contactPhone"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        errors.contactPhone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter phone number"
                      maxLength={10}
                      required
                    />
                  </div>
                  {errors.contactPhone && (
                    <p className="mt-1 text-sm text-red-500">{errors.contactPhone}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Delivery Address Section */}
            <div className="mb-6">
              <h2 className="text-base font-semibold mb-4 text-gray-700">Delivery Address</h2>
              
              {/* Street Address */}
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    type="text"
                    required
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.street ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your complete address"
                  />
                </div>
                {errors.street && (
                  <p className="mt-1 text-sm text-red-500">{errors.street}</p>
                )}
              </div>
              
              {/* Street Number */}
              <div className="mb-4">
                <label htmlFor="streetNumber" className="block text-gray-700 text-sm font-medium mb-2">
                  Street Number
                </label>
                <input
                  type="text"
                  id="streetNumber"
                  name="streetNumber"
                  value={formData.streetNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 border-gray-300"
                  placeholder="Enter street number"
                />
              </div>
              
              {/* Building Details */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Building/Floor Number
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    id="buildingNumber"
                    name="buildingNumber"
                    value={formData.buildingNumber}
                    onChange={handleChange}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 border-gray-300"
                    placeholder="House no."
                  />
                  <input
                    type="text"
                    id="floorNumber"
                    name="floorNumber"
                    value={formData.floorNumber}
                    onChange={handleChange}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 border-gray-300"
                    placeholder="Floor no."
                  />
                </div>
              </div>
            </div>
            
            {/* Map container with controls */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-base font-semibold text-gray-700">Map Location</h2>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="flex items-center px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    title="Use your current location"
                  >
                    <Navigation size={16} className="mr-1" />
                    <span className="text-sm">Current Location</span>
                  </button>
                  <button
                    type="button"
                    onClick={clearMapItems}
                    className="flex items-center px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    title="Clear all markers and drawings"
                  >
                    <MapPinOff size={16} className="mr-1" />
                    <span className="text-sm">Clear</span>
                  </button>
                </div>
              </div>
              <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  ref={mapContainerRef} 
                  className="h-64 w-full"
                ></div>
                <div className="absolute bottom-2 left-2 right-2 bg-white p-2 rounded-lg shadow-md text-sm text-gray-700">
                  <p className="font-medium mb-1">Selected Address:</p>
                  <p className="truncate">
                    {addressFromMap || 'No address selected. Click on the map to place a marker.'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                <Pencil size={14} className="inline mr-1" />
                Click on the map to place a marker, or use drawing tools to mark specific areas.
              </p>
              {formData.latitude && formData.longitude && (
                <p className="text-xs text-gray-400 mt-1">
                  Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </p>
              )}
            </div>
            
            {/* Set as default checkbox */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleCheckboxChange}
                  className="h-5 w-5 text-red-500 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="ml-2 text-gray-700">Set as default address</span>
              </label>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </div>
                ) : 'Update Address'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default EditAddressForm; 