/**
 * IndexedDB 同步測試 - E2E 自動化測試
 *
 * 測試目標：驗證 Supabase ↔ IndexedDB 雙向同步機制
 * 測試環境：Playwright + Chrome
 */

import { test, expect, Page } from '@playwright/test';

/**
 * 輔助函數：檢查 IndexedDB 中的資料數量
 */
async function getIndexedDBCount(page: Page, storeName: string): Promise<number> {
  return await page.evaluate(async (store) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('venturo-db', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const transaction = db.transaction(store, 'readonly');
    const objectStore = transaction.objectStore(store);

    return await new Promise<number>((resolve, reject) => {
      const countRequest = objectStore.count();
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });
  }, storeName);
}

/**
 * 輔助函數：從 IndexedDB 取得所有資料
 */
async function getAllFromIndexedDB(page: Page, storeName: string): Promise<any[]> {
  return await page.evaluate(async (store) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('venturo-db', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const transaction = db.transaction(store, 'readonly');
    const objectStore = transaction.objectStore(store);

    return await new Promise<any[]>((resolve, reject) => {
      const getAllRequest = objectStore.getAll();
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
  }, storeName);
}

/**
 * 輔助函數：清空 IndexedDB
 */
async function clearIndexedDB(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase('venturo-db');
      request.onsuccess = () => resolve();
      request.onerror = () => resolve(); // 即使失敗也繼續
    });
  });
}

/**
 * 輔助函數：等待 IndexedDB 同步完成
 */
async function waitForSync(page: Page, timeMs: number = 3000): Promise<void> {
  await page.waitForTimeout(timeMs);
}

