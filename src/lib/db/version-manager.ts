/**
 * IndexedDB 版本管理器
 * 自動偵測版本變化並處理升級
 */

import { DB_NAME, DB_VERSION } from './schemas';

const VERSION_KEY = 'venturo_db_version';

/**
 * 檢查版本並處理升級
 * @returns true: 需要重新同步資料, false: 不需要
 */
export async function checkAndHandleVersion(): Promise<boolean> {
  // 取得上次記錄的版本
  const lastVersion = localStorage.getItem(VERSION_KEY);
  const currentVersion = DB_VERSION.toString();

  console.log(`[Version Manager] 上次版本: ${lastVersion}, 當前版本: ${currentVersion}`);

  // 第一次使用（沒有記錄）
  if (!lastVersion) {
    console.log('[Version Manager] 首次使用，記錄版本');
    localStorage.setItem(VERSION_KEY, currentVersion);
    return false; // 不需要重新同步
  }

  // 版本相同，正常使用
  if (lastVersion === currentVersion) {
    console.log('[Version Manager] 版本相同，正常使用');
    return false;
  }

  // 版本不同，需要處理升級
  console.log('[Version Manager] 🔄 偵測到版本變化，準備升級...');

  // 顯示升級提示（可選）
  const shouldUpgrade = await confirmUpgrade(parseInt(lastVersion), DB_VERSION);

  if (shouldUpgrade) {
    // 清空 IndexedDB（因為有 Supabase 備份，安全）
    await clearDatabase();

    // 更新版本記錄
    localStorage.setItem(VERSION_KEY, currentVersion);

    console.log('[Version Manager] ✅ 升級完成，需要重新同步資料');
    return true; // 需要重新同步
  } else {
    console.log('[Version Manager] 使用者取消升級');
    return false;
  }
}

/**
 * 確認是否升級（可自訂提示方式）
 */
async function confirmUpgrade(oldVersion: number, newVersion: number): Promise<boolean> {
  // 方案 1：自動升級（推薦）
  console.log(`[Version Manager] 自動升級: v${oldVersion} → v${newVersion}`);
  return true;

  // 方案 2：詢問使用者（可選）
  // return confirm(
  //   `發現新版本！\n\n` +
  //   `目前版本: v${oldVersion}\n` +
  //   `新版本: v${newVersion}\n\n` +
  //   `將自動更新資料庫結構，資料會從雲端重新同步。\n\n` +
  //   `點擊確定開始更新`
  // );
}

/**
 * 清空 IndexedDB
 */
async function clearDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('[Version Manager] 🗑️ 清空 IndexedDB...');

    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      console.log('[Version Manager] ✅ IndexedDB 已清空');
      resolve();
    };

    request.onerror = () => {
      console.error('[Version Manager] ❌ 清空失敗:', request.error);
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn('[Version Manager] ⚠️ 清空被阻擋（可能有其他分頁開啟）');
      // 等待一下再試
      setTimeout(() => resolve(), 1000);
    };
  });
}

/**
 * 取得當前版本
 */
export function getCurrentVersion(): number {
  return DB_VERSION;
}

/**
 * 取得上次版本
 */
export function getLastVersion(): number | null {
  const version = localStorage.getItem(VERSION_KEY);
  return version ? parseInt(version) : null;
}

/**
 * 重設版本（僅供開發測試）
 */
export function resetVersion(): void {
  localStorage.removeItem(VERSION_KEY);
  console.log('[Version Manager] 版本記錄已清除');
}
