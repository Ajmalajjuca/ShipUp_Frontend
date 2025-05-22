import React, { useState } from 'react';
import { Button } from './ui/button';
import Motion from './ui/motion';
import EarningsSummaryCard from './earnings/EarningsSummaryCard';
import EarningsChart from './earnings/EarningsChart';
import TransactionHistory from './earnings/TransactionHistory';
import { earningsData, transactionHistory } from './earnings/data';

const Earnings: React.FC = () => {
  const [timeRange, setTimeRange] = useState('week');
  
  const totalEarnings = earningsData.reduce((sum, day) => sum + day.amount, 0);
  const averagePerDay = totalEarnings / earningsData.length;
  
  return (
    <div className="space-y-6">
      <Motion variant="fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold">Earnings Dashboard</h1>
          <div className="flex items-center space-x-2 mt-2 sm:mt-0">
            <Button 
              className={timeRange === 'day' ? 'bg-primary text-white' : 'bg-white text-primary border'} 
              onClick={() => setTimeRange('day')}
            >
              Day
            </Button>
            <Button 
              className={timeRange === 'week' ? 'bg-primary text-white' : 'bg-white text-primary border'} 
              onClick={() => setTimeRange('week')}
            >
              Week
            </Button>
            <Button 
              className={timeRange === 'month' ? 'bg-primary text-white' : 'bg-white text-primary border'} 
              onClick={() => setTimeRange('month')}
            >
              Month
            </Button>
          </div>
        </div>
      </Motion>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <EarningsSummaryCard 
          title="Total Earnings" 
          amount={totalEarnings} 
          trend="up" 
          percentage={8.2} 
          delay={100}
        />
        <EarningsSummaryCard 
          title="Average Per Day" 
          amount={averagePerDay} 
          trend="up" 
          percentage={5.1} 
          delay={200}
        />
        <EarningsSummaryCard 
          title="Pending Payout" 
          amount={125.75} 
          trend="neutral" 
          percentage={0} 
          delay={300}
        />
      </div>

      {/* Chart */}
      <EarningsChart data={earningsData} />

      {/* Transactions */}
      <TransactionHistory transactions={transactionHistory} />
    </div>
  );
};

export default Earnings;
