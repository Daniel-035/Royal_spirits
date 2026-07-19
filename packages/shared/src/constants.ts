export const ORDER_STATUSES = [
  'Ordered',
  'Processing',
  'Delivered',
  'Cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_SOURCES = ['WEB', 'WHATSAPP'] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];

export const PAYMENT_TYPES = ['Cash', 'Online'] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_STATUSES = ['Paid', 'Unpaid'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const CATEGORIES = ['Whiskey', 'Beer', 'Wine', 'Vodka', 'Rum'] as const;
export type Category = (typeof CATEGORIES)[number];

export const API_BASE = '/api/v1';

export const API_PATHS = {
  health: `${API_BASE}/health`,
  auth: {
    customerOtpSend: `${API_BASE}/auth/customer/otp/send`,
    customerOtpVerify: `${API_BASE}/auth/customer/otp/verify`,
    adminLogin: `${API_BASE}/auth/admin/login`,
    adminMe: `${API_BASE}/auth/admin/me`,
  },
  products: {
    list: `${API_BASE}/products`,
    detail: (id: string) => `${API_BASE}/products/${id}`,
  },
  adminProducts: {
    create: `${API_BASE}/admin/products`,
    update: (id: string) => `${API_BASE}/admin/products/${id}`,
    stock: (id: string) => `${API_BASE}/admin/products/${id}/stock`,
    image: (id: string) => `${API_BASE}/admin/products/${id}/image`,
    delete: (id: string) => `${API_BASE}/admin/products/${id}`,
  },
  cart: {
    validatePincode: `${API_BASE}/cart/validate-pincode`,
  },
  orders: {
    create: `${API_BASE}/orders`,
    detail: (id: string) => `${API_BASE}/orders/${id}`,
    my: `${API_BASE}/orders/my`,
  },
  adminOrders: {
    list: `${API_BASE}/admin/orders`,
    detail: (id: string) => `${API_BASE}/admin/orders/${id}`,
    status: (id: string) => `${API_BASE}/admin/orders/${id}/status`,
  },
  adminZones: {
    list: `${API_BASE}/admin/zones`,
    detail: (id: string) => `${API_BASE}/admin/zones/${id}`,
  },
  adminDashboard: {
    summary: `${API_BASE}/admin/dashboard/summary`,
  },
} as const;

export const COOKIE_NAMES = {
  customer: 'rs_cust',
  admin: 'rs_admin',
} as const;

export const DEFAULT_DELIVERY_CHARGE = 0;

export const OTP_TTL_MINUTES = 5;
export const OTP_LENGTH = 6;

export const RESPONSIBLE_DRINKING_DISCLAIMER =
  'Drinking alcohol is injurious to health. Sale to minors (under 21) is prohibited. Please drink responsibly.';

export const DEFAULT_TNC_TEXT =
  'I accept the Terms & Conditions and confirm I am 21 years of age or older.';
