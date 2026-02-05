import { test, expect, type Page } from '@playwright/test';

async function loginAsAlice(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('/dashboard');
}

test.describe('Dashboard', () => {
  test('dashboard shows stat cards', async ({ page }) => {
    await loginAsAlice(page);
    await page.goto('/dashboard');
    await expect(page.getByText('Total Orders')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Total Invested')).toBeVisible();
    await expect(page.getByText('Orders by Stage')).toBeVisible();
  });

  test('dashboard shows orders table with columns', async ({ page }) => {
    await loginAsAlice(page);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Your Orders' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Order ID')).toBeVisible();
    await expect(page.getByText('Shares', { exact: true })).toBeVisible();
    await expect(page.getByText('Total Cost')).toBeVisible();
    await expect(page.getByText('Stage', { exact: true })).toBeVisible();
  });

  test('order detail page loads with stage history', async ({ page }) => {
    await loginAsAlice(page);
    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: 'View' }).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page.getByRole('heading', { name: 'Order Details' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('heading', { name: 'Stage History' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Offer Info' })).toBeVisible();
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/auth\/login/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });
});
