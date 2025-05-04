import { useState } from 'react';
import { orderService } from '../services/order.service';
import { toast } from 'react-hot-toast';
import {
  Order,
  OrdersResponse,
  TrackingResponse,
  PricingResponse,
  PricingTiers,
  PaymentResponse,
  RefundResponse,
  OrderReportResponse,
  RevenueReportResponse
} from '../types/order.types';

interface CreateOrderParams {
  userId: string;
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
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
    description: string;
  };
  deliveryType: string;
  paymentMethod: string;
}

interface UseOrderReturn {
  loading: boolean;
  error: string | null;
  order: Order | null;
  orders: OrdersResponse | null;
  tracking: TrackingResponse | null;
  pricing: PricingResponse | null;
  pricingTiers: PricingTiers | null;
  payment: PaymentResponse | null;
  orderReport: OrderReportResponse | null;
  revenueReport: RevenueReportResponse | null;
  createOrder: (params: CreateOrderParams) => Promise<Order | null>;
  getOrder: (orderId: string) => Promise<Order | null>;
  getUserOrders: (userId: string, params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => Promise<OrdersResponse | null>;
  updateOrderStatus: (orderId: string, status: string, description: string) => Promise<Order | null>;
  cancelOrder: (orderId: string, reason: string, cancelledBy: string) => Promise<Order | null>;
  assignDriver: (orderId: string, partnerId: string) => Promise<Order | null>;
  getTrackingDetails: (orderId: string) => Promise<TrackingResponse | null>;
  calculatePrice: (data: {
    pickupLocation: { latitude: number; longitude: number };
    deliveryLocation: { latitude: number; longitude: number };
    packageDetails: {
      weight: number;
      dimensions: { length: number; width: number; height: number };
      category: string;
    };
    deliveryType: string;
  }) => Promise<PricingResponse | null>;
  getPriceTiers: () => Promise<PricingTiers | null>;
  processPayment: (orderId: string, method: string, paymentDetails: any) => Promise<PaymentResponse | null>;
  getPaymentStatus: (orderId: string) => Promise<PaymentResponse | null>;
  generateOrderReport: (params: {
    startDate: string;
    endDate: string;
    status?: string;
    format?: string;
  }) => Promise<OrderReportResponse | null>;
  generateRevenueReport: (params: {
    startDate: string;
    endDate: string;
    groupBy?: string;
    format?: string;
  }) => Promise<RevenueReportResponse | null>;
}

export const useOrder = (): UseOrderReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<OrdersResponse | null>(null);
  const [tracking, setTracking] = useState<TrackingResponse | null>(null);
  const [pricing, setPricing] = useState<PricingResponse | null>(null);
  const [pricingTiers, setPricingTiers] = useState<PricingTiers | null>(null);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [orderReport, setOrderReport] = useState<OrderReportResponse | null>(null);
  const [revenueReport, setRevenueReport] = useState<RevenueReportResponse | null>(null);

  const handleError = (err: any) => {
    console.error('Order service error:', err);
    const errorMessage = err.response?.data?.error || 'Something went wrong with the order service';
    setError(errorMessage);
    toast.error(errorMessage);
    return null;
  };

