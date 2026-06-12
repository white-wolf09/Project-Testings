import { test, expect } from '@playwright/test';

test.describe('QuickServe - Integrated Admin Control Panel Suite', () => {
  const mockAdminUser = {
    _id: 'admin_999',
    id: 'admin_999',
    name: 'System Admin',
    email: 'admin@quickserve.com',
    role: 'admin'
  };

  const mockUsersList = [
    { _id: 'admin_999', name: 'System Admin', email: 'admin@quickserve.com', role: 'admin' },
    { _id: 'provider_777', name: 'Zeeshan Electrician', email: 'zeeshan@sparky.com', role: 'provider', providerType: 'Electrician' }
  ];

  let mockServicesList = [
    {
      _id: 'srv_pending_01',
      title: 'High Voltage DB Box Wiring',
      category: 'Electrician',
      price: 2500,
      approved: false,
      provider: { name: 'Zeeshan Electrician' }
    }
  ];

  const mockBookingsList = [
    {
      _id: 'bk_301',
      service: { title: 'High Voltage DB Box Wiring', provider: { name: 'Zeeshan Electrician' } },
      user: { name: 'Haris Ahmed' },
      date: '2026-06-15T00:00:00.000Z',
      status: 'pending'
    }
  ];

  test('should authenticate admin, verify counter indicators, and process service approval', async ({ page, context }) => {
    
    // ── STEP 1: SEED BROWSER STORAGE & COOKIES TO PASS ROUTE GUARDS ──
    
    // Add a dummy JWT token to Local Storage on your domain
    await context.addInitScript(() => {
      window.localStorage.setItem('token', 'mock-admin-jwt-token');
      window.localStorage.setItem('user', JSON.stringify({ role: 'admin' }));
    });

    // Add a dummy token cookie just in case your app relies on HTTP cookies instead
    await context.addCookies([{
      name: 'token',
      value: 'mock-admin-jwt-token',
      domain: 'localhost',
      path: '/'
    }]);

    // ── STEP 2: INITIALIZE ALL BACKEND INTERCEPTS ──

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAdminUser)
      });
    });

    await page.route('**/api/admin/users', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUsersList) });
    });

    await page.route('**/api/admin/services', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockServicesList) });
    });

    await page.route('**/api/admin/bookings', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockBookingsList) });
    });

    let isApprovalTriggered = false;
    await page.route('**/api/admin/services/srv_pending_01/approve', async (route) => {
      if (route.request().method() === 'PUT') {
        isApprovalTriggered = true;
        mockServicesList[0].approved = true; 
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ msg: 'Service approved successfully' })
        });
      }
    });

    // ── STEP 3: NAVIGATE TO CONTROL PANEL ──
    
    await page.goto('/admin');

    // Assert your dashboard target location settles perfectly
    await expect(page).toHaveURL('http://localhost:5173/admin');

    // ── STEP 4: RUN INTERACTIVE OPERATIONS ──

    await expect(page.locator('.admin-role-label')).toContainText('Admin Control Panel');
    await expect(page.locator('.page-subtitle')).toContainText('Logged in as System Admin');

    // Total Users metric check
    await expect(page.locator('.admin-stat-card').nth(0).locator('.admin-stat-num')).toContainText('2');
    await expect(page.locator('.admin-stat-card').nth(2).locator('.admin-stat-sub')).toContainText('1 pending');

    // Click on the Services navigation tab explicitly
    await page.locator('button.tab', { hasText: 'Services' }).click();

    // Verify pending notice indicator details
    const noticeAlert = page.locator('.alert-pending-notice');
    await expect(noticeAlert).toBeVisible();
    await expect(noticeAlert).toContainText('1 service(s) awaiting your approval');

    // Select target elements within structural table row structures
    const pendingRow = page.locator('tr.row-pending');
    await expect(pendingRow.locator('td').first()).toContainText('High Voltage DB Box Wiring');

    const approveButton = pendingRow.locator('button.btn-approve', { hasText: 'Approve' });
    
    // Listen for state refresh network synchronization cycles
    const serviceReloadPromise = page.waitForResponse(
      res => res.url().includes('/api/admin/services') && res.request().method() === 'GET'
    );
    
    await approveButton.click();
    await serviceReloadPromise;

    // Final state validation assertions
    expect(isApprovalTriggered).toBe(true);
    const updatedBadge = page.locator('.approval-badge');
    await expect(updatedBadge).toContainText('Live');
    await expect(updatedBadge).toHaveClass(/approved/);
    await expect(page.locator('button.btn-reject')).toContainText('Revoke');
  });
});