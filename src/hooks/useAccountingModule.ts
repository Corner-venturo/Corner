/**
 * 會計模組權限檢查 Hook
 * 建立日期：2025-01-17
 * 
 * 注意：會計模組已暫時停用，永遠返回 hasAccounting: false
 */

/**
 * 檢查當前 workspace 是否啟用會計模組
 * 目前已停用，永遠返回 false
 */
export function useAccountingModule() {
  return {
    hasAccounting: false,
    isExpired: true,
    expiresAt: null,
    module: null,
    loading: false,
  }
}

/**
 * 檢查當前 workspace 是否啟用指定模組
 */
export function useModule(_moduleName: 'accounting' | 'inventory' | 'bi_analytics') {
  return {
    hasModule: false,
    isExpired: false,
    expiresAt: null,
    module: null,
    loading: false,
  }
}
