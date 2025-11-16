/**
 * 日期工具函式
 */

/**
 * 計算下個月第一個週四的日期
 * @returns Date 下個月第一個週四
 */
export function getNextMonthFirstThursday(): Date {
  const today = new Date()

  // 取得下個月的第一天
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

  // 取得下個月第一天是星期幾 (0=週日, 1=週一, ..., 4=週四)
  const firstDayOfWeek = nextMonth.getDay()

  // 計算到第一個週四需要幾天
  let daysUntilThursday: number
  if (firstDayOfWeek === 0) {
    // 如果是週日，則要加 4 天到週四
    daysUntilThursday = 4
  } else if (firstDayOfWeek <= 4) {
    // 如果是週一~週四，則計算差距
    daysUntilThursday = 4 - firstDayOfWeek
  } else {
    // 如果是週五~週六，則要到下週四
    daysUntilThursday = 11 - firstDayOfWeek
  }

  // 設定日期為第一個週四
  nextMonth.setDate(1 + daysUntilThursday)

  return nextMonth
}

/**
 * 格式化日期為 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 測試：列出接下來 6 個月的第一個週四
 */
export function testNextMonthThursdays() {
  const results = []
  for (let i = 0; i < 6; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() + i + 1)
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    const firstDayOfWeek = firstDay.getDay()
    let daysUntilThursday: number

    if (firstDayOfWeek === 0) {
      daysUntilThursday = 4
    } else if (firstDayOfWeek <= 4) {
      daysUntilThursday = 4 - firstDayOfWeek
    } else {
      daysUntilThursday = 11 - firstDayOfWeek
    }

    firstDay.setDate(1 + daysUntilThursday)
    results.push(`${date.getFullYear()}/${date.getMonth() + 1} 第一個週四：${formatDate(firstDay)}`)
  }
  return results
}
