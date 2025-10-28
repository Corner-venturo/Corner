/**
 * 供應商管理類型定義
 */

import type { BaseEntity, SyncableEntity } from './base.types';

export interface SupplierContact {
  contact_person: string;
  phone: string;
  email?: string;
  address?: string;
  website?: string;
}

/**
 * 供應商付款帳戶（支援多個帳戶）
 */
export interface SupplierPaymentAccount extends BaseEntity {
  supplier_id: string;
  account_name: string; // 帳戶名稱（如：主要帳戶、泰國當地帳戶）
  account_holder: string; // 戶名
  bank_name: string; // 銀行名稱
  bank_code?: string; // 銀行代碼
  bank_branch?: string; // 分行名稱
  account_number: string; // 帳號
  swift_code?: string; // SWIFT Code
  currency?: string; // 幣別（TWD, USD, THB...）
  account_type?: 'checking' | 'savings'; // 帳戶類型
  is_default: boolean; // 是否為預設帳戶
  is_active: boolean; // 是否啟用
  note?: string;
}

/**
 * @deprecated 使用 SupplierPaymentAccount 替代
 */
export interface SupplierBankInfo {
  bank_name: string;
  account_number: string;
  account_name: string;
  branch?: string;
}

export interface PriceListItem extends BaseEntity {
  supplier_id: string; // 對齊資料庫：加入供應商ID
  item_name: string;
  category: string;
  unit_price: number;
  unit: string; // 單位：晚、台、人、次等
  seasonality?: 'peak' | 'regular' | 'off';
  valid_from?: string;
  valid_to?: string;
  note?: string;
}

export interface Supplier extends SyncableEntity {
  supplier_code?: string; // 供應商編號
  name: string;
  country?: string; // 國家 ID
  region?: string; // 地區 ID（可選）
  cities?: string[]; // 服務城市 ID 陣列（多選）
  location?: string; // 地點（向後相容，顯示用）
  type: 'hotel' | 'restaurant' | 'transport' | 'ticket' | 'guide' | 'travel_agency' | 'other';
  contact: SupplierContact;
  bank_info?: SupplierBankInfo;
  price_list: PriceListItem[];
  status: 'active' | 'inactive';
  note?: string;
}

export type CreateSupplierData = Omit<Supplier, keyof BaseEntity>;
export type UpdateSupplierData = Partial<CreateSupplierData>;
export type CreatePriceListItemData = Omit<PriceListItem, keyof BaseEntity>;
export type UpdatePriceListItemData = Partial<CreatePriceListItemData>;
