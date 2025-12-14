import React, { useState, useRef } from 'react'
import { TourFormData, DailyItinerary, Activity, ImagePositionSettings } from '../types'
import { AttractionSelector } from '../../AttractionSelector'
import { Attraction } from '@/features/attractions/types'
import { ArrowRight, Minus, Sparkles, Upload, Loader2, ImageIcon, X, FolderPlus, GripVertical, List, LayoutGrid, Crop, ChevronUp, ChevronDown } from 'lucide-react'
import { DailyImagesUploader } from './DailyImagesUploader'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { RelatedImagesPreviewer } from '../../RelatedImagesPreviewer'
import { ImagePositionEditor, getImagePositionStyle, parseImagePosition } from '@/components/ui/image-position-editor'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { alert } from '@/lib/ui/alert-dialog'

// 擴展型別（與 AttractionSelector 一致）
interface AttractionWithCity extends Attraction {
  city_name?: string
}
interface DailyItinerarySectionProps {
  data: TourFormData
  updateField: (field: string, value: unknown) => void
  addDailyItinerary: () => void
  updateDailyItinerary: (index: number, field: string, value: unknown) => void
  removeDailyItinerary: (index: number) => void
  swapDailyItinerary?: (fromIndex: number, toIndex: number) => void
  addActivity: (dayIndex: number) => void
  updateActivity: (dayIndex: number, actIndex: number, field: string, value: string) => void
  removeActivity: (dayIndex: number, actIndex: number) => void
  reorderActivities?: (dayIndex: number, activities: Activity[]) => void
  addDayImage: (dayIndex: number) => void
  updateDayImage: (dayIndex: number, imageIndex: number, value: string) => void
  removeDayImage: (dayIndex: number, imageIndex: number) => void
  addRecommendation: (dayIndex: number) => void
  updateRecommendation: (dayIndex: number, recIndex: number, value: string) => void
  removeRecommendation: (dayIndex: number, recIndex: number) => void
}

// 可拖曳的活動項目組件
interface SortableActivityItemProps {
  activity: Activity
  actIndex: number
  dayIndex: number
  updateActivity: (dayIndex: number, actIndex: number, field: string, value: string) => void
  removeActivity: (dayIndex: number, actIndex: number) => void
  handleActivityImageUpload: (dayIndex: number, actIndex: number, file: File) => void
  isActivityUploading: boolean
  isActivityDragOver: boolean
  setActivityDragOver: (value: { dayIndex: number; actIndex: number } | null) => void
  activityFileInputRefs: React.MutableRefObject<{ [key: string]: HTMLInputElement | null }>
  onOpenPositionEditor: (dayIndex: number, actIndex: number) => void
}

function SortableActivityItem({
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
}: SortableActivityItemProps) {
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
      className="bg-white/90 p-3 rounded-lg border border-morandi-container"
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
        <button
          onClick={() => removeActivity(dayIndex, actIndex)}
          className="px-2 py-1 text-morandi-red hover:text-morandi-red/80 text-xs transition-colors"
        >
          ✕ 刪除
        </button>
      </div>
    </div>
  )
}

// 網格模式的縮圖組件
interface SortableActivityGridItemProps {
  activity: Activity
  actIndex: number
  dayIndex: number
}

