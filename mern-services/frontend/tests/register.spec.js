import { test, expect } from '@playwright/test';

test.describe('Authentication - Registration E2E Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate using the configured baseURL
    await page.goto('/register');
  });

  test('should display core registration elements', async ({ page }) => {
    // Assert structural text elements are visible
    await expect(page.locator('.logo-text')).toContainText('QuickServe');
    await expect(page.locator('.auth-title')).toContainText('Create account');
    
    // Check that the Customer button is marked active
    const customerBtn = page.locator('.role-btn', { hasText: 'Customer' });
    await expect(customerBtn).toHaveClass(/active/);
  });

  test('should register a Customer and submit correct payload parameters', async ({ page }) => {
    // 1. Intercept the network API POST request
    let submittedPayload = null;
    await page.route('**/api/auth/register', async (route) => {
      if (route.request().method() === 'POST') {
        submittedPayload = route.request().postDataJSON(); // Capture what the form sends
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            _id: 'u111',
            name: 'John Customer',
            email: 'john@gmail.com',
            role: 'user'
          })
        });
      }
    });

    // 2. Fill out the form fields using Playwright's user facing locators
    await page.getByPlaceholder('Your full name').fill('John Customer');
    await page.locator('input[type="email"]').fill('john@gmail.com');
    await page.locator('input[type="password"]').fill('password123');

    // 3. Click submit
    await page.locator('.auth-btn').click();

    // 4. Assert the network payload was compiled accurately before execution
    expect(submittedPayload).not.toBeNull();
    expect(submittedPayload.name).toBe('John Customer');
    expect(submittedPayload.email).toBe('john@gmail.com');
    expect(submittedPayload.role).toBe('user');
  });
});