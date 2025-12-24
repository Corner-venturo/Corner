'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { Activity } from '../../types'
import { UploadableImage } from './UploadableImage'
import { EditableText } from './EditableText'

interface ActivityListProps {
  activities: Activity[]
  editingField: string | null
  setEditingField: (field: string | null) => void
  updateActivity: (actIndex: number, field: keyof Activity, value: string) => void
  addActivity: () => void
  triggerUpload: (target: { type: 'activity' | 'day'; index?: number }) => void
  uploading: string | null
  variant?: 'default' | 'compact' | 'timeline'
}

export function ActivityList({
  activities,
  editingField,
  setEditingField,
  updateActivity,
  addActivity,
  triggerUpload,
  uploading,
  variant = 'default',
}: ActivityListProps) {
  if (variant === 'timeline') {
    return (
      <div className="relative pl-8">
        {/* 時間軸線 */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[#4a6fa5]/20" />

        {/* 景點 */}
        {activities.map((act, i) => (
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
    )
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">景點活動</span>
          <button type="button" onClick={addActivity} className="text-xs text-[#c76d54] hover:underline flex items-center gap-1">
            <Plus size={12} /> 新增
          </button>
        </div>
        {activities.map((act, i) => (
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
    )
  }

  // Default variant (grid)
  return (
    <div className="grid grid-cols-2 gap-4">
      {activities.map((act, i) => (
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
  )
}
