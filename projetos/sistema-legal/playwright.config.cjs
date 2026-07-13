// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const isCI = !!process.env.CI;

// Em CI o workflow instala dependências e corre seed; localmente o Playwright trata disso.
const backendCmd = isCI
  ? 'cd backend && node server.js'
  : 'cd backend && (npm ci || npm install) && npm run seed && npm start';

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: backendCmd,
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !isCI,
      timeout: 120000,
    },
    {
      command: 'npx serve -p 8000',
      url: 'http://localhost:8000',
      reuseExistingServer: !isCI,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
