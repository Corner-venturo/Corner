'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, FileDown, Loader2, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { useItineraries } from '@/hooks/cloud-hooks'
import { BrochureSidebar } from './BrochureSidebar'
import { BrochureCoverPreview } from './BrochureCoverPreview'
import { BrochureTableOfContents } from './BrochureTableOfContents'
import { BrochureOverviewLeft } from './BrochureOverviewLeft'
import { BrochureOverviewRight } from './BrochureOverviewRight'
import { BrochureDailyLeft } from './BrochureDailyLeft'
import { BrochureDailyRight } from './BrochureDailyRight'
import { BrochureAccommodation, extractAccommodations } from './BrochureAccommodation'
import { DEFAULT_COVER_DATA, type BrochureCoverData } from './types'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Itinerary } from '@/stores/types'

// 頁面類型（基本頁面 + 動態每日頁面）
type BasePageType = 'cover' | 'blank' | 'contents' | 'overview-left' | 'overview-right' | 'accommodation'
type DailyPageType = `day-${number}-left` | `day-${number}-right`
type PageType = BasePageType | DailyPageType

interface PageConfig {
  type: PageType
  label: string
  dayIndex?: number
  side?: 'left' | 'right'
}

// 基本頁面配置
const BASE_PAGES: PageConfig[] = [
  { type: 'cover', label: '封面' },
  { type: 'blank', label: '空白頁' },
  { type: 'contents', label: '目錄' },
  { type: 'overview-left', label: '總攬(左)' },
  { type: 'overview-right', label: '總攬(右)' },
]

// 結尾頁面配置
const END_PAGES: PageConfig[] = [
  { type: 'accommodation', label: '住宿' },
]

// 清除 HTML 標籤
function stripHtml(str: string | undefined | null): string {
  if (!str) return ''
  return str.replace(/<[^>]*>/g, '').trim()
}

