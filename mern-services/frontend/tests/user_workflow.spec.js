import { test, expect } from '@playwright/test';

test.describe('QuickServe - End-to-End Customer Registration & Booking Journey', () => {
  
  const uniqueId = `user_${Date.now()}`;
  const registrationPayload = {
    name: 'Kamil Khan',
    email: `kamil_${Date.now()}@example.com`,
    password: 'SecurePassword123'
  };

  const mockRegisteredUser = {
    _id: uniqueId,
    id: uniqueId,
    name: registrationPayload.name,
    email: registrationPayload.email,
    role: 'user'
  };

  const mockMarketServices = [
    {
      _id: 'srv_ac_01',
      title: 'AC Repair',
      category: 'AC Repair',
      subCategory: 'Maintenance',
      price: 2339,
      description: 'Nothing',
      createdAt: '2026-06-01T10:00:00.000Z',
      provider: { _id: 'prov_faheem', name: 'Faheem', email: 'faheem1@gmail.com' }
    }
  ];

  test.beforeEach(async ({ context, page }) => {
    // Inject persistent session tokens directly into cookies to support local storage
    await context.addCookies([
      { name: 'token', value: 'mock-freshly-generated-jwt-token-string', domain: 'localhost', path: '/' }
    ]);

    // Keep profile validation calls permanently mocked
    await page.route(/\/api\/auth\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockRegisteredUser),
        headers: {
          'Authorization': 'Bearer mock-freshly-generated-jwt-token-string'
        }
      });
    });
  });

  test('should register a new user, navigate marketplace, and book an AC repair successfully', async ({ page }) => {
    
    // ── STEP 1: ROUTE INTERCEPT CONFIGURATION ──
    await page.route('**/api/auth/register', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ 
            token: 'mock-freshly-generated-jwt-token-string', 
            user: mockRegisteredUser 
          })
        });
      }
    });

    await page.route(/\/api\/services\?category=/, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockMarketServices) });
    });

    await page.route('**/api/services/srv_ac_01', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockMarketServices[0]) });
    });

    let isBookingDispatched = false;
    await page.route('**/api/bookings', async (route) => {
      if (route.request().method() === 'POST') {
        isBookingDispatched = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ msg: "Booking placed successfully!" })
        });
      }
    });

    // ── STEP 2: USER REGISTRATION ──
    await page.goto('/login');
    await expect(page).toHaveURL('http://localhost:5173/login');

    await page.locator('a', { hasText: /Create account here/i }).click();
    await page.waitForTimeout(300);

    const allFormInputs = page.locator('input');
    await allFormInputs.nth(0).fill(registrationPayload.name);     
    await allFormInputs.nth(1).fill(registrationPayload.email);    
    await allFormInputs.nth(2).fill(registrationPayload.password); 

    const registrationResponsePromise = page.waitForResponse(
      res => res.url().includes('/api/auth/register') && res.request().method() === 'POST'
    );
    await page.locator('button', { hasText: /Register|Create/i }).click();
    await registrationResponsePromise;

    // Synchronize global storage keys
    await page.evaluate((userData) => {
      window.localStorage.setItem('token', 'mock-freshly-generated-jwt-token-string');
      window.localStorage.setItem('user', JSON.stringify(userData));
    }, mockRegisteredUser);

    await page.goto('/');
    await expect(page).toHaveURL('http://localhost:5173/');

    // ── STEP 3: CATEGORY & BROWSE SELECTION ──
    const targetCategoryCard = page.locator('.category-card', { hasText: 'AC Repair' });
    await targetCategoryCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    const categoryFetchPromise = page.waitForResponse(
      res => res.url().includes('/api/services') && res.request().method() === 'GET'
    );
    await targetCategoryCard.click({ force: true });
    await categoryFetchPromise; 

    // ── STEP 4: SERVICE DETAIL SELECTION & BOOKING FORMS ──
    const targetCard = page.locator('.service-card', { hasText: 'AC Repair' });
    await targetCard.locator('.card-link').click();
    await expect(page).toHaveURL(new RegExp('.*\\/services\\/srv_ac_01'));

    const bookingForm = page.locator('.booking-form, form, .card'); 
    await expect(bookingForm).toBeVisible();

    await bookingForm.locator('input[placeholder*="Where should"]').fill('House No. 42-B, Sector Z, Lahore');
    await bookingForm.locator('input[type="tel"]').fill('+923001234567');
    
    // Key-by-key MM/DD/YYYY input entry sequence
    const nativeDateInput = bookingForm.locator('input[type="date"]');
    await nativeDateInput.focus();
    await nativeDateInput.pressSequentially('06252026', { delay: 40 });
    await nativeDateInput.blur(); 

    // Fire confirmation dispatch event
    const bookingPostPromise = page.waitForResponse(
      res => res.url().includes('/api/bookings') && res.request().method() === 'POST'
    );
    await page.locator('button', { hasText: 'Confirm Booking' }).click();
    await bookingPostPromise; 

    // Final Assertions: Confirm form submittal completed and the template success banner painted
    expect(isBookingDispatched).toBe(true);
    
    const successAlert = page.locator('.alert-success, [class*="success"]');
    await expect(successAlert).toBeVisible();
  });
});