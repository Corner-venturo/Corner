/**
 * accounting_report.service.ts - 會計報表資料存取
 *
 * 從 useAccountingReports hook 抽取的 Supabase 查詢邏輯
 */

import { supabase } from '@/lib/supabase/client'

/** 查詢傳票分錄 */
export async function queryJournalLines(params: {
  workspaceId: string
  startDate?: string
  endDate?: string
  accountId?: string
  accountTypes?: string[]
  cashAccountIds?: string[]
  beforeDate?: string
}) {
  let query = supabase
    .from('journal_lines')
    .select(`
      id,
      description,
      debit_amount,
      credit_amount,
      account_id,
      voucher:journal_vouchers!inner(
        id,
        voucher_no,
        voucher_date,
        status,
        workspace_id,
        memo
      ),
      account:chart_of_accounts(
        id,
        code,
        name,
        account_type
      )
    `)
    .eq('voucher.status', 'posted')
    .eq('voucher.workspace_id', params.workspaceId)

  if (params.startDate) {
    query = query.gte('voucher.voucher_date', params.startDate)
  }
  if (params.endDate) {
    query = query.lte('voucher.voucher_date', params.endDate)
  }
  if (params.beforeDate) {
    query = query.lt('voucher.voucher_date', params.beforeDate)
  }
  if (params.accountId) {
    query = query.eq('account_id', params.accountId)
  }
  if (params.cashAccountIds && params.cashAccountIds.length > 0) {
    query = query.in('account_id', params.cashAccountIds)
  }

  query = query.order('voucher.voucher_date', { ascending: true })

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

/** 查詢會計科目 */
export async function queryChartOfAccounts(params: {
  workspaceId: string
  accountTypes?: string[]
}) {
  let query = supabase
    .from('chart_of_accounts')
    .select('id, code, name, account_type')
    .eq('workspace_id', params.workspaceId)
    .eq('is_active', true)
    .order('code', { ascending: true })

  if (params.accountTypes && params.accountTypes.length > 0) {
    query = query.in('account_type', params.accountTypes)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

/** 查詢銀行帳戶的會計科目 ID */
export async function queryCashAccountIds(workspaceId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('erp_bank_accounts')
    .select('account_id')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)

  if (error) throw error
  return (data ?? [])
    .map(b => b.account_id)
    .filter((id): id is string => id !== null)
}
