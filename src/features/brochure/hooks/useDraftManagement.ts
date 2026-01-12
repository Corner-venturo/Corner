/**
 * useDraftManagement - 手冊草稿管理
 *
 * 功能：
 * - 自動儲存草稿到 localStorage
 * - 載入草稿
 * - 草稿列表管理
 */

'use client'

import { useCallback } from 'react'
import { logger } from '@/lib/utils/logger'
import type { TemplateData, MemoSettings, HotelData, AttractionData, CountryCode } from '@/features/designer/templates/definitions/types'
import type { CanvasElement } from '@/features/designer/components/types'
import type { BrochureDraft } from '../types'

interface DraftData {
  id: string
  name: string
  updated_at: string
  style_id: string
  template_data: TemplateData
  trip_days: number
  memo_settings: MemoSettings | null
  hotels: HotelData[]
  attractions: AttractionData[]
  country_code: CountryCode
  edited_elements: Record<string, CanvasElement>
}

interface UseDraftManagementParams {
  styleId: string | null
  templateData: TemplateData | null
  tripDays: number
  memoSettings: MemoSettings | null
  hotels: HotelData[]
  attractions: AttractionData[]
  selectedCountryCode: CountryCode
  editedElements: Record<string, CanvasElement>
  draftId: string | null
  setDraftId: (id: string | null) => void
  setIsSavingDraft: (saving: boolean) => void
  setLastSavedAt: (date: Date | null) => void
  setIsLoadedFromDraft: (loaded: boolean) => void
}

const DRAFT_STORAGE_KEY = 'brochure_drafts'
const MAX_DRAFTS = 10

/**
 * 草稿管理 Hook
 */
export function useDraftManagement({
  styleId,
  templateData,
  tripDays,
  memoSettings,
  hotels,
  attractions,
  selectedCountryCode,
  editedElements,
  draftId,
  setDraftId,
  setIsSavingDraft,
  setLastSavedAt,
  setIsLoadedFromDraft,
}: UseDraftManagementParams) {
  /**
   * 取得草稿儲存的 key
   */
  const getDraftKey = useCallback(() => {
    return DRAFT_STORAGE_KEY
  }, [])

  /**
   * 取得所有草稿
   */
  const getDrafts = useCallback((): DraftData[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      logger.error('讀取草稿失敗:', error)
      return []
    }
  }, [])

  /**
   * 儲存草稿
   */
  const saveDraft = useCallback(async (name?: string) => {
    if (!styleId || !templateData) {
      logger.warn('無法儲存草稿：缺少風格或範本資料')
      return
    }

    setIsSavingDraft(true)

    try {
      const now = new Date()
      const newDraft: DraftData = {
        id: draftId || `draft_${Date.now()}`,
        name: name || templateData.mainTitle || templateData.destination || `草稿 ${now.toLocaleString('zh-TW')}`,
        updated_at: now.toISOString(),
        style_id: styleId,
        template_data: templateData,
        trip_days: tripDays,
        memo_settings: memoSettings,
        hotels,
        attractions,
        country_code: selectedCountryCode,
        edited_elements: editedElements,
      }

      const drafts = getDrafts()
      const existingIndex = drafts.findIndex(d => d.id === newDraft.id)

      if (existingIndex >= 0) {
        // 更新現有草稿
        drafts[existingIndex] = newDraft
      } else {
        // 新增草稿（限制數量）
        drafts.unshift(newDraft)
        if (drafts.length > MAX_DRAFTS) {
          drafts.pop()
        }
      }

      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts))
      setDraftId(newDraft.id)
      setLastSavedAt(now)

      logger.log('草稿已儲存:', newDraft.id)
    } catch (error) {
      logger.error('儲存草稿失敗:', error)
    } finally {
      setIsSavingDraft(false)
    }
  }, [
    styleId,
    templateData,
    tripDays,
    memoSettings,
    hotels,
    attractions,
    selectedCountryCode,
    editedElements,
    draftId,
    getDrafts,
    setDraftId,
    setIsSavingDraft,
    setLastSavedAt,
  ])

  /**
   * 載入草稿
   */
  const loadDraft = useCallback((draft: DraftData): {
    templateData: TemplateData
    tripDays: number
    memoSettings: MemoSettings | null
    hotels: HotelData[]
    attractions: AttractionData[]
    countryCode: CountryCode
    editedElements: Record<string, CanvasElement>
    styleId: string
  } => {
    setDraftId(draft.id)
    setIsLoadedFromDraft(true)

    return {
      templateData: draft.template_data,
      tripDays: draft.trip_days,
      memoSettings: draft.memo_settings,
      hotels: draft.hotels,
      attractions: draft.attractions,
      countryCode: draft.country_code,
      editedElements: draft.edited_elements,
      styleId: draft.style_id,
    }
  }, [setDraftId, setIsLoadedFromDraft])

  /**
   * 刪除草稿
   */
  const deleteDraft = useCallback((id: string) => {
    try {
      const drafts = getDrafts().filter(d => d.id !== id)
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts))

      if (draftId === id) {
        setDraftId(null)
      }

      logger.log('草稿已刪除:', id)
    } catch (error) {
      logger.error('刪除草稿失敗:', error)
    }
  }, [getDrafts, draftId, setDraftId])

  /**
   * 清除所有草稿
   */
  const clearAllDrafts = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      setDraftId(null)
      logger.log('所有草稿已清除')
    } catch (error) {
      logger.error('清除草稿失敗:', error)
    }
  }, [setDraftId])

  return {
    getDraftKey,
    getDrafts,
    saveDraft,
    loadDraft,
    deleteDraft,
    clearAllDrafts,
  }
}

export type UseDraftManagementReturn = ReturnType<typeof useDraftManagement>