// 從行程表轉換為封面資料
function itineraryToCoverData(itinerary: Itinerary): BrochureCoverData {
  const formatDateRange = () => {
    if (!itinerary.departure_date) return ''
    const startDate = new Date(itinerary.departure_date)
    const days = itinerary.daily_itinerary?.length || 1
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + days - 1)
    const formatDate = (d: Date) =>
      `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    return `${formatDate(startDate)} - ${formatDate(endDate)}`
  }

  const parseAirportCode = () => {
    if (itinerary.tour_code) {
      const match = itinerary.tour_code.match(/^([A-Z]{3})/)
      if (match) return match[1]
    }
    return ''
  }

  return {
    clientName: stripHtml(itinerary.tagline) || stripHtml(itinerary.title) || '',
    country: stripHtml(itinerary.country)?.toUpperCase() || '',
    city: stripHtml(itinerary.city)?.toUpperCase() || '',
    airportCode: parseAirportCode(),
    travelDates: formatDateRange(),
    coverImage: itinerary.cover_image || '',
    coverImagePosition: undefined,
    companyName: '角落旅行社',
    emergencyContact: itinerary.leader?.domesticPhone || '+886 2-2345-6789',
    emergencyEmail: 'service@corner.travel',
  }
}

export function BrochureDesignerPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const itineraryId = searchParams.get('id')

  const { items: itineraries, isLoading, update } = useItineraries()
  const [coverData, setCoverData] = useState<BrochureCoverData>(DEFAULT_COVER_DATA)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const coverRef = useRef<HTMLDivElement>(null)
  const contentsRef = useRef<HTMLDivElement>(null)
  const overviewLeftRef = useRef<HTMLDivElement>(null)
  const overviewRightRef = useRef<HTMLDivElement>(null)

  // 取得當前行程表
  const currentItinerary = itineraries.find((i) => i.id === itineraryId) || null
  const dailyItinerary = currentItinerary?.daily_itinerary || []

  // 動態生成頁面配置（基本頁面 + 每日行程頁面 + 結尾頁面）
  const allPages = useMemo<PageConfig[]>(() => {
    const pages = [...BASE_PAGES]

    // 為每天新增左右兩頁
    dailyItinerary.forEach((_, index) => {
      pages.push({
        type: `day-${index + 1}-left` as DailyPageType,
        label: `Day${index + 1}(左)`,
        dayIndex: index,
        side: 'left',
      })
      pages.push({
        type: `day-${index + 1}-right` as DailyPageType,
        label: `Day${index + 1}(右)`,
        dayIndex: index,
        side: 'right',
      })
    })

    // 加入結尾頁面
    pages.push(...END_PAGES)

    return pages
  }, [dailyItinerary])

  // 從行程中提取住宿資訊
  const accommodations = useMemo(() => {
    return extractAccommodations(dailyItinerary)
  }, [dailyItinerary])

  const currentPage = allPages[currentPageIndex] || allPages[0]

  // 載入行程表資料
  useEffect(() => {
    if (!itineraryId || isLoading) return
    const itinerary = itineraries.find((i) => i.id === itineraryId)
    if (itinerary) {
      setCoverData(itineraryToCoverData(itinerary))
    }
  }, [itineraryId, itineraries, isLoading])

  // 更新封面資料
  const handleChange = useCallback((changes: Partial<BrochureCoverData>) => {
    setCoverData((prev) => ({ ...prev, ...changes }))
    setHasChanges(true)
  }, [])

  // 儲存到行程表
  const handleSave = async () => {
    if (!itineraryId) return
    setIsSaving(true)
    try {
      await update(itineraryId, {
        tagline: coverData.clientName,
        country: coverData.country,
        city: coverData.city,
        cover_image: coverData.coverImage,
        leader: { domesticPhone: coverData.emergencyContact },
      } as Partial<Itinerary>)
      setHasChanges(false)
      toast.success('封面設定已儲存')
    } catch (error) {
      logger.error('儲存封面設定失敗:', error)
      toast.error('儲存失敗，請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }

  // 匯出完整手冊 PDF
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('無法開啟列印視窗，請檢查瀏覽器設定')
      return
    }

    const coverHtml = coverRef.current?.outerHTML || ''
    const contentsHtml = contentsRef.current?.outerHTML || ''
    const overviewLeftHtml = overviewLeftRef.current?.outerHTML || ''
    const overviewRightHtml = overviewRightRef.current?.outerHTML || ''

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${coverData.city || '旅遊手冊'} - A5 Booklet</title>
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Noto Sans TC', sans-serif; }

            @page { size: A5 portrait; margin: 0; }

            .page {
              width: 148mm;
              height: 210mm;
              page-break-after: always;
              position: relative;
              overflow: hidden;
            }
            .page:last-child { page-break-after: auto; }

            /* 空白頁 */
            .blank-page {
              background: white;
            }

            /* 封面樣式 */
            .cover-page > div {
              width: 100% !important;
              height: 100% !important;
              max-width: none !important;
              aspect-ratio: unset !important;
            }

            /* 目錄樣式 */
            .contents-page > div {
              width: 100% !important;
              height: 100% !important;
              max-width: none !important;
              aspect-ratio: unset !important;
            }

            @media print {
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }

            /* 預覽模式 */
            @media screen {
              body {
                background: #e5e7eb;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
              }
              .page {
                background: white;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
              }
            }
          </style>
        </head>
        <body>
          <!-- 第 1 頁：封面 -->
          <div class="page cover-page">
            ${coverHtml}
          </div>

          <!-- 第 2 頁：空白（封面背面） -->
          <div class="page blank-page"></div>

          <!-- 第 3 頁：目錄 -->
          <div class="page contents-page">
            ${contentsHtml}
          </div>

          <!-- 第 4 頁：總攬左（航班/集合/領隊） -->
          <div class="page overview-page">
            ${overviewLeftHtml}
          </div>

          <!-- 第 5 頁：總攬右（每日行程） -->
          <div class="page overview-page">
            ${overviewRightHtml}
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  // 頁面切換
  const goToPrev = () => {
    if (currentPageIndex > 0) setCurrentPageIndex(currentPageIndex - 1)
  }
  const goToNext = () => {
    if (currentPageIndex < allPages.length - 1) setCurrentPageIndex(currentPageIndex + 1)
  }

  // 判斷是否為每日行程頁面
  const isDailyPage = currentPage?.type?.startsWith('day-')

  // 返回
  const handleBack = () => {
    if (hasChanges && !window.confirm('有未儲存的變更，確定要離開嗎？')) return
    router.back()
  }

  if (!itineraryId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-morandi-secondary">請先選擇行程表</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-morandi-background">
      {/* 頂部工具列 */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-morandi-gold" />
            <h1 className="text-lg font-bold text-morandi-primary">手冊設計</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5">
            <FileDown size={16} />
            匯出手冊
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="gap-1.5 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            儲存
          </Button>
        </div>
      </header>

      {/* 主要內容區 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側編輯面板 */}
        <aside className="w-[380px] bg-white border-r border-border overflow-y-auto">
          <BrochureSidebar data={coverData} onChange={handleChange} />
        </aside>

        {/* 右側預覽區 */}
        <main className="flex-1 bg-slate-100 flex flex-col overflow-hidden">
          {/* 頁面選擇器 */}
          <div className="flex items-center justify-center gap-2 py-3 bg-white border-b border-border overflow-x-auto">
            <Button variant="ghost" size="icon" onClick={goToPrev} disabled={currentPageIndex === 0}>
              <ChevronLeft size={18} />
            </Button>
            <div className="flex gap-1 flex-wrap justify-center max-w-[600px]">
              {allPages.map((page, index) => (
                <button
                  key={page.type}
                  onClick={() => setCurrentPageIndex(index)}
                  className={cn(
                    'px-2 py-1 text-[10px] font-medium rounded transition-colors whitespace-nowrap',
                    currentPageIndex === index
                      ? 'bg-morandi-gold text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {index + 1}. {page.label}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="icon" onClick={goToNext} disabled={currentPageIndex === allPages.length - 1}>
              <ChevronRight size={18} />
            </Button>
          </div>

          {/* 預覽區 */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto relative">
            {/* 背景網格 */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(#888 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* 頁面預覽 */}
            <div className="relative shadow-2xl">
              {currentPage?.type === 'cover' && <BrochureCoverPreview ref={coverRef} data={coverData} />}

              {currentPage?.type === 'blank' && (
                <div
                  className="bg-white flex items-center justify-center"
                  style={{ width: '420px', aspectRatio: '1 / 1.414' }}
                >
                  <p className="text-slate-300 text-sm">空白頁（封面背面）</p>
                </div>
              )}

              {currentPage?.type === 'contents' && (
                <BrochureTableOfContents
                  ref={contentsRef}
                  data={coverData}
                  itinerary={currentItinerary}
                  tripTitle={`${coverData.country} ${coverData.city} Trip`}
                />
              )}

              {currentPage?.type === 'overview-left' && (
                <BrochureOverviewLeft
                  ref={overviewLeftRef}
                  data={coverData}
                  itinerary={currentItinerary}
                />
              )}

              {currentPage?.type === 'overview-right' && (
                <BrochureOverviewRight
                  ref={overviewRightRef}
                  data={coverData}
                  itinerary={currentItinerary}
                />
              )}

              {/* 每日行程頁面 */}
              {isDailyPage && currentPage?.dayIndex !== undefined && dailyItinerary[currentPage.dayIndex] && (
                currentPage.side === 'left' ? (
                  <BrochureDailyLeft
                    dayIndex={currentPage.dayIndex}
                    day={dailyItinerary[currentPage.dayIndex]}
                    departureDate={currentItinerary?.departure_date}
                    tripName={`${coverData.country} ${coverData.city}`}
                    pageNumber={currentPageIndex + 1}
                  />
                ) : (
                  <BrochureDailyRight
                    dayIndex={currentPage.dayIndex}
                    day={dailyItinerary[currentPage.dayIndex]}
                    pageNumber={currentPageIndex + 1}
                  />
                )
              )}

              {/* 住宿頁面 */}
              {currentPage?.type === 'accommodation' && (
                <BrochureAccommodation
                  accommodations={accommodations}
                  pageNumber={currentPageIndex + 1}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
