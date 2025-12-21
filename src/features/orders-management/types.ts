export interface OrderWithDetails {
  id: string;
  user_id: string | null;
  cashier_id: string | null;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  cashier?: {
    full_name: string;
    email: string;
  };
  customer?: {
    full_name: string;
    email: string;
  };
}

export interface OrderItemDetail {
  id: string;
  order_id: string;
  product_id: string;
  price: number;
  quantity: number;
  product?: {
    name: string;
    description?: string;
  };
}

export interface PaymentDetail {
  id: string;
  order_id: string;
  method: string;
  amount: number;
  status: string;
  paid_at: string | null;
}

export interface OrderReport {
  totalOrders: number;
  totalRevenue: number;
  completedOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  paymentMethodBreakdown: Record<string, number>;
}
