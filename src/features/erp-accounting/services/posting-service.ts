/**
 * 會計過帳服務
 * 負責將 ERP 事件轉換為傳票
 */

import { supabase } from '@/lib/supabase/client'
import { generateUUID } from '@/lib/utils/uuid'
import type { Json } from '@/lib/supabase/types'
import type {
  AccountingEventType,
  AccountingEventMeta,
  JournalLine,
  PostCustomerReceiptRequest,
  PostSupplierPaymentRequest,
  PostGroupSettlementRequest,
} from '@/types/accounting.types'

// 分錄插入類型
type JournalLineInsert = {
  id: string
  voucher_id: string
  line_no: number
  account_id: string
  description?: string | null
  debit_amount: number
  credit_amount: number
}

// ============================================
// 工具函數
// ============================================

/**
 * 生成傳票編號
 */
async function generateVoucherNo(workspaceId: string): Promise<string> {
  const today = new Date()
  const prefix = `JV${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`

  const { data } = await supabase
    .from('journal_vouchers')
    .select('voucher_no')
    .eq('workspace_id', workspaceId)
    .like('voucher_no', `${prefix}%`)
    .order('voucher_no', { ascending: false })
    .limit(1)

  let nextNumber = 1
  if (data && data.length > 0) {
    const lastNo = data[0].voucher_no
    const numericPart = lastNo.replace(prefix, '')
    const current = parseInt(numericPart, 10)
    if (!isNaN(current)) {
      nextNumber = current + 1
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`
}

/**
 * 根據科目代碼獲取科目 ID
 */
async function getAccountId(workspaceId: string, code: string): Promise<string | null> {
  const { data } = await supabase
    .from('chart_of_accounts')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('code', code)
    .single()

  return data?.id || null
}

/**
 * 獲取銀行帳戶對應的科目 ID
 */
async function getBankAccountId(bankAccountId: string): Promise<string | null> {
  const { data } = await supabase
    .from('erp_bank_accounts')
    .select('account_id')
    .eq('id', bankAccountId)
    .single()

  return data?.account_id || null
}

// ============================================
// 過帳函數
// ============================================

interface PostingResult {
  success: boolean
  eventId?: string
  voucherId?: string
  voucherNo?: string
  error?: string
}

/**
 * 客戶收款過帳
 *
 * 現金/匯款：
 *   Dr 銀行存款/現金 amount
 *   Cr 預收團款 amount
 *
 * 刷卡：
 *   Dr 銀行存款 net_amount
 *   Dr 刷卡手續費費用 fee
 *   Cr 預收團款 gross_amount
 */
export async function postCustomerReceipt(
  workspaceId: string,
  userId: string,
  request: PostCustomerReceiptRequest
): Promise<PostingResult> {
  const { payment_method, amount, fee_rate = 0, bank_account_id, tour_id, memo } = request

  const eventDate = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  // 計算金額
  const grossAmount = amount
  const feeAmount = payment_method === 'credit_card' ? Math.round(grossAmount * fee_rate) : 0
  const netAmount = grossAmount - feeAmount

  // 建立會計事件
  const eventId = generateUUID()
  const eventMeta: AccountingEventMeta = {
    payment_method,
    gross_amount: grossAmount,
    fee_rate,
    fee_amount: feeAmount,
    net_amount: netAmount,
  }

  const { error: eventError } = await supabase
    .from('accounting_events')
    .insert({
      id: eventId,
      workspace_id: workspaceId,
      event_type: 'customer_receipt_posted' as AccountingEventType,
      source_type: 'payment_receipt',
      source_id: request.receipt_id,
      tour_id,
      event_date: eventDate,
      meta: eventMeta as Json,
      status: 'posted',
      created_by: userId,
      created_at: now,
      updated_at: now,
    })

  if (eventError) {
    return { success: false, error: eventError.message }
  }

  // 生成傳票編號
  const voucherNo = await generateVoucherNo(workspaceId)
  const voucherId = generateUUID()

  // 獲取科目 ID
  const bankAccountCode = payment_method === 'cash' ? '1110' : '1100'
  const bankAcctId = bank_account_id
    ? await getBankAccountId(bank_account_id)
    : await getAccountId(workspaceId, bankAccountCode)
  const prepaidAcctId = await getAccountId(workspaceId, '2100') // 預收團款
  const feeAcctId = await getAccountId(workspaceId, '6100') // 刷卡手續費

  // 建立傳票
  const { error: voucherError } = await supabase
    .from('journal_vouchers')
    .insert({
      id: voucherId,
      workspace_id: workspaceId,
      voucher_no: voucherNo,
      voucher_date: eventDate,
      memo: memo || `客戶收款 - ${payment_method === 'credit_card' ? '刷卡' : payment_method === 'cash' ? '現金' : '匯款'}`,
      event_id: eventId,
      status: 'posted',
      total_debit: grossAmount,
      total_credit: grossAmount,
      created_by: userId,
      created_at: now,
      updated_at: now,
    })

  if (voucherError) {
    return { success: false, error: voucherError.message }
  }

  // 建立分錄
  const lines: JournalLineInsert[] = []
  let lineNo = 1

  // Dr 銀行存款/現金
  if (bankAcctId) {
    lines.push({
      id: generateUUID(),
      voucher_id: voucherId,
      line_no: lineNo++,
      account_id: bankAcctId,
      description: payment_method === 'credit_card' ? '刷卡收款（實收）' : '收款',
      debit_amount: netAmount,
      credit_amount: 0,
    })
  }

  // Dr 刷卡手續費（如果是刷卡）
  if (payment_method === 'credit_card' && feeAmount > 0 && feeAcctId) {
    lines.push({
      id: generateUUID(),
      voucher_id: voucherId,
      line_no: lineNo++,
      account_id: feeAcctId,
      description: `刷卡手續費 ${(fee_rate * 100).toFixed(2)}%`,
      debit_amount: feeAmount,
      credit_amount: 0,
    })
  }

  // Cr 預收團款
  if (prepaidAcctId) {
    lines.push({
      id: generateUUID(),
      voucher_id: voucherId,
      line_no: lineNo++,
      account_id: prepaidAcctId,
      description: '預收團款',
      debit_amount: 0,
      credit_amount: grossAmount,
    })
  }

  const { error: linesError } = await supabase
    .from('journal_lines')
    .insert(lines)

  if (linesError) {
    return { success: false, error: linesError.message }
  }

  return {
    success: true,
    eventId,
    voucherId,
    voucherNo,
  }
}

/**
 * 供應商付款過帳
 *
 * Dr 預付團務成本 amount
 * Cr 銀行存款 amount
 */
export async function postSupplierPayment(
  workspaceId: string,
  userId: string,
  request: PostSupplierPaymentRequest
): Promise<PostingResult> {
  const { amount, bank_account_id, tour_id, memo } = request

  const eventDate = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  // 建立會計事件
  const eventId = generateUUID()

  const { error: eventError } = await supabase
    .from('accounting_events')
    .insert({
      id: eventId,
      workspace_id: workspaceId,
      event_type: 'supplier_payment_posted' as AccountingEventType,
      source_type: 'payout',
      source_id: request.payout_id,
      tour_id,
      event_date: eventDate,
      meta: { amount },
      status: 'posted',
      created_by: userId,
      created_at: now,
      updated_at: now,
    })

  if (eventError) {
    return { success: false, error: eventError.message }
  }

  // 生成傳票
  const voucherNo = await generateVoucherNo(workspaceId)
  const voucherId = generateUUID()

  const prepaidCostAcctId = await getAccountId(workspaceId, '1200') // 預付團務成本
  const bankAcctId = await getBankAccountId(bank_account_id)

  const { error: voucherError } = await supabase
    .from('journal_vouchers')
    .insert({
      id: voucherId,
      workspace_id: workspaceId,
      voucher_no: voucherNo,
      voucher_date: eventDate,
      memo: memo || '供應商付款',
      event_id: eventId,
      status: 'posted',
      total_debit: amount,
      total_credit: amount,
      created_by: userId,
      created_at: now,
      updated_at: now,
    })

  if (voucherError) {
    return { success: false, error: voucherError.message }
  }

  const lines: JournalLineInsert[] = []
  let lineNo = 1

  // Dr 預付團務成本
  if (prepaidCostAcctId) {
    lines.push({
      id: generateUUID(),
      voucher_id: voucherId,
      line_no: lineNo++,
      account_id: prepaidCostAcctId,
      description: '預付團務成本',
      debit_amount: amount,
      credit_amount: 0,
    })
  }

  // Cr 銀行存款
  if (bankAcctId) {
    lines.push({
      id: generateUUID(),
      voucher_id: voucherId,
      line_no: lineNo++,
      account_id: bankAcctId,
      description: '付款',
      debit_amount: 0,
      credit_amount: amount,
    })
  }

  const { error: linesError } = await supabase
    .from('journal_lines')
    .insert(lines)

  if (linesError) {
    return { success: false, error: linesError.message }
  }

  return {
    success: true,
    eventId,
    voucherId,
    voucherNo,
  }
}

/**
 * 結團過帳 - 一次性產生結團傳票
 */
export async function postGroupSettlement(
  workspaceId: string,
  userId: string,
  request: PostGroupSettlementRequest
): Promise<PostingResult> {
  const {
    tour_id,
    group_revenue,
    original_cost,
    participants,
    admin_fee_per_person = 10,
    tax_rate = 0.12,
    sales_bonus = 0,
    op_bonus = 0,
    team_bonus = 0,
    bank_account_id,
    memo,
  } = request

  const eventDate = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  // 計算
  const profitBase = group_revenue - original_cost
  const adminFee = participants * admin_fee_per_person
  const tax = Math.round(profitBase * tax_rate)

  // 建立會計事件
  const eventId = generateUUID()
  const eventMeta: AccountingEventMeta = {
    group_revenue,
    original_cost,
    participants,
    admin_fee_per_person,
    admin_fee: adminFee,
    tax_rate,
    tax_amount: tax,
    sales_bonus,
    op_bonus,
    team_bonus,
  }

  const { error: eventError } = await supabase
    .from('accounting_events')
    .insert({
      id: eventId,
      workspace_id: workspaceId,
      event_type: 'group_settlement_posted' as AccountingEventType,
      source_type: 'group',
      tour_id,
      event_date: eventDate,
      meta: eventMeta as Json,
      status: 'posted',
      created_by: userId,
      created_at: now,
      updated_at: now,
    })

  if (eventError) {
    return { success: false, error: eventError.message }
  }

  // 生成傳票
  const voucherNo = await generateVoucherNo(workspaceId)
  const voucherId = generateUUID()

  // 計算借貸總額
  const totalDebit = group_revenue + original_cost + adminFee + tax + sales_bonus + op_bonus + team_bonus
  const totalCredit = group_revenue + original_cost + adminFee + tax + sales_bonus + op_bonus + team_bonus

  const { error: voucherError } = await supabase
    .from('journal_vouchers')
    .insert({
      id: voucherId,
      workspace_id: workspaceId,
      voucher_no: voucherNo,
      voucher_date: eventDate,
      memo: memo || '結團過帳',
      event_id: eventId,
      status: 'posted',
      total_debit: totalDebit,
      total_credit: totalCredit,
      created_by: userId,
      created_at: now,
      updated_at: now,
    })

  if (voucherError) {
    return { success: false, error: voucherError.message }
  }

  // 獲取所有需要的科目
  const accounts = await Promise.all([
    getAccountId(workspaceId, '2100'), // 預收團款
    getAccountId(workspaceId, '4100'), // 團費收入
    getAccountId(workspaceId, '1200'), // 預付團務成本
    getAccountId(workspaceId, '5100'), // 團務成本
    getAccountId(workspaceId, '5110'), // 團務成本-行政費
    getAccountId(workspaceId, '4200'), // 其他收入-行政費收入
    getAccountId(workspaceId, '5120'), // 團務成本-代收稅金
    getAccountId(workspaceId, '2200'), // 代收稅金（應付）
    getAccountId(workspaceId, '5130'), // 團務成本-業務獎金
    getAccountId(workspaceId, '5140'), // 團務成本-OP獎金
    getAccountId(workspaceId, '5150'), // 團務成本-團績獎金
    getAccountId(workspaceId, '2300'), // 獎金應付帳款
    getBankAccountId(bank_account_id), // 銀行帳戶
  ])

  const [
    prepaidAcctId,
    revenueAcctId,
    prepaidCostAcctId,
    costAcctId,
    adminFeeCostAcctId,
    adminFeeRevenueAcctId,
    taxCostAcctId,
    taxPayableAcctId,
    salesBonusCostAcctId,
    opBonusCostAcctId,
    teamBonusCostAcctId,
    bonusPayableAcctId,
    bankAcctId,
  ] = accounts

  const lines: JournalLineInsert[] = []
  let lineNo = 1

  // A) 轉列：預收 → 收入、預付 → 成本
  if (prepaidAcctId) {
    lines.push({
      id: generateUUID(),
      voucher_id: voucherId,
      line_no: lineNo++,
      account_id: prepaidAcctId,
      description: '預收團款轉列',
      debit_amount: group_revenue,
      credit_amount: 0,
    })
  }

  if (revenueAcctId) {
    lines.push({
      id: generateUUID(),
      voucher_id: voucherId,
      line_no: lineNo++,
      account_id: revenueAcctId,
      description: '團費收入',
      debit_amount: 0,
      credit_amount: group_revenue,
    })
  }

  if (costAcctId) {
    lines.push({
      id: generateUUID(),
      voucher_id: voucherId,
      line_no: lineNo++,
      account_id: costAcctId,
      description: '團務成本',
      debit_amount: original_cost,
      credit_amount: 0,
    })
  }

  if (prepaidCostAcctId) {
    lines.push({
      id: generateUUID(),
      voucher_id: voucherId,
      line_no: lineNo++,
      account_id: prepaidCostAcctId,
      description: '預付團務成本轉列',
      debit_amount: 0,
      credit_amount: original_cost,
    })
  }

  // B) 行政費
  if (adminFee > 0) {
    if (adminFeeCostAcctId) {
      lines.push({
        id: generateUUID(),
        voucher_id: voucherId,
        line_no: lineNo++,
        account_id: adminFeeCostAcctId,
        description: `行政費 ${participants}人 x ${admin_fee_per_person}元`,
        debit_amount: adminFee,
        credit_amount: 0,
      })
    }
    if (adminFeeRevenueAcctId) {
      lines.push({
        id: generateUUID(),
        voucher_id: voucherId,
        line_no: lineNo++,
        account_id: adminFeeRevenueAcctId,
        description: '行政費收入',
        debit_amount: 0,
        credit_amount: adminFee,
      })
    }
  }

  // C) 12% 代收稅金
  if (tax > 0) {
    if (taxCostAcctId) {
      lines.push({
        id: generateUUID(),
        voucher_id: voucherId,
        line_no: lineNo++,
        account_id: taxCostAcctId,
        description: `代收稅金 ${(tax_rate * 100).toFixed(0)}%`,
        debit_amount: tax,
        credit_amount: 0,
      })
    }
    if (taxPayableAcctId) {
      lines.push({
        id: generateUUID(),
        voucher_id: voucherId,
        line_no: lineNo++,
        account_id: taxPayableAcctId,
        description: '代收稅金（應付）',
        debit_amount: 0,
        credit_amount: tax,
      })
    }
  }

  // D) 獎金
  // 業務獎金（結團即付）
  if (sales_bonus > 0) {
    if (salesBonusCostAcctId) {
      lines.push({
        id: generateUUID(),
        voucher_id: voucherId,
        line_no: lineNo++,
        account_id: salesBonusCostAcctId,
        description: '業務獎金',
        debit_amount: sales_bonus,
        credit_amount: 0,
      })
    }
    if (bankAcctId) {
      lines.push({
        id: generateUUID(),
        voucher_id: voucherId,
        line_no: lineNo++,
        account_id: bankAcctId,
        description: '業務獎金付款',
        debit_amount: 0,
        credit_amount: sales_bonus,
      })
    }
  }

  // OP 獎金（結團即付）
  if (op_bonus > 0) {
    if (opBonusCostAcctId) {
      lines.push({
        id: generateUUID(),
        voucher_id: voucherId,
        line_no: lineNo++,
        account_id: opBonusCostAcctId,
        description: 'OP獎金',
        debit_amount: op_bonus,
        credit_amount: 0,
      })
    }
    if (bankAcctId) {
      lines.push({
        id: generateUUID(),
        voucher_id: voucherId,
        line_no: lineNo++,
        account_id: bankAcctId,
        description: 'OP獎金付款',
        debit_amount: 0,
        credit_amount: op_bonus,
      })
    }
  }

  // 團績獎金（擇日付）
  if (team_bonus > 0) {
    if (teamBonusCostAcctId) {
      lines.push({
        id: generateUUID(),
        voucher_id: voucherId,
        line_no: lineNo++,
        account_id: teamBonusCostAcctId,
        description: '團績獎金',
        debit_amount: team_bonus,
        credit_amount: 0,
      })
    }
    if (bonusPayableAcctId) {
      lines.push({
        id: generateUUID(),
        voucher_id: voucherId,
        line_no: lineNo++,
        account_id: bonusPayableAcctId,
        description: '團績獎金（應付）',
        debit_amount: 0,
        credit_amount: team_bonus,
      })
    }
  }

  const { error: linesError } = await supabase
    .from('journal_lines')
    .insert(lines)

  if (linesError) {
    return { success: false, error: linesError.message }
  }

  return {
    success: true,
    eventId,
    voucherId,
    voucherNo,
  }
}

/**
 * 反沖傳票
 */
export async function reverseVoucher(
  workspaceId: string,
  userId: string,
  voucherId: string,
  reason: string
): Promise<PostingResult> {
  // 獲取原傳票
  const { data: originalVoucher, error: fetchError } = await supabase
    .from('journal_vouchers')
    .select('*, journal_lines(*)')
    .eq('id', voucherId)
    .single() as { data: {
      id: string
      voucher_no: string
      status: string
      total_debit: number
      total_credit: number
      event_id: string | null
      journal_lines: JournalLine[] | null
    } | null, error: unknown }

  if (fetchError || !originalVoucher) {
    return { success: false, error: '找不到原傳票' }
  }

  if (originalVoucher.status !== 'posted') {
    return { success: false, error: '只有已過帳的傳票可以反沖' }
  }

  const eventDate = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  // 建立反沖事件
  const eventId = generateUUID()

  const { error: eventError } = await supabase
    .from('accounting_events')
    .insert({
      id: eventId,
      workspace_id: workspaceId,
      event_type: 'manual_voucher' as AccountingEventType,
      source_type: 'reversal',
      source_id: voucherId,
      event_date: eventDate,
      meta: { reason, original_voucher_no: originalVoucher.voucher_no } as Json,
      status: 'posted',
      created_by: userId,
      created_at: now,
      updated_at: now,
    })

  if (eventError) {
    return { success: false, error: eventError.message }
  }

  // 生成反沖傳票
  const voucherNo = await generateVoucherNo(workspaceId)
  const newVoucherId = generateUUID()

  const { error: voucherError } = await supabase
    .from('journal_vouchers')
    .insert({
      id: newVoucherId,
      workspace_id: workspaceId,
      voucher_no: voucherNo,
      voucher_date: eventDate,
      memo: `反沖 ${originalVoucher.voucher_no}：${reason}`,
      event_id: eventId,
      status: 'posted',
      total_debit: originalVoucher.total_credit,
      total_credit: originalVoucher.total_debit,
      created_by: userId,
      created_at: now,
      updated_at: now,
    })

  if (voucherError) {
    return { success: false, error: voucherError.message }
  }

  // 反沖分錄（借貸互換）
  const originalLines = originalVoucher.journal_lines || []
  const reversalLines = originalLines.map((line: JournalLine, index: number) => ({
    id: generateUUID(),
    voucher_id: newVoucherId,
    line_no: index + 1,
    account_id: line.account_id,
    description: `反沖：${line.description || ''}`,
    debit_amount: line.credit_amount,
    credit_amount: line.debit_amount,
  }))

  const { error: linesError } = await supabase
    .from('journal_lines')
    .insert(reversalLines)

  if (linesError) {
    return { success: false, error: linesError.message }
  }

  // 更新原傳票狀態
  await supabase
    .from('journal_vouchers')
    .update({ status: 'reversed', updated_at: now })
    .eq('id', voucherId)

  // 更新原事件狀態
  if (originalVoucher.event_id) {
    await supabase
      .from('accounting_events')
      .update({ status: 'reversed', reversal_event_id: eventId, updated_at: now })
      .eq('id', originalVoucher.event_id)
  }

  return {
    success: true,
    eventId,
    voucherId: newVoucherId,
    voucherNo,
  }
}
