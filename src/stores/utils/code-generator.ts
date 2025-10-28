/**
 * 編號生成工具
 *
 * 報價單格式：{letter}{3位數} (如: A001, A999, B001)
 * 字母循環：A001-A999 → B001-B999 → C001-C999...
 *
 * 團號格式：{城市代號}{年後2碼}{月}{日}-{流水號2位}
 * 例如：CNX250128-01 (清邁 2025/01/28 第1團)
 */

import type { BaseEntity } from '@/types';
import type { CodeConfig } from '../core/types';

/**
 * 生成團號
 *
 * @param cityCode - 城市機場代號（如 CNX, BKK）
 * @param departureDate - 出發日期 (ISO 8601 格式)
 * @param existingTours - 現有旅遊團列表
 * @returns 團號（如 CNX250128-01）
 *
 * @example
 * generateTourCode('CNX', '2025-01-28', existingTours)
 * // => 'CNX250128-01' (清邁 2025年1月28日 第1團)
 */
export function generateTourCode(
  cityCode: string,
  departureDate: string,
  existingTours: BaseEntity[]
): string {
  const date = new Date(departureDate);
  const year = date.getFullYear().toString().slice(-2); // 後兩碼
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  const datePrefix = `${cityCode}${year}${month}${day}`;

  // 找出同日期同城市的最大流水號
  let maxSequence = 0;
  existingTours.forEach((tour) => {
    if ('code' in tour) {
      const code = (tour as { code?: string }).code;
      if (code?.startsWith(datePrefix)) {
        const sequencePart = code.split('-')[1];
        if (sequencePart) {
          const sequence = parseInt(sequencePart, 10);
          if (sequence > maxSequence) {
            maxSequence = sequence;
          }
        }
      }
    }
  });

  const nextSequence = (maxSequence + 1).toString().padStart(2, '0');
  return `${datePrefix}-${nextSequence}`;
}

/**
 * 生成報價單編號（字母循環系統）
 *
 * @example
 * generateCode({ prefix: 'Q' }, existingQuotes)
 * // => 'A001' (第1筆)
 * // => 'A999' (第999筆)
 * // => 'B001' (第1000筆)
 */
export function generateCode(
  config: CodeConfig,
  existingItems: BaseEntity[]
): string {
  // 找出所有現有編號，解析出最大的字母和數字
  let maxLetter = '';
  let maxNumber = 0;

  existingItems.forEach((item) => {
    if ('code' in item) {
      const code = (item as { code?: string }).code;
      if (code && /^[A-Z]\d{3}$/.test(code)) {
        const letter = code[0];
        const number = parseInt(code.substring(1), 10);

        // 比較字母和數字
        if (letter > maxLetter || (letter === maxLetter && number > maxNumber)) {
          maxLetter = letter;
          maxNumber = number;
        }
      }
    }
  });

  // 如果沒有現有編號，從 A001 開始
  if (!maxLetter) {
    return 'A001';
  }

  // 計算下一個編號
  if (maxNumber < 999) {
    // 同字母，數字 +1
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    return `${maxLetter}${nextNumber}`;
  } else {
    // 數字已達 999，字母進位
    const nextLetter = String.fromCharCode(maxLetter.charCodeAt(0) + 1);
    return `${nextLetter}001`;
  }
}
