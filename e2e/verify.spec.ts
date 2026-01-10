import { test, expect } from '@playwright/test';

test.describe('UI Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Wait for the welcome screen to be visible
    await page.waitForSelector('.crawl-container', { timeout: 60000 });
  });

  test('should display the starfield background and crawl text on the start screen', async ({ page }) => {
    // Wait for the animation to start
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'start_screen.png' });
  });

  test('should display the retro terminal background on the console screen', async ({ page }) => {
    // Click the "Board Ship" button to navigate to the console
    await page.click('button:has-text("Board Ship")');
    // Wait for the main console to be visible
    await page.waitForSelector('.sci-fi-box', { timeout: 60000 });
    // This is the "Things to do first" screen
    await page.waitForSelector('h2:has-text("Things to do First")', { timeout: 60000 });
    await page.screenshot({ path: 'console_screen_things_to_do.png' });

    // Acknowledge the directive to see the main console with the table
    await page.click('button:has-text("ACKNOWLEDGE DIRECTIVE")');
    await page.waitForSelector('table', { timeout: 60000 });
    await page.screenshot({ path: 'console_screen_main.png' });
  });

  test('should display the starfield background on the Travel screen', async ({ page }) => {
    // Click the "Board Ship" button to navigate to the console
    await page.click('button:has-text("Board Ship")');
    // Acknowledge the directive
    await page.click('button:has-text("ACKNOWLEDGE DIRECTIVE")');
    // Click the "Travel" button
    await page.click('button:has-text("Travel")');
    // Wait for the travel screen to be visible
    await page.waitForSelector('h2:has-text("C.A.T. Station")', { timeout: 60000 });
    await page.screenshot({ path: 'travel_screen.png' });
  });
});
