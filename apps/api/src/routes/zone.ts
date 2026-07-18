import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { requireAdmin } from '../middleware/requireAdmin';
import { notFound, conflict } from '../utils/errors';
import { createZoneSchema, updateZoneSchema } from '@royal-spirits/shared';

export const zoneRouter = Router();

zoneRouter.get('/', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const zones = await prisma.serviceableZone.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(zones);
  } catch (err) {
    next(err);
  }
});

zoneRouter.post('/', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createZoneSchema.parse(req.body);
    const existing = await prisma.serviceableZone.findUnique({
      where: { pincode: data.pincode },
    });
    if (existing) {
      return next(conflict('Pincode already exists'));
    }
    const zone = await prisma.serviceableZone.create({ data });
    res.status(201).json(zone);
  } catch (err) {
    next(err);
  }
});

zoneRouter.put('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.serviceableZone.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      return next(notFound('Zone not found'));
    }
    const data = updateZoneSchema.parse(req.body);
    if (data.pincode && data.pincode !== existing.pincode) {
      const dup = await prisma.serviceableZone.findUnique({
        where: { pincode: data.pincode },
      });
      if (dup) {
        return next(conflict('Pincode already exists'));
      }
    }
    const zone = await prisma.serviceableZone.update({
      where: { id: req.params.id },
      data,
    });
    res.json(zone);
  } catch (err) {
    next(err);
  }
});

zoneRouter.delete('/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.serviceableZone.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      return next(notFound('Zone not found'));
    }
    await prisma.serviceableZone.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
