import React from 'react';
import BaseOrderList from './BaseOrderList';

interface PendingOrdersProps {
  onViewOrder?: (id: string) => void;
}

const PendingOrders: React.FC<PendingOrdersProps> = ({ onViewOrder }) => {
  return (
    <BaseOrderList
      title="Pending Orders"
      statusFilter="pending"
      statusCountsConfig={{ pending: 0 }}
      onViewOrder={onViewOrder}
    />
  );
};

export default PendingOrders;