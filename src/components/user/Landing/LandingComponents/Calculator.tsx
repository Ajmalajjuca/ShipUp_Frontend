import React, { useState, useRef, useEffect } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAr9iKL412E6QE40v2xpCgroD99-JBzFNU';

const libraries: ("places")[] = ["places"];

const Calculator: React.FC = () => {
  const [city, setCity] = useState('Bangalore');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState('');
  
  const originRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
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

  return (
    <div>
      <section className="container mx-auto py-8 px-4 md:px-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
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
                  placeholder="Kilometer (KM) Optional"
                  className="w-full pl-10 pr-4 py-2 border rounded-md"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button className="bg-indigo-900 text-white py-2 px-6 rounded-md hover:bg-indigo-800">
              Check Price
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Calculator;
