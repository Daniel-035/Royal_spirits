'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container, Button, Input } from '@royal-spirits/ui';
import { useCart } from '../../lib/cart';
import { api } from '../../lib/api';
import type { PincodeValidation } from '@royal-spirits/shared';

export default function CartPage() {
  const router = useRouter();
  const { items, setQuantity, remove, subtotal } = useCart();
  const [pincode, setPincode] = useState('');
  const [validation, setValidation] = useState<PincodeValidation | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleCheckPincode() {
    if (!/^\d{6}$/.test(pincode)) {
      setValidation({ serviceable: false, message: 'Enter a valid 6-digit pincode.' });
      return;
    }
    setChecking(true);
    try {
      const result = await api.post<PincodeValidation>('/cart/validate-pincode', { pincode });
      setValidation(result);
    } catch {
      setValidation({ serviceable: false, message: 'Could not validate pincode. Try again.' });
    } finally {
      setChecking(false);
    }
  }

  const canCheckout =
    items.length > 0 && validation?.serviceable === true && validation?.withinHours === true;
  const total = subtotal();

  return (
    <Container className="py-8">
      <h1 className="font-display text-3xl font-bold text-rs-on-surface">Your Cart</h1>

      {items.length === 0 ? (
        <div className="mt-6 rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-8 text-center">
          <p className="text-rs-on-surface-variant">Your cart is empty.</p>
          <Link href="/products" className="mt-4 inline-block text-rs-secondary hover:underline">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-4"
              >
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-rs bg-rs-surface-container">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rs-secondary">
                    {item.brand}
                  </p>
                  <p className="font-medium text-rs-on-surface">{item.name}</p>
                  <p className="text-sm text-rs-on-surface-variant">
                    {item.volumeMl}ml · ₹{item.price.toFixed(0)}
                  </p>
                </div>
                <div className="flex items-center rounded-rs border border-rs-outline-variant">
                  <button
                    onClick={() => setQuantity(item.productId, item.quantity - 1)}
                    className="h-9 w-9 text-rs-on-surface hover:bg-rs-surface-container"
                    aria-label="Decrease"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-rs-on-surface">{item.quantity}</span>
                  <button
                    onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    className="h-9 w-9 text-rs-on-surface hover:bg-rs-surface-container"
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
                <p className="w-20 text-right font-medium text-rs-on-surface">
                  ₹{(item.price * item.quantity).toFixed(0)}
                </p>
                <button
                  onClick={() => remove(item.productId)}
                  className="text-xs text-rs-danger hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-6">
              <h2 className="font-display text-lg font-semibold text-rs-on-surface">
                Order Summary
              </h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-rs-on-surface-variant">Subtotal</span>
                  <span className="text-rs-on-surface">₹{total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rs-on-surface-variant">Delivery</span>
                  <span className="text-rs-on-surface">₹0</span>
                </div>
                <div className="border-t border-rs-outline-variant pt-2">
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-rs-on-surface">Total</span>
                    <span className="text-rs-on-surface">₹{total.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="text-xs font-medium uppercase tracking-wide text-rs-on-surface-variant">
                  Check delivery pincode
                </label>
                <div className="mt-1 flex gap-2">
                  <Input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="6-digit pincode"
                    maxLength={6}
                  />
                  <Button variant="ghost" onClick={handleCheckPincode} disabled={checking}>
                    {checking ? '...' : 'Check'}
                  </Button>
                </div>
                {validation && (
                  <p
                    className={
                      validation.serviceable
                        ? 'mt-2 text-xs text-rs-status-delivered'
                        : 'mt-2 text-xs text-rs-danger'
                    }
                  >
                    {validation.message}
                  </p>
                )}
              </div>

              <Button
                variant="primary"
                fullWidth
                disabled={!canCheckout}
                onClick={() => router.push('/checkout')}
                className="mt-6"
              >
                Proceed to Checkout
              </Button>
              {!canCheckout && items.length > 0 && (
                <p className="mt-2 text-xs text-rs-on-surface-variant">
                  Validate a serviceable pincode within delivery hours to continue.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
