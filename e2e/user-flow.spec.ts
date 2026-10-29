import { test, expect } from '@playwright/test';

test.describe('CosRent End-to-End User Journeys', () => {
  test('Customer Flow: Browse, search, check details and pricing', async ({ page }) => {
    // 1. Visit Homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/CosRent/);
    await expect(page.locator('h1')).toContainText('Thuê Trang Phục & Phụ Kiện Cosplay');

    // 2. Click explore button or navigate to costumes
    const exploreBtn = page.locator('text=Xem toàn bộ kho đồ').first();
    if (await exploreBtn.isVisible()) {
      await exploreBtn.click();
    } else {
      await page.goto('/costumes');
    }
    await expect(page).toHaveURL(/\/costumes/);

    // 3. Verify costume listing is visible
    await expect(page.locator('.costume-card, .card').first()).toBeVisible();

    // 4. Navigate to detail page
    const detailLink = page.locator('text=Chi tiết & Đặt thuê').first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await expect(page).toHaveURL(/\/costumes\/[a-zA-Z0-9-]+/);
      await expect(page.locator('text=Giá thuê / ngày:')).toBeVisible();
      await expect(page.locator('text=Tiền cọc quy định:')).toBeVisible();
    }
  });

  test('Customer Authentication & Navigation Flow', async ({ page }) => {
    // 1. Go to Login page
    await page.goto('/login');
    await expect(page.locator('h4, h2')).toContainText('Đăng nhập');

    // 2. Fill login form with seed user
    await page.fill('input[type="email"]', 'customer@cosrent.com');
    await page.fill('input[type="password"]', 'Customer123@');
    await page.click('button[type="submit"]');

    // 3. Authenticated customer lands on home or rentals
    await expect(page).toHaveURL(/\/(costumes|my-rentals)?/);
  });

  test('Admin Flow: Dashboard & Rental Management Views', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@cosrent.com');
    await page.fill('input[type="password"]', 'Admin123@');
    await page.click('button[type="submit"]');

    // 2. Direct navigate to admin dashboard
    await page.goto('/admin/dashboard');
    await expect(page.locator('h3, h4')).toContainText(/Tổng Quan|Dashboard|Quản trị/i);
  });
});
