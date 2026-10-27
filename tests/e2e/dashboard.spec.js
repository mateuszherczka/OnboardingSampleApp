// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Onboarding Dashboard', () => {
  test('should display the dashboard heading', async ({ page }) => {
    await page.goto('/');

    // Verify the main heading is visible
    await expect(page.locator('h1')).toContainText('Onboarding Dashboard');
  });

  test('should show navigation tabs', async ({ page }) => {
    await page.goto('/');

    // Verify all navigation tabs are present
    await expect(page.locator('.tab')).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Customer Info' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Data Mapping' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tenant Setup' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import' })).toBeVisible();
  });

  test('should display all customers in onboarding queue', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.customer-card h3')).toContainText([
      'Acme Corporation', 'ABC Accounting', 'XYZ Financial Services', 'Premier Bookkeeping'
    ]);
  });

  test('marking a step done updates progress, and undoing it reverts', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.customer-card', { hasText: 'Premier Bookkeeping' });
    const step = card.getByRole('checkbox', { name: 'Data Mapping' });

    await expect(step).toHaveAttribute('aria-checked', 'false');
    await step.click();
    await expect(step).toHaveAttribute('aria-checked', 'true');
    await expect(card.locator('.progress-bar')).toHaveText('50%');

    await page.reload();
    await expect(card.locator('.progress-bar')).toHaveText('50%');

    await step.click();
    await expect(step).toHaveAttribute('aria-checked', 'false');
    await expect(card.locator('.progress-bar')).toHaveText('25%');
  });

  test('Customer Info is automatic and cannot be toggled by hand', async ({ page }) => {
    await page.goto('/');
    const step = page.locator('.customer-card', { hasText: 'ABC Accounting' }).getByRole('checkbox', { name: 'Customer Info' });

    await expect(step).toHaveAttribute('aria-checked', 'true');
    await step.click();
    await expect(step).toHaveAttribute('aria-checked', 'true');
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/');

    // Click on Customer Info tab
    await page.getByRole('button', { name: 'Customer Info' }).click();
    
    await expect(page.getByRole('heading', { name: 'Customer Info' })).toBeVisible();
  });

  test('adding a customer puts it in the queue at 25%', async ({ page }) => {
    const name = `E2E Co ${Date.now()}`;
    await page.goto('/');
    await page.getByRole('button', { name: 'Customer Info' }).click();

    await page.getByRole('button', { name: 'Add to queue' }).click();
    await expect(page.getByText('Company name is required')).toBeVisible();

    await page.getByLabel('Company name').fill(name);
    await page.getByLabel('Location').fill('Europe');
    await page.getByLabel('Type').fill('Accounting');
    await page.getByRole('button', { name: 'Add to queue' }).click();

    const card = page.locator('.customer-card', { hasText: name });
    await expect(card.locator('.progress-bar')).toHaveText('25%');
  });
});
