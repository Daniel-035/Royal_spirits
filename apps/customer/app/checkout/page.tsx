'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, Input } from '@royal-spirits/ui';
import { useCart } from '../../lib/cart';
import { useCustomerAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { OtpLoginModal } from '../../components/OtpLoginModal';
import { RESPONSIBLE_DRINKING_DISCLAIMER } from '@royal-spirits/shared';
import type { Order } from '@royal-spirits/shared';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const { customer } = useCustomerAuth();
  const [showOtp, setShowOtp] = useState(false);

  const [name, setName] = useState(customer?.name ?? '');
  const [phone] = useState(customer?.phone ?? '');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [tncAccepted, setTncAccepted] = useState(false);
  const [paymentType, setPaymentType] = useState<'Cash' | 'Online'>('Cash');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pincodeValid, setPincodeValid] = useState<{ serviceable: boolean; withinHours?: boolean } | null>(null);

  const total = subtotal();

  async function handlePincodeCheck() {
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeValid(null);
      return;
    }
    try {
      const result = await api.post<{ serviceable: boolean; withinHours?: boolean; message: string }>(
        '/cart/validate-pincode',
        { pincode },
      );
      setPincodeValid(result);
    } catch {
      setPincodeValid(null);
    }
  }

  async function handlePlaceOrder() {
    setError('');
    if (!customer) {
      setShowOtp(true);
      return;
    }
    if (!name || !address || !/^\d{6}$/.test(pincode)) {
      setError('Please fill all fields with a valid 6-digit pincode.');
      return;
    }
    if (!ageConfirmed || !tncAccepted) {
      setError('Please confirm age and accept the terms.');
      return;
    }
    setSubmitting(true);
    try {
      const order = await api.post<Order>('/orders', {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: address,
        pincode,
        ageConfirmed: true,
        tncAccepted: true,
        paymentType,
        customerName: name,
      });
      clear();
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <Container className="py-10">
        <h1 className="font-display text-2xl font-bold text-rs-on-surface">Checkout</h1>
        <p className="mt-4 text-rs-on-surface-variant">Your cart is empty.</p>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <h1 className="font-display text-3xl font-bold text-rs-on-surface">Checkout</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {!customer && (
            <div className="rounded-rs-lg border border-rs-secondary bg-rs-secondary-fixed p-4 text-sm">
              You need to sign in (phone OTP) to place an order. The login prompt will appear when you click Place Order.
            </div>
          )}
          <Input
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {customer && (
            <Input label="Phone (signed in)" value={phone} disabled />
          )}
          <Input
            label="Delivery address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House no, street, area, city"
            required
          />
          <Input
            label="Pincode"
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value);
              setPincodeValid(null);
            }}
            onBlur={handlePincodeCheck}
            maxLength={6}
            placeholder="6-digit pincode"
            required
          />
          {pincodeValid && (
            <p
              className={
                pincodeValid.serviceable && pincodeValid.withinHours
                  ? 'text-xs text-rs-status-delivered'
                  : 'text-xs text-rs-danger'
              }
            >
              {pincodeValid.serviceable
                ? pincodeValid.withinHours
                  ? 'Delivery available now.'
                  : 'Serviceable, but outside delivery hours. Order will be blocked.'
                : 'This pincode is not serviceable.'}
            </p>
          )}
          <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-4">
            <p className="text-sm font-medium text-rs-on-surface">Payment Method</p>
            <div className="mt-2 flex gap-3">
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-rs border border-rs-outline-variant p-3 text-sm has-[:checked]:border-rs-secondary has-[:checked]:bg-rs-surface-container">
                <input
                  type="radio"
                  name="paymentType"
                  value="Cash"
                  checked={paymentType === 'Cash'}
                  onChange={() => setPaymentType('Cash')}
                />
                <span className="text-rs-on-surface">Cash on Delivery</span>
              </label>
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-rs border border-rs-outline-variant p-3 text-sm has-[:checked]:border-rs-secondary has-[:checked]:bg-rs-surface-container">
                <input
                  type="radio"
                  name="paymentType"
                  value="Online"
                  checked={paymentType === 'Online'}
                  onChange={() => setPaymentType('Online')}
                />
                <span className="text-rs-on-surface">Online (UPI/Card)</span>
              </label>
            </div>
            {paymentType === 'Online' && (
              <p className="mt-2 text-xs text-rs-on-surface-variant">
                Online payment gateway is not yet active. Order will be placed as Unpaid; pay on delivery.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="flex items-start gap-2 text-sm text-rs-on-surface">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span>I confirm I am 21 years of age or older.</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-rs-on-surface">
              <input
                type="checkbox"
                checked={tncAccepted}
                onChange={(e) => setTncAccepted(e.target.checked)}
                className="mt-1"
              />
              <span>I accept the Terms & Conditions and the responsible drinking disclaimer.</span>
            </label>
          </div>
          <p className="text-xs text-rs-on-surface-variant">
            {RESPONSIBLE_DRINKING_DISCLAIMER}
          </p>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-6">
            <h2 className="font-display text-lg font-semibold text-rs-on-surface">Order Summary</h2>
            <div className="mt-4 space-y-1 text-sm">
              {items.map((i) => (
                <div key={i.productId} className="flex justify-between">
                  <span className="text-rs-on-surface-variant">
                    {i.name} × {i.quantity}
                  </span>
                  <span className="text-rs-on-surface">₹{(i.price * i.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-rs-outline-variant pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-rs-on-surface-variant">Subtotal</span>
                <span className="text-rs-on-surface">₹{total.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rs-on-surface-variant">Delivery</span>
                <span className="text-rs-on-surface">₹0</span>
              </div>
              <div className="flex justify-between border-t border-rs-outline-variant pt-2 text-base font-semibold">
                <span className="text-rs-on-surface">Total</span>
                <span className="text-rs-on-surface">₹{total.toFixed(0)}</span>
              </div>
            </div>
            {error && <p className="mt-4 text-sm text-rs-error">{error}</p>}
            <Button
              variant="primary"
              fullWidth
              className="mt-6"
              onClick={handlePlaceOrder}
              disabled={submitting}
            >
              {submitting ? 'Placing...' : customer ? 'Place Order' : 'Sign in to Place Order'}
            </Button>
          </div>
        </div>
      </div>
      {showOtp && <OtpLoginModal onClose={() => setShowOtp(false)} />}
    </Container>
  );
}
