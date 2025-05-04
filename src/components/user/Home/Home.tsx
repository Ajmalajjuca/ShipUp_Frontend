import React, { useState, useEffect } from 'react';
import NavBar from '../NavBar';
import ActiveOrders from './HomeComponents/ActiveOrders';
import BookService from './HomeComponents/BookService';
import VehicleSelection from './HomeComponents/VehicleSelection';
import DeliveryMode from './HomeComponents/DeliveryMode';
import Global_map from '../Landing/Global_map';
import Footer from '../Footer';

const ShipUpApp: React.FC = () => {
    const [hasActiveOrder, setHasActiveOrder] = useState<boolean>(false);

    // Check for active orders on component mount
    useEffect(() => {
        const checkActiveOrder = () => {
            const activeOrder = localStorage.getItem('activeOrder');
            setHasActiveOrder(!!activeOrder);
        };

        // Check on load
        checkActiveOrder();

        // Setup listener for storage changes
        const handleStorageChange = () => {
            checkActiveOrder();
        };

        window.addEventListener('storage', handleStorageChange);
        
        // Also check periodically (in case local components change localStorage)
        const interval = setInterval(checkActiveOrder, 10000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <NavBar />

            {/* Active Orders component - only show if there's an active order */}
            <ActiveOrders />

            {/* Only show booking components if there's no active order */}
            {!hasActiveOrder && (
                <>
                    {/* Book Service component*/}
                    <BookService />

                    {/* Vehicle selection component*/}
                    <VehicleSelection />

                    {/* Delivery mode selection component*/}
                    <DeliveryMode />
                </>
            )}

            {/* Global Map Section - always show */}
            <Global_map />

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default ShipUpApp;