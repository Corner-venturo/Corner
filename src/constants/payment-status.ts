/**
 * Payment 狀態定義與對照
 * 用於統一前端顯示與資料庫欄位
 */

import { PaymentRequest, DisbursementOrder, ReceiptOrder } from '@/stores/types';

// 請款單狀態對照
export const PAYMENT_REQUEST_STATUS_LABELS: Record<PaymentRequest['status'], string> = {
  pending: '請款中',
  processing: '處理中',
  confirmed: '已確認',
  paid: '已付款'
};

// 請款單狀態顏色
export const PAYMENT_REQUEST_STATUS_COLORS: Record<PaymentRequest['status'], string> = {
  pending: 'bg-morandi-gold text-white',
  processing: 'bg-blue-500 text-white',
  confirmed: 'bg-morandi-green text-white',
  paid: 'bg-morandi-primary text-white'
};

// 出納單狀態對照
export const DISBURSEMENT_ORDER_STATUS_LABELS: Record<DisbursementOrder['status'], string> = {
  pending: '待支付',
  confirmed: '已確認',
  paid: '已支付',
  cancelled: '已取消'
};

// 出納單狀態顏色
export const DISBURSEMENT_ORDER_STATUS_COLORS: Record<DisbursementOrder['status'], string> = {
  pending: 'bg-morandi-gold text-white',
  confirmed: 'bg-blue-500 text-white',
  paid: 'bg-morandi-green text-white',
  cancelled: 'bg-morandi-red text-white'
};

// 收款單狀態對照
export const RECEIPT_ORDER_STATUS_LABELS: Record<ReceiptOrder['status'], string> = {
  '已收款': '已收款',
  '已確認': '已確認',
  '退回': '退回'
};

// 收款單狀態顏色
export const RECEIPT_ORDER_STATUS_COLORS: Record<ReceiptOrder['status'], string> = {
  '已收款': 'bg-morandi-green text-white',
  '已確認': 'bg-morandi-primary text-white',
  '退回': 'bg-morandi-red text-white'
};

// 請款項目類別對照
export const PAYMENT_CATEGORY_LABELS = {
  '住宿': '🏨 住宿',
  '交通': '🚌 交通',
  '餐食': '🍽️ 餐食',
  '門票': '🎫 門票',
  '導遊': '👥 導遊',
  '其他': '📦 其他'
};

// 收款方式對照
export const PAYMENT_METHOD_LABELS = {
  '現金': '現金',
  '匯款': '匯款',
  '刷卡': '刷卡',
  '支票': '支票'
};
