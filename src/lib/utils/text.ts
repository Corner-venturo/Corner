/**
 * 全形轉半形工具函數
 * 自動將全形字符（數字、英文、符號）轉換為半形
 */

/**
 * 將全形字符轉換為半形
 * @param str 輸入字串
 * @returns 轉換後的半形字串
 */
export function toHalfWidth(str: string): string {
  if (!str) return str

  return str
    .replace(/[！-～]/g, char => {
      // 全形字符範圍：！(0xFF01) 到 ～(0xFF5E)
      // 轉換為半形：!(0x0021) 到 ~(0x007E)
      const code = char.charCodeAt(0)
      return String.fromCharCode(code - 0xfee0)
    })
    .replace(/　/g, ' ') // 全形空格轉半形空格
}

/**
 * React Input onChange 事件包裝器
 * 自動將全形轉換為半形
 */
export function withHalfWidthConversion<T extends HTMLInputElement | HTMLTextAreaElement>(
  originalOnChange?: React.ChangeEventHandler<T>
): React.ChangeEventHandler<T> {
  return e => {
    // ✅ 修正：不直接修改 e.target.value，而是在 onChange 中傳遞轉換後的值
    // 這樣可以避免中文輸入時的重複問題

    if (!originalOnChange) return

    // 轉換為半形
    const convertedValue = toHalfWidth(e.target.value)

    // 如果值有改變，創建新的 event 物件傳遞轉換後的值
    if (convertedValue !== e.target.value) {
      // 創建新的 event，保留原始 event 的所有屬性
      const newEvent = {
        ...e,
        target: {
          ...e.target,
          value: convertedValue,
        },
      } as React.ChangeEvent<T>

      originalOnChange(newEvent)
    } else {
      // 值沒變，直接傳遞原始 event
      originalOnChange(e)
    }
  }
}
