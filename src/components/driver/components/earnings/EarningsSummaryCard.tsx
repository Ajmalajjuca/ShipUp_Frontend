import React from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from "../ui/card";
import Motion from '../ui/motion';

export interface EarningsSummaryCardProps {
  title: string;
  amount: number;
  trend: 'up' | 'down' | 'neutral';
  percentage: number;
  delay?: number;
}

const EarningsSummaryCard: React.FC<EarningsSummaryCardProps> = ({ 
  title, 
  amount, 
  trend, 
  percentage, 
  delay = 0 
}) => {
  const trendIcon = trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
  const trendClass = trend === 'up' ? 'text-emerald-500' : 'text-red-500';
  
  return (
    <Motion variant="fade-in" delay={delay}>
      <Card className="elegant-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="p-2 rounded-full bg-accent/10 text-accent">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold">${amount.toFixed(2)}</h3>
            <div className={`flex items-center text-xs ${trendClass}`}>
              {trendIcon}
              <span className="ml-1">{percentage}% {trend === 'up' ? 'increase' : 'decrease'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Motion>
  );
};

export default EarningsSummaryCard;
