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
    { name: 'Royal Reserve 12 Year', category: 'Whiskey', brand: 'Royal Spirits', volumeMl: 750, price: 3200, stockQty: 24, description: 'Aged 12 years in oak casks. Smooth, mellow finish with notes of vanilla and dried fruit.' },
    { name: 'Highland Gold Single Malt', category: 'Whiskey', brand: 'Highland', volumeMl: 750, price: 4800, stockQty: 12, description: 'Single malt with peat smoke and honey.' },
    { name: 'Cask Strength Rye', category: 'Whiskey', brand: 'Caskhouse', volumeMl: 750, price: 3900, stockQty: 8, description: 'Bold rye whiskey bottled at cask strength.' },
    { name: 'Craft Lager', category: 'Beer', brand: 'Brewmaster', volumeMl: 500, price: 180, stockQty: 120, description: 'Crisp golden lager with a clean finish.' },
    { name: 'India Pale Ale', category: 'Beer', brand: 'Brewmaster', volumeMl: 500, price: 240, stockQty: 96, description: 'Hoppy IPA with citrus aroma.' },
    { name: 'Stout Reserve', category: 'Beer', brand: 'Darkbrew', volumeMl: 500, price: 260, stockQty: 0, description: 'Roasted coffee and chocolate notes.' },
    { name: 'Cabernet Sauvignon', category: 'Wine', brand: 'Vineyard Estate', volumeMl: 750, price: 1500, stockQty: 40, description: 'Full-bodied red with blackcurrant and cedar.' },
    { name: 'Chardonnay', category: 'Wine', brand: 'Vineyard Estate', volumeMl: 750, price: 1300, stockQty: 30, description: 'Oaked white with butter and apple.' },
    { name: 'Rosé Blush', category: 'Wine', brand: 'Vineyard Estate', volumeMl: 750, price: 1100, stockQty: 18, description: 'Light, fruity rosé.' },
    { name: 'Imperial Vodka', category: 'Vodka', brand: 'Imperial', volumeMl: 750, price: 1400, stockQty: 60, description: 'Triple-distilled, ultra-smooth.' },
    { name: 'Citrus Vodka', category: 'Vodka', brand: 'Imperial', volumeMl: 750, price: 1600, stockQty: 36, description: 'Infused with natural citrus.' },
    { name: 'Aged Dark Rum', category: 'Rum', brand: 'Caribbean', volumeMl: 750, price: 1700, stockQty: 28, description: 'Aged in bourbon casks, rich molasses.' },
    { name: 'White Rum', category: 'Rum', brand: 'Caribbean', volumeMl: 750, price: 1200, stockQty: 50, description: 'Light, clean rum for mixing.' },
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
