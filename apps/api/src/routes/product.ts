import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { requireAdmin } from '../middleware/requireAdmin';
import { imageService } from '../services/image';
import { badRequest, notFound } from '../utils/errors';
import {
  createProductSchema,
  updateProductSchema,
  stockUpdateSchema,
  productQuerySchema,
} from '@royal-spirits/shared';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(badRequest('Only image files are allowed'));
    }
  },
});

async function getProductOrThrow(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw notFound('Product not found');
  }
  return product;
}

export const productRouter = Router();

productRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = productQuerySchema.parse(req.query);
    const where: Prisma.ProductWhereInput = { isActive: true };
    if (query.category) where.category = query.category;
    if (query.brand) where.brand = query.brand;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { brand: { contains: query.search } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.product.count({ where }),
    ]);
    res.json({ data, total, page: query.page, pageSize: query.pageSize });
  } catch (err) {
    next(err);
  }
});

productRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await getProductOrThrow(req.params.id);
    if (!product.isActive) {
      return next(notFound('Product not found'));
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

export const adminProductRouter = Router();

adminProductRouter.use(requireAdmin);

adminProductRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = productQuerySchema.parse(req.query);
    const where: Prisma.ProductWhereInput = {};
    if (query.category) where.category = query.category;
    if (query.brand) where.brand = query.brand;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { brand: { contains: query.search } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.product.count({ where }),
    ]);
    res.json({ data, total, page: query.page, pageSize: query.pageSize });
  } catch (err) {
    next(err);
  }
});

adminProductRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createProductSchema.parse(req.body);
    const product = await prisma.product.create({ data });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

adminProductRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getProductOrThrow(req.params.id);
    const data = updateProductSchema.parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
    });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

adminProductRouter.patch(
  '/:id/stock',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getProductOrThrow(req.params.id);
      const { stockQty } = stockUpdateSchema.parse(req.body);
      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: { stockQty },
      });
      res.json(product);
    } catch (err) {
      next(err);
    }
  },
);

adminProductRouter.post(
  '/:id/image',
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await getProductOrThrow(req.params.id);
      if (!req.file) {
        return next(badRequest('Image file is required'));
      }
      const saved = await imageService.save(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
      );
      const updated = await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: saved.url },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

adminProductRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await getProductOrThrow(req.params.id);
      await prisma.product.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);
