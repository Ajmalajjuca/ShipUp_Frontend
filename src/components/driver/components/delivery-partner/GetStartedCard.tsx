import React from 'react';
import OnlineStatusToggle from './OnlineStatusToggle';
import ActionButton from './ActionButton';
import { Map, Clock, Package } from 'lucide-react';

interface GetStartedCardProps {
  isOnline: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

const GetStartedCard: React.FC<GetStartedCardProps> = ({
  isOnline,
  onToggle,
  isLoading = false
}) => (
  <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 mb-8">
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold mb-2 flex items-center justify-center">
        Gear Up, Partner! <span className="ml-2">🚀</span>
      </h2>
      <h3 className="text-3xl font-bold bg-gradient-to-r from-coral-500 to-orange-400 bg-clip-text text-transparent">
        Go Online And Take Your<br />First Order
      </h3>
    </div>
    <OnlineStatusToggle isOnline={isOnline} onToggle={onToggle} isLoading={isLoading} />
    {isOnline && (
      <div className="grid grid-cols-3 gap-3 mt-6">
        <ActionButton
          icon={<Map size={20} />}
          label="Navigation"
          onClick={() => console.log('Navigation clicked')}
        />
        <ActionButton
          icon={<Clock size={20} />}
          label="Schedule"
          onClick={() => console.log('Schedule clicked')}
        />
        <ActionButton
          icon={<Package size={20} />}
          label="Orders"
          onClick={() => console.log('Orders clicked')}
        />
      </div>
    )}
  </div>
);

export default GetStartedCard;