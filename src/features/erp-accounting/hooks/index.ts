// ERP 會計模組 Hooks
import { createCloudHook } from '@/hooks/createCloudHook'
import type {
  Account,
  BankAccount,
  AccountingEvent,
  JournalVoucher,
  JournalLine,
  AccountingPeriod,
} from '@/types/accounting.types'

// 基礎實體擴展
interface AccountEntity extends Account {
  id: string
  created_at: string | null
  updated_at: string | null
}

interface BankAccountEntity extends BankAccount {
  id: string
  created_at: string | null
  updated_at: string | null
}

interface AccountingEventEntity extends AccountingEvent {
  id: string
  created_at: string | null
  updated_at: string | null
}

interface JournalVoucherEntity extends JournalVoucher {
  id: string
  created_at: string | null
  updated_at: string | null
}

interface JournalLineEntity extends JournalLine {
  id: string
  created_at: string | null
  updated_at: string | null
}

interface AccountingPeriodEntity extends AccountingPeriod {
  id: string
  created_at: string | null
  updated_at: string | null
}

// 科目表 Hook
export const useAccounts = createCloudHook<AccountEntity>(
  'chart_of_accounts' as never,
  {
    orderBy: { column: 'code', ascending: true },
    workspaceScoped: true,
  }
)

// 銀行帳戶 Hook
export const useBankAccounts = createCloudHook<BankAccountEntity>(
  'erp_bank_accounts' as never,
  {
    orderBy: { column: 'name', ascending: true },
    workspaceScoped: true,
  }
)

// 會計事件 Hook
export const useAccountingEvents = createCloudHook<AccountingEventEntity>(
  'accounting_events' as never,
  {
    orderBy: { column: 'event_date', ascending: false },
    workspaceScoped: true,
  }
)

// 傳票 Hook
export const useJournalVouchers = createCloudHook<JournalVoucherEntity>(
  'journal_vouchers' as never,
  {
    orderBy: { column: 'voucher_date', ascending: false },
    workspaceScoped: true,
  }
)

// 傳票分錄 Hook（不需要 workspace 隔離，透過 voucher 關聯）
export const useJournalLines = createCloudHook<JournalLineEntity>(
  'journal_lines' as never,
  {
    orderBy: { column: 'line_no', ascending: true },
    workspaceScoped: false,
  }
)

// 會計期間 Hook
export const useAccountingPeriods = createCloudHook<AccountingPeriodEntity>(
  'accounting_periods' as never,
  {
    orderBy: { column: 'start_date', ascending: false },
    workspaceScoped: true,
  }
)
