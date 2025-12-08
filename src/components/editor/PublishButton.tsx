'use client'

import { useState } from 'react'
import { useItineraryStore, useAuthStore } from '@/stores'
import { useRouter } from 'next/navigation'
import type { TourFormData } from './tour-form/types'
import type { ItineraryVersionRecord } from '@/stores/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, FilePlus, History, Link2, Check, Copy, ExternalLink, Trash2 } from 'lucide-react'
import { generateUUID } from '@/lib/utils/uuid'


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
  const [hoveredVersionIndex, setHoveredVersionIndex] = useState<number | null>(null)
  const { create, update } = useItineraryStore()
  const { user } = useAuthStore()
  const router = useRouter()

  const versionRecords = data.version_records || []
  const isEditMode = !!data.id

  // 分享連結（使用 ID，永久有效）
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
    cover_style: data.coverStyle || 'original',
    price: data.price || null,
    price_note: data.priceNote || null,
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
    show_pricing_details: data.showPricingDetails,
    pricing_details: data.pricingDetails,
    // 價格方案
    price_tiers: data.priceTiers || null,
    show_price_tiers: data.showPriceTiers || false,
    // 常見問題
    faqs: data.faqs || null,
    show_faqs: data.showFaqs || false,
    // 提醒事項
    notices: data.notices || null,
    show_notices: data.showNotices || false,
    // 取消政策
    cancellation_policy: data.cancellationPolicy || null,
    show_cancellation_policy: data.showCancellationPolicy || false,
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
        // 第一次建立，帶入登入者 ID
        const newItinerary = await create({
          ...convertedData,
          created_by: user?.id || undefined,
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
        id: generateUUID(),
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

  // 刪除版本
  const handleDeleteVersion = async (index: number) => {
    if (!data.id) return
    if (versionRecords.length <= 0) return

    const versionToDelete = versionRecords[index]
    const versionName = versionToDelete?.note || `版本 ${versionToDelete?.version || index + 1}`

    if (!confirm(`確定要刪除「${versionName}」嗎？`)) return

    try {
      const updatedRecords = versionRecords.filter((_, i) => i !== index)
      await update(data.id, { version_records: updatedRecords })

      // 如果刪除的是當前版本，切回主版本
      if (currentVersionIndex === index) {
        onVersionChange(-1)
      } else if (currentVersionIndex > index) {
        // 如果刪除的版本在當前版本之前，調整索引
        onVersionChange(currentVersionIndex - 1, versionRecords[currentVersionIndex - 1])
      }
    } catch (error) {
      console.error('刪除版本失敗:', error)
      alert('刪除版本失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
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

  // 取得目前版本名稱
  const getCurrentVersionName = () => {
    if (currentVersionIndex === -1) return '主版本'
    const record = versionRecords[currentVersionIndex]
    return record?.note || `版本 ${record?.version || currentVersionIndex + 1}`
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* 1. 存檔按鈕 */}
        <Button
          onClick={saveItinerary}
          disabled={saving}
          size="sm"
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white h-8 px-3"
        >
          <Save size={14} className="mr-1.5" />
          {saving ? '儲存中...' : '存檔'}
        </Button>

        {/* 2. 另存按鈕（編輯模式才顯示）*/}
        {isEditMode && (
          <Button
            onClick={() => setShowSaveDialog(true)}
            disabled={saving}
            size="sm"
            variant="outline"
            className="h-8 px-3 border-morandi-container hover:bg-morandi-container/30"
          >
            <FilePlus size={14} className="mr-1.5" />
            另存
          </Button>
        )}

        {/* 3. 版本選擇器（編輯模式就顯示）*/}
        {isEditMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs border-morandi-container bg-white"
              >
                <History size={14} className="mr-1.5 text-morandi-secondary" />
                {getCurrentVersionName()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <div className="px-2 py-1.5 text-sm font-medium text-morandi-primary border-b border-border">
                版本歷史
              </div>
              {/* 主版本 */}
              <DropdownMenuItem
                className="flex items-center justify-between py-2 cursor-pointer"
                onClick={() => handleVersionSelect('-1')}
              >
                <span className="font-medium">{data.tourCode || '原始版本'}</span>
                {currentVersionIndex === -1 && (
                  <div className="text-xs bg-morandi-gold text-white px-2 py-0.5 rounded">當前</div>
                )}
              </DropdownMenuItem>
              {/* 其他版本 */}
              {versionRecords.map((record, index) => (
                <DropdownMenuItem
                  key={record.id}
                  className="flex items-center justify-between py-2 cursor-pointer relative"
                  onMouseEnter={() => setHoveredVersionIndex(index)}
                  onMouseLeave={() => setHoveredVersionIndex(null)}
                  onClick={() => handleVersionSelect(index.toString())}
                >
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{record.note || `版本 ${record.version}`}</span>
                    <span className="text-xs text-morandi-secondary">
                      {record.created_at ? new Date(record.created_at).toLocaleString('zh-TW') : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentVersionIndex === index && (
                      <div className="text-xs bg-morandi-gold text-white px-2 py-0.5 rounded">當前</div>
                    )}
                    {hoveredVersionIndex === index && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteVersion(index)
                        }}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="刪除版本"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              {versionRecords.length === 0 && (
                <div className="px-2 py-3 text-sm text-morandi-secondary text-center">
                  尚無其他版本，點擊「另存」創建新版本
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* 4. 連結按鈕（編輯模式且有 shareUrl 才顯示）*/}
        {isEditMode && shareUrl && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
              >
                <Link2 size={14} className="mr-1.5" />
                連結
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="end">
              <div className="space-y-2">
                <div className="text-sm font-medium text-morandi-primary">分享連結</div>
                <div className="flex items-center gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="text-xs h-8 bg-gray-50"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 flex-shrink-0"
                    onClick={copyShareLink}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 flex-shrink-0"
                    asChild
                  >
                    <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={14} />
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-morandi-secondary">
                  此連結可分享給客戶，無需登入即可查看行程
                </p>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* 另存新版本 Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FilePlus size={18} />
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
