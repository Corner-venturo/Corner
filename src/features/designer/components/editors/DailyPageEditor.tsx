'use client'

/**
 * 每日行程頁編輯器
 */

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDragSort } from '@/hooks/useDragSort'
import {
  FileText,
  Calendar,
  ImageIcon,
  Upload,
  Move,
  Clock,
  Utensils,
  Plus,
  Trash2,
  Star,
  GripVertical,
} from 'lucide-react'
import type { DailyDetailData, TimelineItem } from '../../templates/definitions/types'

interface DailyPageEditorProps {
  templateData: Record<string, unknown> | null
  currentDayIndex: number
  onTemplateDataChange: (newData: Record<string, unknown>) => void
  onUploadCoverImage?: () => void
  onAdjustCoverPosition?: () => void
}

export function DailyPageEditor({
  templateData,
  currentDayIndex,
  onTemplateDataChange,
  onUploadCoverImage,
  onAdjustCoverPosition,
}: DailyPageEditorProps) {
  // 取得當前天的詳細資料
  const dailyDetails = (templateData?.dailyDetails as DailyDetailData[]) || []
  const currentDay = dailyDetails[currentDayIndex]

  // 更新當日行程詳細資料
  const updateDailyDetail = (field: keyof DailyDetailData | string, value: unknown) => {
    const newDailyDetails = [...dailyDetails]

    // 確保有足夠的元素
    while (newDailyDetails.length <= currentDayIndex) {
      newDailyDetails.push({
        dayNumber: newDailyDetails.length + 1,
        date: '',
        title: '',
        timeline: [],
        meals: {},
      })
    }

    // 處理餐食欄位
    if (field.startsWith('meals.')) {
      const mealType = field.replace('meals.', '') as 'breakfast' | 'lunch' | 'dinner'
      newDailyDetails[currentDayIndex] = {
        ...newDailyDetails[currentDayIndex],
        meals: {
          ...newDailyDetails[currentDayIndex].meals,
          [mealType]: value,
        },
      }
    } else {
      newDailyDetails[currentDayIndex] = {
        ...newDailyDetails[currentDayIndex],
        [field]: value,
      }
    }

    onTemplateDataChange({
      ...templateData,
      dailyDetails: newDailyDetails,
    })
  }

  // 更新時間軸項目
  const updateTimelineItem = (index: number, field: keyof TimelineItem, value: unknown) => {
    const currentTimeline = currentDay?.timeline || []
    const newTimeline = [...currentTimeline]
    newTimeline[index] = {
      ...newTimeline[index],
      [field]: value,
    }
    updateDailyDetail('timeline', newTimeline)
  }

  // 新增時間軸項目
  const addTimelineItem = () => {
    const currentTimeline = currentDay?.timeline || []
    const newTimeline = [...currentTimeline, { time: '', activity: '', isHighlight: false }]
    updateDailyDetail('timeline', newTimeline)
  }

  // 刪除時間軸項目
  const removeTimelineItem = (index: number) => {
    const currentTimeline = currentDay?.timeline || []
    const newTimeline = currentTimeline.filter((_, i) => i !== index)
    updateDailyDetail('timeline', newTimeline)
  }

  // 切換重點標記
  const toggleHighlight = (index: number) => {
    const currentTimeline = currentDay?.timeline || []
    const newTimeline = [...currentTimeline]
    newTimeline[index] = {
      ...newTimeline[index],
      isHighlight: !newTimeline[index].isHighlight,
    }
    updateDailyDetail('timeline', newTimeline)
  }

  // 拖曳排序
  const { dragState, dragHandlers } = useDragSort({
    onReorder: (fromIndex, toIndex) => {
      const currentTimeline = currentDay?.timeline || []
      const newTimeline = [...currentTimeline]
      const [removed] = newTimeline.splice(fromIndex, 1)
      newTimeline.splice(toIndex, 0, removed)
      updateDailyDetail('timeline', newTimeline)
    },
  })

  if (!templateData) return null

  return (
    <div className="space-y-4">
      {/* 天數標題 */}
      <div className="p-2 bg-morandi-gold/10 rounded text-sm text-morandi-primary font-medium">
        第 {currentDayIndex + 1} 天
      </div>

      {/* 當日封面圖片 */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <ImageIcon size={12} />
          當日封面圖片
        </Label>
        {currentDay?.coverImage ? (
          <div className="space-y-2">
            <div
              className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-morandi-container/30 border border-border"
              style={{
                backgroundImage: `url(${currentDay.coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1 text-xs h-7"
                onClick={onAdjustCoverPosition}
              >
                <Move size={12} />
                調整位置
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1 text-xs h-7"
                onClick={onUploadCoverImage}
              >
                <Upload size={12} />
                更換
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-16 border-dashed gap-2 text-xs"
            onClick={onUploadCoverImage}
          >
            <Upload size={14} />
            上傳當日封面
          </Button>
        )}
      </div>

      {/* 當日標題 */}
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1.5">
          <FileText size={12} />
          當日標題
        </Label>
        <Input
          value={currentDay?.title || ''}
          onChange={(e) => updateDailyDetail('title', e.target.value)}
          placeholder="輸入當日標題..."
          className="h-8 text-sm"
        />
      </div>

      {/* 日期 */}
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1.5">
          <Calendar size={12} />
          日期
        </Label>
        <Input
          type="date"
          value={currentDay?.date || ''}
          onChange={(e) => updateDailyDetail('date', e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* 時間軸 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs flex items-center gap-1.5">
            <Clock size={12} />
            時間軸
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addTimelineItem}
            className="h-6 px-2 text-xs gap-1"
          >
            <Plus size={12} />
            新增
          </Button>
        </div>

        <div className="space-y-2">
          {(currentDay?.timeline || []).map((item, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={(e) => dragHandlers.onDragStart(e, idx)}
              onDragOver={(e) => dragHandlers.onDragOver(e, idx)}
              onDragLeave={dragHandlers.onDragLeave}
              onDrop={(e) => dragHandlers.onDrop(e, idx)}
              onDragEnd={dragHandlers.onDragEnd}
              className={cn(
                'p-2 rounded border border-border/50 bg-morandi-container/10 transition-all',
                item.isHighlight && 'border-morandi-gold bg-morandi-gold/5',
                dragState.isDragging(idx) && 'opacity-50',
                dragState.isDragOver(idx) && 'border-morandi-gold border-dashed'
              )}
            >
              <div className="flex items-center gap-1">
                {/* 拖曳手柄 */}
                <div className="cursor-grab active:cursor-grabbing text-morandi-muted hover:text-morandi-primary">
                  <GripVertical size={14} />
                </div>

                <Input
                  value={item.time || ''}
                  onChange={(e) => updateTimelineItem(idx, 'time', e.target.value)}
                  placeholder="09:00"
                  className="w-16 h-7 text-xs"
                />
                <Input
                  value={item.activity || ''}
                  onChange={(e) => updateTimelineItem(idx, 'activity', e.target.value)}
                  placeholder="活動內容..."
                  className="flex-1 h-7 text-xs"
                />
                <button
                  type="button"
                  onClick={() => toggleHighlight(idx)}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    item.isHighlight
                      ? 'text-morandi-gold bg-morandi-gold/10'
                      : 'text-morandi-muted hover:text-morandi-gold hover:bg-morandi-gold/10'
                  )}
                  title="標記為重點"
                >
                  <Star size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => removeTimelineItem(idx)}
                  className="p-1.5 rounded text-morandi-muted hover:text-morandi-red hover:bg-morandi-red/10 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {(!currentDay?.timeline || currentDay.timeline.length === 0) && (
            <p className="text-xs text-morandi-secondary text-center py-4">
              尚未新增時間軸項目
            </p>
          )}
        </div>
      </div>

      {/* 餐食 */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <Utensils size={12} />
          餐食
        </Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-morandi-secondary w-8">早餐</span>
            <Input
              value={currentDay?.meals?.breakfast || ''}
              onChange={(e) => updateDailyDetail('meals.breakfast', e.target.value)}
              placeholder="早餐..."
              className="flex-1 h-7 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-morandi-secondary w-8">午餐</span>
            <Input
              value={currentDay?.meals?.lunch || ''}
              onChange={(e) => updateDailyDetail('meals.lunch', e.target.value)}
              placeholder="午餐..."
              className="flex-1 h-7 text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-morandi-secondary w-8">晚餐</span>
            <Input
              value={currentDay?.meals?.dinner || ''}
              onChange={(e) => updateDailyDetail('meals.dinner', e.target.value)}
              placeholder="晚餐..."
              className="flex-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
