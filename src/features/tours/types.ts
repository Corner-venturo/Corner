import { Tour } from '@/stores/types';

export interface NewTourData {
  name: string;
  countryCode: string;       // 國家代碼 (如: JPN, THI)
  cityCode: string;          // 城市代碼 (如: TYO, BKK)
  customCountry?: string;    // 自訂國家名稱
  customLocation?: string;   // 自訂城市名稱
  customCityCode?: string;   // 自訂城市代號
  departure_date: string;
  return_date: string;
  price: number;
  status: Tour['status'];
  isSpecial: boolean;
  max_participants: number;
  description?: string;
}

export interface TourExtraFields {
  addOns: boolean;
  refunds: boolean;
  customFields: Array<{ id: string; name: string; }>;
}

export interface DeleteConfirmState {
  isOpen: boolean;
  tour: Tour | null;
}
