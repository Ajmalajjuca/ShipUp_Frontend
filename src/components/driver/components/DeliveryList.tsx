import React, { useState, useEffect } from 'react';
import { Package, Clock, ChevronRight, Calendar, Truck, Filter, Search, CreditCard, Star, ChevronLeft } from 'lucide-react';
import Motion from './ui/motion';
import { driverService } from '../../../services/driver.service';
import { userService } from '../../../services/user.service';
import { Selector, useSelector } from 'react-redux';
import { RootState } from '../../../Redux/store';

// Types
interface Address {
  street: string;
  latitude: number;
  longitude: number;
}

interface Delivery {
  id: string;
  pickupAddress: Address;
  dropoffAddress: Address;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  totalAmount: number;
  distance: number;
  estimatedTime: string;
  paymentMethod: string;
  vehicleName: string;
  customerName: string;
  customerPhone: string;
  rating: number | null;
}

// Status Badge Component
const StatusBadge: React.FC<{ status: Delivery['status'] }> = ({ status }) => {
  const statusConfig: Record<Delivery['status'], { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Pending' },
    'in-progress': { bg: 'bg-blue-50', text: 'text-blue-600', label: 'In Progress' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Completed' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-600', label: 'Cancelled' },
  };

  // Fallback for invalid or undefined status
  const config = statusConfig[status] || {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    label: 'Unknown',
  };

  const { bg, text, label } = config;

  // Log invalid status for debugging
  if (!statusConfig[status]) {
    console.warn(`Invalid status "${status}" detected in StatusBadge`);
  }

  return (
    <span className={`${bg} ${text} text-xs px-2 py-1 rounded-full font-medium`}>
      {label}
    </span>
  );
};

// Delivery Card Component
const DeliveryCard: React.FC<{ delivery: Delivery; onClick: () => void; delay?: number }> = ({
  delivery,
  onClick,
  delay = 0,
}) => {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const formatAddress = (address: string) => {
    return address.split(',').slice(0, -2).join(',');
  };

  // Render star rating
  const renderRating = () => {
    if (delivery.rating === null) return <span className="text-xs text-gray-500">No rating</span>;

    const fullStars = Math.floor(delivery.rating);
    const hasHalfStar = delivery.rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={12} className="text-yellow-400 fill-yellow-400" />
        ))}
        {hasHalfStar && <Star size={12} className="text-yellow-400 fill-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={12} className="text-gray-300" />
        ))}
        <span className="ml-1 text-xs font-medium text-gray-600">{delivery.rating.toFixed(1)}</span>
      </div>
    );
  };

  const { date, time } = formatDateTime(delivery.createdAt);

  return (
    <Motion variant="fade-in" delay={delay}>
      <div
        className="bg-white rounded-lg border border-gray-100 p-4 mb-3 hover:shadow-md transition-all duration-300 cursor-pointer"
        onClick={onClick}
      >
        {/* Header: Order ID and Customer Info */}
        <div className="flex justify-between items-center mb-3 pb-2 border-b">
          <div className="flex items-center">
            <div className="p-1.5 rounded-md bg-gray-50 mr-3">
              <Package size={16} className="text-gray-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">ORD-{delivery.id.slice(0, 8)}</h3>
              {renderRating()}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-gray-800">{delivery.customerName || 'Unknown'}</span>
            <span className="text-xs text-gray-500">{delivery.customerPhone || 'N/A'}</span>
          </div>
        </div>

        {/* Addresses */}
        <div className="mb-3 pl-2">
          <div className="flex mb-1">
            <div className="min-w-5 mt-1 mr-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
            <p className="text-xs text-gray-500">{formatAddress(delivery.pickupAddress.street)}</p>
          </div>
          <div className="flex items-start">
            <div className="min-w-5 mt-1 mr-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
            </div>
            <p className="text-xs text-gray-500">{formatAddress(delivery.dropoffAddress.street)}</p>
          </div>
        </div>

        {/* Details Row */}
        <div className="flex flex-wrap justify-between text-xs text-gray-600 mb-3">
          <div className="flex items-center mr-3 mb-1">
            <Clock size={14} className="mr-1 text-gray-400" />
            <span>{time}</span>
          </div>
          <div className="flex items-center mr-3 mb-1">
            <Calendar size={14} className="mr-1 text-gray-400" />
            <span>{date}</span>
          </div>
          <div className="flex items-center mr-3 mb-1">
            <Truck size={14} className="mr-1 text-gray-400" />
            <span>{delivery.distance.toFixed(1)} km</span>
          </div>
          <div className="flex items-center mr-3 mb-1">
            <CreditCard size={14} className="mr-1 text-gray-400" />
            <span className="capitalize">{delivery.paymentMethod}</span>
          </div>
          <div className="flex items-center mb-1">
            <Truck size={14} className="mr-1 text-gray-400" />
            <span>{delivery.vehicleName}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="flex items-center">
            <StatusBadge status={delivery.status} />
            <span className="text-sm font-semibold ml-2 text-gray-900">₹{delivery.totalAmount.toFixed(2)}</span>
          </div>
          <button className="flex items-center text-blue-600 text-xs font-medium">
            View Details <ChevronRight size={14} className="ml-1" />
          </button>
        </div>
      </div>
    </Motion>
  );
};

