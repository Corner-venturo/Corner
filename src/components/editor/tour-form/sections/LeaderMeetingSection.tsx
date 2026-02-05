import React, { useEffect, useRef, useState } from 'react'
import { TourFormData, MeetingPoint } from '../types'
import { Plus, X, Upload, User, Loader2 } from 'lucide-react'
import { uploadFileToStorage } from '@/services/storage'

interface LeaderMeetingSectionProps {
  data: TourFormData
  updateNestedField: (parent: string, field: string, value: unknown) => void
  updateField: (field: string, value: unknown) => void
}

// 計算起飛前三小時的集合時間
function calculateMeetingTime(departureDate: string | undefined, departureTime: string | undefined): string {
  if (!departureDate || !departureTime) return ''

  try {
    // 解析日期 (格式: YYYY-MM-DD 或 YYYY/MM/DD)
    const dateStr = departureDate.replace(/\//g, '-')
    // 解析時間 (格式: HH:MM)
    const [hours, minutes] = departureTime.split(':').map(Number)

    if (isNaN(hours) || isNaN(minutes)) return ''

    // 建立完整日期時間
    const departure = new Date(`${dateStr}T${departureTime}:00`)
    if (isNaN(departure.getTime())) return ''

    // 減去3小時
    departure.setHours(departure.getHours() - 3)

    // 格式化輸出: YYYY/MM/DD HH:MM
    const year = departure.getFullYear()
    const month = String(departure.getMonth() + 1).padStart(2, '0')
    const day = String(departure.getDate()).padStart(2, '0')
    const hour = String(departure.getHours()).padStart(2, '0')
    const minute = String(departure.getMinutes()).padStart(2, '0')

    return `${year}/${month}/${day} ${hour}:${minute}`
  } catch {
    return ''
  }
}

export function LeaderMeetingSection({
  data,
  updateNestedField,
  updateField,
}: LeaderMeetingSectionProps) {
  // 確保 meetingPoints 是陣列
  const meetingPoints = data.meetingPoints || []

  // 追蹤是否已自動填入過
  const hasAutoFilledRef = useRef(false)

  // 頭像上傳狀態
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // 頭像上傳處理
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      return
    }

    setIsUploadingPhoto(true)
    try {
      const result = await uploadFileToStorage(file, {
        bucket: 'workspace-files',
        folder: 'leader-photos',
      })
      updateNestedField('leader', 'photo', result.publicUrl)
    } catch (error) {
      console.error('Failed to upload leader photo:', error)
    } finally {
      setIsUploadingPhoto(false)
      // 清空 input 以允許重複上傳相同檔案
      if (photoInputRef.current) {
        photoInputRef.current.value = ''
      }
    }
  }

  // 移除頭像
  const handleRemovePhoto = () => {
    updateNestedField('leader', 'photo', null)
  }

  // 當有領隊資料且沒有集合地點時，自動新增一個並帶入時間
  useEffect(() => {
    const hasLeaderName = data.leader?.name && data.leader.name.trim() !== ''
    const hasMeetingPoints = meetingPoints.length > 0
    const hasFlightInfo = data.outboundFlight?.departureTime && data.departureDate

    // 只在有領隊、沒有集合點、有航班資訊、且尚未自動填入過時執行
    if (hasLeaderName && !hasMeetingPoints && hasFlightInfo && !hasAutoFilledRef.current) {
      const meetingTime = calculateMeetingTime(data.departureDate, data.outboundFlight.departureTime)
      if (meetingTime) {
        hasAutoFilledRef.current = true
        updateField('meetingPoints', [{ time: meetingTime, location: '' }])
      }
    }
  }, [data.leader?.name, data.outboundFlight?.departureTime, data.departureDate, meetingPoints.length, updateField])

  const addMeetingPoint = () => {
    // 新增集合點時，自動帶入起飛前三小時
    const meetingTime = calculateMeetingTime(data.departureDate, data.outboundFlight?.departureTime)
    updateField('meetingPoints', [...meetingPoints, { time: meetingTime || '', location: '' }])
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
        <h2 className="text-lg font-bold text-morandi-primary border-b-2 border-morandi-gold pb-2 flex-1">
          領隊與集合資訊
        </h2>
        <span className="text-xs text-morandi-secondary">有填寫資料時自動顯示</span>
      </div>

      <div className="bg-morandi-container/20 p-4 rounded-lg space-y-3">
        <h3 className="font-bold text-morandi-secondary">領隊資訊</h3>

        {/* 頭像上傳 */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="relative group">
              {data.leader?.photo ? (
                <div className="relative">
                  <img
                    src={data.leader.photo}
                    alt="領隊頭像"
                    className="w-20 h-20 rounded-full object-cover border-2 border-morandi-container"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-1 -right-1 p-1 bg-morandi-red text-white rounded-full hover:bg-morandi-red/80 transition-colors"
                    title="移除頭像"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div
                  className="w-20 h-20 rounded-full bg-morandi-container/50 flex items-center justify-center cursor-pointer hover:bg-morandi-container transition-colors border-2 border-dashed border-morandi-container"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {isUploadingPhoto ? (
                    <Loader2 size={24} className="text-morandi-secondary animate-spin" />
                  ) : (
                    <User size={24} className="text-morandi-secondary" />
                  )}
                </div>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            {!data.leader?.photo && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="mt-2 flex items-center gap-1 text-xs text-morandi-secondary hover:text-morandi-primary transition-colors"
              >
                <Upload size={12} />
                上傳頭像
              </button>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-morandi-primary mb-1">領隊姓名</label>
            <input
              type="text"
              value={data.leader?.name || ''}
              onChange={e => updateNestedField('leader', 'name', e.target.value)}
              className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
              placeholder="鍾惠如 小姐"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">國內電話</label>
            <input
              type="text"
              value={data.leader?.domesticPhone || ''}
              onChange={e => updateNestedField('leader', 'domesticPhone', e.target.value)}
              className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
              placeholder="+886 0928402897"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-morandi-primary mb-1">國外電話</label>
            <input
              type="text"
              value={data.leader?.overseasPhone || ''}
              onChange={e => updateNestedField('leader', 'overseasPhone', e.target.value)}
              className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
              placeholder="+81 08074371189"
            />
          </div>
        </div>
      </div>

      <div className="bg-morandi-container/20 p-4 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-morandi-secondary">集合資訊</h3>
          <button
            type="button"
            onClick={addMeetingPoint}
            className="flex items-center gap-1 px-3 py-1.5 bg-morandi-gold text-white rounded-lg hover:bg-morandi-gold-hover transition-colors text-sm"
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
            className="bg-card p-3 rounded-lg border border-morandi-container space-y-3 relative"
          >
            <button
              type="button"
              onClick={() => removeMeetingPoint(index)}
              className="absolute top-2 right-2 p-1 text-morandi-red hover:bg-morandi-red/10 rounded transition-colors"
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
                  className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
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
                  className="w-full px-3 py-2 border border-morandi-container rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50 focus:border-morandi-gold"
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
