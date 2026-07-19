import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { requireCustomer } from '../middleware/requireCustomer';
import { requireAdmin } from '../middleware/requireAdmin';
import { notificationService } from '../services/notifications';
import { whatsappService } from '../services/whatsapp';
import { createOrder } from '../services/order/createOrder';
import { badRequest, notFound, forbidden } from '../utils/errors';
import {
  orderListQuerySchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  allowedStatusTransitions,
  type OrderStatus,
  type PaymentStatus,
} from '@royal-spirits/shared';

export const orderRouter = Router();

orderRouter.post(
  '/',
  requireCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await createOrder({
        customerId: req.customer!.sub,
        customerPhone: req.customer!.phone,
        source: 'WEB',
        data: req.body,
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
      if (query.source) where.source = query.source;
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

      notificationService
        .sendStatusUpdate(order.phone, updated.id, status)
        .catch((e) => console.error('Notification failed:', e));

      whatsappService
        .sendText(
          order.phone,
          `Your Royal Spirits order #${updated.id.slice(0, 8)} is now: ${status}.`,
        )
        .catch((e) => console.error('WhatsApp notification failed:', e));

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
