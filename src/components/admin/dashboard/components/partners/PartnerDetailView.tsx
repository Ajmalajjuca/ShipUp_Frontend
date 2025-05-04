import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Search } from 'lucide-react';
import { driverService } from '../../../../../services/driver.service';
import { toast } from 'react-hot-toast';
import { vehicleService } from '../../../../../services/vehicle.service';

interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  orderDate: string;
  totalItems: number;
  orderAmount: number;
  paymentMethod: string;
  branch: string;
  status: string;
}

interface Partner {
  partnerId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  createdAt: string;
  profileImage?: string;
  vehicleDetails:{
    name: string;
  }
  registrationNumber: string;
}

interface PartnerDetailViewProps {
  partnerId: string;
  onBack: () => void;
}

const PartnerDetailView: React.FC<PartnerDetailViewProps> = ({ partnerId, onBack }) => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    outForDelivery: 0,
    completed: 0,
    orderAmount: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('Main Branch');

  useEffect(() => {
    fetchPartnerDetails();
    fetchPartnerOrders();
  }, [partnerId]);

  const fetchPartnerDetails = async () => {
    try {
      const partnerRes = await driverService.getDriverById(partnerId);
      console.log('Fetched partner details:', partnerRes);
  
      const vehicleId = partnerRes?.partner?.vehicleId;
  
      let vehicleDetails = null;
      if (vehicleId) {
        try {
          const vehicleRes = await vehicleService.getVehicleById(vehicleId);
          console.log('Fetched vehicle details:', vehicleRes);
          vehicleDetails = vehicleRes?.vehicle;
        } catch (error) {
          console.error('Error fetching vehicle details:', error);
          toast.error('Failed to fetch vehicle details');
        }
      }
  
      setPartner(partnerRes.partner ? { ...partnerRes.partner, vehicleDetails } : null);
  
    } catch (error) {
      console.error('Error fetching partner details:', error);
      toast.error('Failed to fetch partner details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnerOrders = async () => {
    try {
      // Assuming there's a method to get orders by partner ID
      const response = await driverService.getPartnerOrders(partnerId);
      const partnerOrders = response.orders || [];
      setOrders(partnerOrders);

      // Calculate stats
      const pending = partnerOrders.filter(order => order.status === 'Pending').length;
      const outForDelivery = partnerOrders.filter(order => order.status === 'Out For Delivery').length;
      const completed = partnerOrders.filter(order => order.status === 'Delivered').length;
      const totalAmount = partnerOrders.reduce((sum, order) => sum + (order.orderAmount || 0), 0);

      setStats({
        pending,
        outForDelivery,
        completed,
        orderAmount: totalAmount
      });
    } catch (error) {
      console.error('Error fetching partner orders:', error);
      toast.error('Failed to fetch partner orders');
    }
  };

  const handleFilter = () => {
    // Filter logic would go here
    toast.success('Filters applied');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (!partner) return <div className="text-center text-red-500 py-4">Partner not found</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          👨‍💼 Deliveryman Details
        </h1>
      </div>

      {/* Profile Details Card */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-700 mb-4">Profile Details</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex flex-col md:flex-row">
            <div className="flex items-center mb-4 md:mb-0">
              {partner.profileImage ? (
                <img
                  src={partner.profileImage}
                  alt={partner.fullName}
                  className="w-16 h-16 rounded-full object-cover mr-6"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-6">
                  <span className="text-gray-500 text-xl font-semibold">
                    {partner.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-xl font-medium text-gray-800">{partner.fullName}</h3>
                <p className="text-gray-500">Joining: {new Date(partner.createdAt).toLocaleString('en-GB')}</p>
                <button className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded">
                  Edit
                </button>
              </div>
            </div>

            <div className="md:ml-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="mt-4 md:mt-0">
                <h4 className="text-gray-700 font-medium mb-2">Contact info</h4>
                <p className="text-gray-600">{partner.email}</p>
                <p className="text-gray-600">{partner.mobileNumber}</p>
              </div>

              <div className="mt-4 md:mt-0">
                <h4 className="text-gray-700 font-medium mb-2">Vehical info</h4>
                <p className="text-gray-600">Vehical Type: {partner.vehicleDetails.name}</p>
                <p className="text-gray-600">Vehical Number: {partner.registrationNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
          <div className="relative">
            <input
              type="date"
              id="orderDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg pl-10"
              placeholder="Select Date"
            />
            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>

        <div className="flex items-end justify-end">
          <button
            onClick={handleFilter}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Filter
          </button>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-bold">{stats.pending}</h3>
              <p className="text-gray-600">Pending</p>
            </div>
            <div className="rounded-full bg-red-200 p-3">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-bold">{stats.outForDelivery}</h3>
              <p className="text-gray-600">Out for Delivery</p>
            </div>
            <div className="rounded-full bg-purple-200 p-3">
              <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-bold">{stats.completed}</h3>
              <p className="text-gray-600">Completed</p>
            </div>
            <div className="rounded-full bg-green-200 p-3">
              <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-bold">₹ {stats.orderAmount.toFixed(2)}</h3>
              <p className="text-gray-600">Order Amount</p>
            </div>
            <div className="rounded-full bg-blue-200 p-3">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Order List Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">
            Order list <span className="text-sm font-normal text-gray-500 ml-1">{orders.length}</span>
          </h2>

          <div className="flex items-center">
            <div className="relative mr-2">
              <input
                type="text"
                placeholder="Search by order id"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              <Search size={18} className="absolute top-2.5 left-3 text-gray-400" />
            </div>

            <button className="flex items-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg">
              <span>Export</span>
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-xs font-semibold">
                <th className="py-3 px-4 text-left">SL</th>
                <th className="py-3 px-4 text-left">Order ID</th>
                <th className="py-3 px-4 text-left">Customer Info</th>
                <th className="py-3 px-4 text-left">Order Date</th>
                <th className="py-3 px-4 text-left">Total Items</th>
                <th className="py-3 px-4 text-left">Order Amount</th>
                <th className="py-3 px-4 text-left">Payment Method</th>
                <th className="py-3 px-4 text-left">Order Status</th>
                <th className="py-3 px-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders
                  .filter(order =>
                    order.orderId.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((order, index) => (
                    <tr key={order.orderId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4">{order.orderId}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div>{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.customerPhone}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{formatDateTime(order.orderDate)}</td>
                      <td className="py-3 px-4">{order.totalItems}</td>
                      <td className="py-3 px-4">{order.orderAmount.toFixed(2)}$</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs">
                          {order.branch}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'Delivered'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'Out For Delivery'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-4 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartnerDetailView; 