import { prisma } from '../../config/prisma';
import { whatsappService } from './index';
import {
  buildMainMenu,
  buildCategoryList,
  buildProductList,
  buildCartSummary,
  buildAddressPrompt,
  buildNamePrompt,
  buildAgeConfirmation,
  buildOrderConfirmation,
  buildInvoiceText,
  buildOrdersListWithActions,
  buildOrderDetailText,
  buildCancelConfirmation,
} from './templates';
import { createOrder } from '../order/createOrder';
import { cancelOrder } from '../order/cancelOrder';
import { getLLMService, type IntentResult } from '../llm';
import { env } from '../../config/env';
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

function sanitizeName(raw: string): string | null {
  const name = raw.replace(/[<>{}[\]\\]/g, '').trim();
  if (name.length < 2 || name.length > 100) return null;
  return name;
}

export async function handleInbound(message: InboundMessage): Promise<void> {
  const phone = message.from;
  const session = await prisma.whatsAppSession.upsert({
    where: { phone },
    update: { lastIntentAt: new Date() },
    create: { phone },
  });

  if (session.handoffToAdminId) {
    return;
  }

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

  if (replyId.startsWith('track:')) {
    await routeTrack(phone, replyId.slice(6));
    return;
  }

  if (replyId.startsWith('cancel_order:')) {
    await routeCancelOrder(phone, replyId.slice(13));
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
    case 'NAME':
      await routeName(phone, text);
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

  if (text && !replyId) {
    const dispatched = await dispatchLlmIntent(phone, text);
    if (dispatched) return;
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

  if (_text && !replyId) {
    const dispatched = await dispatchLlmIntent(phone, _text);
    if (dispatched) return;
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

  if (_text && !replyId) {
    const dispatched = await dispatchLlmIntent(phone, _text);
    if (dispatched) return;
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
      state: 'NAME',
      contextJson: JSON.stringify({ address: parsed.address, pincode: parsed.pincode }),
    },
  });
  await whatsappService.sendInteractive(phone, buildNamePrompt());
}

async function routeName(phone: string, text: string): Promise<void> {
  const name = sanitizeName(text);
  if (!name) {
    await whatsappService.sendText(
      phone,
      'Please reply with a valid name (2–100 characters).',
    );
    return;
  }
  await prisma.whatsAppSession.update({
    where: { phone },
    data: { customerName: name, state: 'AGE_CONFIRM' },
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

  const customerName = session!.customerName ?? 'Customer';

  const customer = await prisma.customer.upsert({
    where: { phone },
    update: { name: customerName },
    create: { phone, name: customerName },
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
        customerName,
      },
    });

    await prisma.whatsAppSession.update({
      where: { phone },
      data: { state: 'DONE', cartJson: '[]', contextJson: '{}' },
    });

    const { subtotal, deliveryCharge } = cartTotal(cart);
    const invoice = buildInvoiceText({
      orderId: order.id,
      customerName,
      phone,
      items: cart,
      subtotal,
      deliveryCharge,
      totalAmount: order.totalAmount,
      deliveryAddress: context.address,
      pincode: context.pincode,
      paymentType: order.paymentType,
      exciseLicenseNumber: env.exciseLicenseNumber || undefined,
    });
    await whatsappService.sendText(phone, invoice);
    await whatsappService.sendInteractive(phone, buildOrderConfirmation(order.id, order.totalAmount, cart));
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
    await whatsappService.sendInteractive(
      phone,
      buildOrdersListWithActions([]),
    );
    return;
  }
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { items: true },
  });
  await whatsappService.sendInteractive(
    phone,
    buildOrdersListWithActions(
      orders.map((o) => ({
        id: o.id,
        status: o.status,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        items: o.items.map((i) => ({ itemName: i.itemName, quantity: i.quantity })),
      })),
    ),
  );
  await prisma.whatsAppSession.update({
    where: { phone },
    data: { state: 'GREETING' },
  });
}

async function routeTrack(phone: string, orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.phone !== phone) {
    await whatsappService.sendText(
      phone,
      'That order could not be found for your number. Type "orders" to see your orders.',
    );
    return;
  }
  await whatsappService.sendText(phone, buildOrderDetailText(order));
  await prisma.whatsAppSession.update({
    where: { phone },
    data: { state: 'GREETING' },
  });
}

async function routeCancelOrder(phone: string, orderId: string): Promise<void> {
  try {
    const updated = await cancelOrder({ phone, orderId });
    await whatsappService.sendInteractive(phone, buildCancelConfirmation(updated.id));
    await prisma.whatsAppSession.update({
      where: { phone },
      data: { state: 'GREETING' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not cancel the order.';
    await whatsappService.sendText(phone, message);
  }
}

async function dispatchLlmIntent(phone: string, text: string): Promise<boolean> {
  let result: IntentResult;
  try {
    result = await getLLMService().detectIntent(text);
  } catch (err) {
    console.error('[llm] intent detection failed, falling back:', err);
    return false;
  }

  switch (result.intent) {
    case 'browse':
      await prisma.whatsAppSession.update({
        where: { phone },
        data: { state: 'BROWSE' },
      });
      await whatsappService.sendInteractive(phone, buildCategoryList());
      return true;
    case 'orders':
      await sendRecentOrders(phone);
      return true;
    case 'track':
      await sendRecentOrders(phone);
      return true;
    case 'cancel':
      await sendRecentOrders(phone);
      return true;
    case 'help':
      await whatsappService.sendText(
        phone,
        'Our team will reach out shortly. For urgent help, call us during business hours.',
      );
      return true;
    case 'product_search':
      await routeProductSearch(phone, result.entities);
      return true;
    case 'unknown':
    default:
      return false;
  }
}

async function routeProductSearch(
  phone: string,
  entities: { category?: string; maxPrice?: number; query?: string } | undefined,
): Promise<void> {
  const where: {
    isActive?: boolean;
    stockQty?: { gt: number };
    category?: string;
    price?: { lte?: number };
    OR?: Array<{ name?: { contains: string } | { contains: string; mode: 'insensitive' } }>;
  } = { isActive: true, stockQty: { gt: 0 } };

  if (entities?.category) {
    const cat = entities.category.charAt(0).toUpperCase() + entities.category.slice(1).toLowerCase();
    if (CATEGORIES.includes(cat as never)) {
      where.category = cat;
    }
  }
  if (entities?.maxPrice) {
    where.price = { lte: entities.maxPrice };
  }
  if (entities?.query) {
    where.OR = [{ name: { contains: entities.query, mode: 'insensitive' } }];
  }

  const products = await prisma.product.findMany({
    where,
    take: 10,
    orderBy: { price: 'asc' },
  });

  if (products.length === 0) {
    await whatsappService.sendText(
      phone,
      'No products match your search. Try a different category or price.',
    );
    await whatsappService.sendInteractive(phone, buildCategoryList());
    return;
  }

  const category = where.category ?? 'Search Results';
  await prisma.whatsAppSession.update({
    where: { phone },
    data: { state: 'PRODUCT_LIST', contextJson: JSON.stringify({ category: where.category ?? '' }) },
  });
  await whatsappService.sendInteractive(phone, buildProductList(category, products));
}
