/**
 * 傳票自動拋轉 Service（V2）
 * 更新日期：2025-12-28
 *
 * V2 更新重點：
 * 1. 刷卡收款：團成本固定 2%，0.32% 當下認列公司其他收入
 * 2. 結團：改為一張傳票（含收入、成本、行政費、代收稅金、獎金）
 *
 * 功能：
 * 1. 現金/匯款收款 → 借：銀行/現金，貸：預收團款
 * 2. 刷卡收款 → 4 筆分錄（含刷卡成本和回饋收入）
 * 3. 供應商付款 → 借：預付團務成本，貸：銀行
 * 4. 結團 → 一張傳票處理所有轉列
 */

import { createVoucher, createVoucherEntry } from '@/data'
import { supabase } from '@/lib/supabase/client'
import type { AccountingSubject } from '@/types/accounting-pro.types'
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
 * 會計科目代碼常數（V2 更新）
 */
const SUBJECT_CODES = {
  // 資產類
  CASH: '1101', // 現金
  BANK: '1102', // 銀行存款（父科目）
  BANK_CTBC: '110201', // 中國信託
  BANK_BOT: '110202', // 台灣銀行
  BANK_ESUN: '110203', // 玉山銀行
  BANK_CATHAY: '110204', // 國泰世華
  BANK_FIRST: '110205', // 第一銀行
  BANK_TAISHIN: '110206', // 台新銀行
  ADVANCE_TOUR_FEE: '1104', // 預付團務成本（資產）
  PREPAID_CARD_FEE: '110401', // 預付團務成本－刷卡成本（V2）

  // 負債類
  PREPAID_TOUR_FEE: '2102', // 預收團款（負債）
  TAX_PAYABLE: '2103', // 代收稅金（V2）
  BONUS_PAYABLE: '2104', // 應付獎金（V2）

  // 收入類
  TOUR_REVENUE: '4101', // 團費收入
  OTHER_INCOME: '4102', // 其他收入
  CARD_REBATE_INCOME: '4103', // 其他收入－刷卡回饋（V2）
  ADMIN_FEE_INCOME: '4104', // 其他收入－行政費（V2）

  // 成本/費用類
  COST_TRANSPORTATION: '5101', // 旅遊成本-交通
  COST_ACCOMMODATION: '5102', // 旅遊成本-住宿
  COST_MEAL: '5103', // 旅遊成本-餐飲
  COST_TICKET: '5104', // 旅遊成本-門票
  COST_INSURANCE: '5105', // 旅遊成本-保險
  COST_OTHER: '5106', // 旅遊成本-其他
  COST_CARD_FEE: '5107', // 團務成本－刷卡成本（V2 結團轉列）
  BONUS_EXPENSE: '6105', // 獎金支出（V2）
} as const

/**
 * 預設費率（V2）
 */
const DEFAULT_RATES = {
  CARD_FEE_TOTAL: 0.02, // 團成本固定 2%
  CARD_FEE_DEDUCTED: 0.0168, // 銀行實扣 1.68%
  CARD_FEE_RETAINED: 0.0032, // 公司回饋 0.32%
  TAX_RATE: 0.12, // 代收稅金 12%
  ADMIN_FEE_PER_PERSON: 10, // 行政費每人 $10
} as const

/**
 * 四捨五入到整數（台幣）
 */
function roundTWD(n: number): number {
  return Math.round(n)
}

/**
 * 從 Supabase 直接查詢會計科目（by code）
 * 避免依賴可能未載入的 Zustand store
 */
async function findSubjectByCode(code: string): Promise<AccountingSubject> {
  const { data, error } = await supabase
    .from('accounting_subjects')
    .select('*')
    .eq('code', code)
    .single()

  if (error || !data) {
    throw new Error(`找不到會計科目: ${code}`)
  }

  return data as AccountingSubject
}

/**
 * 批量查詢多個會計科目（by codes）
 */
