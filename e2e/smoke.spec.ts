import { test, expect } from '@playwright/test';

async function confirmAgeGate(page: import('@playwright/test').Page) {
  const gate = page.locator('text=Are you 21 or older?');
  if (await gate.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.click('text=Yes');
  }
}

test('customer can browse and view product detail', async ({ page }) => {
  await page.goto('/');
  await confirmAgeGate(page);

  await expect(page.locator('h1')).toContainText('Premium Spirits');

  await page.click('a[href="/products"]');
  await expect(page).toHaveURL(/\/products/);

  const productCard = page.locator('a[href*="/products/"]').first();
  await expect(productCard).toBeVisible();
  await productCard.click();

  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('text=Add to Cart')).toBeVisible();
});

test('age gate blocks access until confirmed', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('text=Are you 21 or older?')).toBeVisible();
  await page.click('text=No');
  await expect(page.locator('text=Access Denied')).toBeVisible();
});
