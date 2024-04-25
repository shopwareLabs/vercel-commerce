import { expect, Locator, Page } from '@playwright/test';

export class ProductPage {
  readonly page: Page;
  readonly sizeLocator: Locator;
  readonly colourLocator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sizeLocator = page.getByRole('button', { name: 'M' });
    this.colourLocator = page.getByRole('button', { name: 'blue' });
  }

  async addToCart() {
    await expect(async () => {
      await this.page.getByLabel('Add to cart').waitFor();
      await this.page.getByLabel('Add to cart').dispatchEvent('click');
      await expect(this.page.locator('div').filter({ hasText: /^My Cart$/ })).toBeVisible();
    }).toPass({
      // Probe, wait 1s, probe, wait 2s, probe, wait 10s, probe, wait 10s, probe, .... Defaults to [100, 250, 500, 1000].
      intervals: [1_000, 2_000, 10_000],
      timeout: 60_000
    });
  }

  async selectVariant() {
    await expect(async () => {
      await this.page.waitForSelector("button[title='Size M']");
      await this.colourLocator.click();
      await this.page.waitForSelector("button[title='Colour blue']");
      await this.sizeLocator.click();
      await expect(this.sizeLocator).toHaveClass(/ring-2/);
      await expect(this.colourLocator).toHaveClass(/ring-2/);
    }).toPass({
      // Probe, wait 1s, probe, wait 2s, probe, wait 10s, probe, wait 10s, probe, .... Defaults to [100, 250, 500, 1000].
      intervals: [2_000, 5_000, 15_000],
      timeout: 60_000
    });
  }
}
