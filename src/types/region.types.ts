/**
 * 地區管理類型定義
 */

import type { BaseEntity } from './base.types';

/**
 * 地區/國家
 */
export interface Region extends BaseEntity {
  type: 'country' | 'city';       // 類型：國家或城市
  name: string;                   // 地區名稱（例如：日本、東京）
  code: string;                   // 地區代碼（例如：JPN、TYO）
  status: 'active' | 'inactive';  // 狀態
  country_code?: string;          // 所屬國家代碼（城市才有）
  note?: string;                  // 備註
}

export type CreateRegionData = Omit<Region, keyof BaseEntity>;
export type UpdateRegionData = Partial<CreateRegionData>;
