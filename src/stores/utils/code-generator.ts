/**
 * 編號生成工具
 * 格式：{prefix}{year}{4位數} (如: T20250001)
 */

import type { BaseEntity } from '@/types';
import type { CodeConfig } from '../core/types';

/**
 * 生成編號
 *
 * @example
 * generateCode({ prefix: 'T', year: 2025 }, existingTours)
 * // => 'T20250001'
 */
export function generateCode(
  config: CodeConfig,
  existingItems: BaseEntity[]
): string {
  const year = config.year || new Date().getFullYear();
  const yearStr = year.toString();

  // 找出當年度最大的流水號
  const prefix = `${config.prefix}${yearStr}`;
  const maxNumber = existingItems
    .map((item) => {
      if ('code' in item) {
        const code = (item as { code?: string }).code;
        if (code?.startsWith(prefix)) {
          const numPart = code.substring(prefix.length);
          return parseInt(numPart, 10) || 0;
        }
      }
      return 0;
    })
    .reduce((max, num) => Math.max(max, num), 0);

  // 生成新編號
  const nextNumber = (maxNumber + 1).toString().padStart(4, '0');
  return `${prefix}${nextNumber}`;
}
