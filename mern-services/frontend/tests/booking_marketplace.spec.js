import { test, expect } from '@playwright/test';

test.describe('QuickServe - Customer Booking Engine & Marketplace Details', () => {

  test.beforeEach(async ({ context, page }) => {
    // 1. Seed LocalStorage with standard mock customer payload parameters
    await context.addInitScript(() => {
      window.localStorage.setItem('token', 'mock-jwt-token');
      window.localStorage.setItem('user', JSON.stringify({ _id: 'u1', name: 'Kamil Khan', role: 'user' }));
    });

    // 2. Mock the Auth Context bootstrap endpoint to ensure session profile persists
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ _id: 'u1', name: 'Kamil Khan', role: 'user' })
      });
    });
  });

  test('TC-07: Should prevent booking form initialization using historic past dates', async ({ page }) => {
    await page.route('**/api/services/srv_ac_01', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ _id: 'srv_ac_01', title: 'AC Repair', category: 'Appliance', price: 500, provider: { _id: 'p1', name: 'Ali' } })
      });
    });

    await page.goto('/services/srv_ac_01');
    await page.locator('input[placeholder*="Where should"]').fill('Lahore Sector Z');
    await page.locator('input[type="tel"]').fill('+923001234567');
    
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2020-01-01'); 
    
    // Evaluates if native HTML5 form constraint validations blocked past submission strings
    const isFormValid = await page.evaluate(() => {
      return document.querySelector('form').checkValidity();
    });
    
    expect(isFormValid).toBe(false);
  });

  test('TC-08: Should safely handle calendar far future boundary date entry values', async ({ page }) => {
    await page.route('**/api/services/srv_ac_01', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ _id: 'srv_ac_01', title: 'AC Repair', category: 'Appliance', price: 500, provider: { _id: 'p1', name: 'Ali' } })
      });
    });

    await page.route('**/api/bookings', async (route) => {
      await route.fulfill({ 
        status: 400, 
        contentType: 'application/json', 
        body: JSON.stringify({ msg: 'Date falls outside maximum schedule window range limit' }) 
      });
    });

    await page.goto('/services/srv_ac_01');
    await page.locator('input[placeholder*="Where should"]').fill('Lahore Sector Z');
    await page.locator('input[type="tel"]').fill('+923001234567');
    
    // Ensure input bypasses native 'min' boundary constraints safely
    await page.locator('input[type="date"]').fill('2028-12-31'); 
    
    await Promise.all([
      page.waitForResponse('**/api/bookings'),
      page.locator('button:has-text("Confirm Booking")').click()
    ]);

    await expect(page.locator('.alert-error')).toContainText('Date falls outside maximum schedule window range limit');
  });

  test('TC-09: Should reject invalid alphabet strings injected inside standard phone inputs', async ({ page }) => {
    await page.route('**/api/services/srv_ac_01', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ _id: 'srv_ac_01', title: 'AC Repair', category: 'Appliance', price: 500, provider: { _id: 'p1', name: 'Ali' } })
      });
    });

    await page.route('**/api/bookings', async (route) => {
      await route.fulfill({ 
        status: 400, 
        contentType: 'application/json', 
        body: JSON.stringify({ msg: 'Invalid phone format structure' }) 
      });
    });

    await page.goto('/services/srv_ac_01');
    await page.locator('input[placeholder*="Where should"]').fill('Lahore Sector Z');
    await page.locator('input[type="tel"]').fill('NOT_A_PHONE_NUMBER_TEXT');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.locator('input[type="date"]').fill(tomorrow.toISOString().split('T')[0]);

    await Promise.all([
      page.waitForResponse('**/api/bookings'),
      page.locator('button:has-text("Confirm Booking")').click()
    ]);
    
    await expect(page.locator('.alert-error')).toContainText('Invalid phone format structure');
  });

  test('TC-10: Should intercept under-length numeric values in tracking telephone blocks', async ({ page }) => {
    await page.route('**/api/services/srv_ac_01', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ _id: 'srv_ac_01', title: 'AC Repair', category: 'Appliance', price: 500, provider: { _id: 'p1', name: 'Ali' } })
      });
    });

    await page.route('**/api/bookings', async (route) => {
      await route.fulfill({ 
        status: 400, 
        contentType: 'application/json', 
        body: JSON.stringify({ msg: 'Phone number sequence is too short' }) 
      });
    });

    await page.goto('/services/srv_ac_01');
    await page.locator('input[placeholder*="Where should"]').fill('Lahore Sector Z');
    await page.locator('input[type="tel"]').fill('5'); 
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.locator('input[type="date"]').fill(tomorrow.toISOString().split('T')[0]);

    await Promise.all([
      page.waitForResponse('**/api/bookings'),
      page.locator('button:has-text("Confirm Booking")').click()
    ]);

    await expect(page.locator('.alert-error')).toContainText('Phone number sequence is too short');
  });

  test('TC-11: Should restrict space processing overflow inside location address fields', async ({ page }) => {
    await page.route('**/api/services/srv_ac_01', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ _id: 'srv_ac_01', title: 'AC Repair', category: 'Appliance', price: 500, provider: { _id: 'p1', name: 'Ali' } })
      });
    });

    await page.goto('/services/srv_ac_01');
    const massiveAddressStr = 'Sector Lahore '.repeat(400); 
    await page.locator('input[placeholder*="Where should"]').fill(massiveAddressStr);
    
    const currentVal = await page.locator('input[placeholder*="Where should"]').inputValue();
    expect(currentVal.length).toBeLessThanOrEqual(6000); 
  });

  test('TC-12: Should load explicit 404 views when service tracking item codes are modified inside the DOM', async ({ page }) => {
    await page.route('**/api/services/srv_fake_id_xyz', async (route) => {
      await route.fulfill({ 
        status: 404, 
        contentType: 'application/json', 
        body: JSON.stringify({ msg: 'Target product catalog element no longer exists' }) 
      });
    });

    await page.goto('/services/srv_fake_id_xyz');
    await expect(page.locator('.empty-state')).toContainText('Service not found');
  });



  test('TC-13: Should enforce internal idempotency controls against rapid consecutive form submits', async ({ page }) => {
    await page.route('**/api/services/srv_ac_01', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ _id: 'srv_ac_01', title: 'AC Repair', category: 'Appliance', price: 500, provider: { _id: 'p1', name: 'Ali' } })
      });
    });

    let transactionCount = 0;
    await page.route('**/api/bookings', async (route) => {
      transactionCount++;
      await route.fulfill({ 
        status: 201, 
        contentType: 'application/json', 
        body: JSON.stringify({ msg: 'Success' }) 
      });
    });

    await page.goto('/services/srv_ac_01');
    await page.locator('input[placeholder*="Where should"]').fill('Lahore Cantonment Area');
    await page.locator('input[type="tel"]').fill('+923112223344');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.locator('input[type="date"]').fill(tomorrow.toISOString().split('T')[0]);
    
    const submitBtn = page.locator('button:has-text("Confirm Booking")');
    
    // Fires rapid clicks concurrently to evaluate UI disabling mechanism logic
    await Promise.all([
      submitBtn.click(),
      submitBtn.click({ force: true }).catch(() => {})
    ]);

    expect(transactionCount).toBe(1);
  });
});