async function findSubjectsByCodes(codes: string[]): Promise<Map<string, AccountingSubject>> {
  const { data, error } = await supabase
    .from('accounting_subjects')
    .select('*')
    .in('code', codes)

  if (error) {
    throw new Error(`查詢會計科目失敗: ${error.message}`)
  }

  const map = new Map<string, AccountingSubject>()
  for (const subject of (data || []) as AccountingSubject[]) {
    map.set(subject.code, subject)
  }

  return map
}

/**
 * 產生傳票編號
 */
function generateVoucherNo(workspace_id: string, date: string, suffix = ''): string {
  const dateStr = date.replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return `V${dateStr}${random}${suffix}`
}

/**
 * 計算刷卡收款各項金額（V2）
 */
export function calculateCardPaymentMeta(
  gross_amount: number,
  fee_rate_deducted: number = DEFAULT_RATES.CARD_FEE_DEDUCTED,
  fee_rate_total: number = DEFAULT_RATES.CARD_FEE_TOTAL
): CardPaymentMeta {
  const fee_deducted = roundTWD(gross_amount * fee_rate_deducted)
  const fee_total = roundTWD(gross_amount * fee_rate_total)
  const fee_retained = fee_total - fee_deducted
  const bank_net = gross_amount - fee_deducted

  // 借貸平衡檢查
  const debit = bank_net + fee_total
  const credit = gross_amount + fee_retained
  if (debit !== credit) {
    throw new Error(`刷卡分錄借貸不平衡: 借方=${debit}, 貸方=${credit}`)
  }

  return {
    gross_amount,
    fee_rate_total,
    fee_rate_deducted,
    fee_rate_retained: fee_rate_total - fee_rate_deducted,
    fee_total,
    fee_deducted,
    fee_retained,
    bank_net,
  }
}

/**
 * 從現金/匯款收款自動產生傳票
 *
 * 分錄：
 * - 借：銀行存款（或現金）
 * - 貸：預收團款
 */
