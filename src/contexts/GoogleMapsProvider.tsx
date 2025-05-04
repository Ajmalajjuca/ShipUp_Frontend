import React, { createContext, useContext } from 'react';
   import { useJsApiLoader } from '@react-google-maps/api';

   const GoogleMapsContext = createContext<{ isLoaded: boolean; google: any }>({
     isLoaded: false,
     google: null,
   });

   const libraries: ('places' | 'geometry')[] = ['places', 'geometry'];

   export const GoogleMapsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
     const { isLoaded } = useJsApiLoader({
       id: 'google-map-script',
       googleMapsApiKey: 'AIzaSyAr9iKL412E6QE40v2xpCgroD99-JBzFNU',
       libraries,
       language: 'en',
       region: 'US',
     });

     return (
       <GoogleMapsContext.Provider value={{ isLoaded, google: isLoaded ? window.google : null }}>
         {children}
       </GoogleMapsContext.Provider>
     );
   };

   export const useGoogleMaps = () => useContext(GoogleMapsContext);