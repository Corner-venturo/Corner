'use client'

import { useState } from 'react'
import { useItineraryStore } from '@/stores'
import { useRouter } from 'next/navigation'
import type { TourFormData } from './tour-form/types'
import type { ItineraryVersionRecord } from '@/stores/types'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PublishButtonData extends Partial<TourFormData> {
  id?: string
  status?: string
  tourId?: string
  meetingInfo?: unknown
  version_records?: ItineraryVersionRecord[]
}

interface PublishButtonProps {
  data: PublishButtonData
  currentVersionIndex: number // -1 表示主版本, 0+ 表示 version_records 的索引
  onVersionChange: (index: number, versionData?: ItineraryVersionRecord) => void
}

export function PublishButton({ data, currentVersionIndex, onVersionChange }: PublishButtonProps) {
  const [saving, setSaving] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [versionNote, setVersionNote] = useState('')
  const { create, update } = useItineraryStore()
  const router = useRouter()

  const versionRecords = data.version_records || []
  const isEditMode = !!data.id

  // 轉換資料格式（camelCase → snake_case）
  const convertData = () => ({
    tour_id: data.tourId || undefined,
    tagline: data.tagline,
    title: data.title,
    subtitle: data.subtitle,
    description: data.description,
    departure_date: data.departureDate,
    tour_code: data.tourCode,
    cover_image: data.coverImage,
    country: data.country,
    city: data.city,
    status: (data.status || 'draft') as 'draft' | 'published',
    outbound_flight: data.outboundFlight,
    return_flight: data.returnFlight,
    features: data.features,
    focus_cards: data.focusCards,
    leader: data.leader,
    meeting_info: data.meetingInfo as { time: string; location: string } | undefined,
    hotels: data.hotels,
    show_features: data.showFeatures,
    show_leader_meeting: data.showLeaderMeeting,
    show_hotels: data.showHotels,
    itinerary_subtitle: data.itinerarySubtitle,
    daily_itinerary: data.dailyItinerary,
  })

  // 儲存（覆蓋目前版本）
  const saveItinerary = async () => {
    setSaving(true)
    try {
      const convertedData = convertData()

      if (data.id) {
        if (currentVersionIndex === -1) {
          // 更新主版本
          await update(data.id, convertedData)
        } else {
          // 更新特定版本記錄
          const updatedRecords = [...versionRecords]
          updatedRecords[currentVersionIndex] = {
            ...updatedRecords[currentVersionIndex],
            daily_itinerary: data.dailyItinerary || [],
            features: data.features,
            focus_cards: data.focusCards,
            leader: data.leader,
            meeting_info: data.meetingInfo as { time: string; location: string } | undefined,
            hotels: data.hotels,
          }
          await update(data.id, { version_records: updatedRecords })
        }
        alert('儲存成功！')
      } else {
        // 第一次建立
        const newItinerary = await create({
          ...convertedData,
          version_records: [],
        } as Parameters<typeof create>[0])
        alert('儲存行程表成功！')

        if (newItinerary?.id) {
          router.replace(`/itinerary/new?itinerary_id=${newItinerary.id}`)
        }
      }
    } catch (error) {
      console.error('儲存失敗:', error)
      alert('儲存失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setSaving(false)
    }
  }

  // 另存新版本
  const saveAsNewVersion = async () => {
    if (!data.id) {
      alert('請先儲存行程表才能另存新版本')
      return
    }

    setSaving(true)
    try {
      const newVersion: ItineraryVersionRecord = {
        id: crypto.randomUUID(),
        version: versionRecords.length + 1,
        note: versionNote || `版本 ${versionRecords.length + 1}`,
        daily_itinerary: data.dailyItinerary || [],
        features: data.features,
        focus_cards: data.focusCards,
        leader: data.leader,
        meeting_info: data.meetingInfo as { time: string; location: string } | undefined,
        hotels: data.hotels,
        created_at: new Date().toISOString(),
      }

      const updatedRecords = [...versionRecords, newVersion]
      await update(data.id, { version_records: updatedRecords })

      alert(`已另存為「${newVersion.note}」`)
      setShowSaveDialog(false)
      setVersionNote('')

      // 切換到新版本
      onVersionChange(updatedRecords.length - 1, newVersion)
    } catch (error) {
      console.error('另存新版本失敗:', error)
      alert('另存新版本失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setSaving(false)
    }
  }

  // 載入版本
  const handleVersionSelect = (value: string) => {
    const index = parseInt(value, 10)
    if (index === -1) {
      // 主版本
      onVersionChange(-1)
    } else {
      // 其他版本
      const versionData = versionRecords[index]
      onVersionChange(index, versionData)
    }
  }

  // 產生分享連結
  const generateShareLink = () => {
    if (!data.id) {
      alert('請先儲存行程表才能產生連結！')
      return
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = `${baseUrl}/view/${data.id}`

    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        alert('分享連結已複製！\n\n' + shareUrl)
      })
      .catch(() => {
        alert('複製失敗，請手動複製：\n' + shareUrl)
      })
  }

  // 取得目前版本名稱
  const getCurrentVersionLabel = () => {
    if (currentVersionIndex === -1) {
      return '主版本'
    }
    return versionRecords[currentVersionIndex]?.note || `版本 ${currentVersionIndex + 1}`
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* 版本選擇器 */}
        {isEditMode && versionRecords.length > 0 && (
          <Select
            value={currentVersionIndex.toString()}
            onValueChange={handleVersionSelect}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="選擇版本" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-1">主版本</SelectItem>
              {versionRecords.map((record, index) => (
                <SelectItem key={record.id} value={index.toString()}>
                  {record.note || `版本 ${record.version}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* 目前版本標籤（沒有其他版本時顯示） */}
        {isEditMode && versionRecords.length === 0 && (
          <span className="text-sm text-morandi-secondary font-medium">
            主版本
          </span>
        )}

        {/* 儲存按鈕 */}
        <Button
          onClick={saveItinerary}
          disabled={saving}
          className="px-4 py-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {saving ? '儲存中...' : isEditMode ? '儲存' : '儲存行程表'}
        </Button>

        {/* 另存新版本按鈕（僅編輯模式顯示） */}
        {isEditMode && (
          <>
            <Button
              onClick={() => setShowSaveDialog(true)}
              disabled={saving}
              variant="default"
            >
              另存新版本
            </Button>

            <Button
              onClick={generateShareLink}
              variant="secondary"
            >
              產生連結
            </Button>
          </>
        )}
      </div>

      {/* 另存新版本 Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>另存新版本</DialogTitle>
            <DialogDescription>
              為這個版本取一個名稱，方便之後辨識。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="version-note" className="text-right">
                版本名稱
              </Label>
              <Input
                id="version-note"
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
                placeholder={`版本 ${versionRecords.length + 1}`}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              取消
            </Button>
            <Button onClick={saveAsNewVersion} disabled={saving}>
              {saving ? '儲存中...' : '確認另存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
