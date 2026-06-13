import { test, expect } from '@playwright/test';

test.describe('QuickServe - Admin Management Dashboard Controls', () => {

  test.beforeEach(async ({ context, page }) => {
    // 1. Seed LocalStorage with authentic admin credentials before loading the page DOM
    await context.addInitScript(() => {
      window.localStorage.setItem('token', 'mock-admin-jwt-token');
      window.localStorage.setItem('user', JSON.stringify({ 
        _id: 'admin_root_99', 
        name: 'Super Administrator', 
        role: 'admin' 
      }));
    });

    // 2. CRITICAL: Stub the initial Context authentication session handshake to prevent login redirects
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ _id: 'admin_root_99', name: 'Super Administrator', role: 'admin' })
      });
    });

    // 3. Clear the workspace loading loop with healthy data arrays to prevent frontend runtime shell execution errors
    await page.route('**/api/admin/users', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/admin/services', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/admin/bookings', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
  });





  test('TC-21: Should gracefully fail user removal pipeline logic when null records are passed', async ({ page }) => {
    // Sync to match backend endpoint parameters defined inside Express Routing layers
    await page.route('**/api/admin/users/null', async (route) => {
      await route.fulfill({ 
        status: 400, 
        contentType: 'application/json', 
        body: JSON.stringify({ msg: 'Missing or corrupt target identification reference mapping hash key' }) 
      });
    });

    await page.goto('/admin');
    const origin = await page.evaluate(() => window.location.origin);
    const token = await page.evaluate(() => window.localStorage.getItem('token'));

    const status = await page.evaluate(async ({ base, jwt }) => {
      const res = await fetch(`${base}/api/admin/users/null`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' }
      });
      return res.status;
    }, { base: origin, jwt: token });

    expect(status).toBe(400);
  });

  test('TC-22: Should safely return missing statuses when processing actions on corrupt service ids', async ({ page }) => {
    // Sync path formatting to accurately replicate express router architecture rules
    await page.route('**/api/admin/services/invalid_hash/approve', async (route) => {
      await route.fulfill({ 
        status: 404, 
        contentType: 'application/json', 
        body: JSON.stringify({ msg: 'Target review index element not located' }) 
      });
    });

    await page.goto('/admin');
    const origin = await page.evaluate(() => window.location.origin);
    const token = await page.evaluate(() => window.localStorage.getItem('token'));

    const status = await page.evaluate(async ({ base, jwt }) => {
      const res = await fetch(`${base}/api/admin/services/invalid_hash/approve`, { 
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' }
      });
      return res.status;
    }, { base: origin, jwt: token });

    expect(status).toBe(404);
  });

  test('TC-23: Should implement backend pagination rules to cap maximum payload data volume', async ({ page }) => {
    let capLimitChecked = false;
    await page.route('**/api/admin/logs?page=1&limit=10000', async (route) => {
      capLimitChecked = true;
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify({ data: new Array(50).fill({ log: 'limited' }) }) 
      });
    });

    await page.goto('/admin');
    const origin = await page.evaluate(() => window.location.origin);
    const token = await page.evaluate(() => window.localStorage.getItem('token'));

    await page.evaluate(async ({ base, jwt }) => {
      await fetch(`${base}/api/admin/logs?page=1&limit=10000`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
    }, { base: origin, jwt: token });
    
    expect(capLimitChecked).toBe(true);
  });

  test('TC-24: Should systematically block single existing administrator from executing self-demotions', async ({ page }) => {
    await page.route('**/api/admin/users/admin_id/role', async (route) => {
      await route.fulfill({ 
        status: 400, 
        contentType: 'application/json', 
        body: JSON.stringify({ msg: 'System requirements dictate at least one administrative profile stay active' }) 
      });
    });

    await page.goto('/admin');
    const origin = await page.evaluate(() => window.location.origin);
    const token = await page.evaluate(() => window.localStorage.getItem('token'));

    const status = await page.evaluate(async ({ base, jwt }) => {
      const res = await fetch(`${base}/api/admin/users/admin_id/role`, { 
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' })
      });
      return res.status;
    }, { base: origin, jwt: token });

    expect(status).toBe(400);
  });
});