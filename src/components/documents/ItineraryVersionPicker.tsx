'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Plus,
  Check,
  Pencil,
  FileText,
  Loader2,
  ExternalLink,
  Calendar,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useItineraryStore, useRegionsStore, useAuthStore } from '@/stores'
import type { Tour, Itinerary } from '@/stores/types'
import { logger } from '@/lib/utils/logger'

// 去除 HTML 標籤
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

// 判斷是否為已確認版本（狀態為結案）
function isConfirmedItinerary(itinerary: Itinerary): boolean {
  return itinerary.status === '結案'
}

interface ItineraryVersionPickerProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
  anchorEl?: HTMLElement | null
}

export function ItineraryVersionPicker({
  isOpen,
  onClose,
  tour,
  anchorEl,
}: ItineraryVersionPickerProps) {
  const router = useRouter()
  const { items: itineraries, fetchAll, create, update, loading } = useItineraryStore()
  const { countries, cities, fetchAll: fetchRegions } = useRegionsStore()
  const { user: currentUser } = useAuthStore()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // 載入行程表與區域資料
  useEffect(() => {
    if (isOpen) {
      fetchAll()
      if (countries.length === 0) {
        fetchRegions()
      }
    }
  }, [isOpen, fetchAll, fetchRegions, countries.length])

  // 點擊外部關閉
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // 編輯時自動聚焦
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  // 已關聯此旅遊團的行程表
  const linkedItineraries = itineraries.filter(
    i => i.tour_id === tour.id && !(i as { _deleted?: boolean })._deleted
  )

  // 根據 country_id 和 main_city_id 查詢名稱
  const countryName = (() => {
    if (!tour.country_id) return tour.location || ''
    const country = countries.find(c => c.id === tour.country_id)
    return country?.name || ''
  })()

  const cityName = (() => {
    if (!tour.main_city_id) return tour.location || ''
    const city = cities.find(c => c.id === tour.main_city_id)
    return city?.name || tour.location || ''
  })()

  // 計算天數
  const calculateDays = () => {
    if (!tour.departure_date || !tour.return_date) return 5
    const start = new Date(tour.departure_date)
    const end = new Date(tour.return_date)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, Math.min(diffDays, 30))
  }

  // 初始化每日行程
  const initializeDailyItinerary = () => {
    const days = calculateDays()
    return Array.from({ length: days }, (_, idx) => {
      let dateLabel = ''
      if (tour.departure_date) {
        const date = new Date(tour.departure_date)
        date.setDate(date.getDate() + idx)
        const weekdays = ['日', '一', '二', '三', '四', '五', '六']
        dateLabel = `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
      }

      const isFirst = idx === 0
      const isLast = idx === days - 1
      const defaultTitle = isFirst ? '抵達目的地' : isLast ? '返回台灣' : `第 ${idx + 1} 天行程`

      return {
        dayLabel: `Day ${idx + 1}`,
        date: dateLabel,
        title: defaultTitle,
        highlight: '',
        description: '',
        activities: [],
        recommendations: [],
        meals: { breakfast: '', lunch: '', dinner: '' },
        accommodation: '',
        images: [],
      }
    })
  }

  // 建立新行程表
  const handleCreate = async () => {
    try {
      setIsCreating(true)

      const authorName = currentUser?.display_name || currentUser?.chinese_name || ''
      const formattedDailyItinerary = initializeDailyItinerary()

      const newItinerary = await create({
        title: '未命名行程表',
        tour_id: tour.id,
        tour_code: tour.code,
        status: '草稿',
        author_name: authorName,
        departure_date: tour.departure_date || '',
        city: cityName,
        daily_itinerary: formattedDailyItinerary,
        tagline: 'Corner Travel 2025',
        subtitle: '',
        description: '',
        cover_image: '',
        country: countryName,
        features: [],
        focus_cards: [],
        outbound_flight: tour.outbound_flight ? {
          airline: tour.outbound_flight.airline || '',
          flightNumber: tour.outbound_flight.flightNumber || '',
          departureAirport: tour.outbound_flight.departureAirport || 'TPE',
          departureTime: tour.outbound_flight.departureTime || '',
          arrivalAirport: tour.outbound_flight.arrivalAirport || '',
          arrivalTime: tour.outbound_flight.arrivalTime || '',
          departureDate: tour.outbound_flight.departureDate || '',
        } : undefined,
        return_flight: tour.return_flight ? {
          airline: tour.return_flight.airline || '',
          flightNumber: tour.return_flight.flightNumber || '',
          departureAirport: tour.return_flight.departureAirport || '',
          departureTime: tour.return_flight.departureTime || '',
          arrivalAirport: tour.return_flight.arrivalAirport || 'TPE',
          arrivalTime: tour.return_flight.arrivalTime || '',
          departureDate: tour.return_flight.departureDate || '',
        } : undefined,
      } as unknown as Omit<Itinerary, 'id' | 'created_at' | 'updated_at'>)

      if (newItinerary?.id) {
        onClose()
        router.push(`/itinerary/new?itinerary_id=${newItinerary.id}`)
      }
    } catch (error) {
      logger.error('建立行程表失敗:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // 進入編輯
  const handleView = (itinerary: Itinerary) => {
    onClose()
    router.push(`/itinerary/new?itinerary_id=${itinerary.id}`)
  }

  // 開始 inline 改名
  const handleStartRename = (e: React.MouseEvent, itinerary: Itinerary) => {
    e.stopPropagation()
    setEditingId(itinerary.id)
    setEditingName(stripHtml(itinerary.title) || '')
  }

  // 儲存改名
  const handleSaveRename = async (itinerary: Itinerary) => {
    if (!editingName.trim()) {
      setEditingId(null)
      return
    }

    try {
      await update(itinerary.id, { title: editingName.trim() })
    } catch (error) {
      logger.error('更新名稱失敗:', error)
    }

    setEditingId(null)
  }

  // 按 Enter 或 Escape
  const handleKeyDown = (e: React.KeyboardEvent, itinerary: Itinerary) => {
    if (e.key === 'Enter') {
      handleSaveRename(itinerary)
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  if (!isOpen) return null

  // 計算位置（如果有 anchor）
  const style: React.CSSProperties = anchorEl
    ? {
        position: 'fixed',
        top: anchorEl.getBoundingClientRect().bottom + 8,
        left: anchorEl.getBoundingClientRect().left,
        zIndex: 50,
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
      }

  return (
    <>
      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* 懸浮面板 */}
      <div
        ref={panelRef}
        style={style}
        className="bg-white rounded-xl shadow-2xl border border-border w-[400px] max-h-[500px] overflow-hidden"
      >
        {/* 標題 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-morandi-container/20">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-morandi-primary" />
            <span className="font-medium text-morandi-primary">行程表管理</span>
            <span className="text-sm text-morandi-secondary">- {tour.code}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-morandi-container rounded transition-colors"
          >
            <X size={18} className="text-morandi-secondary" />
          </button>
        </div>

        {/* 內容區 */}
        <div className="flex flex-col">
          <div className="flex-1 overflow-y-auto max-h-[380px] p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-morandi-secondary" />
              </div>
            ) : linkedItineraries.length === 0 ? (
              <div className="text-center py-8 text-sm text-morandi-secondary">
                尚無行程表
              </div>
            ) : (
              <div className="space-y-1">
                {linkedItineraries.map(itinerary => (
                  <div
                    key={itinerary.id}
                    onClick={() => handleView(itinerary)}
                    className={cn(
                      'group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
                      'hover:bg-morandi-primary/5 border border-transparent hover:border-morandi-primary/20',
                      isConfirmedItinerary(itinerary) && 'bg-morandi-green/5 border-morandi-green/20'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isConfirmedItinerary(itinerary) && (
                          <Check size={14} className="text-morandi-green shrink-0" />
                        )}
                        {itinerary.tour_code && (
                          <span className="font-mono text-xs text-morandi-gold shrink-0">
                            {itinerary.tour_code}
                          </span>
                        )}

                        {editingId === itinerary.id ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onBlur={() => handleSaveRename(itinerary)}
                            onKeyDown={e => handleKeyDown(e, itinerary)}
                            onClick={e => e.stopPropagation()}
                            className="flex-1 text-sm bg-white border border-morandi-primary rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-morandi-primary"
                          />
                        ) : (
                          <span className="text-sm text-morandi-primary truncate">
                            {stripHtml(itinerary.title) || '未命名'}
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
                        {itinerary.daily_itinerary && itinerary.daily_itinerary.length > 0 && (
                          <span>{itinerary.daily_itinerary.length} 天</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => handleStartRename(e, itinerary)}
                        className="p-1 hover:bg-morandi-container rounded"
                        title="重新命名"
                      >
                        <Pencil size={12} className="text-morandi-secondary" />
                      </button>
                      <ExternalLink size={14} className="text-morandi-secondary" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 新增按鈕 */}
          <div className="p-2 border-t border-border">
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-morandi-primary hover:bg-morandi-container/50 rounded-lg transition-colors disabled:opacity-50"
            >
              {isCreating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              新增
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
