import { useRef, useState, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { logger } from '@/lib/utils/logger'
import { TOUR_CONFIRMATION_SHEET_PAGE_LABELS } from '../constants/labels'

interface UseInlineEditingOptions {
  updateItem: (id: string, data: Record<string, unknown>) => Promise<unknown>
}

/**
 * 管理行內編輯的 local state（預計支出 & 備註）
 * 使用 ref + forceUpdate 避免每次輸入都觸發全部 re-render
 */
export function useInlineEditing({ updateItem }: UseInlineEditingOptions) {
  const { toast } = useToast()
  const [, forceUpdate] = useState(0)

  // 預計支出
  const localExpectedCostsRef = useRef<
    Record<string, { value: number | null; formula?: string; dirty: boolean }>
  >({})

  const handleExpectedCostChange = useCallback((itemId: string, value: number | null) => {
    localExpectedCostsRef.current[itemId] = {
      ...localExpectedCostsRef.current[itemId],
      value,
      dirty: true,
    }
    forceUpdate((n) => n + 1)
  }, [])

  const handleExpectedCostFormulaChange = useCallback(
    (itemId: string, formula: string | undefined) => {
      localExpectedCostsRef.current[itemId] = {
        ...localExpectedCostsRef.current[itemId],
        formula,
        dirty: true,
      }
    },
    []
  )

  const handleExpectedCostBlur = useCallback(
    async (itemId: string, currentTypeData?: unknown) => {
      const local = localExpectedCostsRef.current[itemId]
      if (!local?.dirty) return

      try {
        const updates: Record<string, unknown> = { expected_cost: local.value }
        if (local.formula !== undefined) {
          updates.type_data = {
            ...((currentTypeData as Record<string, unknown>) || {}),
            expected_cost_formula: local.formula || null,
          }
        }
        await updateItem(itemId, updates)
        localExpectedCostsRef.current[itemId] = { ...local, dirty: false }
      } catch (err) {
        logger.error('更新預計支出失敗:', err)
        toast({ title: TOUR_CONFIRMATION_SHEET_PAGE_LABELS.更新失敗, variant: 'destructive' })
      }
    },
    [updateItem, toast]
  )

  // 備註
  const localNotesRef = useRef<Record<string, { value: string; dirty: boolean }>>({})

  const handleNotesChange = useCallback((itemId: string, value: string) => {
    localNotesRef.current[itemId] = { value, dirty: true }
    forceUpdate((n) => n + 1)
  }, [])

  const handleNotesBlur = useCallback(
    async (itemId: string) => {
      const local = localNotesRef.current[itemId]
      if (!local?.dirty) return

      try {
        await updateItem(itemId, { notes: local.value || null })
        localNotesRef.current[itemId] = { ...local, dirty: false }
      } catch (err) {
        logger.error('更新備註失敗:', err)
        toast({ title: '更新失敗', variant: 'destructive' })
      }
    },
    [updateItem, toast]
  )

  return {
    localExpectedCostsRef,
    handleExpectedCostChange,
    handleExpectedCostFormulaChange,
    handleExpectedCostBlur,
    localNotesRef,
    handleNotesChange,
    handleNotesBlur,
  }
}
