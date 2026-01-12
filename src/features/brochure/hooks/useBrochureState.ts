/**
 * useBrochureState - 手冊編輯器核心狀態管理
 *
 * 整合所有狀態，提供統一的狀態管理介面
 * 從 brochure/page.tsx 4481 行中拆分出來
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import type { CanvasPage, CanvasElement } from '@/features/designer/components/types'
import type { TemplateData, MemoSettings, HotelData, AttractionData, CountryCode } from '@/features/designer/templates/definitions/types'
import type { PageType, BrochureDraft, BrochureState } from '../types'

/**
 * 初始狀態
 */
const initialState: BrochureState = {
  // 風格與頁面
  selectedStyleId: null,
  currentPageType: 'cover',
  templateData: null,
  pages: {},

  // 元素編輯
  selectedElementId: null,
  editedElements: {},

  // UI 狀態
  showPositionEditor: false,
  isLoading: false,
  isUploading: false,
  expandedDays: [],
  tripDays: 5,
  showPrintPreview: false,
  printImages: [],
  isGeneratingPrint: false,
  showPageDrawer: false,

  // 備忘錄
  memoSettings: null,
  selectedCountryCode: 'JP',

  // 飯店與景點
  hotels: [],
  attractions: [],
  uploadingHotelIndex: null,
  uploadingAttractionIndex: null,
  uploadingDayIndex: null,

  // 草稿
  isSavingDraft: false,
  lastSavedAt: null,
  draftId: null,
  isLoadedFromDraft: false,
  pendingDraft: null,

  // 歷史
  templateDataHistory: [],

  // 拖拉
  draggingTimelineItem: null,
}

/**
 * 手冊編輯器核心狀態 Hook
 */
