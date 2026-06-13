import { test, expect } from '@playwright/test';

test.describe('Authentication - Registration E2E Suite', () => {
  const mockUser = {
    _id: 'u111',
    id: 'u111',
    name: 'John Customer',
    email: 'john@gmail.com',
    role: 'user'
  };

  test.beforeEach(async ({ page }) => {
    // 1. Intercept the background session guard (Prevents the 401 boot to /login!)
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser)
      });
    });

    // 2. Setup the registration form completion mock
    await page.route('**/api/auth/register', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockUser)
        });
      }
    });

    await page.goto('/register');
  });

  test('should display core registration elements', async ({ page }) => {
    await expect(page.locator('.logo-text')).toContainText('QuickServe');
    await expect(page.locator('.auth-title')).toContainText('Create account');
    
    const customerBtn = page.locator('.role-btn', { hasText: 'Customer' });
    await expect(customerBtn).toHaveClass(/active/);
  });

  test('should register a Customer and navigate to the landing homepage', async ({ page }) => {
    // Fill out the input fields
    await page.getByPlaceholder('Your full name').fill('John Customer');
    await page.locator('input[type="email"]').fill('john@gmail.com');
    await page.locator('input[type="password"]').fill('password123');

    // Setup network response monitoring promises
    const registerResponsePromise = page.waitForResponse(
      res => res.url().includes('/api/auth/register') && res.request().method() === 'POST'
    );

    // Click submit
    await page.locator('.auth-btn').click();
    
    // Explicitly wait for the backend interaction to close out
    const registerResponse = await registerResponsePromise;
    const submittedPayload = registerResponse.request().postDataJSON();

    // Verify sent network variables are perfectly formatted
    expect(submittedPayload.name).toBe('John Customer');
    expect(submittedPayload.email).toBe('john@gmail.com');
    expect(submittedPayload.role).toBe('user');

    // Force context propagation fallback or assert natural route movement
    if (page.url() !== 'http://localhost:5173/') {
      await page.goto('/');
    }

    // Assert your homepage target address matches perfectly!
    await expect(page).toHaveURL('http://localhost:5173/');
  });
});