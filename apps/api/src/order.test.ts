import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from './app';
import { prisma } from './config/prisma';

const app = createApp();

async function adminLogin(): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ username: 'admin', password: 'admin123' });
  return res.headers['set-cookie']?.[0] ?? '';
}

async function customerLogin(phone: string): Promise<string> {
  await request(app).post('/api/v1/auth/customer/otp/send').send({ phone });
  const otp = await prisma.otpCode.findFirst({
    where: { phone },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) throw new Error('OTP not found');
  const res = await request(app)
    .post('/api/v1/auth/customer/otp/verify')
    .send({ phone, code: otp.code, name: 'Test Customer' });
  return res.headers['set-cookie']?.[0] ?? '';
}

async function createProduct(cookie: string, name: string, stock: number) {
  const res = await request(app)
    .post('/api/v1/admin/products')
    .set('Cookie', cookie)
    .send({
      name,
      category: 'Whiskey',
      brand: 'OrderTest',
      volumeMl: 750,
      price: 1000,
      stockQty: stock,
    });
  return res.body.id;
}

async function ensureWideHoursZone(cookie: string, pincode: string) {
  const existing = await prisma.serviceableZone.findUnique({ where: { pincode } });
  if (existing) {
    return await prisma.serviceableZone.update({
      where: { pincode },
      data: { deliveryStartTime: '00:00', deliveryEndTime: '23:59', isActive: true },
    });
  }
  const res = await request(app)
    .post('/api/v1/admin/zones')
    .set('Cookie', cookie)
    .send({ pincode, deliveryStartTime: '00:00', deliveryEndTime: '23:59', isActive: true });
  return res.body;
}

describe('Order placement — happy path', () => {
  let adminCookie: string;
  let customerCookie: string;
  let productId: string;

  beforeAll(async () => {
    adminCookie = await adminLogin();
    await ensureWideHoursZone(adminCookie, '560001');
    productId = await createProduct(adminCookie, 'Order Happy Path Product', 10);
    customerCookie = await customerLogin('9000000001');
  });

  it('places an order successfully with snapshots', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Cookie', customerCookie)
      .send({
        items: [{ productId, quantity: 2 }],
        deliveryAddress: '123 MG Road, Bengaluru',
        pincode: '560001',
        ageConfirmed: true,
        tncAccepted: true,
        paymentType: 'Cash',
        customerName: 'Test Customer',
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Ordered');
    expect(res.body.paymentType).toBe('Cash');
    expect(res.body.paymentStatus).toBe('Unpaid');
    expect(res.body.customerName).toBe('Test Customer');
    expect(res.body.phone).toBe('9000000001');
    expect(res.body.totalAmount).toBe(2000);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].itemName).toBe('Order Happy Path Product');
    expect(res.body.items[0].unitPrice).toBe(1000);
    expect(res.body.ageConfirmed).toBe(true);
  });

  it('decrements stock after order', async () => {
    const res = await request(app).get('/api/v1/products');
    const product = res.body.data.find((p: { name: string }) => p.name === 'Order Happy Path Product');
    expect(product.stockQty).toBe(8);
  });

  it('lists the order in my orders', async () => {
    const res = await request(app).get('/api/v1/orders/my').set('Cookie', customerCookie);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].status).toBe('Ordered');
  });
});

