import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Truck, Package, Clock, Calendar, Filter, ArrowUpDown, RotateCcw } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RootState } from '../../../Redux/store';
import NavBar from '../NavBar';

// --- Interfaces ---
interface Order {
  id: string;
  status: 'driver_assigned' | 'driver_arrived' | 'picked_up' | 'completed';
  pickupAddress: { lantitude: number; longitude: number; street: string };
  dropoffAddress: { lantitude: number; longitude: number; street: string };
  createdAt: string;
  vehicleName: string;
  totalAmount: number;
  paymentMethod?: string;
  estimatedTime?: string;
  deliveryType?: string;
}

// --- Constants ---
const ITEMS_PER_PAGE = 5;
const STATUS_FILTERS = ['All', 'Completed', 'Active'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];
const SORT_OPTIONS = ['Date (Newest)', 'Date (Oldest)', 'Status', 'Price (High to Low)', 'Price (Low to High)'] as const;
type SortOption = typeof SORT_OPTIONS[number];

// --- React Component ---
const OrdersList: React.FC = () => {
  // --- State Variables ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortOption, setSortOption] = useState<SortOption>('Date (Newest)');
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  // --- Fetch Orders ---
  useEffect(() => {
    if (!user?.userId) {
      setError('Please log in to view your orders.');
      setIsLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get<{ orders: Order[] }>(
          `http://localhost:3004/api/orders/user/${user.userId}`
        );
        console.log('Fetched orders:', response.data);
        
        // Validate response.data.orders is an array
        const fetchedOrders = Array.isArray(response.data) ? response.data : [];
        setOrders(fetchedOrders);
        setFilteredOrders(fetchedOrders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders. Please try again later.');
        setOrders([]);
        setFilteredOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  // --- Filtering and Sorting ---
  const applyFiltersAndSort = useCallback(() => {
    // Guard against non-array orders
    if (!Array.isArray(orders)) {
      setFilteredOrders([]);
      return;
    }

    let result = [...orders];

    // Apply status filter
    if (statusFilter !== 'All') {
      result = result.filter((order) =>
        statusFilter === 'Completed'
          ? order.status === 'completed'
          : order.status !== 'completed'
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortOption === 'Date (Newest)') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOption === 'Date (Oldest)') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortOption === 'Price (High to Low)') {
        return b.totalAmount - a.totalAmount;
      } else if (sortOption === 'Price (Low to High)') {
        return a.totalAmount - b.totalAmount;
      } else {
        // Sort by status (active statuses first)
        const statusOrder = ['driver_assigned', 'driver_arrived', 'picked_up', 'completed'];
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      }
    });

    setFilteredOrders(result);
    setCurrentPage(1); // Reset to first page on filter/sort change
  }, [orders, statusFilter, sortOption]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  // --- Pagination ---
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Handlers ---
  const handleOpenOrderDetails = (orderId: string) => {
    // Navigate to the order details page instead of expanding in-place
    navigate(`/order-details/${orderId}`);
  };

  const handleBookAgain = (order: Order, e: React.MouseEvent) => {
    // Prevent the click from bubbling up to the parent element
    e.stopPropagation();
    
    // Clone the order for a new booking
    navigate('/create-order', {
      state: {
        pickupAddress: order.pickupAddress,
        dropoffAddress: order.dropoffAddress,
        vehicleType: order.vehicleName,
        packageSize: order.deliveryType
      }
    });
  };

  const handleViewOrderTracking = (orderId: string, e: React.MouseEvent) => {
    // Prevent the click from bubbling up to the parent element
    e.stopPropagation();
    navigate(`/active-orders?orderId=${orderId}`);
  };

  // --- Render Helpers ---
  const getStatusBadge = (status: Order['status']) => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium inline-flex items-center';
    switch (status) {
      case 'completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>
          <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
          Completed
        </span>;
      case 'picked_up':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
          <span className="w-2 h-2 bg-blue-600 rounded-full mr-1"></span>
          En Route
        </span>;
      case 'driver_arrived':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
          <span className="w-2 h-2 bg-yellow-600 rounded-full mr-1"></span>
          Driver Arrived
        </span>;
      case 'driver_assigned':
        return <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
          <span className="w-2 h-2 bg-purple-600 rounded-full mr-1"></span>
          Driver Assigned
        </span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
          <span className="w-2 h-2 bg-gray-600 rounded-full mr-1"></span>
          {status}
        </span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // --- Render ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin inline-block h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-700">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Orders</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <NavBar />
      <div className="bg-gray-50 min-h-screen pt-6 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
            <p className="text-gray-600 mt-1">View and manage your delivery requests</p>
          </div>

          {/* Filters and Sort */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-48">
                  <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                  >
                    {STATUS_FILTERS.map((filter) => (
                      <option key={filter} value={filter}>
                        {filter} Orders
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative w-full sm:w-56">
                  <ArrowUpDown size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        Sort by: {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Showing {paginatedOrders.length} of {filteredOrders.length} orders
              </p>
            </div>
          </div>

          {/* Orders List - Card Layout */}
          {paginatedOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500 mb-6">You don't have any orders matching the current filters.</p>
              <button
                onClick={() => navigate('/create-order')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Book New Delivery
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {paginatedOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer"
                  onClick={() => handleOpenOrderDetails(order.id)}
                >
                  {/* Order Summary */}
                  <div className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 lg:mb-0">
                        {/* Order ID and Status */}
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Order ID</span>
                          <span className="font-medium text-sm text-gray-800">{order.id.slice(0, 8)}</span>
                        </div>
                        
                        <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
                        
                        {/* Date */}
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Date</span>
                          <div className="flex items-center">
                            <Calendar size={14} className="text-gray-400 mr-1" />
                            <span className="font-medium text-sm text-gray-800">{formatDate(order.createdAt)}</span>
                          </div>
                        </div>

                        <div className="hidden sm:block w-px h-8 bg-gray-200"></div>
                        
                        {/* Vehicle Type */}
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Vehicle</span>
                          <div className="flex items-center">
                            <Truck size={14} className="text-gray-400 mr-1" />
                            <span className="font-medium text-sm text-gray-800 capitalize">{order.vehicleName}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Status Badge */}
                        {getStatusBadge(order.status)}
                        
                        {/* Amount */}
                        <span className="text-lg font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                    
                    {/* Addresses Summary */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <MapPin size={16} className="text-green-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-xs text-gray-500 mb-1">Pickup</p>
                          <p className="text-sm text-gray-800">{order.pickupAddress?.street}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <MapPin size={16} className="text-red-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-xs text-gray-500 mb-1">Dropoff</p>
                          <p className="text-sm text-gray-800">{order.dropoffAddress?.street}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Action Buttons */}
                    <div className="mt-4 flex flex-wrap gap-3 border-t pt-4 border-gray-100">
                      <button
                        onClick={(e) => handleBookAgain(order, e)}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <RotateCcw size={16} className="mr-2" />
                        Book Again
                      </button>
                      
                      {order.status !== 'completed' && (
                        <button
                          onClick={(e) => handleViewOrderTracking(order.id, e)}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <Truck size={16} className="mr-2" />
                          Track Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === page
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrdersList;