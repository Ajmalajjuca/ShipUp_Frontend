import React from 'react';
import { Order } from './BaseOrderList';

interface OrderTableProps {
  orders: Order[];
  isLoading:boolean;
  onViewOrder?: (id: string) => void;
  getStatusColor: (status: string) => string;
  getPaymentStatusColor: (method: string) => string;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading,
  onViewOrder,
  getStatusColor,
  getPaymentStatusColor,
  formatDate,
  formatTime,
}) => {

    const SkeletonRow = () => (
        <tr className="border-b border-gray-200">
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mt-1 animate-pulse"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-24 mt-1 animate-pulse"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-24 mt-1 animate-pulse"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-8 mt-1 animate-pulse mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-40 mt-1 animate-pulse"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mt-1 animate-pulse"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </td>
          <td className="py-3 px-4">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </td>
        </tr>
      );
  return (
    <div className="overflow-x-auto">
        

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">SL</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Order ID</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Delivery Date</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Customer</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Driver</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Address</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Total Amount</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Delivery Type</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Vehicle</th>
          </tr>
        </thead>
        <tbody>
        {isLoading ? (
            // Render 5 skeleton rows during loading
            Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />)
          ) : (
          orders.map((order, index) => (
            <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="py-3 px-4 text-sm">{index + 1}</td>
              <td className="py-3 px-4 text-sm">#{order.id.substring(0, 8)}</td>
              <td className="py-3 px-4 text-sm">
                <div>{formatDate(order.createdAt)}</div>
                <div className="text-gray-500 text-xs">{formatTime(order.updatedAt)}</div>
              </td>
              <td className="py-3 px-4 text-sm">
                <div>{order.customerName}</div>
                <div className="text-gray-500 text-xs">{order.customerPhone}</div>
              </td>
              <td className="py-3 px-4 text-sm">
                <div>{order.driverName}</div>
                <div className="text-gray-500 text-xs">{order.driverPhone}</div>
              </td>
              <td className="py-3 px-4 text-gray-500 text-xs">
                <div>{order.pickupAddress.street.split(',').slice(0, 3).join(',')}</div>
                <div className="text-black-900 text-xs my-1 text-center">↓</div>
                <div className="flex text-gray-500 text-xs mt-1">
                  <span>{order.dropoffAddress.street.split(',').slice(0, 3).join(',')}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-sm">
                <div>₹{order.totalAmount.toFixed(2)}</div>
                <div className={getPaymentStatusColor(order.paymentMethod)}>{order.paymentMethod}</div>
              </td>
              <td className="py-3 px-4 text-sm">
                <span className={`${getStatusColor(order.status)} py-0.5`}>{order.status}</span>
              </td>
              <td className="py-3 px-4 text-sm">
                <span className={order.deliveryType==='express'?'text-yellow-800':'text-blue-500'}>{order.deliveryType}</span>
              </td>
              <td className="py-3 px-4 text-sm">
                <div>{order.vehicleName}</div>
              </td>
            </tr>
          ))
        )}
        </tbody>
      </table>
        
    </div>
  );
};

export default OrderTable;