import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { requireCustomer } from '../middleware/requireCustomer';
import { requireAdmin } from '../middleware/requireAdmin';
import { notificationService } from '../services/notifications';
import { badRequest, notFound, forbidden } from '../utils/errors';
import {
  createOrderSchema,
  orderListQuerySchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  allowedStatusTransitions,
  DEFAULT_DELIVERY_CHARGE,
  type OrderStatus,
  type PaymentStatus,
} from '@royal-spirits/shared';

export const orderRouter = Router();

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

orderRouter.post(
  '/',
  requireCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createOrderSchema.parse(req.body);
      const customerId = req.customer!.sub;
      const customerPhone = req.customer!.phone;

      const result = await prisma.$transaction(async (tx) => {
        const zone = await tx.serviceableZone.findFirst({
          where: { pincode: input.pincode, isActive: true },
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

        const productIds = input.items.map((i) => i.productId);
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

        for (const item of input.items) {
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

        for (const item of input.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQty: { decrement: item.quantity } },
          });
        }

        const deliveryCharge = DEFAULT_DELIVERY_CHARGE;
        const totalAmount = subtotal + deliveryCharge;

        let customerName = input.customerName ?? '';
        if (!customerName) {
          const cust = await tx.customer.findUnique({ where: { id: customerId } });
          customerName = cust?.name ?? 'Customer';
        }
        if (input.customerName) {
          await tx.customer.update({
            where: { id: customerId },
            data: { name: input.customerName },
          });
        }

        const order = await tx.order.create({
          data: {
            customerId,
            customerName,
            phone: customerPhone,
            status: 'Ordered',
            paymentType: input.paymentType,
            paymentStatus: input.paymentType === 'Online' ? 'Unpaid' : 'Unpaid',
            deliveryAddress: input.deliveryAddress,
            pincode: input.pincode,
            subtotal,
            deliveryCharge,
            totalAmount,
            ageConfirmed: input.ageConfirmed,
            tncAccepted: input.tncAccepted,
            items: {
              create: orderItemsData,
            },
          },
          include: { items: true },
        });

        return order;
      });

      res.status(201).json(result);

      notificationService
        .sendOrderConfirmation(req.customer!.phone, result.id, result.totalAmount)
        .catch((e) => console.error('Notification failed:', e));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return next(badRequest('Order could not be created.'));
      }
      next(err);
    }
  },
);

orderRouter.get(
  '/my',
  requireCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await prisma.order.findMany({
        where: { customerId: req.customer!.sub },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json(orders);
    } catch (err) {
      next(err);
    }
  },
);

orderRouter.get(
  '/:id',
  requireCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { items: true },
      });
      if (!order) {
        return next(notFound('Order not found'));
      }
      if (order.customerId !== req.customer!.sub) {
        return next(forbidden('You can only view your own orders'));
      }
      res.json(order);
    } catch (err) {
      next(err);
    }
  },
);

export const adminOrderRouter = Router();

adminOrderRouter.use(requireAdmin);

adminOrderRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = orderListQuerySchema.parse(req.query);
      const where: Prisma.OrderWhereInput = {};
      if (query.status) where.status = query.status;
      if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
      if (query.paymentType) where.paymentType = query.paymentType;
      if (query.date) {
        const day = new Date(query.date);
        const next = new Date(day);
        next.setDate(next.getDate() + 1);
        where.createdAt = { gte: day, lt: next };
      }
      if (query.search) {
        where.OR = [
          { id: { contains: query.search } },
          { customerName: { contains: query.search } },
          { phone: { contains: query.search } },
          { deliveryAddress: { contains: query.search } },
        ];
      }
      const [data, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: { items: true },
          orderBy: { createdAt: 'desc' },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        prisma.order.count({ where }),
      ]);
      res.json({ data, total, page: query.page, pageSize: query.pageSize });
    } catch (err) {
      next(err);
    }
  },
);

adminOrderRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { items: true },
      });
      if (!order) {
        return next(notFound('Order not found'));
      }
      res.json(order);
    } catch (err) {
      next(err);
    }
  },
);

adminOrderRouter.patch(
  '/:id/status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = updateOrderStatusSchema.parse(req.body);
      const order = await prisma.order.findUnique({ where: { id: req.params.id } });
      if (!order) {
        return next(notFound('Order not found'));
      }
      const allowed = allowedStatusTransitions[order.status] ?? [];
      if (!allowed.includes(status)) {
        return next(
          badRequest(`Cannot transition from "${order.status}" to "${status}".`),
        );
      }

      const updateData: Prisma.OrderUpdateInput = {
        status: status as OrderStatus,
      };

      if (status === 'Delivered' && order.paymentType === 'Cash') {
        updateData.paymentStatus = 'Paid' as PaymentStatus;
      }

      const updated = await prisma.order.update({
        where: { id: req.params.id },
        data: updateData,
        include: { items: true },
      });

      if (status === 'Delivered') {
        notificationService
          .sendStatusUpdate(order.phone, updated.id, status)
          .catch((e) => console.error('Notification failed:', e));
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

adminOrderRouter.patch(
  '/:id/payment-status',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { paymentStatus } = updatePaymentStatusSchema.parse(req.body);
      const order = await prisma.order.findUnique({ where: { id: req.params.id } });
      if (!order) {
        return next(notFound('Order not found'));
      }
      const updated = await prisma.order.update({
        where: { id: req.params.id },
        data: { paymentStatus: paymentStatus as PaymentStatus },
        include: { items: true },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);
