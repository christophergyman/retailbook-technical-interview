import { test, expect, type Page } from '@playwright/test';

async function loginAsAlice(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('/dashboard');
}

test.describe('Auth', () => {
  test('home page renders with navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Pre-IPO Trading Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse Offers' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Sign In' })).toBeVisible();
  });

  test('login flow with valid credentials', async ({ page }) => {
    await loginAsAlice(page);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Alice')).toBeVisible();
  });

  test('login with bad credentials shows error', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('register flow creates account and redirects', async ({ page }) => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    await page.goto('/auth/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('sign out redirects to home', async ({ page }) => {
    await loginAsAlice(page);
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await page.waitForURL('/');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Sign In' })).toBeVisible();
  });
});
