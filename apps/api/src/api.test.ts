import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from './app';
import { prisma } from './config/prisma';

const app = createApp();

async function adminLogin() {
  const res = await request(app)
    .post('/api/v1/auth/admin/login')
    .send({ username: 'admin', password: 'admin123' });
  expect(res.status).toBe(200);
  const cookie = res.headers['set-cookie']?.[0] ?? '';
  return cookie;
}

function auth(cookie: string) {
  return { Cookie: cookie };
}

describe('Auth guard', () => {
  it('rejects admin product create without session', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .send({ name: 'X', category: 'Whiskey', brand: 'Y', volumeMl: 750, price: 100, stockQty: 1 });
    expect(res.status).toBe(401);
  });

  it('rejects zones list without session', async () => {
    const res = await request(app).get('/api/v1/admin/zones');
    expect(res.status).toBe(401);
  });
});

describe('Product flow', () => {
  let cookie: string;
  let productId: string;

  beforeAll(async () => {
    cookie = await adminLogin();
  });

  it('creates a product (admin)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/products')
      .set(auth(cookie))
      .send({ name: 'Vitest Whiskey', category: 'Whiskey', brand: 'VitestBrand', volumeMl: 750, price: 2200, stockQty: 5 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Vitest Whiskey');
    expect(res.body.isActive).toBe(true);
    productId = res.body.id;
  });

  it('updates stock (admin)', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/products/${productId}/stock`)
      .set(auth(cookie))
      .send({ stockQty: 42 });
    expect(res.status).toBe(200);
    expect(res.body.stockQty).toBe(42);
  });

  it('lists the product publicly', async () => {
    const res = await request(app).get('/api/v1/products?search=Vitest');
    expect(res.status).toBe(200);
    expect(res.body.data.some((p: { id: string }) => p.id === productId)).toBe(true);
  });

  it('soft-deletes the product (admin)', async () => {
    const res = await request(app)
      .delete(`/api/v1/admin/products/${productId}`)
      .set(auth(cookie));
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('hides deactivated product from public list', async () => {
    const res = await request(app).get('/api/v1/products?search=Vitest');
    expect(res.body.data.some((p: { id: string }) => p.id === productId)).toBe(false);
  });
});

describe('Zone flow', () => {
  let cookie: string;
  let zoneId: string;

  beforeAll(async () => {
    cookie = await adminLogin();
  });

  it('creates a zone (admin)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/zones')
      .set(auth(cookie))
      .send({ pincode: '560777', deliveryStartTime: '10:00', deliveryEndTime: '21:00', isActive: true });
    expect(res.status).toBe(201);
    expect(res.body.pincode).toBe('560777');
    zoneId = res.body.id;
  });

  it('rejects duplicate pincode', async () => {
    const res = await request(app)
      .post('/api/v1/admin/zones')
      .set(auth(cookie))
      .send({ pincode: '560777', deliveryStartTime: '10:00', deliveryEndTime: '21:00', isActive: true });
    expect(res.status).toBe(409);
  });

  it('deletes the zone (admin)', async () => {
    const res = await request(app).delete(`/api/v1/admin/zones/${zoneId}`).set(auth(cookie));
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

afterAll(async () => {
  await prisma.product.deleteMany({ where: { brand: 'VitestBrand' } });
  await prisma.serviceableZone.deleteMany({ where: { pincode: '560777' } });
  await prisma.$disconnect();
});
