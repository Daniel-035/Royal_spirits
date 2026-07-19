import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { username: adminUsername },
    update: { passwordHash },
    create: { username: adminUsername, passwordHash },
  });
  console.log(`Seeded admin: ${adminUsername}`);

  const zones = [
    { pincode: '560001', deliveryStartTime: '10:00', deliveryEndTime: '21:00', isActive: true },
    { pincode: '560002', deliveryStartTime: '10:00', deliveryEndTime: '21:00', isActive: true },
    { pincode: '560034', deliveryStartTime: '10:00', deliveryEndTime: '20:00', isActive: true },
  ];
  for (const z of zones) {
    await prisma.serviceableZone.upsert({
      where: { pincode: z.pincode },
      update: z,
      create: z,
    });
  }
  console.log(`Seeded ${zones.length} serviceable zones`);

  const products = [
    { name: 'Royal Reserve 12 Year', category: 'Whiskey', brand: 'Royal Spirits', volumeMl: 750, price: 3200, stockQty: 24, description: 'Aged 12 years in oak casks. Smooth, mellow finish with notes of vanilla and dried fruit.', imageUrl: 'https://images.unsplash.com/photo-1581358050142-fc24f5c3e4a7?auto=format&fit=crop&w=800&q=80' },
    { name: 'Highland Gold Single Malt', category: 'Whiskey', brand: 'Highland', volumeMl: 750, price: 4800, stockQty: 12, description: 'Single malt with peat smoke and honey.', imageUrl: 'https://images.unsplash.com/photo-1569529465841-dfecd7324b1d?auto=format&fit=crop&w=800&q=80' },
    { name: 'Cask Strength Rye', category: 'Whiskey', brand: 'Caskhouse', volumeMl: 750, price: 3900, stockQty: 8, description: 'Bold rye whiskey bottled at cask strength.', imageUrl: 'https://images.unsplash.com/photo-1614191595687-cf6c2e2f9aab?auto=format&fit=crop&w=800&q=80' },
    { name: 'Craft Lager', category: 'Beer', brand: 'Brewmaster', volumeMl: 500, price: 180, stockQty: 120, description: 'Crisp golden lager with a clean finish.', imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c07de4?auto=format&fit=crop&w=800&q=80' },
    { name: 'India Pale Ale', category: 'Beer', brand: 'Brewmaster', volumeMl: 500, price: 240, stockQty: 96, description: 'Hoppy IPA with citrus aroma.', imageUrl: 'https://images.unsplash.com/photo-1633428205376-3eeddc6c67c5?auto=format&fit=crop&w=800&q=80' },
    { name: 'Stout Reserve', category: 'Beer', brand: 'Darkbrew', volumeMl: 500, price: 260, stockQty: 0, description: 'Roasted coffee and chocolate notes.', imageUrl: 'https://images.unsplash.com/photo-1623126908029-58cb08a2b272?auto=format&fit=crop&w=800&q=80' },
    { name: 'Cabernet Sauvignon', category: 'Wine', brand: 'Vineyard Estate', volumeMl: 750, price: 1500, stockQty: 40, description: 'Full-bodied red with blackcurrant and cedar.', imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80' },
    { name: 'Chardonnay', category: 'Wine', brand: 'Vineyard Estate', volumeMl: 750, price: 1300, stockQty: 30, description: 'Oaked white with butter and apple.', imageUrl: 'https://images.unsplash.com/photo-1566995541428-f2c5bb2cd6c3?auto=format&fit=crop&w=800&q=80' },
    { name: 'Rosé Blush', category: 'Wine', brand: 'Vineyard Estate', volumeMl: 750, price: 1100, stockQty: 18, description: 'Light, fruity rosé.', imageUrl: 'https://images.unsplash.com/photo-1547415466-3a9bf9bc1a28?auto=format&fit=crop&w=800&q=80' },
    { name: 'Imperial Vodka', category: 'Vodka', brand: 'Imperial', volumeMl: 750, price: 1400, stockQty: 60, description: 'Triple-distilled, ultra-smooth.', imageUrl: 'https://images.unsplash.com/photo-1619530265589-6b8d8e6e1b25?auto=format&fit=crop&w=800&q=80' },
    { name: 'Citrus Vodka', category: 'Vodka', brand: 'Imperial', volumeMl: 750, price: 1600, stockQty: 36, description: 'Infused with natural citrus.', imageUrl: 'https://images.unsplash.com/photo-1569288063649-3f0f3f3e3e9c?auto=format&fit=crop&w=800&q=80' },
    { name: 'Aged Dark Rum', category: 'Rum', brand: 'Caribbean', volumeMl: 750, price: 1700, stockQty: 28, description: 'Aged in bourbon casks, rich molasses.', imageUrl: 'https://images.unsplash.com/photo-1537955995646-6f0ed2e8d0e7?auto=format&fit=crop&w=800&q=80' },
    { name: 'White Rum', category: 'Rum', brand: 'Caribbean', volumeMl: 750, price: 1200, stockQty: 50, description: 'Light, clean rum for mixing.', imageUrl: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80' },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name, brand: p.brand } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: p });
    } else {
      await prisma.product.create({ data: p });
    }
  }
  console.log(`Seeded ${products.length} products`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
