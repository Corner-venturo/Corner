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
    // 轉換為半形
    const convertedValue = toHalfWidth(e.target.value)

    // 如果值有改變，更新 input 的值
    if (convertedValue !== e.target.value) {
      e.target.value = convertedValue
    }

    // 呼叫原本的 onChange
    if (originalOnChange) {
      originalOnChange(e)
    }
  }
}
