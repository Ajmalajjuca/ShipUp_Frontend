
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { orderApi } from './axios/instance';

interface Address {
  street?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

export interface ActiveOrder {
  userId: string;
  orderId: string;
  driverId: string;
  pickupLocation: Address;
  dropLocation: Address;
  status: 'driver_assigned' | 'driver_arrived' | 'picked_up' | 'completed';
  timestamp: number;
  vehicle: string | null;
  pickupOtp: string;
  dropoffOtp?: string;
  distance?: number;
  amount?: number;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  estimatedTime?: string;
  paymentMethod?: 'cash' | 'card' | 'upi';
  customerName?: string;
}

// Extended interface with ttl for API requests
interface ActiveOrderPayload extends ActiveOrder {
  ttl?: number;
}

export const activeOrderService = {
  /**
   * Store an active order in Redis
   * @param userId User ID
   * @param orderData Order data
   * @param ttl Optional Time-to-live in seconds (default: 24 hours)
   */
  async storeActiveOrder(userId: string, orderData: ActiveOrder, ttl?: number): Promise<boolean> {
    try {
      const payload: ActiveOrderPayload = { ...orderData };
      if (ttl) {
        payload.ttl = ttl;
      }
      
      const response = await orderApi.post(`/active-orders/${userId}`, payload);
      
      if (response.data.success) {
        console.log('Active order stored in Redis successfully');
        
        // Also store in localStorage as fallback
        localStorage.setItem('activeOrder', JSON.stringify(orderData));
        
        return true;
      } else {
        console.error('Failed to store active order:', response.data.message);
        toast.error('Failed to store active order data on the server. Using local storage as fallback.');
        
        // Still store in localStorage if Redis fails
        localStorage.setItem('activeOrder', JSON.stringify(orderData));
        
        return false;
      }
    } catch (error) {
      console.error('Error storing active order:', error);
      toast.error('Error storing order data. Using local storage as fallback.');
      
      // Fall back to localStorage
      localStorage.setItem('activeOrder', JSON.stringify(orderData));
      
      return false;
    }
  },
  
  /**
   * Get an active order from Redis
   * @param userId User ID
   * @returns Active order data or null if not found
   */
  async getActiveOrder(userId: string): Promise<ActiveOrder | null> {
    try {
      const response = await orderApi.get(`/active-orders/${userId}`);
      
      if (response.data.success && response.data.data) {
        console.log('Active order retrieved from Redis successfully');
        
        // Update localStorage with the latest data
        localStorage.setItem('activeOrder', JSON.stringify(response.data.data));
        
        return response.data.data;
      } else {
        console.log('No active order found in Redis');
        
        // Try localStorage as fallback
        const localOrder = localStorage.getItem('activeOrder');
        if (localOrder) {
          try {
            const parsedOrder = JSON.parse(localOrder);
            
            // Try to sync back to Redis
            this.storeActiveOrder(userId, parsedOrder).catch(err => 
              console.error('Failed to sync local order to Redis:', err)
            );
            
            return parsedOrder;
          } catch (e) {
            console.error('Error parsing local order:', e);
            return null;
          }
        }
        
        return null;
      }
    } catch (error) {
      console.error('Error retrieving active order:', error);
      
      // Try localStorage as fallback
      const localOrder = localStorage.getItem('activeOrder');
      if (localOrder) {
        try {
          return JSON.parse(localOrder);
        } catch (e) {
          console.error('Error parsing local order:', e);
        }
      }
      
      return null;
    }
  },
  
  /**
   * Remove an active order from Redis
   * @param userId User ID
   * @returns True if successful, false otherwise
   */
  async removeActiveOrder(userId: string): Promise<boolean> {
    try {
      const response = await orderApi.delete(`/active-orders/${userId}`);
      
      if (response.data.success) {
        console.log('Active order removed from Redis successfully');
        
        // Also remove from localStorage
        localStorage.removeItem('activeOrder');
        
        return true;
      } else {
        console.error('Failed to remove active order:', response.data.message);
        
        // Still remove from localStorage
        localStorage.removeItem('activeOrder');
        
        return false;
      }
    } catch (error) {
      console.error('Error removing active order:', error);
      
      // Still remove from localStorage
      localStorage.removeItem('activeOrder');
      
      return false;
    }
  },
  
  /**
   * Update active order status
   * @param userId User ID
   * @param status New status
   * @returns True if successful, false otherwise
   */
  async updateOrderStatus(userId: string, status: ActiveOrder['status']): Promise<boolean> {
    try {
      // First, get the current order
      const currentOrder = await this.getActiveOrder(userId);
      
      if (!currentOrder) {
        console.error('No active order found to update status');
        return false;
      }
      
      // Update the status
      const updatedOrder = {
        ...currentOrder,
        status
      };
      
      // Store the updated order
      return await this.storeActiveOrder(userId, updatedOrder);
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }
}; 