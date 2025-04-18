import React, { useEffect, useState } from 'react';
import { ArrowLeft, Building, Mail, Phone, Search, Calendar } from 'lucide-react';
import { userService } from '../../../../../services/user.service';
import { toast } from 'react-hot-toast';

interface Order {
  orderId: string;
  totalAmount: number;
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

const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({ userId, onBack }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomerDetails();
  }, [userId]);

  const fetchCustomerDetails = async () => {
    try {
      const response = await userService.getUserById(userId);
      
      // For demo purposes, if there's no real data, create mock data
      if (!response.user) {
        const mockUser: Customer = {
          userId: userId,
          fullName: "Yefrin",
          email: "b**********@gmail.com",
          phone: "+5**********",
          createdAt: "2025-04-10T22:24:26",
          walletBalance: 0.00,
          loyaltyPoints: 0,
          orders: [
            { orderId: "100139", totalAmount: 133.00 }
          ]
        };
        setCustomer(mockUser);
      } else {
        setCustomer(response.user);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
      
      // For demo purposes, create mock data if API fails
      const mockUser: Customer = {
        userId: userId,
        fullName: "Yefrin",
        email: "b**********@gmail.com",
        phone: "+5**********",
        createdAt: "2025-04-10T22:24:26",
        walletBalance: 0.00,
        loyaltyPoints: 0,
        orders: [
          { orderId: "100139", totalAmount: 133.00 }
        ]
      };
      setCustomer(mockUser);
      
      toast.error('Failed to fetch customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    toast.success('Search functionality to be implemented');
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;
  if (!customer) return <div className="text-center text-red-500 py-4">Customer not found</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header with icon and title */}
      <div className="flex items-center mb-4">
        <button 
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          👤 Customer Details
        </h1>
      </div>

      {/* Customer ID and Join Date */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-800">Customer ID #{customer.userId}</h2>
          <div className="flex items-center text-gray-500 mt-1">
            <Calendar size={16} className="mr-1" />
            <span>Joined at: {new Date(customer.createdAt).toLocaleString('en-GB')}</span>
          </div>
        </div>
        
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Wallet Balance Card */}
        <div className="bg-green-50 p-6 rounded-lg border border-green-100">
          <h3 className="uppercase text-gray-600 font-medium mb-3">Wallet Balance</h3>
          <div className="flex justify-between items-center">
            <p className="text-2xl font-bold text-gray-800">₹ {customer.walletBalance||'0'}</p>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Loyalty Points Card */}
        <div className="bg-red-50 p-6 rounded-lg border border-red-100">
          <h3 className="uppercase text-gray-600 font-medium mb-3">Loyalty Point Balance</h3>
          <div className="flex justify-between items-center">
            <p className="text-2xl font-bold text-gray-800">{customer.loyaltyPoints||0}</p>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Customer Orders */}
        <div className="flex-1 md:mr-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-800">
              Order List <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full ml-2">{customer?.orders?.length}</span>
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by order ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              <Search size={18} className="absolute top-2.5 left-3 text-gray-400" />
              <button 
                onClick={handleSearch}
                className="absolute right-2 top-2 text-blue-500 hover:text-blue-700"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600">SL</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600">Order ID</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600">Total Amount</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {customer?.orders?.filter(order => 
                  order.orderId.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((order, index) => (
                  <tr key={order.orderId} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4">{order.orderId}</td>
                    <td className="py-3 px-4">{order.totalAmount.toFixed(2)}$</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button 
                          className="p-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                          title="View order details"
                          aria-label="View order details"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          className="p-1 bg-green-100 text-green-600 rounded-md hover:bg-green-200"
                          title="View order invoice"
                          aria-label="View order invoice"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Profile */}
        <div className="mt-6 md:mt-0 md:w-64 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden mb-4">
                {customer.profileImage ? (
                  <img 
                    src={customer.profileImage} 
                    alt={customer.fullName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-4xl font-semibold">
                    {customer.fullName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-medium text-center mb-2">{customer.fullName}</h3>
              <div className="w-full mt-4 space-y-3">
                <div className="flex items-center text-gray-600">
                  <Mail size={16} className="mr-2" />
                  <span className="text-sm overflow-hidden text-ellipsis">{customer.email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone size={16} className="mr-2" />
                  <span className="text-sm">{customer.phone}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Building size={16} className="mr-2" />
                  <span className="text-sm">1 Orders</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">Addresses</h3>
            <p className="text-gray-500 text-sm">No addresses found</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailView; 