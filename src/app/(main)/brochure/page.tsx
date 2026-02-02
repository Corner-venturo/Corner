'use client'

/**
 * 手冊設計器
 * 
 * 新版本：使用 React 元件系統
 * - 選擇主題和尺寸
 * - 填入/匯入行程資料
 * - 預覽和輸出 PDF
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  FileText,
  Download,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  ChevronLeft,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase/client'

// 新的元件系統
import {
  pages,
  themes,
  PAGE_SIZES,
  type Theme,
  type PageSize,
  type BrochureData,
  type DailyItinerary,
} from '@/features/designer/components/brochure-templates'

// 頁面類型
type PageType = 'cover' | 'toc' | 'daily' | 'hotel' | 'memo'

interface PageItem {
  id: string
  type: PageType
  dayIndex?: number  // 用於 daily 頁面
}

// 可用的主題
const AVAILABLE_THEMES = [
  { id: 'corner-travel', name: 'Corner Travel', theme: themes.cornerTravelTheme },
  { id: 'japanese', name: '日系風格', theme: themes.japaneseTheme },
]

export default function BrochurePage() {
  const searchParams = useSearchParams()
  const itineraryId = searchParams.get('itinerary')
  const tourId = searchParams.get('tour')

  // 狀態
  const [selectedThemeId, setSelectedThemeId] = useState('corner-travel')
  const [selectedSizeId, setSelectedSizeId] = useState<keyof typeof PAGE_SIZES>('A5')
  const [pageList, setPageList] = useState<PageItem[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [brochureData, setBrochureData] = useState<BrochureData>({
    companyName: 'Corner Travel',
    destination: '東京, 日本',
    mainTitle: '日本東京行程手冊',
    travelDates: '2026.02.09 - 02.15',
    dailyItineraries: [],
  })
  const [isLoading, setIsLoading] = useState(false)

  // 當前主題和尺寸
  const currentTheme = AVAILABLE_THEMES.find(t => t.id === selectedThemeId)?.theme || themes.cornerTravelTheme
  const currentSize = PAGE_SIZES[selectedSizeId]

  // 載入行程資料
  useEffect(() => {
    const loadItinerary = async () => {
      if (!itineraryId && !tourId) return
      
      setIsLoading(true)
      try {
        let data
        if (itineraryId) {
          const { data: itinerary } = await supabase
            .from('itineraries')
            .select('*')
            .eq('id', itineraryId)
            .single()
          data = itinerary
        } else if (tourId) {
          const { data: tour } = await supabase
            .from('tours')
            .select('*, itinerary:itineraries(*)')
            .eq('id', tourId)
            .single()
          data = tour?.itinerary
        }

        if (data && !Array.isArray(data)) {
          // 轉換資料格式
          const itineraryData = data as {
            days?: Array<{
              day_number: number
              title?: string
              meals?: { breakfast?: string; lunch?: string; dinner?: string }
              accommodation?: string
            }>
            city?: string
            country?: string
            title?: string
            subtitle?: string
            cover_image?: string
          }
          const days = itineraryData.days || []

          setBrochureData({
            destination: [itineraryData.city, itineraryData.country].filter(Boolean).join(', '),
            mainTitle: itineraryData.title,
            subTitle: itineraryData.subtitle,
            coverImage: itineraryData.cover_image,
            dailyItineraries: days.map(d => ({
              dayNumber: d.day_number,
              title: d.title || '',
              meals: d.meals,
              accommodation: d.accommodation,
            })),
          })

          // 自動生成頁面列表
          const newPages: PageItem[] = [
            { id: 'cover', type: 'cover' },
            { id: 'toc', type: 'toc' },
            ...days.map((_, i) => ({ id: `daily-${i}`, type: 'daily' as PageType, dayIndex: i })),
            { id: 'memo', type: 'memo' },
          ]
          setPageList(newPages)
          setSelectedPageId('cover')
        }
      } catch (error) {
        console.error('載入行程失敗:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadItinerary()
  }, [itineraryId, tourId])

  // 新增頁面
  const addPage = useCallback((type: PageType) => {
    const id = `${type}-${Date.now()}`
    const newPage: PageItem = { id, type }
    
    if (type === 'daily') {
      const existingDays = pageList.filter(p => p.type === 'daily').length
      newPage.dayIndex = existingDays
      
      // 同時新增一天到資料
      setBrochureData(prev => ({
        ...prev,
        dailyItineraries: [
          ...(prev.dailyItineraries || []),
          { dayNumber: existingDays + 1, title: `第${existingDays + 1}天行程` },
        ],
      }))
    }
    
    setPageList(prev => [...prev, newPage])
    setSelectedPageId(id)
  }, [pageList])

  // 刪除頁面
  const deletePage = useCallback((id: string) => {
    setPageList(prev => prev.filter(p => p.id !== id))
    if (selectedPageId === id) {
      setSelectedPageId(pageList[0]?.id || null)
    }
  }, [pageList, selectedPageId])

  // 渲染頁面
  const renderPage = (page: PageItem) => {
    const props = { data: brochureData, theme: currentTheme, size: currentSize }
    
    switch (page.type) {
      case 'cover':
        return <pages.Cover {...props} variant={selectedThemeId === 'japanese' ? 'arch' : 'full'} />
      case 'toc':
        return <pages.Toc {...props} pageNumber={2} />
      case 'daily':
        const day = brochureData.dailyItineraries?.[page.dayIndex || 0]
        if (!day) return null
        return <pages.Daily {...props} day={day} pageNumber={3 + (page.dayIndex || 0)} />
      case 'memo':
        return <pages.Memo {...props} pageNumber={pageList.length} />
      default:
        return null
    }
  }

  // 頁面類型名稱
  const getPageTypeName = (type: PageType) => {
    const names: Record<PageType, string> = {
      cover: '封面',
      toc: '目錄',
      daily: '每日行程',
      hotel: '飯店',
      memo: '注意事項',
    }
    return names[type]
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 頂部工具列 */}
      <div className="h-14 bg-white border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{brochureData.mainTitle || '新手冊'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 尺寸選擇 */}
          <Select value={selectedSizeId} onValueChange={(v) => setSelectedSizeId(v as keyof typeof PAGE_SIZES)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAGE_SIZES).map(([id, size]) => (
                <SelectItem key={id} value={id}>{size.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 主題選擇 */}
          <Select value={selectedThemeId} onValueChange={setSelectedThemeId}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_THEMES.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-gray-200" />

          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-1" />
            預覽
          </Button>
          <Button size="sm">
            <Download className="w-4 h-4 mr-1" />
            輸出 PDF
          </Button>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側：頁面列表 */}
        <div className="w-48 bg-white border-r flex flex-col">
          <div className="p-3 border-b">
            <Select onValueChange={(v) => addPage(v as PageType)}>
              <SelectTrigger className="w-full">
                <Plus className="w-4 h-4 mr-1" />
                新增頁面
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">封面</SelectItem>
                <SelectItem value="toc">目錄</SelectItem>
                <SelectItem value="daily">每日行程</SelectItem>
                <SelectItem value="hotel">飯店</SelectItem>
                <SelectItem value="memo">注意事項</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {pageList.map((page, index) => (
              <div
                key={page.id}
                className={`group flex items-center gap-2 p-2 rounded cursor-pointer ${
                  selectedPageId === page.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedPageId(page.id)}
              >
                <GripVertical className="w-3 h-3 text-gray-300" />
                <div className="flex-1 text-sm truncate">
                  {getPageTypeName(page.type)}
                  {page.type === 'daily' && ` ${(page.dayIndex || 0) + 1}`}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    deletePage(page.id)
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* 中間：預覽區 */}
        <div className="flex-1 overflow-auto p-8 flex justify-center">
          <div
            className="bg-white shadow-lg"
            style={{
              width: `${currentSize.width}mm`,
              minHeight: `${currentSize.height}mm`,
              transform: 'scale(0.8)',
              transformOrigin: 'top center',
            }}
          >
            {selectedPageId && renderPage(pageList.find(p => p.id === selectedPageId)!)}
          </div>
        </div>

        {/* 右側：資料編輯 */}
        <div className="w-72 bg-white border-l overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              資料編輯
            </h3>
          </div>
          
          <div className="p-4 space-y-4">
            <div>
              <Label>目的地</Label>
              <Input
                value={brochureData.destination || ''}
                onChange={(e) => setBrochureData(prev => ({ ...prev, destination: e.target.value }))}
              />
            </div>
            <div>
              <Label>手冊標題</Label>
              <Input
                value={brochureData.mainTitle || ''}
                onChange={(e) => setBrochureData(prev => ({ ...prev, mainTitle: e.target.value }))}
              />
            </div>
            <div>
              <Label>旅遊日期</Label>
              <Input
                value={brochureData.travelDates || ''}
                onChange={(e) => setBrochureData(prev => ({ ...prev, travelDates: e.target.value }))}
              />
            </div>
            <div>
              <Label>領隊姓名</Label>
              <Input
                value={brochureData.leaderName || ''}
                onChange={(e) => setBrochureData(prev => ({ ...prev, leaderName: e.target.value }))}
              />
            </div>
            <div>
              <Label>領隊電話</Label>
              <Input
                value={brochureData.leaderPhone || ''}
                onChange={(e) => setBrochureData(prev => ({ ...prev, leaderPhone: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
