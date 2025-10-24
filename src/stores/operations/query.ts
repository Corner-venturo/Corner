/**
 * Query 操作
 * 負責查詢和過濾資料
 */

import type { BaseEntity } from '@/types';

/**
 * 根據欄位查詢
 */
export function findByField<T extends BaseEntity>(
  items: T[],
  field: keyof T,
  value: unknown
): T[] {
  return items.filter((item) => item[field] === value);
}

/**
 * 自訂過濾
 */
export function filter<T extends BaseEntity>(
  items: T[],
  predicate: (item: T) => boolean
): T[] {
  return items.filter(predicate);
}

/**
 * 計數
 */
export function count<T extends BaseEntity>(items: T[]): number {
  return items.length;
}

/**
 * 清空資料
 */
export function clear<T extends BaseEntity>(): T[] {
  return [];
}
