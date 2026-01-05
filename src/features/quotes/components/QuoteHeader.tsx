'use client'

import React, { useState } from 'react'
import { ArrowLeft, Save, Trash2, Map, Plane, Contact, X } from 'lucide-react'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ParticipantCounts, VersionRecord, CostCategory } from '../types'
import { QuoteConfirmationSection } from './QuoteConfirmationSection'
import type { QuoteConfirmationStatus } from '@/types/quote.types'
import { stripHtml } from '@/lib/utils/string-utils'
import type { Quote as StoreQuote } from '@/stores/types'
import { Tour } from '@/types/tour.types'
import { DocumentVersionPicker } from '@/components/documents'

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
  // 確認相關欄位
  confirmation_status?: QuoteConfirmationStatus
  confirmation_token?: string
  confirmation_token_expires_at?: string
  confirmed_at?: string
  confirmed_by_type?: 'customer' | 'staff'
  confirmed_by_name?: string
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
  onStatusChange?: (status: 'proposed' | 'approved', showLinkDialog?: boolean) => void
  currentEditingVersion: number | null
  router: AppRouterInstance
  accommodationDays?: number
  // 聯絡資訊
  contactInfo?: ContactInfo
  onContactInfoChange?: (info: ContactInfo) => void
  // 確認相關
  staffId?: string
  staffName?: string
  onConfirmationStatusChange?: (status: QuoteConfirmationStatus) => void
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
  onStatusChange,
  currentEditingVersion,
  router,
  accommodationDays,
  contactInfo,
  onContactInfoChange,
  staffId,
  staffName,
  onConfirmationStatusChange,
}) => {
  const [hoveredVersionIndex, setHoveredVersionIndex] = useState<number | null>(null)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [isVersionPickerOpen, setIsVersionPickerOpen] = useState(false)
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
        <div className="fixed top-18 right-0 left-16 bg-status-warning-bg border-b border-status-warning/30 z-30 px-6 py-2">
          <div className="flex items-center space-x-2 text-status-warning">
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
            onClick={() => {
              if (relatedTour) {
                router.push(`/tours?highlight=${relatedTour.id}`)
              } else {
                router.back()
              }
            }}
            className="p-2 hover:bg-morandi-container rounded-lg transition-colors"
            title={relatedTour ? '返回旅遊團' : '返回'}
          >
            <ArrowLeft size={20} className="text-morandi-secondary" />
          </button>

          {/* 顯示旅遊團編號（如果有關聯） */}
          {relatedTour && (
            <div className="text-sm font-mono text-morandi-secondary">
              <span className="text-morandi-gold" title="旅遊團編號">
                {relatedTour.code || '-'}
              </span>
            </div>
          )}

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

          {/* 報價確認 */}
          {quote && staffId && staffName && (
            <QuoteConfirmationSection
              quoteId={quote.id}
              confirmationStatus={quote.confirmation_status}
              confirmationToken={quote.confirmation_token}
              confirmationTokenExpiresAt={quote.confirmation_token_expires_at}
              confirmedAt={quote.confirmed_at}
              confirmedByType={quote.confirmed_by_type}
              confirmedByName={quote.confirmed_by_name}
              staffId={staffId}
              staffName={staffName}
              onConfirmationStatusChange={onConfirmationStatusChange}
              isReadOnly={isReadOnly}
            />
          )}

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

          {/* 版本 - 開啟報價單管理對話框 */}
          {relatedTour && (
            <Button
              onClick={() => setIsVersionPickerOpen(true)}
              variant="outline"
              title="報價單管理"
              className="h-8 px-2.5 text-sm gap-1"
            >
              <HistoryIcon size={14} />
              版本
            </Button>
          )}

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
            <Button variant="outline" className="gap-2" onClick={() => setIsContactDialogOpen(false)}>
              <X size={16} />
              取消
            </Button>
            <Button onClick={handleSaveContactInfo} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2">
              <Save size={16} />
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 報價單管理對話框 */}
      {relatedTour && (
        <DocumentVersionPicker
          isOpen={isVersionPickerOpen}
          onClose={() => setIsVersionPickerOpen(false)}
          tour={relatedTour as Tour & { id: string; code: string }}
          currentQuoteId={quote?.id}
        />
      )}
    </>
  )
}
