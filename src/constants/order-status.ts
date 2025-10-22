/**
 * Order 狀態定義與對照
 * 用於統一前端顯示與資料庫欄位
 */

import { Order } from '@/stores/types';

// 訂單狀態對照
export const ORDER_STATUS_LABELS: Record<Order['status'], string> = {
  pending: '待確認',
  confirmed: '已確認',
  completed: '已完成',
  cancelled: '已取消'
};

// 訂單狀態顏色
export const ORDER_STATUS_COLORS: Record<Order['status'], string> = {
  pending: 'bg-morandi-gold text-white',
  confirmed: 'bg-morandi-green text-white',
  completed: 'bg-morandi-primary text-white',
  cancelled: 'bg-morandi-red text-white'
};

// 付款狀態對照
export const PAYMENT_STATUS_LABELS: Record<Order['payment_status'], string> = {
  unpaid: '未收款',
  partial: '部分收款',
  paid: '已收款',
  refunded: '已退款'
};

// 付款狀態顏色
export const PAYMENT_STATUS_COLORS: Record<Order['payment_status'], string> = {
  unpaid: 'bg-morandi-red text-white',
  partial: 'bg-morandi-gold text-white',
  paid: 'bg-morandi-green text-white',
  refunded: 'bg-morandi-secondary text-white'
};

// 訂單狀態篩選
export const ORDER_STATUS_FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待確認' },
  { value: 'confirmed', label: '已確認' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
];

// 付款狀態篩選
export const PAYMENT_STATUS_FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'unpaid', label: '未收款' },
  { value: 'partial', label: '部分收款' },
  { value: 'paid', label: '已收款' },
  { value: 'refunded', label: '已退款' }
];
