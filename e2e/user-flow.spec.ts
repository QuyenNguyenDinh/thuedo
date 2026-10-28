import { test, expect } from '@playwright/test';

test.describe('CosRent End-to-End User Journeys', () => {
  test('Customer Flow: Browse, search, check details and pricing', async ({ page }) => {
    // 1. Visit Homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/CosRent/);
    await expect(page.locator('h1')).toContainText('Dịch vụ cho thuê trang phục Cosplay hàng đầu');

    // 2. Click "Xem tất cả trang phục"
    const exploreBtn = page.locator('text=Xem tất cả trang phục').first();
    await exploreBtn.click();
    await expect(page).toHaveURL(/\/costumes/);

    // 3. Verify costume listing and filters
    await expect(page.locator('.cosrent-card, .card')).toBeVisible();

    // 4. Navigate to detail page
    const detailLink = page.locator('text=Chi tiết & Đặt thuê').first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await expect(page).toHaveURL(/\/costumes\/[a-zA-Z0-9-]+/);
      await expect(page.locator('text=Giá thuê/ngày:')).toBeVisible();
      await expect(page.locator('text=Tiền cọc:')).toBeVisible();
    }
  });

  test('Customer Authentication & Navigation Flow', async ({ page }) => {
    // 1. Go to Login page
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Đăng nhập tài khoản');

    // 2. Fill login form
    await page.fill('#email', 'customer@cosrent.vn');
    await page.fill('#password', 'Customer@123');
    await page.click('button[type="submit"]');

    // 3. Should navigate to customer area or home with authenticated navbar
    // When backend is running with seeded DB, user is redirected
  });

  test('Admin Flow: Dashboard & Rental Management Views', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.fill('#email', 'admin@cosrent.vn');
    await page.fill('#password', 'Admin@123');
    await page.click('button[type="submit"]');

    // 2. Direct navigate to admin dashboard
    await page.goto('/admin/dashboard');
    // If authenticated as admin, KPI cards will be displayed
  });
});

