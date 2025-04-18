import { useState } from "react";

const VehicleSelection: React.FC = () => {
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

    const vehicles = [
        {
            id: '2-wheeler',
            name: '2-Wheeler',
            image: '/2-wheeler.png', // In a real app, replace with actual image paths
            description: 'Ideal for small parcels and lightweight deliveries (up to 10 kg)',
        },
        {
            id: 'mini-truck',
            name: 'Mini Truck',
            image: '/mini-truck.png',
            description: 'Perfect for small business deliveries, handles up to 500 kg',
        },
        {
            id: 'normal-truck',
            name: 'Normal Truck',
            image: '/normal-truck.png',
            description: 'Best for bulk shipments, supporting loads over 1,500 kg',
        }
    ];

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold">
                    Pick <span className="text-gray-900">Your Vehicle</span>
                </h2>
                <div className="border-b-2 border-red-500 w-16 mt-2"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {vehicles.map((vehicle) => (
                    <div
                        key={vehicle.id}
                        className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition duration-200 ${selectedVehicle === vehicle.id ? 'ring-2 ring-red-500' : ''}`}
                        onClick={() => setSelectedVehicle(vehicle.id)}
                    >
                        <div className="h-48 bg-white flex items-center justify-center p-4">
                            <img
                                src={vehicle.image}
                                alt={vehicle.name}
                                className="h-full object-contain"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-lg mb-2">{vehicle.name}</h3>
                            <p className="text-gray-600 text-sm">{vehicle.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VehicleSelection