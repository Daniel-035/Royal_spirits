import { prisma } from '../../config/prisma';
import { badRequest, notFound, forbidden } from '../../utils/errors';
import { orderEvents } from './orderEvents';

export interface CancelOrderInput {
  phone: string;
  orderId: string;
}

export async function cancelOrder(input: CancelOrderInput) {
  const { phone, orderId } = input;

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw notFound('Order not found');
    }
    if (order.phone !== phone) {
      throw forbidden('You can only cancel your own orders');
    }
    if (order.status !== 'Ordered') {
      throw badRequest(
        `This order is already ${order.status.toLowerCase()} and can no longer be cancelled. Reply "help" to contact support.`,
      );
    }

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: item.quantity } },
      });
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: 'Cancelled' },
      include: { items: true },
    });

    orderEvents.announceUpdate({
      id: updated.id,
      customerName: updated.customerName,
      phone: updated.phone,
      source: updated.source,
      status: updated.status,
      paymentType: updated.paymentType,
      paymentStatus: updated.paymentStatus,
      totalAmount: updated.totalAmount,
      createdAt: updated.createdAt,
    });

    return updated;
  });
}