export async function generateVoucherFromPayment(
  data: AutoVoucherFromPayment
): Promise<{ voucher: Voucher; entries: VoucherEntry[] }> {
  const debitSubjectCode =
    data.payment_method === 'cash'
      ? SUBJECT_CODES.CASH
      : data.bank_account_code || SUBJECT_CODES.BANK

  // 直接從 Supabase 查詢會計科目
  const subjectsMap = await findSubjectsByCodes([debitSubjectCode, SUBJECT_CODES.PREPAID_TOUR_FEE])
  const debitSubject = subjectsMap.get(debitSubjectCode)
  const creditSubject = subjectsMap.get(SUBJECT_CODES.PREPAID_TOUR_FEE)

  if (!debitSubject || !creditSubject) {
    throw new Error('找不到會計科目，請確認會計科目表已初始化')
  }

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

  const createdVoucher = await createVoucher(voucher as Omit<Voucher, 'id' | 'created_at'>)
  const entries: VoucherEntry[] = []

  // 借方：銀行/現金
  const debitEntry = await createVoucherEntry({
    voucher_id: createdVoucher.id,
    entry_no: 1,
    subject_id: debitSubject.id,
    debit: data.payment_amount,
    credit: 0,
    description: `收款 - ${debitSubject.name}`,
  } as Omit<VoucherEntry, 'id' | 'created_at'>)
  entries.push(debitEntry)

  // 貸方：預收團款
  const creditEntry = await createVoucherEntry({
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
 * 從刷卡收款自動產生傳票（V2）
 *
 * 分錄：
 * Dr 銀行存款              bank_net (實收)
 * Dr 預付團務成本－刷卡成本  fee_total (2%)
 *   Cr 預收團款            gross_amount (原刷卡金額)
 *   Cr 其他收入－刷卡回饋    fee_retained (0.32%)
 */
export async function generateVoucherFromCardPayment(
  data: AutoVoucherFromCardPayment
): Promise<{ voucher: Voucher; entries: VoucherEntry[]; meta: CardPaymentMeta }> {
  // 計算刷卡金額
  const meta = calculateCardPaymentMeta(
    data.gross_amount,
    data.fee_rate_deducted,
    data.fee_rate_total || DEFAULT_RATES.CARD_FEE_TOTAL
  )

  // 直接從 Supabase 查詢會計科目
  const bankCode = data.bank_account_code || SUBJECT_CODES.BANK
  const subjectsMap = await findSubjectsByCodes([
    bankCode,
    SUBJECT_CODES.PREPAID_CARD_FEE,
    SUBJECT_CODES.PREPAID_TOUR_FEE,
    SUBJECT_CODES.CARD_REBATE_INCOME,
  ])

  const bankSubject = subjectsMap.get(bankCode)
  const cardFeeSubject = subjectsMap.get(SUBJECT_CODES.PREPAID_CARD_FEE)
  const prepaidSubject = subjectsMap.get(SUBJECT_CODES.PREPAID_TOUR_FEE)
  const rebateSubject = subjectsMap.get(SUBJECT_CODES.CARD_REBATE_INCOME)

  if (!bankSubject || !cardFeeSubject || !prepaidSubject || !rebateSubject) {
    throw new Error('找不到刷卡相關會計科目，請確認已執行 V2 migration')
  }

  // 傳票總額
  const totalAmount = meta.bank_net + meta.fee_total // = gross_amount + fee_retained

  const voucher: Partial<Voucher> = {
    workspace_id: data.workspace_id,
    voucher_no: generateVoucherNo(data.workspace_id, data.payment_date),
    voucher_date: data.payment_date,
    type: 'auto',
    source_type: 'card_payment',
    source_id: data.order_id,
    description: data.description || `刷卡收款 - ${data.order_id} (金額: ${data.gross_amount})`,
    total_debit: totalAmount,
    total_credit: totalAmount,
    status: 'draft',
  }

  const createdVoucher = await createVoucher(voucher as Omit<Voucher, 'id' | 'created_at'>)
  const entries: VoucherEntry[] = []

  // 借方 1：銀行存款（實收）
  entries.push(
    await createVoucherEntry({
      voucher_id: createdVoucher.id,
      entry_no: 1,
      subject_id: bankSubject.id,
      debit: meta.bank_net,
      credit: 0,
      description: `刷卡收款 - 銀行實收 (${meta.gross_amount} - ${meta.fee_deducted})`,
    } as Omit<VoucherEntry, 'id' | 'created_at'>)
  )

  // 借方 2：預付團務成本－刷卡成本（2%）
  entries.push(
    await createVoucherEntry({
      voucher_id: createdVoucher.id,
      entry_no: 2,
      subject_id: cardFeeSubject.id,
      debit: meta.fee_total,
      credit: 0,
      description: `刷卡成本 2% (${meta.gross_amount} × 2%)`,
    } as Omit<VoucherEntry, 'id' | 'created_at'>)
  )

  // 貸方 1：預收團款
  entries.push(
    await createVoucherEntry({
      voucher_id: createdVoucher.id,
      entry_no: 3,
      subject_id: prepaidSubject.id,
      debit: 0,
      credit: meta.gross_amount,
      description: `預收團款 - 刷卡金額`,
    } as Omit<VoucherEntry, 'id' | 'created_at'>)
  )

  // 貸方 2：其他收入－刷卡回饋（0.32%）
  entries.push(
    await createVoucherEntry({
      voucher_id: createdVoucher.id,
      entry_no: 4,
      subject_id: rebateSubject.id,
      debit: 0,
      credit: meta.fee_retained,
      description: `刷卡回饋 0.32% (${meta.gross_amount} × 0.32%)`,
    } as Omit<VoucherEntry, 'id' | 'created_at'>)
  )

  return { voucher: createdVoucher, entries, meta }
}

/**
 * 從付款請求自動產生傳票
 *
 * 分錄：
 * - 借：預付團務成本
 * - 貸：銀行存款
 */
export async function generateVoucherFromPaymentRequest(
  data: AutoVoucherFromPaymentRequest
): Promise<{ voucher: Voucher; entries: VoucherEntry[] }> {
  // 直接從 Supabase 查詢會計科目
  const subjectsMap = await findSubjectsByCodes([
    SUBJECT_CODES.ADVANCE_TOUR_FEE,
    SUBJECT_CODES.BANK,
  ])

  const debitSubject = subjectsMap.get(SUBJECT_CODES.ADVANCE_TOUR_FEE)
  const creditSubject = subjectsMap.get(SUBJECT_CODES.BANK)

  if (!debitSubject || !creditSubject) {
    throw new Error('找不到會計科目')
  }

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

  const createdVoucher = await createVoucher(voucher as Omit<Voucher, 'id' | 'created_at'>)
  const entries: VoucherEntry[] = []

  // 借方：預付團務成本
  entries.push(
    await createVoucherEntry({
      voucher_id: createdVoucher.id,
      entry_no: 1,
      subject_id: debitSubject.id,
      debit: data.payment_amount,
      credit: 0,
      description: `付款 - ${debitSubject.name}`,
    } as Omit<VoucherEntry, 'id' | 'created_at'>)
  )

  // 貸方：銀行存款
  entries.push(
    await createVoucherEntry({
      voucher_id: createdVoucher.id,
      entry_no: 2,
      subject_id: creditSubject.id,
      debit: 0,
      credit: data.payment_amount,
      description: `付款 - ${creditSubject.name}`,
    } as Omit<VoucherEntry, 'id' | 'created_at'>)
  )

  return { voucher: createdVoucher, entries }
}

/**
 * 結團時自動產生傳票（V2：一張傳票）
 *
 * 分錄內容：
 * 1. 預收團款 → 團費收入（轉列）
 * 2. 預付團務成本 → 團務成本（轉列，含刷卡成本）
 * 3. 行政費：成本 → 其他收入
 * 4. 12% 代收稅金：成本 → 代收稅金負債
 * 5. 獎金：成本 → 銀行/應付獎金
 */
export async function generateVoucherFromTourClosing(
  data: AutoVoucherFromTourClosing
): Promise<{ voucher: Voucher; entries: VoucherEntry[] }> {
  // 預先查詢所有需要的會計科目
  const allCodes = [
    SUBJECT_CODES.PREPAID_TOUR_FEE,
    SUBJECT_CODES.TOUR_REVENUE,
    SUBJECT_CODES.ADVANCE_TOUR_FEE,
    SUBJECT_CODES.PREPAID_CARD_FEE,
    SUBJECT_CODES.COST_CARD_FEE,
    SUBJECT_CODES.ADMIN_FEE_INCOME,
    SUBJECT_CODES.TAX_PAYABLE,
    SUBJECT_CODES.BANK,
    SUBJECT_CODES.BONUS_PAYABLE,
    SUBJECT_CODES.BONUS_EXPENSE,
    SUBJECT_CODES.COST_TRANSPORTATION,
    SUBJECT_CODES.COST_ACCOMMODATION,
    SUBJECT_CODES.COST_MEAL,
    SUBJECT_CODES.COST_TICKET,
    SUBJECT_CODES.COST_INSURANCE,
    SUBJECT_CODES.COST_OTHER,
  ]
  const subjectsMap = await findSubjectsByCodes(allCodes)

  // 查找科目的輔助函數
  const findSubject = (code: string) => {
    const subject = subjectsMap.get(code)
    if (!subject) throw new Error(`找不到會計科目: ${code}`)
    return subject
  }

  const prepaidTourFee = findSubject(SUBJECT_CODES.PREPAID_TOUR_FEE)
  const tourRevenue = findSubject(SUBJECT_CODES.TOUR_REVENUE)
  const advanceTourFee = findSubject(SUBJECT_CODES.ADVANCE_TOUR_FEE)
  const prepaidCardFee = findSubject(SUBJECT_CODES.PREPAID_CARD_FEE)
  const costCardFee = findSubject(SUBJECT_CODES.COST_CARD_FEE)
  const adminFeeIncome = findSubject(SUBJECT_CODES.ADMIN_FEE_INCOME)
  const taxPayable = findSubject(SUBJECT_CODES.TAX_PAYABLE)
  const bankSubject = findSubject(SUBJECT_CODES.BANK)
  const bonusPayable = findSubject(SUBJECT_CODES.BONUS_PAYABLE)
  const bonusExpense = findSubject(SUBJECT_CODES.BONUS_EXPENSE)

  // 計算金額
  const adminFee = data.admin_fee ?? data.participants * DEFAULT_RATES.ADMIN_FEE_PER_PERSON
  const taxRate = data.tax_rate ?? DEFAULT_RATES.TAX_RATE

  // 計算總成本（不含行政費）
  const originalCostWithoutAdmin =
    data.costs.transportation +
    data.costs.accommodation +
    data.costs.meal +
    data.costs.ticket +
    data.costs.insurance +
    data.costs.card_fee +
    data.costs.other

  // 代收稅金 = (團收入 - 原始成本) * 12%
  const taxAmount = roundTWD((data.total_revenue - originalCostWithoutAdmin) * taxRate)

  // 獎金
  const salesBonus = data.bonuses?.sales || 0
  const opBonus = data.bonuses?.op || 0
  const teamBonus = data.bonuses?.team_performance || 0
  const immediateBonus = salesBonus + opBonus // 即付獎金

  // 計算借貸總額
  let totalDebit = 0
  let totalCredit = 0

  const entries: { code: string; debit: number; credit: number; desc: string }[] = []

  // === 1. 轉列收入：預收團款 → 團費收入 ===
  entries.push({
    code: SUBJECT_CODES.PREPAID_TOUR_FEE,
    debit: data.total_revenue,
    credit: 0,
    desc: '結團 - 預收團款轉列',
  })
  entries.push({
    code: SUBJECT_CODES.TOUR_REVENUE,
    debit: 0,
    credit: data.total_revenue,
    desc: '結團 - 團費收入',
  })
  totalDebit += data.total_revenue
  totalCredit += data.total_revenue

  // === 2. 轉列成本：預付團務成本 → 團務成本 ===
  const costMapping = [
    { code: SUBJECT_CODES.COST_TRANSPORTATION, amount: data.costs.transportation, name: '交通' },
    { code: SUBJECT_CODES.COST_ACCOMMODATION, amount: data.costs.accommodation, name: '住宿' },
    { code: SUBJECT_CODES.COST_MEAL, amount: data.costs.meal, name: '餐飲' },
    { code: SUBJECT_CODES.COST_TICKET, amount: data.costs.ticket, name: '門票' },
    { code: SUBJECT_CODES.COST_INSURANCE, amount: data.costs.insurance, name: '保險' },
    { code: SUBJECT_CODES.COST_OTHER, amount: data.costs.other, name: '其他' },
  ]

  let totalGeneralCost = 0
  for (const cost of costMapping) {
    if (cost.amount > 0) {
      entries.push({
        code: cost.code,
        debit: cost.amount,
        credit: 0,
        desc: `結團 - ${cost.name}成本`,
      })
      totalDebit += cost.amount
      totalGeneralCost += cost.amount
    }
  }

  // 預付團務成本（一般）轉出
  if (totalGeneralCost > 0) {
    entries.push({
      code: SUBJECT_CODES.ADVANCE_TOUR_FEE,
      debit: 0,
      credit: totalGeneralCost,
      desc: '結團 - 預付團務成本轉列',
    })
    totalCredit += totalGeneralCost
  }

  // === 3. 刷卡成本轉列：預付團務成本－刷卡成本 → 團務成本－刷卡成本 ===
  if (data.costs.card_fee > 0) {
    entries.push({
      code: SUBJECT_CODES.COST_CARD_FEE,
      debit: data.costs.card_fee,
      credit: 0,
      desc: '結團 - 刷卡成本',
    })
    entries.push({
      code: SUBJECT_CODES.PREPAID_CARD_FEE,
      debit: 0,
      credit: data.costs.card_fee,
      desc: '結團 - 預付刷卡成本轉列',
    })
    totalDebit += data.costs.card_fee
    totalCredit += data.costs.card_fee
  }

  // === 4. 行政費：成本 → 其他收入 ===
  if (adminFee > 0) {
    entries.push({
      code: SUBJECT_CODES.COST_OTHER,
      debit: adminFee,
      credit: 0,
      desc: `結團 - 行政費 (${data.participants}人 × $10)`,
    })
    entries.push({
      code: SUBJECT_CODES.ADMIN_FEE_INCOME,
      debit: 0,
      credit: adminFee,
      desc: '結團 - 行政費收入',
    })
    totalDebit += adminFee
    totalCredit += adminFee
  }

  // === 5. 代收稅金：成本 → 代收稅金負債 ===
  if (taxAmount > 0) {
    entries.push({
      code: SUBJECT_CODES.COST_OTHER,
      debit: taxAmount,
      credit: 0,
      desc: `結團 - 代收稅金 12%`,
    })
    entries.push({
      code: SUBJECT_CODES.TAX_PAYABLE,
      debit: 0,
      credit: taxAmount,
      desc: '結團 - 代收稅金負債',
    })
    totalDebit += taxAmount
    totalCredit += taxAmount
  }

  // === 6. 即付獎金：獎金支出 → 銀行 ===
  if (immediateBonus > 0) {
    entries.push({
      code: SUBJECT_CODES.BONUS_EXPENSE,
      debit: immediateBonus,
      credit: 0,
      desc: `結團 - 業務/OP獎金 (業務:${salesBonus} + OP:${opBonus})`,
    })
    entries.push({
      code: SUBJECT_CODES.BANK,
      debit: 0,
      credit: immediateBonus,
      desc: '結團 - 獎金付款',
    })
    totalDebit += immediateBonus
    totalCredit += immediateBonus
  }

  // === 7. 團績獎金：獎金支出 → 應付獎金 ===
  if (teamBonus > 0) {
    entries.push({
      code: SUBJECT_CODES.BONUS_EXPENSE,
      debit: teamBonus,
      credit: 0,
      desc: '結團 - 團績獎金',
    })
    entries.push({
      code: SUBJECT_CODES.BONUS_PAYABLE,
      debit: 0,
      credit: teamBonus,
      desc: '結團 - 應付團績獎金',
    })
    totalDebit += teamBonus
    totalCredit += teamBonus
  }

  // 建立傳票
  const voucher: Partial<Voucher> = {
    workspace_id: data.workspace_id,
    voucher_no: generateVoucherNo(data.workspace_id, data.closing_date),
    voucher_date: data.closing_date,
    type: 'auto',
    source_type: 'tour_closing',
    source_id: data.tour_id,
    description: `結團 ${data.tour_code} (收入:${data.total_revenue}, 成本:${originalCostWithoutAdmin}, 人數:${data.participants})`,
    total_debit: totalDebit,
    total_credit: totalCredit,
    status: 'draft',
  }

  const createdVoucher = await createVoucher(voucher as Omit<Voucher, 'id' | 'created_at'>)

  // 建立分錄
  const createdEntries: VoucherEntry[] = []
  let entryNo = 1

  for (const entry of entries) {
    const subject = findSubject(entry.code)
    createdEntries.push(
      await createVoucherEntry({
        voucher_id: createdVoucher.id,
        entry_no: entryNo++,
        subject_id: subject.id,
        debit: entry.debit,
        credit: entry.credit,
        description: entry.desc,
      } as Omit<VoucherEntry, 'id' | 'created_at'>)
    )
  }

  return { voucher: createdVoucher, entries: createdEntries }
}

