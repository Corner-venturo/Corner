/**
 * 日期格式化工具
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
  } catch (error) {
    return ''
  }
}
