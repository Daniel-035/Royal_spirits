import { CATEGORIES } from '@royal-spirits/shared';
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
      ],
    },
  };
}
