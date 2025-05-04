export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface PackageDetails {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  category: string;
  description: string;
}

export interface Price {
  basePrice: number;
  distanceCharge: number;
  weightCharge: number;
  expressCharge: number;
  tax: number;
  totalAmount: number;
}

export interface Payment {
  method: string;
  status: string;
  transactionId: string | null;
}

export interface TrackingDetail {
  status: string;
  timestamp: string;
  description: string;
}

export interface DriverInfo {
  partnerId: string;
  fullName: string;
  phone: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
  vehicleDetails: {
    vehicleType: string;
    vehicleNumber: string;
  };
}

export interface CancellationDetails {
  reason: string;
  cancelledBy: string;
  timestamp: string;
}

export interface RefundDetails {
  status: string;
  amount: number;
  estimatedCompletionTime: string;
}

export interface Order {
  orderId: string;
  userId: string;
  partnerId: string | null;
  pickupAddress: Address;
  deliveryAddress: Address;
  packageDetails: PackageDetails;
  deliveryType: string;
  status: string;
  price: Price;
  payment: Payment;
  estimatedDeliveryTime: string;
  createdAt: string;
  updatedAt: string;
  trackingDetails?: TrackingDetail[];
  cancellationDetails?: CancellationDetails;
  refundDetails?: RefundDetails;
}

export interface OrderSummary {
  orderId: string;
  userId: string;
  partnerId: string | null;
  status: string;
  deliveryType: string;
  createdAt: string;
  estimatedDeliveryTime: string;
  price: {
    totalAmount: number;
  };
  payment: {
    status: string;
  };
}

export interface TrackingResponse {
  orderId: string;
  currentStatus: string;
  estimatedDeliveryTime: string;
  trackingDetails: TrackingDetail[];
  driverInfo?: DriverInfo;
}

export interface PricingTier {
  type: string;
  multiplier: number;
  estimatedTime: string;
  description: string;
}

export interface WeightCategory {
  range: string;
  charge: number;
}

export interface PricingTiers {
  basePrice: number;
  deliveryTypes: PricingTier[];
  weightCategories: WeightCategory[];
  distanceRates: {
    baseDistance: string;
    baseCharge: number;
    additionalRate: string;
  };
  taxRate: string;
}

export interface PricingResponse {
  basePrice: number;
  distanceCharge: number;
  weightCharge: number;
  expressCharge: number;
  tax: number;
  totalAmount: number;
  currency: string;
  breakdown: {
    distance: string;
    estimatedTime: string;
    weightCategory: string;
    taxRate: string;
  };
}

export interface PaymentResponse {
  transactionId: string;
  orderId: string;
  amount: number;
  method: string;
  status: string;
  timestamp: string;
}

export interface RefundResponse {
  refundId: string;
  orderId: string;
  transactionId: string;
  amount: number;
  status: string;
  reason: string;
  timestamp: string;
  estimatedCompletionTime: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface OrdersResponse {
  orders: OrderSummary[];
  pagination: Pagination;
}

export interface ReportSummary {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface OrderReportResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: ReportSummary;
  statusBreakdown: Record<string, number>;
  orders: OrderSummary[];
}

export interface RevenueReportResponse {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    highestRevenueDay: string;
    highestRevenueDayAmount: number;
  };
  revenueBreakdown: {
    byDeliveryType: Record<string, number>;
    byPaymentMethod: Record<string, number>;
  };
  timeline: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
} 