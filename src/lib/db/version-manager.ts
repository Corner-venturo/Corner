import { UI_DELAYS, SYNC_DELAYS } from '@/lib/constants/timeouts';
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


  // 第一次使用（沒有記錄）
  if (!lastVersion) {
    localStorage.setItem(VERSION_KEY, currentVersion);
    return false; // 不需要重新同步
  }

  // 版本相同，正常使用
  if (lastVersion === currentVersion) {
    return false;
  }

  // 版本不同，需要處理升級
  console.log(`🔄 [IndexedDB] 偵測到版本變化: v${lastVersion} -> v${currentVersion}`);

  // ✅ 不清空資料庫，直接更新版本記錄
  // IndexedDB 的 onupgradeneeded 會自動處理表格建立
  localStorage.setItem(VERSION_KEY, currentVersion);

  console.log('✅ [IndexedDB] 版本更新完成（資料保留）');
  return false; // 不需要重新同步，資料都還在
}

/**
 * 確認是否升級（可自訂提示方式）
 */
async function confirmUpgrade(oldVersion: number, newVersion: number): Promise<boolean> {
  // 方案 1：自動升級（推薦）
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

    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
            reject(request.error);
    };

    request.onblocked = () => {
            // 等待一下再試
      setTimeout(() => resolve(), UI_DELAYS.AUTO_SAVE);
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
}
