import React, { useState, useRef, useEffect } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';

const libraries: ("places")[] = ["places"];

const Calculator: React.FC = () => {
  const navigate = useNavigate();
  const [city, setCity] = useState('Bangalore');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  
  const originRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    if (isLoaded) {
      if (originRef.current) {
        originRef.current.addListener('place_changed', () => {
          const place = originRef.current?.getPlace();
          if (place?.formatted_address) setOrigin(place.formatted_address);
        });
      }

      if (destinationRef.current) {
        destinationRef.current.addListener('place_changed', () => {
          const place = destinationRef.current?.getPlace();
          if (place?.formatted_address) setDestination(place.formatted_address);
        });
      }
    }
  }, [isLoaded]);

  const handleCheckPrice = () => {
    // Basic price calculation - for demonstration purposes
    if (distance) {
      const distanceNum = parseFloat(distance);
      if (!isNaN(distanceNum)) {
        // Base price: ₹20 per km
        const price = distanceNum * 20;
        setCalculatedPrice(price);
      }
    } else {
      alert('Please enter a distance to calculate price');
    }
  };

  const handleProceedToBook = () => {
    navigate('/book');
  };

  return (
    <div>
      <section className="container mx-auto py-4">
        <div className="bg-white p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2 text-gray-700" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>City: {city}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-500 mb-2">Origin</p>
              <div className="relative">
                {isLoaded && (
                  <Autocomplete onLoad={(auto) => (originRef.current = auto)}>
                    <input
                      type="text"
                      placeholder="Enter Location"
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                    />
                  </Autocomplete>
                )}
              </div>
            </div>

            <div>
              <p className="text-gray-500 mb-2">Destination</p>
              <div className="relative">
                {isLoaded && (
                  <Autocomplete onLoad={(auto) => (destinationRef.current = auto)}>
                    <input
                      type="text"
                      placeholder="Enter Location"
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </Autocomplete>
                )}
              </div>
            </div>

            <div>
              <p className="text-gray-500 mb-2">Distance</p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Kilometer (KM)"
                  className="w-full pl-10 pr-4 py-2 border rounded-md"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
              </div>
            </div>
          </div>

          {calculatedPrice !== null && (
            <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-md">
              <p className="font-medium text-green-800">Estimated Price: ₹{calculatedPrice.toFixed(2)}</p>
              <p className="text-sm text-green-600 mt-1">This is a base estimate. Final price may vary based on vehicle type and delivery speed.</p>
              <button 
                onClick={handleProceedToBook}
                className="mt-3 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
              >
                Proceed to Book
              </button>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleCheckPrice}
              className="bg-indigo-900 text-white py-2 px-6 rounded-md hover:bg-indigo-800"
            >
              Check Price
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Calculator;
