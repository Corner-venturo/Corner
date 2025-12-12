/**
 * @deprecated 離線資料庫已棄用
 * 此模組僅為向下相容而保留，實際不執行任何操作
 * 目前架構：直接從 Supabase 即時取資料，無 IndexedDB
 */

// 空的 localDB stub
export const localDB = {
  clear: async () => {
    console.warn('[localDB] 離線資料庫已棄用，此操作無效')
  },
  delete: async () => {
    console.warn('[localDB] 離線資料庫已棄用，此操作無效')
  },
}

export default localDB
