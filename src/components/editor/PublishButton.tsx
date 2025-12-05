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
import { Save, GitBranch, Link2, Check, Copy, ExternalLink } from 'lucide-react'

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
  const [copied, setCopied] = useState(false)
  const { create, update } = useItineraryStore()
  const router = useRouter()

  const versionRecords = data.version_records || []
  const isEditMode = !!data.id

  // 分享連結（基於 ID，永久有效）
  const shareUrl = data.id
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/view/${data.id}`
    : null

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
      } else {
        // 第一次建立
        const newItinerary = await create({
          ...convertedData,
          version_records: [],
        } as Parameters<typeof create>[0])

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
      onVersionChange(-1)
    } else {
      const versionData = versionRecords[index]
      onVersionChange(index, versionData)
    }
  }

  // 複製連結
  const copyShareLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {/* 版本選擇器 */}
        {isEditMode && versionRecords.length > 0 && (
          <Select
            value={currentVersionIndex.toString()}
            onValueChange={handleVersionSelect}
          >
            <SelectTrigger className="w-[130px] h-9 text-sm border-morandi-container bg-white">
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

        {/* 按鈕群組 */}
        <div className="flex items-center rounded-lg border border-morandi-container overflow-hidden bg-white shadow-sm">
          {/* 儲存按鈕 */}
          <button
            onClick={saveItinerary}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-morandi-primary hover:bg-morandi-container/50 disabled:opacity-50 transition-colors"
          >
            <Save size={15} />
            {saving ? '儲存中...' : '儲存'}
          </button>

          {/* 分隔線 */}
          {isEditMode && <div className="w-px h-6 bg-morandi-container" />}

          {/* 另存新版本按鈕 */}
          {isEditMode && (
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-morandi-secondary hover:bg-morandi-container/50 hover:text-morandi-primary disabled:opacity-50 transition-colors"
              title="另存新版本"
            >
              <GitBranch size={15} />
              <span className="hidden sm:inline">新版本</span>
            </button>
          )}
        </div>

        {/* 分享連結區塊 */}
        {isEditMode && shareUrl && (
          <div className="flex items-center gap-1 px-2 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <Link2 size={14} className="text-emerald-600 flex-shrink-0" />
            <span className="text-xs text-emerald-700 max-w-[120px] truncate hidden sm:block">
              {shareUrl.replace(/^https?:\/\//, '').split('/view/')[0]}/...
            </span>
            <button
              onClick={copyShareLink}
              className="p-1 hover:bg-emerald-100 rounded transition-colors"
              title="複製連結"
            >
              {copied ? (
                <Check size={14} className="text-emerald-600" />
              ) : (
                <Copy size={14} className="text-emerald-600" />
              )}
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-emerald-100 rounded transition-colors"
              title="在新分頁開啟"
            >
              <ExternalLink size={14} className="text-emerald-600" />
            </a>
          </div>
        )}
      </div>

      {/* 另存新版本 Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch size={18} />
              另存新版本
            </DialogTitle>
            <DialogDescription>
              為這個版本取一個名稱，方便之後辨識。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="version-note" className="text-sm font-medium">
              版本名稱
            </Label>
            <Input
              id="version-note"
              value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)}
              placeholder={`版本 ${versionRecords.length + 1}`}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              取消
            </Button>
            <Button
              onClick={saveAsNewVersion}
              disabled={saving}
              className="bg-morandi-gold hover:bg-morandi-gold-hover"
            >
              {saving ? '儲存中...' : '確認另存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
