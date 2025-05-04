import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertCircle, CheckCircle, X, Search, RefreshCw, Truck, Eye, Filter, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { vehicleService } from '../../../../../services/vehicle.service';
import { VehicleType } from '../../../../../types/vehicle.types';
import VehicleForm from './VehicleForm';

interface VehicleListProps {
  onViewVehicle?: (id: string) => void;
}

const VehicleList: React.FC<VehicleListProps> = ({ onViewVehicle }) => {
  const [vehicles, setVehicles] = useState<VehicleType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<{[key: string]: boolean}>({});
  
  useEffect(() => {
    fetchVehicles();
  }, []);
  
  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const response = await vehicleService.getVehicles();
      if (response.success) {
        setVehicles(response.vehicles);
      } else {
        toast.error(response.message || 'Failed to fetch vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('An error occurred while fetching vehicles');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEdit = (vehicle: VehicleType) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }
    
    try {
      const response = await vehicleService.deleteVehicle(id);
      if (response.success) {
        toast.success('Vehicle deleted successfully');
        fetchVehicles();
      } else {
        toast.error(response.message || 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('An error occurred while deleting the vehicle');
    }
  };
  
  const handleFormClose = () => {
    setShowForm(false);
    setEditingVehicle(null);
  };
  
  const handleFormSubmit = async () => {
    fetchVehicles();
    handleFormClose();
  };

  const handleToggleStatus = async (vehicle: VehicleType) => {
    if (!vehicle.id) return;
    
    setStatusUpdating(prev => ({ ...prev, [vehicle.id]: true }));
    
    try {
      const response = await vehicleService.toggleVehicleStatus(vehicle.id);
      
      if (response.success) {
        toast.success(`Vehicle status ${vehicle.isActive ? 'deactivated' : 'activated'} successfully`);
        // Update the vehicle in the list
        setVehicles(prevVehicles => 
          prevVehicles.map(v => 
            v.id === vehicle.id ? { ...v, isActive: !v.isActive } : v
          )
        );
      } else {
        toast.error(response.message || 'Failed to update vehicle status');
      }
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      toast.error('An error occurred while updating the vehicle status');
    } finally {
      setStatusUpdating(prev => ({ ...prev, [vehicle.id]: false }));
    }
  };

  const handleViewVehicle = (id: string) => {
    if (onViewVehicle) {
      onViewVehicle(id);
    } else {
      toast('View functionality is not available', {
        icon: '👁️',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    }
  };

  const handleFilterChange = (type: string | null) => {
    setFilterType(type);
    setShowFilterMenu(false);
  };

  const getVehicleTypeDisplay = (type: string | undefined) => {
    if (!type) return 'Unknown';
    
    switch (type.toUpperCase()) {
      case 'BIKE': return 'Bike';
      case 'CAR': return 'Car';
      case 'VAN': return 'Van';
      case 'TRUCK': return 'Truck';
      default: return type;
    }
  };
  
  // Apply filters and search
  const filteredVehicles = vehicles.filter(v => {
    // Apply search filter
    const matchesSearch = !searchTerm || 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    

    
    return matchesSearch;
  });

  
  return (
    <div>
      {showForm ? (
        <VehicleForm 
          vehicle={editingVehicle} 
          onClose={handleFormClose} 
          onSubmit={handleFormSubmit}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Vehicle Management</h2>
              <p className="text-gray-600">Manage the vehicles available for delivery</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 sm:mt-0 flex items-center px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 transition-colors shadow-sm"
            >
              <Plus size={18} className="mr-1" />
              Add New Vehicle
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 mb-6">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div className="text-lg font-medium text-gray-700">Vehicle List</div>
              <div className="flex items-center w-full sm:w-auto space-x-2">
                <div className="relative flex-grow sm:flex-grow-0">
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                  />
                  <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                </div>

                

                <button
                  onClick={fetchVehicles}
                  className="p-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none"
                  title="Refresh"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Truck size={24} className="text-gray-400" />
                </div>
                <h3 className="text-gray-800 font-medium mb-1">No vehicles found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? 'No vehicles match your search criteria.' : 
                   filterType ? `No ${getVehicleTypeDisplay(filterType)} vehicles available.` : 
                   'You have not added any vehicles yet.'}
                </p>
                {(searchTerm || filterType) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType(null);
                    }}
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Max Weight
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price/km
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVehicles.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 mr-3 bg-gray-100 rounded-full flex items-center justify-center">
                              {vehicle.imageUrl ? (
                                <img
                                  src={vehicle.imageUrl}
                                  alt={vehicle.name}
                                  className="h-8 w-8 object-contain"
                                />
                              ) : (
                                <Truck size={20} className="text-gray-500" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {vehicle.name}
                              </div>
                              <div className="text-xs text-gray-500">
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {vehicle.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {vehicle.maxWeight}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{vehicle.pricePerKm}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(vehicle)}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 ${vehicle.isActive ? 'bg-green-500' : 'bg-gray-300'} ${statusUpdating[vehicle.id || ''] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            disabled={statusUpdating[vehicle.id || '']}
                            title={vehicle.isActive ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
                          >
                            <span 
                              className={`inline-block w-4 h-4 transform transition-transform duration-200 ease-in-out bg-white rounded-full ${vehicle.isActive ? 'translate-x-6' : 'translate-x-1'}`} 
                            />
                            {statusUpdating[vehicle.id || ''] && (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </span>
                            )}
                          </button>
                          <span className="ml-2 text-xs text-gray-500">
                            {vehicle.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewVehicle(vehicle.id)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="View vehicle details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(vehicle)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            title="Edit vehicle"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete vehicle"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VehicleList; 