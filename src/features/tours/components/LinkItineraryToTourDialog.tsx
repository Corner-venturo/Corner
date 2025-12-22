/**
 * LinkItineraryToTourDialog - 旅遊團連結行程表對話框
 * 功能：建立新行程表 / 連結現有行程表
 */

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, FileText, Loader2, ExternalLink, Calendar, MapPin, Unlink, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useItineraryStore } from '@/stores'
import type { Tour, Itinerary } from '@/stores/types'

// 去除 HTML 標籤
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

interface LinkItineraryToTourDialogProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
}

type FilterType = 'all' | 'template' | 'non-template'

export function LinkItineraryToTourDialog({
  isOpen,
  onClose,
  tour,
}: LinkItineraryToTourDialogProps) {
  const router = useRouter()
  const { items: itineraries, fetchAll, create, update, loading } = useItineraryStore()
  const [isCreating, setIsCreating] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 載入行程表資料
  useEffect(() => {
    if (isOpen) {
      fetchAll()
    }
  }, [isOpen, fetchAll])

  // 已關聯此旅遊團的行程表
  const linkedItineraries = useMemo(() => {
    // Filter out soft-deleted items if _deleted flag exists
    return itineraries.filter(i => {
      const item = i as Itinerary & { _deleted?: boolean }
      return i.tour_id === tour.id && !item._deleted
    })
  }, [itineraries, tour.id])

  // 未關聯任何旅遊團的行程表（可用於連結）- 依篩選條件
  const availableItineraries = useMemo(() => {
    let filtered = itineraries
      .filter(i => {
        const item = i as Itinerary & { _deleted?: boolean }
        return !item._deleted
      })
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())

    // 公司範例可以被多團連結，非公司範例只能被一團連結
    if (filterType === 'template') {
      // 公司範例：is_template = true，不管有沒有 tour_id 都可以連結
      filtered = filtered.filter(i => i.is_template === true)
    } else if (filterType === 'non-template') {
      // 非公司範例：is_template !== true，且沒有 tour_id 才能連結
      filtered = filtered.filter(i => i.is_template !== true && !i.tour_id)
    } else {
      // 全部：公司範例顯示全部，非公司範例只顯示未連結的
      filtered = filtered.filter(i => i.is_template === true || !i.tour_id)
    }

    // 搜尋篩選
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(i =>
        (i.title?.toLowerCase().includes(query)) ||
        (i.tour_code?.toLowerCase().includes(query)) ||
        (i.city?.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [itineraries, filterType, searchQuery])

  // 建立新行程表
  const handleCreateNew = async () => {
    try {
      setIsCreating(true)

      // 從旅遊團帶入航班資訊
      const tourWithFlight = tour as typeof tour & {
        outbound_flight?: { text?: string } | null
        return_flight?: { text?: string } | null
      }

      // Create itinerary with minimal required fields
      const newItinerary = await create({
        title: tour.name,
        tour_id: tour.id,
        tour_code: tour.code,
        status: 'draft',
        departure_date: tour.departure_date || '',
        city: tour.location || '',
        daily_itinerary: [],
        // Required fields with defaults
        tagline: '',
        subtitle: '',
        description: '',
        cover_image: '',
        country: '',
        features: [],
        focus_cards: [],
        // 從旅遊團帶入航班資訊
        outbound_flight: tourWithFlight.outbound_flight?.text ? {
          airline: '',
          flightNumber: tourWithFlight.outbound_flight.text,
          departureAirport: '',
          departureTime: '',
          arrivalAirport: '',
          arrivalTime: '',
        } : undefined,
        return_flight: tourWithFlight.return_flight?.text ? {
          airline: '',
          flightNumber: tourWithFlight.return_flight.text,
          departureAirport: '',
          departureTime: '',
          arrivalAirport: '',
          arrivalTime: '',
        } : undefined,
      } as unknown as Omit<Itinerary, 'id' | 'created_at' | 'updated_at'>)

      if (newItinerary?.id) {
        onClose()
        router.push(`/itinerary/new?id=${newItinerary.id}`)
      }
    } catch (error) {
      console.error('建立行程表失敗:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // 連結現有行程表
  const handleLinkItinerary = async (itinerary: Itinerary) => {
    try {
      setIsLinking(true)

      // 如果是公司範例，不更新 tour_id（保持可多團連結）
      // 如果是非公司範例，更新 tour_id
      if (itinerary.is_template) {
        // 公司範例：複製一份新的行程表給這個團
        const { id, created_at, updated_at, ...templateData } = itinerary
        const newItinerary = await create({
          ...templateData,
          tour_id: tour.id,
          tour_code: tour.code,
          is_template: false, // 複製出來的不是範例
          title: itinerary.title || tour.name,
          status: '進行中', // 綁定旅遊團後自動變更為進行中
        } as Omit<Itinerary, 'id' | 'created_at' | 'updated_at'>)

        if (newItinerary?.id) {
          onClose()
          router.push(`/itinerary/new?id=${newItinerary.id}`)
        }
      } else {
        // 非公司範例：直接連結
        await update(itinerary.id, {
          tour_id: tour.id,
          tour_code: tour.code,
          status: '進行中', // 綁定旅遊團後自動變更為進行中
        })

        onClose()
        router.push(`/itinerary/new?id=${itinerary.id}`)
      }
    } catch (error) {
      console.error('連結行程表失敗:', error)
    } finally {
      setIsLinking(false)
    }
  }

  // 查看已連結的行程表
  const handleViewItinerary = (itinerary: Itinerary) => {
    onClose()
    router.push(`/itinerary/new?id=${itinerary.id}`)
  }

  // 斷開連結
  const handleUnlinkItinerary = async (e: React.MouseEvent, itinerary: Itinerary) => {
    e.stopPropagation()
    try {
      setIsUnlinking(true)
      await update(itinerary.id, {
        tour_id: null,
        tour_code: null,
        status: '提案', // 解除綁定後自動變更為提案
      } as Partial<Itinerary>)
      await fetchAll()
    } catch (error) {
      console.error('斷開連結失敗:', error)
    } finally {
      setIsUnlinking(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>管理行程表</DialogTitle>
          <DialogDescription>
            為「{tour.name}」建立新行程表或連結現有行程表
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* 建立新行程表 - 一行簡化版 */}
          <button
            onClick={handleCreateNew}
            disabled={isCreating}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-morandi-primary/30 bg-morandi-primary/5 hover:bg-morandi-primary/10 hover:border-morandi-primary/50 transition-colors text-left disabled:opacity-50"
          >
            <div className="w-7 h-7 rounded bg-morandi-primary/20 flex items-center justify-center shrink-0">
              {isCreating ? (
                <Loader2 className="w-4 h-4 text-morandi-primary animate-spin" />
              ) : (
                <Plus className="w-4 h-4 text-morandi-primary" />
              )}
            </div>
            <span className="font-medium text-morandi-primary">建立新行程表</span>
            <span className="text-sm text-morandi-secondary">為此旅遊團建立全新的行程表</span>
          </button>

          {/* 已關聯的行程表 */}
          {linkedItineraries.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-morandi-gold" />
                <span className="text-sm font-medium text-morandi-primary">已關聯的行程表</span>
              </div>
              <div className="space-y-2">
                {linkedItineraries.map(itinerary => (
                  <div
                    key={itinerary.id}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-morandi-gold/30 bg-morandi-gold/5"
                  >
                    <button
                      onClick={() => handleViewItinerary(itinerary)}
                      className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        {itinerary.tour_code && (
                          <span className="font-mono text-sm text-morandi-gold">{itinerary.tour_code}</span>
                        )}
                        <span className="text-morandi-text truncate">{stripHtml(itinerary.title) || '未命名'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-morandi-secondary mt-1">
                        {itinerary.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {itinerary.city}
                          </span>
                        )}
                        {itinerary.departure_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {itinerary.departure_date}
                          </span>
                        )}
                        {itinerary.daily_itinerary?.length > 0 && (
                          <span>{itinerary.daily_itinerary.length} 天</span>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button
                        onClick={() => handleViewItinerary(itinerary)}
                        className="p-1.5 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-gold/10 rounded transition-colors"
                        title="查看"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleUnlinkItinerary(e, itinerary)}
                        disabled={isUnlinking}
                        className="p-1.5 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-colors disabled:opacity-50"
                        title="斷開連結"
                      >
                        {isUnlinking ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Unlink className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 連結現有行程表 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-morandi-secondary" />
                <span className="text-sm font-medium text-morandi-primary">連結現有行程表</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-morandi-secondary" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋..."
                    className="w-[140px] h-8 pl-8 text-sm"
                  />
                </div>
                <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                  <SelectTrigger className="w-[130px] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="template">公司範例</SelectItem>
                    <SelectItem value="non-template">非公司範例</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-morandi-secondary" />
                <span className="ml-2 text-sm text-morandi-secondary">載入中...</span>
              </div>
            ) : availableItineraries.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {availableItineraries.map(itinerary => (
                  <button
                    key={itinerary.id}
                    onClick={() => handleLinkItinerary(itinerary)}
                    disabled={isLinking}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-morandi-container bg-white hover:bg-morandi-container/30 hover:border-morandi-secondary/30 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {itinerary.tour_code && (
                          <span className="font-mono text-sm text-morandi-gold">{itinerary.tour_code}</span>
                        )}
                        <span className="text-morandi-text truncate">{stripHtml(itinerary.title) || '未命名'}</span>
                        {itinerary.is_template && (
                          <span className="text-xs bg-morandi-primary/10 text-morandi-primary px-1.5 py-0.5 rounded">
                            公司範例
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-morandi-secondary mt-1">
                        {itinerary.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {itinerary.city}
                          </span>
                        )}
                        {itinerary.departure_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {itinerary.departure_date}
                          </span>
                        )}
                        {itinerary.daily_itinerary?.length > 0 && (
                          <span>{itinerary.daily_itinerary.length} 天</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-morandi-secondary text-sm border border-dashed border-morandi-container rounded-lg">
                {filterType === 'template'
                  ? '目前沒有公司範例行程表'
                  : filterType === 'non-template'
                    ? '目前沒有可連結的非公司範例行程表'
                    : '目前沒有可連結的行程表'}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
