/**
 * 幣值轉換相關常數和工具函數
 */

// 機場代碼 / 城市 / 國家 對應幣別
export const DESTINATION_CURRENCY_MAP: Record<string, string> = {
  // 日本
  '日本': 'JPY', 'Japan': 'JPY',
  'NRT': 'JPY', 'HND': 'JPY', 'KIX': 'JPY', 'NGO': 'JPY', 'CTS': 'JPY', 'FUK': 'JPY', 'OKA': 'JPY',
  '東京': 'JPY', '大阪': 'JPY', '京都': 'JPY', '北海道': 'JPY', '沖繩': 'JPY', '名古屋': 'JPY', '福岡': 'JPY',
  // 泰國
  '泰國': 'THB', 'Thailand': 'THB',
  'BKK': 'THB', 'CNX': 'THB', 'HKT': 'THB',
  '曼谷': 'THB', '清邁': 'THB', '普吉': 'THB',
  // 韓國
  '韓國': 'KRW', 'Korea': 'KRW',
  'ICN': 'KRW', 'GMP': 'KRW', 'PUS': 'KRW',
  '首爾': 'KRW', '釜山': 'KRW',
  // 越南
  '越南': 'VND', 'Vietnam': 'VND',
  'SGN': 'VND', 'HAN': 'VND', 'DAD': 'VND',
  '胡志明': 'VND', '河內': 'VND', '峴港': 'VND',
  // 美國
  '美國': 'USD', 'USA': 'USD',
  'LAX': 'USD', 'JFK': 'USD', 'SFO': 'USD',
  // 新加坡
  '新加坡': 'SGD', 'Singapore': 'SGD', 'SIN': 'SGD',
  // 馬來西亞
  '馬來西亞': 'MYR', 'Malaysia': 'MYR', 'KUL': 'MYR',
  // 中國
  '中國': 'CNY', 'China': 'CNY',
  'PVG': 'CNY', 'PEK': 'CNY', 'CAN': 'CNY',
  '上海': 'CNY', '北京': 'CNY', '廣州': 'CNY',
  // 香港
  '香港': 'HKD', 'Hong Kong': 'HKD', 'HKG': 'HKD',
  // 澳門
  '澳門': 'MOP', 'Macau': 'MOP', 'MFM': 'MOP',
  // 歐洲
  '歐洲': 'EUR', 'Europe': 'EUR',
}

// 幣別中文名稱對照
export const CURRENCY_NAME_MAP: Record<string, string> = {
  'JPY': '日幣',
  'THB': '泰銖',
  'KRW': '韓元',
  'VND': '越南盾',
  'USD': '美金',
  'SGD': '新幣',
  'MYR': '馬幣',
  'EUR': '歐元',
  'GBP': '英鎊',
  'AUD': '澳幣',
  'CNY': '人民幣',
  'HKD': '港幣',
}

// 幣別符號對照
export const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  'JPY': '¥',
  'THB': '฿',
  'KRW': '₩',
  'VND': '₫',
  'USD': '$',
  'SGD': 'S$',
  'MYR': 'RM',
  'EUR': '€',
  'GBP': '£',
  'AUD': 'A$',
  'CNY': '¥',
  'HKD': 'HK$',
  'TWD': 'NT$',
}

/**
 * 從團的目的地取得對應幣別
 */
export function getDestinationCurrency(location: string | null | undefined, tourCode: string | null | undefined): string | null {
  // 1. 先從 tour.location 查找
  if (location && DESTINATION_CURRENCY_MAP[location]) {
    return DESTINATION_CURRENCY_MAP[location]
  }
  // 2. 從團號前三碼（機場代碼）查找
  if (tourCode) {
    const airportCode = tourCode.substring(0, 3).toUpperCase()
    if (DESTINATION_CURRENCY_MAP[airportCode]) {
      return DESTINATION_CURRENCY_MAP[airportCode]
    }
  }
  return null
}

/**
 * 取得幣別中文名稱
 */
export function getCurrencyName(code: string | null): string {
  if (!code) return '外幣'
  return CURRENCY_NAME_MAP[code] || code
}

/**
 * 取得幣別符號
 */
export function getCurrencySymbol(code: string | null | undefined): string {
  if (!code) return ''
  return CURRENCY_SYMBOL_MAP[code] || code
}

/**
 * 格式化金額
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('zh-TW').format(value)
}

/**
 * 格式化日期 (MM/DD)
 */
import { formatDateCompactPadded } from '@/lib/utils/format-date'

export function formatDate(dateStr: string | null | undefined): string {
  return formatDateCompactPadded(dateStr) || '-'
}

/**
 * 格式化航班日期 (M/DD)
 */
export function formatFlightDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${String(date.getDate()).padStart(2, '0')}`
}
