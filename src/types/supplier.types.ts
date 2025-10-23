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
  country?: string; // 國家
  location?: string; // 地點
  type: 'hotel' | 'restaurant' | 'transport' | 'ticket' | 'guide' | 'other';
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