  const createOrder = async (params: CreateOrderParams): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.createOrder(params);
      if (response.success) {
        setOrder(response.order);
        toast.success('Order created successfully');
        return response.order;
      } else {
        setError(response.error || 'Failed to create order');
        toast.error(response.error || 'Failed to create order');
        return null;
      }
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const getOrder = async (orderId: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getOrder(orderId);
      if (response.success) {
        setOrder(response.order);
        return response.order;
      } else {
        setError(response.error || 'Failed to get order');
        toast.error(response.error || 'Failed to get order');
        return null;
      }
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const getUserOrders = async (userId: string, params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<OrdersResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getUserOrders(userId, params);
      if (response.success) {
        setOrders(response.orders);
        return response.orders;
      } else {
        setError(response.error || 'Failed to get user orders');
        toast.error(response.error || 'Failed to get user orders');
        return null;
      }
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, description: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.updateOrderStatus(orderId, { status, description });
      if (response.success) {
        setOrder(response.order);
        toast.success('Order status updated successfully');
        return response.order;
      } else {
        setError(response.error || 'Failed to update order status');
        toast.error(response.error || 'Failed to update order status');
        return null;
      }
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string, reason: string, cancelledBy: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.cancelOrder(orderId, { reason, cancelledBy });
      if (response.success) {
        setOrder(response.order);
        toast.success('Order cancelled successfully');
        return response.order;
      } else {
        setError(response.error || 'Failed to cancel order');
        toast.error(response.error || 'Failed to cancel order');
        return null;
      }
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const assignDriver = async (orderId: string, partnerId: string): Promise<Order | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.assignDriver(orderId, partnerId);
      if (response.success) {
        setOrder(response.order);
        toast.success('Driver assigned successfully');
        return response.order;
      } else {
        setError(response.error || 'Failed to assign driver');
        toast.error(response.error || 'Failed to assign driver');
        return null;
      }
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const getTrackingDetails = async (orderId: string): Promise<TrackingResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getTrackingDetails(orderId);
      if (response.success) {
        setTracking(response.tracking);
        return response.tracking;
      } else {
        setError(response.error || 'Failed to get tracking details');
        toast.error(response.error || 'Failed to get tracking details');
        return null;
      }
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async (data: {
    pickupLocation: { latitude: number; longitude: number };
    deliveryLocation: { latitude: number; longitude: number };
    packageDetails: {
      weight: number;
      dimensions: { length: number; width: number; height: number };
      category: string;
    };
    deliveryType: string;
  }): Promise<PricingResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.calculatePrice(data);
      if (response.success) {
        setPricing(response.pricing);
        return response.pricing;
      } else {
        setError(response.error || 'Failed to calculate price');
        toast.error(response.error || 'Failed to calculate price');
        return null;
      }
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const getPriceTiers = async (): Promise<PricingTiers | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getPriceTiers();
      if (response.success) {
        setPricingTiers(response.pricingTiers);
        return response.pricingTiers;
      } else {
        setError(response.error || 'Failed to get price tiers');
        toast.error(response.error || 'Failed to get price tiers');
        return null;
      }
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (orderId: string, method: string, paymentDetails: any): Promise<PaymentResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.processPayment({ orderId, method, paymentDetails });
      if (response.success) {
        setPayment(response.payment);
        toast.success('Payment processed successfully');
        return response.payment;
      } else {
        setError(response.error || 'Failed to process payment');
        toast.error(response.error || 'Failed to process payment');
        return null;
      }
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = async (orderId: string): Promise<PaymentResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getPaymentStatus(orderId);
      if (response.success) {
        setPayment(response.payment);
        return response.payment;
      } else {
        setError(response.error || 'Failed to get payment status');
        toast.error(response.error || 'Failed to get payment status');
        return null;
      }
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const generateOrderReport = async (params: {
    startDate: string;
    endDate: string;
    status?: string;
    format?: string;
  }): Promise<OrderReportResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.generateOrderReport(params);
      if (response.success) {
        setOrderReport(response.report);
        return response.report;
      } else {
        setError(response.error || 'Failed to generate order report');
        toast.error(response.error || 'Failed to generate order report');
        return null;
      }
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const generateRevenueReport = async (params: {
    startDate: string;
    endDate: string;
    groupBy?: string;
    format?: string;
  }): Promise<RevenueReportResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.generateRevenueReport(params);
      if (response.success) {
        setRevenueReport(response.report);
        return response.report;
      } else {
        setError(response.error || 'Failed to generate revenue report');
        toast.error(response.error || 'Failed to generate revenue report');
        return null;
      }
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    order,
    orders,
    tracking,
    pricing,
    pricingTiers,
    payment,
    orderReport,
    revenueReport,
    createOrder,
    getOrder,
    getUserOrders,
    updateOrderStatus,
    cancelOrder,
    assignDriver,
    getTrackingDetails,
    calculatePrice,
    getPriceTiers,
    processPayment,
    getPaymentStatus,
    generateOrderReport,
    generateRevenueReport
  };
}; 