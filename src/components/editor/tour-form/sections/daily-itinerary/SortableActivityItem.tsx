'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ImageIcon, Loader2, X, Crop, Upload, Database, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { RelatedImagesPreviewer } from '../../../RelatedImagesPreviewer'
import { getImagePositionStyle } from '@/components/ui/image-position-editor'
import { SortableActivityItemProps } from './types'

export function SortableActivityItem({
  activity,
  actIndex,
  dayIndex,
  updateActivity,
  removeActivity,
  handleActivityImageUpload,
  isActivityUploading,
  isActivityDragOver,
  setActivityDragOver,
  activityFileInputRefs,
  onOpenPositionEditor,
  onSaveToDatabase,
}: SortableActivityItemProps) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [isTimelineExpanded, setIsTimelineExpanded] = React.useState(
    // 如果已有時間資料，預設展開
    !!(activity.startTime || activity.endTime)
  )

  // 判斷是否可以存到資料庫（手動新增或已修改的景點）
  const canSaveToDb = !activity.attraction_id || activity.attraction_id.startsWith('manual_')

  const handleSaveToDb = async () => {
    if (!onSaveToDatabase || isSaving) return
    setIsSaving(true)
    try {
      await onSaveToDatabase(activity, dayIndex, actIndex)
    } finally {
      setIsSaving(false)
    }
  }
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `activity-${dayIndex}-${actIndex}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  const activityInputKey = `activity-${dayIndex}-${actIndex}`

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card/90 p-3 rounded-lg border border-morandi-container"
    >
      <div className="flex gap-3">
        {/* 拖曳把手 */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-6 cursor-grab active:cursor-grabbing text-morandi-secondary/50 hover:text-morandi-secondary flex-shrink-0"
        >
          <GripVertical size={18} />
        </div>

        {/* 圖片區域 */}
        <div
          className={`relative w-24 h-24 flex-shrink-0 rounded-lg border-2 border-dashed overflow-hidden transition-colors ${
            isActivityDragOver
              ? 'border-morandi-gold bg-morandi-gold/10'
              : activity.image
                ? 'border-transparent'
                : 'border-morandi-container bg-morandi-container/20'
          }`}
          onDragOver={e => {
            e.preventDefault()
            e.stopPropagation()
            setActivityDragOver({ dayIndex, actIndex })
          }}
          onDragLeave={e => {
            e.preventDefault()
            e.stopPropagation()
            setActivityDragOver(null)
          }}
          onDrop={e => {
            e.preventDefault()
            e.stopPropagation()
            setActivityDragOver(null)
            const file = e.dataTransfer.files?.[0]
            if (file && file.type.startsWith('image/')) {
              handleActivityImageUpload(dayIndex, actIndex, file)
            }
          }}
        >
          {activity.image ? (
            <>
              <img
                src={activity.image}
                alt={activity.title || '活動圖片'}
                className="w-full h-full object-cover cursor-pointer"
                style={getImagePositionStyle(activity.imagePosition)}
                onClick={() => onOpenPositionEditor(dayIndex, actIndex)}
                title="點擊調整顯示位置"
              />
              {/* 位置調整按鈕 */}
              <button
                type="button"
                onClick={() => onOpenPositionEditor(dayIndex, actIndex)}
                className="absolute bottom-1 left-1 w-5 h-5 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                title="調整顯示位置"
              >
                <Crop size={10} />
              </button>
              {/* 移除按鈕 */}
              <button
                type="button"
                onClick={() => updateActivity(dayIndex, actIndex, 'image', '')}
                className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                title="移除圖片"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <label
              className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-morandi-container/30 transition-colors"
            >
              {isActivityUploading ? (
                <Loader2 size={20} className="text-morandi-secondary animate-spin" />
              ) : (
                <>
                  <ImageIcon size={20} className="text-morandi-secondary/50 mb-1" />
                  <span className="text-[10px] text-morandi-secondary/50">點擊或拖曳</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                ref={el => { activityFileInputRefs.current[activityInputKey] = el }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleActivityImageUpload(dayIndex, actIndex, file)
                  }
                  e.target.value = ''
                }}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* 文字區域 */}
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={activity.title}
            onChange={e => updateActivity(dayIndex, actIndex, 'title', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder="景點名稱"
          />
          <textarea
            value={activity.description}
            onChange={e =>
              updateActivity(dayIndex, actIndex, 'description', e.target.value)
            }
            className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
            rows={2}
            placeholder="描述（選填）"
          />

          {/* 時間軸展開區塊 */}
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
              className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
                isTimelineExpanded || activity.startTime || activity.endTime
                  ? 'text-morandi-gold bg-morandi-gold/10'
                  : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/50'
              }`}
            >
              <Clock size={12} />
              <span>時間軸</span>
              {isTimelineExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {(activity.startTime || activity.endTime) && !isTimelineExpanded && (
                <span className="ml-1 text-morandi-gold">
                  {activity.startTime || '--:--'} ~ {activity.endTime || '--:--'}
                </span>
              )}
            </button>

            {/* 時間輸入區塊 */}
            {isTimelineExpanded && (
              <div className="mt-2 p-3 bg-morandi-container/20 rounded-lg border border-morandi-container/50">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-morandi-primary whitespace-nowrap">開始</label>
                    <input
                      type="time"
                      value={activity.startTime ? `${activity.startTime.slice(0, 2)}:${activity.startTime.slice(2)}` : ''}
                      onChange={e => {
                        const value = e.target.value.replace(':', '')
                        updateActivity(dayIndex, actIndex, 'startTime', value)
                      }}
                      className="px-2 py-1 border rounded text-sm w-24"
                    />
                  </div>
                  <span className="text-morandi-secondary">~</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-morandi-primary whitespace-nowrap">結束</label>
                    <input
                      type="time"
                      value={activity.endTime ? `${activity.endTime.slice(0, 2)}:${activity.endTime.slice(2)}` : ''}
                      onChange={e => {
                        const value = e.target.value.replace(':', '')
                        updateActivity(dayIndex, actIndex, 'endTime', value)
                      }}
                      className="px-2 py-1 border rounded text-sm w-24"
                    />
                  </div>
                  {/* 清除時間按鈕 */}
                  {(activity.startTime || activity.endTime) && (
                    <button
                      type="button"
                      onClick={() => {
                        updateActivity(dayIndex, actIndex, 'startTime', '')
                        updateActivity(dayIndex, actIndex, 'endTime', '')
                      }}
                      className="text-xs text-morandi-secondary hover:text-morandi-red transition-colors"
                    >
                      清除
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部操作區 */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-morandi-container/50">
        <div className="flex items-center gap-2">
          {!activity.image && (
            <button
              type="button"
              onClick={() => activityFileInputRefs.current[activityInputKey]?.click()}
              disabled={isActivityUploading}
              className="flex items-center gap-1 px-2 py-1 text-xs text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/50 rounded transition-colors disabled:opacity-50"
            >
              <Upload size={12} />
              上傳圖片
            </button>
          )}
          {/* 相關圖片預覽 - 在同一排 */}
          {activity.title && (
            <RelatedImagesPreviewer
              activityTitle={activity.title}
              currentImageUrl={activity.image}
              onSelectImage={(imageUrl) => updateActivity(dayIndex, actIndex, 'image', imageUrl)}
              className="flex-1"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 存到資料庫按鈕 - 只有手動新增的景點顯示 */}
          {canSaveToDb && onSaveToDatabase && activity.title && (
            <button
              type="button"
              onClick={handleSaveToDb}
              disabled={isSaving}
              className="flex items-center gap-1 px-2 py-1 text-xs text-morandi-blue hover:text-morandi-blue/80 hover:bg-morandi-blue/10 rounded transition-colors disabled:opacity-50"
              title="將此景點儲存到景點資料庫"
            >
              {isSaving ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Database size={12} />
              )}
              存到資料庫
            </button>
          )}
          <button
            onClick={() => removeActivity(dayIndex, actIndex)}
            className="px-2 py-1 text-morandi-red hover:text-morandi-red/80 text-xs transition-colors"
          >
            ✕ 刪除
          </button>
        </div>
      </div>
    </div>
  )
}