function SortableActivityGridItem({
  activity,
  actIndex,
  dayIndex,
}: SortableActivityGridItemProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative aspect-square rounded-lg overflow-hidden border border-morandi-container bg-morandi-container/20 cursor-grab active:cursor-grabbing group"
    >
      {activity.image ? (
        <img
          src={activity.image}
          alt={activity.title || '活動圖片'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-morandi-container/30">
          <ImageIcon size={24} className="text-morandi-secondary/40" />
        </div>
      )}
      {/* 序號標籤 */}
      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-white text-xs font-bold">
        {actIndex + 1}
      </div>
      {/* 標題 */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-white text-xs font-medium truncate">
          {activity.title || '未命名景點'}
        </p>
      </div>
      {/* 拖曳提示 */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <GripVertical size={20} className="text-white" />
      </div>
    </div>
  )
}

// 計算 dayLabel 的函數 - 處理建議方案編號
function calculateDayLabels(itinerary: DailyItinerary[]): string[] {
  const labels: string[] = []
  let currentDayNumber = 0
  let alternativeCount = 0 // 當前建議方案的計數 (B=1, C=2, ...)

  for (let i = 0; i < itinerary.length; i++) {
    const day = itinerary[i]

    if (day.isAlternative) {
      // 這是建議方案，使用前一個正規天數的編號 + 字母
      alternativeCount++
      const suffix = String.fromCharCode(65 + alternativeCount) // B, C, D...
      labels.push(`Day ${currentDayNumber}-${suffix}`)
    } else {
      // 這是正規天數
      currentDayNumber++
      alternativeCount = 0 // 重置建議方案計數
      labels.push(`Day ${currentDayNumber}`)
    }
  }

  return labels
}

export function DailyItinerarySection({
  data,
  updateField,
  addDailyItinerary,
  updateDailyItinerary,
  removeDailyItinerary,
  swapDailyItinerary,
  addActivity,
  updateActivity,
  removeActivity,
  reorderActivities,
  addDayImage,
  updateDayImage,
  removeDayImage,
  addRecommendation,
  updateRecommendation,
  removeRecommendation,
}: DailyItinerarySectionProps) {
  // 計算所有天的標籤
  const dayLabels = calculateDayLabels(data.dailyItinerary || [])

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 處理拖曳結束
  const handleDragEnd = (dayIndex: number) => (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const activities = data.dailyItinerary[dayIndex].activities
    const oldIndex = activities.findIndex((_, i) => `activity-${dayIndex}-${i}` === active.id)
    const newIndex = activities.findIndex((_, i) => `activity-${dayIndex}-${i}` === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newActivities = arrayMove(activities, oldIndex, newIndex)
      if (reorderActivities) {
        reorderActivities(dayIndex, newActivities)
      } else {
        // 如果沒有 reorderActivities，就直接更新 dailyItinerary
        updateDailyItinerary(dayIndex, 'activities', newActivities)
      }
    }
  }
  const [showAttractionSelector, setShowAttractionSelector] = useState(false)
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(-1)
  const [uploadingActivityImage, setUploadingActivityImage] = useState<{ dayIndex: number; actIndex: number } | null>(null)
  const [activityDragOver, setActivityDragOver] = useState<{ dayIndex: number; actIndex: number } | null>(null)
  const activityFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  // 每天的活動視圖模式（列表 or 網格）
  const [activityViewMode, setActivityViewMode] = useState<Record<number, 'list' | 'grid'>>({})

  // 景點圖片位置調整狀態
  const [activityPositionEditor, setActivityPositionEditor] = useState<{
    isOpen: boolean
    dayIndex: number
    actIndex: number
  } | null>(null)

  // 圖庫儲存狀態
  const [saveToLibraryDialog, setSaveToLibraryDialog] = useState<{
    isOpen: boolean
    filePath: string
    publicUrl: string
    activityTitle: string
  } | null>(null)
  const [libraryImageName, setLibraryImageName] = useState('')
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false)


  const workspaceId = useAuthStore(state => state.user?.workspace_id)

  // 上傳活動圖片
  const handleActivityImageUpload = async (
    dayIndex: number,
    actIndex: number,
    file: File
  ) => {
    if (!file.type.startsWith('image/')) {
      void alert('請選擇圖片檔案', 'warning')
      return
    }

    setUploadingActivityImage({ dayIndex, actIndex })

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `activity-${dayIndex + 1}-${actIndex + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const filePath = `tour-activity-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(filePath, file)

      if (uploadError) {
        console.error('上傳失敗:', uploadError)
        void alert('圖片上傳失敗', 'error')
        return
      }

      const { data: urlData } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(filePath)

      updateActivity(dayIndex, actIndex, 'image', urlData.publicUrl)

      // 上傳成功後詢問是否存到圖庫
      const currentActivity = data.dailyItinerary?.[dayIndex]?.activities?.[actIndex]
      const activityTitle = currentActivity?.title || '景點圖片'
      setSaveToLibraryDialog({
        isOpen: true,
        filePath,
        publicUrl: urlData.publicUrl,
        activityTitle,
      })
      setLibraryImageName(activityTitle)
    } catch (error) {
      console.error('上傳錯誤:', error)
      void alert('上傳過程發生錯誤', 'error')
    } finally {
      setUploadingActivityImage(null)
    }
  }

  // 儲存到圖庫
  const handleSaveToLibrary = async () => {
    if (!saveToLibraryDialog || !workspaceId) {
      toast.error('缺少必要資料，無法儲存')
      return
    }

    setIsSavingToLibrary(true)
    try {
      // 檢查圖庫表格是否存在
      const { error: checkError } = await supabase
        .from('image_library')
        .select('id')
        .limit(1)

      if (checkError) {
        console.error('圖庫表格不存在或無權限:', checkError)
        toast.error('圖庫功能暫時無法使用，表格可能尚未建立')
        return
      }

      const { error } = await supabase.from('image_library').insert({
        workspace_id: workspaceId,
        name: libraryImageName || '未命名圖片',
        file_path: saveToLibraryDialog.filePath,
        public_url: saveToLibraryDialog.publicUrl,
        category: 'activity',
        tags: ['景點', '活動'],
      })

      if (error) {
        console.error('儲存到圖庫失敗:', error)
        toast.error(`儲存失敗: ${error.message}`)
      } else {
        toast.success('已儲存到圖庫')
      }
    } catch (error) {
      console.error('儲存錯誤:', error)
      toast.error(`儲存過程發生錯誤: ${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setIsSavingToLibrary(false)
      setSaveToLibraryDialog(null)
      setLibraryImageName('')
    }
  }


  // 開啟景點圖片位置調整器
  const handleOpenActivityPositionEditor = (dayIndex: number, actIndex: number) => {
    setActivityPositionEditor({
      isOpen: true,
      dayIndex,
      actIndex,
    })
  }

  // 開啟景點選擇器
  const handleOpenAttractionSelector = (dayIndex: number) => {
    setCurrentDayIndex(dayIndex)
    setShowAttractionSelector(true)
  }
  // 處理景點選擇
  const handleSelectAttractions = async (attractions: AttractionWithCity[]) => {
    if (currentDayIndex === -1) return
    const workspaceId = useAuthStore.getState().user?.workspace_id

    // 將選擇的景點轉換為活動
    for (const attraction of attractions) {
      // 先取得當前索引（新增前的長度）
      const day = data.dailyItinerary[currentDayIndex]
      const newActivityIndex = day.activities.length
      // 再新增活動
      addActivity(currentDayIndex)
      // ✅ 設定活動資料（包含 attraction_id）
      updateActivity(currentDayIndex, newActivityIndex, 'attraction_id', attraction.id) // 保留景點關聯
      updateActivity(currentDayIndex, newActivityIndex, 'icon', '📍')
      updateActivity(currentDayIndex, newActivityIndex, 'title', attraction.name)
      updateActivity(
        currentDayIndex,
        newActivityIndex,
        'description',
        attraction.description || ''
      )

      // 智能圖片選擇邏輯
      let imageUrl = ''
      
      // 1. 優先使用景點庫的 thumbnail
      if (attraction.thumbnail) {
        imageUrl = attraction.thumbnail
      }
      // 2. 其次使用景點庫的 images[0]
      else if (attraction.images && attraction.images.length > 0) {
        imageUrl = attraction.images[0]
      }
      // 3. 最後搜尋圖庫中同名的圖片
      else if (workspaceId) {
        try {
          const { data: libraryImages, error } = await supabase
            .from('image_library')
            .select('public_url')
            .eq('workspace_id', workspaceId)
            .eq('category', 'activity')
            .eq('name', attraction.name)
            .order('created_at', { ascending: false })
            .limit(1)

          if (!error && libraryImages && libraryImages.length > 0) {
            imageUrl = libraryImages[0].public_url
            console.log(`✅ 自動為 "${attraction.name}" 帶入圖庫圖片`)
          }
        } catch (error) {
          console.error('搜尋圖庫圖片失敗:', error)
        }
      }

      updateActivity(currentDayIndex, newActivityIndex, 'image', imageUrl)
    }
    setCurrentDayIndex(-1)
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b-2 border-morandi-gold pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-morandi-primary">逐日行程</h2>
          {(() => {
            const total = data.dailyItinerary?.length || 0
            const mainDays = data.dailyItinerary?.filter(d => !d.isAlternative).length || 0
            const alternatives = total - mainDays

            if (alternatives > 0) {
              return (
                <span className="px-2 py-0.5 bg-morandi-container text-morandi-secondary text-xs rounded-full">
                  {mainDays} 天 + {alternatives} 建議方案
                </span>
              )
            }
            return (
              <span className="px-2 py-0.5 bg-morandi-container text-morandi-secondary text-xs rounded-full">
                {total} 天
              </span>
            )
          })()}
        </div>
        <button
          onClick={addDailyItinerary}
          className="px-3 py-1 bg-morandi-gold text-white rounded-lg text-sm hover:bg-morandi-gold/90"
        >
          + 新增天數
        </button>
      </div>

      {data.dailyItinerary?.map((day: DailyItinerary, dayIndex: number) => (
        <div
          key={dayIndex}
          id={`day-${dayIndex}`}
          className="p-6 border border-morandi-container rounded-2xl space-y-5 bg-gradient-to-br from-morandi-container/20 via-white to-morandi-container/10 shadow-sm"
        >
          {/* Day 標籤與控制按鈕 */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* 上下箭頭排序按鈕 */}
              {swapDailyItinerary && data.dailyItinerary.length > 1 && (
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => swapDailyItinerary(dayIndex, dayIndex - 1)}
                    disabled={dayIndex === 0}
                    className={`p-0.5 rounded transition-colors ${
                      dayIndex === 0
                        ? 'text-morandi-container cursor-not-allowed'
                        : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/50'
                    }`}
                    title="上移"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => swapDailyItinerary(dayIndex, dayIndex + 1)}
                    disabled={dayIndex === data.dailyItinerary.length - 1}
                    className={`p-0.5 rounded transition-colors ${
                      dayIndex === data.dailyItinerary.length - 1
                        ? 'text-morandi-container cursor-not-allowed'
                        : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/50'
                    }`}
                    title="下移"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}
              <span className={`px-3 py-1 text-white text-sm font-bold rounded-full ${
                day.isAlternative ? 'bg-morandi-secondary' : 'bg-morandi-gold'
              }`}>
                {dayLabels[dayIndex]}
              </span>
              {day.isAlternative && (
                <span className="px-2 py-0.5 bg-morandi-container text-morandi-secondary text-xs rounded-full">
                  建議方案
                </span>
              )}
              <span className="text-sm text-morandi-secondary">
                {day.title || '尚未設定行程標題'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {/* 建議方案 checkbox - 不顯示在第一天 */}
              {dayIndex > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.isAlternative || false}
                    onChange={e => updateDailyItinerary(dayIndex, 'isAlternative', e.target.checked)}
                    className="h-4 w-4 text-morandi-gold focus:ring-morandi-gold border-morandi-container rounded"
                  />
                  <span className="text-sm text-morandi-secondary">建議方案</span>
                </label>
              )}
              {dayIndex === data.dailyItinerary.length - 1 && (
                <button
                  onClick={() => removeDailyItinerary(dayIndex)}
                  className="text-morandi-red hover:text-morandi-red/80 text-sm font-medium transition-colors"
                >
                  刪除此天
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-morandi-primary">行程標題</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector(
                      `#title-input-${dayIndex}`
                    ) as HTMLInputElement
                    if (input) {
                      const cursorPos = input.selectionStart || day.title.length
                      const newValue =
                        day.title.slice(0, cursorPos) + ' → ' + day.title.slice(cursorPos)
                      updateDailyItinerary(dayIndex, 'title', newValue)
                      setTimeout(() => {
                        input.focus()
                        input.setSelectionRange(cursorPos + 3, cursorPos + 3)
                      }, 0)
                    }
                  }}
                  className="p-1 bg-morandi-container hover:bg-morandi-gold/20 rounded transition-colors"
                  title="插入箭頭"
                >
                  <ArrowRight size={14} className="text-morandi-primary" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector(
                      `#title-input-${dayIndex}`
                    ) as HTMLInputElement
                    if (input) {
                      const cursorPos = input.selectionStart || day.title.length
                      const newValue =
                        day.title.slice(0, cursorPos) + ' ⇀ ' + day.title.slice(cursorPos)
                      updateDailyItinerary(dayIndex, 'title', newValue)
                      setTimeout(() => {
                        input.focus()
                        input.setSelectionRange(cursorPos + 3, cursorPos + 3)
                      }, 0)
                    }
                  }}
                  className="px-2 py-0.5 text-xs bg-morandi-container hover:bg-morandi-gold/20 rounded transition-colors"
                  title="插入鉤箭頭"
                >
                  ⇀
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector(
                      `#title-input-${dayIndex}`
                    ) as HTMLInputElement
                    if (input) {
                      const cursorPos = input.selectionStart || day.title.length
                      const newValue =
                        day.title.slice(0, cursorPos) + ' · ' + day.title.slice(cursorPos)
                      updateDailyItinerary(dayIndex, 'title', newValue)
                      setTimeout(() => {
                        input.focus()
                        input.setSelectionRange(cursorPos + 3, cursorPos + 3)
                      }, 0)
                    }
                  }}
                  className="px-2 py-0.5 text-xs bg-morandi-container hover:bg-morandi-gold/20 rounded transition-colors"
                  title="插入間隔點"
                >
                  ·
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector(
                      `#title-input-${dayIndex}`
                    ) as HTMLInputElement
                    if (input) {
                      const cursorPos = input.selectionStart || day.title.length
                      const newValue =
                        day.title.slice(0, cursorPos) + ' | ' + day.title.slice(cursorPos)
                      updateDailyItinerary(dayIndex, 'title', newValue)
                      setTimeout(() => {
                        input.focus()
                        input.setSelectionRange(cursorPos + 3, cursorPos + 3)
                      }, 0)
                    }
                  }}
                  className="p-1 bg-morandi-container hover:bg-morandi-gold/20 rounded transition-colors"
                  title="插入直線"
                >
                  <Minus size={14} className="text-morandi-primary" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.querySelector(
                      `#title-input-${dayIndex}`
                    ) as HTMLInputElement
                    if (input) {
                      const cursorPos = input.selectionStart || day.title.length
                      const newValue =
                        day.title.slice(0, cursorPos) + ' ⭐ ' + day.title.slice(cursorPos)
                      updateDailyItinerary(dayIndex, 'title', newValue)
                      setTimeout(() => {
                        input.focus()
                        input.setSelectionRange(cursorPos + 3, cursorPos + 3)
                      }, 0)
                    }
                  }}
                  className="p-1 bg-morandi-container hover:bg-morandi-gold/20 rounded transition-colors"
                  title="插入星號"
                >
                  <Sparkles size={14} className="text-morandi-gold" />
                </button>
              </div>
            </div>
            <input
              id={`title-input-${dayIndex}`}
              type="text"
              value={day.title}
              onChange={e => updateDailyItinerary(dayIndex, 'title', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="台北 ✈ 福岡空港 → 由布院 · 金麟湖 → 阿蘇溫泉"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">
              特別安排 (highlight)
            </label>
            <input
              type="text"
              value={day.highlight || ''}
              onChange={e => updateDailyItinerary(dayIndex, 'highlight', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="✨ 特別安排：由布院 · 金麟湖 ～ 日本 OL 人氣 NO.1 散策地"
            />
          </div>

          {/* Luxury 模板專用：地點標籤 */}
          {data.coverStyle === 'luxury' && (
            <div>
              <label className="block text-sm font-medium text-morandi-primary mb-1">
                <span className="inline-flex items-center gap-2">
                  地點標籤
                  <span className="px-1.5 py-0.5 text-[10px] bg-morandi-secondary/20 text-morandi-secondary rounded">
                    Luxury 專用
                  </span>
                </span>
              </label>
              <input
                type="text"
                value={day.locationLabel || ''}
                onChange={e => updateDailyItinerary(dayIndex, 'locationLabel', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="如：京都、大阪、由布院（顯示在 Luxury 模板的每日卡片上）"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">描述</label>
            <textarea
              value={day.description || ''}
              onChange={e => updateDailyItinerary(dayIndex, 'description', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="集合於台灣桃園國際機場..."
            />
          </div>

          {/* 活動 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-morandi-primary">景點活動</label>
                {/* 視圖切換按鈕 */}
                <div className="flex items-center bg-morandi-container/50 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setActivityViewMode(prev => ({ ...prev, [dayIndex]: 'list' }))}
                    className={`p-1.5 rounded transition-colors ${
                      (activityViewMode[dayIndex] || 'list') === 'list'
                        ? 'bg-white shadow-sm text-morandi-primary'
                        : 'text-morandi-secondary hover:text-morandi-primary'
                    }`}
                    title="列表模式"
                  >
                    <List size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityViewMode(prev => ({ ...prev, [dayIndex]: 'grid' }))}
                    className={`p-1.5 rounded transition-colors ${
                      activityViewMode[dayIndex] === 'grid'
                        ? 'bg-white shadow-sm text-morandi-primary'
                        : 'text-morandi-secondary hover:text-morandi-primary'
                    }`}
                    title="網格預覽（快速排序）"
                  >
                    <LayoutGrid size={14} />
                  </button>
                </div>
                <span className="text-xs text-morandi-secondary">
                  {activityViewMode[dayIndex] === 'grid' ? '（拖曳調整順序）' : '（拖曳 ⋮⋮ 可調整順序）'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleOpenAttractionSelector(dayIndex)}
                  size="xs"
                  variant="default"
                  className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                >
                  從景點庫選擇
                </Button>
                <Button
                  onClick={() => addActivity(dayIndex)}
                  size="xs"
                  variant="secondary"
                >
                  + 手動新增
                </Button>
              </div>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd(dayIndex)}
            >
              <SortableContext
                items={day.activities?.map((_, i) => `activity-${dayIndex}-${i}`) || []}
                strategy={activityViewMode[dayIndex] === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
              >
                {activityViewMode[dayIndex] === 'grid' ? (
                  /* 網格預覽模式 */
                  <div className="grid grid-cols-5 gap-3 p-3 bg-morandi-container/20 rounded-xl">
                    {day.activities?.map((activity: Activity, actIndex: number) => (
                      <SortableActivityGridItem
                        key={`activity-${dayIndex}-${actIndex}`}
                        activity={activity}
                        actIndex={actIndex}
                        dayIndex={dayIndex}
                      />
                    ))}
                  </div>
                ) : (
                  /* 列表編輯模式 */
                  day.activities?.map((activity: Activity, actIndex: number) => {
                    const isActivityUploading = uploadingActivityImage?.dayIndex === dayIndex && uploadingActivityImage?.actIndex === actIndex
                    const isActivityDragOver = activityDragOver?.dayIndex === dayIndex && activityDragOver?.actIndex === actIndex

                    return (
                      <SortableActivityItem
                        key={`activity-${dayIndex}-${actIndex}`}
                        activity={activity}
                        actIndex={actIndex}
                        dayIndex={dayIndex}
                        updateActivity={updateActivity}
                        removeActivity={removeActivity}
                        handleActivityImageUpload={handleActivityImageUpload}
                        isActivityUploading={isActivityUploading}
                        isActivityDragOver={isActivityDragOver}
                        setActivityDragOver={setActivityDragOver}
                        activityFileInputRefs={activityFileInputRefs}
                        onOpenPositionEditor={handleOpenActivityPositionEditor}
                      />
                    )
                  })
                )}
              </SortableContext>
            </DndContext>
          </div>

          {/* 推薦行程 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-morandi-primary">推薦行程</label>
              <Button
                onClick={() => addRecommendation(dayIndex)}
                size="xs"
                variant="secondary"
              >
                + 新增推薦
              </Button>
            </div>
            {day.recommendations?.map((rec: string, recIndex: number) => (
              <div key={recIndex} className="flex gap-2">
                <input
                  type="text"
                  value={rec}
                  onChange={e => updateRecommendation(dayIndex, recIndex, e.target.value)}
                  className="flex-1 px-2 py-1 border rounded text-sm bg-white"
                  placeholder="天神商圈購物"
                />
                <button
                  onClick={() => removeRecommendation(dayIndex, recIndex)}
                  className="px-2 text-morandi-red hover:text-morandi-red/80 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* 餐食 */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-morandi-secondary mb-1">早餐</label>
              <input
                type="text"
                value={day.meals?.breakfast || ''}
                onChange={e =>
                  updateDailyItinerary(dayIndex, 'meals', {
                    ...day.meals,
                    breakfast: e.target.value,
                  })
                }
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="飯店內早餐"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-secondary mb-1">午餐</label>
              <input
                type="text"
                value={day.meals?.lunch || ''}
                onChange={e =>
                  updateDailyItinerary(dayIndex, 'meals', { ...day.meals, lunch: e.target.value })
                }
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="博多拉麵 (¥1000)"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-morandi-secondary mb-1">晚餐</label>
              <input
                type="text"
                value={day.meals?.dinner || ''}
                onChange={e =>
                  updateDailyItinerary(dayIndex, 'meals', { ...day.meals, dinner: e.target.value })
                }
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="長腳蟹自助餐"
              />
            </div>
          </div>

          {/* 住宿 */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-morandi-secondary mb-1">住宿名稱</label>
              <input
                type="text"
                value={day.accommodation || ''}
                onChange={e => updateDailyItinerary(dayIndex, 'accommodation', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="飯店名稱"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-morandi-secondary mb-1">星級</label>
              <select
                value={day.accommodationRating ?? 5}
                onChange={e => {
                  const val = e.target.value
                  updateDailyItinerary(dayIndex, 'accommodationRating', val === '0' ? 0 : Number(val))
                }}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value={5}>5星</option>
                <option value={4}>4星</option>
                <option value={3}>3星</option>
                <option value={2}>2星</option>
                <option value={1}>1星</option>
                <option value={0}>特色旅宿</option>
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-morandi-secondary mb-1">飯店連結</label>
              <input
                type="url"
                value={day.accommodationUrl || ''}
                onChange={e => updateDailyItinerary(dayIndex, 'accommodationUrl', e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* 每日圖片 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={day.showDailyImages !== false}
                  onChange={e => updateDailyItinerary(dayIndex, 'showDailyImages', e.target.checked)}
                  className="h-4 w-4 text-morandi-gold focus:ring-morandi-gold border-morandi-container rounded"
                />
                <span className="text-sm font-medium text-morandi-primary">每日圖片</span>
              </label>
              {day.showDailyImages !== false && (day.images?.length || 0) > 0 && (
                <span className="text-xs text-morandi-secondary">
                  {day.images?.length} 張
                </span>
              )}
            </div>
            {day.showDailyImages !== false && (
              <DailyImagesUploader
                dayIndex={dayIndex}
                images={day.images || []}
                onImagesChange={(newImages) => {
                  updateDailyItinerary(dayIndex, 'images', newImages)
                }}
                allTourImages={
                  // 收集整個行程的所有每日照片
                  data.dailyItinerary?.flatMap(d =>
                    (d.images || []).map(img =>
                      typeof img === 'string' ? img : img.url
                    )
                  ) || []
                }
              />
            )}
          </div>
        </div>
      ))}

      {/* 景點選擇器 */}
      <AttractionSelector
        isOpen={showAttractionSelector}
        onClose={() => {
          setShowAttractionSelector(false)
          setCurrentDayIndex(-1)
        }}
        tourCountries={data.countries}
        tourCountryName={data.country}
        onSelect={handleSelectAttractions}
        dayTitle={currentDayIndex >= 0 ? data.dailyItinerary[currentDayIndex]?.title : ''}
      />

      {/* 儲存到圖庫確認對話框 */}
      <Dialog
        open={saveToLibraryDialog?.isOpen ?? false}
        onOpenChange={(open) => {
          if (!open) {
            setSaveToLibraryDialog(null)
            setLibraryImageName('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus size={20} className="text-morandi-gold" />
              儲存到圖庫
            </DialogTitle>
            <DialogDescription>
              是否要將這張圖片儲存到圖庫，以便日後重複使用？
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 預覽圖片 */}
            {saveToLibraryDialog?.publicUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-morandi-container">
                <img
                  src={saveToLibraryDialog.publicUrl}
                  alt="預覽"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {/* 圖片名稱 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-morandi-primary">
                圖片名稱
              </label>
              <Input
                value={libraryImageName}
                onChange={(e) => setLibraryImageName(e.target.value)}
                placeholder="輸入圖片名稱..."
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSaveToLibraryDialog(null)
                setLibraryImageName('')
              }}
              disabled={isSavingToLibrary}
            >
              不用了
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSaveToLibrary()
              }}
              disabled={isSavingToLibrary}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white cursor-pointer"
            >
              {isSavingToLibrary ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  儲存中...
                </>
              ) : (
                '儲存到圖庫'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 景點圖片位置調整器 */}
      {activityPositionEditor && (() => {
        const activity = data.dailyItinerary?.[activityPositionEditor.dayIndex]?.activities?.[activityPositionEditor.actIndex]
        if (!activity?.image) return null

        return (
          <ImagePositionEditor
            open={activityPositionEditor.isOpen}
            onClose={() => setActivityPositionEditor(null)}
            imageSrc={activity.image}
            currentPosition={activity.imagePosition}
            onConfirm={(settings) => {
              updateActivity(activityPositionEditor.dayIndex, activityPositionEditor.actIndex, 'imagePosition', JSON.stringify(settings))
            }}
            aspectRatio={16 / 9}
            title="調整景點圖片"
          />
        )
      })()}

    </div>
  )
}
