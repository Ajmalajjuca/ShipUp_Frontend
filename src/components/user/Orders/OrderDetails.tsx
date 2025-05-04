import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Truck, ArrowLeft, Calendar, Phone, User, CreditCard, RotateCcw } from 'lucide-react';
import axios from 'axios';
import NavBar from '../NavBar';

// --- Interfaces ---
interface Address {
  street: string;
  latitude: number;
  longitude: number;
}

interface DriverDetails {
  name: string;
  phone: string;
  registrationNumber?: string;
  rating?: number;
  profilePicturePath?: string;
}

interface Order {
  id: string;
  status: 'driver_assigned' | 'driver_arrived' | 'picked_up' | 'completed';
  pickupAddress: Address;
  dropoffAddress: Address;
  createdAt: string;
  updatedAt: string;
  vehicleName: string;
  vehicleId: string;
  totalAmount: number;
  basePrice: number;
  deliveryPrice: number;
  commission: number;
  gst: number;
  paymentMethod: string;
  estimatedTime: string;
  deliveryType: string;
  distance: number;
  customerId: string;
  driverId: string;
}

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [driverDetails, setDriverDetails] = useState<DriverDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError('Order ID is missing');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch order details
        const orderResponse = await axios.get<Order>(`http://localhost:3004/api/orders/${orderId}`);
        console.log('Order Details:', orderResponse.data);
        setOrder(orderResponse.data);

        // Fetch driver details using driverId
        if (orderResponse.data.driverId) {
          try {
            const driverResponse = await axios.get<{
              partner: {
                fullName: string;
                mobileNumber: string;
                registrationNumber?: string;
                averageRating?: number;
                profilePicturePath?: string;
              };
            }>(`http://localhost:3003/api/drivers/${orderResponse.data.driverId}`);
            console.log('Driver Details:', driverResponse.data);
            const { partner } = driverResponse.data;
            setDriverDetails({
              name: partner.fullName,
              phone: partner.mobileNumber,
              registrationNumber: partner.registrationNumber,
              profilePicturePath: partner.profilePicturePath,
            });
          } catch (driverErr) {
            console.error('Failed to fetch driver details:', driverErr);
            setDriverDetails(null); // Handle missing driver data gracefully
          }
        }if(orderResponse.data.driverId) {
          try {
            const ratingResponse = await axios.get(`http://localhost:3003/api/drivers/${orderResponse.data.driverId}/ratings`);
            console.log('Driver Ratings:', ratingResponse.data);
            setDriverDetails((prev) => {
              if (!prev) return null; // Ensure prev is not null
              return {
                ...prev,
                rating: ratingResponse.data?.data?.averageRating,
              };
            });
          }catch(err){
            console.error('Failed to fetch driver ratings:', err);
            
          }
        }
      } catch (err) {
        console.error('Failed to fetch order details:', err);
        setError('Failed to load order details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  // --- Handlers ---
  const handleBookAgain = () => {
    if (!order) return;

    navigate('/create-order', {
      state: {
        pickupAddress: order.pickupAddress,
        dropoffAddress: order.dropoffAddress,
        vehicleType: order.vehicleName,
        packageSize: order.deliveryType,
      },
    });
  };

  const handleViewOrderTracking = () => {
    if (!order) return;
    navigate(`/active-orders?orderId=${order.id}`);
  };

  const handleBackToOrders = () => {
    navigate('/orders');
  };

  // --- Render Helpers ---
  const getStatusBadge = (status: Order['status']) => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium inline-flex items-center';
    switch (status) {
      case 'completed':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
            Completed
          </span>
        );
      case 'picked_up':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <span className="w-2 h-2 bg-blue-600 rounded-full mr-1"></span>
            En Route
          </span>
        );
      case 'driver_arrived':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <span className="w-2 h-2 bg-yellow-600 rounded-full mr-1"></span>
            Driver Arrived
          </span>
        );
      case 'driver_assigned':
        return (
          <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
            <span className="w-2 h-2 bg-purple-600 rounded-full mr-1"></span>
            Driver Assigned
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <span className="w-2 h-2 bg-gray-600 rounded-full mr-1"></span>
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // --- Loading and Error States ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center animate-pulse">
          <div className="animate-spin inline-block h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md transition-all duration-300">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Order</h3>
          <p className="text-gray-600 mb-4">{error || 'Order not found'}</p>
          <button
            onClick={handleBackToOrders}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <NavBar />
      <div className="bg-gray-100 min-h-screen pt-6 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBackToOrders}
            className="mb-6 inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </button>

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h1>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar size={14} className="mr-1" />
                  <span>
                    {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                  </span>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <span className="text-lg font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Order Info Sections */}
          <div className="grid grid-cols-1 gap-6">
            {/* Route Information */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <h2 className="text-lg font-semibold">Delivery Route</h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Pickup */}
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <MapPin size={18} className="text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">Pickup Location</h3>
                      <address className="mt-1 text-sm text-gray-500 not-italic">{order.pickupAddress.street}</address>
                    </div>
                  </div>
                  {/* Divider with dotted line */}
                  <div className="flex">
                    <div className="flex-shrink-0 flex justify-center">
                      <div className="w-10 flex justify-center">
                        <div className="w-px h-12 bg-gray-300 border-l border-dashed"></div>
                      </div>
                    </div>
                  </div>
                  {/* Dropoff */}
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <MapPin size={18} className="text-red-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">Dropoff Location</h3>
                      <address className="mt-1 text-sm text-gray-500 not-italic">{order.dropoffAddress.street}</address>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <h2 className="text-lg font-semibold">Order Details</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <ul className="space-y-3">
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500">Order Status</span>
                        <span className="text-sm text-gray-900 font-medium capitalize">{order.status.replace('_', ' ')}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500">Order Date</span>
                        <span className="text-sm text-gray-900">{formatDate(order.createdAt)}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500">Order Time</span>
                        <span className="text-sm text-gray-900">{formatTime(order.createdAt)}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500">Distance</span>
                        <span className="text-sm text-gray-900">{order.distance.toFixed(2)} km</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <ul className="space-y-3">
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500">Delivery Type</span>
                        <span className="text-sm text-gray-900 capitalize">{order.deliveryType}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500">Estimated Time</span>
                        <span className="text-sm text-gray-900">{order.estimatedTime}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500">Payment Method</span>
                        <span className="text-sm text-gray-900 capitalize">{order.paymentMethod}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-sm text-gray-500">Vehicle Type</span>
                        <span className="text-sm text-gray-900 capitalize">{order.vehicleName}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <h2 className="text-lg font-semibold">Pricing Details</h2>
              </div>
              <div className="p-6">
                <div className="border border-gray-200 rounded-lg">
                  <ul className="divide-y divide-gray-200">
                    <li className="flex justify-between px-4 py-3">
                      <span className="text-sm text-gray-600">Base Price</span>
                      <span className="text-sm text-gray-900">{formatCurrency(order.basePrice)}</span>
                    </li>
                    <li className="flex justify-between px-4 py-3">
                      <span className="text-sm text-gray-600">Commission</span>
                      <span className="text-sm text-gray-900">{formatCurrency(order.commission)}</span>
                    </li>
                    <li className="flex justify-between px-4 py-3">
                      <span className="text-sm text-gray-600">GST</span>
                      <span className="text-sm text-gray-900">{formatCurrency(order.gst)}</span>
                    </li>
                    <li className="flex justify-between px-4 py-3 bg-gray-50">
                      <span className="text-sm font-semibold text-gray-900">Total Amount</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Driver Details */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <h2 className="text-lg font-semibold">Driver Information</h2>
              </div>
              <div className="p-6">
                {driverDetails ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                          {driverDetails.profilePicturePath ? (
                            <img
                              src={driverDetails.profilePicturePath}
                              alt={driverDetails.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-semibold text-gray-500">
                              {driverDetails.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-base font-semibold text-gray-900">{driverDetails.name}</h3>
                        {driverDetails.rating && (
                          <div className="mt-1 flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`h-4 w-4 ${i < Math.floor(driverDetails.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-1 text-sm text-gray-500">{driverDetails.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <ul className="space-y-3">
                        <li className="flex justify-between">
                          <span className="text-sm text-gray-600">Phone</span>
                          <a
                            href={`tel:${driverDetails.phone}`}
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                          >
                            {driverDetails.phone}
                          </a>
                        </li>
                        {driverDetails.registrationNumber && (
                          <li className="flex justify-between">
                            <span className="text-sm text-gray-600">Vehicle Number</span>
                            <span className="text-sm text-gray-900">{driverDetails.registrationNumber}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-gray-500">Driver details unavailable</div>
                )}
              </div>
            </div>

            {/* Contact & Support */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <h2 className="text-lg font-semibold">Need Help?</h2>
              </div>
              <div className="p-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">If you have any questions or issues with this order, our customer support team is ready to help</p>
                  <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                    <Phone size={16} className="mr-2" />
                    Contact Support
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleBookAgain}
                className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <RotateCcw size={16} className="mr-2" />
                Book Again
              </button>
              {order.status !== 'completed' && (
                <button
                  onClick={handleViewOrderTracking}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <Truck size={16} className="mr-2" />
                  Track Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetails;