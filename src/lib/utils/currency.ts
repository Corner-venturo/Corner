/**
 * 貨幣格式化工具
 */

export function formatCurrency(amount: number, currency: string = 'TWD'): string {
  // 貨幣符號對應
  const currencySymbols: Record<string, string> = {
    TWD: 'NT$',
    VND: '₫',
    USD: '$',
    JPY: '¥',
    CNY: '¥',
    EUR: '€',
    GBP: '£',
  }

  const symbol = currencySymbols[currency] || currency

  // 越南盾不顯示小數點
  if (currency === 'VND') {
    return `${amount.toLocaleString('vi-VN')} ${symbol}`
  }

  // 其他貨幣保留兩位小數
  return `${symbol}${amount.toLocaleString('zh-TW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}
