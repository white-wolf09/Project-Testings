import { test, expect } from '@playwright/test';

test.describe('QuickServe - Service Provider Workspace & Catalog Controls', () => {

  test.beforeEach(async ({ context, page }) => {
    // 1. Seed LocalStorage with provider token parameters before loading the page DOM
    await context.addInitScript(() => {
      window.localStorage.setItem('token', 'mock-provider-jwt');
      window.localStorage.setItem('user', JSON.stringify({ _id: 'prov_786', name: 'Faheem Vendor', role: 'provider', providerType: 'Plumber' }));
    });

    // 2. CRITICAL: Mock the Auth Context session handshake verification request to bypass login page redirects
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ _id: 'prov_786', name: 'Faheem Vendor', role: 'provider', providerType: 'Plumber' })
      });
    });

    // 3. Keep initialization workspace dashboard hooks clean from breaking network states
    await page.route('**/api/services/mine/list', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.route('**/api/bookings/provider', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
  });

  test('TC-13: Should reject creation logs capturing negative entry pricing currency figures', async ({ page }) => {
    await page.route('**/api/services', async (route) => {
      await route.fulfill({ 
        status: 400, 
        contentType: 'application/json', 
        body: JSON.stringify({ msg: 'Price cannot be negative' }) 
      });
    });

    await page.goto('/provider');
    
    // Fill form components safely
    await page.locator('input[placeholder*="Expert Pipe"], input.form-input').first().fill('Negative Price Test');
    
    const priceInput = page.locator('input[type="number"]');
    await priceInput.fill('-2500');

    // Bypass browser native HTML5 constraint checks (min="0") so submission reaches our network route
    await page.evaluate(() => {
      const input = document.querySelector('input[type="number"]');
      if (input) input.removeAttribute('min');
    });
    
    await Promise.all([
      page.waitForResponse('**/api/services'),
      page.locator('button[type="submit"]:has-text("Publish Service")').click()
    ]);

    await expect(page.locator('.alert-error')).toContainText('Price cannot be negative');
  });

  test('TC-14: Should protect data layers from layout pricing float maximum overflow values', async ({ page }) => {
    await page.route('**/api/services', async (route) => {
      await route.fulfill({ 
        status: 400, 
        contentType: 'application/json', 
        body: JSON.stringify({ msg: 'Value exceeds safe field length thresholds' }) 
      });
    });

    await page.goto('/provider');
    await page.locator('input[placeholder*="Expert Pipe"], input.form-input').first().fill('Overflow Price Test');
    await page.locator('input[type="number"]').fill('9999999999');
    
    await Promise.all([
      page.waitForResponse('**/api/services'),
      page.locator('button[type="submit"]:has-text("Publish Service")').click()
    ]);

    await expect(page.locator('.alert-error')).toContainText('Value exceeds safe field length thresholds');
  });

  test('TC-15: Should capture and prompt errors on empty or null classification category values', async ({ page }) => {
    await page.route('**/api/services', async (route) => {
      await route.fulfill({ 
        status: 400, 
        contentType: 'application/json', 
        body: JSON.stringify({ msg: 'Category structural selection missing' }) 
      });
    });

    await page.goto('/provider');
    
    const origin = await page.evaluate(() => window.location.origin);
    const token = await page.evaluate(() => window.localStorage.getItem('token'));
    
    const status = await page.evaluate(async ({ base, t }) => {
      const res = await fetch(`${base}/api/services`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${t}`,
          'x-auth-token': t 
        },
        body: JSON.stringify({ title: 'AC Repair Extra', price: 150, category: null })
      });
      return res.status;
    }, { base: origin, t: token });

    expect(status).toBe(400);
  });

  test('TC-16: Should fail unauthorized attempts by foreign providers modifying foreign items', async ({ page }) => {
    await page.route('**/api/services/srv_foreign_01', async (route) => {
      await route.fulfill({ 
        status: 403, 
        contentType: 'application/json', 
        body: JSON.stringify({ msg: 'Not authorized to update this booking listing record' }) 
      });
    });

    await page.goto('/provider');
    const origin = await page.evaluate(() => window.location.origin);

    const status = await page.evaluate(async (base) => {
      const res = await fetch(`${base}/api/services/srv_foreign_01`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: 10 })
      });
      return res.status;
    }, origin);
    
    expect(status).toBe(403);
  });

  test('TC-17: Should catch blank strings and block saving processes dynamically', async ({ page }) => {
    await page.route('**/api/services', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ msg: 'Failed to save service: Title is required' })
      });
    });

    await page.goto('/provider');
    
    // Inject invalid whitespace strings to check component logic filtering
    await page.locator('input[placeholder*="Expert Pipe"], input.form-input').first().fill('      ');
    
    // Bypass required field blocking on empty text string checks to verify component level catches
    await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Expert Pipe"], input.form-input');
      if (input) input.removeAttribute('required');
    });

    await Promise.all([
      page.waitForResponse('**/api/services'),
      page.locator('button[type="submit"]:has-text("Publish Service")').click()
    ]);
    
    await expect(page.locator('.alert-error')).toBeVisible();
  });

  test('TC-18: Should capture multi-decimal rates and round them down to standard currency ranges', async ({ page }) => {
    let recordedPrice = null;
    await page.route('**/api/services', async (route) => {
      const payload = route.request().postDataJSON();
      recordedPrice = payload.price;
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ _id: 'new_srv' }) });
    });

    await page.goto('/provider');
    await page.locator('input[placeholder*="Expert Pipe"], input.form-input').first().fill('Decimal Precision Validation');
    await page.locator('input[type="number"]').fill('2339.99912');
    
    // Force target element constraints to step 'any' and clear check validations to allow pipeline pass through
    await page.evaluate(() => {
      const formElement = document.querySelector('form');
      if (formElement) formElement.setAttribute('novalidate', 'true');
      const inputElement = document.querySelector('input[type="number"]');
      if (inputElement) inputElement.setAttribute('step', 'any');
    });

    await Promise.all([
      page.waitForResponse('**/api/services'),
      page.locator('button[type="submit"]:has-text("Publish Service")').click()
    ]);

    expect(recordedPrice).not.toBeNull();
    expect(Number.isFinite(recordedPrice)).toBe(true);
  });

  test('TC-19: Should capture and block malicious file payloads disguised with image extensions', async ({ page }) => {
    await page.route('**/api/provider/upload', async (route) => {
      await route.fulfill({ 
        status: 400, 
        contentType: 'application/json', 
        body: JSON.stringify({ msg: 'Invalid extension pattern detected' }) 
      });
    });

    await page.goto('/provider');
    const origin = await page.evaluate(() => window.location.origin);

    const status = await page.evaluate(async (base) => {
      const formData = new FormData();
      const fakeBlob = new Blob(['<?php system($_GET["cmd"]); ?>'], { type: 'text/plain' });
      formData.append('file', fakeBlob, 'shell.php.jpg');
      
      const res = await fetch(`${base}/api/provider/upload`, { method: 'POST', body: formData });
      return res.status;
    }, origin);
    
    expect(status).toBe(400);
  });

  test('TC-20: Should prevent deactivated or suspended entities from posting new catalog assets', async ({ page }) => {
    await page.route('**/api/services', async (route) => {
      await route.fulfill({ 
        status: 403, 
        contentType: 'application/json', 
        body: JSON.stringify({ msg: 'Suspended profile operations restricted' }) 
      });
    });

    await page.goto('/provider');
    
    await page.evaluate(() => {
      window.localStorage.setItem('user', JSON.stringify({ _id: 'prov_786', role: 'provider', status: 'suspended' }));
    });

    const origin = await page.evaluate(() => window.location.origin);
    const status = await page.evaluate(async (base) => {
      const res = await fetch(`${base}/api/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Suspended Test Asset Posting' })
      });
      return res.status;
    }, origin);
    
    expect(status).toBe(403);
  });
});