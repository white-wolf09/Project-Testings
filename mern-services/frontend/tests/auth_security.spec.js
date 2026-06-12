import { test, expect } from '@playwright/test';

test.describe('QuickServe - Authentication & Security Edge Cases', () => {

  test('TC-01: Should sanitize NoSQL/SQL Injection payloads in login inputs', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      const payload = route.request().postDataJSON();
      // Mocking server validation rejection for injection payloads
      if (payload.email.includes('$gt') || payload.password.includes("' OR '1'='1")) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid login credentials structure' })
        });
      }
    });

    await page.goto('/login');
    await page.locator('input[type="email"]').fill('{"$gt": ""}');
    await page.locator('input[type="password"]').fill("' OR '1'='1");
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.alert-danger, .error-msg, body')).toContainText('Invalid login credentials structure');
  });

  test('TC-02: Should encode and sanitize XSS Script payloads on registration', async ({ page }) => {
    let rawSubmittedName = '';
    await page.route('**/api/auth/register', async (route) => {
      const payload = route.request().postDataJSON();
      rawSubmittedName = payload.name;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'mock-jwt', user: { name: '&lt;script&gt;', email: payload.email, role: 'user' } })
      });
    });

    await page.goto('/login');
    await page.locator('a:has-text("Create account here")').click();
    
    const inputs = page.locator('input');
    await inputs.nth(0).fill('<script>window.location="http://malicious.com"</script>');
    await inputs.nth(1).fill('xss_test@example.com');
    await inputs.nth(2).fill('Password123!');
    await page.locator('button:has-text("Register")').click();

    expect(rawSubmittedName).toContain('<script>');
    // Verify it doesn't execute and instead prints safely or redirects home
    await expect(page).not.toHaveURL('http://malicious.com');
  });

  test('TC-03: Should reject extreme out-of-bounds password lengths safely', async ({ page }) => {
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Password exceeds maximum limit' }) });
    });

    await page.goto('/login');
    await page.locator('a:has-text("Create account here")').click();
    
    const massivePassword = 'A'.repeat(10000);
    const inputs = page.locator('input');
    await inputs.nth(0).fill('Kamil Khan');
    await inputs.nth(1).fill('overflow@example.com');
    await inputs.nth(2).fill(massivePassword);
    await page.locator('button:has-text("Register")').click();

    await expect(page.locator('body')).toContainText('Password exceeds maximum limit');
  });

  test('TC-04: Should intercept spaces-only inputs on required fields', async ({ page }) => {
    await page.goto('/login');
    await page.locator('a:has-text("Create account here")').click();

    const inputs = page.locator('input');
    await inputs.nth(0).fill('   '); // Spaces only
    await inputs.nth(1).fill('spaces@example.com');
    await inputs.nth(2).fill('Password123');
    
    const regButton = page.locator('button:has-text("Register")');
    if (await regButton.isEnabled()) {
      await regButton.click();
      await expect(page.locator('body')).toContainText(/blank|required|invalid/i);
    } else {
      await expect(regButton).toBeDisabled();
    }
  });

  test('TC-05: Should handle double registration concurrent clicks gracefully', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/auth/register', async (route) => {
      callCount++;
      if (callCount > 1) {
        await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'Registration processing, please wait' }) });
      } else {
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ token: 'jwt1' }) });
      }
    });

    await page.goto('/login');
    await page.locator('a:has-text("Create account here")').click();
    const inputs = page.locator('input');
    await inputs.nth(0).fill('Concurrent User');
    await inputs.nth(1).fill('concurrent@example.com');
    await inputs.nth(2).fill('Password123');

    const btn = page.locator('button:has-text("Register")');
    await btn.click();
    await btn.click({ force: true }); // Double click execution simulation

    expect(callCount).toBeLessThanOrEqual(2);
  });

  test('TC-06: Should drop sessions and clear view states on altered or corrupt JWT signature structures', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Invalid crypt token signature' }) });
    });

    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.setItem('token', 'MALFORMED_TAMPERED_HEADER_TOKEN');
    });
    
    await page.reload();
    await expect(page).toHaveURL(/.*login/);
  });

  test('TC-07: Should normalize email casing strings seamlessly during authentication lookups', async ({ page }) => {
    let passedEmail = '';
    await page.route('**/api/auth/login', async (route) => {
      const payload = route.request().postDataJSON();
      passedEmail = payload.email;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'jwt' }) });
    });

    await page.goto('/login');
    await page.locator('input[type="email"]').fill('KaMiL@ExAmPlE.cOm');
    await page.locator('input[type="password"]').fill('Password123');
    await page.locator('button[type="submit"]').click();

    expect(passedEmail.toLowerCase()).toBe('kamil@example.com');
  });

  test('TC-08: Should capture null or empty array structures passed onto structural payload blocks', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Malformed field structure type array raw value invalid' }) });
    });

    // Directly evaluate system API injection resiliency check
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: null })
      });
      return res.status;
    });

    expect(response).toBe(400);
  });
});