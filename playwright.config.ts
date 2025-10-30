import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright 配置 - IndexedDB 同步測試
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // IndexedDB 測試需要順序執行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 單執行緒，避免 IndexedDB 衝突
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
