import { PaymentRequest, PaymentRequestItem } from '@/stores/types';

export interface RequestFormData {
  tour_id: string;
  order_id: string;
  request_date: string;
  note: string;
  is_special_billing: boolean;
  created_by: string;
}

export interface BatchRequestFormData {
  request_date: string;
  note: string;
  is_special_billing: boolean;
  created_by: string;
}

export interface RequestItem {
  id: string;
  category: PaymentRequestItem['category'];
  supplier_id: string;
  supplierName: string;
  description: string;
  unit_price: number;
  quantity: number;
}

export interface NewItemFormData {
  category: PaymentRequestItem['category'];
  supplier_id: string;
  description: string;
  unit_price: number;
  quantity: number;
}

export const statusLabels: Record<PaymentRequest['status'], string> = {
  pending: '請款中',
  processing: '處理中',
  confirmed: '已確認',
  paid: '已付款'
};

export const statusColors: Record<PaymentRequest['status'], string> = {
  pending: 'bg-morandi-gold',
  processing: 'bg-morandi-gold',
  confirmed: 'bg-morandi-green',
  paid: 'bg-morandi-primary'
};

export const categoryOptions = [
  { value: '住宿', label: '🏨 住宿' },
  { value: '交通', label: '🚌 交通' },
  { value: '餐食', label: '🍽️ 餐食' },
  { value: '門票', label: '🎫 門票' },
  { value: '導遊', label: '👥 導遊' },
  { value: '其他', label: '📦 其他' }
] as const;
