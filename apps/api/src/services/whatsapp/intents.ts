import { prisma } from '../../config/prisma';
import { whatsappService } from './index';
import {
  buildMainMenu,
  buildCategoryList,
  buildProductList,
  buildCartSummary,
  buildAddressPrompt,
  buildAgeConfirmation,
  buildOrderConfirmation,
} from './templates';
import { createOrder } from '../order/createOrder';
import { CATEGORIES, DEFAULT_DELIVERY_CHARGE } from '@royal-spirits/shared';

export interface CartItem {
  productId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export interface InboundMessage {
  from: string;
  type: 'text' | 'interactive' | 'button' | 'unsupported';
  text?: string;
  interactiveId?: string;
}

function readCart(session: { cartJson: string }): CartItem[] {
  try {
    return JSON.parse(session.cartJson) as CartItem[];
  } catch {
    return [];
  }
}

function writeCart(cart: CartItem[]): string {
  return JSON.stringify(cart);
}

function parseAddressAndPincode(raw: string): { address: string; pincode: string } | null {
  const match = raw.match(/(\d{6})\s*$/);
  if (!match) return null;
  const pincode = match[1];
  const address = raw.replace(/\s*\d{6}\s*$/, '').trim();
  if (address.length < 5) return null;
  return { address, pincode };
}

function cartTotal(cart: CartItem[]): { subtotal: number; deliveryCharge: number } {
  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  return { subtotal, deliveryCharge: DEFAULT_DELIVERY_CHARGE };
}

export async function handleInbound(message: InboundMessage): Promise<void> {
  const phone = message.from;
  const session = await prisma.whatsAppSession.upsert({
    where: { phone },
    update: { lastIntentAt: new Date() },
    create: { phone },
  });

  const text = (message.text ?? '').trim();
  const replyId = message.interactiveId ?? '';

  if (replyId === 'cancel' || /^(cancel|stop|exit)$/i.test(text)) {
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { state: 'GREETING', cartJson: '[]', contextJson: '{}' },
    });
    await whatsappService.sendText(phone, 'Your order has been cancelled. Type "hi" to start again.');
    return;
  }

  if (replyId === 'clear_cart') {
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { cartJson: '[]', state: 'BROWSE' },
    });
    await whatsappService.sendText(phone, 'Cart cleared.');
    await whatsappService.sendInteractive(phone, buildCategoryList());
    return;
  }

  switch (session.state) {
    case 'GREETING':
    case 'DONE':
      await routeGreeting(phone, text, replyId);
      break;
    case 'BROWSE':
      await routeBrowse(phone, text, replyId);
      break;
    case 'PRODUCT_LIST':
      await routeProductList(phone, text, replyId, session.contextJson);
      break;
    case 'CART':
      await routeCart(phone, replyId);
      break;
    case 'ADDRESS':
      await routeAddress(phone, text);
      break;
    case 'AGE_CONFIRM':
      await routeAgeConfirm(phone, replyId);
      break;
    default:
      await prisma.whatsAppSession.update({
        where: { phone },
        data: { state: 'GREETING' },
      });
      await whatsappService.sendInteractive(phone, buildMainMenu());
  }
}

async function routeGreeting(phone: string, text: string, replyId: string): Promise<void> {
  const trigger = replyId === 'browse' || /^(hi|hello|hey|start|menu|browse)$/i.test(text);
  if (trigger || replyId === 'browse') {
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { state: 'BROWSE' },
    });
    await whatsappService.sendInteractive(phone, buildCategoryList());
    return;
  }
  if (replyId === 'orders') {
    await sendRecentOrders(phone);
    return;
  }
  if (replyId === 'help') {
    await whatsappService.sendText(
      phone,
      'Our team will reach out shortly. For urgent help, call us during business hours.',
    );
    return;
  }
  await whatsappService.sendInteractive(phone, buildMainMenu());
}

async function routeBrowse(phone: string, _text: string, replyId: string): Promise<void> {
  if (replyId.startsWith('cat:')) {
    const category = replyId.slice(4);
    if (!CATEGORIES.includes(category as never)) {
      await whatsappService.sendText(phone, 'Invalid category. Please pick from the list.');
      await whatsappService.sendInteractive(phone, buildCategoryList());
      return;
    }
    const products = await prisma.product.findMany({
      where: { category, isActive: true, stockQty: { gt: 0 } },
      take: 10,
      orderBy: { price: 'asc' },
    });
    if (products.length === 0) {
      await whatsappService.sendText(phone, `No ${category} products in stock right now.`);
      await whatsappService.sendInteractive(phone, buildCategoryList());
      return;
    }
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { state: 'PRODUCT_LIST', contextJson: JSON.stringify({ category }) },
    });
    await whatsappService.sendInteractive(phone, buildProductList(category, products));
    return;
  }
  await whatsappService.sendInteractive(phone, buildCategoryList());
}

