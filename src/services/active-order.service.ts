import { api } from './axios/instance';
import { toast } from 'react-hot-toast';

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

interface ActiveOrderPayload extends ActiveOrder {
  ttl?: number;
}

export const activeOrderService = {
  async storeActiveOrder(userId: string, orderData: ActiveOrder, ttl?: number): Promise<boolean> {
    try {
      const payload: ActiveOrderPayload = { ...orderData };
      if (ttl) {
        payload.ttl = ttl;
      }

      const response = await api.post(`/api/active-orders/${userId}`, payload);

      if (response.data.success) {
        console.log('Active order stored in Redis successfully');
        localStorage.setItem('activeOrder', JSON.stringify(orderData));
        return true;
      } else {
        console.error('Failed to store active order:', response.data.message);
        toast.error('Failed to store active order data on the server. Using local storage as fallback.');
        localStorage.setItem('activeOrder', JSON.stringify(orderData));
        return false;
      }
    } catch (error) {
      console.error('Error storing active order:', error);
      toast.error('Error storing order data. Using local storage as fallback.');
      localStorage.setItem('activeOrder', JSON.stringify(orderData));
      return false;
    }
  },

  async getActiveOrder(userId: string): Promise<ActiveOrder | null> {
    try {
      const response = await api.get(`/api/active-orders/${userId}`);

      if (response.data.success && response.data.data) {
        console.log('Active order retrieved from Redis successfully');
        localStorage.setItem('activeOrder', JSON.stringify(response.data.data));
        return response.data.data;
      } else {
        console.log('No active order found in Redis');
        const localOrder = localStorage.getItem('activeOrder');
        if (localOrder) {
          try {
            const parsedOrder = JSON.parse(localOrder);
            this.storeActiveOrder(userId, parsedOrder).catch((err) =>
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

  async removeActiveOrder(userId: string): Promise<boolean> {
    try {
      const response = await api.delete(`/api/active-orders/${userId}`);

      if (response.data.success) {
        console.log('Active order removed from Redis successfully');
        localStorage.removeItem('activeOrder');
        return true;
      } else {
        console.error('Failed to remove active order:', response.data.message);
        localStorage.removeItem('activeOrder');
        return false;
      }
    } catch (error) {
      console.error('Error removing active order:', error);
      localStorage.removeItem('activeOrder');
      return false;
    }
  },

  async updateOrderStatus(userId: string, status: ActiveOrder['status']): Promise<boolean> {
    try {
      const currentOrder = await this.getActiveOrder(userId);
      if (!currentOrder) {
        console.error('No active order found to update status');
        return false;
      }

      const updatedOrder = {
        ...currentOrder,
        status,
      };

      return await this.storeActiveOrder(userId, updatedOrder);
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  },
};