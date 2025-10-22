/**
 * Tour 狀態定義與對照
 * 用於統一前端顯示與資料庫欄位
 */

import { Tour } from '@/stores/types';

// 團體狀態對照
export const TOUR_STATUS_LABELS: Record<Tour['status'], string> = {
  draft: '提案',
  active: '進行中',
  pending_close: '待結案',
  closed: '結案',
  cancelled: '已取消',
  special: '特殊團'
};

// 團體狀態顏色
export const TOUR_STATUS_COLORS: Record<Tour['status'], string> = {
  draft: 'bg-morandi-secondary text-white',
  active: 'bg-morandi-green text-white',
  pending_close: 'bg-morandi-gold text-white',
  closed: 'bg-morandi-primary text-white',
  cancelled: 'bg-morandi-red text-white',
  special: 'bg-purple-500 text-white'
};

// 合約狀態對照
export const CONTRACT_STATUS_LABELS: Record<Tour['contract_status'], string> = {
  pending: '未簽署',
  partial: '部分簽署',
  signed: '已簽署'
};

// 合約狀態顏色
export const CONTRACT_STATUS_COLORS: Record<Tour['contract_status'], string> = {
  pending: 'bg-morandi-secondary',
  partial: 'bg-morandi-gold',
  signed: 'bg-morandi-green'
};

// 狀態篩選選項
export const TOUR_STATUS_FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'draft', label: '提案' },
  { value: 'active', label: '進行中' },
  { value: 'pending_close', label: '待結案' },
  { value: 'closed', label: '結案' },
  { value: 'cancelled', label: '已取消' },
  { value: 'special', label: '特殊團' }
];
