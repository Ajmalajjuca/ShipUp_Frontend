import React from 'react';
import { CheckCircle, Clock, Truck, Home, Package, MapPin } from 'lucide-react';
import { OrderData } from './useOrderTracking';

interface OrderStatusTimelineProps {
  activeOrder: OrderData | null;
  estimatedTimes?: {
    pickupEta?: string;
    dropoffEta?: string;
    [key: string]: string | undefined;
  };
  isCompact?: boolean;
}

interface StatusItem {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  timestamp?: string;
  estimatedTime?: string;
}

const OrderStatusTimeline = ({ 
  activeOrder, 
  estimatedTimes = {},
  isCompact = false 
}: OrderStatusTimelineProps) => {
  // Early return if no order data
  if (!activeOrder) return null;
  
  // Define all possible statuses in order
  const allStatuses: StatusItem[] = [
    {
      key: 'confirmed',
      label: 'Order Confirmed',
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      timestamp: activeOrder.confirmedAt
    },
    {
      key: 'driverAssigned',
      label: 'Driver Assigned',
      icon: Truck,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      timestamp: activeOrder.driverAssignedAt
    },
    {
      key: 'enRouteToPickup',
      label: 'En Route to Pickup',
      icon: MapPin,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-100',
      timestamp: activeOrder.enRouteToPickupAt,
      estimatedTime: estimatedTimes.pickupEta
    },
    {
      key: 'arrivedAtPickup',
      label: 'Arrived at Pickup',
      icon: MapPin,
      color: 'text-violet-500',
      bgColor: 'bg-violet-100',
      timestamp: activeOrder.arrivedAtPickupAt
    },
    {
      key: 'pickedUp',
      label: 'Package Picked Up',
      icon: Package,
      color: 'text-amber-500',
      bgColor: 'bg-amber-100',
      timestamp: activeOrder.pickedUpAt
    },
    {
      key: 'enRouteToDropoff',
      label: 'En Route to Dropoff',
      icon: Truck,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100',
      timestamp: activeOrder.enRouteToDropoffAt,
      estimatedTime: estimatedTimes.dropoffEta
    },
    {
      key: 'arrivedAtDropoff',
      label: 'Arrived at Dropoff',
      icon: Home,
      color: 'text-rose-500',
      bgColor: 'bg-rose-100',
      timestamp: activeOrder.arrivedAtDropoffAt
    },
    {
      key: 'completed',
      label: 'Delivery Completed',
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100',
      timestamp: activeOrder.completedAt
    }
  ];
  
  // Find the current status index based on which statuses have timestamps
  let currentStatusIndex = -1;
  for (let i = allStatuses.length - 1; i >= 0; i--) {
    if (allStatuses[i].timestamp) {
      currentStatusIndex = i;
      break;
    }
  }
  
  // If the order has been cancelled, show a special state
  if (activeOrder.status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-center text-red-600">
          <div className="mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span className="font-medium">This order has been cancelled</span>
        </div>
        {activeOrder.cancellationReason && (
          <div className="mt-2 text-sm text-gray-600 text-center">
            Reason: {activeOrder.cancellationReason}
          </div>
        )}
      </div>
    );
  }
  
  // Format the timestamp
  const formatTime = (timestamp: string | undefined): string => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Determine which statuses to show in compact mode
  let statusesToShow = allStatuses;
  if (isCompact) {
    // In compact mode, show completed statuses and the next 2
    const nextStatusIndex = currentStatusIndex + 1;
    statusesToShow = allStatuses.filter((_, index) => 
      index <= currentStatusIndex || 
      (index <= nextStatusIndex && index < allStatuses.length)
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Delivery Progress</h3>
      
      <div className="space-y-4">
        {statusesToShow.map((status, index) => {
          const isPast = index <= currentStatusIndex;
          const isCurrent = index === currentStatusIndex;
          const IconComponent = status.icon;
          
          // Calculate estimated time display if available
          let estimatedTimeDisplay = null;
          if (!isPast && status.estimatedTime) {
            estimatedTimeDisplay = (
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <Clock size={12} className="mr-1" />
                <span>Est. {formatTime(status.estimatedTime)}</span>
              </div>
            );
          }
          
          return (
            <div 
              key={status.key} 
              className={`flex ${index < statusesToShow.length - 1 ? 'pb-4' : ''}`}
            >
              {/* Timeline connector */}
              {index < statusesToShow.length - 1 && (
                <div className="ml-3.5 mt-7 w-px bg-gray-300 flex-grow" />
              )}
              
              <div className="flex flex-col items-start">
                {/* Status icon */}
                <div className={`flex-shrink-0 h-7 w-7 rounded-full ${isPast ? status.bgColor : 'bg-gray-200'} flex items-center justify-center z-10`}>
                  <IconComponent 
                    size={16} 
                    className={isPast ? status.color : 'text-gray-400'} 
                    fill={isPast ? "currentColor" : "none"} 
                  />
                </div>
                
                {/* Status details */}
                <div className="ml-4 mt-1.5">
                  <div className={`text-sm font-medium ${isCurrent ? status.color : (isPast ? 'text-gray-800' : 'text-gray-500')}`}>
                    {status.label}
                  </div>
                  
                  {status.timestamp && (
                    <time className="text-xs text-gray-500">
                      {formatTime(status.timestamp)}
                    </time>
                  )}
                  
                  {!isPast && estimatedTimeDisplay}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {isCompact && currentStatusIndex < allStatuses.length - 3 && (
        <button className="w-full mt-3 text-blue-600 text-sm font-medium hover:text-blue-700 focus:outline-none">
          Show full timeline
        </button>
      )}
    </div>
  );
};

export default OrderStatusTimeline;