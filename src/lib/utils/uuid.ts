/**
 * 通用 UUID 生成器
 * 同時支援瀏覽器和 Node.js 環境
 */

export function generateUUID(): string {
  // 優先使用瀏覽器原生 API
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID()
  }

  // 降級方案：手動生成 UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
