/**
 * 日期格式化工具
 * 統一全專案日期顯示格式
 */

/**
 * 格式化日期為 YYYY-MM-DD
 * @param date - ISO 字串或 Date 物件
 * @returns YYYY-MM-DD 格式的日期字串
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return ''

  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

/**
 * 格式化日期為台灣格式 (YYYY/M/D)
 * @param date - ISO 字串或 Date 物件
 * @returns 2024/1/15 格式的日期字串
 */
export function formatDateTW(date: string | Date | null | undefined): string {
  if (!date) return ''

  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''

    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  } catch {
    return ''
  }
}

/**
 * 格式化日期為顯示格式 (同 formatDateTW)
 * @param date - ISO 字串或 Date 物件
 * @returns 2024/1/15 格式的日期字串
 */
export const formatDateDisplay = formatDateTW

/**
 * 格式化月份為英文短格式
 * @param date - ISO 字串或 Date 物件
 * @returns JAN, FEB, MAR 等
 */
export function formatMonthShort(date: string | Date | null | undefined): string {
  if (!date) return ''

  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return months[d.getMonth()]
  } catch {
    return ''
  }
}

/**
 * 格式化日期時間為顯示格式
 * @param date - ISO 字串或 Date 物件
 * @returns 2024/1/15 14:30 格式
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return ''

  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''

    const datePart = formatDateTW(d)
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')

    return `${datePart} ${hours}:${minutes}`
  } catch {
    return ''
  }
}
