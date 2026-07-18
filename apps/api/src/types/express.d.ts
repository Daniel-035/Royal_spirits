import type { AdminTokenPayload, CustomerTokenPayload } from '../utils/jwt';

declare module 'express-serve-static-core' {
  interface Request {
    admin?: AdminTokenPayload;
    customer?: CustomerTokenPayload;
  }
}

declare module 'express' {
  interface Request {
    admin?: AdminTokenPayload;
    customer?: CustomerTokenPayload;
  }
}
