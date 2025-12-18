'use client'

import React, { useState } from 'react'
import { ArrowLeft, Save, Trash2, Map, RefreshCw, ArrowLeftRight, FilePlus, Plane, Contact } from 'lucide-react'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ParticipantCounts, VersionRecord, CostCategory } from '../types'

// 移除 HTML 標籤
const stripHtml = (html: string | undefined): string => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}
import type { Quote as StoreQuote } from '@/stores/types'
import { Tour } from '@/types/tour.types'

// 版本圖示
function HistoryIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
      <path d="M3 3v5h5"></path>
      <path d="M12 7v5l4 2"></path>
    </svg>
  )
}

// 使用 CostCategory 而非 QuoteCategory，因為編輯器使用 CostCategory
type QuoteWithCategories = Omit<StoreQuote, 'categories'> & {
  categories?: CostCategory[]
}

type QuoteWithVersions = Omit<StoreQuote, 'versions' | 'categories'> & {
  versions?: VersionRecord[]
  current_version_index?: number
  categories?: CostCategory[]
}

interface ContactInfo {
  contact_person: string
  contact_phone: string
  contact_address: string
}

interface QuoteHeaderProps {
  isSpecialTour: boolean
  isReadOnly: boolean
  relatedTour: Tour | null | undefined
  quote: QuoteWithVersions | null | undefined
  quoteName: string
  setQuoteName: (name: string) => void
  participantCounts: ParticipantCounts
  setParticipantCounts: React.Dispatch<React.SetStateAction<ParticipantCounts>>
  saveSuccess: boolean
  setIsSaveDialogOpen: (open: boolean) => void
  formatDateTime: (dateString: string) => string
  handleLoadVersion: (versionIndex: number, versionData: VersionRecord) => void
  handleSave: () => void
  handleSaveAsNewVersion: () => void
  handleFinalize: () => void
  handleCreateTour: () => void
  handleGenerateQuotation: () => void
  handleDeleteVersion: (versionIndex: number) => void
  handleCreateItinerary?: () => void
  handleSyncToItinerary?: () => void
  handleSyncAccommodationFromItinerary?: () => void
  onSwitchToQuickQuote?: () => void
  onStatusChange?: (status: 'proposed' | 'approved', showLinkDialog?: boolean) => void
  currentEditingVersion: number | null
  router: AppRouterInstance
  accommodationDays?: number
  // 聯絡資訊
  contactInfo?: ContactInfo
  onContactInfoChange?: (info: ContactInfo) => void
}

