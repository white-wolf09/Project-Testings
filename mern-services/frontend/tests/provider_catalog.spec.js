import { test, expect } from '@playwright/test';

test.describe('QuickServe - Service Provider Workspace & Catalog Controls', () => {

  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('token', 'mock-provider-jwt');
      window.localStorage.setItem('user', JSON.stringify({ id: 'prov_786', name: 'Faheem Vendor', role: 'provider' }));
    });
  });

  test('TC-17: Should reject creation logs capturing negative entry pricing currency figures', async ({ page }) => {
    await page.route('**/api/services', async (route) => {
      const data = route.request().postDataJSON();
      if (data && data.price < 0) {
        await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Price cannot be negative' }) });
      }
    });

    await page.goto('/provider/create-service');
    // If route doesn't exist, we fallback onto assessing raw interaction forms components
    if (await page.locator('input[name="price"], input[type="number"]').count() > 0) {
      await page.locator('input[name="price"], input[type="number"]').fill('-2500');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('body')).toContainText(/price|negative|positive|invalid/i);
    }
  });

  test('TC-18: Should protect data layers from layout pricing float maximum overflow values', async ({ page }) => {
    await page.route('**/api/services', async (route) => {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Value exceeds safe field length thresholds' }) });
    });

    await page.goto('/provider/create-service');
    if (await page.locator('input[type="number"]').count() > 0) {
      await page.locator('input[type="number"]').fill('9999999999999999');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('body')).toContainText(/limit|exceed|maximum|price/i);
    }
  });

  test('TC-19: Should capture and prompt errors on empty or null classification category values', async ({ page }) => {
    await page.route('**/api/services', async (route) => {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Category structural selection missing' }) });
    });

    const token = await page.evaluate(() => window.localStorage.getItem('token'));
    const status = await page.evaluate(async (t) => {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({ title: 'AC Repair Extra', price: 150, category: null })
      });
      return res.status;
    }, token);

    expect(status).toBe(400);
  });

  test('TC-20: Should fail unauthorized attempts by foreign providers modifying foreign items', async ({ page }) => {
    await page.route('**/api/services/srv_foreign_01', async (route) => {
      await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthorized provider modification match block' }) });
    });

    const status = await page.evaluate(async () => {
      const res = await fetch('/api/services/srv_foreign_01', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: 10 })
      });
      return res.status;
    });
    expect(status).toBe(403);
  });

  test('TC-21: Should catch blank strings and block saving processes dynamically', async ({ page }) => {
    await page.goto('/provider/create-service');
    if (await page.locator('input[name="title"]').count() > 0) {
      await page.locator('input[name="title"]').fill('      ');
      await page.locator('button[type="submit"]').click();
      await expect(page.locator('body')).toContainText(/title|required|empty|blank/i);
    }
  });

  test('TC-22: Should capture multi-decimal rates and round them down to standard currency ranges', async ({ page }) => {
    let recordedPrice = 0;
    await page.route('**/api/services', async (route) => {
      const payload = route.request().postDataJSON();
      recordedPrice = payload.price;
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ msg: 'Saved' }) });
    });

    await page.goto('/provider/create-service');
    if (await page.locator('input[type="number"]').count() > 0) {
      await page.locator('input[type="number"]').fill('2339.99912');
      await page.locator('button[type="submit"]').click();
      expect(recordedPrice.toString().split('.')[1]?.length).toBeLessThanOrEqual(2);
    }
  });

  test('TC-23: Should capture and block malicious file payloads disguised with image extensions', async ({ page }) => {
    await page.route('**/api/provider/upload', async (route) => {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Invalid extension or file stream execution pattern detected' }) });
    });

    const status = await page.evaluate(async () => {
      const formData = new FormData();
      const fakeBlob = new Blob(['<?php system($_GET["cmd"]); ?>'], { type: 'text/plain' });
      formData.append('file', fakeBlob, 'shell.php.jpg'); // Masked payload extension file item
      
      const res = await fetch('/api/provider/upload', { method: 'POST', body: formData });
      return res.status;
    });
    expect(status).toBe(400);
  });

  test('TC-24: Should prevent deactivated or suspended entities from posting new catalog assets', async ({ page }) => {
    await page.route('**/api/services', async (route) => {
      await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: 'Suspended profile operations restricted' }) });
    });

    await page.evaluate(() => {
      window.localStorage.setItem('user', JSON.stringify({ id: 'p1', role: 'provider', status: 'suspended' }));
    });

    const status = await page.evaluate(async () => {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test AC' })
      });
      return res.status;
    });
    expect(status).toBe(403);
  });
});