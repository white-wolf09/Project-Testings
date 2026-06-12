import { test, expect } from '@playwright/test';

test.describe('QuickServe - Integrated Provider Lifecycle Suite', () => {
  // Shared mock states matching your MERN component structure
  const mockProviderUser = {
    _id: 'provider_777',
    id: 'provider_777',
    name: 'Zeeshan Electrician',
    email: 'zeeshan@sparky.com',
    role: 'provider',
    providerType: 'Electrician'
  };

  const initialMockServices = [
    {
      _id: 'srv_101',
      title: 'Ceiling Fan Installation',
      description: 'Quick mounting and safe regulator setup.',
      category: 'Electrician',
      price: 800,
      approved: true
    }
  ];

  const mockBookings = [
    {
      _id: 'bk_201',
      service: { title: 'Ceiling Fan Installation' },
      user: { name: 'Kashif Khan', email: 'kashif@gmail.com' },
      date: '2026-08-20T00:00:00.000Z',
      phone: '03001234567',
      address: 'House 45, Street 2, DHA Phase 5, Lahore',
      status: 'accepted'
    }
  ];

  test('should handle seamless registration, dashboard routing, and new service publishing', async ({ page }) => {
    
    // ── STEP 1: SETUP HIGH-FIDELITY ROUTE INTERCEPTIONS ──
    
    // Session persistent handshake intercept
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProviderUser)
      });
    });

    // Registration network catcher
    await page.route('**/api/auth/register', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockProviderUser)
        });
      }
    });

    // Provider listing load interceptors
    await page.route('**/api/services/mine/list', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(initialMockServices)
      });
    });

    await page.route('**/api/bookings/provider', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockBookings)
      });
    });

    // Post new service interceptor
    let capturedServicePayload = null;
    await page.route('**/api/services', async (route) => {
      if (route.request().method() === 'POST') {
        capturedServicePayload = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ msg: 'Success' })
        });
      }
    });


    // ── STEP 2: EXECUTE PROVIDER REGISTRATION FLOW ──
    
    await page.goto('/register');
    
    await page.getByPlaceholder('Your full name').fill('Zeeshan Electrician');
    await page.locator('input[type="email"]').fill('zeeshan@sparky.com');
    await page.locator('input[type="password"]').fill('secure123');

    // Switch account type toggle to Service Provider
    await page.locator('.role-btn', { hasText: 'Service Provider' }).click();
    
    // Select dropdown option corresponding to the user profile mapping
    await page.locator('select.form-input').selectOption('Electrician');

    // Monitor registration execution thread safely
    const registerResponsePromise = page.waitForResponse(
      res => res.url().includes('/api/auth/register') && res.request().method() === 'POST'
    );
    await page.locator('.auth-btn').click();
    await registerResponsePromise;


    // ── STEP 3: NAVIGATE TO DASHBOARD & VERIFY INITIAL DATA METRICS ──
    
    await page.goto('/provider');
    await expect(page).toHaveURL('http://localhost:5173/provider');

    // Confirm UI header states read context profile data parameters accurately
    await expect(page.locator('.page-title')).toContainText('Zeeshan Electrician');
    await expect(page.locator('.provider-type-pill')).toContainText('Electrician');
    
    // Check initial service panel counter state
    await expect(page.locator('.mini-stat').first().locator('.mini-stat-num')).toContainText('1');


    // ── STEP 4: INTERACT WITH THE OPERATION SYSTEM (ADD NEW SERVICE) ──
    
    // Fill structural pricing and description elements
    await page.locator('input[placeholder="e.g. Expert Pipe Repair"]').fill('Short Circuit Diagnostic Fixing');
    await page.locator('textarea[placeholder="Describe what you offer..."]').fill('Complete inspection of DB breakers, short insulation fault tracking, and grounding setup.');
    await page.locator('input[type="number"]').fill('1500');

    // Capture post tracking cycle safely
    const servicePostPromise = page.waitForResponse(
      res => res.url().includes('/api/services') && res.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]', { hasText: 'Publish Service' }).click();
    await servicePostPromise;

    // Verify sent payload configurations match your MERN data structural keys perfectly
    expect(capturedServicePayload).not.toBeNull();
    expect(capturedServicePayload.title).toBe('Short Circuit Diagnostic Fixing');
    expect(capturedServicePayload.price).toBe(1500);
    expect(capturedServicePayload.category).toBe('Electrician');
    
    // Validate custom re-approval alert notice block display mechanics
    await expect(page.locator('.alert-success')).toBeVisible();
    await expect(page.locator('.alert-success')).toContainText('Service submitted! It will go live once an admin approves it.');
  });
});