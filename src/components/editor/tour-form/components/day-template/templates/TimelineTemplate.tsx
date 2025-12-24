'use client'

import React from 'react'
import { Plus, Utensils, Building2 } from 'lucide-react'
import { DailyItinerary, Activity } from '../../../types'
import { UploadableImage } from '../UploadableImage'
import { EditableText } from '../EditableText'

interface TimelineTemplateProps {
  editingDay: DailyItinerary
  dayIndex: number
  dateDisplay: string
  editingField: string | null
  setEditingField: (field: string | null) => void
  updateField: (field: keyof DailyItinerary, value: unknown) => void
  updateActivity: (actIndex: number, field: keyof Activity, value: string) => void
  addActivity: () => void
  triggerUpload: (target: { type: 'activity' | 'day'; index?: number }) => void
  uploading: string | null
}

export function TimelineTemplate({
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
}: TimelineTemplateProps) {
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
