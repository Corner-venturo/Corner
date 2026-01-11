'use client'

import React, { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { DayStylePicker } from '../../components/DayStylePicker'
import { DreamscapeLayoutPicker } from '../../components/DreamscapeLayoutPicker'
import { DailyImagesUploader } from '../DailyImagesUploader'
import { DayTitleSection } from './DayTitleSection'
import { ActivitiesSection } from './ActivitiesSection'
import { MealsSection } from './MealsSection'
import { AccommodationSection } from './AccommodationSection'
import { RecommendationsSection } from './RecommendationsSection'
import { DayCardProps } from './types'

export function DayCard({
  day,
  dayIndex,
  dayLabel,
  data,
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
  updateField,
  onOpenAttractionSelector,
  onOpenHotelSelector,
  onOpenRestaurantSelector,
  handleActivityImageUpload,
  onOpenPositionEditor,
}: DayCardProps) {
  // 圖片上傳狀態
  const [uploadingActivityImage, setUploadingActivityImage] = useState<{ dayIndex: number; actIndex: number } | null>(null)
  const [activityDragOver, setActivityDragOver] = useState<{ dayIndex: number; actIndex: number } | null>(null)

  // 包裝上傳函數，加入 loading 狀態管理
  const handleImageUploadWithLoading = async (dIdx: number, aIdx: number, file: File) => {
    setUploadingActivityImage({ dayIndex: dIdx, actIndex: aIdx })
    try {
      await handleActivityImageUpload(dIdx, aIdx, file)
    } finally {
      setUploadingActivityImage(null)
    }
  }

  return (
    <div
      id={`day-${dayIndex}`}
      className="p-6 border border-morandi-container rounded-xl space-y-5 bg-gradient-to-br from-morandi-container/20 via-card to-morandi-container/10 shadow-sm"
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
            {dayLabel}
          </span>
          {day.isAlternative && (
            <span className="px-2 py-0.5 bg-morandi-container text-morandi-secondary text-xs rounded-full">
              建議方案
            </span>
          )}
          <span className="text-sm text-morandi-primary">
            {day.title || '尚未設定行程標題'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* 每日風格選擇器 + 預覽編輯 - 只在藝術風格時顯示 */}
          {data.itineraryStyle === 'art' && (
            <DayStylePicker
              dayIndex={dayIndex}
              dayData={day}
              currentStyle={day.displayStyle || 'single-image'}
              onStyleChange={(style) => updateDailyItinerary(dayIndex, 'displayStyle', style)}
              onDayUpdate={(updatedDay) => {
                const newItinerary = [...data.dailyItinerary]
                newItinerary[dayIndex] = updatedDay
                updateField('dailyItinerary', newItinerary)
              }}
              departureDate={data.departureDate}
            />
          )}
          {/* Dreamscape 佈局選擇器 - 只在夢幻漫遊風格時顯示 */}
          {data.itineraryStyle === 'dreamscape' && (
            <DreamscapeLayoutPicker
              dayIndex={dayIndex}
              currentLayout={day.dreamscapeLayout}
              onLayoutChange={(layout) => updateDailyItinerary(dayIndex, 'dreamscapeLayout', layout)}
            />
          )}
          {/* 建議方案 checkbox - 不顯示在第一天 */}
          {dayIndex > 0 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={day.isAlternative || false}
                onChange={e => updateDailyItinerary(dayIndex, 'isAlternative', e.target.checked)}
                className="h-4 w-4 text-morandi-gold focus:ring-morandi-gold border-morandi-container rounded"
              />
              <span className="text-sm text-morandi-primary">建議方案</span>
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

      {/* 行程標題 */}
      <DayTitleSection
        day={day}
        dayIndex={dayIndex}
        updateDailyItinerary={updateDailyItinerary}
      />

      {/* 特別安排 (highlight) */}
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

      {/* 描述 */}
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
      <ActivitiesSection
        day={day}
        dayIndex={dayIndex}
        addActivity={addActivity}
        updateActivity={updateActivity}
        removeActivity={removeActivity}
        reorderActivities={reorderActivities}
        updateDailyItinerary={updateDailyItinerary}
        onOpenAttractionSelector={onOpenAttractionSelector}
        handleActivityImageUpload={handleImageUploadWithLoading}
        uploadingActivityImage={uploadingActivityImage}
        activityDragOver={activityDragOver}
        setActivityDragOver={setActivityDragOver}
        onOpenPositionEditor={onOpenPositionEditor}
      />

      {/* 推薦行程 */}
      <RecommendationsSection
        day={day}
        dayIndex={dayIndex}
        addRecommendation={addRecommendation}
        updateRecommendation={updateRecommendation}
        removeRecommendation={removeRecommendation}
      />

      {/* 餐食 */}
      <MealsSection
        day={day}
        dayIndex={dayIndex}
        updateDailyItinerary={updateDailyItinerary}
        onOpenRestaurantSelector={onOpenRestaurantSelector}
      />

      {/* 住宿 */}
      <AccommodationSection
        day={day}
        dayIndex={dayIndex}
        data={data}
        updateDailyItinerary={updateDailyItinerary}
        onOpenHotelSelector={onOpenHotelSelector}
      />

      {/* 每日圖片 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={day.showDailyImages === true}
              onChange={e => {
                updateDailyItinerary(dayIndex, 'showDailyImages', e.target.checked)
              }}
              className="h-4 w-4 text-morandi-gold focus:ring-morandi-gold border-morandi-container rounded"
            />
            <span className="text-sm font-medium text-morandi-primary">每日圖片</span>
          </label>
          {day.showDailyImages === true && (day.images?.length || 0) > 0 && (
            <span className="text-xs text-morandi-secondary">
              {day.images?.length} 張
            </span>
          )}
        </div>
        {day.showDailyImages === true && (
          <DailyImagesUploader
            dayIndex={dayIndex}
            images={day.images || []}
            onImagesChange={(newImages) => {
              updateDailyItinerary(dayIndex, 'images', newImages)
            }}
            allTourImages={
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
  )
}