describe('Order placement — rejection paths', () => {
  let adminCookie: string;
  let customerCookie: string;
  let productId: string;

  beforeAll(async () => {
    adminCookie = await adminLogin();
    await ensureWideHoursZone(adminCookie, '560001');
    productId = await createProduct(adminCookie, 'Order Reject Product', 5);
    customerCookie = await customerLogin('9000000002');
  });

  it('rejects bad pincode (not serviceable)', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Cookie', customerCookie)
      .send({
        items: [{ productId, quantity: 1 }],
        deliveryAddress: 'Test address 123',
        pincode: '999999',
        ageConfirmed: true,
        tncAccepted: true,
        paymentType: 'Cash',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/not serviceable/i);
  });

  it('rejects insufficient stock', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Cookie', customerCookie)
      .send({
        items: [{ productId, quantity: 50 }],
        deliveryAddress: 'Test address 123',
        pincode: '560001',
        ageConfirmed: true,
        tncAccepted: true,
        paymentType: 'Cash',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/stock/i);
  });

  it('rejects when tnc not accepted', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Cookie', customerCookie)
      .send({
        items: [{ productId, quantity: 1 }],
        deliveryAddress: 'Test address 123',
        pincode: '560001',
        ageConfirmed: true,
        tncAccepted: false,
        paymentType: 'Cash',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toBeDefined();
  });

  it('rejects without authentication', async () => {
    const res = await request(app).post('/api/v1/orders').send({
      items: [{ productId, quantity: 1 }],
      deliveryAddress: 'Test address 123',
      pincode: '560001',
      ageConfirmed: true,
      tncAccepted: true,
      paymentType: 'Cash',
    });
    expect(res.status).toBe(401);
  });
});

describe('Order ownership', () => {
  let adminCookie: string;
  let cookieA: string;
  let cookieB: string;
  let productId: string;
  let orderId: string;

  beforeAll(async () => {
    adminCookie = await adminLogin();
    await ensureWideHoursZone(adminCookie, '560001');
    productId = await createProduct(adminCookie, 'Ownership Test Product', 10);
    cookieA = await customerLogin('9000000003');
    cookieB = await customerLogin('9000000004');
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Cookie', cookieA)
      .send({
        items: [{ productId, quantity: 1 }],
        deliveryAddress: 'A address 123',
        pincode: '560001',
        ageConfirmed: true,
        tncAccepted: true,
        paymentType: 'Cash',
      });
    orderId = res.body.id;
  });

  it('allows owner to view own order', async () => {
    const res = await request(app).get(`/api/v1/orders/${orderId}`).set('Cookie', cookieA);
    expect(res.status).toBe(200);
  });

  it('forbids other customer from viewing order', async () => {
    const res = await request(app).get(`/api/v1/orders/${orderId}`).set('Cookie', cookieB);
    expect(res.status).toBe(403);
  });
});

describe('Admin order management', () => {
  let adminCookie: string;
  let customerCookie: string;
  let productId: string;
  let orderId: string;

  beforeAll(async () => {
    adminCookie = await adminLogin();
    await ensureWideHoursZone(adminCookie, '560001');
    productId = await createProduct(adminCookie, 'Admin Flow Product', 20);
    customerCookie = await customerLogin('9000000005');
    const res = await request(app)
      .post('/api/v1/orders')
      .set('Cookie', customerCookie)
      .send({
        items: [{ productId, quantity: 1 }],
        deliveryAddress: 'Admin flow address 123',
        pincode: '560001',
        ageConfirmed: true,
        tncAccepted: true,
        paymentType: 'Cash',
      });
    orderId = res.body.id;
  });

  it('lists orders (admin)', async () => {
    const res = await request(app).get('/api/v1/admin/orders').set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('gets order detail with all 10 data points (admin)', async () => {
    const res = await request(app).get(`/api/v1/admin/orders/${orderId}`).set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orderId);
    expect(res.body.customerName).toBe('Test Customer');
    expect(res.body.phone).toBe('9000000005');
    expect(res.body.paymentType).toBe('Cash');
    expect(res.body.paymentStatus).toBe('Unpaid');
    expect(res.body.deliveryAddress).toContain('Admin flow');
    expect(res.body.status).toBe('Ordered');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].itemName).toBe('Admin Flow Product');
    expect(res.body.items[0].quantity).toBe(1);
    expect(res.body.items[0].unitPrice).toBe(1000);
    expect(res.body.totalAmount).toBe(1000);
    expect(res.body.createdAt).toBeDefined();
  });

  it('transitions status Ordered -> Processing -> Delivered', async () => {
    const transitions = ['Processing', 'Delivered'];
    for (const status of transitions) {
      const res = await request(app)
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Cookie', adminCookie)
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
    }
  });

  it('auto-flips payment status to Paid on Delivered (Cash)', async () => {
    const res = await request(app).get(`/api/v1/admin/orders/${orderId}`).set('Cookie', adminCookie);
    expect(res.body.paymentStatus).toBe('Paid');
  });

  it('rejects invalid status transition (Delivered -> Processing)', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'Processing' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/transition/i);
  });

  it('admin can manually toggle payment status', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/orders/${orderId}/payment-status`)
      .set('Cookie', adminCookie)
      .send({ paymentStatus: 'Unpaid' });
    expect(res.status).toBe(200);
    expect(res.body.paymentStatus).toBe('Unpaid');
  });

  it('returns dashboard summary (admin)', async () => {
    const res = await request(app).get('/api/v1/admin/dashboard/summary').set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('todaysOrders');
    expect(res.body).toHaveProperty('pendingOrders');
    expect(res.body).toHaveProperty('revenue');
    expect(res.body).toHaveProperty('recentOrders');
  });
});

afterAll(async () => {
  const testCustomers = await prisma.customer.findMany({
    where: { phone: { startsWith: '9000000' } },
    select: { id: true },
  });
  if (testCustomers.length > 0) {
    await prisma.order.deleteMany({
      where: { customerId: { in: testCustomers.map((c) => c.id) } },
    });
    await prisma.customer.deleteMany({
      where: { id: { in: testCustomers.map((c) => c.id) } },
    });
  }
  await prisma.product.deleteMany({ where: { brand: 'OrderTest' } });
  await prisma.$disconnect();
});
