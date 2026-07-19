import { CATEGORIES, RESPONSIBLE_DRINKING_DISCLAIMER } from '@royal-spirits/shared';
import type { Product } from '@prisma/client';

export interface InteractiveListRow {
  id: string;
  title: string;
  description?: string;
}

export function buildMainMenu(): unknown {
  return {
    type: 'list',
    header: { type: 'text', text: 'Royal Spirits' },
    body: { text: 'Welcome to Royal Spirits. How can we help you today?' },
    footer: { text: '21+ only. Drink responsibly.' },
    action: {
      button: 'Menu',
      sections: [
        {
          title: 'Options',
          rows: [
            { id: 'browse', title: 'Browse Products', description: 'See our catalog by category' },
            { id: 'orders', title: 'My Orders', description: 'View your recent orders' },
            { id: 'help', title: 'Help / Support', description: 'Talk to our team' },
          ],
        },
      ],
    },
  };
}

export function buildCategoryList(): unknown {
  const rows: InteractiveListRow[] = CATEGORIES.map((c) => ({
    id: `cat:${c}`,
    title: c,
  }));
  return {
    type: 'list',
    header: { type: 'text', text: 'Categories' },
    body: { text: 'Pick a category to browse:' },
    action: {
      button: 'Browse',
      sections: [{ title: 'Categories', rows }],
    },
  };
}

export function buildProductList(category: string, products: Product[]): unknown {
  const rows: InteractiveListRow[] = products.slice(0, 10).map((p) => ({
    id: `prod:${p.id}`,
    title: `${p.name} — ₹${p.price.toFixed(0)}`,
    description: `${p.brand} · ${p.volumeMl}ml${p.stockQty === 0 ? ' · Out of stock' : ''}`,
  }));
  return {
    type: 'list',
    header: { type: 'text', text: category },
    body: { text: `Here are our ${category} options. Tap to add to your cart.` },
    footer: { text: '21+ only. Drink responsibly.' },
    action: {
      button: 'Select',
      sections: [{ title: 'Products', rows }],
    },
  };
}

export function buildCartSummary(
  items: { itemName: string; quantity: number; unitPrice: number }[],
  subtotal: number,
  deliveryCharge: number,
): unknown {
  const lines = items
    .map((i) => `• ${i.itemName} ×${i.quantity} — ₹${(i.unitPrice * i.quantity).toFixed(0)}`)
    .join('\n');
  const total = subtotal + deliveryCharge;
  return {
    type: 'button',
    header: { type: 'text', text: 'Your Cart' },
    body: {
      text: `${lines}\n\nSubtotal: ₹${subtotal.toFixed(0)}\nDelivery: ₹${deliveryCharge.toFixed(0)}\nTotal: ₹${total.toFixed(0)}`,
    },
    action: {
      buttons: [
        { type: 'reply', reply: { id: 'checkout', title: 'Checkout' } },
        { type: 'reply', reply: { id: 'browse', title: 'Add More' } },
        { type: 'reply', reply: { id: 'clear_cart', title: 'Clear Cart' } },
      ],
    },
  };
}

export function buildAddressPrompt(): unknown {
  return {
    type: 'button',
    body: {
      text: 'Please reply with your delivery address (house no, street, area) and a 6-digit pincode.\n\nExample:\n12 MG Road, Indiranagar\n560038',
    },
    action: {
      buttons: [
        { type: 'reply', reply: { id: 'cancel', title: 'Cancel' } },
      ],
    },
  };
}

export function buildNamePrompt(): unknown {
  return {
    type: 'button',
    body: {
      text: 'Please reply with your full name for the order.',
    },
    action: {
      buttons: [
        { type: 'reply', reply: { id: 'cancel', title: 'Cancel' } },
      ],
    },
  };
}

export function buildAgeConfirmation(): unknown {
  return {
    type: 'button',
    body: {
      text: 'You must be 21 or older to purchase alcohol. Do you confirm you are 21+ and accept our Terms & Conditions?',
    },
    action: {
      buttons: [
        { type: 'reply', reply: { id: 'age_yes', title: 'Yes, I confirm' } },
        { type: 'reply', reply: { id: 'cancel', title: 'Cancel' } },
      ],
    },
  };
}

