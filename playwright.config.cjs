// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'cd projetos/sistema-legal && npx serve -l 8000 -c serve.json .',
    url: 'http://localhost:8000/index.html',
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
