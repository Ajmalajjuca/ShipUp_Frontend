import React from 'react';
import BaseOrderList from './BaseOrderList';

interface CompletedOrdersProps {
  onViewOrder?: (id: string) => void;
}

const CompletedOrders: React.FC<CompletedOrdersProps> = ({ onViewOrder }) => {
  return (
    <BaseOrderList
      title="Completed Orders"
      statusFilter="completed"
      statusCountsConfig={{ delivered: 0 }}
      onViewOrder={onViewOrder}
    />
  );
};

export default CompletedOrders;