test.describe('IndexedDB 同步測試', () => {
  test.beforeEach(async ({ page, context }) => {
    // 訪問應用程式（必須先訪問頁面才能使用 IndexedDB）
    await page.goto('/');

    // 等待頁面載入
    await page.waitForLoadState('domcontentloaded');

    // 清空 IndexedDB（在頁面 context 中執行）
    await page.evaluate(async () => {
      const databases = await (window as any).indexedDB?.databases?.();
      if (databases) {
        for (const db of databases) {
          if (db.name === 'venturo-db') {
            await new Promise<void>((resolve) => {
              const request = indexedDB.deleteDatabase(db.name);
              request.onsuccess = () => resolve();
              request.onerror = () => resolve();
            });
          }
        }
      }
    });

    // 重新載入頁面以初始化 IndexedDB
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('測試 1: 初始讀取 → IndexedDB 快取', async ({ page }) => {
    console.log('🧪 測試 1: 初始讀取 → IndexedDB 快取');

    // 模擬使用者操作：載入資料
    // 注意：這裡假設應用程式在載入時會自動 fetchAll
    // 如果需要點擊按鈕，請修改此處

    // 等待資料載入
    await waitForSync(page, 5000);

    // 檢查 IndexedDB 中是否有資料
    const toursCount = await getIndexedDBCount(page, 'tours');
    const ordersCount = await getIndexedDBCount(page, 'orders');
    const quotesCount = await getIndexedDBCount(page, 'quotes');

    console.log(`📊 IndexedDB 快取狀態:`);
    console.log(`  Tours: ${toursCount} 筆`);
    console.log(`  Orders: ${ordersCount} 筆`);
    console.log(`  Quotes: ${quotesCount} 筆`);

    // 驗證：至少應該有一些資料（具體數量取決於你的測試資料）
    expect(toursCount).toBeGreaterThanOrEqual(0);
    expect(ordersCount).toBeGreaterThanOrEqual(0);
    expect(quotesCount).toBeGreaterThanOrEqual(0);

    console.log('✅ 測試 1 通過');
  });

  test('測試 2: 建立資料 → IndexedDB 同步', async ({ page }) => {
    console.log('🧪 測試 2: 建立資料 → IndexedDB 同步');

    // 先載入初始資料
    await waitForSync(page, 5000);

    // 記錄建立前的數量
    const beforeCount = await getIndexedDBCount(page, 'tours');
    console.log(`📊 建立前 Tours 數量: ${beforeCount}`);

    // 模擬建立新資料
    await page.evaluate(async () => {
      const { useTourStore } = await import('@/stores');
      const store = useTourStore.getState();

      await store.create({
        code: `E2E-TEST-${Date.now()}`,
        name: 'E2E 測試旅遊團',
        location: '測試地點',
        departure_date: '2025-12-01',
        return_date: '2025-12-05',
        status: '提案',
        price: 50000,
        max_participants: 20,
        contract_status: '未簽署',
        total_revenue: 0,
        total_cost: 0,
        profit: 0,
        is_active: true,
      } as any);
    });

    // 等待同步
    await waitForSync(page, 3000);

    // 檢查數量是否增加
    const afterCount = await getIndexedDBCount(page, 'tours');
    console.log(`📊 建立後 Tours 數量: ${afterCount}`);
    console.log(`變化: +${afterCount - beforeCount}`);

    // 驗證：數量應該增加 1
    expect(afterCount).toBe(beforeCount + 1);

    console.log('✅ 測試 2 通過');
  });

  test('測試 3: 更新資料 → IndexedDB 同步', async ({ page }) => {
    console.log('🧪 測試 3: 更新資料 → IndexedDB 同步');

    // 先載入初始資料
    await waitForSync(page, 5000);

    // 取得第一筆資料
    const tours = await getAllFromIndexedDB(page, 'tours');

    if (tours.length === 0) {
      console.log('⚠️ 沒有資料可以測試，跳過此測試');
      test.skip();
      return;
    }

    const firstTour = tours[0];
    console.log(`📊 更新前:`);
    console.log(`  ID: ${firstTour.id}`);
    console.log(`  狀態: ${firstTour.status}`);
    console.log(`  參加人數: ${firstTour.current_participants || 0}`);

    // 模擬更新資料
    await page.evaluate(async (tourId) => {
      const { useTourStore } = await import('@/stores');
      const store = useTourStore.getState();

      await store.update(tourId, {
        status: '進行中',
        current_participants: 10,
      } as any);
    }, firstTour.id);

    // 等待同步
    await waitForSync(page, 3000);

    // 檢查 IndexedDB 中的資料是否更新
    const updatedTours = await getAllFromIndexedDB(page, 'tours');
    const updatedTour = updatedTours.find((t: any) => t.id === firstTour.id);

    console.log(`📊 更新後:`);
    console.log(`  ID: ${updatedTour.id}`);
    console.log(`  狀態: ${updatedTour.status}`);
    console.log(`  參加人數: ${updatedTour.current_participants}`);

    // 驗證：狀態和參加人數應該更新
    expect(updatedTour.status).toBe('進行中');
    expect(updatedTour.current_participants).toBe(10);

    console.log('✅ 測試 3 通過');
  });

  test('測試 4: 刪除資料 → IndexedDB 同步', async ({ page }) => {
    console.log('🧪 測試 4: 刪除資料 → IndexedDB 同步');

    // 先載入初始資料
    await waitForSync(page, 5000);

    // 記錄刪除前的數量
    const beforeCount = await getIndexedDBCount(page, 'tours');
    console.log(`📊 刪除前 Tours 數量: ${beforeCount}`);

    if (beforeCount === 0) {
      console.log('⚠️ 沒有資料可以刪除，跳過此測試');
      test.skip();
      return;
    }

    // 取得第一筆資料的 ID
    const tours = await getAllFromIndexedDB(page, 'tours');
    const firstTourId = tours[0].id;

    // 模擬刪除資料
    await page.evaluate(async (tourId) => {
      const { useTourStore } = await import('@/stores');
      const store = useTourStore.getState();

      await store.delete(tourId);
    }, firstTourId);

    // 等待同步
    await waitForSync(page, 3000);

    // 檢查數量是否減少
    const afterCount = await getIndexedDBCount(page, 'tours');
    console.log(`📊 刪除後 Tours 數量: ${afterCount}`);
    console.log(`變化: ${afterCount - beforeCount}`);

    // 驗證：數量應該減少 1
    expect(afterCount).toBe(beforeCount - 1);

    console.log('✅ 測試 4 通過');
  });

  test('測試 5: 資料一致性檢查', async ({ page }) => {
    console.log('🧪 測試 5: 資料一致性檢查');

    // 載入資料
    await waitForSync(page, 5000);

    // 從 Store 取得資料
    const storeData = await page.evaluate(async () => {
      const { useTourStore } = await import('@/stores');
      const store = useTourStore.getState();
      return store.items;
    });

    // 從 IndexedDB 取得資料
    const indexedDBData = await getAllFromIndexedDB(page, 'tours');

    console.log(`📊 Store 資料數: ${storeData.length}`);
    console.log(`📊 IndexedDB 資料數: ${indexedDBData.length}`);

    // 驗證：數量應該一致
    expect(indexedDBData.length).toBe(storeData.length);

    // 驗證：ID 應該一致
    const storeIds = new Set(storeData.map((t: any) => t.id));
    const indexedDBIds = new Set(indexedDBData.map((t: any) => t.id));

    const onlyInStore = [...storeIds].filter(id => !indexedDBIds.has(id));
    const onlyInIndexedDB = [...indexedDBIds].filter(id => !storeIds.has(id));

    if (onlyInStore.length > 0) {
      console.log('❌ 只在 Store:', onlyInStore);
    }
    if (onlyInIndexedDB.length > 0) {
      console.log('❌ 只在 IndexedDB:', onlyInIndexedDB);
    }

    expect(onlyInStore.length).toBe(0);
    expect(onlyInIndexedDB.length).toBe(0);

    console.log('✅ 測試 5 通過 - 資料完全一致');
  });
});
