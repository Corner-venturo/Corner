'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Itinerary } from '@/stores/types'
import type { Quote } from '@/types/quote.types'
import { confirm, alertSuccess, alertError } from '@/lib/ui/alert-dialog'
import type { PageStateApi } from './useItineraryPageState'

// 公司密碼（統編）
const COMPANY_PASSWORD = '83212711'

interface UseItineraryActionsProps {
  updateItinerary: (id: string, data: Partial<Itinerary>) => Promise<Itinerary | void>
  deleteItinerary: (id: string) => Promise<void>
  createItinerary: (data: Partial<Itinerary>) => Promise<Itinerary | null>
  createQuote: (data: Partial<Quote>) => Promise<Quote | null>
  updateQuote: (id: string, data: Partial<Quote>) => Promise<Quote | void>
  quotes: Quote[]
  userId?: string
  userName?: string
  pageState: PageStateApi
}

export function useItineraryActions({
  updateItinerary,
  deleteItinerary,
  createItinerary,
  createQuote,
  updateQuote,
  quotes,
  userId,
  userName,
  pageState,
}: UseItineraryActionsProps) {
  const router = useRouter()

  // ===== 解構穩定的函數（這些都是 stable 的）=====
  const {
    // Setters
    setDuplicateSource,
    setDuplicateTourCode,
    setDuplicateTitle,
    setIsDuplicateDialogOpen,
    setIsDuplicating,
    setPendingEditId,
    setPasswordInput,
    setIsPasswordDialogOpen,
    // Getters
    getDuplicateSource,
    getDuplicateTourCode,
    getDuplicateTitle,
    getPasswordInput,
    getPendingEditId,
  } = pageState

  // 打開複製行程對話框 - 只依賴穩定的 setters
  const handleOpenDuplicateDialog = useCallback((itinerary: Itinerary) => {
    setDuplicateSource(itinerary)
    setDuplicateTourCode('')
    setDuplicateTitle('')
    setIsDuplicateDialogOpen(true)
  }, [setDuplicateSource, setDuplicateTourCode, setDuplicateTitle, setIsDuplicateDialogOpen])

  // 執行複製行程 - 使用穩定的 getters 和 setters
  const handleDuplicateSubmit = useCallback(async () => {
    const duplicateSource = getDuplicateSource()
    const duplicateTourCode = getDuplicateTourCode()
    const duplicateTitle = getDuplicateTitle()

    if (!duplicateSource) return
    if (!duplicateTourCode.trim() || !duplicateTitle.trim()) {
      await alertError('請填寫行程編號和行程名稱')
      return
    }

    setIsDuplicating(true)
    try {
      const {
        id: sourceItineraryId,
        created_at: _createdAt,
        updated_at: _updatedAt,
        created_by: _createdBy,
        updated_by: _updatedBy,
        workspace_id: _workspaceId,
        tour_id: _tourId,
        is_template: _isTemplate,
        closed_at: _closedAt,
        archived_at: _archivedAt,
        ...restData
      } = duplicateSource

      const newItinerary = {
        ...restData,
        tour_code: duplicateTourCode.trim(),
        title: duplicateTitle.trim(),
        status: '提案' as const,
        created_by: userId,
      }

      const createdItinerary = await createItinerary(newItinerary)

      // 查找並複製關聯的報價單
      const linkedQuotes = quotes.filter(q => q.itinerary_id === sourceItineraryId)
      let quoteCopiedCount = 0

      for (const quote of linkedQuotes) {
        const newQuote: Partial<Quote> = {
          code: quote.code,
          quote_type: quote.quote_type,
          customer_name: '（待填寫）',
          itinerary_id: createdItinerary?.id,
          destination: quote.destination,
          start_date: quote.start_date,
          end_date: quote.end_date,
          days: quote.days,
          nights: quote.nights,
          number_of_people: quote.number_of_people,
          status: 'proposed',
          total_amount: quote.total_amount,
          total_cost: quote.total_cost,
          notes: quote.notes,
          is_active: quote.is_active,
          tour_code: duplicateTourCode.trim(),
          created_by: userId,
          created_by_name: userName || undefined,
          converted_to_tour: false,
          is_pinned: false,
          quick_quote_items: quote.quick_quote_items,
          expense_description: quote.expense_description,
        }

        await createQuote(newQuote)
        quoteCopiedCount++
      }

      const successMsg = quoteCopiedCount > 0
        ? `行程已複製成功！同時複製了 ${quoteCopiedCount} 個報價單（客戶資料已清空）`
        : '行程已複製成功！'
      await alertSuccess(successMsg)
      setIsDuplicateDialogOpen(false)
      setDuplicateSource(null)
      setDuplicateTourCode('')
      setDuplicateTitle('')
    } catch {
      await alertError('複製失敗，請稍後再試')
    } finally {
      setIsDuplicating(false)
    }
  }, [
    getDuplicateSource, getDuplicateTourCode, getDuplicateTitle,
    setIsDuplicating, setIsDuplicateDialogOpen, setDuplicateSource,
    setDuplicateTourCode, setDuplicateTitle,
    createItinerary, createQuote, quotes, userId, userName
  ])

  // 封存行程
  const handleArchive = useCallback(
    async (id: string) => {
      const linkedQuotes = quotes.filter(q => q.itinerary_id === id)
      const hasLinkedQuotes = linkedQuotes.length > 0

      let syncAction: 'sync' | 'unlink' | 'cancel' = 'cancel'

      if (hasLinkedQuotes) {
        const result = await confirm(
          `此行程有 ${linkedQuotes.length} 個關聯的報價單。\n\n請選擇封存方式：\n• 同步封存：報價單也一併封存\n• 僅封存行程：斷開關聯，報價單保留`,
          {
            type: 'warning',
            title: '封存行程',
            confirmText: '同步封存',
            cancelText: '取消',
            showThirdOption: true,
            thirdOptionText: '僅封存行程',
          }
        )

        if (result === true) {
          syncAction = 'sync'
        } else if (result === 'third') {
          syncAction = 'unlink'
        } else {
          return
        }
      } else {
        const confirmed = await confirm('確定要封存這個行程嗎？封存後可在「封存」分頁中找到。', {
          type: 'warning',
          title: '封存行程',
        })
        if (!confirmed) return
        syncAction = 'sync'
      }

      try {
        const archivedAt = new Date().toISOString()
        await updateItinerary(id, { archived_at: archivedAt })

        if (hasLinkedQuotes) {
          if (syncAction === 'sync') {
            for (const quote of linkedQuotes) {
              await updateQuote(quote.id, { status: 'rejected' as const })
            }
            await alertSuccess(`已封存行程及 ${linkedQuotes.length} 個報價單！`)
          } else if (syncAction === 'unlink') {
            for (const quote of linkedQuotes) {
              await updateQuote(quote.id, { itinerary_id: undefined })
            }
            await alertSuccess('已封存行程！報價單已斷開關聯並保留。')
          }
        } else {
          await alertSuccess('已封存！')
        }
      } catch {
        await alertError('封存失敗，請稍後再試')
      }
    },
    [updateItinerary, updateQuote, quotes]
  )

  // 取消封存
  const handleUnarchive = useCallback(
    async (id: string) => {
      try {
        await updateItinerary(id, { archived_at: null })
        await alertSuccess('已取消封存！')
      } catch {
        await alertError('操作失敗，請稍後再試')
      }
    },
    [updateItinerary]
  )

  // 刪除行程
  const handleDelete = useCallback(
    async (id: string) => {
      const confirmed = await confirm('確定要永久刪除這個行程嗎？此操作無法復原！', {
        type: 'warning',
        title: '永久刪除行程',
      })
      if (confirmed) {
        try {
          await deleteItinerary(id)
          await alertSuccess('已永久刪除！')
        } catch {
          await alertError('刪除失敗，請稍後再試')
        }
      }
    },
    [deleteItinerary]
  )

  // 設為公司範例
  const handleSetTemplate = useCallback(
    async (id: string, isTemplate: boolean) => {
      try {
        await updateItinerary(id, { is_template: isTemplate })
        await alertSuccess(isTemplate ? '已設為公司範例！' : '已取消公司範例！')
      } catch {
        await alertError('操作失敗，請稍後再試')
      }
    },
    [updateItinerary]
  )

  // 手動結案
  const handleClose = useCallback(
    async (id: string) => {
      const confirmed = await confirm('確定要結案這個行程嗎？結案後仍可在「結案」分頁中查看。', {
        type: 'warning',
        title: '結案行程',
      })
      if (confirmed) {
        try {
          await updateItinerary(id, { closed_at: new Date().toISOString() })
          await alertSuccess('已結案！')
        } catch {
          await alertError('結案失敗，請稍後再試')
        }
      }
    },
    [updateItinerary]
  )

  // 取消結案
  const handleReopen = useCallback(
    async (id: string) => {
      try {
        await updateItinerary(id, { closed_at: null })
        await alertSuccess('已重新開啟！')
      } catch {
        await alertError('操作失敗，請稍後再試')
      }
    },
    [updateItinerary]
  )

  // 處理行程點擊 - 只依賴穩定的 setters
  const handleRowClick = useCallback(
    (itinerary: Itinerary) => {
      if (itinerary.status === '進行中') {
        setPendingEditId(itinerary.id)
        setPasswordInput('')
        setIsPasswordDialogOpen(true)
      } else {
        router.push(`/itinerary/new?itinerary_id=${itinerary.id}`)
      }
    },
    [router, setPendingEditId, setPasswordInput, setIsPasswordDialogOpen]
  )

  // 密碼驗證 - 使用穩定的 getters 和 setters
  const handlePasswordSubmit = useCallback(() => {
    const passwordInput = getPasswordInput()
    const pendingEditId = getPendingEditId()

    if (passwordInput === COMPANY_PASSWORD) {
      setIsPasswordDialogOpen(false)
      if (pendingEditId) {
        router.push(`/itinerary/new?itinerary_id=${pendingEditId}`)
      }
    } else {
      alertError('密碼錯誤！')
    }
  }, [getPasswordInput, getPendingEditId, setIsPasswordDialogOpen, router])

  // 判斷行程是否已結案 - 純函數，無依賴
  const isItineraryClosed = useCallback((itinerary: Itinerary) => {
    if (itinerary.closed_at) return true
    if (itinerary.is_template) return false
    if (itinerary.departure_date) {
      const departureDate = new Date(itinerary.departure_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return departureDate < today
    }
    return false
  }, [])

  // 使用 useMemo 確保返回的物件穩定
  return useMemo(() => ({
    handleOpenDuplicateDialog,
    handleDuplicateSubmit,
    handleArchive,
    handleUnarchive,
    handleDelete,
    handleSetTemplate,
    handleClose,
    handleReopen,
    handleRowClick,
    handlePasswordSubmit,
    isItineraryClosed,
  }), [
    handleOpenDuplicateDialog,
    handleDuplicateSubmit,
    handleArchive,
    handleUnarchive,
    handleDelete,
    handleSetTemplate,
    handleClose,
    handleReopen,
    handleRowClick,
    handlePasswordSubmit,
    isItineraryClosed,
  ])
}
