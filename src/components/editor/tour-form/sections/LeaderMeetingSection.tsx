import React from 'react'
import { TourFormData, MeetingPoint } from '../types'
import { Plus, X } from 'lucide-react'

interface LeaderMeetingSectionProps {
  data: TourFormData
  updateNestedField: (parent: string, field: string, value: unknown) => void
  updateField: (field: string, value: unknown) => void
}

export function LeaderMeetingSection({
  data,
  updateNestedField,
  updateField,
}: LeaderMeetingSectionProps) {
  // 確保 meetingPoints 是陣列
  const meetingPoints = data.meetingPoints || []

  const addMeetingPoint = () => {
    updateField('meetingPoints', [...meetingPoints, { time: '', location: '' }])
  }

  const updateMeetingPoint = (index: number, field: keyof MeetingPoint, value: string) => {
    const updated = [...meetingPoints]
    updated[index] = { ...updated[index], [field]: value }
    updateField('meetingPoints', updated)
  }

  const removeMeetingPoint = (index: number) => {
    updateField(
      'meetingPoints',
      meetingPoints.filter((_, i) => i !== index)
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-morandi-primary border-b-2 border-purple-500 pb-2 flex-1">
          👤 領隊與集合資訊
        </h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.showLeaderMeeting !== false}
            onChange={e => updateField('showLeaderMeeting', e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          <span className="text-morandi-primary">顯示此區塊</span>
        </label>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg space-y-3">
        <h3 className="font-bold text-purple-900">領隊資訊</h3>
        <div>
          <label className="block text-sm font-medium text-morandi-primary mb-1">領隊姓名</label>
          <input
            type="text"
            value={data.leader?.name || ''}
            onChange={e => updateNestedField('leader', 'name', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="鍾惠如 小姐"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">國內電話</label>
            <input
              type="text"
              value={data.leader?.domesticPhone || ''}
              onChange={e => updateNestedField('leader', 'domesticPhone', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="+886 0928402897"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">國外電話</label>
            <input
              type="text"
              value={data.leader?.overseasPhone || ''}
              onChange={e => updateNestedField('leader', 'overseasPhone', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              placeholder="+81 08074371189"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-blue-900">集合資訊</h3>
          <button
            type="button"
            onClick={addMeetingPoint}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus size={16} />
            新增集合地點
          </button>
        </div>

        {meetingPoints.length === 0 && (
          <p className="text-sm text-morandi-secondary text-center py-4">
            尚未新增集合地點，點擊「新增集合地點」按鈕開始
          </p>
        )}

        {meetingPoints.map((point, index) => (
          <div
            key={index}
            className="bg-white p-3 rounded-lg border border-blue-200 space-y-3 relative"
          >
            <button
              type="button"
              onClick={() => removeMeetingPoint(index)}
              className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="移除此集合地點"
            >
              <X size={16} />
            </button>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  集合時間 {index + 1}
                </label>
                <input
                  type="text"
                  value={point.time}
                  onChange={e => updateMeetingPoint(index, 'time', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="2025/10/21 04:50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-morandi-primary mb-1">
                  集合地點 {index + 1}
                </label>
                <input
                  type="text"
                  value={point.location}
                  onChange={e => updateMeetingPoint(index, 'location', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="桃園機場華航第二航廈 7號櫃台"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
