'use client'

import { useEffect } from 'react'
import { alert as customAlert, confirm as customConfirm } from './alert-dialog'

/**
 * 全局覆蓋原生的 window.alert 和 window.confirm
 * 使用我們自訂的 Morandi 風格對話框
 */
export function GlobalDialogOverride() {
  useEffect(() => {
    // 保存原始的 alert 和 confirm（以防需要恢復）
    const originalAlert = window.alert
    const originalConfirm = window.confirm

    // 覆蓋 window.alert
    window.alert = (message?: unknown): void => {
      const msg = message === undefined ? '' : String(message)

      // 判斷訊息類型
      let type: 'info' | 'success' | 'warning' | 'error' = 'info'

      if (msg.includes('成功') || msg.includes('✅')) {
        type = 'success'
      } else if (msg.includes('失敗') || msg.includes('錯誤') || msg.includes('❌')) {
        type = 'error'
      } else if (msg.includes('⚠️') || msg.includes('警告') || msg.includes('注意')) {
        type = 'warning'
      }

      // 移除 emoji 後作為 title（如果訊息很短）
      const cleanMsg = msg.replace(/[\u2705\u274c\u26a0]|\ufe0f/g, '').trim()

      // 調用我們的自訂 alert（異步但不等待，模擬原生行為）
      customAlert(cleanMsg, type)
    }

    // 保留 window.confirm 不覆蓋
    // 因為原生 confirm 是同步的，無法完美替換為異步對話框
    // 需要手動替換 confirm() 呼叫為 await confirm() from alert-dialog

    // 提示開發者使用自訂 confirm
    const originalConfirmFunc = window.confirm.bind(window)
    window.confirm = (message?: unknown): boolean => {
      return originalConfirmFunc(message)
    }

    // 在組件卸載時恢復原始函數（雖然不太可能發生）
    return () => {
      window.alert = originalAlert
      window.confirm = originalConfirm
    }
  }, [])

  return null // 這個組件不渲染任何內容
}
