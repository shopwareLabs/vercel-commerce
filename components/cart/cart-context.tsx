'use client';

import { Schemas } from '#shopware';
import { transformCart } from 'lib/shopware/transform';
import type { Cart, CartItem, Product, ProductVariant } from 'lib/shopware/types';
import React, { createContext, use, useContext, useMemo, useOptimistic } from 'react';

export type UpdateType = 'plus' | 'minus' | 'delete';

type CartAction =
  | { type: 'UPDATE_ITEM'; payload: { merchandiseId: string; updateType: UpdateType } }
  | { type: 'ADD_ITEM'; payload: { variant: ProductVariant; product: Product } };

type CartContextType = {
  cart: Cart | undefined;
  updateCartItem: (merchandiseId: string, updateType: UpdateType) => void;
  addCartItem: (variant: ProductVariant, product: Product) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function calculateItemCost(quantity: number, price: string): string {
  return (Number(price) * quantity).toString();
}

function updateCartItem(item: CartItem, updateType: UpdateType): CartItem | null {
  if (updateType === 'delete') return null;

  const newQuantity = updateType === 'plus' ? item.quantity + 1 : item.quantity - 1;
  if (newQuantity === 0) return null;

  const singleItemAmount = Number(item.cost.totalAmount.amount) / item.quantity;
  const newTotalAmount = calculateItemCost(newQuantity, singleItemAmount.toString());

  return {
    ...item,
    quantity: newQuantity,
    cost: {
      ...item.cost,
      totalAmount: {
        ...item.cost.totalAmount,
        amount: newTotalAmount
      }
    }
  };
}

function createOrUpdateCartItem(
  existingItem: CartItem | undefined,
  variant: ProductVariant,
  product: Product
): CartItem {
  const productPrice = variant.price?.amount
    ? variant.price.amount
    : product.priceRange.minVariantPrice.amount === product.priceRange.maxVariantPrice.amount
      ? product.priceRange.minVariantPrice.amount
      : '0';
  const quantity = existingItem ? existingItem.quantity + 1 : 1;
  const totalAmount = calculateItemCost(quantity, productPrice);
  const currencyCode = variant.price?.currencyCode
    ? variant.price?.currencyCode
    : product.priceRange.minVariantPrice.currencyCode ===
        product.priceRange.maxVariantPrice.currencyCode
      ? product.priceRange.minVariantPrice.currencyCode
      : 'EUR';

  return {
    id: existingItem?.id,
    quantity,
    cost: {
      totalAmount: {
        amount: totalAmount,
        currencyCode: currencyCode
      }
    },
    merchandise: {
      id: variant.id,
      title: variant.title,
      selectedOptions: variant.selectedOptions,
      product: {
        ...product
      }
    }
  };
}

function updateCartTotals(lines: CartItem[]): Pick<Cart, 'totalQuantity' | 'cost'> {
  const totalQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = lines.reduce((sum, item) => sum + Number(item.cost.totalAmount.amount), 0);
  const currencyCode = lines[0]?.cost.totalAmount.currencyCode ?? 'USD';

  return {
    totalQuantity,
    cost: {
      subtotalAmount: { amount: totalAmount.toString(), currencyCode },
      totalAmount: { amount: totalAmount.toString(), currencyCode },
      totalTaxAmount: { amount: '0', currencyCode }
    }
  };
}

function createEmptyCart(): Cart {
  return {
    id: undefined,
    checkoutUrl: '',
    totalQuantity: 0,
    lines: [],
    cost: {
      subtotalAmount: { amount: '0', currencyCode: 'USD' },
      totalAmount: { amount: '0', currencyCode: 'USD' },
      totalTaxAmount: { amount: '0', currencyCode: 'USD' }
    }
  };
}

function cartReducer(state: Cart | undefined, action: CartAction): Cart {
  const currentCart = state || createEmptyCart();

  switch (action.type) {
    case 'UPDATE_ITEM': {
      const { merchandiseId, updateType } = action.payload;
      const updatedLines = currentCart.lines
        .map((item) =>
          item.merchandise.id === merchandiseId ? updateCartItem(item, updateType) : item
        )
        .filter(Boolean) as CartItem[];

      if (updatedLines.length === 0) {
        return {
          ...currentCart,
          lines: [],
          totalQuantity: 0,
          cost: {
            ...currentCart.cost,
            totalAmount: { ...currentCart.cost.totalAmount, amount: '0' }
          }
        };
      }

      return { ...currentCart, ...updateCartTotals(updatedLines), lines: updatedLines };
    }
    case 'ADD_ITEM': {
      const { variant, product } = action.payload;
      const existingItem = currentCart.lines.find((item) => item.merchandise.id === variant.id);
      const updatedItem = createOrUpdateCartItem(existingItem, variant, product);

      const updatedLines = existingItem
        ? currentCart.lines.map((item) => (item.merchandise.id === variant.id ? updatedItem : item))
        : [...currentCart.lines, updatedItem];

      return { ...currentCart, ...updateCartTotals(updatedLines), lines: updatedLines };
    }
    default:
      return currentCart;
  }
}

export function CartProvider({
  children,
  cartPromise
}: {
  children: React.ReactNode;
  cartPromise: Promise<Schemas['Cart'] | undefined>;
}) {
  const initialCart = transformCart(use<Schemas['Cart'] | undefined>(cartPromise));
  const [optimisticCart, updateOptimisticCart] = useOptimistic(initialCart, cartReducer);

  const updateCartItem = (merchandiseId: string, updateType: UpdateType) => {
    updateOptimisticCart({ type: 'UPDATE_ITEM', payload: { merchandiseId, updateType } });
  };

  const addCartItem = (variant: ProductVariant, product: Product) => {
    updateOptimisticCart({ type: 'ADD_ITEM', payload: { variant, product } });
  };

  const value = useMemo(
    () => ({
      cart: optimisticCart,
      updateCartItem,
      addCartItem
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [optimisticCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
