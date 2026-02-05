import { test, expect, type Page } from '@playwright/test';

async function loginAsAlice(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('/dashboard');
}

test.describe('Offers', () => {
  test('offers page lists offer cards', async ({ page }) => {
    await page.goto('/offers');
    await expect(page.getByRole('heading', { name: 'Open Offers' })).toBeVisible();
    await expect(page.getByText('NovaTech AI').first()).toBeVisible();
  });

  test('offer detail page shows company info', async ({ page }) => {
    await page.goto('/offers');
    await page.getByText('NovaTech AI').first().click();
    await page.waitForURL(/\/offers\/.+/);
    // Wait for the detail page content to load (client-side fetch)
    await expect(page.getByText('Back to Offers')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'NovaTech AI' })).toBeVisible();
    await expect(page.getByText('NTAI')).toBeVisible();
    await expect(page.getByText('Price/Share').first()).toBeVisible();
    await expect(page.getByText('Sign in to place an order')).toBeVisible();
  });

  test('offer detail shows buy form when logged in', async ({ page }) => {
    await loginAsAlice(page);
    await page.goto('/offers');
    await page.getByText('NovaTech AI').first().click();
    await page.waitForURL(/\/offers\/.+/);
    // Wait for content to load past skeleton state
    await expect(page.getByText('Back to Offers')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Place Order').first()).toBeVisible();
    await expect(page.locator('#shares')).toBeVisible();
  });
});
