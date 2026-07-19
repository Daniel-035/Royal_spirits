import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from './app';
import { prisma } from './config/prisma';
import { cancelOrder } from './services/order/cancelOrder';
import { MockLLMService } from './services/llm';

const app = createApp();

async function adminLogin(): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ username: 'admin', password: 'admin123' });
  return res.headers['set-cookie']?.[0] ?? '';
}

async function customerLogin(phone: string, name: string): Promise<string> {
  await request(app).post('/api/v1/auth/customer/otp/send').send({ phone });
  const otp = await prisma.otpCode.findFirst({
    where: { phone },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) throw new Error('OTP not found');
  const res = await request(app)
    .post('/api/v1/auth/customer/otp/verify')
    .send({ phone, code: otp.code, name });
  return res.headers['set-cookie']?.[0] ?? '';
}

async function createProduct(cookie: string, name: string, stock: number) {
  const res = await request(app)
    .post('/api/v1/admin/products')
    .set('Cookie', cookie)
    .send({
      name,
      category: 'Whiskey',
      brand: 'CancelTest',
      volumeMl: 750,
      price: 1000,
      stockQty: stock,
    });
  return res.body.id;
}

async function ensureWideHoursZone(cookie: string, pincode: string) {
  const existing = await prisma.serviceableZone.findUnique({ where: { pincode } });
  if (existing) {
    await prisma.serviceableZone.update({
      where: { pincode },
      data: { deliveryStartTime: '00:00', deliveryEndTime: '23:59', isActive: true },
    });
    return;
  }
  await request(app)
    .post('/api/v1/admin/zones')
    .set('Cookie', cookie)
    .send({ pincode, deliveryStartTime: '00:00', deliveryEndTime: '23:59', isActive: true });
}

describe('cancelOrder service', () => {
  let adminCookie: string;
  let customerCookie: string;
  let productId: string;
  let orderId: string;
  const phone = '9000000101';
  const pincode = '560101';

  beforeAll(async () => {
    adminCookie = await adminLogin();
    await ensureWideHoursZone(adminCookie, pincode);
    productId = await createProduct(adminCookie, 'Cancel Test Product', 10);
    customerCookie = await customerLogin(phone, 'Cancel Tester');

    const res = await request(app)
      .post('/api/v1/orders')
      .set('Cookie', customerCookie)
      .send({
        items: [{ productId, quantity: 3 }],
        deliveryAddress: '45 Cancel Street',
        pincode,
        ageConfirmed: true,
        tncAccepted: true,
        paymentType: 'Cash',
        customerName: 'Cancel Tester',
      });
    orderId = res.body.id;
  });

  it('rejects cancellation by a different phone (ownership)', async () => {
    await expect(cancelOrder({ phone: '9000000999', orderId })).rejects.toThrow(
      /own orders/i,
    );
  });

  it('cancels an Ordered order and restocks', async () => {
    const productBefore = await prisma.product.findUnique({ where: { id: productId } });
    expect(productBefore?.stockQty).toBe(7);

    const updated = await cancelOrder({ phone, orderId });
    expect(updated.status).toBe('Cancelled');

    const productAfter = await prisma.product.findUnique({ where: { id: productId } });
    expect(productAfter?.stockQty).toBe(10);
  });

  it('rejects cancelling an already-cancelled order', async () => {
    await expect(cancelOrder({ phone, orderId })).rejects.toThrow(
      /already cancelled/i,
    );
  });

  it('rejects cancelling a non-existent order', async () => {
    await expect(
      cancelOrder({ phone, orderId: '00000000-0000-0000-0000-000000000000' }),
    ).rejects.toThrow(/not found/i);
  });
});

describe('MockLLMService intent detection', () => {
  const llm = new MockLLMService();

  it('detects browse intent from greeting', async () => {
    const result = await llm.detectIntent('hi there');
    expect(result.intent).toBe('browse');
  });

  it('detects orders intent', async () => {
    const result = await llm.detectIntent('show me my orders');
    expect(result.intent).toBe('orders');
  });

  it('detects track intent', async () => {
    const result = await llm.detectIntent('where is my order');
    expect(result.intent).toBe('orders');
  });

  it('detects cancel intent', async () => {
    const result = await llm.detectIntent('I want to cancel my order');
    expect(result.intent).toBe('cancel');
  });

  it('detects help intent', async () => {
    const result = await llm.detectIntent('I need to talk to a human');
    expect(result.intent).toBe('help');
  });

  it('detects product_search with category and price', async () => {
    const result = await llm.detectIntent('show me whiskey under 2000');
    expect(result.intent).toBe('product_search');
    expect(result.entities?.category).toBe('whiskey');
    expect(result.entities?.maxPrice).toBe(2000);
  });

  it('returns unknown for unclassifiable text', async () => {
    const result = await llm.detectIntent('xyzzy florp');
    expect(result.intent).toBe('unknown');
  });

  it('reports latency', async () => {
    const result = await llm.detectIntent('hi');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

describe('Admin WhatsApp endpoints', () => {
  let adminCookie: string;

  beforeAll(async () => {
    adminCookie = await adminLogin();
  });

  it('lists conversations (may be empty)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/whatsapp/conversations')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/v1/admin/whatsapp/conversations');
    expect(res.status).toBe(401);
  });

  it('rejects broadcast without recipients', async () => {
    const res = await request(app)
      .post('/api/v1/admin/whatsapp/broadcast')
      .set('Cookie', adminCookie)
      .send({ message: 'hello' });
    expect(res.status).toBe(400);
  });

  it('rejects broadcast over 100 recipients', async () => {
    const phones = Array.from({ length: 101 }, (_, i) => `9000000${i.toString().padStart(3, '0')}`);
    const res = await request(app)
      .post('/api/v1/admin/whatsapp/broadcast')
      .set('Cookie', adminCookie)
      .send({ message: 'hello', phones });
    expect(res.status).toBe(400);
  });
});
