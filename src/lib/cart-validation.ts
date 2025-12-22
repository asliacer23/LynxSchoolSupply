import type { Product, CartItem } from '@/types/database';

/**
 * Cart and Order Validation Rules
 */

// Maximum quantity per item in a single transaction
export const MAX_QUANTITY_PER_ITEM = 100;

// Minimum order total (in pesos)
export const MIN_ORDER_AMOUNT = 0; // No minimum

// Maximum order total (in pesos)
export const MAX_ORDER_AMOUNT = 1000000;

// Maximum items per order
export const MAX_ITEMS_PER_ORDER = 500;

// Maximum quantity per cart item
export const MAX_CART_ITEM_QUANTITY = 100;

export interface ValidationResult {
  valid: boolean;
  message: string;
  code?: string;
}

/**
 * Validate if a quantity can be added to cart
 * @param product - The product to add
 * @param currentQuantityInCart - Current quantity of this item in cart
 * @param quantityToAdd - Quantity user wants to add
 */
export function validateAddToCart(
  product: Product,
  currentQuantityInCart: number,
  quantityToAdd: number
): ValidationResult {
  // Check if product is out of stock
  if (product.stock <= 0) {
    return {
      valid: false,
      message: 'This item is out of stock',
      code: 'OUT_OF_STOCK',
    };
  }

  // Check if quantity to add exceeds available stock
  if (quantityToAdd > product.stock) {
    return {
      valid: false,
      message: `Only ${product.stock} item(s) available in stock`,
      code: 'EXCEEDS_STOCK',
    };
  }

  // Check if new total quantity would exceed per-item limit
  const newQuantity = currentQuantityInCart + quantityToAdd;
  if (newQuantity > MAX_CART_ITEM_QUANTITY) {
    return {
      valid: false,
      message: `Maximum ${MAX_CART_ITEM_QUANTITY} of this item allowed per order`,
      code: 'EXCEEDS_ITEM_LIMIT',
    };
  }

  // Check if adding would exceed stock
  if (currentQuantityInCart + quantityToAdd > product.stock) {
    const canAdd = product.stock - currentQuantityInCart;
    return {
      valid: false,
      message: `You can only add ${canAdd} more of this item (${product.stock} available, ${currentQuantityInCart} already in cart)`,
      code: 'EXCEEDS_AVAILABLE_STOCK',
    };
  }

  return {
    valid: true,
    message: 'Item added successfully',
  };
}

/**
 * Validate order before checkout
 * @param items - Cart items to validate
 * @param total - Order total amount
 */
export function validateOrder(items: CartItem[], total: number): ValidationResult {
  // Check if cart is empty
  if (items.length === 0) {
    return {
      valid: false,
      message: 'Your cart is empty',
      code: 'EMPTY_CART',
    };
  }

  // Check total items count
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalItems > MAX_ITEMS_PER_ORDER) {
    return {
      valid: false,
      message: `Order cannot exceed ${MAX_ITEMS_PER_ORDER} total items (you have ${totalItems})`,
      code: 'EXCEEDS_ITEMS_LIMIT',
    };
  }

  // Check minimum order amount
  if (total < MIN_ORDER_AMOUNT) {
    return {
      valid: false,
      message: `Minimum order amount is ₱${MIN_ORDER_AMOUNT.toFixed(2)}`,
      code: 'BELOW_MINIMUM',
    };
  }

  // Check maximum order amount
  if (total > MAX_ORDER_AMOUNT) {
    return {
      valid: false,
      message: `Order amount cannot exceed ₱${MAX_ORDER_AMOUNT.toFixed(2)}`,
      code: 'EXCEEDS_MAXIMUM',
    };
  }

  // Validate each item has stock
  for (const item of items) {
    if (!item.product) {
      return {
        valid: false,
        message: 'Invalid item in cart',
        code: 'INVALID_ITEM',
      };
    }

    if (item.quantity > item.product.stock) {
      return {
        valid: false,
        message: `${item.product.name} - Only ${item.product.stock} available (you have ${item.quantity})`,
        code: 'STOCK_CHANGED',
      };
    }

    if (item.quantity <= 0) {
      return {
        valid: false,
        message: `${item.product.name} - Invalid quantity`,
        code: 'INVALID_QUANTITY',
      };
    }
  }

  return {
    valid: true,
    message: 'Order is valid',
  };
}

/**
 * Get a user-friendly message for stock availability
 */
export function getStockMessage(available: number, inCart: number): string {
  const canAdd = available - inCart;
  if (canAdd <= 0) {
    return `All ${available} item(s) are in your cart`;
  }
  if (available <= 5) {
    return `Only ${available} available (${inCart} in cart)`;
  }
  return `${available} available`;
}

/**
 * Get validation error message for display
 */
export function getValidationMessage(code: string): string {
  const messages: Record<string, string> = {
    OUT_OF_STOCK: 'This item is out of stock',
    EXCEEDS_STOCK: 'Cannot add more than available stock',
    EXCEEDS_ITEM_LIMIT: 'Maximum quantity exceeded',
    EXCEEDS_AVAILABLE_STOCK: 'Requested quantity exceeds available stock',
    EMPTY_CART: 'Your cart is empty',
    EXCEEDS_ITEMS_LIMIT: 'Too many items in order',
    BELOW_MINIMUM: 'Order amount below minimum',
    EXCEEDS_MAXIMUM: 'Order amount exceeds maximum',
    INVALID_ITEM: 'Invalid item in cart',
    STOCK_CHANGED: 'Stock availability has changed',
    INVALID_QUANTITY: 'Invalid quantity selected',
  };
  return messages[code] || 'An error occurred';
}
