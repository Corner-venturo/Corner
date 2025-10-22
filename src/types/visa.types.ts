/**
 * 簽證管理類型定義
 */

import type { BaseEntity } from './base.types';

export interface Visa extends BaseEntity {
  // 申請人資訊
  applicant_name: string; // 申請人姓名
  contact_person: string; // 聯絡人
  contact_phone: string; // 聯絡電話

  // 簽證資訊
  visa_type: string; // 簽證類型（護照 成人、台胞證等）
  country: string; // 國家

  // 狀態
  status: '待送件' | '已送件' | '已下件' | '已取件' | '退件';

  // 日期
  submission_date?: string; // 送件時間
  received_date?: string; // 下件時間
  pickup_date?: string; // 取件時間

  // 關聯資訊
  order_id: string; // 關聯的訂單ID
  order_number: string; // 訂單號碼快照
  tour_id: string; // 團號ID
  code: string; // 團體代碼 (tourCode)

  // 費用
  fee: number; // 代辦費
  cost: number; // 成本

  // 其他
  note?: string; // 備註
  created_by?: string; // 建立者ID
}

export type CreateVisaData = Omit<Visa, keyof BaseEntity>;
export type UpdateVisaData = Partial<CreateVisaData>;
