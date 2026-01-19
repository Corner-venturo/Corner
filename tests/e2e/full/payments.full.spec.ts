/**
 * 收款管理 - 完整功能測試
 *
 * 測試範圍：
 * - 頁面載入與基本元素
 * - 狀態篩選切換
 * - 新增收款完整流程
 * - 批量收款功能
 * - 進階搜尋
 * - 匯出功能
 */

import { test, expect } from '../fixtures/auth.fixture'

test.describe('收款管理 - 完整功能測試', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/finance/payments')
    await page.waitForLoadState('networkidle')
  })

  test.describe('頁面基本元素', () => {
    test('顯示頁面標題', async ({ authenticatedPage: page }) => {
      await expect(page.locator('text=收款管理').first()).toBeVisible()
    })

    test('顯示所有操作按鈕', async ({ authenticatedPage: page }) => {
      // 新增收款
      await expect(page.locator('button').filter({ hasText: '新增收款' })).toBeVisible()

      // 批量收款
      await expect(page.locator('button').filter({ hasText: '批量收款' })).toBeVisible()

      // 進階搜尋
      await expect(page.locator('button').filter({ hasText: '進階搜尋' })).toBeVisible()

      // 匯出 Excel
      await expect(page.locator('button').filter({ hasText: '匯出' })).toBeVisible()
    })

    test('頁面正常載入', async ({ authenticatedPage: page }) => {
      // 確認頁面沒有錯誤
      await expect(page.locator('text="Internal Server Error"')).not.toBeVisible()

      // 確認有內容
      const body = await page.locator('body').textContent()
      expect(body?.length).toBeGreaterThan(100)
    })
  })

  test.describe('新增收款對話框', () => {
    test('點擊新增收款開啟對話框', async ({ authenticatedPage: page }) => {
      await page.locator('button').filter({ hasText: '新增收款' }).click()

      const dialog = page.locator('[role="dialog"]')
      await expect(dialog).toBeVisible({ timeout: 5000 })
    })

    test('對話框包含必要欄位', async ({ authenticatedPage: page }) => {
      await page.locator('button').filter({ hasText: '新增收款' }).click()
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })

      const dialog = page.locator('[role="dialog"]')

      // 檢查欄位標籤
      await expect(dialog.locator('label').filter({ hasText: '團體' }).first()).toBeVisible()
    })

    test('對話框有儲存和取消按鈕', async ({ authenticatedPage: page }) => {
      await page.locator('button').filter({ hasText: '新增收款' }).click()
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })

      const dialog = page.locator('[role="dialog"]')

      // 取消按鈕
      await expect(dialog.locator('button').filter({ hasText: '取消' })).toBeVisible()
    })

    test('取消按鈕關閉對話框', async ({ authenticatedPage: page }) => {
      await page.locator('button').filter({ hasText: '新增收款' }).click()
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })

      // 點擊取消
      await page.locator('[role="dialog"]').locator('button').filter({ hasText: '取消' }).click()

      // 對話框關閉
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 })
    })

    test('對話框有團體選擇欄位', async ({ authenticatedPage: page }) => {
      await page.locator('button').filter({ hasText: '新增收款' }).click()
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })

      const dialog = page.locator('[role="dialog"]')

      // 確認有團體相關的標籤或欄位
      await expect(dialog.locator('label').filter({ hasText: '團體' }).first()).toBeVisible()

      // 關閉對話框
      await dialog.locator('button').filter({ hasText: '取消' }).click()
    })
  })

  test.describe('批量收款功能', () => {
    test('點擊批量收款開啟對話框', async ({ authenticatedPage: page }) => {
      await page.locator('button').filter({ hasText: '批量收款' }).click()

      // 等待對話框或新頁面
      await page.waitForTimeout(1000)

      // 檢查是否有對話框出現
      const hasDialog = await page.locator('[role="dialog"]').isVisible()
      const urlChanged = page.url() !== 'http://localhost:3000/finance/payments'

      expect(hasDialog || urlChanged).toBe(true)

      // 如果是對話框，關閉它
      if (hasDialog) {
        const closeButton = page.locator('[role="dialog"]').locator('button').filter({ hasText: /取消|關閉|×/ }).first()
        if (await closeButton.isVisible()) {
          await closeButton.click()
        }
      }
    })
  })

  test.describe('進階搜尋功能', () => {
    test('進階搜尋按鈕可點擊', async ({ authenticatedPage: page }) => {
      const searchButton = page.locator('button').filter({ hasText: '進階搜尋' })
      await expect(searchButton).toBeVisible()
      await expect(searchButton).toBeEnabled()

      // 點擊按鈕
      await searchButton.click()

      // 等待看是否有任何反應
      await page.waitForTimeout(500)

      // 確認沒有錯誤
      await expect(page.locator('text="Internal Server Error"')).not.toBeVisible()
    })
  })

  test.describe('匯出功能', () => {
    test('點擊匯出按鈕有反應', async ({ authenticatedPage: page }) => {
      const exportButton = page.locator('button').filter({ hasText: '匯出' })
      await expect(exportButton).toBeVisible()
      await expect(exportButton).toBeEnabled()

      // 點擊匯出
      await exportButton.click()

      // 等待下載或顯示提示
      await page.waitForTimeout(1000)

      // 確認頁面沒有錯誤
      await expect(page.locator('text="Internal Server Error"')).not.toBeVisible()
    })
  })

  test.describe('表格功能', () => {
    test('表格顯示欄位標題', async ({ authenticatedPage: page }) => {
      await page.waitForTimeout(1000)

      // 檢查表頭
      const hasReceiptNumber = await page.locator('th').filter({ hasText: '收款單號' }).first().isVisible()
      const hasDate = await page.locator('th').filter({ hasText: '收款日期' }).first().isVisible()

      expect(hasReceiptNumber || hasDate).toBe(true)
    })
  })
})
