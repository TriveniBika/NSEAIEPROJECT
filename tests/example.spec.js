// @ts-check
import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'parallel' });
//test.describe.configure({ mode: 'serial' }); //use if interdependent tests are present
test('TC01: has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('TC02: get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});

test('TC03: Browser playwright test', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('https://google.com/');
    await page.waitForLoadState('networkidle');
    console.log(await page.title());
    expect(await page.title()).toBe('Google');
    await expect(page).toHaveTitle("Google");

});