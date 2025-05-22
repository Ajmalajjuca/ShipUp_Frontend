import { api } from './axios/instance';
import {
  OrderSummary,
  TrackingResponse,
  PricingResponse,
  PricingTiers,
  PaymentResponse,
  RefundResponse,
  OrderReportResponse,
  RevenueReportResponse,
  Address,
  PackageDetails,
} from '../types/order.types';
import { vehicleService } from './vehicle.service';
import { PaymentMethod } from '../components/user/Home/BookingComponents/PaymentMethodSelection';

interface CreateOrderData {
  userId: string;
  pickupAddress: Address;
  deliveryAddress: Address;
  packageDetails: PackageDetails;
  deliveryType: string;
  paymentMethod: PaymentMethod;
  vehicleId?: string;
}

interface PricingRequestData {
  pickupLocation: {
    latitude: number;
    longitude: number;
  };
  deliveryLocation: {
    latitude: number;
    longitude: number;
  };
  packageDetails: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    category: string;
  };
  deliveryType: string;
  vehicleId?: string;
}

interface PaymentData {
  orderId: string;
  method: PaymentMethod;
  paymentDetails: any;
}

interface CancelOrderData {
  reason: string;
  cancelledBy: string;
}

interface RefundData {
  orderId: string;
  amount: number;
  reason: string;
}

interface LocationUpdateData {
  partnerId: string;
  orderId: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
}

