import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { badRequest } from '../../utils/errors';
import {
  createOrderSchema,
  DEFAULT_DELIVERY_CHARGE,
  type CreateOrder,
  type OrderSource,
} from '@royal-spirits/shared';

export interface CreateOrderInput {
  customerId: string;
  customerPhone: string;
  source: OrderSource;
  data: CreateOrder;
}

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export async function createOrder(input: CreateOrderInput) {
  const parsed = createOrderSchema.parse(input.data);
  const { customerId, customerPhone, source } = input;

  return prisma.$transaction(async (tx) => {
    const zone = await tx.serviceableZone.findFirst({
      where: { pincode: parsed.pincode, isActive: true },
    });
    if (!zone) {
      throw badRequest('This pincode is not serviceable.');
    }

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMin = parseTimeToMinutes(zone.deliveryStartTime);
    const endMin = parseTimeToMinutes(zone.deliveryEndTime);
    if (nowMinutes < startMin || nowMinutes > endMin) {
      throw badRequest(
        `Orders can only be placed between ${zone.deliveryStartTime} and ${zone.deliveryEndTime}.`,
      );
    }

    const productIds = parsed.items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });
    if (products.length !== productIds.length) {
      throw badRequest('One or more products are unavailable.');
    }

    const orderItemsData: {
      productId: string;
      itemName: string;
      quantity: number;
      unitPrice: number;
    }[] = [];
    let subtotal = 0;

    for (const item of parsed.items) {
      const product = products.find((p) => p.id === item.productId)!;
      if (item.quantity > product.stockQty) {
        throw badRequest(
          `Insufficient stock for ${product.name} (available: ${product.stockQty}).`,
        );
      }
      orderItemsData.push({
        productId: product.id,
        itemName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
      });
      subtotal += product.price * item.quantity;
    }

    for (const item of parsed.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.quantity } },
      });
    }

    const deliveryCharge = DEFAULT_DELIVERY_CHARGE;
    const totalAmount = subtotal + deliveryCharge;

    let customerName = parsed.customerName ?? '';
    if (!customerName) {
      const cust = await tx.customer.findUnique({ where: { id: customerId } });
      customerName = cust?.name ?? 'Customer';
    }
    if (parsed.customerName) {
      await tx.customer.update({
        where: { id: customerId },
        data: { name: parsed.customerName },
      });
    }

    const order = await tx.order.create({
      data: {
        customerId,
        customerName,
        phone: customerPhone,
        source,
        status: 'Ordered',
        paymentType: parsed.paymentType,
        paymentStatus: parsed.paymentType === 'Online' ? 'Unpaid' : 'Unpaid',
        deliveryAddress: parsed.deliveryAddress,
        pincode: parsed.pincode,
        subtotal,
        deliveryCharge,
        totalAmount,
        ageConfirmed: parsed.ageConfirmed,
        tncAccepted: parsed.tncAccepted,
        items: {
          create: orderItemsData,
        },
      },
      include: { items: true },
    });

    return order;
  });
}

export type CreateOrderResult = Prisma.PromiseReturnType<typeof createOrder>;
