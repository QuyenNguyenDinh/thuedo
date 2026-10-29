import { test, expect } from '@playwright/test';

test.describe('CosRent End-to-End User Journeys', () => {
  test('Customer Flow: Browse, search, check details and pricing', async ({ page }) => {
    // 1. Visit Homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/CosRent/);
    await expect(page.locator('h1')).toContainText('Thuê Trang Phục & Phụ Kiện Cosplay');

    // 2. Click explore button or navigate to costumes
    const exploreBtn = page.locator('text=Xem toàn bộ kho đồ').first();
    await expect(exploreBtn).toBeVisible();
    await exploreBtn.click();
    await expect(page).toHaveURL(/\/costumes/);

    // 3. Verify costume listing is visible
    const firstCard = page.locator('.costume-card, .card').first();
    await expect(firstCard).toBeVisible();

    // 4. Navigate to detail page
    const detailLink = page.locator('a:has-text("Chi tiết & Đặt thuê"), a:has-text("Xem chi tiết")').first();
    await expect(detailLink).toBeVisible();
    await detailLink.click();

    // Verify detail page elements
    await expect(page).toHaveURL(/\/costumes\/[a-zA-Z0-9-]+/);
    await expect(page.getByText('Giá thuê niêm yết', { exact: true })).toBeVisible();
    await expect(page.getByText('Tiền cọc quy định', { exact: true })).toBeVisible();
    await expect(page.getByText('1. Chọn kích cỡ trang phục', { exact: true })).toBeVisible();
  });

  test('Customer Authentication & Navigation Flow', async ({ page }) => {
    // 1. Go to Login page
    await page.goto('/login');
    await expect(page.locator('h3, h2, h4')).toContainText('Đăng nhập');

    // 2. Fill login form with seed user
    await page.fill('#email', 'customer@cosrent.com');
    await page.fill('#password', 'Customer123@');
    await page.click('button[type="submit"]');

    // 3. Authenticated customer must see user dropdown
    await expect(page.locator('#dropdown-user')).toBeVisible({ timeout: 10000 });

    // 4. Navigate to My Rentals
    await page.goto('/my-rentals');
    await expect(page.locator('h3')).toContainText('Đơn Thuê Của Tôi');
  });

  test('Admin Flow: Dashboard, Rental Management & Category Management Views', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.fill('#email', 'admin@cosrent.com');
    await page.fill('#password', 'Admin123@');
    await page.click('button[type="submit"]');

    // 2. Wait for admin credentials to load
    await expect(page.locator('#dropdown-user')).toBeVisible({ timeout: 10000 });

    // 3. Direct navigate to admin dashboard
    await page.goto('/admin/dashboard');
    await expect(page.locator('h3, h4')).toContainText(/Tổng Quan|Dashboard|Quản trị/i);
    await expect(page.locator('text=Tổng doanh thu')).toBeVisible();

    // 4. Admin navigates to Category Management
    await page.goto('/admin/categories');
    await expect(page.locator('h3')).toContainText('Quản Lý Danh Mục Trang Phục');

    // 5. Admin navigates to Rental Orders Management
    await page.goto('/admin/rentals');
    await expect(page.getByRole('heading', { level: 3, name: 'Quản Lý & Xử Lý Đơn Thuê' })).toBeVisible();
  });
});
