// @ts-check
const path = require('path');

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: path.join(__dirname, 'tests'),
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    baseURL: 'http://127.0.0.1:4173'
  },
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173/sandbox/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    cwd: __dirname
  }
};

module.exports = config;
