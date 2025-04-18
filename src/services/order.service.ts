import { orderApi } from './axios/instance';
import {
  Order,
  OrderSummary,
  TrackingResponse,
  PricingResponse,
  PricingTiers,
  PaymentResponse,
  RefundResponse,
  OrdersResponse,
  OrderReportResponse,
  RevenueReportResponse,
  Address,
  PackageDetails
} from '../types/order.types';

interface CreateOrderData {
  userId: string;
  pickupAddress: Address;
  deliveryAddress: Address;
  packageDetails: PackageDetails;
  deliveryType: string;
  paymentMethod: string;
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
}

interface PaymentData {
  orderId: string;
  method: string;
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

export const orderService = {
  // Order Management
  createOrder: async (data: CreateOrderData): Promise<ApiResponse<{ order: Order }>> => {
    const response = await orderApi.post('/orders', data);
    return response.data;
  },

  getOrder: async (orderId: string): Promise<ApiResponse<{ order: Order }>> => {
    const response = await orderApi.get(`/orders/${orderId}`);
    return response.data;
  },

  getUserOrders: async (userId: string, params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<OrdersResponse>> => {
    const response = await orderApi.get(`/orders/user/${userId}`, { params });
    return response.data;
  },

  updateOrderStatus: async (orderId: string, data: { status: string, description: string }): Promise<ApiResponse<{ order: Order }>> => {
    const response = await orderApi.put(`/orders/${orderId}/status`, data);
    return response.data;
  },

  cancelOrder: async (orderId: string, data: CancelOrderData): Promise<ApiResponse<{ order: Order }>> => {
    const response = await orderApi.post(`/orders/${orderId}/cancel`, data);
    return response.data;
  },

  assignDriver: async (orderId: string, partnerId: string): Promise<ApiResponse<{ order: Order }>> => {
    const response = await orderApi.post(`/orders/${orderId}/assign`, { partnerId });
    return response.data;
  },

  // Order Tracking
  getTrackingDetails: async (orderId: string): Promise<ApiResponse<{ tracking: TrackingResponse }>> => {
    const response = await orderApi.get(`/orders/${orderId}/tracking`);
    return response.data;
  },

  updateDriverLocation: async (data: LocationUpdateData): Promise<ApiResponse<{}>> => {
    const response = await orderApi.post(`/tracking/location`, data);
    return response.data;
  },

  // Pricing
  calculatePrice: async (data: PricingRequestData): Promise<ApiResponse<{ pricing: PricingResponse }>> => {
    const response = await orderApi.post(`/pricing/calculate`, data);
    return response.data;
  },

  getPriceTiers: async (): Promise<ApiResponse<{ pricingTiers: PricingTiers }>> => {
    const response = await orderApi.get(`/pricing/tiers`);
    return response.data;
  },

  // Payment
  processPayment: async (data: PaymentData): Promise<ApiResponse<{ payment: PaymentResponse }>> => {
    const response = await orderApi.post(`/payments/process`, data);
    return response.data;
  },

  getPaymentStatus: async (orderId: string): Promise<ApiResponse<{ payment: PaymentResponse }>> => {
    const response = await orderApi.get(`/payments/order/${orderId}`);
    return response.data;
  },

  processRefund: async (data: RefundData): Promise<ApiResponse<{ refund: RefundResponse }>> => {
    const response = await orderApi.post(`/payments/refund`, data);
    return response.data;
  },

  // Reports (Admin)
  generateOrderReport: async (params: {
    startDate: string;
    endDate: string;
    status?: string;
    format?: string;
  }): Promise<ApiResponse<{ report: OrderReportResponse }>> => {
    const response = await orderApi.get(`/reports/orders`, { params });
    return response.data;
  },

  generateRevenueReport: async (params: {
    startDate: string;
    endDate: string;
    groupBy?: string;
    format?: string;
  }): Promise<ApiResponse<{ report: RevenueReportResponse }>> => {
    const response = await orderApi.get(`/reports/revenue`, { params });
    return response.data;
  }
}; 