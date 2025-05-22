import React from 'react';

const PerformanceCard: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-bold text-lg">Your Performance</h3>
      <select
        className="bg-gray-100 border-0 rounded-lg text-sm p-2"
        aria-label="Performance time period"
        title="Select time period"
      >
        <option>This Week</option>
        <option>This Month</option>
        <option>Last Month</option>
      </select>
    </div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-600">On-time Delivery</span>
      <span className="font-medium">96%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
      <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }}></div>
    </div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-600">Customer Satisfaction</span>
      <span className="font-medium">92%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
    </div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-600">Order Acceptance</span>
      <span className="font-medium">88%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '88%' }}></div>
    </div>
  </div>
);

export default PerformanceCard;