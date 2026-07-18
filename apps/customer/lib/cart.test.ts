import { describe, it, expect, beforeEach } from 'vitest';
import { useCart } from '../lib/cart';
import type { Product } from '@royal-spirits/shared';

const product: Product = {
  id: 'p1',
  name: 'Test Whiskey',
  category: 'Whiskey',
  brand: 'TestBrand',
  volumeMl: 750,
  price: 1000,
  stockQty: 5,
  imageUrl: null,
  description: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('cart store', () => {
  beforeEach(() => {
    useCart.setState({ items: [] });
  });

  it('adds a new item', () => {
    useCart.getState().add(product, 2);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].quantity).toBe(2);
  });

  it('increments quantity when adding existing product', () => {
    useCart.getState().add(product, 1);
    useCart.getState().add(product, 2);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].quantity).toBe(3);
  });

  it('updates quantity', () => {
    useCart.getState().add(product, 1);
    useCart.getState().setQuantity('p1', 5);
    expect(useCart.getState().items[0].quantity).toBe(5);
  });

  it('removes item when quantity set to 0', () => {
    useCart.getState().add(product, 1);
    useCart.getState().setQuantity('p1', 0);
    expect(useCart.getState().items).toHaveLength(0);
  });

  it('removes an item', () => {
    useCart.getState().add(product, 1);
    useCart.getState().remove('p1');
    expect(useCart.getState().items).toHaveLength(0);
  });

  it('calculates count and subtotal', () => {
    useCart.getState().add(product, 3);
    expect(useCart.getState().count()).toBe(3);
    expect(useCart.getState().subtotal()).toBe(3000);
  });

  it('clears all items', () => {
    useCart.getState().add(product, 1);
    useCart.getState().clear();
    expect(useCart.getState().items).toHaveLength(0);
  });
});
