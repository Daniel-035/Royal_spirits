import express from 'express';
import type { Request } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'node:path';
import { env } from './config/env';
import { API_BASE } from '@royal-spirits/shared';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { customerAuthRouter } from './routes/customerAuth';
import { productRouter, adminProductRouter } from './routes/product';
import { zoneRouter } from './routes/zone';
import { cartRouter } from './routes/cart';
import { orderRouter, adminOrderRouter } from './routes/order';
import { dashboardRouter } from './routes/dashboard';
import { whatsappRouter } from './routes/whatsapp';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(
    express.json({
      limit: '1mb',
      verify: (req: Request, _res, buf) => {
        (req as Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  if (env.nodeEnv === 'development') {
    app.use(morgan('dev'));
  }

  const uploadsDir = path.resolve(process.cwd(), env.imageUploadDir);
  app.use(env.imagePublicBase, express.static(uploadsDir));

  app.use(API_BASE, healthRouter);
  app.use(`${API_BASE}/auth`, authRouter);
  app.use(`${API_BASE}/auth/customer`, customerAuthRouter);
  app.use(`${API_BASE}/products`, productRouter);
  app.use(`${API_BASE}/admin/products`, adminProductRouter);
  app.use(`${API_BASE}/admin/zones`, zoneRouter);
  app.use(`${API_BASE}/admin/orders`, adminOrderRouter);
  app.use(`${API_BASE}/admin/dashboard`, dashboardRouter);
  app.use(`${API_BASE}/cart`, cartRouter);
  app.use(`${API_BASE}/orders`, orderRouter);
  app.use(`${API_BASE}/whatsapp`, whatsappRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
