'use client'

import React, { useState, useRef, useMemo } from 'react'
import { TourFormData, DailyItinerary, Activity, ItineraryStyleType } from '../types'
import { AttractionSelector } from '../../AttractionSelector'
import { HotelSelector, LuxuryHotel } from '../../HotelSelector'
import { RestaurantSelector, Restaurant, MichelinRestaurant } from '../../RestaurantSelector'
import { useTemplates, getTemplateColor } from '@/features/itinerary/hooks/useTemplates'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type CombinedRestaurant = (Restaurant | MichelinRestaurant) & {
  source: 'restaurant' | 'michelin'
  city_name?: string
}
import { Palette, FolderPlus, Loader2, ChevronDown } from 'lucide-react'
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
import { ImagePositionEditor } from '@/components/ui/image-position-editor'
import { alert } from '@/lib/ui/alert-dialog'
import { DayCard, calculateDayLabels, AttractionWithCity, MealSelectorState } from './daily-itinerary'

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
  addRecommendation,
  updateRecommendation,
  removeRecommendation,
}: DailyItinerarySectionProps) {
  // 計算所有天的標籤
  const dayLabels = calculateDayLabels(data.dailyItinerary || [])

  // 選擇器狀態
  const [showAttractionSelector, setShowAttractionSelector] = useState(false)
  const [showHotelSelector, setShowHotelSelector] = useState(false)
  const [showRestaurantSelector, setShowRestaurantSelector] = useState(false)
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(-1)
  const [currentMealSelector, setCurrentMealSelector] = useState<MealSelectorState | null>(null)

  // 圖片上傳相關狀態
  const [uploadingActivityImage, setUploadingActivityImage] = useState<{ dayIndex: number; actIndex: number } | null>(null)
  const activityFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

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

  // 從資料庫載入模板
  const { dailyTemplates, loading: templatesLoading } = useTemplates()

  // 從資料庫載入的行程風格選項
  const itineraryStyleOptions = useMemo(() => {
    return dailyTemplates.map(template => ({
      value: template.id as ItineraryStyleType,
      label: template.name,
      description: template.description || '',
      color: getTemplateColor(template.id),
      previewImage: template.preview_image_url,
    }))
  }, [dailyTemplates])

  // 開啟景點選擇器
  const handleOpenAttractionSelector = (dayIndex: number) => {
    setCurrentDayIndex(dayIndex)
    setShowAttractionSelector(true)
  }

  // 開啟飯店選擇器
  const handleOpenHotelSelector = (dayIndex: number) => {
    setCurrentDayIndex(dayIndex)
    setShowHotelSelector(true)
  }

  // 開啟餐廳選擇器
  const handleOpenRestaurantSelector = (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    setCurrentDayIndex(dayIndex)
    setCurrentMealSelector({ dayIndex, mealType })
    setShowRestaurantSelector(true)
  }

  // 處理景點選擇
  const handleSelectAttractions = async (attractions: AttractionWithCity[]) => {
    if (currentDayIndex === -1) return

    for (const attraction of attractions) {
      const day = data.dailyItinerary[currentDayIndex]
      const newActivityIndex = day.activities.length
      addActivity(currentDayIndex)
      updateActivity(currentDayIndex, newActivityIndex, 'attraction_id', attraction.id)
      updateActivity(currentDayIndex, newActivityIndex, 'icon', '📍')
      updateActivity(currentDayIndex, newActivityIndex, 'title', attraction.name)
      updateActivity(currentDayIndex, newActivityIndex, 'description', attraction.description || '')

      // 智能圖片選擇邏輯
      let imageUrl = ''
      if (attraction.thumbnail) {
        imageUrl = attraction.thumbnail
      } else if (attraction.images && attraction.images.length > 0) {
        imageUrl = attraction.images[0]
      } else if (workspaceId) {
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
          }
        } catch (error) {
          console.error('搜尋圖庫圖片失敗:', error)
        }
      }

      updateActivity(currentDayIndex, newActivityIndex, 'image', imageUrl)
    }
    setCurrentDayIndex(-1)
  }

  // 處理飯店選擇
  const handleSelectHotels = (hotels: LuxuryHotel[]) => {
    if (currentDayIndex === -1 || hotels.length === 0) return

    const hotel = hotels[0] // 只取第一個
    updateDailyItinerary(currentDayIndex, 'accommodation', hotel.name)
    updateDailyItinerary(currentDayIndex, 'accommodationRating', hotel.star_rating || 5)
    // LuxuryHotel 沒有 website 欄位，但可能有其他欄位可用
    setCurrentDayIndex(-1)
    toast.success(`已選擇: ${hotel.name}`)
  }

  // 處理餐廳選擇
  const handleSelectRestaurants = (restaurants: CombinedRestaurant[]) => {
    if (!currentMealSelector || restaurants.length === 0) return

    const { dayIndex, mealType } = currentMealSelector
    const restaurant = restaurants[0]
    const day = data.dailyItinerary[dayIndex]

    // 格式化餐廳名稱（如果是米其林則加上星星）
    let restaurantText = restaurant.name
    // 檢查是否為米其林餐廳（source 為 'michelin' 或有 michelin_stars）
    const isMichelin = restaurant.source === 'michelin'
    const michelinStars = 'michelin_stars' in restaurant ? restaurant.michelin_stars : null
    if (isMichelin && michelinStars) {
      restaurantText = `${'⭐'.repeat(michelinStars)} ${restaurant.name}`
    }

    updateDailyItinerary(dayIndex, 'meals', {
      ...day.meals,
      [mealType]: restaurantText,
    })
    setCurrentMealSelector(null)
    toast.success(`已選擇: ${restaurantText}`)
  }

  // 上傳活動圖片
  const handleActivityImageUpload = async (
    dayIndex: number,
    actIndex: number,
    file: File
  ) => {
    console.log('[每日行程圖片上傳] 開始處理:', { dayIndex, actIndex, fileName: file.name, fileSize: file.size, fileType: file.type })

    if (!file.type.startsWith('image/')) {
      console.log('[每日行程圖片上傳] 非圖片檔案')
      void alert('請選擇圖片檔案', 'warning')
      return
    }

    setUploadingActivityImage({ dayIndex, actIndex })

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `activity-${dayIndex + 1}-${actIndex + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const filePath = `tour-activity-images/${fileName}`
      console.log('[每日行程圖片上傳] 準備上傳到:', filePath)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(filePath, file)

      if (uploadError) {
        console.error('[每日行程圖片上傳] 上傳失敗:', uploadError)
        void alert(`圖片上傳失敗: ${uploadError.message}`, 'error')
        return
      }

      console.log('[每日行程圖片上傳] 上傳成功:', uploadData)

      const { data: urlData } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(filePath)

      console.log('[每日行程圖片上傳] 取得公開 URL:', urlData.publicUrl)
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
      console.error('[每日行程圖片上傳] 意外錯誤:', error)
      void alert('上傳過程發生錯誤', 'error')
    } finally {
      setUploadingActivityImage(null)
      console.log('[每日行程圖片上傳] 處理完成')
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
      const { error: checkError } = await supabase
        .from('image_library')
        .select('id')
        .limit(1)

      if (checkError) {
        toast.error('圖庫功能暫時無法使用')
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
        toast.error(`儲存失敗: ${error.message}`)
      } else {
        toast.success('已儲存到圖庫')
      }
    } catch (error) {
      toast.error(`儲存過程發生錯誤`)
    } finally {
      setIsSavingToLibrary(false)
      setSaveToLibraryDialog(null)
      setLibraryImageName('')
    }
  }

  return (
    <div className="space-y-4">
      {/* 標題列 */}
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
        <div className="flex items-center gap-3">
          {/* 行程風格選擇器 */}
          <div className="flex items-center gap-1.5 bg-morandi-container/50 rounded-lg px-2 py-1">
            <Palette size={14} className="text-morandi-secondary" />
            {templatesLoading ? (
              <Loader2 size={14} className="animate-spin text-morandi-secondary" />
            ) : (
              <select
                value={data.itineraryStyle || 'original'}
                onChange={e => updateField('itineraryStyle', e.target.value as ItineraryStyleType)}
                className="text-xs bg-transparent border-none focus:ring-0 text-morandi-primary cursor-pointer pr-6"
              >
                {itineraryStyleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={addDailyItinerary}
            className="px-3 py-1 bg-morandi-gold text-white rounded-lg text-sm hover:bg-morandi-gold/90"
          >
            + 新增天數
          </button>
        </div>
      </div>

      {/* 每日卡片 */}
      {data.dailyItinerary?.map((day: DailyItinerary, dayIndex: number) => (
        <DayCard
          key={dayIndex}
          day={day}
          dayIndex={dayIndex}
          dayLabel={dayLabels[dayIndex]}
          data={data}
          updateDailyItinerary={updateDailyItinerary}
          removeDailyItinerary={removeDailyItinerary}
          swapDailyItinerary={swapDailyItinerary}
          addActivity={addActivity}
          updateActivity={updateActivity}
          removeActivity={removeActivity}
          reorderActivities={reorderActivities}
          addRecommendation={addRecommendation}
          updateRecommendation={updateRecommendation}
          removeRecommendation={removeRecommendation}
          updateField={updateField}
          onOpenAttractionSelector={handleOpenAttractionSelector}
          onOpenHotelSelector={handleOpenHotelSelector}
          onOpenRestaurantSelector={handleOpenRestaurantSelector}
          handleActivityImageUpload={handleActivityImageUpload}
          onOpenPositionEditor={(dIdx, aIdx) => {
            setActivityPositionEditor({ isOpen: true, dayIndex: dIdx, actIndex: aIdx })
          }}
        />
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

      {/* 飯店選擇器 */}
      <HotelSelector
        isOpen={showHotelSelector}
        onClose={() => {
          setShowHotelSelector(false)
          setCurrentDayIndex(-1)
        }}
        tourCountryName={data.country}
        onSelect={handleSelectHotels}
      />

      {/* 餐廳選擇器 */}
      <RestaurantSelector
        isOpen={showRestaurantSelector}
        onClose={() => {
          setShowRestaurantSelector(false)
          setCurrentMealSelector(null)
        }}
        tourCountryName={data.country}
        onSelect={handleSelectRestaurants}
        includeMichelin={true}
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
            {saveToLibraryDialog?.publicUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-morandi-container">
                <img
                  src={saveToLibraryDialog.publicUrl}
                  alt="預覽"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
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
              onClick={handleSaveToLibrary}
              disabled={isSavingToLibrary}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
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
