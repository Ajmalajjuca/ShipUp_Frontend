import { useState } from "react";

const DeliveryMode: React.FC = () => {
    const [selectedMode, setSelectedMode] = useState<string | null>(null);

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold">
                    How <span className="text-gray-900">Do You Want Your Package To Travel?</span>
                </h2>
                <div className="border-b-2 border-red-500 w-16 mt-2"></div>
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center space-y-6 md:space-y-0 md:space-x-12">
                {/* Character on the left */}
                <div className="hidden md:block">
                    <div className="relative">
                        <div className="w-32 h-64">
                            {/* Character image would go here */}
                            <div className="absolute bottom-0 left-0 right-0">
                                <div className="bg-blue-500 h-8 w-8 rounded-full mx-auto mb-2"></div>
                                <div className="bg-white h-24 w-16 rounded-t-full mx-auto"></div>
                                <div className="bg-blue-500 h-20 w-20 rounded-full mx-auto -mt-1"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Speed option */}
                <div
                    className={`w-64 bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition duration-200 ${selectedMode === 'speed' ? 'ring-2 ring-red-500' : ''}`}
                    onClick={() => setSelectedMode('speed')}
                >
                    <div className="h-32 flex items-center justify-center p-4 bg-white">
                        <div className="relative">
                            {/* Airplane image - replace with your actual image path */}
                            <img 
                                src="/airplane-delivery.png" 
                                alt="Speed delivery with airplane" 
                                width="100" 
                                height="50" 
                                className="object-contain"
                            />
                        </div>
                    </div>
                    <div className="p-4 text-center">
                        <h3 className="font-medium text-lg mb-1">Speed</h3>
                        <p className="text-gray-600 text-sm">Get your package delivered in just 2-5 minutes!</p>
                    </div>
                </div>

                {/* Savings option */}
                <div
                    className={`w-64 bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition duration-200 ${selectedMode === 'savings' ? 'ring-2 ring-red-500' : ''}`}
                    onClick={() => setSelectedMode('savings')}
                >
                    <div className="h-32 flex items-center justify-center p-4 bg-white">
                        <div className="relative">
                            {/* Road with truck image - replace with your actual image path */}
                            <img 
                                src="/truck-delivery.png" 
                                alt="Budget-friendly delivery by truck" 
                                width="100" 
                                height="50" 
                                className="object-contain"
                            />
                        </div>
                    </div>
                    <div className="p-4 text-center">
                        <h3 className="font-medium text-lg mb-1">Savings</h3>
                        <p className="text-gray-600 text-sm">A budget-friendly option, arriving in 15-20 minutes</p>
                    </div>
                </div>

                {/* Character on the right */}
                <div className="hidden md:block">
                    <div className="relative">
                        <div className="w-32 h-64">
                            {/* Character image would go here */}
                            <div className="absolute bottom-0 left-0 right-0">
                                <div className="bg-blue-500 h-8 w-8 rounded-full mx-auto mb-2"></div>
                                <div className="bg-white h-24 w-16 rounded-t-full mx-auto"></div>
                                <div className="bg-blue-500 h-20 w-20 rounded-full mx-auto -mt-1"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryMode;