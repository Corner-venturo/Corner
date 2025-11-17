/**
 * 傳票自動拋轉 Service
 * 建立日期：2025-01-17
 *
 * 功能：
 * 1. 收款時自動產生傳票（借：銀行/現金，貸：預收團費）
 * 2. 付款時自動產生傳票（借：預付團費，貸：銀行）
 * 3. 結團時自動產生兩張傳票（收入、成本）
 */

import { useVoucherStore } from '@/stores/voucher-store'
import { useVoucherEntryStore } from '@/stores/voucher-entry-store'
import { useAccountingSubjectStore } from '@/stores/accounting-subject-store'
import type {
  AutoVoucherFromPayment,
  AutoVoucherFromPaymentRequest,
  AutoVoucherFromTourClosing,
  Voucher,
  VoucherEntry,
} from '@/types/accounting-pro.types'

/**
 * 會計科目代碼常數
 */
const SUBJECT_CODES = {
  CASH: '1101', // 現金
  BANK: '1102', // 銀行存款（父科目）
  BANK_CTBC: '110201', // 中國信託
  BANK_BOT: '110202', // 台灣銀行
  BANK_ESUN: '110203', // 玉山銀行
  BANK_CATHAY: '110204', // 國泰世華
  BANK_FIRST: '110205', // 第一銀行
  BANK_TAISHIN: '110206', // 台新銀行
  ADVANCE_TOUR_FEE: '1104', // 預付團費（資產）
  PREPAID_TOUR_FEE: '2102', // 預收團費（負債）
  TOUR_REVENUE: '4101', // 團費收入
  COST_TRANSPORTATION: '5101', // 旅遊成本-交通
  COST_ACCOMMODATION: '5102', // 旅遊成本-住宿
  COST_MEAL: '5103', // 旅遊成本-餐飲
  COST_TICKET: '5104', // 旅遊成本-門票
  COST_INSURANCE: '5105', // 旅遊成本-保險
  COST_OTHER: '5106', // 旅遊成本-其他
} as const

/**
 * 產生傳票編號
 */
function generateVoucherNo(workspace_id: string, date: string): string {
  // 格式：V + YYYYMMDD + 流水號
  const dateStr = date.replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return `V${dateStr}${random}`
}

/**
 * 從收款自動產生傳票
 *
 * 分錄：
 * - 借：銀行存款（或現金）
 * - 貸：預收團費
 */
export async function generateVoucherFromPayment(
  data: AutoVoucherFromPayment
): Promise<{ voucher: Voucher; entries: VoucherEntry[] }> {
  const voucherStore = useVoucherStore.getState()
  const entryStore = useVoucherEntryStore.getState()
  const subjectStore = useAccountingSubjectStore.getState()

  // 1. 確定借方科目（現金或銀行）
  const debitSubjectCode =
    data.payment_method === 'cash'
      ? SUBJECT_CODES.CASH
      : data.bank_account_code || SUBJECT_CODES.BANK

  const debitSubject = subjectStore.items.find((s) => s.code === debitSubjectCode)
  const creditSubject = subjectStore.items.find((s) => s.code === SUBJECT_CODES.PREPAID_TOUR_FEE)

  if (!debitSubject || !creditSubject) {
    throw new Error('找不到會計科目，請確認會計科目表已初始化')
  }

  // 2. 建立傳票
  const voucher: Partial<Voucher> = {
    workspace_id: data.workspace_id,
    voucher_no: generateVoucherNo(data.workspace_id, data.payment_date),
    voucher_date: data.payment_date,
    type: 'auto',
    source_type: 'order_payment',
    source_id: data.order_id,
    description: data.description || `訂單收款 - ${data.order_id}`,
    total_debit: data.payment_amount,
    total_credit: data.payment_amount,
    status: 'draft',
  }

  const createdVoucher = await voucherStore.create(voucher as Omit<Voucher, 'id' | 'created_at'>)

  // 3. 建立分錄
  const entries: VoucherEntry[] = []

  // 借方：銀行/現金
  const debitEntry = await entryStore.create({
    voucher_id: createdVoucher.id,
    entry_no: 1,
    subject_id: debitSubject.id,
    debit: data.payment_amount,
    credit: 0,
    description: `收款 - ${debitSubject.name}`,
  } as Omit<VoucherEntry, 'id' | 'created_at'>)
  entries.push(debitEntry)

  // 貸方：預收團費
  const creditEntry = await entryStore.create({
    voucher_id: createdVoucher.id,
    entry_no: 2,
    subject_id: creditSubject.id,
    debit: 0,
    credit: data.payment_amount,
    description: `收款 - ${creditSubject.name}`,
  } as Omit<VoucherEntry, 'id' | 'created_at'>)
  entries.push(creditEntry)

  return { voucher: createdVoucher, entries }
}

/**
 * 從付款請求自動產生傳票
 *
 * 分錄：
 * - 借：預付團費
 * - 貸：銀行存款
 */
export async function generateVoucherFromPaymentRequest(
  data: AutoVoucherFromPaymentRequest
): Promise<{ voucher: Voucher; entries: VoucherEntry[] }> {
  const voucherStore = useVoucherStore.getState()
  const entryStore = useVoucherEntryStore.getState()
  const subjectStore = useAccountingSubjectStore.getState()

  const debitSubject = subjectStore.items.find((s) => s.code === SUBJECT_CODES.ADVANCE_TOUR_FEE)
  const creditSubject = subjectStore.items.find((s) => s.code === SUBJECT_CODES.BANK)

  if (!debitSubject || !creditSubject) {
    throw new Error('找不到會計科目')
  }

  // 建立傳票
  const voucher: Partial<Voucher> = {
    workspace_id: data.workspace_id,
    voucher_no: generateVoucherNo(data.workspace_id, data.payment_date),
    voucher_date: data.payment_date,
    type: 'auto',
    source_type: 'payment_request',
    source_id: data.payment_request_id,
    description: data.description || `付款 - ${data.payment_request_id}`,
    total_debit: data.payment_amount,
    total_credit: data.payment_amount,
    status: 'draft',
  }

  const createdVoucher = await voucherStore.create(voucher as Omit<Voucher, 'id' | 'created_at'>)

  // 建立分錄
  const entries: VoucherEntry[] = []

  // 借方：預付團費
  const debitEntry = await entryStore.create({
    voucher_id: createdVoucher.id,
    entry_no: 1,
    subject_id: debitSubject.id,
    debit: data.payment_amount,
    credit: 0,
    description: `付款 - ${debitSubject.name}`,
  } as Omit<VoucherEntry, 'id' | 'created_at'>)
  entries.push(debitEntry)

  // 貸方：銀行存款
  const creditEntry = await entryStore.create({
    voucher_id: createdVoucher.id,
    entry_no: 2,
    subject_id: creditSubject.id,
    debit: 0,
    credit: data.payment_amount,
    description: `付款 - ${creditSubject.name}`,
  } as Omit<VoucherEntry, 'id' | 'created_at'>)
  entries.push(creditEntry)

  return { voucher: createdVoucher, entries }
}

/**
 * 結團時自動產生傳票（兩張）
 *
 * 傳票 1（轉收入）：
 * - 借：預收團費
 * - 貸：團費收入
 *
 * 傳票 2（轉成本）：
 * - 借：旅遊成本（各類別）
 * - 貸：預付團費
 */
export async function generateVouchersFromTourClosing(
  data: AutoVoucherFromTourClosing
): Promise<{ revenueVoucher: Voucher; costVoucher: Voucher; allEntries: VoucherEntry[] }> {
  const voucherStore = useVoucherStore.getState()
  const entryStore = useVoucherEntryStore.getState()
  const subjectStore = useAccountingSubjectStore.getState()

  // === 傳票 1：轉收入 ===
  const prepaidSubject = subjectStore.items.find((s) => s.code === SUBJECT_CODES.PREPAID_TOUR_FEE)
  const revenueSubject = subjectStore.items.find((s) => s.code === SUBJECT_CODES.TOUR_REVENUE)

  if (!prepaidSubject || !revenueSubject) {
    throw new Error('找不到會計科目')
  }

  const revenueVoucher: Partial<Voucher> = {
    workspace_id: data.workspace_id,
    voucher_no: generateVoucherNo(data.workspace_id, data.closing_date),
    voucher_date: data.closing_date,
    type: 'auto',
    source_type: 'tour_closing',
    source_id: data.tour_id,
    description: `結團 ${data.tour_code} - 收入認列`,
    total_debit: data.total_revenue,
    total_credit: data.total_revenue,
    status: 'draft',
  }

  const createdRevenueVoucher = await voucherStore.create(
    revenueVoucher as Omit<Voucher, 'id' | 'created_at'>
  )

  const revenueEntries: VoucherEntry[] = []

  // 借：預收團費
  const revenueDebitEntry = await entryStore.create({
    voucher_id: createdRevenueVoucher.id,
    entry_no: 1,
    subject_id: prepaidSubject.id,
    debit: data.total_revenue,
    credit: 0,
    description: `結團 - 轉收入`,
  } as Omit<VoucherEntry, 'id' | 'created_at'>)
  revenueEntries.push(revenueDebitEntry)

  // 貸：團費收入
  const revenueCreditEntry = await entryStore.create({
    voucher_id: createdRevenueVoucher.id,
    entry_no: 2,
    subject_id: revenueSubject.id,
    debit: 0,
    credit: data.total_revenue,
    description: `結團 - 團費收入`,
  } as Omit<VoucherEntry, 'id' | 'created_at'>)
  revenueEntries.push(revenueCreditEntry)

  // === 傳票 2：轉成本 ===
  const advanceSubject = subjectStore.items.find((s) => s.code === SUBJECT_CODES.ADVANCE_TOUR_FEE)

  if (!advanceSubject) {
    throw new Error('找不到預付團費科目')
  }

  const totalCost =
    data.costs.transportation +
    data.costs.accommodation +
    data.costs.meal +
    data.costs.ticket +
    data.costs.insurance +
    data.costs.other

  const costVoucher: Partial<Voucher> = {
    workspace_id: data.workspace_id,
    voucher_no: generateVoucherNo(data.workspace_id, data.closing_date) + 'C', // 加 C 區分
    voucher_date: data.closing_date,
    type: 'auto',
    source_type: 'tour_closing',
    source_id: data.tour_id,
    description: `結團 ${data.tour_code} - 成本認列`,
    total_debit: totalCost,
    total_credit: totalCost,
    status: 'draft',
  }

  const createdCostVoucher = await voucherStore.create(
    costVoucher as Omit<Voucher, 'id' | 'created_at'>
  )

  const costEntries: VoucherEntry[] = []
  let entryNo = 1

  // 借方：各項旅遊成本
  const costMapping = [
    { code: SUBJECT_CODES.COST_TRANSPORTATION, amount: data.costs.transportation, name: '交通' },
    { code: SUBJECT_CODES.COST_ACCOMMODATION, amount: data.costs.accommodation, name: '住宿' },
    { code: SUBJECT_CODES.COST_MEAL, amount: data.costs.meal, name: '餐飲' },
    { code: SUBJECT_CODES.COST_TICKET, amount: data.costs.ticket, name: '門票' },
    { code: SUBJECT_CODES.COST_INSURANCE, amount: data.costs.insurance, name: '保險' },
    { code: SUBJECT_CODES.COST_OTHER, amount: data.costs.other, name: '其他' },
  ]

  for (const cost of costMapping) {
    if (cost.amount > 0) {
      const costSubject = subjectStore.items.find((s) => s.code === cost.code)
      if (costSubject) {
        const debitEntry = await entryStore.create({
          voucher_id: createdCostVoucher.id,
          entry_no: entryNo++,
          subject_id: costSubject.id,
          debit: cost.amount,
          credit: 0,
          description: `結團 - ${cost.name}費用`,
        } as Omit<VoucherEntry, 'id' | 'created_at'>)
        costEntries.push(debitEntry)
      }
    }
  }

  // 貸方：預付團費
  const costCreditEntry = await entryStore.create({
    voucher_id: createdCostVoucher.id,
    entry_no: entryNo,
    subject_id: advanceSubject.id,
    debit: 0,
    credit: totalCost,
    description: `結團 - 轉成本`,
  } as Omit<VoucherEntry, 'id' | 'created_at'>)
  costEntries.push(costCreditEntry)

  return {
    revenueVoucher: createdRevenueVoucher,
    costVoucher: createdCostVoucher,
    allEntries: [...revenueEntries, ...costEntries],
  }
}