// Filter Bar Component
const FilterBar: React.FC<{
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}> = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <Motion variant="fade-in">
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeFilter === filter.id
                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100'
            } transition-all duration-200`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </Motion>
  );
};

// Search Bar Component
const SearchBar: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ value, onChange }) => (
  <Motion variant="fade-in">
    <div className="relative mb-4">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search size={16} className="text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Search deliveries..."
        value={value}
        onChange={onChange}
        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
      />
    </div>
  </Motion>
);

// Pagination Component
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, totalOrders, onPageChange }) => {
  const maxPagesToShow = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <Motion variant="fade-in">
      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-gray-500">
          Showing {Math.min((currentPage - 1) * 10 + 1, totalOrders)}-
          {Math.min(currentPage * 10, totalOrders)} of {totalOrders} orders
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-md ${
              currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded-md text-xs ${
                currentPage === page
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md ${
              currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </Motion>
  );
};

// Main DeliveryList Component
interface DeliveryListProps {
  partnerId: string;
}

const DeliveryList: React.FC<DeliveryListProps> = ({ partnerId }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const limit = 10; // Orders per page
  const driver = useSelector((state: RootState) => state.driver.driverDetails);
  console.log('driver>>>>', driver);
  


  

  const fetchDeliveriesById = async (page: number = 1) => {
    if (!partnerId) {
      setError('Invalid partner ID. Please log in again.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await driverService.getPartnerOrders(
        partnerId,
        page,
        limit,
        activeFilter === 'all' ? undefined : activeFilter,
        searchQuery || undefined
      );

      const validStatuses: Delivery['status'][] = ['pending', 'in-progress', 'completed', 'cancelled'];

      const mappedDeliveries: Delivery[] = await Promise.all(
        response.orders.map(async (order: any) => {
          let customerName = 'Unknown';
          let customerPhone = 'N/A';
          let rating: number | null = null;

          // Validate status
          const status = validStatuses.includes(order.status) ? order.status : 'cancelled';
          if (!validStatuses.includes(order.status)) {
            console.warn(`Invalid status "${order.status}" for order ${order.id}, defaulting to "cancelled"`);
          }

          // Fetch customer data
          try {
            const customer = await userService.getUserById(order.customerId);
            customerName = customer.user.fullName || 'Unknown';
            customerPhone = customer.user.phone || 'N/A';
          } catch (err) {
            console.error(`Error fetching customer ${order.customerId}:`, err);
          }

          // Fetch order rating
          try {
            const ratingResponse = await driverService.getOrderRating(order.id);
            rating = ratingResponse.ratings?.[0]?.rating || null;
          } catch (err) {
            console.error(`Error fetching rating for order ${order.id}:`, err);
          }

          return {
            id: order.id,
            pickupAddress: {
              street: order.pickupAddress.street,
              latitude: order.pickupAddress.latitude,
              longitude: order.pickupAddress.longitude,
            },
            dropoffAddress: {
              street: order.dropoffAddress.street,
              latitude: order.dropoffAddress.latitude,
              longitude: order.dropoffAddress.longitude,
            },
            status: status as Delivery['status'],
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            totalAmount: order.totalAmount,
            distance: order.distance,
            estimatedTime: order.estimatedTime,
            paymentMethod: order.paymentMethod,
            vehicleName: order.vehicleName,
            customerName,
            customerPhone,
            rating,
          };
        })
      );

      setDeliveries(mappedDeliveries);
      setTotalPages(response.totalPages || 1);
      setTotalOrders(response.total || 0);
      setCurrentPage(response.page || 1);
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError('Failed to load deliveries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch deliveries when partnerId, filter, or search changes
  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on filter or search change
    fetchDeliveriesById(1);
  }, [partnerId, activeFilter, searchQuery]);

  // Fetch deliveries when page changes
  useEffect(() => {
    fetchDeliveriesById(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDeliveryClick = (id: string) => {
    setSelectedDelivery(id);
    console.log(`Delivery ${id} clicked`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Motion variant="fade-in" className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <h2 className="text-xl font-bold text-gray-900">Deliveries</h2>
          <div className="text-xs text-gray-500">{totalOrders} orders</div>
        </div>
      </Motion>

      <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />

      <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {isLoading ? (
        <Motion variant="fade-in">
          <div className="text-center py-8 bg-white rounded-lg border border-gray-100">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Loading deliveries...</p>
          </div>
        </Motion>
      ) : error ? (
        <Motion variant="fade-in">
          <div className="text-center py-8 bg-white rounded-lg border border-gray-100">
            <Package size={32} className="mx-auto text-red-500 mb-3" />
            <h3 className="font-medium text-base mb-1">Error</h3>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </Motion>
      ) : deliveries.length > 0 ? (
        <div>
          {deliveries.map((delivery, index) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              onClick={() => handleDeliveryClick(delivery.id)}
              delay={index * 50}
            />
          ))}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalOrders={totalOrders}
            onPageChange={handlePageChange}
          />
        </div>
      ) : (
        <Motion variant="fade-in">
          <div className="text-center py-8 bg-white rounded-lg border border-gray-100">
            <Package size={32} className="mx-auto text-gray-400 mb-3" />
            <h3 className="font-medium text-base mb-1">No deliveries found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : "You don't have any deliveries at this moment"}
            </p>
          </div>
        </Motion>
      )}
    </div>
  );
};

export default DeliveryList;