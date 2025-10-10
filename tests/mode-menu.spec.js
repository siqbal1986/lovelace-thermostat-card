const { test, expect } = require('@playwright/test');

const sandboxPath = '/sandbox/index.html';

async function openModeMenu(page) {
  await page.goto(sandboxPath);
  await page.waitForLoadState('networkidle');

  await page.waitForFunction(() => {
    const element = document.querySelector('thermostat-card');
    return (
      !!element &&
      !!element.shadowRoot &&
      !!element.shadowRoot.querySelector('button[aria-label="Toggle HVAC modes"]')
    );
  });

  const card = page.locator('thermostat-card');
  const toggler = card.locator('button[aria-label="Toggle HVAC modes"]');
  await toggler.click();
  await expect(toggler).toHaveAttribute('aria-expanded', 'true');

  return card;
}

test('positions HVAC mode toggle between center and lower rim', async ({ page }) => {
  const card = await openModeMenu(page);

  const layout = await card.evaluate((cardEl) => {
    const root = cardEl.shadowRoot;
    const dial = root.querySelector('.dial');
    const toggler = root.querySelector('button[aria-label="Toggle HVAC modes"]');

    if (!dial || !toggler) {
      throw new Error('Dial or HVAC mode toggler not found');
    }

    const dialRect = dial.getBoundingClientRect();
    const togglerRect = toggler.getBoundingClientRect();

    return {
      radius: dialRect.width / 2,
      centerY: dialRect.top + dialRect.height / 2,
      dialBottom: dialRect.bottom,
      togglerBottom: togglerRect.bottom,
      togglerCenterY: togglerRect.top + togglerRect.height / 2,
      togglerWidth: togglerRect.width,
      togglerHeight: togglerRect.height,
      togglerBottomStyle: getComputedStyle(toggler).bottom,
    };
  });
  const bottomOffset = Number.parseFloat(layout.togglerBottomStyle);

  expect(layout.radius).toBeGreaterThan(0);
  expect(Math.abs(layout.togglerWidth - layout.togglerHeight)).toBeLessThanOrEqual(1);
  expect(layout.togglerCenterY).toBeGreaterThan(layout.centerY);
  expect(layout.togglerCenterY).toBeLessThan(layout.dialBottom);

  expect(Number.isNaN(bottomOffset)).toBe(false);
  const expectedOffset = layout.radius * 0.2;
  expect(Math.abs(bottomOffset - expectedOffset)).toBeLessThanOrEqual(6);

  const actualOffsetFromDial = layout.dialBottom - layout.togglerBottom;
  expect(actualOffsetFromDial).toBeGreaterThan(0);
});
