'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { History, ChevronDown, Trash2, X, Save } from 'lucide-react'
import { QuoteVersion } from '@/stores/types'
import { confirm } from '@/lib/ui/alert-dialog'
import { stripHtml } from '@/lib/utils/string-utils'
import { DateCell, CurrencyCell } from '@/components/table-cells'
import { QUICK_QUOTE_DETAIL_LABELS, QUICK_QUOTE_VERSION_PANEL_LABELS } from '../../constants/labels';
import { QUOTE_COMPONENT_LABELS } from '../../constants/labels'

interface QuickQuoteVersionPanelProps {
  versions: QuoteVersion[]
  currentEditingVersion: number | null
  isEditing: boolean
  hoveredVersionIndex: number | null
  onSetHoveredVersionIndex: (index: number | null) => void
  onLoadVersion: (index: number) => void
  onDeleteVersion: (index: number) => Promise<void>
  // 另存新版本對話框
  isSaveVersionDialogOpen: boolean
  onSetSaveVersionDialogOpen: (open: boolean) => void
  versionName: string
  onSetVersionName: (name: string) => void
  isSaving: boolean
  onSaveAsNewVersion: () => Promise<void>
}

export const QuickQuoteVersionPanel: React.FC<QuickQuoteVersionPanelProps> = ({
  versions,
  currentEditingVersion,
  isEditing,
  hoveredVersionIndex,
  onSetHoveredVersionIndex,
  onLoadVersion,
  onDeleteVersion,
  isSaveVersionDialogOpen,
  onSetSaveVersionDialogOpen,
  versionName,
  onSetVersionName,
  isSaving,
  onSaveAsNewVersion,
}) => {
  const handleDeleteVersion = async (versionIndex: number) => {
    if (versions.length <= 1) {
      return
    }

    const confirmed = await confirm(
      `確定要刪除「${stripHtml(versions[versionIndex].name) || `版本 ${versions[versionIndex].version}`}」嗎？`,
      {
        title: QUICK_QUOTE_VERSION_PANEL_LABELS.刪除版本,
        type: 'warning',
      }
    )
    if (!confirmed) {
      return
    }

    await onDeleteVersion(versionIndex)
  }

  return (
    <>
      {/* 版本歷史下拉選單 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <History className="h-4 w-4" />
            {QUICK_QUOTE_VERSION_PANEL_LABELS.LABEL_3328}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72" align="end">
          <div className="px-2 py-1.5 text-sm font-medium text-morandi-primary border-b border-border">
            {QUICK_QUOTE_VERSION_PANEL_LABELS.LABEL_3328}
          </div>
          {versions && versions.length > 0 ? (
            <>
              {[...versions]
                .sort((a, b) => b.version - a.version)
                .map((version, sortedIndex) => {
                  const originalIndex = versions.findIndex(v => v.id === version.id)
                  const isCurrentEditing = currentEditingVersion === originalIndex
                  return (
                    <DropdownMenuItem
                      key={version.id || sortedIndex}
                      className="flex items-center justify-between py-2 cursor-pointer hover:bg-morandi-container/30 relative"
                      onMouseEnter={() => onSetHoveredVersionIndex(originalIndex)}
                      onMouseLeave={() => onSetHoveredVersionIndex(null)}
                      onClick={() => onLoadVersion(originalIndex)}
                    >
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">
                          {stripHtml(version.version_name) || `版本 ${version.version}`}
                        </span>
                        <DateCell
                          date={version.created_at}
                          format="time"
                          showIcon={false}
                          className="text-xs text-morandi-secondary"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <CurrencyCell
                          amount={version.total_amount || 0}
                          className="text-xs text-morandi-secondary"
                        />
                        {isCurrentEditing && (
                          <div className="text-xs bg-morandi-gold text-white px-2 py-0.5 rounded">{QUICK_QUOTE_VERSION_PANEL_LABELS.LABEL_6211}</div>
                        )}
                        {isEditing && hoveredVersionIndex === originalIndex && versions.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteVersion(originalIndex)
                            }}
                            className="p-1 hover:bg-status-danger-bg rounded transition-colors"
                            title={QUICK_QUOTE_VERSION_PANEL_LABELS.刪除版本}
                          >
                            <Trash2 className="h-4 w-4 text-status-danger" />
                          </button>
                        )}
                      </div>
                    </DropdownMenuItem>
                  )
                })}
            </>
          ) : (
            <div className="px-2 py-3 text-sm text-morandi-secondary text-center">
              {QUICK_QUOTE_VERSION_PANEL_LABELS.EDIT_4620}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 另存新版本對話框 */}
      <Dialog open={isSaveVersionDialogOpen} onOpenChange={onSetSaveVersionDialogOpen}>
        <DialogContent level={1}>
          <DialogHeader>
            <DialogTitle>{QUICK_QUOTE_VERSION_PANEL_LABELS.LABEL_6621}</DialogTitle>
            <DialogDescription>
              {QUICK_QUOTE_VERSION_PANEL_LABELS.PLEASE_ENTER_793}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={QUICK_QUOTE_VERSION_PANEL_LABELS.版本名稱}
              value={versionName}
              onChange={(e) => onSetVersionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  onSaveAsNewVersion()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="gap-2" onClick={() => onSetSaveVersionDialogOpen(false)}>
              <X size={16} />
              {QUICK_QUOTE_VERSION_PANEL_LABELS.CANCEL}
            </Button>
            <Button
              onClick={onSaveAsNewVersion}
              disabled={isSaving || !versionName.trim()}
              className="bg-morandi-gold hover:bg-morandi-gold-hover"
            >
              {isSaving ? QUICK_QUOTE_DETAIL_LABELS.儲存中 : QUICK_QUOTE_DETAIL_LABELS.儲存}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
