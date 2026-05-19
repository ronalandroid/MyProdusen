import { defineConfig, devices } from '@playwright/test';

const explicitBaseURL = process.env.E2E_BASE_URL;
const localPort = process.env.E2E_PORT || '3010';
const baseURL = explicitBaseURL || `http://127.0.0.1:${localPort}`;
const browserMatrixEnabled = process.env.E2E_BROWSER_MATRIX === '1';

const responsiveProjects = [
  { name: 'mobile-360', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true } },
  { name: 'mobile-390', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  { name: 'tablet-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true } },
  { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
];

const browserProjects = [
  { name: 'chromium-browser', use: { ...devices['Desktop Chrome'], browserName: 'chromium' as const, viewport: { width: 1440, height: 900 } } },
  { name: 'firefox-browser', use: { ...devices['Desktop Firefox'], browserName: 'firefox' as const, viewport: { width: 1440, height: 900 } } },
  { name: 'webkit-browser', use: { ...devices['Desktop Safari'], browserName: 'webkit' as const, viewport: { width: 1440, height: 900 } } },
];

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 7_500 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  webServer: explicitBaseURL
    ? undefined
    : {
        command: `PORT=${localPort} npm run start:prod`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: false,
  },
  projects: browserMatrixEnabled ? browserProjects : responsiveProjects,
});
