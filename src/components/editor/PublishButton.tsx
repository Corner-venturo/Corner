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
import { Save, FilePlus, History, Link2, Check, Copy, ExternalLink, Trash2, Files } from 'lucide-react'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { generateUUID } from '@/lib/utils/uuid'
import { logger } from '@/lib/utils/logger'

// 移除 HTML 標籤
const stripHtml = (html: string | undefined): string => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

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
  onVersionRecordsChange?: (versionRecords: ItineraryVersionRecord[]) => void // 儲存後更新版本記錄
}

export function PublishButton({ data, currentVersionIndex, onVersionChange, onVersionRecordsChange }: PublishButtonProps) {
  const [saving, setSaving] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showSaveAsNewDialog, setShowSaveAsNewDialog] = useState(false)
  const [versionNote, setVersionNote] = useState('')
  const [newFileName, setNewFileName] = useState('')
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
    flight_style: data.flightStyle || 'original',
    itinerary_style: data.itineraryStyle || 'original',
    price: data.price || null,
    price_note: data.priceNote || null,
    country: data.country,
    city: data.city,
    status: (data.status || '提案') as '提案' | '進行中',
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
          // 更新主版本（同時更新版本 1 的資料）
          let updatedRecords = [...versionRecords]
          if (updatedRecords.length > 0) {
            // 同步更新版本 1 的內容
            updatedRecords[0] = {
              ...updatedRecords[0],
              note: stripHtml(data.title) || updatedRecords[0].note, // 更新版本名稱
              daily_itinerary: data.dailyItinerary || [],
              features: data.features,
              focus_cards: data.focusCards,
              leader: data.leader,
              meeting_info: data.meetingInfo as { time: string; location: string } | undefined,
              hotels: data.hotels,
            }
          } else {
            // 如果沒有版本記錄，自動建立版本 1
            const firstVersion: ItineraryVersionRecord = {
              id: generateUUID(),
              version: 1,
              note: stripHtml(data.title) || '版本 1',
              daily_itinerary: data.dailyItinerary || [],
              features: data.features,
              focus_cards: data.focusCards,
              leader: data.leader,
              meeting_info: data.meetingInfo as { time: string; location: string } | undefined,
              hotels: data.hotels,
              created_at: new Date().toISOString(),
            }
            updatedRecords = [firstVersion]
          }
          await update(data.id, { ...convertedData, version_records: updatedRecords })
          // 通知父組件更新版本記錄
          onVersionRecordsChange?.(updatedRecords)
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
          // 通知父組件更新版本記錄
          onVersionRecordsChange?.(updatedRecords)
        }
      } else {
        // 第一次建立，自動建立版本 1（名稱 = 行程名稱）
        const firstVersion: ItineraryVersionRecord = {
          id: generateUUID(),
          version: 1,
          note: stripHtml(data.title) || '版本 1',
          daily_itinerary: data.dailyItinerary || [],
          features: data.features,
          focus_cards: data.focusCards,
          leader: data.leader,
          meeting_info: data.meetingInfo as { time: string; location: string } | undefined,
          hotels: data.hotels,
          created_at: new Date().toISOString(),
        }

        const newItinerary = await create({
          ...convertedData,
          created_by: user?.id || undefined,
          version_records: [firstVersion],
        } as Parameters<typeof create>[0])

        if (newItinerary?.id) {
          router.replace(`/itinerary/new?itinerary_id=${newItinerary.id}`)
        }
      }
    } catch (error) {
      logger.error('儲存失敗:', error)
      await alert('儲存失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
    } finally {
      setSaving(false)
    }
  }

  // 另存新版本
  const saveAsNewVersion = async () => {
    if (!data.id) {
      await alert('請先儲存行程表才能另存新版本', 'warning')
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
      // 通知父組件更新版本記錄
      onVersionRecordsChange?.(updatedRecords)

      setShowSaveDialog(false)
      setVersionNote('')

      // 切換到新版本
      onVersionChange(updatedRecords.length - 1, newVersion)
    } catch (error) {
      logger.error('另存新版本失敗:', error)
      await alert('另存新版本失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
    } finally {
      setSaving(false)
    }
  }

  // 另存新檔（創建全新的行程表，有新的 ID 和連結）
  const saveAsNewFile = async () => {
    setSaving(true)
    try {
      const convertedData = convertData()

      // 創建全新的行程表
      const newItinerary = await create({
        ...convertedData,
        title: newFileName || `${stripHtml(data.title) || '行程表'} (複本)`,
        created_by: user?.id || undefined,
        version_records: [], // 新檔案不繼承版本記錄
      } as Parameters<typeof create>[0])

      if (newItinerary?.id) {
        setShowSaveAsNewDialog(false)
        setNewFileName('')
        // 使用 window.location.href 強制刷新頁面，確保載入新資料
        // 不用 router.push 是因為頁面有 ref 快取機制會阻止重新載入
        window.location.href = `/itinerary/new?itinerary_id=${newItinerary.id}`
      }
    } catch (error) {
      logger.error('另存新檔失敗:', error)
      await alert('另存新檔失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
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

    const confirmed = await confirm(`確定要刪除「${versionName}」嗎？`, {
      title: '刪除版本',
      type: 'warning',
    })
    if (!confirmed) return

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
      logger.error('刪除版本失敗:', error)
      await alert('刪除版本失敗：' + (error instanceof Error ? error.message : '未知錯誤'), 'error')
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
    if (currentVersionIndex === -1) {
      // 主版本 = 版本 1
      const firstVersion = versionRecords[0]
      return stripHtml(firstVersion?.note) || stripHtml(data.title) || '版本 1'
    }
    const record = versionRecords[currentVersionIndex]
    return stripHtml(record?.note) || `版本 ${record?.version || currentVersionIndex + 1}`
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={saving}
                size="sm"
                variant="outline"
                className="h-8 px-3 border-morandi-container hover:bg-morandi-container/30"
              >
                <FilePlus size={14} className="mr-1.5" />
                另存
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                className="flex items-center gap-2 py-2 cursor-pointer"
                onClick={() => setShowSaveDialog(true)}
              >
                <FilePlus size={14} className="text-morandi-secondary" />
                <div className="flex flex-col">
                  <span className="font-medium">另存新版本</span>
                  <span className="text-xs text-morandi-secondary">相同連結，不同版本</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 py-2 cursor-pointer"
                onClick={() => {
                  setNewFileName(`${stripHtml(data.title) || '行程表'} (複本)`)
                  setShowSaveAsNewDialog(true)
                }}
              >
                <Files size={14} className="text-morandi-secondary" />
                <div className="flex flex-col">
                  <span className="font-medium">另存新檔</span>
                  <span className="text-xs text-morandi-secondary">創建新連結</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                版本歷史 {versionRecords.length > 0 && `(${versionRecords.length})`}
              </div>
              {/* 所有版本 */}
              {versionRecords.map((record, index) => {
                const isMainVersion = index === 0
                const isCurrentVersion = (isMainVersion && currentVersionIndex === -1) || currentVersionIndex === index
                return (
                  <DropdownMenuItem
                    key={record.id}
                    className="flex items-center justify-between py-2 cursor-pointer relative"
                    onMouseEnter={() => setHoveredVersionIndex(index)}
                    onMouseLeave={() => setHoveredVersionIndex(null)}
                    onClick={() => handleVersionSelect(isMainVersion ? '-1' : index.toString())}
                  >
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{stripHtml(record.note) || `版本 ${record.version}`}</span>
                        {isMainVersion && (
                          <span className="text-[10px] text-morandi-secondary bg-slate-100 px-1.5 py-0.5 rounded">主版本</span>
                        )}
                      </div>
                      <span className="text-xs text-morandi-secondary">
                        {record.created_at ? new Date(record.created_at).toLocaleString('zh-TW') : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCurrentVersion && (
                        <div className="text-xs bg-morandi-gold text-white px-2 py-0.5 rounded">當前</div>
                      )}
                      {/* 版本 1 (主版本) 不可刪除 */}
                      {hoveredVersionIndex === index && !isMainVersion && (
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
                )
              })}
              {versionRecords.length === 0 && (
                <div className="px-2 py-3 text-sm text-morandi-secondary text-center">
                  儲存後會自動建立版本 1
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

      {/* 另存新檔 Dialog */}
      <Dialog open={showSaveAsNewDialog} onOpenChange={setShowSaveAsNewDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Files size={18} />
              另存新檔
            </DialogTitle>
            <DialogDescription>
              將創建一個全新的行程表，有獨立的分享連結。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-file-name" className="text-sm font-medium">
              新檔案名稱
            </Label>
            <Input
              id="new-file-name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder={`${stripHtml(data.title) || '行程表'} (複本)`}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveAsNewDialog(false)}>
              取消
            </Button>
            <Button
              onClick={saveAsNewFile}
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