export interface InvoiceData {
  orderId: string;
  customerName: string;
  phone: string;
  items: { itemName: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  deliveryAddress: string;
  pincode: string;
  paymentType: string;
  exciseLicenseNumber?: string;
}

export function buildInvoiceText(data: InvoiceData): string {
  const lines = data.items
    .map(
      (i) =>
        `• ${i.itemName} ×${i.quantity} — ₹${(i.unitPrice * i.quantity).toFixed(0)}`,
    )
    .join('\n');
  const licenseLine = data.exciseLicenseNumber
    ? `\nExcise License: ${data.exciseLicenseNumber}`
    : '';
  return [
    `*ROYAL SPIRITS — TAX INVOICE*`,
    `Order #${data.orderId.slice(0, 8)}`,
    `Customer: ${data.customerName}`,
    `Phone: ${data.phone}`,
    `Address: ${data.deliveryAddress}, ${data.pincode}`,
    '',
    lines,
    '',
    `Subtotal: ₹${data.subtotal.toFixed(0)}`,
    `Delivery: ₹${data.deliveryCharge.toFixed(0)}`,
    `Total: ₹${data.totalAmount.toFixed(0)}`,
    `Payment: ${data.paymentType} on Delivery${licenseLine}`,
    '',
    RESPONSIBLE_DRINKING_DISCLAIMER,
  ].join('\n');
}

export function buildOrderConfirmation(
  orderId: string,
  total: number,
  items: { itemName: string; quantity: number; unitPrice: number }[],
): unknown {
  const lines = items
    .map((i) => `• ${i.itemName} ×${i.quantity}`)
    .join('\n');
  return {
    type: 'button',
    header: { type: 'text', text: 'Order Placed!' },
    body: {
      text: `Order #${orderId.slice(0, 8)}\n${lines}\n\nTotal: ₹${total.toFixed(0)}\n\nWe'll notify you when it's on the way. Payment: Cash on Delivery.`,
    },
    action: {
      buttons: [
        { type: 'reply', reply: { id: 'browse', title: 'Browse More' } },
        { type: 'reply', reply: { id: 'orders', title: 'My Orders' } },
      ],
    },
  };
}

interface OrderForList {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
  items: { itemName: string; quantity: number }[];
}

export function buildOrdersListWithActions(orders: OrderForList[]): unknown {
  if (orders.length === 0) {
    return {
      type: 'button',
      body: { text: 'You have no orders yet. Type "browse" to start shopping.' },
      action: {
        buttons: [{ type: 'reply', reply: { id: 'browse', title: 'Browse' } }],
      },
    };
  }
  const trackRows: InteractiveListRow[] = orders.map((o) => ({
    id: `track:${o.id}`,
    title: `#${o.id.slice(0, 8)} — ₹${o.totalAmount.toFixed(0)}`,
    description: `${o.status} · ${o.items.length} item(s)`,
  }));
  const cancellable = orders.filter((o) => o.status === 'Ordered');
  const sections = [{ title: 'Track an order', rows: trackRows }];
  if (cancellable.length > 0) {
    sections.push({
      title: 'Cancel an order (only before processing)',
      rows: cancellable.map((o) => ({
        id: `cancel_order:${o.id}`,
        title: `Cancel #${o.id.slice(0, 8)}`,
        description: `₹${o.totalAmount.toFixed(0)} · ${o.status}`,
      })),
    });
  }
  return {
    type: 'list',
    header: { type: 'text', text: 'Your Orders' },
    body: { text: 'Pick an order to track or cancel:' },
    footer: { text: '21+ only. Drink responsibly.' },
    action: {
      button: 'Select',
      sections,
    },
  };
}

interface OrderForDetail {
  id: string;
  status: string;
  paymentType: string;
  paymentStatus: string;
  totalAmount: number;
  subtotal: number;
  deliveryCharge: number;
  deliveryAddress: string;
  pincode: string;
  estimatedDeliveryAt: Date | null;
  createdAt: Date;
  items: { itemName: string; quantity: number; unitPrice: number }[];
}

export function buildOrderDetailText(o: OrderForDetail): string {
  const items = o.items
    .map((i) => `• ${i.itemName} ×${i.quantity} — ₹${(i.unitPrice * i.quantity).toFixed(0)}`)
    .join('\n');
  const eta = o.estimatedDeliveryAt
    ? new Date(o.estimatedDeliveryAt).toLocaleString()
    : '—';
  return [
    `*Order #${o.id.slice(0, 8)}*`,
    `Status: ${o.status}`,
    `Payment: ${o.paymentType} (${o.paymentStatus})`,
    `Placed: ${new Date(o.createdAt).toLocaleString()}`,
    `ETA: ${eta}`,
    '',
    items,
    '',
    `Subtotal: ₹${o.subtotal.toFixed(0)}`,
    `Delivery: ₹${o.deliveryCharge.toFixed(0)}`,
    `Total: ₹${o.totalAmount.toFixed(0)}`,
    `Address: ${o.deliveryAddress}, ${o.pincode}`,
  ].join('\n');
}

export function buildCancelConfirmation(orderId: string): unknown {
  return {
    type: 'button',
    header: { type: 'text', text: 'Order Cancelled' },
    body: {
      text: `Your order #${orderId.slice(0, 8)} has been cancelled. Type "orders" to view other orders or "browse" to shop again.`,
    },
    action: {
      buttons: [
        { type: 'reply', reply: { id: 'orders', title: 'My Orders' } },
        { type: 'reply', reply: { id: 'browse', title: 'Browse' } },
      ],
    },
  };
}
