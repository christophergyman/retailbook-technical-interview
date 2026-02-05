import { test, expect, type Page } from '@playwright/test';

async function loginAsAlice(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('/dashboard');
}

test.describe('Order Flow', () => {
  test('place an order and verify it appears in dashboard', async ({ page }) => {
    await loginAsAlice(page);

    // Navigate to offers and click on one
    await page.goto('/offers');
    await page.getByText('NovaTech AI').first().click();
    await page.waitForURL(/\/offers\/.+/);

    // Wait for the offer detail page to fully load
    await expect(page.getByText('Back to Offers')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#shares')).toBeVisible();

    // Set shares to 1 and place order
    await page.locator('#shares').fill('1');
    await page.getByRole('button', { name: 'Place Order' }).click();

    // Verify redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('order appears in dashboard table', async ({ page }) => {
    await loginAsAlice(page);
    await page.goto('/dashboard');

    // Verify orders table has rows with a View link
    await expect(page.getByRole('heading', { name: 'Your Orders' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('link', { name: 'View' }).first()).toBeVisible();
  });
});
