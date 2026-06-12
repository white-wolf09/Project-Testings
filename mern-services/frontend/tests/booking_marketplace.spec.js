import { test, expect } from '@playwright/test';

test.describe('QuickServe - Customer Booking Engine & Marketplace Details', () => {

  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('token', 'mock-jwt-token');
      window.localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Kamil Khan', role: 'user' }));
    });
  });

  test('TC-09: Should prevent booking form initialization using historic past dates', async ({ page }) => {
    await page.route('**/api/bookings', async (route) => {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Booking date must be a future or present day' }) });
    });

    await page.goto('/services/srv_ac_01');
    await page.locator('input[placeholder*="Where should"]').fill('Lahore Sector Z');
    await page.locator('input[type="tel"]').fill('+923001234567');
    
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2020-01-01'); // Absolute past date injection
    await page.locator('button:has-text("Booking"), button:has-text("Confirm")').first().click();

    await expect(page.locator('body')).toContainText(/past|future|date|invalid/i);
  });

  test('TC-10: Should safely handle calendar far future boundary date entry values', async ({ page }) => {
    await page.route('**/api/bookings', async (route) => {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Date falls outside maximum schedule window range limit' }) });
    });

    await page.goto('/services/srv_ac_01');
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('9999-12-31'); // Far future boundary overflow
    await page.locator('button:has-text("Booking"), button:has-text("Confirm")').first().click();

    await expect(page.locator('body')).toContainText(/date|limit|outside|maximum/i);
  });

  test('TC-11: Should reject invalid alphabet strings injected inside standard phone inputs', async ({ page }) => {
    await page.goto('/services/srv_ac_01');
    const telInput = page.locator('input[type="tel"]');
    await telInput.fill('NOT_A_PHONE_NUMBER_TEXT');
    
    await page.locator('button:has-text("Booking"), button:has-text("Confirm")').first().click();
    await expect(page.locator('body')).toContainText(/phone|format|invalid|number/i);
  });

  test('TC-12: Should intercept under-length numeric values in tracking telephone blocks', async ({ page }) => {
    await page.goto('/services/srv_ac_01');
    await page.locator('input[type="tel"]').fill('5'); // Incomplete boundary text character numbers string

    await page.locator('button:has-text("Booking"), button:has-text("Confirm")').first().click();
    await expect(page.locator('body')).toContainText(/phone|length|short|invalid/i);
  });

  test('TC-13: Should restrict space processing overflow inside location address fields', async ({ page }) => {
    await page.goto('/services/srv_ac_01');
    const massiveAddressStr = 'Sector Lahore '.repeat(400); // Exceeds standard varchar buffer boundaries
    await page.locator('input[placeholder*="Where should"], textarea').first().fill(massiveAddressStr);
    
    const currentVal = await page.locator('input[placeholder*="Where should"], textarea').first().inputValue();
    expect(currentVal.length).toBeLessThanOrEqual(5000);
  });

  test('TC-14: Should load explicit 404 views when service tracking item codes are modified inside the DOM', async ({ page }) => {
    await page.route('**/api/services/srv_fake_id_xyz', async (route) => {
      await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Target product catalog element no longer exists' }) });
    });

    await page.goto('/services/srv_fake_id_xyz');
    await expect(page.locator('body')).toContainText(/not found|404|missing|exist/i);
  });

  test('TC-15: Should display access restriction validations on cross-user cross-account reference viewing attempts', async ({ page }) => {
    await page.route('**/api/bookings/bk_999', async (route) => {
      await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: 'Access Denied: Record ownership verification match failed' }) });
    });

    await page.goto('/my-bookings/bk_999');
    await expect(page.locator('body')).toContainText(/denied|unauthorized|forbidden|access/i);
  });

  test('TC-16: Should enforce internal idempotency controls against rapid consecutive form submits', async ({ page }) => {
    let transactionCount = 0;
    await page.route('**/api/bookings', async (route) => {
      transactionCount++;
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ msg: 'Success' }) });
    });

    await page.goto('/services/srv_ac_01');
    await page.locator('input[placeholder*="Where should"]').fill('Lahore Cantonment Area');
    await page.locator('input[type="tel"]').fill('+923112223344');
    
    const submitBtn = page.locator('button:has-text("Booking"), button:has-text("Confirm")').first();
    await submitBtn.click();
    await submitBtn.click({ force: true }); // Fast consecutive execution call iteration loop

    expect(transactionCount).toBe(1); // Enforces UI disabling tracking loops work optimally
  });
});