import React from 'react';

const ActiveOrders: React.FC = () => {
    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold">
                    Active <span className="text-gray-900">Orders</span>
                </h2>
                <div className="border-b-2 border-red-500 w-16 mt-2"></div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-4 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <div className="font-medium">Shipment Tracking</div>
                    <div className="flex items-center">
                        <span className="mr-2">In Bengaluru</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-gray-600">
                            <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
                        </svg>
                    </div>
                </div>

                <div className="rounded-lg overflow-hidden h-64 bg-gray-100 relative">
                    {/* Map would go here, using a placeholder */}
                    <div className="absolute inset-0 bg-gray-200">
                        {/* This would be replaced by an actual map */}
                    </div>

                    {/* Location pins */}
                    <div className="absolute top-1/3 left-1/4 bg-white rounded-lg shadow-md p-2 max-w-xs">
                        <div className="flex items-start">
                            <div className="h-6 w-6 bg-red-500 rounded-full flex items-center justify-center mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="text-white">
                                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium">4th Cross Rd, 8th Main Rd, HAL 2nd Stage, Indiranagar</p>
                                <a href="#" className="text-sm text-blue-500">View Details</a>
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-1/2 right-1/4 bg-white rounded-lg shadow-md p-2 max-w-xs">
                        <div className="flex items-start">
                            <div className="h-6 w-6 bg-red-500 rounded-full flex items-center justify-center mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="text-white">
                                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium">27th Main Road, ITI Layout, Sector 2, HSR Layout, HasiruHunimeVillage</p>
                                <a href="#" className="text-sm text-blue-500">View Details</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActiveOrders
