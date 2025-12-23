'use client'

import React, { useState, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DailyItinerary, Activity, DayDisplayStyle } from '../types'
import { X, Upload, Save, ImageIcon, Loader2, MapPin, Utensils, Building2, Plus, Image, Images, LayoutGrid, GitBranch } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'

// 使用從 types.ts 引入的 DayDisplayStyle
export type { DayDisplayStyle } from '../types'

// 風格選項定義
const styleOptions: { value: DayDisplayStyle; icon: React.ReactNode; label: string; color: string }[] = [
  { value: 'single-image', icon: <Image size={16} />, label: '單張大圖', color: '#c76d54' },
  { value: 'multi-image', icon: <Images size={16} />, label: '多圖輪播', color: '#8da399' },
  { value: 'card-grid', icon: <LayoutGrid size={16} />, label: '卡片網格', color: '#B8A99A' },
  { value: 'timeline', icon: <GitBranch size={16} />, label: '時間軸', color: '#4a6fa5' },
]

interface DayTemplateEditorProps {
  isOpen: boolean
  onClose: () => void
  dayData: DailyItinerary
  dayIndex: number
  departureDate?: string
  onSave: (updatedDay: DailyItinerary) => void
  style: DayDisplayStyle
}

// 計算該天日期
function calculateDayDate(departureDate: string | undefined, dayNumber: number): string {
  if (!departureDate) return ''
  try {
    const date = new Date(departureDate)
    if (isNaN(date.getTime())) return ''
    date.setDate(date.getDate() + (dayNumber - 1))
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return `${months[date.getMonth()]} ${date.getDate()}`
  } catch {
    return ''
  }
}

export function DayTemplateEditor({
  isOpen,
  onClose,
  dayData,
  dayIndex,
  departureDate,
  onSave,
  style,
}: DayTemplateEditorProps) {
  const [editingDay, setEditingDay] = useState<DailyItinerary>(dayData)
  const [currentStyle, setCurrentStyle] = useState<DayDisplayStyle>(style)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTarget, setUploadTarget] = useState<{ type: 'activity' | 'day'; index?: number } | null>(null)

  const dateDisplay = calculateDayDate(departureDate, dayIndex + 1)
  const currentStyleOption = styleOptions.find(s => s.value === currentStyle)

  // 更新欄位
  const updateField = (field: keyof DailyItinerary, value: unknown) => {
    setEditingDay(prev => ({ ...prev, [field]: value }))
  }

  // 更新活動
  const updateActivity = (actIndex: number, field: keyof Activity, value: string) => {
    setEditingDay(prev => ({
      ...prev,
      activities: prev.activities.map((act, i) =>
        i === actIndex ? { ...act, [field]: value } : act
      ),
    }))
  }

  // 新增活動
  const addActivity = () => {
    setEditingDay(prev => ({
      ...prev,
      activities: [
        ...prev.activities,
        { icon: '📍', title: '', description: '', image: '' }
      ],
    }))
  }

  // 處理圖片上傳
  const handleImageUpload = async (file: File, target: { type: 'activity' | 'day'; index?: number }) => {
    if (!file.type.startsWith('image/')) {
      toast.error('請選擇圖片檔案')
      return
    }

    const targetKey = target.type === 'activity' ? `activity-${target.index}` : 'day'
    setUploading(targetKey)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `template-${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const filePath = `tour-activity-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('workspace-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('workspace-files')
        .getPublicUrl(filePath)

      if (target.type === 'activity' && target.index !== undefined) {
        updateActivity(target.index, 'image', urlData.publicUrl)
      }

      toast.success('圖片上傳成功')
    } catch (error) {
      logger.error('上傳失敗:', error)
      toast.error('圖片上傳失敗')
    } finally {
      setUploading(null)
      setUploadTarget(null)
    }
  }

  // 觸發圖片上傳
  const triggerUpload = (target: { type: 'activity' | 'day'; index?: number }) => {
    setUploadTarget(target)
    fileInputRef.current?.click()
  }

  // 儲存並關閉（連同選擇的風格一起儲存）
  const handleSave = () => {
    onSave({ ...editingDay, displayStyle: currentStyle })
    onClose()
  }

  // 取得主圖（第一個有圖的活動或每日圖片）
  const mainImage = editingDay.activities.find(a => a.image)?.image ||
    (editingDay.images?.[0] && (typeof editingDay.images[0] === 'string' ? editingDay.images[0] : editingDay.images[0].url))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        {/* 隱藏的檔案上傳 input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file && uploadTarget) {
              handleImageUpload(file, uploadTarget)
            }
            e.target.value = ''
          }}
        />

        {/* 標題列 */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#2C5F4D]/5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: currentStyleOption?.color || '#2C5F4D' }}
            >
              {dayIndex + 1}
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">Day {dayIndex + 1} 預覽編輯</h2>
              <p className="text-sm text-gray-500">點擊文字直接編輯，點擊圖片上傳更換</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} className="gap-2 bg-[#2C5F4D] hover:bg-[#234a3d]">
              <Save size={16} />
              儲存
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* 風格選擇器 */}
        <div className="px-6 py-3 border-b bg-white flex items-center gap-2">
          <span className="text-sm text-gray-500 mr-2">展示風格：</span>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {styleOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCurrentStyle(option.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                  currentStyle === option.value
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-white/50'
                }`}
                style={{
                  color: currentStyle === option.value ? option.color : undefined,
                }}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 預覽區域 - 根據選擇的風格切換 */}
        <div className="overflow-auto p-6 bg-[#FDFBF7]" style={{ maxHeight: 'calc(90vh - 140px)' }}>

          {/* 單張大圖風格 */}
          {currentStyle === 'single-image' && (
            <SingleImageTemplate
              editingDay={editingDay}
              dayIndex={dayIndex}
              dateDisplay={dateDisplay}
              mainImage={mainImage}
              editingField={editingField}
              setEditingField={setEditingField}
              updateField={updateField}
              updateActivity={updateActivity}
              addActivity={addActivity}
              triggerUpload={triggerUpload}
              uploading={uploading}
            />
          )}

          {/* 多圖輪播風格 */}
          {currentStyle === 'multi-image' && (
            <MultiImageTemplate
              editingDay={editingDay}
              dayIndex={dayIndex}
              dateDisplay={dateDisplay}
              editingField={editingField}
              setEditingField={setEditingField}
              updateField={updateField}
              updateActivity={updateActivity}
              addActivity={addActivity}
              triggerUpload={triggerUpload}
              uploading={uploading}
            />
          )}

          {/* 卡片網格風格 */}
          {currentStyle === 'card-grid' && (
            <CardGridTemplate
              editingDay={editingDay}
              dayIndex={dayIndex}
              dateDisplay={dateDisplay}
              editingField={editingField}
              setEditingField={setEditingField}
              updateField={updateField}
              updateActivity={updateActivity}
              addActivity={addActivity}
              triggerUpload={triggerUpload}
              uploading={uploading}
            />
          )}

          {/* 時間軸風格 */}
          {currentStyle === 'timeline' && (
            <TimelineTemplate
              editingDay={editingDay}
              dayIndex={dayIndex}
              dateDisplay={dateDisplay}
              editingField={editingField}
              setEditingField={setEditingField}
              updateField={updateField}
              updateActivity={updateActivity}
              addActivity={addActivity}
              triggerUpload={triggerUpload}
              uploading={uploading}
            />
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}

// ========== 四種風格模板 ==========

interface TemplateProps {
  editingDay: DailyItinerary
  dayIndex: number
  dateDisplay: string
  mainImage?: string
  editingField: string | null
  setEditingField: (field: string | null) => void
  updateField: (field: keyof DailyItinerary, value: unknown) => void
  updateActivity: (actIndex: number, field: keyof Activity, value: string) => void
  addActivity: () => void
  triggerUpload: (target: { type: 'activity' | 'day'; index?: number }) => void
  uploading: string | null
}

// 單張大圖風格
function SingleImageTemplate({
  editingDay,
  dayIndex,
  dateDisplay,
  mainImage,
  editingField,
  setEditingField,
  updateField,
  updateActivity,
  addActivity,
  triggerUpload,
  uploading,
}: TemplateProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* 大圖區域 */}
      <div className="relative h-64">
        <UploadableImage
          src={mainImage}
          alt={editingDay.title}
          targetKey={{ type: 'activity', index: 0 }}
          triggerUpload={triggerUpload}
          uploading={uploading}
          className="w-full h-full"
          emptySize="h-64"
        />
        {/* 漸層遮罩 + 標題 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="text-sm opacity-80 mb-1">{dateDisplay} • Day {dayIndex + 1}</div>
          <EditableText
            value={editingDay.title}
            fieldKey="title"
            editingField={editingField}
            setEditingField={setEditingField}
            onChange={v => updateField('title', v)}
            className="text-2xl font-bold text-white"
            placeholder="行程標題"
            inputClassName="bg-white/20 text-white placeholder:text-white/50"
          />
        </div>
      </div>

      {/* 內容區 */}
      <div className="p-6">
        <EditableText
          value={editingDay.description || ''}
          fieldKey="description"
          editingField={editingField}
          setEditingField={setEditingField}
          onChange={v => updateField('description', v)}
          className="text-gray-600 mb-4"
          placeholder="行程描述..."
          multiline
        />

        {/* 景點列表 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">景點活動</span>
            <button type="button" onClick={addActivity} className="text-xs text-[#c76d54] hover:underline flex items-center gap-1">
              <Plus size={12} /> 新增
            </button>
          </div>
          {editingDay.activities.map((act, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
              <UploadableImage
                src={act.image}
                alt={act.title}
                targetKey={{ type: 'activity', index: i }}
                triggerUpload={triggerUpload}
                uploading={uploading}
                className="w-12 h-12 rounded-lg flex-shrink-0"
                emptySize="w-12 h-12"
              />
              <div className="flex-1">
                <EditableText
                  value={act.title}
                  fieldKey={`activity-${i}-title`}
                  editingField={editingField}
                  setEditingField={setEditingField}
                  onChange={v => updateActivity(i, 'title', v)}
                  className="font-medium text-gray-900 text-sm"
                  placeholder="景點名稱"
                />
              </div>
            </div>
          ))}
        </div>

        {/* 餐食 + 住宿 */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-sm">
          <div className="flex-1">
            <span className="text-gray-400">午餐：</span>
            <EditableText
              value={editingDay.meals?.lunch || ''}
              fieldKey="meals-lunch"
              editingField={editingField}
              setEditingField={setEditingField}
              onChange={v => updateField('meals', { ...editingDay.meals, lunch: v })}
              className="inline text-gray-700"
              placeholder="午餐"
            />
          </div>
          <div className="flex-1">
            <span className="text-gray-400">住宿：</span>
            <EditableText
              value={editingDay.accommodation || ''}
              fieldKey="accommodation"
              editingField={editingField}
              setEditingField={setEditingField}
              onChange={v => updateField('accommodation', v)}
              className="inline text-gray-700"
              placeholder="住宿"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// 多圖輪播風格
function MultiImageTemplate({
  editingDay,
  dayIndex,
  dateDisplay,
  editingField,
  setEditingField,
  updateField,
  updateActivity,
  addActivity,
  triggerUpload,
  uploading,
}: Omit<TemplateProps, 'mainImage'>) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* 標題區 */}
      <div className="p-6 bg-gradient-to-r from-[#8da399] to-[#6b8577]">
        <div className="text-white/80 text-sm mb-1">{dateDisplay}</div>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-light text-white/30">0{dayIndex + 1}</span>
          <EditableText
            value={editingDay.title}
            fieldKey="title"
            editingField={editingField}
            setEditingField={setEditingField}
            onChange={v => updateField('title', v)}
            className="text-xl font-bold text-white"
            placeholder="行程標題"
            inputClassName="bg-white/20 text-white placeholder:text-white/50"
          />
        </div>
      </div>

      {/* 圖片輪播區 */}
      <div className="p-4 bg-gray-50">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {editingDay.activities.map((act, i) => (
            <div key={i} className="flex-shrink-0 w-40">
              <UploadableImage
                src={act.image}
                alt={act.title}
                targetKey={{ type: 'activity', index: i }}
                triggerUpload={triggerUpload}
                uploading={uploading}
                className="w-40 h-28 rounded-lg"
                emptySize="w-40 h-28"
              />
              <EditableText
                value={act.title}
                fieldKey={`activity-${i}-title`}
                editingField={editingField}
                setEditingField={setEditingField}
                onChange={v => updateActivity(i, 'title', v)}
                className="text-xs text-gray-600 mt-1 text-center"
                placeholder="景點名稱"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addActivity}
            className="flex-shrink-0 w-40 h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-[#8da399] hover:text-[#8da399] transition-colors"
          >
            <Plus size={24} />
            <span className="text-xs mt-1">新增圖片</span>
          </button>
        </div>
      </div>

      {/* 描述 + 餐食 */}
      <div className="p-6">
        <EditableText
          value={editingDay.description || ''}
          fieldKey="description"
          editingField={editingField}
          setEditingField={setEditingField}
          onChange={v => updateField('description', v)}
          className="text-gray-600 mb-4"
          placeholder="行程描述..."
          multiline
        />

        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Utensils size={14} className="text-[#8da399]" />
            <EditableText
              value={editingDay.meals?.lunch || ''}
              fieldKey="meals-lunch"
              editingField={editingField}
              setEditingField={setEditingField}
              onChange={v => updateField('meals', { ...editingDay.meals, lunch: v })}
              className="text-gray-700"
              placeholder="午餐"
            />
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-[#8da399]" />
            <EditableText
              value={editingDay.accommodation || ''}
              fieldKey="accommodation"
              editingField={editingField}
              setEditingField={setEditingField}
              onChange={v => updateField('accommodation', v)}
              className="text-gray-700"
              placeholder="住宿"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// 卡片網格風格
function CardGridTemplate({
  editingDay,
  dayIndex,
  dateDisplay,
  editingField,
  setEditingField,
  updateField,
  updateActivity,
  addActivity,
  triggerUpload,
  uploading,
}: Omit<TemplateProps, 'mainImage'>) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* 標題 */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[#B8A99A] flex flex-col items-center justify-center text-white">
            <span className="text-2xl font-bold">{dayIndex + 1}</span>
            <span className="text-[10px] opacity-80">{dateDisplay}</span>
          </div>
          <div>
            <EditableText
              value={editingDay.title}
              fieldKey="title"
              editingField={editingField}
              setEditingField={setEditingField}
              onChange={v => updateField('title', v)}
              className="text-xl font-bold text-gray-900"
              placeholder="行程標題"
            />
            <EditableText
              value={editingDay.description || ''}
              fieldKey="description"
              editingField={editingField}
              setEditingField={setEditingField}
              onChange={v => updateField('description', v)}
              className="text-sm text-gray-500 mt-1"
              placeholder="簡短描述..."
            />
          </div>
        </div>
      </div>

      {/* 景點卡片網格 */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {editingDay.activities.map((act, i) => (
            <div key={i} className="group relative bg-gray-50 rounded-xl overflow-hidden">
              <UploadableImage
                src={act.image}
                alt={act.title}
                targetKey={{ type: 'activity', index: i }}
                triggerUpload={triggerUpload}
                uploading={uploading}
                className="w-full h-32"
                emptySize="h-32"
              />
              <div className="p-3">
                <EditableText
                  value={act.title}
                  fieldKey={`activity-${i}-title`}
                  editingField={editingField}
                  setEditingField={setEditingField}
                  onChange={v => updateActivity(i, 'title', v)}
                  className="font-medium text-gray-900 text-sm"
                  placeholder="景點名稱"
                />
                <EditableText
                  value={act.description}
                  fieldKey={`activity-${i}-desc`}
                  editingField={editingField}
                  setEditingField={setEditingField}
                  onChange={v => updateActivity(i, 'description', v)}
                  className="text-xs text-gray-500 mt-1"
                  placeholder="景點描述"
                />
              </div>
            </div>
          ))}
          {/* 新增卡片 */}
          <button
            type="button"
            onClick={addActivity}
            className="h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-[#B8A99A] hover:text-[#B8A99A] transition-colors"
          >
            <Plus size={28} />
            <span className="text-sm mt-1">新增景點</span>
          </button>
        </div>
      </div>

      {/* 底部：餐食 + 住宿 */}
      <div className="px-6 py-4 bg-[#B8A99A]/5 border-t border-[#B8A99A]/20 flex gap-6">
        <div className="flex-1">
          <div className="text-xs text-[#B8A99A] font-medium mb-1">餐食安排</div>
          <div className="flex gap-4 text-sm">
            <span>
              早：<EditableText
                value={editingDay.meals?.breakfast || ''}
                fieldKey="meals-breakfast"
                editingField={editingField}
                setEditingField={setEditingField}
                onChange={v => updateField('meals', { ...editingDay.meals, breakfast: v })}
                className="inline text-gray-700"
                placeholder="飯店內"
              />
            </span>
            <span>
              午：<EditableText
                value={editingDay.meals?.lunch || ''}
                fieldKey="meals-lunch"
                editingField={editingField}
                setEditingField={setEditingField}
                onChange={v => updateField('meals', { ...editingDay.meals, lunch: v })}
                className="inline text-gray-700"
                placeholder="午餐"
              />
            </span>
            <span>
              晚：<EditableText
                value={editingDay.meals?.dinner || ''}
                fieldKey="meals-dinner"
                editingField={editingField}
                setEditingField={setEditingField}
                onChange={v => updateField('meals', { ...editingDay.meals, dinner: v })}
                className="inline text-gray-700"
                placeholder="晚餐"
              />
            </span>
          </div>
        </div>
        <div>
          <div className="text-xs text-[#B8A99A] font-medium mb-1">住宿</div>
          <EditableText
            value={editingDay.accommodation || ''}
            fieldKey="accommodation"
            editingField={editingField}
            setEditingField={setEditingField}
            onChange={v => updateField('accommodation', v)}
            className="text-sm text-gray-700"
            placeholder="住宿飯店"
          />
        </div>
      </div>
    </div>
  )
}

// 時間軸風格
function TimelineTemplate({
  editingDay,
  dayIndex,
  dateDisplay,
  editingField,
  setEditingField,
  updateField,
  updateActivity,
  addActivity,
  triggerUpload,
  uploading,
}: Omit<TemplateProps, 'mainImage'>) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* 標題區 */}
      <div className="p-6 bg-[#4a6fa5] text-white">
        <div className="flex items-center gap-4">
          <div className="text-5xl font-light opacity-30">{String(dayIndex + 1).padStart(2, '0')}</div>
          <div>
            <div className="text-sm opacity-80">{dateDisplay}</div>
            <EditableText
              value={editingDay.title}
              fieldKey="title"
              editingField={editingField}
              setEditingField={setEditingField}
              onChange={v => updateField('title', v)}
              className="text-xl font-bold text-white"
              placeholder="行程標題"
              inputClassName="bg-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </div>
      </div>

      {/* 時間軸內容 */}
      <div className="p-6">
        <div className="relative pl-8">
          {/* 時間軸線 */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[#4a6fa5]/20" />

          {/* 景點 */}
          {editingDay.activities.map((act, i) => (
            <div key={i} className="relative mb-6 last:mb-0">
              {/* 時間點 */}
              <div className="absolute -left-5 w-4 h-4 rounded-full bg-[#4a6fa5] border-4 border-white shadow" />

              <div className="flex gap-4 bg-gray-50 rounded-xl p-4">
                <UploadableImage
                  src={act.image}
                  alt={act.title}
                  targetKey={{ type: 'activity', index: i }}
                  triggerUpload={triggerUpload}
                  uploading={uploading}
                  className="w-24 h-24 rounded-lg flex-shrink-0"
                  emptySize="w-24 h-24"
                />
                <div className="flex-1">
                  <EditableText
                    value={act.title}
                    fieldKey={`activity-${i}-title`}
                    editingField={editingField}
                    setEditingField={setEditingField}
                    onChange={v => updateActivity(i, 'title', v)}
                    className="font-bold text-gray-900"
                    placeholder="景點名稱"
                  />
                  <EditableText
                    value={act.description}
                    fieldKey={`activity-${i}-desc`}
                    editingField={editingField}
                    setEditingField={setEditingField}
                    onChange={v => updateActivity(i, 'description', v)}
                    className="text-sm text-gray-600 mt-1"
                    placeholder="景點描述..."
                    multiline
                  />
                </div>
              </div>
            </div>
          ))}

          {/* 新增按鈕 */}
          <div className="relative">
            <div className="absolute -left-5 w-4 h-4 rounded-full bg-gray-300 border-4 border-white" />
            <button
              type="button"
              onClick={addActivity}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-[#4a6fa5] hover:text-[#4a6fa5] transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              <span>新增行程點</span>
            </button>
          </div>
        </div>

        {/* 餐食 + 住宿 */}
        <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-[#4a6fa5] font-medium mb-1 flex items-center gap-1">
              <Utensils size={12} /> 午餐
            </div>
            <EditableText
              value={editingDay.meals?.lunch || ''}
              fieldKey="meals-lunch"
              editingField={editingField}
              setEditingField={setEditingField}
              onChange={v => updateField('meals', { ...editingDay.meals, lunch: v })}
              className="text-sm text-gray-700"
              placeholder="午餐安排"
            />
          </div>
          <div>
            <div className="text-xs text-[#4a6fa5] font-medium mb-1 flex items-center gap-1">
              <Utensils size={12} /> 晚餐
            </div>
            <EditableText
              value={editingDay.meals?.dinner || ''}
              fieldKey="meals-dinner"
              editingField={editingField}
              setEditingField={setEditingField}
              onChange={v => updateField('meals', { ...editingDay.meals, dinner: v })}
              className="text-sm text-gray-700"
              placeholder="晚餐安排"
            />
          </div>
          <div>
            <div className="text-xs text-[#4a6fa5] font-medium mb-1 flex items-center gap-1">
              <Building2 size={12} /> 住宿
            </div>
            <EditableText
              value={editingDay.accommodation || ''}
              fieldKey="accommodation"
              editingField={editingField}
              setEditingField={setEditingField}
              onChange={v => updateField('accommodation', v)}
              className="text-sm text-gray-700"
              placeholder="住宿飯店"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// 可編輯文字組件
function EditableText({
  value,
  fieldKey,
  editingField,
  setEditingField,
  onChange,
  className = '',
  placeholder = '點擊編輯...',
  multiline = false,
  inputClassName = '',
}: {
  value: string
  fieldKey: string
  editingField: string | null
  setEditingField: (field: string | null) => void
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  multiline?: boolean
  inputClassName?: string
}) {
  const isEditing = editingField === fieldKey

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => setEditingField(null)}
          onKeyDown={e => {
            if (e.key === 'Escape') setEditingField(null)
          }}
          className={`w-full px-2 py-1 border-2 border-[#2C5F4D] rounded resize-none outline-none ${inputClassName} ${className}`}
          rows={3}
          placeholder={placeholder}
        />
      )
    }
    return (
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setEditingField(null)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === 'Escape') setEditingField(null)
        }}
        className={`w-full px-2 py-1 border-2 border-[#2C5F4D] rounded outline-none ${inputClassName} ${className}`}
        placeholder={placeholder}
      />
    )
  }

  return (
    <div
      onClick={() => setEditingField(fieldKey)}
      className={`cursor-pointer hover:bg-[#2C5F4D]/10 rounded px-1 py-0.5 transition-all border border-transparent hover:border-[#2C5F4D]/30 ${className}`}
      title="點擊編輯"
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </div>
  )
}

// 可上傳圖片組件
function UploadableImage({
  src,
  alt,
  targetKey,
  triggerUpload,
  uploading,
  className = '',
  emptySize = 'h-48',
}: {
  src?: string
  alt: string
  targetKey: { type: 'activity' | 'day'; index?: number }
  triggerUpload: (target: { type: 'activity' | 'day'; index?: number }) => void
  uploading: string | null
  className?: string
  emptySize?: string
}) {
  const uploadKey = targetKey.type === 'activity' ? `activity-${targetKey.index}` : 'day'
  const isUploading = uploading === uploadKey

  if (src) {
    return (
      <div
        className={`relative group cursor-pointer overflow-hidden ${className}`}
        onClick={() => triggerUpload(targetKey)}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {isUploading ? (
            <Loader2 size={24} className="text-white animate-spin" />
          ) : (
            <div className="text-white text-center">
              <Upload size={20} className="mx-auto mb-1" />
              <span className="text-xs">更換圖片</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${emptySize} bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 hover:border-[#2C5F4D] transition-colors ${className}`}
      onClick={() => triggerUpload(targetKey)}
    >
      {isUploading ? (
        <Loader2 size={20} className="text-gray-400 animate-spin" />
      ) : (
        <>
          <ImageIcon size={20} className="text-gray-400 mb-1" />
          <span className="text-xs text-gray-400">上傳圖片</span>
        </>
      )}
    </div>
  )
}
