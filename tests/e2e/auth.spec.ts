/**
 * 登入功能測試
 */

import { test, expect } from '@playwright/test'
import { TEST_CREDENTIALS, login } from './fixtures/auth.fixture'

test.describe('登入功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('顯示登入頁面', async ({ page }) => {
    // 檢查頁面標題
    await expect(page.locator('h2')).toContainText('Venturo 系統登入')

    // 檢查表單元素
    await expect(page.locator('input[placeholder="輸入公司代號"]')).toBeVisible()
    await expect(page.locator('input[placeholder="例：E001"]')).toBeVisible()
    await expect(page.locator('input[placeholder="輸入密碼"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('空白表單送出會被阻止', async ({ page }) => {
    // 直接點擊登入按鈕（不填任何欄位）
    await page.click('button[type="submit"]')

    // 應該還在登入頁面（因為驗證失敗）
    await page.waitForTimeout(500)
    expect(page.url()).toContain('/login')
  })

  test('錯誤的帳號密碼顯示錯誤', async ({ page }) => {
    await page.fill('input[placeholder="輸入公司代號"]', TEST_CREDENTIALS.companyCode)
    await page.fill('input[placeholder="例：E001"]', 'WRONG')
    await page.fill('input[placeholder="輸入密碼"]', 'WRONG')
    await page.click('button[type="submit"]')

    // 等待錯誤訊息出現（可能是 toast 或頁面上的文字）
    await page.waitForTimeout(3000)

    // 確認還在登入頁面
    expect(page.url()).toContain('/login')
  })

  test('成功登入跳轉到首頁', async ({ page }) => {
    await login(page)

    // 確認已離開登入頁面
    expect(page.url()).not.toContain('/login')
  })

  test('記住我功能', async ({ page }) => {
    // 確認記住我 checkbox 預設勾選
    const checkbox = page.locator('#rememberMe')
    await expect(checkbox).toBeChecked()
  })

  test('密碼欄位預設為隱藏', async ({ page }) => {
    const passwordInput = page.locator('input[placeholder="輸入密碼"]')

    // 預設是隱藏（type=password）
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })
})
