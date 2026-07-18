import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@royal-spirits/shared';

export interface CartItem {
  productId: string;
  name: string;
  brand: string;
  price: number;
  volumeMl: number;
  imageUrl: string | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (product: Product, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, quantity) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                name: product.name,
                brand: product.brand,
                price: product.price,
                volumeMl: product.volumeMl,
                imageUrl: product.imageUrl ?? null,
                quantity,
              },
            ],
          };
        });
      },
      setQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().remove(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i,
          ),
        }));
      },
      remove: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'rs_cart' },
  ),
);
