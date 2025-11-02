/**
 * 工具函數
 */

/**
 * 型別守衛：檢查值是否可比較（數字或字串）
 */
export function isComparable(value: unknown): value is number | string {
  return typeof value === 'number' || typeof value === 'string'
}

/**
 * 型別安全的比較函數
 */
export function compareValues(a: unknown, b: unknown, operator: 'gt' | 'gte' | 'lt' | 'lte'): boolean {
  // 如果兩個值都可比較，進行比較
  if (isComparable(a) && isComparable(b)) {
    switch (operator) {
      case 'gt':
        return a > b
      case 'gte':
        return a >= b
      case 'lt':
        return a < b
      case 'lte':
        return a <= b
    }
  }
  // 不可比較的值回傳 false
  return false
}
