/**
 * 傳票自動拋轉 Service（已停用）
 * 
 * 會計傳票自動產生功能已暫時停用。
 * 保留 export 以避免其他地方 import 報錯。
 */

import type {
  AutoVoucherFromPayment,
  AutoVoucherFromCardPayment,
  AutoVoucherFromPaymentRequest,
  AutoVoucherFromTourClosing,
  CardPaymentMeta,
  Voucher,
  VoucherEntry,
} from '@/types/accounting-pro.types'

/**
 * 計算刷卡收款各項金額（保留供參考）
 */
export function calculateCardPaymentMeta(
  _gross_amount: number,
  _fee_rate_deducted?: number,
  _fee_rate_total?: number
): CardPaymentMeta {
  return {
    gross_amount: 0,
    fee_rate_total: 0,
    fee_rate_deducted: 0,
    fee_rate_retained: 0,
    fee_total: 0,
    fee_deducted: 0,
    fee_retained: 0,
    bank_net: 0,
  }
}

/**
 * @deprecated 會計模組已暫時停用
 */
export async function generateVoucherFromPayment(
  _data: AutoVoucherFromPayment
): Promise<{ voucher: Voucher; entries: VoucherEntry[] } | null> {
  return null
}

/**
 * @deprecated 會計模組已暫時停用
 */
export async function generateVoucherFromCardPayment(
  _data: AutoVoucherFromCardPayment
): Promise<{ voucher: Voucher; entries: VoucherEntry[]; meta: CardPaymentMeta } | null> {
  return null
}

/**
 * @deprecated 會計模組已暫時停用
 */
export async function generateVoucherFromPaymentRequest(
  _data: AutoVoucherFromPaymentRequest
): Promise<{ voucher: Voucher; entries: VoucherEntry[] } | null> {
  return null
}

/**
 * @deprecated 會計模組已暫時停用
 */
export async function generateVoucherFromTourClosing(
  _data: AutoVoucherFromTourClosing
): Promise<{ voucher: Voucher; entries: VoucherEntry[] } | null> {
  return null
}
