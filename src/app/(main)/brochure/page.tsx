'use client'

import React, { useState, useCallback, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Text,
  Square,
  Circle,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Loader2,
  GripVertical,
  Undo2,
} from 'lucide-react'
import { useCanvasEditor } from '@/features/designer/hooks/useCanvasEditor'
import { generatePageFromTemplate, itineraryToTemplateData, proposalToTemplateData, timelineToTemplateData, styleSeries } from '@/features/designer/templates/engine'
import { StaticCanvas } from 'fabric'
import { renderPageOnCanvas } from '@/features/designer/components/core/renderer'
import { createPortal } from 'react-dom'
import type { TemplateData, DailyItinerary, MealIconType, DailyDetailData, TimelineItem, MemoSettings, MemoItem, CountryCode, HotelData, AttractionData } from '@/features/designer/templates/definitions/types'
import { getMemoSettingsByCountry, calculateMemoPageCount, getMemoItemsForPage, countryNames } from '@/features/designer/templates/engine'
import { useItineraries, useProposals, useProposalPackages } from '@/hooks/cloud-hooks'
import type { TimelineItineraryData } from '@/types/timeline-itinerary.types'
import type { CanvasPage, CanvasElement } from '@/features/designer/components/types'
import { BookOpen, FileImage, ChevronDown, ChevronUp, Plus, Minus, ClipboardList, Check, Globe, Hotel, PanelLeft, X, Home, List, Calendar, FileText, Layers, Image, Type, Palette, Settings, Clock, Utensils, MapPin, Info, Plane, Cloud, Sun } from 'lucide-react'
import { CollapsiblePanel } from '@/components/designer'
import { ImageAdjustmentsPanel } from '@/features/designer/components/ImageAdjustmentsPanel'
import type { ImageAdjustments } from '@/features/designer/components/types'
import { DEFAULT_IMAGE_ADJUSTMENTS } from '@/features/designer/components/types'

// 頁面類型：cover, toc, itinerary, daily-0, daily-1..., memo-0, memo-1..., hotel-0, hotel-1..., 或 attraction-0, attraction-1...
type PageType = 'cover' | 'toc' | 'itinerary' | `daily-${number}` | `memo-${number}` | `hotel-${number}` | `attraction-${number}`

// 判斷是否為每日行程頁面
function isDailyPage(pageType: PageType): boolean {
  return pageType.startsWith('daily-')
}

// 判斷是否為備忘錄頁面
function isMemoPage(pageType: PageType): boolean {
  return pageType.startsWith('memo-')
}

// 判斷是否為飯店介紹頁面
function isHotelPage(pageType: PageType): boolean {
  return pageType.startsWith('hotel-')
}

// 從 pageType 取得天數索引
function getDayIndex(pageType: PageType): number {
  if (!isDailyPage(pageType)) return -1
  return parseInt(pageType.replace('daily-', ''), 10)
}

// 從 pageType 取得備忘錄頁面索引
function getMemoPageIndex(pageType: PageType): number {
  if (!isMemoPage(pageType)) return -1
  return parseInt(pageType.replace('memo-', ''), 10)
}

// 從 pageType 取得飯店索引
function getHotelIndex(pageType: PageType): number {
  if (!isHotelPage(pageType)) return -1
  return parseInt(pageType.replace('hotel-', ''), 10)
}

// 判斷是否為景點介紹頁面
function isAttractionPage(pageType: PageType): boolean {
  return pageType.startsWith('attraction-')
}

// 從 pageType 取得景點頁索引
function getAttractionPageIndex(pageType: PageType): number {
  if (!isAttractionPage(pageType)) return -1
  return parseInt(pageType.replace('attraction-', ''), 10)
}

// 餐食圖標選項
const MEAL_ICON_OPTIONS: Array<{ value: MealIconType; label: string }> = [
  { value: 'bakery_dining', label: '🥐 麵包' },
  { value: 'coffee', label: '☕ 咖啡' },
  { value: 'restaurant', label: '🍽️ 餐廳' },
  { value: 'ramen_dining', label: '🍜 拉麵' },
  { value: 'bento', label: '🍱 便當' },
  { value: 'rice_bowl', label: '🍚 飯' },
  { value: 'soup_kitchen', label: '🍲 湯' },
  { value: 'skillet', label: '🍳 鍋' },
  { value: 'dinner_dining', label: '🍖 晚餐' },
  { value: 'flight_class', label: '✈️ 機上' },
]
import { cn } from '@/lib/utils'
import { logger } from '@/lib/utils/logger'
import { supabase } from '@/lib/supabase/client'
import { ImagePositionEditor, type ImagePositionSettings } from '@/components/ui/image-position-editor'
import { Move } from 'lucide-react'
import type { Json } from '@/lib/supabase/types'
import { useAuthStore } from '@/stores/auth-store'
import { alert } from '@/lib/ui/alert-dialog'

function DesignerPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tourId = searchParams.get('tour_id')
  const proposalId = searchParams.get('proposal_id')
  const itineraryId = searchParams.get('itinerary_id')
  const packageId = searchParams.get('package_id') // 時間軸行程表用

  // 使用者資訊
  const { user } = useAuthStore()
  const workspaceId = user?.workspace_id
  const userId = user?.id

  // 頁面狀態
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null) // 選擇的風格系列
  const [currentPageType, setCurrentPageType] = useState<PageType>('cover') // 當前頁面類型
  const [templateData, setTemplateData] = useState<TemplateData | null>(null) // 範本資料（共用）
  const [pages, setPages] = useState<Record<string, CanvasPage | null>>({
    cover: null,
    itinerary: null,
  }) // 每種頁面類型的 Canvas 資料（包含 daily-0, daily-1...）
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [showPositionEditor, setShowPositionEditor] = useState(false) // 圖片位置編輯器
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [expandedDays, setExpandedDays] = useState<number[]>([0]) // 預設展開第一天
  const [tripDays, setTripDays] = useState(3) // 旅程天數（預設 3 天）
  const [showPrintPreview, setShowPrintPreview] = useState(false) // 列印預覽
  const [printImages, setPrintImages] = useState<string[]>([]) // 列印用的頁面圖片
  const [isGeneratingPrint, setIsGeneratingPrint] = useState(false) // 正在生成列印圖片
  // 備忘錄相關
  const [memoSettings, setMemoSettings] = useState<MemoSettings | null>(null) // 備忘錄設定
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>('JP') // 預設國家
  // 飯店介紹相關
  const [hotels, setHotels] = useState<HotelData[]>([]) // 飯店列表
  const hotelCoverInputRef = useRef<HTMLInputElement>(null) // 飯店圖片上傳
  const [uploadingHotelIndex, setUploadingHotelIndex] = useState<number | null>(null)
  // 景點介紹相關
  const [attractions, setAttractions] = useState<AttractionData[]>([]) // 景點列表
  const attractionImageInputRef = useRef<HTMLInputElement>(null) // 景點圖片上傳
  const [uploadingAttractionIndex, setUploadingAttractionIndex] = useState<number | null>(null)
  const uploadingAttractionIndexRef = useRef<number | null>(null) // 用於同步傳遞 index（避免 state race condition）
  // 頁面導航抽屜
  const [showPageDrawer, setShowPageDrawer] = useState(false)
  // 儲存草稿狀態
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null) // Supabase 草稿 ID
  const [isLoadedFromDraft, setIsLoadedFromDraft] = useState(false) // 是否從草稿載入（防止被行程表資料覆蓋）
  const [pendingDraft, setPendingDraft] = useState<{
    id: string
    name: string
    updated_at: string
    style_id: string
    template_data: Json
    trip_days: number
    memo_settings: Json
    hotels: Json
    attractions: Json
    country_code: string | null
    edited_elements: Json
  } | null>(null) // 發現的草稿（等待用戶選擇是否載入）
  // 手動編輯的元素（格式: { "pageType:elementId": elementData }）
  const [editedElements, setEditedElements] = useState<Record<string, CanvasElement>>({})

  // 取得當前頁面
  const page = pages[currentPageType]

  // 封面圖片上傳
  const coverInputRef = useRef<HTMLInputElement>(null)
  // 每日行程封面上傳
  const dailyCoverInputRef = useRef<HTMLInputElement>(null)
  const [uploadingDayIndex, setUploadingDayIndex] = useState<number | null>(null)

  // 時間軸拖拉排序
  const [draggingTimelineItem, setDraggingTimelineItem] = useState<{ dayIndex: number; itemIndex: number } | null>(null)

  // 復原功能 (Undo)
  const [templateDataHistory, setTemplateDataHistory] = useState<TemplateData[]>([])
  const maxHistoryLength = 20 // 最多保留 20 步歷史

  // 取得行程表資料（如果有指定 itinerary_id）
  const { items: itineraries } = useItineraries()
  // 取得提案資料（如果有指定 proposal_id）
  const { items: proposals } = useProposals()
  const { items: proposalPackages } = useProposalPackages()

  // 輔助函式：從出發日期計算每天的日期
  const calculateDailyDates = useCallback((departureDate: string | undefined, days: number): string[] => {
    if (!departureDate) return Array(days).fill('')

    try {
      const startDate = new Date(departureDate)
      if (isNaN(startDate.getTime())) return Array(days).fill('')

      return Array.from({ length: days }, (_, i) => {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i)
        return date.toISOString().split('T')[0] // YYYY-MM-DD 格式
      })
    } catch {
      return Array(days).fill('')
    }
  }, [])

  // 輔助函式：套用手動編輯的元素到生成的頁面
  const applyEditedElements = useCallback((pageType: string, generatedPage: CanvasPage | null): CanvasPage | null => {
    if (!generatedPage) return null

    // 找出該頁面類型所有被編輯過的元素
    const editedForThisPage = Object.entries(editedElements)
      .filter(([key]) => key.startsWith(`${pageType}:`))
      .map(([key, element]) => ({ elementId: key.split(':')[1], element }))

    if (editedForThisPage.length === 0) return generatedPage

    // 套用編輯過的元素（替換或保留位置/樣式等屬性）
    const updatedElements = generatedPage.elements.map((el) => {
      const edited = editedForThisPage.find((e) => e.elementId === el.id)
      if (edited) {
        // 保留編輯過的元素（完整替換）
        return edited.element
      }
      return el
    })

    return { ...generatedPage, elements: updatedElements }
  }, [editedElements])

  // 當選擇風格後，生成所有頁面
  const handleSelectStyle = useCallback((styleId: string) => {
    const style = styleSeries.find((s) => s.id === styleId)
    if (!style) return

    setSelectedStyleId(styleId)
    setIsLoading(true)

    // 取得出發日期（優先順序：套件 > 行程表 > 提案）
    let departureDate: string | undefined

    // 檢查是否使用 package_id（時間軸行程表）
    const targetPackage = packageId ? proposalPackages.find((pkg) => pkg.id === packageId) : null
    if (targetPackage?.start_date) {
      departureDate = targetPackage.start_date
    }

    if (!departureDate && itineraryId && itineraries.length > 0) {
      const itinerary = itineraries.find((i) => i.id === itineraryId)
      departureDate = itinerary?.departure_date || undefined
    }

    if (!departureDate && proposalId && proposals.length > 0) {
      const proposal = proposals.find((p) => p.id === proposalId)
      const packages = proposalPackages.filter((pkg) => pkg.proposal_id === proposalId)
      const latestPackage = packages.sort((a, b) => (b.version_number || 0) - (a.version_number || 0))[0]
      departureDate = latestPackage?.start_date || proposal?.expected_start_date || undefined
    }

    // 計算每天的日期
    const dailyDates = calculateDailyDates(departureDate, tripDays)

    // 預設範本資料（空值為主，讓使用者自行填入）
    let data: TemplateData = {
      coverImage: undefined,
      destination: '',
      mainTitle: '',
      travelDates: '',
      companyName: 'Corner Travel',
      // 初始化每日詳細資料（含計算後的日期）
      dailyDetails: Array.from({ length: tripDays }, (_, i) => ({
        dayNumber: i + 1,
        date: dailyDates[i] || '',
        title: '',
        coverImage: undefined,
        timeline: [],
        meals: { breakfast: '', lunch: '', dinner: '' },
      })),
    }

    // 如果有指定套件 package_id 且有時間軸資料，使用時間軸行程表
    if (packageId && targetPackage?.itinerary_type === 'timeline' && targetPackage?.timeline_data) {
      const timelineData = targetPackage.timeline_data as TimelineItineraryData
      const templateDataFromTimeline = timelineToTemplateData(timelineData)
      data = { ...data, ...templateDataFromTimeline }

      // 從時間軸資料更新 tripDays
      if (templateDataFromTimeline.dailyDetails && templateDataFromTimeline.dailyDetails.length > 0) {
        setTripDays(templateDataFromTimeline.dailyDetails.length)
      }

      // 重新計算日期（確保每天都有日期）
      if (data.dailyDetails) {
        const newDailyDates = calculateDailyDates(targetPackage.start_date || timelineData.startDate || undefined, data.dailyDetails.length)
        data.dailyDetails = data.dailyDetails.map((day, i) => ({
          ...day,
          date: day.date || newDailyDates[i] || '',
        }))
      }
    }
    // 如果有指定套件 package_id 但不是時間軸類型（simple 類型），使用套件的 days 欄位
    else if (packageId && targetPackage) {
      // 計算旅程天數（優先順序：套件天數 > 套件日期計算）
      let packageTripDays = tripDays
      if (targetPackage.days && targetPackage.days > 0) {
        packageTripDays = targetPackage.days
      } else if (targetPackage.start_date && targetPackage.end_date) {
        const start = new Date(targetPackage.start_date)
        const end = new Date(targetPackage.end_date)
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        if (diffDays > 0) packageTripDays = diffDays
      }

      // 更新天數
      if (packageTripDays !== tripDays) {
        setTripDays(packageTripDays)
        // 重新初始化每日詳細資料
        const newDailyDates = calculateDailyDates(targetPackage.start_date || undefined, packageTripDays)
        data.dailyDetails = Array.from({ length: packageTripDays }, (_, i) => ({
          dayNumber: i + 1,
          date: newDailyDates[i] || '',
          title: '',
          coverImage: undefined,
          timeline: [],
          meals: { breakfast: '', lunch: '', dinner: '' },
        }))
      }

      // 從套件的關聯提案取得基本資訊
      if (targetPackage.proposal_id && proposals.length > 0) {
        const proposal = proposals.find((p) => p.id === targetPackage.proposal_id)
        if (proposal) {
          const proposalData = proposalToTemplateData({
            title: proposal.title,
            code: proposal.code,
            destination: proposal.destination,
            expected_start_date: proposal.expected_start_date,
            expected_end_date: proposal.expected_end_date,
            customer_name: proposal.customer_name,
            group_size: proposal.group_size,
            package: {
              version_name: targetPackage.version_name,
              start_date: targetPackage.start_date,
              end_date: targetPackage.end_date,
              days: targetPackage.days,
            },
          })
          data = { ...data, ...proposalData }
        }
      }
    }
    // 如果有指定行程表，使用該行程表的資料
    else if (itineraryId && itineraries.length > 0) {
      const itinerary = itineraries.find((i) => i.id === itineraryId)
      if (itinerary) {
        const itineraryData = itineraryToTemplateData(itinerary)
        data = { ...data, ...itineraryData }

        // 從行程表資料更新 tripDays
        if (itineraryData.dailyDetails && itineraryData.dailyDetails.length > 0) {
          setTripDays(itineraryData.dailyDetails.length)
        }

        // 重新計算日期（確保每天都有日期）
        if (data.dailyDetails) {
          const newDailyDates = calculateDailyDates(itinerary.departure_date || undefined, data.dailyDetails.length)
          data.dailyDetails = data.dailyDetails.map((day, i) => ({
            ...day,
            date: day.date || newDailyDates[i] || '',
          }))
        }
      }
    }

    // 如果有指定提案，使用該提案的資料
    if (proposalId && proposals.length > 0) {
      const proposal = proposals.find((p) => p.id === proposalId)
      if (proposal) {
        // 找到該提案的套件（使用最新版本）
        const packages = proposalPackages.filter((pkg) => pkg.proposal_id === proposalId)
        const latestPackage = packages.sort((a, b) => (b.version_number || 0) - (a.version_number || 0))[0]

        // 計算旅程天數（優先順序：套件天數 > 套件日期計算 > 提案日期計算）
        let proposalTripDays = tripDays
        if (latestPackage?.days && latestPackage.days > 0) {
          // 直接使用套件定義的天數
          proposalTripDays = latestPackage.days
        } else if (latestPackage?.start_date && latestPackage?.end_date) {
          // 從套件日期計算
          const start = new Date(latestPackage.start_date)
          const end = new Date(latestPackage.end_date)
          const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
          if (diffDays > 0) proposalTripDays = diffDays
        } else if (proposal.expected_start_date && proposal.expected_end_date) {
          // 從提案預期日期計算
          const start = new Date(proposal.expected_start_date)
          const end = new Date(proposal.expected_end_date)
          const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
          if (diffDays > 0) proposalTripDays = diffDays
        }

        // 更新天數（如果有從提案計算出）
        if (proposalTripDays !== tripDays) {
          setTripDays(proposalTripDays)
          // 重新初始化每日詳細資料
          const newDailyDates = calculateDailyDates(
            latestPackage?.start_date || proposal.expected_start_date || undefined,
            proposalTripDays
          )
          data.dailyDetails = Array.from({ length: proposalTripDays }, (_, i) => ({
            dayNumber: i + 1,
            date: newDailyDates[i] || '',
            title: '',
            coverImage: undefined,
            timeline: [],
            meals: { breakfast: '', lunch: '', dinner: '' },
          }))
        }

        const proposalData = proposalToTemplateData({
          title: proposal.title,
          code: proposal.code,
          destination: proposal.destination,
          expected_start_date: proposal.expected_start_date,
          expected_end_date: proposal.expected_end_date,
          customer_name: proposal.customer_name,
          group_size: proposal.group_size,
          package: latestPackage ? {
            version_name: latestPackage.version_name,
            start_date: latestPackage.start_date,
            end_date: latestPackage.end_date,
            days: latestPackage.days,
          } : undefined,
        })
        data = { ...data, ...proposalData }
        // 重新計算日期
        if (data.dailyDetails) {
          const finalDates = calculateDailyDates(
            latestPackage?.start_date || proposal.expected_start_date || undefined,
            data.dailyDetails.length
          )
          data.dailyDetails = data.dailyDetails.map((day, i) => ({
            ...day,
            date: day.date || finalDates[i] || '',
          }))
        }
      }
    }

    // 儲存範本資料
    setTemplateData(data)

    // 計算實際要生成的天數（使用 dailyDetails 的長度，因為已根據提案/行程更新）
    const actualTripDays = data.dailyDetails?.length || tripDays

    // 生成所有頁面
    const newPages: Record<string, CanvasPage | null> = {
      cover: generatePageFromTemplate(style.templates.cover, data),
      toc: generatePageFromTemplate(style.templates.toc, data),
      itinerary: generatePageFromTemplate(style.templates.itinerary, data),
    }

    // 生成每日行程頁面
    for (let i = 0; i < actualTripDays; i++) {
      const dailyData = { ...data, currentDayIndex: i }
      newPages[`daily-${i}`] = generatePageFromTemplate(style.templates.daily, dailyData)
    }

    setPages(newPages)
    setCurrentPageType('cover')
    setIsLoading(false)
  }, [itineraryId, itineraries, proposalId, proposals, proposalPackages, tripDays, calculateDailyDates, packageId])

  // 當資料載入後，自動更新已選擇的範本（修復資料載入時機問題）
  // 注意：如果是從草稿載入，跳過此邏輯以保留草稿資料
  useEffect(() => {
    // 如果從草稿載入，跳過從行程表重新生成頁面
    if (isLoadedFromDraft) return

    // 如果已選擇風格且有指定套件（時間軸行程表）
    if (selectedStyleId && packageId && proposalPackages.length > 0) {
      const pkg = proposalPackages.find((p) => p.id === packageId)
      if (pkg?.itinerary_type === 'timeline' && pkg?.timeline_data && templateData) {
        const style = styleSeries.find((s) => s.id === selectedStyleId)
        if (style) {
          const timelineData = pkg.timeline_data as TimelineItineraryData
          const itineraryData = timelineToTemplateData(timelineData)

          // 從時間軸資料更新 tripDays
          const itineraryDays = itineraryData.dailyDetails?.length || tripDays
          if (itineraryDays !== tripDays) {
            setTripDays(itineraryDays)
          }

          // 計算每天日期
          const dailyDates = calculateDailyDates(pkg.start_date || timelineData.startDate || undefined, itineraryDays)

          const newData = { ...templateData, ...itineraryData }
          // 確保 dailyDetails 有正確的日期
          if (newData.dailyDetails) {
            newData.dailyDetails = newData.dailyDetails.map((day, i) => ({
              ...day,
              date: day.date || dailyDates[i] || '',
            }))
          } else {
            newData.dailyDetails = Array.from({ length: itineraryDays }, (_, i) => ({
              dayNumber: i + 1,
              date: dailyDates[i] || '',
              title: '',
              coverImage: undefined,
              timeline: [],
              meals: { breakfast: '', lunch: '', dinner: '' },
            }))
          }
          setTemplateData(newData)

          const pageDays = Math.max(tripDays, itineraryDays)
          const newPages: Record<string, CanvasPage | null> = {
            cover: generatePageFromTemplate(style.templates.cover, newData),
            toc: generatePageFromTemplate(style.templates.toc, newData),
            itinerary: generatePageFromTemplate(style.templates.itinerary, newData),
          }
          for (let i = 0; i < pageDays; i++) {
            const dailyData = { ...newData, currentDayIndex: i }
            newPages[`daily-${i}`] = generatePageFromTemplate(style.templates.daily, dailyData)
          }
          setPages(newPages)
          return // 已處理，不需繼續
        }
      }
    }

    // 如果已選擇風格且有指定行程表，當行程表資料載入後重新生成頁面
    if (selectedStyleId && itineraryId && itineraries.length > 0) {
      const itinerary = itineraries.find((i) => i.id === itineraryId)
      if (itinerary && templateData) {
        const style = styleSeries.find((s) => s.id === selectedStyleId)
        if (style) {
          const itineraryData = itineraryToTemplateData(itinerary)

          // 從行程表資料更新 tripDays
          const itineraryDays = itineraryData.dailyDetails?.length || tripDays
          if (itineraryDays !== tripDays) {
            setTripDays(itineraryDays)
          }

          // 計算每天日期
          const dailyDates = calculateDailyDates(itinerary.departure_date || undefined, itineraryDays)

          const newData = { ...templateData, ...itineraryData }
          // 確保 dailyDetails 有正確的日期
          if (newData.dailyDetails) {
            newData.dailyDetails = newData.dailyDetails.map((day, i) => ({
              ...day,
              date: day.date || dailyDates[i] || '',
            }))
          } else {
            newData.dailyDetails = Array.from({ length: itineraryDays }, (_, i) => ({
              dayNumber: i + 1,
              date: dailyDates[i] || '',
              title: '',
              coverImage: undefined,
              timeline: [],
              meals: { breakfast: '', lunch: '', dinner: '' },
            }))
          }
          setTemplateData(newData)

          const pageDays = Math.max(tripDays, itineraryDays)
          const newPages: Record<string, CanvasPage | null> = {
            cover: generatePageFromTemplate(style.templates.cover, newData),
            toc: generatePageFromTemplate(style.templates.toc, newData),
            itinerary: generatePageFromTemplate(style.templates.itinerary, newData),
          }
          for (let i = 0; i < pageDays; i++) {
            const dailyData = { ...newData, currentDayIndex: i }
            newPages[`daily-${i}`] = generatePageFromTemplate(style.templates.daily, dailyData)
          }
          setPages(newPages)
          return // 已處理
        }
      }
    }

    // 如果已選擇風格且有指定套件（simple 類型），當套件資料載入後重新生成頁面
    if (selectedStyleId && packageId && proposalPackages.length > 0 && templateData) {
      const pkg = proposalPackages.find((p) => p.id === packageId)
      // 只處理非 timeline 類型（timeline 已在上面處理）
      if (pkg && pkg.itinerary_type !== 'timeline') {
        const style = styleSeries.find((s) => s.id === selectedStyleId)
        if (style) {
          // 計算天數
          let packageDays = tripDays
          if (pkg.days && pkg.days > 0) {
            packageDays = pkg.days
          } else if (pkg.start_date && pkg.end_date) {
            const start = new Date(pkg.start_date)
            const end = new Date(pkg.end_date)
            const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
            if (diffDays > 0) packageDays = diffDays
          }

          // 如果天數不同，更新
          if (packageDays !== tripDays) {
            setTripDays(packageDays)

            const dailyDates = calculateDailyDates(pkg.start_date || undefined, packageDays)
            const newData = {
              ...templateData,
              dailyDetails: Array.from({ length: packageDays }, (_, i) => ({
                dayNumber: i + 1,
                date: dailyDates[i] || '',
                title: '',
                coverImage: undefined,
                timeline: [],
                meals: { breakfast: '', lunch: '', dinner: '' },
              })),
            }
            setTemplateData(newData)

            const newPages: Record<string, CanvasPage | null> = {
              cover: generatePageFromTemplate(style.templates.cover, newData),
              toc: generatePageFromTemplate(style.templates.toc, newData),
              itinerary: generatePageFromTemplate(style.templates.itinerary, newData),
            }
            for (let i = 0; i < packageDays; i++) {
              const dailyData = { ...newData, currentDayIndex: i }
              newPages[`daily-${i}`] = generatePageFromTemplate(style.templates.daily, dailyData)
            }
            setPages(newPages)
            return // 已處理
          }
        }
      }
    }

    // 如果已選擇風格且有指定提案，當提案套件資料載入後重新生成頁面
    if (selectedStyleId && proposalId && proposals.length > 0 && proposalPackages.length > 0 && templateData) {
      const proposal = proposals.find((p) => p.id === proposalId)
      if (proposal) {
        const packages = proposalPackages.filter((pkg) => pkg.proposal_id === proposalId)
        const latestPackage = packages.sort((a, b) => (b.version_number || 0) - (a.version_number || 0))[0]

        if (latestPackage) {
          const style = styleSeries.find((s) => s.id === selectedStyleId)
          if (style) {
            // 計算天數
            let proposalDays = tripDays
            if (latestPackage.days && latestPackage.days > 0) {
              proposalDays = latestPackage.days
            } else if (latestPackage.start_date && latestPackage.end_date) {
              const start = new Date(latestPackage.start_date)
              const end = new Date(latestPackage.end_date)
              const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
              if (diffDays > 0) proposalDays = diffDays
            }

            // 如果天數不同，更新
            if (proposalDays !== tripDays) {
              setTripDays(proposalDays)

              const dailyDates = calculateDailyDates(latestPackage.start_date || proposal.expected_start_date || undefined, proposalDays)
              const newData = {
                ...templateData,
                dailyDetails: Array.from({ length: proposalDays }, (_, i) => ({
                  dayNumber: i + 1,
                  date: dailyDates[i] || '',
                  title: '',
                  coverImage: undefined,
                  timeline: [],
                  meals: { breakfast: '', lunch: '', dinner: '' },
                })),
              }
              setTemplateData(newData)

              const newPages: Record<string, CanvasPage | null> = {
                cover: generatePageFromTemplate(style.templates.cover, newData),
                toc: generatePageFromTemplate(style.templates.toc, newData),
                itinerary: generatePageFromTemplate(style.templates.itinerary, newData),
              }
              for (let i = 0; i < proposalDays; i++) {
                const dailyData = { ...newData, currentDayIndex: i }
                newPages[`daily-${i}`] = generatePageFromTemplate(style.templates.daily, dailyData)
              }
              setPages(newPages)
            }
          }
        }
      }
    }
  }, [selectedStyleId, itineraryId, itineraries, tripDays, calculateDailyDates, isLoadedFromDraft, packageId, proposalPackages, proposalId, proposals, templateData])

  // 當天數變更時，重新生成每日行程頁面
  useEffect(() => {
    if (!selectedStyleId || !templateData) return

    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (!style) return

    // 確保 dailyDetails 有足夠的項目
    const currentDetails = templateData.dailyDetails || []
    let newDetails = [...currentDetails]

    // 計算第一天的日期（如果有的話），用於推算新增天數的日期
    const firstDayDate = currentDetails[0]?.date || ''
    const baseDates = calculateDailyDates(firstDayDate, tripDays)

    // 如果天數增加，補充空項目（並計算日期）
    while (newDetails.length < tripDays) {
      const newIndex = newDetails.length
      newDetails.push({
        dayNumber: newIndex + 1,
        date: baseDates[newIndex] || '',
        title: '',
        coverImage: undefined,
        timeline: [],
        meals: { breakfast: '', lunch: '', dinner: '' },
      })
    }

    // 如果天數減少，截斷（但保留資料）
    if (newDetails.length > tripDays) {
      newDetails = newDetails.slice(0, tripDays)
    }

    // 同步更新 dailyItineraries（給總覽頁用）
    const currentItineraries = templateData.dailyItineraries || []
    let newItineraries = [...currentItineraries]
    // 如果天數增加，補充空項目
    while (newItineraries.length < tripDays) {
      const newIndex = newItineraries.length
      newItineraries.push({
        dayNumber: newIndex + 1,
        title: newDetails[newIndex]?.title || '',
        meals: newDetails[newIndex]?.meals || { breakfast: '', lunch: '', dinner: '' },
        accommodation: '',
      })
    }
    // 如果天數減少，截斷
    if (newItineraries.length > tripDays) {
      newItineraries = newItineraries.slice(0, tripDays)
    }

    const newData = { ...templateData, dailyDetails: newDetails, dailyItineraries: newItineraries }
    setTemplateData(newData)

    // 重新生成所有每日頁面和總覽頁
    setPages((prevPages) => {
      const updatedPages = { ...prevPages }
      // 重新生成總覽頁
      updatedPages.itinerary = generatePageFromTemplate(style.templates.itinerary, newData)
      // 重新生成每日頁面
      for (let i = 0; i < tripDays; i++) {
        const pageData = { ...newData, currentDayIndex: i }
        updatedPages[`daily-${i}`] = generatePageFromTemplate(style.templates.daily, pageData)
      }
      // 清除超出天數的頁面
      Object.keys(updatedPages).forEach((key) => {
        if (key.startsWith('daily-')) {
          const idx = parseInt(key.replace('daily-', ''), 10)
          if (idx >= tripDays) {
            delete updatedPages[key]
          }
        }
      })
      return updatedPages
    })

    // 如果當前在被刪除的頁面上，切回封面
    if (isDailyPage(currentPageType)) {
      const currentIdx = getDayIndex(currentPageType)
      if (currentIdx >= tripDays) {
        setCurrentPageType('cover')
      }
    }
  }, [tripDays, selectedStyleId, calculateDailyDates])  

  // 切換頁面類型
  const handleSwitchPage = useCallback((pageType: PageType) => {
    setCurrentPageType(pageType)
    setSelectedElementId(null)
  }, [])

  // 元素狀態更新
  const updateElement = useCallback((elementId: string, updates: Partial<CanvasElement>) => {
    // 使用 functional update 來避免 stale closure 問題
    setPages((prevPages) => {
      const currentPage = prevPages[currentPageType]
      if (!currentPage) return prevPages

      const element = currentPage.elements.find((el) => el.id === elementId)
      if (!element) return prevPages

      const updatedElement = { ...element, ...updates } as CanvasElement
      const updatedElements = currentPage.elements.map((el) =>
        el.id === elementId ? updatedElement : el
      )

      // 同時更新 editedElements（使用最新的元素資料）
      const key = `${currentPageType}:${elementId}`
      setEditedElements((prev) => ({ ...prev, [key]: updatedElement }))

      return { ...prevPages, [currentPageType]: { ...currentPage, elements: updatedElements } }
    })
  }, [currentPageType])

  const addElement = useCallback((newElement: CanvasElement) => {
    setPages((prevPages) => {
      const currentPage = prevPages[currentPageType]
      if (!currentPage) return prevPages
      const maxZIndex = currentPage.elements.reduce((max, el) => Math.max(max, el.zIndex), 0)
      const elementWithZIndex = { ...newElement, zIndex: maxZIndex + 1 }
      return { ...prevPages, [currentPageType]: { ...currentPage, elements: [...currentPage.elements, elementWithZIndex] } }
    })
  }, [currentPageType])

  const deleteElement = useCallback((elementId: string) => {
    // 追蹤刪除的元素（標記為 visible: false 以便重新生成時保持隱藏）
    setEditedElements((prev) => {
      const key = `${currentPageType}:${elementId}`
      const currentPage = pages[currentPageType]
      if (!currentPage) return prev
      const element = currentPage.elements.find((el) => el.id === elementId)
      if (!element) return prev
      // 標記為隱藏而非刪除，這樣重新生成時也會保持隱藏
      return { ...prev, [key]: { ...element, visible: false } as CanvasElement }
    })

    setPages((prevPages) => {
      const currentPage = prevPages[currentPageType]
      if (!currentPage) return prevPages
      return {
        ...prevPages,
        [currentPageType]: {
          ...currentPage,
          elements: currentPage.elements.filter((el) => el.id !== elementId),
        },
      }
    })
    setSelectedElementId(null)
  }, [currentPageType, pages])

  // 處理封面占位元素點擊（觸發檔案選擇）
  const handleCoverUpload = useCallback(() => {
    coverInputRef.current?.click()
  }, [])

  // 處理封面圖片檔案選擇
  const handleCoverFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !page) return

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      void alert('請選擇圖片檔案', 'warning')
      return
    }

    // 檢查檔案大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      void alert('檔案太大！請選擇小於 5MB 的圖片', 'warning')
      return
    }

    setIsUploading(true)

    try {
      // 生成唯一檔名
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `designer_cover_${timestamp}_${randomStr}.${fileExt}`

      // 上傳到 Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('city-backgrounds')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        void alert(`上傳失敗: ${uploadError.message}`, 'error')
        return
      }

      // 取得公開網址
      const { data: urlData } = supabase.storage.from('city-backgrounds').getPublicUrl(fileName)
      const imageUrl = urlData.publicUrl

      // 更新 templateData 並重新生成封面和目錄頁面
      const newData = { ...templateData, coverImage: imageUrl }
      setTemplateData(newData)

      // 重新生成封面和目錄頁面
      const style = styleSeries.find((s) => s.id === selectedStyleId)
      if (style) {
        setPages((prev) => ({
          ...prev,
          cover: generatePageFromTemplate(style.templates.cover, newData),
          toc: generatePageFromTemplate(style.templates.toc, newData),
        }))
      }
    } catch (error) {
      void alert('圖片上傳失敗，請稍後再試', 'error')
    } finally {
      setIsUploading(false)
      // 清除 input 值，允許再次選擇相同檔案
      event.target.value = ''
    }
  }, [templateData, selectedStyleId])

  // 觸發每日封面上傳
  const handleDailyCoverUpload = useCallback((dayIndex: number) => {
    setUploadingDayIndex(dayIndex)
    dailyCoverInputRef.current?.click()
  }, [])

  // 處理每日封面檔案選擇
  const handleDailyCoverFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || uploadingDayIndex === null || !templateData || !selectedStyleId) return

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      void alert('請選擇圖片檔案', 'warning')
      return
    }

    // 檢查檔案大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      void alert('檔案太大！請選擇小於 5MB 的圖片', 'warning')
      return
    }

    setIsUploading(true)

    try {
      // 生成唯一檔名
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `designer_daily_${uploadingDayIndex + 1}_${timestamp}_${randomStr}.${fileExt}`

      // 上傳到 Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('city-backgrounds')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        void alert(`上傳失敗: ${uploadError.message}`, 'error')
        return
      }

      // 取得公開網址
      const { data: urlData } = supabase.storage.from('city-backgrounds').getPublicUrl(fileName)
      const imageUrl = urlData.publicUrl

      // 更新 dailyDetails
      const currentDetails = templateData.dailyDetails || []
      const newDetails = currentDetails.map((day, i) =>
        i === uploadingDayIndex ? { ...day, coverImage: imageUrl } : day
      )

      const newData = { ...templateData, dailyDetails: newDetails }
      setTemplateData(newData)

      // 重新生成該日行程頁面
      const style = styleSeries.find((s) => s.id === selectedStyleId)
      if (style) {
        const pageData = { ...newData, currentDayIndex: uploadingDayIndex }
        const newPage = generatePageFromTemplate(style.templates.daily, pageData)
        setPages((prev) => ({ ...prev, [`daily-${uploadingDayIndex}`]: newPage }))
      }
    } catch (error) {
      void alert('圖片上傳失敗，請稍後再試', 'error')
    } finally {
      setIsUploading(false)
      setUploadingDayIndex(null)
      // 清除 input 值，允許再次選擇相同檔案
      event.target.value = ''
    }
  }, [uploadingDayIndex, templateData, selectedStyleId])

  // Canvas Editor Hook
  const {
    canvasRef,
    zoom,
    setZoom,
    addTextElement,
    addRectangle,
    addCircle,
    addImage,
    deleteSelectedElements,
  } = useCanvasEditor({
    page,
    onElementChange: updateElement,
    onElementAdd: addElement,
    onElementDelete: deleteElement,
    onSelect: setSelectedElementId,
    onPlaceholderClick: handleCoverUpload,
  })

  const handleBack = () => {
    if (page && page.elements.length > 0) {
      if (window.confirm('您確定要離開嗎？所有未儲存的變更都將遺失。')) {
        router.back()
      }
    } else {
      router.back()
    }
  }

  // 生成草稿儲存的 key
  const getDraftKey = useCallback(() => {
    if (tourId) return `designer-draft-tour-${tourId}`
    if (proposalId) return `designer-draft-proposal-${proposalId}`
    if (itineraryId) return `designer-draft-itinerary-${itineraryId}`
    return 'designer-draft-new'
  }, [tourId, proposalId, itineraryId])

  // 儲存草稿到 Supabase
  const handleSaveDraft = useCallback(async () => {
    if (!templateData || !selectedStyleId) {
      await alert('請先選擇範本並填寫資料', 'warning', '無法儲存')
      return
    }

    if (!workspaceId || !userId) {
      await alert('請先登入', 'warning', '無法儲存')
      return
    }

    setIsSavingDraft(true)
    try {
      // 除錯：檢查 RLS 函數返回的 workspace
      const { data: dbWorkspace } = await supabase.rpc('get_current_user_workspace')
      console.log('儲存草稿除錯:', {
        frontendWorkspaceId: workspaceId,
        dbWorkspace: dbWorkspace,
        userId: userId,
        match: workspaceId === dbWorkspace,
      })

      const draftPayload = {
        workspace_id: workspaceId,
        user_id: userId,
        tour_id: tourId || null,
        proposal_id: proposalId || null,
        itinerary_id: itineraryId || null,
        package_id: packageId || null,
        name: templateData.mainTitle || '未命名草稿',
        style_id: selectedStyleId,
        template_data: templateData as unknown as Json,
        trip_days: tripDays,
        memo_settings: memoSettings as unknown as Json,
        hotels: hotels as unknown as Json,
        attractions: attractions as unknown as Json,
        country_code: selectedCountryCode,
        edited_elements: editedElements as unknown as Json,
      }

      if (draftId) {
        // 更新現有草稿
        const { error } = await supabase
          .from('designer_drafts')
          .update(draftPayload)
          .eq('id', draftId)

        if (error) throw error
      } else {
        // 先查詢是否已有草稿（優先順序：packageId > tourId > proposalId > itineraryId）
        let existingDraftId: string | null = null

        if (packageId) {
          const { data: existing } = await supabase
            .from('designer_drafts')
            .select('id')
            .eq('package_id', packageId)
            .maybeSingle()
          existingDraftId = existing?.id ?? null
        } else if (tourId) {
          const { data: existing } = await supabase
            .from('designer_drafts')
            .select('id')
            .eq('tour_id', tourId)
            .maybeSingle()
          existingDraftId = existing?.id ?? null
        } else if (proposalId) {
          const { data: existing } = await supabase
            .from('designer_drafts')
            .select('id')
            .eq('proposal_id', proposalId)
            .maybeSingle()
          existingDraftId = existing?.id ?? null
        } else if (itineraryId) {
          const { data: existing } = await supabase
            .from('designer_drafts')
            .select('id')
            .eq('itinerary_id', itineraryId)
            .maybeSingle()
          existingDraftId = existing?.id ?? null
        }

        if (existingDraftId) {
          // 更新現有草稿
          const { error } = await supabase
            .from('designer_drafts')
            .update(draftPayload)
            .eq('id', existingDraftId)

          if (error) throw error
          setDraftId(existingDraftId)
        } else {
          // 建立新草稿
          const { data, error } = await supabase
            .from('designer_drafts')
            .insert(draftPayload)
            .select('id')
            .single()

          if (error) throw error
          if (data) setDraftId(data.id)
        }
      }

      setLastSavedAt(new Date())
      await alert('草稿已儲存', 'success', '已儲存')
    } catch (error) {
      // 詳細記錄錯誤
      const err = error as { message?: string; code?: string; details?: string; hint?: string }
      logger.error('儲存草稿失敗:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        raw: JSON.stringify(error),
      })
      const errorMsg = err?.message || err?.hint || '未知錯誤'
      await alert(`無法儲存草稿: ${errorMsg}`, 'error', '儲存失敗')
    } finally {
      setIsSavingDraft(false)
    }
  }, [templateData, selectedStyleId, tripDays, memoSettings, hotels, attractions, selectedCountryCode, editedElements, workspaceId, userId, packageId, tourId, proposalId, itineraryId, draftId])

  // 從 Supabase 載入草稿
  const loadDraft = useCallback(async (draft: {
    id: string
    style_id: string
    template_data: Json
    trip_days: number
    memo_settings: Json
    hotels: Json
    attractions: Json
    country_code: string | null
    edited_elements: Json
    updated_at: string
  }) => {
    try {
      const loadedStyleId = draft.style_id
      const loadedTemplateData = draft.template_data as unknown as TemplateData
      const loadedTripDays = draft.trip_days || 3
      const loadedMemoSettings = draft.memo_settings as unknown as MemoSettings | null
      const loadedHotels = (draft.hotels as unknown as HotelData[]) || []
      const loadedAttractions = (draft.attractions as unknown as AttractionData[]) || []
      const loadedEditedElements = (draft.edited_elements as unknown as Record<string, CanvasElement>) || {}

      // 設定草稿 ID 並標記從草稿載入
      setDraftId(draft.id)
      setIsLoadedFromDraft(true)

      // 設定基本狀態
      if (loadedStyleId) setSelectedStyleId(loadedStyleId)
      if (loadedTemplateData) setTemplateData(loadedTemplateData)
      setTripDays(loadedTripDays)
      if (loadedMemoSettings) setMemoSettings(loadedMemoSettings)
      setHotels(loadedHotels)
      setAttractions(loadedAttractions)
      if (draft.country_code) setSelectedCountryCode(draft.country_code as CountryCode)
      setEditedElements(loadedEditedElements)
      setLastSavedAt(new Date(draft.updated_at))

      // 重新生成所有頁面
      if (loadedStyleId && loadedTemplateData) {
        const style = styleSeries.find((s) => s.id === loadedStyleId)
        if (style) {
          const newPages: Record<string, CanvasPage | null> = {
            cover: generatePageFromTemplate(style.templates.cover, loadedTemplateData),
            toc: generatePageFromTemplate(style.templates.toc, { ...loadedTemplateData, hotels: loadedHotels, memoSettings: loadedMemoSettings ?? undefined }),
            itinerary: generatePageFromTemplate(style.templates.itinerary, loadedTemplateData),
          }

          // 生成每日行程頁面
          for (let i = 0; i < loadedTripDays; i++) {
            const dailyData = { ...loadedTemplateData, currentDayIndex: i }
            newPages[`daily-${i}`] = generatePageFromTemplate(style.templates.daily, dailyData)
          }

          // 生成飯店頁面
          loadedHotels.forEach((hotel: HotelData, i: number) => {
            if (hotel.enabled !== false) {
              const hotelData = { ...loadedTemplateData, currentHotelIndex: i, hotels: loadedHotels }
              newPages[`hotel-${i}`] = generatePageFromTemplate(style.templates.hotel, hotelData)
            }
          })

          // 生成備忘錄頁面
          if (loadedMemoSettings) {
            const pageCount = calculateMemoPageCount(loadedMemoSettings)
            for (let i = 0; i < pageCount; i++) {
              const memoData = { ...loadedTemplateData, memoSettings: loadedMemoSettings, currentMemoPageIndex: i }
              newPages[`memo-${i}`] = generatePageFromTemplate(style.templates.memo, memoData)
            }
          }

          // 生成景點頁面
          if (loadedAttractions.length > 0) {
            const attractionPageCount = Math.ceil(loadedAttractions.length / 2)
            for (let i = 0; i < attractionPageCount; i++) {
              const attractionData = { ...loadedTemplateData, attractions: loadedAttractions, currentAttractionPageIndex: i, currentPageNumber: 10 + i }
              newPages[`attraction-${i}`] = generatePageFromTemplate(style.templates.attraction, attractionData)
            }
          }

          // 套用手動編輯的元素（不直接修改，而是創建新的陣列）
          const pagesWithEditedElements: Record<string, CanvasPage | null> = {}
          Object.entries(newPages).forEach(([pageType, page]) => {
            if (!page) {
              pagesWithEditedElements[pageType] = null
              return
            }

            // 找出該頁面類型所有被編輯過的元素
            const editedForThisPage = Object.entries(loadedEditedElements)
              .filter(([key]) => key.startsWith(`${pageType}:`))
              .map(([key, element]) => ({ elementId: key.split(':')[1], element }))

            if (editedForThisPage.length === 0) {
              pagesWithEditedElements[pageType] = page
              return
            }

            // 套用編輯過的元素
            const updatedElements = page.elements.map((el) => {
              const edited = editedForThisPage.find((e) => e.elementId === el.id)
              if (edited) {
                return edited.element
              }
              return el
            })

            pagesWithEditedElements[pageType] = { ...page, elements: updatedElements }
          })

          setPages(pagesWithEditedElements)
          setCurrentPageType('cover')
        }
      }
      return true
    } catch (error) {
      logger.error('載入草稿失敗:', error)
    }
    return false
  }, [])

  // 檢查是否有 Supabase 草稿
  useEffect(() => {
    const checkForDraft = async () => {
      if (!workspaceId || selectedStyleId) return

      try {
        let query = supabase
          .from('designer_drafts')
          .select('*')
          .eq('workspace_id', workspaceId)

        // 優先順序：packageId > tourId > proposalId > itineraryId
        if (packageId) {
          query = query.eq('package_id', packageId)
        } else if (tourId) {
          query = query.eq('tour_id', tourId)
        } else if (proposalId) {
          query = query.eq('proposal_id', proposalId)
        } else if (itineraryId) {
          query = query.eq('itinerary_id', itineraryId)
        } else {
          return // 沒有關聯來源，不載入草稿
        }

        const { data: drafts, error } = await query.limit(1)

        if (error) throw error

        if (drafts && drafts.length > 0) {
          const draft = drafts[0]
          // 設定 pendingDraft 狀態，讓 UI 顯示草稿卡片
          setPendingDraft({
            id: draft.id,
            name: draft.name,
            updated_at: draft.updated_at,
            style_id: draft.style_id,
            template_data: draft.template_data,
            trip_days: draft.trip_days,
            memo_settings: draft.memo_settings,
            hotels: draft.hotels,
            attractions: draft.attractions,
            country_code: draft.country_code,
            edited_elements: draft.edited_elements,
          })
        }
      } catch (error) {
        logger.error('檢查草稿失敗:', error)
      }
    }

    checkForDraft()
  }, [workspaceId, packageId, tourId, proposalId, itineraryId, selectedStyleId, loadDraft])

  const handleAddImageClick = useCallback(() => {
    const url = prompt('請輸入圖片網址：')
    if (url) {
      addImage(url)
    }
  }, [addImage])

  const toggleElementVisibility = useCallback(
    (elementId: string) => {
      if (!page) return
      const element = page.elements.find((el) => el.id === elementId)
      if (element) {
        updateElement(elementId, { visible: !element.visible })
      }
    },
    [page, updateElement]
  )

  const toggleElementLock = useCallback(
    (elementId: string) => {
      if (!page) return
      const element = page.elements.find((el) => el.id === elementId)
      if (element) {
        updateElement(elementId, { locked: !element.locked })
      }
    },
    [page, updateElement]
  )

  // 儲存當前狀態到歷史（在修改前呼叫）
  const saveToHistory = useCallback(() => {
    if (!templateData) return
    setTemplateDataHistory((prev) => {
      const newHistory = [...prev, JSON.parse(JSON.stringify(templateData))]
      // 限制歷史長度
      if (newHistory.length > maxHistoryLength) {
        return newHistory.slice(-maxHistoryLength)
      }
      return newHistory
    })
  }, [templateData, maxHistoryLength])

  // 更新範本資料並重新生成頁面（必須在條件渲染之前定義）
  const handleTemplateDataChange = useCallback((field: keyof TemplateData, value: string) => {
    if (!templateData || !selectedStyleId) return

    // 儲存歷史以便復原
    saveToHistory()

    const newData = { ...templateData, [field]: value }
    setTemplateData(newData)

    // 重新生成當前頁面
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      let templateId: string
      let pageData = newData
      if (currentPageType === 'cover') {
        templateId = style.templates.cover
      } else if (currentPageType === 'itinerary') {
        templateId = style.templates.itinerary
      } else {
        // daily 頁面
        templateId = style.templates.daily
        pageData = { ...newData, currentDayIndex: getDayIndex(currentPageType) }
      }
      const newPage = generatePageFromTemplate(templateId, pageData)
      setPages((prev) => ({ ...prev, [currentPageType]: newPage }))
    }
  }, [templateData, selectedStyleId, currentPageType, saveToHistory])

  // 更新每日行程資料（用於行程總覽頁）
  const handleDailyItineraryChange = useCallback((
    dayIndex: number,
    field: 'title' | 'breakfast' | 'lunch' | 'dinner' | 'accommodation' | 'breakfastIcon' | 'lunchIcon' | 'dinnerIcon',
    value: string
  ) => {
    if (!templateData || !selectedStyleId) return

    // 取得現有的每日行程（預設 5 天）
    const currentItineraries = templateData.dailyItineraries || Array.from({ length: 5 }, (_, i) => ({
      dayNumber: i + 1,
      title: '',
      meals: { breakfast: '', lunch: '', dinner: '' },
      mealIcons: {},
      accommodation: '',
    }))

    // 複製並更新
    const newItineraries = currentItineraries.map((day, i) => {
      if (i !== dayIndex) return day
      if (field === 'title' || field === 'accommodation') {
        return { ...day, [field]: value }
      }
      // 餐食圖標欄位
      if (field.endsWith('Icon')) {
        const mealType = field.replace('Icon', '') as 'breakfast' | 'lunch' | 'dinner'
        return {
          ...day,
          mealIcons: { ...day.mealIcons, [mealType]: value || undefined },
        }
      }
      // 餐食內容欄位
      return {
        ...day,
        meals: { ...day.meals, [field]: value },
      }
    })

    const newData = { ...templateData, dailyItineraries: newItineraries }
    setTemplateData(newData)

    // 重新生成行程總覽頁面
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      const newPage = generatePageFromTemplate(style.templates.itinerary, newData)
      setPages((prev) => ({ ...prev, itinerary: newPage }))
    }
  }, [templateData, selectedStyleId, saveToHistory])

  // 更新每日行程詳細資料（用於每日行程頁）
  const handleDailyDetailChange = useCallback((
    dayIndex: number,
    field: 'title' | 'date' | 'coverImage' | 'breakfast' | 'lunch' | 'dinner',
    value: string
  ) => {
    if (!templateData || !selectedStyleId) return

    // 儲存歷史以便復原
    saveToHistory()

    // 取得現有的每日詳細資料
    const currentDetails = templateData.dailyDetails || Array.from({ length: tripDays }, (_, i) => ({
      dayNumber: i + 1,
      date: '',
      title: '',
      coverImage: undefined,
      timeline: [],
      meals: { breakfast: '', lunch: '', dinner: '' },
    }))

    // 複製並更新
    const newDetails = currentDetails.map((day, i) => {
      if (i !== dayIndex) return day
      if (field === 'title' || field === 'date' || field === 'coverImage') {
        return { ...day, [field]: value }
      }
      // 餐食欄位
      return {
        ...day,
        meals: { ...day.meals, [field]: value },
      }
    })

    const newData = { ...templateData, dailyDetails: newDetails }
    setTemplateData(newData)

    // 重新生成該日行程頁面
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      const pageData = { ...newData, currentDayIndex: dayIndex }
      const newPage = generatePageFromTemplate(style.templates.daily, pageData)
      setPages((prev) => ({ ...prev, [`daily-${dayIndex}`]: newPage }))
    }
  }, [templateData, selectedStyleId, tripDays, saveToHistory])

  // 更新時間軸項目
  const handleTimelineChange = useCallback((
    dayIndex: number,
    itemIndex: number,
    field: 'time' | 'activity' | 'isHighlight',
    value: string | boolean
  ) => {
    if (!templateData || !selectedStyleId) return

    // 儲存歷史以便復原（只在活動內容變更時儲存，避免頻繁儲存時間輸入）
    if (field !== 'time') {
      saveToHistory()
    }

    const currentDetails = templateData.dailyDetails || []
    const dayDetail = currentDetails[dayIndex]
    if (!dayDetail) return

    const newTimeline = [...dayDetail.timeline]
    if (!newTimeline[itemIndex]) {
      newTimeline[itemIndex] = { time: '', activity: '', isHighlight: false }
    }
    newTimeline[itemIndex] = { ...newTimeline[itemIndex], [field]: value }

    const newDetails = currentDetails.map((day, i) =>
      i === dayIndex ? { ...day, timeline: newTimeline } : day
    )

    const newData = { ...templateData, dailyDetails: newDetails }
    setTemplateData(newData)

    // 重新生成該日行程頁面
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      const pageData = { ...newData, currentDayIndex: dayIndex }
      const newPage = generatePageFromTemplate(style.templates.daily, pageData)
      setPages((prev) => ({ ...prev, [`daily-${dayIndex}`]: newPage }))
    }
  }, [templateData, selectedStyleId, saveToHistory])

  // 新增時間軸項目
  const handleAddTimelineItem = useCallback((dayIndex: number) => {
    if (!templateData || !selectedStyleId) return

    const currentDetails = templateData.dailyDetails || []
    const dayDetail = currentDetails[dayIndex]
    if (!dayDetail) return

    const newTimeline = [...dayDetail.timeline, { time: '', activity: '', isHighlight: false }]

    const newDetails = currentDetails.map((day, i) =>
      i === dayIndex ? { ...day, timeline: newTimeline } : day
    )

    const newData = { ...templateData, dailyDetails: newDetails }
    setTemplateData(newData)

    // 重新生成該日行程頁面
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      const pageData = { ...newData, currentDayIndex: dayIndex }
      const newPage = generatePageFromTemplate(style.templates.daily, pageData)
      setPages((prev) => ({ ...prev, [`daily-${dayIndex}`]: newPage }))
    }
  }, [templateData, selectedStyleId, saveToHistory])

  // 刪除時間軸項目
  const handleRemoveTimelineItem = useCallback((dayIndex: number, itemIndex: number) => {
    if (!templateData || !selectedStyleId) return

    const currentDetails = templateData.dailyDetails || []
    const dayDetail = currentDetails[dayIndex]
    if (!dayDetail) return

    const newTimeline = dayDetail.timeline.filter((_, i) => i !== itemIndex)

    const newDetails = currentDetails.map((day, i) =>
      i === dayIndex ? { ...day, timeline: newTimeline } : day
    )

    const newData = { ...templateData, dailyDetails: newDetails }
    setTemplateData(newData)

    // 重新生成該日行程頁面
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      const pageData = { ...newData, currentDayIndex: dayIndex }
      const newPage = generatePageFromTemplate(style.templates.daily, pageData)
      setPages((prev) => ({ ...prev, [`daily-${dayIndex}`]: newPage }))
    }
  }, [templateData, selectedStyleId, saveToHistory])

  // 時間軸拖拉排序
  const handleTimelineReorder = useCallback((dayIndex: number, fromIndex: number, toIndex: number) => {
    if (!templateData || !selectedStyleId || fromIndex === toIndex) return

    const currentDetails = templateData.dailyDetails || []
    const dayDetail = currentDetails[dayIndex]
    if (!dayDetail) return

    const newTimeline = [...dayDetail.timeline]
    const [movedItem] = newTimeline.splice(fromIndex, 1)
    newTimeline.splice(toIndex, 0, movedItem)

    const newDetails = currentDetails.map((day, i) =>
      i === dayIndex ? { ...day, timeline: newTimeline } : day
    )

    const newData = { ...templateData, dailyDetails: newDetails }
    setTemplateData(newData)

    // 重新生成該日行程頁面
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      const pageData = { ...newData, currentDayIndex: dayIndex }
      const newPage = generatePageFromTemplate(style.templates.daily, pageData)
      setPages((prev) => ({ ...prev, [`daily-${dayIndex}`]: newPage }))
    }
  }, [templateData, selectedStyleId, saveToHistory])

  // 計算備忘錄頁數
  const memoPageCount = memoSettings ? calculateMemoPageCount(memoSettings) : 0

  // 生成列印圖片
  const handleOpenPrintPreview = useCallback(async () => {
    setIsGeneratingPrint(true)

    try {
      // 收集所有要列印的頁面（按順序：封面 → 目錄 → 行程總覽 → Day 1, 2, 3... → 飯店 → 備忘錄）
      const pageOrder: string[] = ['cover', 'toc', 'itinerary']
      for (let i = 0; i < tripDays; i++) {
        pageOrder.push(`daily-${i}`)
      }
      // 加入備忘錄頁面
      for (let i = 0; i < memoPageCount; i++) {
        pageOrder.push(`memo-${i}`)
      }
      // 加入飯店介紹頁面
      for (let i = 0; i < hotels.length; i++) {
        pageOrder.push(`hotel-${i}`)
      }
      // 加入景點介紹頁面
      const attractionPageCount = Math.ceil(attractions.length / 2)
      for (let i = 0; i < attractionPageCount; i++) {
        pageOrder.push(`attraction-${i}`)
      }

      const images: string[] = []

      for (const pageKey of pageOrder) {
        const pageData = pages[pageKey]
        if (!pageData) continue

        // 創建臨時 canvas 元素
        const tempCanvasEl = document.createElement('canvas')
        tempCanvasEl.width = pageData.width
        tempCanvasEl.height = pageData.height

        // 創建 StaticCanvas
        const staticCanvas = new StaticCanvas(tempCanvasEl, {
          width: pageData.width,
          height: pageData.height,
        })

        // 渲染頁面
        await renderPageOnCanvas(staticCanvas, pageData, {
          isEditable: false,
          canvasWidth: pageData.width,
          canvasHeight: pageData.height,
        })

        // 轉成圖片
        const dataUrl = staticCanvas.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 2, // 2x 解析度確保清晰
        })

        images.push(dataUrl)

        // 清理
        staticCanvas.dispose()
      }

      setPrintImages(images)
      setShowPrintPreview(true)
    } catch (error) {
      void alert('生成列印預覽失敗', 'error')
    } finally {
      setIsGeneratingPrint(false)
    }
  }, [pages, tripDays, memoPageCount, hotels])

  // 執行列印（使用 iframe 方式，最可靠）
  const handlePrint = useCallback(() => {
    if (printImages.length === 0) return

    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    iframe.style.left = '-9999px'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) {
      document.body.removeChild(iframe)
      return
    }

    // 生成頁面 HTML
    const pagesHtml = printImages.map((imgSrc, idx) => `
      <div class="print-page" style="page-break-after: ${idx < printImages.length - 1 ? 'always' : 'auto'};">
        <img src="${imgSrc}" alt="Page ${idx + 1}" />
      </div>
    `).join('')

    // 寫入列印內容（A5 直向）
    iframeDoc.open()
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>旅遊手冊</title>
        <style>
          @page {
            size: 148mm 210mm;
            margin: 0;
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          html, body {
            width: 148mm;
            height: 210mm;
            margin: 0;
            padding: 0;
            background: white;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print-page {
            width: 148mm;
            height: 210mm;
            margin: 0;
            padding: 0;
            page-break-inside: avoid;
            overflow: hidden;
          }

          .print-page img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `)
    iframeDoc.close()

    // 等待圖片載入後列印
    setTimeout(() => {
      iframe.contentWindow?.print()
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }, 500)
  }, [printImages])

  // 復原 (Undo)
  const handleUndo = useCallback(() => {
    if (templateDataHistory.length === 0 || !selectedStyleId) return

    const previousData = templateDataHistory[templateDataHistory.length - 1]
    setTemplateDataHistory((prev) => prev.slice(0, -1))
    setTemplateData(previousData)

    // 重新生成當前頁面，並套用編輯過的元素
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      if (currentPageType === 'cover') {
        const newPage = generatePageFromTemplate(style.templates.cover, previousData)
        setPages((prev) => ({ ...prev, cover: applyEditedElements('cover', newPage) }))
      } else if (currentPageType === 'itinerary') {
        const newPage = generatePageFromTemplate(style.templates.itinerary, previousData)
        setPages((prev) => ({ ...prev, itinerary: applyEditedElements('itinerary', newPage) }))
      } else if (isDailyPage(currentPageType)) {
        const dayIdx = getDayIndex(currentPageType)
        const pageData = { ...previousData, currentDayIndex: dayIdx }
        const newPage = generatePageFromTemplate(style.templates.daily, pageData)
        setPages((prev) => ({ ...prev, [currentPageType]: applyEditedElements(currentPageType, newPage) }))
      }
    }
  }, [templateDataHistory, selectedStyleId, currentPageType, applyEditedElements])

  // 新增備忘錄（根據國家載入預設）
  const handleAddMemo = useCallback((countryCode: CountryCode) => {
    if (!selectedStyleId) return

    const settings = getMemoSettingsByCountry(countryCode)
    setMemoSettings(settings)
    setSelectedCountryCode(countryCode)

    // 計算需要幾頁
    const pageCount = calculateMemoPageCount(settings)

    // 更新 templateData
    const newData = { ...templateData, memoSettings: settings, countryCode }
    setTemplateData(newData)

    // 生成備忘錄頁面
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      setPages((prev) => {
        const updated = { ...prev }
        for (let i = 0; i < pageCount; i++) {
          const pageData = { ...newData, currentMemoPageIndex: i }
          updated[`memo-${i}`] = generatePageFromTemplate(style.templates.memo, pageData)
        }
        return updated
      })
    }

    // 切換到第一頁備忘錄
    setCurrentPageType('memo-0')
  }, [selectedStyleId, templateData])

  // 切換備忘錄項目啟用狀態
  const handleToggleMemoItem = useCallback((itemId: string) => {
    if (!memoSettings || !selectedStyleId) return

    const newSettings: MemoSettings = {
      ...memoSettings,
      items: memoSettings.items.map((item) =>
        item.id === itemId ? { ...item, enabled: !item.enabled } : item
      ),
    }
    setMemoSettings(newSettings)

    // 更新 templateData
    const newData = { ...templateData, memoSettings: newSettings }
    setTemplateData(newData)

    // 計算新的頁數並重新生成
    const newPageCount = calculateMemoPageCount(newSettings)
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      setPages((prev) => {
        const updated = { ...prev }
        // 清除舊的備忘錄頁面
        Object.keys(updated).forEach((key) => {
          if (key.startsWith('memo-')) {
            delete updated[key]
          }
        })
        // 生成新的備忘錄頁面
        for (let i = 0; i < newPageCount; i++) {
          const pageData = { ...newData, currentMemoPageIndex: i }
          updated[`memo-${i}`] = generatePageFromTemplate(style.templates.memo, pageData)
        }
        return updated
      })
    }

    // 如果當前頁面被刪除，切換到最後一頁備忘錄或封面
    if (isMemoPage(currentPageType)) {
      const currentIdx = getMemoPageIndex(currentPageType)
      if (currentIdx >= newPageCount) {
        if (newPageCount > 0) {
          setCurrentPageType(`memo-${newPageCount - 1}`)
        } else {
          setCurrentPageType('cover')
        }
      }
    }
  }, [memoSettings, selectedStyleId, templateData, currentPageType])

  // 切換季節啟用狀態
  const handleToggleSeason = useCallback((season: 'spring' | 'summer' | 'autumn' | 'winter') => {
    if (!memoSettings || !selectedStyleId) return

    const newSettings: MemoSettings = {
      ...memoSettings,
      seasons: memoSettings.seasons?.map((s) =>
        s.season === season ? { ...s, enabled: !s.enabled } : s
      ),
    }
    setMemoSettings(newSettings)

    // 更新並重新生成
    const newData = { ...templateData, memoSettings: newSettings }
    setTemplateData(newData)

    const newPageCount = calculateMemoPageCount(newSettings)
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      setPages((prev) => {
        const updated = { ...prev }
        Object.keys(updated).forEach((key) => {
          if (key.startsWith('memo-')) delete updated[key]
        })
        for (let i = 0; i < newPageCount; i++) {
          const pageData = { ...newData, currentMemoPageIndex: i }
          updated[`memo-${i}`] = generatePageFromTemplate(style.templates.memo, pageData)
        }
        return updated
      })
    }
  }, [memoSettings, selectedStyleId, templateData])

  // 切換資訊項目啟用狀態
  const handleToggleInfoItem = useCallback((itemId: string) => {
    if (!memoSettings || !selectedStyleId) return

    const newSettings: MemoSettings = {
      ...memoSettings,
      infoItems: memoSettings.infoItems?.map((item) =>
        item.id === itemId ? { ...item, enabled: !item.enabled } : item
      ),
    }
    setMemoSettings(newSettings)

    const newData = { ...templateData, memoSettings: newSettings }
    setTemplateData(newData)

    const newPageCount = calculateMemoPageCount(newSettings)
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      setPages((prev) => {
        const updated = { ...prev }
        Object.keys(updated).forEach((key) => {
          if (key.startsWith('memo-')) delete updated[key]
        })
        for (let i = 0; i < newPageCount; i++) {
          const pageData = { ...newData, currentMemoPageIndex: i }
          updated[`memo-${i}`] = generatePageFromTemplate(style.templates.memo, pageData)
        }
        return updated
      })
    }
  }, [memoSettings, selectedStyleId, templateData])

  // 刪除所有備忘錄頁面
  const handleRemoveMemo = useCallback(() => {
    setMemoSettings(null)
    setPages((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((key) => {
        if (key.startsWith('memo-')) delete updated[key]
      })
      return updated
    })
    setTemplateData((prev) => prev ? { ...prev, memoSettings: undefined, countryCode: undefined } : null)
    if (isMemoPage(currentPageType)) {
      setCurrentPageType('cover')
    }
  }, [currentPageType])

  // 新增飯店頁面
  const handleAddHotel = useCallback(() => {
    if (!selectedStyleId) return

    const newHotel: HotelData = {
      id: `hotel-${Date.now()}`,
      nameZh: '',
      nameEn: '',
      location: '',
      description: '',
      image: undefined,
      tags: [],
      enabled: true,
    }

    const newHotels = [...hotels, newHotel]
    setHotels(newHotels)

    // 更新 templateData
    const newData = { ...templateData, hotels: newHotels, currentHotelIndex: hotels.length }
    setTemplateData(newData)

    // 生成飯店頁面
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      const pageData = { ...newData, currentHotelIndex: hotels.length }
      setPages((prev) => ({
        ...prev,
        [`hotel-${hotels.length}`]: generatePageFromTemplate(style.templates.hotel, pageData),
      }))
    }
    // 不自動跳轉，讓使用者點擊列表項目才跳轉
  }, [selectedStyleId, hotels, templateData])

  // 刪除飯店頁面
  const handleRemoveHotel = useCallback((index: number) => {
    const newHotels = hotels.filter((_, i) => i !== index)
    setHotels(newHotels)

    // 更新 templateData
    const newData = { ...templateData, hotels: newHotels.length > 0 ? newHotels : undefined }
    setTemplateData(newData)

    // 移除該飯店頁面並重新生成其他頁面
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      setPages((prev) => {
        const updated = { ...prev }
        // 移除所有飯店頁面
        Object.keys(updated).forEach((key) => {
          if (key.startsWith('hotel-')) delete updated[key]
        })
        // 重新生成剩餘的飯店頁面
        newHotels.forEach((_, i) => {
          const pageData = { ...newData, currentHotelIndex: i }
          updated[`hotel-${i}`] = generatePageFromTemplate(style.templates.hotel, pageData)
        })
        return updated
      })
    }

    // 切換頁面
    if (isHotelPage(currentPageType)) {
      const currentIndex = getHotelIndex(currentPageType)
      if (currentIndex >= newHotels.length) {
        if (newHotels.length > 0) {
          setCurrentPageType(`hotel-${newHotels.length - 1}`)
        } else {
          setCurrentPageType('cover')
        }
      } else {
        setCurrentPageType(`hotel-${currentIndex}`)
      }
    }
  }, [hotels, templateData, selectedStyleId, currentPageType])

  // 更新飯店資料
  const handleUpdateHotel = useCallback((index: number, field: keyof HotelData, value: string | string[] | undefined) => {
    const newHotels = hotels.map((h, i) =>
      i === index ? { ...h, [field]: value } : h
    )
    setHotels(newHotels)

    // 更新 templateData
    const newData = { ...templateData, hotels: newHotels, currentHotelIndex: index }
    setTemplateData(newData)

    // 重新生成該飯店頁面
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      const pageData = { ...newData, currentHotelIndex: index }
      setPages((prev) => ({
        ...prev,
        [`hotel-${index}`]: generatePageFromTemplate(style.templates.hotel, pageData),
      }))
    }
  }, [hotels, templateData, selectedStyleId])

  // 飯店圖片上傳
  const handleHotelImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, hotelIndex: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingHotelIndex(hotelIndex)
    try {
      // 上傳到 Supabase Storage
      const fileName = `hotel-${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('designer-images')
        .upload(fileName, file)

      if (error) throw error

      // 取得公開 URL
      const { data: urlData } = supabase.storage
        .from('designer-images')
        .getPublicUrl(data.path)

      handleUpdateHotel(hotelIndex, 'image', urlData.publicUrl)
    } catch (error) {
      void alert('圖片上傳失敗', 'error')
    } finally {
      setUploadingHotelIndex(null)
      if (hotelCoverInputRef.current) {
        hotelCoverInputRef.current.value = ''
      }
    }
  }, [handleUpdateHotel])

  // 新增景點
  const handleAddAttraction = useCallback(() => {
    if (!selectedStyleId) return

    const newAttraction: AttractionData = {
      id: `attraction-${Date.now()}`,
      nameZh: '',
      nameEn: '',
      description: '',
      enabled: true,
    }
    const newAttractions = [...attractions, newAttraction]
    setAttractions(newAttractions)

    // 更新 templateData
    const newData = { ...templateData, attractions: newAttractions }
    setTemplateData(newData)

    // 計算需要多少頁（每頁2個景點）
    const pageIndex = Math.floor(attractions.length / 2)

    // 生成或更新景點頁面
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      const pageData = { ...newData, currentAttractionPageIndex: pageIndex, currentPageNumber: 10 + pageIndex }
      setPages((prev) => ({
        ...prev,
        [`attraction-${pageIndex}`]: generatePageFromTemplate(style.templates.attraction, pageData),
      }))
    }
    // 不自動跳轉，讓使用者點擊列表項目才跳轉
  }, [selectedStyleId, attractions, templateData])

  // 刪除景點
  const handleRemoveAttraction = useCallback((index: number) => {
    const newAttractions = attractions.filter((_, i) => i !== index)
    setAttractions(newAttractions)

    // 更新 templateData
    const newData = { ...templateData, attractions: newAttractions.length > 0 ? newAttractions : undefined }
    setTemplateData(newData)

    // 重新生成景點頁面
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      setPages((prev) => {
        const updated = { ...prev }
        // 移除所有景點頁面
        Object.keys(updated).forEach((key) => {
          if (key.startsWith('attraction-')) delete updated[key]
        })
        // 重新生成頁面（每頁2個景點）
        const pageCount = Math.ceil(newAttractions.length / 2)
        for (let i = 0; i < pageCount; i++) {
          const pageData = { ...newData, currentAttractionPageIndex: i, currentPageNumber: 10 + i }
          updated[`attraction-${i}`] = generatePageFromTemplate(style.templates.attraction, pageData)
        }
        return updated
      })
    }

    // 如果當前頁面是被刪除的景點所在頁面，切換到其他頁面
    if (isAttractionPage(currentPageType)) {
      const currentPageIdx = getAttractionPageIndex(currentPageType)
      const newPageCount = Math.ceil(newAttractions.length / 2)
      if (currentPageIdx >= newPageCount) {
        if (newPageCount > 0) {
          setCurrentPageType(`attraction-${newPageCount - 1}`)
        } else {
          setCurrentPageType('cover')
        }
      }
    }
  }, [attractions, templateData, selectedStyleId, currentPageType])

  // 更新景點資料
  const handleUpdateAttraction = useCallback((index: number, field: keyof AttractionData, value: string | undefined) => {
    const newAttractions = attractions.map((a, i) =>
      i === index ? { ...a, [field]: value } : a
    )
    setAttractions(newAttractions)

    // 更新 templateData
    const pageIndex = Math.floor(index / 2)
    const newData = { ...templateData, attractions: newAttractions, currentAttractionPageIndex: pageIndex }
    setTemplateData(newData)

    // 重新生成該景點所在的頁面
    const style = styleSeries.find((s) => s.id === selectedStyleId)
    if (style) {
      const pageData = { ...newData, currentAttractionPageIndex: pageIndex, currentPageNumber: 10 + pageIndex }
      setPages((prev) => ({
        ...prev,
        [`attraction-${pageIndex}`]: generatePageFromTemplate(style.templates.attraction, pageData),
      }))
    }
  }, [attractions, templateData, selectedStyleId])

  // 景點圖片上傳
  const handleAttractionImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, attractionIndex: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAttractionIndex(attractionIndex)
    try {
      // 上傳到 Supabase Storage
      const fileName = `attraction-${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('designer-images')
        .upload(fileName, file)

      if (error) throw error

      // 取得公開 URL
      const { data: urlData } = supabase.storage
        .from('designer-images')
        .getPublicUrl(data.path)

      handleUpdateAttraction(attractionIndex, 'image', urlData.publicUrl)
    } catch (error) {
      void alert('圖片上傳失敗', 'error')
    } finally {
      setUploadingAttractionIndex(null)
      if (attractionImageInputRef.current) {
        attractionImageInputRef.current.value = ''
      }
    }
  }, [handleUpdateAttraction])

  // 鍵盤快捷鍵 (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo])

  // Loading 狀態
  if (isLoading) {
    return (
      <main className="h-screen flex items-center justify-center bg-background lg:ml-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-morandi-gold mx-auto mb-4" />
          <p className="text-morandi-secondary">載入範本中...</p>
        </div>
      </main>
    )
  }

  // 範本選擇器（尚未選擇風格時顯示）
  if (!selectedStyleId || !page) {
    return (
      <main className="h-screen flex flex-col bg-background lg:ml-16">
        {/* Header - 樣式與 ResponsiveHeader 一致 */}
        <header className="h-[72px] flex-shrink-0 bg-background flex items-center px-6 relative">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft size={18} />
          </Button>
          <div className="ml-4">
            <h1 className="text-lg font-bold text-morandi-primary">選擇手冊風格</h1>
            <p className="text-sm text-morandi-secondary">請選擇一個範本開始製作</p>
          </div>
          {/* 分割線 - 左右留 24px 間距 */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{ marginLeft: '24px', marginRight: '24px', borderTop: '1px solid var(--border)' }}
          />
        </header>

        {/* 發現草稿時顯示載入卡片 */}
        {pendingDraft && (
          <div className="mx-8 mt-6 p-4 bg-card border border-morandi-gold/30 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              {/* 書本圖標 */}
              <div className="flex-shrink-0 w-12 h-12 bg-morandi-gold/10 rounded-lg flex items-center justify-center">
                <BookOpen size={24} className="text-morandi-gold" />
              </div>
              {/* 草稿資訊 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-morandi-primary truncate">{pendingDraft.name}</h3>
                <p className="text-sm text-morandi-secondary">
                  上次編輯：{new Date(pendingDraft.updated_at).toLocaleString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {/* 操作按鈕 */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingDraft(null)}
                  className="text-morandi-secondary hover:text-morandi-primary"
                >
                  重新開始
                </Button>
                <Button
                  size="sm"
                  className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-1"
                  onClick={() => {
                    loadDraft(pendingDraft)
                    setPendingDraft(null)
                  }}
                >
                  <BookOpen size={14} />
                  載入草稿
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 範本選擇區 - 靠左對齊 */}
        <div className="flex-1 overflow-auto p-8">
          <div className="flex flex-wrap gap-6">
              {/* 日系風格 */}
              <button
                onClick={() => handleSelectStyle('japanese-style-v1')}
                className="group relative bg-card rounded-xl border-2 border-border hover:border-morandi-gold transition-all overflow-hidden text-left"
              >
                {/* 預覽圖 */}
                <div className="aspect-[3/4] bg-gradient-to-b from-morandi-container to-card flex items-center justify-center">
                  <div className="w-32 h-44 bg-card rounded-lg shadow-lg border border-border/50 flex flex-col items-center justify-center p-3">
                    <div className="w-full h-20 bg-morandi-container rounded-t-[40px] rounded-b mb-2" />
                    <div className="w-16 h-1 bg-morandi-gold rounded mb-2" />
                    <div className="w-full h-2 bg-morandi-container/50 rounded mb-1" />
                    <div className="w-3/4 h-2 bg-morandi-container/50 rounded" />
                  </div>
                </div>
                {/* 資訊 */}
                <div className="p-4">
                  <h3 className="font-semibold text-morandi-primary group-hover:text-morandi-gold transition-colors">
                    日系風格
                  </h3>
                  <p className="text-xs text-morandi-secondary mt-1">
                    簡約、留白、優雅的日式設計風格
                  </p>
                </div>
                {/* 選擇指示 */}
                <div className="absolute inset-0 bg-morandi-gold/0 group-hover:bg-morandi-gold/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="bg-morandi-gold text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                    選擇此範本
                  </span>
                </div>
              </button>

              {/* 更多範本（即將推出） */}
              <div className="relative bg-morandi-container/30 rounded-xl border-2 border-dashed border-border flex items-center justify-center aspect-[3/4]">
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-morandi-container flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl text-morandi-secondary">+</span>
                  </div>
                  <p className="text-sm text-morandi-secondary">更多範本</p>
                  <p className="text-xs text-morandi-muted mt-1">即將推出</p>
                </div>
              </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen flex flex-col bg-background lg:ml-16">
      {/* 隱藏的封面圖片上傳 input */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverFileSelect}
        className="hidden"
      />
      {/* 隱藏的每日封面上傳 input */}
      <input
        ref={dailyCoverInputRef}
        type="file"
        accept="image/*"
        onChange={handleDailyCoverFileSelect}
        className="hidden"
      />

      {/* 上傳中遮罩 */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-morandi-gold" />
            <span className="text-morandi-primary">上傳中...</span>
          </div>
        </div>
      )}

      {/* Header - 樣式與 ResponsiveHeader 一致 */}
      <header className="h-[72px] flex-shrink-0 bg-background flex items-center justify-between px-6 z-10 relative">
        {/* 分割線 - 左右留 24px 間距 */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ marginLeft: '24px', marginRight: '24px', borderTop: '1px solid var(--border)' }}
        />
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft size={18} />
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-morandi-gold" />
            <h1 className="text-lg font-bold text-morandi-primary">旅遊手冊編輯器</h1>
          </div>
          {/* 抽屜切換按鈕 */}
          <button
            onClick={() => setShowPageDrawer(!showPageDrawer)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              showPageDrawer
                ? 'bg-morandi-gold text-white'
                : 'bg-morandi-container/50 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container'
            )}
          >
            <PanelLeft size={16} />
            頁面導覽
          </button>
        </div>

        {/* 當前頁面指示 */}
        <div className="flex items-center gap-2 bg-morandi-container/30 px-4 py-1.5 rounded-lg">
          <span className="text-xs text-morandi-secondary">當前頁面：</span>
          <span className="text-sm font-medium text-morandi-primary">
            {currentPageType === 'cover' && '封面'}
            {currentPageType === 'toc' && '目錄'}
            {currentPageType === 'itinerary' && '行程總覽'}
            {isDailyPage(currentPageType) && `Day ${getDayIndex(currentPageType) + 1}`}
            {isMemoPage(currentPageType) && (getMemoPageIndex(currentPageType) === memoPageCount - 1 && memoSettings?.seasons?.some(s => s.enabled) ? '天氣資訊' : `旅遊提醒 ${getMemoPageIndex(currentPageType) + 1}`)}
            {isHotelPage(currentPageType) && (hotels[getHotelIndex(currentPageType)]?.nameZh || `飯店 ${getHotelIndex(currentPageType) + 1}`)}
            {isAttractionPage(currentPageType) && `景點 ${getAttractionPageIndex(currentPageType) * 2 + 1}-${Math.min(getAttractionPageIndex(currentPageType) * 2 + 2, attractions.length)}`}
          </span>
          <span className="text-xs text-morandi-muted">
            (共 {1 + 1 + 1 + tripDays + memoPageCount + hotels.length + Math.ceil(attractions.length / 2)} 頁)
          </span>
        </div>

        {/* 右側按鈕 */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={templateDataHistory.length === 0}
            className="gap-1.5"
            title="復原 (Ctrl+Z)"
          >
            <Undo2 size={14} />
            復原
            {templateDataHistory.length > 0 && (
              <span className="text-xs text-morandi-muted">({templateDataHistory.length})</span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="gap-1.5"
          >
            {isSavingDraft ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileText size={14} />
            )}
            {isSavingDraft ? '儲存中...' : '儲存草稿'}
            {lastSavedAt && !isSavingDraft && (
              <span className="text-xs text-morandi-muted">
                ({lastSavedAt.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })})
              </span>
            )}
          </Button>
          <Button
            size="sm"
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
            onClick={handleOpenPrintPreview}
            disabled={isGeneratingPrint}
          >
            {isGeneratingPrint ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileImage size={16} />
            )}
            {isGeneratingPrint ? '生成中...' : '列印 / PDF'}
          </Button>
        </div>
      </header>

      {/* 頁面導航抽屜 */}
      {showPageDrawer && (
        <div className="fixed inset-0 z-50 flex">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
            onClick={() => setShowPageDrawer(false)}
          />
          {/* 抽屜內容 */}
          <div className="relative w-[320px] h-full bg-card shadow-2xl flex flex-col animate-in slide-in-from-left duration-200 ml-16">
            {/* 抽屜標題 */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List size={18} className="text-morandi-gold" />
                <h3 className="font-bold text-morandi-primary">頁面導覽</h3>
              </div>
              <button
                onClick={() => setShowPageDrawer(false)}
                className="p-1.5 rounded-lg hover:bg-morandi-container text-morandi-secondary hover:text-morandi-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 頁面列表 */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* 基本頁面 */}
              <div>
                <h4 className="text-xs font-bold text-morandi-secondary uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
                  <Home size={12} />
                  基本頁面
                </h4>
                <div className="space-y-1">
                  <button
                    onClick={() => { handleSwitchPage('cover'); setShowPageDrawer(false) }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      currentPageType === 'cover'
                        ? 'bg-morandi-gold/10 text-morandi-gold font-medium'
                        : 'text-morandi-secondary hover:bg-morandi-container/50 hover:text-morandi-primary'
                    )}
                  >
                    <span className="w-6 h-6 rounded bg-morandi-container/70 flex items-center justify-center text-xs font-bold">1</span>
                    封面
                    {currentPageType === 'cover' && <Check size={14} className="ml-auto" />}
                  </button>
                  <button
                    onClick={() => { handleSwitchPage('toc'); setShowPageDrawer(false) }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      currentPageType === 'toc'
                        ? 'bg-morandi-gold/10 text-morandi-gold font-medium'
                        : 'text-morandi-secondary hover:bg-morandi-container/50 hover:text-morandi-primary'
                    )}
                  >
                    <span className="w-6 h-6 rounded bg-morandi-container/70 flex items-center justify-center text-xs font-bold">2</span>
                    目錄
                    {currentPageType === 'toc' && <Check size={14} className="ml-auto" />}
                  </button>
                  <button
                    onClick={() => { handleSwitchPage('itinerary'); setShowPageDrawer(false) }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      currentPageType === 'itinerary'
                        ? 'bg-morandi-gold/10 text-morandi-gold font-medium'
                        : 'text-morandi-secondary hover:bg-morandi-container/50 hover:text-morandi-primary'
                    )}
                  >
                    <span className="w-6 h-6 rounded bg-morandi-container/70 flex items-center justify-center text-xs font-bold">3</span>
                    行程總覽
                    {currentPageType === 'itinerary' && <Check size={14} className="ml-auto" />}
                  </button>
                </div>
              </div>

              {/* 每日行程 */}
              <div>
                <h4 className="text-xs font-bold text-morandi-secondary uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
                  <Calendar size={12} />
                  每日行程
                  <span className="ml-auto text-morandi-muted font-normal normal-case">{tripDays} 天</span>
                </h4>
                <div className="space-y-1">
                  {Array.from({ length: tripDays }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => { handleSwitchPage(`daily-${i}` as PageType); setShowPageDrawer(false) }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                        currentPageType === `daily-${i}`
                          ? 'bg-morandi-gold/10 text-morandi-gold font-medium'
                          : 'text-morandi-secondary hover:bg-morandi-container/50 hover:text-morandi-primary'
                      )}
                    >
                      <span className="w-6 h-6 rounded bg-morandi-container/70 flex items-center justify-center text-xs font-bold">{4 + i}</span>
                      Day {i + 1}
                      {templateData?.dailyDetails?.[i]?.title && (
                        <span className="text-xs text-morandi-muted truncate max-w-[120px]">
                          {templateData.dailyDetails[i].title}
                        </span>
                      )}
                      {currentPageType === `daily-${i}` && <Check size={14} className="ml-auto" />}
                    </button>
                  ))}
                </div>
                {/* 天數調整按鈕 */}
                <div className="flex items-center gap-2 mt-2 px-2">
                  <button
                    onClick={() => setTripDays(Math.max(1, tripDays - 1))}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded border border-border text-xs text-morandi-secondary hover:bg-morandi-container/50 hover:text-morandi-primary transition-colors"
                  >
                    <Minus size={12} />
                    減少天數
                  </button>
                  <button
                    onClick={() => setTripDays(Math.min(10, tripDays + 1))}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded border border-border text-xs text-morandi-secondary hover:bg-morandi-container/50 hover:text-morandi-primary transition-colors"
                  >
                    <Plus size={12} />
                    增加天數
                  </button>
                </div>
              </div>

              {/* 景點介紹 */}
              <div>
                <h4 className="text-xs font-bold text-morandi-secondary uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
                  <ImageIcon size={12} />
                  景點介紹
                  {attractions.length > 0 && <span className="ml-auto text-morandi-muted font-normal normal-case">{attractions.length} 個</span>}
                </h4>
                <div className="space-y-1">
                  {attractions.length > 0 ? (
                    <>
                      {/* 按頁面分組顯示景點 */}
                      {Array.from({ length: Math.ceil(attractions.length / 2) }, (_, pageIdx) => (
                        <button
                          key={`attraction-page-${pageIdx}`}
                          onClick={() => { setCurrentPageType(`attraction-${pageIdx}`); setShowPageDrawer(false) }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            currentPageType === `attraction-${pageIdx}`
                              ? 'bg-morandi-gold/10 text-morandi-gold font-medium'
                              : 'text-morandi-secondary hover:bg-morandi-container/50 hover:text-morandi-primary'
                          }`}
                        >
                          <span className="w-6 h-6 rounded bg-morandi-container/70 flex items-center justify-center text-xs font-bold">
                            {4 + tripDays + pageIdx}
                          </span>
                          <ImageIcon size={14} />
                          景點 {pageIdx * 2 + 1}{attractions[pageIdx * 2 + 1] ? ` - ${pageIdx * 2 + 2}` : ''}
                          {currentPageType === `attraction-${pageIdx}` && <Check size={14} className="ml-auto" />}
                        </button>
                      ))}
                    </>
                  ) : (
                    <p className="text-xs text-morandi-muted px-3 py-2">尚未新增景點</p>
                  )}
                </div>
                <button
                  onClick={handleAddAttraction}
                  className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 rounded-lg border border-dashed border-morandi-gold/50 text-xs text-morandi-gold hover:bg-morandi-gold/5 transition-colors"
                >
                  <Plus size={12} />
                  新增景點
                </button>
              </div>

              {/* 飯店介紹 */}
              <div>
                <h4 className="text-xs font-bold text-morandi-secondary uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
                  <Hotel size={12} />
                  飯店介紹
                  {hotels.length > 0 && <span className="ml-auto text-morandi-muted font-normal normal-case">{hotels.length} 間</span>}
                </h4>
                <div className="space-y-1">
                  {hotels.length > 0 ? (
                    <>
                      {hotels.map((hotel, i) => (
                        <button
                          key={`hotel-${i}`}
                          onClick={() => { handleSwitchPage(`hotel-${i}` as PageType); setShowPageDrawer(false) }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                            currentPageType === `hotel-${i}`
                              ? 'bg-morandi-gold/10 text-morandi-gold font-medium'
                              : 'text-morandi-secondary hover:bg-morandi-container/50 hover:text-morandi-primary'
                          )}
                        >
                          <span className="w-6 h-6 rounded bg-morandi-container/70 flex items-center justify-center text-xs font-bold">
                            {4 + tripDays + Math.ceil(attractions.length / 2) + i}
                          </span>
                          <Hotel size={14} />
                          {hotel.nameZh || `飯店 ${i + 1}`}
                          {currentPageType === `hotel-${i}` && <Check size={14} className="ml-auto" />}
                        </button>
                      ))}
                    </>
                  ) : (
                    <p className="text-xs text-morandi-muted px-3 py-2">尚未新增飯店</p>
                  )}
                </div>
                <button
                  onClick={handleAddHotel}
                  className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 rounded-lg border border-dashed border-morandi-gold/50 text-xs text-morandi-gold hover:bg-morandi-gold/5 transition-colors"
                >
                  <Plus size={12} />
                  新增飯店
                </button>
              </div>

              {/* 備忘錄 */}
              <div>
                <h4 className="text-xs font-bold text-morandi-secondary uppercase tracking-wider px-2 mb-2 flex items-center gap-2">
                  <ClipboardList size={12} />
                  旅遊提醒
                  {memoPageCount > 0 && <span className="ml-auto text-morandi-muted font-normal normal-case">{memoPageCount} 頁</span>}
                </h4>
                <div className="space-y-1">
                  {memoPageCount > 0 ? (
                    <>
                      {Array.from({ length: memoPageCount }, (_, i) => (
                        <button
                          key={`memo-${i}`}
                          onClick={() => { handleSwitchPage(`memo-${i}` as PageType); setShowPageDrawer(false) }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                            currentPageType === `memo-${i}`
                              ? 'bg-morandi-gold/10 text-morandi-gold font-medium'
                              : 'text-morandi-secondary hover:bg-morandi-container/50 hover:text-morandi-primary'
                          )}
                        >
                          <span className="w-6 h-6 rounded bg-morandi-container/70 flex items-center justify-center text-xs font-bold">
                            {4 + tripDays + hotels.length + Math.ceil(attractions.length / 2) + i}
                          </span>
                          <ClipboardList size={14} />
                          {i === memoPageCount - 1 && memoSettings?.seasons?.some(s => s.enabled)
                            ? '天氣資訊'
                            : `提醒 ${i + 1}`}
                          {currentPageType === `memo-${i}` && <Check size={14} className="ml-auto" />}
                        </button>
                      ))}
                      <button
                        onClick={() => { handleRemoveMemo(); setShowPageDrawer(false) }}
                        className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 rounded-lg border border-dashed border-morandi-red/50 text-xs text-morandi-red hover:bg-morandi-red/5 transition-colors"
                      >
                        <Minus size={12} />
                        移除備忘錄
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-morandi-muted px-3 py-2">尚未新增備忘錄</p>
                      <div className="px-2 space-y-1">
                        <p className="text-xs text-morandi-secondary mb-2">選擇旅遊目的地：</p>
                        {(['JP', 'TH', 'KR', 'VN', 'OTHER'] as CountryCode[]).map((code) => (
                          <button
                            key={code}
                            onClick={() => { handleAddMemo(code); setShowPageDrawer(false) }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-morandi-secondary hover:bg-morandi-container/50 hover:text-morandi-primary transition-colors"
                          >
                            <Globe size={14} />
                            {countryNames[code]}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 抽屜底部 */}
            <div className="p-3 border-t border-border bg-morandi-container/20">
              <p className="text-xs text-morandi-muted text-center">
                點擊頁面切換，點擊外部關閉
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 主內容區 - 左側屬性，右側預覽 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側：屬性面板 */}
        <aside className="w-[320px] flex-none overflow-y-auto border-r border-border bg-background" style={{ contain: 'layout style' }}>
          {/* 目錄專屬欄位 */}
          {currentPageType === 'toc' && (
            <CollapsiblePanel title="目錄內容" icon={List} defaultOpen>
              <div className="p-3 bg-morandi-container/30 rounded-lg">
                <p className="text-xs text-morandi-secondary mb-2">
                  目錄會自動根據手冊內容生成：
                </p>
                <ul className="text-xs text-morandi-secondary space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-morandi-gold" />
                    行程總覽（航班、集合資訊）
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-morandi-gold" />
                    每日行程（共 {tripDays} 天）
                  </li>
                  {hotels.length > 0 && (
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-morandi-gold" />
                      住宿介紹（共 {hotels.length} 間）
                    </li>
                  )}
                  {memoSettings && (
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-morandi-gold" />
                      旅遊提醒（共 {memoPageCount} 頁）
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-morandi-gold" />
                    旅行筆記
                  </li>
                </ul>
              </div>
              <p className="text-[10px] text-morandi-muted mt-2">
                頁碼會根據各章節的頁數自動計算
              </p>
            </CollapsiblePanel>
          )}

          {/* 封面專屬欄位 */}
          {currentPageType === 'cover' && (
            <CollapsiblePanel title="封面設定" icon={Home} defaultOpen maxHeight={500}>
              <div className="space-y-4">
                {/* 封面圖片 */}
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-morandi-primary">封面圖片</span>
                  {templateData?.coverImage ? (
                    <div className="relative group">
                      <img
                        src={templateData.coverImage}
                        alt="封面圖片"
                        className="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <button
                          onClick={handleCoverUpload}
                          className="px-2 py-1 bg-card rounded text-xs font-medium text-morandi-primary"
                        >
                          更換
                        </button>
                        <button
                          onClick={() => {
                            const newData = { ...templateData, coverImage: undefined }
                            setTemplateData(newData)
                            const style = styleSeries.find((s) => s.id === selectedStyleId)
                            if (style) {
                              setPages((prev) => ({
                                ...prev,
                                cover: generatePageFromTemplate(style.templates.cover, newData),
                                toc: generatePageFromTemplate(style.templates.toc, newData),
                              }))
                            }
                          }}
                          className="px-2 py-1 bg-morandi-red text-white rounded text-xs font-medium"
                        >
                          移除
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={handleCoverUpload}
                      className="group flex items-center justify-center w-full h-24 border border-dashed border-border rounded-lg hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col items-center">
                        <ImageIcon size={20} className="text-morandi-secondary mb-1 group-hover:text-morandi-gold" />
                        <p className="text-xs text-morandi-secondary">點擊上傳封面圖片</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 公司名稱 */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-morandi-primary">公司名稱</span>
                  <input
                    type="text"
                    value={templateData?.companyName || ''}
                    onChange={(e) => handleTemplateDataChange('companyName', e.target.value)}
                    placeholder="例：Corner Travel"
                    className="w-full px-2 py-1.5 rounded border border-border bg-background focus:ring-1 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-xs"
                  />
                </label>

                {/* 目的地 */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-morandi-primary">目的地</span>
                  <input
                    type="text"
                    value={templateData?.destination || ''}
                    onChange={(e) => handleTemplateDataChange('destination', e.target.value)}
                    placeholder="例：京都, 日本"
                    className="w-full px-2 py-1.5 rounded border border-border bg-background focus:ring-1 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-xs"
                  />
                </label>

                {/* 主標題 */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-morandi-primary">主標題</span>
                  <input
                    type="text"
                    value={templateData?.mainTitle || ''}
                    onChange={(e) => handleTemplateDataChange('mainTitle', e.target.value)}
                    placeholder="例：春日京阪遊"
                    className="w-full px-2 py-1.5 rounded border border-border bg-background focus:ring-1 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-xs"
                  />
                </label>

                {/* 副標題 */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-morandi-primary">副標題</span>
                  <input
                    type="text"
                    value={templateData?.subtitle || ''}
                    onChange={(e) => handleTemplateDataChange('subtitle', e.target.value)}
                    placeholder="例：Travel Handbook"
                    className="w-full px-2 py-1.5 rounded border border-border bg-background focus:ring-1 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-xs"
                  />
                </label>

                {/* 旅遊日期 */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-morandi-primary">旅遊日期</span>
                  <input
                    type="text"
                    value={templateData?.travelDates || ''}
                    onChange={(e) => handleTemplateDataChange('travelDates', e.target.value)}
                    placeholder="例：2024/04/10 - 2024/04/15"
                    className="w-full px-2 py-1.5 rounded border border-border bg-background focus:ring-1 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-xs"
                  />
                </label>

                {/* 團號 */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-morandi-primary">團號</span>
                  <input
                    type="text"
                    value={templateData?.tourCode || ''}
                    onChange={(e) => handleTemplateDataChange('tourCode', e.target.value)}
                    placeholder="例：KIX240410A"
                    className="w-full px-2 py-1.5 rounded border border-border bg-background focus:ring-1 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-xs"
                  />
                </label>
              </div>
            </CollapsiblePanel>
          )}

          {/* 行程總覽專屬欄位 */}
          {currentPageType === 'itinerary' && (
            <CollapsiblePanel title="集合資訊" icon={Calendar} defaultOpen>
              <div className="space-y-3">
                {/* 集合時間 */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-morandi-primary">集合時間</span>
                  <input
                    type="text"
                    value={templateData?.meetingTime || ''}
                    onChange={(e) => handleTemplateDataChange('meetingTime', e.target.value)}
                    placeholder="例：07:30"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:ring-1 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-xs"
                  />
                </label>

                {/* 集合地點 */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-morandi-primary">集合地點</span>
                  <input
                    type="text"
                    value={templateData?.meetingPlace || ''}
                    onChange={(e) => handleTemplateDataChange('meetingPlace', e.target.value)}
                    placeholder="例：桃園機場第二航廈"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:ring-1 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-xs"
                  />
                </label>
              </div>
            </CollapsiblePanel>
          )}

          {/* 領隊資訊 */}
          {currentPageType === 'itinerary' && (
            <CollapsiblePanel title="領隊資訊" icon={Type}>
              <div className="space-y-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-morandi-primary">領隊姓名</span>
                  <input
                    type="text"
                    value={templateData?.leaderName || ''}
                    onChange={(e) => handleTemplateDataChange('leaderName', e.target.value)}
                    placeholder="例：王小明"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:ring-1 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-xs"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-morandi-primary">領隊電話</span>
                  <input
                    type="text"
                    value={templateData?.leaderPhone || ''}
                    onChange={(e) => handleTemplateDataChange('leaderPhone', e.target.value)}
                    placeholder="例：0912-345-678"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:ring-1 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-xs"
                  />
                </label>
              </div>
            </CollapsiblePanel>
          )}

          {/* 航班資訊 */}
          {currentPageType === 'itinerary' && (
            <CollapsiblePanel title="航班資訊" icon={FileText}>
              <div className="space-y-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-morandi-primary">去程航班</span>
                  <input
                    type="text"
                    value={templateData?.outboundFlight || ''}
                    onChange={(e) => handleTemplateDataChange('outboundFlight', e.target.value)}
                    placeholder="例：JL802 08:40 (TPE) ▶ 12:10 (KIX)"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:ring-1 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-xs"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-morandi-primary">回程航班</span>
                  <input
                    type="text"
                    value={templateData?.returnFlight || ''}
                    onChange={(e) => handleTemplateDataChange('returnFlight', e.target.value)}
                    placeholder="例：JL805 18:20 (KIX) ▶ 20:30 (TPE)"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:ring-1 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-xs"
                  />
                </label>
              </div>
            </CollapsiblePanel>
          )}

          {/* 每日行程編輯 */}
          {currentPageType === 'itinerary' && (
            <CollapsiblePanel title="每日行程" icon={List} badge={tripDays} defaultOpen>
              {Array.from({ length: 5 }, (_, i) => {
                const dayData = templateData?.dailyItineraries?.[i] || {
                  dayNumber: i + 1,
                  title: '',
                  meals: { breakfast: '', lunch: '', dinner: '' },
                  mealIcons: {},
                  accommodation: '',
                }
                const isExpanded = expandedDays.includes(i)
                return (
                  <div key={i} className="border border-border rounded-lg overflow-hidden">
                    {/* 天數標題（可展開） */}
                    <button
                      onClick={() => setExpandedDays(prev =>
                        prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
                      )}
                      className="w-full flex items-center justify-between px-3 py-2 bg-morandi-container/30 hover:bg-morandi-container/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-morandi-primary">Day {i + 1}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {/* 展開內容 */}
                    {isExpanded && (
                      <div className="p-3 space-y-3">
                        {/* 行程標題 */}
                        <input
                          type="text"
                          value={dayData.title || ''}
                          onChange={(e) => handleDailyItineraryChange(i, 'title', e.target.value)}
                          placeholder="行程標題"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-xs"
                        />
                        {/* 餐食 */}
                        <div className="space-y-2">
                          {/* 早餐 */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-morandi-secondary w-8 flex-shrink-0">早餐</span>
                            <select
                              value={dayData.mealIcons?.breakfast || ''}
                              onChange={(e) => handleDailyItineraryChange(i, 'breakfastIcon', e.target.value)}
                              className="w-20 px-1 py-1 rounded border border-border bg-card text-xs"
                            >
                              <option value="">自動</option>
                              {MEAL_ICON_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={dayData.meals?.breakfast || ''}
                              onChange={(e) => handleDailyItineraryChange(i, 'breakfast', e.target.value)}
                              placeholder="飯店內"
                              className="flex-1 px-2 py-1 rounded border border-border bg-card focus:ring-1 focus:ring-morandi-gold/50 outline-none text-xs"
                            />
                          </div>
                          {/* 午餐 */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-morandi-secondary w-8 flex-shrink-0">午餐</span>
                            <select
                              value={dayData.mealIcons?.lunch || ''}
                              onChange={(e) => handleDailyItineraryChange(i, 'lunchIcon', e.target.value)}
                              className="w-20 px-1 py-1 rounded border border-border bg-card text-xs"
                            >
                              <option value="">自動</option>
                              {MEAL_ICON_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={dayData.meals?.lunch || ''}
                              onChange={(e) => handleDailyItineraryChange(i, 'lunch', e.target.value)}
                              placeholder="自理"
                              className="flex-1 px-2 py-1 rounded border border-border bg-card focus:ring-1 focus:ring-morandi-gold/50 outline-none text-xs"
                            />
                          </div>
                          {/* 晚餐 */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-morandi-secondary w-8 flex-shrink-0">晚餐</span>
                            <select
                              value={dayData.mealIcons?.dinner || ''}
                              onChange={(e) => handleDailyItineraryChange(i, 'dinnerIcon', e.target.value)}
                              className="w-20 px-1 py-1 rounded border border-border bg-card text-xs"
                            >
                              <option value="">自動</option>
                              {MEAL_ICON_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={dayData.meals?.dinner || ''}
                              onChange={(e) => handleDailyItineraryChange(i, 'dinner', e.target.value)}
                              placeholder="自理"
                              className="flex-1 px-2 py-1 rounded border border-border bg-card focus:ring-1 focus:ring-morandi-gold/50 outline-none text-xs"
                            />
                          </div>
                        </div>
                        {/* 住宿 */}
                        <input
                          type="text"
                          value={dayData.accommodation || ''}
                          onChange={(e) => handleDailyItineraryChange(i, 'accommodation', e.target.value)}
                          placeholder="住宿飯店"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-xs"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </CollapsiblePanel>
          )}

          {/* 每日行程專屬欄位 */}
          {isDailyPage(currentPageType) && (() => {
            const dayIndex = getDayIndex(currentPageType)
            const dayDetail = templateData?.dailyDetails?.[dayIndex] || {
              dayNumber: dayIndex + 1,
              date: '',
              title: '',
              coverImage: undefined,
              timeline: [],
              meals: { breakfast: '', lunch: '', dinner: '' },
            }
            return (
              <>
                {/* 基本資訊 */}
                <CollapsiblePanel title="基本資訊" icon={Info} defaultOpen>
                  {/* 日期 */}
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-morandi-primary">日期</span>
                    <input
                      type="date"
                      value={dayDetail.date || ''}
                      onChange={(e) => handleDailyDetailChange(dayIndex, 'date', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-card focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-sm"
                    />
                  </label>

                  {/* 當日標題 */}
                  <label className="flex flex-col gap-1.5 mt-4">
                    <span className="text-sm font-medium text-morandi-primary">當日標題</span>
                    <input
                      type="text"
                      value={dayDetail.title || ''}
                      onChange={(e) => handleDailyDetailChange(dayIndex, 'title', e.target.value)}
                      placeholder="例：機場 → 市區觀光 → 飯店"
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-card focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-sm"
                    />
                  </label>
                </CollapsiblePanel>

                {/* 時間軸 */}
                <CollapsiblePanel
                  title="時間軸"
                  icon={Clock}
                  badge={dayDetail.timeline.length || undefined}
                  defaultOpen
                >
                  <div className="flex justify-end mb-3">
                    <button
                      onClick={() => handleAddTimelineItem(dayIndex)}
                      className="flex items-center gap-1 text-xs text-morandi-gold hover:text-morandi-gold-hover"
                    >
                      <Plus size={14} />
                      新增
                    </button>
                  </div>

                  {dayDetail.timeline.length === 0 ? (
                    <p className="text-sm text-morandi-secondary text-center py-4">
                      尚無時間軸項目，點擊上方「新增」按鈕開始
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {dayDetail.timeline.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          draggable
                          onDragStart={() => setDraggingTimelineItem({ dayIndex, itemIndex })}
                          onDragEnd={() => setDraggingTimelineItem(null)}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.add('bg-morandi-gold/20')
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('bg-morandi-gold/20')
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            e.currentTarget.classList.remove('bg-morandi-gold/20')
                            if (draggingTimelineItem && draggingTimelineItem.dayIndex === dayIndex) {
                              handleTimelineReorder(dayIndex, draggingTimelineItem.itemIndex, itemIndex)
                            }
                          }}
                          className={cn(
                            'flex items-start gap-2 p-2 bg-morandi-container/20 rounded-lg transition-colors cursor-move',
                            draggingTimelineItem?.dayIndex === dayIndex && draggingTimelineItem?.itemIndex === itemIndex && 'opacity-50'
                          )}
                        >
                          {/* 拖拉把手 */}
                          <div className="flex items-center justify-center w-5 h-7 text-morandi-muted hover:text-morandi-secondary cursor-grab active:cursor-grabbing">
                            <GripVertical size={14} />
                          </div>
                          {/* 時間 */}
                          <input
                            type="text"
                            value={item.time || ''}
                            onChange={(e) => handleTimelineChange(dayIndex, itemIndex, 'time', e.target.value)}
                            placeholder="09:00"
                            className="w-14 px-2 py-1.5 rounded border border-border bg-card text-xs text-center"
                          />
                          {/* 活動 */}
                          <input
                            type="text"
                            value={item.activity || ''}
                            onChange={(e) => handleTimelineChange(dayIndex, itemIndex, 'activity', e.target.value)}
                            placeholder="活動內容"
                            className="flex-1 px-2 py-1.5 rounded border border-border bg-card text-xs"
                          />
                          {/* 重點標記 */}
                          <button
                            onClick={() => handleTimelineChange(dayIndex, itemIndex, 'isHighlight', !item.isHighlight)}
                            className={cn(
                              'p-1.5 rounded text-xs',
                              item.isHighlight
                                ? 'bg-morandi-gold text-white'
                                : 'bg-card border border-border text-morandi-secondary hover:border-morandi-gold'
                            )}
                            title="標記為重點"
                          >
                            ★
                          </button>
                          {/* 刪除 */}
                          <button
                            onClick={() => handleRemoveTimelineItem(dayIndex, itemIndex)}
                            className="p-1.5 rounded text-morandi-red hover:bg-morandi-red/10"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsiblePanel>

                {/* 餐食資訊 */}
                <CollapsiblePanel title="餐食資訊" icon={Utensils}>
                  <div className="space-y-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-morandi-primary">早餐</span>
                      <input
                        type="text"
                        value={dayDetail.meals.breakfast || ''}
                        onChange={(e) => handleDailyDetailChange(dayIndex, 'breakfast', e.target.value)}
                        placeholder="例：飯店內享用"
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-card focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-sm"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-morandi-primary">午餐</span>
                      <input
                        type="text"
                        value={dayDetail.meals.lunch || ''}
                        onChange={(e) => handleDailyDetailChange(dayIndex, 'lunch', e.target.value)}
                        placeholder="例：當地特色餐廳"
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-card focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-sm"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-morandi-primary">晚餐</span>
                      <input
                        type="text"
                        value={dayDetail.meals.dinner || ''}
                        onChange={(e) => handleDailyDetailChange(dayIndex, 'dinner', e.target.value)}
                        placeholder="例：自理"
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-card focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold outline-none transition-all text-sm"
                      />
                    </label>
                  </div>
                </CollapsiblePanel>

                {/* 當日封面圖片 */}
                <CollapsiblePanel title="當日封面圖片" icon={ImageIcon}>
                  {dayDetail.coverImage ? (
                    <div className="relative">
                      <img
                        src={dayDetail.coverImage}
                        alt={`Day ${dayIndex + 1} 封面`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleDailyDetailChange(dayIndex, 'coverImage', '')}
                        className="absolute top-2 right-2 p-1 bg-card rounded-full shadow hover:bg-morandi-red hover:text-white"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleDailyCoverUpload(dayIndex)}
                      className="group relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <ImageIcon size={24} className="text-morandi-secondary mb-2 group-hover:text-morandi-gold transition-colors" />
                        <p className="text-sm text-morandi-secondary">
                          <span className="font-semibold text-morandi-gold">點擊上傳</span>
                        </p>
                        <p className="text-xs text-morandi-muted mt-1">PNG, JPG (最大 5MB)</p>
                      </div>
                    </div>
                  )}
                </CollapsiblePanel>
              </>
            )
          })()}

          {/* 備忘錄專屬欄位 */}
          {isMemoPage(currentPageType) && memoSettings && (() => {
            const pageIndex = getMemoPageIndex(currentPageType)
            const { items: pageItems, isWeatherPage } = getMemoItemsForPage(memoSettings, pageIndex)

            return (
              <>
                {/* 國家選擇 */}
                <CollapsiblePanel title={memoSettings.title} icon={Globe} defaultOpen>
                  <div className="flex items-center gap-2 p-3 bg-morandi-container/30 rounded-lg">
                    <Globe size={16} className="text-morandi-gold" />
                    <span className="text-sm font-medium text-morandi-primary">
                      {countryNames[selectedCountryCode]}
                    </span>
                    <button
                      onClick={handleRemoveMemo}
                      className="ml-auto text-xs text-morandi-red hover:underline"
                    >
                      移除備忘錄
                    </button>
                  </div>
                </CollapsiblePanel>

                {/* 當前頁面內容提示 */}
                <CollapsiblePanel
                  title={isWeatherPage ? '天氣與資訊' : `提醒項目 (頁 ${pageIndex + 1})`}
                  icon={isWeatherPage ? Cloud : ClipboardList}
                  badge={isWeatherPage ? undefined : pageItems.length}
                  defaultOpen
                >
                  {isWeatherPage ? (
                    <p className="text-sm text-morandi-secondary">
                      此頁顯示季節天氣資訊與緊急聯絡方式
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {pageItems.map((item, i) => (
                        <div key={item.id} className="flex items-start gap-2 p-2 bg-morandi-container/20 rounded">
                          <span className="text-xs text-morandi-gold">{i + 1}.</span>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-morandi-primary">{item.titleZh || item.title}</p>
                            <p className="text-[10px] text-morandi-secondary line-clamp-2">{item.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsiblePanel>

                {/* 項目選擇（禮儀類） */}
                <CollapsiblePanel
                  title="禮儀提醒"
                  icon={Check}
                  badge={memoSettings.items.filter((item) => item.category === 'etiquette' && item.enabled).length || undefined}
                >
                  <div className="space-y-2">
                    {memoSettings.items
                      .filter((item) => item.category === 'etiquette')
                      .map((item) => (
                        <label
                          key={item.id}
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-morandi-container/30 cursor-pointer"
                        >
                          <button
                            onClick={() => handleToggleMemoItem(item.id)}
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5',
                              item.enabled
                                ? 'bg-morandi-gold border-morandi-gold text-white'
                                : 'border-border'
                            )}
                          >
                            {item.enabled && <Check size={10} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-morandi-primary truncate">
                              {item.titleZh || item.title}
                            </p>
                          </div>
                        </label>
                      ))}
                  </div>
                </CollapsiblePanel>

                {/* 項目選擇（航班類） */}
                <CollapsiblePanel
                  title="航班行李"
                  icon={Plane}
                  badge={memoSettings.items.filter((item) => item.category === 'flight' && item.enabled).length || undefined}
                >
                  <div className="space-y-2">
                    {memoSettings.items
                      .filter((item) => item.category === 'flight')
                      .map((item) => (
                        <label
                          key={item.id}
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-morandi-container/30 cursor-pointer"
                        >
                          <button
                            onClick={() => handleToggleMemoItem(item.id)}
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5',
                              item.enabled
                                ? 'bg-morandi-gold border-morandi-gold text-white'
                                : 'border-border'
                            )}
                          >
                            {item.enabled && <Check size={10} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-morandi-primary truncate">
                              {item.titleZh || item.title}
                            </p>
                          </div>
                        </label>
                      ))}
                  </div>
                </CollapsiblePanel>

                {/* 季節選擇 */}
                {memoSettings.seasons && memoSettings.seasons.length > 0 && (
                  <CollapsiblePanel
                    title="季節天氣"
                    icon={Sun}
                    badge={memoSettings.seasons.filter((s) => s.enabled).length || undefined}
                  >
                    <div className="space-y-2">
                      {memoSettings.seasons.map((season) => (
                        <label
                          key={season.season}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-morandi-container/30 cursor-pointer"
                        >
                          <button
                            onClick={() => handleToggleSeason(season.season)}
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                              season.enabled
                                ? 'bg-morandi-gold border-morandi-gold text-white'
                                : 'border-border'
                            )}
                          >
                            {season.enabled && <Check size={10} />}
                          </button>
                          <span className="text-sm text-morandi-primary">
                            {season.season === 'spring' && '🌸 春季'}
                            {season.season === 'summer' && '☀️ 夏季'}
                            {season.season === 'autumn' && '🍂 秋季'}
                            {season.season === 'winter' && '❄️ 冬季'}
                            <span className="text-xs text-morandi-secondary ml-1">({season.months})</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </CollapsiblePanel>
                )}

                {/* 資訊項目選擇 */}
                {memoSettings.infoItems && memoSettings.infoItems.length > 0 && (
                  <CollapsiblePanel
                    title="額外資訊"
                    icon={Info}
                    badge={memoSettings.infoItems.filter((i) => i.enabled).length || undefined}
                  >
                    <div className="space-y-2">
                      {memoSettings.infoItems.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-morandi-container/30 cursor-pointer"
                        >
                          <button
                            onClick={() => handleToggleInfoItem(item.id)}
                            className={cn(
                              'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                              item.enabled
                                ? 'bg-morandi-gold border-morandi-gold text-white'
                                : 'border-border'
                            )}
                          >
                            {item.enabled && <Check size={10} />}
                          </button>
                          <span className="text-sm text-morandi-primary">{item.title}</span>
                        </label>
                      ))}
                    </div>
                  </CollapsiblePanel>
                )}

                {/* 頁數提示 */}
                <div className="p-3 bg-morandi-container/30 rounded-lg">
                  <p className="text-xs text-morandi-secondary">
                    已啟用 {memoSettings.items.filter((i) => i.enabled).length} 個提醒項目，
                    共 {memoPageCount} 頁
                  </p>
                </div>
              </>
            )
          })()}

          {/* 飯店介紹專屬欄位 */}
          {isHotelPage(currentPageType) && (() => {
            const hotelIndex = getHotelIndex(currentPageType)
            const hotel = hotels[hotelIndex]

            if (!hotel) return null

            return (
              <>
                <CollapsiblePanel title="飯店資訊" icon={Hotel} defaultOpen>
                  <div className="space-y-4">
                    {/* 飯店主圖 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-morandi-primary">主圖</label>
                      {hotel.image ? (
                        <div className="relative group">
                          <img
                            src={hotel.image}
                            alt="飯店主圖"
                            className="w-full h-32 object-cover rounded-lg border border-border"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            <button
                              onClick={() => hotelCoverInputRef.current?.click()}
                              className="px-3 py-1.5 bg-card rounded text-sm font-medium text-morandi-primary"
                            >
                              更換
                            </button>
                            <button
                              onClick={() => handleUpdateHotel(hotelIndex, 'image', undefined)}
                              className="px-3 py-1.5 bg-morandi-red text-white rounded text-sm font-medium"
                            >
                              移除
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => hotelCoverInputRef.current?.click()}
                          disabled={uploadingHotelIndex === hotelIndex}
                          className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors"
                        >
                          {uploadingHotelIndex === hotelIndex ? (
                            <Loader2 size={24} className="animate-spin text-morandi-gold" />
                          ) : (
                            <>
                              <ImageIcon size={24} className="text-morandi-secondary" />
                              <span className="text-sm text-morandi-secondary">點擊上傳飯店圖片</span>
                            </>
                          )}
                        </button>
                      )}
                      <input
                        ref={hotelCoverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleHotelImageUpload(e, hotelIndex)}
                      />
                    </div>

                    {/* 飯店中文名稱 */}
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-morandi-primary">中文名稱</span>
                      <input
                        type="text"
                        value={hotel.nameZh || ''}
                        onChange={(e) => handleUpdateHotel(hotelIndex, 'nameZh', e.target.value)}
                        className="rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-morandi-gold outline-none"
                        placeholder="例：星野集團 界 由布院"
                      />
                    </label>

                    {/* 飯店英文名稱 */}
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-morandi-primary">英文名稱</span>
                      <input
                        type="text"
                        value={hotel.nameEn || ''}
                        onChange={(e) => handleUpdateHotel(hotelIndex, 'nameEn', e.target.value)}
                        className="rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-morandi-gold outline-none"
                        placeholder="例：Hoshino Resorts KAI Yufuin"
                      />
                    </label>

                    {/* 地點 */}
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-morandi-primary">地點</span>
                      <input
                        type="text"
                        value={hotel.location || ''}
                        onChange={(e) => handleUpdateHotel(hotelIndex, 'location', e.target.value)}
                        className="rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-morandi-gold outline-none"
                        placeholder="例：大分縣由布市湯布院町川上"
                      />
                    </label>

                    {/* 描述 */}
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-morandi-primary">特色描述</span>
                      <textarea
                        value={hotel.description || ''}
                        onChange={(e) => handleUpdateHotel(hotelIndex, 'description', e.target.value)}
                        className="rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-morandi-gold outline-none resize-none"
                        rows={4}
                        placeholder="輸入飯店特色與描述..."
                      />
                    </label>

                    {/* 標籤 */}
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-morandi-primary">設施標籤</span>
                      <input
                        type="text"
                        value={(hotel.tags || []).join('、')}
                        onChange={(e) => {
                          const tags = e.target.value.split(/[、,，]/).map((t) => t.trim()).filter(Boolean)
                          handleUpdateHotel(hotelIndex, 'tags', tags)
                        }}
                        className="rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-morandi-gold outline-none"
                        placeholder="以頓號分隔，如：露天溫泉、懷石料理、隈研吾設計"
                      />
                      <p className="text-xs text-morandi-secondary">用頓號（、）或逗號分隔多個標籤</p>
                    </label>
                  </div>
                </CollapsiblePanel>

                {/* 刪除飯店按鈕 */}
                <div className="pt-4 border-t border-border">
                  <button
                    onClick={() => handleRemoveHotel(hotelIndex)}
                    className="w-full px-4 py-2 text-sm text-morandi-red border border-morandi-red rounded-lg hover:bg-morandi-red hover:text-white transition-colors"
                  >
                    刪除此飯店頁面
                  </button>
                </div>
              </>
            )
          })()}

          {/* 景點介紹專屬欄位 */}
          {isAttractionPage(currentPageType) && (() => {
            const pageIndex = getAttractionPageIndex(currentPageType)
            // 取得這一頁的兩個景點（每頁2個）
            const attraction1Index = pageIndex * 2
            const attraction2Index = pageIndex * 2 + 1
            const attraction1 = attractions[attraction1Index]
            const attraction2 = attractions[attraction2Index]

            if (!attraction1) return null

            return (
              <>
                <CollapsiblePanel title={`景點 ${attraction1Index + 1}`} icon={MapPin} defaultOpen>
                  <div className="space-y-4">
                    {/* 景點1圖片 */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-morandi-primary">圖片</label>
                      {attraction1.image ? (
                        <div className="relative group">
                          <img
                            src={attraction1.image}
                            alt="景點圖片"
                            className="w-full h-24 object-cover rounded-lg border border-border"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                uploadingAttractionIndexRef.current = attraction1Index
                                setUploadingAttractionIndex(attraction1Index)
                                attractionImageInputRef.current?.click()
                              }}
                              className="px-2 py-1 bg-card rounded text-xs"
                            >
                              更換
                            </button>
                            <button
                              onClick={() => handleUpdateAttraction(attraction1Index, 'image', undefined)}
                              className="px-2 py-1 bg-morandi-red text-white rounded text-xs"
                            >
                              移除
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            uploadingAttractionIndexRef.current = attraction1Index
                            setUploadingAttractionIndex(attraction1Index)
                            attractionImageInputRef.current?.click()
                          }}
                          className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-morandi-gold transition-colors"
                        >
                          {uploadingAttractionIndex === attraction1Index ? (
                            <Loader2 size={24} className="animate-spin text-morandi-gold" />
                          ) : (
                            <>
                              <ImageIcon size={24} className="text-morandi-secondary" />
                              <span className="text-xs text-morandi-secondary mt-1">點擊上傳圖片</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* 景點1中文名稱 */}
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-morandi-primary">中文名稱</span>
                      <input
                        type="text"
                        value={attraction1.nameZh || ''}
                        onChange={(e) => handleUpdateAttraction(attraction1Index, 'nameZh', e.target.value)}
                        className="rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-morandi-gold outline-none"
                        placeholder="例：金閣寺"
                      />
                    </label>

                    {/* 景點1英文名稱 */}
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-morandi-primary">英文名稱</span>
                      <input
                        type="text"
                        value={attraction1.nameEn || ''}
                        onChange={(e) => handleUpdateAttraction(attraction1Index, 'nameEn', e.target.value)}
                        className="rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-morandi-gold outline-none"
                        placeholder="例：Kinkaku-ji"
                      />
                    </label>

                    {/* 景點1描述 */}
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-morandi-primary">介紹文字</span>
                      <textarea
                        value={attraction1.description || ''}
                        onChange={(e) => handleUpdateAttraction(attraction1Index, 'description', e.target.value)}
                        className="rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-morandi-gold outline-none resize-none"
                        rows={3}
                        placeholder="輸入景點介紹..."
                      />
                    </label>

                    {/* 刪除景點1按鈕 */}
                    <button
                      onClick={() => handleRemoveAttraction(attraction1Index)}
                      className="w-full px-3 py-1.5 text-xs text-morandi-red border border-morandi-red rounded-lg hover:bg-morandi-red hover:text-white transition-colors"
                    >
                      刪除此景點
                    </button>
                  </div>
                </CollapsiblePanel>

                {/* 景點2（如果存在） */}
                {attraction2 && (
                  <CollapsiblePanel title={`景點 ${attraction2Index + 1}`} icon={MapPin} defaultOpen>
                    <div className="space-y-4">
                      {/* 景點2圖片 */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-morandi-primary">圖片</label>
                        {attraction2.image ? (
                          <div className="relative group">
                            <img
                              src={attraction2.image}
                              alt="景點圖片"
                              className="w-full h-24 object-cover rounded-lg border border-border"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  uploadingAttractionIndexRef.current = attraction2Index
                                  setUploadingAttractionIndex(attraction2Index)
                                  attractionImageInputRef.current?.click()
                                }}
                                className="px-2 py-1 bg-card rounded text-xs"
                              >
                                更換
                              </button>
                              <button
                                onClick={() => handleUpdateAttraction(attraction2Index, 'image', undefined)}
                                className="px-2 py-1 bg-morandi-red text-white rounded text-xs"
                              >
                                移除
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              uploadingAttractionIndexRef.current = attraction2Index
                              setUploadingAttractionIndex(attraction2Index)
                              attractionImageInputRef.current?.click()
                            }}
                            className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-morandi-gold transition-colors"
                          >
                            {uploadingAttractionIndex === attraction2Index ? (
                              <Loader2 size={24} className="animate-spin text-morandi-gold" />
                            ) : (
                              <>
                                <ImageIcon size={24} className="text-morandi-secondary" />
                                <span className="text-xs text-morandi-secondary mt-1">點擊上傳圖片</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* 景點2中文名稱 */}
                      <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-morandi-primary">中文名稱</span>
                        <input
                          type="text"
                          value={attraction2.nameZh || ''}
                          onChange={(e) => handleUpdateAttraction(attraction2Index, 'nameZh', e.target.value)}
                          className="rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-morandi-gold outline-none"
                          placeholder="例：清水寺"
                        />
                      </label>

                      {/* 景點2英文名稱 */}
                      <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-morandi-primary">英文名稱</span>
                        <input
                          type="text"
                          value={attraction2.nameEn || ''}
                          onChange={(e) => handleUpdateAttraction(attraction2Index, 'nameEn', e.target.value)}
                          className="rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-morandi-gold outline-none"
                          placeholder="例：Kiyomizu-dera"
                        />
                      </label>

                      {/* 景點2描述 */}
                      <label className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-morandi-primary">介紹文字</span>
                        <textarea
                          value={attraction2.description || ''}
                          onChange={(e) => handleUpdateAttraction(attraction2Index, 'description', e.target.value)}
                          className="rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-morandi-gold outline-none resize-none"
                          rows={3}
                          placeholder="輸入景點介紹..."
                        />
                      </label>

                      {/* 刪除景點2按鈕 */}
                      <button
                        onClick={() => handleRemoveAttraction(attraction2Index)}
                        className="w-full px-3 py-1.5 text-xs text-morandi-red border border-morandi-red rounded-lg hover:bg-morandi-red hover:text-white transition-colors"
                      >
                        刪除此景點
                      </button>
                    </div>
                  </CollapsiblePanel>
                )}

                {/* 景點圖片上傳 input */}
                <input
                  ref={attractionImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    // 使用 ref 來避免 state race condition
                    const index = uploadingAttractionIndexRef.current
                    if (index !== null) {
                      handleAttractionImageUpload(e, index)
                    }
                  }}
                />
              </>
            )
          })()}
        </aside>

        {/* 中間：預覽區 */}
        <section className="flex-1 overflow-hidden bg-morandi-container/30 relative" style={{ contain: 'layout style' }}>
          {/* 背景點陣圖案 */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#181511 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* 可滾動的預覽容器 - 置中對齊 */}
          <div className="absolute inset-0 overflow-auto flex items-center justify-center p-8">
            {/* 縮放包裝器 */}
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                width: 559,
                height: 794,
                flexShrink: 0,
              }}
            >
              {/* A5 預覽 - 固定尺寸 559x794 */}
              <div
                className="relative bg-card shadow-xl rounded-sm"
                style={{
                  width: 559,
                  height: 794,
                }}
              >
                <canvas ref={canvasRef} />
              </div>
            </div>
          </div>

          {/* 縮放控制 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            <Button
              variant="outline"
              size="icon"
              className="bg-card shadow-lg"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            >
              <ZoomOut size={16} />
            </Button>
            <div className="h-10 px-4 bg-card rounded-lg shadow-lg border border-border flex items-center justify-center text-sm font-bold text-morandi-primary">
              {Math.round(zoom * 100)}%
            </div>
            <Button
              variant="outline"
              size="icon"
              className="bg-card shadow-lg"
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            >
              <ZoomIn size={16} />
            </Button>
          </div>
        </section>

        {/* 右側：圖層與屬性面板 */}
        <aside className="w-[280px] flex-none overflow-y-auto border-l border-border bg-background" style={{ contain: 'layout style' }}>
          {/* 圖層面板 */}
          <CollapsiblePanel
            title="圖層"
            icon={Layers}
            badge={page.elements.length}
            defaultOpen
          >
            <div className="space-y-1">
              {[...page.elements]
                .sort((a, b) => b.zIndex - a.zIndex)
                .map((el) => (
                  <div
                    key={el.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors',
                      selectedElementId === el.id
                        ? 'bg-morandi-gold/20 text-morandi-primary'
                        : 'hover:bg-morandi-container/50 text-morandi-secondary'
                    )}
                    onClick={() => setSelectedElementId(el.id)}
                  >
                    <span className="flex-1 truncate">{el.name}</span>
                    <button
                      className="p-1 hover:bg-card rounded"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleElementVisibility(el.id)
                      }}
                    >
                      {el.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button
                      className="p-1 hover:bg-card rounded"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleElementLock(el.id)
                      }}
                    >
                      {el.locked ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                  </div>
                ))}
            </div>
          </CollapsiblePanel>

          {/* 元素屬性面板（選取元素時顯示） */}
          {selectedElementId && (
            <CollapsiblePanel
              title="屬性"
              icon={Settings}
              defaultOpen
            >
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-morandi-secondary">ID</span>
                  <span className="text-morandi-primary font-mono truncate max-w-[120px]">{selectedElementId}</span>
                </div>
                {(() => {
                  const el = page.elements.find(e => e.id === selectedElementId)
                  if (!el) return null
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-morandi-secondary">類型</span>
                        <span className="text-morandi-primary">{el.type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-morandi-secondary">位置</span>
                        <span className="text-morandi-primary">{Math.round(el.x)}, {Math.round(el.y)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-morandi-secondary">尺寸</span>
                        <span className="text-morandi-primary">{Math.round(el.width)} x {Math.round(el.height)}</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </CollapsiblePanel>
          )}

          {/* 圖片調整面板（選取圖片元素時顯示） */}
          {selectedElementId && (() => {
            const el = page.elements.find(e => e.id === selectedElementId)
            if (!el || el.type !== 'image') return null
            const imageEl = el as import('@/features/designer/components/types').ImageElement
            return (
              <CollapsiblePanel
                title="圖片調整"
                icon={Image}
                defaultOpen
              >
                <div className="space-y-4">
                  {/* 位置調整按鈕 */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-morandi-muted font-semibold">
                      位置與縮放
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => setShowPositionEditor(true)}
                    >
                      <Move size={14} />
                      調整圖片位置
                    </Button>
                    {imageEl.position && imageEl.position.scale !== 1 && (
                      <p className="text-[10px] text-morandi-secondary text-center">
                        目前縮放: {Math.round(imageEl.position.scale * 100)}%
                      </p>
                    )}
                  </div>

                  {/* 色彩調整 */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-morandi-muted font-semibold">
                      色彩調整
                    </label>
                    <ImageAdjustmentsPanel
                      adjustments={imageEl.adjustments || DEFAULT_IMAGE_ADJUSTMENTS}
                      onChange={(newAdjustments) => {
                        updateElement(selectedElementId, { adjustments: newAdjustments })
                      }}
                    />
                  </div>
                </div>
              </CollapsiblePanel>
            )
          })()}

          {/* 文字編輯面板（選取文字元素時顯示） */}
          {selectedElementId && (() => {
            const el = page.elements.find(e => e.id === selectedElementId)
            if (!el || el.type !== 'text') return null
            const textEl = el as import('@/features/designer/components/types').TextElement
            return (
              <CollapsiblePanel
                title="文字編輯"
                icon={Type}
                defaultOpen
              >
                <div className="space-y-4">
                  {/* 文字內容 */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-morandi-muted font-semibold">
                      內容
                    </label>
                    <textarea
                      value={textEl.content}
                      onChange={(e) => updateElement(selectedElementId, { content: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-morandi-gold resize-none"
                      rows={3}
                    />
                  </div>

                  {/* 字型設定 */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] uppercase tracking-wider text-morandi-muted font-semibold">
                      字型
                    </h4>

                    {/* 字型選擇 */}
                    <div className="space-y-1">
                      <span className="text-xs text-morandi-secondary">字型</span>
                      <select
                        value={textEl.style.fontFamily}
                        onChange={(e) => updateElement(selectedElementId, {
                          style: { ...textEl.style, fontFamily: e.target.value }
                        })}
                        className="w-full px-2 py-1.5 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-morandi-gold"
                      >
                        <option value="Noto Sans TC">Noto Sans TC</option>
                        <option value="Noto Serif TC">Noto Serif TC</option>
                        <option value="Zen Old Mincho">Zen Old Mincho</option>
                      </select>
                    </div>

                    {/* 字級與粗細 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-xs text-morandi-secondary">字級</span>
                        <input
                          type="number"
                          value={textEl.style.fontSize}
                          onChange={(e) => updateElement(selectedElementId, {
                            style: { ...textEl.style, fontSize: Number(e.target.value) }
                          })}
                          className="w-full px-2 py-1.5 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-morandi-gold"
                          min={8}
                          max={200}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-morandi-secondary">粗細</span>
                        <select
                          value={textEl.style.fontWeight}
                          onChange={(e) => updateElement(selectedElementId, {
                            style: { ...textEl.style, fontWeight: e.target.value as 'normal' | 'bold' }
                          })}
                          className="w-full px-2 py-1.5 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-morandi-gold"
                        >
                          <option value="normal">正常</option>
                          <option value="bold">粗體</option>
                          <option value="300">細</option>
                          <option value="500">中</option>
                          <option value="700">粗</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 對齊與顏色 */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] uppercase tracking-wider text-morandi-muted font-semibold">
                      樣式
                    </h4>

                    {/* 對齊 */}
                    <div className="space-y-1">
                      <span className="text-xs text-morandi-secondary">對齊</span>
                      <div className="flex gap-1">
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <button
                            key={align}
                            onClick={() => updateElement(selectedElementId, {
                              style: { ...textEl.style, textAlign: align }
                            })}
                            className={cn(
                              'flex-1 py-1.5 text-xs rounded border transition-colors',
                              textEl.style.textAlign === align
                                ? 'bg-morandi-gold text-white border-morandi-gold'
                                : 'border-border hover:bg-morandi-container/50'
                            )}
                          >
                            {align === 'left' ? '左' : align === 'center' ? '中' : '右'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 顏色 */}
                    <div className="space-y-1">
                      <span className="text-xs text-morandi-secondary">顏色</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={textEl.style.color}
                          onChange={(e) => updateElement(selectedElementId, {
                            style: { ...textEl.style, color: e.target.value }
                          })}
                          className="w-8 h-8 rounded border border-border cursor-pointer"
                        />
                        <input
                          type="text"
                          value={textEl.style.color}
                          onChange={(e) => updateElement(selectedElementId, {
                            style: { ...textEl.style, color: e.target.value }
                          })}
                          className="flex-1 px-2 py-1.5 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-morandi-gold font-mono"
                        />
                      </div>
                    </div>

                    {/* 行高與字距 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-xs text-morandi-secondary">行高</span>
                        <input
                          type="number"
                          value={textEl.style.lineHeight}
                          onChange={(e) => updateElement(selectedElementId, {
                            style: { ...textEl.style, lineHeight: Number(e.target.value) }
                          })}
                          className="w-full px-2 py-1.5 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-morandi-gold"
                          step={0.1}
                          min={0.5}
                          max={3}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-morandi-secondary">字距</span>
                        <input
                          type="number"
                          value={textEl.style.letterSpacing}
                          onChange={(e) => updateElement(selectedElementId, {
                            style: { ...textEl.style, letterSpacing: Number(e.target.value) }
                          })}
                          className="w-full px-2 py-1.5 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-morandi-gold"
                          step={0.5}
                          min={-5}
                          max={20}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsiblePanel>
            )
          })()}

          {/* 快速操作面板 */}
          <CollapsiblePanel
            title="快速操作"
            icon={Palette}
          >
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={addTextElement}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:bg-morandi-container/50 transition-colors"
              >
                <Text size={16} className="text-morandi-secondary" />
                <span className="text-[10px] text-morandi-secondary">文字</span>
              </button>
              <button
                onClick={addRectangle}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:bg-morandi-container/50 transition-colors"
              >
                <Square size={16} className="text-morandi-secondary" />
                <span className="text-[10px] text-morandi-secondary">矩形</span>
              </button>
              <button
                onClick={addCircle}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:bg-morandi-container/50 transition-colors"
              >
                <Circle size={16} className="text-morandi-secondary" />
                <span className="text-[10px] text-morandi-secondary">圓形</span>
              </button>
              <button
                onClick={() => coverInputRef.current?.click()}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:bg-morandi-container/50 transition-colors"
              >
                <ImageIcon size={16} className="text-morandi-secondary" />
                <span className="text-[10px] text-morandi-secondary">圖片</span>
              </button>
            </div>
          </CollapsiblePanel>
        </aside>
      </div>

      {/* 圖片位置編輯器 */}
      {selectedElementId && showPositionEditor && (() => {
        const el = page?.elements.find(e => e.id === selectedElementId)
        if (!el || el.type !== 'image') return null
        const imageEl = el as import('@/features/designer/components/types').ImageElement
        return (
          <ImagePositionEditor
            open={showPositionEditor}
            onClose={() => setShowPositionEditor(false)}
            imageSrc={imageEl.src}
            currentPosition={imageEl.position}
            aspectRatio={imageEl.width / imageEl.height}
            title="調整圖片位置"
            onConfirm={(newPosition: ImagePositionSettings) => {
              updateElement(selectedElementId, { position: newPosition })
            }}
          />
        )
      })()}

      {/* 列印預覽 Portal */}
      {showPrintPreview && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] bg-card overflow-auto">
          {/* 螢幕上的控制列 */}
          <div className="sticky top-0 z-10 bg-card border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-morandi-primary">列印預覽</h2>
              <span className="text-sm text-morandi-secondary">共 {printImages.length} 頁</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPrintPreview(false)}
              >
                關閉
              </Button>
              <Button
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
                onClick={handlePrint}
              >
                <FileImage size={16} />
                列印 / 儲存 PDF
              </Button>
            </div>
          </div>

          {/* 頁面內容預覽 */}
          <div className="p-8 flex flex-col items-center gap-8 bg-morandi-container min-h-screen">
            {printImages.map((imgSrc, idx) => (
              <div
                key={idx}
                className="bg-card shadow-xl rounded-sm overflow-hidden"
                style={{
                  width: '148mm',  // A5 寬度
                  height: '210mm', // A5 高度
                }}
              >
                <img
                  src={imgSrc}
                  alt={`Page ${idx + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </main>
  )
}

export default function DesignerPage() {
  return (
    <Suspense
      fallback={
        <main className="h-screen flex items-center justify-center bg-background lg:ml-16">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-morandi-gold mx-auto mb-4" />
            <p className="text-morandi-secondary">載入中...</p>
          </div>
        </main>
      }
    >
      <DesignerPageContent />
    </Suspense>
  )
}