export interface OrderInput {
  pickupAddressId?: string;
  dropoffAddressId?: string;
  pickupAddress: {
    street: string;
    city?: string;
    state?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  dropoffAddress: {
    street: string;
    city?: string;
    state?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  vehicleId: string;
  vehicleName: string | null;
  deliveryType: 'normal' | 'express';
  distance: number;
  price: number;
  basePrice?: number;
  deliveryPrice?: number;
  commission?: number;
  gstAmount?: number;
  estimatedTime: string;
  paymentMethod: PaymentMethod;
  paymentStatus?: 'pending' | 'paid' | 'not_required';
}

export interface Order extends OrderInput {
  orderId: string;
  userId: string;
  status:
    | 'pending'
    | 'accepted'
    | 'picked'
    | 'in_transit'
    | 'delivered'
    | 'cancelled';
  createdAt: string;
  updatedAt: string;
  paymentStatus: 'pending' | 'paid' | 'not_required';
  driverId?: string;
  pickupAddress: {
    addressId: string;
    street: string;
    type: string;
    contactName: string;
    contactPhone: string;
    latitude?: number;
    longitude?: number;
  };
  dropoffAddress: {
    addressId: string;
    street: string;
    type: string;
    contactName: string;
    contactPhone: string;
    latitude?: number;
    longitude?: number;
  };
  vehicle?: {
    id: string;
    name: string;
    pricePerKm: number;
    maxWeight: number;
    imageUrl?: string;
  };
}

export interface PricingConfig {
  deliveryMultipliers: {
    normal: number;
    express: number;
  };
  taxRates: {
    gst: number;
    commission: number;
  };
  minimumDistance: number;
}

const DEFAULT_PRICING_CONFIG: PricingConfig = {
  deliveryMultipliers: {
    normal: 1,
    express: 1.5,
  },
  taxRates: {
    gst: 0.18,
    commission: 0.1,
  },
  minimumDistance: 2.5,
};

let currentPricingConfig: PricingConfig = { ...DEFAULT_PRICING_CONFIG };

export const orderService = {
  getPricingConfig: async (): Promise<PricingConfig> => {
    try {
      return currentPricingConfig;
    } catch (error) {
      console.error('Failed to fetch pricing config:', error);
      return DEFAULT_PRICING_CONFIG;
    }
  },

  updatePricingConfig: async (
    newConfig: Partial<PricingConfig>
  ): Promise<ApiResponse<{ pricingConfig: PricingConfig }>> => {
    try {
      currentPricingConfig = {
        ...currentPricingConfig,
        deliveryMultipliers: {
          ...currentPricingConfig.deliveryMultipliers,
          ...newConfig.deliveryMultipliers,
        },
        taxRates: {
          ...currentPricingConfig.taxRates,
          ...newConfig.taxRates,
        },
      };

      return {
        success: true,
        message: 'Pricing configuration updated successfully',
        pricingConfig: currentPricingConfig,
      };
    } catch (error) {
      console.error('Failed to update pricing config:', error);
      return {
        success: false,
        message: 'Failed to update pricing configuration',
        error: String(error),
      };
    }
  },

  calculateShippingCost: async (
    distance: number,
    vehicleId: string,
    deliveryType: 'normal' | 'express'
  ): Promise<number> => {
    try {
      const vehicleResponse = await vehicleService.getVehicleById(vehicleId);
      if (!vehicleResponse.success || !vehicleResponse.vehicle) {
        throw new Error('Vehicle not found');
      }

      const pricingConfig = await orderService.getPricingConfig();

      const calculatedDistance = Math.max(distance, pricingConfig.minimumDistance);

      const basePrice = calculatedDistance * (vehicleResponse.vehicle.pricePerKm || 0);

      const typeMultiplier = pricingConfig.deliveryMultipliers[deliveryType];
      const deliveryPrice = basePrice * typeMultiplier;

      const commission = deliveryPrice * pricingConfig.taxRates.commission;
      const gstAmount = deliveryPrice * pricingConfig.taxRates.gst;

      const totalPrice = deliveryPrice + commission + gstAmount;

      return Math.round(totalPrice * 100) / 100;
    } catch (error) {
      console.error('Error calculating shipping cost:', error);
      return 0;
    }
  },

  createOrder: async (orderInput: OrderInput, userId: string): Promise<ApiResponse<Order>> => {
    try {
      const orderPayload = {
        userId,
        vehicleId: orderInput.vehicleId,
        vehicleName: orderInput.vehicleName,
        pickupAddress: orderInput.pickupAddress,
        dropoffAddress: orderInput.dropoffAddress,
        price: orderInput.price,
        basePrice: orderInput.basePrice,
        deliveryPrice: orderInput.deliveryPrice,
        commission: orderInput.commission,
        gstAmount: orderInput.gstAmount,
        estimatedTime: orderInput.estimatedTime,
        distance: orderInput.distance,
        deliveryType: orderInput.deliveryType,
        paymentMethod: orderInput.paymentMethod,
        paymentStatus: orderInput.paymentStatus,
      };

      try {
        const response = await api.post('/api/orders', orderPayload);
        console.log('Order service API response:', response.data);

        return {
          success: true,
          data: {
            orderId: response.data.id || response.data._id,
            ...orderInput,
            userId,
            status: response.data.status || 'pending',
            createdAt: response.data.createdAt || new Date().toISOString(),
            updatedAt: response.data.updatedAt || new Date().toISOString(),
            paymentStatus:
              response.data.paymentStatus ||
              (orderInput.paymentMethod === 'stripe' || orderInput.paymentMethod === 'wallet'
                ? 'pending'
                : 'not_required'),
            pickupAddress: {
              addressId: orderInput.pickupAddressId || 'pickup-' + Date.now(),
              street: orderInput.pickupAddress.street,
              latitude: orderInput.pickupAddress.latitude,
              longitude: orderInput.pickupAddress.longitude,
            },
            dropoffAddress: {
              addressId: orderInput.dropoffAddressId || 'dropoff-' + Date.now(),
              street: orderInput.dropoffAddress.street,
              latitude: orderInput.dropoffAddress.latitude,
              longitude: orderInput.dropoffAddress.longitude,
            },
            vehicle: {
              id: orderInput.vehicleId,
              name: response.data.vehicle?.name || 'Vehicle',
              pricePerKm: response.data.vehicle?.pricePerKm || 15,
              maxWeight: response.data.vehicle?.maxWeight || 100,
              imageUrl: response.data.vehicle?.imageUrl || '/vehicles/bike.png',
            },
          },
        };
      } catch (apiError) {
        console.warn('Order service API error, falling back to mock:', apiError);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        return {
          success: true,
          data: {
            orderId,
            ...orderInput,
            userId,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            paymentStatus:
              orderInput.paymentMethod === 'stripe' || orderInput.paymentMethod === 'wallet'
                ? 'pending'
                : 'not_required',
            pickupAddress: {
              addressId: orderInput.pickupAddressId || 'pickup-' + Date.now(),
              street: orderInput.pickupAddress.street,
              type: 'home',
              contactName: 'User',
              contactPhone: '1234567890',
              latitude: orderInput.pickupAddress.latitude,
              longitude: orderInput.pickupAddress.longitude,
            },
            dropoffAddress: {
              addressId: orderInput.dropoffAddressId || 'dropoff-' + Date.now(),
              street: orderInput.dropoffAddress.street,
              type: 'work',
              contactName: 'Recipient',
              contactPhone: '9876543210',
              latitude: orderInput.dropoffAddress.latitude,
              longitude: orderInput.dropoffAddress.longitude,
            },
            vehicle: {
              id: orderInput.vehicleId,
              name: 'Vehicle',
              pricePerKm: 15,
              maxWeight: 100,
              imageUrl: '/vehicles/bike.png',
            },
          },
        };
      }
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        message: 'Failed to create order',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  getOrders: async (userId: string) => {
    try {
      const response = await api.get(`/api/users/${userId}/orders`);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return {
        success: false,
        message: 'Failed to fetch orders',
        orders: [],
      };
    }
  },

  getAllOrder: async () => {
    try {
      const response = await api.get('/api/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return {
        success: false,
        message: 'Failed to fetch orders',
        orders: [],
      };
    }
  },

  getOrderById: async (orderId: string) => {
    try {
      const response = await api.get(`/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      return {
        success: false,
        message: 'Order not found',
      };
    }
  },

  cancelOrder: async (orderId: string, reason: string) => {
    try {
      const response = await api.put(`/api/orders/${orderId}/cancel`, {
        reason,
      });
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      return {
        success: false,
        message: 'Failed to cancel order',
      };
    }
  },

  assignDriver: async (
    orderId: string,
    partnerId: string
  ): Promise<ApiResponse<{ order: Order }>> => {
    try {
      const response = await api.post(`/api/orders/${orderId}/assign`, {
        partnerId,
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning driver:', error);
      return {
        success: false,
        message: 'Failed to assign driver',
      };
    }
  },

  getTrackingDetails: async (
    orderId: string
  ): Promise<ApiResponse<{ tracking: TrackingResponse }>> => {
    try {
      const response = await api.get(`/api/orders/${orderId}/tracking`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tracking details:', error);
      return {
        success: false,
        message: 'Failed to get tracking details',
      };
    }
  },

  updateDriverLocation: async (
    data: LocationUpdateData
  ): Promise<ApiResponse<{}>> => {
    try {
      const response = await api.post(`/api/tracking/location`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating driver location:', error);
      return {
        success: false,
        message: 'Failed to update location',
      };
    }
  },

  calculatePrice: async (
    data: PricingRequestData
  ): Promise<ApiResponse<{ pricing: PricingResponse }>> => {
    try {
      if (!data.vehicleId) {
        const response = await api.post(`/api/pricing/calculate`, data);
        return response.data;
      }

      const response = await api.post(`/api/pricing/calculate`, data);

      const distance = response.data.pricing?.distance || 0;
      if (distance > 0) {
        const price = await orderService.calculateShippingCost(
          distance,
          data.vehicleId,
          data.deliveryType as 'normal' | 'express'
        );

        return {
          success: true,
          pricing: {
            ...response.data.pricing,
            price,
            vehicleId: data.vehicleId,
          },
        };
      }

      return response.data;
    } catch (error) {
      console.error('Error calculating price:', error);
      return {
        success: false,
        message: 'Failed to calculate price',
      };
    }
  },

  getPriceTiers: async (): Promise<
    ApiResponse<{ pricingTiers: PricingTiers }>
  > => {
    try {
      const vehiclesResponse = await vehicleService.getVehicles();
      if (!vehiclesResponse.success) {
        throw new Error('Failed to fetch vehicle pricing tiers');
      }

      const vehicleTiers = vehiclesResponse.vehicles.map((vehicle) => ({
        id: vehicle.id,
        name: vehicle.name,
        pricePerKm: vehicle.pricePerKm,
        maxWeight: vehicle.maxWeight,
        imageUrl: vehicle.imageUrl,
      }));

      return {
        success: true,
        pricingTiers: {
          vehicles: vehicleTiers,
          deliveryTypes: [
            {
              id: 'normal',
              name: 'Standard',
              multiplier: currentPricingConfig.deliveryMultipliers.normal,
            },
            {
              id: 'express',
              name: 'Express',
              multiplier: currentPricingConfig.deliveryMultipliers.express,
            },
          ],
        },
      };
    } catch (error) {
      console.error('Error fetching price tiers:', error);
      return {
        success: false,
        message: 'Failed to fetch pricing tiers',
      };
    }
  },

  processPayment: async (
    orderId: string,
    paymentMethod: PaymentMethod,
    amount: number
  ): Promise<ApiResponse<any>> => {
    try {
      const paymentData = {
        orderId,
        method: paymentMethod,
        amount,
        status: 'paid',
        transactionId: `txn_${Date.now()}`,
      };

      try {
        const response = await api.post('/api/orders/payment', paymentData);
        return {
          success: true,
          data: response.data,
        };
      } catch (apiError) {
        console.warn('Order service API error, falling back to mock:', apiError);

        await new Promise((resolve) => setTimeout(resolve, 1500));

        let paymentStatus: 'pending' | 'paid' | 'failed';
        let transactionId: string | undefined;

        switch (paymentMethod) {
          case 'stripe':
            paymentStatus = 'paid';
            transactionId = `rzp_${Date.now()}`;
            break;

          case 'wallet':
            paymentStatus = 'paid';
            transactionId = `wlt_${Date.now()}`;
            break;

          case 'cash':
          case 'upi':
            paymentStatus = 'pending';
            break;

          default:
            throw new Error('Invalid payment method');
        }

        return {
          success: true,
          data: {
            orderId,
            paymentStatus,
            transactionId,
            amount,
            timestamp: new Date().toISOString(),
          },
        };
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        message: 'Failed to process payment',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  getPaymentStatus: async (
    orderId: string
  ): Promise<ApiResponse<{ payment: PaymentResponse }>> => {
    try {
      const response = await api.get(`/api/payments/order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return {
        success: false,
        message: 'Failed to get payment status',
      };
    }
  },

  processRefund: async (
    data: RefundData
  ): Promise<ApiResponse<{ refund: RefundResponse }>> => {
    try {
      const response = await api.post(`/api/payments/refund`, data);
      return response.data;
    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        message: 'Failed to process refund',
      };
    }
  },

  processPostDeliveryPayment: async (
    orderId: string,
    method: PaymentMethod,
    amount: number
  ): Promise<ApiResponse<{ payment: PaymentResponse }>> => {
    try {
      const response = await api.post(`/api/payments/post-delivery`, {
        orderId,
        method,
        amount,
      });
      return response.data;
    } catch (error) {
      console.error('Error processing post-delivery payment:', error);
      return {
        success: false,
        message: 'Failed to process payment',
      };
    }
  },

  generateOrderReport: async (params: {
    startDate: string;
    endDate: string;
    status?: string;
    format?: string;
  }): Promise<ApiResponse<{ report: OrderReportResponse }>> => {
    const response = await api.get(`/api/reports/orders`, { params });
    return response.data;
  },

  generateRevenueReport: async (params: {
    startDate: string;
    endDate: string;
    groupBy?: string;
    format?: string;
  }): Promise<ApiResponse<{ report: RevenueReportResponse }>> => {
    const response = await api.get(`/api/reports/revenue`, { params });
    return response.data;
  },

  async getOrderStatus(orderId: string) {
    try {
      const response = await api.get(`/api/orders/${orderId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order status:', error);
      throw error;
    }
  },

  createPaymentIntent: async (orderId: string,amount: number,currency: string) => {
    try {
      const response = await api.post(`/api/orders/stripe/create-payment-intent`, {
        orderId,
        amount,
        currency
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  findDriver: async(orderId: string, pickupLocation: {latitude: number, longitude: number}, vehicleType: string, maxDistance: number, maxWaitTime: number ) => {
    try {
      const response = await api.post(`/api/partners/drivers/assign-driver`, {
        orderId,
        pickupLocation,
        vehicleType,
        maxDistance,
        maxWaitTime
      });
      return response.data;
    } catch (error) {
      console.error('Error finding driver:', error);
      throw error;
    }
  },

  orderUpdatedWithId: async (orderId: string,driverId: string ) => {
    try {
      const response = await api.patch(`/api/orders/${orderId}`, {
        driverId
      });
      return response.data;
    } catch (error) {
      console.error('Error finding driver:', error);
      throw error;
    }
    
  },

  updateOrderStatusInDB: async (orderId: string, status: string) => {
    try {
      const response = await api.patch(`/api/orders/${orderId}`, {
        status
      });
      return response.data;
    } catch (error) {
      console.error('Error finding driver:', error);
      throw error;
    }
  },

  submitRating: async (ratingData: any) => {
    try {
      const response = await api.post(`/api/ratings`, {
       ratingData
      });
      return response.data;
    } catch (error) {
      console.error('Error finding driver:', error);
      throw error;
    }
  },

  getOrderByuserId: async (userId: string) => {
    try {
      const response = await api.get(`/api/orders/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error finding driver:', error);
      throw error;
    }
  }
}; 