export function useBrochureState() {
  // ==================== 風格與頁面狀態 ====================
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(initialState.selectedStyleId)
  const [currentPageType, setCurrentPageType] = useState<PageType>(initialState.currentPageType)
  const [templateData, setTemplateData] = useState<TemplateData | null>(initialState.templateData)
  const [pages, setPages] = useState<Record<string, CanvasPage | null>>(initialState.pages)

  // ==================== 元素編輯狀態 ====================
  const [selectedElementId, setSelectedElementId] = useState<string | null>(initialState.selectedElementId)
  const [editedElements, setEditedElements] = useState<Record<string, CanvasElement>>(initialState.editedElements)

  // ==================== UI 狀態 ====================
  const [showPositionEditor, setShowPositionEditor] = useState(initialState.showPositionEditor)
  const [isLoading, setIsLoading] = useState(initialState.isLoading)
  const [isUploading, setIsUploading] = useState(initialState.isUploading)
  const [expandedDays, setExpandedDays] = useState<number[]>(initialState.expandedDays)
  const [tripDays, setTripDays] = useState(initialState.tripDays)
  const [showPrintPreview, setShowPrintPreview] = useState(initialState.showPrintPreview)
  const [printImages, setPrintImages] = useState<string[]>(initialState.printImages)
  const [isGeneratingPrint, setIsGeneratingPrint] = useState(initialState.isGeneratingPrint)
  const [showPageDrawer, setShowPageDrawer] = useState(initialState.showPageDrawer)

  // ==================== 備忘錄狀態 ====================
  const [memoSettings, setMemoSettings] = useState<MemoSettings | null>(initialState.memoSettings)
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(initialState.selectedCountryCode)

  // ==================== 飯店與景點狀態 ====================
  const [hotels, setHotels] = useState<HotelData[]>(initialState.hotels)
  const [attractions, setAttractions] = useState<AttractionData[]>(initialState.attractions)
  const [uploadingHotelIndex, setUploadingHotelIndex] = useState<number | null>(initialState.uploadingHotelIndex)
  const [uploadingAttractionIndex, setUploadingAttractionIndex] = useState<number | null>(initialState.uploadingAttractionIndex)
  const [uploadingDayIndex, setUploadingDayIndex] = useState<number | null>(initialState.uploadingDayIndex)

  // ==================== 草稿狀態 ====================
  const [isSavingDraft, setIsSavingDraft] = useState(initialState.isSavingDraft)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(initialState.lastSavedAt)
  const [draftId, setDraftId] = useState<string | null>(initialState.draftId)
  const [isLoadedFromDraft, setIsLoadedFromDraft] = useState(initialState.isLoadedFromDraft)
  const [pendingDraft, setPendingDraft] = useState<BrochureDraft | null>(initialState.pendingDraft)

  // ==================== 歷史狀態 ====================
  const [templateDataHistory, setTemplateDataHistory] = useState<TemplateData[]>(initialState.templateDataHistory)

  // ==================== 拖拉狀態 ====================
  const [draggingTimelineItem, setDraggingTimelineItem] = useState<{ dayIndex: number; itemIndex: number } | null>(initialState.draggingTimelineItem)

  // ==================== Refs ====================
  const templateDataRef = useRef<TemplateData | null>(null)
  const hasAutoSelectedStyle = useRef(false)

  // ==================== 當前頁面 ====================
  const page = pages[currentPageType] ?? null

  // ==================== 切換頁面 ====================
  const switchPage = useCallback((pageType: PageType) => {
    setCurrentPageType(pageType)
    setSelectedElementId(null) // 切換頁面時清除選取
  }, [])

  // ==================== 展開/收合天數 ====================
  const toggleDayExpanded = useCallback((dayIndex: number) => {
    setExpandedDays(prev =>
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    )
  }, [])

  // ==================== 重置狀態 ====================
  const resetState = useCallback(() => {
    setSelectedStyleId(initialState.selectedStyleId)
    setCurrentPageType(initialState.currentPageType)
    setTemplateData(initialState.templateData)
    setPages(initialState.pages)
    setSelectedElementId(initialState.selectedElementId)
    setEditedElements(initialState.editedElements)
    setHotels(initialState.hotels)
    setAttractions(initialState.attractions)
    setMemoSettings(initialState.memoSettings)
    setDraftId(initialState.draftId)
    setIsLoadedFromDraft(initialState.isLoadedFromDraft)
    setTemplateDataHistory(initialState.templateDataHistory)
    hasAutoSelectedStyle.current = false
  }, [])

  return {
    // 風格與頁面
    selectedStyleId,
    setSelectedStyleId,
    currentPageType,
    setCurrentPageType,
    templateData,
    setTemplateData,
    pages,
    setPages,
    page,

    // 元素編輯
    selectedElementId,
    setSelectedElementId,
    editedElements,
    setEditedElements,

    // UI 狀態
    showPositionEditor,
    setShowPositionEditor,
    isLoading,
    setIsLoading,
    isUploading,
    setIsUploading,
    expandedDays,
    setExpandedDays,
    tripDays,
    setTripDays,
    showPrintPreview,
    setShowPrintPreview,
    printImages,
    setPrintImages,
    isGeneratingPrint,
    setIsGeneratingPrint,
    showPageDrawer,
    setShowPageDrawer,

    // 備忘錄
    memoSettings,
    setMemoSettings,
    selectedCountryCode,
    setSelectedCountryCode,

    // 飯店與景點
    hotels,
    setHotels,
    attractions,
    setAttractions,
    uploadingHotelIndex,
    setUploadingHotelIndex,
    uploadingAttractionIndex,
    setUploadingAttractionIndex,
    uploadingDayIndex,
    setUploadingDayIndex,

    // 草稿
    isSavingDraft,
    setIsSavingDraft,
    lastSavedAt,
    setLastSavedAt,
    draftId,
    setDraftId,
    isLoadedFromDraft,
    setIsLoadedFromDraft,
    pendingDraft,
    setPendingDraft,

    // 歷史
    templateDataHistory,
    setTemplateDataHistory,

    // 拖拉
    draggingTimelineItem,
    setDraggingTimelineItem,

    // Refs
    templateDataRef,
    hasAutoSelectedStyle,

    // 操作
    switchPage,
    toggleDayExpanded,
    resetState,
  }
}

export type UseBrochureStateReturn = ReturnType<typeof useBrochureState>
