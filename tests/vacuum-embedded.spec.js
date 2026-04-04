const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const vacuumCardSource = fs.readFileSync(path.join(__dirname, '..', 'vacuum_ccard', 'main.js'), 'utf8');

test('embedded button toggles a full-area Dreame card overlay and back', async ({ page }) => {
  await page.setContent('<!doctype html><html><body></body></html>');

  await page.evaluate(() => {
    class HaIcon extends HTMLElement {}
    class HaCard extends HTMLElement {}
    class DreameVacuumCard extends HTMLElement {
      connectedCallback() {
        this.innerHTML = '<button data-testid="dreame-input" style="width:100%;height:100%">Dreame Input</button>';
        this.querySelector('[data-testid="dreame-input"]')?.addEventListener('click', () => {
          window.__dreameInputClicks = (window.__dreameInputClicks || 0) + 1;
        });
      }
    }
    customElements.define('ha-icon', HaIcon);
    customElements.define('ha-card', HaCard);
    customElements.define('dreame-vacuum-card', DreameVacuumCard);

    window.__createdCards = 0;
    window.__lastCreatedType = '';
    window.__dreameInputClicks = 0;
    window.loadCardHelpers = async () => ({
      createCardElement(config) {
        if (config.type === 'custom:dreame-vacuum-card') {
          window.__createdCards += 1;
          window.__lastCreatedType = config.type;
          const el = document.createElement('dreame-vacuum-card');
          el.setConfig = () => {};
          return el;
        }
        return null;
      },
    });
  });

  await page.addScriptTag({ content: vacuumCardSource });

  await page.evaluate(() => {
    const card = document.createElement('figma-carousel-control-card');
    card.setConfig({
      sensors: [{ entity: 'sensor.vacuum_battery', name: 'Battery' }],
      actions: [{ entity: 'vacuum.robot' }],
      buttons: [{ entity: 'select.vacuum_mode' }],
      images: ['/local/vacuum/mode.gif'],
      embedded_button: {
        label: 'Open map',
        icon: 'mdi:map-search',
        close_label: 'Back',
        close_icon: 'mdi:arrow-left',
      },
      embedded_card: {
        type: 'custom:dreame-vacuum-card',
        entity: 'vacuum.robot',
      },
    });
    card.hass = {
      states: {
        'sensor.vacuum_battery': { state: '88', attributes: { unit_of_measurement: '%', friendly_name: 'Battery' } },
        'vacuum.robot': { state: 'docked', attributes: { friendly_name: 'Robot' } },
        'select.vacuum_mode': { state: 'Standard', attributes: { options: ['Quiet', 'Standard', 'Turbo'] } },
      },
      callService: () => {},
    };
    document.body.appendChild(card);
  });

  const card = page.locator('figma-carousel-control-card');
  const openButton = card.locator('.embedded-toggle-host [data-embedded-toggle]');
  await expect(openButton).toBeVisible();
  await openButton.click();

  const embeddedLayer = card.locator('[data-embedded-layer]');
  await expect(embeddedLayer).toBeVisible();
  await expect(card.locator('.content')).toHaveClass(/embedded-open/);
  await expect.poll(async () => card.evaluate((el) => (el.shadowRoot?.querySelector('[data-embedded-host]')?.childElementCount ?? 0))).toBeGreaterThan(0);
  await expect(card.locator('.embedded-toolbar [data-embedded-toggle] span')).toHaveText('Back');

  await card.evaluate((el) => {
    const button = el.shadowRoot?.querySelector('dreame-vacuum-card [data-testid="dreame-input"]');
    if (!(button instanceof HTMLElement)) throw new Error('Embedded input button not found');
    button.click();
  });

  const [createdCards, lastCreatedType, inputClicks] = await page.evaluate(() => [window.__createdCards, window.__lastCreatedType, window.__dreameInputClicks]);
  expect(createdCards).toBe(1);
  expect(lastCreatedType).toBe('custom:dreame-vacuum-card');
  expect(inputClicks).toBe(1);

  await card.locator('.embedded-toolbar [data-embedded-toggle]').click();
  await expect(card.locator('[data-embedded-layer]')).toHaveCount(0);
  await expect(card.locator('.content')).not.toHaveClass(/embedded-open/);
});
