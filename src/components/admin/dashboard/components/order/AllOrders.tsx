import React from 'react';
import BaseOrderList from './BaseOrderList';

interface AllOrdersProps {
  onViewOrder?: (id: string) => void;
}

const AllOrders: React.FC<AllOrdersProps> = ({ onViewOrder }) => {
  return (
    <BaseOrderList
      title="All Orders"
      statusCountsConfig={{
        pending: 0,
        confirmed: 0,
        processing: 0,
        outForDelivery: 0,
        delivered: 0,
        canceled: 0,
        returned: 0,
        failed: 0,
      }}
      onViewOrder={onViewOrder}
    />
  );
};

export default AllOrders;