export const QuoteHeader: React.FC<QuoteHeaderProps> = ({
  isSpecialTour,
  isReadOnly,
  relatedTour,
  quote,
  quoteName,
  setQuoteName,
  participantCounts,
  setParticipantCounts,
  saveSuccess,
  setIsSaveDialogOpen,
  formatDateTime,
  handleLoadVersion,
  handleSave,
  handleSaveAsNewVersion,
  handleFinalize,
  handleCreateTour,
  handleGenerateQuotation,
  handleDeleteVersion,
  handleCreateItinerary,
  handleSyncToItinerary,
  handleSyncAccommodationFromItinerary,
  onSwitchToQuickQuote,
  onStatusChange,
  currentEditingVersion,
  router,
  accommodationDays,
  contactInfo,
  onContactInfoChange,
}) => {
  const [hoveredVersionIndex, setHoveredVersionIndex] = useState<number | null>(null)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [tempContactInfo, setTempContactInfo] = useState<ContactInfo>({
    contact_person: '',
    contact_phone: '',
    contact_address: '',
  })

  // 檢查是否有聯絡資訊
  const hasContactInfo = contactInfo && (contactInfo.contact_person || contactInfo.contact_phone || contactInfo.contact_address)

  // 打開對話框時載入現有資料
  const handleOpenContactDialog = () => {
    setTempContactInfo({
      contact_person: contactInfo?.contact_person || '',
      contact_phone: contactInfo?.contact_phone || '',
      contact_address: contactInfo?.contact_address || '',
    })
    setIsContactDialogOpen(true)
  }

  // 儲存聯絡資訊
  const handleSaveContactInfo = () => {
    onContactInfoChange?.(tempContactInfo)
    setIsContactDialogOpen(false)
  }

  return (
    <>
      {/* 特殊團鎖定警告 */}
      {isSpecialTour && (
        <div className="fixed top-18 right-0 left-16 bg-orange-50 border-b border-orange-200 z-30 px-6 py-2">
          <div className="flex items-center space-x-2 text-orange-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">此為特殊團報價單，所有欄位已鎖定無法編輯</span>
          </div>
        </div>
      )}

      {/* 標題區域 */}
      <div
        className={cn(
          'fixed top-0 right-0 left-16 h-18 bg-background border-b border-border z-40 flex items-center justify-between px-6',
          isSpecialTour && 'border-b-0'
        )}
      >
        {/* 左區：內容標題區域 - 緊湊排列 */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            onClick={() => router.push('/quotes')}
            className="p-2 hover:bg-morandi-container rounded-lg transition-colors"
            title="返回報價單列表"
          >
            <ArrowLeft size={20} className="text-morandi-secondary" />
          </button>

          {/* 顯示編號 */}
          <div className="text-sm font-mono text-morandi-secondary">
            {relatedTour ? (
              <span className="text-morandi-gold" title="旅遊團編號">
                {relatedTour.code || '-'}
              </span>
            ) : (
              <span>{quote?.code || '-'}</span>
            )}
          </div>

          <input
            type="text"
            value={quoteName}
            onChange={e => setQuoteName(e.target.value)}
            disabled={isReadOnly}
            className={cn(
              'text-lg font-bold text-morandi-primary bg-transparent border-0 focus:outline-none focus:bg-white px-2 py-1 rounded w-[180px]',
              isReadOnly && 'cursor-not-allowed opacity-60'
            )}
            placeholder="輸入團體名稱"
          />

          {/* 聯絡資訊按鈕 */}
          {onContactInfoChange && (
            <button
              onClick={handleOpenContactDialog}
              disabled={isReadOnly}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                hasContactInfo
                  ? 'bg-morandi-gold/20 text-morandi-gold hover:bg-morandi-gold/30'
                  : 'bg-morandi-container hover:bg-morandi-container/80 text-morandi-secondary',
                isReadOnly && 'cursor-not-allowed opacity-60'
              )}
              title={hasContactInfo ? '編輯聯絡資訊' : '新增聯絡資訊'}
            >
              <Contact size={16} />
            </button>
          )}
        </div>

        {/* 右區：功能區域 (原中+右合併) */}
        <div className="flex items-center gap-2">
          {/* 總人數 */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-sm text-morandi-secondary">總人數</span>
            <input
              type="text" inputMode="decimal"
              value={
                participantCounts.adult +
                participantCounts.child_with_bed +
                participantCounts.child_no_bed +
                participantCounts.child_no_bed +
                participantCounts.single_room +
                participantCounts.infant
              }
              onChange={e => {
                const total = Number(e.target.value) || 0
                // 簡化：所有人數設定為成人
                setParticipantCounts({
                  adult: total,
                  child_with_bed: 0,
                  child_no_bed: 0,
                  single_room: 0,
                  infant: 0,
                })
              }}
              disabled={isReadOnly}
              className={cn(
                'w-10 h-8 px-1 text-sm text-center bg-morandi-container rounded leading-8 focus:outline-none focus:ring-1 focus:ring-morandi-gold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                isReadOnly && 'cursor-not-allowed opacity-60'
              )}
            />
            <span className="text-sm text-morandi-secondary">人</span>
          </div>

          <div className="h-4 w-px bg-morandi-container" />

          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-sm text-[var(--morandi-secondary)]">狀態</span>
            {onStatusChange && !isReadOnly ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    'inline-flex items-center h-8 px-3 rounded text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity',
                    quote && quote.status === 'proposed'
                      ? 'bg-[var(--morandi-gold)] text-white'
                      : 'bg-[var(--morandi-green)] text-white'
                  )}
                >
                  {quote?.status === 'proposed'
                    ? '提案'
                    : quote?.status === 'approved'
                      ? '成交'
                      : quote?.status || '提案'}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => onStatusChange('proposed')}
                    className={cn(
                      'cursor-pointer',
                      quote?.status === 'proposed' && 'bg-[var(--morandi-gold)]/10'
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--morandi-gold)] mr-2" />
                    提案
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onStatusChange('approved', true)}
                    className={cn(
                      'cursor-pointer',
                      quote?.status === 'approved' && 'bg-[var(--morandi-green)]/10'
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--morandi-green)] mr-2" />
                    成交
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span
                className={cn(
                  'inline-flex items-center h-8 px-3 rounded text-sm font-medium',
                  quote && quote.status === 'proposed'
                    ? 'bg-[var(--morandi-gold)] text-white'
                    : 'bg-[var(--morandi-green)] text-white'
                )}
              >
                {quote?.status === 'proposed'
                  ? '提案'
                  : quote?.status === 'approved'
                    ? '成交'
                    : quote?.status || '提案'}
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-morandi-container" />

          {/* 儲存 - SVG only */}
          <Button
            onClick={() => handleSave()}
            disabled={isReadOnly}
            title="儲存"
            className={cn(
              'h-8 w-8 p-0 transition-all duration-200',
              saveSuccess
                ? 'bg-[var(--morandi-green)] hover:bg-[var(--morandi-green)] text-white'
                : 'bg-[var(--morandi-green)] hover:bg-[var(--morandi-green-hover)] text-white',
              isReadOnly && 'cursor-not-allowed opacity-60'
            )}
          >
            <Save size={16} />
          </Button>

          {/* 另存 - SVG + 文字 */}
          <Button
            onClick={() => setIsSaveDialogOpen(true)}
            disabled={isReadOnly}
            variant="outline"
            title="另存新版本"
            className={cn(
              'h-8 px-2.5 text-sm gap-1',
              isReadOnly && 'cursor-not-allowed opacity-60'
            )}
          >
            <FilePlus size={14} />
            另存
          </Button>

          {/* 版本 - SVG + 文字 */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-8 px-2.5 text-sm border border-[var(--morandi-container)] text-[var(--morandi-secondary)] hover:bg-[var(--morandi-container)] rounded-md flex items-center gap-1"
            >
              <HistoryIcon size={14} />
              版本
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <div className="px-2 py-1 text-sm font-medium text-morandi-primary border-b border-border">
                版本歷史
              </div>

              {/* 歷史版本：所有版本都在 versions[] 陣列中 */}
              {quote?.versions && quote.versions.length > 0 ? (
                <>
                  {quote.versions
                    .map((version: VersionRecord, originalIndex: number) => ({ version, originalIndex }))
                    .sort((a, b) => b.version.version - a.version.version)
                    .map(({ version, originalIndex }) => {
                      const isCurrentEditing = currentEditingVersion === originalIndex ||
                        (currentEditingVersion === null && quote.current_version_index === originalIndex)
                      return (
                        <DropdownMenuItem
                          key={version.id}
                          className="flex items-center justify-between py-2 cursor-pointer hover:bg-morandi-container/30 relative"
                          onMouseEnter={() => setHoveredVersionIndex(originalIndex)}
                          onMouseLeave={() => setHoveredVersionIndex(null)}
                          onClick={() => handleLoadVersion(originalIndex, version)}
                        >
                          <div className="flex flex-col flex-1">
                            <span className="font-medium">
                              {stripHtml(version.name) || `版本 ${version.version}`}
                            </span>
                            <span className="text-xs text-morandi-secondary">
                              {formatDateTime(version.created_at)}
                              {version.note && ` - ${version.note}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-morandi-secondary">
                              NT$ {version.total_cost.toLocaleString()}
                            </div>
                            {isCurrentEditing && (
                              <div className="text-xs bg-morandi-gold text-white px-2 py-1 rounded">當前</div>
                            )}
                            {!isReadOnly && hoveredVersionIndex === originalIndex && (
                              <button
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation()
                                  handleDeleteVersion(originalIndex)
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
                </>
              ) : (
                <div className="px-2 py-3 text-sm text-morandi-secondary text-center">
                  尚無版本，點擊「儲存」創建第一個版本
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 行程表 - SVG + 文字 */}
          {handleCreateItinerary && (
            <Button
              onClick={handleCreateItinerary}
              variant="outline"
              title="建立行程表"
              className="h-8 px-2.5 text-sm gap-1"
            >
              <Map size={14} />
              行程表
            </Button>
          )}

          {/* 同步按鈕 - 只有當報價單已連結行程表時才顯示 */}
          {quote?.itinerary_id && (handleSyncToItinerary || handleSyncAccommodationFromItinerary) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  title="同步資料"
                  className="h-8 px-2.5 text-sm gap-1 border-[var(--morandi-gold)] text-[var(--morandi-gold)] hover:bg-[var(--morandi-gold)] hover:text-white"
                >
                  <RefreshCw size={14} />
                  同步
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {handleSyncAccommodationFromItinerary && (
                  <DropdownMenuItem onClick={handleSyncAccommodationFromItinerary}>
                    從行程同步住宿
                  </DropdownMenuItem>
                )}
                {handleSyncToItinerary && (
                  <DropdownMenuItem onClick={handleSyncToItinerary}>
                    同步餐飲到行程表
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 切換 - SVG + 文字 */}
          {onSwitchToQuickQuote && (
            <Button
              onClick={onSwitchToQuickQuote}
              variant="outline"
              title="切換到快速報價單"
              className="h-8 px-2.5 text-sm gap-1"
            >
              <ArrowLeftRight size={14} />
              切換
            </Button>
          )}

          {/* 前往旅遊團 - 只有已核准且有關聯旅遊團時顯示 */}
          {quote && quote.status === 'approved' && relatedTour && (
            <Button
              onClick={() => router.push(`/tours?highlight=${relatedTour.id}`)}
              className="h-8 px-2.5 text-sm gap-1 bg-[var(--morandi-gold)] hover:bg-[var(--morandi-gold-hover)] text-white"
            >
              <Plane size={14} />
              旅遊團
            </Button>
          )}
        </div>
      </div>

      {/* 聯絡資訊對話框 */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Contact size={20} className="text-morandi-gold" />
              客戶聯絡資訊
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary block mb-1">
                聯絡人
              </label>
              <input
                type="text"
                value={tempContactInfo.contact_person}
                onChange={e => setTempContactInfo(prev => ({ ...prev, contact_person: e.target.value }))}
                placeholder="請輸入聯絡人姓名"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary block mb-1">
                聯絡電話
              </label>
              <input
                type="text"
                value={tempContactInfo.contact_phone}
                onChange={e => setTempContactInfo(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="請輸入聯絡電話"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary block mb-1">
                通訊地址
              </label>
              <input
                type="text"
                value={tempContactInfo.contact_address}
                onChange={e => setTempContactInfo(prev => ({ ...prev, contact_address: e.target.value }))}
                placeholder="請輸入通訊地址"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-morandi-gold/50"
              />
            </div>

            <div className="text-xs text-morandi-secondary bg-morandi-container/30 p-3 rounded-lg">
              提示：此資訊會用於合約和信封列印，切換快速報價時也會自動帶入
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveContactInfo} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white">
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