async function routeProductList(
  phone: string,
  _text: string,
  replyId: string,
  contextJson: string,
): Promise<void> {
  if (replyId.startsWith('prod:')) {
    const productId = replyId.slice(5);
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive || product.stockQty <= 0) {
      await whatsappService.sendText(phone, 'That product is unavailable. Please pick another.');
      return;
    }
    const session = await prisma.whatsAppSession.findUnique({ where: { phone } });
    const cart = readCart(session!);
    const existing = cart.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        productId: product.id,
        itemName: product.name,
        quantity: 1,
        unitPrice: product.price,
      });
    }
    const { subtotal, deliveryCharge } = cartTotal(cart);
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { state: 'CART', cartJson: writeCart(cart) },
    });
    await whatsappService.sendInteractive(
      phone,
      buildCartSummary(cart, subtotal, deliveryCharge),
    );
    return;
  }
  if (replyId === 'browse') {
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { state: 'BROWSE' },
    });
    await whatsappService.sendInteractive(phone, buildCategoryList());
    return;
  }
  let category = '';
  try {
    category = (JSON.parse(contextJson) as { category?: string }).category ?? '';
  } catch {
    category = '';
  }
  const products = await prisma.product.findMany({
    where: { category, isActive: true, stockQty: { gt: 0 } },
    take: 10,
    orderBy: { price: 'asc' },
  });
  await whatsappService.sendInteractive(phone, buildProductList(category, products));
}

async function routeCart(phone: string, replyId: string): Promise<void> {
  if (replyId === 'checkout') {
    const session = await prisma.whatsAppSession.findUnique({ where: { phone } });
    const cart = readCart(session!);
    if (cart.length === 0) {
      await whatsappService.sendText(phone, 'Your cart is empty.');
      await whatsappService.sendInteractive(phone, buildCategoryList());
      return;
    }
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { state: 'ADDRESS' },
    });
    await whatsappService.sendInteractive(phone, buildAddressPrompt());
    return;
  }
  if (replyId === 'browse') {
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { state: 'BROWSE' },
    });
    await whatsappService.sendInteractive(phone, buildCategoryList());
    return;
  }
  await whatsappService.sendInteractive(phone, buildCategoryList());
}

async function routeAddress(phone: string, text: string): Promise<void> {
  const parsed = parseAddressAndPincode(text);
  if (!parsed) {
    await whatsappService.sendText(
      phone,
      'Please include a full address and a 6-digit pincode.\n\nExample:\n12 MG Road, Indiranagar\n560038',
    );
    return;
  }
  const zone = await prisma.serviceableZone.findFirst({
    where: { pincode: parsed.pincode, isActive: true },
  });
  if (!zone) {
    await whatsappService.sendText(
      phone,
      `Sorry, we don't deliver to pincode ${parsed.pincode}. Please try a serviceable pincode.`,
    );
    return;
  }
  await prisma.whatsAppSession.update({
    where: { phone },
    data: {
      state: 'AGE_CONFIRM',
      contextJson: JSON.stringify({ address: parsed.address, pincode: parsed.pincode }),
    },
  });
  await whatsappService.sendInteractive(phone, buildAgeConfirmation());
}

async function routeAgeConfirm(phone: string, replyId: string): Promise<void> {
  if (replyId !== 'age_yes') {
    await whatsappService.sendText(
      phone,
      'Order cannot proceed without age confirmation. Type "hi" to start over.',
    );
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { state: 'GREETING', cartJson: '[]', contextJson: '{}' },
    });
    return;
  }

  const session = await prisma.whatsAppSession.findUnique({ where: { phone } });
  const cart = readCart(session!);
  if (cart.length === 0) {
    await whatsappService.sendText(phone, 'Your cart is empty.');
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { state: 'GREETING' },
    });
    return;
  }

  let context: { address?: string; pincode?: string } = {};
  try {
    context = JSON.parse(session!.contextJson) as typeof context;
  } catch {
    context = {};
  }
  if (!context.address || !context.pincode) {
    await whatsappService.sendText(phone, 'Session expired. Type "hi" to start again.');
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { state: 'GREETING', cartJson: '[]', contextJson: '{}' },
    });
    return;
  }

  const customer = await prisma.customer.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });

  try {
    const order = await createOrder({
      customerId: customer.id,
      customerPhone: phone,
      source: 'WHATSAPP',
      data: {
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: context.address,
        pincode: context.pincode,
        ageConfirmed: true,
        tncAccepted: true,
        paymentType: 'Cash',
      },
    });

    await prisma.whatsAppSession.update({
      where: { phone },
      data: { state: 'DONE', cartJson: '[]', contextJson: '{}' },
    });

    await whatsappService.sendInteractive(
      phone,
      buildOrderConfirmation(order.id, order.totalAmount, cart),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Order could not be placed.';
    await whatsappService.sendText(phone, `Order failed: ${message}`);
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { state: 'CART' },
    });
    const session2 = await prisma.whatsAppSession.findUnique({ where: { phone } });
    const cart2 = readCart(session2!);
    const { subtotal, deliveryCharge } = cartTotal(cart2);
    await whatsappService.sendInteractive(
      phone,
      buildCartSummary(cart2, subtotal, deliveryCharge),
    );
  }
}

async function sendRecentOrders(phone: string): Promise<void> {
  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) {
    await whatsappService.sendText(phone, 'You have no orders yet. Type "browse" to start shopping.');
    return;
  }
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { items: true },
  });
  if (orders.length === 0) {
    await whatsappService.sendText(phone, 'You have no orders yet. Type "browse" to start shopping.');
    return;
  }
  const lines = orders.map(
    (o) => `• #${o.id.slice(0, 8)} — ₹${o.totalAmount.toFixed(0)} — ${o.status}`,
  );
  await whatsappService.sendText(
    phone,
    `Your recent orders:\n${lines.join('\n')}\n\nType "browse" to shop again.`,
  );
  await prisma.whatsAppSession.update({
    where: { phone },
    data: { state: 'GREETING' },
  });
}
