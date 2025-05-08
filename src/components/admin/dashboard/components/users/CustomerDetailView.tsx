import React, { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Search } from "lucide-react";
import { userService } from "../../../../../services/user.service";
import { toast } from "react-hot-toast";
import { driverService } from "../../../../../services/driver.service";

interface Driver {
  fullName: string;
  mobileNumber: number;
}

interface Address {
  street: string;
  latitude: number;
  longitude: number;
}

interface Order {
  id: string;
  createdAt: string;
  pickupAddress: Address;
  dropoffAddress: Address;
  totalAmount: number;
  status: string;
  estimatedTime?: string;
  distance?: number;
  paymentMethod?: string;
  vehicleName?: string;
  driverId?: string;
  driverName?: string;
  driver: Driver;
}

interface Customer {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage?: string;
  createdAt: string;
  walletBalance: number;
  loyaltyPoints: number;
  orders: Order[];
}

interface CustomerDetailViewProps {
  userId: string;
  onBack: () => void;
}

const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({
  userId,
  onBack,
}) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCustomerDetails();
    fetchCustomerOrders();
  }, [userId]);

  const fetchCustomerDetails = async () => {
    try {
      const response = await userService.getUserById(userId);
      setCustomer((prev) => ({
        ...prev,
        ...response.user,
        orders: prev?.orders || [],
      }));
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast.error("Failed to fetch customer details");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOrders = async () => {
    try {
      setOrdersLoading(true);
      const orders = await userService.getOrdersByUserId(userId);

      const updatedOrders = await Promise.all(
        orders.map(async (order) => {
          if (order.driverId) {
            const driver = await driverService.getDriverById(order.driverId);
            return { ...order, driver: driver.partner };
          }
          return order;
        })
      );

      setCustomer((prev) => (prev ? { ...prev, orders: updatedOrders } : null));
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      toast.error("Failed to fetch customer orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSimplifiedAddress = (address: Address | undefined) => {
    if (!address || !address.street) return "";
    const parts = address.street.split(",").map((part) => part.trim());
    return parts.slice(0, 2).join(",");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "ongoing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredOrders =
    customer?.orders?.filter((order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (!customer)
    return (
      <div className="text-center text-red-500 py-4">Customer not found</div>
    );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold">Customer Details</h1>
      </div>

      {/* Customer Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-800">
            {customer.fullName || "N/A"}
          </h2>
          <div className="flex items-center text-gray-500 mt-1">
            <Calendar size={16} className="mr-1" />
            <span>Member since: {formatDate(customer.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Wallet & Loyalty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-100 shadow-sm">
          <h3 className="text-sm uppercase text-gray-600 font-medium mb-2">
            Wallet Balance
          </h3>
          <div className="flex justify-between items-center">
            <p className="text-2xl font-bold text-gray-800">
              ₹ {customer.walletBalance?.toFixed(2) || "0.00"}
            </p>
            <div className="bg-white p-3 rounded-full shadow-sm">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-100 shadow-sm">
          <h3 className="text-sm uppercase text-gray-600 font-medium mb-2">
            Loyalty Points
          </h3>
          <div className="flex justify-between items-center">
            <p className="text-2xl font-bold text-gray-800">
              {customer.loyaltyPoints || 0}
            </p>
            <div className="bg-white p-3 rounded-full shadow-sm">⭐</div>
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-medium text-gray-800 flex items-center">
            Order History
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full ml-2">
              {filteredOrders.length}
            </span>
          </h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by order ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
            <Search
              size={18}
              className="absolute top-2.5 left-3 text-gray-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>

                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ordersLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : 
                filteredOrders.length>0?(
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id.substring(0, 8)}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(order.createdAt)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center text-sm text-gray-900">
                            <span className="w-2 h-2 inline-block bg-blue-400 rounded-full mr-2"></span>
                            {order.driver?.fullName || "N/A"}
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <span className="w-2 h-2 inline-block bg-yellow-400 rounded-full mr-2"></span>
                            {order.driver?.mobileNumber || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center text-sm text-gray-900">
                            <span className="w-2 h-2 inline-block bg-green-400 rounded-full mr-2"></span>
                            {getSimplifiedAddress(order.pickupAddress)}
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <span className="w-2 h-2 inline-block bg-red-400 rounded-full mr-2"></span>
                            {getSimplifiedAddress(order.dropoffAddress)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-900">
                            {order.vehicleName || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.distance ? `${order.distance} km` : ""}
                            {order.estimatedTime
                              ? ` • ${order.estimatedTime}`
                              : ""}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{order.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                
                
              ):(
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
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

export default CustomerDetailView;
