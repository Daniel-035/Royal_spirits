import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { validatePincodeSchema, type PincodeValidation } from '@royal-spirits/shared';

export const cartRouter = Router();

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

cartRouter.post(
  '/validate-pincode',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { pincode } = validatePincodeSchema.parse(req.body);
      const zone = await prisma.serviceableZone.findFirst({
        where: { pincode, isActive: true },
      });

      if (!zone) {
        const result: PincodeValidation = {
          serviceable: false,
          message: 'Sorry, we do not deliver to this pincode.',
        };
        return res.json(result);
      }
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = parseTimeToMinutes(zone.deliveryStartTime);
      const endMinutes = parseTimeToMinutes(zone.deliveryEndTime);
      const withinHours = nowMinutes >= startMinutes && nowMinutes <= endMinutes;

      const result: PincodeValidation = {
        serviceable: true,
        deliveryStartTime: zone.deliveryStartTime,
        deliveryEndTime: zone.deliveryEndTime,
        withinHours,
        message: withinHours
          ? 'Delivery available to this pincode.'
          : `Delivery available to this pincode between ${zone.deliveryStartTime} and ${zone.deliveryEndTime}.`,
      };
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  },
);