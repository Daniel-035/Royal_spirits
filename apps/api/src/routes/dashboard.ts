import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { requireAdmin } from '../middleware/requireAdmin';

export const dashboardRouter = Router();

dashboardRouter.use(requireAdmin);

dashboardRouter.get(
  '/summary',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const [todaysOrders, pendingOrders, revenueResult] = await Promise.all([
        prisma.order.count({
          where: { createdAt: { gte: startOfDay, lt: endOfDay } },
        }),
        prisma.order.count({
          where: { status: { in: ['Ordered', 'Processing'] } },
        }),
        prisma.order.aggregate({
          where: { status: { not: 'Cancelled' } },
          _sum: { totalAmount: true },
        }),
      ]);

      const recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: true, customer: true },
      });

      res.json({
        todaysOrders,
        pendingOrders,
        revenue: revenueResult._sum.totalAmount ?? 0,
        recentOrders,
      });
    } catch (err) {
      next(err);
    }
  },
);
