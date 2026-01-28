/**
 * Venturo ERP 郵件 Store
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type {
  Email,
  EmailAttachment,
  EmailAccount,
  EmailFilter,
  EmailFolder,
  EmailSortField,
  EmailSortOrder,
  EmailStats,
  SendEmailRequest,
  EMAIL_FOLDER_FILTERS,
} from '@/types/email.types'
import { logger } from '@/lib/utils/logger'

// ============================================================================
// Store State
// ============================================================================

interface EmailStoreState {
  // 列表
  emails: Email[]
  total: number
  loading: boolean
  error: string | null

  // 當前選中
  selectedEmailId: string | null
  selectedEmail: Email | null
  loadingDetail: boolean

  // 篩選
  currentFolder: EmailFolder
  filter: EmailFilter
  sortBy: EmailSortField
  sortOrder: EmailSortOrder

  // 分頁
  page: number
  pageSize: number

  // 撰寫郵件
  composeOpen: boolean
  draftEmail: Partial<SendEmailRequest> | null
  replyToEmail: Email | null

  // 帳戶
  accounts: EmailAccount[]
  defaultAccount: EmailAccount | null
  loadingAccounts: boolean

  // 統計
  stats: EmailStats | null

  // Actions
  fetchEmails: () => Promise<void>
  fetchEmailById: (id: string) => Promise<Email | null>
  fetchAccounts: () => Promise<void>
  fetchStats: () => Promise<void>

  // 資料夾切換
  setFolder: (folder: EmailFolder) => void
  setFilter: (filter: Partial<EmailFilter>) => void
  setSort: (sortBy: EmailSortField, sortOrder?: EmailSortOrder) => void
  setPage: (page: number) => void

  // 選擇
  selectEmail: (id: string | null) => void

  // 操作
  markAsRead: (ids: string[]) => Promise<void>
  markAsUnread: (ids: string[]) => Promise<void>
  toggleStar: (id: string) => Promise<void>
  archive: (ids: string[]) => Promise<void>
  moveToTrash: (ids: string[]) => Promise<void>
  deleteForever: (ids: string[]) => Promise<void>
  restore: (ids: string[]) => Promise<void>
  addLabels: (ids: string[], labels: string[]) => Promise<void>
  removeLabels: (ids: string[], labels: string[]) => Promise<void>

  // 撰寫
  openCompose: (draft?: Partial<SendEmailRequest>) => void
  closeCompose: () => void
  saveDraft: (draft: Partial<SendEmailRequest>) => Promise<string | null>
  sendEmail: (request: SendEmailRequest) => Promise<{ success: boolean; error?: string }>
  replyTo: (email: Email, replyAll?: boolean) => void

  // 清理
  reset: () => void
}

// ============================================================================
// 初始狀態
// ============================================================================

const initialState = {
  emails: [],
  total: 0,
  loading: false,
  error: null,

  selectedEmailId: null,
  selectedEmail: null,
  loadingDetail: false,

  currentFolder: 'inbox' as EmailFolder,
  filter: { direction: 'inbound', is_archived: false, is_trash: false } as EmailFilter,
  sortBy: 'created_at' as EmailSortField,
  sortOrder: 'desc' as EmailSortOrder,

  page: 1,
  pageSize: 50,

  composeOpen: false,
  draftEmail: null,
  replyToEmail: null,

  accounts: [],
  defaultAccount: null,
  loadingAccounts: false,

  stats: null,
}

// ============================================================================
// Store
// ============================================================================

export const useEmailStore = create<EmailStoreState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ========================================================================
      // 取得郵件列表
      // ========================================================================
      fetchEmails: async () => {
        const { filter, sortBy, sortOrder, page, pageSize } = get()
        set({ loading: true, error: null })

        try {
          const supabase = createSupabaseBrowserClient()

          let query = supabase
            .from('emails')
            .select('*, attachments:email_attachments(*)', { count: 'exact' })

          // 套用篩選條件
          if (filter.direction) {
            query = query.eq('direction', filter.direction)
          }
          if (filter.status) {
            if (Array.isArray(filter.status)) {
              query = query.in('status', filter.status)
            } else {
              query = query.eq('status', filter.status)
            }
          }
          if (filter.is_read !== undefined) {
            query = query.eq('is_read', filter.is_read)
          }
          if (filter.is_starred !== undefined) {
            query = query.eq('is_starred', filter.is_starred)
          }
          if (filter.is_archived !== undefined) {
            query = query.eq('is_archived', filter.is_archived)
          }
          if (filter.is_trash !== undefined) {
            query = query.eq('is_trash', filter.is_trash)
          }
          if (filter.customer_id) {
            query = query.eq('customer_id', filter.customer_id)
          }
          if (filter.supplier_id) {
            query = query.eq('supplier_id', filter.supplier_id)
          }
          if (filter.tour_id) {
            query = query.eq('tour_id', filter.tour_id)
          }
          if (filter.search) {
            query = query.or(`subject.ilike.%${filter.search}%,body_text.ilike.%${filter.search}%`)
          }
          if (filter.date_from) {
            query = query.gte('created_at', filter.date_from)
          }
          if (filter.date_to) {
            query = query.lte('created_at', filter.date_to)
          }

          // 排序
          query = query.order(sortBy, { ascending: sortOrder === 'asc' })

          // 分頁
          const from = (page - 1) * pageSize
          const to = from + pageSize - 1
          query = query.range(from, to)

          const { data, error, count } = await query

          if (error) throw error

          set({
            emails: (data || []) as Email[],
            total: count || 0,
            loading: false,
          })
        } catch (error) {
          logger.error('[EmailStore] fetchEmails error:', error)
          set({
            error: error instanceof Error ? error.message : '載入郵件失敗',
            loading: false,
          })
        }
      },

      // ========================================================================
      // 取得單封郵件詳情
      // ========================================================================
      fetchEmailById: async (id: string) => {
        set({ loadingDetail: true })

        try {
          const supabase = createSupabaseBrowserClient()

          const { data, error } = await supabase
            .from('emails')
            .select(`
              *,
              attachments:email_attachments(*),
              customer:customers(id, chinese_name, email),
              supplier:suppliers(id, name, email)
            `)
            .eq('id', id)
            .single()

          if (error) throw error

          const email = data as Email
          set({ selectedEmail: email, loadingDetail: false })

          // 自動標記為已讀
          if (!email.is_read && email.direction === 'inbound') {
            get().markAsRead([id])
          }

          return email
        } catch (error) {
          logger.error('[EmailStore] fetchEmailById error:', error)
          set({ loadingDetail: false })
          return null
        }
      },

      // ========================================================================
      // 取得郵件帳戶
      // ========================================================================
      fetchAccounts: async () => {
        set({ loadingAccounts: true })

        try {
          const supabase = createSupabaseBrowserClient()

          const { data, error } = await supabase
            .from('email_accounts')
            .select('*')
            .eq('is_active', true)
            .order('is_default', { ascending: false })

          if (error) throw error

          const accounts = (data || []) as EmailAccount[]
          const defaultAccount = accounts.find((a) => a.is_default) || accounts[0] || null

          set({ accounts, defaultAccount, loadingAccounts: false })
        } catch (error) {
          logger.error('[EmailStore] fetchAccounts error:', error)
          set({ loadingAccounts: false })
        }
      },

      // ========================================================================
      // 取得統計
      // ========================================================================
      fetchStats: async () => {
        try {
          const supabase = createSupabaseBrowserClient()
          const today = new Date().toISOString().split('T')[0]

          const [
            { count: totalInbound },
            { count: totalOutbound },
            { count: unreadCount },
            { count: sentToday },
            { count: receivedToday },
            { count: failedCount },
          ] = await Promise.all([
            supabase.from('emails').select('*', { count: 'exact', head: true }).eq('direction', 'inbound'),
            supabase.from('emails').select('*', { count: 'exact', head: true }).eq('direction', 'outbound'),
            supabase.from('emails').select('*', { count: 'exact', head: true }).eq('direction', 'inbound').eq('is_read', false).eq('is_trash', false),
            supabase.from('emails').select('*', { count: 'exact', head: true }).eq('direction', 'outbound').gte('sent_at', today),
            supabase.from('emails').select('*', { count: 'exact', head: true }).eq('direction', 'inbound').gte('received_at', today),
            supabase.from('emails').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
          ])

          set({
            stats: {
              total_inbound: totalInbound || 0,
              total_outbound: totalOutbound || 0,
              unread_count: unreadCount || 0,
              sent_today: sentToday || 0,
              received_today: receivedToday || 0,
              failed_count: failedCount || 0,
            },
          })
        } catch (error) {
          logger.error('[EmailStore] fetchStats error:', error)
        }
      },

      // ========================================================================
      // 資料夾與篩選
      // ========================================================================
      setFolder: (folder: EmailFolder) => {
        const folderFilters: Record<EmailFolder, EmailFilter> = {
          inbox: { direction: 'inbound', is_archived: false, is_trash: false },
          sent: { direction: 'outbound', status: ['sent', 'delivered'], is_trash: false },
          drafts: { status: 'draft', is_trash: false },
          starred: { is_starred: true, is_trash: false },
          archived: { is_archived: true, is_trash: false },
          trash: { is_trash: true },
          all: { is_trash: false },
        }

        set({
          currentFolder: folder,
          filter: folderFilters[folder],
          page: 1,
          selectedEmailId: null,
          selectedEmail: null,
        })

        get().fetchEmails()
      },

      setFilter: (newFilter: Partial<EmailFilter>) => {
        set((state) => ({
          filter: { ...state.filter, ...newFilter },
          page: 1,
        }))
        get().fetchEmails()
      },

      setSort: (sortBy: EmailSortField, sortOrder?: EmailSortOrder) => {
        set((state) => ({
          sortBy,
          sortOrder: sortOrder || (state.sortBy === sortBy && state.sortOrder === 'desc' ? 'asc' : 'desc'),
        }))
        get().fetchEmails()
      },

      setPage: (page: number) => {
        set({ page })
        get().fetchEmails()
      },

      // ========================================================================
      // 選擇
      // ========================================================================
      selectEmail: (id: string | null) => {
        if (id === null) {
          set({ selectedEmailId: null, selectedEmail: null })
        } else {
          set({ selectedEmailId: id })
          get().fetchEmailById(id)
        }
      },

      // ========================================================================
      // 操作：標記已讀/未讀
      // ========================================================================
      markAsRead: async (ids: string[]) => {
        try {
          const supabase = createSupabaseBrowserClient()
          await supabase.from('emails').update({ is_read: true }).in('id', ids)

          set((state) => ({
            emails: state.emails.map((e) =>
              ids.includes(e.id) ? { ...e, is_read: true } : e
            ),
            selectedEmail: state.selectedEmail && ids.includes(state.selectedEmail.id)
              ? { ...state.selectedEmail, is_read: true }
              : state.selectedEmail,
          }))

          get().fetchStats()
        } catch (error) {
          logger.error('[EmailStore] markAsRead error:', error)
        }
      },

      markAsUnread: async (ids: string[]) => {
        try {
          const supabase = createSupabaseBrowserClient()
          await supabase.from('emails').update({ is_read: false }).in('id', ids)

          set((state) => ({
            emails: state.emails.map((e) =>
              ids.includes(e.id) ? { ...e, is_read: false } : e
            ),
          }))

          get().fetchStats()
        } catch (error) {
          logger.error('[EmailStore] markAsUnread error:', error)
        }
      },

      // ========================================================================
      // 操作：星號
      // ========================================================================
      toggleStar: async (id: string) => {
        const email = get().emails.find((e) => e.id === id)
        if (!email) return

        const newStarred = !email.is_starred

        try {
          const supabase = createSupabaseBrowserClient()
          await supabase.from('emails').update({ is_starred: newStarred }).eq('id', id)

          set((state) => ({
            emails: state.emails.map((e) =>
              e.id === id ? { ...e, is_starred: newStarred } : e
            ),
            selectedEmail: state.selectedEmail?.id === id
              ? { ...state.selectedEmail, is_starred: newStarred }
              : state.selectedEmail,
          }))
        } catch (error) {
          logger.error('[EmailStore] toggleStar error:', error)
        }
      },

      // ========================================================================
      // 操作：封存/垃圾桶/刪除
      // ========================================================================
      archive: async (ids: string[]) => {
        try {
          const supabase = createSupabaseBrowserClient()
          await supabase.from('emails').update({ is_archived: true }).in('id', ids)

          set((state) => ({
            emails: state.emails.filter((e) => !ids.includes(e.id)),
            selectedEmailId: ids.includes(state.selectedEmailId || '') ? null : state.selectedEmailId,
            selectedEmail: ids.includes(state.selectedEmail?.id || '') ? null : state.selectedEmail,
          }))
        } catch (error) {
          logger.error('[EmailStore] archive error:', error)
        }
      },

      moveToTrash: async (ids: string[]) => {
        try {
          const supabase = createSupabaseBrowserClient()
          await supabase.from('emails').update({ is_trash: true }).in('id', ids)

          set((state) => ({
            emails: state.emails.filter((e) => !ids.includes(e.id)),
            selectedEmailId: ids.includes(state.selectedEmailId || '') ? null : state.selectedEmailId,
            selectedEmail: ids.includes(state.selectedEmail?.id || '') ? null : state.selectedEmail,
          }))

          get().fetchStats()
        } catch (error) {
          logger.error('[EmailStore] moveToTrash error:', error)
        }
      },

      deleteForever: async (ids: string[]) => {
        try {
          const supabase = createSupabaseBrowserClient()
          await supabase.from('emails').delete().in('id', ids)

          set((state) => ({
            emails: state.emails.filter((e) => !ids.includes(e.id)),
            selectedEmailId: ids.includes(state.selectedEmailId || '') ? null : state.selectedEmailId,
            selectedEmail: ids.includes(state.selectedEmail?.id || '') ? null : state.selectedEmail,
          }))
        } catch (error) {
          logger.error('[EmailStore] deleteForever error:', error)
        }
      },

      restore: async (ids: string[]) => {
        try {
          const supabase = createSupabaseBrowserClient()
          await supabase
            .from('emails')
            .update({ is_trash: false, is_archived: false })
            .in('id', ids)

          get().fetchEmails()
          get().fetchStats()
        } catch (error) {
          logger.error('[EmailStore] restore error:', error)
        }
      },

      // ========================================================================
      // 操作：標籤
      // ========================================================================
      addLabels: async (ids: string[], labels: string[]) => {
        try {
          const supabase = createSupabaseBrowserClient()

          // 取得現有標籤並合併
          for (const id of ids) {
            const email = get().emails.find((e) => e.id === id)
            if (email) {
              const newLabels = [...new Set([...email.labels, ...labels])]
              await supabase.from('emails').update({ labels: newLabels }).eq('id', id)
            }
          }

          get().fetchEmails()
        } catch (error) {
          logger.error('[EmailStore] addLabels error:', error)
        }
      },

      removeLabels: async (ids: string[], labels: string[]) => {
        try {
          const supabase = createSupabaseBrowserClient()

          for (const id of ids) {
            const email = get().emails.find((e) => e.id === id)
            if (email) {
              const newLabels = email.labels.filter((l) => !labels.includes(l))
              await supabase.from('emails').update({ labels: newLabels }).eq('id', id)
            }
          }

          get().fetchEmails()
        } catch (error) {
          logger.error('[EmailStore] removeLabels error:', error)
        }
      },

      // ========================================================================
      // 撰寫郵件
      // ========================================================================
      openCompose: (draft?: Partial<SendEmailRequest>) => {
        set({
          composeOpen: true,
          draftEmail: draft || null,
          replyToEmail: null,
        })
      },

      closeCompose: () => {
        set({
          composeOpen: false,
          draftEmail: null,
          replyToEmail: null,
        })
      },

      saveDraft: async (draft: Partial<SendEmailRequest>) => {
        try {
          const supabase = createSupabaseBrowserClient()
          const { defaultAccount } = get()

          const { data, error } = await supabase
            .from('emails')
            .insert({
              direction: 'outbound',
              status: 'draft',
              from_address: draft.from_address || defaultAccount?.email_address || '',
              from_name: defaultAccount?.display_name,
              to_addresses: draft.to || [],
              cc_addresses: draft.cc || [],
              bcc_addresses: draft.bcc || [],
              subject: draft.subject,
              body_html: draft.body_html,
              body_text: draft.body_text,
              customer_id: draft.customer_id,
              supplier_id: draft.supplier_id,
              tour_id: draft.tour_id,
              order_id: draft.order_id,
              labels: draft.labels || [],
            })
            .select()
            .single()

          if (error) throw error

          return data.id
        } catch (error) {
          logger.error('[EmailStore] saveDraft error:', error)
          return null
        }
      },

      sendEmail: async (request: SendEmailRequest) => {
        try {
          const response = await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          })

          const result = await response.json()

          if (!response.ok) {
            return { success: false, error: result.error || '發送失敗' }
          }

          // 重新載入列表
          get().fetchEmails()
          get().fetchStats()
          get().closeCompose()

          return { success: true }
        } catch (error) {
          logger.error('[EmailStore] sendEmail error:', error)
          return { success: false, error: '發送失敗' }
        }
      },

      replyTo: (email: Email, replyAll = false) => {
        const replyToAddress = email.reply_to_address || email.from_address
        const to: { email: string; name?: string }[] = [{ email: replyToAddress, name: email.from_name || undefined }]

        let cc: { email: string; name?: string }[] = []
        if (replyAll) {
          // 加入原始 CC
          cc = [...email.cc_addresses]
          // 加入原始 TO（排除自己）
          const { defaultAccount } = get()
          const myEmail = defaultAccount?.email_address
          email.to_addresses.forEach((addr) => {
            if (addr.email !== myEmail && addr.email !== replyToAddress) {
              cc.push(addr)
            }
          })
        }

        set({
          composeOpen: true,
          replyToEmail: email,
          draftEmail: {
            to,
            cc,
            subject: email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || ''}`,
            customer_id: email.customer_id || undefined,
            supplier_id: email.supplier_id || undefined,
            tour_id: email.tour_id || undefined,
            order_id: email.order_id || undefined,
          },
        })
      },

      // ========================================================================
      // 清理
      // ========================================================================
      reset: () => {
        set(initialState)
      },
    }),
    { name: 'email-store' }
  )
)
