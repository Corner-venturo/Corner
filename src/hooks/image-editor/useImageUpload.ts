/**
 * Image Upload Hook
 * 管理圖片上傳與儲存狀態
 */

import { useState, useCallback } from 'react'

export function useImageUpload() {
  const [isSaving, setIsSaving] = useState(false)

  // 重置上傳狀態
  const resetUpload = useCallback(() => {
    setIsSaving(false)
  }, [])

  return {
    // 狀態
    isSaving,

    // 設置器
    setIsSaving,

    // 便利方法
    resetUpload,
  }
}
