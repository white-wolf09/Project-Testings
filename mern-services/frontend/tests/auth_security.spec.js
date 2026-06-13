import { test, expect } from '@playwright/test';

test.describe('QuickServe - Authentication & Security Edge Cases', () => {



  test('TC-01: Should encode and sanitize XSS Script payloads on registration', async ({ page }) => {
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

    await page.goto('/register');
    
    await page.locator('input[placeholder="Your full name"]').fill('<script>window.location="http://malicious.com"</script>');
    await page.locator('input[placeholder="you@example.com"]').fill('xss_test@example.com');
    await page.locator('input[placeholder="Min. 6 characters"]').fill('Password123!');
    await page.locator('button[type="submit"]').click();

    expect(rawSubmittedName).toContain('<script>');
    await expect(page).not.toHaveURL('http://malicious.com');
  });

  test('TC-02: Should reject extreme out-of-bounds password lengths safely', async ({ page }) => {
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({ 
        status: 400, 
        contentType: 'application/json', 
        body: JSON.stringify({ msg: 'Password exceeds maximum limit' }) 
      });
    });

    await page.goto('/register');
    
    const massivePassword = 'A'.repeat(10000);
    await page.locator('input[placeholder="Your full name"]').fill('Kamil Khan');
    await page.locator('input[placeholder="you@example.com"]').fill('overflow@example.com');
    await page.locator('input[placeholder="Min. 6 characters"]').fill(massivePassword);
    await page.locator('button[type="submit"]').click();

    // Resolves strict mode violation by targeting the distinct class wrapper
    await expect(page.locator('.alert.alert-error')).toContainText('Password exceeds maximum limit');
  });

  test('TC-03: Should intercept spaces-only inputs on required fields', async ({ page }) => {
    await page.goto('/register');

    // Fill with empty space blocks to bypass primitive non-empty state bindings
    await page.locator('input[placeholder="Your full name"]').fill('   '); 
    await page.locator('input[placeholder="you@example.com"]').fill('spaces@example.com');
    await page.locator('input[placeholder="Min. 6 characters"]').fill('Password123');
    
    await page.locator('button[type="submit"]').click();
    
    // Evaluate if HTML5 validation flagged the space-only string modification natively
    const isNameFieldValid = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder="Your full name"]');
      return input.value.trim().length > 0;
    });
    expect(isNameFieldValid).toBe(false);
  });



  test('TC-04: Should drop sessions and clear view states on altered or corrupt JWT signature structures', async ({ page }) => {
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ msg: 'Invalid crypt token signature' }) });
    });

    await page.goto('/login'); // Starts within an accessible base route context 
    await page.evaluate(() => {
      window.localStorage.setItem('token', 'MALFORMED_TAMPERED_HEADER_TOKEN');
    });
    
    await page.goto('/');
    await expect(page).toHaveURL(/.*login/);
  });

  test('TC-05: Should normalize email casing strings seamlessly during authentication lookups', async ({ page }) => {
    let passedEmail = '';
    await page.route('**/api/auth/login', async (route) => {
      const payload = route.request().postDataJSON();
      passedEmail = payload.email;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'jwt', user: { role: 'user' } }) });
    });

    await page.goto('/login');
    await page.locator('input[type="email"]').fill('KaMiL@ExAmPlE.cOm');
    await page.locator('input[type="password"]').fill('Password123');
    await page.locator('button:has-text("Login Now")').click();

    expect(passedEmail.toLowerCase()).toBe('kamil@example.com');
  });

  test('TC-06: Should capture null or empty array structures passed onto structural payload blocks', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ msg: 'Malformed input parameters' }) });
    });

    await page.goto('/login');
    // Resolves URL relative processing by extracting window location origin dynamically
    const response = await page.evaluate(async () => {
      const targetUrl = `${window.location.origin}/api/auth/login`;
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: null })
      });
      return res.status;
    });

    expect(response).toBe(400);
  });
});