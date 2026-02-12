/**
 * 每日行程區塊編輯器
 *
 * 編輯每日行程列表（簡化版）
 */

'use client'

import { useCallback, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Calendar,
  MapPin,
  Utensils,
  Building,
} from 'lucide-react'
import type { DailyItineraryBlockData } from '../types'
import type { DailyItinerary, ItineraryStyleType } from '@/components/editor/tour-form/types'
import { COMP_EDITOR_LABELS } from '../../constants/labels'

interface DailyItineraryBlockEditorProps {
  data: DailyItineraryBlockData
  onChange: (data: Partial<DailyItineraryBlockData>) => void
}

export function DailyItineraryBlockEditor({ data, onChange }: DailyItineraryBlockEditorProps) {
  const days = data.dailyItinerary || []
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]))

  const toggleDay = useCallback((index: number) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }, [])

  const addDay = useCallback(() => {
    const newDay: DailyItinerary = {
      dayLabel: `Day ${days.length + 1}`,
      date: '',
      title: '',
      highlight: '',
      description: '',
      activities: [],
      recommendations: [],
      meals: { breakfast: '', lunch: '', dinner: '' },
      accommodation: '',
    }
    onChange({ dailyItinerary: [...days, newDay] })
    setExpandedDays(prev => new Set([...prev, days.length]))
  }, [days, onChange])

  const updateDay = useCallback((index: number, field: keyof DailyItinerary, value: unknown) => {
    const newDays = [...days]
    newDays[index] = { ...newDays[index], [field]: value }
    onChange({ dailyItinerary: newDays })
  }, [days, onChange])

  const removeDay = useCallback((index: number) => {
    const newDays = days.filter((_, i) => i !== index)
      .map((day, i) => ({ ...day, dayLabel: `Day ${i + 1}` }))
    onChange({ dailyItinerary: newDays })
  }, [days, onChange])

  return (
    <div className="space-y-3">
      {/* 標題和風格 */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-morandi-primary mb-1">行程副標題</label>
          <Input
            value={data.itinerarySubtitle || ''}
            onChange={e => onChange({ itinerarySubtitle: e.target.value })}
            placeholder={COMP_EDITOR_LABELS.深度探索之旅}
            className="h-8 text-sm"
          />
        </div>

        <div className="w-36">
          <label className="block text-xs font-medium text-morandi-primary mb-1">風格</label>
          <Select
            value={data.itineraryStyle || 'original'}
            onValueChange={(value) => onChange({ itineraryStyle: value as ItineraryStyleType })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder={COMP_EDITOR_LABELS.選擇} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">經典時間軸</SelectItem>
              <SelectItem value="luxury">奢華質感</SelectItem>
              <SelectItem value="art">藝術雜誌</SelectItem>
              <SelectItem value="dreamscape">夢幻漫遊</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 每日行程列表 */}
      <div className="space-y-2">
        {days.map((day, index) => {
          const isExpanded = expandedDays.has(index)
          return (
            <div
              key={index}
              className="border border-border/50 rounded-lg overflow-hidden"
            >
              {/* 日期標題列 */}
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 bg-morandi-container/20 hover:bg-morandi-container/30 transition-colors"
                onClick={() => toggleDay(index)}
              >
                {isExpanded ? (
                  <ChevronDown size={14} className="text-morandi-secondary" />
                ) : (
                  <ChevronRight size={14} className="text-morandi-secondary" />
                )}
                <Calendar size={14} className="text-morandi-gold" />
                <span className="text-sm font-medium text-morandi-primary">
                  {day.dayLabel || `Day ${index + 1}`}
                </span>
                <span className="text-xs text-morandi-secondary">{day.date}</span>
                <span className="text-xs text-morandi-secondary truncate flex-1 text-left">
                  {day.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-status-danger hover:text-status-danger hover:bg-status-danger-bg"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeDay(index)
                  }}
                >
                  <Trash2 size={12} />
                </Button>
              </button>

              {/* 展開的編輯內容 */}
              {isExpanded && (
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-morandi-primary mb-1">Day 標籤</label>
                      <Input
                        value={day.dayLabel || ''}
                        onChange={e => updateDay(index, 'dayLabel', e.target.value)}
                        placeholder="Day 1"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-morandi-primary mb-1">日期</label>
                      <Input
                        value={day.date || ''}
                        onChange={e => updateDay(index, 'date', e.target.value)}
                        placeholder="2025/01/01"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-morandi-primary mb-1">標題</label>
                      <Input
                        value={day.title || ''}
                        onChange={e => updateDay(index, 'title', e.target.value)}
                        placeholder={COMP_EDITOR_LABELS.福岡市區探索}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-morandi-primary mb-1">
                      <MapPin size={12} className="inline mr-1" />
                      亮點
                    </label>
                    <Input
                      value={day.highlight || ''}
                      onChange={e => updateDay(index, 'highlight', e.target.value)}
                      placeholder={COMP_EDITOR_LABELS.博多運河城_天神地下街}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-morandi-primary mb-1">
                        <Utensils size={12} className="inline mr-1" />
                        早餐
                      </label>
                      <Input
                        value={day.meals?.breakfast || ''}
                        onChange={e => updateDay(index, 'meals', { ...day.meals, breakfast: e.target.value })}
                        placeholder={COMP_EDITOR_LABELS.飯店早餐}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-morandi-primary mb-1">午餐</label>
                      <Input
                        value={day.meals?.lunch || ''}
                        onChange={e => updateDay(index, 'meals', { ...day.meals, lunch: e.target.value })}
                        placeholder={COMP_EDITOR_LABELS.自理}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-morandi-primary mb-1">晚餐</label>
                      <Input
                        value={day.meals?.dinner || ''}
                        onChange={e => updateDay(index, 'meals', { ...day.meals, dinner: e.target.value })}
                        placeholder={COMP_EDITOR_LABELS.自理}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-morandi-primary mb-1">
                      <Building size={12} className="inline mr-1" />
                      住宿
                    </label>
                    <Input
                      value={day.accommodation || ''}
                      onChange={e => updateDay(index, 'accommodation', e.target.value)}
                      placeholder={COMP_EDITOR_LABELS.博多都飯店}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="text-xs text-morandi-secondary bg-morandi-container/20 p-2 rounded">
                    活動數量：{day.activities?.length || 0} 個
                    {day.activities && day.activities.length > 0 && (
                      <span className="ml-2">
                        ({day.activities.map(a => a.title).filter(Boolean).join('、') || COMP_EDITOR_LABELS.無標題})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 新增按鈕 */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={addDay}
      >
        <Plus size={14} />
        新增一天
      </Button>
    </div>
  )
}
