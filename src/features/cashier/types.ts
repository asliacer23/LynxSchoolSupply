export type CashierPaymentMethod = 'gcash' | 'paymaya' | 'cash';
export type CashierPaymentStatus = 'pending' | 'completed' | 'failed';

export interface CashierPayment {
  id: string;
  order_id: string;
  method: CashierPaymentMethod;
  amount: number;
  status: CashierPaymentStatus;
  paid_at: string | null;
}

export interface POSCartItem {
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
}
