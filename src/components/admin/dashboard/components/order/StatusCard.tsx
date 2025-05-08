import React from 'react';

interface StatusCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ icon, label, count, color }) => (
  <div className="bg-gray-50 rounded-md p-4 flex items-center justify-between">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-gray-700">{label}</span>
    </div>
    <span className={`text-lg font-semibold ${color}`}>{count}</span>
  </div>
);

export default StatusCard;