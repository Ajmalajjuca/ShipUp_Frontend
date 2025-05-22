import React, { useState, useEffect } from 'react';

interface OnlineStatusToggleProps {
  isOnline: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

const OnlineStatusToggle: React.FC<OnlineStatusToggleProps> = ({
  isOnline,
  onToggle,
  isLoading = false
}) => {
  const [position, setPosition] = useState(isOnline ? 100 : 0);

  useEffect(() => {
    setPosition(isOnline ? 100 : 0);
  }, [isOnline]);

  return (
    <div className="flex flex-col items-center gap-4 mb-6">
      <div
        className={`relative px-8 py-3 rounded-xl text-white font-medium transition-all duration-300 shadow-lg ${
          isOnline
            ? 'bg-gradient-to-r from-green-500 to-green-400'
            : 'bg-gradient-to-r from-red-500 to-red-400'
        }`}
      >
        {isLoading ? 'Updating...' : isOnline ? 'Online' : 'Offline'}
      </div>
      <div className="flex items-center">
        {isOnline ? (
          <button
            onClick={onToggle}
            disabled={isLoading}
            className={`relative inline-flex h-8 w-16 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border border-gray-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ backgroundColor: '#10b981' }}
            role="switch"
            aria-checked="true"
            aria-label="Toggle online status"
          >
            <span
              className="inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300"
              style={{ transform: `translateX(140%)` }}
            />
          </button>
        ) : (
          <button
            onClick={onToggle}
            disabled={isLoading}
            className={`relative inline-flex h-8 w-16 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border border-gray-200 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ backgroundColor: '#e5e7eb' }}
            role="switch"
            aria-checked="false"
            aria-label="Toggle online status"
          >
            <span
              className="inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300"
              style={{ transform: `translateX(15%)` }}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default OnlineStatusToggle;